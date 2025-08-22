
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Firebase to be ready
    firebase.auth().onAuthStateChanged(async user => {
        if (user) {
            // User is signed in, start the main logic.
            await initializeLeaderDashboard(user);
        } else {
            // User is not signed in.
            showMainError("Please log in to access this page.");
        }
    });

    // Attach event listeners to the buttons
    document.getElementById('getMemberReportBtn').addEventListener('click', getSelectedMemberReport);
    document.getElementById('downloadAllBtn').addEventListener('click', () => {
        alert("The 'Download All' feature will be built next!");
    });
});

/**
 * Main function to initialize the dashboard.
 * Verifies user role and populates the member dropdown.
 * @param {object} currentUser - The currently authenticated Firebase user.
 */
async function initializeLeaderDashboard(currentUser) {
    showLoadingSpinner();
    const db = firebase.firestore();

    try {
        const userProfileRef = db.collection('userProfiles').doc(currentUser.uid);
        const userProfileDoc = await userProfileRef.get();

        if (!userProfileDoc.exists) {
            showMainError("Your user profile was not found.");
            hideLoadingSpinner();
            return;
        }

        const userData = userProfileDoc.data();
        const userPosition = userData.position;
        const userFactionId = userData.faction_id;

        // 1. AUTHORIZATION CHECK
        if (userPosition === 'Leader' || userPosition === 'Co-leader') {
            // Show the main tool content if authorized
            document.getElementById('leader-tool-content').style.display = 'block';

            // 2. POPULATE DROPDOWN
            if (userFactionId) {
                await populateFactionMembers(userFactionId);
            } else {
                showMainError("Your faction ID is not set in your profile.");
            }

        } else {
            // User is not a leader or co-leader
            showMainError("Access Denied: This page is for Faction Leaders and Co-leaders only.");
        }

    } catch (error) {
        console.error("Error initializing dashboard:", error);
        showMainError(`An error occurred: ${error.message}`);
    } finally {
        hideLoadingSpinner();
    }
}

/**
 * Fetches all users from a given faction and populates the dropdown.
 * @param {string} factionId - The ID of the faction to fetch members for.
 */
async function populateFactionMembers(factionId) {
    const db = firebase.firestore();
    const selectElement = document.getElementById('factionMemberSelect');
    selectElement.innerHTML = '<option value="">Loading members...</option>'; // Reset

    try {
        const membersQuery = db.collection('userProfiles').where('faction_id', '==', factionId);
        const querySnapshot = await membersQuery.get();

        if (querySnapshot.empty) {
            selectElement.innerHTML = '<option value="">No members found</option>';
            return;
        }

        const members = [];
        querySnapshot.forEach(doc => {
            const memberData = doc.data();
            members.push({
                uid: doc.id, // Firebase Auth UID
                name: memberData.name || `User ${memberData.tornProfileId}`,
                tornProfileId: memberData.tornProfileId
            });
        });

        // Sort members alphabetically by name
        members.sort((a, b) => a.name.localeCompare(b.name));

        // Populate the dropdown
        selectElement.innerHTML = '<option value="">-- Select a Member --</option>';
        members.forEach(member => {
            // The value of each option will be the member's tornProfileId and their Firebase UID, separated by a comma
            const option = document.createElement('option');
            option.value = `${member.tornProfileId},${member.uid}`;
            option.textContent = member.name;
            selectElement.appendChild(option);
        });

    } catch (error) {
        console.error("Error populating faction members:", error);
        selectElement.innerHTML = '<option value="">Error loading members</option>';
        showMainError("Could not load faction members.");
    }
}

/**
 * Triggered when "Get Member's Fair Fight" is clicked.
 * Fetches and displays the report for the selected member.
 */
async function getSelectedMemberReport() {
    hideMainError();
    const selectElement = document.getElementById('factionMemberSelect');
    const selectedValue = selectElement.value;

    if (!selectedValue) {
        showMainError("Please select a member from the list.");
        return;
    }

    showLoadingSpinner();

    try {
        const [selectedTornId, selectedUid] = selectedValue.split(',');
        const db = firebase.firestore();

        // 1. Get the selected member's UserProfile to find their API key
        const memberProfileRef = db.collection('userProfiles').doc(selectedUid);
        const memberProfileDoc = await memberProfileRef.get();
        if (!memberProfileDoc.exists) {
            throw new Error("Selected member's profile not found.");
        }
        const memberApiKey = memberProfileDoc.data().tornApiKey;
        const memberName = memberProfileDoc.data().name;
        if (!memberApiKey) {
            throw new Error("This member has not set their API key on the site.");
        }

        // 2. Get the selected member's battle stats for the personalized formula
        const memberStatsRef = db.collection('users').doc(selectedTornId);
        const memberStatsDoc = await memberStatsRef.get();
        if (!memberStatsDoc.exists || !memberStatsDoc.data().battlestats) {
            throw new Error("Could not find the selected member's battle stats.");
        }
        const memberTotalStats = memberStatsDoc.data().battlestats.total;

        // 3. Fetch the fair fight data using the member's key
        const ffResultsFromApi = await fetchFairFightData([selectedTornId], memberApiKey);

        // 4. Recalculate the score from the member's perspective
        const finalResults = ffResultsFromApi.map(targetData => {
            if (targetData.error || targetData.no_data || !targetData.bs_estimate || memberTotalStats <= 0 || targetData.bs_estimate <= 0) {
                return targetData;
            }
            // This is your personalized formula from the original script
            let finalScore = 3.5 * Math.pow(3, Math.log10(targetData.bs_estimate / memberTotalStats));
            if (finalScore < 1.03) {
                finalScore = 1.03;
            }
            return { ...targetData, value: finalScore };
        });

        // 5. Display the report
        const reportData = finalResults.map(ffData => ({
            userId: selectedTornId,
            name: memberName,
            ffData: ffData
        }));

        displayReport(reportData, `User: ${memberName}`);

    } catch (error) {
        console.error("Error generating member report:", error);
        showMainError(`Error: ${error.message}`);
    } finally {
        hideLoadingSpinner();
    }
}


// --- REUSED FUNCTIONS FROM YOUR tornpafairfight.js SCRIPT ---

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
                resultsMap.set(result.player_id.toString(), {
                    value: result.fair_fight,
                    last_updated: result.last_updated,
                    bs_estimate: result.bs_estimate,
                    bs_estimate_human: result.bs_estimate_human,
                    no_data: result.fair_fight === null
                });
            }
        });
        return playerIds.map(id => resultsMap.get(id.toString()) || { no_data: true });
    } catch (error) {
        console.error("Error fetching Fair Fight data:", error);
        return playerIds.map(id => ({ error: true, message: `Could not fetch FF data: ${error.message}` }));
    }
}

function displayReport(results, title) {
    const tableBody = document.getElementById('modal-results-table-body');
    const tableHeader = document.getElementById('modal-results-table-header');
    const reportTarget = document.getElementById('modal-report-target');
    const memberCount = document.getElementById('modal-member-count');

    tableBody.innerHTML = '';
    
    tableHeader.innerHTML = '<tr><th>Name</th><th>User ID</th><th>Fair Fight</th><th>Last Updated</th><th>Est. Stats</th></tr>';

    reportTarget.textContent = title;
    memberCount.textContent = `Members: ${results.length}`;
    
    results.forEach(item => {
        const row = tableBody.insertRow();
        const fairFightData = item.ffData;
        const name = item.name;
        const userId = item.userId;

        row.insertCell().innerHTML = `<a href="https://www.torn.com/profiles.php?XID=${userId}" target="_blank">${name}</a>`;
        row.insertCell().textContent = userId;

        const ffCell = row.insertCell();
        if (fairFightData && !fairFightData.error) {
            ffCell.textContent = getFFDisplayValue(fairFightData);
            const colors = getFFDisplayColor(fairFightData);
            ffCell.style.backgroundColor = colors.background;
            ffCell.style.color = colors.text;
            ffCell.style.fontWeight = 'bold';
        } else {
            ffCell.textContent = "N/A";
            ffCell.style.backgroundColor = '#444';
            ffCell.style.color = 'white';
        }

        row.insertCell().textContent = fairFightData && fairFightData.last_updated ?
            new Date(fairFightData.last_updated * 1000).toLocaleString() : 'N/A';

        row.insertCell().textContent = fairFightData && fairFightData.bs_estimate_human ? fairFightData.bs_estimate_human : 'N/A';
    });

    showResultsModal();
}


// --- REUSED HELPER & UI FUNCTIONS ---

function getFFDisplayValue(ffResponse) {
    if (!ffResponse || ffResponse.no_data || typeof ffResponse.value !== 'number') return "N/A";
    const ff = ffResponse.value.toFixed(2);
    const now = Date.now() / 1000;
    const age = now - ffResponse.last_updated;
    const suffix = age > (14 * 24 * 60 * 60) ? "?" : "";
    return `${ff}${suffix}`;
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
    const errorDiv = document.getElementById('main-error-feedback');
    errorDiv.style.display = 'none';
}