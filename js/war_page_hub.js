/* ==========================================================================
   War Page Hub JavaScript (war_page_hub.js) - v4 COMPLETE
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
        const userFactionApiUrl = `https://api.torn.com/faction/?selections=basic,members&key=${apiKey}&comment=MyTornPA_WarHub`;
        const userFactionResponse = await fetch(userFactionApiUrl);
        factionApiFullData = await userFactionResponse.json();

        if (factionApiFullData.error) throw new Error(`Torn API Error: ${factionApiFullData.error}`);

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
        populateMemberSelectionLists(factionApiFullData.members, warData.tab4Admins || [], warData.energyTrackingMembers || []);
    }
}

async function fetchAndDisplayEnemyFaction(factionID, apiKey) {
    if (!factionID || !apiKey) return;
    try {
        const enemyApiUrl = `https://api.torn.com/faction/${factionID}?selections=basic&key=${apiKey}&comment=MyTornPA_EnemyFaction`;
        const response = await fetch(enemyApiUrl);
        const enemyData = await response.json();
        if (enemyData.error) throw new Error(enemyData.error);

        if (factionTwoNameEl) factionTwoNameEl.textContent = enemyData.name || 'Unknown Faction';
        if (factionTwoMembersEl) factionTwoMembersEl.textContent = `Total Members: ${countFactionMembers(enemyData.members) || 'N/A'}`;
        if (factionTwoPicEl) factionTwoPicEl.style.backgroundImage = `url('${getFactionImageUrl(enemyData.tag_image)}')`;
    } catch (error) {
        console.error('Error fetching enemy faction data:', error);
        if (factionTwoNameEl) factionTwoNameEl.textContent = 'Invalid Enemy ID';
        if (factionTwoMembersEl) factionTwoMembersEl.textContent = 'N/A';
    }
}

function populateMemberSelectionLists(members, savedAdmins, savedEnergyMembers) {
    if (!members || typeof members !== 'object') return;

    if (designateAdminsContainer) {
        designateAdminsContainer.innerHTML = '';
    } else {
        console.error("HTML Error: Cannot find element with ID 'designateAdminsContainer'.");
        return;
    }
    if (energyTrackingContainer) {
        energyTrackingContainer.innerHTML = '';
    } else {
        console.error("HTML Error: Cannot find element with ID 'energyTrackingContainer'.");
        return;
    }

    const sortedMemberIds = Object.keys(members).sort((a, b) => members[a].name.localeCompare(members[b].name));

    sortedMemberIds.forEach(memberId => {
        const member = members[memberId];
        const isAdminChecked = savedAdmins.includes(memberId) ? 'checked' : '';
        const isEnergyChecked = savedEnergyMembers.includes(memberId) ? 'checked' : '';

        const adminItemHtml = `<div class="member-selection-item"><input type="checkbox" id="admin-member-${memberId}" value="${memberId}" ${isAdminChecked}><label for="admin-member-${memberId}">${member.name}</label></div>`;
        const energyItemHtml = `<div class="member-selection-item"><input type="checkbox" id="energy-member-${memberId}" value="${memberId}" ${isEnergyChecked}><label for="energy-member-${memberId}">${member.name}</label></div>`;

        designateAdminsContainer.insertAdjacentHTML('beforeend', adminItemHtml);
        energyTrackingContainer.insertAdjacentHTML('beforeend', energyItemHtml);
    });
}