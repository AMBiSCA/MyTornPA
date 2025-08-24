const db = firebase.firestore();
const auth = firebase.auth();

// Global variables needed for this page
let userApiKey = null;
let factionApiFullData = null;
let globalYourFactionID = null;
const memberProfileCache = {};

// --- CORE UI FUNCTIONS ---

/**
 * Main function to fetch all data and render the entire page.
 * It populates the roster on the right and the summary/forms on the left.
 */
async function displayWarRoster() {
    const rosterDisplay = document.getElementById('war-roster-display');
    if (!rosterDisplay) return;

    rosterDisplay.innerHTML = '<p>Loading team roster...</p>';

    try {
        // Fetch all availability data for the faction
        const availabilitySnapshot = await db.collection('factionWars').doc('currentWar').collection('availability').get();
        const availabilityData = {};
        availabilitySnapshot.forEach(doc => {
            availabilityData[doc.id] = doc.data();
        });

        // Ensure we have faction member data loaded
        if (!factionApiFullData || !factionApiFullData.members) {
            rosterDisplay.innerHTML = '<p style="color: red;">Faction member list not available.</p>';
            return;
        }
        const allMembers = Object.values(factionApiFullData.members);
        rosterDisplay.innerHTML = ''; // Clear loading message

        // Initialize counters for the summary panel
        let summaryCounts = {
            day1: { yes: 0, partial: 0, no: 0 },
            day2: { yes: 0, partial: 0, no: 0 },
            day3: { yes: 0, partial: 0, no: 0 },
            roles: { 'all-round-attacker': 0, 'chain-watcher': 0, 'outside-attacker': 0 },
            atStart: 0
        };

        // Create HTML for each member in the roster
        for (const member of allMembers) {
            const memberId = String(member.id);
            const memberName = member.name;
            const memberAvailability = availabilityData[memberId];

            let statusClass = 'status-grey';
            let statusTextHtml = '<span class="status-text-grey">(No response yet)</span>';

            if (memberAvailability) {
                const summaryParts = [];
                let hasSaidNo = false, hasSaidPartial = false, hasSaidYes = false;

                // Process availability for Day 1, 2, and 3
                for (let i = 1; i <= 3; i++) {
                    const dayData = memberAvailability[`day_${i}`];
                    if (dayData && dayData.status !== 'no-response') {
                        summaryCounts[`day${i}`][dayData.status]++;
                        if (i === 1) { // Only Day 1 contributes to role/start counts
                            if (dayData.role && dayData.role !== 'none') summaryCounts.roles[dayData.role]++;
                            if (dayData.isAvailableForStart) summaryCounts.atStart++;
                        }
                        
                        let dayStatusText = `D${i}: `;
                        let dayStatusClass = '';
                        switch (dayData.status) {
                            case 'yes': dayStatusText += `Yes (${dayData.timeRange || 'All Day'})`; dayStatusClass = 'status-text-green'; hasSaidYes = true; break;
                            case 'partial': dayStatusText += `Partial (${dayData.timeRange || 'N/A'})`; dayStatusClass = 'status-text-orange'; hasSaidPartial = true; break;
                            case 'no': dayStatusText += `No (${dayData.reason || 'No reason'})`; dayStatusClass = 'status-text-red'; hasSaidNo = true; break;
                        }
                        summaryParts.push(`<span class="${dayStatusClass}">${dayStatusText}</span>`);
                    }
                }
                
                if (summaryParts.length > 0) {
                    statusTextHtml = summaryParts.join(' | ');
                    if (hasSaidNo) statusClass = 'status-red';
                    else if (hasSaidPartial) statusClass = 'status-orange';
                    else if (hasSaidYes) statusClass = 'status-green';
                }
            }
            
            // Basic profile image handling
            const profileImageUrl = memberProfileCache[memberId]?.profile_image || DEFAULT_PROFILE_ICONS[0];

            const playerHtml = `
                <div class="roster-player ${statusClass}" data-member-id="${memberId}">
                    <img src="${profileImageUrl}" alt="${memberName}'s profile pic" class="roster-player-pic">
                    <div class="roster-player-info">
                        <span class="player-name">${memberName}</span>
                        <span class="player-status">${statusTextHtml}</span>
                    </div>
                </div>`;
            rosterDisplay.insertAdjacentHTML('beforeend', playerHtml);
        }

        // After processing all members, display the summary panel
        await showFactionSummary(summaryCounts);
        
    } catch (error) {
        console.error("Error displaying war roster:", error);
        rosterDisplay.innerHTML = '<p style="color: red;">Error loading roster.</p>';
    }
}


/**
 * Populates the left panel with the summary of availability responses
 * and the leader control buttons.
 * @param {object} summaryCounts - An object with counts of yes/partial/no responses.
 */
async function showFactionSummary(summaryCounts) {
    const formsContainer = document.getElementById('availability-forms-container');
    if (!formsContainer) return;

    let isAdmin = false;
    let adminDisplayStyle = 'display: none;';
    const user = auth.currentUser;

    if (user) {
        try {
            const userProfileDoc = await db.collection('userProfiles').doc(user.uid).get();
            const userProfile = userProfileDoc.exists ? userProfileDoc.data() : {};
            const userPosition = userProfile.position ? userProfile.position.toLowerCase() : '';
            const userTornId = userProfile.tornProfileId || '';

            const warDoc = await db.collection('factionWars').doc('currentWar').get();
            const tab4Admins = warDoc.exists ? warDoc.data().tab4Admins || [] : [];
            
            if (userPosition === 'leader' || userPosition === 'co-leader' || tab4Admins.includes(userTornId)) {
                isAdmin = true;
                adminDisplayStyle = 'display: block;';
            }
        } catch (error) {
            console.error("Error checking admin status:", error);
        }
    }

    const summaryHtml = `
        <div class="faction-summary-panel">
            <h4>Daily Readiness Summary</h4>
            <div class="summary-grid">
                <div class="summary-col">
                    <strong>Day 1</strong>
                    <p>✅ Available: ${summaryCounts.day1.yes}</p><p>🟧 Partially: ${summaryCounts.day1.partial}</p><p>❌ Unavailable: ${summaryCounts.day1.no}</p>
                </div>
                <div class="summary-col">
                    <strong>Day 2</strong>
                    <p>✅ Available: ${summaryCounts.day2.yes}</p><p>🟧 Partially: ${summaryCounts.day2.partial}</p><p>❌ Unavailable: ${summaryCounts.day2.no}</p>
                </div>
                <div class="summary-col">
                    <strong>Day 3</strong>
                    <p>✅ Available: ${summaryCounts.day3.yes}</p><p>🟧 Partially: ${summaryCounts.day3.partial}</p><p>❌ Unavailable: ${summaryCounts.day3.no}</p>
                </div>
            </div>
            <div class="summary-footer">
                <p><strong>Primary Roles:</strong> All Rounder: <strong>${summaryCounts.roles['all-round-attacker']}</strong> / Chain Watcher: <strong>${summaryCounts.roles['chain-watcher']}</strong> / Outside Hitter: <strong>${summaryCounts.roles['outside-attacker']}</strong></p>
                <hr>
                <p><strong>Available at War Start:</strong> ${summaryCounts.atStart}</p>
            </div>
            <div class="summary-edit-buttons">
                <button class="action-btn edit-day-btn" data-day-to-edit="1">Edit Day 1</button>
                <button class="action-btn edit-day-btn" data-day-to-edit="2">Edit Day 2</button>
                <button class="action-btn edit-day-btn" data-day-to-edit="3">Edit Day 3</button>
            </div>

            <div id="availability-admin-controls" style="${adminDisplayStyle}">
                <hr>
                <h4>Leader Controls</h4>
                <div class="summary-edit-buttons leader-controls-row">
                    <button id="reset-availability-btn" class="action-btn">Reset All</button>
                    <button id="notify-members-btn" class="action-btn">Send Reminders</button>
                    <button id="send-availability-report-btn" class="action-btn">Send Availability</button> 
                    <div id="discordWebhookUnifiedControl" class="action-btn discord-webhook-unified-control">
                        <span id="discordWebhookStatusText">Set Webhook</span>
                    </div>
                </div>
                <div id="reminder-list-container"></div>
            </div>
        </div>
        
        <div id="discordWebhookModalOverlay" class="webhook-modal-overlay" style="display: none;">
            <div id="discordWebhookEditArea" class="webhook-edit-area">
                <div class="modal-header"><h4>Configure Discord Webhook</h4></div>
                <div class="modal-body">
                    <label for="discordWebhookUrlInput">Webhook URL:</label>
                    <input type="text" id="discordWebhookUrlInput" placeholder="Paste Discord Webhook URL here" class="webhook-input">
                </div>
                <div class="modal-footer">
                    <button id="removeDiscordWebhookBtn" class="action-btn small-btn remove">Remove</button>
                    <button id="saveDiscordWebhookBtn" class="action-btn small-btn">Save</button>
                    <button id="cancelDiscordWebhookBtn" class="action-btn small-btn cancel">Cancel</button>
                </div>
            </div>
        </div>
    `;

    formsContainer.innerHTML = summaryHtml;
    
    if (isAdmin) {
        setupDiscordWebhookControls();
    }
}

/**
 * Replaces the summary view with a form for editing a specific day's availability.
 * @param {number} dayNumber - The day to show the form for (1, 2, or 3).
 */
function showDayForm(dayNumber) {
    const formsContainer = document.getElementById('availability-forms-container');
    if (formsContainer) {
        formsContainer.innerHTML = generateDayFormHTML(dayNumber);
    }
}


// --- HELPER & UTILITY FUNCTIONS ---

/**
 * Generates the HTML string for an availability form for a given day.
 * @param {number} dayNumber - The day number (1, 2, or 3).
 * @returns {string} The HTML content for the form.
 */
function generateDayFormHTML(dayNumber) {
    return `
        <div class="availability-day-form" data-day="${dayNumber}">
            <h5>--- Edit Day ${dayNumber} ---</h5>
            <div class="form-group">
                <label for="status-day-${dayNumber}">Will you be available?</label>
                <select id="status-day-${dayNumber}" class="availability-status">
                    <option value="no-response" selected>-- Select --</option>
                    <option value="yes">YES</option>
                    <option value="partial">Partially</option>
                    <option value="no">NO</option>
                </select>
            </div>
            <div class="time-details" style="display: none;">
                <div class="form-group"><label for="time-from-day-${dayNumber}">Time Range:</label><input type="text" id="time-from-day-${dayNumber}" placeholder="e.g., 2pm - 7pm"></div>
            </div>
            <div class="reason-details" style="display: none;">
                <div class="form-group"><label for="reason-day-${dayNumber}">Reason:</label><input type="text" id="reason-day-${dayNumber}" placeholder="e.g., Sickness, Work"></div>
            </div>
            <div class="form-group">
                <label for="role-day-${dayNumber}">Primary Role:</label>
                <select id="role-day-${dayNumber}">
                    <option value="none">-- Select Role --</option>
                    <option value="all-round-attacker">All Round Attacker</option>
                    <option value="chain-watcher">Chain Watcher</option>
                    <option value="outside-attacker">Outside Attacker</option>
                </select>
            </div>
            <div class="form-group checkbox-group">
                <input type="checkbox" id="war-start-day-${dayNumber}"><label for="war-start-day-${dayNumber}">Available for war start?</label>
            </div>
            <button class="action-btn">Update Day ${dayNumber}</button>
        </div>
    `;
}

/**
 * Custom alert dialog.
 */
function showCustomAlert(message, title = "Alert") {
    alert(`[${title}] \n${message}`);
}

/**
 * Custom confirm dialog that returns a Promise.
 */
function showCustomConfirm(message, title = "Confirm") {
    return new Promise((resolve) => {
        const confirmed = confirm(`[${title}] \n${message}`);
        resolve(confirmed);
    });
}


// --- LEADER CONTROL FUNCTIONS ---

/**
 * Sends a reminder notification via a backend function to users who haven't responded.
 */
async function sendReminderNotifications() {
    const reminderListContainer = document.getElementById('reminder-list-container');
    if (!reminderListContainer) return;
    reminderListContainer.innerHTML = '<p>Preparing notifications...</p>';

    try {
        const availabilitySnapshot = await db.collection('factionWars').doc('currentWar').collection('availability').get();
        const respondedUserIds = new Set(availabilitySnapshot.docs.map(doc => doc.id));

        if (!factionApiFullData || !factionApiFullData.members) throw new Error("Faction member list is not available.");
        const nonRespondersDetails = Object.values(factionApiFullData.members)
            .filter(member => !respondedUserIds.has(String(member.id)))
            .map(member => ({ id: String(member.id), name: member.name }));

        if (nonRespondersDetails.length === 0) {
            reminderListContainer.innerHTML = '<p style="color: #4CAF50;">Everyone has responded!</p>';
            return;
        }

        const warDoc = await db.collection('factionWars').doc('currentWar').get();
        const discordWebhookUrl = warDoc.exists ? warDoc.data().discordWebhookUrl : null;

        if (!discordWebhookUrl) {
            reminderListContainer.innerHTML = '<p style="color: red;">Error: Discord Webhook URL is not configured.</p>';
            return;
        }

        // This assumes you have a backend function at this endpoint
        const backendWebhookEndpoint = '/.netlify/functions/send-availability-webhook'; 
        const response = await fetch(backendWebhookEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                discordWebhookUrl: discordWebhookUrl,
                nonResponders: nonRespondersDetails,
                reminderMessage: "A friendly reminder to set your war availability!",
                factionName: factionApiFullData.basic.name,
                factionId: globalYourFactionID
            })
        });

        if (!response.ok) throw new Error('Backend function failed.');

        reminderListContainer.innerHTML = `<p style="color: #4CAF50;">Reminders sent to ${nonRespondersDetails.length} members!</p>`;
    } catch (error) {
        console.error("Error sending reminders:", error);
        reminderListContainer.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
    }
}


/**
 * Generates and sends a full availability report to the configured Discord webhook.
 */
async function sendAvailabilityReport() {
    try {
        const warDoc = await db.collection('factionWars').doc('currentWar').get();
        const discordWebhookUrl = warDoc.exists ? warDoc.data().discordWebhookUrl : null;
        if (!discordWebhookUrl) {
            showCustomAlert("Discord Webhook URL is not configured.", "Webhook Missing");
            throw new Error("Discord Webhook URL not set.");
        }

        const availabilitySnapshot = await db.collection('factionWars').doc('currentWar').collection('availability').get();
        const availabilityData = {};
        availabilitySnapshot.forEach(doc => { availabilityData[doc.id] = doc.data(); });

        if (!factionApiFullData || !factionApiFullData.members) throw new Error("Faction member list is not available.");
        const allMembers = Object.values(factionApiFullData.members);

        const report = { day1: { yes: [], partial: [], no: [], noResponse: [] }, day2: { yes: [], partial: [], no: [], noResponse: [] }, day3: { yes: [], partial: [], no: [], noResponse: [] } };
        allMembers.forEach(member => {
            const memberAvailability = availabilityData[String(member.id)];
            if (memberAvailability) {
                for (let i = 1; i <= 3; i++) {
                    const dayData = memberAvailability[`day_${i}`];
                    if (dayData && dayData.status !== 'no-response') report[`day${i}`][dayData.status].push(member.name);
                    else report[`day${i}`].noResponse.push(member.name);
                }
            } else {
                ['day1', 'day2', 'day3'].forEach(day => report[day].noResponse.push(member.name));
            }
        });

        let reportString = `**War Availability Report for ${factionApiFullData.basic.name}**\n-----------------------------------\n`;
        for (let i = 1; i <= 3; i++) {
            const dayReport = report[`day${i}`];
            reportString += `\n**DAY ${i} SUMMARY**\n`;
            reportString += `✅ **Available (${dayReport.yes.length}):** ${dayReport.yes.join(', ') || 'None'}\n`;
            reportString += `🟧 **Partially (${dayReport.partial.length}):** ${dayReport.partial.join(', ') || 'None'}\n`;
            reportString += `❌ **Unavailable (${dayReport.no.length}):** ${dayReport.no.join(', ') || 'None'}\n`;
            reportString += `❔ **No Response (${dayReport.noResponse.length}):** ${dayReport.noResponse.join(', ') || 'None'}\n`;
        }
        reportString += "\n-----------------------------------\nReport generated by MyTornPA.";
        
        const backendWebhookEndpoint = '/.netlify/functions/send-availability-webhook';
        const response = await fetch(backendWebhookEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                discordWebhookUrl: discordWebhookUrl,
                reminderMessage: reportString,
                nonResponders: []
            })
        });

        if (!response.ok) throw new Error('Backend function failed.');
    } catch (error) {
        console.error("Error sending report:", error);
        throw error;
    }
}


/**
 * Deletes all availability records from the database for the current war.
 */
async function resetAllAvailability() {
    const availabilityCollectionRef = db.collection('factionWars').doc('currentWar').collection('availability');
    try {
        const snapshot = await availabilityCollectionRef.get();
        if (snapshot.empty) {
            showCustomAlert("No records to reset.", "Reset Complete");
            return;
        }
        const deletePromises = snapshot.docs.map(doc => availabilityCollectionRef.doc(doc.id).delete());
        await Promise.all(deletePromises);
        showCustomAlert("All availability data has been reset!", "Reset Complete");
        await displayWarRoster(); // Refresh UI
    } catch (error) {
        console.error("Error resetting availability:", error);
        showCustomAlert(`Failed to reset data: ${error.message}`, "Reset Failed");
        throw error;
    }
}


/**
 * Sets up the controls for the Discord webhook URL, including the modal.
 */
async function setupDiscordWebhookControls() {
    const unifiedControl = document.getElementById('discordWebhookUnifiedControl'); 
    const statusText = document.getElementById('discordWebhookStatusText');     
    const webhookInput = document.getElementById('discordWebhookUrlInput');    
    const saveBtn = document.getElementById('saveDiscordWebhookBtn');          
    const cancelBtn = document.getElementById('cancelDiscordWebhookBtn');      
    const removeBtn = document.getElementById('removeDiscordWebhookBtn');
    const modalOverlay = document.getElementById('discordWebhookModalOverlay');

    if (!unifiedControl) return;

    let currentSavedWebhookUrl = null; 

    function setDisplayMode(isEditMode) {
        modalOverlay.style.display = isEditMode ? 'flex' : 'none';
        if(isEditMode) webhookInput.value = currentSavedWebhookUrl || '';
        
        if (currentSavedWebhookUrl) {
            statusText.textContent = "Edit Webhook";
            unifiedControl.classList.add('configured-status');
            unifiedControl.classList.remove('not-set-status');
        } else {
            statusText.textContent = "Set Webhook";
            unifiedControl.classList.add('not-set-status');
            unifiedControl.classList.remove('configured-status');
        }
    }

    try {
        const warDoc = await db.collection('factionWars').doc('currentWar').get();
        if (warDoc.exists && warDoc.data().discordWebhookUrl) {
            currentSavedWebhookUrl = warDoc.data().discordWebhookUrl;
        }
    } catch (error) {
        console.error("Error fetching Discord Webhook URL:", error);
    }

    setDisplayMode(false);

    unifiedControl.addEventListener('click', () => setDisplayMode(true));
    cancelBtn.addEventListener('click', () => setDisplayMode(false));

    saveBtn.addEventListener('click', async () => {
        const newUrl = webhookInput.value.trim();
        if (newUrl === "" || !newUrl.startsWith("https://discord.com/api/webhooks/")) {
            showCustomAlert("Invalid Discord Webhook URL.", "Validation Error");
            return;
        }
        try {
            await db.collection('factionWars').doc('currentWar').set({ discordWebhookUrl: newUrl }, { merge: true });
            currentSavedWebhookUrl = newUrl;
        } catch (error) {
            console.error("Error saving webhook:", error);
        } finally {
            setDisplayMode(false);
        }
    });

    removeBtn.addEventListener('click', async () => {
        if (confirm("Are you sure you want to remove the webhook?")) {
            try {
                await db.collection('factionWars').doc('currentWar').set({ discordWebhookUrl: null }, { merge: true });
                currentSavedWebhookUrl = null;
            } catch (error) {
                console.error("Error removing webhook:", error);
            } finally {
                setDisplayMode(false);
            }
        }
    });
}

// --- INITIALIZATION & EVENT LISTENERS ---

document.addEventListener('DOMContentLoaded', () => {
    
    // Main event listener for the entire container
    const container = document.getElementById('warAvailabilityContainer');
    if (container) {
        container.addEventListener('click', async (event) => {
            const button = event.target.closest('.action-btn, .availability-status');
            if (!button) return;

            // Handle dropdown changes for showing/hiding form sections
            if (button.classList.contains('availability-status')) {
                const dayForm = button.closest('.availability-day-form');
                const timeDetails = dayForm.querySelector('.time-details');
                const reasonDetails = dayForm.querySelector('.reason-details');
                timeDetails.style.display = (button.value === 'yes' || button.value === 'partial') ? 'block' : 'none';
                reasonDetails.style.display = button.value === 'no' ? 'block' : 'none';
                return;
            }

            // Handle "Update Day X" buttons inside the form
            if (button.textContent.includes('Update Day')) {
                event.preventDefault();
                const dayForm = button.closest('.availability-day-form');
                const dayNumber = parseInt(dayForm.dataset.day, 10);
                const user = auth.currentUser;
                if (!user) return showCustomAlert("You must be logged in.");

                const status = dayForm.querySelector('.availability-status').value;
                const reason = dayForm.querySelector('input[id^="reason-day-"]').value.trim();
                if (status === 'no' && reason === '') return showCustomAlert("Please provide a reason.", "Reason Required");

                button.textContent = "Saving..."; button.disabled = true;

                const availabilityData = {
                    status: status,
                    reason: reason,
                    timeRange: dayForm.querySelector('input[id^="time-from-day-"]').value.trim(),
                    role: dayForm.querySelector('select[id^="role-day-"]').value,
                    isAvailableForStart: dayForm.querySelector('input[id^="war-start-day-"]').checked,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                };

                try {
                    const userProfileDoc = await db.collection('userProfiles').doc(user.uid).get();
                    const tornUserId = userProfileDoc.data().tornProfileId;
                    const availabilityDocRef = db.collection('factionWars').doc('currentWar').collection('availability').doc(tornUserId);
                    await availabilityDocRef.set({ [`day_${dayNumber}`]: availabilityData }, { merge: true });
                    await displayWarRoster(); // Refresh the whole UI
                } catch (error) {
                    console.error("Error saving availability:", error);
                    showCustomAlert(`Failed to save: ${error.message}`, "Save Error");
                    await displayWarRoster(); // Still refresh UI on error to show original state
                }
            }

            // Handle "Edit Day X" buttons in the summary view
            if (button.classList.contains('edit-day-btn')) {
                showDayForm(parseInt(button.dataset.dayToEdit, 10));
            }

            // Handle leader control buttons
            if (button.id === 'notify-members-btn') {
                button.textContent = "Sending..."; button.disabled = true;
                await sendReminderNotifications();
                button.textContent = "Send Reminders"; button.disabled = false;
            }
            if (button.id === 'send-availability-report-btn') {
                button.textContent = "Sending..."; button.disabled = true;
                try {
                    await sendAvailabilityReport();
                    showCustomAlert("Report sent successfully!", "Report Sent");
                } catch (error) { /* error handled in function */ }
                finally { button.textContent = "Send Availability"; button.disabled = false; }
            }
            if (button.id === 'reset-availability-btn') {
                const confirmed = await showCustomConfirm("Reset ALL availability data for everyone?", "Confirm Reset");
                if (confirmed) await resetAllAvailability();
            }
        });
    }

    // Firebase auth state change listener
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const doc = await db.collection('userProfiles').doc(user.uid).get();
            if (doc.exists) {
                const userData = doc.data();
                userApiKey = userData.tornApiKey;
                globalYourFactionID = userData.faction_id;
                document.getElementById('availabilityPageTitle').textContent = `${userData.faction_name || 'Your Faction'}'s War Availability`;

                if (userApiKey && globalYourFactionID) {
                    // Fetch full faction data once
                    const url = `https://api.torn.com/v2/faction/${globalYourFactionID}?selections=basic,members&key=${userApiKey}&comment=MyTornPA_Availability`;
                    const response = await fetch(url);
                    factionApiFullData = await response.json();
                    
                    if (factionApiFullData.error) {
                        showCustomAlert(`Torn API Error: ${factionApiFullData.error.error}`, "Data Load Failed");
                        return;
                    }

                    // Kick off the initial render
                    await displayWarRoster();
                } else {
                    showCustomAlert("API Key or Faction ID missing from your profile.", "Error");
                }
            }
        } else {
            // Handle user logged out state
            document.getElementById('warAvailabilityContainer').innerHTML = '<h2>Please log in to view war availability.</h2>';
        }
    });
});