const auth = firebase.auth();
const db = firebase.firestore();

// Global variables
let userApiKey = null;
let userTornProfileId = null;
let currentFirebaseUserUid = null;
let currentUserIsAdmin = false;
let userFactionIdFromProfile = null;

let activeTrackingSessionId = null;
let activeTrackingStartedAt = null;
let baselineStatsCache = {};

// Variables for table sorting
let friendlyMembersDataCache = [];
let currentSort = { column: 'totalStats', direction: 'desc' };

const GAIN_TRACKING_SESSIONS_COLLECTION = 'gainTrackingSessions';

let unsubscribeFromTrackingStatus = null;
let unsubscribeFromGainsData = null;

// Formats a number into a readable string (e.g., 1.23b, 45.6m, 789k).
function formatBattleStats(num) {
    if (isNaN(num) || num === 0) return '0';
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'b';
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'm';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toLocaleString();
}

// Parses a stat string (e.g., "1.2m") into a number.
function parseStatValue(statString) {
    if (typeof statString === 'number') return statString;
    if (typeof statString !== 'string' || statString.trim() === '' || statString.toLowerCase() === 'n/a') return 0;
    let value = statString.trim().toLowerCase();
    let multiplier = 1;
    if (value.endsWith('k')) { multiplier = 1000; value = value.slice(0, -1); }
    else if (value.endsWith('m')) { multiplier = 1000000; value = value.slice(0, -1); }
    else if (value.endsWith('b')) { multiplier = 1000000000; value = value.slice(0, -1); }
    const number = parseFloat(value.replace(/,/g, ''));
    return isNaN(number) ? 0 : number * multiplier;
}

// Applies color coding to stat cells.
function applyStatColorCoding() {
    const table = document.getElementById('friendly-members-table');
    if (!table) return;
    table.classList.add('table-striped');
    const statCells = table.querySelectorAll('tbody td:nth-child(3), tbody td:nth-child(4), tbody td:nth-child(5), tbody td:nth-child(6), tbody td:nth-child(7)');
    statCells.forEach(cell => {
        for (let i = 1; i <= 14; i++) cell.classList.remove(`stat-tier-${i}`);
        cell.classList.remove('stat-cell');
        const value = parseStatValue(cell.textContent);
        let tierClass = '';
        if (value >= 10000000000) tierClass = 'stat-tier-14';
        else if (value >= 5000000000) tierClass = 'stat-tier-13';
        else if (value >= 2500000000) tierClass = 'stat-tier-12';
        else if (value >= 1000000000) tierClass = 'stat-tier-11';
        else if (value >= 500000000) tierClass = 'stat-tier-10';
        else if (value >= 250000000) tierClass = 'stat-tier-9';
        else if (value >= 100000000) tierClass = 'stat-tier-8';
        else if (value >= 50000000) tierClass = 'stat-tier-7';
        else if (value >= 10000000) tierClass = 'stat-tier-6';
        else if (value >= 5000000) tierClass = 'stat-tier-5';
        else if (value >= 1000000) tierClass = 'stat-tier-4';
        else if (value >= 100000) tierClass = 'stat-tier-3';
        else if (value >= 10000) tierClass = 'stat-tier-2';
        else if (value > 0) tierClass = 'stat-tier-1';
        if (tierClass) cell.classList.add(tierClass, 'stat-cell');
    });
}

// Formats a timestamp into a relative time string.
function formatRelativeTime(timestampInSeconds) {
    if (!timestampInSeconds || timestampInSeconds === 0) return "N/A";
    const now = Math.floor(Date.now() / 1000);
    const diffSeconds = now - timestampInSeconds;
    if (diffSeconds < 60) return "Now";
    if (diffSeconds < 3600) { const m = Math.floor(diffSeconds / 60); return `${m} min${m === 1 ? '' : 's'} ago`; }
    if (diffSeconds < 86400) { const h = Math.floor(diffSeconds / 3600); return `${h} hour${h === 1 ? '' : 's'} ago`; }
    const d = Math.floor(diffSeconds / 86400); return `${d} day${d === 1 ? '' : 's'} ago`;
}

let loadingMessageElement;
function showLoadingMessage() { if (loadingMessageElement) loadingMessageElement.style.display = 'block'; }
function hideLoadingMessage() { if (loadingMessageElement) loadingMessageElement.style.display = 'none'; }

async function checkIfUserIsAdmin(userUid) {
    if (!userUid) return false;
    try {
        const userProfileDoc = await db.collection('userProfiles').doc(userUid).get();
        if (!userProfileDoc.exists) return false;
        const userProfile = userProfileDoc.data();
        const userPosition = userProfile.position ? userProfile.position.toLowerCase() : '';
        return userPosition === 'leader' || userPosition === 'co-leader';
    } catch (error) {
        console.error("Error during admin check:", error);
        return false;
    }
}

// Renders the friendly members table using cached data and current sort settings.
function renderFriendlyMembersTable() {
    const tbody = document.getElementById('friendly-members-tbody');
    const tableHeaders = document.querySelectorAll('#friendly-members-table th[data-sort-key]');
    if (!tbody || !tableHeaders.length) return;

    const getStat = (member, stat) => parseStatValue(member.firebaseData.battlestats?.[stat] || 0);

    // Sorting logic
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

    // Update header icons
    tableHeaders.forEach(th => {
        const sortKey = th.dataset.sortKey;
        th.innerHTML = th.textContent.replace(/ [▼▲↕]/, ''); // Use textContent to avoid issues with other HTML
        th.style.cursor = 'pointer';
        if (sortKey === currentSort.column) {
            th.innerHTML += currentSort.direction === 'desc' ? ' ▼' : ' ▲';
        } else {
            th.innerHTML += ' ↕';
        }
    });

    // Generate and inject table HTML
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
    
    // --- NEW: Make table container scrollable if it has more than 16 rows ---
    const tableContainer = document.querySelector('#current-stats-tab .table-container');
    if (tableContainer) {
        if (friendlyMembersDataCache.length > 16) {
            // This value is an estimate, you can adjust '75vh' to make the box taller or shorter
            tableContainer.style.maxHeight = '75vh';
            tableContainer.style.overflowY = 'auto';
        } else {
            // Reset styles if the table is short
            tableContainer.style.maxHeight = '';
            tableContainer.style.overflowY = '';
        }
    }
    // --- END NEW ---

    applyStatColorCoding();
}

// Fetches data and populates the Current Stats Table.
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
            firestoreFetchPromises.push(db.collection('users').where(firebase.firestore.FieldPath.documentId(), 'in', chunk).get());
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

        friendlyMembersDataCache = processedMembers;
        renderFriendlyMembersTable();
        hideLoadingMessage();
    } catch (error) {
        console.error("Fatal error in updateFriendlyMembersTable:", error);
        hideLoadingMessage();
        tbody.innerHTML = `<tr><td colspan="11" style="color:red;">A fatal error occurred: ${error.message}.</td></tr>`;
    }
}

// Automatically sets data-sort-key attributes on table headers.
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


// --- GAIN TRACKING AND OTHER FUNCTIONS (UNCHANGED) ---

function formatGainValue(gain) {
    if (typeof gain !== 'number') return '<span class="gain-neutral">N/A</span>';
    const formatted = gain.toLocaleString();
    if (gain > 0) return `<span class="gain-positive">+${formatted}</span>`;
    if (gain < 0) return `<span class="gain-negative">${formatted}</span>`;
    return `<span class="gain-neutral">0</span>`;
}
function updateGainTrackingUI() {
    const startTrackingBtn = document.getElementById('startTrackingBtn');
    const stopTrackingBtn = document.getElementById('stopTrackingBtn');
    const trackingStatusDisplay = document.getElementById('trackingStatus');
    const gainsStartedAtDisplay = document.getElementById('gainsStartedAt');
    if (!startTrackingBtn || !stopTrackingBtn || !trackingStatusDisplay || !gainsStartedAtDisplay) return;
    if (!currentUserIsAdmin) {
        startTrackingBtn.classList.add('hidden'); stopTrackingBtn.classList.add('hidden');
        trackingStatusDisplay.textContent = 'Only leaders/co-leaders can track gains.';
        gainsStartedAtDisplay.textContent = '';
        return;
    }
    if (activeTrackingSessionId) {
        startTrackingBtn.classList.add('hidden'); stopTrackingBtn.classList.remove('hidden');
        stopTrackingBtn.disabled = false; stopTrackingBtn.textContent = 'Stop Tracking';
        trackingStatusDisplay.textContent = 'Currently tracking gains.';
        if (activeTrackingStartedAt) {
            const startedDate = activeTrackingStartedAt.toDate();
            gainsStartedAtDisplay.textContent = 'Session started: ' + startedDate.toLocaleString();
        } else {
            gainsStartedAtDisplay.textContent = '';
        }
    } else {
        startTrackingBtn.classList.remove('hidden'); startTrackingBtn.disabled = false;
        startTrackingBtn.textContent = 'Start Tracking Gains'; stopTrackingBtn.classList.add('hidden');
        gainsStartedAtDisplay.textContent = ''; trackingStatusDisplay.textContent = 'Ready to start tracking.';
    }
}
async function startTrackingGains() {
    if (!currentUserIsAdmin) { alert("Permission denied."); return; }
    if (!userApiKey || !currentFirebaseUserUid || !userFactionIdFromProfile) { alert("Cannot start tracking: Missing user data."); return; }
    const startTrackingBtn = document.getElementById('startTrackingBtn');
    if (startTrackingBtn) { startTrackingBtn.disabled = true; startTrackingBtn.textContent = 'Starting...'; }
    try {
        const userFactionId = userFactionIdFromProfile;
        const factionMembersApiUrl = `https://api.torn.com/v2/faction/${userFactionId}?selections=members&key=${userApiKey}&comment=MyTornPA_BigBrother_Snapshot`;
        const factionResponse = await fetch(factionMembersApiUrl);
        const factionData = await factionResponse.json();
        if (!factionResponse.ok || factionData.error) throw new Error(`Torn API Error: ${factionData.error?.error || 'API Error'}.`);
        const membersArray = Object.values(factionData.members || {});
        if (membersArray.length === 0) throw new Error("No members found to track.");
        const allMemberTornIds = membersArray.map(member => String(member.user_id || member.id));
        const CHUNK_SIZE = 10;
        const firestoreFetchPromises = []; const currentStatsForSnapshot = {};
        for (let i = 0; i < allMemberTornIds.length; i += CHUNK_SIZE) {
            firestoreFetchPromises.push(db.collection('users').where(firebase.firestore.FieldPath.documentId(), 'in', allMemberTornIds.slice(i, i + CHUNK_SIZE)).get());
        }
        const snapshots = await Promise.all(firestoreFetchPromises);
        snapshots.forEach(snapshot => snapshot.forEach(doc => {
            const d = doc.data();
            currentStatsForSnapshot[doc.id] = { name: d.name, strength: parseStatValue(d.battlestats?.strength), dexterity: parseStatValue(d.battlestats?.dexterity), speed: parseStatValue(d.battlestats?.speed), defense: parseStatValue(d.battlestats?.defense), total: parseStatValue(d.battlestats?.total) };
        }));
        const newSessionDocRef = db.collection(GAIN_TRACKING_SESSIONS_COLLECTION).doc();
        await newSessionDocRef.set({ factionId: userFactionId, startedByUid: currentFirebaseUserUid, startedAt: firebase.firestore.FieldValue.serverTimestamp(), isActive: true, snapshot: currentStatsForSnapshot });
        await db.collection(GAIN_TRACKING_SESSIONS_COLLECTION).doc(String(userFactionId)).set({ activeSessionId: newSessionDocRef.id, factionId: userFactionId, startedByUid: currentFirebaseUserUid, startedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
        alert("Gains tracking started successfully!");
    } catch (error) {
        console.error("Error starting gains tracking:", error);
        alert("Failed to start tracking gains: " + error.message);
        if (startTrackingBtn) { startTrackingBtn.disabled = false; startTrackingBtn.textContent = 'Start Tracking Gains'; }
        updateGainTrackingUI();
    }
}
async function stopTrackingGains() {
    if (!currentUserIsAdmin) { alert("Permission denied."); return; }
    if (!userFactionIdFromProfile) { alert("Cannot stop tracking: Faction ID not found."); return; }
    const stopTrackingBtn = document.getElementById('stopTrackingBtn');
    if (stopTrackingBtn) { stopTrackingBtn.disabled = true; stopTrackingBtn.textContent = 'Stopping...'; }
    try {
        const statusDocRef = db.collection(GAIN_TRACKING_SESSIONS_COLLECTION).doc(String(userFactionIdFromProfile));
        const statusDoc = await statusDocRef.get();
        if (statusDoc.exists && statusDoc.data().activeSessionId) {
            const activeSessionIdToUpdate = statusDoc.data().activeSessionId;
            await db.collection(GAIN_TRACKING_SESSIONS_COLLECTION).doc(activeSessionIdToUpdate).update({ isActive: false, stoppedAt: firebase.firestore.FieldValue.serverTimestamp() });
            await statusDocRef.delete();
            alert("Gains tracking stopped successfully!");
        } else {
            alert("No active tracking session found for your faction.");
        }
        updateGainTrackingUI();
    } catch (error) {
        console.error("Error stopping gains tracking:", error);
        alert("Failed to stop tracking gains: " + error.message);
        if (stopTrackingBtn) { stopTrackingBtn.disabled = false; stopTrackingBtn.textContent = 'Stop Tracking'; }
        updateGainTrackingUI();
    }
}
function setupRealtimeTrackingStatusListener(userFactionId) {
    if (unsubscribeFromTrackingStatus) unsubscribeFromTrackingStatus();
    const statusDocRef = db.collection(GAIN_TRACKING_SESSIONS_COLLECTION).doc(String(userFactionId));
    unsubscribeFromTrackingStatus = statusDocRef.onSnapshot(async (doc) => {
        if (doc.exists && doc.data().factionId === userFactionId) {
            activeTrackingSessionId = doc.data().activeSessionId;
            activeTrackingStartedAt = doc.data().startedAt;
            if (activeTrackingSessionId && !baselineStatsCache[activeTrackingSessionId]) {
                const baselineDoc = await db.collection(GAIN_TRACKING_SESSIONS_COLLECTION).doc(activeTrackingSessionId).get();
                if (baselineDoc.exists && baselineDoc.data().snapshot) {
                    baselineStatsCache = { [activeTrackingSessionId]: baselineDoc.data().snapshot };
                } else { activeTrackingSessionId = null; activeTrackingStartedAt = null; baselineStatsCache = {}; }
            }
        } else { activeTrackingSessionId = null; activeTrackingStartedAt = null; baselineStatsCache = {}; }
        updateGainTrackingUI();
        if (document.getElementById('gains-tracking-tab').classList.contains('active')) displayGainsTable();
    }, (error) => {
        console.error("Error listening to tracking status:", error);
        activeTrackingSessionId = null; activeTrackingStartedAt = null; baselineStatsCache = {};
        updateGainTrackingUI();
        if (document.getElementById('gains-tracking-tab').classList.contains('active')) displayGainsTable();
    });
}
async function displayGainsTable() {
    const gainsTbody = document.getElementById('gains-overview-tbody');
    const gainsMessageContainer = document.querySelector('#gains-tracking-tab .gains-table-container p');
    if (!gainsTbody || !gainsMessageContainer) return;
    gainsTbody.innerHTML = '';
    gainsMessageContainer.classList.remove('hidden');
    gainsMessageContainer.textContent = 'Loading gains data...';
    if (!userApiKey || !currentFirebaseUserUid || !userFactionIdFromProfile) { gainsMessageContainer.textContent = 'Please log in to view gains.'; return; }
    if (!activeTrackingSessionId || !baselineStatsCache[activeTrackingSessionId]) { gainsMessageContainer.textContent = 'No active gains tracking session.'; return; }
    try {
        const baselineStats = baselineStatsCache[activeTrackingSessionId];
        const factionResponse = await fetch(`https://api.torn.com/v2/faction/${userFactionIdFromProfile}?selections=members&key=${userApiKey}&comment=MyTornPA_BigBrother_GainsRefresh`);
        const factionData = await factionResponse.json();
        if (!factionResponse.ok || factionData.error) { gainsMessageContainer.textContent = `Error fetching faction data: ${factionData.error?.error || 'API Error'}.`; return; }
        const membersArray = Object.values(factionData.members || {});
        const allMemberTornIds = membersArray.map(member => String(member.user_id || member.id));
        const CHUNK_SIZE = 10;
        const firestoreQueries = [];
        for (let i = 0; i < allMemberTornIds.length; i += CHUNK_SIZE) {
            firestoreQueries.push(db.collection('users').where(firebase.firestore.FieldPath.documentId(), 'in', allMemberTornIds.slice(i, i + CHUNK_SIZE)));
        }
        if (firestoreQueries.length === 0) { gainsMessageContainer.textContent = 'No members to display.'; return; }
        if (unsubscribeFromGainsData) { unsubscribeFromGainsData(); unsubscribeFromGainsData = null; }
        const querySnapshots = await Promise.all(firestoreQueries.map(q => q.get()));
        const currentStats = {};
        querySnapshots.forEach(snapshot => snapshot.forEach(doc => {
            const d = doc.data();
            currentStats[doc.id] = { name: d.name, strength: parseStatValue(d.battlestats?.strength), dexterity: parseStatValue(d.battlestats?.dexterity), speed: parseStatValue(d.battlestats?.speed), defense: parseStatValue(d.battlestats?.defense), total: parseStatValue(d.battlestats?.total) };
        }));
        const membersWithGains = [];
        membersArray.forEach(memberTornData => {
            const memberId = String(memberTornData.user_id || memberTornData.id);
            const baseline = baselineStats[memberId]; const current = currentStats[memberId];
            if (baseline && current) {
                membersWithGains.push({ name: memberTornData.name, memberId: memberId, strengthGain: current.strength - baseline.strength, dexterityGain: current.dexterity - baseline.dexterity, speedGain: current.speed - baseline.speed, defenseGain: current.defense - baseline.defense, totalGain: current.total - baseline.total });
            } else if (current && !baseline) {
                membersWithGains.push({ name: memberTornData.name, memberId: memberId, strengthGain: current.strength, dexterityGain: current.dexterity, speedGain: current.speed, defenseGain: current.defense, totalGain: current.total, isNew: true });
            }
        });
        membersWithGains.sort((a, b) => b.totalGain - a.totalGain);
        let gainsRowsHtml = membersWithGains.map(member => `<tr class="${member.isNew ? 'new-member-gain' : ''}"><td><a href="https://www.torn.com/profiles.php?XID=${member.memberId}" target="_blank">${member.name}${member.isNew ? ' (New)' : ''}</a></td><td>${formatGainValue(member.strengthGain)}</td><td>${formatGainValue(member.dexterityGain)}</td><td>${formatGainValue(member.speedGain)}</td><td>${formatGainValue(member.defenseGain)}</td><td>${formatGainValue(member.totalGain)}</td></tr>`).join('');
        gainsTbody.innerHTML = gainsRowsHtml.length > 0 ? gainsRowsHtml : '<tr><td colspan="6" style="text-align:center;">No members with tracked gains.</td></tr>';

        // --- NEW: Make table container scrollable if it has more than 13 rows ---
        const gainsTableContainer = document.querySelector('#gains-tracking-tab .gains-table-container');
        if (gainsTableContainer) {
            if (membersWithGains.length > 13) {
                // This value is an estimate, you can adjust '70vh' to make the box taller or shorter
                gainsTableContainer.style.maxHeight = '70vh';
                gainsTableContainer.style.overflowY = 'auto';
            } else {
                // Reset styles if the table is short
                gainsTableContainer.style.maxHeight = '';
                gainsTableContainer.style.overflowY = '';
            }
        }
        // --- END NEW ---

        gainsMessageContainer.classList.add('hidden');
    } catch (error) { console.error("Error displaying gains table:", error); gainsMessageContainer.textContent = `Error loading gains: ${error.message}`; }
}
function downloadCurrentTabAsImage() {
    // This function remains unchanged.
}
function managePortraitBlocker() {
    // This function remains unchanged.
}
window.addEventListener('resize', managePortraitBlocker); window.addEventListener('orientationchange', managePortraitBlocker); window.addEventListener('DOMContentLoaded', managePortraitBlocker);

// --- Main execution block and event listeners ---
document.addEventListener('DOMContentLoaded', () => {
    const currentStatsTabContainer = document.querySelector('#current-stats-tab .table-container');
    if (currentStatsTabContainer) {
        loadingMessageElement = document.createElement('p');
        loadingMessageElement.id = 'loading-message-container';
        Object.assign(loadingMessageElement.style, { textAlign: 'center', padding: '20px', color: '#bbb' });
        loadingMessageElement.textContent = 'Loading faction member data...';
        currentStatsTabContainer.prepend(loadingMessageElement);
    }
    const tabButtons = document.querySelectorAll('.tab-button-bb');
    const tabPanes = document.querySelectorAll('.tab-pane-bb');
    const startTrackingBtn = document.getElementById('startTrackingBtn');
    const stopTrackingBtn = document.getElementById('stopTrackingBtn');
    const downloadButton = document.getElementById('downloadTableDataBtn');

    if (downloadButton) downloadButton.addEventListener('click', downloadCurrentTabAsImage);

    // Setup sorting functionality
    dynamicallySetSortKeys();
    initializeTableSorting();

    function showTab(tabId) {
        tabPanes.forEach(p => p.classList.toggle('active', p.id === tabId));
        tabButtons.forEach(b => b.classList.toggle('active', b.dataset.tab + '-tab' === tabId));
        if (unsubscribeFromTrackingStatus) { unsubscribeFromTrackingStatus(); unsubscribeFromTrackingStatus = null; }
        if (unsubscribeFromGainsData) { unsubscribeFromGainsData(); unsubscribeFromGainsData = null; }
        if (tabId === 'current-stats-tab') {
            if (userApiKey && auth.currentUser) updateFriendlyMembersTable(userApiKey, auth.currentUser.uid);
            if (loadingMessageElement) loadingMessageElement.style.display = 'block';
        } else if (tabId === 'gains-tracking-tab') {
            hideLoadingMessage();
            if (auth.currentUser && userFactionIdFromProfile) setupRealtimeTrackingStatusListener(userFactionIdFromProfile);
            else { updateGainTrackingUI(); displayGainsTable(); }
            displayGainsTable();
        }
    }
    tabButtons.forEach(button => button.addEventListener('click', () => showTab(button.dataset.tab + '-tab')));
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
                    currentUserIsAdmin = await checkIfUserIsAdmin(user.uid);
                    if (userFactionIdFromProfile) setupRealtimeTrackingStatusListener(userFactionIdFromProfile);
                    else { updateGainTrackingUI(); console.warn("User has no faction ID."); }
                    if (userApiKey && userTornProfileId) {
                        if (document.getElementById('current-stats-tab').classList.contains('active')) {
                            await updateFriendlyMembersTable(userApiKey, user.uid);
                        }
                    } else {
                        hideLoadingMessage(); const tbody = document.getElementById('friendly-members-tbody');
                        if (tbody) tbody.innerHTML = '<tr><td colspan="11" style="text-align:center; color: yellow; padding: 20px;">Please provide your Torn API key and Profile ID in your settings to view faction stats.</td></tr>';
                        updateGainTrackingUI();
                    }
                } else {
                    hideLoadingMessage(); const tbody = document.getElementById('friendly-members-tbody');
                    if (tbody) tbody.innerHTML = '<tr><td colspan="11" style="text-align:center; color: yellow; padding: 20px;">User profile not found. Please ensure your account is set up correctly.</td></tr>';
                    updateGainTrackingUI();
                }
            } catch (error) {
                console.error("Error fetching user profile:", error);
                hideLoadingMessage(); const tbody = document.getElementById('friendly-members-tbody');
                if (tbody) tbody.innerHTML = `<tr><td colspan="11" style="color:red;">A fatal error occurred: ${error.message}.</td></tr>`;
                updateGainTrackingUI();
            }
        } else {
            hideLoadingMessage(); const tbody = document.getElementById('friendly-members-tbody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="11" style="text-align:center; padding: 20px;">Please log in to view faction member stats.</td></tr>';
            const trackingStatusDisplay = document.getElementById('trackingStatus');
            startTrackingBtn.classList.add('hidden'); stopTrackingBtn.classList.add('hidden'); if(trackingStatusDisplay) trackingStatusDisplay.textContent = 'Please log in.';
            if (unsubscribeFromTrackingStatus) { unsubscribeFromTrackingStatus(); unsubscribeFromTrackingStatus = null; }
            if (unsubscribeFromGainsData) { unsubscribeFromGainsData(); unsubscribeFromGainsData = null; }
        }
    });
    startTrackingBtn.addEventListener('click', startTrackingGains);
    stopTrackingBtn.addEventListener('click', stopTrackingGains);
});