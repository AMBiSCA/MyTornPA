

// --- Global Variables ---
const db = firebase.firestore();
const auth = firebase.auth();
let userApiKey = null;
let factionApiFullData = null;
let currentTornUserName = 'Unknown';
let apiCallCounter = 0; // Counter for API call intervals
let globalEnemyFactionID = null; // Used to store the enemy ID for periodic fetches
let currentLiveChainSeconds = 0; // Stores the remaining chain timeout for local countdown
let lastChainApiFetchTime = 0; // Stores the timestamp of the last chain API fetch
let globalChainStartedTimestamp = 0; // Stores the actual chain start time from API
let globalChainCurrentNumber = 'N/A'; // Stores the actual chain number from API
let enemyDataGlobal = null; // Stores enemy faction data globally for access by other functions (e.g., Chain Score)
let globalRankedWarData = null;
let globalWarStartedActualTime = 0; // NEW: Stores the war start timestamp for live relative update
let unsubscribeFromChat = null; // <--- PASTE IT HERE
let profileFetchQueue = []; // Queue for processing profile image fetches
let isProcessingQueue = false; // Flag to indicate if the queue is currently being processed


// --- DOM Element Getters ---
const tabButtons = document.querySelectorAll('.tab-button');
const gamePlanDisplay = document.getElementById('gamePlanDisplay');
const warEnlistedStatus = document.getElementById('warEnlistedStatus');
const warTermedStatus = document.getElementById('warTermedStatus');
const warTermedWinLoss = document.getElementById('warTermedWinLoss');
const warChainingStatus = document.getElementById('warChainingStatus');
const warNoFlyingStatus = document.getElementById('warNoFlyingStatus');
const warTurtleStatus = document.getElementById('warTurtleStatus');
const warNextChainTimeStatus = document.getElementById('warNextChainTimeStatus');
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
const saveAdminsBtn = document.getElementById('saveAdminsBtn');
const saveEnergyTrackMembersBtn = document.getElementById('saveEnergyTrackMembersBtn');
const saveSelectionsBtnBH = document.getElementById('saveSelectionsBtnBH'); // Get Big Hitter Save button
const chainTimerDisplay = document.getElementById('chainTimerDisplay');
const currentChainNumberDisplay = document.getElementById('currentChainNumberDisplay');
const chainStartedDisplay = document.getElementById('chainStartedDisplay');
const yourFactionRankedScore = document.getElementById('yourFactionRankedScore');
const opponentFactionRankedScore = document.getElementById('opponentFactionRankedScore');
const warTargetScore = document.getElementById('warTargetScore');
const warStartedTime = document.getElementById('warStartedTime');
const yourFactionNameScoreLabel = document.getElementById('yourFactionNameScoreLabel');
const opponentFactionNameScoreLabel = document.getElementById('opponentFactionNameScoreLabel');
const friendlyMembersTbody = document.getElementById('friendly-members-tbody');
const chatTextInput = document.querySelector('.chat-text-input');
const chatSendBtn = document.querySelector('.chat-send-btn');
const currentTeamLeadDisplay = document.getElementById('warCurrentTeamLeadStatus');
const chatMessagesCollection = db.collection('factionChatMessages'); // This is where chat messages will be stored
const MAX_MESSAGES_VISIBLE = 7; // This constant forces only 7 messages to be visible at a time
const REMOVAL_DELAY_MS = 500;    // Matches the CSS transition duration (0.5s) for fade-out animation
const memberProfileCache = {}; // Cache for storing fetched member profile images
const FETCH_DELAY_MS = 500; // Delay in milliseconds between each individual member profile fetch
const factionMembersPanel = document.getElementById('faction-members-panel');
const factionChatDisplayArea = document.getElementById('chat-display-area'); // Already exists, but good to clarify
const friendsPanel = document.getElementById('friends');
const friendsListSection = document.getElementById('friends-list-section'); // The left container div
const friendsSearchInput = document.getElementById('friendsSearchInput'); // Input for friends search
const friendsScrollableList = document.getElementById('friendsScrollableList'); // Div to populate friends
const ignoresListSection = document.getElementById('ignores-list-section'); // The right container div
const ignoresSearchInput = document.getElementById('ignoresSearchInput'); // Input for ignores search
const ignoresScrollableList = document.getElementById('ignoresScrollableList'); // Div to populate ignores
const chatDisplayArea = document.getElementById('chat-display-area'); // This is the single, dynamic content area
const warChatBox = document.getElementById('warChatBox'); // The overall chat container
const chatTabsContainer = document.querySelector('.chat-tabs-container'); // Contains the buttons
const chatTabButtons = document.querySelectorAll('.chat-tab'); // All individual chat tab buttons
const chatInputArea = document.querySelector('.chat-input-area'); // The separate input section
const warChatDisplayArea = document.getElementById('warChatDisplayArea'); // Used for War Chat content
const privateChatDisplayArea = document.getElementById('privateChatDisplayArea'); // Used for Private Chat content
const factionMembersDisplayArea = document.getElementById('factionMembersDisplayArea'); // Used for Faction Members content
const recentlyMetDisplayArea = document.getElementById('recentlyMetDisplayArea'); // Used for Recently Met content
const blockedPeopleDisplayArea = document.getElementById('blockedPeopleDisplayArea'); // Used for Blocked People content
const settingsDisplayArea = document.getElementById('settingsDisplayArea'); // Used for Settings content


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

function updateMemberItemDisplay(itemElement, profileImageUrl) {
    const imgElement = itemElement.querySelector('.member-profile-pic');
    if (imgElement) {
        imgElement.src = profileImageUrl;
    }
}


// NEW/MODIFIED: Function to populate friendly faction member checkboxes (Admins, Energy Track)
function populateFriendlyMemberCheckboxes(members, savedAdmins = [], savedEnergyMembers = []) {
    if (!members || typeof members !== 'object') return;

    if (designatedAdminsContainer) designatedAdminsContainer.innerHTML = '';
    else { console.error("HTML Error: Cannot find element with ID 'designatedAdminsContainer'."); return; }

    if (energyTrackingContainer) energyTrackingContainer.innerHTML = '';
    else { console.error("HTML Error: Cannot find element with ID 'energyTrackingContainer'."); return; }

    const sortedMemberIds = Object.keys(members).sort((a, b) => {
        const nameA = members[a].name || '';
        const nameB = members[b].name || '';
        return nameA.localeCompare(nameB);
    });

    sortedMemberIds.forEach(memberId => {
        const member = members[memberId];
        const memberName = member.name || `Unknown (${memberId})`;

        // Create and append checkbox for Designate Admins
        const isAdminChecked = (savedAdmins && savedAdmins.includes(memberId)) ? 'checked' : '';
        const adminItemHtml = `<div class="member-selection-item"><input type="checkbox" id="admin-member-${memberId}" value="${memberId}" ${isAdminChecked}><label for="admin-member-${memberId}">${memberName}</label></div>`;
        designatedAdminsContainer.insertAdjacentHTML('beforeend', adminItemHtml);

        // Create and append checkbox for Energy Tracking Members
        const isEnergyChecked = (savedEnergyMembers && savedEnergyMembers.includes(memberId)) ? 'checked' : '';
        const energyItemHtml = `<div class="member-selection-item"><input type="checkbox" id="energy-member-${memberId}" value="${memberId}" ${isEnergyChecked}><label for="energy-member-${memberId}">${memberName}</label></div>`;
        energyTrackingContainer.insertAdjacentHTML('beforeend', energyItemHtml);
    });
}

// NEW: Function to handle switching chat tabs (now hides input area for Settings)
function switchChatTab(tabName) {
    console.log(`Switching to chat tab: ${tabName}`);

    if (!chatTabsContainer || chatTabButtons.length === 0 || !chatContentPanels || !chatInputArea) { // Added chatInputArea check
        console.error("Chat elements not found for tab switching or content panels, or input area.");
        return;
    }

    // Remove 'active' class from all tab buttons
    chatTabButtons.forEach(button => {
        button.classList.remove('active');
    });

    // Hide all chat content panels
    chatContentPanels.querySelectorAll('.chat-panel').forEach(panel => {
        panel.classList.remove('active');
    });

    // Unsubscribe from any active real-time chat listener by default when switching tabs
    if (unsubscribeFromChat) {
        unsubscribeFromChat();
        unsubscribeFromChat = null;
        console.log("Unsubscribed from previous chat listener (tab switch).");
    }

    // Add 'active' class to the clicked tab button
    const selectedChatTabButton = document.querySelector(`.chat-tab[data-chat-tab="${tabName}"]`);
    if (selectedChatTabButton) {
        selectedChatTabButton.classList.add('active');
        selectedChatTabButton.parentNode.scrollLeft = selectedChatTabButton.offsetLeft - (selectedChatTabButton.parentNode.offsetWidth / 2) + (selectedChatTabButton.offsetWidth / 2);
    }

    // Show the selected content panel and perform tab-specific actions
    let targetChatPanel = null;
    let targetDisplayArea = null;
    let showInputArea = true; // Default to showing input area

    switch (tabName) {
        case 'faction-chat':
            targetChatPanel = factionChatPanel;
            setupChatRealtimeListener();
            break;
        case 'faction-members':
            targetChatPanel = factionMembersPanel;
            targetDisplayArea = factionMembersDisplayArea;
            if (factionApiFullData && factionApiFullData.members) {
                displayFactionMembersInChatTab(factionApiFullData.members);
            } else if (targetDisplayArea) {
                targetDisplayArea.innerHTML = `<p>Loading faction member data...</p>`;
            }
            break;
        case 'private-chat':
            targetChatPanel = privateChatPanel;
            targetDisplayArea = privateChatDisplayArea;
            if (targetDisplayArea) targetDisplayArea.innerHTML = `<p>Welcome to Private Chat! Functionality not implemented yet.</p>`;
            break;
        case 'friends':
            targetChatPanel = friendsPanel;
            targetDisplayArea = friendsChatDisplayArea;
            if (targetDisplayArea) targetDisplayArea.innerHTML = `<p>Welcome to Friends Chat! Functionality not implemented yet.</p>`;
            break;
        case 'recently-met':
            targetChatPanel = recentlyMetPanel;
            targetDisplayArea = recentlyMetDisplayArea;
            if (targetDisplayArea) targetDisplayArea.innerHTML = `<p>Welcome to Recently Met! Functionality not implemented yet.</p>`;
            break;
        case 'blocked-people':
            if (blockedPeoplePanel) blockedPeoplePanel.classList.add('active'); // Activate the Blocked People panel
            // targetDisplayArea is not used here directly as content is managed internally by populateBlockedPeopleTab
            // Call a new function to handle populating this complex tab
            populateBlockedPeopleTab(); // NEW FUNCTION CALL
            showInputArea = false; // Hide global chat input as this tab has its own search inputs
            break;
        case 'settings':
            targetChatPanel = settingsPanel;
            targetDisplayArea = settingsDisplayArea;
            if (targetDisplayArea) {
                targetDisplayArea.innerHTML = `
                    <h4>Chat Settings</h4>
                    <p><i>Settings functionality not yet implemented.</i></p>
                    <p>Options for chat sound, notifications, font size, etc., would go here.</p>
                `;
            }
            showInputArea = false; // Hide input area for Settings tab
            break;
        default:
            console.warn(`Unknown chat tab: ${tabName}`);
            if (factionChatDisplayArea) {
                factionChatDisplayArea.innerHTML = `<p style="color: red;">Error: Unknown chat tab selected.</p>`;
            }
            break;
    }

    if (targetChatPanel) {
        targetChatPanel.classList.add('active'); // Show the selected panel
    } else {
        console.error(`No chat panel found for tab: ${tabName}`);
    }

    // Control visibility of the chat input area
    if (showInputArea) {
        chatInputArea.style.display = 'flex'; // Show input area (default flex)
    } else {
        chatInputArea.style.display = 'none'; // Hide input area
    }
}
// NEW: Helper function to format time remaining from seconds (Moved for proper scope)
function formatTime(seconds) {
    if (seconds <= 0) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    let result = '';
    if (h > 0) result += `${h}h `;
    if (m > 0) result += `${m}m `;
    if (s > 0) result += `${s}s`;
    return result.trim();
}

async function fetchAndDisplayChainData() { // No apiKey param needed, reads userApiKey global and factionApiFullData
  if (!factionApiFullData || !factionApiFullData.chain) {
    console.warn("Chain data not fully available in factionApiFullData.chain.");
    // Ensure display elements are reset if data is missing
    currentLiveChainSeconds = 0;
    lastChainApiFetchTime = 0;
    globalChainStartedTimestamp = 0;
    globalChainCurrentNumber = 'N/A';
    if (currentChainNumberDisplay) currentChainNumberDisplay.textContent = 'N/A';
    if (chainStartedDisplay) chainStartedDisplay.textContent = 'N/A';
    if (chainTimerDisplay) chainTimerDisplay.textContent = 'Chain Over'; // Also reset timer display
    return;
  }

  const chainData = factionApiFullData; // Use the globally fetched full data
  console.log("Chain API Data (from factionApiFullData):", chainData.chain); // Log for debugging

  if (chainData && chainData.chain) {
    // Store the relevant values globally for updateAllTimers to use
    currentLiveChainSeconds = chainData.chain.timeout || 0;
    lastChainApiFetchTime = Date.now(); // Store current time in milliseconds
    globalChainStartedTimestamp = chainData.chain.start || 0;
    globalChainCurrentNumber = chainData.chain.current || 'N/A'; // Store the actual chain number

    // Update the chain number display directly here, as it's not a countdown
    if (currentChainNumberDisplay) {
      currentChainNumberDisplay.textContent = globalChainCurrentNumber;
    }

    // Logic for Chain Started time display (no change from previous as requested)
    if (chainStartedDisplay) {
      const newChainStartedTimestamp = chainData.chain.start || 0;
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

  } else { // Should ideally not be hit if outer if (factionApiFullData.chain) handles it
    console.warn("Chain data not found within factionApiFullData.chain.");
    // Reset global variables if no chain data
    currentLiveChainSeconds = 0;
    lastChainApiFetchTime = 0;
    globalChainStartedTimestamp = 0;
    globalChainCurrentNumber = 'N/A';

    // Ensure display elements are reset if data is missing/invalid
    if (currentChainNumberDisplay) currentChainNumberDisplay.textContent = 'N/A';
    if (chainStartedDisplay) chainStartedDisplay.textContent = 'N/A';
    if (chainTimerDisplay) chainTimerDisplay.textContent = 'Chain Over';
  }
}

async function populateBlockedPeopleTab() {
    console.log("[Blocked People Tab] Populating tab...");

    // Set initial loading messages for the specific display areas
    if (friendsScrollableList) {
        friendsScrollableList.innerHTML = '<p style="text-align:center; padding: 10px;">Loading friends...</p>';
    }
    if (ignoresScrollableList) {
        ignoresScrollableList.innerHTML = '<p style="text-align:center; padding: 10px;">Loading ignores...</p>';
    }

    // The next steps will involve fetching data and rendering it here.
    // TODO: Step 1: Fetch friends data (from Firebase userProfile.friends or Torn API)
    // TODO: Step 2: Render friends data into friendsScrollableList
    // TODO: Step 3: Fetch ignores/blocked data (from Firebase userProfile.blocked or a dedicated collection)
    // TODO: Step 4: Render ignores/blocked data into ignoresScrollableList
    // TODO: Step 5: Implement search/filter functionality for both lists
    // TODO: Step 6: Implement action buttons (message, unfriend, block, unblock)
}


async function fetchAndDisplayRankedWarScores() { // Reads userApiKey global and factionApiFullData
    // NEW: Debugging logs to check condition variables
    console.log("DEBUG_RANKED_FINAL: Calling fetchAndDisplayRankedWarScores");
    console.log("DEBUG_RANKED_FINAL: factionApiFullData:", factionApiFullData);
    console.log("DEBUG_RANKED_FINAL: factionApiFullData.wars:", factionApiFullData ? factionApiFullData.wars : 'N/A');
    // URGENTLY CORRECTED: Logging the exact path requested by the user
    console.log("DEBUG_RANKED_FINAL: factionApiFullData.wars.ranked.faction (as urgently requested):", factionApiFullData && factionApiFullData.wars && factionApiFullData.wars.ranked ? factionApiFullData.wars.ranked.faction : 'Path not found: wars.ranked.faction');
    console.log("DEBUG_RANKED_FINAL: factionApiFullData.ID:", factionApiFullData ? factionApiFullData.ID : 'N/A');

    // URGENTLY CORRECTED: Primary data source now uses the user-specified path: factionApiFullData.wars.ranked.faction
    let activeWar = null; // Renamed from rankedWarData to activeWar directly based on new path assumption
    // Check for the full path factionApiFullData.wars.ranked.faction before proceeding
    if (factionApiFullData && factionApiFullData.wars && factionApiFullData.wars.ranked && factionApiFullData.wars.ranked.faction) { 
        activeWar = factionApiFullData.wars.ranked.faction; // Directly assign the assumed war object
    } else {
        console.warn("Ranked War Data (factionApiFullData.wars.ranked.faction) not available or path incorrect. Defaulting to 'N/A' display.");
    }
    
    // Condition now checks if 'activeWar' (from the new direct path) is populated and if it has the expected war/factions structure
    if (!factionApiFullData || !factionApiFullData.wars || !factionApiFullData.wars.ranked || !factionApiFullData.wars.ranked.faction || !factionApiFullData.ID || !activeWar.factions || !activeWar.war) { 
        console.warn("Ranked War Data not fully available (condition failed based on 'wars.ranked.faction' property or its content).");
        // Reset display if data is missing
        if (yourFactionRankedScore) yourFactionRankedScore.textContent = 'N/A';
        if (opponentFactionRankedScore) opponentFactionRankedScore.textContent = 'N/A';
        if (warTargetScore) warTargetScore.textContent = 'N/A';
        if (warStartedTime) warStartedTime.textContent = 'N/A';
        if (yourFactionNameScoreLabel) yourFactionNameScoreLabel.textContent = 'Your Faction:';
        if (opponentFactionNameScoreLabel) opponentFactionNameScoreLabel.textContent = 'Vs. Opponent:';
        return;
    }

    try {
        console.log("Ranked War API Data (from assumed factionApiFullData.wars.ranked.faction):", activeWar); // Log the data being used

        // No loop needed, as 'activeWar' is assumed to be the direct war object now
        const yourFactionId = factionApiFullData.ID; // Get our faction ID from full data

        // Now activeWar is directly the war object that contains factions and war details
        if (activeWar.factions && activeWar.war && activeWar.factions[yourFactionId]) {
            const opponentFactionId = Object.keys(activeWar.factions).find(id => id !== String(yourFactionId));
            const yourFactionInfo = activeWar.factions[yourFactionId];
            const opponentFactionInfo = activeWar.factions[opponentFactionId];

            // Update HTML elements
            if (yourFactionRankedScore) yourFactionRankedScore.textContent = yourFactionInfo ? yourFactionInfo.score || 'N/A' : 'N/A';
            if (yourFactionNameScoreLabel && yourFactionInfo) yourFactionNameScoreLabel.textContent = `${yourFactionInfo.name || 'Your Faction'}:`;

            if (opponentFactionRankedScore) opponentFactionRankedScore.textContent = opponentFactionInfo ? opponentFactionInfo.score || 'N/A' : 'N/A';
            if (opponentFactionNameScoreLabel && opponentFactionInfo) opponentFactionNameScoreLabel.textContent = `Vs. ${opponentFactionInfo.name || 'Opponent'}:`;

            if (warTargetScore) warTargetScore.textContent = activeWar.war.target || 'N/A';
            // Store globalWarStartedActualTime for updateAllTimers
            globalWarStartedActualTime = activeWar.war.start || 0;
            // warStartedTime.textContent will be handled by updateAllTimers for live relative display
            

        } else {
            // Data structure not as expected within the activeWar object or our faction not found
            console.warn("Active war data structure within 'wars.ranked.faction' not as expected or our faction not a participant.");
            if (yourFactionRankedScore) yourFactionRankedScore.textContent = 'N/A';
            if (opponentFactionRankedScore) opponentFactionRankedScore.textContent = 'N/A';
            if (warTargetScore) warTargetScore.textContent = 'N/A';
            globalWarStartedActualTime = 0; 
            if (warStartedTime) warStartedTime.textContent = 'N/A';
            if (yourFactionNameScoreLabel) yourFactionNameScoreLabel.textContent = 'Your Faction:';
            if (opponentFactionNameScoreLabel) opponentFactionNameScoreLabel.textContent = 'Vs. Opponent:';
        }

    } catch (error) {
        console.error("Error processing ranked war data from factionApiFullData.wars.ranked.faction:", error);
        if (yourFactionRankedScore) yourFactionRankedScore.textContent = 'Error';
        if (opponentFactionRankedScore) opponentFactionRankedScore.textContent = 'Error';
        if (warTargetScore) warTargetScore.textContent = 'Error';
        if (warStartedTime) warStartedTime.textContent = 'Error';
        if (yourFactionNameScoreLabel) yourFactionNameScoreLabel.textContent = 'Your Faction:';
        if (opponentFactionNameScoreLabel) opponentFactionNameScoreLabel.textContent = 'Vs. Opponent:';
    }
}

 function updateAllTimers() {
 console.count('updateAllTimers called');
 const nowInSeconds = Math.floor(Date.now() / 1000);

 // 1. Update Main Chain Timer (if nextChainTimeInput is a valid future timestamp - from Leader Config)
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
         // If it's not a valid number for a countdown, display the raw input or 'N/A' if empty
         // This prevents the flickering between user text and 'N/A'
         warNextChainTimeStatus.textContent = nextChainTimeValue || 'N/A';
     }
 }

 // 2. Update Enemy Target Timers (Hospital and Traveling) - Local countdowns only
 if (enemyTargetsContainer) {
    const statusCells = enemyTargetsContainer.querySelectorAll('td[data-until]');

    statusCells.forEach(cell => {
        const targetTime = parseInt(cell.dataset.until, 10);
        const statusState = cell.dataset.statusState;
        const originalDescription = cell.textContent.split('(')[0].trim();

        if (!isNaN(targetTime) && targetTime > 0) {
            const timeLeft = targetTime - nowInSeconds;

            if (timeLeft > 0) {
                if (statusState === 'Hospital') {
                    cell.textContent = `In Hospital (${formatTime(timeLeft)})`;
                } else if (statusState === 'Traveling') {
                    if (originalDescription === 'Returning') {
                        cell.textContent = `Returning Home (${formatTime(timeLeft)})`;
                    } else {
                        cell.textContent = `${originalDescription} (${formatTime(timeLeft)})`;
                    }
                }
            } else {
                if (statusState === 'Hospital') {
                    cell.textContent = `Okay`;
                    cell.classList.remove('status-hospital', 'status-other', 'status-okay');
                } else if (statusState === 'Traveling') {
                    if (originalDescription === 'Returning') {
                        // CORRECTED: Set text to Okay and remove classes to revert to default (white) style.
                        cell.textContent = `Okay`;
                        cell.classList.remove('status-traveling', 'status-other', 'status-okay');
                    } else {
                        // Update text to "In [Destination]" and keep the orange style for arrived users.
                        const destination = originalDescription.replace('Traveling to ', '').replace('Traveling ', '');
                        cell.textContent = `In ${destination}`;
                        // The class list is intentionally not changed here to keep the orange 'traveling' style.
                    }
                } else {
                    cell.textContent = `${statusState} (Time Up)`;
                    cell.classList.remove('status-hospital', 'status-traveling', 'status-other');
                    cell.classList.add('status-okay');
                }
            }
        }
    });
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

// ... (Your existing Utility Functions, e.g., formatTime, formatTornTime, filterProfanity if present) ...

// NEW: Function to display a message in the chat area
function displayChatMessage(messageObj) {
    if (!chatDisplayArea) {
        console.error("Chat display area not found in displayChatMessage function.");
        return;
    }

    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message'); // Add a class for styling messages (you can define this in your CSS)

   const timestamp = messageObj.timestamp && typeof messageObj.timestamp.toDate === 'function' 
                  ? messageObj.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); // Fallback if timestamp is missing or not a Firebase Timestamp
    const senderName = messageObj.sender || 'Unknown';
    const messageText = messageObj.text || '';

    // Basic structure for a chat message
  messageElement.innerHTML = `
    <span class="chat-timestamp">[${timestamp}]</span>
    <span class="chat-sender">${senderName}:</span>
    <span class="chat-text">${messageText}</span>
`;
    chatDisplayArea.appendChild(messageElement);

    // Automatically scroll to the bottom of the chat to show the latest message
    chatDisplayArea.scrollTop = chatDisplayArea.scrollHeight;
}

function manageChatMessages() {
    if (!chatMessagesDisplay) {
        console.error("Chat display area not found. Cannot manage messages.");
        return;
    }
    const messages = chatMessagesDisplay.querySelectorAll('.chat-message');
    if (messages.length > MAX_MESSAGES_VISIBLE) {
        const messagesToRemoveCount = messages.length - MAX_MESSAGES_VISIBLE;
        for (let i = 0; i < messagesToRemoveCount; i++) {
            const messageToFade = messages[i];
            messageToFade.classList.add('fade-out');
            setTimeout(() => {
                if (messageToFade.parentNode === chatMessagesDisplay) {
                    chatMessagesDisplay.removeChild(messageToFade);
                }
            }, REMOVAL_DELAY_MS);
        }
    }
}


async function sendChatMessage() {
    if (!chatTextInput || !auth.currentUser || !userApiKey) {
        console.warn("Cannot send message: Chat input, logged-in user, or API key not available.");
        // Optionally, show a user-friendly message on the UI if elements/data are missing
        return;
    }

    const messageText = chatTextInput.value.trim();
    if (messageText === '') {
        return; // Don't send empty messages
    }

    // --- IMPORTANT: Ensure filterProfanity function is present in your file ---
    // If you deleted filterProfanity previously, this line will cause an error.
    // If you want profanity filtering, ensure the filterProfanity function is defined in your utilities.
    const filteredMessage = typeof filterProfanity === 'function' ? filterProfanity(messageText) : messageText;

    const messageObj = {
        senderId: auth.currentUser.uid,
        sender: currentTornUserName, // This global variable should hold the logged-in Torn user's name
        text: filteredMessage,
        timestamp: firebase.firestore.FieldValue.serverTimestamp() // Use server timestamp for accuracy
    };

    try {
        // Save the message to Firestore
        await chatMessagesCollection.add(messageObj);
        console.log("Message sent to Firebase:", messageObj);

        // No longer display locally immediately here, as the real-time listener will handle it.
        // displayChatMessage(messageObj); // REMOVED: Real-time listener will display

        chatTextInput.value = ''; // Clear the input field after sending
        chatTextInput.focus(); // Keep focus on the input field for quick replies

    } catch (error) {
        console.error("Error sending message to Firebase:", error);
        alert("Failed to send message. See console for details.");
    }
}

// NEW: Function to set up real-time listener for chat messages
function setupChatRealtimeListener() {
    if (!chatMessagesCollection) {
        console.error("Firebase chatMessagesCollection is not defined.");
        return;
    }

    // Clear existing messages before setting up a new listener (important when switching tabs/channels later)
    if (chatDisplayArea) {
        chatDisplayArea.innerHTML = `<p>Loading messages...</p>`;
    }

    // Unsubscribe from any previous listener to avoid multiple listeners
    if (unsubscribeFromChat) {
        unsubscribeFromChat();
        console.log("Unsubscribed from previous chat listener.");
    }

    // Set up the real-time listener, ordered by timestamp
    unsubscribeFromChat = chatMessagesCollection
        .orderBy('timestamp', 'asc') // Order messages by timestamp
        .limit(100) // Limit to the last 100 messages for performance
        .onSnapshot(snapshot => {
            // Clear the chat display area to re-render all messages
            if (chatDisplayArea) {
                chatDisplayArea.innerHTML = '';
            }

            if (snapshot.empty) {
                if (chatDisplayArea) {
                    chatDisplayArea.innerHTML = `<p>No messages yet. Be the first to say hello!</p>`;
                }
                console.log("No messages in chat collection.");
                return;
            }

            snapshot.forEach(doc => {
                const message = doc.data();
                displayChatMessage(message); // Use the existing function to display each message
            });
            console.log("Chat messages updated in real-time.");
        }, error => {
            console.error("Error listening to chat messages:", error);
            if (chatDisplayArea) {
                chatDisplayArea.innerHTML = `<p style="color: red;">Error loading messages: ${error.message}</p>`;
            }
        });
    console.log("Chat real-time listener set up.");
}

// ... (Your existing claimTarget and unclaimTarget functions) ...
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
            // Corrected function call
            displayEnemyTargetsTable(enemyData.members);
            populateEnemyMemberCheckboxes(enemyData.members, savedWatchlistMembers);
        } else {
            console.warn("Enemy faction members data not found.");
            // Corrected function call
            displayEnemyTargetsTable(null);
            populateEnemyMemberCheckboxes({}, []);
        }
    } catch (error) {
        console.error('Error fetching enemy faction data:', error);
        if (factionTwoNameEl) factionTwoNameEl.textContent = 'Invalid Enemy ID';
        if (factionTwoMembersEl) factionTwoTwoMembersEl.textContent = 'N/A';
        // REMOVED: if (factionTwoPicEl) factionTwoPicEl.style.backgroundImage = ''; // This line is now removed
        displayEnemyTargetsTable(null);
        populateEnemyMemberCheckboxes({}, []);
    }
}
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

  // --- ADD THIS NEW BLOCK BELOW YOUR EXISTING updateAllTimers LOGIC ---
  if (userApiKey) {
    fetchAndDisplayChainData(userApiKey);
  } else {
    console.warn("API key not available. Cannot update chain timer.");
  }
  
// NEW: Function to handle claiming a target
// UPDATED: Function to handle claiming a target and changing it to an "Unclaim" button
function claimTarget(memberId) {
    const claimBtn = document.getElementById(`claim-btn-${memberId}`);
    const targetRow = document.getElementById(`target-row-${memberId}`);

    if (claimBtn) {
        // Change the button text and make its new function call unclaimTarget
        claimBtn.textContent = 'Unclaim';
        claimBtn.setAttribute('onclick', `unclaimTarget('${memberId}')`);
    }
    
    // Change the row color to show it's claimed
    if (targetRow) {
        targetRow.style.backgroundColor = '#4a4a4a'; // A dark grey color
    }
}

function unclaimTarget(memberId) {
    const claimBtn = document.getElementById(`claim-btn-${memberId}`);
    const targetRow = document.getElementById(`target-row-${memberId}`);

    if (claimBtn) {
        // Change the button text and function back to 'Claim'
        claimBtn.textContent = 'Claim';
        claimBtn.setAttribute('onclick', `claimTarget('${memberId}')`);
    }

    if (targetRow) {
        // Reset the row's background color by removing the inline style
        targetRow.style.backgroundColor = '';
    }
}

// NEW: Function to build and display the enemy targets table (Single Table & Sticky Header compatible)
// MODIFIED: Function to build and display the enemy targets table (Single Table & Sticky Header compatible)
function displayEnemyTargetsTable(members) {
    if (!enemyTargetsContainer) {
        console.error("HTML Error: Cannot find element with ID 'enemyTargetsContainer'.");
        return;
    }

    // Clear the container first
    enemyTargetsContainer.innerHTML = '';

    if (!members || Object.keys(members).length === 0) {
        enemyTargetsContainer.innerHTML = '<div class="no-targets-message">No enemy members to display. Set an enemy faction in Leader Config.</div>';
        return;
    }

    // Build the entire table HTML string
    let tableHtml = `<table class="enemy-targets-table">
                         <thead>
                             <tr>
                                 <th class="col-name">Name (ID)</th>
                                 <th class="col-level">Level</th>
                                 <th class="col-last-action">Last Action</th> <th class="col-status">Status</th>
                                 <th class="col-claim">Claim</th>
                                 <th class="col-attack">Attack</th>
                             </tr>
                         </thead>
                         <tbody>`;

    const membersArray = Object.values(members);
    const nowInSeconds = Math.floor(Date.now() / 1000); // Get current time once for efficiency

    for (const member of membersArray) {
        const memberId = member.id;
        const profileUrl = `https://www.torn.com/profiles.php?XID=${memberId}`;
        const attackUrl = `https://www.torn.com/loader.php?sid=attack&user2ID=${memberId}`;

        let statusText = member.status.description;
        let statusClass = '';
        let dataUntil = '';
        let statusState = member.status.state;

        if (member.status.state === 'Hospital') {
            statusClass = 'status-hospital';
            dataUntil = member.status.until;
            const timeLeft = member.status.until - nowInSeconds;
            statusText = `In Hospital (${formatTime(timeLeft)})`;
        } else if (member.status.state === 'Traveling') {
            statusClass = 'status-traveling';
            dataUntil = member.status.until;
            const timeLeft = member.status.until - nowInSeconds;
            if (timeLeft <= 0) {
                statusText = `Arrived${member.status.description.replace('Traveling to ', '') ? ` (${member.status.description.replace('Traveling to ', '')})` : ''}`;
            } else {
                statusText = `${member.status.description} (${formatTime(timeLeft)})`; // <-- MODIFIED LINE
            }
        } else if (member.status.state !== 'Okay') {
            statusClass = 'status-other';
        }

        // Determine Last Action text
        const lastActionTimestamp = member.last_action ? member.last_action.timestamp : null;
        const lastActionText = formatRelativeTime(lastActionTimestamp); // Use the new function here

        tableHtml += `<tr id="target-row-${memberId}">
                               <td class="col-name"><a href="${profileUrl}" target="_blank">${member.name} (${memberId})</a></td>
                               <td class="col-level">${member.level}</td>
                               <td class="col-last-action">${lastActionText}</td> <td class="col-status ${statusClass}" ${dataUntil ? `data-until="${dataUntil}" data-status-state="${statusState}"` : ''}>${statusText}</td>
                               <td class="col-claim"><button id="claim-btn-${memberId}" class="claim-btn" onclick="claimTarget('${memberId}')">Claim</button></td>
                               <td class="col-attack"><a id="attack-link-${memberId}" href="${attackUrl}" class="attack-link" target="_blank">Attack</a></td>
                           </tr>`;
    }
    tableHtml += `</tbody></table>`;

    enemyTargetsContainer.innerHTML = tableHtml;
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

async function displayQuickFFTargets(userApiKey, playerId) {
    const quickFFTargetsDisplay = document.getElementById('quickFFTargetsDisplay');
    if (!quickFFTargetsDisplay) {
        console.error("HTML Error: Cannot find element with ID 'quickFFTargetsDisplay'.");
        return;
    }

    quickFFTargetsDisplay.innerHTML = '<span style="color: #6c757d;">Loading targets...</span>'; // Loading state

    if (!userApiKey || !playerId) {
        quickFFTargetsDisplay.innerHTML = '<span style="color: #ff4d4d;">API Key or Player ID missing.</span>';
        console.warn("Cannot fetch Quick FF Targets: API Key or Player ID is missing.");
        return;
    }

    try {
        // 1. Get IDs of players currently in the main enemy table
        const currentEnemyTableRows = enemyTargetsContainer.querySelectorAll('tr[id^="target-row-"]');
        const excludedPlayerIDs = Array.from(currentEnemyTableRows).map(row => row.id.replace('target-row-', ''));
        console.log("Excluded Player IDs (from main table):", excludedPlayerIDs);

        const functionUrl = `/.netlify/functions/get-recommended-targets`;
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: userApiKey, playerId: playerId })
        });
        const data = await response.json();

        if (!response.ok || data.error) {
            const errorMessage = data.error || `Error from server: ${response.status} ${response.statusText}`;
            quickFFTargetsDisplay.innerHTML = `<span style="color: #ff4d4d;">Error: ${errorMessage}</span>`;
            console.error("Error fetching Quick FF Targets:", errorMessage);
            return;
        }
 
        if (!data.targets || data.targets.length === 0) {
            quickFFTargetsDisplay.innerHTML = '<span style="color: #6c757d;">No recommended targets found.</span>';
            return;
        }

        // 2. Filter out already displayed targets from the fetched list
        const availableTargets = data.targets.filter(target => !excludedPlayerIDs.includes(target.playerID));
        console.log("Available targets after exclusion:", availableTargets);

        if (availableTargets.length === 0) {
            quickFFTargetsDisplay.innerHTML = '<span style="color: #6c757d;">No new targets available.</span>';
            return;
        }

        // 3. Shuffle the available targets (Fisher-Yates algorithm)
        for (let i = availableTargets.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableTargets[i], availableTargets[j]] = [availableTargets[j], availableTargets[i]]; // Swap
        }
        console.log("Shuffled available targets:", availableTargets);

        // Clear existing content to populate with new links
        quickFFTargetsDisplay.innerHTML = '';

        // Display up to the first 2 unique and random targets
        for (let i = 0; i < Math.min(2, availableTargets.length); i++) {
            const target = availableTargets[i];
            const attackUrl = `https://www.torn.com/loader.php?sid=attack&user2ID=${target.playerID}`;
            const targetName = target.playerName || `Target ${i + 1}`; // Fallback name

            const targetHtml = `
                <a href="${attackUrl}" target="_blank"
                   class="quick-ff-target-btn"
                   title="${targetName} (ID: ${target.playerID}) - Fair Fight: ${target.fairFightScore} (${get_difficulty_text(parseFloat(target.fairFightScore))})">
                    ${targetName}
                </a>
            `;
            quickFFTargetsDisplay.insertAdjacentHTML('beforeend', targetHtml);
        }

    } catch (error) {
        console.error("Failed to fetch or display Quick FF Targets:", error);
        quickFFTargetsDisplay.innerHTML = `<span style="color: #ff4d4d;">Failed to load targets.</span>`;
    }
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

async function initializeAndLoadData(apiKey) {
    try {
        // CORRECTED & CONFIRMED URL: Request 'basic', 'members', 'chain', and 'wars' selections
        const userFactionApiUrl = `https://api.torn.com/v2/faction/?selections=basic,members,chain,wars&key=${apiKey}&comment=MyTornPA_WarHub_Combined`;

        console.log("Attempting to fetch faction data with specified selections:", userFactionApiUrl);

        const userFactionResponse = await fetch(userFactionApiUrl);

        if (!userFactionResponse.ok) {
            throw new Error(`Server responded with an error: ${userFactionResponse.status} ${userFactionResponse.statusText}`);
        }

        factionApiFullData = await userFactionResponse.json();
        console.log("Faction API Full Data (basic,members,chain,wars):", factionApiFullData); // Log the full response

        if (factionApiFullData.error) {
            console.error("Torn API responded with a detailed error:", factionApiFullData.error);
            throw new Error(`Torn API Error: ${JSON.stringify(factionApiFullData.error)}`);
        }

        // Pass warData and apiKey to populateUiComponents
        const warDoc = await db.collection('factionWars').doc('currentWar').get();
        const warData = warDoc.exists ? warDoc.data() : {};
        populateUiComponents(warData, apiKey); // Pass warData and apiKey

    } catch (error) {
        console.error("Error during comprehensive data initialization:", error);
        if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = 'Error Loading War Hub Data.';
        // Reset related displays on error
        if (currentChainNumberDisplay) currentChainNumberDisplay.textContent = 'Error';
        if (chainStartedDisplay) chainStartedDisplay.textContent = 'Error';
        if (chainTimerDisplay) chainTimerDisplay.textContent = 'Error';
        if (yourFactionRankedScore) yourFactionRankedScore.textContent = 'N/A';
        if (opponentFactionRankedScore) opponentFactionRankedScore.textContent = 'N/A';
        if (warTargetScore) warTargetScore.textContent = 'N/A';
        if (warStartedTime) warStartedTime.textContent = 'N/A';
        if (yourFactionNameScoreLabel) yourFactionNameScoreLabel.textContent = 'Your Faction:';
        if (opponentFactionNameScoreLabel) opponentFactionNameScoreLabel.textContent = 'Vs. Opponent:';
    }
}

      function populateUiComponents(warData, apiKey) { // warData is passed from initializeAndLoadData
    // Basic Faction Info (from global factionApiFullData)
    if (factionApiFullData) {
        if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = `${factionApiFullData.basic.name || "Your Faction"}'s War Hub.`;
        if (factionOneNameEl) factionOneNameEl.textContent = factionApiFullData.basic.name || 'Your Faction';
        if (factionOneMembersEl) factionOneMembersEl.textContent = `Total Members: ${factionApiFullData.members ? (factionApiFullData.members.total || Object.keys(factionApiFullData.members).length) : 'N/A'}`;

        // This block now populates checkboxes AND the new friendly members table
        if (factionApiFullData.members) { 
            populateFriendlyMemberCheckboxes(
                factionApiFullData.members,
                warData.tab4Admins || [],
                warData.energyTrackingMembers || []
            );
            
            // --- NEW LINE ADDED HERE ---
            displayFriendlyMembersTable(factionApiFullData.members); 

        } else {
            console.warn("factionApiFullData.members not available for friendly member checkboxes.");
            populateFriendlyMemberCheckboxes({}, []); // Clear checkboxes if members data is missing
        }
    } else {
        console.warn("factionApiFullData not available in populateUiComponents.");
        if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = "Faction War Hub. (Data Loading...)";
        if (factionOneNameEl) factionOneNameEl.textContent = 'Your Faction';
        if (factionOneMembersEl) factionOneMembersEl.textContent = 'N/A';
    }
    
    // Game Plan & Announcements (from Firebase warData)
    if (gamePlanDisplay) gamePlanDisplay.textContent = warData.gamePlan || 'No game plan available.';
    if (factionAnnouncementsDisplay) factionAnnouncementsDisplay.textContent = warData.quickAnnouncement || 'No current announcements.';
    if (gamePlanEditArea) gamePlanEditArea.value = warData.gamePlan || '';

    populateWarStatusDisplay(warData); // Uses warData (Firebase)
    loadWarStatusForEdit(warData); // Uses warData (Firebase)

    // Store enemy faction ID globally (from Firebase warData)
    globalEnemyFactionID = warData.enemyFactionID || null;

    // Display enemy targets table (still needs enemyData via separate fetch)
    if (warData.enemyFactionID) {
        fetchAndDisplayEnemyFaction(warData.enemyFactionID, apiKey);
    } else {
        if (factionTwoNameEl) factionTwoNameEl.textContent = 'No Enemy Set';
        if (factionTwoMembersEl) factionTwoMembersEl.textContent = 'N/A';
        populateEnemyMemberCheckboxes({}, []);
        displayEnemyTargetsTable(null); // This clears the table
    }
}

/**
 * Builds and displays the table for the user's own faction members.
 * @param {object} members - The members object from the API.
 */
function displayFriendlyMembersTable(members) {
    if (!friendlyMembersTbody) {
        console.error("JavaScript error: Cannot find the 'friendly-members-tbody' element.");
        return;
    }

    // Clear the "Loading..." message from the table body
    friendlyMembersTbody.innerHTML = '';

    // Check if members array is empty or null/undefined
    if (!members || members.length === 0) { // Changed Object.keys(members).length === 0 to members.length === 0 for arrays
        friendlyMembersTbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding: 20px;">Member data not available.</td></tr>`;
        return;
    }

    // Since 'members' is already an array from the API response,
    // we can directly use it, no need for Object.values(members)
    // if it's consistently an array.
    const membersArray = members; 

    // Sort the array by the member's name
    membersArray.sort((memberA, memberB) => memberA.name.localeCompare(memberB.name));

    let allRowsHtml = '';

    // Loop directly through the member objects
    for (const member of membersArray) {
        const tornPlayerId = member.id;

        console.log("Friendly member data:", tornPlayerId, member); // Keep this debug log

        if (!tornPlayerId) {
            console.warn("Skipping friendly member due to missing Torn Player ID:", member);
            continue;
        }

        // CORRECTED URL: Changed www.com to www.torn.com
        const profileUrl = `https://www.torn.com/profiles.php?XID=${tornPlayerId}`;
        const name = member.name;
        const level = member.level;
        const lastAction = member.last_action ? formatRelativeTime(member.last_action.timestamp) : 'N/A';
        const status = member.status ? member.status.description : 'N/A';

        // Placeholders for stats
        const strength = 'N/A';
        const dexterity = 'N/A';
        const speed = 'N/A';
        const defense = 'N/A';
        const nerve = 'N/A';
        const energy = 'N/A';

        allRowsHtml += `
            <tr data-id="${tornPlayerId}">
                <td><a href="${profileUrl}" target="_blank">${name} [${tornPlayerId}]</a></td>
                <td>${level}</td>
                <td>${lastAction}</td>
                <td>${strength}</td>
                <td>${dexterity}</td>
                <td>${speed}</td>
                <td>${defense}</td>
                <td>${status}</td>
                <td>${nerve}</td>
                <td>${energy}</td>
            </tr>
        `;
    }

    friendlyMembersTbody.innerHTML = allRowsHtml;
}


async function displayFactionMembersInChatTab(factionMembersApiData, targetDisplayElement) {
    if (!targetDisplayElement) {
        console.error("HTML Error: Target display element not provided for faction members list.");
        return;
    }

    targetDisplayElement.innerHTML = `<p>Loading faction members details...</p>`;

    if (!factionMembersApiData || typeof factionMembersApiData !== 'object' || Object.keys(factionMembersApiData).length === 0) {
        targetDisplayElement.innerHTML = `<p>No faction members found.</p>`;
        return;
    }

    const membersArray = Object.values(factionMembersApiData);

    // Sort members by rank (Leader, Co-leader, Member, Applicant) then alphabetically by name
    const rankOrder = { "Leader": 0, "Co-leader": 1, "Member": 99, "Applicant": 100 };
    membersArray.sort((a, b) => {
        const orderA = rankOrder[a.position] !== undefined ? rankOrder[a.position] : rankOrder["Member"]; // Changed 'a.rank' to 'a.position'
        const orderB = rankOrder[b.position] !== undefined ? rankOrder[b.position] : rankOrder["Member"]; // Changed 'b.rank' to 'b.position'
        if (orderA !== orderB) { return orderA - orderB; }
        return a.name.localeCompare(b.name);
    });

    const fetchPromises = [];

    const membersListContainer = document.createElement('div');
    membersListContainer.classList.add('members-list-container');
    targetDisplayElement.innerHTML = '';
    targetDisplayElement.appendChild(membersListContainer);

    for (const member of membersArray) {
        const tornPlayerId = member.id;
        const memberName = member.name;
        const memberRank = member.position; // <--- CORRECTED THIS LINE: Used 'position' instead of 'rank'

        const memberItemDiv = document.createElement('a');
        memberItemDiv.href = `https://www.torn.com/profiles.php?XID=${tornPlayerId}`;
        memberItemDiv.target = '_blank';
        memberItemDiv.rel = 'noopener noreferrer';
        memberItemDiv.classList.add('member-item');
        if (memberRank === "Leader" || memberRank === "Co-leader") {
            memberItemDiv.classList.add('leader-member');
        }

        memberItemDiv.innerHTML = `
            <img src="../../images/default_profile_icon.png" alt="${memberName}'s profile picture" class="member-profile-pic">
            <span class="member-name">${memberName}</span>
            <span class="member-rank">${memberRank}</span>
        `;
        membersListContainer.appendChild(memberItemDiv);

        if (db) {
            fetchPromises.push((async () => {
                try {
                    const docRef = db.collection('users').doc(String(tornPlayerId));
                    const docSnap = await docRef.get();

                    console.log(`[Firestore Debug] For member ${tornPlayerId}, docSnap.exists: ${docSnap.exists}`);

                    if (docSnap.exists) {
                        const firebaseMemberData = docSnap.data();
                        const profileImageUrl = firebaseMemberData.profile_image || '../../images/default_profile_icon.png';
                        const imgElement = memberItemDiv.querySelector('.member-profile-pic');
                        if (imgElement) {
                            imgElement.src = profileImageUrl;
                            console.log(`[Firestore Debug] Updated image for ${tornPlayerId} with URL: ${profileImageUrl}`);
                        }
                    } else {
                        console.warn(`[Firestore] No detailed data found for member ${tornPlayerId} in 'users' collection.`);
                    }
                } catch (error) {
                    console.error(`[Firestore Error] Failed to fetch detailed data for member ${tornPlayerId}:`, error);
                }
            })());
        }
    }

    await Promise.all(fetchPromises);
    console.log("Faction members list populated with available profile images from database.");
}
// NEW: Function to handle switching chat tabs (now includes Settings tab)
function switchChatTab(tabName) {
    console.log(`Switching to chat tab: ${tabName}`);

    if (!chatTabsContainer || chatTabButtons.length === 0 || !chatContentPanels) {
        console.error("Chat elements not found for tab switching or content panels.");
        return;
    }

    // Remove 'active' class from all tab buttons
    chatTabButtons.forEach(button => {
        button.classList.remove('active');
    });

    // Hide all chat content panels
    chatContentPanels.querySelectorAll('.chat-panel').forEach(panel => {
        panel.classList.remove('active');
    });

    // Unsubscribe from any active real-time chat listener by default when switching tabs
    if (unsubscribeFromChat) {
        unsubscribeFromChat();
        unsubscribeFromChat = null;
        console.log("Unsubscribed from previous chat listener (tab switch).");
    }


    // Add 'active' class to the clicked tab button
    const selectedChatTabButton = document.querySelector(`.chat-tab[data-chat-tab="${tabName}"]`);
    if (selectedChatTabButton) {
        selectedChatTabButton.classList.add('active');
        selectedChatTabButton.parentNode.scrollLeft = selectedChatTabButton.offsetLeft - (selectedChatTabButton.parentNode.offsetWidth / 2) + (selectedChatTabButton.offsetWidth / 2);
    }

    // Show the selected content panel and perform tab-specific actions
    let targetChatPanel = null;
    let targetDisplayArea = null; 

    switch (tabName) {
        case 'faction-chat':
            targetChatPanel = factionChatPanel;
            setupChatRealtimeListener(); // Start listening for messages in faction chat
            break;
        case 'faction-members':
            targetChatPanel = factionMembersPanel;
            targetDisplayArea = factionMembersDisplayArea;
            if (factionApiFullData && factionApiFullData.members) {
                 displayFactionMembersInChatTab(factionApiFullData.members); // Pass members to display function
            } else if (targetDisplayArea) {
                 targetDisplayArea.innerHTML = `<p>Loading faction member data...</p>`;
            }
            break;
        case 'private-chat':
            targetChatPanel = privateChatPanel;
            targetDisplayArea = privateChatDisplayArea;
            if (targetDisplayArea) targetDisplayArea.innerHTML = `<p>Welcome to Private Chat! Functionality not implemented yet.</p>`;
            break;
        case 'friends':
            targetChatPanel = friendsPanel;
            targetDisplayArea = friendsChatDisplayArea;
            if (targetDisplayArea) targetDisplayArea.innerHTML = `<p>Welcome to Friends Chat! Functionality not implemented yet.</p>`;
            break;
        case 'recently-met':
            targetChatPanel = recentlyMetPanel;
            targetDisplayArea = recentlyMetDisplayArea;
            if (targetDisplayArea) targetDisplayArea.innerHTML = `<p>Welcome to Recently Met! Functionality not implemented yet.</p>`;
            break;
        case 'blocked-people':
            targetChatPanel = blockedPeoplePanel;
            targetDisplayArea = blockedPeopleDisplayArea;
            if (targetDisplayArea) targetDisplayArea.innerHTML = `<p>Welcome to Blocked People! Functionality not implemented yet.</p>`;
            break;
        case 'settings': // NEW: Case for the Settings tab
            targetChatPanel = settingsPanel;
            targetDisplayArea = settingsDisplayArea;
            if (targetDisplayArea) {
                targetDisplayArea.innerHTML = `
                    <h4>Chat Settings</h4>
                    <p><i>Settings functionality not yet implemented.</i></p>
                    <p>Options for chat sound, notifications, font size, etc., would go here.</p>
                `;
            }
            break;
        default:
            console.warn(`Unknown chat tab: ${tabName}`);
            if (factionChatDisplayArea) { // Fallback to faction chat display if unknown tab
                factionChatDisplayArea.innerHTML = `<p style="color: red;">Error: Unknown chat tab selected.</p>`;
            }
            break;
    }

    if (targetChatPanel) {
        targetChatPanel.classList.add('active'); // Show the selected panel
    } else {
        console.error(`No chat panel found for tab: ${tabName}`);
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
async function fetchAndDisplayChainData() { // No apiKey param needed, reads userApiKey global and factionApiFullData
  if (!factionApiFullData || !factionApiFullData.chain) {
    console.warn("Chain data not fully available in factionApiFullData.chain.");
    // Ensure display elements are reset if data is missing
    currentLiveChainSeconds = 0;
    lastChainApiFetchTime = 0;
    globalChainStartedTimestamp = 0;
    globalChainCurrentNumber = 'N/A';
    if (currentChainNumberDisplay) currentChainNumberDisplay.textContent = 'N/A';
    if (chainStartedDisplay) chainStartedDisplay.textContent = 'N/A';
    if (chainTimerDisplay) chainTimerDisplay.textContent = 'Chain Over'; // Also reset timer display
    return;
  }

  const chainData = factionApiFullData; // Use the globally fetched full data
  console.log("Chain API Data (from factionApiFullData):", chainData.chain); // Log for debugging

  if (chainData && chainData.chain) {
    // Store the relevant values globally for updateAllTimers to use
    currentLiveChainSeconds = chainData.chain.timeout || 0;
    lastChainApiFetchTime = Date.now(); // Store current time in milliseconds
    globalChainStartedTimestamp = chainData.chain.start || 0;
    globalChainCurrentNumber = chainData.chain.current || 'N/A'; // Store the actual chain number

    // Update the chain number display directly here, as it's not a countdown
    if (currentChainNumberDisplay) {
      currentChainNumberDisplay.textContent = globalChainCurrentNumber;
    }

    // Logic for Chain Started time display (no change from previous as requested)
    if (chainStartedDisplay) {
      const newChainStartedTimestamp = chainData.chain.start || 0;
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

  } else { // Should ideally not be hit if outer if (factionApiFullData.chain) handles it
    console.warn("Chain data not found within factionApiFullData.chain.");
    // Reset global variables if no chain data
    currentLiveChainSeconds = 0;
    lastChainApiFetchTime = 0;
    globalChainStartedTimestamp = 0;
    globalChainCurrentNumber = 'N/A';

    // Ensure display elements are reset if data is missing/invalid
    if (currentChainNumberDisplay) currentChainNumberDisplay.textContent = 'N/A';
    if (chainStartedDisplay) chainStartedDisplay.textContent = 'N/A';
    if (chainTimerDisplay) chainTimerDisplay.textContent = 'Chain Over';
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
}

function loadWarStatusForEdit(warData = {}) {
    if (toggleEnlisted) toggleEnlisted.checked = warData.toggleEnlisted || false;
    if (toggleTermedWar) toggleTermedWar.checked = warData.toggleTermedWar || false;
    if (toggleTermedWinLoss) toggleTermedWinLoss.checked = warData.toggleTermedWinLoss || false;
    if (toggleChaining) toggleChaining.checked = warData.toggleChaining || false;
    if (toggleNoFlying) toggleNoFlying.checked = warData.toggleNoFlying || false;
    if (toggleTurtleMode) toggleTurtleMode.checked = warData.toggleTurtleMode || false;
    if (nextChainTimeInput) nextChainTimeInput.value = warData.nextChainTimeInput || '';
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
    // This function is currently not defined but is no longer causing an error.
    console.warn("setupToggleSelectionEvents is called but has no functionality yet.");
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

async function updateFriendlyMembersTable(apiKey, firebaseAuthUid) {
    const tbody = document.getElementById('friendly-members-tbody');
    if (!tbody) {
        console.error("HTML Error: Friendly members table body (tbody) not found!");
        return;
    }

    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding: 20px;">Loading faction member stats...</td></tr>';

    try {
        const userProfileDocRef = db.collection('userProfiles').doc(firebaseAuthUid);
        const userProfileDoc = await userProfileDocRef.get();
        if (!userProfileDoc.exists) {
            console.error("Firebase Error: User profile document not found for Firebase Auth UID:", firebaseAuthUid);
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding: 20px; color: red;">Error: Your user profile data not found in Firebase.</td></tr>';
            return;
        }
        const userProfileData = userProfileDoc.data();
        const currentUserTornId = userProfileData.tornProfileId; 
        const userFactionId = userProfileData.faction_id; 

        if (!currentUserTornId) {
            console.warn("Torn Player ID not found in your user profile. Cannot fetch user data.");
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding: 20px;">Your Torn Player ID is not stored in your profile.</td></tr>';
            return;
        }
        
        if (!userFactionId) { 
            console.warn("Faction ID not found for current user in Firebase user profile. Cannot fetch faction members.");
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding: 20px;">Not in a faction or Faction ID not stored in your profile.</td></tr>';
            return;
        }

        const currentUserDataRef = db.collection('users').doc(String(currentUserTornId));
        const currentUserDataDoc = await currentUserDataRef.get();
        const currentUsersFullData = currentUserDataDoc.exists ? currentUserDataDoc.data() : null;
        
        const actualUserFactionId = currentUsersFullData?.faction_id || userFactionId;

        if (!actualUserFactionId) {
            console.warn("Faction ID not available from either user's data or user profile. Cannot fetch faction members.");
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding: 20px;">Faction ID could not be determined.</td></tr>';
            return;
        }

        // CORRECTED URL: Added /v2/ to the Torn API endpoint
        const factionMembersApiUrl = `https://api.torn.com/v2/faction/?selections=members&key=${apiKey}&comment=MyTornPA_FriendlyMembers&factionID=${actualUserFactionId}`;
        console.log(`[DEBUG] Fetching faction members from: ${factionMembersApiUrl}`);
        const factionResponse = await fetch(factionMembersApiUrl);
        const factionData = await factionResponse.json();

        if (!factionResponse.ok || factionData.error) {
            console.error("Error fetching faction members:", factionData.error || factionResponse.statusText);
            tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding: 20px; color: red;">Error loading faction members: ${factionData.error?.error || 'API Error'}.</td></tr>`;
            return;
        }

        const members = factionData.members; 
        if (!members || Object.keys(members).length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding: 20px;">No members found in this faction.</td></tr>';
            return;
        }

        let tableRowsHtml = '';
        const memberPromises = []; 

        for (const memberId in members) {
            if (members.hasOwnProperty(memberId)) {
                const memberDocRef = db.collection('users').doc(String(memberId));
                memberPromises.push(memberDocRef.get().then(doc => {
                    const memberTornData = members[memberId]; 
                    const memberFirebaseData = doc.exists ? doc.data() : null; 

                    const name = memberTornData.name || 'Unknown';
                    const level = memberTornData.level || 'N/A';
                    const lastAction = memberTornData.last_action ? formatLastAction(memberTornData.last_action) : 'N/A';
                    const statusState = memberTornData.status?.state || 'N/A';
                    const statusDescription = memberTornData.status?.description || 'N/A';

                    const strength = memberFirebaseData?.battlestats?.strength?.toLocaleString() || 'N/A';
                    const dexterity = memberFirebaseData?.battlestats?.dexterity?.toLocaleString() || 'N/A';
                    const speed = memberFirebaseData?.battlestats?.speed?.toLocaleString() || 'N/A';
                    const defense = memberFirebaseData?.battlestats?.defense?.toLocaleString() || 'N/A';
                    const nerve = memberFirebaseData?.nerve !== undefined && memberFirebaseData?.nerve_full !== undefined ? `${memberFirebaseData.nerve}/${memberFirebaseData.nerve_full}` : 'N/A';
                    const energy = memberFirebaseData?.energy !== undefined && memberFirebaseData?.energy_full !== undefined ? `${memberFirebaseData.energy}/${memberFirebaseData.energy_full}` : 'N/A';
                    
                    let statusClass = '';
                    if (statusState === 'Hospital') statusClass = 'status-hospital';
                    else if (statusState === 'Jail' || statusState === 'Traveling' || statusState === 'Federal') statusClass = 'status-other';
                    else if (statusState === 'Okay') statusClass = 'status-okay';

                    return `
                        <tr>
                            <td>${name} (${memberId})</td>
                            <td>${level}</td>
                            <td>${lastAction}</td>
                            <td>${strength}</td>
                            <td>${dexterity}</td>
                            <td>${speed}</td>
                            <td>${defense}</td>
                            <td class="${statusClass}">${statusDescription}</td>
                            <td>${nerve}</td>
                            <td>${energy}</td>
                        </tr>
                    `;
                }).catch(error => {
                    console.error(`Error fetching Firebase data for member ${memberId}:`, error);
                    const memberTornData = members[memberId];
                    const name = memberTornData.name || 'Unknown';
                    const level = memberTornData.level || 'N/A';
                    const lastAction = memberTornData.last_action ? formatLastAction(memberTornData.last_action) : 'N/A';
                    const statusDescription = memberTornData.status?.description || 'N/A';
                    return `
                        <tr>
                            <td>${name} (${memberId})</td>
                            <td>${level}</td>
                            <td>${lastAction}</td>
                            <td>N/A</td>
                            <td>N/A</td>
                            <td>N/A</td>
                            <td>N/A</td>
                            <td class="${statusClass}">${statusDescription}</td>
                            <td>N/A</td>
                            <td>N/A</td>
                        </tr>
                    `;
                }));
            }
        }

        const resolvedRows = await Promise.all(memberPromises);
        tableRowsHtml = resolvedRows.join('');
        tbody.innerHTML = tableRowsHtml;

    } catch (error) {
        console.error("Error updating friendly members table:", error);
        tbody.innerHTML = `<p style="color:red;">Error loading faction list: ${error.message || String(error)}.</p>`;
    }
}
function formatLastAction(secondsAgo) {
    if (typeof secondsAgo !== 'number') return 'N/A';
    if (secondsAgo < 60) return `${secondsAgo} seconds ago`;
    const minutes = Math.floor(secondsAgo / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
}

async function fetchDataForPersonalStatsModal(apiKey, firestoreProfileData) {
    console.log(`[DEBUG] Initiating fetch for Personal Stats Modal with API Key: "${apiKey ? 'Provided' : 'Missing'}"`);

    const personalStatsModal = document.getElementById('personalStatsModal');
    const personalStatsModalBody = document.getElementById('personalStatsModalBody');

    if (!personalStatsModal || !personalStatsModalBody) {
        console.error("HTML Error: Personal Stats Modal elements not found!");
        if(togglePersonalStatsCheckbox) togglePersonalStatsCheckbox.checked = false;
        return;
    }

    personalStatsModalBody.innerHTML = '<p>Loading your detailed stats...</p>';
    personalStatsModal.classList.add('visible');

    // Selections to fetch all dashboard quick stats and personal stats
    const selections = "profile,personalstats,battlestats,workstats,basic,cooldowns"; 
    const apiUrl = `https://api.torn.com/user/?selections=${selections}&key=${apiKey}&comment=MyTornPA_Modal`;

    console.log(`[DEBUG] Constructed Torn API URL for Personal Stats Modal: ${apiUrl}`);

    function formatTcpAnniversaryDate(dateObject) {
        if (!dateObject) return 'N/A';
        let jsDate;
        if (dateObject instanceof Date) {
            jsDate = dateObject;
        } else if (dateObject && typeof dateObject.toDate === 'function') {
            jsDate = dateObject.toDate();
        } else {
            return 'N/A';
        }
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return jsDate.toLocaleDateString(undefined, options);
    }

    try {
        const response = await fetch(apiUrl);
        console.log(`[DEBUG] Torn API HTTP Response Status for Personal Stats Modal: ${response.status} ${response.statusText}`);
        const data = await response.json();
        console.log(`[DEBUG] Full Torn API Response Data for Personal Stats Modal:`, data);


        if (!response.ok) {
            const errorData = data || { message: "Failed to parse API error response." };
            console.error(`[DEBUG] Torn API HTTP Error details for Personal Stats Modal:`, errorData);
            let errorMessage = `API Error ${response.status}: ${errorData?.error?.error || response.statusText}`;
            throw new Error(errorMessage);
        }
        if (data.error) {
            console.error(`[DEBUG] Torn API Data Error details for Personal Stats Modal:`, data.error);
            throw new Error(`API Error: ${data.error.error || data.error.message || JSON.stringify(data.error)}`);
        }

        // --- Call Netlify Function for Secure Firebase Storage ---
        const userId = data.player_id; 
        if (userId) {
            const userDataToSave = {
                name: data.name,
                level: data.level,
                // NEW: Added faction_id to save to Firebase 'users' collection
                faction_id: data.faction?.faction_id || null, // Get faction ID from Torn API 'profile' selection
                faction_name: data.faction?.faction_name || null, // Also save faction name
                
                // Quick Stats from 'basic' selection and status object
                nerve: data.nerve || 0,
                energy: data.energy || 0,
                happy: data.happy || 0,
                life: data.life || 0,
                traveling: data.status?.state === 'Traveling' || false,
                hospitalized: data.status?.state === 'Hospital' || false,
                // Cooldowns from 'cooldowns' selection
                cooldowns: {
                    drug: data.cooldowns?.drug || 0,
                    booster: data.cooldowns?.booster || 0,
                },
                // Personal Stats
                personalstats: data.personalstats || {},
                // Battle Stats
                battlestats: {
                    strength: data.strength || data.battlestats?.strength || 0,
                    defense: data.defense || data.battlestats?.defense || 0,
                    speed: data.speed || data.battlestats?.speed || 0,
                    dexterity: data.dexterity || data.battlestats?.dexterity || 0, 
                    total: data.total || data.battlestats?.total || 0,
                    strength_modifier: data.strength_modifier || data.battlestats?.strength_modifier || 0,
                    defense_modifier: data.defense_modifier || data.battlestats?.defense_modifier || 0,
                    speed_modifier: data.speed_modifier || data.battlestats?.speed_modifier || 0,
                    dexterity_modifier: data.dexterity_modifier || data.battlestats?.dexterity_modifier || 0,
                },
                // Work Stats
                workstats: {
                    manual_labor: data.manual_labor || data.workstats?.manual_labor || 0,
                    intelligence: data.intelligence || data.workstats?.intelligence || 0,
                    endurance: data.endurance || data.workstats?.endurance || 0,
                },
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp() // Timestamp for last update
            };

            console.log(`[DEBUG] Prepared user data for Netlify Function:`, userDataToSave);

            try {
                // Call the new Netlify Function to securely save data to Firestore
                const netlifyFunctionResponse = await fetch('/.netlify/functions/update-user-data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId: String(userId), // Ensure userId is a string
                        userData: userDataToSave,
                    }),
                });

                if (!netlifyFunctionResponse.ok) {
                    const errorDetails = await netlifyFunctionResponse.json();
                    throw new Error(`Netlify Function Error: ${netlifyFunctionResponse.status} - ${errorDetails.error || 'Unknown error'}`);
                }

                console.log(`[DEBUG] Successfully sent user ${userId} data to Netlify Function.`);
            } catch (functionError) {
                console.error(`[ERROR] Failed to send user ${userId} data to Netlify Function:`, functionError);
            }
        } else {
            console.warn("[WARN] User ID not found in Torn API response. Cannot send data to Netlify Function.");
        }
        // --- End: Call Netlify Function for Secure Firebase Storage ---


        let htmlContent = '<h4>User Information</h4>';
        htmlContent += `<p><strong>Name:</strong> <span class="stat-value-api">${data.name || 'N/A'}</span></p>`;
        htmlContent += `<p><strong>User ID:</strong> <span class="stat-value-api">${data.player_id || data.userID || 'N/A'}</span></p>`;
        htmlContent += `<p><strong>Level:</strong> <span class="stat-value-api">${data.level || 'N/A'}</span></p>`;

        let xanaxDisplay = 'N/A';
        if (data.personalstats && data.personalstats.xantaken !== undefined) {
            xanaxDisplay = typeof data.personalstats.xantaken === 'number' ? xanaxDisplay.toLocaleString() : xanaxDisplay;
        }
        htmlContent += `<p><strong>Xanax Used:</strong> <span class="stat-value-api">${xanaxDisplay}</span></p>`;

        const tcpAnniversaryDateVal = firestoreProfileData ? firestoreProfileData.tcpRegisteredAt : null;
        htmlContent += `<p><strong>TCP Anniversary:</strong> <span class="stat-value-api">${formatTcpAnniversaryDate(tcpAnniversaryDateVal)}</span></p>`;

        htmlContent += '<h4>Battle Stats</h4>';
        if (typeof data.strength === 'number' || typeof data.battlestats?.strength === 'number') {
            const bsStrength = data.strength || data.battlestats?.strength;
            const bsDefense = data.defense || data.battlestats?.defense;
            const bsSpeed = data.speed || data.battlestats?.speed;
            const bsDexterity = data.dexterity || data.battlestats?.dexterity;
            
            const strengthModifier = data.strength_modifier || data.battlestats?.strength_modifier || 0;
            const defenseModifier = data.defense_modifier || data.battlestats?.defense_modifier || 0;
            const speedModifier = data.speed_modifier || data.battlestats?.speed_modifier || 0;
            const dexterityModifier = data.dexterity_modifier || data.battlestats?.dexterity_modifier || 0;

            const effStr = Math.floor(bsStrength * (1 + strengthModifier / 100));
            const effDef = Math.floor(bsDefense * (1 + defenseModifier / 100));
            const effSpd = Math.floor(bsSpeed * (1 + speedModifier / 100));
            const effDex = Math.floor(bsDexterity * (1 + dexterityModifier / 100));
            
            const totalBs = data.total || data.battlestats?.total || (bsStrength + bsDefense + bsSpd + bsDexterity);

            htmlContent += `<p><strong>Strength:</strong> <span class="stat-value-api">${bsStrength.toLocaleString()}</span> <span class="sub-detail">(Mod: ${strengthModifier}%) Eff: ${effStr.toLocaleString()}</span></p>`;
            htmlContent += `<p><strong>Defense:</strong> <span class="stat-value-api">${bsDefense.toLocaleString()}</span> <span class="sub-detail">(Mod: ${defenseModifier}%) Eff: ${effDef.toLocaleString()}</span></p>`;
            htmlContent += `<p><strong>Speed:</strong> <span class="stat-value-api">${bsSpeed.toLocaleString()}</span> <span class="sub-detail">(Mod: ${speedModifier}%) Eff: ${effSpd.toLocaleString()}</span></p>`;
            htmlContent += `<p><strong>Dexterity:</strong> <span class="stat-value-api">${bsDexterity.toLocaleString()}</span> <span class="sub-detail">(Mod: ${dexterityModifier}%) Eff: ${effDex.toLocaleString()}</span></p>`;
            htmlContent += `<p><strong>Total:</strong> <span class="stat-value-api">${totalBs.toLocaleString()}</span></p>`;
        } else {
            htmlContent += '<p>Battle stats data not available.</p>';
            console.warn("[DEBUG] Battle stats (strength, defense, speed, dexterity) not found directly in API response data or within 'battlestats' object, or are not numbers.");
        }

        htmlContent += '<h4>Work Stats</h4>';
        if (typeof data.manual_labor === 'number' || typeof data.workstats?.manual_labor === 'number') {
            htmlContent += `<p><strong>Manual Labor:</strong> <span class="stat-value-api">${(data.manual_labor || data.workstats?.manual_labor).toLocaleString()}</span></p>`;
            htmlContent += `<p><strong>Intelligence:</strong> <span class="stat-value-api">${(data.intelligence || data.workstats?.intelligence).toLocaleString()}</span></p>`;
            htmlContent += `<p><strong>Endurance:</strong> <span class="stat-value-api">${(data.endurance || data.workstats?.endurance).toLocaleString()}</span></p>`;
        } else {
            htmlContent += '<p>Work stats data not available.</p>';
            console.warn("[DEBUG] Work stats (manual_labor, intelligence, endurance) not found directly in API response data or within 'workstats' object, or are not numbers.");
        }

        personalStatsModalBody.innerHTML = htmlContent;
    } catch (error) {
        console.error("Error fetching/displaying personal stats in modal:", error);
        personalStatsModalBody.innerHTML = `<p style="color:red;">Error loading Personal Stats: ${error.message}. Check API key and console.</p>`;
    }
}
// NEW: Function to handle switching chat tabs
function switchChatTab(tabName) {
    console.log(`Switching to chat tab: ${tabName}`);

    if (!chatTabsContainer || chatTabButtons.length === 0 || !chatDisplayArea) {
        console.error("Chat elements not found for tab switching.");
        return;
    }

    // Remove 'active' class from all tab buttons
    chatTabButtons.forEach(button => {
        button.classList.remove('active');
    });

    // Add 'active' class to the clicked tab
    const selectedTabButton = document.querySelector(`.chat-tab[data-chat-tab="${tabName}"]`);
    if (selectedTabButton) {
        selectedTabButton.classList.add('active');
    } else {
        console.warn(`Chat tab button for "${tabName}" not found.`);
    }

    // --- Temporary: Update chat display area based on selected tab ---
    // In a later step, we will load actual messages from Firebase for the selected tab.
    chatDisplayArea.innerHTML = `<p>Welcome to the <span style="font-weight:bold; color: #00a8ff;">${tabName.replace('-', ' ')}</span> chat!</p><p>Messages will appear here...</p>`;

    // Keep active tab scrolled to view
    chatTabsContainer.scrollLeft = selectedTabButton.offsetLeft - (chatTabsContainer.offsetWidth / 2) + (selectedTabButton.offsetWidth / 2);
}

// --- Event Listeners Setup ---
function setupEventListeners(apiKey) {
    if (saveGamePlanBtn) {
        saveGamePlanBtn.addEventListener('click', async () => {
            if (!gamePlanEditArea) return;
            try {
                await db.collection('factionWars').doc('currentWar').set({ gamePlan: gamePlanEditArea.value }, { merge: true });
                if (gamePlanDisplay) gamePlanDisplay.textContent = gamePlanEditArea.value;
                alert('Game plan saved!');
            } catch (error) {
                console.error('Error saving game plan:', error);
                alert('Error saving game plan.');
            }
        });
    }
	
	// >>> REPLACE YOUR ENTIRE EXISTING 'initializeAndLoadData' FUNCTION WITH THE CODE BELOW <<<

async function initializeAndLoadData(apiKey) {
    try {
        // UPDATED: Removed 'wars' selection from the URL
        const userFactionApiUrl = `https://api.torn.com/v2/faction/?selections=basic,members&key=${apiKey}&comment=MyTornPA_WarHub_Combined`;

        console.log("Attempting to fetch faction data with specified selections (no wars):", userFactionApiUrl);

        const userFactionResponse = await fetch(userFactionApiUrl);

        if (!userFactionResponse.ok) {
            throw new Error(`Server responded with an error: ${userFactionResponse.status} ${userFactionResponse.statusText}`);
        }

        factionApiFullData = await userFactionResponse.json();
        console.log("Faction API Full Data (basic,members,chain):", factionApiFullData); // Log the full response

        if (factionApiFullData.error) {
            console.error("Torn API responded with a detailed error:", factionApiFullData.error);
            throw new Error(`Torn API Error: ${JSON.stringify(factionApiFullData.error)}`);
        }

        // Pass warData and apiKey to populateUiComponents
        const warDoc = await db.collection('factionWars').doc('currentWar').get();
        const warData = warDoc.exists ? warDoc.data() : {};
        populateUiComponents(warData, apiKey); // Pass warData and apiKey

    } catch (error) {
        console.error("Error during comprehensive data initialization:", error);
        if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = 'Error Loading War Hub Data.';
        // Reset related displays on error
        if (currentChainNumberDisplay) currentChainNumberDisplay.textContent = 'Error';
        if (chainStartedDisplay) chainStartedDisplay.textContent = 'Error';
        if (chainTimerDisplay) chainTimerDisplay.textContent = 'Error';
        // These will now likely show N/A or be removed if 'wars' data is no longer fetched
        if (yourFactionRankedScore) yourFactionRankedScore.textContent = 'N/A';
        if (opponentFactionRankedScore) opponentFactionRankedScore.textContent = 'N/A';
        if (warTargetScore) warTargetScore.textContent = 'N/A';
        if (warStartedTime) warStartedTime.textContent = 'N/A';
        if (yourFactionNameScoreLabel) yourFactionNameScoreLabel.textContent = 'Your Faction:';
        if (opponentFactionNameScoreLabel) opponentFactionNameScoreLabel.textContent = 'Vs. Opponent:';
    }
}
// >>> END REPLACE initializeAndLoadData <<<
	
	if (chatSendBtn && chatTextInput) { // Ensure these DOM elements were found
    // Send message on button click
    chatSendBtn.addEventListener('click', sendChatMessage);

    // Send message on Enter key press in the input field
    chatTextInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent default browser behavior (like new line)
            sendChatMessage(); // Call our send message function
        }
    });
}

if (chatTabsContainer && chatTabButtons.length > 0) {
    chatTabButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const tabName = event.currentTarget.dataset.chatTab; // Get the data-chat-tab value (e.g., 'faction-chat')
            switchChatTab(tabName); // Call our new function to switch tabs
        });
    });
}

    if (postAnnouncementBtn) {
        postAnnouncementBtn.addEventListener('click', async () => {
            if (!quickAnnouncementInput || quickAnnouncementInput.value.trim() === '') return;
            try {
                await db.collection('factionWars').doc('currentWar').set({ quickAnnouncement: quickAnnouncementInput.value }, { merge: true });
                if (factionAnnouncementsDisplay) factionAnnouncementsDisplay.textContent = quickAnnouncementInput.value;
                quickAnnouncementInput.value = '';
                alert('Announcement posted!');
            } catch (error) {
                console.error('Error posting announcement:', error);
            }
        });
    }
    
    if (saveWarStatusControlsBtn) {
        saveWarStatusControlsBtn.addEventListener('click', async () => {
            const enemyId = enemyFactionIDInput ? enemyFactionIDInput.value.trim() : '';
            const statusData = {
                toggleEnlisted: toggleEnlisted ? toggleEnlisted.checked : false,
                toggleTermedWar: toggleTermedWar ? toggleTermedWar.checked : false,
                toggleChaining: toggleChaining ? toggleChaining.checked : false,
                toggleNoFlying: toggleNoFlying ? toggleNoFlying.checked : false,
                toggleTurtleMode: toggleTurtleMode ? toggleTurtleMode.checked : false,
                toggleTermedWinLoss: toggleTermedWinLoss ? toggleTermedWinLoss.checked : false,
                nextChainTimeInput: nextChainTimeInput ? nextChainTimeInput.value : '',
                enemyFactionID: enemyId
            };
            try {
                await db.collection('factionWars').doc('currentWar').set(statusData, { merge: true });
                alert('War status saved!');
                populateWarStatusDisplay(statusData);
                await fetchAndDisplayEnemyFaction(enemyId, apiKey);
            } catch (error) {
                console.error('Error saving war status:', error);
            }
        });
    }

    if (saveAdminsBtn) {
        saveAdminsBtn.addEventListener('click', async () => {
            if (!designatedAdminsContainer) return;
            const selectedAdminIds = Array.from(designatedAdminsContainer.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
            try {
                await db.collection('factionWars').doc('currentWar').set({ tab4Admins: selectedAdminIds }, { merge: true });
                alert('Admins saved!');
            } catch (error) {
                console.error("Error saving admins:", error);
            }
        });
    }

    if (saveEnergyTrackMembersBtn) {
        saveEnergyTrackMembersBtn.addEventListener('click', async () => {
            if (!energyTrackingContainer) return;
            const selectedEnergyMemberIds = Array.from(energyTrackingContainer.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
            try {
                await db.collection('factionWars').doc('currentWar').set({ energyTrackingMembers: selectedEnergyMemberIds }, { merge: true });
                alert('Energy tracking members saved!');
            } catch (error) {
                console.error("Error saving energy members:", error);
            }
        });
    }

    // NOTE: The typo in your original variable name is corrected here. 
    // Make sure your save button's ID in the HTML is "saveWatchlistSelectionsBtn"
    const saveWatchlistSelectionsBtn = document.getElementById('saveWatchlistSelectionsBtn');
    if (saveWatchlistSelectionsBtn) { 
        saveWatchlistSelectionsBtn.addEventListener('click', async () => {
            if (!bigHitterWatchlistContainer) return;
            const selectedWatchlistIds = Array.from(bigHitterWatchlistContainer.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
            try {
                await db.collection('factionWars').doc('currentWar').set({ bigHitterWatchlist: selectedWatchlistIds }, { merge: true });
                alert('Big Hitter Watchlist saved!');
            } catch (error) {
                console.error("Error saving big hitter watchlist:", error);
            }
        });
    }
}
    
    if (saveWarStatusControlsBtn) {
        saveWarStatusControlsBtn.addEventListener('click', async () => {
            const enemyId = enemyFactionIDInput ? enemyFactionIDInput.value.trim() : '';
            const statusData = {
                toggleEnlisted: toggleEnlisted ? toggleEnlisted.checked : false,
                toggleTermedWar: toggleTermedWar ? toggleTermedWar.checked : false,
                toggleChaining: toggleChaining ? toggleChaining.checked : false,
                toggleNoFlying: toggleNoFlying ? toggleNoFlying.checked : false,
                toggleTurtleMode: toggleTurtleMode ? toggleTurtleMode.checked : false,
                toggleTermedWinLoss: toggleTermedWinLoss ? toggleTermedWinLoss.checked : false,
                nextChainTimeInput: nextChainTimeInput ? nextChainTimeInput.value : '',
                enemyFactionID: enemyId
            };
            try {
                await db.collection('factionWars').doc('currentWar').set(statusData, { merge: true });
                alert('War status saved!');
                populateWarStatusDisplay(statusData);
                await fetchAndDisplayEnemyFaction(enemyId, apiKey);
            } catch (error) {
                console.error('Error saving war status:', error);
            }
        });
    }

    if (saveAdminsBtn) {
        saveAdminsBtn.addEventListener('click', async () => {
            if (!designatedAdminsContainer) return;
            const selectedAdminIds = Array.from(designatedAdminsContainer.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
            try {
                await db.collection('factionWars').doc('currentWar').set({ tab4Admins: selectedAdminIds }, { merge: true });
                alert('Admins saved!');
            } catch (error) {
                console.error("Error saving admins:", error);
            }
        });
    }

    if (saveEnergyTrackMembersBtn) {
        saveEnergyTrackMembersBtn.addEventListener('click', async () => {
            if (!energyTrackingContainer) return;
            const selectedEnergyMemberIds = Array.from(energyTrackingContainer.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
            try {
                await db.collection('factionWars').doc('currentWar').set({ energyTrackingMembers: selectedEnergyMemberIds }, { merge: true });
                alert('Energy tracking members saved!');
            } catch (error) {
                console.error("Error saving energy members:", error);
            }
        });
    }

    // NEW: Save button for Big Hitter Watchlist
    if (saveSelectionsBtnBH) {
        saveSelectionsBtnBH.addEventListener('click', async () => {
            if (!bigHitterWatchlistContainer) return;
            const selectedWatchlistIds = Array.from(bigHitterWatchlistContainer.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
            try {
                await db.collection('factionWars').doc('currentWar').set({ bigHitterWatchlist: selectedWatchlistIds }, { merge: true });
                alert('Big Hitter Watchlist saved!');
            } catch (error) {
                console.error("Error saving big hitter watchlist:", error);
            }
        });
    }

function showTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) selectedTab.classList.add('active');
    const selectedButton = document.querySelector(`.tab-button[data-tab="${tabId.replace('-tab', '')}"]`);
    if (selectedButton) selectedButton.classList.add('active');
}

async function populateSettingsTab() {
    console.log("[Settings Tab] Populating tab with detailed layout...");

    if (!settingsDisplayArea) {
        console.error("HTML Error: settingsDisplayArea not found in populateSettingsTab function.");
        return;
    }

    settingsDisplayArea.innerHTML = `
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

    // TODO: Add logic here to load existing user settings and attach event listeners
    // For example: loadUserSettings();
    // For example: setupSettingsEventListeners();
}

// NEW FUNCTION: Orchestrates populating the Blocked People tab
// Now accepts dynamic elements as arguments
async function populateBlockedPeopleTab(friendsListEl, ignoresListEl) {
    console.log("[Blocked People Tab] Populating tab...");

    // Set initial loading messages for the specific display areas
    if (friendsListEl) {
        friendsListEl.innerHTML = '<p style="text-align:center; padding: 10px;">Loading friends...</p>';
    }
    if (ignoresListEl) {
        ignoresListEl.innerHTML = '<p style="text-align:center; padding: 10px;">Loading ignores...</p>';
    }

    // The next steps will involve fetching data and rendering it here.
    // TODO: Step 1: Fetch friends data (from Firebase userProfile.friends or Torn API)
    // TODO: Step 2: Render friends data into friendsListEl
    // TODO: Step 3: Fetch ignores/blocked data (from Firebase userProfile.blocked or a dedicated collection)
    // TODO: Step 4: Render ignores/blocked data into ignoresListEl
    // TODO: Step 5: Implement search/filter functionality (will need search inputs passed too)
    // TODO: Step 6: Implement action buttons (message, unfriend, block, unblock)
}

document.addEventListener('DOMContentLoaded', () => {
    // Basic tab navigation for main content tabs
    const tabButtons = document.querySelectorAll('.tab-button'); 
    const mainTabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            const targetTabDataset = event.currentTarget.dataset.tab;
            const targetTabId = targetTabDataset + '-tab';

            showTab(targetTabId);

            // --- CORRECTED PART: Call updateFriendlyMembersTable using the global 'userApiKey' ---
            if (targetTabDataset === 'friendly-status') {
                const user = firebase.auth().currentUser;
                // NOW CORRECTLY USING THE GLOBALLY SCOPED 'userApiKey'
                
                if (user && userApiKey) { // Check for userApiKey which is set by auth.onAuthStateChanged
                    await updateFriendlyMembersTable(userApiKey, user.uid); 
                } else {
                    console.warn("User not logged in or API Key missing. Cannot update friendly members table.");
                    const tbody = document.getElementById('friendly-members-tbody');
                    if (tbody) {
                        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding: 20px; color: yellow;">Please log in and ensure API Key is available to view faction members.</td></tr>';
                    }
                }
            }
            // --- END CORRECTED PART ---
        });
    });
    showTab('announcements-tab');
    let listenersInitialized = false;

    // --- Chat Tab Functionality Elements and Handler ---
    const chatTabsContainer = document.querySelector('.chat-tabs-container');
    const chatTabs = document.querySelectorAll('.chat-tab');
    const warChatBox = document.getElementById('warChatBox');
    const chatDisplayArea = document.getElementById('chat-display-area');
    const chatInputArea = document.querySelector('.chat-input-area');

    // Function to handle chat tab clicks
function handleChatTabClick(event) {
    const clickedTab = event.currentTarget;
    const targetTab = clickedTab.dataset.chatTab;

    console.log(`[Chat Tab Debug] Clicked tab: ${targetTab}`);

    // Remove 'active' class from all tab buttons
    chatTabButtons.forEach(button => {
        button.classList.remove('active');
    });
    // Add active class to the clicked tab button
    clickedTab.classList.add('active');

    // IMPORTANT: Clear the main chat display area every time a tab is clicked
    if (chatDisplayArea) {
        chatDisplayArea.innerHTML = '';
    } else {
        console.error("HTML Error: chatDisplayArea (the main content display for tabs) not found.");
        return;
    }

    // Unsubscribe from any active real-time chat listener (important for Faction Chat)
    if (unsubscribeFromChat) {
        unsubscribeFromChat();
        unsubscribeFromChat = null;
        console.log("Unsubscribed from previous chat listener (tab switch).");
    }

    let showInputArea = true; // Default to showing input area for chat tabs

    switch (targetTab) {
        case 'faction-chat':
            chatDisplayArea.innerHTML = '<p>Loading Faction Chat messages...</p>'; // Initial loading message
            setupChatRealtimeListener(); // This function will populate chatDisplayArea
            break;

        case 'war-chat':
            // Dynamically generate War Chat content into chatDisplayArea
            chatDisplayArea.innerHTML = `
                <p>Welcome to War Chat!</p>
                <p>Functionality not implemented yet for this dynamic tab.</p>
            `;
            // If you later implement real-time war chat, you'd add setupWarChatListener() here
            break;

        case 'private-chat':
            // Dynamically generate Private Chat content into chatDisplayArea
            chatDisplayArea.innerHTML = `
                <p>Welcome to Private Chat!</p>
                <p>Functionality not implemented yet for this dynamic tab.</p>
            `;
            break;

        case 'faction-members':
            // Dynamically generate Faction Members content into chatDisplayArea
            chatDisplayArea.innerHTML = `<h3>Faction Members</h3><p>Loading faction member data...</p>`;
            if (factionApiFullData && factionApiFullData.members) {
                // Pass chatDisplayArea as the target for displayFactionMembersInChatTab
                displayFactionMembersInChatTab(factionApiFullData.members, chatDisplayArea);
            }
            showInputArea = false; // Hide input for non-chat tabs
            break;

        case 'recently-met':
            // Dynamically generate Recently Met content into chatDisplayArea
            chatDisplayArea.innerHTML = `
                <p>Welcome to Recently Met!</p>
                <p>Functionality not implemented yet for this dynamic tab.</p>
            `;
            showInputArea = false;
            break;

        case 'blocked-people':
            // Dynamically generate the full Blocked People layout into chatDisplayArea
            chatDisplayArea.innerHTML = `
                <div class="blocked-people-layout">
                    <div class="friends-list-section">
                        <div class="header-box">
                            <b>Friends</b>
                        </div>
                        <div class="search-bar">
                            <input type="text" id="friendsSearchInput" placeholder="Friends Search">
                            <span class="search-icon">🔍</span>
                        </div>
                        <div id="friendsScrollableList" class="scrollable-list">
                            <p style="text-align:center; padding: 10px;">Loading friends...</p>
                        </div>
                    </div>

                    <div class="ignores-list-section">
                        <div class="header-box">
                            <b>Ignores / Blocked</b>
                        </div>
                        <div class="search-bar">
                            <input type="text" id="ignoresSearchInput" placeholder="Add Profile/Faction ID">
                            <span class="search-icon">🔍</span>
                        </div>
                        <div id="ignoresScrollableList" class="scrollable-list">
                            <p style="text-align:center; padding: 10px;">Loading ignores...</p>
                        </div>
                    </div>
                </div>
            `;
            // After HTML is injected, you'll need to re-get references to friendsScrollableList and ignoresScrollableList
            // and then call populateBlockedPeopleTab (which currently uses global vars)
            // This will need adjustment in populateBlockedPeopleTab next.
            // For now, the HTML structure will appear.
            
            // Re-get elements after they are injected into the DOM
            const dynamicFriendsScrollableList = document.getElementById('friendsScrollableList');
            const dynamicIgnoresScrollableList = document.getElementById('ignoresScrollableList');
            // Call your populate function, potentially passing these dynamic elements
            populateBlockedPeopleTab(dynamicFriendsScrollableList, dynamicIgnoresScrollableList); // Pass dynamically found elements

            showInputArea = false;
            break;

        case 'settings':
            // Dynamically generate Settings content into chatDisplayArea
            populateSettingsTab(); // CALLS THE NEW FUNCTION
            showInputArea = false; // Hide input for settings tab
            break;

                    <h3>Chat Settings</h3>
                    <div class="setting-item">
                        <label for="chatFontSize">Font Size:</label>
                        <select id="chatFontSize">
                            <option value="small">Small</option>
                            <option value="medium" selected>Medium</option>
                            <option value="large">Large</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label for="notificationToggle">Notifications:</label>
                        <input type="checkbox" id="notificationToggle" checked>
                    </div>
                    <div class="setting-item">
                        <label for="themeSelect">Chat Theme:</label>
                        <select id="themeSelect">
                            <option value="dark">Dark</option>
                            <option value="light">Light (Coming Soon)</option>
                        </select>
                    </div>
                    <button class="save-settings-btn">Save Settings</button>
                </div>
            `;
            showInputArea = false;
            break;

        default:
            console.warn(`Unknown chat tab: ${targetTab}`);
            chatDisplayArea.innerHTML = `<p style="color: red;">Error: Unknown chat tab selected.</p>`;
            showInputArea = false;
            break;
    }

    // Control visibility of the separate chat input area
    if (showInputArea) {
        if (chatInputArea) chatInputArea.style.display = 'flex';
    } else {
        if (chatInputArea) chatInputArea.style.display = 'none';
    }

    // Ensure the main chat display area scrolls to bottom after content is injected
    chatDisplayArea.scrollTop = chatDisplayArea.scrollHeight;
}
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userProfileRef = db.collection('userProfiles').doc(user.uid);
            const doc = await userProfileRef.get();
            const userData = doc.exists ? doc.data() : {};
            
            const apiKey = userData.tornApiKey || null;
            const playerId = userData.tornProfileId || null;
            currentTornUserName = userData.preferredName || 'Unknown';

            let warData = {};
            try {
                const warDoc = await db.collection('factionWars').doc('currentWar').get();
                warData = warDoc.exists ? warDoc.data() : {};
            } catch (firebaseError) {
                console.error("Error fetching warData from Firebase (Firebase data might be missing):", firebaseError);
            }
			
			console.log(firebase.auth().currentUser);

            if (apiKey && playerId) {
                userApiKey = apiKey; // Assign to global userApiKey for other functions

                await initializeAndLoadData(apiKey);
                populateUiComponents(warData, apiKey);

                fetchAndDisplayChainData();
                fetchAndDisplayRankedWarScores();
                displayQuickFFTargets(userApiKey, playerId);
                setupChatRealtimeListener();

                if (!listenersInitialized) {
                    setupEventListeners(apiKey);
                    setupMemberClickEvents();

                    chatTabs.forEach(tab => {
                        tab.addEventListener('click', handleChatTabClick);
                    });

                    const initialActiveChatTab = document.querySelector('.chat-tab.active');
                    if (initialActiveChatTab) {
                        handleChatTabClick({ currentTarget: initialActiveChatTab });
                    }
                    
                    listenersInitialized = true;

                    setInterval(updateAllTimers, 1000);
                    setInterval(() => {
                        if (userApiKey && globalEnemyFactionID) {
                            fetchAndDisplayEnemyFaction(globalEnemyFactionID, userApiKey);
                        } else {
                            console.warn("API key or enemy faction ID not available for periodic enemy data refresh.");
                        }
                    }, 2000);
                    setInterval(() => {
                        if (userApiKey && playerId) {
                            displayQuickFFTargets(userApiKey, playerId);
                        } else {
                            console.warn("API key or Player ID not available for periodic Quick FF targets refresh.");
                        }
                    }, 60000);
                    setInterval(() => {
                        if (userApiKey) {
                            initializeAndLoadData(userApiKey);
                        } else {
                            console.warn("API key not available for periodic comprehensive faction data refresh.");
                        }
                    }, 2000);
                }
            } else {
                console.warn("API key or Player ID not found.");
                const factionWarHubTitleEl = document.getElementById('factionWarHubTitle');
                if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = "Faction War Hub. (API Key & Player ID Needed)";
                const quickFFTargetsDisplay = document.getElementById('quickFFTargetsDisplay');
                if (quickFFTargetsDisplay) {
                    quickFFTargetsDisplay.innerHTML = '<span style="color: #ff4d4d;">Login & API/ID needed.</span>';
                }
            }
        } else {
            userApiKey = null;
            listenersInitialized = false;
            console.log("User not logged in.");
            const factionWarHubTitleEl = document.getElementById('factionWarHubTitle');
            if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = "Faction War Hub. (Please Login)";
        }
    });
});