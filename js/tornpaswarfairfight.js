// --- SCRIPT FOR LEADER WAR DASHBOARD ---

document.addEventListener('DOMContentLoaded', async () => {
    firebase.auth().onAuthStateChanged(async user => {
        if (user) {
            await initializeLeaderDashboard(user);
        } else {
            showMainError("Please log in to access this page.");
        }
    });

    document.getElementById('generateReportBtn').addEventListener('click', generateWarReport);
});

async function initializeLeaderDashboard(currentUser) {
    showLoadingSpinner();
    const db = firebase.firestore();
    try {
        const userProfileDoc = await db.collection('userProfiles').doc(currentUser.uid).get();
        if (!userProfileDoc.exists) {
            throw new Error("Your user profile was not found.");
        }
        const userData = userProfileDoc.data();
        if (userData.position === 'Leader' || userData.position === 'Co-leader') {
            document.getElementById('leader-tool-content').style.display = 'block';
            if (userData.faction_id) {
                await populateFactionMembers(userData.faction_id);
            } else {
                throw new Error("Your faction ID is not set in your profile.");
            }
        } else {
            throw new Error("Access Denied: This page is for Faction Leaders and Co-leaders only.");
        }
    } catch (error) {
        showMainError(error.message);
    } finally {
        hideLoadingSpinner();
    }
}

async function populateFactionMembers(factionId) {
    const db = firebase.firestore();
    const selectElement = document.getElementById('factionMemberSelect');
    selectElement.innerHTML = '<option value="">Loading members...</option>';
    try {
        const querySnapshot = await db.collection('userProfiles').where('faction_id', '==', factionId).get();
        if (querySnapshot.empty) {
            selectElement.innerHTML = '<option value="">No members found</option>';
            return;
        }
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
        showMainError("Could not load faction members.");
    }
}

/**
 * Main function to generate the war report.
 */
async function generateWarReport() {
    hideMainError();
    const selectedMemberValue = document.getElementById('factionMemberSelect').value;
    const enemyFactionId = document.getElementById('enemyFactionId').value.trim();

    if (!selectedMemberValue) {
        showMainError("Please select one of your members.");
        return;
    }
    if (!enemyFactionId) {
        showMainError("Please enter an enemy faction ID.");
        return;
    }

    showLoadingSpinner();
    const db = firebase.firestore();

    try {
        // --- STEP 1: Get data for the selected friendly member ---
        const [friendlyTornId, friendlyUid] = selectedMemberValue.split(',');
        
        const memberProfileDoc = await db.collection('userProfiles').doc(friendlyUid).get();
        if (!memberProfileDoc.exists) throw new Error("Selected member's profile not found.");
        
        const friendlyApiKey = memberProfileDoc.data().tornApiKey;
        const friendlyName = memberProfileDoc.data().name;
        if (!friendlyApiKey) throw new Error("The selected member has not set their API key on this site.");

        const memberStatsDoc = await db.collection('users').doc(friendlyTornId).get();
        if (!memberStatsDoc.exists || !memberStatsDoc.data().battlestats) throw new Error("Could not find the selected member's battle stats.");
        const friendlyTotalStats = memberStatsDoc.data().battlestats.total;

        // --- STEP 2: Get the list of enemy members using the site's key ---
        const siteApiKey = await getTornApiKey(); // This key is for general site use
        if (!siteApiKey) return; // Error is shown inside the function

        const factionApiUrl = `https://api.torn.com/faction/${enemyFactionId}?selections=basic&key=${siteApiKey}`;
        const factionResponse = await fetch(factionApiUrl);
        const factionData = await factionResponse.json();
        if (factionData.error) throw new Error(`Torn API Error: ${factionData.error.error}`);
        
        const enemyFactionName = factionData.name;
        const enemyPlayerIds = Object.keys(factionData.members);
        const enemyPlayerNames = new Map(Object.entries(factionData.members).map(([id, member]) => [id, member.name]));

        if (enemyPlayerIds.length === 0) throw new Error("No members found in the enemy faction.");

        // --- STEP 3: Get Fair Fight data for all enemies using the FRIENDLY member's key ---
        const ffResultsFromApi = await fetchFairFightData(enemyPlayerIds, friendlyApiKey);

        // --- STEP 4: Recalculate scores from the friendly member's perspective using your formula ---
        const finalResults = ffResultsFromApi.map((targetData, index) => {
            const enemyId = enemyPlayerIds[index];
            if (targetData.error || targetData.no_data || !targetData.bs_estimate || friendlyTotalStats <= 0 || targetData.bs_estimate <= 0) {
                return { userId: enemyId, name: enemyPlayerNames.get(enemyId) || `User ${enemyId}`, ffData: targetData };
            }
            let finalScore = 3.5 * Math.pow(3, Math.log10(targetData.bs_estimate / friendlyTotalStats));
            if (finalScore < 1.03) finalScore = 1.03;
            return { userId: enemyId, name: enemyPlayerNames.get(enemyId) || `User ${enemyId}`, ffData: { ...targetData, value: finalScore } };
        });
        
        // Sort results by name before displaying
        finalResults.sort((a, b) => a.name.localeCompare(b.name));

        // --- STEP 5: Display the full report ---
        const reportTitle = `${enemyFactionName} (vs ${friendlyName})`;
        displayReport(finalResults, reportTitle);

    } catch (error) {
        showMainError(`Error: ${error.message}`);
    } finally {
        hideLoadingSpinner();
    }
}


// --- REUSED/UTILITY FUNCTIONS ---

// This function is needed again to fetch public faction data
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
        showMainError(error.message);
        return null;
    }
}

const FF_SCOUTER_API_URL = "https://ffscouter.com/api/v1/get-stats";
async function fetchFairFightData(playerIds, apiKey) {
    if (playerIds.length === 0) return [];
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

function displayReport(results, title) {
    const tableBody = document.getElementById('modal-results-table-body');
    const tableHeader = document.getElementById('modal-results-table-header');
    const reportTarget = document.getElementById('modal-report-target');
    const memberCount = document.getElementById('modal-member-count');
    tableBody.innerHTML = '';
    tableHeader.innerHTML = '<tr><th>Name</th><th>User ID</th><th>Fair Fight</th><th>Est. Stats</th><th>Last Updated</th></tr>';
    reportTarget.textContent = title;
    memberCount.textContent = `Targets: ${results.length}`;
    results.forEach(item => {
        const row = tableBody.insertRow();
        const { ffData, name, userId } = item;
        row.insertCell().innerHTML = `<a href="https://www.torn.com/profiles.php?XID=${userId}" target="_blank">${name}</a>`;
        row.insertCell().textContent = userId;
        const ffCell = row.insertCell();
        if (ffData && !ffData.error) {
            ffCell.textContent = getFFDisplayValue(ffData);
            const colors = getFFDisplayColor(ffData);
            ffCell.style.backgroundColor = colors.background;
            ffCell.style.color = colors.text;
            ffCell.style.fontWeight = 'bold';
        } else {
            ffCell.textContent = "N/A";
            ffCell.style.backgroundColor = '#444';
            ffCell.style.color = 'white';
        }
        row.insertCell().textContent = ffData?.bs_estimate_human || 'N/A';
        row.insertCell().textContent = ffData?.last_updated ? new Date(ffData.last_updated * 1000).toLocaleString() : 'N/A';
    });
    showResultsModal();
}

function getFFDisplayValue(ffResponse) {
    if (!ffResponse || ffResponse.no_data || typeof ffResponse.value !== 'number') return "N/A";
    const ff = ffResponse.value.toFixed(2);
    const age = (Date.now() / 1000) - ffResponse.last_updated;
    return `${ff}${age > (14 * 24 * 60 * 60) ? "?" : ""}`;
}

function getFFDisplayColor(ffResponse) {
    if (!ffResponse || ffResponse.no_data || typeof ffResponse.value !== 'number') return { background: '#444', text: 'white' };
    const bgColor = getFairFightColor(ffResponse.value);
    const textColor = getContrastColor(bgColor);
    return { background: bgColor, text: textColor };
}

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

function showLoadingSpinner() { document.getElementById('loadingOverlay').classList.add('visible'); }
function hideLoadingSpinner() { document.getElementById('loadingOverlay').classList.remove('visible'); }
function showResultsModal() { document.getElementById('resultsModalOverlay').classList.add('visible'); }
function closeResultsModal() { document.getElementById('resultsModalOverlay').classList.remove('visible'); }
function showMainError(message) {
    const errorDiv = document.getElementById('main-error-feedback');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}
function hideMainError() {
    document.getElementById('main-error-feedback').style.display = 'none';
}