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

// --- Global API Data Storage (to make data accessible across functions) ---
let tornApiData = null; // Will store the full API response for user/faction
let currentUserFaction = null;
let currentEnemyFaction = null;

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
    if (element) { // Changed from elementId to direct element reference
        element.textContent = message;
        element.style.color = isError ? 'red' : ''; // Optional: style error messages
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

// Helper for formatting time remaining (copied from home.js if needed)
function formatTimeRemaining(secs) {
    if (secs <= 0) return "OK 😊";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// --- Main Data Initialization and Population (Centralized) ---

// This function fetches data from Torn API and populates dynamic elements
async function initializeWarHubWithApiData(user, apiKey) {
    if (!apiKey) {
        console.warn("API Key not available for war hub data fetching.");
        if (factionVersusSectionEl) factionVersusSectionEl.style.display = 'none';
        if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = 'Faction War Hub. (API Key Needed)';
        return;
    }

    // Fetch user's faction details including enemy_faction if in war
    const selections = "basic,faction"; // 'basic' for user status, 'faction' for faction info
    const apiUrl = `https://api.torn.com/user/?selections=${selections}&key=${apiKey}&comment=MyTornPA_WarHub_Main`;

    try {
        console.log(`Fetching war hub data (selections: ${selections}, key hidden)`);
        const response = await fetch(apiUrl);
        const data = await response.json();
        console.log("War Hub API Response:", data);

        if (!response.ok) {
            const errorMsg = data?.error?.error || response.statusText;
            throw new Error(`API Error ${response.status}: ${errorMsg}`);
        }
        if (data.error) {
            throw new Error(`API Error: ${data.error.error || data.error.message || JSON.stringify(data.error)}`);
        }

        tornApiData = data; // Store the full API response globally or module-scoped
        currentUserFaction = data.faction; // Store user's faction data
        currentEnemyFaction = data.faction?.enemy_faction; // Store enemy faction data

        // --- Populate Main Title ---
        const usersFactionName = currentUserFaction?.name || "Your Faction";
        if (factionWarHubTitleEl) {
            factionWarHubTitleEl.textContent = `${usersFactionName}'s War Hub.`;
        }

        // --- Populate Faction Versus Section ---
        populateFactionVersusSection();

        // --- Populate War Status Display Box on Announcements Tab ---
        populateWarStatusDisplay(tornApiData);

        // --- Populate Announcements Display Box on Announcements Tab ---
        populateFactionAnnouncementsDisplay();

        // Call other data loading functions that rely on API or Firebase
        loadGamePlan(); // Loads from Firestore
        loadChainTimer();
        loadEnemyChainTimer();
        loadQuickFFTargets();
        loadEnemyTargets();
        loadFactionStats();
        loadFriendlyMembers();
        loadGamePlanForEdit(); // Loads from Firestore
        loadEnergyTrackMembers();

    } catch (error) {
        console.error("Error fetching war hub data:", error);
        if (factionVersusSectionEl) factionVersusSectionEl.style.display = 'none';
        if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = `Error Loading War Hub.`;
        // Also clear / reset other dynamic fields on error
        displayMessage(gamePlanDisplay, 'Error loading game plan.', true);
        displayMessage(warTermedStatus, 'Error', true);
        displayMessage(warTermedWinLoss, 'Error', true);
        displayMessage(warChainingStatus, 'Error', true);
        displayMessage(warNoFlyingStatus, 'Error', true);
        displayMessage(warTurtleStatus, 'Error', true);
        displayMessage(warEnlistedStatus, 'Error', true);
        displayMessage(warNextChainTimeStatus, 'Error', true);
        displayMessage(factionAnnouncementsDisplay, 'Error loading announcements.', true);
    }
}

// Function to populate the Faction Versus Section
function populateFactionVersusSection() {
    if (factionVersusSectionEl && currentUserFaction) { // Ensure elements and user faction data exist
        // Check if there's an active war with an enemy faction
        if (currentEnemyFaction && currentEnemyFaction.faction_id && currentUserFaction.id) {
            factionVersusSectionEl.style.display = 'flex'; // Show the section

            // Populate Faction 1 (User's Faction)
            if (factionOneNameEl) factionOneNameEl.textContent = currentUserFaction.name || 'Your Faction';
            if (factionOneMembersEl) factionOneMembersEl.textContent = currentUserFaction.members?.total || 'N/A';
            if (factionOnePicEl) factionOnePicEl.src = currentUserFaction.image || 'https://dummyimage.com/100x100/333/fff&text=F1'; // Default placeholder
            if (factionOnePicEl) factionOnePicEl.alt = currentUserFaction.name || 'Faction 1 Logo';

            // Populate Faction 2 (Enemy Faction)
            if (factionTwoNameEl) factionTwoNameEl.textContent = currentEnemyFaction.name || 'Enemy Faction';
            if (factionTwoMembersEl) factionTwoMembersEl.textContent = currentEnemyFaction.members?.total || 'N/A';
            if (factionTwoPicEl) factionTwoPicEl.src = currentEnemyFaction.image || 'https://dummyimage.com/100x100/333/fff&text=F2'; // Default placeholder
            if (factionTwoPicEl) factionTwoPicEl.alt = currentEnemyFaction.name || 'Faction 2 Logo';

            // Update "Vs" text (already in HTML, no change needed unless dynamic styling)
            if (versusTextEl) versusTextEl.textContent = 'Vs';

        } else {
            // If not in a war, or no enemy faction data
            factionVersusSectionEl.style.display = 'none'; // Hide the section
            // Optionally display a message:
            // if (factionVersusSectionEl) factionVersusSectionEl.innerHTML = '<p style="text-align:center; color:#ccc;">Not currently in a ranked war.</p>';
        }
    } else if (factionVersusSectionEl) {
        factionVersusSectionEl.style.display = 'none'; // Hide if no user faction data
    }
}

// Function to populate the War Status Display Box on Announcements Tab
function populateWarStatusDisplay(apiData) {
    if (!apiData || !apiData.faction) {
        console.warn("API data for war status display is missing.");
        displayMessage(warEnlistedStatus, 'N/A');
        displayMessage(warTermedStatus, 'N/A');
        displayMessage(warTermedWinLoss, 'N/A');
        displayMessage(warChainingStatus, 'N/A');
        displayMessage(warNoFlyingStatus, 'N/A');
        displayMessage(warTurtleStatus, 'N/A');
        displayMessage(warNextChainTimeStatus, 'N/A');
        return;
    }

    const war = apiData.faction.war; // Access the 'war' object within faction data
    const basicStatus = apiData.basic.status; // Access user's basic status (e.g., in_hospital)

    if (war) {
        // These might come from 'war' object or from general 'status'
        displayMessage(warEnlistedStatus, war.enlisted === true ? 'Yes' : 'No');
        displayMessage(warTermedStatus, war.termed === true ? 'Yes' : 'No');
        displayMessage(warTermedWinLoss, war.termed_win_loss || 'N/A'); // Assuming API provides this string/value
        displayMessage(warChainingStatus, war.chaining === true ? 'Yes' : 'No'); // Assuming API provides this
        displayMessage(warNoFlyingStatus, war.no_flying === true ? 'Yes' : 'No'); // Assuming API provides this
        displayMessage(warTurtleStatus, war.turtle_mode === true ? 'Yes' : 'No'); // Assuming API provides this

        // Next Planned Chain Time - This needs to come from an API field if available
        // Example: if API provides 'war.next_chain_start_timestamp' or 'war.next_chain_time_remaining'
        const nextChainTime = war.next_chain_start || 'N/A'; // Placeholder API field
        if (nextChainTime !== 'N/A' && typeof nextChainTime === 'number') {
             // If it's a timestamp, format it. If it's seconds remaining, format as time remaining.
             // For now, if it's a raw timestamp from API, convert to readable time or format.
             // Assuming a simple value or a countdown would be provided by a Netlify function.
             displayMessage(warNextChainTimeStatus, nextChainTime);
        } else {
             displayMessage(warNextChainTimeStatus, nextChainTime); // Display N/A or actual value
        }

    } else {
        console.warn("War data not found in API response.");
        displayMessage(warEnlistedStatus, 'N/A');
        displayMessage(warTermedStatus, 'N/A');
        displayMessage(warTermedWinLoss, 'N/A');
        displayMessage(warChainingStatus, 'N/A');
        displayMessage(warNoFlyingStatus, 'N/A');
        displayMessage(warTurtleStatus, 'N/A');
        displayMessage(warNextChainTimeStatus, 'N/A');
    }
}

// Function to populate the Faction Announcements Display Box on Announcements Tab
async function populateFactionAnnouncementsDisplay() {
    try {
        const doc = await db.collection('factionWars').doc('currentWar').get();
        if (doc.exists) {
            const announcement = doc.data().quickAnnouncement || 'No current announcements.';
            displayMessage(factionAnnouncementsDisplay, announcement); // Using direct element reference
        } else {
            displayMessage(factionAnnouncementsDisplay, 'No war document found for announcements.');
        }
    } catch (error) {
        console.error('Error loading faction announcements for display:', error);
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
            displayMessage(gamePlanDisplay, gamePlan); // Using direct element reference
        } else {
            displayMessage(gamePlanDisplay, 'No war document found.');
        }
    } catch (error) {
        console.error('Error loading game plan:', error);
        displayMessage(gamePlanDisplay, 'Error loading game plan.', true);
    }
}

// Copy Game Plan button
if (copyGamePlanBtn) { // Check if element exists before adding listener
    copyGamePlanBtn.addEventListener('click', async () => {
        const gamePlanText = gamePlanDisplay.textContent; // Using direct element reference
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
    // Example: Fetch from Firebase or a Netlify Function
    if (chainTimerDisplay) displayMessage(chainTimerDisplay, '00:00:00'); // Placeholder
}

// Load enemy chain timer
async function loadEnemyChainTimer() {
    // Implement logic to fetch and display the enemy chain timer
    // Example: Fetch from Firebase or a Netlify Function
    if (enemyChainTimerDisplay) displayMessage(enemyChainTimerDisplay, '00:00:00'); // Placeholder
}

// Post Announcement button (Now on Leader Config tab)
if (postAnnouncementBtn) { // Check if element exists before adding listener
    postAnnouncementBtn.addEventListener('click', async () => {
        const message = quickAnnouncementInput.value; // Using direct element reference
        if (message.trim() !== '') {
            // Implement logic to post the announcement to Firestore
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
        // Implement logic to fetch and display quick FF targets
        // Example: Call a Netlify Function (fetch-fairfight-data.js)
        const targets = ['Target 1', 'Target 2', 'Target 3']; // Placeholder
        if (quickFFTargetsDisplay) { // Check if element exists
            const targetList = targets.map(target => `<span>${target}</span>`).join(''); // Using span for consistency with HTML
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
        // Implement logic to fetch and display the enemy targets list
        // Example: Call a Netlify Function (get-recommended-targets.js), integrate hospital timers, attack pop-ups, claim logic
        const targets = [{ name: 'Enemy 1 [123]', ff: 80, difficulty: 'Easy', estStats: '10k', hospital: '00:10:00', canAttack: true, canClaim: true }, /* ... */]; // Placeholder
        if (enemyTargetsList) { // Check if element exists
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
    // Example: Fetch from Firebase or a Netlify Function
    if (totalFactionEnergy) displayMessage(totalFactionEnergy, '1000'); // Placeholder
    if (totalPotentialHits) displayMessage(totalPotentialHits, '50'); // Placeholder
    if (chainProgressDisplay) displayMessage(chainProgressDisplay, '500/1000'); // Placeholder
}

// --- Tab 3: Friendly Faction Member Status ---

// Load Friendly Members List
async function loadFriendlyMembers() {
    try {
        // Implement logic to fetch and display friendly member status
        // Example: Fetch from Firebase
        const members = [{ name: 'Member 1', energy: 100, hospital: '00:05:00' }, /* ... */]; // Placeholder
        if (friendlyMembersList) { // Check if element exists
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
            if (gamePlanEditArea) gamePlanEditArea.value = gamePlan; // Using direct element reference
        }
    } catch (error) {
        console.error('Error loading game plan for edit:', error);
        if (gamePlanEditArea) displayMessage(gamePlanEditArea, 'Error loading game plan.', true);
    }
}

// Save Game Plan
if (saveGamePlanBtn) { // Check if element exists before adding listener
    saveGamePlanBtn.addEventListener('click', async () => {
        const newGamePlan = gamePlanEditArea.value; // Using direct element reference
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

// Placeholder for missing HTML elements (from old HTML, now moved or refactored)
// These handlers will not run if the elements don't exist in the current HTML.
// Add to Watchlist
// document.getElementById('addWatchEnemyBtn').addEventListener('click', () => { /* ... */ });
// Add Designated Admin
// document.getElementById('addDesignateAdminBtn').addEventListener('click', () => { /* ... */ });


// Load Energy Tracking Members
async function loadEnergyTrackMembers() {
    try {
        // Implement logic to fetch faction members and populate the select
        const members = [{ uid: 'user1', name: 'Member 1' }, { uid: 'user2', name: 'Member 2' }, /* ... */]; // Placeholder
        if (energyTrackMemberSelect) { // Check if element exists
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
if (saveEnergyTrackMembersBtn) { // Check if element exists before adding listener
    saveEnergyTrackMembersBtn.addEventListener('click', () => {
        const selectedMembers = Array.from(energyTrackMemberSelect.selectedOptions) // Using direct element reference
            .map(option => option.value);
        // Implement logic to save the selected member UIDs
        console.log('Saving energy tracking members:', selectedMembers);
        alert('Energy tracking members saved!');
    });
}


// --- Initialization on DOMContentLoaded and Auth State Change ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("war_page_hub.js: DOMContentLoaded event fired.");

    // Tab switching logic (already there, just wrapped for clarity)
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
                        await initializeWarHubWithApiData(user, apiKey);
                    } else {
                        console.warn("No API key found for current user in Firestore. Cannot fetch Torn API data.");
                        if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = "Faction War Hub. (API Key Needed)";
                        if (factionVersusSectionEl) factionVersusSectionEl.style.display = 'none';
                        // Clear placeholders or show relevant messages for other elements
                        displayMessage(gamePlanDisplay, 'API key needed.');
                        displayMessage(warEnlistedStatus, 'N/A'); // Clear status
                        // ... more clearances for other sections ...
                    }
                } else {
                    console.warn("User profile not found in Firestore. Cannot fetch Torn API data.");
                    if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = "Faction War Hub. (Profile Incomplete)";
                    if (factionVersusSectionEl) factionVersusSectionEl.style.display = 'none';
                    displayMessage(gamePlanDisplay, 'Complete profile.');
                }
            } catch (e) {
                console.error("Error getting user profile for API key:", e);
                if (factionWarHubTitleEl) factionWarHubTitleTitleEl.textContent = "Faction War Hub. (Error Loading)";
                if (factionVersusSectionEl) factionVersusSectionEl.style.display = 'none';
                displayMessage(gamePlanDisplay, 'Error loading data.', true);
            }
        } else {
            console.log("User not logged in. War Hub not initialized.");
            if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = "Faction War Hub. (Please Login)";
            if (factionVersusSectionEl) factionVersusSectionEl.style.display = 'none';
            // Clear all dynamic data when logged out
            displayMessage(gamePlanDisplay, 'Please log in to see war data.');
            displayMessage(warEnlistedStatus, 'N/A'); // Clear status
            // ... clear other sections ...
        }
    });
});