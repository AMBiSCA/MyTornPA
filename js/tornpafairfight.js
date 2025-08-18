// Function to check if Firebase is initialized
function isFirebaseInitialized() {
    return typeof firebase !== 'undefined' && firebase.app;
}

// Function to fetch the user's Torn API key from Firebase
async function getTornApiKey(user) {
    if (!user || !isFirebaseInitialized()) {
        showMainError('Authentication error: Not signed in or Firebase not ready.');
        return null;
    }
    try {
        const userDocRef = firebase.firestore().collection('userProfiles').doc(user.uid);
        const userDoc = await userDocRef.get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            const tornApiKey = userData.tornApiKey;
            if (!tornApiKey) {
                showMainError('Your Torn API Key is not set in your profile. Please update your profile settings.');
                return null;
            }
            return tornApiKey;
        } else {
            showMainError('User profile not found in database. Please ensure your profile is set up.');
            return null;
        }
    } catch (error) {
        showMainError(`Error fetching API Key: ${error.message}`);
        return null;
    }
}

// Fair Fight logic rewritten from the FF Scouter V2 script
const FF_SCOUTER_API_URL = "https://ffscouter.com/api/v1/get-stats";
const ONE_HOUR = 60 * 60 * 1000; // This constant is no longer used but can be kept for future reference

// REMOVED getFairFightFromCache function
// REMOVED saveFairFightToCache function

// MODIFIED: This function no longer uses caching.
async function fetchFairFightData(playerIds, apiKey) {
    if (playerIds.length === 0) {
        return [];
    }

    const url = `${FF_SCOUTER_API_URL}?key=${apiKey}&targets=${playerIds.join(",")}`;

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

        // The API might not return results in the same order or might miss some.
        // We need to map the results back to the original playerIds array.
        const resultsMap = new Map();
        apiResponse.forEach(result => {
            if (result.player_id) {
                // Format the result to match the structure the display functions expect.
                const formattedResult = {
                    value: result.fair_fight,
                    last_updated: result.last_updated,
                    bs_estimate: result.bs_estimate,
                    bs_estimate_human: result.bs_estimate_human,
                    no_data: result.fair_fight === null
                };
                resultsMap.set(result.player_id.toString(), formattedResult);
            }
        });

        // Map the results back to the original player order, providing a default for any missing players.
        return playerIds.map(id => resultsMap.get(id.toString()) || { no_data: true });

    } catch (error) {
        console.error("Error fetching Fair Fight data:", error);
        // If the fetch fails completely, return an array of error objects.
        return playerIds.map(id => ({ error: true, message: `Could not fetch FF data: ${error.message}` }));
    }
}


// Fair Fight styling logic
function getFairFightColor(value) {
    let r, g, b;
    if (value <= 1) {
        r = 0x28; g = 0x28; b = 0xc6; // Blue
    } else if (value <= 3) {
        const t = (value - 1) / 2;
        r = 0x28; g = Math.round(0x28 + (0xc6 - 0x28) * t); b = Math.round(0xc6 - (0xc6 - 0x28) * t);
    } else if (value <= 5) {
        const t = (value - 3) / 2;
        r = Math.round(0x28 + (0xc6 - 0x28) * t); g = Math.round(0xc6 - (0xc6 - 0x28) * t); b = 0x28;
    } else {
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

function getFFDisplayValue(ffResponse) {
    if (!ffResponse || ffResponse.no_data || ffResponse.value === null) return "N/A";
    const ff = ffResponse.value.toFixed(2);
    const now = Date.now() / 1000;
    const age = now - ffResponse.last_updated;
    const suffix = age > (14 * 24 * 60 * 60) ? "?" : "";
    return `${ff}${suffix}`;
}

function getFFDisplayColor(ffResponse) {
    if (!ffResponse || ffResponse.no_data || ffResponse.value === null) return { background: '#444', text: 'white' };
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

    let reportTitle = "";
    let playerIdsToFetch = [];
    showLoadingSpinner();

    // Determine API key and user info
    let currentUser = null;
    if (isFirebaseInitialized() && firebase.auth().currentUser) {
        currentUser = firebase.auth().currentUser;
    }
    const tornApiKey = await getTornApiKey(currentUser);
    if (!tornApiKey) {
        hideLoadingSpinner();
        return;
    }

    try {
        if (factionIdInput) {
            // Faction search
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
            // Single user search
            const userApiUrl = `https://api.torn.com/user/${userIdInput}?selections=basic&key=${tornApiKey}`;
            const userResponse = await fetch(userApiUrl);
            const userData = await userResponse.json();
            if (userData.error) throw new Error(userData.error.error);

            reportTitle = `User: ${userData.name}`;
            playerIdsToFetch = [userIdInput];
        }

        const ffResults = await fetchFairFightData(playerIdsToFetch, tornApiKey);
        if (!ffResults || ffResults.length === 0) {
            showMainError('No fair fight data found.');
            hideLoadingSpinner();
            return;
        }

        // Fetch names for all players
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

        // Sort results alphabetically by name
        const sortedResults = ffResults.map((ffData, index) => {
            const userId = playerIdsToFetch[index];
            return { userId, ffData, name: userNames.get(userId) || `User ${userId}` };
        }).sort((a, b) => a.name.localeCompare(b.name));

        displayReport(sortedResults, reportTitle);

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
    const modalTitle = document.querySelector('#resultsModalOverlay .modal-title');
    const reportTarget = document.getElementById('modal-report-target');
    const memberCount = document.getElementById('modal-member-count');

    // Clear previous data
    tableBody.innerHTML = '';
    
    // Update headers based on if it's a single user or faction
    if (results.length > 1) {
        tableHeader.innerHTML = '<tr><th>Name</th><th>User ID</th><th>Fair Fight</th><th>Last Updated</th></tr>';
    } else {
        tableHeader.innerHTML = '<tr><th>Name</th><th>User ID</th><th>Fair Fight</th><th>Last Updated</th><th>Est. Stats</th></tr>';
    }

    reportTarget.textContent = title;
    memberCount.textContent = results.length > 1 ? `Members: ${results.length}` : '';
    
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

        // Only add Est. Stats for a single user report
        if (results.length === 1) {
            const statsCell = row.insertCell();
            statsCell.textContent = fairFightData && fairFightData.bs_estimate_human ? fairFightData.bs_estimate_human : 'N/A';
        }
    });

    showResultsModal();
}

// Download functionality from your example
function downloadReport() {
    const modalContent = document.querySelector('.modal-content');
    const downloadBtn = document.getElementById('downloadReportBtn');
    
    // Disable button to prevent double clicks during screenshot
    downloadBtn.disabled = true;

    // Use a slight delay to ensure the modal is fully rendered before capturing
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
            
            // Re-enable the button after download attempt
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

    // Auto-fill faction ID from URL query parameter
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