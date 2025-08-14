// File: ../js/tornpas-big-brother.js

const auth = firebase.auth();
const db = firebase.firestore();

// Global variables for user data and tracking state
let userApiKey = null;
let userTornProfileId = null;
let currentFirebaseUserUid = null;
let currentUserIsAdmin = false;
let userFactionIdFromProfile = null;

let activeTrackingSessionId = null;
let activeTrackingStartedAt = null;
let baselineStatsCache = {};

// --- ADDED FOR TABLE SORTING ---
let friendlyMembersDataCache = [];
let currentSort = { column: 'totalStats', direction: 'desc' };
// --- END TABLE SORTING VARS ---

const GAIN_TRACKING_SESSIONS_COLLECTION = 'gainTrackingSessions';

let unsubscribeFromTrackingStatus = null;
let unsubscribeFromGainsData = null;

// Formats a raw number into a human-readable string (e.g., 1.23b, 45.6m, 789k).
function formatBattleStats(num) {
    if (isNaN(num) || num === 0) return '0';
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'b';
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'm';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toLocaleString();
}

// Helper function to parse a stat string (which might contain 'k', 'm', 'b') into a number.
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

// Applies CSS classes to table cells based on battle stat tiers for color coding.
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
            cell.classList.add(tierClass, 'stat-cell');
        }
    });
}

// Formats a Unix timestamp (in seconds) into a relative time string.
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
        console.error("Error during admin check in TornPAs Big Brother:", error);
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
        th.innerHTML = th.innerHTML.replace(/ [▼▲↕]/, ''); // Remove old icons
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
        const strength = formatBattleStats(parseStatValue(firebaseData.battlestats?.strength || 0));
        const dexterity = formatBattleStats(parseStatValue(firebaseData.battlestats?.dexterity || 0));
        const speed = formatBattleStats(parseStatValue(firebaseData.battlestats?.speed || 0));
        const defense = formatBattleStats(parseStatValue(firebaseData.battlestats?.defense || 0));
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

// Main Data Fetching Function for the Current Stats Table
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
        const refreshResponse = await fetch(`/.netlify/functions/refresh-faction-data?factionId=${userFactionId}`);
        if (!refreshResponse.ok) {
            const errorResult = await refreshResponse.json().catch(() => ({ message: "Unknown refresh error" }));
            console.error("Backend refresh failed:", errorResult.message);
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

        friendlyMembersDataCache = processedMembers;
        renderFriendlyMembersTable();
        hideLoadingMessage();
    } catch (error) {
        console.error("Fatal error in updateFriendlyMembersTable:", error);
        hideLoadingMessage();
        tbody.innerHTML = `<tr><td colspan="11" style="color:red;">A fatal error occurred: ${error.message}.</td></tr>`;
    }
}

// Adds click listeners to table headers to enable sorting.
function initializeTableSorting() {
    const tableHeaders = document.querySelectorAll('#friendly-members-table th[data-sort-key]');
    tableHeaders.forEach(th => {
        th.addEventListener('click', () => {
            const sortKey = th.dataset.sortKey;
            if (currentSort.column === sortKey) {
                currentSort.direction = currentSort.direction === 'desc' ? 'asc' : 'desc';
            } else {
                currentSort.column = sortKey;
                currentSort.direction = (sortKey === 'name' || sortKey === 'status') ? 'asc' : 'desc';
            }
            renderFriendlyMembersTable();
        });
    });
}

// --- Gain Tracking Core Logic (Unchanged) ---
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
        startTrackingBtn.classList.add('hidden');
        stopTrackingBtn.classList.add('hidden');
        trackingStatusDisplay.textContent = 'Only leaders/co-leaders can track gains.';
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
                const d = doc.data();
                currentStatsForSnapshot[doc.id] = { name: d.name, strength: parseStatValue(d.battlestats?.strength), dexterity: parseStatValue(d.battlestats?.dexterity), speed: parseStatValue(d.battlestats?.speed), defense: parseStatValue(d.battlestats?.defense), total: parseStatValue(d.battlestats?.total) };
            });
        });
        const newSessionDocRef = db.collection(GAIN_TRACKING_SESSIONS_COLLECTION).doc();
        await newSessionDocRef.set({ factionId: userFactionId, startedByUid: currentFirebaseUserUid, startedAt: firebase.firestore.FieldValue.serverTimestamp(), isActive: true, snapshot: currentStatsForSnapshot });
        const factionStatusDocId = String(userFactionId);
        await db.collection(GAIN_TRACKING_SESSIONS_COLLECTION).doc(factionStatusDocId).set({ activeSessionId: newSessionDocRef.id, factionId: userFactionId, startedByUid: currentFirebaseUserUid, startedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
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
        const factionStatusDocId = String(userFactionIdFromProfile);
        const statusDocRef = db.collection(GAIN_TRACKING_SESSIONS_COLLECTION).doc(factionStatusDocId);
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
                } else {
                    activeTrackingSessionId = null; activeTrackingStartedAt = null; baselineStatsCache = {};
                }
            }
        } else {
            activeTrackingSessionId = null; activeTrackingStartedAt = null; baselineStatsCache = {};
        }
        updateGainTrackingUI();
        if (document.getElementById('gains-tracking-tab').classList.contains('active')) {
            displayGainsTable();
        }
    }, (error) => {
        console.error("Error listening to tracking status:", error);
        activeTrackingSessionId = null; activeTrackingStartedAt = null; baselineStatsCache = {};
        updateGainTrackingUI();
        if (document.getElementById('gains-tracking-tab').classList.contains('active')) {
            displayGainsTable();
        }
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
        const userFactionId = userFactionIdFromProfile;
        const baselineStats = baselineStatsCache[activeTrackingSessionId];
        const factionMembersApiUrl = `https://api.torn.com/v2/faction/${userFactionId}?selections=members&key=${userApiKey}&comment=MyTornPA_BigBrother_GainsRefresh`;
        const factionResponse = await fetch(factionMembersApiUrl);
        const factionData = await factionResponse.json();
        if (!factionResponse.ok || factionData.error) { gainsMessageContainer.textContent = `Error fetching faction data: ${factionData.error?.error || 'API Error'}.`; return; }
        const membersArray = Object.values(factionData.members || {});
        const allMemberTornIds = membersArray.map(member => String(member.user_id || member.id));
        const usersCollectionRef = db.collection('users');
        const CHUNK_SIZE = 10;
        const firestoreQueries = [];
        for (let i = 0; i < allMemberTornIds.length; i += CHUNK_SIZE) {
            const chunk = allMemberTornIds.slice(i, i + CHUNK_SIZE);
            firestoreQueries.push(usersCollectionRef.where(firebase.firestore.FieldPath.documentId(), 'in', chunk));
        }
        if (firestoreQueries.length === 0) { gainsMessageContainer.textContent = 'No members to display.'; return; }
        if (unsubscribeFromGainsData) { unsubscribeFromGainsData(); unsubscribeFromGainsData = null; }
        const querySnapshots = await Promise.all(firestoreQueries.map(q => q.get()));
        const currentStats = {};
        querySnapshots.forEach(snapshot => {
            snapshot.forEach(doc => {
                const d = doc.data();
                currentStats[doc.id] = { name: d.name, strength: parseStatValue(d.battlestats?.strength), dexterity: parseStatValue(d.battlestats?.dexterity), speed: parseStatValue(d.battlestats?.speed), defense: parseStatValue(d.battlestats?.defense), total: parseStatValue(d.battlestats?.total) };
            });
        });
        let gainsRowsHtml = '';
        const membersWithGains = [];
        membersArray.forEach(memberTornData => {
            const memberId = String(memberTornData.user_id || memberTornData.id);
            const baseline = baselineStats[memberId];
            const current = currentStats[memberId];
            if (baseline && current) {
                membersWithGains.push({ name: memberTornData.name, memberId: memberId, strengthGain: current.strength - baseline.strength, dexterityGain: current.dexterity - baseline.dexterity, speedGain: current.speed - baseline.speed, defenseGain: current.defense - baseline.defense, totalGain: current.total - baseline.total, initialTotal: baseline.total });
            } else if (current && !baseline) {
                membersWithGains.push({ name: memberTornData.name, memberId: memberId, strengthGain: current.strength, dexterityGain: current.dexterity, speedGain: current.speed, defenseGain: current.defense, totalGain: current.total, initialTotal: current.total, isNew: true });
            }
        });
        membersWithGains.sort((a, b) => b.totalGain - a.totalGain);
        membersWithGains.forEach(member => {
            const profileUrl = `https://www.torn.com/profiles.php?XID=${member.memberId}`;
            const rowClass = member.isNew ? 'new-member-gain' : '';
            gainsRowsHtml += `<tr class="${rowClass}"><td><a href="${profileUrl}" target="_blank">${member.name}${member.isNew ? ' (New)' : ''}</a></td><td>${formatGainValue(member.strengthGain)}</td><td>${formatGainValue(member.dexterityGain)}</td><td>${formatGainValue(member.speedGain)}</td><td>${formatGainValue(member.defenseGain)}</td><td>${formatGainValue(member.totalGain)}</td></tr>`;
        });
        gainsTbody.innerHTML = gainsRowsHtml.length > 0 ? gainsRowsHtml : '<tr><td colspan="6" style="text-align:center;">No members with tracked gains.</td></tr>';
        gainsMessageContainer.classList.add('hidden');
    } catch (error) {
        console.error("Error displaying gains table:", error);
        gainsMessageContainer.textContent = `Error loading gains: ${error.message}`;
    }
}

function downloadCurrentTabAsImage() {
    const activeTabPane = document.querySelector('.tab-pane-bb.active');
    if (!activeTabPane) { alert('Could not find active content to download.'); return; }
    let originalTable, columnIndicesToKeep = [], headerTextsToKeep = [], filename = 'tornpas_report.png', reportTitle = '', titleStyle = 'text-align: center; margin-bottom: 15px; font-weight: bold; color: #ADD8E6; font-size: 1.5em;';
    if (activeTabPane.id === 'current-stats-tab') {
        originalTable = document.getElementById('friendly-members-table');
        columnIndicesToKeep = [0, 2, 3, 4, 5, 6];
        headerTextsToKeep = ["Name", "Strength", "Dexterity", "Speed", "Defense", "Total"];
        filename = 'tornpas_current_stats_filtered.png';
        const now = new Date(); reportTitle = `Faction Stats Current As Of: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    } else if (activeTabPane.id === 'gains-tracking-tab') {
        originalTable = document.getElementById('gains-overview-table');
        columnIndicesToKeep = [0, 1, 2, 3, 4, 5];
        headerTextsToKeep = ["Name", "Strength Gain", "Dexterity Gain", "Speed Gain", "Defense Gain", "Total Gain"];
        filename = 'tornpas_gains_tracking_filtered.png';
        if (activeTrackingStartedAt) { const d = activeTrackingStartedAt.toDate ? activeTrackingStartedAt.toDate() : activeTrackingStartedAt; reportTitle = `Faction Gains Since: ${d.toLocaleDateString()} ${d.toLocaleTimeString()}`; } else { reportTitle = 'Faction Gains Since: N/A (Tracking Not Started)'; }
    } else { alert('Cannot download data for this tab.'); return; }
    if (!originalTable) { alert('Could not find table data to download for the current tab.'); return; }
    const tempContainer = document.createElement('div');
    Object.assign(tempContainer.style, { position: 'absolute', left: '-9999px', width: '850px', backgroundColor: '#222', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)', color: '#fff' });
    if (reportTitle) { const titleElement = document.createElement('h3'); titleElement.style.cssText = titleStyle; titleElement.textContent = reportTitle; tempContainer.appendChild(titleElement); }
    const tempTable = document.createElement('table');
    tempTable.className = originalTable.className; tempTable.classList.add('download-table-preview');
    Object.assign(tempTable.style, { width: '100%', borderCollapse: 'collapse', marginTop: '15px' });
    const tempThead = document.createElement('thead'); const tempTbody = document.createElement('tbody');
    const originalHeaderRow = originalTable.querySelector('thead tr');
    if (originalHeaderRow) { const tr = document.createElement('tr'); columnIndicesToKeep.forEach(index => { const th = originalHeaderRow.children[index]?.cloneNode(true); if (th) { Object.assign(th.style, { padding: '8px', border: '1px solid #444', backgroundColor: '#333', color: '#eee', textAlign: 'left' }); tr.appendChild(th); } }); tempThead.appendChild(tr); }
    const originalRows = originalTable.querySelectorAll('tbody tr');
    originalRows.forEach(originalRow => {
        const tempRow = document.createElement('tr');
        columnIndicesToKeep.forEach(index => {
            const originalCell = originalRow.children[index];
            if (originalCell) {
                const clonedCell = originalCell.cloneNode(true);
                clonedCell.style.backgroundColor = window.getComputedStyle(originalCell).backgroundColor;
                Object.assign(clonedCell.style, { padding: '8px', border: '1px solid #444' });
                if (clonedCell.classList.contains('gain-positive')) clonedCell.style.color = '#00FF00'; else if (clonedCell.classList.contains('gain-negative')) clonedCell.style.color = '#FF0000'; else if (clonedCell.classList.contains('gain-neutral')) clonedCell.style.color = '#999999'; else clonedCell.style.color = '#fff';
                tempRow.appendChild(clonedCell);
            }
        });
        tempTbody.appendChild(tempRow);
    });
    tempTable.appendChild(tempThead); tempTable.appendChild(tempTbody); tempContainer.appendChild(tempTable); document.body.appendChild(tempContainer);
    html2canvas(tempContainer, { scale: 2, useCORS: true, logging: true, backgroundColor: null, width: tempContainer.offsetWidth, height: tempContainer.offsetHeight })
        .then(canvas => { const link = document.createElement('a'); link.download = filename; link.href = canvas.toDataURL('image/png'); document.body.appendChild(link); link.click(); document.body.removeChild(link); })
        .catch(error => { console.error('Error capturing element for download:', error); alert('Could not download image.'); })
        .finally(() => { if (tempContainer.parentNode) document.body.removeChild(tempContainer); });
}
function managePortraitBlocker() {
    const isMobilePortrait = window.matchMedia("(max-width: 600px) and (orientation: portrait)").matches;
    let blocker = document.getElementById('portrait-blocker');
    const mainContentArea = document.querySelector('.page-specific-content-area'), header = document.querySelector('header'), footer = document.querySelector('footer');
    if (isMobilePortrait) {
        if (!blocker) {
            blocker = document.createElement('div'); blocker.id = 'portrait-blocker';
            blocker.style.cssText = `position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: #1e1e1e; color: #f0f0f0; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; font-family: sans-serif; font-size: 1.5em; z-index: 99999;`;
            blocker.innerHTML = `<h2>Please Rotate Your Device</h2><p>For the best viewing experience, please use landscape mode.</p><button id="return-home-button">Return to Home</button>`;
            document.body.appendChild(blocker);
            const returnHomeButton = document.getElementById('return-home-button');
            if (returnHomeButton) { Object.assign(returnHomeButton.style, { backgroundColor: '#007bff', color: 'black', padding: '8px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', marginTop: '20px', textDecoration: 'none' }); returnHomeButton.addEventListener('click', () => { window.location.href = 'home.html'; }); }
        }
        if (header) header.style.display = 'none'; if (mainContentArea) mainContentArea.style.display = 'none'; if (footer) footer.style.display = 'none'; document.body.style.overflow = 'hidden';
    } else {
        if (blocker) blocker.remove();
        if (header) header.style.display = ''; if (mainContentArea) mainContentArea.style.display = ''; if (footer) footer.style.display = ''; document.body.style.overflow = '';
    }
}
window.addEventListener('resize', managePortraitBlocker); window.addEventListener('orientationchange', managePortraitBlocker); window.addEventListener('DOMContentLoaded', managePortraitBlocker);

// Main execution block and event listeners
document.addEventListener('DOMContentLoaded', () => {
    const currentStatsTabContainer = document.querySelector('#current-stats-tab .table-container');
    if (currentStatsTabContainer) {
        loadingMessageElement = document.createElement('p');
        loadingMessageElement.id = 'loading-message-container';
        loadingMessageElement.style.textAlign = 'center';
        loadingMessageElement.style.padding = '20px';
        loadingMessageElement.style.color = '#bbb';
        loadingMessageElement.textContent = 'Loading faction member data...';
        currentStatsTabContainer.prepend(loadingMessageElement);
    }
    const tabButtons = document.querySelectorAll('.tab-button-bb');
    const tabPanes = document.querySelectorAll('.tab-pane-bb');
    const startTrackingBtn = document.getElementById('startTrackingBtn');
    const stopTrackingBtn = document.getElementById('stopTrackingBtn');
    const trackingStatusDisplay = document.getElementById('trackingStatus');
    const downloadButton = document.getElementById('downloadTableDataBtn');
    if (downloadButton) downloadButton.addEventListener('click', downloadCurrentTabAsImage);

    initializeTableSorting(); // Set up the sort click listeners

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
            if (auth.currentUser && userFactionIdFromProfile) {
                setupRealtimeTrackingStatusListener(userFactionIdFromProfile);
            } else {
                updateGainTrackingUI(); displayGainsTable();
            }
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
                    if (userFactionIdFromProfile) {
                        setupRealtimeTrackingStatusListener(userFactionIdFromProfile);
                    } else {
                        updateGainTrackingUI(); console.warn("User has no faction ID.");
                    }
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
            startTrackingBtn.classList.add('hidden'); stopTrackingBtn.classList.add('hidden'); trackingStatusDisplay.textContent = 'Please log in.';
            if (unsubscribeFromTrackingStatus) { unsubscribeFromTrackingStatus(); unsubscribeFromTrackingStatus = null; }
            if (unsubscribeFromGainsData) { unsubscribeFromGainsData(); unsubscribeFromGainsData = null; }
        }
    });
    startTrackingBtn.addEventListener('click', startTrackingGains);
    stopTrackingBtn.addEventListener('click', stopTrackingGains);
});