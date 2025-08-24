const db = firebase.firestore();
const auth = firebase.auth();

let userApiKey = null;
let factionApiFullData = null;
let currentTornUserName = 'Unknown';
let apiCallCounter = 0; // Counter for API call intervals
let globalYourFactionID = null; // This will store your faction ID
let globalEnemyFactionID = null; // Used to store the enemy ID for periodic fetches
let currentLiveChainSeconds = 0; // Stores the remaining chain timeout for local countdown
let lastChainApiFetchTime = 0; // Stores the timestamp of the last chain API fetch
let globalChainStartedTimestamp = 0; // Stores the actual chain start time from API
let globalChainCurrentNumber = 'N/A'; // Stores the actual chain number from API
let enemyDataGlobal = null; // Stores enemy faction data globally for access by other functions (e.g., Chain Score)
let globalRankedWarData = null;
let globalWarStartedActualTime = 0; // NEW: Stores the war start timestamp for live relative update
let unsubscribeFromChat = null;
let profileFetchQueue = []; // Queue for processing profile image fetches
let isProcessingQueue = false; // Flag to indicate if the queue is currently being processed
let lastEmojiIndex = -1; // To keep track of the last emoji used
let lastDisplayedTargetIDs = []; // Stores IDs of the targets shown in the previous display (e.g., ['123', '456'])
let consecutiveSameTargetsCount = 0; // Counts how many times 'lastDisplayedTargetIDs' has been displayed consecutively
let isChatMuted = localStorage.getItem('isChatMuted') === 'true'; // Global mute state, loads from local storage
let scrollUpIndicatorEl = null;
let currentSelectedPrivateChatId = null; // Keeps track of the chat ID for sending messages
let claimedTargets = new Set(); // This will remember the claimed target IDs
let userEnergyDisplay = null;
let onlineFriendlyMembersDisplay = null;
let onlineEnemyMembersDisplay = null;
let globalActiveClaims = {};
let localCurrentClaimHitCounter = 0; // This will track the sequential hit number within the app
let chatMessagesCollection = null; // We will set this dynamically based on the user's faction
let orientationOverlay = null;

// --- DOM Element Getters ---
const tabButtons = document.querySelectorAll('.tab-button');
const gamePlanDisplay = document.getElementById('gamePlanDisplay');
const warEnlistedStatus = document.getElementById('warEnlistedStatus');
const warTermedStatus = document.getElementById('warTermedStatus');
const warTermedWinLoss = document.getElementById('warTermedWinLoss');
const warChainingStatus = document.getElementById('warChainingStatus');
const toggleEnlisted = document.getElementById('toggleEnlisted');
const toggleTermedWar = document.getElementById('toggleTermedWar');
const toggleTermedWinLoss = document.getElementById('toggleTermedWinLoss');
const toggleChaining = document.getElementById('toggleChaining');
const toggleNoFlying = document.getElementById('toggleNoFlying');
const toggleTurtleMode = document.getElementById('toggleTurtleMode');
const nextChainTimeInput = document.getElementById('nextChainTimeInput');
const enemyFactionIDInput = document.getElementById('enemyFactionIDInputLeaderConfig');
const saveWarStatusControlsBtn = document.getElementById('saveWarStatusControlsBtn');
const designatedAdminsContainer = document.getElementById('designatedAdminsContainer');
const bigHitterWatchlistContainer = document.getElementById('bigHitterWatchlistContainer');
const energyTrackingContainer = document.getElementById('energyTrackingContainer');
const saveAdminsBtn = document.getElementById('saveAdminSelectionsBtn');
const saveEnergyTrackMembersBtn = document.getElementById('saveEnergyTrackMembersBtn');
const saveSelectionsBtnBH = document.getElementById('saveWatchlistSelectionsBtn');
const currentTeamLeadDisplay = document.getElementById('warCurrentTeamLeadStatus');
const currentTeamLeadInput = document.getElementById('currentTeamLeadInput');
const REMOVAL_DELAY_MS = 500;
const memberProfileCache = {};
const FETCH_DELAY_MS = 500;
const factionAnnouncementsDisplay = document.getElementById('factionAnnouncementsDisplay');
const factionWarHubTitleEl = document.getElementById('factionWarHubTitle');
const gamePlanEditArea = document.getElementById('gamePlanEditArea');
const saveGamePlanBtn = document.getElementById('saveGamePlanBtn');
const quickAnnouncementInput = document.getElementById('quickAnnouncementInput');
const postAnnouncementBtn = document.getElementById('postAnnouncementBtn');
const warNoFlyingStatus = document.getElementById('warNoFlyingStatus');
const warTurtleStatus = document.getElementById('warTurtleStatus');
const warNextChainTimeStatus = document.getElementById('warNextChainTimeStatus');
const clearAllWarDataBtn = document.getElementById('clearAllWarDataBtn');


function countFactionMembers(membersObject) {
    if (!membersObject) return 0;
    return typeof membersObject.total === 'number' ? membersObject.total : Object.keys(membersObject).length;
}

async function handleImageUpload(fileInput, displayElement, labelElement, type) {
    if (!labelElement) {
        console.error("The label element was not provided to handleImageUpload.");
        return;
    }
    
    const originalLabelHTML = labelElement.innerHTML;
    labelElement.innerHTML = 'Uploading...';

    const file = fileInput.files[0];
    const MAX_FILE_SIZE_MB = 2;
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

    if (!file || !file.type.startsWith('image/')) {
        showCustomAlert("Please select a valid image file.", "Invalid File Type");
        labelElement.innerHTML = originalLabelHTML;
        return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
        showCustomAlert(`The selected image is too large. Please upload an image smaller than ${MAX_FILE_SIZE_MB}MB.`, "File Too Large");
        fileInput.value = '';
        labelElement.innerHTML = originalLabelHTML;
        return;
    }

    displayElement.innerHTML = `<p>Uploading image, please wait...</p>`;
    const storageRef = firebase.storage().ref();
    const filePath = `war_images/${type}_${globalYourFactionID}.jpg`;
    const fileRef = storageRef.child(filePath);

    try {
        const snapshot = await fileRef.put(file);
        const downloadURL = await snapshot.ref.getDownloadURL();
        console.log('File successfully uploaded. URL:', downloadURL);

        const dataToSave = {};
        if (type === 'gamePlan') {
            dataToSave.gamePlanImageUrl = downloadURL;
            dataToSave.gamePlan = "";
        } else if (type === 'announcement') {
            dataToSave.announcementsImageUrl = downloadURL;
            dataToSave.quickAnnouncement = "";
        }

        await db.collection('factionWars').doc('currentWar').set(dataToSave, { merge: true });

        displayElement.innerHTML = '';
        const img = document.createElement('img');
        img.src = downloadURL;
        displayElement.appendChild(img);
        
        labelElement.innerHTML = 'Uploaded! ✅';

    } catch (error) {
        console.error("Error uploading image:", error);
        displayElement.innerHTML = `<p style="color: red;">Error uploading image. See console.</p>`;
        showCustomAlert("An error occurred while uploading the image.", "Upload Failed");
        labelElement.innerHTML = 'Error! ❌';
    } finally {
        setTimeout(() => {
            labelElement.innerHTML = originalLabelHTML;
        }, 2000);
    }
}

function showCustomConfirm(message, title = "Confirm") {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        const alertBox = document.createElement('div');
        const titleEl = document.createElement('h4');
        const messageEl = document.createElement('p');
        const buttonWrapper = document.createElement('div');
        const yesBtn = document.createElement('button');
        const noBtn = document.createElement('button');

        Object.assign(overlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex',
            justifyContent: 'center', alignItems: 'center', zIndex: '2000',
            backdropFilter: 'blur(5px)'
        });
        Object.assign(alertBox.style, {
            background: '#1e2a38', padding: '25px 30px', borderRadius: '8px',
            border: '1px solid #4a6a8a', boxShadow: '0 5px 20px rgba(0, 0, 0, 0.6)',
            textAlign: 'center', width: '90%', maxWidth: '450px', color: '#ecf0f1'
        });
        Object.assign(titleEl.style, {
            margin: '0 0 15px 0', color: '#e0a71a', fontSize: '1.4em', fontWeight: '600'
        });
        Object.assign(messageEl.style, {
            margin: '0 0 25px 0', fontSize: '1.1em', lineHeight: '1.6', whiteSpace: 'pre-wrap'
        });
        Object.assign(buttonWrapper.style, {
            display: 'flex', justifyContent: 'center', gap: '15px'
        });
        Object.assign(yesBtn.style, {
            backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px',
            padding: '10px 25px', fontSize: '1em', cursor: 'pointer', fontWeight: 'bold'
        });
        Object.assign(noBtn.style, {
            backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px',
            padding: '10px 25px', fontSize: '1em', cursor: 'pointer', fontWeight: 'bold'
        });

        titleEl.textContent = title;
        messageEl.textContent = message;
        yesBtn.textContent = 'Yes, Clear It';
        noBtn.textContent = 'No, Cancel';

        const closeModal = (resolution) => {
            document.body.removeChild(overlay);
            resolve(resolution);
        };

        yesBtn.onclick = () => closeModal(true);
        noBtn.onclick = () => closeModal(false);
        overlay.onclick = (event) => {
            if (event.target === overlay) closeModal(false);
        };

        buttonWrapper.appendChild(noBtn);
        buttonWrapper.appendChild(yesBtn);
        alertBox.appendChild(titleEl);
        alertBox.appendChild(messageEl);
        alertBox.appendChild(buttonWrapper);
        overlay.appendChild(alertBox);
        document.body.appendChild(overlay);
    });
}

function showCustomAlert(message, title = "Alert") {
    const overlay = document.createElement('div');
    const alertBox = document.createElement('div');
    const titleEl = document.createElement('h4');
    const messageEl = document.createElement('p');
    const closeBtn = document.createElement('button');

    Object.assign(overlay.style, {
        position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex',
        justifyContent: 'center', alignItems: 'center', zIndex: '2000',
        backdropFilter: 'blur(5px)'
    });
    Object.assign(alertBox.style, {
        background: '#1e2a38', padding: '25px 30px', borderRadius: '8px',
        border: '1px solid #4a6a8a', boxShadow: '0 5px 20px rgba(0, 0, 0, 0.6)',
        textAlign: 'center', width: '90%', maxWidth: '450px', color: '#ecf0f1'
    });
    Object.assign(titleEl.style, {
        margin: '0 0 15px 0', color: '#3498db', fontSize: '1.4em', fontWeight: '600'
    });
    Object.assign(messageEl.style, {
        margin: '0 0 25px 0', fontSize: '1.1em', lineHeight: '1.6'
    });
    Object.assign(closeBtn.style, {
        backgroundColor: '#3498db', color: 'white', border: 'none',
        borderRadius: '5px', padding: '10px 20px', fontSize: '1em',
        cursor: 'pointer', transition: 'background-color 0.2s ease'
    });
    closeBtn.onmouseover = () => { closeBtn.style.backgroundColor = '#2980b9'; };
    closeBtn.onmouseout = () => { closeBtn.style.backgroundColor = '#3498db'; };

    titleEl.textContent = title;
    messageEl.textContent = message;
    closeBtn.textContent = 'OK';

    const closeModal = () => {
        document.body.removeChild(overlay);
    };
    closeBtn.onclick = closeModal;
    overlay.onclick = (event) => {
        if (event.target === overlay) {
            closeModal();
        }
    };

    alertBox.appendChild(titleEl);
    alertBox.appendChild(messageEl);
    alertBox.appendChild(closeBtn);
    overlay.appendChild(alertBox);
    document.body.appendChild(overlay);
}

function populateFriendlyMemberCheckboxes(members, savedAdmins = [], savedEnergyMembers = []) {
    if (!members || typeof members !== 'object') return;
    if (designatedAdminsContainer) designatedAdminsContainer.innerHTML = '';
    else { console.error("HTML Error: Cannot find element with ID 'designatedAdminsContainer'."); return; }
    if (energyTrackingContainer) energyTrackingContainer.innerHTML = '';
    else { console.error("HTML Error: Cannot find element with ID 'energyTrackingContainer'."); return; }

    const membersArray = Array.isArray(members) ? members : Object.values(members);
    membersArray.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    membersArray.forEach(member => {
        const memberId = member.id;
        if (!memberId) return;

        const position = member.position.toLowerCase();
        if (position === 'leader' || position === 'co-leader') {
            return;
        }

        const memberName = member.name || `Unknown (${memberId})`;
        const isAdminChecked = (savedAdmins && savedAdmins.includes(String(memberId))) ? 'checked' : '';
        const adminItemHtml = `<div class="member-selection-item"><input type="checkbox" id="admin-member-${memberId}" value="${memberId}" ${isAdminChecked}><label for="admin-member-${memberId}">${memberName}</label></div>`;
        if (designatedAdminsContainer) {
            designatedAdminsContainer.insertAdjacentHTML('beforeend', adminItemHtml);
        }

        const isEnergyChecked = (savedEnergyMembers && savedEnergyMembers.includes(String(memberId))) ? 'checked' : '';
        const energyItemHtml = `<div class="member-selection-item"><input type="checkbox" id="energy-member-${memberId}" value="${memberId}" ${isEnergyChecked}><label for="energy-member-${memberId}">${memberName}</label></div>`;
        if (energyTrackingContainer) {
            energyTrackingContainer.insertAdjacentHTML('beforeend', energyItemHtml);
        }
    });
}

function formatTime(seconds) {
    if (seconds <= 0) return 'Over';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    let result = '';
    if (h > 0) result += `${h}h `;
    if (m > 0) result += `${m}m `;
    if (s > 0) result += `${s}s`;
    return result.trim();
}

function updateUserEnergyDisplay() {
    if (!userApiKey) {
        console.warn("User API key not available for energy display.");
        const announcementEnergyEl = document.getElementById('rw-user-energy_announcement');
        if (announcementEnergyEl) announcementEnergyEl.textContent = 'Key Missing';
        return;
    }

    const API_KEY = userApiKey;
    const announcementEnergyEl = document.getElementById('rw-user-energy_announcement');

    if (announcementEnergyEl && !announcementEnergyEl.textContent.includes('/')) {
        announcementEnergyEl.textContent = 'Loading E...';
    }

    fetch(`https://api.torn.com/user/?selections=bars&key=${API_KEY}&comment=MyTornPA_Energy`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                console.error("Torn API Error:", data.error.code, data.error.error);
                if (announcementEnergyEl) announcementEnergyEl.textContent = 'API Error';
                return;
            }
            const energy = data.energy.current;
            const maxEnergy = data.energy.maximum;
            const energyFullTime = data.energy.fulltime;
            const energyString = `${energy}/${maxEnergy}`;
            const tooltipString = `Full E at: ${new Date(energyFullTime * 1000).toLocaleTimeString()} ${new Date(energyFullTime * 1000).toLocaleDateString()}`;

            if (announcementEnergyEl) {
                announcementEnergyEl.textContent = energyString;
                announcementEnergyEl.title = tooltipString;
            }
        })
        .catch(error => {
            console.error("Error fetching user energy data:", error);
            if (announcementEnergyEl) announcementEnergyEl.textContent = 'Fetch Error';
        });
}

function updateAllTimers() {
    const nowInSeconds = Math.floor(Date.now() / 1000);

    // Part 1: Updates the "Next Planned Chain Time" from the Leader Config tab
    if (warNextChainTimeStatus && nextChainTimeInput) {
        const nextChainTimeValue = nextChainTimeInput.value.trim();
        const targetChainTime = parseInt(nextChainTimeValue, 10);
        if (!isNaN(targetChainTime) && targetChainTime > 0) {
            const timeLeft = targetChainTime - nowInSeconds;
            if (timeLeft > 0) {
                warNextChainTimeStatus.textContent = formatTime(timeLeft);
            } else {
                warNextChainTimeStatus.textContent = 'Chain Live! / Time Passed';
            }
        } else {
            warNextChainTimeStatus.textContent = nextChainTimeValue || 'N/A';
        }
    }

    // Part 2: Updates the Ranked War elapsed timer on the Announcements tab
    const rankedWarTimerEl = document.getElementById('rw-war-timer_announcement');
    if (rankedWarTimerEl) {
        if (globalWarStartedActualTime > 0) {
            const timeElapsed = nowInSeconds - globalWarStartedActualTime;
            rankedWarTimerEl.textContent = formatDuration(timeElapsed);
        } else {
            rankedWarTimerEl.textContent = '0:00:00:00';
        }
    }
}

function updateRankedWarDisplay(rankedWarData, yourFactionId) {
    const container = document.getElementById('announcementScoreboardContainer');
    if (!container) return;

    const yourFactionNameEl = container.querySelector('#rw-faction-one-name_announcement');
    const opponentFactionNameEl = container.querySelector('#rw-faction-two-name_announcement');
    const leadValueEl = container.querySelector('#rw-lead-value_announcement');
    const progressOneEl = container.querySelector('#rw-progress-one_announcement');
    const progressTwoEl = container.querySelector('#rw-progress-two_announcement');

    if (rankedWarData) {
        const yourFactionInfo = rankedWarData.factions?.find(f => String(f.id) === String(yourFactionId));
        const opponentFactionInfo = rankedWarData.factions?.find(f => String(f.id) !== String(yourFactionId));

        if (yourFactionInfo && opponentFactionInfo) {
            if (yourFactionNameEl) yourFactionNameEl.textContent = yourFactionInfo.name;
            if (opponentFactionNameEl) opponentFactionNameEl.textContent = opponentFactionInfo.name;

            const leadAmount = Math.abs(yourFactionInfo.score - opponentFactionInfo.score);
            const targetScore = rankedWarData.target;
            if (leadValueEl) leadValueEl.textContent = `${leadAmount.toLocaleString()} / ${targetScore.toLocaleString()}`;

            const totalScore = yourFactionInfo.score + opponentFactionInfo.score;
            let yourFactionProgress = (totalScore > 0) ? (yourFactionInfo.score / totalScore) * 100 : 50;
            if (progressOneEl) progressOneEl.style.width = `${yourFactionProgress}%`;
            if (progressTwoEl) progressTwoEl.style.width = `${100 - yourFactionProgress}%`;

            globalWarStartedActualTime = rankedWarData.start || 0;
        }
    } else {
        if (yourFactionNameEl) yourFactionNameEl.textContent = 'Your Faction';
        if (opponentFactionNameEl) opponentFactionNameEl.textContent = 'Opponent';
        if (leadValueEl) leadValueEl.textContent = '0 / 0';
        if (progressOneEl) progressOneEl.style.width = '50%';
        if (progressTwoEl) progressTwoEl.style.width = '50%';
        globalWarStartedActualTime = 0;
    }
}

async function fetchAndDisplayEnemyFaction(factionID, apiKey) {
    if (!factionID || !apiKey) return;
    const opponentNameEl = document.getElementById('rw-faction-two-name_announcement');
    try {
        const enemyApiUrl = `https://api.torn.com/v2/faction/${factionID}?selections=basic,members&key=${apiKey}&comment=MyTornPA_EnemyFaction`;
        const response = await fetch(enemyApiUrl);
        if (!response.ok) {
            throw new Error(`Server responded with an error: ${response.status} ${response.statusText}`);
        }
        const enemyData = await response.json();
        if (enemyData.error) {
            throw new Error(`Torn API Error: ${JSON.stringify(enemyData.error.error)}`);
        }
        if (opponentNameEl) {
            opponentNameEl.textContent = enemyData.basic.name || 'Opponent';
        }
        const warDoc = await db.collection('factionWars').doc('currentWar').get();
        const warData = warDoc.exists ? warDoc.data() : {};
        const savedWatchlistMembers = warData.bigHitterWatchlist || [];
        if (enemyData.members) {
            populateEnemyMemberCheckboxes(enemyData.members, savedWatchlistMembers);
        } else {
            populateEnemyMemberCheckboxes({}, []);
        }
    } catch (error) {
        console.error('Error fetching enemy faction data:', error);
        if (opponentNameEl) {
            opponentNameEl.textContent = 'Invalid Enemy ID';
        }
        populateEnemyMemberCheckboxes({}, []);
    }
}

function formatTornTime(timestamp) {
    const date = new Date(timestamp * 1000);
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

function populateEnemyMemberCheckboxes(enemyMembers, savedWatchlistMembers = []) {
    if (!bigHitterWatchlistContainer) {
        console.error("HTML Error: Cannot find element with ID 'bigHitterWatchlistContainer'.");
        return;
    }
    bigHitterWatchlistContainer.innerHTML = '';
    if (!enemyMembers || typeof enemyMembers !== 'object' || Object.keys(enemyMembers).length === 0) {
        bigHitterWatchlistContainer.innerHTML = '<div class="member-selection-item">No enemy members available</div>';
        return;
    }
    const sortedEnemyMemberIds = Object.keys(enemyMembers).sort((a, b) => {
        const nameA = enemyMembers[a].name || '';
        const nameB = enemyMembers[b].name || '';
        return nameA.localeCompare(nameB);
    });
    sortedEnemyMemberIds.forEach(memberId => {
        const member = enemyMembers[memberId];
        const memberName = member.name || `Unknown (${memberId})`;
        const isWatchlistChecked = (savedWatchlistMembers && savedWatchlistMembers.includes(memberId)) ? 'checked' : '';
        const itemHtml = `<div class="member-selection-item"><input type="checkbox" id="enemy-member-${memberId}" value="${memberId}" ${isWatchlistChecked}><label for="enemy-member-${memberId}">${memberName}</label></div>`;
        bigHitterWatchlistContainer.insertAdjacentHTML('beforeend', itemHtml);
    });
}

function populateWarStatusDisplay(warData = {}) {
    if (warEnlistedStatus) warEnlistedStatus.textContent = warData.toggleEnlisted ? 'Yes' : 'No';
    if (warTermedStatus) warTermedStatus.textContent = warData.toggleTermedWar ? 'Yes' : 'No';
    if (warTermedWinLoss) warTermedWinLoss.textContent = warData.toggleTermedWinLoss ? 'Win' : 'Loss';
    if (warChainingStatus) warChainingStatus.textContent = warData.toggleChaining ? 'Yes' : 'No';
    if (warNoFlyingStatus) warNoFlyingStatus.textContent = warData.toggleNoFlying ? 'Yes' : 'No';
    if (warTurtleStatus) warTurtleStatus.textContent = warData.toggleTurtleMode ? 'Yes' : 'No';
    if (warNextChainTimeStatus) warNextChainTimeStatus.textContent = warData.nextChainTimeInput || 'N/A';
    if (currentTeamLeadDisplay) currentTeamLeadDisplay.textContent = warData.currentTeamLead || 'N/A';
}

function loadWarStatusForEdit(warData = {}) {
    if (toggleEnlisted) toggleEnlisted.checked = warData.toggleEnlisted || false;
    if (toggleTermedWar) toggleTermedWar.checked = warData.toggleTermedWar || false;
    if (toggleTermedWinLoss) toggleTermedWinLoss.checked = warData.toggleTermedWinLoss || false;
    if (toggleChaining) toggleChaining.checked = warData.toggleChaining || false;
    if (toggleNoFlying) toggleNoFlying.checked = warData.toggleNoFlying || false;
    if (toggleTurtleMode) toggleTurtleMode.checked = warData.toggleTurtleMode || false;
    if (nextChainTimeInput) nextChainTimeInput.value = warData.nextChainTimeInput || '';
    if (currentTeamLeadInput) currentTeamLeadInput.value = warData.currentTeamLead || '';
    if (enemyFactionIDInput) enemyFactionIDInput.value = warData.enemyFactionID || '';
}

function formatDuration(seconds) {
    if (seconds < 0) seconds = 0;
    const days = Math.floor(seconds / 86400);
    seconds %= 86400;
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const paddedHours = String(hours).padStart(2, '0');
    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSecs = String(secs).padStart(2, '0');
    return `${days}:${paddedHours}:${paddedMinutes}:${paddedSecs}`;
}

function populateUiComponents(warData, apiKey) {
    if (factionApiFullData) {
        if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = `${factionApiFullData.basic.name || "Your Faction"}'s War Hub.`;
        if (factionApiFullData.members) {
            populateFriendlyMemberCheckboxes(
                factionApiFullData.members,
                warData.tab4Admins || [],
                warData.energyTrackingMembers || []
            );
        }
    }
    if (gamePlanDisplay) {
        gamePlanDisplay.textContent = warData.gamePlan || 'No game plan available.';
    }
    if (factionAnnouncementsDisplay) {
        if (warData.announcementsImageUrl) {
            factionAnnouncementsDisplay.innerHTML = `<img src="${warData.announcementsImageUrl}" alt="Faction Announcement">`;
        } else {
            factionAnnouncementsDisplay.textContent = warData.quickAnnouncement || 'No current announcements.';
        }
    }
    if (gamePlanEditArea) {
        gamePlanEditArea.value = warData.gamePlan || '';
    }
    populateWarStatusDisplay(warData);
    loadWarStatusForEdit(warData);
    
    let determinedEnemyFactionID = null;
    if (factionApiFullData && factionApiFullData.wars && factionApiFullData.wars.ranked) {
        const yourFactionId = factionApiFullData.basic.id;
        const opponentFactionInfo = factionApiFullData.wars.ranked.factions.find(f => String(f.id) !== String(yourFactionId));
        if (opponentFactionInfo) {
            determinedEnemyFactionID = opponentFactionInfo.id;
        }
    }
    globalEnemyFactionID = determinedEnemyFactionID || warData.enemyFactionID || null;

    if (globalEnemyFactionID) {
        fetchAndDisplayEnemyFaction(globalEnemyFactionID, apiKey);
    } else {
        const opponentNameEl = document.getElementById('rw-faction-two-name_announcement');
        if (opponentNameEl) opponentNameEl.textContent = 'No Enemy Set';
        populateEnemyMemberCheckboxes({}, []);
    }
}

function showTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) selectedTab.classList.add('active');
    const selectedButton = document.querySelector(`.tab-button[data-tab="${tabId.replace('-tab', '')}"]`);
    if (selectedButton) selectedButton.classList.add('active');
}

async function initializeAndLoadData(apiKey, factionIdToUseOverride = null) {
    let finalFactionId = factionIdToUseOverride;
    if (!finalFactionId && auth.currentUser) {
        try {
            const userProfileDoc = await db.collection('userProfiles').doc(auth.currentUser.uid).get();
            if (userProfileDoc.exists) {
                finalFactionId = userProfileDoc.data().faction_id;
            }
        } catch (error) {
            console.error("Error fetching faction ID from user profile:", error);
        }
    }
    globalYourFactionID = finalFactionId;
    if (!finalFactionId) {
        if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = "ERROR: Faction ID not found.";
        return;
    }

    try {
        const userFactionApiUrl = `https://api.torn.com/v2/faction/${finalFactionId}?selections=basic,members,wars&key=${apiKey}&comment=MyTornPA_WarHub_Combined`;
        const userFactionResponse = await fetch(userFactionApiUrl);
        if (!userFactionResponse.ok) throw new Error(`Torn API HTTP Error: ${userFactionResponse.status}`);
        factionApiFullData = await userFactionResponse.json();
        if (factionApiFullData.error) throw new Error(`Torn API Error: ${factionApiFullData.error.error}`);
        
        updateRankedWarDisplay(factionApiFullData.wars?.ranked, finalFactionId);
        
        const warDoc = await db.collection('factionWars').doc('currentWar').get();
        const warData = warDoc.exists ? warDoc.data() : {};
        populateUiComponents(warData, apiKey);

    } catch (error) {
        console.error("Error in initializeAndLoadData:", error);
        if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = `Error Loading War Hub Data.`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const requestedTabName = urlParams.get('view');
    
    // THIS IS THE CORRECTED TAB NAVIGATION LISTENER
    tabButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            const targetTabDataset = event.currentTarget.dataset.tab;
            const targetTabId = targetTabDataset + '-tab';
            
            if (targetTabDataset === 'leader-config') {
                const userIsAdmin = await checkIfUserIsAdmin(); // Assuming checkIfUserIsAdmin exists
                if (!userIsAdmin) {
                    showCustomAlert("You do not have permission to view leadership settings.", "Access Denied");
                    return;
                }
            }
            showTab(targetTabId);
        });
    });

    if (requestedTabName) {
        showTab(requestedTabName + '-tab');
    } else {
        showTab('announcements-tab');
    }

    let listenersInitialized = false;

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userProfileRef = db.collection('userProfiles').doc(user.uid);
            const doc = await userProfileRef.get();
            const userData = doc.exists ? doc.data() : {};
            const apiKey = userData.tornApiKey || null;
            userApiKey = apiKey;
            currentTornUserName = userData.preferredName || 'Unknown';

            if (apiKey) {
                await initializeAndLoadData(apiKey, userData.faction_id);
                updateUserEnergyDisplay();
                if (!listenersInitialized) {
                    
                    setInterval(updateAllTimers, 1000);
                    setInterval(updateUserEnergyDisplay, 60000);
                    setInterval(() => {
                        if (userApiKey && globalYourFactionID) {
                            initializeAndLoadData(userApiKey, globalYourFactionID);
                        }
                    }, 300000);

                    listenersInitialized = true;
                }
            } else {
                console.warn("API key not found.");
            }
        } else {
            userApiKey = null;
            listenersInitialized = false;
            console.log("User not logged in.");
            if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = "Faction War Hub. (Please Login)";
            // Clear UI on logout
            populateWarStatusDisplay({});
            loadWarStatusForEdit({});
        }
    });

    // Event Listeners for Save buttons etc.
    // Ensure functions like checkIfUserIsAdmin, save buttons, etc., are defined.
});