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
let currentUserHasTrackerAccess = false; // Store permission status for tracker tabs
let userFactionIdFromProfile = null; // Store user's faction ID, retrieved from profile

// State for Battle Stat Gains Tracking
let activeTrackingSessionId = null;
let activeTrackingStartedAt = null;
let baselineStatsCache = {};

// State for Energy Gains Tracking
let activeEnergyTrackingSessionId = null;
let activeEnergyTrackingStartedAt = null;
let baselineEnergyStatsCache = {};

// Firestore collection names
const GAIN_TRACKING_SESSIONS_COLLECTION = 'gainTrackingSessions';
const ENERGY_TRACKING_SESSIONS_COLLECTION = 'energyTrackingSessions'; // New collection for energy tracking

// Real-time Firestore unsubscribe functions
let unsubscribeFromTrackingStatus = null;
let unsubscribeFromEnergyTrackingStatus = null; // New unsubscribe for energy
let unsubscribeFromGainsData = null;

// Variables for table sorting
let friendlyMembersDataCache = [];
let currentSort = { column: 'totalStats', direction: 'desc' };

// --- Helper Functions ---

/**
 * Formats a raw number into a human-readable string (e.g., 1.23b, 45.6m, 789k).
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
 */
function parseStatValue(statString) {
    if (typeof statString === 'number') {
        return statString;
    }
    if (typeof statString !== 'string' || statString.trim() === '' || statString.toLowerCase() === 'n/a') {
        return 0;
    }

    let value = statString.trim().toLowerCase();

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

    const number = parseFloat(value.replace(/,/g, ''));
    return isNaN(number) ? 0 : number * multiplier;
}


/**
 * Applies CSS classes to table cells based on battle stat tiers for color coding.
 */
function applyStatColorCoding() {
    const table = document.getElementById('friendly-members-table');
    if (!table) return;

    table.classList.add('table-striped');

    const statCells = table.querySelectorAll('tbody td:nth-child(3), tbody td:nth-child(4), tbody td:nth-child(5), tbody td:nth-child(6), tbody td:nth-child(7)');

    statCells.forEach(cell => {
        for (let i = 1; i <= 14; i++) {
            cell.classList.remove(`stat-tier-${i}`);
        }
        cell.classList.remove('stat-cell');

        const value = parseStatValue(cell.textContent);
        let tierClass = '';

        if (value >= 10000000000) { tierClass = 'stat-tier-14'; }
        else if (value >= 5000000000) { tierClass = 'stat-tier-13'; }
        else if (value >= 2500000000) { tierClass = 'stat-tier-12'; }
        else if (value >= 1000000000) { tierClass = 'stat-tier-11'; }
        else if (value >= 500000000) { tierClass = 'stat-tier-10'; }
        else if (value >= 250000000) { tierClass = 'stat-tier-9'; }
        else if (value >= 100000000) { tierClass = 'stat-tier-8'; }
        else if (value >= 50000000) { tierClass = 'stat-tier-7'; }
        else if (value >= 10000000) { tierClass = 'stat-tier-6'; }
        else if (value >= 5000000) { tierClass = 'stat-tier-5'; }
        else if (value >= 1000000) { tierClass = 'stat-tier-4'; }
        else if (value >= 100000) { tierClass = 'stat-tier-3'; }
        else if (value >= 10000) { tierClass = 'stat-tier-2'; }
        else if (value > 0) { tierClass = 'stat-tier-1'; }

        if (tierClass) {
            cell.classList.add(tierClass);
            cell.classList.add('stat-cell');
        }
    });
}
/**
 * Formats a Unix timestamp (in seconds) into a relative time string.
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

/**
 * Checks if a user has permission to view tracker tabs.
 * Access is granted to 'Leader', 'Co-leader', 'Council', or specific UIDs.
 * @param {string} userUid The Firebase UID of the user.
 * @returns {boolean} True if the user has access, false otherwise.
 */
async function checkIfUserHasTrackerAccess(userUid) {
    if (!userUid) return false;
    
    // Define an array of UIDs that should have special access.
    const allowedUids = [
        "Rc2knWVpfXaekcuodg3mSawzE4Z2",
        "kGy5SGu6EZPj3cf7pqUlfVmObAp1"
    ];

    // Check if the user's UID is in the hardcoded allowlist.
    if (allowedUids.includes(userUid)) {
        return true;
    }

    try {
        const userProfileDoc = await db.collection('userProfiles').doc(userUid).get();
        if (!userProfileDoc.exists) return false;
        const userProfile = userProfileDoc.data();
        const userPosition = userProfile.position ? userProfile.position.toLowerCase() : '';
        // Check for the original three roles.
        return userPosition === 'leader' || userPosition === 'co-leader' || userPosition === 'council';
    } catch (error) {
        console.error("Error during tracker access check:", error);
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
        // This fetch remains the same
        await fetch(`/.netlify/functions/refresh-faction-data?factionId=${userFactionId}`);
        
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

        // --- THIS IS THE MAIN CHANGE ---
        // Instead of sorting and rendering here, we save the data to the cache...
        friendlyMembersDataCache = processedMembers;
        // ...and call the render function to display it.
        renderFriendlyMembersTable();

        hideLoadingMessage();
    } catch (error) {
        console.error("Fatal error in updateFriendlyMembersTable:", error);
        hideLoadingMessage();
        tbody.innerHTML = `<tr><td colspan="11" style="color:red;">A fatal error occurred: ${error.message}.</td></tr>`;
    }
}

// --- Table Sorting & Rendering Logic ---

// Renders the friendly members table using cached data and current sort settings.
function renderFriendlyMembersTable() {
    const table = document.getElementById('friendly-members-table');
    const tbody = document.getElementById('friendly-members-tbody');
    const tableHeaders = document.querySelectorAll('#friendly-members-table th[data-sort-key]');
    if (!tbody || !tableHeaders.length) return;

    // Helper to get a numeric stat value from a member object
    const getStat = (member, stat) => parseStatValue(member.firebaseData.battlestats?.[stat] || 0);

    // Sorting logic based on the global 'currentSort' object
    friendlyMembersDataCache.sort((a, b) => {
        let valA, valB;
        switch (currentSort.column) {
            case 'name':
                valA = a.tornData.name || '';
                valB = b.tornData.name || '';
                return valA.localeCompare(valB);
            case 'lastAction':
                valA = a.tornData.last_action?.timestamp || 0;
                valB = b.tornData.last_action?.timestamp || 0;
                return valB - valA; // Higher timestamp is more recent
            case 'strength': return getStat(b, 'strength') - getStat(a, 'strength');
            case 'dexterity': return getStat(b, 'dexterity') - getStat(a, 'dexterity');
            case 'speed': return getStat(b, 'speed') - getStat(a, 'speed');
            case 'defense': return getStat(b, 'defense') - getStat(a, 'defense');
            case 'status':
                valA = a.tornData.status?.description || '';
                valB = b.tornData.status?.description || '';
                return valA.localeCompare(valB);
            case 'nerve':
                valA = a.firebaseData.nerve?.current || 0;
                valB = b.firebaseData.nerve?.current || 0;
                return valB - valA;
            case 'energy':
                valA = a.firebaseData.energy?.current || 0;
                valB = b.firebaseData.energy?.current || 0;
                return valB - valA;
            case 'drug':
                valA = a.firebaseData.cooldowns?.drug || 0;
                valB = b.firebaseData.cooldowns?.drug || 0;
                return valB - valA;
            default: // 'totalStats'
                return b.totalStats - a.totalStats;
        }
    });

    if (currentSort.direction === 'asc') {
        friendlyMembersDataCache.reverse();
    }

    // Update header icons to show current sort column and direction
    tableHeaders.forEach(th => {
        const sortKey = th.dataset.sortKey;
        th.innerHTML = th.textContent.replace(/ [▼▲↕]/, '');
        th.style.cursor = 'pointer';
        if (sortKey === currentSort.column) {
            th.innerHTML += currentSort.direction === 'desc' ? ' ▼' : ' ▲';
        } else {
            th.innerHTML += ' ↕';
        }
    });

    // Generate and inject table HTML from the sorted data
    const mobileLandscapeQuery = window.matchMedia("only screen and (orientation: landscape) and (max-height: 500px)");
    let allRowsHtml = '';
    for (const member of friendlyMembersDataCache) {
        const { tornData, firebaseData, totalStats } = member;
        const memberId = tornData.user_id || tornData.id;
        const name = tornData.name || 'Unknown';
        const lastAction = tornData.last_action ? formatRelativeTime(tornData.last_action.timestamp) : 'N/A';
        const strength = formatBattleStats(getStat(member, 'strength'));
        const dexterity = formatBattleStats(getStat(member, 'dexterity'));
        const speed = formatBattleStats(getStat(member, 'speed'));
        const defense = formatBattleStats(getStat(member, 'defense'));
        const nerve = `${firebaseData.nerve?.current ?? 'N/A'} / ${firebaseData.nerve?.maximum ?? 'N/A'}`;
        let energyValue = mobileLandscapeQuery.matches ? (firebaseData.energy?.current ?? 'N/A') : `${firebaseData.energy?.current ?? 'N/A'} / ${firebaseData.energy?.maximum ?? 'N/A'}`;
        const drugCooldownValue = firebaseData.cooldowns?.drug ?? 0;
        let drugCooldown, drugCooldownClass = '';
        if (drugCooldownValue > 0) {
            const hours = Math.floor(drugCooldownValue / 3600);
            const minutes = Math.floor((drugCooldownValue % 3600) / 60);
            drugCooldown = `${hours > 0 ? `${hours}hr` : ''} ${minutes > 0 ? `${minutes}m` : ''}`.trim() || '<1m';
            if (drugCooldownValue > 18000) drugCooldownClass = 'status-hospital';
            else if (drugCooldownValue > 7200) drugCooldownClass = 'status-other';
            else drugCooldownClass = 'status-okay';
        } else {
            drugCooldown = mobileLandscapeQuery.matches ? 'None' : 'None 🍁';
            drugCooldownClass = 'status-okay';
        }
        const statusState = tornData.status?.state || '';
        let formattedStatus = tornData.status?.description || 'N/A';
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
                <td class="${drugCooldownClass} hide-on-mobile">${drugCooldown}</td>
            </tr>
        `;
    }
    tbody.innerHTML = allRowsHtml.length > 0 ? allRowsHtml : '<tr><td colspan="11" style="text-align:center;">No members to display.</td></tr>';
    applyStatColorCoding();
}

// Sets data attributes on table headers to enable sorting.
function dynamicallySetSortKeys() {
    const headers = document.querySelectorAll('#friendly-members-table th');
    const keyMap = {
        'Name': 'name', 'Last Action': 'lastAction', 'Strength': 'strength', 'Dexterity': 'dexterity',
        'Speed': 'speed', 'Defense': 'defense', 'Total': 'totalStats', 'Status': 'status',
        'Nerve': 'nerve', 'Energy': 'energy', 'Drug CD': 'drug'
    };
    headers.forEach(th => {
        const text = th.textContent.trim().replace(/ [▼▲↕]/, '').trim();
        if (keyMap[text]) {
            th.dataset.sortKey = keyMap[text];
        }
    });
}

// Adds click listeners to table headers to enable sorting.
function initializeTableSorting() {
    const table = document.getElementById('friendly-members-table');
    if (!table) return;
    table.addEventListener('click', (event) => {
        const header = event.target.closest('th');
        if (!header || !header.dataset.sortKey) return;
        
        const sortKey = header.dataset.sortKey;
        if (currentSort.column === sortKey) {
            currentSort.direction = currentSort.direction === 'desc' ? 'asc' : 'desc';
        } else {
            currentSort.column = sortKey;
            currentSort.direction = (sortKey === 'name' || sortKey === 'status') ? 'asc' : 'desc';
        }
        renderFriendlyMembersTable();
    });
}

// --- Gain Tracking Core Logic ---

/**
 * Helper to format gain values (+X, -Y, 0) with appropriate CSS class.
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

    if (!startTrackingBtn || !stopTrackingBtn || !trackingStatusDisplay || !gainsStartedAtDisplay) {
        console.error("UI Error: A gains tracking control element was not found.");
        return;
    }

    if (!currentUserHasTrackerAccess) { // <-- USES NEW PERMISSION VARIABLE
        startTrackingBtn.classList.add('hidden');
        stopTrackingBtn.classList.add('hidden');
        trackingStatusDisplay.textContent = 'You do not have permission to track gains.';
        gainsStartedAtDisplay.textContent = '';
        return;
    }

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
    if (!currentUserHasTrackerAccess) { // <-- USES NEW PERMISSION VARIABLE
        alert("Permission denied. You do not have access to this feature.");
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
        snapshots.forEach(snapshot => {
            snapshot.forEach(doc => {
                const memberData = doc.data();
                currentStatsForSnapshot[doc.id] = {
                    name: memberData.name,
                    strength: parseStatValue(memberData.battlestats?.strength),
                    dexterity: parseStatValue(memberData.battlestats?.dexterity),
                    speed: parseStatValue(memberData.battlestats?.speed),
                    defense: parseStatValue(memberData.battlestats?.defense),
                    total: parseStatValue(memberData.battlestats?.total),
                };
            });
        });

        const newSessionDocRef = db.collection(GAIN_TRACKING_SESSIONS_COLLECTION).doc();
        await newSessionDocRef.set({
            factionId: userFactionId,
            startedByUid: currentFirebaseUserUid,
            startedAt: firebase.firestore.FieldValue.serverTimestamp(),
            isActive: true,
            snapshot: currentStatsForSnapshot
        });

        const factionStatusDocId = String(userFactionId);
        await db.collection(GAIN_TRACKING_SESSIONS_COLLECTION).doc(factionStatusDocId).set({
            activeSessionId: newSessionDocRef.id,
            factionId: userFactionId,
            startedByUid: currentFirebaseUserUid,
            startedAt: firebase.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        console.log("Gains tracking started. Snapshot saved with ID:", newSessionDocRef.id);

        alert("Gains tracking started successfully!");

    } catch (error) {
        console.error("Error starting gains tracking:", error);
        alert("Failed to start tracking gains: " + error.message);
        if (startTrackingBtn) {
            startTrackingBtn.disabled = false;
            startTrackingBtn.textContent = 'Start Tracking Gains';
        }
        updateGainTrackingUI();
    }
}

/**
 * Stops the current gains tracking session for the user's faction.
 */
async function stopTrackingGains() {
    if (!currentUserHasTrackerAccess) { // <-- USES NEW PERMISSION VARIABLE
        alert("Permission denied. You do not have access to this feature.");
        return;
    }
    if (!userFactionIdFromProfile) {
        alert("Cannot stop tracking: Faction ID not found in your profile.");
        return;
    }

    const stopTrackingBtn = document.getElementById('stopTrackingBtn');
    if (stopTrackingBtn) {
        stopTrackingBtn.disabled = true;
        stopTrackingBtn.textContent = 'Stopping...';
    }

    try {
        const factionStatusDocId = String(userFactionIdFromProfile);
        const statusDocRef = db.collection(GAIN_TRACKING_SESSIONS_COLLECTION).doc(factionStatusDocId);
        const statusDoc = await statusDocRef.get();

        if (statusDoc.exists && statusDoc.data().activeSessionId) {
            const activeSessionIdToUpdate = statusDoc.data().activeSessionId;

            await db.collection(GAIN_TRACKING_SESSIONS_COLLECTION).doc(activeSessionIdToUpdate).update({
                isActive: false,
                stoppedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            await statusDocRef.delete();

            console.log("Gains tracking stopped for session:", activeSessionIdToUpdate);

            alert("Gains tracking stopped successfully!");

        } else {
            alert("No active tracking session found for your faction.");
        }
        updateGainTrackingUI();

    } catch (error) {
        console.error("Error stopping gains tracking:", error);
        alert("Failed to stop tracking gains: " + error.message);
        if (stopTrackingBtn) {
            stopTrackingBtn.disabled = false;
            stopTrackingBtn.textContent = 'Stop Tracking';
        }
        updateGainTrackingUI();
    }
}

/**
 * Sets up a real-time listener for the active gains tracking session status.
 */
function setupRealtimeTrackingStatusListener(userFactionId) {
    if (unsubscribeFromTrackingStatus) {
        unsubscribeFromTrackingStatus();
    }

    const statusDocRef = db.collection(GAIN_TRACKING_SESSIONS_COLLECTION).doc(String(userFactionId));

    unsubscribeFromTrackingStatus = statusDocRef.onSnapshot(async (doc) => {
        if (doc.exists && doc.data().factionId === userFactionId) {
            activeTrackingSessionId = doc.data().activeSessionId;
            activeTrackingStartedAt = doc.data().startedAt;

            if (activeTrackingSessionId && !baselineStatsCache[activeTrackingSessionId]) {
                const baselineDoc = await db.collection(GAIN_TRACKING_SESSIONS_COLLECTION).doc(activeTrackingSessionId).get();
                if (baselineDoc.exists && baselineDoc.data().snapshot) {
                    baselineStatsCache = { [activeTrackingSessionId]: baselineDoc.data().snapshot };
                } else {
                    console.warn("Active session ID found, but baseline snapshot is missing. Resetting status.");
                    activeTrackingSessionId = null;
                    activeTrackingStartedAt = null;
                    baselineStatsCache = {};
                }
            }
        } else {
            activeTrackingSessionId = null;
            activeTrackingStartedAt = null;
            baselineStatsCache = {};
        }
        updateGainTrackingUI();
        if (document.getElementById('gains-tracking-tab').classList.contains('active')) {
            displayGainsTable();
        }
    }, (error) => {
        console.error("Error listening to tracking status:", error);
        activeTrackingSessionId = null;
        activeTrackingStartedAt = null;
        baselineStatsCache = {};
        updateGainTrackingUI();
        if (document.getElementById('gains-tracking-tab').classList.contains('active')) {
            displayGainsTable();
        }
    });
    console.log(`Real-time tracking status listener set up for faction: ${userFactionId}`);
}


/**
 * Displays the gains table by comparing current stats to the active snapshot.
 */
async function displayGainsTable() {
    const gainsTbody = document.getElementById('gains-overview-tbody');
    const gainsMessageContainer = document.querySelector('#gains-tracking-tab .gains-table-container p');

    if (!gainsTbody || !gainsMessageContainer) {
        console.error("HTML Error: Gains table body or message container not found.");
        return;
    }

    gainsTbody.innerHTML = '';
    gainsMessageContainer.classList.remove('hidden');
    gainsMessageContainer.textContent = 'Loading gains data...';

    if (!userApiKey || !currentFirebaseUserUid || !userFactionIdFromProfile) {
        gainsMessageContainer.textContent = 'Please log in to view gains.';
        return;
    }

    if (!activeTrackingSessionId || !baselineStatsCache[activeTrackingSessionId]) {
        gainsMessageContainer.textContent = 'No active gains tracking session. Click "Start Tracking Gains" to begin.';
        return;
    }

    try {
        const userFactionId = userFactionIdFromProfile;
        const baselineStats = baselineStatsCache[activeTrackingSessionId];

        const factionMembersApiUrl = `https://api.torn.com/v2/faction/${userFactionId}?selections=members&key=${userApiKey}&comment=MyTornPA_BigBrother_GainsRefresh`;
        const factionResponse = await fetch(factionMembersApiUrl);
        const factionData = await factionResponse.json();

        if (!factionResponse.ok || factionData.error) {
            gainsMessageContainer.textContent = `Error fetching current faction data: ${factionData.error?.error || 'API Error'}.`;
            return;
        }
        const membersArray = Object.values(factionData.members || {});
        const allMemberTornIds = membersArray.map(member => String(member.user_id || member.id));

        const usersCollectionRef = db.collection('users');
        const CHUNK_SIZE = 10;
        const firestoreQueries = [];

        for (let i = 0; i < allMemberTornIds.length; i += CHUNK_SIZE) {
            const chunk = allMemberTornIds.slice(i, i + CHUNK_SIZE);
            firestoreQueries.push(usersCollectionRef.where(firebase.firestore.FieldPath.documentId(), 'in', chunk));
        }

        if (firestoreQueries.length === 0) {
            gainsMessageContainer.textContent = 'No members to display gains for.';
            return;
        }

        if (unsubscribeFromGainsData) {
            unsubscribeFromGainsData();
            unsubscribeFromGainsData = null;
        }

        const querySnapshots = await Promise.all(firestoreQueries.map(q => q.get()));

        const currentStats = {};
        querySnapshots.forEach(snapshot => {
            snapshot.forEach(doc => {
                const memberData = doc.data();
                currentStats[doc.id] = {
                    name: memberData.name,
                    strength: parseStatValue(memberData.battlestats?.strength),
                    dexterity: parseStatValue(memberData.battlestats?.dexterity),
                    speed: parseStatValue(memberData.battlestats?.speed),
                    defense: parseStatValue(memberData.battlestats?.defense),
                    total: parseStatValue(memberData.battlestats?.total),
                };
            });
        });

        let gainsRowsHtml = '';
        const membersWithGains = [];

        membersArray.forEach(memberTornData => {
            const memberId = String(memberTornData.user_id || memberTornData.id);
            const baseline = baselineStats[memberId];
            const current = currentStats[memberId];

            if (baseline && current) {
                const strengthGain = current.strength - baseline.strength;
                const dexterityGain = current.dexterity - baseline.dexterity;
                const speedGain = current.speed - baseline.speed;
                const defenseGain = current.defense - baseline.defense;
                const totalGain = current.total - baseline.total;

                membersWithGains.push({
                    name: memberTornData.name,
                    memberId: memberId,
                    strengthGain, dexterityGain, speedGain, defenseGain, totalGain,
                    initialTotal: baseline.total
                });
            } else if (current && !baseline) {
                membersWithGains.push({
                    name: memberTornData.name,
                    memberId: memberId,
                    strengthGain: current.strength,
                    dexterityGain: current.dexterity,
                    speedGain: current.speed,
                    defenseGain: current.defense,
                    totalGain: current.total,
                    initialTotal: current.total,
                    isNew: true
                });
            }
        });

        membersWithGains.sort((a, b) => b.totalGain - a.totalGain);

        membersWithGains.forEach(member => {
            const profileUrl = `https://www.torn.com/profiles.php?XID=${member.memberId}`;
            const rowClass = member.isNew ? 'new-member-gain' : '';
            gainsRowsHtml += `
                <tr class="${rowClass}">
                    <td><a href="${profileUrl}" target="_blank">${member.name}${member.isNew ? ' (New)' : ''}</a></td>
                    <td>${formatGainValue(member.strengthGain)}</td>
                    <td>${formatGainValue(member.dexterityGain)}</td>
                    <td>${formatGainValue(member.speedGain)}</td>
                    <td>${formatGainValue(member.defenseGain)}</td>
                    <td>${formatGainValue(member.totalGain)}</td>
                </tr>
            `;
        });

        gainsTbody.innerHTML = gainsRowsHtml.length > 0 ? gainsRowsHtml : '<tr><td colspan="6" style="text-align:center;">No members with tracked gains.</td></tr>';
        gainsMessageContainer.classList.add('hidden');
    } catch (error) {
        console.error("Error displaying gains table:", error);
        gainsMessageContainer.textContent = `Error loading gains: ${error.message}`;
    }
}

// --- Energy Tracking Core Logic ---

/**
 * Updates the UI elements related to ENERGY tracking status (buttons, text).
 */
function updateEnergyTrackingUI() {
    const startBtn = document.getElementById('startEnergyTrackingBtn');
    const stopBtn = document.getElementById('stopEnergyTrackingBtn');
    const statusDisplay = document.getElementById('energyTrackingStatus');
    const startedAtDisplay = document.getElementById('energyGainsStartedAt');

    if (!startBtn || !stopBtn || !statusDisplay || !startedAtDisplay) {
        console.error("UI Error: An energy tracking control element was not found.");
        return;
    }

    if (!currentUserHasTrackerAccess) { // <-- USES NEW PERMISSION VARIABLE
        startBtn.classList.add('hidden');
        stopBtn.classList.add('hidden');
        statusDisplay.textContent = 'You do not have permission to track energy.';
        startedAtDisplay.textContent = '';
        return;
    }

    if (activeEnergyTrackingSessionId) {
        startBtn.classList.add('hidden');
        stopBtn.classList.remove('hidden');
        stopBtn.disabled = false;
        stopBtn.textContent = 'Stop Energy Tracking';

        statusDisplay.textContent = 'Currently tracking energy.';
        if (activeEnergyTrackingStartedAt) {
            const startedDate = activeEnergyTrackingStartedAt.toDate ? activeEnergyTrackingStartedAt.toDate() : activeEnergyTrackingStartedAt;
            startedAtDisplay.textContent = 'Session started: ' + startedDate.toLocaleString();
        } else {
            startedAtDisplay.textContent = '';
        }
    } else {
        startBtn.classList.remove('hidden');
        startBtn.disabled = false;
        startBtn.textContent = 'Start Energy Tracking';
        stopBtn.classList.add('hidden');
        startedAtDisplay.textContent = '';
        statusDisplay.textContent = 'Ready to start tracking.';
    }
}

/**
 * Fetches current gym contributor stats for all members and saves them as a snapshot.
 */
async function startEnergyTracking() {
    if (!currentUserHasTrackerAccess) { // <-- USES NEW PERMISSION VARIABLE
        alert("Permission denied. You do not have access to this feature.");
        return;
    }
    if (!userApiKey || !currentFirebaseUserUid || !userFactionIdFromProfile) {
        alert("Cannot start tracking: User not fully logged in, API key missing, or Faction ID missing from profile.");
        return;
    }

    const startBtn = document.getElementById('startEnergyTrackingBtn');
    if (startBtn) {
        startBtn.disabled = true;
        startBtn.textContent = 'Starting...';
    }

    try {
        const userFactionId = userFactionIdFromProfile;
        const statsToFetch = ['gymstrength', 'gymspeed', 'gymdexterity', 'gymdefense'];

        const apiPromises = statsToFetch.map(stat => {
            const url = `https://api.torn.com/v2/faction/${userFactionId}?selections=contributors&stat=${stat}&key=${userApiKey}&comment=MyTornPA_EnergyTrackerStart`;
            return fetch(url).then(response => {
                if (!response.ok) throw new Error(`API error for ${stat}`);
                return response.json();
            });
        });

        const results = await Promise.all(apiPromises);

        const baselineSnapshot = {};
        results.forEach((result, index) => {
            const statName = statsToFetch[index].replace('gym', '');
            if (result.error) {
                throw new Error(`Torn API Error for ${statName}: ${result.error.error}`);
            }

            const contributors = result.contributors || [];
            for (const contributor of contributors) {
                const memberId = String(contributor.id);
                if (!baselineSnapshot[memberId]) {
                    baselineSnapshot[memberId] = { strength: 0, speed: 0, dexterity: 0, defense: 0 };
                }
                baselineSnapshot[memberId][statName] = contributor.value || 0;
            }
        });

        const newSessionDocRef = db.collection(ENERGY_TRACKING_SESSIONS_COLLECTION).doc();
        await newSessionDocRef.set({
            factionId: userFactionId,
            startedByUid: currentFirebaseUserUid,
            startedAt: firebase.firestore.FieldValue.serverTimestamp(),
            isActive: true,
            snapshot: baselineSnapshot
        });

        const factionStatusDocId = String(userFactionId);
        await db.collection(ENERGY_TRACKING_SESSIONS_COLLECTION).doc(factionStatusDocId).set({
            activeSessionId: newSessionDocRef.id,
            factionId: userFactionId,
            startedByUid: currentFirebaseUserUid,
            startedAt: firebase.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        console.log("Energy tracking started. Snapshot saved with ID:", newSessionDocRef.id);
        alert("Energy tracking started successfully!");

    } catch (error) {
        console.error("Error starting energy tracking:", error);
        alert("Failed to start energy tracking: " + error.message);
        if (startBtn) {
            startBtn.disabled = false;
            startBtn.textContent = 'Start Energy Tracking';
        }
        updateEnergyTrackingUI();
    }
}

/**
 * Stops the current energy tracking session.
 */
async function stopEnergyTracking() {
    if (!currentUserHasTrackerAccess) { // <-- USES NEW PERMISSION VARIABLE
        alert("Permission denied. You do not have access to this feature.");
        return;
    }
    if (!userFactionIdFromProfile) {
        alert("Cannot stop tracking: Faction ID not found in your profile.");
        return;
    }

    const stopBtn = document.getElementById('stopEnergyTrackingBtn');
    if (stopBtn) {
        stopBtn.disabled = true;
        stopBtn.textContent = 'Stopping...';
    }

    try {
        const factionStatusDocId = String(userFactionIdFromProfile);
        const statusDocRef = db.collection(ENERGY_TRACKING_SESSIONS_COLLECTION).doc(factionStatusDocId);
        const statusDoc = await statusDocRef.get();

        if (statusDoc.exists && statusDoc.data().activeSessionId) {
            const activeSessionIdToUpdate = statusDoc.data().activeSessionId;

            await db.collection(ENERGY_TRACKING_SESSIONS_COLLECTION).doc(activeSessionIdToUpdate).update({
                isActive: false,
                stoppedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            await statusDocRef.delete();

            console.log("Energy tracking stopped for session:", activeSessionIdToUpdate);
            alert("Energy tracking stopped successfully!");

        } else {
            alert("No active energy tracking session found for your faction.");
        }
        updateEnergyTrackingUI();

    } catch (error) {
        console.error("Error stopping energy tracking:", error);
        alert("Failed to stop energy tracking: " + error.message);
        if (stopBtn) {
            stopBtn.disabled = false;
            stopBtn.textContent = 'Stop Energy Tracking';
        }
        updateEnergyTrackingUI();
    }
}

/**
 * Sets up a real-time listener for the active energy tracking session status.
 */
function setupRealtimeEnergyTrackingStatusListener(userFactionId) {
    if (unsubscribeFromEnergyTrackingStatus) {
        unsubscribeFromEnergyTrackingStatus();
    }

    const statusDocRef = db.collection(ENERGY_TRACKING_SESSIONS_COLLECTION).doc(String(userFactionId));

    unsubscribeFromEnergyTrackingStatus = statusDocRef.onSnapshot(async (doc) => {
        if (doc.exists && doc.data().factionId === userFactionId) {
            activeEnergyTrackingSessionId = doc.data().activeSessionId;
            activeEnergyTrackingStartedAt = doc.data().startedAt;

            if (activeEnergyTrackingSessionId && !baselineEnergyStatsCache[activeEnergyTrackingSessionId]) {
                const baselineDoc = await db.collection(ENERGY_TRACKING_SESSIONS_COLLECTION).doc(activeEnergyTrackingSessionId).get();
                if (baselineDoc.exists && baselineDoc.data().snapshot) {
                    baselineEnergyStatsCache = { [activeEnergyTrackingSessionId]: baselineDoc.data().snapshot };
                } else {
                    console.warn("Active energy session ID found, but baseline snapshot is missing.");
                    activeEnergyTrackingSessionId = null;
                    activeEnergyTrackingStartedAt = null;
                    baselineEnergyStatsCache = {};
                }
            }
        } else {
            activeEnergyTrackingSessionId = null;
            activeEnergyTrackingStartedAt = null;
            baselineEnergyStatsCache = {};
        }
        updateEnergyTrackingUI();
        if (document.getElementById('energy-tracking-tab').classList.contains('active')) {
            displayEnergyGainsTable();
        }
    }, (error) => {
        console.error("Error listening to energy tracking status:", error);
        activeEnergyTrackingSessionId = null;
        activeEnergyTrackingStartedAt = null;
        baselineEnergyStatsCache = {};
        updateEnergyTrackingUI();
        if (document.getElementById('energy-tracking-tab').classList.contains('active')) {
            displayEnergyGainsTable();
        }
    });
    console.log(`Real-time energy tracking status listener set up for faction: ${userFactionId}`);
}

/**
 * Displays the energy gains table by comparing current contributor stats to the snapshot.
 */
async function displayEnergyGainsTable() {
    const energyTbody = document.getElementById('energy-overview-tbody');
    const energyMessageContainer = document.querySelector('#energy-tracking-tab .energy-table-container p');

    if (!energyTbody || !energyMessageContainer) {
        console.error("HTML Error: Energy table body or message container not found.");
        return;
    }

    energyTbody.innerHTML = '';
    energyMessageContainer.classList.remove('hidden');
    energyMessageContainer.textContent = 'Loading energy data...';

    if (!userApiKey || !userFactionIdFromProfile) {
        energyMessageContainer.textContent = 'Please log in to view energy gains.';
        return;
    }

    if (!activeEnergyTrackingSessionId || !baselineEnergyStatsCache[activeEnergyTrackingSessionId]) {
        energyMessageContainer.textContent = 'No active energy tracking session. Click "Start Energy Tracking" to begin.';
        return;
    }

    try {
        const userFactionId = userFactionIdFromProfile;
        const baselineStats = baselineEnergyStatsCache[activeEnergyTrackingSessionId];
        const statsToFetch = ['gymstrength', 'gymspeed', 'gymdexterity', 'gymdefense'];

        const apiPromises = statsToFetch.map(stat => {
            const url = `https://api.torn.com/v2/faction/${userFactionId}?selections=contributors&stat=${stat}&key=${userApiKey}&comment=MyTornPA_EnergyTrackerUpdate`;
            return fetch(url).then(res => res.json());
        });
        const results = await Promise.all(apiPromises);

        const currentStats = {};
        results.forEach((result, index) => {
            const statName = statsToFetch[index].replace('gym', '');
            if (result.error) throw new Error(`API Error for ${statName}: ${result.error.error}`);

            const contributors = result.contributors || [];
            for (const contributor of contributors) {
                const memberId = String(contributor.id);
                if (!currentStats[memberId]) {
                    currentStats[memberId] = { name: contributor.username, strength: 0, speed: 0, dexterity: 0, defense: 0 };
                }
                currentStats[memberId].name = contributor.username;
                currentStats[memberId][statName] = contributor.value || 0;
            }
        });

        const membersWithGains = [];
        for (const memberId in currentStats) {
            const current = currentStats[memberId];
            const baseline = baselineStats[memberId] || { strength: 0, speed: 0, dexterity: 0, defense: 0 };

            const strengthGain = current.strength - baseline.strength;
            const dexterityGain = current.dexterity - baseline.dexterity;
            const speedGain = current.speed - baseline.speed;
            const defenseGain = current.defense - baseline.defense;
            const totalGain = strengthGain + dexterityGain + speedGain + defenseGain;

            membersWithGains.push({
                memberId,
                name: current.name,
                strengthGain, dexterityGain, speedGain, defenseGain, totalGain,
                isNew: !baselineStats[memberId]
            });
        }

        for (const memberId in baselineStats) {
            if (!currentStats[memberId]) {
                const factionMembersApiUrl = `https://api.torn.com/v2/faction/${userFactionId}?selections=members&key=${userApiKey}`;
                const factionResponse = await fetch(factionMembersApiUrl);
                const factionData = await factionResponse.json();
                const memberInfo = factionData.members ? factionData.members[memberId] : null;
                const name = memberInfo ? memberInfo.name : `User ${memberId}`;

                membersWithGains.push({
                    memberId, name,
                    strengthGain: 0, dexterityGain: 0, speedGain: 0, defenseGain: 0, totalGain: 0
                });
            }
        }

        membersWithGains.sort((a, b) => b.totalGain - a.totalGain);

        let energyRowsHtml = '';
        membersWithGains.forEach(member => {
            const profileUrl = `https://www.torn.com/profiles.php?XID=${member.memberId}`;
            const rowClass = member.isNew ? 'new-member-gain' : '';
            energyRowsHtml += `
                <tr class="${rowClass}">
                    <td><a href="${profileUrl}" target="_blank">${member.name}${member.isNew ? ' (New)' : ''}</a></td>
                    <td>${formatGainValue(member.strengthGain)}</td>
                    <td>${formatGainValue(member.dexterityGain)}</td>
                    <td>${formatGainValue(member.speedGain)}</td>
                    <td>${formatGainValue(member.defenseGain)}</td>
                    <td>${formatGainValue(member.totalGain)}</td>
                </tr>
            `;
        });

        energyTbody.innerHTML = energyRowsHtml.length > 0 ? energyRowsHtml : '<tr><td colspan="6" style="text-align:center;">No energy gains to display.</td></tr>';
        energyMessageContainer.classList.add('hidden');

    } catch (error) {
        console.error("Error displaying energy gains table:", error);
        energyMessageContainer.textContent = `Error loading energy gains: ${error.message}`;
    }
}

// --- Download and Other UI Logic ---

/**
 * Captures the currently active tab's content as an image and triggers a download.
 */
function downloadCurrentTabAsImage() {
    const activeTabPane = document.querySelector('.tab-pane-bb.active');
    if (!activeTabPane) {
        alert('Could not find active content to download.');
        return;
    }

    let originalTable, columnIndicesToKeep, headerTextsToKeep, filename, reportTitle;
    const titleStyle = 'text-align: center; margin-bottom: 15px; font-weight: bold; color: #ADD8E6; font-size: 1.5em;';

    if (activeTabPane.id === 'current-stats-tab') {
        originalTable = document.getElementById('friendly-members-table');
        columnIndicesToKeep = [0, 2, 3, 4, 5, 6];
        headerTextsToKeep = ["Name", "Strength", "Dexterity", "Speed", "Defense", "Total"];
        filename = 'tornpas_current_stats.png';
        const now = new Date();
        reportTitle = `Faction Stats: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    } else if (activeTabPane.id === 'gains-tracking-tab') {
        originalTable = document.getElementById('gains-overview-table');
        columnIndicesToKeep = [0, 1, 2, 3, 4, 5];
        headerTextsToKeep = ["Name", "Strength Gain", "Dexterity Gain", "Speed Gain", "Defense Gain", "Total Gain"];
        filename = 'tornpas_gains_tracking.png';
        if (activeTrackingStartedAt) {
            const startedDate = activeTrackingStartedAt.toDate();
            reportTitle = `Faction Gains Since: ${startedDate.toLocaleDateString()} ${startedDate.toLocaleTimeString()}`;
        } else {
            reportTitle = 'Faction Gains Report';
        }
    } else if (activeTabPane.id === 'energy-tracking-tab') {
        originalTable = document.getElementById('energy-overview-table');
        columnIndicesToKeep = [0, 1, 2, 3, 4, 5];
        headerTextsToKeep = ["Name", "Strength Energy", "Dexterity Energy", "Speed Energy", "Defense Energy", "Total Energy"];
        filename = 'tornpas_energy_tracking.png';
        if (activeEnergyTrackingStartedAt) {
            const startedDate = activeEnergyTrackingStartedAt.toDate();
            reportTitle = `Energy Spent Since: ${startedDate.toLocaleDateString()} ${startedDate.toLocaleTimeString()}`;
        } else {
            reportTitle = 'Energy Tracking Report';
        }
    } else {
        alert('Cannot download data for this tab.');
        return;
    }

    if (!originalTable) {
        alert('Could not find table data to download.');
        return;
    }

    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = '850px';
    tempContainer.style.backgroundColor = '#222';
    tempContainer.style.padding = '20px';
    tempContainer.style.borderRadius = '8px';
    tempContainer.style.color = '#fff';

    if (reportTitle) {
        const titleElement = document.createElement('h3');
        titleElement.style.cssText = titleStyle;
        titleElement.textContent = reportTitle;
        tempContainer.appendChild(titleElement);
    }

    const tempTable = document.createElement('table');
    tempTable.className = 'download-table-preview';

    const tempThead = document.createElement('thead');
    const tempTbody = document.createElement('tbody');

    const tempHeaderRow = document.createElement('tr');
    headerTextsToKeep.forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        tempHeaderRow.appendChild(th);
    });
    tempThead.appendChild(tempHeaderRow);

    const originalRows = originalTable.querySelectorAll('tbody tr');
    originalRows.forEach(originalRow => {
        const tempRow = document.createElement('tr');
        columnIndicesToKeep.forEach(index => {
            const originalCell = originalRow.children[index];
            if (originalCell) {
                const clonedCell = originalCell.cloneNode(true);
                const computedStyle = window.getComputedStyle(originalCell);
                clonedCell.style.backgroundColor = computedStyle.backgroundColor;
                const innerSpan = clonedCell.querySelector('span');
                if (innerSpan) {
                    clonedCell.style.color = window.getComputedStyle(innerSpan).color;
                } else {
                    clonedCell.style.color = computedStyle.color;
                }
                tempRow.appendChild(clonedCell);
            }
        });
        tempTbody.appendChild(tempRow);
    });

    tempTable.appendChild(tempThead);
    tempTable.appendChild(tempTbody);
    tempContainer.appendChild(tempTable);
    document.body.appendChild(tempContainer);

    html2canvas(tempContainer, { scale: 2, useCORS: true, backgroundColor: null })
        .then(canvas => {
            const link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL('image/png');
            link.click();
        }).catch(error => {
            console.error('Error capturing element for download:', error);
            alert('Could not download image. Please check the console for details.');
        }).finally(() => {
            document.body.removeChild(tempContainer);
        });
}

function managePortraitBlocker() {
    const isMobilePortrait = window.matchMedia("(max-width: 600px) and (orientation: portrait)").matches;
    let blocker = document.getElementById('portrait-blocker');
    const mainContentArea = document.querySelector('.page-specific-content-area');
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');

    if (isMobilePortrait) {
        if (!blocker) {
            blocker = document.createElement('div');
            blocker.id = 'portrait-blocker';
            blocker.style.cssText = `...`; // Your existing styles
            blocker.innerHTML = `...`; // Your existing innerHTML
            document.body.appendChild(blocker);
            // ... your button logic
        }

        if (header) header.style.display = 'none';
        if (mainContentArea) mainContentArea.style.display = 'none';
        if (footer) footer.style.display = 'none';
        document.body.style.overflow = 'hidden';

    } else {
        if (blocker) blocker.remove();
        if (header) header.style.display = '';
        if (mainContentArea) mainContentArea.style.display = '';
        if (footer) footer.style.display = '';
        document.body.style.overflow = '';
    }
}

// Global variable to hold the function for tab switching
let showTab;

// --- Main execution block and event listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // --- Initialize Loading Message ---
    const currentStatsTabContainer = document.querySelector('#current-stats-tab .table-container');
    if (currentStatsTabContainer) {
        loadingMessageElement = document.createElement('p');
        loadingMessageElement.id = 'loading-message-container';
        loadingMessageElement.textContent = 'Loading faction member data...';
        currentStatsTabContainer.prepend(loadingMessageElement);
    }

    // --- DOM Elements ---
    const tabButtons = document.querySelectorAll('.tab-button-bb');
    const tabPanes = document.querySelectorAll('.tab-pane-bb');
    const downloadButton = document.getElementById('downloadTableDataBtn');
    const startTrackingBtn = document.getElementById('startTrackingBtn');
    const stopTrackingBtn = document.getElementById('stopTrackingBtn');
    const startEnergyTrackingBtn = document.getElementById('startEnergyTrackingBtn');
    const stopEnergyTrackingBtn = document.getElementById('stopEnergyTrackingBtn');

    // --- Setup Sorting Functionality ---
    dynamicallySetSortKeys();
    initializeTableSorting();

    // --- Event Listeners ---
    if (downloadButton) downloadButton.addEventListener('click', downloadCurrentTabAsImage);
    if (startTrackingBtn) startTrackingBtn.addEventListener('click', startTrackingGains);
    if (stopTrackingBtn) stopTrackingBtn.addEventListener('click', stopTrackingGains);
    if (startEnergyTrackingBtn) startEnergyTrackingBtn.addEventListener('click', startEnergyTracking);
    if (stopEnergyTrackingBtn) stopEnergyTrackingBtn.addEventListener('click', stopEnergyTracking);

    // --- Tab Switching Logic (remains the same) ---
    showTab = function(tabId) { 
        tabPanes.forEach(pane => pane.classList.toggle('active', pane.id === tabId));
        tabButtons.forEach(button => button.classList.toggle('active', button.dataset.tab + '-tab' === tabId));

        if (unsubscribeFromTrackingStatus) unsubscribeFromTrackingStatus();
        if (unsubscribeFromEnergyTrackingStatus) unsubscribeFromEnergyTrackingStatus();

        if (userFactionIdFromProfile) {
            if (tabId === 'current-stats-tab') {
                if (userApiKey && auth.currentUser) {
                    updateFriendlyMembersTable(userApiKey, auth.currentUser.uid);
                }
            } else if (tabId === 'gains-tracking-tab') {
                setupRealtimeTrackingStatusListener(userFactionIdFromProfile);
            } else if (tabId === 'energy-tracking-tab') {
                setupRealtimeEnergyTrackingStatusListener(userFactionIdFromProfile);
            }
        }
    }

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            showTab(button.dataset.tab + '-tab');
        });
    });

    // --- Authentication and Initial Data Load (remains the same) ---
    auth.onAuthStateChanged(async (user) => {
        currentFirebaseUserUid = user ? user.uid : null;
        if (user) {
            try {
                const userProfileDoc = await db.collection('userProfiles').doc(user.uid).get();
                if (userProfileDoc.exists) {
                    const userData = userProfileDoc.data();
                    userApiKey = userData.tornApiKey || null;
                    userTornProfileId = userData.tornProfileId || null;
                    userFactionIdFromProfile = userData.faction_id || null;
                    currentUserHasTrackerAccess = await checkIfUserHasTrackerAccess(user.uid);
                    const gainsTabButton = document.querySelector('[data-tab="gains-tracking"]');
                    const energyTabButton = document.querySelector('[data-tab="energy-tracking"]');
                    if (gainsTabButton && energyTabButton) {
                        if (currentUserHasTrackerAccess) {
                            gainsTabButton.classList.remove('hidden');
                            energyTabButton.classList.remove('hidden');
                        } else {
                            gainsTabButton.classList.add('hidden');
                            energyTabButton.classList.add('hidden');
                            const activeTabButton = document.querySelector('.tab-button-bb.active');
                            if (activeTabButton === gainsTabButton || activeTabButton === energyTabButton) {
                                showTab('current-stats-tab');
                            }
                        }
                    }
                    if (userFactionIdFromProfile) {
                        setupRealtimeTrackingStatusListener(userFactionIdFromProfile);
                        setupRealtimeEnergyTrackingStatusListener(userFactionIdFromProfile);
                    } else {
                        updateGainTrackingUI();
                        updateEnergyTrackingUI();
                    }
                    const activeTab = document.querySelector('.tab-pane-bb.active').id;
                    if (userApiKey && activeTab === 'current-stats-tab') {
                        await updateFriendlyMembersTable(userApiKey, user.uid);
                    } else if (!userApiKey) {
                        hideLoadingMessage();
                        document.getElementById('friendly-members-tbody').innerHTML = '<tr><td colspan="11" style="text-align:center; color: yellow;">Please add your Torn API key in settings.</td></tr>';
                    }
                } else {
                    hideLoadingMessage();
                    document.getElementById('friendly-members-tbody').innerHTML = '<tr><td colspan="11" style="text-align:center; color: yellow;">User profile not found.</td></tr>';
                }
            } catch (error) {
                console.error("Error fetching user profile:", error);
                hideLoadingMessage();
                document.getElementById('friendly-members-tbody').innerHTML = `<tr><td colspan="11" style="color:red;">Error: ${error.message}.</td></tr>`;
            }
        } else {
            hideLoadingMessage();
            document.getElementById('friendly-members-tbody').innerHTML = '<tr><td colspan="11" style="text-align:center;">Please log in to view stats.</td></tr>';
            const gainsTabButton = document.querySelector('[data-tab="gains-tracking"]');
            const energyTabButton = document.querySelector('[data-tab="energy-tracking"]');
            if (gainsTabButton) gainsTabButton.classList.add('hidden');
            if (energyTabButton) energyTabButton.classList.add('hidden');
            updateGainTrackingUI();
            updateEnergyTrackingUI();
        }
    });

    // Orientation handlers
    window.addEventListener('resize', managePortraitBlocker);
    window.addEventListener('orientationchange', managePortraitBlocker);
    managePortraitBlocker();
});

// ... your existing, unchanged orientation handler code ...
let portraitBlocker = null;
let landscapeBlocker = null;
function createOverlays() {
    const overlayStyles = {
        display: 'none', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
        backgroundColor: '#1e1e1e', color: '#f0f0f0', textAlign: 'center',
        fontFamily: 'sans-serif', fontSize: '1.5em', zIndex: '99999'
    };
    const buttonStyles = {
        backgroundColor: '#007bff', color: 'black', padding: '8px 15px', border: 'none',
        borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginTop: '20px',
        textDecoration: 'none', fontSize: '16px'
    };
    if (!document.getElementById('tablet-portrait-blocker')) {
        portraitBlocker = document.createElement('div');
        portraitBlocker.id = 'tablet-portrait-blocker';
        Object.assign(portraitBlocker.style, overlayStyles);
        portraitBlocker.innerHTML = `<div><h2>Please Rotate Your Device</h2><p style="font-size: 0.7em; margin-top: 5px;">This page is best viewed in portrait mode.</p><button id="return-home-btn-tablet">Return to Home</button></div>`;
        document.body.appendChild(portraitBlocker);
        const tabletReturnBtn = document.getElementById('return-home-btn-tablet');
        if (tabletReturnBtn) {
            Object.assign(tabletReturnBtn.style, buttonStyles);
            tabletReturnBtn.addEventListener('click', () => { window.location.href = 'home.html'; });
        }
    }
    if (!document.getElementById('mobile-landscape-blocker')) {
        landscapeBlocker = document.createElement('div');
        landscapeBlocker.id = 'mobile-landscape-blocker';
        Object.assign(landscapeBlocker.style, overlayStyles);
        landscapeBlocker.innerHTML = `<div><div style="transform: rotate(90deg); font-size: 50px; margin-bottom: 20px;">📱</div><h2>Please Rotate Your Device</h2><p style="font-size: 0.7em; margin-top: 5px;">For the best viewing experience, please use landscape mode.</p><button id="return-home-btn-mobile">Return to Home</button></div>`;
        document.body.appendChild(landscapeBlocker);
        const mobileReturnBtn = document.getElementById('return-home-btn-mobile');
        if (mobileReturnBtn) {
            Object.assign(mobileReturnBtn.style, buttonStyles);
            mobileReturnBtn.addEventListener('click', () => { window.location.href = 'home.html'; });
        }
    }
}
function handleOrientation() {
    if (!portraitBlocker || !landscapeBlocker) {
        createOverlays();
        portraitBlocker = document.getElementById('tablet-portrait-blocker');
        landscapeBlocker = document.getElementById('mobile-landscape-blocker');
        if (!portraitBlocker || !landscapeBlocker) return;
    }
    portraitBlocker.style.display = 'none';
    landscapeBlocker.style.display = 'none';
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;
    const isLandscape = !isPortrait;
    const shortestSide = Math.min(window.screen.width, window.screen.height);
    const isPhone = shortestSide < 600;
    const isTablet = shortestSide >= 600 && shortestSide < 1024;
    if (isPhone && isPortrait) {
        landscapeBlocker.style.display = 'flex';
    } else if (isTablet && isLandscape) {
        portraitBlocker.style.display = 'flex';
    }
}
document.addEventListener('DOMContentLoaded', handleOrientation);
window.addEventListener('resize', handleOrientation);
window.addEventListener('orientationchange', handleOrientation);