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

let activeTrackingSessionId = null; // Stores the ID of the currently active session for the user's faction
let activeTrackingStartedAt = null; // Stores the start timestamp of the active session for the user's faction
let baselineStatsCache = {}; // Cache for the baseline stats of the active session for the user's faction

// Firestore references for gain tracking
const GAIN_TRACKING_SESSIONS_COLLECTION = 'gainTrackingSessions'; // Collection for individual snapshots
// Removed: const GAIN_TRACKING_STATUS_DOC = 'currentTrackingStatus'; // This will now be dynamic (faction ID)

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
            tbody.innerHTML = '<tr><td colspan="11" style="text-align:center; color: red;">Error: Faction ID not found.</td></tr>';
            return;
        }

        console.log("Triggering backend refresh for faction data...");
        // This Netlify function is assumed to be authorized and update 'users' collection
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
            tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; color: red;">Error: ${factionData.error?.error || 'Torn API Error'}.</td></tr>`;
            return;
        }

        const membersArray = Object.values(factionData.members || {});
        if (membersArray.length === 0) {
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
           
            const strength = formatBattleStats(parseStatValue(firebaseData.battlestats?.strength || 0));
            const dexterity = formatBattleStats(parseStatValue(firebaseData.battlestats?.dexterity || 0));
            const speed = formatBattleStats(parseStatValue(firebaseData.battlestats?.speed || 0));
            const defense = formatBattleStats(parseStatValue(firebaseData.battlestats?.defense || 0));
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
    } catch (error) {
        console.error("Fatal error in updateFriendlyMembersTable:", error);
        tbody.innerHTML = `<tr><td colspan="11" style="color:red;">A fatal error occurred: ${error.message}.</td></tr>`;
    } finally {
        hideLoadingMessage();
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

    // Check if there is an active session for *this faction*
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
        // Use userFactionIdFromProfile directly as it's already fetched and validated.
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

        // Create a new unique session document for this start
        const newSessionDocRef = db.collection(GAIN_TRACKING_SESSIONS_COLLECTION).doc(); // Auto-generated ID
        await newSessionDocRef.set({
            factionId: userFactionId,
            startedByUid: currentFirebaseUserUid,
            startedAt: firebase.firestore.FieldValue.serverTimestamp(),
            isActive: true,
            snapshot: currentStatsForSnapshot
        });

        // Update the faction-specific status document to point to this new active session
        // The document ID for the status is now the faction ID itself
        const factionStatusDocId = String(userFactionId); // Use faction ID as the document name
        await db.collection(GAIN_TRACKING_SESSIONS_COLLECTION).doc(factionStatusDocId).set({
            activeSessionId: newSessionDocRef.id,
            factionId: userFactionId,
            startedByUid: currentFirebaseUserUid,
            startedAt: firebase.firestore.FieldValue.serverTimestamp(),
        }, { merge: true }); // Use merge:true in case it already exists but was not deleted properly

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
    console.log("Attempting to stop tracking gains...");
    if (!currentUserIsAdmin) {
        alert("Permission denied. Only leaders/co-leaders can stop tracking.");
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
        // Use the faction ID to get the specific status document
        const factionStatusDocId = String(userFactionIdFromProfile);
        const statusDocRef = db.collection(GAIN_TRACKING_SESSIONS_COLLECTION).doc(factionStatusDocId);
        const statusDoc = await statusDocRef.get();

        if (statusDoc.exists && statusDoc.data().activeSessionId) {
            const activeSessionIdToUpdate = statusDoc.data().activeSessionId;

            // Mark the main session document as inactive and set stoppedAt
            await db.collection(GAIN_TRACKING_SESSIONS_COLLECTION).doc(activeSessionIdToUpdate).update({
                isActive: false,
                stoppedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Delete the faction's active status document
            await statusDocRef.delete();
            
            console.log("Gains tracking stopped for session:", activeSessionIdToUpdate);

            alert("Gains tracking stopped successfully!");

        } else {
            alert("No active tracking session found for your faction.");
        }
        updateGainTrackingUI(); // Re-render UI after stopping

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
 * Sets up a real-time listener for the active gains tracking session status for the user's faction.
 * This updates the buttons and status message for all connected clients of that faction.
 */
function setupRealtimeTrackingStatusListener(userFactionId) {
    if (unsubscribeFromTrackingStatus) {
        unsubscribeFromTrackingStatus();
    }

    // Listener now targets a document named after the faction ID
    const statusDocRef = db.collection(GAIN_TRACKING_SESSIONS_COLLECTION).doc(String(userFactionId));

    unsubscribeFromTrackingStatus = statusDocRef.onSnapshot(async (doc) => {
        // Ensure the data corresponds to the expected faction (double-check if needed, though doc ID implies it)
        if (doc.exists && doc.data().factionId === userFactionId) {
            activeTrackingSessionId = doc.data().activeSessionId;
            activeTrackingStartedAt = doc.data().startedAt;

            // Only fetch baseline if a new active session ID is set and not already cached
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
            // No active session for this faction, or document was deleted
            activeTrackingSessionId = null;
            activeTrackingStartedAt = null;
            baselineStatsCache = {};
        }
        updateGainTrackingUI();
        // Only call displayGainsTable if the gains tracking tab is currently active
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
        console.error("HTML Error: Gains table body or message container not found in displayGainsTable.");
        return;
    }

    gainsTbody.innerHTML = '';
    gainsMessageContainer.classList.remove('hidden');
    gainsMessageContainer.textContent = 'Loading gains data...';

    if (!userApiKey || !currentFirebaseUserUid || !userFactionIdFromProfile) {
        gainsMessageContainer.textContent = 'Please log in with your API key and ensure your faction ID is set to view gains.';
        return;
    }

    if (!activeTrackingSessionId || !baselineStatsCache[activeTrackingSessionId]) {
        gainsMessageContainer.textContent = 'No active gains tracking session. Click "Start Tracking Gains" to begin.';
        return;
    }

    try {
        const userFactionId = userFactionIdFromProfile; // Use the already fetched faction ID
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
        
        // Unsubscribe from any previous listener before setting up new queries
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
                    name: memberTornData.name,
                    memberId: memberId,
                    strengthGain: current.strength, // If no baseline, treat current as "gain" for display
                    dexterityGain: current.dexterity,
                    speedGain: current.speed,
                    defenseGain: current.defense,
                    totalGain: current.total,
                    initialTotal: current.total,
                    isNew: true // Mark as new if no baseline
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

/**
 * Captures the currently active tab's content (with selected columns) as an image
 * and triggers a download. Requires html2canvas library to be loaded.
 */
function downloadCurrentTabAsImage() {
    const activeTabPane = document.querySelector('.tab-pane-bb.active');

    if (!activeTabPane) {
        console.error('No active tab pane found to screenshot.');
        alert('Could not find active content to download.');
        return;
    }

    let originalTable;
    let columnIndicesToKeep = [];
    let headerTextsToKeep = []; // This array is used as a fallback if original table header is missing
    let filename = 'tornpas_report.png'; // Default generic filename
    let reportTitle = ''; // Text for the report title/date
    let titleStyle = 'text-align: center; margin-bottom: 15px; font-weight: bold; color: #ADD8E6; font-size: 1.5em;'; // Style for the title

    if (activeTabPane.id === 'current-stats-tab') {
        originalTable = document.getElementById('friendly-members-table');
        columnIndicesToKeep = [0, 2, 3, 4, 5, 6]; // Name, Str, Dex, Spd, Def, Total
        headerTextsToKeep = ["Name", "Strength", "Dexterity", "Speed", "Defense", "Total"];
        filename = 'tornpas_current_stats_filtered.png';
        const now = new Date();
        reportTitle = `Faction Stats Current As Of: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    } else if (activeTabPane.id === 'gains-tracking-tab') {
        originalTable = document.getElementById('gains-overview-table');
        columnIndicesToKeep = [0, 1, 2, 3, 4, 5]; // Name, Str Gain, Dex Gain, Spd Gain, Def Gain, Total Gain
        headerTextsToKeep = ["Name", "Strength Gain", "Dexterity Gain", "Speed Gain", "Defense Gain", "Total Gain"];
        filename = 'tornpas_gains_tracking_filtered.png';
        // Use the faction's active tracking start time for gains
        if (activeTrackingStartedAt) {
            const startedDate = activeTrackingStartedAt.toDate ? activeTrackingStartedAt.toDate() : activeTrackingStartedAt;
            reportTitle = `Faction Gains Since: ${startedDate.toLocaleDateString()} ${startedDate.toLocaleTimeString()}`;
        } else {
            reportTitle = 'Faction Gains Since: N/A (Tracking Not Started)';
        }
    } else {
        console.error('Unknown active tab for screenshot.');
        alert('Cannot download data for this tab.');
        return;
    }

    if (!originalTable) {
        console.error('Original table not found for screenshot for tab:', activeTabPane.id);
        alert('Could not find table data to download for the current tab. Please ensure the table is loaded.');
        return;
    }

    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.width = '850px'; // Set a fixed width for consistent screenshot size
    tempContainer.style.backgroundColor = '#222'; // Match your application's background
    tempContainer.style.padding = '20px'; // Increased padding for better spacing
    tempContainer.style.borderRadius = '8px';
    tempContainer.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
    tempContainer.style.color = '#fff'; // Ensure text is visible on dark background

    // Add the report title/date to the tempContainer FIRST
    if (reportTitle) {
        const titleElement = document.createElement('h3');
        titleElement.style.cssText = titleStyle;
        titleElement.textContent = reportTitle;
        tempContainer.appendChild(titleElement);
        console.log("Report title added:", titleElement.outerHTML); // Debugging
    }

    const tempTable = document.createElement('table');
    tempTable.className = originalTable.className; // Copy original table classes for styling
    tempTable.classList.add('download-table-preview'); // Add a specific class for download preview styling
    tempTable.style.width = '100%'; // Ensure it fills the temp container
    tempTable.style.borderCollapse = 'collapse'; // Ensure table borders collapse
    tempTable.style.marginTop = '15px'; // Add space between title and table

    const tempThead = document.createElement('thead');
    const tempTbody = document.createElement('tbody');

    const originalHeaderRow = originalTable.querySelector('thead tr');
    if (originalHeaderRow) {
        const tempHeaderRow = document.createElement('tr');
        columnIndicesToKeep.forEach(index => {
            const originalTh = originalHeaderRow.children[index];
            if (originalTh) {
                const clonedTh = originalTh.cloneNode(true);
                // Apply a basic style to cloned headers for consistency
                clonedTh.style.padding = '8px';
                clonedTh.style.border = '1px solid #444';
                clonedTh.style.backgroundColor = '#333';
                clonedTh.style.color = '#eee';
                clonedTh.style.textAlign = 'left'; // Adjust as needed
                tempHeaderRow.appendChild(clonedTh);
            }
        });
        tempThead.appendChild(tempHeaderRow);
    } else {
        // Fallback for headers if original table has no thead for some reason
        const tempHeaderRow = document.createElement('tr');
        headerTextsToKeep.forEach(text => {
            const th = document.createElement('th');
            th.textContent = text;
            th.style.padding = '8px';
            th.style.border = '1px solid #444';
            th.style.backgroundColor = '#333';
            th.style.color = '#eee';
            th.style.textAlign = 'left'; // Adjust as needed
            tempHeaderRow.appendChild(th);
        });
        tempThead.appendChild(tempHeaderRow);
    }

    const originalRows = originalTable.querySelectorAll('tbody tr');
    originalRows.forEach(originalRow => {
        const tempRow = document.createElement('tr');
        const originalCells = originalRow.children;
        
        columnIndicesToKeep.forEach(index => {
            const originalCell = originalCells[index];
            if (originalCell) {
                const clonedCell = originalCell.cloneNode(true);
                
                // --- NEW CODE HERE: Capture and apply computed background color ---
                const computedStyle = window.getComputedStyle(originalCell);
                clonedCell.style.backgroundColor = computedStyle.backgroundColor;
                // --- END NEW CODE ---

                // Apply a basic style to cloned cells for consistency
                clonedCell.style.padding = '8px';
                clonedCell.style.border = '1px solid #444';
                // Keep existing text color logic if it's explicitly applied for gains
                if (clonedCell.classList.contains('gain-positive')) clonedCell.style.color = '#00FF00'; // Bright Green for positive gains
                else if (clonedCell.classList.contains('gain-negative')) clonedCell.style.color = '#FF0000'; // Red for negative gains
                else if (clonedCell.classList.contains('gain-neutral')) clonedCell.style.color = '#999999'; // Grey for neutral gains
                else {
                    // Fallback for other text colors if not explicitly set by gain classes
                    clonedCell.style.color = '#fff'; 
                }
                

                tempRow.appendChild(clonedCell);
            }
        });
        tempTbody.appendChild(tempRow);
    });

    tempTable.appendChild(tempThead);
    tempTable.appendChild(tempTbody);
    tempContainer.appendChild(tempTable); // Append the table after the title

    document.body.appendChild(tempContainer); // Add too be rendered for html2canvas

    console.log("Temporary render container appended to body (with colors):", tempContainer.outerHTML); // Debugging

    html2canvas(tempContainer, {
        scale: 2, // Increase scale for higher resolution image
        useCORS: true, // Needed if your images/fonts are from different origins
        logging: true, // Keep verbose logging for debugging
        backgroundColor: null, // Let the tempContainer's background handle it
        width: tempContainer.offsetWidth,
        height: tempContainer.offsetHeight
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = filename;
        link.href = canvas.toDataURL('image/png'); // Get image data as PNG

        document.body.appendChild(link); // Temporarily add to DOM to trigger download
        link.click(); // Trigger the download
        document.body.removeChild(link); // Clean up
    }).catch(error => {
        console.error('Error capturing element for download:', error);
        alert('Could not download image. An error occurred. Please check the console for details.');
    }).finally(() => {
        // Ensure the temporary container is removed from the DOM
        if (tempContainer.parentNode) {
            document.body.removeChild(tempContainer);
        }
        console.log("Cleaned up temporary render container.");
    });
}

/**
 * Dynamically applies a min-width to the tables on smaller screens to ensure readability.
 * This is a JS alternative to CSS media queries if they are not behaving as expected.
 */
function handleTableResponsiveLayout() {
    const tables = document.querySelectorAll('.friendly-members-table, .gains-overview-table');
    if (window.innerWidth <= 768) {
        tables.forEach(table => {
            table.style.minWidth = '500px';
            table.style.tableLayout = 'auto';
        });
    } else {
        tables.forEach(table => {
            // Reset to original state for larger screens
            table.style.minWidth = '';
            table.style.tableLayout = 'fixed';
        });
    }
}


// --- Main execution block and event listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // --- Initialize Loading Message Element on page load ---
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

    // --- DOM Elements for Tabs and Controls ---
    const tabButtons = document.querySelectorAll('.tab-button-bb');
    const tabPanes = document.querySelectorAll('.tab-pane-bb');
    const startTrackingBtn = document.getElementById('startTrackingBtn');
    const stopTrackingBtn = document.getElementById('stopTrackingBtn');
    const trackingStatusDisplay = document.getElementById('trackingStatus');
    const gainsStartedAtDisplay = document.getElementById('gainsStartedAt');

    // Get the download button and attach listener
    const downloadButton = document.getElementById('downloadTableDataBtn');
    if (downloadButton) {
        downloadButton.addEventListener('click', downloadCurrentTabAsImage);
    }

    // --- NEW CODE START ---
    // Attach the responsive function to the load and resize events
    window.addEventListener('load', handleTableResponsiveLayout);
    window.addEventListener('resize', handleTableResponsiveLayout);
    // --- NEW CODE END ---


    // --- Tab Switching Logic ---
    function showTab(tabId) {
        tabPanes.forEach(pane => {
            if (pane.id === tabId) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });

        tabButtons.forEach(button => {
            if (button.dataset.tab + '-tab' === tabId) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

        // Unsubscribe from any active Firestore listeners when switching tabs
        if (unsubscribeFromTrackingStatus) {
            unsubscribeFromTrackingStatus();
            unsubscribeFromTrackingStatus = null;
            console.log("Unsubscribed from tracking status listener (on tab switch).");
        }
        if (unsubscribeFromGainsData) {
            unsubscribeFromGainsData();
            unsubscribeFromGainsData = null;
            console.log("Unsubscribed from gains data listener (on tab switch).");
        }


        // Trigger data load/refresh when switching to a tab that needs it
        if (tabId === 'current-stats-tab') {
             if (userApiKey && auth.currentUser && auth.currentUser.uid) {
                updateFriendlyMembersTable(userApiKey, auth.currentUser.uid);
            }
            if (loadingMessageElement) loadingMessageElement.style.display = 'block';
        } else if (tabId === 'gains-tracking-tab') {
            console.log("Switched to Gains Tracking tab.");
            hideLoadingMessage();

            if (auth.currentUser && userFactionIdFromProfile) {
                setupRealtimeTrackingStatusListener(userFactionIdFromProfile); // Pass the faction ID
            } else {
                // If no user or faction, update UI to reflect that tracking cannot happen
                updateGainTrackingUI(); 
                displayGainsTable(); // Display "No active session" or similar based on state
            }
            // Always call displayGainsTable to update the content based on current session state
            // (it will show 'No active session' if activeTrackingSessionId is null)
            displayGainsTable(); 
        }
    }

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            showTab(button.dataset.tab + '-tab');
        });
    });

    // --- Authentication and Initial Data Load ---
    auth.onAuthStateChanged(async (user) => {
        currentFirebaseUserUid = user ? user.uid : null;

        if (user) {
            try {
                const userProfileDoc = await db.collection('userProfiles').doc(user.uid).get();
                if (userProfileDoc.exists) {
                    const userData = userProfileDoc.data();
                    userApiKey = userData.tornApiKey || null;
                    userTornProfileId = userData.tornProfileId || null;
                    userFactionIdFromProfile = userData.faction_id || null; // Ensure this is set

                    currentUserIsAdmin = await checkIfUserIsAdmin(user.uid);
                    
                    if (userFactionIdFromProfile) {
                        // Setup listener only if faction ID exists
                        setupRealtimeTrackingStatusListener(userFactionIdFromProfile);
                    } else {
                        // If no faction ID, ensure UI is updated correctly
                        updateGainTrackingUI(); 
                        console.warn("User has no faction ID. Gains tracking features might be limited.");
                    }

                    if (userApiKey && userTornProfileId) {
                        console.log("Logged in and API key/Profile ID found.");
                        
                        // Only load current stats table if its tab is active on initial load
                        if (document.getElementById('current-stats-tab').classList.contains('active')) {
                            await updateFriendlyMembersTable(userApiKey, user.uid);
                        }

                    } else {
                        console.warn("User logged in, but Torn API key or Profile ID missing. Cannot display full stats.");
                        hideLoadingMessage();
                        const friendlyMembersTbody = document.getElementById('friendly-members-tbody');
                        if (friendlyMembersTbody) {
                            friendlyMembersTbody.innerHTML = '<tr><td colspan="11" style="text-align:center; color: yellow; padding: 20px;">Please provide your Torn API key and Profile ID in your settings to view faction stats.</td></tr>';
                        }
                        updateGainTrackingUI(); // Update gains UI for no API key scenario
                    }
                } else {
                    console.warn("User profile document not found in Firestore.");
                    hideLoadingMessage();
                    const friendlyMembersTbody = document.getElementById('friendly-members-tbody');
                    if (friendlyMembersTbody) {
                        friendlyMembersTbody.innerHTML = '<tr><td colspan="11" style="text-align:center; color: yellow; padding: 20px;">User profile not found. Please ensure your account is set up correctly.</td></tr>';
                    }
                    updateGainTrackingUI(); // Update gains UI for no profile scenario
                }
            } catch (error) {
                console.error("Error fetching user profile for TornPAs Big Brother page:", error);
                hideLoadingMessage();
                const friendlyMembersTbody = document.getElementById('friendly-members-tbody');
                if (friendlyMembersTbody) {
                    friendlyMembersTbody.innerHTML = `<tr><td colspan="11" style="color:red;">A fatal error occurred: ${error.message}.</td></tr>`;
                }
                updateGainTrackingUI(); // Update gains UI on error
            }
        } else {
            console.log("User not logged in. Displaying login message.");
            hideLoadingMessage();
            const friendlyMembersTbody = document.getElementById('friendly-members-tbody');
            if (friendlyMembersTbody) {
                friendlyMembersTbody.innerHTML = '<tr><td colspan="11" style="text-align:center; padding: 20px;">Please log in to view faction member stats.</td></tr>';
            }
            startTrackingBtn.classList.add('hidden');
            stopTrackingBtn.classList.add('hidden');
            trackingStatusDisplay.textContent = 'Please log in.';
            if (unsubscribeFromTrackingStatus) {
                unsubscribeFromTrackingStatus();
                unsubscribeFromTrackingStatus = null;
            }
            if (unsubscribeFromGainsData) {
                unsubscribeFromGainsData();
                unsubscribeFromGainsData = null;
            }
        }
    });

    // --- Event Listeners for Gain Tracking Buttons ---
    startTrackingBtn.addEventListener('click', () => {
        startTrackingGains();
    });

    stopTrackingBtn.addEventListener('click', () => {
        stopTrackingGains();
    });
});



// --- Main execution block and event listeners ---
document.addEventListener('DOMContentLoaded', () => {
    // --- Initialize Loading Message Element on page load ---
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

    // --- DOM Elements for Tabs and Controls ---
    const tabButtons = document.querySelectorAll('.tab-button-bb');
    const tabPanes = document.querySelectorAll('.tab-pane-bb');
    const startTrackingBtn = document.getElementById('startTrackingBtn');
    const stopTrackingBtn = document.getElementById('stopTrackingBtn');
    const trackingStatusDisplay = document.getElementById('trackingStatus');
    const gainsStartedAtDisplay = document.getElementById('gainsStartedAt');

    // Get the download button and attach listener
    const downloadButton = document.getElementById('downloadTableDataBtn');
    if (downloadButton) {
        downloadButton.addEventListener('click', downloadCurrentTabAsImage);
    }


    // --- Tab Switching Logic ---
    function showTab(tabId) {
        tabPanes.forEach(pane => {
            if (pane.id === tabId) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });

        tabButtons.forEach(button => {
            if (button.dataset.tab + '-tab' === tabId) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

        // Unsubscribe from any active Firestore listeners when switching tabs
        if (unsubscribeFromTrackingStatus) {
            unsubscribeFromTrackingStatus();
            unsubscribeFromTrackingStatus = null;
            console.log("Unsubscribed from tracking status listener (on tab switch).");
        }
        if (unsubscribeFromGainsData) {
            unsubscribeFromGainsData();
            unsubscribeFromGainsData = null;
            console.log("Unsubscribed from gains data listener (on tab switch).");
        }


        // Trigger data load/refresh when switching to a tab that needs it
        if (tabId === 'current-stats-tab') {
             if (userApiKey && auth.currentUser && auth.currentUser.uid) {
                updateFriendlyMembersTable(userApiKey, auth.currentUser.uid);
            }
            if (loadingMessageElement) loadingMessageElement.style.display = 'block';
        } else if (tabId === 'gains-tracking-tab') {
            console.log("Switched to Gains Tracking tab.");
            hideLoadingMessage();

            if (auth.currentUser && userFactionIdFromProfile) {
                setupRealtimeTrackingStatusListener(userFactionIdFromProfile); // Pass the faction ID
            } else {
                // If no user or faction, update UI to reflect that tracking cannot happen
                updateGainTrackingUI(); 
                displayGainsTable(); // Display "No active session" or similar based on state
            }
            // Always call displayGainsTable to update the content based on current session state
            // (it will show 'No active session' if activeTrackingSessionId is null)
            displayGainsTable(); 
        }
    }

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            showTab(button.dataset.tab + '-tab');
        });
    });

    // --- Authentication and Initial Data Load ---
    auth.onAuthStateChanged(async (user) => {
        currentFirebaseUserUid = user ? user.uid : null;

        if (user) {
            try {
                const userProfileDoc = await db.collection('userProfiles').doc(user.uid).get();
                if (userProfileDoc.exists) {
                    const userData = userProfileDoc.data();
                    userApiKey = userData.tornApiKey || null;
                    userTornProfileId = userData.tornProfileId || null;
                    userFactionIdFromProfile = userData.faction_id || null; // Ensure this is set

                    currentUserIsAdmin = await checkIfUserIsAdmin(user.uid);
                    
                    if (userFactionIdFromProfile) {
                        // Setup listener only if faction ID exists
                        setupRealtimeTrackingStatusListener(userFactionIdFromProfile);
                    } else {
                        // If no faction ID, ensure UI is updated correctly
                        updateGainTrackingUI(); 
                        console.warn("User has no faction ID. Gains tracking features might be limited.");
                    }

                    if (userApiKey && userTornProfileId) {
                        console.log("Logged in and API key/Profile ID found.");
                        
                        // Only load current stats table if its tab is active on initial load
                        if (document.getElementById('current-stats-tab').classList.contains('active')) {
                            await updateFriendlyMembersTable(userApiKey, user.uid);
                        }

                    } else {
                        console.warn("User logged in, but Torn API key or Profile ID missing. Cannot display full stats.");
                        hideLoadingMessage();
                        const friendlyMembersTbody = document.getElementById('friendly-members-tbody');
                        if (friendlyMembersTbody) {
                            friendlyMembersTbody.innerHTML = '<tr><td colspan="11" style="text-align:center; color: yellow; padding: 20px;">Please provide your Torn API key and Profile ID in your settings to view faction stats.</td></tr>';
                        }
                        updateGainTrackingUI(); // Update gains UI for no API key scenario
                    }
                } else {
                    console.warn("User profile document not found in Firestore.");
                    hideLoadingMessage();
                    const friendlyMembersTbody = document.getElementById('friendly-members-tbody');
                    if (friendlyMembersTbody) {
                        friendlyMembersTbody.innerHTML = '<tr><td colspan="11" style="text-align:center; color: yellow; padding: 20px;">User profile not found. Please ensure your account is set up correctly.</td></tr>';
                    }
                    updateGainTrackingUI(); // Update gains UI for no profile scenario
                }
            } catch (error) {
                console.error("Error fetching user profile for TornPAs Big Brother page:", error);
                hideLoadingMessage();
                const friendlyMembersTbody = document.getElementById('friendly-members-tbody');
                if (friendlyMembersTbody) {
                    friendlyMembersTbody.innerHTML = `<tr><td colspan="11" style="color:red;">A fatal error occurred: ${error.message}.</td></tr>`;
                }
                updateGainTrackingUI(); // Update gains UI on error
            }
        } else {
            console.log("User not logged in. Displaying login message.");
            hideLoadingMessage();
            const friendlyMembersTbody = document.getElementById('friendly-members-tbody');
            if (friendlyMembersTbody) {
                friendlyMembersTbody.innerHTML = '<tr><td colspan="11" style="text-align:center; padding: 20px;">Please log in to view faction member stats.</td></tr>';
            }
            startTrackingBtn.classList.add('hidden');
            stopTrackingBtn.classList.add('hidden');
            trackingStatusDisplay.textContent = 'Please log in.';
            if (unsubscribeFromTrackingStatus) {
                unsubscribeFromTrackingStatus();
                unsubscribeFromTrackingStatus = null;
            }
            if (unsubscribeFromGainsData) {
                unsubscribeFromGainsData();
                unsubscribeFromGainsData = null;
            }
        }
    });

    // --- Event Listeners for Gain Tracking Buttons ---
    startTrackingBtn.addEventListener('click', () => {
        startTrackingGains();
    });

    stopTrackingBtn.addEventListener('click', () => {
        stopTrackingGains();
    });
});