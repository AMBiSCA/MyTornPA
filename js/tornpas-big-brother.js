// File: ../js/tornpas-big-brother.js

// Firebase initialization is assumed to be handled by firebase-init.js
// which should be imported before this script in the HTML.
// Access global firebase object for auth and firestore.
const auth = firebase.auth();
const db = firebase.firestore();

// Global variables for user data and tracking state
let userApiKey = null;
let userTornProfileId = null;
let currentFirebaseUserUid = null; // Store current user's UID
let currentUserIsAdmin = false; // Store admin status
let userFactionIdFromProfile = null; // Store user's faction ID, retrieved from profile

let activeTrackingSessionId = null; // Stores the ID of the currently active session for the user's faction
let activeTrackingStartedAt = null; // Stores the start timestamp of the active session for the user's faction
let baselineStatsCache = {}; // Cache for the baseline stats of the active session for the user's faction

// Firestore references for gain tracking
const GAIN_TRACKING_SESSIONS_COLLECTION = 'gainTrackingSessions'; // Collection for individual snapshots
// Removed: const GAIN_TRACKING_STATUS_DOC = 'currentTrackingStatus'; // This will now be dynamic (faction ID)

// Real-time Firestore unsubscribe functions
let unsubscribeFromTrackingStatus = null;
let unsubscribeFromGainsData = null; // To unsubscribe from real-time updates to 'users' collection for gains


// --- New Custom Alert Function (Needed to handle popups correctly) ---
function showCustomAlert(message, title = "Notification") {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 99999;
    `;
    const content = document.createElement('div');
    content.style.cssText = `
        background-color: #2a2a2a;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        text-align: center;
        color: #fff;
        font-family: sans-serif;
    `;
    content.innerHTML = `
        <h4 style="margin: 0 0 10px; color: #e0a71a;">${title}</h4>
        <p style="margin: 0 0 20px;">${message}</p>
        <button onclick="document.body.removeChild(this.closest('div.modal-box').parentNode)">OK</button>
    `;
    const button = content.querySelector('button');
    button.style.cssText = `
        background-color: #5865F2;
        color: #fff;
        border: none;
        padding: 8px 15px;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
    `;
    modal.appendChild(content);
    document.body.appendChild(modal);
}

// --- Helper Functions ---

/**
 * Formats a raw number into a human-readable string (e.g., 1.23b, 45.6m, 789k).
 * This function is needed by updateFriendlyMembersTable for the 'Total' column.
 * @param {number} num The number to format.
 * @returns {string} The formatted string.
 */
function formatBattleStats(num) {
    if (isNaN(num) || num === 0) return '0';
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'b';
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'm';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toLocaleString();
}

/**
 * Helper function to parse a stat string (which might contain 'k', 'm', 'b') into a number.
 * This is crucial for numerical comparisons in applyStatColorCoding and gain calculations.
 * @param {string|number} statString The stat value as a string (e.g., "1.2m", "500k", "123,456") or a number.
 * @returns {number} The parsed numerical value.
 */
function parseStatValue(statString) {
    if (typeof statString === 'number') { // If it's already a number, just return it
        return statString;
    }
    if (typeof statString !== 'string' || statString.trim() === '' || statString.toLowerCase() === 'n/a') {
        return 0; // Handle null, undefined, empty string, or "N/A"
    }

    let value = statString.trim().toLowerCase(); // Use 'value' as a mutable copy

    let multiplier = 1;
    if (value.endsWith('k')) {
        multiplier = 1000;
        value = value.slice(0, -1);
    } else if (value.endsWith('m')) {
        multiplier = 1000000;
        value = value.slice(0, -1);
    } else if (value.endsWith('b')) {
        multiplier = 1000000000;
        value = value.slice(0, -1);
    }

    const number = parseFloat(value.replace(/,/g, '')); // Remove commas before parsing to number
    return isNaN(number) ? 0 : number * multiplier;
}


/**
 * Applies CSS classes to table cells based on battle stat tiers for color coding.
 * This function needs to be called after the table is populated.
 */
function applyStatColorCoding() {
    const table = document.getElementById('friendly-members-table');
    if (!table) return;

    // This adds the 'table-striped' class to your table so the CSS rules will work.
    table.classList.add('table-striped');

    const statCells = table.querySelectorAll('tbody td:nth-child(3), tbody td:nth-child(4), tbody td:nth-child(5), tbody td:nth-child(6), tbody td:nth-child(7)');

    statCells.forEach(cell => {
        // First, remove any existing tier classes to ensure a clean slate (now checks for all 14)
        for (let i = 1; i <= 14; i++) {
            cell.classList.remove(`stat-tier-${i}`);
        }
        cell.classList.remove('stat-cell');

        // Now, determine and add the correct new class
        const value = parseStatValue(cell.textContent);
        let tierClass = '';

        // New 14-tier logic
        if (value >= 10000000000) { tierClass = 'stat-tier-14'; } // 10b+
        else if (value >= 5000000000) { tierClass = 'stat-tier-13'; } // 5b
        else if (value >= 2500000000) { tierClass = 'stat-tier-12'; } // 2.5b
        else if (value >= 1000000000) { tierClass = 'stat-tier-11'; } // 1b
        else if (value >= 500000000) { tierClass = 'stat-tier-10'; } // 500m
        else if (value >= 250000000) { tierClass = 'stat-tier-9'; } // 250m
        else if (value >= 100000000) { tierClass = 'stat-tier-8'; } // 100m
        else if (value >= 50000000) { tierClass = 'stat-tier-7'; } // 50m
        else if (value >= 10000000) { tierClass = 'stat-tier-6'; } // 10m
        else if (value >= 5000000) { tierClass = 'stat-tier-5'; } // 5m
        else if (value >= 1000000) { tierClass = 'stat-tier-4'; } // 1m
        else if (value >= 100000) { tierClass = 'stat-tier-3'; } // 100k
        else if (value >= 10000) { tierClass = 'stat-tier-2'; } // 10k
        else if (value > 0) { tierClass = 'stat-tier-1'; }

        if (tierClass) {
            cell.classList.add(tierClass);
            cell.classList.add('stat-cell');
        }
    });
}
/**
 * Formats a Unix timestamp (in seconds) into a relative time string.
 * @param {number} timestampInSeconds Unix timestamp in seconds.
 * @returns {string} Relative time string.
 */
function formatRelativeTime(timestampInSeconds) {
    if (!timestampInSeconds || timestampInSeconds === 0) {
        return "N/A";
    }

    const now = Math.floor(Date.now() / 1000);
    const diffSeconds = now - timestampInSeconds;

    if (diffSeconds < 60) { return "Now"; }
    else if (diffSeconds < 3600) { const minutes = Math.floor(diffSeconds / 60); return `${minutes} min${minutes === 1 ? '' : 's'} ago`; }
    else if (diffSeconds < 86400) { const hours = Math.floor(diffSeconds / 3600); return `${hours} hour${hours === 1 ? '' : 's'} ago`; }
    else { const days = Math.floor(diffSeconds / 86400); return `${days} day${days === 1 ? '' : 's'} ago`; }
}

// --- Loading Message Control ---
let loadingMessageElement;

function showLoadingMessage() {
    if (loadingMessageElement) {
        loadingMessageElement.style.display = 'block';
    }
}

function hideLoadingMessage() {
    if (loadingMessageElement) {
        loadingMessageElement.style.display = 'none';
    }
}

// --- User Role / Admin Check ---
async function checkIfUserIsAdmin(userUid) {
    if (!userUid) return false;
    try {
        const userProfileDoc = await db.collection('userProfiles').doc(userUid).get();
        if (!userProfileDoc.exists) return false;

        const userProfile = userProfileDoc.data();
        const userPosition = userProfile.position ? userProfile.position.toLowerCase() : '';
        const userTornId = userProfile.tornProfileId;

        // Check if user is a leader or co-leader
        if (userPosition === 'leader' || userPosition === 'co-leader') {
            return true;
        }

        // Check if user is in the list of designated admins
        const warDoc = await db.collection('factionWars').doc('currentWar').get();
        if (warDoc.exists) {
            const tab4Admins = warDoc.data().tab4Admins || [];
            return tab4Admins.includes(String(userTornId));
        }

        return false;
    } catch (error) {
        console.error("Error during admin check in TornPAs Big Brother:", error);
        return false;
    }
}

// --- Main Data Fetching and Display Function for the Current Stats Table ---
async function updateFriendlyMembersTable(apiKey, firebaseAuthUid) {
    const tbody = document.getElementById('friendly-members-tbody');
    if (!tbody) return;

    showLoadingMessage();

    try {
        const userProfileDocRef = db.collection('userProfiles').doc(firebaseAuthUid);
        const userProfileDoc = await userProfileDocRef.get();
        const userFactionId = userProfileDoc.data()?.faction_id;
        if (!userFactionId) {
            hideLoadingMessage();
            tbody.innerHTML = '<tr><td colspan="11" style="text-align:center; color: red;">Error: Faction ID not found.</td></tr>';
            return;
        }

        console.log("Triggering backend refresh for faction data...");
        // This Netlify function is assumed to be authorized and update 'users' collection
        const refreshResponse = await fetch(`/.netlify/functions/refresh-faction-data?factionId=${userFactionId}`);
        if (!refreshResponse.ok) {
            const errorResult = await refreshResponse.json().catch(() => ({ message: "Unknown refresh error" }));
            console.error("Backend refresh failed:", errorResult.message);
        } else {
            console.log("Backend refresh triggered successfully.");
        }

        const factionMembersApiUrl = `https://api.torn.com/v2/faction/${userFactionId}?selections=members&key=${apiKey}&comment=MyTornPA_BigBrother_FriendlyMembers`;
        const factionResponse = await fetch(factionMembersApiUrl);
        const factionData = await factionResponse.json();
        if (!factionResponse.ok || factionData.error) {
            hideLoadingMessage();
            tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; color: red;">Error: ${factionData.error?.error || 'Torn API Error'}.</td></tr>`;
            return;
        }

        const membersArray = Object.values(factionData.members || {});
        if (membersArray.length === 0) {
            hideLoadingMessage();
            tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;">No members found in your faction.</td></tr>';
            return;
        }

        const allMemberTornIds = membersArray.map(member => String(member.user_id || member.id));
        const CHUNK_SIZE = 10;
        const firestoreFetchPromises = [];
        const allMemberFirebaseData = {};

        for (let i = 0; i < allMemberTornIds.length; i += CHUNK_SIZE) {
            const chunk = allMemberTornIds.slice(i, i + CHUNK_SIZE);
            const query = db.collection('users').where(firebase.firestore.FieldPath.documentId(), 'in', chunk);
            firestoreFetchPromises.push(query.get());
        }

        const snapshots = await Promise.all(firestoreFetchPromises);
        snapshots.forEach(snapshot => snapshot.forEach(doc => allMemberFirebaseData[doc.id] = doc.data()));

        const processedMembers = membersArray.map((memberTornData) => {
            const memberId = String(memberTornData.user_id || memberTornData.id);
            if (!memberId) return null;

            const memberFirebaseData = allMemberFirebaseData[memberId] || {};
            
            const strengthNum = parseStatValue(memberFirebaseData.battlestats?.strength || 0);
            const speedNum = parseStatValue(memberFirebaseData.battlestats?.speed || 0);
            const dexterityNum = parseStatValue(memberFirebaseData.battlestats?.dexterity || 0);
            const defenseNum = parseStatValue(memberFirebaseData.battlestats?.defense || 0);
            const totalStats = strengthNum + speedNum + dexterityNum + defenseNum;

            return { tornData: memberTornData, firebaseData: memberFirebaseData, totalStats: totalStats };
        }).filter(m => m !== null);

        processedMembers.sort((a, b) => b.totalStats - a.totalStats);

        let allRowsHtml = '';
        for (const member of processedMembers) {
            const { tornData, firebaseData, totalStats } = member;
            const memberId = tornData.user_id || tornData.id;
            const name = tornData.name || 'Unknown';
            const lastAction = tornData.last_action ? formatRelativeTime(tornData.last_action.timestamp) : 'N/A';
            
            const strength = formatBattleStats(parseStatValue(firebaseData.battlestats?.strength || 0));
            const dexterity = formatBattleStats(parseStatValue(firebaseData.battlestats?.dexterity || 0));
            const speed = formatBattleStats(parseStatValue(firebaseData.battlestats?.speed || 0));
            const defense = formatBattleStats(parseStatValue(firebaseData.battlestats?.defense || 0));
            // --- MODIFIED CODE END ---

            const nerve = `${firebaseData.nerve?.current ?? 'N/A'} / ${firebaseData.nerve?.maximum ?? 'N/A'}`;
            
            const energyValue = `${firebaseData.energy?.current ?? 'N/A'} / ${firebaseData.energy?.maximum ?? 'N/A'}`;

            const drugCooldownValue = firebaseData.cooldowns?.drug ?? 0;
            let drugCooldownHtml;
            
            // --- START MODIFIED LOGIC FOR NUDGE BUTTON ---
            if (drugCooldownValue > 0) {
                const hours = Math.floor(drugCooldownValue / 3600);
                const minutes = Math.floor((drugCooldownValue % 3600) / 60);
                const drugCooldownText = `${hours > 0 ? `${hours}hr` : ''} ${minutes > 0 ? `${minutes}m` : ''}`.trim() || '<1m';
                const drugCooldownClass = drugCooldownValue > 18000 ? 'status-hospital' : (drugCooldownValue > 7200 ? 'status-other' : 'status-okay');
                drugCooldownHtml = `<span class="${drugCooldownClass}">${drugCooldownText}</span>`;
            } else {
                if (currentUserIsAdmin) {
                    const lastNudgeTime = localStorage.getItem(`nudgeTimestamp_${memberId}`);
                    const now = new Date().getTime();
                    const oneHour = 60 * 60 * 1000;
                    const timeLeft = Math.max(0, oneHour - (now - lastNudgeTime));
                    const cooldownMinutes = Math.ceil(timeLeft / 60000);

                    if (lastNudgeTime && timeLeft > 0) {
                        drugCooldownHtml = `<button id="nudge-btn-${memberId}" class="nudge-btn disabled" disabled>Nudged (${cooldownMinutes}m left)</button>`;
                    } else {
                        drugCooldownHtml = `<button id="nudge-btn-${memberId}" class="nudge-btn" onclick="sendNudgeMessage('${memberId}', '${name}')">Nudge</button>`;
                    }
                } else {
                    drugCooldownHtml = '<span class="status-okay">None 🍁</span>';
                }
            }
            // --- END MODIFIED LOGIC ---

            const statusState = tornData.status?.state || '';
            const originalDescription = tornData.status?.description || 'N/A';
            let formattedStatus = originalDescription;
            let statusClass = 'status-okay';
            if (statusState === 'Hospital') { statusClass = 'status-hospital'; }
            else if (statusState === 'Abroad') { statusClass = 'status-abroad'; }
            else if (statusState !== 'Okay') { statusClass = 'status-other'; }

            const profileUrl = `https://www.torn.com/profiles.php?XID=${memberId}`;

            allRowsHtml += `
                <tr data-id="${memberId}">
                    <td><a href="${profileUrl}" target="_blank">${name}</a></td>
                    <td class="hide-on-mobile">${lastAction}</td>
                    <td>${strength}</td>
                    <td>${dexterity}</td>
                    <td>${speed}</td>
                    <td>${defense}</td>
                    <td>${formatBattleStats(totalStats)}</td>
                    <td class="${statusClass} hide-on-mobile">${formattedStatus}</td>
                    <td class="nerve-text hide-on-mobile">${nerve}</td>
                    <td class="energy-text hide-on-mobile">${energyValue}</td>
                    <td class="hide-on-mobile">${drugCooldownHtml}</td>
                </tr>
            `;
        }
        
        hideLoadingMessage();
        tbody.innerHTML = allRowsHtml.length > 0 ? allRowsHtml : '<tr><td colspan="11" style="text-align:center;">No members to display.</td></tr>';
        applyStatColorCoding();
    } catch (error) {
        console.error("Fatal error in updateFriendlyMembersTable:", error);
        hideLoadingMessage();
        tbody.innerHTML = `<tr><td colspan="11" style="color:red;">A fatal error occurred: ${error.message}.</td></tr>`;
    }
}
// --- NEW FUNCTION: Manages Discord Webhook Display & Edit Functionality ---
async function setupDiscordAdminSettings() {
    console.log("Setting up Discord Admin Settings...");

    const leaderControlsContainer = document.getElementById('availability-admin-controls');
    if (!leaderControlsContainer) {
        console.warn("Could not find leader controls container. Skipping Discord settings setup.");
        return;
    }

    const settingsHtml = `
        <div id="discordAdminSettingsContainer">
            <button id="showDiscordSettingsBtn" class="action-btn">
                <span class="icon">⚙️</span>
                <span>Discord Settings</span>
            </button>
        </div>
        <div id="discordSettingsModalOverlay" class="modal-overlay hidden">
            <div id="discordSettingsModal" class="modal-content">
                <div class="modal-header">
                    <h4>Discord Integration Settings</h4>
                    <span id="closeDiscordSettingsBtn" class="close-btn">&times;</span>
                </div>
                <div class="modal-body">
                    <p>Enter the IDs for your faction's Discord server and the channel for nudges.</p>
                    <div class="form-group">
                        <label for="discordGuildIdInput">Discord Server ID (Guild ID):</label>
                        <input type="text" id="discordGuildIdInput" placeholder="Paste your server ID here">
                    </div>
                    <div class="form-group">
                        <label for="discordChannelIdInput">Nudge Channel ID:</label>
                        <input type="text" id="discordChannelIdInput" placeholder="Paste your channel ID here">
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="saveDiscordSettingsBtn" class="action-btn">Save Settings</button>
                    <button id="cancelDiscordSettingsBtn" class="action-btn secondary">Cancel</button>
                </div>
            </div>
        </div>
    `;

    leaderControlsContainer.insertAdjacentHTML('beforeend', settingsHtml);
    console.log("Discord settings HTML injected.");

    const showSettingsBtn = document.getElementById('showDiscordSettingsBtn');
    const modalOverlay = document.getElementById('discordSettingsModalOverlay');
    const closeBtn = document.getElementById('closeDiscordSettingsBtn');
    const cancelBtn = document.getElementById('cancelDiscordSettingsBtn');
    const saveBtn = document.getElementById('saveDiscordSettingsBtn');
    const guildIdInput = document.getElementById('discordGuildIdInput');
    const channelIdInput = document.getElementById('discordChannelIdInput');

    console.log("Button element found:", showSettingsBtn);
    console.log("Modal overlay found:", modalOverlay);


    // Load existing settings from Firestore
    const loadSettings = async () => {
        try {
            const doc = await db.collection('factionSettings').doc('discord').get();
            if (doc.exists) {
                const data = doc.data();
                guildIdInput.value = data.discordGuildId || '';
                channelIdInput.value = data.discordNudgeChannelId || '';
                console.log("Settings loaded from Firestore.");
            }
        } catch (error) {
            console.error("Error loading Discord settings:", error);
        }
    };
    loadSettings();

    // Event listeners for the UI
    showSettingsBtn.addEventListener('click', () => {
        console.log("Cog button clicked. Showing modal.");
        modalOverlay.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', () => {
        console.log("Close button clicked. Hiding modal.");
        modalOverlay.classList.add('hidden');
    });

    cancelBtn.addEventListener('click', () => {
        console.log("Cancel button clicked. Hiding modal.");
        modalOverlay.classList.add('hidden');
    });

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            console.log("Overlay clicked. Hiding modal.");
            modalOverlay.classList.add('hidden');
        }
    });

    saveBtn.addEventListener('click', async () => {
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;
        console.log("Save button clicked. Starting save process.");

        const guildId = guildIdInput.value.trim();
        const channelId = channelIdInput.value.trim();

        if (!guildId || !channelId) {
            showCustomAlert('Please enter both a Server ID and a Channel ID.', 'Missing Information');
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
            return;
        }
        
        try {
            await db.collection('factionSettings').doc('discord').set({
                discordGuildId: guildId,
                discordNudgeChannelId: channelId,
                lastUpdatedBy: auth.currentUser.uid,
                lastUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            saveBtn.textContent = 'Saved! ✅';
            modalOverlay.classList.add('hidden');
            console.log("Settings saved to Firestore successfully.");
        } catch (error) {
            console.error('Error saving Discord settings:', error);
            showCustomAlert('Failed to save settings. Please check the console for details.', 'Save Failed');
            saveBtn.textContent = 'Error! ❌';
        } finally {
            setTimeout(() => {
                saveBtn.disabled = false;
                saveBtn.textContent = originalText;
            }, 2000);
        }
    });
}


/**
 * Sends a nudge message via a backend service to the specified member's Discord.
 * @param {string} memberId - The Torn ID of the member to nudge.
 * @param {string} memberName - The Torn name of the member to nudge.
 */
async function sendNudgeMessage(memberId, memberName) {
    if (!currentUserIsAdmin) {
        showCustomAlert("Permission denied. Only leaders/co-leaders can send nudges.", "Permission Denied");
        return;
    }

    const lastNudgeTime = localStorage.getItem(`nudgeTimestamp_${memberId}`);
    const now = new Date().getTime();
    const oneHour = 60 * 60 * 1000;

    if (lastNudgeTime && (now - lastNudgeTime) < oneHour) {
        showCustomAlert(`You can only nudge ${memberName} once per hour. Please wait.`, "Nudge Cooldown Active");
        return;
    }

    const nudgeButton = document.getElementById(`nudge-btn-${memberId}`);
    if (nudgeButton) {
        nudgeButton.textContent = 'Sending...';
        nudgeButton.disabled = true;
    }

    try {
        // Here's the key part: This calls a Netlify function on your server.
        // You will need to set up this function to handle the Discord API part.
        const backendUrl = `/.netlify/functions/send-nudge-message`;
        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                memberId: memberId,
                memberName: memberName,
                leaderName: currentTornUserName, // The name of the leader who clicked it
            })
        });

        if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.message || `Backend service responded with an error: ${response.status}`);
        }

        localStorage.setItem(`nudgeTimestamp_${memberId}`, now);
        updateFriendlyMembersTable(userApiKey, currentFirebaseUserUid); // Refresh the table to show the cooldown status
        
        showCustomAlert(`Nudge message successfully sent to ${memberName}!`, "Nudge Sent");
        
    } catch (error) {
        console.error("Error sending nudge message:", error);
        if (nudgeButton) {
            nudgeButton.textContent = 'Error';
            nudgeButton.disabled = false;
        }
        showCustomAlert(`Failed to send nudge: ${error.message}. Please check the console.`, "Send Failed");
    }
}

// --- Gain Tracking Core Logic ---

/**
 * Helper to format gain values (+X, -Y, 0) with appropriate CSS class.
 * @param {number} gain The numerical gain.
 * @returns {string} HTML string with formatted gain and class.
 */
function formatGainValue(gain) {
    if (typeof gain !== 'number') {
        return '<span class="gain-neutral">N/A</span>';
    }
    const formatted = gain.toLocaleString();
    if (gain > 0) {
        return `<span class="gain-positive">+${formatted}</span>`;
    } else if (gain < 0) {
        return `<span class="gain-negative">${formatted}</span>`;
    } else {
        return `<span class="gain-neutral">0</span>`;
    }
}

/**
 * Updates the UI elements related to gains tracking status (buttons, text).
 */
function updateGainTrackingUI() {
    const startTrackingBtn = document.getElementById('startTrackingBtn');
    const stopTrackingBtn = document.getElementById('stopTrackingBtn');
    const trackingStatusDisplay = document.getElementById('trackingStatus');
    const gainsStartedAtDisplay = document.getElementById('gainsStartedAt');

    if (!startTrackingBtn) { console.error("UI Error: startTrackingBtn not found."); return; }
    if (!stopTrackingBtn) { console.error("UI Error: stopTrackingBtn not found."); return; }
    if (!trackingStatusDisplay) { console.error("UI Error: trackingStatusDisplay not found."); return; }
    if (!gainsStartedAtDisplay) { console.error("UI Error: gainsStartedAtDisplay not found."); return; }


    if (!currentUserIsAdmin) {
        startTrackingBtn.classList.add('hidden');
        stopTrackingBtn.classList.add('hidden');
        trackingStatusDisplay.textContent = 'Only leaders/co-leaders can track gains.';
        gainsStartedAtDisplay.textContent = '';
        return;
    }

    // Check if there is an active session for *this faction*
    if (activeTrackingSessionId) {
        startTrackingBtn.classList.add('hidden');
        stopTrackingBtn.classList.remove('hidden');
        stopTrackingBtn.disabled = false;
        stopTrackingBtn.textContent = 'Stop Tracking';
        
        trackingStatusDisplay.textContent = 'Currently tracking gains.';
        if (activeTrackingStartedAt) {
            const startedDate = activeTrackingStartedAt.toDate ? activeTrackingStartedAt.toDate() : activeTrackingStartedAt;
            gainsStartedAtDisplay.textContent = 'Session started: ' + startedDate.toLocaleString();
        } else {
            gainsStartedAtDisplay.textContent = '';
        }
    } else {
        startTrackingBtn.classList.remove('hidden');
        startTrackingBtn.disabled = false;
        startTrackingBtn.textContent = 'Start Tracking Gains';
        stopTrackingBtn.classList.add('hidden');
        gainsStartedAtDisplay.textContent = '';
        trackingStatusDisplay.textContent = 'Ready to start tracking.';
    }
}

/**
 * Fetches current battle stats for all faction members and saves them as a snapshot.
 */
async function startTrackingGains() {
    console.log("Attempting to start tracking gains...");
    if (!currentUserIsAdmin) {
        alert("Permission denied. Only leaders/co-leaders can start tracking.");
        return;
    }
    if (!userApiKey || !currentFirebaseUserUid || !userFactionIdFromProfile) {
        alert("Cannot start tracking: User not fully logged in, API key missing, or Faction ID missing from profile.");
        return;
    }

    const startTrackingBtn = document.getElementById('startTrackingBtn');
    if (startTrackingBtn) {
        startTrackingBtn.disabled = true;
        startTrackingBtn.textContent = 'Starting...';
    }

    try {
        // Use userFactionIdFromProfile directly as it's already fetched and validated.
        const userFactionId = userFactionIdFromProfile;
        
        const factionMembersApiUrl = `https://api.torn.com/v2/faction/${userFactionId}?selections=members&key=${userApiKey}&comment=MyTornPA_BigBrother_Snapshot`;
        const factionResponse = await fetch(factionMembersApiUrl);
        const factionData = await factionResponse.json();
        if (!factionResponse.ok || factionData.error) throw new Error(`Torn API Error fetching members for snapshot: ${factionData.error?.error || 'API Error'}.`);

        const membersArray = Object.values(factionData.members || {});
        if (membersArray.length === 0) throw new Error("No members found in your faction to track.");

        const allMemberTornIds = membersArray.map(member => String(member.user_id || member.id));
        const CHUNK_SIZE = 10;
        const firestoreFetchPromises = [];
        const currentStatsForSnapshot = {};

        for (let i = 0; i < allMemberTornIds.length; i += CHUNK_SIZE) {
            const chunk = allMemberTornIds.slice(i, i + CHUNK_SIZE);
            const query = db.collection('users').where(firebase.firestore.FieldPath.documentId(), 'in', chunk);
            firestoreFetchPromises.push(query.get());
        }

        const snapshots = await Promise.all(firestoreFetchPromises);
        snapshots.forEach(snapshot => snapshot.forEach(doc => allMemberFirebaseData[doc.id] = doc.data()));

        const processedMembers = membersArray.map((memberTornData) => {
            const memberId = String(memberTornData.user_id || memberTornData.id);
            if (!memberId) return null;

            const memberFirebaseData = allMemberFirebaseData[memberId] || {};
            
            const strengthNum = parseStatValue(memberFirebaseData.battlestats?.strength || 0);
            const speedNum = parseStatValue(memberFirebaseData.battlestats?.speed || 0);
            const dexterityNum = parseStatValue(memberFirebaseData.battlestats?.dexterity || 0);
            const defenseNum = parseStatValue(memberFirebaseData.battlestats?.defense || 0);
            const totalStats = strengthNum + speedNum + dexterityNum + defenseNum;

            return { tornData: memberTornData, firebaseData: memberFirebaseData, totalStats: totalStats };
        }).filter(m => m !== null);

        processedMembers.sort((a, b) => b.totalStats - a.totalStats);

        let allRowsHtml = '';
        for (const member of processedMembers) {
            const { tornData, firebaseData, totalStats } = member;
            const memberId = tornData.user_id || tornData.id;
            const name = tornData.name || 'Unknown';
            const lastAction = tornData.last_action ? formatRelativeTime(tornData.last_action.timestamp) : 'N/A';
            
            const strength = formatBattleStats(parseStatValue(firebaseData.battlestats?.strength || 0));
            const dexterity = formatBattleStats(parseStatValue(firebaseData.battlestats?.dexterity || 0));
            const speed = formatBattleStats(parseStatValue(firebaseData.battlestats?.speed || 0));
            const defense = formatBattleStats(parseStatValue(firebaseData.battlestats?.defense || 0));
            // --- MODIFIED CODE END ---

            const nerve = `${firebaseData.nerve?.current ?? 'N/A'} / ${firebaseData.nerve?.maximum ?? 'N/A'}`;
            
            const energyValue = `${firebaseData.energy?.current ?? 'N/A'} / ${firebaseData.energy?.maximum ?? 'N/A'}`;

            const drugCooldownValue = firebaseData.cooldowns?.drug ?? 0;
            let drugCooldownHtml;
            
            // --- START MODIFIED LOGIC FOR NUDGE BUTTON ---
            if (drugCooldownValue > 0) {
                const hours = Math.floor(drugCooldownValue / 3600);
                const minutes = Math.floor((drugCooldownValue % 3600) / 60);
                const drugCooldownText = `${hours > 0 ? `${hours}hr` : ''} ${minutes > 0 ? `${minutes}m` : ''}`.trim() || '<1m';
                const drugCooldownClass = drugCooldownValue > 18000 ? 'status-hospital' : (drugCooldownValue > 7200 ? 'status-other' : 'status-okay');
                drugCooldownHtml = `<span class="${drugCooldownClass}">${drugCooldownText}</span>`;
            } else {
                if (currentUserIsAdmin) {
                    const lastNudgeTime = localStorage.getItem(`nudgeTimestamp_${memberId}`);
                    const now = new Date().getTime();
                    const oneHour = 60 * 60 * 1000;
                    const timeLeft = Math.max(0, oneHour - (now - lastNudgeTime));
                    const cooldownMinutes = Math.ceil(timeLeft / 60000);

                    if (lastNudgeTime && timeLeft > 0) {
                        drugCooldownHtml = `<button id="nudge-btn-${memberId}" class="nudge-btn disabled" disabled>Nudged (${cooldownMinutes}m left)</button>`;
                    } else {
                        drugCooldownHtml = `<button id="nudge-btn-${memberId}" class="nudge-btn" onclick="sendNudgeMessage('${memberId}', '${name}')">Nudge</button>`;
                    }
                } else {
                    drugCooldownHtml = '<span class="status-okay">None 🍁</span>';
                }
            }
            // --- END MODIFIED LOGIC ---

            const statusState = tornData.status?.state || '';
            const originalDescription = tornData.status?.description || 'N/A';
            let formattedStatus = originalDescription;
            let statusClass = 'status-okay';
            if (statusState === 'Hospital') { statusClass = 'status-hospital'; }
            else if (statusState === 'Abroad') { statusClass = 'status-abroad'; }
            else if (statusState !== 'Okay') { statusClass = 'status-other'; }

            const profileUrl = `https://www.torn.com/profiles.php?XID=${memberId}`;

            allRowsHtml += `
                <tr data-id="${memberId}">
                    <td><a href="${profileUrl}" target="_blank">${name}</a></td>
                    <td class="hide-on-mobile">${lastAction}</td>
                    <td>${strength}</td>
                    <td>${dexterity}</td>
                    <td>${speed}</td>
                    <td>${defense}</td>
                    <td>${formatBattleStats(totalStats)}</td>
                    <td class="${statusClass} hide-on-mobile">${formattedStatus}</td>
                    <td class="nerve-text hide-on-mobile">${nerve}</td>
                    <td class="energy-text hide-on-mobile">${energyValue}</td>
                    <td class="hide-on-mobile">${drugCooldownHtml}</td>
                </tr>
            `;
        }
        
        hideLoadingMessage();
        tbody.innerHTML = allRowsHtml.length > 0 ? allRowsHtml : '<tr><td colspan="11" style="text-align:center;">No members to display.</td></tr>';
        applyStatColorCoding();
    } catch (error) {
        console.error("Fatal error in updateFriendlyMembersTable:", error);
        hideLoadingMessage();
        tbody.innerHTML = `<tr><td colspan="11" style="color:red;">A fatal error occurred: ${error.message}.</td></tr>`;
    }
}
// --- NEW FUNCTION: Manages Discord Webhook Display & Edit Functionality ---
async function setupDiscordAdminSettings() {
    console.log("Setting up Discord Admin Settings...");

    const leaderControlsContainer = document.getElementById('availability-admin-controls');
    if (!leaderControlsContainer) {
        console.warn("Could not find leader controls container. Skipping Discord settings setup.");
        return;
    }

    const settingsHtml = `
        <div id="discordAdminSettingsContainer">
            <button id="showDiscordSettingsBtn" class="action-btn">
                <span class="icon">⚙️</span>
                <span>Discord Settings</span>
            </button>
        </div>
        <div id="discordSettingsModalOverlay" class="modal-overlay hidden">
            <div id="discordSettingsModal" class="modal-content">
                <div class="modal-header">
                    <h4>Discord Integration Settings</h4>
                    <span id="closeDiscordSettingsBtn" class="close-btn">&times;</span>
                </div>
                <div class="modal-body">
                    <p>Enter the IDs for your faction's Discord server and the channel for nudges.</p>
                    <div class="form-group">
                        <label for="discordGuildIdInput">Discord Server ID (Guild ID):</label>
                        <input type="text" id="discordGuildIdInput" placeholder="Paste your server ID here">
                    </div>
                    <div class="form-group">
                        <label for="discordChannelIdInput">Nudge Channel ID:</label>
                        <input type="text" id="discordChannelIdInput" placeholder="Paste your channel ID here">
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="saveDiscordSettingsBtn" class="action-btn">Save Settings</button>
                    <button id="cancelDiscordSettingsBtn" class="action-btn secondary">Cancel</button>
                </div>
            </div>
        </div>
    `;

    leaderControlsContainer.insertAdjacentHTML('beforeend', settingsHtml);
    console.log("Discord settings HTML injected.");

    const showSettingsBtn = document.getElementById('showDiscordSettingsBtn');
    const modalOverlay = document.getElementById('discordSettingsModalOverlay');
    const closeBtn = document.getElementById('closeDiscordSettingsBtn');
    const cancelBtn = document.getElementById('cancelDiscordSettingsBtn');
    const saveBtn = document.getElementById('saveDiscordSettingsBtn');
    const guildIdInput = document.getElementById('discordGuildIdInput');
    const channelIdInput = document.getElementById('discordChannelIdInput');

    console.log("Button element found:", showSettingsBtn);
    console.log("Modal overlay found:", modalOverlay);


    // Load existing settings from Firestore
    const loadSettings = async () => {
        try {
            const doc = await db.collection('factionSettings').doc('discord').get();
            if (doc.exists) {
                const data = doc.data();
                guildIdInput.value = data.discordGuildId || '';
                channelIdInput.value = data.discordNudgeChannelId || '';
                console.log("Settings loaded from Firestore.");
            }
        } catch (error) {
            console.error("Error loading Discord settings:", error);
        }
    };
    loadSettings();

    // Event listeners for the UI
    showSettingsBtn.addEventListener('click', () => {
        console.log("Cog button clicked. Showing modal.");
        modalOverlay.classList.remove('hidden');
    });

    closeBtn.addEventListener('click', () => {
        console.log("Close button clicked. Hiding modal.");
        modalOverlay.classList.add('hidden');
    });

    cancelBtn.addEventListener('click', () => {
        console.log("Cancel button clicked. Hiding modal.");
        modalOverlay.classList.add('hidden');
    });

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            console.log("Overlay clicked. Hiding modal.");
            modalOverlay.classList.add('hidden');
        }
    });

    saveBtn.addEventListener('click', async () => {
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Saving...';
        saveBtn.disabled = true;
        console.log("Save button clicked. Starting save process.");

        const guildId = guildIdInput.value.trim();
        const channelId = channelIdInput.value.trim();

        if (!guildId || !channelId) {
            showCustomAlert('Please enter both a Server ID and a Channel ID.', 'Missing Information');
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
            return;
        }
        
        try {
            await db.collection('factionSettings').doc('discord').set({
                discordGuildId: guildId,
                discordNudgeChannelId: channelId,
                lastUpdatedBy: auth.currentUser.uid,
                lastUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            saveBtn.textContent = 'Saved! ✅';
            modalOverlay.classList.add('hidden');
            console.log("Settings saved to Firestore successfully.");
        } catch (error) {
            console.error('Error saving Discord settings:', error);
            showCustomAlert('Failed to save settings. Please check the console for details.', 'Save Failed');
            saveBtn.textContent = 'Error! ❌';
        } finally {
            setTimeout(() => {
                saveBtn.disabled = false;
                saveBtn.textContent = originalText;
            }, 2000);
        }
    });
}
// --- NEW CODE: showCustomAlert function ---
function showCustomAlert(message, title = "Notification") {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 99999;
    `;
    const content = document.createElement('div');
    content.style.cssText = `
        background-color: #2a2a2a;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        text-align: center;
        color: #fff;
        font-family: sans-serif;
    `;
    content.innerHTML = `
        <h4 style="margin: 0 0 10px; color: #e0a71a;">${title}</h4>
        <p style="margin: 0 0 20px;">${message}</p>
        <button onclick="document.body.removeChild(this.closest('div').parentNode)">OK</button>
    `;
    const button = content.querySelector('button');
    button.style.cssText = `
        background-color: #5865F2;
        color: #fff;
        border: none;
        padding: 8px 15px;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
    `;
    modal.appendChild(content);
    modal.classList.add('modal-box');
    document.body.appendChild(modal);
}
// ... (rest of the file)