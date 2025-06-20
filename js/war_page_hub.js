/* ==========================================================================
   War Page Hub JavaScript (war_page_hub.js) - v9 (Selective V2 URL Test)
   ========================================================================== */

// --- Global Variables ---
const db = firebase.firestore();
const auth = firebase.auth();
let userApiKey = null;
let factionApiFullData = null;

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
const factionAnnouncementsDisplay = document.getElementById('factionAnnouncementsDisplay');
const factionWarHubTitleEl = document.getElementById('factionWarHubTitle');
const factionOneNameEl = document.getElementById('factionOneName');
const factionOneMembersEl = document.getElementById('factionOneMembers');
const factionOnePicEl = document.getElementById('factionOnePic');
const factionTwoNameEl = document.getElementById('factionTwoName');
const factionTwoMembersEl = document.getElementById('factionTwoMembers');
const factionTwoPicEl = document.getElementById('factionTwoPic');
const gamePlanEditArea = document.getElementById('gamePlanEditArea');
const saveGamePlanBtn = document.getElementById('saveGamePlanBtn');
const quickAnnouncementInput = document.getElementById('quickAnnouncementInput');
const postAnnouncementBtn = document.getElementById('postAnnouncementBtn');
const toggleEnlisted = document.getElementById('toggleEnlisted');
const toggleTermedWar = document.getElementById('toggleTermedWar');
const toggleTermedWinLoss = document.getElementById('toggleTermedWinLoss');
const toggleChaining = document.getElementById('toggleChaining');
const toggleNoFlying = document.getElementById('toggleNoFlying');
const toggleTurtleMode = document.getElementById('toggleTurtleMode');
const nextChainTimeInput = document.getElementById('nextChainTimeInput');
const enemyFactionIDInput = document.getElementById('enemyFactionIDInputLeaderConfig');
const saveWarStatusControlsBtn = document.getElementById('saveWarStatusControlsBtn');
const designateAdminsContainer = document.getElementById('designateAdminsContainer');
const energyTrackingContainer = document.getElementById('energyTrackingContainer');
const saveAdminsBtn = document.getElementById('saveAdminsBtn');
const saveEnergyTrackMembersBtn = document.getElementById('saveEnergyTrackMembersBtn');

// --- Utility Functions ---

function showTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) selectedTab.classList.add('active');
    const selectedButton = document.querySelector(`.tab-button[data-tab="${tabId.replace('-tab', '')}"]`);
    if (selectedButton) selectedButton.classList.add('active');
}

function getFactionImageUrl(imageFileName) {
    return imageFileName ? `https://www.torn.com/factions.php?image=${imageFileName}` : '';
}

function countFactionMembers(membersObject) {
    if (!membersObject) return 0;
    return typeof membersObject.total === 'number' ? membersObject.total : Object.keys(membersObject).length;
}

// --- Data Loading & UI Population ---

async function initializeAndLoadData(apiKey) {
    try {
        // *** MODIFIED ***: Using "v2" URL ONLY for the user's own faction data.
        const userFactionApiUrl = `https://api.torn.com/v2/faction/?selections=basic,members&key=${apiKey}&comment=MyTornPA_WarHub_V2Test`;

        console.log("Attempting to fetch from v2 URL for user's faction:", userFactionApiUrl);

        const userFactionResponse = await fetch(userFactionApiUrl);

        if (!userFactionResponse.ok) {
            throw new Error(`Server responded with an error: ${userFactionResponse.status} ${userFactionResponse.statusText}`);
        }

        factionApiFullData = await userFactionResponse.json();

        if (factionApiFullData.error) {
            console.error("Torn API responded with a detailed error:", factionApiFullData.error);
            throw new Error(`Torn API Error: ${JSON.stringify(factionApiFullData.error)}`);
        }

        const warDoc = await db.collection('factionWars').doc('currentWar').get();
        const warData = warDoc.exists ? warDoc.data() : {};

        populateUiComponents(warData, apiKey);

    } catch (error) {
        console.error("Error during data initialization:", error);
        if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = 'Error Loading War Hub Data.';
    }
}

function populateUiComponents(warData, apiKey) {
    if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = `${factionApiFullData.name || "Your Faction"}'s War Hub.`;
    if (factionOneNameEl) factionOneNameEl.textContent = factionApiFullData.name || 'Your Faction';
    if (factionOneMembersEl) factionOneMembersEl.textContent = `Total Members: ${countFactionMembers(factionApiFullData.members) || 'N/A'}`;
    if (factionOnePicEl) factionOnePicEl.style.backgroundImage = `url('${getFactionImageUrl(factionApiFullData.tag_image)}')`;
    
    if (gamePlanDisplay) gamePlanDisplay.textContent = warData.gamePlan || 'No game plan available.';
    if (factionAnnouncementsDisplay) factionAnnouncementsDisplay.textContent = warData.quickAnnouncement || 'No current announcements.';
    if (gamePlanEditArea) gamePlanEditArea.value = warData.gamePlan || '';

    populateWarStatusDisplay(warData);
    loadWarStatusForEdit(warData);

    if (warData.enemyFactionID) {
        fetchAndDisplayEnemyFaction(warData.enemyFactionID, apiKey);
    } else {
        if (factionTwoNameEl) factionTwoNameEl.textContent = 'No Enemy Set';
        if (factionTwoMembersEl) factionTwoMembersEl.textContent = 'N/A';
        if (factionTwoPicEl) factionTwoPicEl.style.backgroundImage = '';
    }

    if (factionApiFullData.members) {
        populateMemberSelectionLists(
            factionApiFullData.members,
            warData.tab4Admins || [],
            warData.energyTrackingMembers || []
        );
    }
}

async function fetchAndDisplayEnemyFaction(factionID, apiKey) {
    if (!factionID || !apiKey) return;
    try {
        // MODIFIED: Requesting 'members' data in addition to 'basic'
        const enemyApiUrl = `https://api.torn.com/faction/${factionID}?selections=basic,members&key=${apiKey}&comment=MyTornPA_EnemyFaction`;
        const response = await fetch(enemyApiUrl);

        if (!response.ok) {
            throw new Error(`Server responded with an error: ${response.status} ${response.statusText}`);
        }

        const enemyData = await response.json();
        if (enemyData.error) {
            console.error('Torn API responded with a detailed error for enemy faction:', enemyData.error);
            throw new Error(`Torn API Error: ${JSON.stringify(enemyData.error.error)}`);
        }

        if (factionTwoNameEl) factionTwoNameEl.textContent = enemyData.name || 'Unknown Faction';
        if (factionTwoMembersEl) factionTwoMembersEl.textContent = `Total Members: ${countFactionMembers(enemyData.members) || 'N/A'}`;
        if (factionTwoPicEl) factionTwoPicEl.style.backgroundImage = `url('${getFactionImageUrl(enemyData.tag_image)}')`;

        // NEW: Populate the Big Hitter Watchlist with enemy members
        if (enemyData.members) {
            populateWatchlistSelect(enemyData.members, []); // Assuming no pre-saved watchlist selection for now
        } else {
            console.warn("Enemy faction members data not found.");
            populateWatchlistSelect({}, []); // Clear the watchlist if no members
        }

    } catch (error) {
        console.error('Error fetching enemy faction data:', error);
        if (factionTwoNameEl) factionTwoNameEl.textContent = 'Invalid Enemy ID';
        if (factionTwoMembersEl) factionTwoMembersEl.textContent = 'N/A';
        if (factionTwoPicEl) factionTwoPicEl.style.backgroundImage = '';
        populateWatchlistSelect({}, []); // Clear watchlist on error
    }
}

 function populateWatchlistSelect(enemyMembers, savedWatchlistMembers = []) {
    const watchEnemySelect = document.getElementById('watchEnemySelect');

    if (!watchEnemySelect) {
        console.error("HTML Error: Cannot find element with ID 'watchEnemySelect'.");
        return;
    }

    watchEnemySelect.innerHTML = ''; // Clear existing options

    if (!enemyMembers || typeof enemyMembers !== 'object') {
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'No enemy members available';
        watchEnemySelect.appendChild(defaultOption);
        watchEnemySelect.disabled = true; // Disable if no members
        return;
    }

    watchEnemySelect.disabled = false; // Enable if members are present

    const sortedEnemyMemberIds = Object.keys(enemyMembers).sort((a, b) => {
        const nameA = enemyMembers[a].name || '';
        const nameB = enemyMembers[b].name || '';
        return nameA.localeCompare(nameB);
    });

    sortedEnemyMemberIds.forEach(memberId => {
        const member = enemyMembers[memberId];
        const memberName = member.name || `Unknown (${memberId})`;

        const option = document.createElement('option');
        option.value = memberId;
        option.textContent = memberName;
        // Optionally, pre-select if memberId is in savedWatchlistMembers
        if (savedWatchlistMembers.includes(memberId)) {
            option.selected = true;
        }
        watchEnemySelect.appendChild(option);
    });
}

 function populateMemberSelectionLists(members, savedAdmins, savedEnergyMembers) {
    if (!members || typeof members !== 'object') return;

    // Get the <select> elements directly
    const designateAdminSelect = document.getElementById('designateAdminSelect');
    const energyTrackMemberSelect = document.getElementById('energyTrackMemberSelect');
    const watchEnemySelect = document.getElementById('watchEnemySelect'); // Make sure this is also handled if used

    // Clear existing options in the select boxes
    if (designateAdminSelect) designateAdminSelect.innerHTML = '';
    if (energyTrackMemberSelect) energyTrackMemberSelect.innerHTML = '';
    if (watchEnemySelect) watchEnemySelect.innerHTML = ''; // Clear if watchEnemySelect is also used for members

    const sortedMemberIds = Object.keys(members).sort((a, b) => {
        // Ensure member.name exists before comparing
        const nameA = members[a].name || '';
        const nameB = members[b].name || '';
        return nameA.localeCompare(nameB);
    });

    sortedMemberIds.forEach(memberId => {
        const member = members[memberId];
        const memberName = member.name || `Unknown (${memberId})`; // Fallback for name

        // Populate Designate Admins Select
        if (designateAdminSelect) {
            const adminOption = document.createElement('option');
            adminOption.value = memberId;
            adminOption.textContent = memberName;
            if (savedAdmins && savedAdmins.includes(memberId)) { // Check if savedAdmins is defined
                adminOption.selected = true; // Select the option if it was previously saved
            }
            designateAdminSelect.appendChild(adminOption);
        }

        // Populate Energy Tracking Members Select
        if (energyTrackMemberSelect) {
            const energyOption = document.createElement('option');
            energyOption.value = memberId;
            energyOption.textContent = memberName;
            if (savedEnergyMembers && savedEnergyMembers.includes(memberId)) { // Check if savedEnergyMembers is defined
                energyOption.selected = true; // Select the option if it was previously saved
            }
            energyTrackMemberSelect.appendChild(energyOption);
        }

        // If 'Big Hitter Watchlist' is also populated by faction members,
        // and uses a <select> with ID 'watchEnemySelect', add similar logic here.
        // Assuming it is, based on your HTML having a <select id="watchEnemySelect">
        if (watchEnemySelect) {
             const watchOption = document.createElement('option');
             watchOption.value = memberId;
             watchOption.textContent = memberName;
             // If you have a 'savedWatchlist' array for pre-selection, add it here:
             // if (savedWatchlist && savedWatchlist.includes(memberId)) { watchOption.selected = true; }
             watchEnemySelect.appendChild(watchOption);
        }
    });
}

function populateWarStatusDisplay(warData = {}) {
    if (warEnlistedStatus) warEnlistedStatus.textContent = warData.toggleEnlisted ? 'Yes' : 'No';
    if (warTermedStatus) warTermedStatus.textContent = warData.toggleTermedWar ? 'Yes' : 'No';
    if (warTermedWinLoss) warTermedWinLoss.textContent = warData.toggleTermedWinLoss ? 'Win' : 'Loss';
    if (warChainingStatus) warChainingStatus.textContent = warData.toggleChaining ? 'Yes' : 'No';
    if (warNoFlyingStatus) warNoFlyingStatus.textContent = warData.toggleNoFlying ? 'Yes' : 'No';
    if (warTurtleStatus) warTurtleStatus.textContent = warData.toggleTurtleMode ? 'Yes' : 'No';
    if (warNextChainTimeStatus) warNextChainTimeStatus.textContent = warData.nextChainTimeInput || 'N/A';
}

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

// --- Event Listeners Setup ---

function setupEventListeners(apiKey) {
    if (saveGamePlanBtn) {
        saveGamePlanBtn.addEventListener('click', async () => {
            if (!gamePlanEditArea) return;
            try {
                await db.collection('factionWars').doc('currentWar').set({ gamePlan: gamePlanEditArea.value }, { merge: true });
                if (gamePlanDisplay) gamePlanDisplay.textContent = gamePlanEditArea.value;
                alert('Game plan saved!');
            } catch (error) {
                console.error('Error saving game plan:', error);
                alert('Error saving game plan.');
            }
        });
    }

    if (postAnnouncementBtn) {
        postAnnouncementBtn.addEventListener('click', async () => {
            if (!quickAnnouncementInput || quickAnnouncementInput.value.trim() === '') return;
            try {
                await db.collection('factionWars').doc('currentWar').set({ quickAnnouncement: quickAnnouncementInput.value }, { merge: true });
                if (factionAnnouncementsDisplay) factionAnnouncementsDisplay.textContent = quickAnnouncementInput.value;
                quickAnnouncementInput.value = '';
                alert('Announcement posted!');
            } catch (error) {
                console.error('Error posting announcement:', error);
            }
        });
    }
    
    if (saveWarStatusControlsBtn) {
        saveWarStatusControlsBtn.addEventListener('click', async () => {
            const enemyId = enemyFactionIDInput ? enemyFactionIDInput.value.trim() : '';
            const statusData = {
                toggleEnlisted: toggleEnlisted ? toggleEnlisted.checked : false,
                toggleTermedWar: toggleTermedWar ? toggleTermedWar.checked : false,
                toggleChaining: toggleChaining ? toggleChaining.checked : false,
                toggleNoFlying: toggleNoFlying ? toggleNoFlying.checked : false,
                toggleTurtleMode: toggleTurtleMode ? toggleTurtleMode.checked : false,
                toggleTermedWinLoss: toggleTermedWinLoss ? toggleTermedWinLoss.checked : false,
                nextChainTimeInput: nextChainTimeInput ? nextChainTimeInput.value : '',
                enemyFactionID: enemyId
            };
            try {
                await db.collection('factionWars').doc('currentWar').set(statusData, { merge: true });
                alert('War status saved!');
                populateWarStatusDisplay(statusData);
                await fetchAndDisplayEnemyFaction(enemyId, apiKey);
            } catch (error) {
                console.error('Error saving war status:', error);
            }
        });
    }

    if (saveAdminsBtn) {
        saveAdminsBtn.addEventListener('click', async () => {
            if (!designateAdminsContainer) return;
            const selectedAdminIds = Array.from(designateAdminsContainer.querySelectorAll('input:checked')).map(cb => cb.value);
            try {
                await db.collection('factionWars').doc('currentWar').set({ tab4Admins: selectedAdminIds }, { merge: true });
                alert('Admins saved!');
            } catch (error) {
                console.error("Error saving admins:", error);
            }
        });
    }

    if (saveEnergyTrackMembersBtn) {
        saveEnergyTrackMembersBtn.addEventListener('click', async () => {
            if (!energyTrackingContainer) return;
            const selectedEnergyMemberIds = Array.from(energyTrackingContainer.querySelectorAll('input:checked')).map(cb => cb.value);
            try {
                await db.collection('factionWars').doc('currentWar').set({ energyTrackingMembers: selectedEnergyMemberIds }, { merge: true });
                alert('Energy tracking members saved!');
            } catch (error) {
                console.error("Error saving energy members:", error);
            }
        });
    }
}

// --- Main Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    tabButtons.forEach(button => {
        button.addEventListener('click', (event) => showTab(event.currentTarget.dataset.tab + '-tab'));
    });
    showTab('announcements-tab');

    let listenersInitialized = false;

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userProfileRef = db.collection('userProfiles').doc(user.uid);
            const doc = await userProfileRef.get();
            const apiKey = doc.exists ? doc.data().tornApiKey : null;

            if (apiKey) {
                userApiKey = apiKey;
                await initializeAndLoadData(apiKey);
                if (!listenersInitialized) {
                    setupEventListeners(apiKey);
                    listenersInitialized = true;
                }
            } else {
                console.warn("API key not found.");
                if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = "Faction War Hub. (API Key Needed)";
            }
        } else {
            userApiKey = null;
            listenersInitialized = false;
            console.log("User not logged in.");
            if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = "Faction War Hub. (Please Login)";
        }
    });
});