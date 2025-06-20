/* ==========================================================================
   War Page Hub JavaScript (war_page_hub.js)
   ========================================================================== */

// --- Global Variables and Utility Functions ---

// Firebase references (assuming firebase-init.js is included correctly)
const db = firebase.firestore();
const auth = firebase.auth();

// --- DOM Element Getters ---
// Existing getters
const tabButtons = document.querySelectorAll('.tab-button');
const gamePlanDisplay = document.getElementById('gamePlanDisplay');
const warTermedStatus = document.getElementById('warTermedStatus');
const warTermedWinLoss = document.getElementById('warTermedWinLoss');
const warChainingStatus = document.getElementById('warChainingStatus');
const warNoFlyingStatus = document.getElementById('warNoFlyingStatus');
const warTurtleStatus = document.getElementById('warTurtleStatus');
const copyGamePlanBtn = document.getElementById('copyGamePlanBtn');
const chainTimerDisplay = document.getElementById('chainTimerDisplay');
const enemyChainTimerDisplay = document.getElementById('enemyChainTimerDisplay');
const postAnnouncementBtn = document.getElementById('postAnnouncementBtn');
const quickAnnouncementInput = document.getElementById('quickAnnouncementInput');
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

// New elements for Faction War Hub Title
const factionWarHubTitleEl = document.getElementById('factionWarHubTitle');

// New elements for Faction Versus Section
const factionOneNameEl = document.getElementById('factionOneName');
const factionOneMembersEl = document.getElementById('factionOneMembers');
const factionOnePicEl = document.getElementById('factionOnePic');
const versusTextEl = document.querySelector('.versus-text');
const factionTwoNameEl = document.getElementById('factionTwoName');
const factionTwoMembersEl = document.getElementById('factionTwoMembers');
const factionTwoPicEl = document.getElementById('factionTwoPic');
const factionVersusSectionEl = document.querySelector('.faction-versus-section');

// New elements for War Status Display on Announcements tab
const warEnlistedStatus = document.getElementById('warEnlistedStatus');
const warNextChainTimeStatus = document.getElementById('warNextChainTimeStatus');
const factionAnnouncementsDisplay = document.getElementById('factionAnnouncementsDisplay');

// Getters for the War Status Controls on Leader Config Tab
const saveWarStatusBtn = document.getElementById('saveWarStatusControlsBtn');
const toggleEnlisted = document.getElementById('toggleEnlisted');
const toggleTermedWar = document.getElementById('toggleTermedWar');
const toggleTermedWinLoss = document.getElementById('toggleTermedWinLoss');
const toggleChaining = document.getElementById('toggleChaining');
const toggleNoFlying = document.getElementById('toggleNoFlying');
const toggleTurtleMode = document.getElementById('toggleTurtleMode');
const nextChainTimeInput = document.getElementById('nextChainTimeInput');
// *** ADDED *** Getter for the enemy faction ID input
const enemyFactionIDInput = document.getElementById('enemyFactionIDInputLeaderConfig');

// *** ADDED *** Getters for the new member selection lists and their save buttons
const designateAdminsContainer = document.getElementById('designateAdminsContainer');
const energyTrackingContainer = document.getElementById('energyTrackingContainer');
const saveAdminsBtn = document.getElementById('saveAdminsBtn');
// The saveEnergyTrackMembersBtn getter was already present in your original code
const saveEnergyTrackMembersBtn = document.getElementById('saveEnergyTrackMembersBtn');


// --- Global API Data Storage ---
let factionApiFullData = null;
let enemyFactionBasicData = null;
// *** ADDED *** Global variable to hold the API key once logged in
let userApiKey = null;


// --- Utility Functions ---

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

function displayMessage(element, message, isError = false) {
    if (element) {
        element.textContent = message;
        element.style.color = isError ? 'red' : '';
    }
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy: ', err);
        return false;
    }
}

function formatTime(seconds) {
    if (typeof seconds !== 'number' || seconds <= 0) return "N/A";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getFactionImageUrl(imageFileName) {
    if (imageFileName) {
        return `https://www.torn.com/factions.php?image=${imageFileName}`;
    }
    return ''; // Return empty string if no image
}

function countFactionMembers(membersObject) {
    if (membersObject && typeof membersObject === 'object' && !membersObject.total) {
        return Object.keys(membersObject).length;
    } else if (membersObject && typeof membersObject.total === 'number') {
        return membersObject.total;
    }
    return 0;
}


// *** ADDED *** Function to populate the new member selection lists
function populateMemberSelectionLists(members, savedAdmins = [], savedEnergyMembers = []) {
    if (!members || typeof members !== 'object') return;

    if (designateAdminsContainer) designateAdminsContainer.innerHTML = '';
    if (energyTrackingContainer) energyTrackingContainer.innerHTML = '';

    const sortedMemberIds = Object.keys(members).sort((a, b) => members[a].name.localeCompare(members[b].name));

    for (const memberId of sortedMemberIds) {
        const member = members[memberId];
        const isAdminChecked = savedAdmins.includes(memberId) ? 'checked' : '';
        const isEnergyChecked = savedEnergyMembers.includes(memberId) ? 'checked' : '';

        const adminItemHtml = `<div class="member-selection-item">
            <input type="checkbox" id="admin-member-${memberId}" value="${memberId}" ${isAdminChecked}>
            <label for="admin-member-${memberId}">${member.name}</label>
        </div>`;
        const energyItemHtml = `<div class="member-selection-item">
            <input type="checkbox" id="energy-member-${memberId}" value="${memberId}" ${isEnergyChecked}>
            <label for="energy-member-${memberId}">${member.name}</label>
        </div>`;

        if (designateAdminsContainer) designateAdminsContainer.insertAdjacentHTML('beforeend', adminItemHtml);
        if (energyTrackingContainer) energyTrackingContainer.insertAdjacentHTML('beforeend', energyItemHtml);
    }
}

// *** ADDED *** Function to fetch and display enemy faction data manually
async function fetchAndDisplayEnemyFaction(factionID, apiKey) {
    if (!factionID || !apiKey) {
        factionTwoNameEl.textContent = 'No Enemy Set';
        factionTwoMembersEl.textContent = 'N/A';
        if (factionTwoPicEl) factionTwoPicEl.style.backgroundImage = '';
        return;
    }
    try {
        const enemyApiUrl = `https://api.torn.com/faction/${factionID}?selections=basic&key=${apiKey}&comment=MyTornPA_EnemyFaction`;
        const response = await fetch(enemyApiUrl);
        const enemyData = await response.json();
        if (enemyData.error) throw new Error(enemyData.error);

        factionTwoNameEl.textContent = enemyData.name || 'Unknown Faction';
        factionTwoMembersEl.textContent = `Members: ${countFactionMembers(enemyData.members) || 'N/A'}`;
        if (factionTwoPicEl) factionTwoPicEl.style.backgroundImage = `url('${getFactionImageUrl(enemyData.tag_image)}')`;
    } catch (error) {
        console.error('Error fetching enemy faction data:', error);
        factionTwoNameEl.textContent = 'Invalid Enemy ID';
        factionTwoMembersEl.textContent = 'N/A';
    }
}


// --- Main Torn API Data Fetching and Population (For Faction Title & Vs Box) ---

async function initializeWarHubApiData(user, apiKey) {
    if (!apiKey) {
        console.warn("API Key not available for war hub data fetching.");
        if (factionVersusSectionEl) factionVersusSectionEl.style.display = 'none';
        if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = 'Faction War Hub. (API Key Needed)';
        return;
    }
    try {
        const userFactionApiUrl = `https://api.torn.com/faction/?selections=basic,members&key=${apiKey}&comment=MyTornPA_WarHub_UserFactionData`;
        const userFactionResponse = await fetch(userFactionApiUrl);
        const userFactionData = await userFactionResponse.json();
        if (userFactionData.error) {
            throw new Error(`Torn API User Faction Error: ${userFactionData.error}`);
        }
        factionApiFullData = userFactionData;

        const usersFactionName = factionApiFullData?.name || "Your Faction";
        if (factionWarHubTitleEl) {
            factionWarHubTitleEl.textContent = `${usersFactionName}'s War Hub.`;
        }
        
        // *** ADDED *** Fetch Firestore data here to get saved member lists
        const warDoc = await db.collection('factionWars').doc('currentWar').get();
        const warData = warDoc.exists ? warDoc.data() : {};

        // *** ADDED *** Call the function to populate member lists
        populateMemberSelectionLists(factionApiFullData.members, warData.tab4Admins, warData.energyTrackingMembers);
        
        // *** ADDED *** Load manual enemy faction if it exists
        if (warData.enemyFactionID) {
            await fetchAndDisplayEnemyFaction(warData.enemyFactionID, apiKey);
        } else {
             // Logic for active ranked war (fallback)
            const activeRankedWarEntry = Object.values(factionApiFullData.ranked_wars || {}).find(warEntry => warEntry.war?.end === 0);
            const opponentFactionId = activeRankedWarEntry?.opponent_faction_id;
            if (opponentFactionId) {
                await fetchAndDisplayEnemyFaction(opponentFactionId, apiKey);
            }
        }

        populateFactionVersusSection(); // This will now mainly populate the user's side
        loadGamePlan();
        populateWarStatusDisplay();
        populateFactionAnnouncementsDisplay();
        loadChainTimer();
        loadEnemyChainTimer();
        loadGamePlanForEdit();
        loadWarStatusForEdit();

    } catch (error) {
        console.error("Error initializing Torn API data for War Hub:", error);
    }
}

function populateFactionVersusSection() {
    if (factionVersusSectionEl && factionApiFullData) {
        const userFaction = factionApiFullData;
        if (factionOneNameEl) factionOneNameEl.textContent = userFaction.name || 'Your Faction';
        if (factionOneMembersEl) factionOneMembersEl.textContent = `Members: ${countFactionMembers(userFaction.members) || 'N/A'}`;
        if (factionOnePicEl) factionOnePicEl.style.backgroundImage = `url('${getFactionImageUrl(userFaction.tag_image)}')`;
    }
}


// --- Firestore Data Loading ---

async function populateWarStatusDisplay() {
    try {
        const doc = await db.collection('factionWars').doc('currentWar').get();
        if (doc.exists) {
            const warData = doc.data();
            displayMessage(warEnlistedStatus, warData.toggleEnlisted ? 'Yes' : 'No');
            displayMessage(warTermedStatus, warData.toggleTermedWar ? 'Yes' : 'No');
            displayMessage(warTermedWinLoss, warData.toggleTermedWinLoss ? 'Win' : 'Loss');
            displayMessage(warChainingStatus, warData.toggleChaining ? 'Yes' : 'No');
            displayMessage(warNoFlyingStatus, warData.toggleNoFlying ? 'Yes' : 'No');
            displayMessage(warTurtleStatus, warData.toggleTurtleMode ? 'Yes' : 'No');
            displayMessage(warNextChainTimeStatus, warData.nextChainTimeInput || 'N/A');
        }
    } catch (error) {
        console.error('Error loading war status from Firestore:', error);
    }
}

async function populateFactionAnnouncementsDisplay() {
    try {
        const doc = await db.collection('factionWars').doc('currentWar').get();
        if (doc.exists) {
            const announcement = doc.data().quickAnnouncement || 'No current announcements.';
            displayMessage(factionAnnouncementsDisplay, announcement);
        }
    } catch (error) {
        console.error('Error loading faction announcements:', error);
    }
}

async function loadGamePlan() {
    try {
        const doc = await db.collection('factionWars').doc('currentWar').get();
        if (doc.exists) {
            const gamePlan = doc.data().gamePlan || 'No game plan available.';
            displayMessage(gamePlanDisplay, gamePlan);
        }
    } catch (error) {
        console.error('Error loading game plan from Firestore:', error);
    }
}


// --- Placeholder Functions (Unchanged) ---
async function loadChainTimer() { if (chainTimerDisplay) displayMessage(chainTimerDisplay, '00:00:00'); }
async function loadEnemyChainTimer() { if (enemyChainTimerDisplay) displayMessage(enemyChainTimerDisplay, '00:00:00'); }
// These functions were removed as they were placeholders and their logic is now integrated above
// async function loadFriendlyMembers() {}
// async function loadEnergyTrackMembers() {}


// --- Event Listeners ---

if (copyGamePlanBtn) {
    copyGamePlanBtn.addEventListener('click', async () => { /* ... unchanged ... */ });
}

if (postAnnouncementBtn) {
    postAnnouncementBtn.addEventListener('click', async () => {
        const message = quickAnnouncementInput.value;
        if (message.trim() !== '') {
            try {
                await db.collection('factionWars').doc('currentWar').set({
                    quickAnnouncement: message,
                    quickAnnouncementTimestamp: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                alert('Announcement posted!');
                quickAnnouncementInput.value = '';
                populateFactionAnnouncementsDisplay();
            } catch (error) {
                console.error('Error posting announcement:', error);
                alert('Error posting announcement.');
            }
        }
    });
}

if (saveGamePlanBtn) {
    saveGamePlanBtn.addEventListener('click', async () => {
        const newGamePlan = gamePlanEditArea.value;
        try {
            await db.collection('factionWars').doc('currentWar').set({ gamePlan: newGamePlan }, { merge: true });
            loadGamePlan();
            alert('Game plan saved!');
        } catch (error) {
            console.error('Error saving game plan:', error);
            alert('Error saving game plan.');
        }
    });
}

async function loadGamePlanForEdit() {
    try {
        const doc = await db.collection('factionWars').doc('currentWar').get();
        if (doc.exists) {
            const gamePlan = doc.data().gamePlan || '';
            if (gamePlanEditArea) gamePlanEditArea.value = gamePlan;
        }
    } catch (error) {
        console.error('Error loading game plan for edit:', error);
    }
}

async function loadWarStatusForEdit() {
    try {
        const doc = await db.collection('factionWars').doc('currentWar').get();
        if (doc.exists && doc.data()) {
            const warData = doc.data();
            if (toggleEnlisted) toggleEnlisted.checked = warData.toggleEnlisted || false;
            if (toggleTermedWar) toggleTermedWar.checked = warData.toggleTermedWar || false;
            if (toggleChaining) toggleChaining.checked = warData.toggleChaining || false;
            if (toggleNoFlying) toggleNoFlying.checked = warData.toggleNoFlying || false;
            if (toggleTurtleMode) toggleTurtleMode.checked = warData.toggleTurtleMode || false;
            if (toggleTermedWinLoss) toggleTermedWinLoss.checked = warData.toggleTermedWinLoss || false;
            if (nextChainTimeInput) nextChainTimeInput.value = warData.nextChainTimeInput || '';
            // *** ADDED *** Load the saved enemy faction ID into the input box
            if (enemyFactionIDInput) enemyFactionIDInput.value = warData.enemyFactionID || '';
        }
    } catch (error) {
        console.error('Error loading war status for editing:', error);
    }
}

if (saveWarStatusBtn) {
    saveWarStatusBtn.addEventListener('click', async () => {
        const enemyId = enemyFactionIDInput.value.trim();
        const statusData = {
            toggleEnlisted: toggleEnlisted.checked,
            toggleTermedWar: toggleTermedWar.checked,
            toggleChaining: toggleChaining.checked,
            toggleNoFlying: toggleNoFlying.checked,
            toggleTurtleMode: toggleTurtleMode.checked,
            toggleTermedWinLoss: toggleTermedWinLoss.checked,
            nextChainTimeInput: nextChainTimeInput.value,
            // *** ADDED *** Save the enemy faction ID to Firestore
            enemyFactionID: enemyId,
            statusLastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            await db.collection('factionWars').doc('currentWar').set(statusData, { merge: true });
            populateWarStatusDisplay();
            // *** ADDED *** Fetch and display the enemy data immediately on save
            if (enemyId) {
                await fetchAndDisplayEnemyFaction(enemyId, userApiKey);
            }
            alert('War status saved successfully!');
        } catch (error) {
            console.error('Error saving war status:', error);
            alert('An error occurred while saving the war status.');
        }
    });
}

// *** ADDED *** Event listener for the "Save Admins" button
if (saveAdminsBtn) {
    saveAdminsBtn.addEventListener('click', async () => {
        const selectedAdminIds = Array.from(designateAdminsContainer.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
        try {
            await db.collection('factionWars').doc('currentWar').set({ tab4Admins: selectedAdminIds }, { merge: true });
            alert('Admins saved successfully!');
        } catch (error) {
            console.error("Error saving admins:", error);
            alert("Failed to save admins.");
        }
    });
}

// *** ADDED *** Event listener for the "Save Selections" (Energy Tracking) button
if (saveEnergyTrackMembersBtn) {
    saveEnergyTrackMembersBtn.addEventListener('click', async () => {
        const selectedEnergyMemberIds = Array.from(energyTrackingContainer.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
         try {
            await db.collection('factionWars').doc('currentWar').set({ energyTrackingMembers: selectedEnergyMemberIds }, { merge: true });
            alert('Energy tracking members saved successfully!');
        } catch (error) {
            console.error("Error saving energy tracking members:", error);
            alert("Failed to save energy tracking members.");
        }
    });
}


// --- Initialization on DOMContentLoaded and Auth State Change ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("war_page_hub.js: DOMContentLoaded event fired.");

    tabButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const tabId = event.currentTarget.dataset.tab + '-tab';
            showTab(tabId);
        });
    });
    showTab('announcements-tab');

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
                        // *** ADDED *** Set the global API key variable
                        userApiKey = apiKey;
                        await initializeWarHubApiData(user, apiKey);
                    } else {
                        console.warn("No API key found for current user in Firestore.");
                    }
                } else {
                    console.warn("User profile not found in Firestore.");
                }
            } catch (e) {
                console.error("Error getting user profile for API key:", e);
            }
        } else {
            console.log("User not logged in. War Hub not initialized.");
            userApiKey = null; // Clear the key on logout
        }
    });
});