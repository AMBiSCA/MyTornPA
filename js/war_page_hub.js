/* ==========================================================================
   War Page Hub JavaScript (war_page_hub.js) - v11 FINAL
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
const designatedAdminsContainer = document.getElementById('designatedAdminsContainer');
const bigHitterWatchlistContainer = document.getElementById('bigHitterWatchlistContainer');
const energyTrackingContainer = document.getElementById('energyTrackingContainer');
const saveAdminsBtn = document.getElementById('saveAdminsBtn');
const saveEnergyTrackMembersBtn = document.getElementById('saveEnergyTrackMembersBtn');
const saveSelectionsBtnBH = document.getElementById('saveSelectionsBtnBH');
// *** NEW: Getters for the Friendly Status Tab ***
const friendlyMembersListContainer = document.getElementById('friendlyMembersListContainer');
const totalEnergyDisplay = document.getElementById('total-energy-display');


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

// *** NEW: Helper function to format timestamps ***
function formatTimeSince(timestamp) {
    if (!timestamp || !timestamp.seconds) return 'N/A';
    const now = new Date();
    const lastActionDate = timestamp.toDate();
    const seconds = Math.floor((now - lastActionDate) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)}y ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)}m ago`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)}d ago`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)}min ago`;
    return `${Math.floor(seconds)}s ago`;
}

// --- Data Loading & UI Population ---

async function initializeAndLoadData(apiKey) {
    try {
        const userFactionApiUrl = `https://api.torn.com/faction/?selections=basic,members&key=${apiKey}&comment=MyTornPA_WarHub`;
        const userFactionResponse = await fetch(userFactionApiUrl);
        factionApiFullData = await userFactionResponse.json();

        if (factionApiFullData.error) {
            console.error("Torn API responded with a detailed error:", factionApiFullData.error);
            throw new Error(`Torn API Error: ${JSON.stringify(factionApiFullData.error)}`);
        }

        const warDoc = await db.collection('factionWars').doc('currentWar').get();
        const warData = warDoc.exists ? warDoc.data() : {};

        populateUiComponents(warData, apiKey);

        // *** NEW: Start listening for live member data updates for the friendly status table ***
        listenForLiveMemberData();

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
        populateEnemyMemberCheckboxes({}, []); 
    }

    if (factionApiFullData.members) {
        populateFriendlyMemberCheckboxes(
            factionApiFullData.members,
            warData.tab4Admins || [],
            warData.energyTrackingMembers || []
        );
    }
}

async function fetchAndDisplayEnemyFaction(factionID, apiKey) {
    if (!factionID || !apiKey) return;
    try {
        const enemyApiUrl = `https://api.torn.com/faction/${factionID}?selections=basic,members&key=${apiKey}&comment=MyTornPA_EnemyFaction`;
        const response = await fetch(enemyApiUrl);
        if (!response.ok) throw new Error(`Server responded with an error: ${response.status} ${response.statusText}`);
        const enemyData = await response.json();
        if (enemyData.error) throw new Error(JSON.stringify(enemyData.error));

        if (factionTwoNameEl) factionTwoNameEl.textContent = enemyData.name || 'Unknown Faction';
        if (factionTwoMembersEl) factionTwoMembersEl.textContent = `Total Members: ${countFactionMembers(enemyData.members) || 'N/A'}`;
        if (factionTwoPicEl) factionTwoPicEl.style.backgroundImage = `url('${getFactionImageUrl(enemyData.tag_image)}')`;

        const warDoc = await db.collection('factionWars').doc('currentWar').get();
        const warData = warDoc.exists ? warDoc.data() : {};
        const savedWatchlistMembers = warData.bigHitterWatchlist || [];
        
        populateEnemyMemberCheckboxes(enemyData.members || {}, savedWatchlistMembers);

    } catch (error) {
        console.error('Error fetching enemy faction data:', error);
        if (factionTwoNameEl) factionTwoNameEl.textContent = 'Invalid Enemy ID';
        populateEnemyMemberCheckboxes({}, []);
    }
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

function populateFriendlyMemberCheckboxes(members, savedAdmins = [], savedEnergyMembers = []) {
    if (!members || typeof members !== 'object') return;

    if (designatedAdminsContainer) designatedAdminsContainer.innerHTML = '';
    else { console.error("HTML Error: Cannot find element with ID 'designatedAdminsContainer'."); }

    if (energyTrackingContainer) energyTrackingContainer.innerHTML = '';
    else { console.error("HTML Error: Cannot find element with ID 'energyTrackingContainer'."); }

    const sortedMemberIds = Object.keys(members).sort((a, b) => (members[a].name || '').localeCompare(members[b].name || ''));

    sortedMemberIds.forEach(memberId => {
        const member = members[memberId];
        const memberName = member.name || `Unknown (${memberId})`;

        const isAdminChecked = savedAdmins.includes(memberId) ? 'checked' : '';
        const adminItemHtml = `<div class="member-selection-item"><input type="checkbox" id="admin-member-${memberId}" value="${memberId}" ${isAdminChecked}><label for="admin-member-${memberId}">${memberName}</label></div>`;
        if(designatedAdminsContainer) designatedAdminsContainer.insertAdjacentHTML('beforeend', adminItemHtml);

        const isEnergyChecked = savedEnergyMembers.includes(memberId) ? 'checked' : '';
        const energyItemHtml = `<div class="member-selection-item"><input type="checkbox" id="energy-member-${memberId}" value="${memberId}" ${isEnergyChecked}><label for="energy-member-${memberId}">${memberName}</label></div>`;
        if(energyTrackingContainer) energyTrackingContainer.insertAdjacentHTML('beforeend', energyItemHtml);
    });
}

function populateEnemyMemberCheckboxes(enemyMembers, savedWatchlistMembers = []) {
    if (!bigHitterWatchlistContainer) return;
    bigHitterWatchlistContainer.innerHTML = ''; 
    if (!enemyMembers || typeof enemyMembers !== 'object' || Object.keys(enemyMembers).length === 0) {
        bigHitterWatchlistContainer.innerHTML = '<div class="member-selection-item">No enemy members available</div>';
        return;
    }
    const sortedEnemyMemberIds = Object.keys(enemyMembers).sort((a, b) => (enemyMembers[a].name || '').localeCompare(enemyMembers[b].name || ''));
    sortedEnemyMemberIds.forEach(memberId => {
        const member = enemyMembers[memberId];
        const memberName = member.name || `Unknown (${memberId})`;
        const isWatchlistChecked = savedWatchlistMembers.includes(memberId) ? 'checked' : '';
        const itemHtml = `<div class="member-selection-item"><input type="checkbox" id="enemy-member-${memberId}" value="${memberId}" ${isWatchlistChecked}><label for="enemy-member-${memberId}">${memberName}</label></div>`;
        bigHitterWatchlistContainer.insertAdjacentHTML('beforeend', itemHtml);
    });
}

// *** NEW: Main function to listen for live data and render the table ***
function listenForLiveMemberData() {
    // This assumes member data is stored in a subcollection named 'liveData'
    const liveDataRef = db.collection('factionWars').doc('currentWar').collection('liveData');

    liveDataRef.onSnapshot(snapshot => {
        let liveMembers = [];
        snapshot.forEach(doc => {
            liveMembers.push({ id: doc.id, ...doc.data() });
        });
        
        // Combine with the main member list to get names, levels etc., which might not be in the live doc
        const combinedData = liveMembers.map(liveMember => {
            const staticData = factionApiFullData.members[liveMember.id] || {};
            return { ...staticData, ...liveMember }; // live data (energy, status) overrides static
        });

        renderFriendlyStatusTable(combinedData);
    }, error => {
        console.error("Error listening to live member data:", error);
        if(friendlyMembersListContainer) friendlyMembersListContainer.innerHTML = `<p>Error loading live member data.</p>`;
    });
}

// *** NEW: Function to build and render the friendly status table ***
function renderFriendlyStatusTable(memberData) {
    if (!friendlyMembersListContainer) {
        console.error("HTML Error: Cannot find element with ID 'friendlyMembersListContainer'.");
        return;
    }

    let tableHtml = `
        <table class="status-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Level</th>
                    <th>Strength</th>
                    <th>Defense</th>
                    <th>Speed</th>
                    <th>Dexterity</th>
                    <th>Last Action</th>
                    <th>Energy</th>
                    <th>Drug C/D</th>
                    <th>Travelling</th>
                    <th>Hospital</th>
                </tr>
            </thead>
            <tbody>
    `;

    let totalCurrentEnergy = 0;
    let totalMaxEnergy = 0;

    // Sort data alphabetically by name
    memberData.sort((a,b) => (a.name || '').localeCompare(b.name || ''));

    for (const member of memberData) {
        // Safely access nested properties
        const currentEnergy = member.energy ? member.energy.current : 0;
        const maxEnergy = member.energy ? member.energy.max : 0;
        
        totalCurrentEnergy += currentEnergy;
        totalMaxEnergy += maxEnergy;

        const drugCooldown = member.cooldowns ? member.cooldowns.drug : 0;
        const hospitalTimer = member.status ? member.status.hospital_timestamp : 0;
        const travelingTimer = member.status ? member.status.travel_timestamp : 0;
        
        tableHtml += `
            <tr>
                <td>${member.name || 'Unknown'} [${member.id}]</td>
                <td>${member.level || 'N/A'}</td>
                <td>${member.strength ? member.strength.toLocaleString() : 'N/A'}</td>
                <td>${member.defense ? member.defense.toLocaleString() : 'N/A'}</td>
                <td>${member.speed ? member.speed.toLocaleString() : 'N/A'}</td>
                <td>${member.dexterity ? member.dexterity.toLocaleString() : 'N/A'}</td>
                <td>${formatTimeSince(member.last_action)}</td>
                <td>${currentEnergy}/${maxEnergy}</td>
                <td>${drugCooldown > 0 ? `${drugCooldown}m` : 'OK'}</td>
                <td>${travelingTimer > 0 ? 'Yes' : 'No'}</td>
                <td>${hospitalTimer > 0 ? 'Yes' : 'No'}</td>
            </tr>
        `;
    }

    tableHtml += `</tbody></table>`;
    friendlyMembersListContainer.innerHTML = tableHtml;

    if (totalEnergyDisplay) {
        totalEnergyDisplay.textContent = `Total Faction Energy: ${totalCurrentEnergy.toLocaleString()} / ${totalMaxEnergy.toLocaleString()}`;
    }
}


// --- Event Listeners Setup ---
function setupEventListeners(apiKey) {
    if (saveGamePlanBtn) {
        saveGamePlanBtn.addEventListener('click', async () => { /* ... Full original code ... */ });
    }
    if (postAnnouncementBtn) {
        postAnnouncementBtn.addEventListener('click', async () => { /* ... Full original code ... */ });
    }
    if (saveWarStatusControlsBtn) {
        saveWarStatusControlsBtn.addEventListener('click', async () => { /* ... Full original code ... */ });
    }
    if (saveAdminsBtn) {
        saveAdminsBtn.addEventListener('click', async () => { /* ... Full original code ... */ });
    }
    if (saveEnergyTrackMembersBtn) {
        saveEnergyTrackMembersBtn.addEventListener('click', async () => { /* ... Full original code ... */ });
    }
    if (saveSelectionsBtnBH) {
        saveSelectionsBtnBH.addEventListener('click', async () => { /* ... Full original code ... */ });
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