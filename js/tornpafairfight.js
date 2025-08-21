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

// Function to get the currently logged-in user's info (Torn ID and total stats)
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
        
        const resultsMap = new Map();
        apiResponse.forEach(result => {
            if (result.player_id) {
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
        
        return playerIds.map(id => resultsMap.get(id.toString()) || { no_data: true });

    } catch (error) {
        console.error("Error fetching Fair Fight data:", error);
        return playerIds.map(id => ({ error: true, message: `Could not fetch FF data: ${error.message}` }));
    }
}

// Fair Fight styling logic
function getFairFightColor(value) {
    let r, g, b;
    if (value <= 1.25) {
        r = 0x28; g = 0x28; b = 0xc6; // Blue
    } else if (value <= 2.5) {
        const t = (value - 1.25) / 1.25;
        r = 0x28; g = Math.round(0x28 + (0xc6 - 0x28) * t); b = Math.round(0xc6 - (0xc6 - 0x28) * t);
    } else if (value <= 4) {
        const t = (value - 2.5) / 1.5;
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

// MODIFIED: Switched back to showing numbers instead of words.
function getFFDisplayValue(ffResponse) {
    if (!ffResponse || ffResponse.no_data || typeof ffResponse.value !== 'number') {
        return "N/A";
    }
    
    // Display the score formatted to two decimal places.
    const ff = ffResponse.value.toFixed(2);
    
    // Optionally add a "?" if the data is old (e.g., more than 2 weeks)
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

    const loggedInUserInfo = await getLoggedInUserInfo();
    if (!loggedInUserInfo) {
        hideLoadingSpinner();
        return;
    }
    
    const currentUser = firebase.auth().currentUser;
    const ownerUid = '48CQkfJqz2YrXrHfmOO0y1zeci93';
    const isOwnerViewing = currentUser.uid === ownerUid;
    
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
        } else if (userIdInput) {
            const userApiUrl = `https://api.torn.com/user/${userIdInput}?selections=basic&key=${tornApiKey}`;
            const userResponse = await fetch(userApiUrl);
            const userData = await userResponse.json();
            if (userData.error) throw new Error(userData.error.error);

            reportTitle = `User: ${userData.name}`;
            playerIdsToFetch = [userIdInput];
        }

        if (playerIdsToFetch.length === 0) {
            showMainError('No members found.');
            hideLoadingSpinner();
            return;
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
            const visitorTotalStats = loggedInUserInfo.totalStats;
            finalResults = ffResultsFromApi.map(targetData => {
                if (targetData.error || targetData.no_data || !targetData.bs_estimate || visitorTotalStats <= 0 || targetData.bs_estimate <= 0) {
                    return targetData;
                }
                
                // The definitive data-driven formula
                let finalScore = 3.5 * Math.pow(3, Math.log10(targetData.bs_estimate / visitorTotalStats));

                // Apply a "floor" for very easy targets, mimicking the real API's behavior
                if (finalScore < 1.03) {
                    finalScore = 1.03;
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

function toggleLandscapeBlocker() {
    // This condition is now more robust, checking for landscape orientation on most mobile devices including tablets
    const isMobileLandscape = window.matchMedia("(max-width: 1280px) and (orientation: landscape)").matches;
    let blocker = document.getElementById('landscape-blocker');

    // This block is for pages other than the one you are on now
    const mainContent = document.getElementById('mainHomepageContent');
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');

    if (isMobileLandscape) {
        // Only create the blocker if it doesn't already exist
        if (!blocker) {
            blocker = document.createElement('div');
            blocker.id = 'landscape-blocker';
            blocker.innerHTML = `
                <h2>Please Rotate Your Device</h2>
                <p>For the best experience, please use this page in portrait mode.</p>
            `;
            // Apply all the necessary styles directly with JavaScript
            Object.assign(blocker.style, {
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                backgroundColor: '#222',
                color: '#eee',
                textAlign: 'center',
                padding: '20px',
                zIndex: '99999'
            });
            document.body.appendChild(blocker);
        }

        // Hide main page content
        document.body.style.overflow = 'hidden';
        if (header) header.style.display = 'none';
        if (mainContent) mainContent.style.display = 'none';
        if (footer) footer.style.display = 'none';

    } else {
        // Remove the blocker if it exists
        if (blocker) {
            blocker.remove();
        }

        // Re-show main page content
        document.body.style.overflow = '';
        if (header) header.style.display = ''; // Reverts to stylesheet's display
        if (mainContent) mainContent.style.display = ''; // Reverts to stylesheet's display
        
        const footer = document.querySelector('footer');
        if (footer) footer.style.display = 'block'; // Explicitly set to 'block'
    }
}
// Run the function on page load and window resize
window.addEventListener('load', toggleLandscapeBlocker);
window.addEventListener('resize', toggleLandscapeBlocker);

function toggleLandscapeBlocker() {
    const isMobileLandscape = window.matchMedia("(max-width: 1280px) and (orientation: landscape)").matches;
    let blocker = document.getElementById('landscape-blocker');

    if (isMobileLandscape) {
        // If the blocker doesn't exist, create and show it.
        if (!blocker) {
            blocker = document.createElement('div');
            blocker.id = 'landscape-blocker';
            blocker.innerHTML = `
                <div style="transform: rotate(0deg); font-size: 50px; margin-bottom: 20px;">📱</div>
                <h2 style="color: #00a8ff;">Please Rotate Your Device</h2>
                <p>This page is best viewed in portrait mode.</p>
            `;
            // These styles will make it cover the entire screen.
            Object.assign(blocker.style, {
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100vw',  // Use viewport width
                height: '100vh', // Use viewport height
                backgroundColor: '#1c1c1c', // A solid, dark color
                color: '#eee',
                textAlign: 'center',
                zIndex: '99999' // A very high number to ensure it's on top of everything
            });
            document.body.appendChild(blocker);
        }
        // Also, prevent the page from scrolling underneath the blocker.
        document.body.style.overflow = 'hidden';

    } else {
        // If we are in portrait, remove the blocker if it exists.
        if (blocker) {
            blocker.remove();
        }
        // And restore the ability to scroll the page.
        document.body.style.overflow = '';
    }
}

// Run the function when the page first loads and whenever it's resized.
window.addEventListener('load', toggleLandscapeBlocker);
window.addEventListener('resize', toggleLandscapeBlocker);