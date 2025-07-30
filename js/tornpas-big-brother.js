// File: ../js/tornpas-big-brother.js

// Firebase initialization is assumed to be handled by firebase-init.js
// which should be imported before this script in the HTML.
// Access global firebase object for auth and firestore.
const auth = firebase.auth();
const db = firebase.firestore();

// Global variables for user data and tracking state
let userApiKey = null;
let userTornProfileId = null;
let currentFirebaseUserUid = null;
let currentUserIsAdmin = false;

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
 * @param {string} statString The stat value as a string (e.g., "1.2m", "500k", "123,456").
 * @returns {number} The parsed numerical value.
 */
function parseStatValue(statString) {
    if (typeof statString !== 'string' || statString.trim() === '' || statString.toLowerCase() === 'n/a') {
        return 0;
    }
    let sanitizedString = String(statString).toLowerCase().replace(/,/g, ''); // Ensure string, remove commas
    let multiplier = 1;
    if (sanitizedString.endsWith('k')) {
        multiplier = 1000;
        sanitizedString = sanitizedString.slice(0, -1);
    } else if (sanitizedString.endsWith('m')) {
        multiplier = 1000000;
        sanitizedString = sanitizedString.slice(0, -1);
    } else if (sanitizedString.endsWith('b')) {
        multiplier = 1000000000;
        sanitizedString = sanitizedString.slice(0, -1);
    }
    const number = parseFloat(sanitizedString);
    return isNaN(number) ? 0 : number * multiplier;
}

/**
 * Applies CSS classes to table cells based on battle stat tiers for color coding.
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
            const energy = `${firebase.energy?.current ?? 'N/A'} / ${firebase.energy?.maximum ?? 'N/A'}`; // Should be firebaseData.energy
            
            // Corrected energy variable
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
    if (typeof gain !== 'number') { // Handle non-numeric or missing gains
        return '<span class="gain-neutral">N/A</span>';
    }
    if (gain > 0) {
        return `<span class="gain-positive">+${gain.toLocaleString()}</span>`;
    } else if (gain < 0) {
        return `<span class="gain-negative">${gain.toLocaleString()}</span>`;
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
    const gainsStartedAtDisplay = document.getElementById('gainsStartedAt'); // New element to show start time

    if (!startTrackingBtn || !stopTrackingBtn || !trackingStatusDisplay || !gainsStartedAtDisplay) {
        console.error("Gains tracking UI elements not found.");
        return;
    }

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
            // Check if activeTrackingStartedAt is a Timestamp object and convert to Date
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
                    strength: parseStatValue(memberData.battlestats?.strength || 0),
                    dexterity: parseStatValue(memberData.battlestats?.dexterity || 0),
                    speed: parseStatValue(memberData.battlestats?.speed || 0),
                    defense: parseStatValue(memberData.battlestats?.defense || 0),
                    total: parseStatValue(memberData.battlestats?.total || 0),
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
        
        // No explicit UI update here, as the real-time listener will handle it.
        alert("Gains tracking started successfully!");

    } catch (error) {
        console.error("Error starting gains tracking:", error);
        alert("Failed to start tracking gains: " + error.message);
        if (startTrackingBtn) {
            startTrackingBtn.disabled = false;
            startTrackingBtn.textContent = 'Start Tracking Gains';
        }
        updateGainTrackingUI(); // Revert UI if error
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

            // Mark the session as inactive in its own document
            await db.collection(GAIN_TRACKING_SESSIONS_COLLECTION).doc(activeSessionIdToDelete).update({
                isActive: false,
                stoppedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Clear the active session ID in the status document
            await db.collection(GAIN_TRACKING_SESSIONS_COLLECTION).doc(GAIN_TRACKING_STATUS_DOC).delete();
            
            console.log("Gains tracking stopped for session:", activeSessionIdToDelete);

            // No explicit UI update here, as the real-time listener will handle it.
            alert("Gains tracking stopped successfully!");

        } else {
            alert("No active tracking session found.");
            updateGainTrackingUI(); // Revert UI if no session
        }
    } catch (error) {
        console.error("Error stopping gains tracking:", error);
        alert("Failed to stop tracking gains: " + error.message);
        if (stopTrackingBtn) {
            stopTrackingBtn.disabled = false;
            stopTrackingBtn.textContent = 'Stop Tracking';
        }
        updateGainTrackingUI(); // Revert UI if error
    }
}

/**
 * Sets up a real-time listener for the active gains tracking session status.
 * This updates the buttons and status message for all connected clients.
 */
function setupRealtimeTrackingStatusListener(userFactionId) {
    if (unsubscribeFromTrackingStatus) {
        unsubscribeFromTrackingStatus(); // Unsubscribe from previous listener if any
    }

    const statusDocRef = db.collection(GAIN_TRACKING_SESSIONS_COLLECTION).doc(GAIN_TRACKING_STATUS_DOC);

    unsubscribeFromTrackingStatus = statusDocRef.onSnapshot(async (doc) => {
        if (doc.exists && doc.data().activeSessionId && doc.data().factionId === userFactionId) {
            activeTrackingSessionId = doc.data().activeSessionId;
            activeTrackingStartedAt = doc.data().startedAt;

            // Fetch the baseline stats for the new session if it changed
            if (!baselineStatsCache[activeTrackingSessionId]) {
                const baselineDoc = await db.collection(GAIN_TRACKING_SESSIONS_COLLECTION).doc(activeTrackingSessionId).get();
                if (baselineDoc.exists && baselineDoc.data().snapshot) {
                    baselineStatsCache = { [activeTrackingSessionId]: baselineDoc.data().snapshot }; // Cache only the current one
                } else {
                    console.warn("Active session ID found, but baseline snapshot is missing from Firestore.");
                    activeTrackingSessionId = null; // Treat as no active session if baseline is bad
                    activeTrackingStartedAt = null;
                    baselineStatsCache = {};
                }
            }
        } else {
            activeTrackingSessionId = null;
            activeTrackingStartedAt = null;
            baselineStatsCache = {};
        }
        updateGainTrackingUI(); // Update UI based on new status
        if (document.getElementById('gains-tracking-tab').classList.contains('active')) {
            displayGainsTable(); // Refresh gains table when status changes
        }
    }, (error) => {
        console.error("Error listening to tracking status:", error);
        activeTrackingSessionId = null;
        activeTrackingStartedAt = null;
        baselineStatsCache = {};
        updateGainTrackingUI();
        if (document.getElementById('gains-tracking-tab').classList.contains('active')) {
             displayGainsTable(); // Show error or no data
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
    
    if (!gainsTbody || !gainsMessageContainer) return;

    gainsTbody.innerHTML = ''; // Clear previous content
    gainsMessageContainer.classList.remove('hidden'); // Ensure message is visible
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

        const baselineStats = baselineStatsCache[activeTrackingSessionId]; // Use cached baseline

        // Set up real-time listener for current user data (for gains)
        if (unsubscribeFromGainsData) {
            unsubscribeFromGainsData(); // Unsubscribe from previous listener
        }

        // Get all member IDs to fetch their current stats
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

        // Combine multiple queries into a single listener
        unsubscribeFromGainsData = db.firestore.onSnapshotsInSync((() => { // This is a trick to get a single listener for multiple queries
            const promises = firestoreQueries.map(q => q.get()); // Execute all queries
            return Promise.all(promises);
        })().then(querySnapshots => { // Process the results once all promises resolve
            const currentStats = {};
            querySnapshots.forEach(snapshot => {
                snapshot.forEach(doc => {
                    const memberData = doc.data();
                    currentStats[doc.id] = {
                        name: memberData.name,
                        strength: parseStatValue(memberData.battlestats?.strength || 0),
                        dexterity: parseStatValue(memberData.battlestats?.dexterity || 0),
                        speed: parseStatValue(memberData.battlestats?.speed || 0),
                        defense: parseStatValue(memberData.battlestats?.defense || 0),
                        total: parseStatValue(memberData.battlestats?.total || 0),
                    };
                });
            });

            // Calculate and display gains
            let gainsRowsHtml = '';
            const membersWithGains = [];

            // Iterate over the members from the Torn API response to maintain order/completeness
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
                        memberId: memberId, // Keep Torn ID for profile link
                        strengthGain: strengthGain,
                        dexterityGain: dexterityGain,
                        speedGain: speedGain,
                        defenseGain: defenseGain,
                        totalGain: totalGain,
                        initialTotal: baseline.total // For potential future sorting/context
                    });
                } else if (current) {
                    // Member exists currently but not in baseline (new member since tracking started)
                     membersWithGains.push({
                        name: memberTornData.name,
                        memberId: memberId,
                        strengthGain: 0, dexterityGain: 0, speedGain: 0, defenseGain: 0, totalGain: 0,
                        initialTotal: 0,
                        isNew: true
                    });
                }
            });

            // Sort members by total gain (descending)
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
            gainsMessageContainer.classList.add('hidden'); // Hide message after data loads

        }), (error) => {
            console.error("Error listening to gains data:", error);
            gainsMessageContainer.textContent = `Error loading gains: ${error.message}`;
        });

    } catch (error) {
        console.error("Error setting up gains display:", error);
        gainsMessageContainer.textContent = `Error setting up gains display: ${error.message}`;
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

        // Unsubscribe from any active listeners when switching tabs to prevent memory leaks
        if (unsubscribeFromGainsData) {
            unsubscribeFromGainsData();
            unsubscribeFromGainsData = null;
            console.log("Unsubscribed from gains data listener.");
        }
        if (unsubscribeFromTrackingStatus) {
            unsubscribeFromTrackingStatus();
            unsubscribeFromTrackingStatus = null;
            console.log("Unsubscribed from tracking status listener."); // Unsubscribe and re-subscribe for faction-specific context
        }

        // Trigger data load/refresh when switching to a tab that needs it
        if (tabId === 'current-stats-tab') {
             if (userApiKey && auth.currentUser && auth.currentUser.uid) {
                updateFriendlyMembersTable(userApiKey, auth.currentUser.uid);
            }
            if (loadingMessageElement) loadingMessageElement.style.display = 'block';
        } else if (tabId === 'gains-tracking-tab') {
            console.log("Switched to Gains Tracking tab.");
            hideLoadingMessage(); // Hide the current stats loading message when on gains tab

            // Set up real-time listener for tracking status FIRST
            if (auth.currentUser) {
                // This listener will trigger displayGainsTable when it updates
                setupRealtimeTrackingStatusListener(userFactionIdFromProfile); // Pass faction ID from user profile
            }
            // displayGainsTable() will be called by the status listener, or directly if no listener active
            if(!activeTrackingSessionId) { // Only call directly if no session is immediately apparent
                 displayGainsTable(); // Initial call to show status (e.g. 'No active session')
            }
        }
    }

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            showTab(button.dataset.tab + '-tab');
        });
    });

    // --- Authentication and Initial Data Load ---
    let userFactionIdFromProfile = null; // Declare here to be accessible to setupRealtimeTrackingStatusListener
    auth.onAuthStateChanged(async (user) => {
        currentFirebaseUserUid = user ? user.uid : null;

        if (user) {
            try {
                const userProfileDoc = await db.collection('userProfiles').doc(user.uid).get();
                if (userProfileDoc.exists) {
                    const userData = userProfileDoc.data();
                    userApiKey = userData.tornApiKey || null;
                    userTornProfileId = userData.tornProfileId || null;
                    userFactionIdFromProfile = userData.faction_id || null; // Store faction ID

                    currentUserIsAdmin = await checkIfUserIsAdmin(user.uid);
                    
                    // Initial update of tracking UI based on current status from Firestore
                    // This will also set up the real-time listener for tracking status changes
                    if (userFactionIdFromProfile) {
                        setupRealtimeTrackingStatusListener(userFactionIdFromProfile);
                    } else {
                        updateGainTrackingUI(); // Update UI for non-faction users
                    }

                    if (userApiKey && userTornProfileId) {
                        console.log("Logged in and API key/Profile ID found.");
                        
                        // Initial load for the default active tab ('current-stats-tab')
                        // Only load if that tab is active initially
                        if (document.getElementById('current-stats-tab').classList.contains('active')) {
                            await updateFriendlyMembersTable(userApiKey, user.uid);
                        }

                        // Set up intervals for automatic refresh
                        // Interval for Current Stats table (only if Current Stats tab is active)
                        setInterval(async () => {
                            if (document.getElementById('current-stats-tab').classList.contains('active')) {
                                console.log("Refreshing Current Stats table (interval)...");
                                await updateFriendlyMembersTable(userApiKey, user.uid);
                            }
                        }, 30000); // Refresh every 30 seconds (adjust as needed)

                        // NOTE: Real-time update for Gains Table is handled by `onSnapshot` inside `displayGainsTable`
                        // so a separate interval for gains is not strictly necessary anymore unless you want to re-run
                        // the initial data fetching/processing even if underlying data hasn't changed.
                        // I'll keep the interval for now, but comment it out as the onSnapshot is primary.
                        /*
                        setInterval(async () => {
                            if (document.getElementById('gains-tracking-tab').classList.contains('active')) {
                                console.log("Refreshing Gains Tracking table (interval)...");
                                await displayGainsTable(); // This will re-fetch and re-render
                            }
                        }, 30000); // Refresh every 30 seconds (adjust as needed)
                        */
                        
                    } else {
                        console.warn("User logged in, but Torn API key or Profile ID missing. Cannot display full stats.");
                        hideLoadingMessage();
                        const friendlyMembersTbody = document.getElementById('friendly-members-tbody');
                        if (friendlyMembersTbody) {
                            friendlyMembersTbody.innerHTML = '<tr><td colspan="11" style="text-align:center; color: yellow; padding: 20px;">Please provide your Torn API key and Profile ID in your settings to view faction stats.</td></tr>';
                        }
                        updateGainTrackingUI(); // Update admin buttons due to missing API key
                    }
                } else {
                    console.warn("User profile document not found in Firestore.");
                    hideLoadingMessage();
                    const friendlyMembersTbody = document.getElementById('friendly-members-tbody');
                    if (friendlyMembersTbody) {
                        friendlyMembersTbody.innerHTML = '<tr><td colspan="11" style="text-align:center; color: yellow; padding: 20px;">User profile not found. Please ensure your account is set up correctly.</td></tr>';
                    }
                    updateGainTrackingUI(); // Update admin buttons due to no profile
                }
            } catch (error) {
                console.error("Error fetching user profile for TornPAs Big Brother page:", error);
                hideLoadingMessage();
                const friendlyMembersTbody = document.getElementById('friendly-members-tbody');
                if (friendlyMembersTbody) {
                    friendlyMembersTbody.innerHTML = `<tr><td colspan="11" style="color:red;">A fatal error occurred: ${error.message}.</td></tr>`;
                }
                updateGainTrackingUI(); // Update admin buttons on error
            }
        } else {
            console.log("User not logged in. Displaying login message.");
            hideLoadingMessage();
            const friendlyMembersTbody = document.getElementById('friendly-members-tbody');
            if (friendlyMembersTbody) {
                friendlyMembersTbody.innerHTML = '<tr><td colspan="11" style="text-align:center; padding: 20px;">Please log in to view faction member stats.</td></tr>';
            }
            // Ensure tracking buttons are hidden if logged out
            startTrackingBtn.classList.add('hidden');
            stopTrackingBtn.classList.add('hidden');
            trackingStatusDisplay.textContent = 'Please log in.';
            if (unsubscribeFromGainsData) { // Also unsubscribe if logging out
                unsubscribeFromGainsData();
                unsubscribeFromGainsData = null;
            }
            if (unsubscribeFromTrackingStatus) { // Also unsubscribe if logging out
                unsubscribeFromTrackingStatus();
                unsubscribeFromTrackingStatus = null;
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