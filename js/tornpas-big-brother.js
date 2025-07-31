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
let currentUserIsAdmin = false; // Store admin status
let userFactionIdFromProfile = null; // Store user's faction ID, retrieved from profile

let activeTrackingSessionId = null; // Stores the ID of the currently active session
let activeTrackingStartedAt = null; // Stores the start timestamp of the active session
let baselineStatsCache = {}; // Cache for the baseline stats of the active session

// Firestore references for gain tracking
const GAIN_TRACKING_SESSIONS_COLLECTION = 'gainTrackingSessions'; // Collection for individual snapshots
const GAIN_TRACKING_STATUS_DOC = 'currentTrackingStatus'; // Document to hold active tracking session ID for a faction

// Real-time Firestore unsubscribe functions
let unsubscribeFromTrackingStatus = null;
let unsubscribeFromGainsData = null; // To unsubscribe from real-time updates to 'users' collection for gains

// --- Helper Functions ---

/**
 * Formats a raw number into a human-readable string (e.g., 1.23b, 45.6m, 789k).
 * This function is needed by updateFriendlyMembersTable for the 'Total' column.
 * @param {number} num The number to format.
 * @returns {string} The formatted string.
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
 * This is crucial for numerical comparisons in applyStatColorCoding and gain calculations.
 * @param {string|number} statString The stat value as a string (e.g., "1.2m", "500k", "123,456") or a number.
 * @returns {number} The parsed numerical value.
 */
function parseStatValue(statString) {
    if (typeof statString === 'number') { // If it's already a number, just return it
        return statString;
    }
    if (typeof statString !== 'string' || statString.trim() === '' || statString.toLowerCase() === 'n/a') {
        return 0; // Handle null, undefined, empty string, or "N/A"
    }

    let value = statString.trim().toLowerCase(); // Use 'value' as a mutable copy

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

    const number = parseFloat(value.replace(/,/g, '')); // Remove commas before parsing to number
    return isNaN(number) ? 0 : number * multiplier;
}


/**
 * Applies CSS classes to table cells based on battle stat tiers for color coding.
 * This function needs to be called after the table is populated.
 */
function applyStatColorCoding() {
    const table = document.getElementById('friendly-members-table');
    if (!table) return;

    const statCells = table.querySelectorAll('tbody td:nth-child(3), tbody td:nth-child(4), tbody td:nth-child(5), tbody td:nth-child(6), tbody td:nth-child(7)');

    statCells.forEach(cell => {
        for (let i = 1; i <= 9; i++) {
            cell.classList.remove(`stat-tier-${i}`);
        }
        cell.classList.remove('stat-cell');

        const value = parseStatValue(cell.textContent);
        let tierClass = '';

        if (value >= 500000000) { tierClass = 'stat-tier-9'; }
        else if (value >= 200000000) { tierClass = 'stat-tier-8'; }
        else if (value >= 100000000) { tierClass = 'stat-tier-7'; }
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
 * @param {number} timestampInSeconds Unix timestamp in seconds.
 * @returns {string} Relative time string.
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

// --- User Role / Admin Check ---
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
        const refreshResponse = await fetch(`/.netlify/functions/refresh-faction-data?factionId=${userFactionId}`);
        if (!refreshResponse.ok) {
            const errorResult = await refreshResponse.json().catch(() => ({ message: "Unknown refresh error" }));
            console.error("Backend refresh failed:", errorResult.message);
        } else {
            console.log("Backend refresh triggered successfully.");
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

        processedMembers.sort((a, b) => b.totalStats - a.totalStats);

        let allRowsHtml = '';
        for (const member of processedMembers) {
            const { tornData, firebaseData, totalStats } = member;
            const memberId = tornData.user_id || tornData.id;
            const name = tornData.name || 'Unknown';
            const lastAction = tornData.last_action ? formatRelativeTime(tornData.last_action.timestamp) : 'N/A';
            const strength = (firebaseData.battlestats?.strength || 0).toLocaleString();
            const dexterity = (firebaseData.battlestats?.dexterity || 0).toLocaleString();
            const speed = (firebaseData.battlestats?.speed || 0).toLocaleString();
            const defense = (firebaseData.battlestats?.defense || 0).toLocaleString();
            const nerve = `${firebaseData.nerve?.current ?? 'N/A'} / ${firebaseData.nerve?.maximum ?? 'N/A'}`;
            
            const energyValue = `${firebaseData.energy?.current ?? 'N/A'} / ${firebaseData.energy?.maximum ?? 'N/A'}`;

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
                drugCooldown = 'None 🍁';
                drugCooldownClass = 'status-okay';
            }

            const statusState = tornData.status?.state || '';
            const originalDescription = tornData.status?.description || 'N/A';
            let formattedStatus = originalDescription;
            let statusClass = 'status-okay';
            if (statusState === 'Hospital') { statusClass = 'status-hospital'; }
            else if (statusState === 'Abroad') { statusClass = 'status-abroad'; }
            else if (statusState !== 'Okay') { statusClass = 'status-other'; }

            const profileUrl = `https://www.torn.com/profiles.php?XID=${memberId}`;

            allRowsHtml += `
                <tr data-id="${memberId}">
                    <td><a href="${profileUrl}" target="_blank">${name}</a></td>
                    <td>${lastAction}</td>
                    <td>${strength}</td>
                    <td>${dexterity}</td>
                    <td>${speed}</td>
                    <td>${defense}</td>
                    <td>${formatBattleStats(totalStats)}</td>
                    <td class="${statusClass}">${formattedStatus}</td>
                    <td class="nerve-text">${nerve}</td>
                    <td class="energy-text">${energyValue}</td>
                    <td class="${drugCooldownClass}">${drugCooldown}</td>
                </tr>
            `;
        }
        
        hideLoadingMessage();
        tbody.innerHTML = allRowsHtml.length > 0 ? allRowsHtml : '<tr><td colspan="11" style="text-align:center;">No members to display.</td></tr>';
        applyStatColorCoding();
    } catch (error) {
        console.error("Fatal error in updateFriendlyMembersTable:", error);
        hideLoadingMessage();
        tbody.innerHTML = `<tr><td colspan="11" style="color:red;">A fatal error occurred: ${error.message}.</td></tr>`;
    }
}


// --- Gain Tracking Core Logic ---

/**
 * Helper to format gain values (+X, -Y, 0) with appropriate CSS class.
 * @param {number} gain The numerical gain.
 * @returns {string} HTML string with formatted gain and class.
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

    if (!startTrackingBtn) { console.error("UI Error: startTrackingBtn not found."); return; }
    if (!stopTrackingBtn) { console.error("UI Error: stopTrackingBtn not found."); return; }
    if (!trackingStatusDisplay) { console.error("UI Error: trackingStatusDisplay not found."); return; }
    if (!gainsStartedAtDisplay) { console.error("UI Error: gainsStartedAtDisplay not found."); return; }


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

/**
 * Fetches current battle stats for all faction members and saves them as a snapshot.
 */
async function startTrackingGains() {
    console.log("Attempting to start tracking gains...");
    if (!currentUserIsAdmin) {
        alert("Permission denied. Only leaders/co-leaders can start tracking.");
        return;
    }
    if (!userApiKey || !currentFirebaseUserUid) {
        alert("Cannot start tracking: User not fully logged in or API key missing.");
        return;
    }

    const startTrackingBtn = document.getElementById('startTrackingBtn');
    if (startTrackingBtn) {
        startTrackingBtn.disabled = true;
        startTrackingBtn.textContent = 'Starting...';
    }

    try {
        const userProfileDoc = await db.collection('userProfiles').doc(currentFirebaseUserUid).get();
        const userFactionId = userProfileDoc.data()?.faction_id;
        if (!userFactionId) throw new Error("User's faction ID not found.");

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

        const newSnapshotRef = await db.collection(GAIN_TRACKING_SESSIONS_COLLECTION).add({
            factionId: userFactionId,
            startedByUid: currentFirebaseUserUid,
            startedAt: firebase.firestore.FieldValue.serverTimestamp(),
            isActive: true,
            snapshot: currentStatsForSnapshot
        });

        await db.collection(GAIN_TRACKING_SESSIONS_COLLECTION).doc(GAIN_TRACKING_STATUS_DOC).set({
            activeSessionId: newSnapshotRef.id,
            factionId: userFactionId,
            startedByUid: currentFirebaseUserUid,
            startedAt: firebase.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        console.log("Gains tracking started. Snapshot saved with ID:", newSnapshotRef.id);
        
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
 * Stops the current gains tracking session.
 */
async function stopTrackingGains() {
    console.log("Attempting to stop tracking gains...");
    if (!currentUserIsAdmin) {
        alert("Permission denied. Only leaders/co-leaders can stop tracking.");
        return;
    }

    const stopTrackingBtn = document.getElementById('stopTrackingBtn');
    if (stopTrackingBtn) {
        stopTrackingBtn.disabled = true;
        stopTrackingBtn.textContent = 'Stopping...';
    }

    try {
        const statusDoc = await db.collection(GAIN_TRACKING_SESSIONS_COLLECTION).doc(GAIN_TRACKING_STATUS_DOC).get();
        if (statusDoc.exists && statusDoc.data().activeSessionId) {
            const activeSessionIdToDelete = statusDoc.data().activeSessionId;

            await db.collection(GAIN_TRACKING_SESSIONS_COLLECTION).doc(activeSessionIdToDelete).update({
                isActive: false,
                stoppedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            await db.collection(GAIN_TRACKING_SESSIONS_COLLECTION).doc(GAIN_TRACKING_STATUS_DOC).delete();
            
            console.log("Gains tracking stopped for session:", activeSessionIdToDelete);

            alert("Gains tracking stopped successfully!");

        } else {
            alert("No active tracking session found.");
            updateGainTrackingUI();
        }
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
 * This updates the buttons and status message for all connected clients.
 */
function setupRealtimeTrackingStatusListener(userFactionId) {
    if (unsubscribeFromTrackingStatus) {
        unsubscribeFromTrackingStatus();
    }

    const statusDocRef = db.collection(GAIN_TRACKING_SESSIONS_COLLECTION).doc(GAIN_TRACKING_STATUS_DOC);

    unsubscribeFromTrackingStatus = statusDocRef.onSnapshot(async (doc) => {
        if (doc.exists && doc.data().factionId === userFactionId) {
            activeTrackingSessionId = doc.data().activeSessionId;
            activeTrackingStartedAt = doc.data().startedAt;

            if (activeTrackingSessionId && !baselineStatsCache[activeTrackingSessionId]) {
                const baselineDoc = await db.collection(GAIN_TRACKING_SESSIONS_COLLECTION).doc(activeTrackingSessionId).get();
                if (baselineDoc.exists && baselineDoc.data().snapshot) {
                    baselineStatsCache = { [activeTrackingSessionId]: baselineDoc.data().snapshot };
                } else {
                    console.warn("Active session ID found, but baseline snapshot is missing from Firestore. Resetting status.");
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
    console.log("Real-time tracking status listener set up.");
}


/**
 * Displays the gains table by comparing current stats to the active snapshot.
 */
async function displayGainsTable() {
    const gainsTbody = document.getElementById('gains-overview-tbody');
    const gainsMessageContainer = document.querySelector('#gains-tracking-tab .gains-table-container p');
    
    if (!gainsTbody || !gainsMessageContainer) {
        console.error("HTML Error: Gains table body or message container not found in displayGainsTable.");
        return;
    }

    gainsTbody.innerHTML = '';
    gainsMessageContainer.classList.remove('hidden');
    gainsMessageContainer.textContent = 'Loading gains data...';

    if (!userApiKey || !currentFirebaseUserUid) {
        gainsMessageContainer.textContent = 'Please log in with your API key to view gains.';
        return;
    }

    if (!activeTrackingSessionId || !baselineStatsCache[activeTrackingSessionId]) {
        gainsMessageContainer.textContent = 'No active gains tracking session. Click "Start Tracking Gains" to begin.';
        return;
    }

    try {
        const userProfileDoc = await db.collection('userProfiles').doc(currentFirebaseUserUid).get();
        const userFactionId = userProfileDoc.data()?.faction_id;
        if (!userFactionId) {
            gainsMessageContainer.textContent = 'Your faction ID is not set. Cannot track gains.';
            return;
        }

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
                    strengthGain: strengthGain,
                    dexterityGain: dexterityGain,
                    speedGain: speedGain,
                    defenseGain: defenseGain,
                    totalGain: totalGain,
                    initialTotal: baseline.total
                });
            } else if (current && !baseline) {
                 membersWithGains.push({
          _message_truncation_applied_