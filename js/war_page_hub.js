

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

// --- DOM Element Getters (keep existing, add new if needed for other parts) ---
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
const enemyTargetsContainer = document.getElementById('enemyTargetsContainer');
const designatedAdminsContainer = document.getElementById('designatedAdminsContainer');
const bigHitterWatchlistContainer = document.getElementById('bigHitterWatchlistContainer');
const energyTrackingContainer = document.getElementById('energyTrackingContainer');
const saveAdminsBtn = document.getElementById('saveAdminSelectionsBtn');
const saveEnergyTrackMembersBtn = document.getElementById('saveEnergyTrackMembersBtn');
const saveSelectionsBtnBH = document.getElementById('saveSelectionsBtnBH');
const chainTimerDisplay = document.getElementById('chainTimerDisplay');
const currentChainNumberDisplay = document.getElementById('currentChainNumberDisplay');
const chainStartedDisplay = document.getElementById('chainStartedDisplay');
const yourFactionRankedScore = document.getElementById('yourFactionRankedScore');
const opponentFactionRankedScore = document.getElementById('opponentFactionRankedScore');
const warTargetScore = document.getElementById('warTargetScore');
const warStartedTime = document.getElementById('warStartedTime');
const yourFactionNameScoreLabel = document.getElementById('yourFactionNameScoreLabel');
const opponentFactionNameScoreLabel = document.getElementById('opponentFactionNameScoreLabel');
const currentTeamLeadDisplay = document.getElementById('warCurrentTeamLeadStatus');
const currentTeamLeadInput = document.getElementById('currentTeamLeadInput'); 
const REMOVAL_DELAY_MS = 500;
const memberProfileCache = {};
const FETCH_DELAY_MS = 500;
const chatTabsContainer = document.querySelector('.chat-tabs-container');
const chatTabButtons = document.querySelectorAll('.chat-tab');
const chatInputArea = document.querySelector('.chat-input-area');
const warChatDisplayArea = document.getElementById('warChatDisplayArea');
const privateChatDisplayArea = document.getElementById('privateChatDisplayArea');
const factionMembersDisplayArea = document.getElementById('factionMembersDisplayArea');
const recentlyMetDisplayArea = document.getElementById('recentlyMetDisplayArea');
const blockedPeopleDisplayArea = document.getElementById('blockedPeopleDisplayArea');
const settingsDisplayArea = document.getElementById('settingsDisplayArea');
const TARGET_EMOJIS = ['🎯', '❌', '📍', '☠️', '⚔️', '⚠️', '⛔', '🚩', '💢', '💥'];
const factionAnnouncementsDisplay = document.getElementById('factionAnnouncementsDisplay');
const factionWarHubTitleEl = document.getElementById('factionWarHubTitle');
const factionOneNameEl = document.getElementById('factionOneName');
const factionOneMembersEl = document.getElementById('factionOneMembers');
const factionTwoNameEl = document.getElementById('factionTwoName');
const factionTwoMembersEl = document.getElementById('factionTwoMembers');
const gamePlanEditArea = document.getElementById('gamePlanEditArea');
const saveGamePlanBtn = document.getElementById('saveGamePlanBtn');
const quickAnnouncementInput = document.getElementById('quickAnnouncementInput');
const postAnnouncementBtn = document.getElementById('postAnnouncementBtn');
const warNoFlyingStatus = document.getElementById('warNoFlyingStatus');
const warTurtleStatus = document.getElementById('warTurtleStatus');
const warNextChainTimeStatus = document.getElementById('warNextChainTimeStatus');
const tabContentContainer = document.querySelector('.tab-content-container');
const discordWebhookUnifiedControl = document.getElementById('discordWebhookUnifiedControl'); // The new main clickable div
const discordWebhookStatusText = document.getElementById('discordWebhookStatusText'); // The span inside it
const discordWebhookUrlInput = document.getElementById('discordWebhookUrlInput');
const saveDiscordWebhookBtn = document.getElementById('saveDiscordWebhookBtn');
const cancelDiscordWebhookBtn = document.getElementById('cancelDiscordWebhookBtn');
const removeDiscordWebhookBtn = document.getElementById('removeDiscordWebhookBtn'); // NEW: Remove button
const discordWebhookEditArea = document.getElementById('discordWebhookEditArea'); // The modal's content box
const discordWebhookModalOverlay = document.getElementById('discordWebhookModalOverlay'); // NEW: The full-screen overlay
const clearAllWarDataBtn = document.getElementById('clearAllWarDataBtn');




function countFactionMembers(membersObject) {
    if (!membersObject) return 0;
    return typeof membersObject.total === 'number' ? membersObject.total : Object.keys(membersObject).length;
}

async function processProfileFetchQueue() {
    if (isProcessingQueue || profileFetchQueue.length === 0) {
        return; // Already processing or nothing in queue
    }

    isProcessingQueue = true;
    while (profileFetchQueue.length > 0) {
        const { memberId, apiKey, itemElement } = profileFetchQueue.shift();

        // Check cache before fetching
        if (memberProfileCache[memberId] && memberProfileCache[memberId].profile_image) {
            console.log(`[Cache Hit] Profile for ${memberId} already in cache.`);
            updateMemberItemDisplay(itemElement, memberProfileCache[memberId].profile_image);
            continue; // Skip fetch, move to next item
        }

        try {
            const apiUrl = `https://api.torn.com/user/${memberId}?selections=profile&key=${apiKey}&comment=MyTornPA_MemberProfilePic`;
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (!response.ok || data.error) {
                console.error(`Error fetching profile for member ${memberId}:`, data.error?.error || response.statusText);
                updateMemberItemDisplay(itemElement, '../../images/default_profile_icon.png'); // Show default on error
            } else {
                const profileImage = data.profile_image || '../../images/default_profile_icon.png';
                memberProfileCache[memberId] = { profile_image: profileImage, name: data.name }; // Cache the result
                updateMemberItemDisplay(itemElement, profileImage);
            }
        } catch (error) {
            console.error(`Network error fetching profile for member ${memberId}:`, error);
            updateMemberItemDisplay(itemElement, '../../images/default_profile_icon.png'); // Show default on network error
        }

        // Introduce delay before the next fetch, unless it's the last one
        if (profileFetchQueue.length > 0) {
            await new Promise(resolve => setTimeout(resolve, FETCH_DELAY_MS));
        }
    }
    isProcessingQueue = false;
    console.log("Profile fetch queue finished processing.");
}

function formatBattleStats(num) {
    if (isNaN(num) || num === 0) return '0';
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'b';
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'm';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toLocaleString();
}

async function handleImageUpload(fileInput, displayElement, labelElement, type) {
    // Safety check to make sure the button/label element was passed correctly
    if (!labelElement) {
        console.error("The label element was not provided to handleImageUpload.");
        return;
    }
    
    const originalLabelHTML = labelElement.innerHTML;
    labelElement.innerHTML = 'Uploading...'; // Change button text

    const file = fileInput.files[0];
    const MAX_FILE_SIZE_MB = 2;
    const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

    if (!file || !file.type.startsWith('image/')) {
        showCustomAlert("Please select a valid image file.", "Invalid File Type");
        labelElement.innerHTML = originalLabelHTML; // Revert button text on error
        return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
        showCustomAlert(`The selected image is too large. Please upload an image smaller than ${MAX_FILE_SIZE_MB}MB.`, "File Too Large");
        fileInput.value = '';
        labelElement.innerHTML = originalLabelHTML; // Revert button text on error
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
        
        labelElement.innerHTML = 'Uploaded! ✅'; // Show success on button

    } catch (error) {
        console.error("Error uploading image:", error);
        displayElement.innerHTML = `<p style="color: red;">Error uploading image. See console.</p>`;
        showCustomAlert("An error occurred while uploading the image.", "Upload Failed");
        labelElement.innerHTML = 'Error! ❌'; // Show error on button
    } finally {
        // After 2 seconds, revert the button text
        setTimeout(() => {
            labelElement.innerHTML = originalLabelHTML;
        }, 2000);
    }
}

async function sendClaimChatMessage(claimerName, targetName, chainNumber, customMessage = null) {
    if (!chatMessagesCollection || !auth.currentUser) {
        console.warn("Cannot send claim/unclaim message: Firebase collection or user not available.");
        return;
    }

    let messageText;
    if (customMessage) {
        messageText = customMessage; // Use the provided custom message
    } else {
        // Default message for a 'claim' action
        messageText = `📢 ${claimerName} has claimed ${targetName} as hit #${chainNumber}!`;
    }
    
    const filteredMessage = typeof filterProfanity === 'function' ? filterProfanity(messageText) : messageText;

    const messageObj = {
        senderId: auth.currentUser.uid,
        sender: "Chain Alert:", // --- CHANGED SENDER PREFIX HERE ---
        text: filteredMessage,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        type: 'claim_notification'
    };

    try {
        await chatMessagesCollection.add(messageObj);
        console.log("Claim/Unclaim message sent to Firebase:", messageObj);

        // Display locally immediately without waiting for Firebase listener
        displayChatMessage(messageObj); 

    } catch (error) {
        console.error("Error sending claim/unclaim message to Firebase:", error);
    }
}

function autoUnclaimHitTargets() {
    console.log("Running autoUnclaimHitTargets check (chain progression-based)...");
    if (!globalActiveClaims || Object.keys(globalActiveClaims).length === 0) {
        console.log("No active claims to check for auto-unclaim.");
        return;
    }
    if (!enemyDataGlobal || !enemyDataGlobal.members) {
        console.warn("Enemy data not available for auto-unclaim check.");
        return;
    }
    if (!auth.currentUser) {
        console.warn("User not logged in. Cannot auto-unclaim targets.");
        return;
    }

    const membersInCurrentEnemyData = Object.values(enemyDataGlobal.members);
    const currentEnemyMemberIds = new Set(membersInCurrentEnemyData.map(m => String(m.id)));

    for (const memberId in globalActiveClaims) {
        if (globalActiveClaims.hasOwnProperty(memberId)) {
            const activeClaim = globalActiveClaims[memberId]; // The current claim from Firebase

            // --- Condition 1: Auto-unclaim if target has disappeared from enemy data ---
            if (!currentEnemyMemberIds.has(memberId)) {
                console.warn(`Claimed target ${memberId} not found in current enemy data (might have disappeared). Auto-unclaiming.`);
                unclaimTarget(memberId); // Unclaim if the target is no longer in the enemy list
                continue; // Move to the next claim
            }

            // --- Condition 2: Auto-unclaim if the chain has progressed past this claimed hit number ---
            // This is the NEW logic you requested.
            // Check if localCurrentClaimHitCounter (which represents the faction's current chain status)
            // is greater than or equal to the hit number this target was claimed for.
            if (localCurrentClaimHitCounter >= activeClaim.chainHitNumber && activeClaim.chainHitNumber > 0) {
                const claimedMemberData = membersInCurrentEnemyData.find(m => String(m.id) === String(memberId));
                const memberName = claimedMemberData ? claimedMemberData.name : 'Unknown Target';
                console.log(`Auto-unclaiming ${memberName} (${memberId}). Chain (${localCurrentClaimHitCounter}) has surpassed claimed hit (${activeClaim.chainHitNumber}).`);
                unclaimTarget(memberId); // Call the unclaim function for this target
            } else {
                const claimedMemberData = membersInCurrentEnemyData.find(m => String(m.id) === String(memberId));
                const memberName = claimedMemberData ? claimedMemberData.name : 'Unknown Target';
                console.log(`Claimed target ${memberName} (${memberId}) is still active. Chain: ${localCurrentClaimHitCounter}, Claimed for: ${activeClaim.chainHitNumber}.`);
            }
        }
    }
}

function displayChatMessage(message) {
    // This is the ID from your new chat system's HTML for the war chat
    const displayArea = document.getElementById('war-chat-display-area'); 
    
    if (!displayArea) {
        console.error("Fatal Error: Could not find the war chat display area with ID 'war-chat-display-area'.");
        return;
    }

    const messageDiv = document.createElement('div');
    messageDiv.classList.add('chat-message', 'system-notification'); // Add classes for styling

    // Format the message content
    // Note: The 'sender' is "Chain Alert:" from your other function
    messageDiv.innerHTML = `<strong>${message.sender}</strong> ${message.text}`;
    
    // Add the new message to the chat display
    displayArea.appendChild(messageDiv);

    // Automatically scroll to the bottom to see the latest message
    displayArea.scrollTop = displayArea.scrollHeight;
}

function areTargetSetsIdentical(set1, set2) {
    if (set1.length !== set2.length) {
        return false;
    }
    if (set1.length === 0) { // Both empty sets are identical
        return true;
    }
    const sortedSet1 = [...set1].sort();
    const sortedSet2 = [...set2].sort();
    for (let i = 0; i < sortedSet1.length; i++) {
        if (sortedSet1[i] !== sortedSet2[i]) {
            return false;
        }
    }
    return true;
}

function createStatusBoxHtml(label, id) {
    return `
        <div class="ops-control-item ops-status-display">
            <label>${label}:</label>
            <span id="${id}" class="status-value-box">N/A</span>
        </div>
    `;
}

function isOnlineWithin59Seconds(relativeTimeStr) {
    if (relativeTimeStr === "Now") {
        return true;
    }
    const match = relativeTimeStr.match(/(\d+) second(?:s)? ago/);
    if (match) {
        const seconds = parseInt(match[1], 10);
        return seconds <= 59;
    }
    return false; // Not online within 59 seconds
}

async function updateOnlineMemberCounts() {
    // Friendly Faction Online Members
    if (onlineFriendlyMembersDisplay && factionApiFullData && factionApiFullData.members) {
        let onlineCount = 0;
        const membersArray = Object.values(factionApiFullData.members); // Assuming it's an object with IDs as keys here
        // If factionApiFullData.members is already an array, use:
        // const membersArray = factionApiFullData.members;

        for (const member of membersArray) {
            if (member.last_action && isOnlineWithin59Seconds(member.last_action.relative)) {
                onlineCount++;
            }
        }
        onlineFriendlyMembersDisplay.textContent = `${onlineCount}/${membersArray.length}`;
    } else if (onlineFriendlyMembersDisplay) {
        onlineFriendlyMembersDisplay.textContent = 'N/A';
    }

    // Enemy Faction Online Members
    if (onlineEnemyMembersDisplay && enemyDataGlobal && enemyDataGlobal.members) {
        let onlineCount = 0;
        const membersArray = Object.values(enemyDataGlobal.members); // Assuming it's an object with IDs as keys here
        // If enemyDataGlobal.members is already an array, use:
        // const membersArray = enemyDataGlobal.members;

        for (const member of membersArray) {
            if (member.last_action && isOnlineWithin59Seconds(member.last_action.relative)) {
                onlineCount++;
            }
        }
        onlineEnemyMembersDisplay.textContent = `${onlineCount}/${membersArray.length}`;
    } else if (onlineEnemyMembersDisplay) {
        onlineEnemyMembersDisplay.textContent = 'N/A';
    }
}

function showCustomConfirm(message, title = "Confirm") {
    // This returns a Promise, which lets us use 'await' to wait for the user's choice
    return new Promise((resolve) => {
        // --- Create Elements ---
        const overlay = document.createElement('div');
        const alertBox = document.createElement('div');
        const titleEl = document.createElement('h4');
        const messageEl = document.createElement('p');
        const buttonWrapper = document.createElement('div');
        const yesBtn = document.createElement('button');
        const noBtn = document.createElement('button');

        // --- Apply Styles (CSS-in-JS) ---
        // Ensure these styles match your existing design or are adapted as needed
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

        //--- Set Content ---
        titleEl.textContent = title;
        messageEl.textContent = message;
        yesBtn.textContent = 'Yes, Clear It'; // This text can be customized if needed
        noBtn.textContent = 'No, Cancel'; // This text can be customized if needed

        //--- Event Handlers ---
        const closeModal = (resolution) => {
            document.body.removeChild(overlay);
            resolve(resolution); // Resolves the promise with true or false
        };

        yesBtn.onclick = () => closeModal(true);
        noBtn.onclick = () => closeModal(false);
        overlay.onclick = (event) => {
            if (event.target === overlay) closeModal(false); // Close if clicking on the overlay background
        };

        //--- Assemble and Append to DOM ---
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
    //--- Create Elements ---
    const overlay = document.createElement('div');
    const alertBox = document.createElement('div');
    const titleEl = document.createElement('h4');
    const messageEl = document.createElement('p');
    const closeBtn = document.createElement('button');

    //--- Apply Styles (CSS-in-JS) ---
    Object.assign(overlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: '2000',
        backdropFilter: 'blur(5px)'
    });

    Object.assign(alertBox.style, {
        background: '#1e2a38',
        padding: '25px 30px',
        borderRadius: '8px',
        border: '1px solid #4a6a8a',
        boxShadow: '0 5px 20px rgba(0, 0, 0, 0.6)',
        textAlign: 'center',
        width: '90%',
        maxWidth: '450px',
        color: '#ecf0f1'
    });

    Object.assign(titleEl.style, {
        margin: '0 0 15px 0',
        color: '#3498db',
        fontSize: '1.4em',
        fontWeight: '600'
    });

    Object.assign(messageEl.style, {
        margin: '0 0 25px 0',
        fontSize: '1.1em',
        lineHeight: '1.6'
    });
    
    // Style the button to look like your ".action-btn"
    Object.assign(closeBtn.style, {
        backgroundColor: '#3498db',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        padding: '10px 20px',
        fontSize: '1em',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease'
    });
    
    // Add a hover effect for the button
    closeBtn.onmouseover = () => { closeBtn.style.backgroundColor = '#2980b9'; };
    closeBtn.onmouseout = () => { closeBtn.style.backgroundColor = '#3498db'; };

    //--- Set Content ---
    titleEl.textContent = title;
    messageEl.textContent = message;
    closeBtn.textContent = 'OK';

    //--- Add Event Listeners for Cleanup ---
    const closeModal = () => {
        document.body.removeChild(overlay);
    };

    closeBtn.onclick = closeModal;
    overlay.onclick = (event) => {
        if (event.target === overlay) { // Only close if clicking the dark background
            closeModal();
        }
    };

    //--- Assemble and Append to DOM ---
    alertBox.appendChild(titleEl);
    alertBox.appendChild(messageEl);
    alertBox.appendChild(closeBtn);
    overlay.appendChild(alertBox);
    document.body.appendChild(overlay);
}

// NEW/MODIFIED: Function to populate friendly faction member checkboxes (Admins, Energy Track)
function populateFriendlyMemberCheckboxes(members, savedAdmins = [], savedEnergyMembers = []) {
    if (!members || typeof members !== 'object') return;

    if (designatedAdminsContainer) designatedAdminsContainer.innerHTML = '';
    else { console.error("HTML Error: Cannot find element with ID 'designatedAdminsContainer'."); return; }

    if (energyTrackingContainer) energyTrackingContainer.innerHTML = '';
    else { console.error("HTML Error: Cannot find element with ID 'energyTrackingContainer'."); return; }

    // --- NEW: Handle both Array and Object formats for the members data ---
    const membersArray = Array.isArray(members) ? members : Object.values(members);

    // Sort the array of members alphabetically by name
    membersArray.sort((a, b) => {
        const nameA = a.name || '';
        const nameB = b.name || '';
        return nameA.localeCompare(nameB);
    });

    membersArray.forEach(member => { // Iterate over the member objects directly
        const memberId = member.id; // Get the REAL ID from the member object
        if (!memberId) return; // Skip if a member object has no ID

        const position = member.position.toLowerCase();
        if (position === 'leader' || position === 'co-leader') {
            return; // Continue to skip leader/co-leader
        }

        const memberName = member.name || `Unknown (${memberId})`;

        // Use the correct memberId for the value and id attributes
        const isAdminChecked = (savedAdmins && savedAdmins.includes(String(memberId))) ? 'checked' : '';
        const adminItemHtml = `<div class="member-selection-item"><input type="checkbox" id="admin-member-${memberId}" value="${memberId}" ${isAdminChecked}><label for="admin-member-${memberId}">${memberName}</label></div>`;
        if (designatedAdminsContainer) {
            designatedAdminsContainer.insertAdjacentHTML('beforeend', adminItemHtml);
        }

        // Use the correct memberId for the value and id attributes
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

async function resetAllAvailability() {
    if (!globalYourFactionID) {
        console.error("Cannot reset availability: Global faction ID is not set.");
        showCustomAlert("Cannot reset availability: Your faction ID is unknown. Please ensure you are logged in and your faction data is loaded.", "Reset Failed");
        throw new Error("Faction ID missing.");
    }

    const availabilityCollectionRef = db.collection('factionWars').doc('currentWar').collection('availability');

    try {
        // Get all documents in the 'availability' subcollection
        const snapshot = await availabilityCollectionRef.get();

        if (snapshot.empty) {
            console.log("No availability records found to reset.");
            showCustomAlert("No availability records found to reset.", "Reset Complete");
            return;
        }

        const deletePromises = [];
        snapshot.forEach(doc => {
            // Add each document deletion promise to the array
            deletePromises.push(availabilityCollectionRef.doc(doc.id).delete());
        });

        // Wait for all deletion operations to complete
        await Promise.all(deletePromises);

        console.log(`Successfully reset ${snapshot.size} availability records.`);
        showCustomAlert("All availability data has been successfully reset!", "Reset Complete");

        // After resetting, re-display the roster to show it's cleared
        await displayWarRoster();

    } catch (error) {
        console.error("Error resetting all availability data:", error);
        showCustomAlert(`Failed to reset all availability data: ${error.message}`, "Reset Failed");
        throw error; // Re-throw to be caught by the calling event listener's try/catch
    }
}

function updateUserEnergyDisplay() {
    if (!userApiKey) {
        console.warn("User API key not available for energy display.");
        const activeOpsEnergyEl = document.getElementById('rw-user-energy');
        const announcementEnergyEl = document.getElementById('rw-user-energy_announcement');
        if (activeOpsEnergyEl) activeOpsEnergyEl.textContent = 'Key Missing';
        if (announcementEnergyEl) announcementEnergyEl.textContent = 'Key Missing';
        return;
    }

    const API_KEY = userApiKey;
    const activeOpsEnergyEl = document.getElementById('rw-user-energy');
    const announcementEnergyEl = document.getElementById('rw-user-energy_announcement');

    // --- THIS IS THE FIX ---
    // Only show "Loading" if a value isn't already displayed
    if (activeOpsEnergyEl && !activeOpsEnergyEl.textContent.includes('/')) {
        activeOpsEnergyEl.textContent = 'Loading E...';
    }
    if (announcementEnergyEl && !announcementEnergyEl.textContent.includes('/')) {
        announcementEnergyEl.textContent = 'Loading E...';
    }
    // --- END OF FIX ---

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
                if (activeOpsEnergyEl) activeOpsEnergyEl.textContent = 'API Error';
                if (announcementEnergyEl) announcementEnergyEl.textContent = 'API Error';
                return;
            }

            const energy = data.energy.current;
            const maxEnergy = data.energy.maximum;
            const energyFullTime = data.energy.fulltime;
            const energyString = `${energy}/${maxEnergy}`;
            const tooltipString = `Full E at: ${new Date(energyFullTime * 1000).toLocaleTimeString()} ${new Date(energyFullTime * 1000).toLocaleDateString()}`;

            if (activeOpsEnergyEl) {
                activeOpsEnergyEl.textContent = energyString;
                activeOpsEnergyEl.title = tooltipString;
            }
            if (announcementEnergyEl) {
                announcementEnergyEl.textContent = energyString;
                announcementEnergyEl.title = tooltipString;
            }
        })
        .catch(error => {
            console.error("Error fetching user energy data:", error);
            if (activeOpsEnergyEl) activeOpsEnergyEl.textContent = 'Fetch Error';
            if (announcementEnergyEl) announcementEnergyEl.textContent = 'Fetch Error';
        });
}

async function fetchAndDisplayRankedWarScores(warsData, yourFactionId) {
    console.log("Calling fetchAndDisplayRankedWarScores with received data.");

    // Selectors for the ORIGINAL scoreboard (Active Ops tab)
    const yourFactionRankedScoreEl = document.getElementById('yourFactionRankedScore');
    const opponentFactionRankedScoreEl = document.getElementById('opponentFactionRankedScore');
    const warTargetScoreEl = document.getElementById('warTargetScore');
    const warStartedTimeEl = document.getElementById('warStartedTime');
    const yourFactionNameScoreLabelEl = document.getElementById('yourFactionNameScoreLabel');
    const opponentFactionNameScoreLabelEl = document.getElementById('opponentFactionNameScoreLabel');
    const progressOneEl = document.getElementById('rw-progress-one');
    const progressTwoEl = document.getElementById('rw-progress-two');
    const rwLeadValueEl = document.getElementById('rw-lead-value');
    const rwFactionOneNameEl = document.getElementById('rw-faction-one-name');
    const rwFactionTwoNameEl = document.getElementById('rw-faction-two-name');


    // Selectors for the DUPLICATED scoreboard (Announcements tab)
    const yourFactionRankedScoreAnnouncementEl = document.getElementById('yourFactionRankedScore_announcement');
    const opponentFactionRankedScoreAnnouncementEl = document.getElementById('opponentFactionRankedScore_announcement');
    const warTargetScoreAnnouncementEl = document.getElementById('warTargetScore_announcement');
    const warStartedTimeAnnouncementEl = document.getElementById('warStartedTime_announcement');
    const yourFactionNameScoreLabelAnnouncementEl = document.getElementById('yourFactionNameScoreLabel_announcement');
    const opponentFactionNameScoreLabelAnnouncementEl = document.getElementById('opponentFactionNameScoreLabel_announcement');
    // Note: The duplicated scoreboard in HTML doesn't currently have progress bars or lead value IDs with _announcement.
    // If you want those to update, their IDs would also need _announcement and corresponding elements here.
    // For now, I'll update the text labels and scores that were duplicated.


    // Function to update a set of scoreboard elements
    const updateScoreboardElements = (
        yourScoreEl, opponentScoreEl, targetScoreEl, warTimeEl,
        yourNameLabelEl, opponentNameLabelEl,
        progressOneBar = null, progressTwoBar = null, leadValueEl = null,
        rwFactionOneName = null, rwFactionTwoName = null,
        rankedWarInfo, yourFactionId
    ) => {
        if (!rankedWarInfo) {
            if (yourScoreEl) yourScoreEl.textContent = 'N/A';
            if (opponentScoreEl) opponentScoreEl.textContent = 'N/A';
            if (targetScoreEl) targetScoreEl.textContent = 'N/A';
            if (warTimeEl) warTimeEl.textContent = 'No Active War';
            if (yourNameLabelEl) yourNameLabelEl.textContent = 'Your Faction:';
            if (opponentNameLabelEl) opponentNameLabelEl.textContent = 'Vs. Opponent:';
            if (progressOneBar) progressOneBar.style.width = '50%';
            if (progressTwoBar) progressTwoBar.style.width = '50%';
            if (leadValueEl) leadValueEl.textContent = '0 / 0';
            if (rwFactionOneName) rwFactionOneName.textContent = 'Your Faction';
            if (rwFactionTwoName) rwFactionTwoName.textContent = 'Opponent';
            return;
        }

        const yourFactionInfo = rankedWarInfo.factions.find(f => String(f.id) === String(yourFactionId));
        const opponentFactionInfo = rankedWarInfo.factions.find(f => String(f.id) !== String(yourFactionId));

        if (yourFactionInfo && opponentFactionInfo) {
            if (yourScoreEl) yourScoreEl.textContent = yourFactionInfo.score.toLocaleString();
            if (opponentScoreEl) opponentScoreEl.textContent = opponentFactionInfo.score.toLocaleString();
            if (targetScoreEl) targetScoreEl.textContent = rankedWarInfo.target ? rankedWarInfo.target.toLocaleString() : 'N/A';

            if (yourNameLabelEl) yourNameLabelEl.textContent = `${yourFactionInfo.name}:`;
            if (opponentNameLabelEl) opponentNameLabelEl.textContent = `Vs. ${opponentFactionInfo.name}:`;

            // Update Progress Bar
            if (progressOneBar && progressTwoBar) {
                const totalScore = yourFactionInfo.score + opponentFactionInfo.score;
                let yourFactionProgress = 50; // Default to 50/50 if scores are 0
                if (totalScore > 0) {
                    yourFactionProgress = (yourFactionInfo.score / totalScore) * 100;
                }
                const opponentFactionProgress = 100 - yourFactionProgress;
                progressOneBar.style.width = `${yourFactionProgress}%`;
                progressTwoBar.style.width = `${opponentFactionProgress}%`;
            }

            // Update Lead Value
            if (leadValueEl) {
                const leadAmount = Math.abs(yourFactionInfo.score - opponentFactionInfo.score);
                const targetScore = rankedWarInfo.target;
                leadValueEl.textContent = `${leadAmount.toLocaleString()} / ${targetScore.toLocaleString()}`;
            }

            // Update Header Faction Names
            if (rwFactionOneName) rwFactionOneName.textContent = yourFactionInfo.name;
            if (rwFactionTwoName) rwFactionTwoName.textContent = opponentFactionInfo.name;

        } else {
            // Handle case where faction info isn't found
            console.warn("Could not find your faction or opponent faction info in ranked war data.");
            if (yourScoreEl) yourScoreEl.textContent = 'N/A';
            if (opponentScoreEl) opponentScoreEl.textContent = 'N/A';
            if (targetScoreEl) targetScoreEl.textContent = 'N/A';
            if (yourNameLabelEl) yourNameLabelEl.textContent = 'Your Faction:';
            if (opponentNameLabelEl) opponentNameLabelEl.textContent = 'Vs. Opponent:';
            if (progressOneBar) progressOneBar.style.width = '50%';
            if (progressTwoBar) progressTwoBar.style.width = '50%';
            if (leadValueEl) leadValueEl.textContent = '0 / 0';
            if (rwFactionOneName) rwFactionOneName.textContent = 'Your Faction';
            if (rwFactionTwoName) rwFactionTwoName.textContent = 'Opponent';
        }

        // War Time update (applies to both if element exists)
        if (warTimeEl) {
            globalWarStartedActualTime = rankedWarInfo.start || 0; // Set global for the live timer
            warTimeEl.textContent = formatDuration(Math.max(0, Math.floor(Date.now() / 1000) - globalWarStartedActualTime));
        }
    };


    // Call the updater for the ORIGINAL scoreboard elements
    updateScoreboardElements(
        yourFactionRankedScore, opponentFactionRankedScore, warTargetScore, warStartedTime,
        yourFactionNameScoreLabel, opponentFactionNameScoreLabel,
        progressOneEl, progressTwoEl, rwLeadValueEl,
        rwFactionOneName, rwFactionTwoName,
        warsData.ranked, yourFactionId
    );

    // Call the updater for the DUPLICATED scoreboard elements
    updateScoreboardElements(
        yourFactionRankedScoreAnnouncement, opponentFactionRankedScoreAnnouncement, warTargetScoreAnnouncement, warStartedTimeAnnouncement,
        yourFactionNameScoreLabelAnnouncement, opponentFactionNameScoreLabelAnnouncement,
        null, null, null, // Progress bars and lead value were NOT duplicated in HTML yet with _announcement IDs
        null, null, // Header names were not duplicated in HTML yet with _announcement IDs
        warsData.ranked, yourFactionId
    );

    console.log("Successfully parsed and displayed ranked war data for both scoreboards.");
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

    // Part 2: Updates the timers in the enemy targets table (e.g. hospital/travel)
    if (enemyTargetsContainer) {
        const statusCells = enemyTargetsContainer.querySelectorAll('td[data-until]');
        statusCells.forEach(cell => {
            const targetTime = parseInt(cell.dataset.until, 10);
            if (!isNaN(targetTime) && targetTime > 0) {
                const timeLeft = targetTime - nowInSeconds;
                const originalDescription = cell.textContent.split('(')[0].trim();
                
                if (timeLeft > 0) {
                    cell.textContent = `${originalDescription} (${formatTime(timeLeft)})`;
                } else {
                    cell.textContent = 'Okay';
                    cell.classList.remove('status-hospital', 'status-traveling', 'status-other');
                    cell.classList.add('status-okay');
                    cell.removeAttribute('data-until');
                }
            }
        });
    }

    // Part 3: Updates "Your Chain" timer smoothly
    const friendlyTimeEl = document.getElementById('friendly-chain-time');
    if (friendlyTimeEl) {
        if (currentLiveChainSeconds > 0 && lastChainApiFetchTime > 0) {
            const elapsedTime = (Date.now() - lastChainApiFetchTime) / 1000;
            const timeLeft = Math.max(0, currentLiveChainSeconds - Math.floor(elapsedTime));
            friendlyTimeEl.textContent = formatTime(timeLeft);
        } else {
            friendlyTimeEl.textContent = 'Over';
        }
    }

    // Part 4: Updates the Ranked War elapsed timer
    const rankedWarTimerEl = document.getElementById('rw-war-timer');
    if (rankedWarTimerEl) {
        if (globalWarStartedActualTime > 0) {
            const timeElapsed = nowInSeconds - globalWarStartedActualTime;
            rankedWarTimerEl.textContent = formatDuration(timeElapsed);
        } else {
            rankedWarTimerEl.textContent = '0:00:00:00';
        }
    }
}
 // Update Chain Timer Display (smooth 1-second countdown)
 console.log('Chain countdown state:', currentLiveChainSeconds, lastChainApiFetchTime);
 if (chainTimerDisplay && currentLiveChainSeconds > 0 && lastChainApiFetchTime > 0) {
     const elapsedTimeSinceLastFetch = (Date.now() - lastChainApiFetchTime) / 1000;
     const dynamicTimeLeft = Math.max(0, currentLiveChainSeconds - Math.floor(elapsedTimeSinceLastFetch));
     chainTimerDisplay.textContent = formatTime(dynamicTimeLeft);
 } else if (chainTimerDisplay) {
     chainTimerDisplay.textContent = 'Chain Over';
 }

 // Update Chain Started Time Display
 if (chainStartedDisplay && globalChainStartedTimestamp > 0) {
     chainStartedDisplay.textContent = `Started: ${formatTornTime(globalChainStartedTimestamp)}`;
 } else if (chainStartedDisplay) {
     chainStartedDisplay.textContent = 'Started: N/A';
 }

 // NEW: Update War Started Time Display (smooth 1-second relative countdown)
 // This uses globalWarStartedActualTime set by fetchAndDisplayRankedWarScores
 if (warStartedTime && globalWarStartedActualTime > 0) {
     warStartedTime.textContent = formatRelativeTime(globalWarStartedActualTime);
 } else if (warStartedTime) {
     warStartedTime.textContent = 'N/A';
 }



  // Update Chain Timer Display (smooth 1-second countdown)
  console.log('Chain countdown state:', currentLiveChainSeconds, lastChainApiFetchTime);
  if (chainTimerDisplay && currentLiveChainSeconds > 0 && lastChainApiFetchTime > 0) {
      const elapsedTimeSinceLastFetch = (Date.now() - lastChainApiFetchTime) / 1000;
      const dynamicTimeLeft = Math.max(0, currentLiveChainSeconds - Math.floor(elapsedTimeSinceLastFetch));
      chainTimerDisplay.textContent = formatTime(dynamicTimeLeft);
  } else if (chainTimerDisplay) {
      chainTimerDisplay.textContent = 'Chain Over';
  }

  // Update Chain Started Time Display
  if (chainStartedDisplay && globalChainStartedTimestamp > 0) {
      chainStartedDisplay.textContent = `Started: ${formatTornTime(globalChainStartedTimestamp)}`;
  } else if (chainStartedDisplay) {
      chainStartedDisplay.textContent = 'Started: N/A';
  }

  // NEW: Update War Started Time Display (smooth 1-second relative countdown)
  // This uses globalWarStartedActualTime set by fetchAndDisplayRankedWarScores
  if (warStartedTime && globalWarStartedActualTime > 0) {
      warStartedTime.textContent = formatRelativeTime(globalWarStartedActualTime);
  } else if (warStartedTime) {
      warStartedTime.textContent = 'N/A';
  }

function updateAnnouncementEnergyDisplay() {
    const announcementEnergyElement = document.getElementById('rw-user-energy_announcement');

    if (announcementEnergyElement && factionApiFullData && factionApiFullData.bars && factionApiFullData.bars.energy) {
        const energyCurrent = factionApiFullData.bars.energy.current;
        const energyMaximum = factionApiFullData.bars.energy.maximum;
        announcementEnergyElement.textContent = `${energyCurrent}/${energyMaximum}`;
        announcementEnergyElement.classList.remove('status-hospital', 'status-other'); // Clean up old classes
        announcementEnergyElement.classList.add('status-okay'); // Apply a class for green color (via CSS)
        console.log("Announcement Energy Display: Updated to", `${energyCurrent}/${energyMaximum}`);
    } else if (announcementEnergyElement) {
        announcementEnergyElement.textContent = 'N/A';
        console.warn("Announcement Energy Display: factionApiFullData.bars.energy not available. Setting N/A.");
    }
}

function updateRankedWarDisplay(rankedWarData, yourFactionId) {
    console.log("Calling updateRankedWarDisplay with received data.");
    console.log("updateRankedWarDisplay: received rankedWarData:", rankedWarData);

    // Function to update a specific scoreboard instance
    const applyDataToScoreboard = (containerId, rankedData, yourFactionID) => {
        console.log(`applyDataToScoreboard: Called for ${containerId}.`);
        console.log(`applyDataToScoreboard: Data received for ${containerId}:`, rankedData);
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`applyDataToScoreboard: Scoreboard container with ID '${containerId}' NOT found.`);
            return;
        }

        // Ensure the HTML structure exists within the container.
        // We always ensure the full scoreboard structure is present here, regardless of active war.
        if (container.querySelector('.ranked-war-container') === null) {
            console.log(`applyDataToScoreboard: Re-injecting HTML structure for ${containerId}.`);
            // Re-inject the full HTML structure (this needs to be robust for dynamic content)
            container.innerHTML = `
                <div class="ranked-war-container">
                    <div class="rw-header">
                        <span id="rw-faction-one-name${containerId.includes('announcement') ? '_announcement' : ''}">Your Faction</span>
                        <span class="rw-vs">vs</span>
                        <span id="rw-faction-two-name${containerId.includes('announcement') ? '_announcement' : ''}">Opponent</span>
                    </div>
                    <div class="rw-scores-new">
                        <div class="rw-stat-box-small">
                            <div class="rw-small-label">Energy</div>
                            <div class="rw-small-value" id="rw-user-energy${containerId.includes('announcement') ? '_announcement' : ''}">N/A</div>
                        </div>
                        <div class="rw-lead-target">
                            <div class="rw-lead-label">LEAD TARGET</div>
                            <div class="rw-lead-value" id="rw-lead-value${containerId.includes('announcement') ? '_announcement' : ''}">0 / 0</div>
                        </div>
                        <div class="rw-stat-box-small">
                            <div class="rw-small-label">War Time</div>
                            <div class="rw-small-value" id="rw-war-timer${containerId.includes('announcement') ? '_announcement' : ''}">0:00:00:00</div>
                        </div>
                    </div>
                    <div class="rw-progress-bar-container">
                        <div class="rw-progress-bar-one" id="rw-progress-one${containerId.includes('announcement') ? '_announcement' : ''}" style="width: 50%;"></div>
                        <div class="rw-progress-bar-two" id="rw-progress-two${containerId.includes('announcement') ? '_announcement' : ''}" style="width: 50%;"></div>
                    </div>
                </div>
            `;
        } else {
            console.log(`applyDataToScoreboard: HTML structure already present for ${containerId}.`);
        }

        // Get references to elements within THIS specific container (after ensuring they exist)
        const yourFactionNameEl = container.querySelector(`[id^="rw-faction-one-name${containerId.includes('announcement') ? '_announcement' : ''}"]`);
        const opponentFactionNameEl = container.querySelector(`[id^="rw-faction-two-name${containerId.includes('announcement') ? '_announcement' : ''}"]`);
        const leadValueEl = container.querySelector(`[id^="rw-lead-value${containerId.includes('announcement') ? '_announcement' : ''}"]`);
        const progressOneEl = container.querySelector(`[id^="rw-progress-one${containerId.includes('announcement') ? '_announcement' : ''}"]`);
        const progressTwoEl = container.querySelector(`[id^="rw-progress-two${containerId.includes('announcement') ? '_announcement' : ''}"]`);
        const rwWarTimerEl = container.querySelector(`[id^="rw-war-timer${containerId.includes('announcement') ? '_announcement' : ''}"]`);
        const rwUserEnergyEl = container.querySelector(`[id^="rw-user-energy${containerId.includes('announcement') ? '_announcement' : ''}"]`); // CRUCIAL: Captured energy element for THIS scoreboard

        // Check if rankedData is available and not null/undefined
        if (rankedData) {
            const yourFactionInfo = rankedData.factions?.find(f => String(f.id) === String(yourFactionID));
            const opponentFactionInfo = rankedData.factions?.find(f => String(f.id) !== String(yourFactionID));

            if (yourFactionInfo && opponentFactionInfo) {
                // Update Faction Names
                if (yourFactionNameEl) yourFactionNameEl.textContent = yourFactionInfo.name;
                if (opponentFactionNameEl) opponentFactionNameEl.textContent = opponentFactionInfo.name;

                // Calculate and Update Lead Target
                const leadAmount = Math.abs(yourFactionInfo.score - opponentFactionInfo.score);
                const targetScore = rankedData.target;
                if (leadValueEl) leadValueEl.textContent = `${leadAmount.toLocaleString()} / ${targetScore.toLocaleString()}`;

                // Calculate and Update Progress Bar
                const totalScore = yourFactionInfo.score + opponentFactionInfo.score;
                let yourFactionProgress = 50; // Default to 50/50 if scores are 0
                if (totalScore > 0) {
                    yourFactionProgress = (yourFactionInfo.score / totalScore) * 100;
                }
                const opponentFactionProgress = 100 - yourFactionProgress;

                if (progressOneEl) progressOneEl.style.width = `${yourFactionProgress}%`;
                if (progressTwoEl) progressTwoEl.style.width = `${opponentFactionProgress}%`;

                // Update War Time
                globalWarStartedActualTime = rankedData.start || 0; // Ensure this is always set based on live data
                if (rwWarTimerEl) rwWarTimerEl.textContent = formatDuration(Math.max(0, Math.floor(Date.now() / 1000) - globalWarStartedActualTime));

                // Update energy display for THIS scoreboard instance
                // We'll update it from the global `factionApiFullData` or `userEnergyDisplay` if available
                if (rwUserEnergyEl) {
                    // Check if energy data is available globally
                    if (factionApiFullData && factionApiFullData.bars && factionApiFullData.bars.energy) {
                        const energy = factionApiFullData.bars.energy.current;
                        const maxEnergy = factionApiFullData.bars.energy.maximum;
                        rwUserEnergyEl.textContent = `${energy}/${maxEnergy}`;
                        rwUserEnergyEl.classList.remove('status-hospital', 'status-other'); // Clean up old colors
                        rwUserEnergyEl.classList.add('status-okay'); // Assume OK for display
                    } else if (document.getElementById('rw-user-energy')) {
                        // Fallback to the main Active Ops energy display content if available
                        rwUserEnergyEl.textContent = document.getElementById('rw-user-energy').textContent;
                        rwUserEnergyEl.className = document.getElementById('rw-user-energy').className; // Copy classes too for color
                    } else {
                        rwUserEnergyEl.textContent = 'N/A';
                    }
                }

            } else {
                // If rankedData exists but factionInfo is missing (e.g., API error for faction details)
                console.warn(`Could not find your faction or opponent faction info in ranked war data for container: ${containerId}. Displaying N/A.`);
                if (yourFactionNameEl) yourFactionNameEl.textContent = 'Your Faction';
                if (opponentFactionNameEl) opponentFactionNameEl.textContent = 'Opponent';
                if (leadValueEl) leadValueEl.textContent = 'N/A / N/A';
                if (progressOneEl) progressOneEl.style.width = '50%';
                if (progressTwoEl) progressTwoEl.style.width = '50%';
                if (rwWarTimerEl) rwWarTimerEl.textContent = 'N/A';
                if (rwUserEnergyEl) rwUserEnergyEl.textContent = 'N/A'; // Also set energy to N/A
            }
        } else {
            // If rankedData is null/undefined (no active ranked war)
            console.log(`No active ranked war data for container: ${containerId}. Populating with N/A. `);
            if (yourFactionNameEl) yourFactionNameEl.textContent = 'Your Faction';
            if (opponentFactionNameEl) opponentFactionNameEl.textContent = 'Opponent';
            if (leadValueEl) leadValueEl.textContent = '0 / 0';
            if (progressOneEl) progressOneEl.style.width = '50%';
            if (progressTwoEl) progressTwoEl.style.width = '50%';
            if (rwWarTimerEl) rwWarTimerEl.textContent = '0:00:00:00';
            if (rwUserEnergyEl) rwUserEnergyEl.textContent = 'N/A'; // Also set energy to N/A
        }
    };

    // Apply data to the scoreboard in the Active Ops tab
    // The Active Ops scoreboard ID is implicitly the tab's ID because its .ranked-war-container
    // is directly within the .ops-control-item that lives in active-ops-tab
    applyDataToScoreboard('active-ops-tab', rankedWarData, yourFactionId);

    // Apply data to the scoreboard in the Announcements tab
    applyDataToScoreboard('announcementScoreboardContainer', rankedWarData, yourFactionId);

    // This function runs to update the main user energy display in Active Ops,
    // and also ensures global factionApiFullData.bars is updated for the Announcements scoreboard to pull from.
    updateUserEnergyDisplay();

    console.log("Successfully parsed and displayed ranked war data for relevant scoreboards.");
}

async function fetchAndDisplayEnemyFaction(factionID, apiKey) {
    if (!factionID || !apiKey) return;
    try {
        const enemyApiUrl = `https://api.torn.com/v2/faction/${factionID}?selections=basic,members&key=${apiKey}&comment=MyTornPA_EnemyFaction`;
        const response = await fetch(enemyApiUrl);
        if (!response.ok) {
            throw new Error(`Server responded with an error: ${response.status} ${response.statusText}`);
        }
        enemyDataGlobal = await response.json(); // Store enemy data globally
        const enemyData = enemyDataGlobal; // Use local alias for function's internal logic
        console.log("Enemy Faction API Data:", enemyData);
        if (enemyData.error) {
            console.error('Torn API responded with a detailed error for enemy faction:', enemyData.error);
            throw new Error(`Torn API Error: ${JSON.stringify(enemyData.error.error)}`);
        }

        if (factionTwoNameEl) factionTwoNameEl.textContent = enemyData.basic.name || 'Unknown Faction';
        if (factionTwoMembersEl) factionTwoMembersEl.textContent = `Total Members: ${countFactionMembers(enemyData.members) || 'N/A'}`;

        const warDoc = await db.collection('factionWars').doc('currentWar').get();
        const warData = warDoc.exists ? warDoc.data() : {};
        const savedWatchlistMembers = warData.bigHitterWatchlist || [];

        if (enemyData.members) {
            displayEnemyTargetsTable(enemyData.members);
            populateEnemyMemberCheckboxes(enemyData.members, savedWatchlistMembers);
            
            // --- RE-ADDED: Call autoUnclaimHitTargets() here ---
            autoUnclaimHitTargets(); 
            // --- END RE-ADDED ---

        } else {
            console.warn("Enemy faction members data not found.");
            displayEnemyTargetsTable(null);
            populateEnemyMemberCheckboxes({}, []);
        }
    } catch (error) {
        console.error('Error fetching enemy faction data:', error);
        if (factionTwoNameEl) factionTwoNameEl.textContent = 'Invalid Enemy ID';
        if (factionTwoMembersEl) factionTwoMembersEl.textContent = 'N/A';
        displayEnemyTargetsTable(null);
        populateEnemyMemberCheckboxes({}, []);
    }
}
// ... (Your existing claimTarget and unclaimTarget functions) ...
 fetchAndDisplayEnemyFaction
  console.log('Chain countdown state:', currentLiveChainSeconds, lastChainApiFetchTime); // NEW: Added console.log
  if (chainTimerDisplay && currentLiveChainSeconds > 0 && lastChainApiFetchTime > 0) {
      const elapsedTimeSinceLastFetch = (Date.now() - lastChainApiFetchTime) / 1000; // Time in seconds since last API fetch
      // Calculate remaining time by subtracting elapsed time from the last fetched 'timeout'
      const dynamicTimeLeft = Math.max(0, currentLiveChainSeconds - Math.floor(elapsedTimeSinceLastFetch));
      chainTimerDisplay.textContent = formatTime(dynamicTimeLeft);
  } else if (chainTimerDisplay) {
      // If no chain is active or data is reset, show 'Chain Over'
      chainTimerDisplay.textContent = 'Chain Over';
  }

  // NEW: Update Chain Started Time Display
  // This section ensures the Chain Started time is displayed when data is available
  // It is placed here because the value does not change after initial fetch
  if (chainStartedDisplay && globalChainStartedTimestamp > 0) {
      chainStartedDisplay.textContent = `Started: ${formatTornTime(globalChainStartedTimestamp)}`;
  } else if (chainStartedDisplay) {
      chainStartedDisplay.textContent = 'Started: N/A';
  }
  
 // NEW: Function to fetch and display Chain Score (e.g., Lead Target progress)
async function fetchAndDisplayChainScore(apiKey) {
    const yourFactionNameScoreEl = document.getElementById('yourFactionNameScore');
    const currentChainScoreEl = document.getElementById('currentChainScore');
    const leadTargetProgressEl = document.getElementById('leadTargetProgress');
    const targetFactionScoreEl = document.getElementById('targetFactionScore');
    const enemyFactionNameScoreEl = document.getElementById('enemyFactionNameScore');

    // Set initial loading states
    if (currentChainScoreEl) currentChainScoreEl.textContent = '...';
    if (leadTargetProgressEl) leadTargetProgressEl.textContent = '... / ...';
    if (targetFactionScoreEl) targetFactionScoreEl.textContent = '...';

    if (!apiKey) {
        console.warn("API key is not available. Cannot fetch chain score data.");
        if (currentChainScoreEl) currentChainScoreEl.textContent = 'N/A';
        if (leadTargetProgressEl) leadTargetProgressEl.textContent = 'N/A';
        if (targetFactionScoreEl) targetFactionScoreEl.textContent = 'N/A';
        return;
    }

    try {
        const chainScoreApiUrl = `https://api.torn.com/faction/?selections=chain&key=${apiKey}&comment=MyTornPA_ChainScore`;
        const response = await fetch(chainScoreApiUrl);

        if (!response.ok) {
            throw new Error(`Server responded with an error: ${response.status} ${response.statusText}`);
        }
        const chainData = await response.json();
        console.log("Chain Score API Data (selections=chain):", chainData);

        if (chainData && chainData.chain) {
            const chain = chainData.chain;
            
            // Your Faction Name
            if (yourFactionNameScoreEl && factionApiFullData && factionApiFullData.basic) {
                yourFactionNameScoreEl.textContent = factionApiFullData.basic.name || 'Your Faction';
            } else if (yourFactionNameScoreEl) {
                yourFactionNameScoreEl.textContent = 'Your Faction'; // Fallback
            }

            // Current Chain Score (left side)
            if (currentChainScoreEl) {
                currentChainScoreEl.textContent = chain.current !== undefined ? chain.current.toLocaleString() : 'N/A';
            }

            // Lead Target Progress (middle)
            if (leadTargetProgressEl) {
                const maxHits = chain.max !== undefined ? chain.max.toLocaleString() : 'N/A';
                // Assuming 'chain_target_score' represents the lead target progress value
                const targetScore = chain.chain_target_score !== undefined ? chain.chain_target_score.toLocaleString() : 'N/A';
                leadTargetProgressEl.textContent = `${targetScore} / ${maxHits}`;
            }

            // Target Faction Score (right side)
            if (targetFactionScoreEl) {
                // If the chain.target_id is the enemy faction, we can try to display its name
                // For now, let's display the 'target' from the chain data, which typically represents the enemy score or a value associated with them.
                targetFactionScoreEl.textContent = chain.target !== undefined ? chain.target.toLocaleString() : 'N/A';
            }

            // Enemy Faction Name for Target Score (This requires a separate basic selection for enemy faction if not already fetched)
            // For now, we use a generic label or assume globalEnemyFactionID's name is already known from other fetches.
            if (enemyFactionNameScoreEl) {
                 if (globalEnemyFactionID && enemyDataGlobal && enemyDataGlobal.basic) { // Assuming enemyDataGlobal is available from fetchAndDisplayEnemyFaction
                     enemyFactionNameScoreEl.textContent = enemyDataGlobal.basic.name || 'Enemy Faction';
                 } else {
                     enemyFactionNameScoreEl.textContent = 'Enemy Faction'; // Default generic
                 }
            }


        } else {
            console.warn("Chain data not found in API response for chain score.");
            if (currentChainScoreEl) currentChainScoreEl.textContent = 'N/A';
            if (leadTargetProgressEl) leadTargetProgressEl.textContent = 'N/A';
            if (targetFactionScoreEl) targetFactionScoreEl.textContent = 'N/A';
        }

    } catch (error) {
        console.error("Error fetching chain score data:", error);
        if (currentChainScoreEl) currentChainScoreEl.textContent = 'Error';
        if (leadTargetProgressEl) leadTargetProgressEl.textContent = 'Error';
        if (targetFactionScoreEl) targetFactionScoreEl.textContent = 'Error';
    }
} 

  // NEW: Update Chain Timer Display (smooth 1-second countdown)
  console.log('Chain countdown state:', currentLiveChainSeconds, lastChainApiFetchTime); // NEW: Added console.log
  if (chainTimerDisplay && currentLiveChainSeconds > 0 && lastChainApiFetchTime > 0) {
      const elapsedTimeSinceLastFetch = (Date.now() - lastChainApiFetchTime) / 1000; // Time in seconds since last API fetch
      // Calculate remaining time by subtracting elapsed time from the last fetched 'timeout'
      const dynamicTimeLeft = Math.max(0, currentLiveChainSeconds - Math.floor(elapsedTimeSinceLastFetch));
      chainTimerDisplay.textContent = formatTime(dynamicTimeLeft);
  } else if (chainTimerDisplay) {
      // If no chain is active or data is reset, show 'Chain Over'
      chainTimerDisplay.textContent = 'Chain Over';
  }

async function updateDualChainTimers(apiKey, yourFactionId, enemyFactionId) {
    const friendlyHitsEl = document.getElementById('friendly-chain-hits');
    const friendlyTimeEl = document.getElementById('friendly-chain-time');
    const enemyHitsEl = document.getElementById('enemy-chain-hits');
    const enemyTimeEl = document.getElementById('enemy-chain-time');

    if (!friendlyHitsEl || !friendlyTimeEl || !enemyHitsEl || !enemyTimeEl) {
        return;
    }

    if (!apiKey || !yourFactionId) {
        console.warn("API key or your Faction ID is missing. Cannot fetch chain data for dual timers.");
        friendlyHitsEl.textContent = 'N/A';
        friendlyTimeEl.textContent = 'N/A';
        enemyHitsEl.textContent = 'N/A';
        enemyTimeEl.textContent = 'N/A';
        return;
    }

    let factionIdsToFetch = [yourFactionId];
    if (enemyFactionId) {
        factionIdsToFetch.push(enemyFactionId);
    }

    try {
        const combinedChainUrl = `https://api.torn.com/faction/${factionIdsToFetch.join(',')}/?selections=chain&key=${apiKey}&comment=MyTornPA_DualChain`;
        const response = await fetch(combinedChainUrl);
        const data = await response.json();

        console.log("updateDualChainTimers: Full API response data (after fetch):", data);
        console.log(`updateDualChainTimers: Your Faction ID used: ${yourFactionId}`);

        if (!response.ok || data.error) {
            const errorMessage = data.error ? data.error.error : response.statusText;
            throw new Error(`Torn API Error fetching combined chain data: ${errorMessage}`);
        }

        let yourChainData = null;
        let enemyChainData = null;

        // --- CRITICAL FIX: MORE ROBUST EXTRACTION OF CHAIN DATA ---
        // Determine if the API response is for a single faction directly (data.chain)
        // or multiple factions (data[factionId].chain)
        if (data.chain && (factionIdsToFetch.length === 1 && String(factionIdsToFetch[0]) === String(yourFactionId))) {
            // Case: Only your faction was fetched, and 'chain' is at the root.
            yourChainData = data.chain;
        } else if (data[yourFactionId]?.chain) {
            // Case: Your faction data is nested under its ID (typically when multiple factions are fetched).
            yourChainData = data[yourFactionId].chain;
        }

        if (enemyFactionId) { // Only try to extract enemy data if an enemy ID was provided
             if (data[enemyFactionId]?.chain) {
                // Enemy faction data is nested under its ID (typical for multi-faction fetch).
                enemyChainData = data[enemyFactionId].chain;
            } else if (factionIdsToFetch.length === 1 && String(factionIdsToFetch[0]) === String(enemyFactionId) && data.chain) {
                // Edge case: Only enemy faction was requested and 'chain' is at the root.
                enemyChainData = data.chain;
            }
        }
        // --- END CRITICAL FIX ---
        
        console.log("updateDualChainTimers: Extracted yourChainData (after fix):", yourChainData);

        if (yourChainData) {
            friendlyHitsEl.textContent = yourChainData.current !== undefined ? yourChainData.current.toLocaleString() : '0';
            friendlyTimeEl.textContent = formatTime(yourChainData.timeout || 0);
			
			 const friendlyProgressBar = document.getElementById('friendly-chain-progress');
            updateChainProgress(yourChainData.current || 0, friendlyProgressBar);
   

            currentLiveChainSeconds = yourChainData.timeout || 0;
            lastChainApiFetchTime = Date.now();
        } else {
            console.warn("updateDualChainTimers: yourChainData is still not available after extraction. Resetting chain timers to 0.");
            friendlyHitsEl.textContent = '0';
            friendlyTimeEl.textContent = 'Over';
            currentLiveChainSeconds = 0;
            lastChainApiFetchTime = 0;
        }

        // Process enemy faction's chain data
        if (enemyFactionId) {
            if (enemyChainData) { // Use enemyChainData already extracted above
                 enemyHitsEl.textContent = enemyChainData.current !== undefined ? enemyChainData.current.toLocaleString() : '0';
                 enemyTimeEl.textContent = formatTime(enemyChainData.timeout || 0);
				 
				 const enemyProgressBar = document.getElementById('enemy-chain-progress');
                 updateChainProgress(enemyChainData.current || 0, enemyProgressBar);
				 
            } else {
                enemyHitsEl.textContent = '0';
                enemyTimeEl.textContent = 'Over';
            }
        } else {
            enemyHitsEl.textContent = '0';
            enemyTimeEl.textContent = 'No Current War';
        }

    } catch (error) {
        console.error("Error in updateDualChainTimers:", error);
        friendlyHitsEl.textContent = 'Error';
        friendlyTimeEl.textContent = 'Error';
        enemyHitsEl.textContent = 'Error';
        enemyTimeEl.textContent = 'Error';
        currentLiveChainSeconds = 0;
        lastChainApiFetchTime = 0;
    }
}

// --- NEW FUNCTION: Creates and styles the progress bar text elements ---
function setupProgressText() {
    const friendlyContainer = document.getElementById('friendly-chain-progress')?.parentElement;
    const enemyContainer = document.getElementById('enemy-chain-progress')?.parentElement;

    // A helper function to avoid repeating code
    const createTextElement = (container, id) => {
        if (!container || document.getElementById(id)) return; // Don't run if container doesn't exist or text is already there

        // This is needed to position the text inside the container
        container.style.position = 'relative';

        const textEl = document.createElement('span');
        textEl.id = id;

        // --- All styling is applied here via JavaScript ---
        textEl.style.position = 'absolute';
        textEl.style.top = '50%';
        textEl.style.left = '50%';
        textEl.style.transform = 'translate(-50%, -50%)';
        textEl.style.color = '#FFFFFF';
        textEl.style.fontWeight = 'bold';
        textEl.style.fontSize = '10px';
        textEl.style.textShadow = '0 0 2px rgba(0,0,0,0.8)'; // Makes text more readable
        textEl.style.pointerEvents = 'none'; // Makes text unclickable

        container.appendChild(textEl);
    };

    createTextElement(friendlyContainer, 'friendly-chain-text');
    createTextElement(enemyContainer, 'enemy-chain-text');
}

function generateDayFormHTML(dayNumber) {
    return `
        <div class="availability-day-form" data-day="${dayNumber}">
            <h5>--- Day ${dayNumber} ---</h5>
            <div class="form-group">
                <label for="status-day-${dayNumber}">Will you be available?</label>
                <select id="status-day-${dayNumber}" class="availability-status">
                    <option value="no-response" selected>-- Select --</option>
                    <option value="yes">YES</option>
                    <option value="partial">Partially</option>
                    <option value="no">NO</option>
                </select>
            </div>
            <div class="time-details" style="display: none;">
                <div class="form-group">
                    <label for="time-from-day-${dayNumber}">Time Range:</label>
                    <input type="text" id="time-from-day-${dayNumber}" placeholder="e.g., 2pm - 7pm">
                </div>
            </div>
            <div class="reason-details" style="display: none;">
                <div class="form-group">
                    <label for="reason-day-${dayNumber}">Reason:</label>
                    <input type="text" id="reason-day-${dayNumber}" placeholder="e.g., Sickness, Work">
                </div>
            </div>
            <div class="form-group">
                <label for="role-day-${dayNumber}">Primary Role:</label>
                <select id="role-day-${dayNumber}">
                    <option value="none">-- Select Role --</option>
                    <option value="all-round-attacker">All Round Attacker</option>
                    <option value="chain-watcher">Chain Watcher</option>
                    <option value="outside-attacker">Outside Attacker</option>
                </select>
            </div>
            <div class="form-group checkbox-group">
                <input type="checkbox" id="war-start-day-${dayNumber}">
                <label for="war-start-day-${dayNumber}">Available for war start?</label>
            </div>
            <button class="action-btn">Update Day ${dayNumber}</button>
        </div>
    `;
}

function setupReminderTemplateControls() {
    const reminderTextarea = document.getElementById('reminderMessageTemplate');
    const saveTemplateBtn = document.getElementById('saveReminderTemplateBtn');
    const warDocRef = db.collection('factionWars').doc('currentWar');

    // Load the saved template when the page loads
    warDocRef.get().then(doc => {
        if (doc.exists && doc.data().reminderTemplate) {
            if (reminderTextarea) {
                reminderTextarea.value = doc.data().reminderTemplate;
            }
        }
    }).catch(error => console.error("Error loading reminder template:", error));

    // Save the template when the button is clicked
    if (saveTemplateBtn && reminderTextarea) {
        saveTemplateBtn.addEventListener('click', () => {
            const templateText = reminderTextarea.value;
            warDocRef.set({ reminderTemplate: templateText }, { merge: true })
                .then(() => {
                    alert('Reminder message template saved!');
                })
                .catch(error => {
                    console.error("Error saving reminder template:", error);
                    alert('Failed to save template. See console for details.');
                });
        });
    }
}

async function checkAndShowAdminControls() {
    const user = auth.currentUser;
    if (!user) return; // Not logged in

    try {
        // Check user's position from their profile
        const userProfileDoc = await db.collection('userProfiles').doc(user.uid).get();
        const userPosition = userProfileDoc.exists ? userProfileDoc.data().position : '';

        // Check the designated admins list from the war data
        const warDoc = await db.collection('factionWars').doc('currentWar').get();
        const tab4Admins = warDoc.exists ? warDoc.data().tab4Admins || [] : [];
        
        // --- THIS IS THE FIX ---
        // Convert the user's position to lowercase before checking it.
        const userPositionLower = userPosition.toLowerCase();
        const isAdmin = userPositionLower === 'leader' || userPositionLower === 'co-leader' || tab4Admins.includes(user.uid);
        // --- END OF FIX ---

        if (isAdmin) {
            const adminControls = document.getElementById('availability-admin-controls');
            if (adminControls) {
                adminControls.style.display = 'block';
            }
            // This call is correct and should remain.
            setupReminderTemplateControls();
        }
    } catch (error) {
        console.error("Error checking admin status:", error);
    }
}

const adminControls = document.getElementById('availability-admin-controls');
if (adminControls) {
    adminControls.addEventListener('click', async (event) => { // Make the event listener async
        const button = event.target; // Get the button element
        const buttonId = button.id;

        if (buttonId === 'notify-members-btn') {
            // This is the original "Send Reminders" button
            // Trigger the sendReminderNotifications directly
            button.textContent = "Sending...";
            button.disabled = true;
            try {
                await sendReminderNotifications();
                alert('Reminders sent successfully!');
            } catch (error) {
                console.error("Error sending reminders:", error);
                alert('Failed to send reminders: ' + error.message);
            } finally {
                button.textContent = "Send Reminders";
                button.disabled = false;
            }
        }

        if (buttonId === 'reset-availability-btn') {
            alert("Reset functionality is not yet implemented.");
        }
    });
}

async function sendReminderNotifications() {
    const reminderListContainer = document.getElementById('reminder-list-container');
    if (!reminderListContainer) return;

    reminderListContainer.innerHTML = '<p>Finding members and preparing notifications...</p>';

    try {
        // Get the list of users who have already responded
        const availabilitySnapshot = await db.collection('factionWars').doc('currentWar').collection('availability').get();
        const respondedUserIds = new Set();
        availabilitySnapshot.forEach(doc => {
            respondedUserIds.add(doc.id);
        });

        // Get the full list of all faction members
        if (!factionApiFullData || !factionApiFullData.members) {
            throw new Error("Faction member list is not available.");
        }
        const allMembers = Object.values(factionApiFullData.members);

        // Find who has NOT responded, and get their Torn IDs and names
        const nonRespondersDetails = allMembers
            .filter(member => !respondedUserIds.has(String(member.id))) 
            .map(member => ({
                id: String(member.id), 
                name: member.name
            }));

        if (nonRespondersDetails.length === 0) {
            reminderListContainer.innerHTML = '<p style="color: #4CAF50; font-weight: bold;">Everyone has responded!</p>';
            console.log("No users require reminders. All have responded."); // Console log instead of alert
            return;
        }

        // Fetch Discord Webhook URL and Reminder Template from Firebase
        const warDoc = await db.collection('factionWars').doc('currentWar').get();
        const warData = warDoc.exists ? warDoc.data() : {};

        const discordWebhookUrl = warData.discordWebhookUrl; 
        const reminderTemplate = warData.reminderTemplate || "A friendly reminder to set your war availability!";

        if (!discordWebhookUrl || !discordWebhookUrl.startsWith("https://discord.com/api/webhooks/")) {
            // Provide error message in UI if webhook is not configured
            reminderListContainer.innerHTML = '<p style="color: red; font-weight: bold;">Error: Discord Webhook URL is not configured or invalid. Please set it in Leader Controls.</p>';
            console.error("Discord Webhook URL is not set or is invalid in Leader Controls."); // Console log error
            return; // Exit function as we can't send
        }

        const backendWebhookEndpoint = '/.netlify/functions/send-availability-webhook'; 

        const response = await fetch(backendWebhookEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                discordWebhookUrl: discordWebhookUrl, 
                nonResponders: nonRespondersDetails, 
                reminderMessage: reminderTemplate,
                factionName: factionApiFullData.basic.name,
                factionId: globalYourFactionID
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Netlify Function failed: ${errorData.message || response.statusText}`);
        }

        reminderListContainer.innerHTML = `<p style="color: #4CAF50; font-weight: bold;">Reminders sent to ${nonRespondersDetails.length} members via Discord webhook!</p>`;
        console.log("Availability reminders successfully dispatched via Netlify Function.");

    } catch (error) {
        console.error("Error sending reminder notifications via webhook:", error);
        reminderListContainer.innerHTML = `<p style="color: red; font-weight: bold;">Error sending reminders: ${error.message}</p>`;
    }
}

async function sendAvailabilityReport() {
    console.log("Starting availability report generation...");
    const button = document.getElementById('send-availability-report-btn'); // Get the button to update its text

    try {
        // 1. Get Discord Webhook URL from Firebase
        const warDoc = await db.collection('factionWars').doc('currentWar').get();
        const warData = warDoc.exists ? warDoc.data() : {};
        const discordWebhookUrl = warData.discordWebhookUrl;

        if (!discordWebhookUrl || !discordWebhookUrl.startsWith("https://discord.com/api/webhooks/")) {
            showCustomAlert("Discord Webhook URL is not configured or invalid. Please set it in the 'Edit Webhook' control.", "Webhook Missing");
            throw new Error("Discord Webhook URL not set.");
        }

        // 2. Gather all availability data
        const availabilitySnapshot = await db.collection('factionWars').doc('currentWar').collection('availability').get();
        const availabilityData = {};
        availabilitySnapshot.forEach(doc => {
            availabilityData[doc.id] = doc.data();
        });

        // 3. Get the full faction member list
        if (!factionApiFullData || !factionApiFullData.members) {
            throw new Error("Faction member list is not available.");
        }
        const allMembers = Object.values(factionApiFullData.members);

        // 4. Process data and build the report content
        const report = {
            day1: { yes: [], partial: [], no: [], noResponse: [] },
            day2: { yes: [], partial: [], no: [], noResponse: [] },
            day3: { yes: [], partial: [], no: [], noResponse: [] },
        };

        allMembers.forEach(member => {
            const memberId = String(member.id);
            const memberName = member.name;
            const memberAvailability = availabilityData[memberId];

            if (memberAvailability) {
                for (let i = 1; i <= 3; i++) {
                    const dayData = memberAvailability[`day_${i}`];
                    const dayKey = `day${i}`;
                    if (dayData && dayData.status !== 'no-response') {
                        report[dayKey][dayData.status].push(memberName);
                    } else {
                        report[dayKey].noResponse.push(memberName);
                    }
                }
            } else {
                report.day1.noResponse.push(memberName);
                report.day2.noResponse.push(memberName);
                report.day3.noResponse.push(memberName);
            }
        });

        // 5. Format the report string for Discord
        let reportString = `**War Availability Report for ${factionApiFullData.basic.name}**\n-----------------------------------\n`;
        
        for (let i = 1; i <= 3; i++) {
            const dayKey = `day${i}`;
            const dayReport = report[dayKey];
            reportString += `\n**DAY ${i} SUMMARY**\n`;
            reportString += `✅ **Available (${dayReport.yes.length}):** ${dayReport.yes.join(', ') || 'None'}\n`;
            reportString += `🟧 **Partially (${dayReport.partial.length}):** ${dayReport.partial.join(', ') || 'None'}\n`;
            reportString += `❌ **Unavailable (${dayReport.no.length}):** ${dayReport.no.join(', ') || 'None'}\n`;
            reportString += `❔ **No Response (${dayReport.noResponse.length}):** ${dayReport.noResponse.join(', ') || 'None'}\n`;
        }
        
        reportString += "\n-----------------------------------\nReport generated by MyTornPA.";
        
        // 6. Send the single report to your backend
        const backendWebhookEndpoint = '/.netlify/functions/send-availability-webhook';
        const response = await fetch(backendWebhookEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                discordWebhookUrl: discordWebhookUrl,
                reminderMessage: reportString,
                nonResponders: [],
                factionName: factionApiFullData.basic.name,
                factionId: globalYourFactionID
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Backend Function failed: ${errorData.message || response.statusText}`);
        }

        console.log("Availability report successfully dispatched.");
        return true; // Indicate success

    } catch (error) {
        console.error("Error generating or sending availability report:", error);
        throw error;
    }
}

function showDayForm(dayNumber) {
    const formsContainer = document.getElementById('availability-forms-container');
    if (formsContainer) {
        const formHtml = generateDayFormHTML(dayNumber);
        formsContainer.innerHTML = formHtml;
    }
}

// --- NEW FUNCTION: Manages Discord Webhook Display & Edit Functionality ---
// Locate this function in your war_page_hub.js
async function setupDiscordWebhookControls() {
    // Get references to the dynamically added elements
    const unifiedControl = document.getElementById('discordWebhookUnifiedControl'); 
    const statusText = document.getElementById('discordWebhookStatusText');     
    const webhookInput = document.getElementById('discordWebhookUrlInput');    
    const saveBtn = document.getElementById('saveDiscordWebhookBtn');          
    const cancelBtn = document.getElementById('cancelDiscordWebhookBtn');      
    const removeBtn = document.getElementById('removeDiscordWebhookBtn');      // NEW: Remove button reference
    const editArea = document.getElementById('discordWebhookEditArea');        // The modal's content box
    const modalOverlay = document.getElementById('discordWebhookModalOverlay'); // NEW: The full-screen overlay

    // Critical check: Ensure all elements exist
    if (!unifiedControl || !statusText || !webhookInput || !saveBtn || !cancelBtn || !removeBtn || !editArea || !modalOverlay) {
        console.warn("One or more Discord Webhook control elements not found. Skipping webhook setup.");
        return;
    }

    let currentSavedWebhookUrl = null; 

    // Helper function to switch between display mode (button) and edit mode (modal)
    function setDisplayMode(isEditMode) {
        if (isEditMode) {
            modalOverlay.style.display = 'flex'; // Show the full-screen modal overlay
            webhookInput.value = currentSavedWebhookUrl || ''; // Populate input
            webhookInput.focus();
            unifiedControl.classList.add('editing'); // Add class for styling when active/editing
        } else {
            modalOverlay.style.display = 'none'; // Hide the modal overlay
            unifiedControl.classList.remove('editing'); // Remove editing class

            // Update status text on the button itself and apply colors
            if (currentSavedWebhookUrl) {
                statusText.textContent = "Edit Webhook"; // Button text for configured state
                unifiedControl.classList.add('configured-status');
                unifiedControl.classList.remove('not-set-status');
            } else {
                statusText.textContent = "Set Webhook"; // Button text for not set state
                unifiedControl.classList.add('not-set-status');
                unifiedControl.classList.remove('configured-status');
            }
        }
        // Always reset input border/color when switching modes
        webhookInput.style.borderColor = '';
        webhookInput.style.color = '';
    }

    // 1. Load the saved URL from Firebase on initial setup
    try {
        const warDoc = await db.collection('factionWars').doc('currentWar').get();
        if (warDoc.exists && warDoc.data().discordWebhookUrl) {
            currentSavedWebhookUrl = warDoc.data().discordWebhookUrl;
            console.log("Discord Webhook URL loaded from Firebase.");
        } else {
            console.log("No Discord Webhook URL found in Firebase.");
        }
    } catch (error) {
        console.error("Error fetching Discord Webhook URL from Firebase:", error);
        currentSavedWebhookUrl = null; 
    }

    // Set the initial UI state
    setDisplayMode(false); 

    // 2. Attach Event Listeners

    // Event listener for the main unified control (the "Set/Edit Webhook" button)
    unifiedControl.addEventListener('click', (event) => {
        setDisplayMode(true); // Show the modal when this button is clicked
    });

    // Event listener for the 'Save' button inside the modal
    saveBtn.addEventListener('click', async (event) => {
        event.stopPropagation(); // Prevent clicks from bubbling up to the unifiedControl div
        const newUrl = webhookInput.value.trim();

        if (newUrl === "" || !newUrl.startsWith("https://discord.com/api/webhooks/")) {
            webhookInput.style.borderColor = 'red'; 
            webhookInput.style.color = 'red'; 
            webhookInput.value = "Invalid URL! Re-enter or Cancel."; 
            console.warn("Invalid Discord Webhook URL entered by user.");
            setTimeout(() => { 
                webhookInput.style.borderColor = ''; 
                webhookInput.style.color = '';
                webhookInput.value = newUrl; 
            }, 3000); 
            return;
        }

        saveBtn.disabled = true; 
        saveBtn.textContent = "Saving...";

        try {
            await db.collection('factionWars').doc('currentWar').set(
                { discordWebhookUrl: newUrl },
                { merge: true } 
            );
            currentSavedWebhookUrl = newUrl; 
            console.log("Discord Webhook URL saved successfully to Firebase.");
        } catch (error) {
            console.error("Error saving Discord Webhook URL to Firebase:", error);
        } finally {
            saveBtn.disabled = false; 
            saveBtn.textContent = "Save"; 
            setDisplayMode(false); 
        }
    });

    // Event listener for the 'Cancel' button inside the modal
    cancelBtn.addEventListener('click', (event) => {
        event.stopPropagation(); 
        setDisplayMode(false); 
    });

    // NEW: Event listener for the 'Remove Webhook' button inside the modal
    removeBtn.addEventListener('click', async (event) => {
        event.stopPropagation(); // Prevent clicks from bubbling up
        if (confirm("Are you sure you want to remove the Discord Webhook URL? This will stop reminders to Discord.")) {
            removeBtn.disabled = true;
            removeBtn.textContent = "Removing...";
            try {
                // Set the URL to null or delete the field from Firebase
                await db.collection('factionWars').doc('currentWar').set(
                    { discordWebhookUrl: null }, // Set to null to remove the value
                    { merge: true }
                );
                currentSavedWebhookUrl = null; // Update local state
                console.log("Discord Webhook URL removed from Firebase.");
            } catch (error) {
                console.error("Error removing Discord Webhook URL from Firebase:", error);
                alert('Failed to remove webhook. See console for details.');
            } finally {
                removeBtn.disabled = false;
                removeBtn.textContent = "Remove Webhook";
                setDisplayMode(false); // Close modal and update button status
            }
        }
    });
}
async function showFactionSummary(summaryCounts) {
    const formsContainer = document.getElementById('availability-forms-container');
    if (!formsContainer) return;

    let isAdmin = false;
    let adminDisplayStyle = 'display: none;';
    const user = auth.currentUser;

    if (user) {
        try {
            const userProfileDoc = await db.collection('userProfiles').doc(user.uid).get();
            const userProfile = userProfileDoc.exists ? userProfileDoc.data() : {};
            const userPosition = userProfile.position ? userProfile.position.toLowerCase() : '';
            const userTornId = userProfile.tornProfileId || ''; 

            const warDoc = await db.collection('factionWars').doc('currentWar').get();
            const tab4Admins = warDoc.exists ? warDoc.data().tab4Admins || [] : [];
            
            if (userPosition === 'leader' || userPosition === 'co-leader' || tab4Admins.includes(userTornId)) {
                isAdmin = true;
                adminDisplayStyle = 'display: block;';
            }

        } catch (error) {
            console.error("Error checking admin status within showFactionSummary:", error);
        }
    }

    const summaryHtml = `
        <div class="faction-summary-panel">
            <h4>Daily Readiness Summary</h4>
            <div class="summary-grid">
                <div class="summary-col">
                    <strong>Day 1</strong>
                    <p>✅ Available: ${summaryCounts.day1.yes}</p><p>🟧 Partially: ${summaryCounts.day1.partial}</p><p>❌ Unavailable: ${summaryCounts.day1.no}</p>
                </div>
                <div class="summary-col">
                    <strong>Day 2</strong>
                    <p>✅ Available: ${summaryCounts.day2.yes}</p><p>🟧 Partially: ${summaryCounts.day2.partial}</p><p>❌ Unavailable: ${summaryCounts.day2.no}</p>
                </div>
                <div class="summary-col">
                    <strong>Day 3</strong>
                    <p>✅ Available: ${summaryCounts.day3.yes}</p><p>🟧 Partially: ${summaryCounts.day3.partial}</p><p>❌ Unavailable: ${summaryCounts.day3.no}</p>
                </div>
            </div>
            <div class="summary-footer">
                <p id="summary-roles"><strong>Primary Roles:</strong> All Rounder: <strong>${summaryCounts.roles['all-round-attacker']}</strong> / Chain Watcher: <strong>${summaryCounts.roles['chain-watcher']}</strong> / Outside Hitter: <strong>${summaryCounts.roles['outside-attacker']}</strong></p>
                <hr>
                <p id="summary-war-start"><strong>Available at War Start:</strong> ${summaryCounts.atStart}</p>
            </div>
            <div class="summary-edit-buttons">
                <button class="action-btn edit-day-btn" data-day-to-edit="1">Edit Day 1</button>
                <button class="action-btn edit-day-btn" data-day-to-edit="2">Edit Day 2</button>
                <button class="action-btn edit-day-btn" data-day-to-edit="3">Edit Day 3</button>
            </div>

            <div id="availability-admin-controls" style="${adminDisplayStyle}">
                <hr>
                <h4>Leader Controls</h4>
                <div class="summary-edit-buttons leader-controls-row">
                    <button id="reset-availability-btn" class="action-btn">Reset All</button>
                    <button id="notify-members-btn" class="action-btn">Send Reminders</button>
                    <button id="send-availability-report-btn" class="action-btn">Send Availability</button> 
                    <div id="discordWebhookUnifiedControl" class="action-btn discord-webhook-unified-control">
                        <span id="discordWebhookStatusText">Set Webhook</span>
                    </div>
                </div>
                <div id="reminder-list-container"></div>
            </div>
        </div>
        
        <div id="discordWebhookModalOverlay" class="webhook-modal-overlay" style="display: none;">
            <div id="discordWebhookEditArea" class="webhook-edit-area">
                <div class="modal-header"><h4>Configure Discord Webhook</h4></div>
                <div class="modal-body">
                    <label for="discordWebhookUrlInput">Webhook URL:</label>
                    <input type="text" id="discordWebhookUrlInput" placeholder="Paste Discord Webhook URL here" class="webhook-input">
                </div>
                <div class="modal-footer">
                    <button id="removeDiscordWebhookBtn" class="action-btn small-btn remove">Remove Webhook</button>
                    <button id="saveDiscordWebhookBtn" class="action-btn small-btn">Save</button>
                    <button id="cancelDiscordWebhookBtn" class="action-btn small-btn cancel">Cancel</button>
                </div>
            </div>
        </div>
    `;

    formsContainer.innerHTML = summaryHtml;
    
    if (isAdmin) {
        setTimeout(() => {
            setupDiscordWebhookControls();
            setupReminderTemplateControls();
        }, 0);
    }
}
async function displayWarRoster() {
    const rosterDisplay = document.getElementById('war-roster-display');
    if (!rosterDisplay) {
        console.error("HTML Error: Cannot find element with ID 'war-roster-display'.");
        return;
    }

    rosterDisplay.innerHTML = '<p>Loading team roster...</p>';

    try {
        const availabilitySnapshot = await db.collection('factionWars').doc('currentWar').collection('availability').get();
        const availabilityData = {};
        availabilitySnapshot.forEach(doc => {
            availabilityData[doc.id] = doc.data();
        });

        if (!factionApiFullData || !factionApiFullData.members) {
            rosterDisplay.innerHTML = '<p style="color: red;">Faction member list not available.</p>';
            return;
        }
        const allMembers = Object.values(factionApiFullData.members);
        rosterDisplay.innerHTML = ''; // Clear loading message

        let summaryCounts = { day1: { yes: 0, partial: 0, no: 0 }, day2: { yes: 0, partial: 0, no: 0 }, day3: { yes: 0, partial: 0, no: 0 }, roles: { 'all-round-attacker': 0, 'chain-watcher': 0, 'outside-attacker': 0 }, atStart: 0 };

        const memberDisplayPromises = allMembers.map(async (member) => {
            const memberId = member.id;
            const memberName = member.name;
            const memberAvailability = availabilityData[memberId];
            let statusClass = 'status-grey';
            let statusTextHtml = '<span class="status-text-grey">(No response yet)</span>';

            if (memberAvailability) {
                const summaryParts = [];
                let hasSaidNo = false, hasSaidPartial = false, hasSaidYes = false;
                for (let i = 1; i <= 3; i++) {
                    const dayData = memberAvailability[`day_${i}`];
                    if (dayData && dayData.status !== 'no-response') {
                        summaryCounts[`day${i}`][dayData.status]++;
                        if (i === 1) {
                            if (dayData.role && dayData.role !== 'none') summaryCounts.roles[dayData.role]++;
                            if (dayData.isAvailableForStart) summaryCounts.atStart++;
                        }
                        let dayStatusText = `D${i}: `;
                        let dayStatusClass = '';
                        switch (dayData.status) {
                            case 'yes': dayStatusText += `Yes (${dayData.timeRange || 'All Day'})`; dayStatusClass = 'status-text-green'; hasSaidYes = true; break;
                            case 'partial': dayStatusText += `Partial (${dayData.timeRange || 'N/A'})`; dayStatusClass = 'status-text-orange'; hasSaidPartial = true; break;
                            case 'no': dayStatusText += `No (${dayData.reason || 'No reason'})`; dayStatusClass = 'status-text-red'; hasSaidNo = true; break;
                        }
                        summaryParts.push(`<span class="${dayStatusClass}">${dayStatusText}</span>`);
                    }
                }
                if (summaryParts.length > 0) {
                    statusTextHtml = summaryParts.join(' | ');
                    if (hasSaidNo) statusClass = 'status-red'; else if (hasSaidPartial) statusClass = 'status-orange'; else if (hasSaidYes) statusClass = 'status-green';
                }
            }

            const randomIndex = Math.floor(Math.random() * DEFAULT_PROFILE_ICONS.length);
            let profileImageUrl = DEFAULT_PROFILE_ICONS[randomIndex];
            try {
                if (memberProfileCache[memberId] && memberProfileCache[memberId].profile_image) {
                    profileImageUrl = memberProfileCache[memberId].profile_image;
                } else {
                    const userDoc = await db.collection('users').doc(String(memberId)).get();
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        if (userData.profile_image && userData.profile_image.trim() !== '') {
                            profileImageUrl = userData.profile_image;
                        }
                        memberProfileCache[memberId] = { profile_image: profileImageUrl, name: userData.name || memberName };
                    } else {
                        console.log(`User document not found in 'users' collection for member ${memberId}. Using default profile image.`);
                    }
                }
            } catch (err) {
                console.warn(`Error fetching profile picture from Firebase for member ${memberId}:`, err);
                profileImageUrl = '../../images/default_user_icon.svg';
            }

            return `
                <div class="roster-player ${statusClass}" data-member-id="${memberId}">
                    <img src="${profileImageUrl}" alt="${memberName}'s profile pic" class="roster-player-pic">
                    <div class="roster-player-info">
                        <span class="player-name">${memberName}</span>
                        <span class="player-status">${statusTextHtml}</span>
                    </div>
                </div>
            `;
        });

        const allPlayerHtml = await Promise.all(memberDisplayPromises);
        rosterDisplay.innerHTML = allPlayerHtml.join('');

        // The only change is adding 'await' here
        await showFactionSummary(summaryCounts);
        
    } catch (error) {
        console.error("Error displaying war roster:", error);
        rosterDisplay.innerHTML = '<p style="color: red;">Error loading roster.</p>';
    }
}

async function checkIfUserIsAdmin() {
    console.log("--- Running Admin Check ---"); // DEBUG
    const user = auth.currentUser;
    if (!user) {
        console.log("Check failed: User not logged in."); // DEBUG
        return false;
    }

    try {
        const userProfileDoc = await db.collection('userProfiles').doc(user.uid).get();
        if (!userProfileDoc.exists) {
            console.log("Check failed: User profile not found in database."); // DEBUG
            return false;
        }

        const userProfile = userProfileDoc.data();
        const userPosition = userProfile.position ? userProfile.position.toLowerCase() : '';
        const userTornId = userProfile.tornProfileId || '';
        
        console.log(`Checking user: ${userProfile.name} [${userTornId}] with position: ${userPosition}`); // DEBUG

        if (userPosition === 'leader' || userPosition === 'co-leader') {
            console.log("Check passed: User is Leader or Co-leader."); // DEBUG
            return true;
        }

        const warDoc = await db.collection('factionWars').doc('currentWar').get();
        if (!warDoc.exists) {
            console.log("Check failed: currentWar document not found."); // DEBUG
            return false;
        }

        const tab4Admins = warDoc.data().tab4Admins || [];
        console.log("Admins list from database:", tab4Admins); // DEBUG
        
        const isIncluded = tab4Admins.includes(String(userTornId));
        console.log(`Is user's Torn ID (${userTornId}) in the admin list?`, isIncluded); // DEBUG

        return isIncluded;

    } catch (error) {
        console.error("Error during admin check:", error);
        return false;
    }
}

/**
 * Fetches and displays war history, top hitters, and respect stats.
 * @param {string} apiKey The user's Torn API key.
 */
async function displayWarHistory(apiKey) {
    if (!enemyTargetsContainer) {
        console.error("HTML Error: Cannot find 'enemyTargetsContainer' to display content.");
        return;
    }

    // Initial loading message
    enemyTargetsContainer.innerHTML = `
        <div class="war-history-container">
            <h4>Loading War Data...</h4>
        </div>`;

    try {
        // Step 1: Get the list of recent wars to find their IDs
        const historyUrl = `https://api.torn.com/v2/faction/rankedwars?sort=DESC&key=${apiKey}&comment=MyTornPA_WarHistoryList`;
        const historyResponse = await fetch(historyUrl);
        const historyData = await historyResponse.json();

        if (!historyResponse.ok || historyData.error) {
            throw new Error(historyData.error?.error || 'Failed to fetch war history list.');
        }

        const warsArray = historyData.rankedwars || [];
        if (warsArray.length === 0) {
            enemyTargetsContainer.innerHTML = `<div class="war-history-container"><h4>Recent War History</h4><p style="text-align:center; padding: 20px;">No ranked war history found.</p></div>`;
            return;
        }

        // Step 2: Get the last 3 war IDs and fetch their detailed reports
        const lastThreeWarIds = warsArray.slice(0, 3).map(war => war.id);
        const reportPromises = lastThreeWarIds.map(id => {
            const reportUrl = `https://api.torn.com/v2/faction/${id}/rankedwarreport?key=${apiKey}&comment=MyTornPA_WarReport`;
            return fetch(reportUrl).then(res => res.json());
        });
        const warReports = await Promise.all(reportPromises);

        // Step 3: Process data from the reports
        let totalRespect = 0;
        let lastWarRespect = 0;
        const hitters = {};

        warReports.forEach((reportData, index) => {
            const report = reportData.rankedwarreport;
            if (!report) return;

            const yourFactionDetails = report.factions.find(f => f.id == globalYourFactionID);
            if (!yourFactionDetails || !yourFactionDetails.rewards) return;

            const respectGained = yourFactionDetails.rewards.respect || 0;
            totalRespect += respectGained;

            if (index === 0) { // The first report is the most recent
                lastWarRespect = respectGained;
            }

            // Aggregate hits for each member
            (yourFactionDetails.members || []).forEach(member => {
                if (!hitters[member.id]) {
                    hitters[member.id] = { name: member.name, attacks: 0 };
                }
                hitters[member.id].attacks += member.attacks;
            });
        });
        
        // Calculate overall W/L Ratio from the full history
        let wins = 0;
        let losses = 0;
        warsArray.forEach(war => {
            if (war.winner === globalYourFactionID) { wins++; } else { losses++; }
        });

        // Sort hitters and get the top 3
        const sortedHitters = Object.values(hitters).sort((a, b) => b.attacks - a.attacks);
        const topThreeHitters = sortedHitters.slice(0, 3);
        
        // Step 4: Build the HTML for all sections
        const topHittersHtml = topThreeHitters.map((hitter, index) => {
            const rank = index + 1;
            const medals = ['🥇', '🥈', '🥉'];
            return `
                <li class="top-hitter-item rank-${rank}">
                    <span class="hitter-rank">${medals[index]}</span>
                    <span class="hitter-name">${hitter.name}</span>
                    <span class="hitter-score">${hitter.attacks.toLocaleString()} hits</span>
                </li>`;
        }).join('');

        const warHistoryHtml = warsArray.slice(0, 10).map(war => {
            const yourFaction = war.factions.find(f => f.id == globalYourFactionID);
            const opponent = war.factions.find(f => f.id != globalYourFactionID);
            if (!yourFaction || !opponent) return '';

            const result = war.winner === globalYourFactionID ? 'Win' : 'Loss';
            const resultClass = `war-result-${result.toLowerCase()}`;
            const timeAgo = formatRelativeTime(war.end);

            return `
                <li class="war-history-item">
                    <span class="opponent-name">Vs. ${opponent.name}</span>
                    <span class="war-result ${resultClass}">${result}</span>
                    <span class="war-score">${yourFaction.score.toLocaleString()} to ${opponent.score.toLocaleString()}</span>
                    <span class="war-time">${timeAgo}</span>
                </li>
            `;
        }).join('');

        enemyTargetsContainer.innerHTML = `
            <div class="war-history-container">
                <div class="war-history-header">
                    <div class="respect-box">
                        <span>Bonus Respect Gained</span>
                        <div class="respect-line">Last War: <strong>${lastWarRespect.toLocaleString()}</strong></div>
                        <div class="respect-line">Total (Last 3): <strong>${totalRespect.toLocaleString()}</strong></div>
                    </div>
                    <h4>Recent War History</h4>
                    <div class="win-loss-ratio-box">
                        <span>W/L (All Time)</span>
                        <span class="ratio-value">${wins} / ${losses}</span>
                    </div>
                </div>
                <div class="top-hitters-container">
                    <h5>Top Hitters Based on Last Three Wars</h5>
                    <ol class="top-hitters-list">${topHittersHtml}</ol>
                </div>
                <ul class="war-history-list">${warHistoryHtml}</ul>
            </div>
        `;
    } catch (error) {
        console.error("Error displaying war history:", error);
        enemyTargetsContainer.innerHTML = `
            <div class="war-history-container">
                <h4>Error</h4>
                <p style="color: red; text-align: center; padding: 20px;">${error.message}</p>
            </div>
        `;
    }
}
function displayEnemyTargetsTable(members) {
    if (!enemyTargetsContainer) {
        console.error("HTML Error: Cannot find element with ID 'enemyTargetsContainer'.");
        return;
    }

    // --- THIS IS THE MODIFIED LOGIC ---
    // Check if there are any members to display.
    if (!members || Object.keys(members).length === 0) {
        // If NO members, call the new function to show war history and stop.
        // The global 'userApiKey' is used here.
        displayWarHistory(userApiKey);
        return; 
    }
    // --- END OF MODIFIED LOGIC ---


    // If there ARE members, the rest of the function builds the table as before.
    let tableHtml = `
        <table class="enemy-targets-table">
            <thead>
                <tr>
                    <th class="col-name">Name (ID)</th>
                    <th class="col-level">Level</th>
                    <th class="col-last-action">Last Action</th>
                    <th class="col-status">Status</th>
                    <th class="col-claim">Claim</th>
                    <th class="col-attack">Attack</th>
                </tr>
            </thead>
            <tbody>
    `;

    const membersArray = Object.values(members);
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const currentAuthUid = auth.currentUser ? auth.currentUser.uid : null;

    for (const member of membersArray) {
        const memberId = member.id;
        const memberName = member.name;
        const profileUrl = `https://www.torn.com/profiles.php?XID=${memberId}`;
        const attackUrl = `https://www.torn.com/loader.php?sid=attack&user2ID=${memberId}`;

        let statusText = member.status.description;
        let statusClass = 'status-okay';
        let dataUntil = '';
        let statusState = member.status.state;

        if (member.status.state === 'Hospital') {
            statusClass = 'status-hospital';
            dataUntil = member.status.until;
            const timeLeft = member.status.until - nowInSeconds;
            statusText = timeLeft > 0 ? `In Hospital (${formatTime(timeLeft)})` : 'Okay';
            if (timeLeft <= 0) statusClass = 'status-okay';

        } else if (member.status.state === 'Traveling') {
            statusClass = 'status-traveling';
            dataUntil = member.status.until;
            const timeLeft = member.status.until - nowInSeconds;
            if (timeLeft <= 0) {
                statusText = `Arrived`;
                statusClass = 'status-okay';
            } else {
                statusText = `${member.status.description} (${formatTime(timeLeft)})`;
            }
        } else if (member.status.state !== 'Okay') {
            statusClass = 'status-other';
        }

        const lastActionTimestamp = member.last_action ? member.last_action.timestamp : null;
        const lastActionText = formatRelativeTime(lastActionTimestamp);

        let claimButtonHtml;
        let rowClass = '';
        const activeClaim = globalActiveClaims[memberId];

        if (activeClaim) {
            rowClass = 'claimed-row';
            if (activeClaim.claimedByUserId === currentAuthUid) {
                claimButtonHtml = `<button id="claim-btn-${memberId}" class="claim-btn claimed-by-me" onclick="unclaimTarget('${memberId}')">Unclaim</button>`;
            } else {
                claimButtonHtml = `<span class="claimed-by-other">${activeClaim.claimedByUserName}</span><br><button id="claim-btn-${memberId}" class="claim-btn claimed-by-other-btn" disabled>Claimed</button>`;
            }
        } else {
            claimButtonHtml = `<button id="claim-btn-${memberId}" class="claim-btn" onclick="claimTarget('${memberId}', '${memberName}')">Claim</button>`;
        }

        tableHtml += `
            <tr id="target-row-${memberId}" class="${rowClass}" data-member-name="${memberName}">
                <td class="col-name"><a href="${profileUrl}" target="_blank">${member.name} (${memberId})</a></td>
                <td class="col-level">${member.level}</td>
                <td class="col-last-action">${lastActionText}</td>
                <td class="col-status ${statusClass}" ${dataUntil ? `data-until="${dataUntil}" data-status-state="${statusState}"` : ''}>${statusText}</td>
                <td class="col-claim">${claimButtonHtml}</td>
                <td class="col-attack"><a id="attack-link-${memberId}" href="${attackUrl}" class="attack-link" target="_blank">Attack</a></td>
            </tr>
        `;
    }

    tableHtml += `</tbody></table>`;

    enemyTargetsContainer.innerHTML = tableHtml;
}

function setupWarClaimsListener() {
    console.log("Setting up real-time listener for war claims...");
    db.collection('warClaims').onSnapshot(snapshot => {
        // Clear previous claims for a full re-sync
        globalActiveClaims = {};

        let highestClaimNumberInSnapshot = localCurrentClaimHitCounter; // Start with current local value

        snapshot.forEach(doc => {
            const claimData = doc.data();
            globalActiveClaims[doc.id] = { // Use doc.id as the targetMemberId
                claimedByUserId: claimData.claimedByUserId,
                claimedByUserName: claimData.claimedByUserName,
                chainHitNumber: claimData.chainHitNumber
            };
            // Update highestClaimNumberInSnapshot if this claim is higher
            if (claimData.chainHitNumber && typeof claimData.chainHitNumber === 'number' && claimData.chainHitNumber > highestClaimNumberInSnapshot) {
                highestClaimNumberInSnapshot = claimData.chainHitNumber;
            }
        });

        // After processing all claims in the snapshot, update the local counter if a higher one was found
        if (highestClaimNumberInSnapshot > localCurrentClaimHitCounter) {
            localCurrentClaimHitCounter = highestClaimNumberInSnapshot;
            console.log(`localCurrentClaimHitCounter updated by listener to: ${localCurrentClaimHitCounter}`);
        }

        console.log("Updated globalActiveClaims:", globalActiveClaims);

        // Re-render the enemy targets table to reflect the latest claims
        // Ensure enemyDataGlobal is available before re-rendering
        if (enemyDataGlobal && enemyDataGlobal.members) {
            displayEnemyTargetsTable(enemyDataGlobal.members);
        } else {
            console.warn("Enemy faction members data not available to re-render table after claim update.");
        }

    }, error => {
        console.error("Error listening to war claims:", error);
    });
}
function rgbToHex(r, g, b) {
    return (
        "#" +
        ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
    );
}

function get_ff_colour(value) {
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
    return rgbToHex(r, g, b);
}

function get_contrast_color(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = r * 0.299 + g * 0.587 + b * 0.114;
    return brightness > 126 ? "black" : "white";
}

function get_difficulty_text(ff) {
    if (ff <= 1) return "Extremely easy";
    else if (ff <= 2) return "Easy";
    else if (ff <= 3.5) return "Moderately difficult";
    else if (ff <= 4.5) return "Difficult";
    else return "May be impossible";
}


// NEW: Function to format time from timestamp
function formatTornTime(timestamp) {
  const date = new Date(timestamp * 1000); // Torn API timestamps are in seconds
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

//       Prevents "blinking" by only updating the display after a successful fetch
function areTargetSetsIdentical(set1, set2) {
    if (set1.length !== set2.length) {
        return false;
    }
    if (set1.length === 0) { // Both empty sets are identical
        return true;
    }
    const sortedSet1 = [...set1].sort();
    const sortedSet2 = [...set2].sort();
    for (let i = 0; i < sortedSet1.length; i++) {
        if (sortedSet1[i] !== sortedSet2[i]) {
            return false;
        }
    }
    return true;
}

function formatRelativeTime(timestampInSeconds) {
    if (!timestampInSeconds || timestampInSeconds === 0) {
        return "N/A";
    }

    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const diffSeconds = now - timestampInSeconds;

    if (diffSeconds < 60) {
        return "Now"; // Less than 1 minute
    } else if (diffSeconds < 3600) { // Less than 1 hour (60 minutes)
        const minutes = Math.floor(diffSeconds / 60);
        return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
    } else if (diffSeconds < 86400) { // Less than 1 day (24 hours)
        const hours = Math.floor(diffSeconds / 3600);
        return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else { // 1 day or more
        const days = Math.floor(diffSeconds / 86400);
        return `${days} day${days === 1 ? '' : 's'} ago`;
    }
}

/**
 * Calculates and updates the width and text of a chain progress bar.
 * @param {number} currentHits - The current number of hits in the chain.
 * @param {HTMLElement} progressBarElement - The DOM element of the progress bar to update.
 * @param {string} textElementId - The ID of the text element to update.
 */
function updateChainProgress(currentHits, progressBarElement, textElementId) {
    if (!progressBarElement) return;

    const textElement = document.getElementById(textElementId);
    const milestones = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];
    const hits = Number(currentHits);

    if (isNaN(hits)) {
        progressBarElement.style.width = '0%';
        if (textElement) textElement.textContent = '';
        return;
    }

    let nextMilestone = milestones.find(m => m > hits);
    
    if (nextMilestone === undefined) {
        progressBarElement.style.width = '100%';
        if (textElement) textElement.textContent = 'MAX';
        return;
    }

    let previousMilestone = 0;
    for (let i = milestones.length - 1; i >= 0; i--) {
        if (milestones[i] <= hits) {
            previousMilestone = milestones[i];
            break;
        }
    }

    const totalForMilestone = nextMilestone - previousMilestone;
    const progressInMilestone = hits - previousMilestone;
    let percentage = 0;
    if (totalForMilestone > 0) {
        percentage = (progressInMilestone / totalForMilestone) * 100;
    }

    progressBarElement.style.width = percentage + '%';
    if (textElement) {
        textElement.textContent = Math.floor(percentage) + '%';
    }
}

/*
function setupFactionHitsListener(db, factionId) {
	console.log("setupFactionHitsListener called with factionId:", factionId); // ADD THIS LINE
    // These are the HTML elements we created earlier
    const tcHitsElement = document.getElementById('tc-hits-value');
    const abroadHitsElement = document.getElementById('abroad-hits-value');

    // If the elements don't exist on the page, stop the function to prevent errors.
    if (!tcHitsElement || !abroadHitsElement) {
        console.error("Faction hits display elements not found on the page.");
        return;
    }

    // This is the Firestore query. It looks for all users that match your faction ID.
    const factionQuery = db.collection('users').where('faction_id', '==', factionId);

    // .onSnapshot() creates a real-time listener.
    // This code will run automatically every time the data changes for any user in your faction.
    factionQuery.onSnapshot(snapshot => {
        let totalTCEnergy = 0;
        let totalAbroadEnergy = 0;

        // Loop through every member found by the query
        snapshot.forEach(doc => {
            const memberData = doc.data();

            // Check if the member has energy data to avoid errors
            if (memberData.energy && typeof memberData.energy.current === 'number') {
                // If the 'traveling' field is true, add their energy to the 'Abroad' total
                if (memberData.traveling === true) {
                    totalAbroadEnergy += memberData.energy.current;
                } else {
                    // Otherwise, add it to the 'Torn City' total
                    totalTCEnergy += memberData.energy.current;
                }
            }
        });

        // Calculate the number of hits (1 hit = 25 energy)
        // Math.floor() rounds down to the nearest whole number.
        const tcHits = Math.floor(totalTCEnergy / 25);
        const abroadHits = Math.floor(totalAbroadEnergy / 25);

        // Update the numbers on your webpage
        tcHitsElement.textContent = tcHits.toLocaleString(); // .toLocaleString() adds commas for thousands
        abroadHitsElement.textContent = abroadHits.toLocaleString();

    }, error => {
        // This will log any errors if the listener fails.
        console.error("Error with faction hits listener:", error);
        tcHitsElement.textContent = "Error";
        abroadHitsElement.textContent = "Error";
    });
}
*/

// NEW/MODIFIED: Function to populate enemy member checkboxes (Big Hitter Watchlist)
function populateEnemyMemberCheckboxes(enemyMembers, savedWatchlistMembers = []) {
    if (!bigHitterWatchlistContainer) {
        console.error("HTML Error: Cannot find element with ID 'bigHitterWatchlistContainer'.");
        return;
    }

    bigHitterWatchlistContainer.innerHTML = ''; // Clear existing checkboxes

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


async function updateFriendlyMembersTable(apiKey, firebaseAuthUid) {
    const tbody = document.getElementById('friendly-members-tbody');
    if (!tbody) {
        console.error("HTML Error: Friendly members table body (tbody) not found!");
        return;
    }

    tbody.innerHTML = '<tr><td colspan="12" style="text-align:center; padding: 20px;">Loading and sorting faction member stats...</td></tr>';

    try {
        const userProfileDocRef = db.collection('userProfiles').doc(firebaseAuthUid);
        const userProfileDoc = await userProfileDocRef.get();
        if (!userProfileDoc.exists) {
            tbody.innerHTML = '<tr><td colspan="12" style="text-align:center; color: red;">Error: User profile not found.</td></tr>';
            return;
        }
        const userFactionId = userProfileDoc.data().faction_id;

        if (!userFactionId) {
            tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;">Not in a faction or Faction ID not stored.</td></tr>';
            return;
        }

        const factionMembersApiUrl = `https://api.torn.com/v2/faction/${userFactionId}?selections=members&key=${apiKey}&comment=MyTornPA_FriendlyMembers`;
        const factionResponse = await fetch(factionMembersApiUrl);
        const factionData = await factionResponse.json();

        if (!factionResponse.ok || factionData.error) {
            tbody.innerHTML = `<tr><td colspan="12" style="text-align:center; color: red;">Error: ${factionData.error?.error || 'API Error'}.</td></tr>`;
            return;
        }

        const membersArray = Object.values(factionData.members || {});
        if (membersArray.length === 0) {
            tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;">No members found.</td></tr>';
            return;
        }

        // --- START OF MODIFIED LOGIC ---
        const allMemberTornIds = membersArray.map(member => String(member.user_id || member.id));
        const CHUNK_SIZE = 10; // Firestore 'in' query limit is 10
        const firestoreFetchPromises = [];
        const allMemberFirebaseData = {}; // To store all fetched Firebase data indexed by Torn ID

        // Divide member IDs into chunks and create a fetch promise for each chunk
        for (let i = 0; i < allMemberTornIds.length; i += CHUNK_SIZE) {
            const chunk = allMemberTornIds.slice(i, i + CHUNK_SIZE);
            const query = db.collection('users').where(firebase.firestore.FieldPath.documentId(), 'in', chunk);
            firestoreFetchPromises.push(query.get());
        }

        // Wait for all Firestore queries to complete
        const snapshots = await Promise.all(firestoreFetchPromises);

        // Process all snapshots and populate allMemberFirebaseData
        snapshots.forEach(snapshot => {
            snapshot.forEach(doc => {
                allMemberFirebaseData[doc.id] = doc.data();
            });
        });
        // --- END OF MODIFIED LOGIC ---

        // Step 1: Process all members to get their data and calculated stats
        const processedMembers = membersArray.map((memberTornData) => {
            const memberId = String(memberTornData.user_id || memberTornData.id); // Ensure memberId is string for lookup
            if (!memberId) return null;

            const memberFirebaseData = allMemberFirebaseData[memberId] || {}; // Get data from our new combined object
            
            const strengthNum = parseFloat(String(memberFirebaseData.battlestats?.strength || 0).replace(/,/g, ''));
            const speedNum = parseFloat(String(memberFirebaseData.battlestats?.speed || 0).replace(/,/g, ''));
            const dexterityNum = parseFloat(String(memberFirebaseData.battlestats?.dexterity || 0).replace(/,/g, ''));
            const defenseNum = parseFloat(String(memberFirebaseData.battlestats?.defense || 0).replace(/,/g, ''));
            const totalStats = strengthNum + speedNum + dexterityNum + defenseNum;

            return { tornData: memberTornData, firebaseData: memberFirebaseData, totalStats: totalStats };
        }).filter(m => m !== null); // Filter out any null entries if IDs were missing

        // Step 2: Sort the processed members by totalStats in descending order
        processedMembers.sort((a, b) => b.totalStats - a.totalStats);

        // Step 3: Build the HTML from the sorted data
        let allRowsHtml = '';
        for (const member of processedMembers) {
			console.log('WORKING PAGE - Firebase Data:', member.firebaseData);
            const { tornData, firebaseData, totalStats } = member;
            const memberId = tornData.user_id || tornData.id;
            const name = tornData.name || 'Unknown';
            const lastAction = tornData.last_action?.relative || 'N/A';
            const strength = firebaseData.battlestats?.strength?.toLocaleString() || 'N/A';
            const dexterity = firebaseData.battlestats?.dexterity?.toLocaleString() || 'N/A';
            const speed = firebaseData.battlestats?.speed?.toLocaleString() || 'N/A';
            const defense = firebaseData.battlestats?.defense?.toLocaleString() || 'N/A';
            const nerve = `${firebaseData.nerve?.current ?? 'N/A'} / ${firebaseData.nerve?.maximum ?? 'N/A'}`;
            const energy = `${firebaseData.energy?.current ?? 'N/A'} / ${firebaseData.energy?.maximum ?? 'N/A'}`;
            const isRevivable = (tornData.revive_setting || '').trim();
            const drugCooldownValue = firebaseData.cooldowns?.drug ?? 0;
            const statusState = tornData.status?.state || '';
            const originalDescription = tornData.status?.description || 'N/A';
            let formattedStatus = originalDescription;
            let statusClass = 'status-okay';
            if (statusState === 'Hospital') { statusClass = 'status-hospital'; }
            else if (statusState === 'Abroad') { statusClass = 'status-abroad'; }
            else if (statusState !== 'Okay') { statusClass = 'status-other'; }

            let drugCooldown, drugCooldownClass = '';
            if (drugCooldownValue > 0) {
                const hours = Math.floor(drugCooldownValue / 3600);
                const minutes = Math.floor((drugCooldownValue % 3600) / 60);
                drugCooldown = `${hours > 0 ? `${hours}hr` : ''} ${minutes > 0 ? `${minutes}m` : ''}`.trim() || '<1m';
                if (drugCooldownValue > 18000) drugCooldownClass = 'status-hospital'; else if (drugCooldownValue > 7200) drugCooldownClass = 'status-other'; else drugCooldownClass = 'status-okay';
            } else {
                drugCooldown = 'None 🍁'; drugCooldownClass = 'status-okay';
            }

            let revivableClass = '';
            if (isRevivable === 'Everyone') { revivableClass = 'revivable-text-green'; }
            else if (isRevivable === 'Friends & faction') { revivableClass = 'revivable-text-orange'; }
            else if (isRevivable === 'No one') { revivableClass = 'revivable-text-red'; }

            allRowsHtml += `
                <tr data-id="${memberId}">
                    <td><a href="https://www.torn.com/profiles.php?XID=${memberId}" target="_blank">${name}</a></td>
                    <td>${lastAction}</td>
                    <td>${strength}</td>
                    <td>${dexterity}</td>
                    <td>${speed}</td>
                    <td>${defense}</td>
                    <td>${formatBattleStats(totalStats)}</td>
                    <td class="${statusClass}">${formattedStatus}</td>
                    <td class="nerve-text">${nerve}</td>
                    <td class="energy-text">${energy}</td>
                    <td class="${drugCooldownClass}">${drugCooldown}</td>
                    <td class="${revivableClass}">${isRevivable}</td>
                </tr>
            `;
        }

        tbody.innerHTML = allRowsHtml.length > 0 ? allRowsHtml : '<tr><td colspan="12">No members to display.</td></tr>';

        applyStatColorCoding();
    } catch (error) {
        console.error("Fatal error in updateFriendlyMembersTable:", error);
        tbody.innerHTML = `<tr><td colspan="12" style="color:red;">A fatal error occurred: ${error.message}.</td></tr>`;
    }
}
async function displayFactionMembersInChatTab(factionMembersApiData, targetDisplayElement) {
    if (!targetDisplayElement) {
        console.error("HTML Error: Target display element not provided for faction members list.");
        return;
    }
    targetDisplayElement.innerHTML = `<p style="text-align:center; padding: 10px;">Loading faction members details...</p>`;

    // Get the current user's friends list first
    let friendsSet = new Set();
    const currentUser = auth.currentUser;
    if (currentUser) {
        try {
            const friendsSnapshot = await db.collection('userProfiles').doc(currentUser.uid).collection('friends').get();
            friendsSnapshot.forEach(doc => friendsSet.add(doc.id));
        } catch (error) {
            console.error("Error fetching friends list:", error);
        }
    }

    if (!factionMembersApiData || typeof factionMembersApiData !== 'object' || Object.keys(factionMembersApiData).length === 0) {
        targetDisplayElement.innerHTML = `<p style="text-align:center; padding: 10px;">No faction members found.</p>`;
        return;
    }

    const membersArray = Object.values(factionMembersApiData);
    const rankOrder = { "Leader": 0, "Co-leader": 1, "Member": 99, "Applicant": 100 };
    membersArray.sort((a, b) => {
        const orderA = rankOrder[a.position] !== undefined ? rankOrder[a.position] : rankOrder["Member"];
        const orderB = rankOrder[b.position] !== undefined ? rankOrder[b.position] : rankOrder["Member"];
        if (orderA !== orderB) { return orderA - orderB; }
        return a.name.localeCompare(b.name);
    });

    const membersListContainer = document.createElement('div');
    membersListContainer.classList.add('members-list-container');
    targetDisplayElement.innerHTML = '';
    targetDisplayElement.appendChild(membersListContainer);

    for (const member of membersArray) {
        const tornPlayerId = member.id;
        const memberName = member.name;
        const memberRank = member.position;
        const isFriend = friendsSet.has(tornPlayerId);

        // --- CORRECTED: This now generates the button with the person icon and a +/- sign ---
        let actionButtonHtml = '';
        if (isFriend) {
            actionButtonHtml = `
                <button class="remove-friend-button" data-member-id="${tornPlayerId}" title="Remove Friend">
                    👤<span class="plus-sign">-</span>
                </button>
            `;
        } else {
            actionButtonHtml = `
                <button class="add-member-button" data-member-id="${tornPlayerId}" title="Add Friend">
                    👤<span class="plus-sign">+</span>
                </button>
            `;
        }
        
        const memberItemDiv = document.createElement('div');
        memberItemDiv.classList.add('member-item');
        if (memberRank === "Leader" || memberRank === "Co-leader") {
            memberItemDiv.classList.add('leader-member');
        }

        memberItemDiv.innerHTML = `
            <span class="member-rank">${memberRank}</span>
            <div class="member-identity">
                <img src="../../images/default_profile_icon.png" alt="${memberName}'s profile picture" class="member-profile-pic">
                <span class="member-name">${memberName}</span>
            </div>
            <div class="member-actions">
                ${actionButtonHtml}
                <button class="item-button message-button" data-member-id="${tornPlayerId}" title="Send Message">✉️</button>
            </div>
        `;
        
        membersListContainer.appendChild(memberItemDiv);

        (async () => {
            try {
                const docRef = db.collection('users').doc(String(tornPlayerId));
                const docSnap = await docRef.get();
                if (docSnap.exists) {
                    const firebaseMemberData = docSnap.data();
                    const profileImageUrl = firebaseMemberData.profile_image || '../../images/default_profile_icon.png';
                    const imgElement = memberItemDiv.querySelector('.member-profile-pic');
                    if (imgElement) imgElement.src = profileImageUrl;
                }
            } catch (error) {
                console.error(`[Firestore Error] Failed to fetch profile pic for ${tornPlayerId}:`, error);
            }
        })();
    }
}

async function fetchAndDisplayMemberDetails(memberId) {
    console.log(`[DEBUG] Initiating fetch for member ID: "${memberId}"`);

    const detailPanel = document.getElementById('selectedMemberDetailPanel');
    if (!detailPanel) {
        console.error("HTML Error: Cannot find the detail panel element.");
        return;
    }

    detailPanel.innerHTML = `<div class="detail-panel-placeholder"><h4>Loading Details...</h4></div>`;
    detailPanel.classList.add('detail-panel-loaded');

    let tornApiData = null;
    let apiErrorMessage = '';

    try {
        const querySnapshot = await db.collection('userProfiles').where('tornProfileId', '==', memberId).get();

        if (querySnapshot.empty) {
            detailPanel.innerHTML = `
                <h4>Details Unavailable</h4>
                <p>This member has not registered on this site, or their Torn ID is not linked in our database.</p>
                <p><a href="https://www.torn.com/profiles.php?XID=${memberId}" target="_blank">View Torn Profile (Limited Info)</a></p>
            `;
            console.warn(`[DEBUG] No Firebase userProfile found for Torn ID: ${memberId}.`);
            return;
        }

        const userDoc = querySnapshot.docs[0];
        const memberDataFromFirebase = userDoc.data();
        const memberApiKey = memberDataFromFirebase.tornApiKey;
        const preferredName = memberDataFromFirebase.preferredName || 'Unknown';

        console.log(`[DEBUG] Found Firebase profile for ${preferredName} [${memberId}]. API Key available: ${memberApiKey ? 'Yes' : 'No'}`);
        console.log(`[DEBUG] Member API Key from Firebase: "${memberApiKey}"`); // Verify the key used

        if (!memberApiKey) {
            detailPanel.innerHTML = `
                <h4>API Key Missing for ${preferredName} [${memberId}]</h4>
                <p>This member has registered but has not provided their Torn API key (or it's invalid).</p>
                <p>Cannot fetch detailed stats.</p>
                <p><a href="https://www.torn.com/profiles.php?XID=${memberId}" target="_blank">View Torn Profile (Limited Info)</a></p>
            `;
            return;
        }

        // Selections for the API call
        const selections = 'profile,personalstats,battlestats,workstats,cooldowns,bars'; // Keeping 'bars' to ensure Nerve/Energy are requested if needed from there.
        const apiUrl = `https://api.torn.com/user/${memberId}?selections=${selections}&key=${memberApiKey}&comment=MyTornPA_MemberDetails`;

        console.log(`[DEBUG] Constructed Torn API URL: ${apiUrl}`);

        const response = await fetch(apiUrl);
        console.log(`[DEBUG] Torn API HTTP Response Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: "Failed to parse API error response." }));
            console.error(`[DEBUG] Torn API HTTP Error details:`, errorData);
            let errorMessage = `Torn API Error: ${response.status} ${response.statusText}`;
            if (errorData && errorData.error && errorData.error.error) {
                errorMessage += ` - ${errorData.error.error}`;
            }
            throw new Error(errorMessage);
        } else {
            tornApiData = await response.json();
            console.log(`[DEBUG] Full Torn API Response Data for ${memberId}:`, tornApiData);

            if (tornApiData.error) {
                console.error(`[DEBUG] Torn API Data Error details:`, tornApiData.error);
                if (tornApiData.error.code === 2 || tornApiData.error.code === 10) {
                    apiErrorMessage = `The member's API key is invalid or lacks sufficient permissions. (Error: ${tornApiData.error.error})`;
                } else {
                    throw new Error(`Torn API Data Error: ${tornApiData.error.error}`);
                }
            }
        }

        if (!tornApiData || Object.keys(tornApiData).length === 0) {
            throw new Error("Failed to retrieve any meaningful data after API call.");
        }

        const personalStats = tornApiData.personalstats || {};
        const jobData = tornApiData.job || {};
        const cooldowns = tornApiData.cooldowns || {};
        
        // Extract nerve and energy from tornApiData.bars or directly if they appear there (fallback is handled below)
        const barsData = tornApiData.bars || {};
        const nerve = barsData.nerve || tornApiData.nerve || {}; // Fallback to tornApiData.nerve if not in bars
        const energy = barsData.energy || tornApiData.energy || {}; // Fallback to tornApiData.energy if not in bars

        // Access name, player_id, last_action, status directly from tornApiData (root)
        const memberName = tornApiData.name || 'Unknown';
        const memberPlayerId = tornApiData.player_id || 'N/A';
        const memberLevel = tornApiData.level || 'N/A'; // Also use level from root
        const memberProfileImage = tornApiData.profile_image || ''; // Also use profile_image from root

        const lastActionData = tornApiData.last_action || {}; // This is the object for last_action
        const mainStatusData = tornApiData.status || {}; // This is the object for the main status (hospital, traveling)

        console.log("[DEBUG] Extracted Profile Data (Root-level values used for Name/ID/Level/Image):", tornApiData.name, tornApiData.player_id, tornApiData.level, tornApiData.profile_image);
        console.log("[DEBUG] Extracted Last Action Data:", lastActionData);
        console.log("[DEBUG] Extracted Main Status Data:", mainStatusData);
        console.log("[DEBUG] Extracted Personal Stats Data:", personalStats);
        console.log("[DEBUG] Extracted Job Data (from 'tornApiData.job'):", jobData);
        console.log("[DEBUG] Extracted Cooldowns Data (raw 'cooldowns' object):", cooldowns);
        console.log("[DEBUG] Extracted Nerve Data (from bars/root object):", nerve);
        console.log("[DEBUG] Extracted Energy Data (from bars/root object):", energy);
        console.log("[DEBUG] Top-level Strength (for battle stats):", tornApiData.strength);
        console.log("[DEBUG] Top-level Manual Labor (for work stats):", tornApiData.manual_labor);


        // --- BATTLE STATS EXTRACTION (Prioritizing personalstats or root, then default 0) ---
        const strength = (personalStats.strength || tornApiData.strength || 0).toLocaleString();
        const speed = (personalStats.speed || tornApiData.speed || 0).toLocaleString();
        const dexterity = (personalStats.dexterity || tornApiData.dexterity || 0).toLocaleString();
        const defense = (personalStats.defense || tornApiData.defense || 0).toLocaleString();

        console.log(`[DEBUG] Final Battle Stats: Strength: ${strength}, Speed: ${speed}, Dexterity: ${dexterity}, Defense: ${defense}`);

        // --- WORK STATS EXTRACTION (Prioritizing personalstats or root, then default 0) ---
        const manuelLabor = (personalStats.manuallabor || tornApiData.manual_labor || 0).toLocaleString();
        const intelligence = (personalStats.intelligence || tornApiData.intelligence || 0).toLocaleString();
        const endurance = (personalStats.endurance || tornApiData.endurance || 0).toLocaleString();
        
        const job = jobData.company_name && jobData.job ? `${jobData.company_name} (${jobData.job})` : 'N/A';
        const jobEfficiency = jobData.company_efficiency ? `${jobData.company_efficiency}%` : 'N/A';

        console.log(`[DEBUG] Final Work Stats: Job: ${job}, Efficiency: ${jobEfficiency}, ML: ${manuelLabor}, Int: ${intelligence}, End: ${endurance}`);

        // Nerve and Energy display values
        const nerveCurrent = nerve.current !== undefined ? nerve.current : 'N/A';
        const nerveMax = nerve.maximum !== undefined ? nerve.maximum : '';
        const nerveGain = nerve.nerve_regen !== undefined ? `+${nerve.nerve_regen}/5min` : '';
        const nerveDisplay = nerveCurrent === 'N/A' ? 'Not available' : `${nerveCurrent}${nerveMax ? '/' + nerveMax : ''} ${nerveGain}`.trim();

        const energyCurrent = energy.current !== undefined ? energy.current : 'N/A';
        const energyMax = energy.maximum !== undefined ? energy.maximum : '';
        const energyGain = energy.energy_regen !== undefined ? `+${energy.energy_regen}/10min` : '';
        const energyDisplay = energyCurrent === 'N/A' ? 'Not available' : `${energyCurrent}${energyMax ? '/' + energyMax : ''} ${energyGain}`.trim();

        let cooldownsHtml = ''; // Will build this as list items for 3 columns
        if (Object.keys(cooldowns).length > 0) {
            for (const key in cooldowns) {
                if (cooldowns.hasOwnProperty(key)) {
                    const timeLeft = cooldowns[key];
                    let displayValue;
                    if (typeof timeLeft === 'number' && timeLeft > 0) {
                        displayValue = formatTime(timeLeft);
                    } else if (typeof timeLeft === 'number' && timeLeft === 0) {
                        displayValue = 'Ready';
                    } else {
                        displayValue = 'N/A';
                    }
                    cooldownsHtml += `<li><strong>${key.replace(/_/g, ' ')}:</strong> ${displayValue}</li>`;
                }
            }
        } else {
            cooldownsHtml += '<li>No active cooldowns.</li>';
        }

        console.log(`[DEBUG] Final Cooldowns HTML: ${cooldownsHtml}`);

        // Use the new lastActionData object directly
        const lastActionTimestamp = lastActionData.timestamp ? lastActionData.timestamp : null;
        const lastActionText = formatRelativeTime(lastActionTimestamp);

        // Use the new mainStatusData object directly
        let statusText = mainStatusData.description || 'Unknown';
        let statusClass = 'status-okay';

        if (mainStatusData) { // Check if mainStatusData is not null/undefined
            if (mainStatusData.state === 'Hospital') {
                const timeLeft = mainStatusData.until - Math.floor(Date.now() / 1000);
                statusText = `In Hospital (${formatTime(timeLeft)})`;
                statusClass = 'status-hospital';
            } else if (mainStatusData.state === 'Traveling') {
                const timeLeft = mainStatusData.until - Math.floor(Date.now() / 1000);
                statusText = `${mainStatusData.description} (${formatTime(timeLeft)})`;
                statusClass = 'status-traveling';
            } else if (mainStatusData.state !== 'Okay') {
                statusText = mainStatusData.description;
                statusClass = 'status-other';
            }
        }
        console.log(`[DEBUG] Final Profile Info: Last Action: ${lastActionText}, Status: ${statusText}`);

        let overallAccessMessage = '';
        if (apiErrorMessage) {
            overallAccessMessage = `<p class="member-detail-error-message">Note: ${apiErrorMessage}</p>`;
        }

        // --- NEW HTML STRUCTURE FOR PROFESSIONAL LAYOUT ---
        const detailsHtml = `
            <div class="member-detail-header">
                <div class="member-header-top-row">
                    <div class="member-stat-block member-stat-block-small">
                        <h5>Energy:</h5>
                        <p>${energyDisplay}</p>
                    </div>
                    ${memberProfileImage ? `<img src="${memberProfileImage}" alt="${memberName}" class="member-detail-profile-image">` : ''}
                    <div class="member-stat-block member-stat-block-small">
                        <h5>Nerve:</h5>
                        <p>${nerveDisplay}</p>
                    </div>
                </div>
                <div class="member-detail-name-id">${memberName} [${memberPlayerId}]</div>
            </div>

            ${overallAccessMessage}

            <div class="member-detail-info-row"> 
                <p class="member-detail-info-paragraph">Last Action: ${lastActionText}</p>
                <p class="member-detail-info-paragraph">Status: <span class="${statusClass}">${statusText}</span></p>
            </div>

            <div class="member-stats-group-row">
                <div class="member-stat-block">
                    <h5>Battle Stats:</h5>
                    <div class="member-stats-grid">
                        <span>Strength:</span> <span>${strength}</span>
                        <span>Defense:</span> <span>${defense}</span>
                        <span>Speed:</span> <span>${speed}</span>
                        <span>Dexterity:</span> <span>${dexterity}</span>
                    </div>
                </div>
                <div class="member-stat-block">
                    <h5>Work Stats:</h5>
                    <div class="member-stats-grid">
                        <span>Job:</span> <span>${job}</span>
                        <span>Efficiency:</span> <span>${jobEfficiency}</span>
                        <span>Manual Labor:</span> <span>${manuelLabor}</span>
                        <span>Intelligence:</span> <span>${intelligence}</span>
                        <span>Endurance:</span> <span>${endurance}</span>
                    </div>
                </div>
            </div>

            <div class="member-cooldowns-block">
                <h5>Cool downs</h5>
                <ul class="member-cooldowns-list">
                    ${cooldownsHtml}
                </ul>
            </div>
        `;

        detailPanel.innerHTML = detailsHtml;

    } catch (error) {
        console.error("Error fetching member details:", error);
        detailPanel.innerHTML = `<h4>Error</h4><p>Could not load member details.</p><p><i>${error.message}</i></p>`;
    }
}
// UPDATED: Now performs its own API call to fetch current chain data regularly.
async function fetchAndDisplayChainData() {
    // Only proceed if API key and faction ID are available globally.
    if (!userApiKey || !globalYourFactionID) {
        console.warn("API key or Faction ID not available for fetching chain data.");
        currentLiveChainSeconds = 0;
        lastChainApiFetchTime = 0;
        globalChainStartedTimestamp = 0;
        globalChainCurrentNumber = 'N/A';
        if (currentChainNumberDisplay) currentChainNumberDisplay.textContent = 'N/A';
        if (chainStartedDisplay) chainStartedDisplay.textContent = 'N/A';
        if (chainTimerDisplay) chainTimerDisplay.textContent = 'Chain Over';
        return;
    }

    try {
        const chainApiUrl = `https://api.torn.com/v2/faction/${globalYourFactionID}?selections=chain&key=${userApiKey}&comment=MyTornPA_ChainDataDisplay`;
        const response = await fetch(chainApiUrl);
        const data = await response.json();

        if (!response.ok || data.error) {
            const errorMessage = data.error ? data.error.error : response.statusText;
            throw new Error(`Torn API Error fetching chain data: ${errorMessage}`);
        }

        const chainData = data.chain;
        console.log("Chain API Data (fetched directly by fetchAndDisplayChainData):", chainData); // Log for debugging

        if (chainData) {
            // Store the relevant values globally for updateAllTimers to use
            currentLiveChainSeconds = chainData.timeout || 0;
            lastChainApiFetchTime = Date.now(); // Store current time in milliseconds
            globalChainStartedTimestamp = chainData.start || 0;
            globalChainCurrentNumber = chainData.current || 'N/A'; // Store the actual chain number

            // Update the chain number display directly
            if (currentChainNumberDisplay) {
                currentChainNumberDisplay.textContent = globalChainCurrentNumber;
            }

            // Logic for Chain Started time display
            if (chainStartedDisplay) {
                const newChainStartedTimestamp = chainData.start || 0;
                if (newChainStartedTimestamp > 0 && newChainStartedTimestamp !== globalChainStartedTimestamp) {
                    globalChainStartedTimestamp = newChainStartedTimestamp;
                    chainStartedDisplay.textContent = `Started: ${formatTornTime(globalChainStartedTimestamp)}`;
                } else if (newChainStartedTimestamp === 0 && globalChainStartedTimestamp !== 0) {
                    globalChainStartedTimestamp = 0;
                    chainStartedDisplay.textContent = 'Started: N/A';
                } else if (newChainStartedTimestamp === 0 && chainStartedDisplay.textContent === 'Started: N/A') {
                    // No change needed
                }
            }

        } else {
            console.warn("Chain data not found within API response.");
            currentLiveChainSeconds = 0;
            lastChainApiFetchTime = 0;
            globalChainStartedTimestamp = 0;
            globalChainCurrentNumber = 'N/A';
            if (currentChainNumberDisplay) currentChainNumberDisplay.textContent = 'N/A';
            if (chainStartedDisplay) chainStartedDisplay.textContent = 'N/A';
        }
    } catch (error) {
        console.error('Error in fetchAndDisplayChainData:', error);
        currentLiveChainSeconds = 0;
        lastChainApiFetchTime = 0;
        globalChainStartedTimestamp = 0;
        globalChainCurrentNumber = 'N/A';
        if (currentChainNumberDisplay) currentChainNumberDisplay.textContent = 'Error';
        if (chainStartedDisplay) chainStartedDisplay.textContent = 'Error';
        if (chainTimerDisplay) chainTimerDisplay.textContent = 'Error';
    }
}
function populateWarStatusDisplay(warData = {}) {
    if (warEnlistedStatus) warEnlistedStatus.textContent = warData.toggleEnlisted ? 'Yes' : 'No';
    if (warTermedStatus) warTermedStatus.textContent = warData.toggleTermedWar ? 'Yes' : 'No';
    if (warTermedWinLoss) warTermedWinLoss.textContent = warData.toggleTermedWinLoss ? 'Win' : 'Loss';
    if (warChainingStatus) warChainingStatus.textContent = warData.toggleChaining ? 'Yes' : 'No';
    if (warNoFlyingStatus) warNoFlyingStatus.textContent = warData.toggleNoFlying ? 'Yes' : 'No';
    if (warTurtleStatus) warTurtleStatus.textContent = warData.toggleTurtleMode ? 'Yes' : 'No';
    if (warNextChainTimeStatus) warNextChainTimeStatus.textContent = warData.nextChainTimeInput || 'N/A';
    if (currentTeamLeadDisplay) currentTeamLeadDisplay.textContent = warData.currentTeamLead || 'N/A'; // <-- ADD THIS LINE
}

function loadWarStatusForEdit(warData = {}) {
    if (toggleEnlisted) toggleEnlisted.checked = warData.toggleEnlisted || false;
    if (toggleTermedWar) toggleTermedWar.checked = warData.toggleTermedWar || false;
    if (toggleTermedWinLoss) toggleTermedWinLoss.checked = warData.toggleTermedWinLoss || false;
    if (toggleChaining) toggleChaining.checked = warData.toggleChaining || false;
    if (toggleNoFlying) toggleNoFlying.checked = warData.toggleNoFlying || false;
    if (toggleTurtleMode) toggleTurtleMode.checked = warData.toggleTurtleMode || false;
    if (nextChainTimeInput) nextChainTimeInput.value = warData.nextChainTimeInput || '';
    if (currentTeamLeadInput) currentTeamLeadInput.value = warData.currentTeamLead || ''; // <-- ADD THIS LINE
    if (enemyFactionIDInput) enemyFactionIDInput.value = warData.enemyFactionID || '';
}


// NEW: Autocomplete setup for the Current Team Lead input
function setupTeamLeadAutocomplete(allFactionMembers) {
    const currentTeamLeadInput = document.getElementById('currentTeamLeadInput');
    if (!currentTeamLeadInput) return;

    let autocompleteList = null; 
    let currentFocus = -1;

    const filterMembers = (searchTerm) => {
        searchTerm = searchTerm.toLowerCase();
        if (!allFactionMembers || typeof allFactionMembers !== 'object') return [];
        return Object.values(allFactionMembers).filter(member => 
            member.name && member.name.toLowerCase().startsWith(searchTerm)
        ).sort((a, b) => a.name.localeCompare(b.name));
    };

    const showSuggestions = (arr) => {
        closeAllLists();
        if (!arr.length) return false;

        autocompleteList = document.createElement("DIV");
        autocompleteList.setAttribute("id", currentTeamLeadInput.id + "-autocomplete-list");
        autocompleteList.setAttribute("class", "autocomplete-items");
        currentTeamLeadInput.parentNode.appendChild(autocompleteList);

        arr.forEach(member => {
            const item = document.createElement("DIV");
            item.innerHTML = `<strong>${member.name.substr(0, currentTeamLeadInput.value.length)}</strong>`;
            item.innerHTML += member.name.substr(currentTeamLeadInput.value.length);
            item.innerHTML += `<input type="hidden" value="${member.name}">`;
            
            item.addEventListener("click", function(e) {
                currentTeamLeadInput.value = this.getElementsByTagName("input")[0].value;
                closeAllLists();
                currentTeamLeadInput.focus();
            });
            autocompleteList.appendChild(item);
        });
        return true;
    };

    currentTeamLeadInput.addEventListener("input", function(e) {
        const matches = filterMembers(this.value);
        showSuggestions(matches);
        currentFocus = -1;
    });

    currentTeamLeadInput.addEventListener("keydown", function(e) {
        let x = document.getElementById(this.id + "-autocomplete-list");
        if (x) x = x.getElementsByTagName("div");

        if (e.keyCode == 40) { // DOWN
            currentFocus++;
            addActive(x);
        } else if (e.keyCode == 38) { // UP
            currentFocus--;
            addActive(x);
        } else if (e.keyCode == 13) { // ENTER
            e.preventDefault();
            if (currentFocus > -1) {
                if (x) x[currentFocus].click();
            } else {
                closeAllLists();
            }
        } else if (e.keyCode == 27) { // ESC
            closeAllLists();
        }
    });

    const addActive = (x) => {
        if (!x) return false;
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        x[currentFocus].classList.add("autocomplete-active");
    };

    const removeActive = (x) => {
        for (let i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    };

    const closeAllLists = (elmnt) => {
        const x = document.getElementsByClassName("autocomplete-items");
        for (let i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != currentTeamLeadInput) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
        currentFocus = -1;
    };

    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
}

function setupMemberClickEvents() {
    if (!friendlyMembersTbody) {
        console.error("Cannot set up click events, friendly members table body not found.");
        return;
    }

    friendlyMembersTbody.addEventListener('click', (event) => {
        // This finds the specific table row (tr) that you clicked on
        const clickedRow = event.target.closest('tr');
        if (!clickedRow) {
            return; 
        }

        // This reads the ID from the 'data-id' attribute of that row
        const memberId = clickedRow.dataset.id;

        if (memberId) {
            // If it finds an ID, it calls the function to fetch the details
            fetchAndDisplayMemberDetails(memberId);
        } else {
            // If you see this error in the F12 console, it means the 'data-id' 
            // attribute is missing from your <tr> elements in the HTML.
            console.error("Clicked row is missing the 'data-id' attribute.");
        }
    });
}

	function setupToggleSelectionEvents() {
    // This function is currently not defined.
    // Its purpose is to set up event listeners for various toggles or selections on the page.
    // If you have specific code that belongs here, please add it.
    console.warn("setupToggleSelectionEvents is called but its full functionality is missing.");
}


    // Create and display the autocomplete suggestions
    const showSuggestions = (arr) => {
        console.log("Attempting to show suggestions:", arr); // <<< CONSOLE LOG ADDED
        // Remove any existing list
        closeAllLists();

        if (!arr.length) {
            console.log("No matches to show."); // <<< CONSOLE LOG ADDED
            return false;
        }

        // Create the autocomplete list container
        autocompleteList = document.createElement("DIV");
        autocompleteList.setAttribute("id", currentTeamLeadInput.id + "-autocomplete-list");
        autocompleteList.setAttribute("class", "autocomplete-items"); // Add a class for styling

        // Append the list to the parent of the input (e.g., the toggle-control div)
        // This ensures the list is positioned correctly relative to the input
        currentTeamLeadInput.parentNode.appendChild(autocompleteList);
        console.log("Autocomplete list container created and appended."); // <<< CONSOLE LOG ADDED

        // Populate the list with suggestions
        arr.forEach(member => {
            const item = document.createElement("DIV");
            item.innerHTML = `<strong>${member.name.substr(0, currentTeamLeadInput.value.length)}</strong>`;
            item.innerHTML += member.name.substr(currentTeamLeadInput.value.length);
            item.innerHTML += `<input type="hidden" value="${member.name}">`; // Hidden input to hold the full name

            item.addEventListener("click", function(e) {
                currentTeamLeadInput.value = this.getElementsByTagName("input")[0].value;
                closeAllLists();
                currentTeamLeadInput.focus(); // Keep focus after selection
            });
            autocompleteList.appendChild(item);
        });
        console.log("Suggestions populated into list."); // <<< CONSOLE LOG ADDED
        return true;
    };

    // Handle input events on the text field
    currentTeamLeadInput.addEventListener("input", function(e) {
        const val = this.value;
        console.log("Input event fired. Value:", val); // <<< CONSOLE LOG ADDED
        closeAllLists(); // Close any open lists

        if (!val) { 
            console.log("Input value is empty, not showing suggestions."); // <<< CONSOLE LOG ADDED
            return false; 
        } 

        const matches = filterMembers(val);
        showSuggestions(matches);
        currentFocus = -1; // Reset focus on new input
    });

    // Handle keyboard navigation (arrows, Enter, Escape)
    currentTeamLeadInput.addEventListener("keydown", function(e) {
        let x = document.getElementById(this.id + "-autocomplete-list");
        if (x) x = x.getElementsByTagName("div"); // Get all suggestion items

        if (e.keyCode == 40) { // DOWN arrow
            currentFocus++;
            addActive(x);
        } else if (e.keyCode == 38) { // UP arrow
            currentFocus--;
            addActive(x);
        } else if (e.keyCode == 13) { // ENTER key
            e.preventDefault(); // Prevent form submission
            if (currentFocus > -1) {
                if (x) x[currentFocus].click(); // Simulate a click on the active item
            } else {
                closeAllLists(); // If no item is focused, just close the list
            }
        } else if (e.keyCode == 27) { // ESCAPE key
            closeAllLists();
        }
    });

    // Helper to add "active" class for keyboard navigation highlighting
    const addActive = (x) => {
        if (!x) return false;
        removeActive(x); // Remove active from all items first
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        x[currentFocus].classList.add("autocomplete-active");
    };

    // Helper to remove "active" class
    const removeActive = (x) => {
        for (let i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    };

    // Close all autocomplete lists
    const closeAllLists = (elmnt) => {
        const x = document.getElementsByClassName("autocomplete-items");
        for (let i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != currentTeamLeadInput) { // Don't close if click target is the list or input
                x[i].parentNode.removeChild(x[i]);
            }
        }
        currentFocus = -1; // Reset focus when lists are closed
    };

    // Close lists when clicking outside the input/list
    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });



function setupEventListeners(apiKey) {
    if (saveGamePlanBtn) {
        saveGamePlanBtn.addEventListener('click', async () => {
            console.log("1. Save Game Plan: Clicked.");
            const originalText = saveGamePlanBtn.textContent;
            saveGamePlanBtn.disabled = true;
            saveGamePlanBtn.textContent = "Saving...";
            try {
                console.log("2. Save Game Plan: Awaiting database save.");
                await db.collection('factionWars').doc('currentWar').set({ gamePlan: gamePlanEditArea.value }, { merge: true });
                console.log("3. Save Game Plan: Database save complete.");
                if (gamePlanDisplay) gamePlanDisplay.textContent = gamePlanEditArea.value;
                saveGamePlanBtn.textContent = "Saved! ✅"; // Visual feedback for success
            } catch (error) {
                console.error('ERROR during Save Game Plan:', error);
                saveGamePlanBtn.textContent = "Error! ❌"; // Visual feedback for error
                showCustomAlert("Failed to save game plan. Please check the console.", "Save Failed");
            } finally {
                // Ensure the button is re-enabled and text reset regardless of success/failure
                console.log("4. Save Game Plan: Entering 'finally' block to reset button.");
                setTimeout(() => {
                    console.log("5. Save Game Plan: Timeout finished. Reverting button.");
                    saveGamePlanBtn.disabled = false;
                    saveGamePlanBtn.textContent = originalText;
                }, 2000); // Revert after 2 seconds
            }
        });
    }

    if (postAnnouncementBtn) {
        postAnnouncementBtn.addEventListener('click', async () => {
            if (!quickAnnouncementInput || quickAnnouncementInput.value.trim() === '') return;
            console.log("1. Post Announcement: Clicked.");
            const originalText = postAnnouncementBtn.textContent;
            postAnnouncementBtn.disabled = true;
            postAnnouncementBtn.textContent = "Posting...";
            try {
                console.log("2. Post Announcement: Awaiting database post.");
                await db.collection('factionWars').doc('currentWar').set({ quickAnnouncement: quickAnnouncementInput.value }, { merge: true });
                console.log("3. Post Announcement: Database post complete.");
                if (factionAnnouncementsDisplay) factionAnnouncementsDisplay.textContent = quickAnnouncementInput.value;
                quickAnnouncementInput.value = '';
                postAnnouncementBtn.textContent = "Posted! ✅"; // Visual feedback for success
            } catch (error) {
                console.error('ERROR during Post Announcement:', error);
                postAnnouncementBtn.textContent = "Error! ❌"; // Visual feedback for error
                showCustomAlert("Failed to post announcement. Please check the console.", "Post Failed");
            } finally {
                // Ensure the button is re-enabled and text reset regardless of success/failure
                console.log("4. Post Announcement: Entering 'finally' block to reset button.");
                setTimeout(() => {
                    console.log("5. Post Announcement: Timeout finished. Reverting button.");
                    postAnnouncementBtn.disabled = false;
                    postAnnouncementBtn.textContent = originalText;
                }, 2000); // Revert after 2 seconds
            }
        });
    }

    if (saveWarStatusControlsBtn) {
        saveWarStatusControlsBtn.addEventListener('click', async () => {
            console.log("1. Save War Status: Clicked.");
            const originalText = saveWarStatusControlsBtn.textContent;
            saveWarStatusControlsBtn.disabled = true;
            saveWarStatusControlsBtn.textContent = "Saving...";
            const enemyId = enemyFactionIDInput ? enemyFactionIDInput.value.trim() : '';
            const statusData = {
                toggleEnlisted: toggleEnlisted ? toggleEnlisted.checked : false,
                toggleTermedWar: toggleTermedWar ? toggleTermedWar.checked : false,
                toggleChaining: toggleChaining ? toggleChaining.checked : false,
                toggleNoFlying: toggleNoFlying ? toggleNoFlying.checked : false,
                toggleTurtleMode: toggleTurtleMode ? toggleTurtleMode.checked : false,
                toggleTermedWinLoss: toggleTermedWinLoss ? toggleTermedWinLoss.checked : false,
                nextChainTimeInput: nextChainTimeInput ? nextChainTimeInput.value : '',
				currentTeamLead: currentTeamLeadInput ? currentTeamLeadInput.value : '', 
                enemyFactionID: enemyId
            };
            try {
                console.log("2. Save War Status: Awaiting database save.");
                await db.collection('factionWars').doc('currentWar').set(statusData, { merge: true });
                console.log("3. Save War Status: Database save complete.");
                populateWarStatusDisplay(statusData);
                // Assuming 'userApiKey' is available in this scope.
                await fetchAndDisplayEnemyFaction(enemyId, userApiKey);
                saveWarStatusControlsBtn.textContent = "Saved! ✅"; // Visual feedback for success
            } catch (error) {
                console.error('ERROR during Save War Status:', error);
                saveWarStatusControlsBtn.textContent = "Error! ❌"; // Visual feedback for error
                showCustomAlert("Failed to save war status. Please check the console.", "Save Failed");
            } finally {
                // Ensure the button is re-enabled and text reset regardless of success/failure
                console.log("4. Save War Status: Entering 'finally' block to reset button.");
                setTimeout(() => {
                    console.log("5. Save War Status: Timeout finished. Reverting button.");
                    saveWarStatusControlsBtn.disabled = false;
                    saveWarStatusControlsBtn.textContent = originalText;
                }, 2000); // Revert after 2 seconds
            }
        });
    }
	
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

    // Return in D:HH:MM:SS format
    return `${days}:${paddedHours}:${paddedMinutes}:${paddedSecs}`;
}

function populateUiComponents(warData, apiKey) { // warData is passed from initializeAndLoadData
    // Basic Faction Info (from global factionApiFullData)
    if (factionApiFullData) {
        if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = `${factionApiFullData.basic.name || "Your Faction"}'s War Hub.`;
        if (factionOneNameEl) factionOneNameEl.textContent = factionApiFullData.basic.name || 'Your Faction';
        if (factionOneMembersEl) factionOneMembersEl.textContent = `Total Members: ${factionApiFullData.members ? (factionApiFullData.members.total || Object.keys(factionApiFullData.members).length) : 'N/A'}`;

        if (factionApiFullData.members) {
            populateFriendlyMemberCheckboxes(
                factionApiFullData.members,
                warData.tab4Admins || [],
                warData.energyTrackingMembers || []
            );
        } else {
            console.warn("factionApiFullData.members not available for friendly member checkboxes or table display.");
            populateFriendlyMemberCheckboxes({}, []); // Clear checkboxes if members data is missing
        }
    } else {
        console.warn("factionApiFullData not available in populateUiComponents.");
        if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = "Faction War Hub. (Data Loading...)";
        if (factionOneNameEl) factionOneNameEl.textContent = 'Your Faction';
        if (factionOneMembersEl) factionOneMembersEl.textContent = 'N/A';
    }

    // --- THIS SECTION IS SIMPLIFIED ---
    if (gamePlanDisplay) {
        // It now only shows text content, ignoring any old image URLs.
        gamePlanDisplay.textContent = warData.gamePlan || 'No game plan available.';
    }

    if (factionAnnouncementsDisplay) {
        // Check if a saved image URL exists
        if (warData.announcementsImageUrl) {
            factionAnnouncementsDisplay.innerHTML = `<img src="${warData.announcementsImageUrl}" alt="Faction Announcement">`;
        } else {
            // Otherwise, show the text content
            factionAnnouncementsDisplay.textContent = warData.quickAnnouncement || 'No current announcements.';
        }
    }

    if (gamePlanEditArea) {
        gamePlanEditArea.value = warData.gamePlan || '';
    }

    populateWarStatusDisplay(warData); // Uses warData (Firebase)
    loadWarStatusForEdit(warData);     // Uses warData (Firebase)

    // Determine Enemy Faction ID: Prioritize active ranked war opponent, then saved ID
    let determinedEnemyFactionID = null;
    if (factionApiFullData && factionApiFullData.wars && factionApiFullData.wars.ranked) {
        const yourFactionId = factionApiFullData.basic.id; // Your faction ID from fetched data
        const opponentFactionInfo = factionApiFullData.wars.ranked.factions.find(f => String(f.id) !== String(yourFactionId));
        if (opponentFactionInfo) {
            determinedEnemyFactionID = opponentFactionInfo.id;
            console.log(`Automatically detected ranked war opponent: ${opponentFactionInfo.name} (ID: ${determinedEnemyFactionID})`);
        }
    }
    // Fallback to manually saved enemy ID if no active ranked war opponent detected
    globalEnemyFactionID = determinedEnemyFactionID || warData.enemyFactionID || null;

    // Display enemy targets table using the determined ID
    if (globalEnemyFactionID) {
        fetchAndDisplayEnemyFaction(globalEnemyFactionID, apiKey);
    } else {
        if (factionTwoNameEl) factionTwoNameEl.textContent = 'No Enemy Set';
        if (factionTwoMembersEl) factionTwoMembersEl.textContent = 'N/A';
        populateEnemyMemberCheckboxes({}, []); // Clear enemy member checkboxes
        displayEnemyTargetsTable(null); // Clear the enemy targets table
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

async function populateSettingsTab(targetDisplayElement) { // <--- CHANGE IS HERE: Accepting targetDisplayElement
    console.log("[Settings Tab] Populating tab with detailed layout...");

    if (!targetDisplayElement) { // Use the passed argument for error checking
        console.error("HTML Error: targetDisplayElement not provided to populateSettingsTab function.");
        return;
    }

    targetDisplayElement.innerHTML = `
        <div class="chat-settings-panel">

            <div class="settings-section">
                <div class="header-box">
                    <b>User & List Display</b>
                </div>
                <div class="settings-items-list">
                    <div class="setting-item">
                        <label for="userStatusDisplay">User Status Display:</label>
                        <select id="userStatusDisplay">
                            <option value="online_offline">Online/Offline</option>
                            <option value="last_action">Last Action</option>
                            <option value="none">None</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="settings-section">
                <div class="header-box">
                    <b>General Chat Display</b>
                </div>
                <div class="settings-items-list">
                    <div class="setting-item">
                        <label for="chatFontSize">Font Size:</label>
                        <select id="chatFontSize">
                            <option value="small">Small</option>
                            <option value="medium" selected>Medium</option>
                            <option value="large">Large</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label for="chatTheme">Chat Theme:</label>
                        <select id="chatTheme">
                            <option value="dark" selected>Dark</option>
                            <option value="light">Light (Coming Soon)</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label for="messageDensity">Message Density:</label>
                        <select id="messageDensity">
                            <option value="compact">Compact</option>
                            <option value="normal" selected>Normal</option>
                            <option value="spacious">Spacious</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label for="chatInputSize">Chat Input Size:</label>
                        <select id="chatInputSize">
                            <option value="small">Small</option>
                            <option value="medium" selected>Medium</option>
                            <option value="large">Large</option>
                        </select>
                    </div>
                    <div class="setting-item checkbox-item">
                        <label for="showTimestamps">Show Timestamps in Chat:</label>
                        <input type="checkbox" id="showTimestamps" checked>
                    </div>
                    <div class="setting-item checkbox-item">
                        <label for="autoScrollChat">Auto-Scroll Chat:</label>
                        <input type="checkbox" id="autoScrollChat" checked>
                    </div>
                    <div class="setting-item checkbox-item">
                        <label for="profanityFilter">Profanity Filter:</label>
                        <input type="checkbox" id="profanityFilter">
                    </div>
                </div>
            </div>

            <div class="settings-section">
                <div class="header-box">
                    <b>Chat Channel & Sound</b>
                </div>
                <div class="settings-items-list">
                    <div class="setting-item">
                        <label for="defaultChatTab">Default Chat Tab:</label>
                        <select id="defaultChatTab">
                            <option value="faction-chat" selected>Faction Chat</option>
                            <option value="war-chat">War Chat</option>
                            <option value="private-chat">Private Chat</option>
                        </select>
                    </div>
                    <div class="setting-item checkbox-item">
                        <label for="toggleWarChat">Toggle War Chat (On/Off):</label>
                        <input type="checkbox" id="toggleWarChat" checked>
                    </div>
                    <div class="setting-item checkbox-item">
                        <label for="muteAllChatSounds">Mute All Chat Sounds:</label>
                        <input type="checkbox" id="muteAllChatSounds">
                    </div>
                    <div class="setting-item">
                        <label for="notificationMethod">Notification Method:</label>
                        <select id="notificationMethod">
                            <option value="browser-popup">Browser Pop-up</option>
                            <option value="sound-only">Sound Only</option>
                            <option value="none" selected>None</option>
                        </select>
                    </div>
                    <p style="text-align: center; color: #a0a0a0; font-size: 0.85em; margin-top: 5px;">
                        (Note: Browser pop-ups are an advanced feature requiring user permission.)
                    </p>
                </div>
            </div>

            <div class="settings-section">
                <div class="header-box">
                    <b>Data & Actions</b>
                </div>
                <div class="settings-items-list">
                    <div class="setting-item action-item">
                        <button id="clearChatHistoryButton" class="action-button">Clear Chat History (Local)</button>
                    </div>
                </div>
            </div>

            <div class="settings-section save-settings-section">
                <div class="header-box">
                    <b>Save Settings</b>
                </div>
                <div class="settings-items-list">
                    <div class="setting-item action-item">
                        <button id="saveAllSettingsButton" class="action-button">Save All Settings</button>
                    </div>
                </div>
            </div>

        </div>
    `;

    
}

async function populateRecentlyMetTab(targetDisplayElement) {
    if (!targetDisplayElement) {
        console.error("HTML Error: Target display element not provided for Recently Met tab.");
        return;
    }

    // Set a simple loading message without the extra title
    targetDisplayElement.innerHTML = `<p style="text-align:center; padding: 20px;">Loading war history to find opponents...</p>`;

    try {
        // Step 1: Fetch the last 5 wars to get their IDs
        const historyUrl = `https://api.torn.com/v2/faction/rankedwars?sort=DESC&limit=5&key=${userApiKey}&comment=MyTornPA_RecentlyMet`;
        const historyResponse = await fetch(historyUrl);
        const historyData = await historyResponse.json();

        if (historyData.error) throw new Error(historyData.error.error);

        const wars = historyData.rankedwars || [];
        if (wars.length === 0) {
            targetDisplayElement.innerHTML = '<p style="text-align:center; padding: 20px;">No recent wars found to populate this list.</p>';
            return;
        }

        // Step 2: Fetch detailed reports for those wars
        targetDisplayElement.innerHTML = '<p style="text-align:center; padding: 20px;">Loading opponent details from war reports...</p>';
        const reportPromises = wars.map(war => 
            fetch(`https://api.torn.com/v2/faction/${war.id}/rankedwarreport?key=${userApiKey}&comment=MyTornPA_WarReport`).then(res => res.json())
        );
        const warReports = await Promise.all(reportPromises);

        // Step 3: Aggregate and deduplicate all opponents
        const opponentsMap = new Map();
        warReports.forEach(reportData => {
            const report = reportData.rankedwarreport;
            if (!report || !report.factions) return;

            const opponentFaction = report.factions.find(f => f.id != globalYourFactionID);
            if (opponentFaction && opponentFaction.members) {
                opponentFaction.members.forEach(member => {
                    if (!opponentsMap.has(member.id)) {
                        opponentsMap.set(member.id, { id: member.id, name: member.name });
                    }
                });
            }
        });
        
        const uniqueOpponentIds = Array.from(opponentsMap.keys()).map(String);
        if (uniqueOpponentIds.length === 0) {
            targetDisplayElement.innerHTML = '<p style="text-align:center; padding: 20px;">Could not find any opponents in recent wars.</p>';
            return;
        }

        // Step 4: Check registration status in chunks
        const registeredUserIds = new Set();
        const chunkSize = 30;
        for (let i = 0; i < uniqueOpponentIds.length; i += chunkSize) {
            const chunk = uniqueOpponentIds.slice(i, i + chunkSize);
            const querySnapshot = await db.collection('userProfiles').where('tornProfileId', 'in', chunk).get();
            querySnapshot.forEach(doc => {
                registeredUserIds.add(doc.data().tornProfileId);
            });
        }

        // Step 5: Build the final HTML grid
        const membersListContainer = document.createElement('div');
        membersListContainer.className = 'members-list-container'; // This will be our 3-column grid

        let cardsHtml = '';
        for (const opponent of opponentsMap.values()) {
            const isRegistered = registeredUserIds.has(String(opponent.id));
            const randomIndex = Math.floor(Math.random() * DEFAULT_PROFILE_ICONS.length);
            const profilePic = DEFAULT_PROFILE_ICONS[randomIndex];

            let messageButton;
            if (isRegistered) {
                messageButton = `<button class="item-button message-button" data-member-id="${opponent.id}" title="Send Message on MyTornPA">✉️</button>`;
            } else {
                const tornMessageUrl = `https://www.torn.com/messages.php#/p=compose&XID=${opponent.id}`;
                messageButton = `<a href="${tornMessageUrl}" target="_blank" class="item-button message-button" title="Send Message on Torn">✉️</a>`;
            }

            cardsHtml += `
                <div class="member-item">
                    <div class="member-identity">
                        <img src="${profilePic}" alt="${opponent.name}'s profile pic" class="member-profile-pic">
                        <a href="https://www.torn.com/profiles.php?XID=${opponent.id}" target="_blank" class="member-name">${opponent.name} [${opponent.id}]</a>
                    </div>
                    <div class="member-actions">
                        <button class="add-member-button" data-member-id="${opponent.id}" title="Add Friend">👤<span class="plus-sign">+</span></button>
                        ${messageButton}
                    </div>
                </div>
            `;
        }

        membersListContainer.innerHTML = cardsHtml;
        targetDisplayElement.innerHTML = ''; // Clear the "loading..." message
        targetDisplayElement.appendChild(membersListContainer);

    } catch (error) {
        console.error("Error populating Recently Met tab:", error);
        targetDisplayElement.innerHTML = `<p style="color: red; text-align:center; padding: 20px;">Error: ${error.message}</p>`;
    }
}

async function initializeAndLoadData(apiKey, factionIdToUseOverride = null) {
    console.log(">>> ENTERING initializeAndLoadData FUNCTION <<<");

    const keyToUse = apiKey;
    let finalFactionId = factionIdToUseOverride;

    // Determine finalFactionId: prioritize override, then global, then user profile
    if (!finalFactionId && factionApiFullData && factionApiFullData.basic && factionApiFullData.basic.id) {
        finalFactionId = factionApiFullData.basic.id;
    }
    if (!finalFactionId && auth.currentUser) {
        try {
            const userProfileDoc = await db.collection('userProfiles').doc(auth.currentUser.uid).get();
            if (userProfileDoc.exists) {
                finalFactionId = userProfileDoc.data().faction_id;
            }
        } catch (error) {
            console.error("Error fetching faction ID from user profile in initializeAndLoadData fallback:", error);
        }
    }

    globalYourFactionID = finalFactionId; // Set the global variable

    // --- NEW: Dynamically set the chatMessagesCollection based on the user's faction ID ---
    if (globalYourFactionID) {
        chatMessagesCollection = db.collection('factionChats').doc(String(globalYourFactionID)).collection('messages');
        console.log(`Chat messages collection set to: factionChats/${globalYourFactionID}/messages`);
    } else {
        chatMessagesCollection = null; // Reset if no faction ID
        console.warn("Could not determine user's faction ID. Faction chat will not be available.");
    }
    // --- END NEW ---

    const activeOpsScoreBox = document.querySelector('#active-ops-tab .ops-control-item .ranked-war-container');
    const announcementScoreboardContainer = document.getElementById('announcementScoreboardContainer');

    // Handle case where faction ID is not found (ensure all relevant UI is updated)
    if (!finalFactionId) {
        const factionWarHubTitleEl = document.getElementById('factionWarHubTitle');
        if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = "ERROR: Faction ID not found.";
        if (activeOpsScoreBox) activeOpsScoreBox.innerHTML = '<p style="text-align:center; padding: 20px; color: red;">Error: Faction ID Missing</p>';
        if (announcementScoreboardContainer) announcementScoreboardContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: red;">Error: Faction ID Missing</p>';
        if (currentChainNumberDisplay) currentChainNumberDisplay.textContent = 'N/A';
        if (chainStartedDisplay) chainStartedDisplay.textContent = 'N/A';
        if (chainTimerDisplay) chainTimerDisplay.textContent = 'Chain Over';
        return;
    }

    try {
        const userFactionApiUrl = `https://api.torn.com/v2/faction/${finalFactionId}?selections=basic,members,chain,wars&key=${keyToUse}&comment=MyTornPA_WarHub_Combined`;

        console.log("initializeAndLoadData: Attempting to fetch faction data from URL:", userFactionApiUrl);
        const userFactionResponse = await fetch(userFactionApiUrl);

        if (!userFactionResponse.ok) {
            const errorData = await userFactionResponse.json().catch(() => ({}));
            const apiErrorMsg = errorData.error ? `: ${errorData.error.error}` : '';
            throw new Error(`Torn API HTTP Error: ${userFactionResponse.status} ${userFactionResponse.statusText}${apiErrorMsg}.`);
        }

        factionApiFullData = await userFactionResponse.json();
        console.log("initializeAndLoadData: Faction API Full Data fetched:", factionApiFullData);

        if (factionApiFullData.error) {
            throw new Error(`Torn API Error: ${factionApiFullData.error.error}`);
        }
        
        if (factionApiFullData.chain && typeof factionApiFullData.chain.current === 'number') {
            localCurrentClaimHitCounter = factionApiFullData.chain.current;
            console.log(`Initialized localCurrentClaimHitCounter to: ${localCurrentClaimHitCounter}`);
        } else {
            localCurrentClaimHitCounter = 0; // Default to 0 if no chain data
            console.log("Faction chain data not found, localCurrentClaimHitCounter initialized to 0.");
        }
            
        updateRankedWarDisplay(factionApiFullData.wars?.ranked, finalFactionId);
        console.log("initializeAndLoadData: updateRankedWarDisplay called successfully.");

        console.log(">>> initializeAndLoadData FUNCTION COMPLETED SUCCESSFULLY <<<");

        const warDoc = await db.collection('factionWars').doc('currentWar').get();
        const warData = warDoc.exists ? warDoc.data() : {};
        populateUiComponents(warData, apiKey); 

    } catch (error) {
        console.error(">>> ERROR CAUGHT IN initializeAndLoadData CATCH BLOCK:", error);
        const factionWarHubTitleEl = document.getElementById('factionWarHubTitle');
        if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = `Error Loading War Hub Data.`;
        if (activeOpsScoreBox) activeOpsScoreBox.innerHTML = `<p style="text-align:center; padding: 20px; color: red;">Error: ${error.message}</p>`;
        if (announcementScoreboardContainer) announcementScoreboardContainer.innerHTML = `<p style="text-align:center; padding: 20px; color: red;">Error: ${error.message}</p>`;

        if (currentChainNumberDisplay) currentChainNumberDisplay.textContent = 'Error';
        if (chainStartedDisplay) chainStartedDisplay.textContent = 'Error';
        if (chainTimerDisplay) chainTimerDisplay.textContent = 'Error';
    }
}

async function displayQuickFFTargets(userApiKey, playerId) {
    const quickFFTargetsDisplay = document.getElementById('quickFFTargetsDisplay');
    if (!quickFFTargetsDisplay) {
        console.error("HTML Error: Cannot find element with ID 'quickFFTargetsDisplay'.");
        return;
    }

    if (quickFFTargetsDisplay.innerHTML === '') {
        quickFFTargetsDisplay.innerHTML = '<span style="color: #6c757d;">Loading targets...</span>';
    }

    if (!userApiKey || !playerId) {
        if (!quickFFTargetsDisplay.innerHTML.includes('Error:') && !quickFFTargetsDisplay.innerHTML.includes('Login & API/ID needed')) {
            quickFFTargetsDisplay.innerHTML = '<span style="color: #ff4d4d;">API Key or Player ID missing.</span>';
        }
        console.warn("Cannot fetch Quick FF Targets: API Key or Player ID is missing.");
        return;
    }

    try {
        const currentEnemyTableRows = enemyTargetsContainer.querySelectorAll('tr[id^="target-row-"]');
        const excludedPlayerIDs = Array.from(currentEnemyTableRows).map(row => row.id.replace('target-row-', ''));
        
        const functionUrl = `/.netlify/functions/get-recommended-targets`;
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: userApiKey, playerId: playerId })
        });
        const data = await response.json();

        if (!response.ok || data.error) {
            const errorMessage = data.error ? data.error.error || JSON.stringify(data.error) : `Error from server: ${response.status} ${response.statusText}`;
            console.error("Error fetching Quick FF Targets:", errorMessage);
            if (quickFFTargetsDisplay.innerHTML.includes('Loading targets...') || quickFFTargetsDisplay.innerHTML === '') {
                 quickFFTargetsDisplay.innerHTML = `<span style="color: #ff4d4d;">Error: ${errorMessage}</span>`;
            }
            return;
        }

        if (!data.targets || data.targets.length === 0) {
            quickFFTargetsDisplay.innerHTML = '<span style="color: #6c757d;">No recommended targets found.</span>';
            lastDisplayedTargetIDs = [];
            consecutiveSameTargetsCount = 0;
            return;
        }

        let availableTargets = data.targets.filter(target => !excludedPlayerIDs.includes(target.playerID));

        if (availableTargets.length === 0) {
            quickFFTargetsDisplay.innerHTML = '<span style="color: #6c757d;">No new targets available.</span>';
            lastDisplayedTargetIDs = [];
            consecutiveSameTargetsCount = 0;
            return;
        }

        // --- CHANGE IS HERE ---
        const MAX_TARGETS_TO_DISPLAY = 3; // Changed from 2 to 3
        const MAX_SHUFFLE_ATTEMPTS = 10; 

        let finalSelectedTargets = [];
        let currentDisplayedTargetIDs = [];
        let attempt = 0;

        do {
            for (let i = availableTargets.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [availableTargets[i], availableTargets[j]] = [availableTargets[j], availableTargets[i]];
            }

            finalSelectedTargets = availableTargets.slice(0, MAX_TARGETS_TO_DISPLAY);
            currentDisplayedTargetIDs = finalSelectedTargets.map(t => t.playerID);
            attempt++;

        } while (availableTargets.length >= MAX_TARGETS_TO_DISPLAY &&
                 areTargetSetsIdentical(currentDisplayedTargetIDs, lastDisplayedTargetIDs) &&
                 consecutiveSameTargetsCount >= 2 &&
                 attempt < MAX_SHUFFLE_ATTEMPTS);

        if (areTargetSetsIdentical(currentDisplayedTargetIDs, lastDisplayedTargetIDs)) {
            consecutiveSameTargetsCount++;
            if (consecutiveSameTargetsCount >= 3) {
                console.warn("Warning: Displaying the same Quick FF Target pair for the 3rd+ consecutive time due to limited alternative targets.");
            }
        } else {
            consecutiveSameTargetsCount = 1;
        }
        lastDisplayedTargetIDs = currentDisplayedTargetIDs;

        const newTargetsHtmlContainer = document.createElement('div');
        let newTargetsHtml = '';
        let currentEmojisUsedForBatch = new Set();
        let emojiCycleIndex = lastEmojiIndex;

        for (let i = 0; i < finalSelectedTargets.length; i++) {
            const target = finalSelectedTargets[i];
            const attackUrl = `https://www.torn.com/loader.php?sid=attack&user2ID=${target.playerID}`;
            const targetName = target.playerName || `Target ${i + 1}`;

            let selectedEmoji = '';
            do {
                emojiCycleIndex = (emojiCycleIndex + 1) % TARGET_EMOJIS.length;
                selectedEmoji = TARGET_EMOJIS[emojiCycleIndex];
            } while (currentEmojisUsedForBatch.has(selectedEmoji));

            currentEmojisUsedForBatch.add(selectedEmoji);
            lastEmojiIndex = emojiCycleIndex;

            newTargetsHtml += `
                <a href="${attackUrl}" target="_blank"
                   class="quick-ff-target-btn"
                   title="${targetName} (ID: ${target.playerID}) - Fair Fight: ${target.fairFightScore} (${get_difficulty_text(parseFloat(target.fairFightScore))})">
                    <span class="emoji-wrapper">${selectedEmoji}</span> ${targetName} <span class="emoji-wrapper">${selectedEmoji}</span>
                </a>
            `;
        }

        quickFFTargetsDisplay.innerHTML = newTargetsHtml;

    } catch (error) {
        console.error("Failed to fetch or display Quick FF Targets:", error);
        if (quickFFTargetsDisplay.innerHTML.includes('Loading targets...') || quickFFTargetsDisplay.innerHTML === '') {
             quickFFTargetsDisplay.innerHTML = `<span style="color: #ff4d4d;">Failed to load targets.</span>`;
        }
    }
}
          
		  document.addEventListener('DOMContentLoaded', () => {
    // --- START OF DOMCONTENTLOADED ---

    // --- NEW: This block reads the URL to see if a specific tab was requested ---
    const urlParams = new URLSearchParams(window.location.search);
    const requestedTabName = urlParams.get('view'); // e.g. ?view=live-faction-activity
    // --- END NEW ---

    // Basic tab navigation for main content tabs
    const tabButtons = document.querySelectorAll('.tab-button');
    const mainTabPanes = document.querySelectorAll('.tab-pane'); // This variable is declared but not directly used in the provided snippet.

    // Replace your old block with this NEW version
tabButtons.forEach(button => {
    button.addEventListener('click', async (event) => {
        const targetTabDataset = event.currentTarget.dataset.tab;
        const targetTabId = targetTabDataset + '-tab';

        if (targetTabDataset === 'leader-config') {
            const userIsAdmin = await checkIfUserIsAdmin();
            if (!userIsAdmin) {
                const permissionMessage = "You do not have permission to view leadership settings. Speak to your leader or co-leader if you believe you should have these permissions.";
                showCustomAlert(permissionMessage, "Access Denied");
                return;
            }
        }

        showTab(targetTabId);

        // This is the part we are updating
        if (targetTabDataset === 'friendly-status') {
            
            // --- NEW REFRESH LOGIC STARTS HERE ---
            const tbody = document.getElementById('friendly-members-tbody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="12" style="text-align:center; padding: 20px;">Refreshing latest faction data...</td></tr>';
            }
            
            try {
                // We use the globalYourFactionID variable that is already set on this page
                if (!globalYourFactionID) {
                    throw new Error("You must be logged in to refresh faction data.");
                }

                // Call the SAME Netlify function to update the data in the database
                const response = await fetch(`/.netlify/functions/refresh-faction-data?factionId=${globalYourFactionID}`);
                
                if (!response.ok) {
                    const errorResult = await response.json();
                    throw new Error(errorResult.message || 'The refresh process failed.');
                }
                console.log("Backend faction data refreshed successfully.");

            } catch (error) {
                console.error("Error refreshing faction data:", error);
                if (tbody) {
                    tbody.innerHTML = `<tr><td colspan="12" style="color: red; text-align: center;">Error: Could not refresh faction data. ${error.message}</td></tr>`;
                }
                return; // Stop if the refresh fails
            }
            // --- NEW REFRESH LOGIC ENDS HERE ---


            // Now that the data is fresh, call the function to display the table
            const user = firebase.auth().currentUser;
            if (user && userApiKey) {
                await updateFriendlyMembersTable(userApiKey, user.uid);
            } else {
                console.warn("User not logged in or API Key missing.");
                if (tbody) {
                    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding: 20px; color: yellow;">Please log in and ensure API Key is available to view faction members.</td></tr>';
                }
            }
        }
    });
});


  // --- RE-ADDED: THE WAR AVAILABILITY BUTTON EVENT LISTENERS ---
const availabilityTab = document.getElementById('war-availability-tab');
if (availabilityTab) {
    // The "async" keyword is the only change needed to fix the error
    availabilityTab.addEventListener('click', async (event) => {
        const button = event.target.closest('.action-btn');
        if (!button) {
            return; // Exit if the click wasn't on an action button
        }

        // Handle the "Update Day X" buttons inside the form
        if (button.textContent.includes('Update Day')) {
            event.preventDefault();
            const dayForm = button.closest('.availability-day-form');
            const dayNumber = parseInt(dayForm.dataset.day, 10);
            const user = auth.currentUser;
            if (!user) {
                return alert("You must be logged in.");
            }

            const status = dayForm.querySelector('.availability-status').value;
            const reason = dayForm.querySelector('input[id^="reason-day-"]').value.trim();
            if (status === 'no' && reason === '') {
                return showCustomAlert("Please provide a reason for being unavailable.", "Reason Required");
            }

            const originalText = button.textContent;
            button.textContent = "Saving...";
            button.disabled = true;

            const availabilityData = {
                status: status,
                reason: reason,
                timeRange: dayForm.querySelector('input[id^="time-from-day-"]').value.trim(),
                role: dayForm.querySelector('select[id^="role-day-"]').value,
                isAvailableForStart: dayForm.querySelector('input[id^="war-start-day-"]').checked,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            };

            try {
                const userProfileDoc = await db.collection('userProfiles').doc(user.uid).get();
                const tornUserId = userProfileDoc.data().tornProfileId;
                const availabilityDocRef = db.collection('factionWars').doc('currentWar').collection('availability').doc(tornUserId);
                await availabilityDocRef.set({
                    [`day_${dayNumber}`]: availabilityData
                }, {
                    merge: true
                });
                await displayWarRoster(); // Refresh the roster and summary
                button.textContent = "Saved! ✅";
            } catch (error) {
                console.error("Error saving availability:", error);
                showCustomAlert(`Failed to save availability: ${error.message}`, "Save Error");
                button.textContent = "Error! ❌";
            } finally {
                setTimeout(() => {
                    button.textContent = originalText;
                    button.disabled = false;
                }, 2000);
            }
        }

        // Handle the "Edit Day X" buttons in the summary view
        if (button.classList.contains('edit-day-btn')) {
            const dayToEdit = button.dataset.dayToEdit;
            if (dayToEdit) {
                showDayForm(parseInt(dayToEdit, 10));
            }
        }

        // Handle the "Send Reminders" button
        if (button.id === 'notify-members-btn') {
            const originalText = button.textContent;
            button.disabled = true;
            button.textContent = "Sending...";
            try {
                await sendReminderNotifications();
                button.textContent = "Sent! ✅";
            } catch (error) {
                console.error("Error sending reminders:", error);
                button.textContent = "Error! ❌";
                showCustomAlert(`Failed to send reminders: ${error.message}`, "Send Error");
            } finally {
                setTimeout(() => {
                    button.textContent = originalText;
                    button.disabled = false;
                }, 2000);
            }
        }
        
        // Handle the "Send Availability" button
        if (button.id === 'send-availability-report-btn') {
            const originalText = button.textContent;
            button.disabled = true;
            button.textContent = "Sending...";
            try {
                await sendAvailabilityReport();
                button.textContent = "Sent! ✅";
                showCustomAlert("Availability report sent to Discord successfully!", "Report Sent");
            } catch (error) {
                console.error("Error sending availability report:", error);
                button.textContent = "Error! ❌";
            } finally {
                setTimeout(() => {
                    button.textContent = originalText;
                    button.disabled = false;
                }, 2000);
            }
        }

        // Handle the "Reset All" button
        if (button.id === 'reset-availability-btn') {
            const confirmed = await showCustomConfirm("Are you sure you want to reset ALL availability data for everyone?", "Confirm Reset");
            if (confirmed) {
                try {
                    await resetAllAvailability();
                } catch (error) {
                    console.error("Reset All button failed:", error);
                }
            }
        }
    });
}
    // --- END RE-ADDED AVAILABILITY LISTENERS ---

    // --- MODIFIED: This block now checks for the requestedTabName from the URL ---
    if (requestedTabName) {
        // This will take the value from the URL (e.g., 'live-faction-activity')
        // and turn it into the tab ID (e.g., 'live-faction-activity-tab') to show it.
        showTab(requestedTabName + '-tab');
    } else {
        // This is the original default behavior if no specific tab is requested.
        showTab('announcements-tab');
    }
    // --- END MODIFIED ---

    let listenersInitialized = false;

    // References to chat elements (ensure these are correctly defined based on your HTML)
    const chatTabsContainer = document.querySelector('.chat-tabs-container');
    const chatTabs = document.querySelectorAll('.chat-tab');
    const warChatBox = document.getElementById('warChatBox'); // This element is not always the main chat display.
    const chatDisplayArea = document.getElementById('chat-display-area'); // This IS your main chat content display area.
    const chatInputArea = document.querySelector('.chat-input-area');

    // This handles all the data loading after a user logs in
    auth.onAuthStateChanged(async (user) => {
    if (user) {
        const userProfileRef = db.collection('userProfiles').doc(user.uid);
        const doc = await userProfileRef.get();
        const userData = doc.exists ? doc.data() : {};

        const apiKey = userData.tornApiKey || null;
        const playerId = userData.tornProfileId || null;
        currentTornUserName = userData.preferredName || 'Unknown';

        // Clear All War Data Button Listener (moved here to ensure 'db' is available)
        if (clearAllWarDataBtn) {
            clearAllWarDataBtn.addEventListener('click', async () => {
                const confirmMessage = "Are you sure you want to clear ALL war data?\nThis will reset all war controls, the game plan, and announcements. This cannot be undone.";
                const userConfirmed = await showCustomConfirm(confirmMessage, "Confirm Data Deletion");

                if (!userConfirmed) {
                    return; // Stop if the user clicks 'No' or outside the box
                }

                const originalText = clearAllWarDataBtn.textContent;
                clearAllWarDataBtn.disabled = true;
                clearAllWarDataBtn.textContent = "Clearing...";

                // This object defines all the default/empty values
                const clearedData = {
                    toggleEnlisted: false,
                    toggleTermedWar: false,
                    toggleTermedWinLoss: false,
                    toggleChaining: false,
                    toggleNoFlying: false,
                    toggleTurtleMode: false,
                    enemyFactionID: "",
                    nextChainTimeInput: "",
                    currentTeamLead: "",
                    gamePlan: "",
                    quickAnnouncement: "",
                    gamePlanImageUrl: null,
                    announcementsImageUrl: null,
                    tab4Admins: [], // Also clear these
                    energyTrackingMembers: [] // And these
                };

                try {
                    // Update the database with the cleared data
                    await db.collection('factionWars').doc('currentWar').set(clearedData, {
                        merge: true
                    });

                    // Update all the input fields on the screen
                    if (toggleEnlisted) toggleEnlisted.checked = false;
                    if (toggleTermedWar) toggleTermedWar.checked = false;
                    if (toggleTermedWinLoss) toggleTermedWinLoss.checked = false;
                    if (toggleChaining) toggleChaining.checked = false;
                    if (toggleNoFlying) toggleNoFlying.checked = false;
                    if (toggleTurtleMode) toggleTurtleMode.checked = false;
                    if (enemyFactionIDInput) enemyFactionIDInput.value = "";
                    if (nextChainTimeInput) nextChainTimeInput.value = "";
                    const currentTeamLeadInput = document.getElementById('currentTeamLeadInput');
                    if (currentTeamLeadInput) currentTeamLeadInput.value = "";

                    if (gamePlanEditArea) gamePlanEditArea.value = "";
                    if (quickAnnouncementInput) quickAnnouncementInput.value = "";
                    if (gamePlanDisplay) gamePlanDisplay.innerHTML = '<p>No game plan available.</p>';
                    if (factionAnnouncementsDisplay) factionAnnouncementsDisplay.innerHTML = '<p>No current announcements.</p>';

                    // Update the read-only display on the announcements tab
                    populateWarStatusDisplay(clearedData);

                    // Also clear the populated member checkboxes and enemy targets
                    if (factionApiFullData && factionApiFullData.members) {
                        populateFriendlyMemberCheckboxes(factionApiFullData.members, [], []);
                    }
                    populateEnemyMemberCheckboxes({}, []); // Clear enemy member checkboxes
                    displayEnemyTargetsTable(null); // Clear the enemy targets table

                    clearAllWarDataBtn.textContent = "Cleared! ✅";

                } catch (error) {
                    console.error("Error clearing war data:", error);
                    clearAllWarDataBtn.textContent = "Error! ❌";
     
                } finally {
                    setTimeout(() => {
                        clearAllWarDataBtn.disabled = false;
                        clearAllWarDataBtn.textContent = originalText;
                    }, 2000);
                }
            });
        }

        if (apiKey && playerId) {
                userApiKey = apiKey; // Set global API key

                await initializeAndLoadData(apiKey, userData.faction_id); // Pass user's faction_id

                setupProgressText();

                const factionWarHubTitleEl = document.getElementById('factionWarHubTitle');
                if (factionWarHubTitleEl && factionApiFullData && factionApiFullData.name) {
                    factionWarHubTitleEl.textContent = `${factionApiFullData.name}'s War Hub`;
                }

                // Initial calls to update UI
                displayWarRoster(); // This now expects data from Firebase
 
                setupWarClaimsListener(); // Listens for claims

                userEnergyDisplay = document.getElementById('userEnergyDisplay');
                onlineFriendlyMembersDisplay = document.getElementById('onlineFriendlyMembersDisplay');
                onlineEnemyMembersDisplay = document.getElementById('onlineEnemyMembersDisplay');

                updateUserEnergyDisplay();
                updateOnlineMemberCounts();
                fetchAndDisplayChainData(); // Now fetches its own chain data
                displayQuickFFTargets(userApiKey, playerId);


                // Attach event listeners only once
                if (!listenersInitialized) {
                    setupEventListeners(apiKey); // Contains generic save buttons with new robust code
                    setupMemberClickEvents(); // For the friendly members table

                    // Attach chat tab click listeners
                    chatTabs.forEach(tab => {
                        tab.addEventListener('click', handleChatTabClick);
                    });

                    // Autocomplete for team lead (assuming allFactionMembers is available globally or fetched)
                    if (factionApiFullData && factionApiFullData.members) {
                        setupTeamLeadAutocomplete(factionApiFullData.members);
                    }

                    listenersInitialized = true; // Flag to prevent re-initialization

                    // Set up interval updates
                    setInterval(updateAllTimers, 1000); // Updates dynamic timers (chain, war, individual)
                    setInterval(() => {
                        if (userApiKey && globalEnemyFactionID) {
                            fetchAndDisplayEnemyFaction(globalEnemyFactionID, userApiKey); // Updates enemy targets table
                        }
                    }, 15000); // Fetch enemy data every 15 seconds
                    setInterval(() => {
                        if (userApiKey && globalYourFactionID) {
                            updateDualChainTimers(userApiKey, globalYourFactionID, globalEnemyFactionID); // Updates the smaller chain timers
                            fetchAndDisplayChainData(); // Re-fetches primary chain data
                        }
                    }, 5000); // Fetch chain data every 5 seconds
                    /*
                    // I've removed this 5-minute full data refresh.
                    // This is the likely cause of your read spikes. The tab clicks already handle this.
                    setInterval(() => {
                        if (userApiKey && globalYourFactionID) {
                            // This ensures the main data, including war score and members, is refreshed.
                            // The populateUiComponents will also be called within this, which refreshes all sections.
                            initializeAndLoadData(userApiKey, globalYourFactionID);
                        }
                    }, 300000); // Refresh all data every 5 minutes (300,000 ms)
                    */
                    setInterval(() => {
                        if (userApiKey) {
                            updateUserEnergyDisplay(); // Refreshes user's energy display
                            updateOnlineMemberCounts(); // Refreshes online member counts
                        }
                    }, 60000); // Update energy and online counts every 1 minute
                    setInterval(() => {
                        if (userApiKey && playerId) {
                            displayQuickFFTargets(userApiKey, playerId);
                        }
                    }, 10000); // Refresh quick FF targets every 10 seconds



                    // --- START: NEW CODE TO OPEN THE CORRECT TAB ---
                    // After all setup is complete, we check the URL
                    const urlParams = new URLSearchParams(window.location.search);
                    const requestedView = urlParams.get('view');

                    if (requestedView === 'friendly-status') {
                        // Find the button for the requested tab and "click" it
                        const targetButton = document.querySelector(`.tab-button[data-tab="${requestedView}"]`);
                        if (targetButton) {
                            targetButton.click();
                        }
                    }
                    // --- END: NEW CODE ---
                }
            } else {
                console.warn("API key or Player ID not found. User is logged in but profile data is incomplete.");
                const factionWarHubTitleEl = document.getElementById('factionWarHubTitle');
                if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = "Faction War Hub. (API Key & Player ID Needed)";
                // Reset/clear relevant UI elements if API key is missing
                populateWarStatusDisplay({});
                loadWarStatusForEdit({});
                if (gamePlanDisplay) gamePlanDisplay.textContent = 'No game plan available.';
                if (factionAnnouncementsDisplay) factionAnnouncementsDisplay.textContent = 'No current announcements.';
                displayEnemyTargetsTable(null);
                populateFriendlyMemberCheckboxes({}, [], []);
                populateEnemyMemberCheckboxes({}, []);
            }
     
    } else {
        userApiKey = null;
        listenersInitialized = false; // Reset flag so listeners are re-initialized on next login
        console.log("User not logged in.");
        const factionWarHubTitleEl = document.getElementById('factionWarHubTitle');
        if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = "Faction War Hub. (Please Login)";
        // Clear UI elements when logged out
        populateWarStatusDisplay({});
        loadWarStatusForEdit({});
        if (gamePlanDisplay) gamePlanDisplay.textContent = 'No game plan available.';
        if (factionAnnouncementsDisplay) factionAnnouncementsDisplay.textContent = 'No current announcements.';
        displayEnemyTargetsTable(null);
        populateFriendlyMemberCheckboxes({}, [], []);
        populateEnemyMemberCheckboxes({}, []);
        if (chatDisplayArea) chatDisplayArea.innerHTML = '<p>Please log in to use chat.</p>';
        if (chatInputArea) chatInputArea.style.display = 'none';
        if (currentChainNumberDisplay) currentChainNumberDisplay.textContent = 'N/A';
        if (chainStartedDisplay) chainStartedDisplay.textContent = 'N/A';
        if (chainTimerDisplay) chainTimerDisplay.textContent = 'Chain Over';
        if (enemyTargetsContainer) enemyTargetsContainer.innerHTML = '<div class="no-targets-message">Please log in and configure your war hub.</div>';
        if (friendlyMembersTbody) friendlyMembersTbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding: 20px;">Please log in to view faction members.</td></tr>';
        if (document.getElementById('quickFFTargetsDisplay')) document.getElementById('quickFFTargetsDisplay').innerHTML = '<span style="color: yellow;">Login & API/ID needed for Quick Targets.</span>';
        if (document.getElementById('rw-user-energy')) document.getElementById('rw-user-energy').textContent = 'Login';
        if (document.getElementById('rw-user-energy_announcement')) document.getElementById('rw-user-energy_announcement').textContent = 'Login';

        // Clear any active chat listeners
        if (unsubscribeFromChat) {
            unsubscribeFromChat();
            unsubscribeFromChat = null;
        }
    }
});

  
    // Admins Save Listener (added to DOMContentLoaded as a one-time setup)
    if (saveAdminsBtn) {
        saveAdminsBtn.addEventListener('click', async () => {
            if (!designatedAdminsContainer) return;
            const originalText = saveAdminsBtn.textContent;
            saveAdminsBtn.disabled = true;
            saveAdminsBtn.textContent = "Saving...";
            try {
                const selectedAdminIds = Array.from(designatedAdminsContainer.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
                await db.collection('factionWars').doc('currentWar').set({
                    tab4Admins: selectedAdminIds
                }, {
                    merge: true
                });
                saveAdminsBtn.textContent = "Saved! ✅";
            } catch (error) {
                console.error("Error saving admins:", error);
                saveAdminsBtn.textContent = "Error! ❌";
              
            } finally {
                setTimeout(() => {
                    saveAdminsBtn.disabled = false;
                    saveAdminsBtn.textContent = originalText;
                }, 2000);
            }
        });
    }
	
	

    // Energy Tracking Members Save Listener (added to DOMContentLoaded as a one-time setup)
    if (saveEnergyTrackMembersBtn) {
        saveEnergyTrackMembersBtn.addEventListener('click', async () => {
            if (!energyTrackingContainer) return;
            const originalText = saveEnergyTrackMembersBtn.textContent;
            saveEnergyTrackMembersBtn.disabled = true;
            saveEnergyTrackMembersBtn.textContent = "Saving...";
            try {
                const selectedEnergyMemberIds = Array.from(energyTrackingContainer.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
                await db.collection('factionWars').doc('currentWar').set({
                    energyTrackingMembers: selectedEnergyMemberIds
                }, {
                    merge: true
                });
                saveEnergyTrackMembersBtn.textContent = "Saved! ✅";
            } catch (error) {
                console.error("Error saving energy members:", error);
                saveEnergyTrackMembersBtn.textContent = "Error! ❌";
                showCustomAlert("Failed to save energy tracking members. Check console.", "Save Error");
            } finally {
                setTimeout(() => {
                    saveEnergyTrackMembersBtn.disabled = false;
                    saveEnergyTrackMembersBtn.textContent = originalText;
                }, 2000);
            }
        });
    }

    // Big Hitter Watchlist Save Listener (added to DOMContentLoaded as a one-time setup)
    if (saveSelectionsBtnBH) { // Assuming this is your save button for Big Hitters
        saveSelectionsBtnBH.addEventListener('click', async () => {
            if (!bigHitterWatchlistContainer) return;
            const originalText = saveSelectionsBtnBH.textContent;
            saveSelectionsBtnBH.disabled = true;
            saveSelectionsBtnBH.textContent = "Saving...";
            try {
                const selectedBigHitterIds = Array.from(bigHitterWatchlistContainer.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
                await db.collection('factionWars').doc('currentWar').set({
                    bigHitterWatchlist: selectedBigHitterIds
                }, {
                    merge: true
                });
                saveSelectionsBtnBH.textContent = "Saved! ✅";
            } catch (error) {
                console.error("Error saving big hitter watchlist:", error);
                saveSelectionsBtnBH.textContent = "Error! ❌";
                showCustomAlert("Failed to save big hitter watchlist. Check console.", "Save Error");
            } finally {
                setTimeout(() => {
                    saveSelectionsBtnBH.disabled = false;
                    saveSelectionsBtnBH.textContent = originalText;
                }, 2000);
            }
        });
    }



    // --- RESTORED IMAGE UPLOAD LISTENERS ---
    const gamePlanUploadInput = document.getElementById('gamePlanImageUpload');
    const gamePlanUploadLabel = document.querySelector('label[for="gamePlanImageUpload"]');
    const gamePlanDisplayDiv = document.getElementById('gamePlanDisplay');
    if (gamePlanUploadInput && gamePlanUploadLabel && gamePlanDisplayDiv) {
        gamePlanUploadInput.addEventListener('change', () => {
            handleImageUpload(gamePlanUploadInput, gamePlanDisplayDiv, gamePlanUploadLabel, 'gamePlan');
        });
    }

    const announcementUploadInput = document.getElementById('announcementImageUpload');
    const announcementUploadLabel = document.getElementById('announcementUploadLabel');
    const announcementDisplayDiv = document.getElementById('factionAnnouncementsDisplay');
    if (announcementUploadInput && announcementUploadLabel && announcementDisplayDiv) {
        announcementUploadInput.addEventListener('change', () => {
            handleImageUpload(announcementUploadInput, announcementDisplayDiv, announcementUploadLabel, 'announcement');
        });
    }


    // Clear Image Buttons
    const clearGamePlanImageBtn = document.getElementById('clearGamePlanImageBtn');
    if (clearGamePlanImageBtn) {
        clearGamePlanImageBtn.addEventListener('click', async () => {
            const confirmed = await showCustomConfirm("Are you sure you want to remove the current Game Plan image?", "Confirm Removal");
            if (!confirmed) return;
            try {
                await db.collection('factionWars').doc('currentWar').set({
                    gamePlanImageUrl: null
                }, {
                    merge: true
                });
                if (gamePlanDisplay) gamePlanDisplay.innerHTML = '<p>No game plan available.</p>';
                alert('Game Plan image cleared!');
            } catch (error) {
                console.error("Error clearing game plan image:", error);
                alert('Failed to clear image.');
            }
        });
    }

    const clearAnnouncementImageBtn = document.getElementById('clearAnnouncementImageBtn');
    if (clearAnnouncementImageBtn) {
        clearAnnouncementImageBtn.addEventListener('click', async () => {
            const confirmed = await showCustomConfirm("Are you sure you want to remove the current Announcement image?", "Confirm Removal");
            if (!confirmed) return;
            try {
                await db.collection('factionWars').doc('currentWar').set({
                    announcementsImageUrl: null
                }, {
                    merge: true
                });
                if (factionAnnouncementsDisplay) factionAnnouncementsDisplay.innerHTML = '<p>No current announcements.</p>';
                alert('Announcement image cleared!');
            } catch (error) {
                console.error("Error clearing announcement image:", error);
                alert('Failed to clear image.');
            }
        });
    }

}); // --- END OF DOMCONTENTLOADED ---

/**
 * ==================================================================
 * BATTLE STATS COLOR CODING FUNCTIONS (V4 - 9-Tier Final)
 * ==================================================================
 */

// Helper function to parse a stat string into a number.
function parseStatValue(statString) {
    if (typeof statString !== 'string' || statString.trim() === '' || statString.toLowerCase() === 'n/a') {
        return 0;
    }
    let sanitizedString = statString.toLowerCase().replace(/,/g, '');
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
 * This function needs to be called after the table is populated.
 */
function applyStatColorCoding() {
    const table = document.getElementById('friendly-members-table');
    if (!table) {
        console.error("Color Coding Error: Could not find the table with ID 'friendly-members-table'.");
        return;
    }

    // This adds the 'table-striped' class to your table so the CSS rules will work.
    table.classList.add('table-striped');

    const statCells = table.querySelectorAll('tbody td:nth-child(3), tbody td:nth-child(4), tbody td:nth-child(5), tbody td:nth-child(6), tbody td:nth-child(7)');

    statCells.forEach(cell => {
        // First, remove any existing tier classes to ensure a clean slate (now checks for all 14)
        for (let i = 1; i <= 14; i++) {
            cell.classList.remove(`stat-tier-${i}`);
        }
        cell.classList.remove('stat-cell');

        // Now, determine and add the correct new class
        const value = parseStatValue(cell.textContent);
        let tierClass = '';

        // New 14-tier logic
        if (value >= 10000000000)      { tierClass = 'stat-tier-14'; } // 10b+
        else if (value >= 5000000000)  { tierClass = 'stat-tier-13'; } // 5b
        else if (value >= 2500000000)  { tierClass = 'stat-tier-12'; } // 2.5b
        else if (value >= 1000000000)  { tierClass = 'stat-tier-11'; } // 1b
        else if (value >= 500000000)   { tierClass = 'stat-tier-10'; } // 500m
        else if (value >= 250000000)   { tierClass = 'stat-tier-9'; }  // 250m
        else if (value >= 100000000)   { tierClass = 'stat-tier-8'; }  // 100m
        else if (value >= 50000000)    { tierClass = 'stat-tier-7'; }  // 50m
        else if (value >= 10000000)    { tierClass = 'stat-tier-6'; }  // 10m
        else if (value >= 5000000)     { tierClass = 'stat-tier-5'; }  // 5m
        else if (value >= 1000000)     { tierClass = 'stat-tier-4'; }  // 1m
        else if (value >= 100000)      { tierClass = 'stat-tier-3'; }  // 100k
        else if (value >= 10000)       { tierClass = 'stat-tier-2'; }  // 10k
        else if (value > 0)            { tierClass = 'stat-tier-1'; }

        if (tierClass) {
            cell.classList.add(tierClass);
            cell.classList.add('stat-cell'); // General class for stat cells
        }
    });
}

function blockLandscape() {
  const isMobileLandscape = window.matchMedia("(max-width: 1280px) and (orientation: landscape)").matches;
  let blocker = document.getElementById('landscape-blocker');

  if (isMobileLandscape) {
    if (!blocker) {
      blocker = document.createElement('div');
      blocker.id = 'landscape-blocker';
      blocker.innerHTML = `
        <div style="transform: rotate(0deg); font-size: 50px; margin-bottom: 20px;">📱</div>
        <h2 style="color: #00a8ff;">Please Rotate Your Device</h2>
        <p>This section is best viewed in portrait mode.</p>
      `;
      Object.assign(blocker.style, {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        backgroundColor: '#1c1c1c',
        color: '#eee',
        textAlign: 'center',
        zIndex: '99999'
      });
      document.body.appendChild(blocker);
    }
    document.body.style.overflow = 'hidden';
  } else {
    if (blocker) {
      blocker.remove();
    }
    document.body.style.overflow = '';
  }
}

function blockPortrait() {
  const isMobilePortrait = window.matchMedia("(max-width: 1280px) and (orientation: portrait)").matches;
  let blocker = document.getElementById('portrait-blocker');

  if (isMobilePortrait) {
    if (!blocker) {
      blocker = document.createElement('div');
      blocker.id = 'portrait-blocker';
      blocker.innerHTML = `
        <div style="transform: rotate(0deg); font-size: 50px; margin-bottom: 20px;">🔄</div>
        <h2 style="color: #00a8ff;">Please Rotate Your Device</h2>
        <p>This section is best viewed in landscape mode.</p>
      `;
      Object.assign(blocker.style, {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        backgroundColor: '#1c1c1c',
        color: '#eee',
        textAlign: 'center',
        zIndex: '99999'
      });
      document.body.appendChild(blocker);
    }
    document.body.style.overflow = 'hidden';
  } else {
    if (blocker) {
      blocker.remove();
    }
    document.body.style.overflow = '';
  }
}

function handleOrientation() {
    // Define which tabs should enforce landscape mode. All others will default to portrait.
    const landscapeRequiredTabs = [
        // 'active-ops', // <--- REMOVED from this list
        'war-availability',
        'leader-config',
        'friendly-status'
    ];

    // Find the currently active tab button to see which view is selected
    const activeTabButton = document.querySelector('.tab-button.active');
    const activeTabName = activeTabButton ? activeTabButton.dataset.tab : null;

    // Check if the currently active tab is one that requires landscape mode
    if (activeTabName && landscapeRequiredTabs.includes(activeTabName)) {
        // If it is, enforce landscape mode (by calling the function that blocks portrait)
        blockPortrait();
        // And make sure the other orientation blocker is removed, just in case
        document.getElementById('landscape-blocker')?.remove();
    } else {
        // If the active tab is not in the list (e.g., 'announcements' or 'active-ops'), enforce portrait mode
        blockLandscape();
        // And clean up the other blocker
        document.getElementById('portrait-blocker')?.remove();
    }
}

// --- Event Listeners ---
// Run the check when the page first loads.
window.addEventListener('load', handleOrientation);

// Run the check whenever the screen is resized or rotated.
window.addEventListener('resize', handleOrientation);

// IMPORTANT: Run the check every time a tab is clicked.
document.querySelector('.tab-navigation').addEventListener('click', () => {
    // We use a tiny delay to make sure the 'active' class has switched to the new tab before we run our check.
    setTimeout(handleOrientation, 50);
});