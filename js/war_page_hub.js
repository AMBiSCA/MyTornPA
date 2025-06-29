

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
const saveAdminsBtn = document.getElementById('saveAdminsBtn');
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
const friendlyMembersTbody = document.getElementById('friendly-members-tbody');
const chatTextInput = document.querySelector('.chat-text-input');
const chatSendBtn = document.querySelector('.chat-send-btn');
const currentTeamLeadDisplay = document.getElementById('warCurrentTeamLeadStatus');
const chatMessagesCollection = db.collection('factionChatMessages');
const MAX_MESSAGES_VISIBLE = 7;
const REMOVAL_DELAY_MS = 500;
const memberProfileCache = {};
const FETCH_DELAY_MS = 500;
const factionMembersPanel = document.getElementById('faction-members-panel');
const factionChatDisplayArea = document.getElementById('chat-display-area');
const friendsPanel = document.getElementById('friends');
const friendsListSection = document.getElementById('friends-list-section');
const friendsSearchInput = document.getElementById('friendsSearchInput');
const friendsScrollableList = document.getElementById('friendsScrollableList');
const ignoresListSection = document.getElementById('ignores-list-section');
const ignoresSearchInput = document.getElementById('ignoresSearchInput');
const ignoresScrollableList = document.getElementById('ignoresScrollableList');
const chatDisplayArea = document.getElementById('chat-display-area');
const warChatBox = document.getElementById('warChatBox');
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
const friendsTbody = document.getElementById('friends-tbody');
const addFriendIdInput = document.getElementById('addFriendIdInput');
const addFriendBtn = document.getElementById('addFriendBtn');
const addFriendStatus = document.getElementById('addFriendStatus');


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

function generateDummyFriends(count) {
    const dummyFriends = [];
    for (let i = 1; i <= count; i++) {
        dummyFriends.push({
            id: `friend_${i}`, // Dummy ID
            name: `Test Friend ${i}`,
            profile_image: `../../images/default_profile_icon.png` // Use a default icon
        });
    }
    return dummyFriends;
}


function generateDummyIgnores(count) {
    const dummyIgnores = [];
    for (let i = 1; i <= count; i++) {
        if (i % 2 === 0) { // Alternate between user and faction for variety
            dummyIgnores.push({
                type: 'faction',
                id: `faction_${i}`, // Dummy ID
                name: `Blocked Faction ${i}`,
                icon: '🏢' // Use a building icon for factions
            });
        } else {
            dummyIgnores.push({
                type: 'user',
                id: `user_${i}`, // Dummy ID
                name: `Blocked User ${i}`,
                profile_image: `../../images/default_profile_icon.png` // Use a default icon
            });
        }
    }
    return dummyIgnores;
}

function handleImageUpload(fileInput, displayElement) {
    // Get the first file that the user selected
    const file = fileInput.files[0];

    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();

        // This function runs after the file has been read
        reader.onload = function(e) {
            // Clear any old content (like "Loading game plan...")
            displayElement.innerHTML = ''; 
            
            // Create a new image element
            const img = document.createElement('img');
            img.src = e.target.result;
            
            // Add some styles to make sure the image fits nicely
            img.style.maxWidth = '100%';
            img.style.maxHeight = '300px'; // You can adjust this value
            img.style.borderRadius = '8px';
            
            // Add the new image to the display box
            displayElement.appendChild(img);
        };

        // This reads the image file from the user's computer
        reader.readAsDataURL(file);
    } else if (file) {
        // This runs if the selected file is not an image
        alert("Please select a valid image file (png, jpg, gif).");
    }
}


function toggleScrollIndicatorVisibility() {
    // Ensure scrollUpIndicatorEl is obtained only when needed and exists
    const currentScrollIndicatorEl = document.getElementById('scrollUpIndicator');
    if (!currentScrollIndicatorEl) {
        // console.warn("Scroll Up Indicator element not found. Cannot manage visibility."); // Suppress constant warnings if element truly absent
        return;
    }
    // Assign to global variable only once to attach event listener
    if (!scrollUpIndicatorEl) { // Only attach listener once
        scrollUpIndicatorEl = currentScrollIndicatorEl; // Assign the element to the global variable
        scrollUpIndicatorEl.addEventListener('click', () => {
            if (chatDisplayArea) {
                chatDisplayArea.scrollTop = 0; // Scroll to the very top
            }
        });
    }

    if (!chatDisplayArea) {
        return;
    }

    const atTop = chatDisplayArea.scrollTop <= 5;
    const hasOverflow = chatDisplayArea.scrollHeight > chatDisplayArea.clientHeight;

    if (hasOverflow && !atTop) {
        currentScrollIndicatorEl.classList.add('visible');
    } else {
        currentScrollIndicatorEl.classList.remove('visible');
    }
}

function handleChatScroll() {
    toggleScrollIndicatorVisibility();
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
// MODIFIED FUNCTION: to handle switching chat tabs (now includes Settings tab and passes UID for Blocked People)
async function switchChatTab(tabName) { // <--- THIS FUNCTION MUST BE 'async'
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

    // Unsubscribe from any active real-time chat listener
    if (unsubscribeFromChat) {
        unsubscribeFromChat();
        unsubscribeFromChat = null;
        console.log("Unsubscribed from previous chat listener (tab switch).");
    }

    // --- Clear the main chat display area every time a tab is clicked ---
    if (chatDisplayArea) {
        chatDisplayArea.innerHTML = '';
    } else {
        console.error("HTML Error: chatDisplayArea (the main content display for tabs) not found.");
        return;
    }

    let showInputArea = true; // Default to showing input area for chat tabs

    switch (tabName) {
        case 'faction-chat':
            chatDisplayArea.innerHTML = '<p>Loading Faction Chat messages...</p>';
            setupChatRealtimeListener(); // Start listening for messages in faction chat
            break;

        case 'war-chat':
            chatDisplayArea.innerHTML = `<p>Welcome to War Chat! Functionality not implemented yet.</p>`;
            break;

        case 'private-chat':
            chatDisplayArea.innerHTML = `<p>Welcome to Private Chat! Functionality not implemented yet.</p>`;
            break;

        case 'faction-members':
            chatDisplayArea.innerHTML = `<h3>Faction Members</h3><p>Loading faction member data...</p>`;
            if (factionApiFullData && factionApiFullData.members) {
                displayFactionMembersInChatTab(factionApiFullData.members, chatDisplayArea);
            }
            showInputArea = false; // Hide input for non-chat tabs
            break;

        case 'recently-met':
            populateRecentlyMetTab(chatDisplayArea);
            showInputArea = false; // Hide input for non-chat tabs
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

            // Re-get elements AFTER they are injected into the DOM
            // Add a small delay to ensure the browser has fully parsed the new HTML before looking for elements
            setTimeout(async () => { // <--- THIS setTimeout CALLBACK IS ASYNC
                const dynamicFriendsScrollableList = document.getElementById('friendsScrollableList');
                const dynamicIgnoresScrollableList = document.getElementById('ignoresScrollableList');

                console.log("[Blocked People Tab Debug] FriendsListEl before call:", dynamicFriendsScrollableList);
                console.log("[Blocked People Tab Debug] IgnoresListEl before call:", dynamicIgnoresScrollableList);

                const currentUser = auth.currentUser;
                if (currentUser) {
                    await populateBlockedPeopleTab(currentUser.uid, dynamicFriendsScrollableList, dynamicIgnoresScrollableList); // <--- Use 'await' here
                } else {
                    console.warn("[Blocked People Tab] User not logged in. Cannot load real friends list.");
                    if (dynamicFriendsScrollableList) dynamicFriendsScrollableList.innerHTML = `<p style="text-align:center; padding: 10px; color: yellow;">Please log in to see your friends list.</p>`;
                    if (dynamicIgnoresScrollableList) dynamicIgnoresScrollableList.innerHTML = `<p style="text-align:center; padding: 10px; color: yellow;">Please log in to see your ignores list.</p>`;
                }
            }, 50); // Small delay of 50 milliseconds

            showInputArea = false; // Hide input for non-chat tabs
            break;

        case 'settings':
            populateSettingsTab(chatDisplayArea);
            showInputArea = false;
            break;

        default:
            console.warn(`Unknown chat tab: ${tabName}`);
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

function updateUserEnergyDisplay() {
    // This function now directly uses the global userApiKey
    if (!userApiKey) {
        console.warn("User API key not available for energy display.");
 const userEnergyDisplayElement = document.getElementById('rw-user-energy');
        if (userEnergyDisplayElement) {
            userEnergyDisplayElement.textContent = 'Key Missing';
        }
        return;
    }

    const API_KEY = userApiKey; // Use the globally available API key

    // Get the HTML element where energy will be displayed
  const userEnergyDisplayElement = document.getElementById('rw-user-energy');

    if (!userEnergyDisplayElement) {
        console.warn("User energy display element with ID 'userEnergyDisplay' not found.");
        return; // Exit if the element doesn't exist
    }

    // Clear current display or show a loading message
    userEnergyDisplayElement.textContent = 'Loading E...'; 

    fetch(`https://api.torn.com/user/?selections=bars&key=${API_KEY}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                console.error("Torn API Error:", data.error.code, data.error.error);
                userEnergyDisplayElement.textContent = 'API Error';
                return;
            }

            const energy = data.energy.current;
            const maxEnergy = data.energy.maximum;
            const energyFullTime = data.energy.fulltime; // Unix timestamp for full energy

            userEnergyDisplayElement.textContent = `${energy}/${maxEnergy}`;

            const fullTimeDate = new Date(energyFullTime * 1000); // Convert to milliseconds
            userEnergyDisplayElement.title = `Full E at: ${fullTimeDate.toLocaleTimeString()} ${fullTimeDate.toLocaleDateString()}`;

        })
        .catch(error => {
            console.error("Error fetching user energy data:", error);
            userEnergyDisplayElement.textContent = 'Fetch Error';
        });
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

// MODIFIED: This function now accepts the 'wars' object and your faction ID as parameters
async function fetchAndDisplayRankedWarScores(warsData, yourFactionId) {
    console.log("Calling fetchAndDisplayRankedWarScores with received data.");

    // Check if the necessary data was provided
    if (!warsData || !warsData.ranked) {
        console.warn("Ranked War Data not provided or no ranked war active.");
        if (yourFactionRankedScore) yourFactionRankedScore.textContent = 'N/A';
        if (opponentFactionRankedScore) opponentFactionRankedScore.textContent = 'N/A';
        if (warTargetScore) warTargetScore.textContent = 'N/A';
        if (warStartedTime) warStartedTime.textContent = 'No Active War';
        if (yourFactionNameScoreLabel) yourFactionNameScoreLabel.textContent = 'Your Faction:';
        if (opponentFactionNameScoreLabel) opponentFactionNameScoreLabel.textContent = 'Vs. Opponent:';
        return;
    }

    try {
        const rankedWarInfo = warsData.ranked;

        // Get the target score and start time
        const targetScoreValue = rankedWarInfo.target;
        globalWarStartedActualTime = rankedWarInfo.start; // Set global for the live timer

        // Find your faction and the opponent's faction from the 'factions' array
        const yourFactionInfo = rankedWarInfo.factions.find(f => String(f.id) === String(yourFactionId));
        const opponentFactionInfo = rankedWarInfo.factions.find(f => String(f.id) !== String(yourFactionId));

        // Update the UI elements with the fetched data
        if (yourFactionRankedScore) {
            yourFactionRankedScore.textContent = yourFactionInfo ? yourFactionInfo.score.toLocaleString() : 'N/A';
        }
        if (yourFactionNameScoreLabel) {
            yourFactionNameScoreLabel.textContent = yourFactionInfo ? `${yourFactionInfo.name}:` : 'Your Faction:';
        }
        
        if (opponentFactionRankedScore) {
            opponentFactionRankedScore.textContent = opponentFactionInfo ? opponentFactionInfo.score.toLocaleString() : 'N/A';
        }
        if (opponentFactionNameScoreLabel) {
            opponentFactionNameScoreLabel.textContent = opponentFactionInfo ? `Vs. ${opponentFactionInfo.name}:` : 'Vs. Opponent:';
        }

        if (warTargetScore) {
            warTargetScore.textContent = targetScoreValue ? targetScoreValue.toLocaleString() : 'N/A';
        }
        
        console.log("Successfully parsed and displayed ranked war data.");

    } catch (error) {
        console.error("Error displaying ranked war scores:", error);
    }
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
	
    // Set up the real-time listener, ordered by timestamp descending (newest first from Firestore)
    unsubscribeFromChat = chatMessagesCollection
        .orderBy('timestamp', 'desc') // Fetch newest messages first from Firestore
        .limit(100) // Limit to the last 100 messages
        .onSnapshot(snapshot => {
            // Clear the chat display area to re-render all messages
            if (chatDisplayArea) {
                chatDisplayArea.innerHTML = '';
            }

            const messagesToDisplay = []; // Array to hold messages before displaying

            if (snapshot.empty) {
                if (chatDisplayArea) {
                    chatDisplayArea.innerHTML = `<p>No messages yet. Be the first to say hello!</p>`;
                }
                console.log("No messages in chat collection.");
                toggleScrollIndicatorVisibility(); // Update indicator visibility
                return;
            }

            // Iterate through snapshot and push data to array
            snapshot.forEach(doc => {
                messagesToDisplay.push(doc.data());
            });
            
            // Reverse the array to display oldest messages first, so newest ones are appended last (at the bottom)
            messagesToDisplay.reverse();

            // Display messages from the (now reversed) array
            messagesToDisplay.forEach(message => {
                displayChatMessage(message);
            });
            
            console.log("Chat messages updated in real-time.");
            
            // Ensure the chat automatically scrolls to the bottom after loading/updating
            if (chatDisplayArea) {
                chatDisplayArea.scrollTop = chatDisplayArea.scrollHeight;
            }

            // Update scroll indicator visibility after messages are loaded and scrolled
            toggleScrollIndicatorVisibility();

        }, error => {
            console.error("Error listening to chat messages:", error);
            if (chatDisplayArea) {
                chatDisplayArea.innerHTML = `<p style="color: red;">Error loading messages: ${error.message}</p>`;
            }
        });
    console.log("Chat real-time listener set up.");
    
    // Ensure the scroll listener is attached only once
    if (chatDisplayArea) {
        chatDisplayArea.removeEventListener('scroll', handleChatScroll); // Prevent multiple listeners
        chatDisplayArea.addEventListener('scroll', handleChatScroll);
    }
}
function updateRankedWarDisplay(rankedWarData, yourFactionId) {
    // Get all the HTML elements from the new score box by their ID
    const yourNameEl = document.getElementById('rw-faction-one-name');
    const opponentNameEl = document.getElementById('rw-faction-two-name');
    const leadValueEl = document.getElementById('rw-lead-value');
    const progressOneEl = document.getElementById('rw-progress-one');
    const progressTwoEl = document.getElementById('rw-progress-two');
    
    // Check if all elements were found before continuing
    if (!yourNameEl || !opponentNameEl || !leadValueEl || !progressOneEl || !progressTwoEl) {
        console.error("One or more HTML elements for the new ranked war display are missing.");
        return;
    }

    // Find our faction and the opponent's faction in the data
    const yourFaction = rankedWarData.factions.find(f => String(f.id) === String(yourFactionId));
    const opponentFaction = rankedWarData.factions.find(f => String(f.id) !== String(yourFactionId));

    if (!yourFaction || !opponentFaction) {
        console.error("Could not determine your faction vs opponent in the war data.");
        return;
    }

    // --- Update Faction Names ---
    yourNameEl.textContent = yourFaction.name;
    opponentNameEl.textContent = opponentFaction.name;

    // --- Calculate and Update Lead Target ---
    const leadAmount = Math.abs(yourFaction.score - opponentFaction.score);
    const targetScore = rankedWarData.target;
    leadValueEl.textContent = `${leadAmount.toLocaleString()} / ${targetScore.toLocaleString()}`;

    // --- Calculate and Update Progress Bar ---
    const totalScore = yourFaction.score + opponentFaction.score;
    let yourFactionProgress = 50; // Default to 50/50 if scores are 0
    if (totalScore > 0) {
        yourFactionProgress = (yourFaction.score / totalScore) * 100;
    }
    const opponentFactionProgress = 100 - yourFactionProgress;

    progressOneEl.style.width = `${yourFactionProgress}%`;
    progressTwoEl.style.width = `${opponentFactionProgress}%`;

    // --- Set the global war start time for the timer (which we'll fix next) ---
    globalWarStartedActualTime = rankedWarData.start || 0;
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
async function updateDualChainTimers(apiKey, yourFactionId, enemyFactionId) {
    // Find all the new HTML elements by their ID
    const friendlyHitsEl = document.getElementById('friendly-chain-hits');
    const friendlyTimeEl = document.getElementById('friendly-chain-time');
    const enemyHitsEl = document.getElementById('enemy-chain-hits');
    const enemyTimeEl = document.getElementById('enemy-chain-time');

    // If the elements don't exist on the page, stop.
    if (!friendlyHitsEl || !friendlyTimeEl || !enemyHitsEl || !enemyTimeEl) {
        return;
    }

    // --- Fetch and Display Your Faction's Chain ---
    if (apiKey && yourFactionId) {
        try {
            const yourChainUrl = `https://api.torn.com/faction/${yourFactionId}?selections=chain&key=${apiKey}&comment=MyTornPA_YourChain`;
            const yourChainResponse = await fetch(yourChainUrl);
            const yourChainData = await yourChainResponse.json();

            if (yourChainData.error) throw new Error(yourChainData.error.error);

            if (yourChainData.chain && yourChainData.chain.current > 0) {
                friendlyHitsEl.textContent = yourChainData.chain.current;
                // Set global variables for the live countdown timer
                currentLiveChainSeconds = yourChainData.chain.timeout || 0;
                lastChainApiFetchTime = Date.now();
            } else {
                friendlyHitsEl.textContent = '0';
                friendlyTimeEl.textContent = 'Over';
                currentLiveChainSeconds = 0; // Reset timer if no chain
            }
        } catch (error) {
            console.error("Error fetching your faction's chain:", error);
            if(friendlyTimeEl) friendlyTimeEl.textContent = 'Error';
        }
    }

    // --- Fetch and Display Enemy Faction's Chain ---
    if (apiKey && enemyFactionId) {
        try {
            const enemyChainUrl = `https://api.torn.com/faction/${enemyFactionId}?selections=chain&key=${apiKey}&comment=MyTornPA_EnemyChain`;
            const enemyChainResponse = await fetch(enemyChainUrl);
            const enemyChainData = await enemyChainResponse.json();

            if (enemyChainData.error) throw new Error(enemyChainData.error.error);

            if (enemyChainData.chain && enemyChainData.chain.current > 0) {
                enemyHitsEl.textContent = enemyChainData.chain.current;
                enemyTimeEl.textContent = formatTime(enemyChainData.chain.timeout); // Direct display, no smooth countdown
            } else {
                enemyHitsEl.textContent = '0';
                enemyTimeEl.textContent = 'Over';
            }
        } catch (error) {
            console.error("Error fetching enemy faction's chain:", error);
            if(enemyTimeEl) enemyTimeEl.textContent = 'Error';
        }
    } else {
        if(enemyTimeEl) enemyTimeEl.textContent = 'No Enemy';
        if(enemyHitsEl) enemyHitsEl.textContent = 'N/A';
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

async function initializeAndLoadData(apiKey, factionIdToUseOverride = null) {
    console.log(">>> ENTERING initializeAndLoadData FUNCTION <<<");

    const keyToUse = apiKey;
    let finalFactionId = factionIdToUseOverride;
	globalYourFactionID = finalFactionId;

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

    console.log("DEBUG_FINAL_FACTION_ID_CHECK: finalFactionId calculated:", finalFactionId);

    if (!finalFactionId) {
        const errorMsg = "ERROR: Faction ID is null or undefined. Cannot make API call for specific faction.";
        console.error(">>> FATAL ERROR IN initializeAndLoadData:", errorMsg);
        if (factionWarHubTitleEl) {
            factionWarHubTitleEl.textContent = errorMsg;
        }
        return;
    }

    try {
        const userFactionApiUrl = `https://api.torn.com/v2/faction/${finalFactionId}?selections=basic,members,chain,wars,bars&key=${keyToUse}&comment=MyTornPA_WarHub_Combined`;
        console.log("initializeAndLoadData: Attempting to fetch faction data from URL:", userFactionApiUrl);

        const userFactionResponse = await fetch(userFactionApiUrl);

        if (!userFactionResponse.ok) {
            const errorData = await userFactionResponse.json().catch(() => ({}));
            const apiErrorMsg = errorData.error ? `: ${errorData.error.error}` : '';
            throw new Error(`Torn API HTTP Error: ${userFactionResponse.status} ${userFactionResponse.statusText}${apiErrorMsg}. Full response: ${JSON.stringify(errorData)}`);
        }

        factionApiFullData = await userFactionResponse.json();
        console.log("initializeAndLoadData: Faction API Full Data fetched:", factionApiFullData);

        if (factionApiFullData.error) {
            console.error("Torn API responded with a detailed error:", factionApiFullData.error);
            throw new Error(`Torn API Error: ${JSON.stringify(factionApiFullData.error)}`);
        }
        
        // --- START: NEW LOGIC IS ADDED HERE ---
        // After successfully getting the data, we check for war info and call our new display function
        if (factionApiFullData.wars && factionApiFullData.wars.ranked) {
            updateRankedWarDisplay(factionApiFullData.wars.ranked, finalFactionId);
        } else {
            // This part runs if there is no active ranked war
            console.log("No active ranked war found in the API response.");
            const scoreBox = document.querySelector('.ops-ranked-war-score');
            if (scoreBox) {
                scoreBox.innerHTML = '<p style="text-align:center; padding-top: 20px;">No Active Ranked War</p>';
            }
        }
        // --- END: NEW LOGIC ---

        console.log(">>> initializeAndLoadData FUNCTION COMPLETED SUCCESSFULLY <<<");

        // After successful fetch, populate UI components
        const warDoc = await db.collection('factionWars').doc('currentWar').get();
        const warData = warDoc.exists ? warDoc.data() : {};
        populateUiComponents(warData, apiKey);

    } catch (error) {
        console.error(">>> ERROR CAUGHT IN initializeAndLoadData CATCH BLOCK:", error);
        if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = `Error Loading War Hub Data: ${error.message || 'Unknown error'}.`;
        
        // Reset related displays on error
        if (currentChainNumberDisplay) currentChainNumberDisplay.textContent = 'Error';
        if (chainStartedDisplay) chainStartedDisplay.textContent = 'Error';
        if (chainTimerDisplay) chainTimerDisplay.textContent = 'Error';
    }
}
async function updateFriendlyMembersTable(apiKey, firebaseAuthUid) {
    const tbody = document.getElementById('friendly-members-tbody');
    if (!tbody) {
        console.error("HTML Error: Friendly members table body (tbody) not found!");
        return;
    }
	
	const getStatTierClass = (statString) => {
    // Remove commas and convert to a number
    const numericStat = parseInt(String(statString).replace(/,/g, ''), 10);
    if (isNaN(numericStat)) {
        return ''; // No class if not a number
    }

    if (numericStat > 150000000) return 'stat-tier-6'; // Dark Red
    if (numericStat > 100000000) return 'stat-tier-5'; // Light Red
    if (numericStat > 10000000) return 'stat-tier-4'; // Orange
    if (numericStat > 1000000) return 'stat-tier-3'; // Yellow
    if (numericStat < 50000) return 'stat-tier-1'; // Light Grey
    
    return ''; // Tier 2 or default has no special class
};

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

        const factionMembersApiUrl = `https://api.torn.com/v2/faction/?selections=members&key=${apiKey}&comment=MyTornPA_FriendlyMembers&factionID=${actualUserFactionId}`;
        console.log(`[DEBUG] Fetching faction members from: ${factionMembersApiUrl}`);
        const factionResponse = await fetch(factionMembersApiUrl);
        const factionData = await factionResponse.json();

        if (!factionResponse.ok || factionData.error) {
            console.error("Error fetching faction members:", factionData.error || factionResponse.statusText);
            tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding: 20px; color: red;">Error loading faction members: ${factionData.error?.error || 'API Error'}.</td></tr>`;
            return;
        }

        const membersArray = factionData.members;
        if (!membersArray || membersArray.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding: 20px;">No members found in this faction.</td></tr>';
            return;
        }

        let tableRowsHtml = '';
        const memberPromises = [];

        for (const memberTornData of membersArray) {
            const memberId = memberTornData.id;

            if (!memberId) {
                console.warn("Skipping member due to missing ID:", memberTornData);
                continue;
            }

            const memberDocRef = db.collection('users').doc(String(memberId));
            memberPromises.push(memberDocRef.get().then(doc => {
                const memberFirebaseData = doc.exists ? doc.data() : null;
				const statusState = memberTornData.status?.state || '';
const originalDescription = memberTornData.status?.description || 'N/A';
let formattedStatus = originalDescription; // Set a default value
console.log(`STATUS CHECK -> State: '${statusState}', Description: '${originalDescription}'`);

if (statusState === 'Traveling') {
    // Removes "In " from the start of the string
    formattedStatus = originalDescription.replace('In ', '');
} else if (statusState === 'Hospital') {
    // Extracts the time part and adds "Hospital -"
    const timePart = originalDescription.split(' for ')[1];
    formattedStatus = timePart ? `Hospital - ${timePart}` : 'Hospital';
}

                const name = memberTornData.name || 'Unknown';
                const level = memberTornData.level || 'N/A';
                const lastAction = memberTornData.last_action ? memberTornData.last_action.relative : 'N/A';
            
                const position = memberTornData.position || 'N/A';

                // --- CORRECTED LOGIC FOR 'Revivable?' using revive_setting DIRECTLY ---
                const isRevivable = memberTornData.revive_setting || 'N/A';
                // --- END CORRECTED LOGIC ---

                const strength = memberFirebaseData?.battlestats?.strength?.toLocaleString() || 'N/A';
                const dexterity = memberFirebaseData?.battlestats?.dexterity?.toLocaleString() || 'N/A';
                const speed = memberFirebaseData?.battlestats?.speed?.toLocaleString() || 'N/A';
                const defense = memberFirebaseData?.battlestats?.defense?.toLocaleString() || 'N/A';
                const nerve = `${memberFirebaseData?.nerve?.current ?? 'N/A'} / ${memberFirebaseData?.nerve?.maximum ?? 'N/A'}`;
                const energy = `${memberFirebaseData?.energy?.current ?? 'N/A'} / ${memberFirebaseData?.energy?.maximum ?? 'N/A'}`;
                const drugCooldownValue = memberFirebaseData?.cooldowns?.drug ?? 0;
let drugCooldown = 'None';
if (drugCooldownValue > 0) {
    const hours = Math.floor(drugCooldownValue / 3600);
    const minutes = Math.floor((drugCooldownValue % 3600) / 60);
    
    const hourText = hours > 0 ? `${hours}hr` : '';
    const minuteText = minutes > 0 ? `${minutes}m` : '';
    
    drugCooldown = `${hourText} ${minuteText}`.trim();

    // If the cooldown is less than a minute, show <1m
    if (drugCooldown === '') {
        drugCooldown = '<1m';
    }
}
			   let statusClass = '';
                if (statusState === 'Hospital') statusClass = 'status-hospital';
                else if (statusState === 'Jail' || statusState === 'Traveling' || statusState === 'Federal') statusClass = 'status-other';
                else if (statusState === 'Okay') statusClass = 'status-okay';

               return `
    <tr data-id="${memberId}">
        <td><a href="https://www.torn.com/profiles.php?XID=${memberId}" target="_blank">${name}</a></td>
        <td>${position}</td>
        <td>${level}</td>
        <td>${lastAction}</td>
        <td class="${getStatTierClass(strength)}">${strength}</td>
        <td class="${getStatTierClass(dexterity)}">${dexterity}</td>
        <td class="${getStatTierClass(speed)}">${speed}</td>
        <td class="${getStatTierClass(defense)}">${defense}</td>
        <td class="${statusClass}">${formattedStatus}</td>
        <td>${nerve}</td>
        <td>${energy}</td>
        <td>${drugCooldown}</td>
        <td>${isRevivable}</td>
    </tr>
`;
            }).catch(error => {
                console.error(`Error fetching Firebase data for member ${memberId}:`, error);
                const name = memberTornData.name || 'Unknown';
                const level = memberTornData.level || 'N/A';
                const lastAction = memberTornData.last_action ? memberTornData.last_action.relative : 'N/A';
                const statusDescription = memberTornData.status?.description || 'N/A';
                const position = memberTornData.position || 'N/A';

                // --- CORRECTED LOGIC FOR 'Revivable?' in error fallback DIRECTLY ---
                const isRevivable = memberTornData.revive_setting || 'N/A';
                // --- END CORRECTED LOGIC ---

                let statusClass = '';
                if (statusState === 'Hospital') statusClass = 'status-hospital';
                else if (statusState === 'Jail' || statusState === 'Traveling' || statusState === 'Federal') statusClass = 'status-other';
                else if (statusState === 'Okay') statusClass = 'status-okay';

                return `
                    <tr data-id="${memberId}">
                        <td><a href="https://www.torn.com/profiles.php?XID=${memberId}" target="_blank">${name}</a></td>
                        <td>${position}</td>
                        <td>${level}</td>
                        <td>${lastAction}</td>
                        <td>N/A</td>
                        <td>N/A</td>
                        <td>N/A</td>
                        <td>N/A</td>
                        <td class="${statusClass}">${statusDescription}</td>
                        <td>${isRevivable}</td>
                    </tr>
                `;
            }));
        }

        const resolvedRows = await Promise.all(memberPromises);
        tableRowsHtml = resolvedRows.join('');
        tbody.innerHTML = tableRowsHtml;

    } catch (error) {
        console.error("Error updating friendly members table:", error);
        tbody.innerHTML = `<p style="color:red;">Error loading faction list: ${error.message || String(error)}.</p>`;
    }
}





async function displayFactionMembersInChatTab(factionMembersApiData, targetDisplayElement) {
    if (!targetDisplayElement) {
        console.error("HTML Error: Target display element not provided for faction members list.");
        return;
    }

    targetDisplayElement.innerHTML = `<p style="text-align:center; padding: 10px;">Loading faction members details...</p>`;

    if (!factionMembersApiData || typeof factionMembersApiData !== 'object' || Object.keys(factionMembersApiData).length === 0) {
        targetDisplayElement.innerHTML = `<p style="text-align:center; padding: 10px;">No faction members found.</p>`;
        return;
    }

    const membersArray = Object.values(factionMembersApiData);

    // Sort members by rank then alphabetically
    const rankOrder = { "Leader": 0, "Co-leader": 1, "Member": 99, "Applicant": 100 };
    membersArray.sort((a, b) => {
        const orderA = rankOrder[a.position] !== undefined ? rankOrder[a.position] : rankOrder["Member"];
        const orderB = rankOrder[b.position] !== undefined ? rankOrder[b.position] : rankOrder["Member"];
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
        const memberRank = member.position;

        const memberItemDiv = document.createElement('div');
        memberItemDiv.classList.add('member-item');

        if (memberRank === "Leader" || memberRank === "Co-leader") {
            memberItemDiv.classList.add('leader-member');
        }

        // --- THIS IS THE MODIFIED PART ---
        memberItemDiv.innerHTML = `
            <span class="member-rank">${memberRank}</span>
            
            <div class="member-identity">
                <img src="../../images/default_profile_icon.png" alt="${memberName}'s profile picture" class="member-profile-pic">
                <span class="member-name">${memberName}</span>
            </div>

            <div class="member-actions">
                <button class="add-member-button" data-member-id="${tornPlayerId}" title="Add Friend">
                    👤<span class="plus-sign">+</span>
                </button>
                <button class="item-button message-button" data-member-id="${tornPlayerId}" title="Send Message">✉️</button>
            </div>
        `;
        // --- END MODIFIED PART ---

        membersListContainer.appendChild(memberItemDiv);

        fetchPromises.push((async () => {
            try {
                const docRef = db.collection('users').doc(String(tornPlayerId));
                const docSnap = await docRef.get();

                if (docSnap.exists) {
                    const firebaseMemberData = docSnap.data();
                    const profileImageUrl = firebaseMemberData.profile_image || '../../images/default_profile_icon.png';
                    const imgElement = memberItemDiv.querySelector('.member-profile-pic');
                    if (imgElement) {
                        imgElement.src = profileImageUrl;
                    }
                } else {
                    console.warn(`[Firestore] No detailed data found for member ${tornPlayerId} in 'users' collection.`);
                }
            } catch (error) {
                console.error(`[Firestore Error] Failed to fetch detailed data for member ${tornPlayerId}:`, error);
            }
        })());
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
       

	   case 'settings':
            // The `targetChatPanel` and `targetDisplayArea` are not needed here
            // because populateSettingsTab() takes chatDisplayArea directly.
            // if (settingsPanel) settingsPanel.classList.add('active'); // This is not needed in JS-only strategy
            populateSettingsTab(chatDisplayArea); // Call the correct function passing chatDisplayArea
            showInputArea = false; // Hide input for settings tab
            break;
	  
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
	
	 if (tabName === 'friends') {
        fetchAndDisplayFriends();
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

    // Make sure 'bars' is always included in the selections
    const selections = "profile,personalstats,battlestats,workstats,basic,cooldowns,bars";
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
		console.log(`[DEBUG] Final API URL for Personal Stats Modal: ${apiUrl}`); // ADD THIS LINE HERE
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
            if (data.error.code === 2 || data.error.code === 10) {
                throw new Error(`The member's API key is invalid or lacks sufficient permissions. (Error: ${data.error.error})`);
            } else {
                throw new Error(`API Error: ${data.error.error || data.error.message || JSON.stringify(data.error)}`);
            }
        }

        if (!data || Object.keys(data).length === 0) {
            throw new Error("Failed to retrieve any meaningful data after API call.");
        }

        // --- Call Netlify Function for Secure Firebase Storage ---
        const userId = data.player_id;
        if (userId) {
            const userDataToSave = {
                name: data.name,
                level: data.level,
                faction_id: data.faction?.faction_id || null,
                faction_name: data.faction?.faction_name || null,

                // REVERTED LINES HERE: Send the entire objects
                // We are now sending the full 'energy' and 'nerve' objects as maps,
                // matching how 'life' and 'cooldowns' are handled.
                nerve: data.nerve || {}, // Store the entire nerve object, default to empty object
                energy: data.energy || {}, // Store the entire energy object, default to empty object
                happy: data.happy || {}, // Store the entire happy object, default to empty object
                life: data.life || {}, // Store the entire life object, default to empty object
                // End of REVERTED LINES

                traveling: data.status?.state === 'Traveling' || false,
                hospitalized: data.status?.state === 'Hospital' || false,
                cooldowns: {
                    drug: data.cooldowns?.drug || 0,
                    booster: data.cooldowns?.booster || 0,
                },
                personalstats: data.personalstats || {},
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
                workstats: {
                    manual_labor: data.manual_labor || data.workstats?.manual_labor || 0,
                    intelligence: data.intelligence || data.workstats?.intelligence || 0,
                    endurance: data.endurance || data.workstats?.endurance || 0,
                },
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            };

            console.log(`[DEBUG] Prepared user data for Netlify Function:`, userDataToSave);

            try {
                const netlifyFunctionResponse = await fetch('/.netlify/functions/update-user-data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId: String(userId),
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


        // --- HTML Content Generation (This part uses the 'data' directly from Torn API, which now includes 'bars') ---
        let htmlContent = '<h4>User Information</h4>';
        htmlContent += `<p><strong>Name:</strong> <span class="stat-value-api">${data.name || 'N/A'}</span></p>`;
        htmlContent += `<p><strong>User ID:</strong> <span class="stat-value-api">${data.player_id || data.userID || 'N/A'}</span></p>`;
        htmlContent += `<p><strong>Level:</strong> <span class="stat-value-api">${data.level || 'N/A'}</span></p>`;

        let xanaxDisplay = 'N/A';
        if (data.personalstats && data.personalstats.xantaken !== undefined) {
            xanaxDisplay = typeof data.personalstats.xantaken === 'number' ? data.personalstats.xantaken.toLocaleString() : xanaxDisplay;
        }
        htmlContent += `<p><strong>Xanax Used:</strong> <span class="stat-value-api">${xanaxDisplay}</span></p>`;

        const tcpAnniversaryDateVal = firestoreProfileData ? firestoreProfileData.tcpRegisteredAt : null;
        htmlContent += `<p><strong>TCP Anniversary:</strong> <span class="stat-value-api">${formatTcpAnniversaryDate(tcpAnniversaryDateVal)}</span></p>`;

        // Re-extract nerve and energy specifically for HTML display (using the full 'data' object received)
        const nerveForDisplay = data.nerve || {};
        const energyForDisplay = data.energy || {};

        const nerveCurrent = nerveForDisplay.current !== undefined ? nerveForDisplay.current : 'N/A';
        const nerveMax = nerveForDisplay.maximum !== undefined ? nerveForDisplay.maximum : '';
        const nerveIncrement = nerveForDisplay.increment !== undefined ? nerveForDisplay.increment : ''; // Assuming you meant increment as "gain"
        const nerveDisplay = nerveCurrent === 'N/A' ? 'Not available' : `${nerveCurrent}${nerveMax ? '/' + nerveMax : ''} ${nerveIncrement ? `+${nerveIncrement}/5min` : ''}`.trim();

        const energyCurrent = energyForDisplay.current !== undefined ? energyForDisplay.current : 'N/A';
        const energyMax = energyForDisplay.maximum !== undefined ? energyForDisplay.maximum : '';
        const energyIncrement = energyForDisplay.increment !== undefined ? energyForDisplay.increment : ''; // Assuming you meant increment as "gain"
        const energyDisplay = energyCurrent === 'N/A' ? 'Not available' : `${energyCurrent}${energyMax ? '/' + energyMax : ''} ${energyIncrement ? `+${energyIncrement}/10min` : ''}`.trim();
        // End of Nerve and Energy display re-extraction


        htmlContent += `
            <div class="member-detail-header">
                <div class="member-header-top-row">
                    <div class="member-stat-block member-stat-block-small">
                        <h5>Energy:</h5>
                        <p>${energyDisplay}</p>
                    </div>
                    ${data.profile_image ? `<img src="${data.profile_image}" alt="${data.name}" class="member-detail-profile-image">` : ''}
                    <div class="member-stat-block member-stat-block-small">
                        <h5>Nerve:</h5>
                        <p>${nerveDisplay}</p>
                    </div>
                </div>
                <div class="member-detail-name-id">${data.name || 'Unknown'} [${data.player_id || 'N/A'}]</div>
            </div>`;


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

    const muteSoundButton = document.getElementById('muteSoundButton');
    if (muteSoundButton) {
        muteSoundButton.textContent = isChatMuted ? '🔇' : '🔊';
        muteSoundButton.classList.toggle('muted', isChatMuted);
        muteSoundButton.addEventListener('click', () => {
            isChatMuted = !isChatMuted;
            localStorage.setItem('isChatMuted', isChatMuted);
            muteSoundButton.textContent = isChatMuted ? '🔇' : '🔊';
            muteSoundButton.classList.toggle('muted', isChatMuted);
            console.log(`Chat sounds ${isChatMuted ? 'muted' : 'unmuted'}.`);
        });
    }

    const aidButton = document.querySelector('.aid-button');
    if (aidButton) {
        aidButton.addEventListener('click', () => {
            console.log('Aid button clicked. Functionality temporarily disabled.');
        });
    }

    const flightButton = document.querySelector('.flight-button');
    if (flightButton) {
        flightButton.addEventListener('click', () => {
            window.open('https://www.torn.com/page.php?sid=travel', '_blank');
            console.log('Flight button clicked. Opening travel page.');
        });
    }

    const armoryButton = document.querySelector('.armory-button');
    if (armoryButton) {
        armoryButton.addEventListener('click', () => {
            window.open('https://www.torn.com/factions.php?step=your&type=1#/tab=armoury&start=0&sub=medical', '_blank');
            console.log('Armory button clicked. Opening armory page.');
        });
    }

    const refillButton = document.querySelector('.refill-button');
    if (refillButton) {
        refillButton.addEventListener('click', () => {
            window.open('https://www.torn.com/page.php?sid=points', '_blank');
            console.log('Refill button clicked. Opening points page.');
        });
    }

    const alarmButton = document.querySelector('.siren-btn');
    if (alarmButton) {
        alarmButton.addEventListener('click', () => {
            console.log('Alarm button clicked. Functionality temporarily disabled.');
        });
    }
    
    if (chatSendBtn && chatTextInput) {
        chatSendBtn.addEventListener('click', sendChatMessage);
        chatTextInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                sendChatMessage();
            }
        });
    }

    if (chatTabsContainer && chatTabButtons.length > 0) {
        chatTabButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                handleChatTabClick(event);
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
                alert('Error posting announcement.');
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
                alert('Error saving war status.');
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

    const chatDisplay = document.getElementById('chat-display-area');
    if (chatDisplay) {
        chatDisplay.addEventListener('click', function(event) {
            const addButton = event.target.closest('.add-member-button');
            if (!addButton) return;

            addButton.disabled = true;
            const friendIdToAdd = addButton.dataset.memberId;
            const currentUser = auth.currentUser;
            if (!currentUser) {
                console.error("Error: You must be logged in to add a friend.");
                alert("You are not logged in. Please refresh the page.");
                addButton.disabled = false;
                return;
            }
            const currentUserId = currentUser.uid;
            const friendDocRef = db.collection('userProfiles').doc(currentUserId).collection('friends').doc(friendIdToAdd);
            friendDocRef.set({
                addedAt: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then(() => {
                console.log(`Successfully added friend with ID: ${friendIdToAdd}`);
                addButton.classList.add('success');
                addButton.innerHTML = '✓';
                setTimeout(() => {
                    addButton.style.display = 'none';
                }, 1500);
            })
            .catch((error) => {
                console.error("Error adding friend to database: ", error);
                alert("There was an error adding the friend. Please check the console for errors.");
                addButton.disabled = false;
            });
        });
    }
    
    // --- Event Listeners for Image Upload Buttons ---
    const gamePlanUploadInput = document.getElementById('gamePlanImageUpload');
    const gamePlanDisplayDiv = document.getElementById('gamePlanDisplay');

    if (gamePlanUploadInput && gamePlanDisplayDiv) {
        gamePlanUploadInput.addEventListener('change', () => {
            handleImageUpload(gamePlanUploadInput, gamePlanDisplayDiv);
        });
    }

    const announcementUploadInput = document.getElementById('announcementImageUpload');
    const announcementDisplayDiv = document.getElementById('factionAnnouncementsDisplay');
    
    if (announcementUploadInput && announcementDisplayDiv) {
        announcementUploadInput.addEventListener('change', () => {
            handleImageUpload(announcementUploadInput, announcementDisplayDiv);
        });
    }
}

if (addFriendBtn) {
    addFriendBtn.addEventListener('click', async () => {
        const friendId = addFriendIdInput.value.trim();
        if (!friendId) {
            addFriendStatus.textContent = "Please enter a Torn Player ID.";
            addFriendStatus.style.color = 'orange';
            return;
        }

        if (!auth.currentUser) {
            addFriendStatus.textContent = "You must be logged in to add friends.";
            addFriendStatus.style.color = 'red';
            return;
        }

        addFriendStatus.textContent = "Adding friend...";
        addFriendStatus.style.color = 'white';

        try {
            const userProfileDocRef = db.collection('userProfiles').doc(auth.currentUser.uid);
            const userProfileDoc = await userProfileDocRef.get();
            let currentFriends = userProfileDoc.exists && userProfileDoc.data().friends ? userProfileDoc.data().friends : [];

            if (currentFriends.includes(friendId)) {
                addFriendStatus.textContent = "This player is already in your friends list.";
                addFriendStatus.style.color = 'orange';
                return;
            }
			
			currentFriends.push(friendId);

            // Update the user's profile with the new friends list
            await userProfileDocRef.set({ friends: currentFriends }, { merge: true });
            
            // If the friend wasn't already in the top-level 'users' collection, create/update their basic info
            // This ensures displayFriendlyMembersTable can pull some info
            await db.collection('users').doc(friendId).set({
                name: friendName, // Use fetched name or default
                tornId: friendId,
                // Add other basic info you'd want to store for this friend immediately
                // e.g., level: '?' if not fetched, last_action: { timestamp: 0 } etc.
            }, { merge: true });


            addFriendStatus.textContent = `Successfully added ${friendName} [${friendId}]!`;
            addFriendStatus.style.color = 'lightgreen';
            addFriendIdInput.value = ''; // Clear input

            // *** IMPORTANT: Refresh the friends table after adding ***
            fetchAndDisplayFriends(); // Refresh the display
            // ****************************************************

            // After 1.5 seconds, clear the status message
            setTimeout(() => {
                addFriendStatus.textContent = '';
            }, 1500);

        } catch (error) {
            console.error("Error adding friend:", error);
            addFriendStatus.textContent = `Error adding friend: ${error.message}`;
            addFriendStatus.style.color = 'red';
        }
    });
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


async function initializeAndLoadData(apiKey, factionIdToUseOverride = null) {
    console.log(">>> ENTERING initializeAndLoadData FUNCTION <<<");

    const keyToUse = apiKey;
    let finalFactionId = factionIdToUseOverride;
	 

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

    if (!finalFactionId) {
        if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = "ERROR: Faction ID not found.";
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
        
        // After fetching, update the UI components
        if (factionApiFullData.wars && factionApiFullData.wars.ranked) {
            updateRankedWarDisplay(factionApiFullData.wars.ranked, finalFactionId);
        } else {
            const scoreBox = document.querySelector('.ops-ranked-war-score');
            if (scoreBox) scoreBox.innerHTML = '<p style="text-align:center; padding: 20px;">No Active Ranked War</p>';
        }
        
        const warDoc = await db.collection('factionWars').doc('currentWar').get();
        const warData = warDoc.exists ? warDoc.data() : {};
        populateUiComponents(warData, apiKey);

    } catch (error) {
        console.error(">>> ERROR CAUGHT IN initializeAndLoadData CATCH BLOCK:", error);
        if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = `Error Loading War Hub Data.`;
    }
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

// Helper function to generate dummy recently met data
function generateDummyRecentlyMet(count) {
    const dummyMet = [];
    const factionTags = ['[FOE]', '[RIVAL]', '[ENEMY]', '[OPP]'];
    const statuses = ['Online', 'Offline', 'Hospital', 'Traveling', 'Jail'];
    const names = ['AggroUser', 'QuickStrike', 'DecoyDiver', 'GhostHunter', 'WarHawk'];

    for (let i = 1; i <= count; i++) {
        dummyMet.push({
            id: `met_user_${i}`,
            name: `${names[Math.floor(Math.random() * names.length)]}${i}`,
            level: Math.floor(Math.random() * (99 - 10 + 1)) + 10,
            faction_tag: factionTags[Math.floor(Math.random() * factionTags.length)],
            last_action_timestamp: Math.floor(Date.now() / 1000) - (Math.floor(Math.random() * 86400 * 3)), // within 3 days
            status_description: statuses[Math.floor(Math.random() * statuses.length)],
            profile_image: `../../images/default_profile_icon.png`
        });
    }
    return dummyMet;
}

// NEW FUNCTION: Populates the content of the Recently Met tab
// NEW FUNCTION: Populates the content of the Recently Met tab with a grid layout
async function populateRecentlyMetTab(targetDisplayElement) {
    console.log("[Recently Met Tab] Populating tab with new grid layout...");

    if (!targetDisplayElement) {
        console.error("HTML Error: targetDisplayElement not provided to populateRecentlyMetTab function.");
        return;
    }

    // Create the grid container
    targetDisplayElement.innerHTML = `<div class="members-list-container"></div>`;
    const membersListContainer = targetDisplayElement.querySelector('.members-list-container');

    if (!membersListContainer) {
        console.error("Failed to create members-list-container.");
        return;
    }
    
    membersListContainer.innerHTML = `<p style="text-align:center; padding: 10px;">Loading recently met players...</p>`;

    // Using dummy data as before
    const recentlyMetPlayers = generateDummyRecentlyMet(50);

    if (!recentlyMetPlayers || recentlyMetPlayers.length === 0) {
        membersListContainer.innerHTML = `<p style="text-align:center; padding: 10px;">No recently met players found.</p>`;
        return;
    }

    // Clear loading message
    membersListContainer.innerHTML = '';

    // Loop through players and create the new "member-item" divs
    for (const player of recentlyMetPlayers) {
        const memberItemDiv = document.createElement('div');
        memberItemDiv.classList.add('member-item');

        // --- THIS IS THE MODIFIED PART (Faction Tag is now removed) ---
        memberItemDiv.innerHTML = `
            <div class="member-identity">
                <img src="${player.profile_image}" alt="Profile Pic" class="member-profile-pic">
                <span class="member-name">${player.name}</span>
            </div>
            <div class="member-actions">
                <button class="item-button letter-button" title="Send Message">✉️</button>
                <button class="item-button trash-button" title="Remove">🗑️</button>
            </div>
        `;
        // --- END MODIFIED PART ---

        membersListContainer.appendChild(memberItemDiv);
    }
    // TODO: Add event listeners for the new buttons if needed
}



async function fetchAndDisplayFriends() {
    if (!auth.currentUser) {
        console.log("No user logged in, cannot fetch friends.");
        if (friendsTbody) {
            friendsTbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding: 20px;">Please log in to view your friends.</td></tr>`;
        }
        return;
    }

    if (!friendsTbody) {
        console.error("JavaScript error: Cannot find the 'friends-tbody' element.");
        return;
    }

    friendsTbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding: 20px;">Loading friends...</td></tr>`;

    try {
        const userProfileDocRef = db.collection('userProfiles').doc(auth.currentUser.uid);
        const userProfileDoc = await userProfileDocRef.get();

        if (userProfileDoc.exists && userProfileDoc.data().friends) {
            const friendTornIds = userProfileDoc.data().friends;
            console.log("Friend Torn IDs from user profile:", friendTornIds);

            if (friendTornIds.length === 0) {
                friendsTbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding: 20px;">You have no friends added yet.</td></tr>`;
                return;
            }

            const friendPromises = friendTornIds.map(id => db.collection('users').doc(String(id)).get());
            const friendDocs = await Promise.all(friendPromises);

            let allRowsHtml = '';
            let friendsFound = 0;

            for (const friendDoc of friendDocs) {
                if (friendDoc.exists) {
                    const friend = friendDoc.data();
                    const tornPlayerId = friendDoc.id; // Document ID is the Torn Player ID

                    // You might need to adjust these field names based on what you actually store in your 'users' collection
                    const name = friend.name || 'N/A';
                    const level = friend.level || 'N/A';
                    const lastAction = friend.last_action ? formatRelativeTime(friend.last_action.timestamp) : 'N/A'; // Assuming formatRelativeTime exists
                    const status = friend.status ? friend.status.description : 'N/A';
                    
                    // Placeholders for stats - You'll need to fetch these from Torn API or store them if needed
                    const strength = friend.strength || 'N/A'; 
                    const dexterity = friend.dexterity || 'N/A';
                    const speed = friend.speed || 'N/A';
                    const defense = friend.defense || 'N/A';
                    const nerve = friend.nerve || 'N/A'; // Assuming you meant battle stats here, not actual nerve bar
                    const energy = friend.energy || 'N/A'; // Assuming you meant battle stats here, not actual energy bar
                    const revivable = (friend.status && friend.status.state === 'Hospital' && friend.status.description.includes('hospital')) ? 'Yes' : 'No';

                    const profileUrl = `https://www.torn.com/profiles.php?XID=${tornPlayerId}`;

                    allRowsHtml += `
                        <tr data-id="${tornPlayerId}">
                            <td><a href="${profileUrl}" target="_blank">${name} [${tornPlayerId}]</a></td>
                            <td>${level}</td>
                            <td>${lastAction}</td>
                            <td>${status}</td>
                            <td>${strength}</td>
                            <td>${dexterity}</td>
                            <td>${speed}</td>
                            <td>${defense}</td>
                            <td>${nerve}</td>
                            <td>${energy}</td>
                            <td>${revivable}</td>
                        </tr>
                    `;
                    friendsFound++;
                } else {
                    console.warn(`Friend document with ID ${friendDoc.id} does not exist in 'users' collection.`);
                }
            }

            if (friendsFound === 0) {
                friendsTbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding: 20px;">No friend data found for your listed friends.</td></tr>`;
            } else {
                friendsTbody.innerHTML = allRowsHtml;
            }

        } else {
            friendsTbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding: 20px;">You have no friends added yet.</td></tr>`;
        }
    } catch (error) {
        console.error("Error fetching or displaying friends:", error);
        friendsTbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding: 20px;">Error loading friends: ${error.message}</td></tr>`;
    }
}
// MODIFIED FUNCTION: Populates the content of the Blocked People tab with Friends from Firebase and dummy Ignores
async function populateBlockedPeopleTab(currentUserId, friendsListEl, ignoresListEl) {
    console.log("[Blocked People Tab] Populating tab. User ID:", currentUserId); // Log current user ID for debug

    if (!friendsListEl || !ignoresListEl) {
        console.error("HTML Error: Friends or Ignores list elements not provided to populateBlockedPeopleTab function.");
        return;
    }

    friendsListEl.innerHTML = '<p style="text-align:center; padding: 10px;">Loading friends...</p>';
    ignoresListEl.innerHTML = '<p style="text-align:center; padding: 10px;">Loading ignores...</p>'; // Still show loading for ignores while friends load

    if (!currentUserId) {
        friendsListEl.innerHTML = '<p style="text-align:center; padding: 10px; color: yellow;">Please log in to see your friends list.</p>';
        console.warn("[Blocked People Tab] Current user ID not available to fetch friends.");
        // If no currentUserId, still populate dummy ignores
        const dummyIgnores = generateDummyIgnores(50); // Assumes generateDummyIgnores is defined globally
        let ignoresHtml = '';
        dummyIgnores.forEach(ignore => { // Simplified to ensure it runs
            const displayId = ignore.id.split('_')[1];
            if (ignore.type === 'user') {
                ignoresHtml += `
                    <div class="list-item ignore-entry">
                        <img src="../../images/default_profile_icon.png" alt="Profile Pic" class="profile-pic">
                        <span class="item-name">${ignore.name} [${displayId}]</span>
                        <button class="item-button trash-button">🗑️</button>
                    </div>
                `;
            } else {
                ignoresHtml += `
                    <div class="list-item ignore-entry">
                        <span class="item-icon faction-icon">🏢</span>
                        <span class="item-name">${ignore.name} [${displayId}]</span>
                        <button class="item-button trash-button">🗑️</button>
                    </div>
                `;
            }
        });
        ignoresListEl.innerHTML = ignoresHtml;
        return;
    }

    // --- Fetch and Display Friends from Firebase ---
    try {
        const friendsCollectionRef = db.collection('userProfiles').doc(currentUserId).collection('friends');
        console.log("[Blocked People Tab] Fetching friends from:", friendsCollectionRef.path);
        const friendsSnapshot = await friendsCollectionRef.get();

        const friendDetailsPromises = [];

        if (friendsSnapshot.empty) {
            friendsListEl.innerHTML = '<p style="text-align:center; padding: 10px;">No friends added yet.</p>';
            console.log("[Blocked People Tab] Friends sub-collection is empty.");
        } else {
            console.log("[Blocked People Tab] Friends snapshot not empty. Processing friends...");
            for (const friendDoc of friendsSnapshot.docs) {
                const friendTornId = friendDoc.id;
                console.log("[Blocked People Tab] Processing friend ID from sub-collection:", friendTornId);

                friendDetailsPromises.push(
                    db.collection('users').doc(friendTornId).get().then(userDoc => {
                        console.log(`[Blocked People Tab] Fetched users/${friendTornId}. Document exists:`, userDoc.exists);
                        if (userDoc.exists) {
                            const userData = userDoc.data();
                            const friendName = userData.name || `Torn ID: ${friendTornId}`;
                            const profileImage = userData.profile_image || '../../images/default_profile_icon.png';
                            console.log(`[Blocked People Tab] Found user data for ${friendName} (ID: ${friendTornId}):`, userData);
                            return `
                                <div class="list-item friend-entry">
                                    <img src="${profileImage}" alt="Profile Pic" class="profile-pic">
                                    <span class="item-name">${friendName} [${friendTornId}]</span>
                                    <button class="item-button letter-button" data-friend-id="${friendTornId}">✉️</button>
                                    <button class="item-button trash-button" data-friend-id="${friendTornId}">🗑️</button>
                                </div>
                            `;
                        } else {
                            console.warn(`[Blocked People Tab] No detailed 'users' data found for friend Torn ID: ${friendTornId}. Displaying placeholder.`);
                            return `
                                <div class="list-item friend-entry">
                                    <img src="../../images/default_profile_icon.png" alt="Default Profile Pic" class="profile-pic">
                                    <span class="item-name">Unknown [${friendTornId}]</span>
                                    <button class="item-button letter-button" data-friend-id="${friendTornId}">✉️</button>
                                    <button class="item-button trash-button" data-friend-id="${friendTornId}">🗑️</button>
                                </div>
                            `;
                        }
                    }).catch(error => {
                        console.error(`[Blocked People Tab] Error fetching user data for friend ${friendTornId}:`, error);
                        return `
                            <div class="list-item friend-entry">
                                <img src="../../images/default_profile_icon.png" alt="Default Profile Pic" class="profile-pic">
                                <span class="item-name">Error [${friendTornId}]</span>
                                <button class="item-button letter-button" data-friend-id="${friendTornId}">✉️</button>
                                <button class="item-button trash-button" data-friend-id="${friendTornId}">🗑️</button>
                            </div>
                        `;
                    })
                );
            }
            const friendsHtmlArray = await Promise.all(friendDetailsPromises);
            friendsListEl.innerHTML = friendsHtmlArray.join('');
            console.log("[Blocked People Tab] Friends list HTML updated with real data.");

            // Add event listeners for new buttons (message, trash) via delegation
            friendsListEl.addEventListener('click', async function(event) {
                const button = event.target.closest('.item-button');
                if (!button) return;

                const friendId = button.dataset.friendId;
                if (!friendId) return;

                if (button.classList.contains('letter-button')) {
                    console.log(`Message button clicked for friend ID: ${friendId}`);
                    window.open(`https://www.torn.com/messages.php#/p=compose&XID=${friendId}`, '_blank');
                } else if (button.classList.contains('trash-button')) {
                    if (confirm(`Are you sure you want to remove Torn ID: ${friendId} from your friends list?`)) {
                        try {
                            if (!currentUserId) {
                                alert("Error: User not logged in. Cannot remove friend.");
                                return;
                            }
                            await db.collection('userProfiles').doc(currentUserId).collection('friends').doc(friendId).delete();
                            alert(`Friend (ID: ${friendId}) removed successfully.`);
                            populateBlockedPeopleTab(currentUserId, friendsListEl, ignoresListEl);
                        } catch (error) {
                            console.error("Error removing friend from database:", error);
                            alert("Failed to remove friend. See console for details.");
                        }
                    }
                }
            });

        } // End of if (friendsSnapshot.empty) else block

    } catch (error) {
        console.error("Error fetching friends list or friend details from Firebase:", error);
        friendsListEl.innerHTML = `<p style="text-align:center; padding: 10px; color: red;">Error loading friends: ${error.message}</p>`;
    }

    // --- Populate Dummy Ignores (Keep as is) ---
    const dummyIgnores = generateDummyIgnores(50); // Assumes generateDummyIgnores is defined globally
    let ignoresHtml = '';
    dummyIgnores.forEach(ignore => { // Simplified
        const displayId = ignore.id.split('_')[1];
        if (ignore.type === 'user') {
            ignoresHtml += `
                <div class="list-item ignore-entry">
                    <img src="../../images/default_profile_icon.png" alt="Profile Pic" class="profile-pic">
                    <span class="item-name">${ignore.name} [${displayId}]</span>
                    <button class="item-button trash-button">🗑️</button>
                </div>
            `;
        } else {
            ignoresHtml += `
                <div class="list-item ignore-entry">
                    <span class="item-icon faction-icon">🏢</span>
                    <span class="item-name">${ignore.name} [${displayId}]</span>
                    <button class="item-button trash-button">🗑️</button>
                </div>
            `;
        }
    });
    ignoresListEl.innerHTML = ignoresHtml;
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
            displayFriendlyMembersTable(factionApiFullData.members);
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

    // Game Plan & Announcements (from Firebase warData)
    if (gamePlanDisplay) gamePlanDisplay.textContent = warData.gamePlan || 'No game plan available.';
    if (factionAnnouncementsDisplay) factionAnnouncementsDisplay.textContent = warData.quickAnnouncement || 'No current announcements.';
    if (gamePlanEditArea) gamePlanEditArea.value = warData.gamePlan || '';

    populateWarStatusDisplay(warData); // Uses warData (Firebase)
    loadWarStatusForEdit(warData);     // Uses warData (Firebase)

    // Store enemy faction ID globally (from Firebase warData)
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
//       Also prevents showing the same target pair more than two times in a row.
async function displayQuickFFTargets(userApiKey, playerId) {
    const quickFFTargetsDisplay = document.getElementById('quickFFTargetsDisplay');
    if (!quickFFTargetsDisplay) {
        console.error("HTML Error: Cannot find element with ID 'quickFFTargetsDisplay'.");
        return;
    }

    // Check if the display is currently empty, and if so, show a loading message.
    // This prevents blinking if previous content exists.
    if (quickFFTargetsDisplay.innerHTML === '') {
        quickFFTargetsDisplay.innerHTML = '<span style="color: #6c757d;">Loading targets...</span>';
    }

    if (!userApiKey || !playerId) {
        // If API key or Player ID is missing, show an error (if not already showing content)
        if (!quickFFTargetsDisplay.innerHTML.includes('Error:') && !quickFFTargetsDisplay.innerHTML.includes('Login & API/ID needed')) {
            quickFFTargetsDisplay.innerHTML = '<span style="color: #ff4d4d;">API Key or Player ID missing.</span>';
        }
        console.warn("Cannot fetch Quick FF Targets: API Key or Player ID is missing.");
        return; // Exit, keeping current content or error message
    }

    try {
        // 1. Get IDs of players currently in the main enemy table to exclude them
        const currentEnemyTableRows = enemyTargetsContainer.querySelectorAll('tr[id^="target-row-"]');
        const excludedPlayerIDs = Array.from(currentEnemyTableRows).map(row => row.id.replace('target-row-', ''));
        // console.log("Excluded Player IDs (from main table):", excludedPlayerIDs); // Debugging line

        const functionUrl = `/.netlify/functions/get-recommended-targets`;
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: userApiKey, playerId: playerId })
        });
        const data = await response.json();

        // If response is not OK or contains an API error
        if (!response.ok || data.error) {
            const errorMessage = data.error ? data.error.error || JSON.stringify(data.error) : `Error from server: ${response.status} ${response.statusText}`;
            console.error("Error fetching Quick FF Targets:", errorMessage);
            // On error, keep existing content. Only display general error if element was blank or "Loading".
            if (quickFFTargetsDisplay.innerHTML.includes('Loading targets...') || quickFFTargetsDisplay.innerHTML === '') {
                 quickFFTargetsDisplay.innerHTML = `<span style="color: #ff4d4d;">Error: ${errorMessage}</span>`;
            }
            return; // Exit, keeping previous valid content or the new error message
        }

        // If no targets are returned from the API function
        if (!data.targets || data.targets.length === 0) {
            quickFFTargetsDisplay.innerHTML = '<span style="color: #6c757d;">No recommended targets found.</span>';
            // Reset consecutive counter if no targets are found (as it's not the "same" pair)
            lastDisplayedTargetIDs = [];
            consecutiveSameTargetsCount = 0;
            return;
        }

        // 2. Filter out already displayed targets from the fetched list
        let availableTargets = data.targets.filter(target => !excludedPlayerIDs.includes(target.playerID));
        // console.log("Available targets after exclusion:", availableTargets); // Debugging line

        if (availableTargets.length === 0) {
            quickFFTargetsDisplay.innerHTML = '<span style="color: #6c757d;">No new targets available.</span>';
            // Reset consecutive counter if no targets are found
            lastDisplayedTargetIDs = [];
            consecutiveSameTargetsCount = 0;
            return;
        }

        // --- Logic to prevent showing the same targets more than two times in a row ---
        const MAX_TARGETS_TO_DISPLAY = 2;
        const MAX_SHUFFLE_ATTEMPTS = 10; // Prevent infinite loop for very limited target sets

        let finalSelectedTargets = [];
        let currentDisplayedTargetIDs = [];
        let attempt = 0;

        do {
            // Shuffle the available targets (Fisher-Yates algorithm)
            for (let i = availableTargets.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [availableTargets[i], availableTargets[j]] = [availableTargets[j], availableTargets[i]]; // Swap elements
            }

            // Select the first N targets for this attempt
            finalSelectedTargets = availableTargets.slice(0, MAX_TARGETS_TO_DISPLAY);
            currentDisplayedTargetIDs = finalSelectedTargets.map(t => t.playerID);

            attempt++;

            // Condition to re-shuffle:
            // 1. We have enough targets to actually pick a pair (>=2)
            // 2. The newly selected pair is identical to the last one displayed
            // 3. This is the 3rd or more consecutive time showing the same pair (consecutiveSameTargetsCount >= 2)
            // 4. We haven't exceeded max shuffle attempts (to prevent infinite loop if no other options exist)
        } while (availableTargets.length >= MAX_TARGETS_TO_DISPLAY &&
                 areTargetSetsIdentical(currentDisplayedTargetIDs, lastDisplayedTargetIDs) &&
                 consecutiveSameTargetsCount >= 2 &&
                 attempt < MAX_SHUFFLE_ATTEMPTS);

        // After the loop, update the consecutive counter and last displayed IDs
        if (areTargetSetsIdentical(currentDisplayedTargetIDs, lastDisplayedTargetIDs)) {
            consecutiveSameTargetsCount++;
            if (consecutiveSameTargetsCount >= 3) {
                 console.warn("Warning: Displaying the same Quick FF Target pair for the 3rd+ consecutive time due to limited alternative targets.");
            }
        } else {
            consecutiveSameTargetsCount = 1; // New pair, reset count
        }
        lastDisplayedTargetIDs = currentDisplayedTargetIDs; // Store the currently displayed pair for next check

        // console.log("Final selected target IDs for this display:", finalSelectedTargets.map(t => t.playerID)); // Debugging
        // console.log("Consecutive same targets count:", consecutiveSameTargetsCount); // Debugging

        // --- End of logic to prevent same targets showing too many times ---


        // Prepare a new content container to build the new display, then replace the old one.
        const newTargetsHtmlContainer = document.createElement('div');
        let newTargetsHtml = '';

        // Emoji selection logic to ensure unique emojis for targets displayed in this batch
        let currentEmojisUsedForBatch = new Set();
        let emojiCycleIndex = lastEmojiIndex;

        // Display the final selected targets (which may be fewer than MAX_TARGETS_TO_DISPLAY if availableTargets.length is small)
        for (let i = 0; i < finalSelectedTargets.length; i++) {
            const target = finalSelectedTargets[i]; // Use finalSelectedTargets here
            const attackUrl = `https://www.torn.com/loader.php?sid=attack&user2ID=${target.playerID}`;
            const targetName = target.playerName || `Target ${i + 1}`; // Fallback name

            // Pick a unique emoji for this target from the global set
            let selectedEmoji = '';
            do {
                emojiCycleIndex = (emojiCycleIndex + 1) % TARGET_EMOJIS.length;
                selectedEmoji = TARGET_EMOJIS[emojiCycleIndex];
            } while (currentEmojisUsedForBatch.has(selectedEmoji)); // Keep cycling until unique emoji is found

            currentEmojisUsedForBatch.add(selectedEmoji); // Mark this emoji as used for this batch
            lastEmojiIndex = emojiCycleIndex; // Update the global index for the next call of this function

            newTargetsHtml += `
                <a href="${attackUrl}" target="_blank"
                    class="quick-ff-target-btn"
                    title="${targetName} (ID: ${target.playerID}) - Fair Fight: ${target.fairFightScore} (${get_difficulty_text(parseFloat(target.fairFightScore))})">
                    <span class="emoji-wrapper">${selectedEmoji}</span> ${targetName} <span class="emoji-wrapper">${selectedEmoji}</span>
                </a>
            `;
        }

        // Only update the actual DOM element after the new content is fully prepared
        quickFFTargetsDisplay.innerHTML = newTargetsHtml;

    } catch (error) {
        console.error("Failed to fetch or display Quick FF Targets:", error);
        // If an unexpected error occurs, keep the previous content or show a generic error
        if (quickFFTargetsDisplay.innerHTML.includes('Loading targets...') || quickFFTargetsDisplay.innerHTML === '') {
             quickFFTargetsDisplay.innerHTML = `<span style="color: #ff4d4d;">Failed to load targets.</span>`;
        }
    }
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

            if (targetTabDataset === 'friendly-status') {
                const user = firebase.auth().currentUser;
                if (user && userApiKey) {
                    await updateFriendlyMembersTable(userApiKey, user.uid);
                } else {
                    console.warn("User not logged in or API Key missing. Cannot update friendly members table.");
                    const tbody = document.getElementById('friendly-members-tbody');
                    if (tbody) {
                        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding: 20px; color: yellow;">Please log in and ensure API Key is available to view faction members.</td></tr>';
                    }
                }
            }
        });
    });
    showTab('announcements-tab'); // Sets initial tab to announcements
    let listenersInitialized = false;

    // Chat Tab Functionality Elements and Handler (unchanged, for completeness)
    const chatTabsContainer = document.querySelector('.chat-tabs-container');
    const chatTabs = document.querySelectorAll('.chat-tab');
    const warChatBox = document.getElementById('warChatBox');
    const chatDisplayArea = document.getElementById('chat-display-area');
    const chatInputArea = document.querySelector('.chat-input-area');

    function handleChatTabClick(event) {
        const clickedTab = event.currentTarget;
        const targetTab = clickedTab.dataset.chatTab;

        console.log(`[Chat Tab Debug] Clicked tab: ${targetTab}`);

        chatTabButtons.forEach(button => {
            button.classList.remove('active');
        });
        clickedTab.classList.add('active');

        if (chatDisplayArea) {
            chatDisplayArea.innerHTML = '';
        } else {
            console.error("HTML Error: chatDisplayArea (the main content display for tabs) not found.");
            return;
        }

        if (unsubscribeFromChat) {
            unsubscribeFromChat();
            unsubscribeFromChat = null;
            console.log("Unsubscribed from previous chat listener (tab switch).");
        }

        let showInputArea = true;

        switch (targetTab) {
            case 'faction-chat':
                chatDisplayArea.innerHTML = '<p>Loading Faction Chat messages...</p>';
                setupChatRealtimeListener();
                break;

            case 'war-chat':
                chatDisplayArea.innerHTML = `
                    <p>Welcome to War Chat!</p>
                    <p>Functionality not implemented yet for this dynamic tab.</p>
                `;
                break;

            case 'private-chat':
                chatDisplayArea.innerHTML = `
                    <p>Welcome to Private Chat!</p>
                    <p>Functionality not implemented yet for this dynamic tab.</p>
                `;
                break;

            case 'faction-members':
                chatDisplayArea.innerHTML = `<h3>Faction Members</h3><p>Loading faction member data...</p>`;
                if (factionApiFullData && factionApiFullData.members) {
                    displayFactionMembersInChatTab(factionApiFullData.members, chatDisplayArea);
                }
                showInputArea = false;
                break;

            case 'recently-met':
                populateRecentlyMetTab(chatDisplayArea);
                showInputArea = false;
                break;

            case 'blocked-people':
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
                const dynamicFriendsScrollableList = document.getElementById('friendsScrollableList');
                const dynamicIgnoresScrollableList = document.getElementById('ignoresScrollableList');
                populateBlockedPeopleTab(dynamicFriendsScrollableList, dynamicIgnoresScrollableList);

                showInputArea = false;
                break;

            case 'settings':
                populateSettingsTab(chatDisplayArea);
                showInputArea = false;
                break;

            default:
                console.warn(`Unknown chat tab: ${targetTab}`);
                chatDisplayArea.innerHTML = `<p style="color: red;">Error: Unknown chat tab selected.</p>`;
                showInputArea = false;
                break;
        }

        if (showInputArea) {
            if (chatInputArea) chatInputArea.style.display = 'flex';
        } else {
            if (chatInputArea) chatInputArea.style.display = 'none';
        }

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
                userApiKey = apiKey;

                await initializeAndLoadData(apiKey, userData.faction_id); // Populates factionApiFullData
                

                // Ensure global DOM references are assigned after HTML injection
                userEnergyDisplay = document.getElementById('userEnergyDisplay');
                onlineFriendlyMembersDisplay = document.getElementById('onlineFriendlyMembersDisplay');
                onlineEnemyMembersDisplay = document.getElementById('onlineEnemyMembersDisplay');

                // Initial calls for all dynamic ops panel displays
                // These functions run immediately upon successful authentication and API key availability.
                updateUserEnergyDisplay();
                updateOnlineMemberCounts();
                fetchAndDisplayChainData();
                displayQuickFFTargets(userApiKey, playerId);
                setupChatRealtimeListener();

                // This ensures listeners and intervals are only set up ONCE.
                if (!listenersInitialized) {
                    setupEventListeners(apiKey);
                    setupMemberClickEvents(); // <--- **THIS LINE IS NOW CORRECTLY PLACED**

                    chatTabs.forEach(tab => {
                        tab.addEventListener('click', handleChatTabClick);
                    });

                    const initialActiveChatTab = document.querySelector('.chat-tab.active');
                    if (initialActiveChatTab) {
                        handleChatTabClick({ currentTarget: initialActiveChatTab });
                    }

                    listenersInitialized = true; // Set this flag to true after setup

                    // Recurring intervals (these will run periodically after initial setup)
                    setInterval(updateAllTimers, 1000); // Every 1 second
                    
                    setInterval(() => {
                        if (userApiKey && globalEnemyFactionID) {
                            fetchAndDisplayEnemyFaction(globalEnemyFactionID, userApiKey);
                        } else {
                            console.warn("API key or enemy faction ID not available for periodic enemy data refresh.");
                        }
                    }, 1500); // Every 1.5 seconds
					
                    setInterval(() => {
                        if(userApiKey && globalYourFactionID) {
                            updateDualChainTimers(userApiKey, globalYourFactionID, globalEnemyFactionID);
                        }
                    }, 2000); // Every 2 seconds

                    setInterval(() => {
                        if (userApiKey && globalYourFactionID) {
                            initializeAndLoadData(userApiKey, globalYourFactionID);
                        } else {
                            console.warn("API key or faction ID not available for periodic comprehensive faction data refresh.");
                        }
                    }, 300000); // Every 5 minutes

                    setInterval(() => {
                        if (userApiKey) {
                            updateUserEnergyDisplay();
                            updateOnlineMemberCounts();
                        } else {
                            console.warn("API key not available for periodic user energy/online member refresh.");
                        }
                    }, 60000); // Every 1 minute

                } // End of if (!listenersInitialized)
            } else {
                console.warn("API key or Player ID not found.");
                const factionWarHubTitleEl = document.getElementById('factionWarHubTitle');
                if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = "Faction War Hub. (API Key & Player ID Needed)";
                const quickFFTargetsDisplay = document.getElementById('quickFFTargetsDisplay');
                if (quickFFTargetsDisplay) {
                    quickFFTargetsDisplay.innerHTML = '<span style="color: #ff4d4d;">Login & API/ID needed.</span>';
                }
                // Ensure all dynamic ops panel displays are N/A if API key/player ID is missing
                if (userEnergyDisplay) userEnergyDisplay.textContent = 'N/A';
                if (onlineFriendlyMembersDisplay) onlineFriendlyMembersDisplay.textContent = 'N/A';
                if (onlineEnemyMembersDisplay) onlineEnemyMembersDisplay.textContent = 'N/A';
            }
        } else {
            userApiKey = null;
            listenersInitialized = false;
            console.log("User not logged in.");
            const factionWarHubTitleEl = document.getElementById('factionWarHubTitle');
            if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = "Faction War Hub. (Please Login)";
            // Ensure all dynamic ops panel displays are N/A if user not logged in
            if (userEnergyDisplay) userEnergyDisplay.textContent = 'N/A';
            if (onlineFriendlyMembersDisplay) onlineFriendlyMembersDisplay.textContent = 'N/A';
            if (onlineEnemyMembersDisplay) onlineEnemyMembersDisplay.textContent = 'N/A';
        }
    });
});