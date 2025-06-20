/* ==========================================================================
   War Page Hub JavaScript (war_page_hub.js)
   ========================================================================== */

// --- Global Variables and Utility Functions ---

// Firebase references (assuming firebase-init.js is included correctly)
const db = firebase.firestore();
const auth = firebase.auth();

// --- DOM Element Getters ---
const tabButtons = document.querySelectorAll('.tab-button');
const gamePlanDisplay = document.getElementById('gamePlanDisplay');
const warEnlistedStatus = document.getElementById('warEnlistedStatus');
const warTermedStatus = document.getElementById('warTermedStatus');
const warTermedWinLoss = document.getElementById('warTermedWinLoss');
const warChainingStatus = document.getElementById('warChainingStatus');
const warNoFlyingStatus = document.getElementById('warNoFlyingStatus');
const warTurtleStatus = document.getElementById('warTurtleStatus');
const warNextChainTimeStatus = document.getElementById('warNextChainTimeStatus');
const copyGamePlanBtn = document.getElementById('copyGamePlanBtn');
const chainTimerDisplay = document.getElementById('chainTimerDisplay');
const enemyChainTimerDisplay = document.getElementById('enemyChainTimerDisplay');
const postAnnouncementBtn = document.getElementById('postAnnouncementBtn');
const quickAnnouncementInput = document.getElementById('quickAnnouncementInput');
const quickFFTargetsDisplay = document.getElementById('quickFFTargetsDisplay');
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

// Leader Config Tab Getters
const factionWarHubTitleEl = document.getElementById('factionWarHubTitle');
const factionAnnouncementsDisplay = document.getElementById('factionAnnouncementsDisplay');
const saveWarStatusControlsBtn = document.getElementById('saveWarStatusControlsBtn');
const toggleEnlisted = document.getElementById('toggleEnlisted');
const toggleTermedWar = document.getElementById('toggleTermedWar');
const toggleTermedWinLoss = document.getElementById('toggleTermedWinLoss');
const toggleChaining = document.getElementById('toggleChaining');
const toggleNoFlying = document.getElementById('toggleNoFlying');
const toggleTurtleMode = document.getElementById('toggleTurtleMode');
const nextChainTimeInput = document.getElementById('nextChainTimeInput');
const enemyFactionIDInput = document.getElementById('enemyFactionIDInputLeaderConfig');

// Faction Versus Section Getters
const factionOneNameEl = document.getElementById('factionOneName');
const factionOneMembersEl = document.getElementById('factionOneMembers');
const factionOnePicEl = document.getElementById('factionOnePic');
const versusTextEl = document.querySelector('.versus-text');
const factionTwoNameEl = document.getElementById('factionTwoName');
const factionTwoMembersEl = document.getElementById('factionTwoMembers');
const factionTwoPicEl = document.getElementById('factionTwoPic');
const factionVersusSectionEl = document.querySelector('.faction-versus-section');

// *** NEW ***: Getters for the new member selection containers
const designateAdminsContainer = document.getElementById('designateAdminsContainer');
const energyTrackingContainer = document.getElementById('energyTrackingContainer');
const saveAdminsBtn = document.getElementById('saveAdminsBtn');
const saveEnergyTrackMembersBtn = document.getElementById('saveEnergyTrackMembersBtn');


// --- Global API Data Storage ---
let factionApiFullData = null; // Will store the full response from the user's faction API call (basic, ranked_wars)


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

function getFactionImageUrl(imageFileName) {
    if (imageFileName) {
        return `https://www.torn.com/factions.php?image=${imageFileName}`;
    }
    return 'https://dummyimage.com/100x100/333/fff&text=No+Logo';
}

function countFactionMembers(membersObject) {
    if (!membersObject) return 0;
    if (typeof membersObject.total === 'number') {
        return membersObject.total;
    }
    if (typeof membersObject === 'object') {
        return Object.keys(membersObject).length;
    }
    return 0;
}


// --- Main Data Loading and Population ---

async function initializeWarHubApiData(user, apiKey) {
    if (!apiKey) {
        console.warn("API Key not available.");
        if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = 'Faction War Hub. (API Key Needed)';
        return;
    }

    try {
        const userFactionApiUrl = `https://api.torn.com/faction/?selections=basic,members&key=${apiKey}&comment=MyTornPA_WarHub`;
        const userFactionResponse = await fetch(userFactionApiUrl);
        const userFactionData = await userFactionResponse.json();

        if (userFactionData.error) {
            throw new Error(`Torn API Error: ${userFactionData.error}`);
        }
        factionApiFullData = userFactionData;

        // Populate Main Title
        if (factionWarHubTitleEl) {
            factionWarHubTitleEl.textContent = `${factionApiFullData.name || "Your Faction"}'s War Hub.`;
        }

        // Populate Faction 1 (User's Faction) in Versus Box
        if (factionOneNameEl) factionOneNameEl.textContent = factionApiFullData.name || 'Your Faction';
        if (factionOneMembersEl) factionOneMembersEl.textContent = `Total Members: ${countFactionMembers(factionApiFullData.members) || 'N/A'}`;
        if (factionOnePicEl) factionOnePicEl.style.backgroundImage = `url('${getFactionImageUrl(factionApiFullData.tag_image)}')`;


        // --- *** NEW (Request 2) ***: Populate the member selection lists ---
        if (factionApiFullData.members) {
            populateMemberSelectionLists(factionApiFullData.members);
        }
        // ----------------------------------------------------------------

        // Load data from Firestore
        await loadDataFromFirestore(apiKey);

    } catch (error) {
        console.error("Error initializing Torn API data for War Hub:", error);
        if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = `Error Loading War Hub.`;
    }
}

async function loadDataFromFirestore(apiKey) {
    try {
        const doc = await db.collection('factionWars').doc('currentWar').get();
        if (!doc.exists) {
            console.log("No 'currentWar' document found. Displaying defaults.");
            // Display defaults if no document exists
            displayMessage(factionTwoNameEl, 'No Enemy Set');
            displayMessage(factionTwoMembersEl, 'N/A');
            return;
        }

        const warData = doc.data();

        // Populate Game Plan, Announcements, and War Status
        displayMessage(gamePlanDisplay, warData.gamePlan || 'No game plan available.');
        displayMessage(factionAnnouncementsDisplay, warData.quickAnnouncement || 'No current announcements.');
        if (gamePlanEditArea) gamePlanEditArea.value = warData.gamePlan || '';
        
        // Populate War Status on main tab
        populateWarStatusDisplay(warData);
        // Populate controls on leader tab
        loadWarStatusForEdit(warData);

        // Fetch and display enemy faction data if an ID is stored
        if (warData.enemyFactionID && apiKey) {
            await fetchAndDisplayEnemyFaction(warData.enemyFactionID, apiKey);
        } else {
            displayMessage(factionTwoNameEl, 'No Enemy Set');
            displayMessage(factionTwoMembersEl, 'N/A');
        }
    } catch (error) {
        console.error("Error loading data from Firestore:", error);
    }
}


// --- *** NEW (Request 1) ***: Function to fetch and display enemy faction data
async function fetchAndDisplayEnemyFaction(factionID, apiKey) {
    if (!factionID) {
        console.log("No faction ID provided to fetch.");
        return;
    }
    try {
        const enemyApiUrl = `https://api.torn.com/faction/${factionID}?selections=basic&key=${apiKey}&comment=MyTornPA_EnemyFaction`;
        const response = await fetch(enemyApiUrl);
        const enemyData = await response.json();

        if (enemyData.error) {
            throw new Error(enemyData.error);
        }

        if (factionTwoNameEl) factionTwoNameEl.textContent = enemyData.name || 'Unknown Faction';
        if (factionTwoMembersEl) factionTwoMembersEl.textContent = `Total Members: ${countFactionMembers(enemyData.members) || 'N/A'}`;
        if (factionTwoPicEl) factionTwoPicEl.style.backgroundImage = `url('${getFactionImageUrl(enemyData.tag_image)}')`;

    } catch (error) {
        console.error('Error fetching enemy faction data:', error);
        displayMessage(factionTwoNameEl, 'Invalid Enemy ID');
        displayMessage(factionTwoMembersEl, 'N/A');
    }
}


// --- *** NEW (Request 2) ***: Function to create member lists with checkboxes
function populateMemberSelectionLists(members) {
    if (!members || typeof members !== 'object') {
        return;
    }

    // Clear existing content
    if (designateAdminsContainer) designateAdminsContainer.innerHTML = '';
    if (energyTrackingContainer) energyTrackingContainer.innerHTML = '';

    const memberIds = Object.keys(members);
    memberIds.sort((a, b) => members[a].name.localeCompare(members[b].name)); // Sort members alphabetically

    for (const memberId of memberIds) {
        const member = members[memberId];
        const-member-item-html = `
            <div class="member-selection-item">
                <input type="checkbox" id="admin-member-${memberId}" value="${memberId}">
                <label for="admin-member-${memberId}">${member.name}</label>
            </div>
        `;
        
        const energyItemHtml = `
            <div class="member-selection-item">
                <input type="checkbox" id="energy-member-${memberId}" value="${memberId}">
                <label for="energy-member-${memberId}">${member.name}</label>
            </div>
        `;

        if (designateAdminsContainer) {
            designateAdminsContainer.insertAdjacentHTML('beforeend', adminItemHtml);
        }
        if (energyTrackingContainer) {
            energyTrackingContainer.insertAdjacentHTML('beforeend', energyItemHtml);
        }
    }
}


// Function to populate the War Status Display Box on Announcements Tab
function populateWarStatusDisplay(warData = {}) {
    displayMessage(warEnlistedStatus, warData.toggleEnlisted ? 'Yes' : 'No');
    displayMessage(warTermedStatus, warData.toggleTermedWar ? 'Yes' : 'No');
    displayMessage(warTermedWinLoss, warData.toggleTermedWinLoss ? 'Win' : 'Loss'); // Assuming checkbox means win
    displayMessage(warChainingStatus, warData.toggleChaining ? 'Yes' : 'No');
    displayMessage(warNoFlyingStatus, warData.toggleNoFlying ? 'Yes' : 'No');
    displayMessage(warTurtleStatus, warData.toggleTurtleMode ? 'Yes' : 'No');
    displayMessage(warNextChainTimeStatus, warData.nextChainTimeInput || 'N/A');
}

// Function to load the current war status into the controls on the Leader Config tab
function loadWarStatusForEdit(warData = {}) {
    if (toggleEnlisted) toggleEnlisted.checked = warData.toggleEnlisted || false;
    if (toggleTermedWar) toggleTermedWar.checked = warData.toggleTermedWar || false;
    if (toggleTermedWinLoss) toggleTermedWinLoss.checked = warData.toggleTermedWinLoss || false;
    if (toggleChaining) toggleChaining.checked = warData.toggleChaining || false;
    if (toggleNoFlying) toggleNoFlying.checked = warData.toggleNoFlying || false;
    if (toggleTurtleMode) toggleTurtleMode.checked = warData.toggleTurtleMode || false;
    if (nextChainTimeInput) nextChainTimeInput.value = warData.nextChainTimeInput || '';
    if (enemyFactionIDInput) enemyFactionIDInput.value = warData.enemyFactionID || '';
}


// --- Event Listeners ---

if (saveGamePlanBtn) {
    saveGamePlanBtn.addEventListener('click', async () => {
        const newGamePlan = gamePlanEditArea.value;
        try {
            await db.collection('factionWars').doc('currentWar').set({ gamePlan: newGamePlan }, { merge: true });
            displayMessage(gamePlanDisplay, newGamePlan);
            alert('Game plan saved!');
        } catch (error) {
            console.error('Error saving game plan:', error);
            alert('Error saving game plan.');
        }
    });
}

if (postAnnouncementBtn) {
    postAnnouncementBtn.addEventListener('click', async () => {
        const message = quickAnnouncementInput.value;
        if (message.trim() === '') return;
        try {
            const announcementData = {
                quickAnnouncement: message,
                quickAnnouncementTimestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            await db.collection('factionWars').doc('currentWar').set(announcementData, { merge: true });
            displayMessage(factionAnnouncementsDisplay, message);
            quickAnnouncementInput.value = '';
            alert('Announcement posted!');
        } catch (error) {
            console.error('Error posting announcement:', error);
            alert('Error posting announcement.');
        }
    });
}

// --- Initialization on DOMContentLoaded and Auth State Change ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("war_page_hub.js: DOMContentLoaded event fired.");

    // Tab switching logic
    tabButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const tabId = event.currentTarget.dataset.tab + '-tab';
            showTab(tabId);
        });
    });
    showTab('announcements-tab'); // Show the first tab by default

    // Centralized data loading based on Firebase Auth State
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            console.log('User logged in. Loading war hub data...');
            try {
                const userProfileRef = db.collection('userProfiles').doc(user.uid);
                const doc = await userProfileRef.get();
                if (doc.exists && doc.data().tornApiKey) {
                    const apiKey = doc.data().tornApiKey;
                    
                    // Initialize all data loading from here
                    await initializeWarHubApiData(user, apiKey);

                    // --- *** STRUCTURAL CHANGE *** ---
                    // This event listener is placed here to get access to the apiKey.
                    if (saveWarStatusControlsBtn) {
                        saveWarStatusControlsBtn.addEventListener('click', async () => {
                            const enemyId = enemyFactionIDInput.value.trim();

                            const statusData = {
                                toggleEnlisted: toggleEnlisted.checked,
                                toggleTermedWar: toggleTermedWar.checked,
                                toggleChaining: toggleChaining.checked,
                                toggleNoFlying: toggleNoFlying.checked,
                                toggleTurtleMode: toggleTurtleMode.checked,
                                toggleTermedWinLoss: toggleTermedWinLoss.checked,
                                nextChainTimeInput: nextChainTimeInput.value,
                                enemyFactionID: enemyId, // Save the enemy ID to Firestore
                                statusLastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                            };

                            try {
                                await db.collection('factionWars').doc('currentWar').set(statusData, { merge: true });
                                alert('War status saved successfully!');
                                
                                // Now, refresh the display
                                populateWarStatusDisplay(statusData);

                                // --- *** NEW (Request 1) ***: Fetch and display the enemy info
                                await fetchAndDisplayEnemyFaction(enemyId, apiKey);

                            } catch (error) {
                                console.error('Error saving war status:', error);
                                alert('An error occurred while saving the war status.');
                            }
                        });
                    }

                } else {
                    console.warn("User profile or API key not found.");
                    // Handle UI for no API key
                }
            } catch (e) {
                console.error("Error getting user profile:", e);
                // Handle UI for error
            }
        } else {
            console.log("User not logged in.");
            // Handle UI for logged out state
        }
    });
});