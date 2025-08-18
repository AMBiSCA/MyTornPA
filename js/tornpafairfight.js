// Function to check if Firebase is initialized
function isFirebaseInitialized() {
    return typeof firebase !== 'undefined' && firebase.app;
}

// Function to fetch the user's Torn API key and faction role from Firebase
async function getUserProfileData(user) {
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
            return {
                tornApiKey: tornApiKey,
                factionRole: userData.factionRole || null,
                discordWebhookUrl: userData.discordWebhookUrl || null
            };
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

        // Combine new and old data
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
    if (!ffResponse || ffResponse.no_data) return "N/A";
    const ff = ffResponse.value.toFixed(2);
    const now = Date.now() / 1000;
    const age = now - ffResponse.last_updated;
    const suffix = age > (14 * 24 * 60 * 60) ? "?" : "";
    return `${ff}${suffix}`;
}

function getFFDisplayColor(ffResponse) {
    if (!ffResponse || ffResponse.no_data) return { background: '#444', text: 'white' };
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

function showDiscordSettingsModal() {
    const overlay = document.getElementById('discordSettingsModal');
    if (overlay) overlay.classList.add('visible');
}

function closeDiscordSettingsModal() {
    const overlay = document.getElementById('discordSettingsModal');
    if (overlay) overlay.classList.remove('visible');
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

    let currentUser = null;
    if (isFirebaseInitialized() && firebase.auth().currentUser) {
        currentUser = firebase.auth().currentUser;
    }
    const userProfileData = await getUserProfileData(currentUser);
    if (!userProfileData) {
        hideLoadingSpinner();
        return;
    }
    const tornApiKey = userProfileData.tornApiKey;

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
        let apiResponse;
        if (factionIdInput) {
            const factionApiUrl = `https://api.torn.com/faction/${factionIdInput}?selections=basic&key=${tornApiKey}`;
            const factionResponse = await fetch(factionApiUrl);
            apiResponse = await factionResponse.json();
            if (apiResponse.members) {
                Object.entries(apiResponse.members).forEach(([id, member]) => {
                    userNames.set(id, member.name);
                });
            }
        } else {
            const userApiUrl = `https://api.torn.com/user/${userIdInput}?selections=basic&key=${tornApiKey}`;
            const userResponse = await fetch(userApiUrl);
            apiResponse = await userResponse.json();
            userNames.set(userIdInput, apiResponse.name);
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
    
    tableBody.innerHTML = '';
    
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

        if (results.length === 1) {
            const statsCell = row.insertCell();
            statsCell.textContent = fairFightData && fairFightData.bs_estimate_human ? fairFightData.bs_estimate_human : 'N/A';
        }
    });

    showResultsModal();
}

// Function to save webhook URL to Firebase
async function saveWebhookUrlToFirebase() {
    const webhookUrl = document.getElementById('webhookUrlInput').value.trim();
    if (!webhookUrl) {
        alert('Please enter a valid webhook URL.');
        return;
    }
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) {
        alert('You must be signed in to save settings.');
        return;
    }

    try {
        await firebase.firestore().collection('userProfiles').doc(currentUser.uid).update({
            discordWebhookUrl: webhookUrl
        });
        alert('Webhook URL saved successfully!');
        closeDiscordSettingsModal();
    } catch (error) {
        console.error("Error saving webhook URL:", error);
        alert(`Failed to save URL: ${error.message}`);
    }
}

// Function to send the report to Discord via webhook
async function sendDiscordReport() {
    const factionIdInput = document.getElementById('factionId').value.trim();
    if (!factionIdInput) {
        alert('Please generate a faction report first before sending to Discord.');
        return;
    }

    const currentUser = firebase.auth().currentUser;
    const userProfileData = await getUserProfileData(currentUser);
    if (!userProfileData || !userProfileData.discordWebhookUrl) {
        alert('Please save your Discord webhook URL in the settings first.');
        return;
    }

    const webhookUrl = userProfileData.discordWebhookUrl;
    
    // Get the data from the Fair Fight Report modal
    const factionName = document.getElementById('modal-report-target').textContent.replace('Faction: ', '');
    const tableBody = document.getElementById('modal-results-table-body');
    const rows = tableBody.querySelectorAll('tr');

    if (rows.length === 0) {
        alert('No data to send. Please generate a report first.');
        return;
    }

    const fields = [];
    rows.forEach(row => {
        const name = row.cells[0].textContent;
        const ffScore = row.cells[2].textContent;
        const lastUpdated = row.cells[3].textContent;
        fields.push({
            name: `${name}`,
            value: `Fair Fight: **${ffScore}** | Last Update: ${lastUpdated}`,
            inline: false
        });
    });

    const payload = {
        embeds: [{
            title: `TornPDA's Faction Fair Fight Report`,
            description: `A new Fair Fight report has been generated for **${factionName}**.`,
            color: 3447003, // A nice blue color for Discord embeds
            fields: fields,
            footer: {
                text: "Generated by TornPDA's Fair Fight Tool"
            },
            timestamp: new Date()
        }]
    };

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        if (response.ok) {
            alert('Fair Fight report sent to Discord successfully!');
        } else {
            const errorText = await response.text();
            throw new Error(`Discord API returned an error: ${response.status} ${response.statusText} - ${errorText}`);
        }
    } catch (error) {
        console.error("Error sending Discord webhook:", error);
        alert(`Failed to send Discord message: ${error.message}`);
    }
}

// Download functionality from your example
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
    const discordSettingsButton = document.getElementById('showDiscordSettings');
    const webhookSaveButton = document.getElementById('saveWebhookBtn');
    const factionIdInput = document.getElementById('factionId');
    const sendToDiscordButton = document.getElementById('sendToDiscordBtn'); // NEW: Send to Discord button

    // Auto-fill faction ID from URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const factionIdFromUrl = urlParams.get('faction_id');
    if (factionIdFromUrl) {
        factionIdInput.value = factionIdFromUrl;
    }

    // Check for user login status and leadership role
    if (isFirebaseInitialized() && firebase.auth()) {
        firebase.auth().onAuthStateChanged(async function(user) {
            const discordButton = document.getElementById('showDiscordSettings');
            const sendDiscordButton = document.getElementById('sendToDiscordBtn');
            if (user) {
                const userProfile = await getUserProfileData(user);
                if (userProfile && (userProfile.factionRole === 'Leader' || userProfile.factionRole === 'Co-Leader')) {
                    discordButton.style.display = 'inline-flex';
                    discordButton.onclick = showDiscordSettingsModal;
                    sendDiscordButton.style.display = 'inline-flex';
                    sendDiscordButton.onclick = sendDiscordReport;
                } else {
                    discordButton.style.display = 'none';
                    sendDiscordButton.style.display = 'none';
                }
            } else {
                discordButton.style.display = 'none';
                sendDiscordButton.style.display = 'none';
            }
        });
    }

    if (fetchButton) {
        fetchButton.addEventListener('click', generateFairFightReport);
    }
    if (downloadButton) {
        downloadButton.addEventListener('click', downloadReport);
    }
    if (webhookSaveButton) {
        webhookSaveButton.addEventListener('click', saveWebhookUrlToFirebase);
    }
});