/* ==========================================================================
   War Page Hub JavaScript (war_page_hub.js)
   ========================================================================== */

// --- Global Variables and Utility Functions ---

// Firebase references (assuming firebase-init.js is included correctly)
const db = firebase.firestore();
const auth = firebase.auth();

// --- DOM Element Getters ---
// Existing getters
const tabButtons = document.querySelectorAll('.tab-button'); // Grouped for re-use
const gamePlanDisplay = document.getElementById('gamePlanDisplay'); // Re-declared for direct use
const warTermedStatus = document.getElementById('warTermedStatus');
const warTermedWinLoss = document.getElementById('warTermedWinLoss');
const warChainingStatus = document.getElementById('warChainingStatus');
const warNoFlyingStatus = document.getElementById('warNoFlyingStatus');
const warTurtleStatus = document.getElementById('warTurtleStatus');
const copyGamePlanBtn = document.getElementById('copyGamePlanBtn'); // Re-declared for direct use
const chainTimerDisplay = document.getElementById('chainTimerDisplay');
const enemyChainTimerDisplay = document.getElementById('enemyChainTimerDisplay');
const postAnnouncementBtn = document.getElementById('postAnnouncementBtn'); // Re-declared for direct use
const quickAnnouncementInput = document.getElementById('quickAnnouncementInput');
const quickFFTargetsDisplay = document.getElementById('quickFFTargetsDisplay'); // Re-declared for direct use
const enemyTargetsList = document.getElementById('enemyTargetsList');
const alertHitterOnlineHospBtn = document.getElementById('alertHitterOnlineHospBtn');
const alertHitterActiveBtn = document.getElementById('alertHitterActiveBtn');
const alertEnemyActiveBtn = document.getElementById('alertEnemyActiveBtn');
const totalFactionEnergy = document.getElementById('totalFactionEnergy');
const totalPotentialHits = document.getElementById('totalPotentialHits');
const chainProgressDisplay = document.getElementById('chainProgressDisplay');
const friendlyMembersList = document.getElementById('friendlyMembersList');
const gamePlanEditArea = document.getElementById('gamePlanEditArea');
const saveGamePlanBtn = document.getElementById('saveGamePlanBtn');
const energyTrackMemberSelect = document.getElementById('energyTrackMemberSelect');
const saveEnergyTrackMembersBtn = document.getElementById('saveEnergyTrackMembersBtn');

// New elements for Faction War Hub Title
const factionWarHubTitleEl = document.getElementById('factionWarHubTitle');

// New elements for Faction Versus Section
const factionOneNameEl = document.getElementById('factionOneName');
const factionOneMembersEl = document.getElementById('factionOneMembers');
const factionOnePicEl = document.getElementById('factionOnePic');
const versusTextEl = document.querySelector('.versus-text'); // Using querySelector as it's a class
const factionTwoNameEl = document.getElementById('factionTwoName');
const factionTwoMembersEl = document.getElementById('factionTwoMembers');
const factionTwoPicEl = document.getElementById('factionTwoPic');
const factionVersusSectionEl = document.querySelector('.faction-versus-section'); // Main container for this section

// New elements for War Status Display on Announcements tab
const warEnlistedStatus = document.getElementById('warEnlistedStatus');
const warNextChainTimeStatus = document.getElementById('warNextChainTimeStatus');
const factionAnnouncementsDisplay = document.getElementById('factionAnnouncementsDisplay');


// --- Global API Data Storage ---
let currentUserFactionApiData = null; // Will store user's faction data from Torn API (basic + ranked_wars)
let currentEnemyFactionApiData = null; // Will store enemy faction data from Torn API (basic)


// --- Utility Functions ---

// Function to show/hide tab content
function showTab(tabId) {
    const tabPanes = document.querySelectorAll('.tab-pane');
    tabPanes.forEach(pane => pane.classList.remove('active'));

    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => button.classList.remove('active'));

    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    const selectedButton = document.querySelector(`.tab-button[data-tab="${tabId.replace('-tab', '')}"]`);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }
}

// Function to display a message in a specific element
function displayMessage(element, message, isError = false) {
    if (element) {
        element.textContent = message;
        element.style.color = isError ? 'red' : '';
    }
}

// Function to copy text to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true; // Success
    } catch (err) {
        console.error('Failed to copy: ', err);
        return false; // Failure
    }
}

// Helper for formatting time remaining (assuming seconds timestamp or duration)
function formatTime(seconds) {
    if (typeof seconds !== 'number' || seconds <= 0) return "N/A";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}


// --- Main Torn API Data Fetching and Population (For Faction Title & Vs Box) ---

// This function fetches Torn API data relevant to the main title and the Faction vs. Faction box
async function initializeWarHubApiData(user, apiKey) {
    if (!apiKey) {
        console.warn("API Key not available for war hub data fetching.");
        if (factionVersusSectionEl) factionVersusSectionEl.style.display = 'none';
        if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = 'Faction War Hub. (API Key Needed)';
        return;
    }

    try {
        // --- API Call 1: Get User's Faction Data and Ranked War Info (Needed for enemy faction ID) ---
        const factionApiUrl = `https://api.torn.com/faction/?selections=basic,ranked_wars&key=${apiKey}&comment=MyTornPA_WarHub_UserFactionDetails`;
        console.log(`Fetching user faction data for title & Vs box (selections: basic,ranked_wars, key hidden)`);

        const factionResponse = await fetch(factionApiUrl);
        const factionData = await factionResponse.json();
        console.log("User Faction API Response for Vs Box:", factionData);

        if (!factionResponse.ok || factionData.error) {
            throw new Error(`Torn API Faction Error: ${factionData.error?.error || factionResponse.statusText}`);
        }

        currentUserFactionApiData = factionData; // Store user's own faction data (including ranked_wars)

        // --- Populate Main Title ---
        const usersFactionName = currentUserFactionApiData?.name || "Your Faction";
        if (factionWarHubTitleEl) {
            factionWarHubTitleEl.textContent = `${usersFactionName}'s War Hub.`;
        }

        // --- API Call 2 (Conditional): Get Enemy Faction Data if in War ---
        currentEnemyFactionApiData = null; // Reset enemy faction
        const activeRankedWar = currentUserFactionApiData.ranked_wars?.current; // Get the current active ranked war details
        if (activeRankedWar && activeRankedWar.opponent_faction_id) {
            const enemyFactionId = activeRankedWar.opponent_faction_id;
            const enemyFactionApiUrl = `https://api.torn.com/faction/${enemyFactionId}/?selections=basic&key=${apiKey}&comment=MyTornPA_WarHub_EnemyFactionDetails`;
            console.log(`Fetching enemy faction data for Vs box (ID: ${enemyFactionId}, key hidden)`);

            const enemyResponse = await fetch(enemyFactionApiUrl);
            const enemyData = await enemyResponse.json();
            console.log("Enemy Faction API Response for Vs Box:", enemyData);

            if (!enemyResponse.ok || enemyData.error) {
                console.warn(`Could not fetch enemy faction details: ${enemyData.error?.error || enemyResponse.statusText}`);
                // Proceed without enemy data, VS section might show N/A for enemy
            } else {
                currentEnemyFactionApiData = enemyData; // Store enemy faction data
            }
        }

        // --- Populate Faction Versus Section (always call after API data is ready) ---
        populateFactionVersusSection();

    } catch (error) {
        console.error("Error initializing Torn API data for War Hub:", error);
        // Display more user-friendly messages for key types or general errors
        if (error.message.includes("Key must be set to Full Access") || error.message.includes("Wrong fields")) {
             if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = `War Hub. (Check API Key)`;
             if (factionVersusSectionEl) factionVersusSectionEl.innerHTML = '<p style="text-align:center; color:orange;">Cannot load Faction vs. Faction data. Please ensure your Torn API Key is **Full Access**.</p>';
        } else if (error.message.includes("Failed to fetch") || error.message.includes("Torn API Faction Error")) {
            if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = `Error Loading War Hub.`;
            if (factionVersusSectionEl) factionVersusSectionEl.innerHTML = `<p style="text-align:center; color:red;">Error loading Faction vs. Faction data: ${error.message}</p>`;
        } else {
            if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = `Error Loading War Hub.`;
            if (factionVersusSectionEl) factionVersusSectionEl.innerHTML = `<p style="text-align:center; color:red;">An unexpected error occurred loading Faction Vs: ${error.message}</p>`;
        }

        if (factionVersusSectionEl) factionVersusSectionEl.style.display = 'block'; // Ensure message is visible if hidden
        // Ensure Vs section is cleared on API error
        if (factionOneNameEl) factionOneNameEl.textContent = 'N/A';
        if (factionOneMembersEl) factionOneMembersEl.textContent = 'N/A';
        if (factionOnePicEl) factionOnePicEl.src = 'https://dummyimage.com/100x100/333/fff&text=F1';
        if (factionTwoNameEl) factionTwoNameEl.textContent = 'N/A';
        if (factionTwoMembersEl) factionTwoMembersEl.textContent = 'N/A';
        if (factionTwoPicEl) factionTwoPicEl.src = 'https://dummyimage.com/100x100/333/fff&text=F2';
        if (versusTextEl) versusTextEl.textContent = 'Vs';
    }
}

// Function to populate the Faction Versus Section
function populateFactionVersusSection() {
    if (factionVersusSectionEl && currentUserFactionApiData) {
        const activeRankedWar = currentUserFactionApiData.ranked_wars?.current;

        // Check if there's an active war AND enemy faction data was successfully retrieved
        if (activeRankedWar && currentEnemyFactionApiData) {
            factionVersusSectionEl.style.display = 'flex'; // Show the section

            // Populate Faction 1 (User's Faction)
            if (factionOneNameEl) factionOneNameEl.textContent = currentUserFactionApiData.name || 'Your Faction';
            if (factionOneMembersEl) factionOneMembersEl.textContent = currentUserFactionApiData.members?.total || 'N/A';
            if (factionOnePicEl) factionOnePicEl.src = currentUserFactionApiData.image || 'https://dummyimage.com/100x100/333/fff&text=F1';
            if (factionOnePicEl) factionOnePicEl.alt = currentUserFactionApiData.name || 'Faction 1 Logo';

            // Populate Faction 2 (Enemy Faction)
            if (factionTwoNameEl) factionTwoNameEl.textContent = currentEnemyFactionApiData.name || 'Enemy Faction';
            if (factionTwoMembersEl) factionTwoMembersEl.textContent = currentEnemyFactionApiData.members?.total || 'N/A';
            if (factionTwoPicEl) factionTwoPicEl.src = currentEnemyFactionApiData.image || 'https://dummyimage.com/100x100/333/fff&text=F2';
            if (factionTwoPicEl) factionTwoPicEl.alt = currentEnemyFactionApiData.name || 'Faction 2 Logo';

            if (versusTextEl) versusTextEl.textContent = 'Vs';

        } else {
            // No active war or couldn't get enemy data, show "Your Faction" vs "N/A" or hide
            factionVersusSectionEl.style.display = 'flex'; // Still show, but with "No War" info
            if (factionOneNameEl) factionOneNameEl.textContent = currentUserFactionApiData.name || 'Your Faction';
            if (factionOneMembersEl) factionOneMembersEl.textContent = currentUserFactionApiData.members?.total || 'N/A';
            if (factionOnePicEl) factionOnePicEl.src = currentUserFactionApiData.image || 'https://dummyimage.com/100x100/333/fff&text=F1';
            if (factionOnePicEl) factionOnePicEl.alt = currentUserFactionApiData.name || 'Faction 1 Logo';

            if (factionTwoNameEl) factionTwoNameEl.textContent = 'No Enemy';
            if (factionTwoMembersEl) factionTwoMembersEl.textContent = 'N/A';
            if (factionTwoPicEl) factionTwoPicEl.src = 'https://dummyimage.com/100x100/333/fff&text=N/A';
            if (factionTwoPicEl) factionTwoPicEl.alt = 'No Enemy';

            if (versusTextEl) versusTextEl.textContent = 'Vs (No War)';
        }
    } else if (factionVersusSectionEl) {
        factionVersusSectionEl.style.display = 'none'; // Hide if no user faction data at all
    }
}


// --- Firestore Data Loading (For Game Plan, War Status Display, Faction Announcements Display) ---

// Function to populate the War Status Display Box on Announcements Tab (Firestore Source)
async function populateWarStatusDisplay() {
    try {
        const doc = await db.collection('factionWars').doc('currentWar').get();
        if (doc.exists) {
            const warData = doc.data();
            displayMessage(warEnlistedStatus, warData.toggleEnlisted === true ? 'Yes' : 'No');
            displayMessage(warTermedStatus, warData.toggleTermedWar === true ? 'Yes' : 'No');
            displayMessage(warTermedWinLoss, warData.toggleTermedWinLoss || 'N/A');
            displayMessage(warChainingStatus, warData.toggleChaining === true ? 'Yes' : 'No');
            displayMessage(warNoFlyingStatus, warData.toggleNoFlying === true ? 'Yes' : 'No');
            displayMessage(warTurtleStatus, warData.toggleTurtleMode === true ? 'Yes' : 'No');

            const nextChainTime = warData.nextChainTimeInput || 'N/A'; // From Leader Config input
            displayMessage(warNextChainTimeStatus, nextChainTime);

        } else {
            console.warn("No war document found for war status display.");
            displayMessage(warEnlistedStatus, 'N/A');
            displayMessage(warTermedStatus, 'N/A');
            displayMessage(warTermedWinLoss, 'N/A');
            displayMessage(warChainingStatus, 'N/A');
            displayMessage(warNoFlyingStatus, 'N/A');
            displayMessage(warTurtleStatus, 'N/A');
            displayMessage(warNextChainTimeStatus, 'N/A');
        }
    } catch (error) {
        console.error('Error loading war status from Firestore:', error);
        displayMessage(warEnlistedStatus, 'Error', true);
        displayMessage(warTermedStatus, 'Error', true);
        displayMessage(warTermedWinLoss, 'Error', true);
        displayMessage(warChainingStatus, 'Error', true);
        displayMessage(warNoFlyingStatus, 'Error', true);
        displayMessage(warTurtleStatus, 'Error', true);
        displayMessage(warNextChainTimeStatus, 'Error', true);
    }
}

// Function to populate the Faction Announcements Display Box on Announcements Tab (Firestore Source)
async function populateFactionAnnouncementsDisplay() {
    try {
        const doc = await db.collection('factionWars').doc('currentWar').get();
        if (doc.exists) {
            const announcement = doc.data().quickAnnouncement || 'No current announcements.';
            displayMessage(factionAnnouncementsDisplay, announcement);
        } else {
            displayMessage(factionAnnouncementsDisplay, 'No war document found for announcements.');
        }
    } catch (error) {
        console.error('Error loading faction announcements for display from Firestore:', error);
        displayMessage(factionAnnouncementsDisplay, 'Error loading announcements.', true);
    }
}


// --- Tab 1: War Announcements (Firestore specific) ---

// Load and display game plan
async function loadGamePlan() {
    try {
        const doc = await db.collection('factionWars').doc('currentWar').get();
        if (doc.exists) {
            const gamePlan = doc.data().gamePlan || 'No game plan available.';
            displayMessage(gamePlanDisplay, gamePlan);
        } else {
            displayMessage(gamePlanDisplay, 'No war document found.');
        }
    } catch (error) {
        console.error('Error loading game plan from Firestore:', error);
        displayMessage(gamePlanDisplay, 'Error loading game plan.', true);
    }
}

// Copy Game Plan button
if (copyGamePlanBtn) {
    copyGamePlanBtn.addEventListener('click', async () => {
        const gamePlanText = gamePlanDisplay.textContent;
        const copied = await copyToClipboard(gamePlanText);
        if (copied) {
            alert('Game plan copied to clipboard!');
        } else {
            alert('Failed to copy game plan.');
        }
    });
}


// --- Tab 2: Active War Operations (Placeholders/Netlify Functions) ---

// Load chain timer
async function loadChainTimer() {
    // Implement logic to fetch and display the chain timer
    if (chainTimerDisplay) displayMessage(chainTimerDisplay, '00:00:00'); // Placeholder
}

// Load enemy chain timer
async function loadEnemyChainTimer() {
    // Implement logic to fetch and display the enemy chain timer
    if (enemyChainTimerDisplay) displayMessage(enemyChainTimerDisplay, '00:00:00'); // Placeholder
}

// Post Announcement button (Now on Leader Config tab, saves to Firestore)
if (postAnnouncementBtn) {
    postAnnouncementBtn.addEventListener('click', async () => {
        const message = quickAnnouncementInput.value;
        if (message.trim() !== '') {
            try {
                await db.collection('factionWars').doc('currentWar').update({
                    quickAnnouncement: message,
                    quickAnnouncementTimestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                alert('Announcement posted!');
                quickAnnouncementInput.value = ''; // Clear input
                populateFactionAnnouncementsDisplay(); // Refresh display on Announcements tab
            } catch (error) {
                console.error('Error posting announcement:', error);
                alert('Error posting announcement.');
            }
        }
    });
}


// Load Quick FF Targets
async function loadQuickFFTargets() {
    try {
        const targets = ['Target 1', 'Target 2', 'Target 3']; // Placeholder
        if (quickFFTargetsDisplay) {
            const targetList = targets.map(target => `<span>${target}</span>`).join('');
            quickFFTargetsDisplay.innerHTML = targetList;
        }
    } catch (error) {
        console.error('Error loading quick FF targets:', error);
        if (quickFFTargetsDisplay) displayMessage(quickFFTargetsDisplay, 'Error loading targets.', true);
    }
}

// Load Enemy Targets List
async function loadEnemyTargets() {
    try {
        const targets = [{ name: 'Enemy 1 [123]', ff: 80, difficulty: 'Easy', estStats: '10k', hospital: '00:10:00', canAttack: true, canClaim: true }, /* ... */]; // Placeholder
        if (enemyTargetsList) {
            const targetRows = targets.map(target => `
                <div class="enemy-target-row">
                    <span>${target.name}</span>
                    <span>${target.ff}</span>
                    <span>${target.difficulty}</span>
                    <span>${target.estStats}</span>
                    <span>${target.hospital}</span>
                    <span>${target.canAttack ? '<button class="action-btn">Attack</button>' : 'N/A'}</span>
                    <span>${target.canClaim ? '<button class="action-btn">Claim</button>' : 'N/A'}</span>
                </div>
            `).join('');
            enemyTargetsList.innerHTML = targetRows;
        }
    } catch (error) {
        console.error('Error loading enemy targets:', error);
        if (enemyTargetsList) displayMessage(enemyTargetsList, 'Error loading targets.', true);
    }
}

// Alert Buttons
if (alertHitterOnlineHospBtn) alertHitterOnlineHospBtn.addEventListener('click', () => { console.log('Alert: Big Hitter Online (Self Hosp)'); });
if (alertHitterActiveBtn) alertHitterActiveBtn.addEventListener('click', () => { console.log('Alert: Big Hitter Active'); });
if (alertEnemyActiveBtn) alertEnemyActiveBtn.addEventListener('click', () => { console.log('Alert: Enemy Active'); });

// Faction Energy/Hits Tracker
async function loadFactionStats() {
    // Implement logic to fetch and display faction energy, potential hits, and chain progress
    if (totalFactionEnergy) displayMessage(totalFactionEnergy, '1000'); // Placeholder
    if (totalPotentialHits) displayMessage(totalPotentialHits, '50'); // Placeholder
    if (chainProgressDisplay) displayMessage(chainProgressDisplay, '500/1000'); // Placeholder
}

// --- Tab 3: Friendly Faction Member Status ---

// Load Friendly Members List
async function loadFriendlyMembers() {
    try {
        const members = [{ name: 'Member 1', energy: 100, hospital: '00:05:00' }, /* ... */]; // Placeholder
        if (friendlyMembersList) {
            const memberRows = members.map(member => `
                <div>${member.name} - Energy: ${member.energy}, Hospital: ${member.hospital}</div>
            `).join('');
            friendlyMembersList.innerHTML = memberRows;
        }
    } catch (error) {
        console.error('Error loading friendly members:', error);
        if (friendlyMembersList) displayMessage(friendlyMembersList, 'Error loading member status.', true);
    }
}

// --- Tab 4: Leader War Configuration (Firestore specific) ---

// Load Game Plan for Editing
async function loadGamePlanForEdit() {
    try {
        const doc = await db.collection('factionWars').doc('currentWar').get();
        if (doc.exists) {
            const gamePlan = doc.data().gamePlan || '';
            if (gamePlanEditArea) gamePlanEditArea.value = gamePlan;
        }
    } catch (error) {
        console.error('Error loading game plan for edit:', error);
        if (gamePlanEditArea) displayMessage(gamePlanEditArea, 'Error loading game plan.', true);
    }
}

// Save Game Plan
if (saveGamePlanBtn) {
    saveGamePlanBtn.addEventListener('click', async () => {
        const newGamePlan = gamePlanEditArea.value;
        try {
            await db.collection('factionWars').doc('currentWar').update({ gamePlan: newGamePlan });
            loadGamePlan(); // Refresh the displayed game plan on Announcements tab
            alert('Game plan saved!');
        } catch (error) {
            console.error('Error saving game plan:', error);
            alert('Error saving game plan.');
        }
    });
}

// Load Energy Tracking Members
async function loadEnergyTrackMembers() {
    try {
        const members = [{ uid: 'user1', name: 'Member 1' }, { uid: 'user2', name: 'Member 2' }, /* ... */]; // Placeholder
        if (energyTrackMemberSelect) {
            energyTrackMemberSelect.innerHTML = ''; // Clear previous options
            members.forEach(member => {
                const option = document.createElement('option');
                option.value = member.uid;
                option.textContent = member.name;
                energyTrackMemberSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading energy track members:', error);
        if (energyTrackMemberSelect) displayMessage(energyTrackMemberSelect, 'Error loading members.', true);
    }
}

// Save Energy Tracking Members
if (saveEnergyTrackMembersBtn) {
    saveEnergyTrackMembersBtn.addEventListener('click', () => {
        const selectedMembers = Array.from(energyTrackMemberSelect.selectedOptions)
            .map(option => option.value);
        console.log('Saving energy tracking members:', selectedMembers);
        alert('Energy tracking members saved!');
    });
}


// --- Initialization on DOMContentLoaded and Auth State Change ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("war_page_hub.js: DOMContentLoaded event fired.");

    // Tab switching logic
    tabButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const tabId = event.target.dataset.tab + '-tab';
            showTab(tabId);
        });
    });

    // Show the first tab by default
    showTab('announcements-tab');

    // Centralized data loading based on Firebase Auth State
    auth.onAuthStateChanged(async function(user) {
        if (user) {
            console.log('User logged in. Attempting to load war hub data...');
            try {
                const userProfileRef = db.collection('userProfiles').doc(user.uid);
                const doc = await userProfileRef.get();
                if (doc.exists) {
                    const profileData = doc.data();
                    const apiKey = profileData.tornApiKey;
                    if (apiKey) {
                        // Initialize Torn API-dependent data
                        await initializeWarHubApiData(user, apiKey);
                    } else {
                        console.warn("No API key found for current user in Firestore. Cannot fetch Torn API data.");
                        if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = "Faction War Hub. (API Key Needed)";
                        if (factionVersusSectionEl) factionVersusSectionEl.style.display = 'none';
                        displayMessage(gamePlanDisplay, 'API key needed. Update in profile.', true);
                        displayMessage(warEnlistedStatus, 'N/A');
                        displayMessage(warTermedStatus, 'N/A');
                        displayMessage(warTermedWinLoss, 'N/A');
                        displayMessage(warChainingStatus, 'N/A');
                        displayMessage(warNoFlyingStatus, 'N/A');
                        displayMessage(warTurtleMode, 'N/A');
                        displayMessage(warNextChainTimeStatus, 'N/A');
                        displayMessage(factionAnnouncementsDisplay, 'API key needed.', true);
                    }
                } else {
                    console.warn("User profile not found in Firestore. Cannot fetch Torn API data.");
                    if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = "Faction War Hub. (Profile Incomplete)";
                    if (factionVersusSectionEl) factionVersusSectionEl.style.display = 'none';
                    displayMessage(gamePlanDisplay, 'Complete profile.', true);
                    displayMessage(warEnlistedStatus, 'N/A');
                    displayMessage(factionAnnouncementsDisplay, 'Complete profile.', true);
                }
            } catch (e) {
                console.error("Error getting user profile for API key:", e);
                if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = "Faction War Hub. (Error Loading)";
                if (factionVersusSectionEl) factionVersusSectionEl.style.display = 'none';
                displayMessage(gamePlanDisplay, 'Error loading data.', true);
                displayMessage(warEnlistedStatus, 'Error', true);
                displayMessage(factionAnnouncementsDisplay, 'Error loading announcements.', true);
            }
        } else {
            console.log("User not logged in. War Hub not initialized.");
            if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = "Faction War Hub. (Please Login)";
            if (factionVersusSectionEl) factionVersusSectionEl.style.display = 'none';
            // Clear all dynamic data when logged out
            displayMessage(gamePlanDisplay, 'Please log in to see war data.');
            displayMessage(warEnlistedStatus, 'N/A');
            displayMessage(warTermedStatus, 'N/A');
            displayMessage(warTermedWinLoss, 'N/A');
            displayMessage(warChainingStatus, 'N/A');
            displayMessage(warNoFlyingStatus, 'N/A');
            displayMessage(warTurtleMode, 'N/A');
            displayMessage(warNextChainTimeStatus, 'N/A');
            displayMessage(factionAnnouncementsDisplay, 'Please log in.', true);
        }
    });
});