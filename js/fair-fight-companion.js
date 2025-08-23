/* ==========================================================================
   FAIR FIGHT COMPANION - MASTER SCRIPT
   ========================================================================== */

// --- 1. CONSTANTS ---
const FF_SCOUTER_API_URL = "https://ffscouter.com/api/v1/get-stats";
const NETLIFY_TARGETS_FUNCTION = `/.netlify/functions/get-recommended-targets`;


/* ==========================================================================
   2. SHARED UTILITY FUNCTIONS (De-duplicated)
   ========================================================================== */

// --- API & Data Functions ---
async function getTornApiKey() {
    try {
        const ownerUid = '48CQkfJqz2YrXrHfmOO0y1zeci93'; // Hardcoded UID for the site's API key
        const userDoc = await firebase.firestore().collection('userProfiles').doc(ownerUid).get();
        if (userDoc.exists && userDoc.data().tornApiKey) {
            return userDoc.data().tornApiKey;
        } else {
            throw new Error("A critical error occurred. The site API key is not configured.");
        }
    } catch (error) {
        showError('public', error.message); // Show error on a default tab
        return null;
    }
}

async function fetchFairFightData(playerIds, apiKey) {
    if (!playerIds || playerIds.length === 0) return [];
    const url = `${FF_SCOUTER_API_URL}?key=${apiKey}&targets=${playerIds.join(",")}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`FF Scouter API error: ${response.status}`);
        const apiResponse = await response.json();
        if (apiResponse.error) throw new Error(`FF Scouter API error: ${apiResponse.error}`);
        const resultsMap = new Map();
        apiResponse.forEach(result => {
            if (result.player_id) {
                resultsMap.set(result.player_id.toString(), { value: result.fair_fight, last_updated: result.last_updated, bs_estimate: result.bs_estimate, bs_estimate_human: result.bs_estimate_human, no_data: result.fair_fight === null });
            }
        });
        return playerIds.map(id => resultsMap.get(id.toString()) || { no_data: true });
    } catch (error) {
        return playerIds.map(id => ({ error: true, message: error.message }));
    }
}

// --- UI Control Functions ---
function showLoadingSpinner() { document.getElementById('loadingOverlay').classList.add('visible'); }
function hideLoadingSpinner() { document.getElementById('loadingOverlay').classList.remove('visible'); }
function showResultsModal() { document.getElementById('resultsModalOverlay').classList.add('visible'); }

function closeResultsModal() {
    const overlay = document.getElementById('resultsModalOverlay');
    if (overlay) overlay.classList.remove('visible');
    // Reset modal content for next use
    document.getElementById('modal-results-table-header').innerHTML = '';
    document.getElementById('modal-results-table-body').innerHTML = '';
    document.querySelector('#resultsModalOverlay .modal-title').textContent = 'Report';
    document.querySelector('#resultsModalOverlay .modal-summary').innerHTML = '';
    // Make sure download button is visible by default for the next opening
    document.getElementById('downloadReportBtn').style.display = 'block';
}

function closeDiscordSettingsModal() {
    const overlay = document.getElementById('discordSettingsModal');
    if (overlay) overlay.style.display = 'none'; // Assuming it's controlled by display
}

function showError(tabName, message) {
    let errorDiv;
    if (tabName === 'personal') {
        errorDiv = document.getElementById('fairFightApiKeyError');
    } else if (tabName === 'public') {
        errorDiv = document.getElementById('public-main-error-feedback');
    } else if (tabName === 'leader') {
        errorDiv = document.getElementById('leader-main-error-feedback');
    }

    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = message ? 'block' : 'none';
    }
}

// --- Formatting & Display Functions ---
function getFairFightColor(value) {
    let r, g, b;
    if (value <= 1.25) { r = 0x28; g = 0x28; b = 0xc6; }
    else if (value <= 2.5) { const t = (value - 1.25) / 1.25; r = 0x28; g = Math.round(0x28 + (0xc6 - 0x28) * t); b = Math.round(0xc6 - (0xc6 - 0x28) * t); }
    else if (value <= 4) { const t = (value - 2.5) / 1.5; r = Math.round(0x28 + (0xc6 - 0x28) * t); g = Math.round(0xc6 - (0xc6 - 0x28) * t); b = 0x28; }
    else { r = 0xc6; g = 0x28; b = 0x28; }
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function getContrastColor(hex) {
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return (r * 0.299 + g * 0.587 + b * 0.114) > 126 ? "black" : "white";
}

function getFFDisplayValue(ffResponse) {
    if (!ffResponse || ffResponse.no_data || typeof ffResponse.value !== 'number') return "N/A";
    const ff = ffResponse.value.toFixed(2);
    const age = (Date.now() / 1000) - ffResponse.last_updated;
    return `${ff}${age > (14 * 24 * 60 * 60) ? "?" : ""}`;
}


/* ==========================================================================
   3. TAB-SPECIFIC LOGIC
   ========================================================================== */

// --- TAB 1: PERSONAL TARGET FINDER ---
async function handlePersonalTargetFinder() {
    showError('personal', '');
    const user = firebase.auth().currentUser;
    if (!user) {
        showError('personal', 'You must be logged in to find targets.');
        return;
    }
    showLoadingSpinner();

    try {
        const userProfileDoc = await firebase.firestore().collection('userProfiles').doc(user.uid).get();
        if (!userProfileDoc.exists) throw new Error("Your user profile was not found.");

        const { tornApiKey, tornProfileId } = userProfileDoc.data();
        if (!tornApiKey || !tornProfileId) throw new Error("Your API Key or Torn ID is not set in your profile.");

        const response = await fetch(NETLIFY_TARGETS_FUNCTION, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: tornApiKey, playerId: tornProfileId })
        });
        const data = await response.json();
        if (!response.ok || data.error) throw new Error(data.error || `Function Error: ${response.status}`);
        
        displayPersonalTargets(data, tornProfileId);

    } catch (error) {
        showError('personal', error.message);
    } finally {
        hideLoadingSpinner();
    }
}

function displayPersonalTargets(data, playerId) {
    const modalTitle = document.querySelector('#resultsModalOverlay .modal-title');
    const modalSummary = document.querySelector('#resultsModalOverlay .modal-summary');
    const tableHeader = document.getElementById('modal-results-table-header');
    const tableBody = document.getElementById('modal-results-table-body');
    const downloadBtn = document.getElementById('downloadReportBtn');
    
    // HIDE the download button for this specific report
    downloadBtn.style.display = 'none';

    modalTitle.textContent = 'Recommended Targets';
    tableBody.innerHTML = '';
    tableHeader.innerHTML = '';
    
    if (!data.targets || data.targets.length === 0) {
        modalSummary.innerHTML = `Player: <span>${playerId}</span> | Status: <span style="color: #ff4d4d;">${data.message || 'No recommended targets found.'}</span>`;
    } else {
        modalSummary.innerHTML = `Player: <span>${data.playerName || 'You'} [${playerId}]</span> | Found <span>${data.targets.length}</span> Recommended Targets.`;
        const headers = ["Name", "ID", "Fair Fight", "Difficulty", "Est. Stats", "Status", "Attack Link"];
        tableHeader.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
        
        data.targets.forEach(target => {
            const row = tableBody.insertRow();
            row.insertCell().textContent = target.playerName || target.playerID;
            row.insertCell().textContent = target.playerID;
            
            const ffCell = row.insertCell();
            const ffColor = getFairFightColor(parseFloat(target.fairFightScore));
            ffCell.style.backgroundColor = ffColor;
            ffCell.style.color = getContrastColor(ffColor);
            ffCell.style.fontWeight = 'bold';
            ffCell.textContent = target.fairFightScore;

            row.insertCell().textContent = target.difficulty;
            row.insertCell().textContent = target.estimatedBattleStats || "N/A";
            
            const statusCell = row.insertCell();
            statusCell.textContent = target.status.text;
            statusCell.style.color = target.status.color;
            statusCell.style.fontWeight = 'bold';

            row.insertCell().innerHTML = `<a href="${target.attackUrl}" target="_blank">Attack</a>`;
        });
    }
    showResultsModal();
}

// --- TAB 2: PUBLIC FAIR FIGHT LOOKUP ---
async function handlePublicFairFightLookup() {
    showError('public', '');
    const factionId = document.getElementById('factionId').value.trim();
    const userId = document.getElementById('userId').value.trim();

    if (!factionId && !userId) return showError('public', 'Please enter a Faction ID or a User ID.');
    if (factionId && userId) return showError('public', 'Please enter only one ID, not both.');
    
    showLoadingSpinner();
    try {
        const loggedInUserDoc = await firebase.firestore().collection('userProfiles').doc(firebase.auth().currentUser.uid).get();
        if (!loggedInUserDoc.exists) throw new Error("Your user profile could not be found.");
        const visitorTotalStats = (await firebase.firestore().collection('users').doc(loggedInUserDoc.data().tornProfileId).get()).data().battlestats.total;

        const siteApiKey = await getTornApiKey();
        if (!siteApiKey) return;

        let playerIdsToFetch = [];
        let reportTitle = "";
        let playerNames = new Map();

        if (factionId) {
            const factionData = await (await fetch(`https://api.torn.com/faction/${factionId}?selections=basic&key=${siteApiKey}`)).json();
            if (factionData.error) throw new Error(factionData.error.error);
            reportTitle = `Faction: ${factionData.name}`;
            playerIdsToFetch = Object.keys(factionData.members);
            Object.entries(factionData.members).forEach(([id, member]) => playerNames.set(id, member.name));
        } else {
            const userData = await (await fetch(`https://api.torn.com/user/${userId}?selections=basic&key=${siteApiKey}`)).json();
            if (userData.error) throw new Error(userData.error.error);
            reportTitle = `User: ${userData.name}`;
            playerIdsToFetch = [userId];
            playerNames.set(userId, userData.name);
        }

        const ffResults = await fetchFairFightData(playerIdsToFetch, siteApiKey);
        
        const finalResults = ffResults.map((targetData, i) => {
            const currentUserId = playerIdsToFetch[i];
            if (targetData.error || targetData.no_data || !targetData.bs_estimate || visitorTotalStats <= 0) {
                 return { userId: currentUserId, name: playerNames.get(currentUserId), ffData: targetData };
            }
            let finalScore = 3.5 * Math.pow(3, Math.log10(targetData.bs_estimate / visitorTotalStats));
            if (finalScore < 1.03) finalScore = 1.03;
            return { userId: currentUserId, name: playerNames.get(currentUserId), ffData: { ...targetData, value: finalScore } };
        });
        
        displayPublicLookupReport(finalResults, reportTitle);

    } catch (error) {
        showError('public', `Error: ${error.message}`);
    } finally {
        hideLoadingSpinner();
    }
}

function displayPublicLookupReport(results, title) {
    const modalTitle = document.querySelector('#resultsModalOverlay .modal-title');
    const modalSummary = document.querySelector('#resultsModalOverlay .modal-summary');
    const tableHeader = document.getElementById('modal-results-table-header');
    const tableBody = document.getElementById('modal-results-table-body');
    const downloadBtn = document.getElementById('downloadReportBtn');
    
    // SHOW the download button for this report
    downloadBtn.style.display = 'block';
    
    modalTitle.textContent = "Fair Fight Report";
    tableBody.innerHTML = '';
    
    modalSummary.innerHTML = `<p>Report for: <span>${title}</span></p><p>Targets: ${results.length}</p>`;
    
    const headers = results.length > 1 
        ? ["Name", "User ID", "Fair Fight", "Last Updated"]
        : ["Name", "User ID", "Fair Fight", "Est. Stats", "Last Updated"];
    tableHeader.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;

    results.forEach(item => {
        const row = tableBody.insertRow();
        row.insertCell().innerHTML = `<a href="https://www.torn.com/profiles.php?XID=${item.userId}" target="_blank">${item.name}</a>`;
        row.insertCell().textContent = item.userId;

        const ffCell = row.insertCell();
        const ffColor = getFairFightColor(item.ffData.value);
        ffCell.style.backgroundColor = ffColor;
        ffCell.style.color = getContrastColor(ffColor);
        ffCell.style.fontWeight = 'bold';
        ffCell.textContent = getFFDisplayValue(item.ffData);

        if (results.length === 1) {
            row.insertCell().textContent = item.ffData.bs_estimate_human || 'N/A';
        }

        row.insertCell().textContent = item.ffData.last_updated ? new Date(item.ffData.last_updated * 1000).toLocaleString() : 'N/A';
    });
    
    showResultsModal();
}


// --- TAB 3: LEADER'S WAR DASHBOARD ---
async function initializeLeaderDashboard(user, userData) {
    const leaderTab = document.getElementById('leader-dashboard-tab');
    if (userData.position === 'Leader' || userData.position === 'Co-leader') {
        leaderTab.style.display = 'block';
        if (userData.faction_id) {
            await populateFactionMembers(userData.faction_id);
        } else {
            showError('leader', 'Your Faction ID is not set in your profile.');
        }
    }
}

async function populateFactionMembers(factionId) {
    const selectElement = document.getElementById('factionMemberSelect');
    try {
        const querySnapshot = await firebase.firestore().collection('userProfiles').where('faction_id', '==', factionId).get();
        const members = [];
        querySnapshot.forEach(doc => {
            const data = doc.data();
            members.push({ uid: doc.id, name: data.name || `User ${data.tornProfileId}`, tornProfileId: data.tornProfileId });
        });
        members.sort((a, b) => a.name.localeCompare(b.name));
        selectElement.innerHTML = '<option value="">-- Select a Member --</option>';
        members.forEach(member => {
            const option = document.createElement('option');
            option.value = `${member.tornProfileId},${member.uid}`;
            option.textContent = member.name;
            selectElement.appendChild(option);
        });
    } catch (error) {
        selectElement.innerHTML = '<option value="">Error loading members</option>';
        showError('leader', "Could not load faction members.");
    }
}

async function handleLeaderWarReport() {
    showError('leader', '');
    const selectedMemberValue = document.getElementById('factionMemberSelect').value;
    const enemyFactionId = document.getElementById('enemyFactionId').value.trim();

    if (!selectedMemberValue) return showError('leader', "Please select one of your members.");
    if (!enemyFactionId) return showError('leader', "Please enter an enemy faction ID.");

    showLoadingSpinner();
    try {
        const [friendlyTornId, friendlyUid] = selectedMemberValue.split(',');
        const memberProfileDoc = await firebase.firestore().collection('userProfiles').doc(friendlyUid).get();
        if (!memberProfileDoc.exists) throw new Error("Selected member's profile not found.");
        
        const friendlyName = memberProfileDoc.data().name;
        const memberStatsDoc = await firebase.firestore().collection('users').doc(friendlyTornId).get();
        if (!memberStatsDoc.exists || !memberStatsDoc.data().battlestats) throw new Error("Could not find the selected member's battle stats.");
        const friendlyTotalStats = memberStatsDoc.data().battlestats.total;

        const siteApiKey = await getTornApiKey();
        if (!siteApiKey) return;

        const factionData = await (await fetch(`https://api.torn.com/faction/${enemyFactionId}?selections=basic&key=${siteApiKey}`)).json();
        if (factionData.error) throw new Error(`Torn API Error: ${factionData.error.error}`);
        
        const enemyFactionName = factionData.name;
        const enemyPlayerIds = Object.keys(factionData.members);
        const enemyPlayerNames = new Map(Object.entries(factionData.members).map(([id, member]) => [id, member.name]));

        const ffResults = await fetchFairFightData(enemyPlayerIds, siteApiKey);
        const finalResults = ffResults.map((targetData, i) => {
            const enemyId = enemyPlayerIds[i];
            if (targetData.error || targetData.no_data || !targetData.bs_estimate || friendlyTotalStats <= 0) {
                 return { userId: enemyId, name: enemyPlayerNames.get(enemyId), ffData: targetData };
            }
            let finalScore = 3.5 * Math.pow(3, Math.log10(targetData.bs_estimate / friendlyTotalStats));
            if (finalScore < 1.03) finalScore = 1.03;
            return { userId: enemyId, name: enemyPlayerNames.get(enemyId), ffData: { ...targetData, value: finalScore } };
        });
        
        finalResults.sort((a, b) => a.name.localeCompare(b.name));
        displayLeaderWarReport(finalResults, `${enemyFactionName} (vs ${friendlyName})`);

    } catch (error) {
        showError('leader', `Error: ${error.message}`);
    } finally {
        hideLoadingSpinner();
    }
}

function displayLeaderWarReport(results, title) {
    const modalTitle = document.querySelector('#resultsModalOverlay .modal-title');
    const modalSummary = document.querySelector('#resultsModalOverlay .modal-summary');
    const tableHeader = document.getElementById('modal-results-table-header');
    const tableBody = document.getElementById('modal-results-table-body');
    const downloadBtn = document.getElementById('downloadReportBtn');
    
    // SHOW the download button for this report
    downloadBtn.style.display = 'block';
    
    modalTitle.textContent = "Leader's War Report";
    tableBody.innerHTML = '';

    modalSummary.innerHTML = `<p>Report for: <span>${title}</span></p><p>Targets: ${results.length}</p>`;
    const headers = ["Name", "User ID", "Fair Fight", "Est. Stats", "Last Updated"];
    tableHeader.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;
    
    results.forEach(item => {
        const row = tableBody.insertRow();
        row.insertCell().innerHTML = `<a href="https://www.torn.com/profiles.php?XID=${item.userId}" target="_blank">${item.name}</a>`;
        row.insertCell().textContent = item.userId;
        const ffCell = row.insertCell();
        if (item.ffData && !item.ffData.error) {
            const ffColor = getFairFightColor(item.ffData.value);
            ffCell.style.backgroundColor = ffColor;
            ffCell.style.color = getContrastColor(ffColor);
            ffCell.style.fontWeight = 'bold';
            ffCell.textContent = getFFDisplayValue(item.ffData);
        } else {
            ffCell.textContent = "N/A";
        }
        row.insertCell().textContent = item.ffData?.bs_estimate_human || 'N/A';
        row.insertCell().textContent = item.ffData?.last_updated ? new Date(item.ffData.last_updated * 1000).toLocaleString() : 'N/A';
    });
    showResultsModal();
}


/* ==========================================================================
   4. CORE INITIALIZATION AND TAB CONTROL
   ========================================================================== */

function setupTabControls() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Deactivate all tabs and panes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            // Activate the clicked tab and corresponding pane
            const tabId = button.dataset.tab;
            button.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

function initializeCompanionPage() {
    // Basic setup that runs for everyone
    setupTabControls();

    // Attach event listeners for buttons within each tab
    document.getElementById('fetchTargetsBtn').addEventListener('click', handlePersonalTargetFinder);
    document.getElementById('fetchFairFight').addEventListener('click', handlePublicFairFightLookup);
    document.getElementById('generateReportBtn').addEventListener('click', handleLeaderWarReport);
    // Add other general listeners like download button if it becomes shared
    // document.getElementById('downloadReportBtn').addEventListener('click', handleDownload);

    // Authentication-dependent setup
    firebase.auth().onAuthStateChanged(async user => {
        if (user) {
            // Logic for signed-in users
            const userProfileDoc = await firebase.firestore().collection('userProfiles').doc(user.uid).get();
            if (userProfileDoc.exists) {
                const userData = userProfileDoc.data();
                // Initialize the leader dashboard (which will show/hide the tab)
                initializeLeaderDashboard(user, userData);
            }
        } else {
            // Logic for signed-out users (e.g., disable certain features)
            document.getElementById('fetchTargetsBtn').disabled = true;
            document.getElementById('leader-dashboard-tab').style.display = 'none';
            showError('personal', 'Please sign in to use this feature.');
        }
    });
}

// Entry point
document.addEventListener('DOMContentLoaded', initializeCompanionPage);