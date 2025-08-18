// Function to check if Firebase is initialized
function isFirebaseInitialized() {
    return typeof firebase !== 'undefined' && firebase.app;
}

// Function to fetch the site's Torn API key from Firebase
async function getTornApiKey() {
    if (!isFirebaseInitialized()) {
        showMainError('Firebase not ready. Please try again in a moment.');
        return null;
    }
    try {
        const ownerUid = '48CQkfJqz2YrXrHfmOO0y1zeci93'; // Hardcoded UID for the site's API key
        const userDocRef = firebase.firestore().collection('userProfiles').doc(ownerUid);
        const userDoc = await userDocRef.get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            const tornApiKey = userData.tornApiKey;
            if (!tornApiKey) {
                showMainError('A critical error occurred. The site API key is not configured.');
                console.error('Master Torn API Key is not set in the specified user profile.');
                return null;
            }
            return tornApiKey;
        } else {
            showMainError('A critical error occurred. Could not find the site API key profile.');
            console.error('Master user profile not found in database.');
            return null;
        }
    } catch (error) {
        showMainError(`Error fetching site API Key: ${error.message}`);
        console.error('Error fetching master API Key:', error);
        return null;
    }
}

// MODIFIED: Renamed and now returns an object with tornId and totalStats
async function getLoggedInUserInfo() {
    if (!isFirebaseInitialized() || !firebase.auth().currentUser) {
        showMainError('You must be logged in to generate a personalized report.');
        return null;
    }
    const currentUser = firebase.auth().currentUser;

    try {
        const userProfileRef = firebase.firestore().collection('userProfiles').doc(currentUser.uid);
        const userProfileDoc = await userProfileRef.get();

        if (!userProfileDoc.exists) {
            showMainError('Your user profile was not found. Please ensure your profile is set up correctly.');
            return null;
        }
        const tornProfileId = userProfileDoc.data().tornProfileId;
        if (!tornProfileId) {
            showMainError('Your Torn Profile ID is not set in your user profile.');
            return null;
        }

        const userStatsRef = firebase.firestore().collection('users').doc(tornProfileId.toString());
        const userStatsDoc = await userStatsRef.get();

        if (!userStatsDoc.exists) {
            showMainError('Your battle stats were not found in the database.');
            return null;
        }

        const battleStats = userStatsDoc.data().battlestats;
        if (!battleStats || typeof battleStats.total === 'undefined') {
            showMainError('Your battle stats data is missing or incomplete in the database.');
            return null;
        }

        return {
            tornId: tornProfileId.toString(),
            totalStats: battleStats.total
        };

    } catch (error) {
        showMainError(`Error fetching your stats: ${error.message}`);
        console.error('Error in getLoggedInUserInfo:', error);
        return null;
    }
}


// Fair Fight logic rewritten from the FF Scouter V2 script
const FF_SCOUTER_API_URL = "https://ffscouter.com/api/v1/get-stats";
const ONE_HOUR = 60 * 60 * 1000;

function getFairFightFromCache(playerId) {
    const cachedData = localStorage.getItem(`tornpda-ff-${playerId}`);
    if (!cachedData) return null;
    try {
        const parsed = JSON.parse(cachedData);
        if (parsed && parsed.expiry && parsed.expiry > Date.now()) {
            return parsed;
        } else {
            localStorage.removeItem(`tornpda-ff-${playerId}`);
            return null;
        }
    } catch {
        localStorage.removeItem(`tornpda-ff-${playerId}`);
        return null;
    }
}

function saveFairFightToCache(playerId, data) {
    const expiry = Date.now() + ONE_HOUR;
    let cacheObj;
    if (data.fair_fight === null) {
        cacheObj = { no_data: true, expiry: expiry };
    } else {
        cacheObj = {
            value: data.fair_fight,
            last_updated: data.last_updated,
            expiry: expiry,
            bs_estimate: data.bs_estimate,
            bs_estimate_human: data.bs_estimate_human
        };
    }
    localStorage.setItem(`tornpda-ff-${playerId}`, JSON.stringify(cacheObj));
}

async function fetchFairFightData(playerIds, apiKey) {
    const cachedResults = playerIds.map(id => ({ id: id, data: getFairFightFromCache(id) }));
    const uncachedIds = cachedResults.filter(r => !r.data).map(r => r.id);

    if (uncachedIds.length === 0) {
        return cachedResults.map(r => r.data);
    }

    const url = `${FF_SCOUTER_API_URL}?key=${apiKey}&targets=${uncachedIds.join(",")}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`FF Scouter API error: ${response.status} ${response.statusText} - ${errorText}`);
        }
        const apiResponse = await response.json();
        if (apiResponse.error) {
            throw new Error(`FF Scouter API error: ${apiResponse.error}`);
        }
        apiResponse.forEach(result => {
            if (result.player_id) {
                saveFairFightToCache(result.player_id, result);
            }
        });
        return playerIds.map(id => getFairFightFromCache(id));
    } catch (error) {
        console.error("Error fetching Fair Fight data:", error);
        return playerIds.map(id => {
            const cached = getFairFightFromCache(id);
            if (cached) return cached;
            return { error: true, message: `Could not fetch FF data: ${error.message}` };
        });
    }
}

// Fair Fight styling logic
function getFairFightColor(value) {
    let r, g, b;
    if (value <= 1.25) { // Adjusted to match "Easy" tier
        r = 0x28; g = 0x28; b = 0xc6; // Blue
    } else if (value <= 2.5) { // Adjusted for "Medium"
        const t = (value - 1.25) / 1.25;
        r = 0x28; g = Math.round(0x28 + (0xc6 - 0x28) * t); b = Math.round(0xc6 - (0xc6 - 0x28) * t);
    } else if (value <= 4) { // Adjusted for "Hard"
        const t = (value - 2.5) / 1.5;
        r = Math.round(0x28 + (0xc6 - 0x28) * t); g = Math.round(0xc6 - (0xc6 - 0x28) * t); b = 0x28;
    } else { // Impossible
        r = 0xc6; g = 0x28; b = 0x28; // Red
    }
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function getContrastColor(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = r * 0.299 + g * 0.587 + b * 0.114;
    return brightness > 126 ? "black" : "white";
}

// MODIFIED: This function now returns words based on the new tiers
function getFFDisplayValue(ffResponse) {
    if (!ffResponse || ffResponse.no_data || typeof ffResponse.value !== 'number') {
        return "N/A";
    }

    const value = ffResponse.value;

    // Final Word Tiers with expanded "Easy" category
    if (value <= 1.25) {
        return "Easy";
    } else if (value <= 2.50) {
        return "Medium";
    } else if (value <= 4.00) {
        return "Hard";
    } else { // value > 4.00
        return "Impossible";
    }
}

function getFFDisplayColor(ffResponse) {
    if (!ffResponse || ffResponse.no_data || typeof ffResponse.value !== 'number') return { background: '#444', text: 'white' };
    const bgColor = getFairFightColor(ffResponse.value);
    const textColor = getContrastColor(bgColor);
    return { background: bgColor, text: textColor };
}

// Modal and UI control functions
function showLoadingSpinner() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.add('visible');
}

function hideLoadingSpinner() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.remove('visible');
}

function showResultsModal() {
    const overlay = document.getElementById('resultsModalOverlay');
    if (overlay) overlay.classList.add('visible');
}

function closeResultsModal() {
    const overlay = document.getElementById('resultsModalOverlay');
    if (overlay) overlay.classList.remove('visible');
    const tableBody = document.getElementById('modal-results-table-body');
    if (tableBody) tableBody.innerHTML = '';
}

function showMainError(message) {
    const errorDiv = document.getElementById('main-error-feedback');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

function hideMainError() {
    const errorDiv = document.getElementById('main-error-feedback');
    if (errorDiv) {
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
    }
}

// Main logic to generate the report
async function generateFairFightReport() {
    hideMainError();
    const factionIdInput = document.getElementById('factionId').value.trim();
    const userIdInput = document.getElementById('userId').value.trim();

    if (!factionIdInput && !userIdInput) {
        showMainError('Please enter either a Faction ID or a User ID.');
        return;
    }
    if (factionIdInput && userIdInput) {
        showMainError('Please enter only one ID (either Faction or User), not both.');
        return;
    }

    showLoadingSpinner();

    // Get all necessary info about the logged-in user.
    const loggedInUserInfo = await getLoggedInUserInfo();
    if (!loggedInUserInfo) {
        hideLoadingSpinner();
        return; // Error shown in helper
    }
    
    const currentUser = firebase.auth().currentUser;
    const ownerUid = '48CQkfJqz2YrXrHfmOO0y1zeci93';
    const isOwnerViewing = currentUser.uid === ownerUid;
    
    let visitorTotalStats = null;
    if (!isOwnerViewing) {
        visitorTotalStats = loggedInUserInfo.totalStats;
    }

    const tornApiKey = await getTornApiKey();
    if (!tornApiKey) {
        hideLoadingSpinner();
        return;
    }

    let reportTitle = "";
    let playerIdsToFetch = [];

    try {
        if (factionIdInput) {
            const factionApiUrl = `https://api.torn.com/faction/${factionIdInput}?selections=basic&key=${tornApiKey}`;
            const factionResponse = await fetch(factionApiUrl);
            const factionData = await factionResponse.json();
            if (factionData.error) throw new Error(factionData.error.error);

            reportTitle = `Faction: ${factionData.name}`;
            playerIdsToFetch = Object.keys(factionData.members);
            if (playerIdsToFetch.length === 0) {
                showMainError('No members found for this faction.');
                hideLoadingSpinner();
                return;
            }
        } else if (userIdInput) {
            const userApiUrl = `https://api.torn.com/user/${userIdInput}?selections=basic&key=${tornApiKey}`;
            const userResponse = await fetch(userApiUrl);
            const userData = await userResponse.json();
            if (userData.error) throw new Error(userData.error.error);

            reportTitle = `User: ${userData.name}`;
            playerIdsToFetch = [userIdInput];
        }

        const ffResultsFromApi = await fetchFairFightData(playerIdsToFetch, tornApiKey);
        if (!ffResultsFromApi || ffResultsFromApi.length === 0) {
            showMainError('No fair fight data found.');
            hideLoadingSpinner();
            return;
        }

        let finalResults;

        if (isOwnerViewing) {
            finalResults = ffResultsFromApi;
        } else {
            finalResults = ffResultsFromApi.map(targetData => {
                if (targetData.error || targetData.no_data || !targetData.bs_estimate) {
                    return targetData;
                }
                
                const baseScore = Math.log(targetData.bs_estimate) / Math.log(visitorTotalStats);
                let finalScore;

                if (baseScore <= 1) {
                    finalScore = 1.0;
                } else {
                    const difficultyMultiplier = 6;
                    finalScore = 1 + (baseScore - 1) * difficultyMultiplier;
                }

                return { ...targetData, value: finalScore };
            });
        }

        const userNames = new Map();
        if (factionIdInput) {
            const factionApiUrl = `https://api.torn.com/faction/${factionIdInput}?selections=basic&key=${tornApiKey}`;
            const factionResponse = await fetch(factionApiUrl);
            const factionData = await factionResponse.json();
            if (factionData.members) {
                Object.entries(factionData.members).forEach(([id, member]) => {
                    userNames.set(id, member.name);
                });
            }
        } else {
            const userApiUrl = `https://api.torn.com/user/${userIdInput}?selections=basic&key=${tornApiKey}`;
            const userResponse = await fetch(userApiUrl);
            const userData = await userResponse.json();
            userNames.set(userIdInput, userData.name);
        }

        const sortedResults = finalResults.map((ffData, index) => {
            const userId = playerIdsToFetch[index];
            return { userId, ffData, name: userNames.get(userId) || `User ${userId}` };
        }).sort((a, b) => a.name.localeCompare(b.name));

        // NEW: Filter the logged-in user out of the final results.
        const filteredResults = sortedResults.filter(item => item.userId !== loggedInUserInfo.tornId);

        displayReport(filteredResults, reportTitle);

    } catch (error) {
        showMainError(`Error: ${error.message}`);
        console.error("Error in report generation:", error);
    } finally {
        hideLoadingSpinner();
    }
}

// Function to populate and show the report modal
function displayReport(results, title) {
    const tableBody = document.getElementById('modal-results-table-body');
    const tableHeader = document.getElementById('modal-results-table-header');
    const reportTarget = document.getElementById('modal-report-target');
    const memberCount = document.getElementById('modal-member-count');

    tableBody.innerHTML = '';
    
    if (results.length > 1) {
        tableHeader.innerHTML = '<tr><th>Name</th><th>User ID</th><th>Fair Fight</th><th>Last Updated</th></tr>';
    } else {
        tableHeader.innerHTML = '<tr><th>Name</th><th>User ID</th><th>Fair Fight</th><th>Last Updated</th><th>Est. Stats</th></tr>';
    }

    reportTarget.textContent = title;
    // MODIFIED: Update member count based on the filtered list
    memberCount.textContent = `Members: ${results.length}`;
    
    results.forEach(item => {
        const row = tableBody.insertRow();
        const fairFightData = item.ffData;
        const name = item.name;
        const userId = item.userId;

        const nameCell = row.insertCell();
        nameCell.innerHTML = `<a href="https://www.torn.com/profiles.php?XID=${userId}" target="_blank">${name}</a>`;

        row.insertCell().textContent = userId;

        const ffCell = row.insertCell();
        if (fairFightData && !fairFightData.error) {
            const displayValue = getFFDisplayValue(fairFightData); 
            const colors = getFFDisplayColor(fairFightData);
            ffCell.textContent = displayValue;
            ffCell.style.backgroundColor = colors.background;
            ffCell.style.color = colors.text;
            ffCell.style.fontWeight = 'bold';
        } else {
            ffCell.textContent = "N/A";
            ffCell.style.backgroundColor = '#444';
            ffCell.style.color = 'white';
        }

        const updatedCell = row.insertCell();
        updatedCell.textContent = fairFightData && fairFightData.last_updated ?
            new Date(fairFightData.last_updated * 1000).toLocaleString() : 'N/A';

        if (results.length === 1) {
            const statsCell = row.insertCell();
            statsCell.textContent = fairFightData && fairFightData.bs_estimate_human ? fairFightData.bs_estimate_human : 'N/A';
        }
    });

    showResultsModal();
}

// Download functionality
function downloadReport() {
    const modalContent = document.querySelector('.modal-content');
    const downloadBtn = document.getElementById('downloadReportBtn');
    
    downloadBtn.disabled = true;

    setTimeout(() => {
        html2canvas(modalContent, {
            scale: 2,
            useCORS: true,
            logging: false,
            allowTaint: true
        }).then(function(canvas) {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            const titleElement = document.getElementById('modal-report-target');
            const fileName = titleElement.textContent.replace(/[^a-zA-Z0-9]/g, '_') || 'FairFight_Report';
            link.download = `${fileName}.png`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            downloadBtn.disabled = false;
        }).catch(error => {
            console.error('Error generating image:', error);
            alert('Failed to generate image. Please try again.');
            downloadBtn.disabled = false;
        });
    }, 100);
}

// Attach event listeners
document.addEventListener('DOMContentLoaded', () => {
    const fetchButton = document.getElementById('fetchFairFight');
    const downloadButton = document.getElementById('downloadReportBtn');
    const factionIdInput = document.getElementById('factionId');

    const urlParams = new URLSearchParams(window.location.search);
    const factionIdFromUrl = urlParams.get('faction_id');
    if (factionIdFromUrl) {
        factionIdInput.value = factionIdFromUrl;
    }

    if (fetchButton) {
        fetchButton.addEventListener('click', generateFairFightReport);
    }
    if (downloadButton) {
        downloadButton.addEventListener('click', downloadReport);
    }
});