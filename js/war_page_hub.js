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
let globalWarStartedActualTime = 0; // Stores the war start timestamp for live relative update
let unsubscribeFromChat = null;
let profileFetchQueue = []; // Queue for processing profile image fetches
let isProcessingQueue = false; // Flag to indicate if the queue is currently being processed
let lastEmojiIndex = -1; // To keep track of the last emoji used for Quick FF Targets
let lastDisplayedTargetIDs = []; // Stores IDs of the targets shown in the previous display (e.g., ['123', '456'])
let consecutiveSameTargetsCount = 0; // Counts how many times 'lastDisplayedTargetIDs' has been displayed consecutively


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

// --- CHAT-RELATED DOM ELEMENT GETTERS (synced to your current HTML) ---
const warChatBox = document.getElementById('warChatBox');
const chatTabsContainer = document.querySelector('.chat-tabs-container');
const chatTabButtons = document.querySelectorAll('.chat-tab');
const chatInputArea = document.querySelector('.chat-input-area');
const chatDisplayArea = document.getElementById('chat-display-area'); // This is the *single* main display area for dynamic content

// Array of emojis for Quick FF Targets (to avoid duplicate function definitions)
const TARGET_EMOJIS = ['🎯', '❌', '📍', '☠️', '⚔️', '⚠️', '⛔', '🚩', '💢', '💥'];


// --- Utility Functions ---

function countFactionMembers(membersObject) {
    if (!membersObject) return 0;
    return typeof membersObject.total === 'number' ? membersObject.total : Object.keys(membersObject).length;
}

async function processProfileFetchQueue() {
    if (isProcessingQueue || profileFetchQueue.length === 0) {
        return;
    }

    isProcessingQueue = true;
    while (profileFetchQueue.length > 0) {
        const { memberId, apiKey, itemElement } = profileFetchQueue.shift();

        if (memberProfileCache[memberId] && memberProfileCache[memberId].profile_image) {
            console.log(`[Cache Hit] Profile for ${memberId} already in cache.`);
            updateMemberItemDisplay(itemElement, memberProfileCache[memberId].profile_image);
            continue;
        }

        try {
            const apiUrl = `https://api.torn.com/user/${memberId}?selections=profile&key=${apiKey}&comment=MyTornPA_MemberProfilePic`;
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (!response.ok || data.error) {
                console.error(`Error fetching profile for member ${memberId}:`, data.error?.error || response.statusText);
                updateMemberItemDisplay(itemElement, '../../images/default_profile_icon.png');
            } else {
                const profileImage = data.profile_image || '../../images/default_profile_icon.png';
                memberProfileCache[memberId] = { profile_image: profileImage, name: data.name };
                updateMemberItemDisplay(itemElement, profileImage);
            }
        } catch (error) {
            console.error(`Network error fetching profile for member ${memberId}:`, error);
            updateMemberItemDisplay(itemElement, '../../images/default_profile_icon.png');
        }

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

// Helper function to generate dummy friend data for Blocked People tab
function generateDummyFriends(count) {
    const dummyFriends = [];
    for (let i = 1; i <= count; i++) {
        dummyFriends.push({
            id: `friend_${i}`,
            name: `Test Friend ${i}`,
            profile_image: `../../images/default_profile_icon.png`
        });
    }
    return dummyFriends;
}

// Helper function to generate dummy ignore data for Blocked People tab
function generateDummyIgnores(count) {
    const dummyIgnores = [];
    for (let i = 1; i <= count; i++) {
        if (i % 2 === 0) {
            dummyIgnores.push({
                type: 'faction',
                id: `faction_${i}`,
                name: `Blocked Faction ${i}`,
                icon: '🏢'
            });
        } else {
            dummyIgnores.push({
                type: 'user',
                id: `user_${i}`,
                name: `Blocked User ${i}`,
                profile_image: `../../images/default_profile_icon.png`
            });
        }
    }
    return dummyIgnores;
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

// Helper function to check if two arrays of target IDs are identical (order-agnostic)
function areTargetSetsIdentical(set1, set2) {
    if (set1.length !== set2.length) {
        return false;
    }
    if (set1.length === 0) {
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

    const now = Math.floor(Date.now() / 1000);
    const diffSeconds = now - timestampInSeconds;

    if (diffSeconds < 60) {
        return "Now";
    } else if (diffSeconds < 3600) {
        const minutes = Math.floor(diffSeconds / 60);
        return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
    } else if (diffSeconds < 86400) {
        const hours = Math.floor(diffSeconds / 3600);
        return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else {
        const days = Math.floor(diffSeconds / 86400);
        return `${days} day${days === 1 ? '' : 's'} ago`;
    }
}

// Helper function to format time from timestamp
function formatTornTime(timestamp) {
    const date = new Date(timestamp * 1000);
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
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

        const isAdminChecked = (savedAdmins && savedAdmins.includes(memberId)) ? 'checked' : '';
        const adminItemHtml = `<div class="member-selection-item"><input type="checkbox" id="admin-member-${memberId}" value="${memberId}" ${isAdminChecked}><label for="admin-member-${memberId}">${memberName}</label></div>`;
        designatedAdminsContainer.insertAdjacentHTML('beforeend', adminItemHtml);

        const isEnergyChecked = (savedEnergyMembers && savedEnergyMembers.includes(memberId)) ? 'checked' : '';
        const energyItemHtml = `<div class="member-selection-item"><input type="checkbox" id="energy-member-${memberId}" value="${memberId}" ${isEnergyChecked}><label for="energy-member-${memberId}">${memberName}</label></div>`;
        energyTrackingContainer.insertAdjacentHTML('beforeend', energyItemHtml);
    });
}

// NEW FUNCTION: Populates the content of the Settings tab
// Now accepts the target display element as an argument
async function populateSettingsTab(targetDisplayElement) {
    console.log("[Settings Tab] Populating tab with detailed layout...");

    if (!targetDisplayElement) {
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

    // TODO: Add logic here to load and save user settings (e.g., from Firebase)
    // For example: loadUserSettings();
    // For example: document.getElementById('saveSettingsBtn').addEventListener('click', saveUserSettings);
}

// Populates the content of the Blocked People tab with dummy data
// It now receives the target elements dynamically
async function populateBlockedPeopleTab(friendsListEl, ignoresListEl) {
    console.log("[Blocked People Tab] Populating tab with dummy data...");

    // Generate 50 dummy friend entries and 50 dummy ignore entries
    const dummyFriends = generateDummyFriends(50);
    const dummyIgnores = generateDummyIgnores(50);

    // Render dummy friend data into the Friends list container
    if (friendsListEl) {
        let friendsHtml = '';
        dummyFriends.forEach(friend => {
            friendsHtml += `
                <div class="list-item friend-entry">
                    <img src="${friend.profile_image}" alt="Profile Pic" class="profile-pic">
                    <span class="item-name">${friend.name}</span>
                    <button class="item-button letter-button">✉️</button>
                    <button class="item-button trash-button">🗑️</button>
                </div>
            `;
        });
        friendsListEl.innerHTML = friendsHtml;
    } else {
        console.error("HTML Error: friendsScrollableList not found for populating dummy friends.");
    }

    // Render dummy ignore data into the Ignores list container
    if (ignoresListEl) {
        let ignoresHtml = '';
        dummyIgnores.forEach(ignore => {
            // Display ID from dummy data for demonstration
            const displayId = ignore.id.split('_')[1]; // Extracts the number from "user_1" or "faction_1"

            if (ignore.type === 'user') {
                ignoresHtml += `
                    <div class="list-item ignore-entry">
                        <img src="${ignore.profile_image}" alt="Profile Pic" class="profile-pic">
                        <span class="item-name">${ignore.name} [${displayId}]</span>
                        <button class="item-button trash-button">🗑️</button>
                    </div>
                `;
            } else { // type === 'faction'
                ignoresHtml += `
                    <div class="list-item ignore-entry">
                        <span class="item-icon faction-icon">${ignore.icon}</span>
                        <span class="item-name">${ignore.name} [${displayId}]</span>
                        <button class="item-button trash-button">🗑️</button>
                    </div>
                `;
            }
        });
        ignoresListEl.innerHTML = ignoresHtml;
    } else {
        console.error("HTML Error: ignoresScrollableList not found for populating dummy ignores.");
    }

    // TODO: In a real scenario, you'd add event listeners here for the dynamically created buttons (letter, trash)
    // using event delegation on friendsListEl and ignoresListEl.
}

// Function: displayQuickFFTargets
// Desc: Fetches and displays quick fair fight targets, adding alternating emojis
//       with individual borders. Prevents "blinking" by only updating the
//       display after a successful fetch.
//       Also prevents showing the same target pair more than two times in a row.
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
            // Call the populateRecentlyMetTab function, passing the main dynamic display area
            populateRecentlyMetTab(chatDisplayArea); // <--- CHANGE IS HERE: Passing chatDisplayArea
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
            
            // Re-get elements after they are injected into the DOM
            // These dynamic elements exist *within* the chatDisplayArea content.
            const dynamicFriendsScrollableList = document.getElementById('friendsScrollableList');
            const dynamicIgnoresScrollableList = document.getElementById('ignoresScrollableList');
            // Call your populate function, passing dynamically found elements
            populateBlockedPeopleTab(dynamicFriendsScrollableList, dynamicIgnoresScrollableList);

            showInputArea = false; // Hide input for non-chat tabs
            break; 

        case 'settings':
            populateSettingsTab(chatDisplayArea); // Passing chatDisplayArea to populateSettingsTab
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
            console.log("Auth State Changed: User is logged in.");
            const userProfileRef = db.collection('userProfiles').doc(user.uid);
            let userData = {};
            try {
                const doc = await userProfileRef.get();
                userData = doc.exists ? doc.data() : {};
                console.log("Firebase User Data (from userProfiles):", userData);
            } catch (fbError) {
                console.error("Error fetching user profile from Firebase:", fbError);
            }

            // --- TEMPORARY HARDCODE FOR DEBUGGING ONLY ---
            // !!! IMPORTANT: REMOVE THESE LINES AND USE `userData.tornApiKey` etc. IN PRODUCTION !!!
            const DEBUG_API_KEY = "tuFkU0vE2HYpO6XT"; // Forced API Key
            const DEBUG_FACTION_ID = "49028";        // Forced Faction ID
            const DEBUG_PLAYER_ID = "2662550";       // Forced Player ID
            // --- END TEMPORARY HARDCODE ---

            // These lines will prioritize the DEBUG_ values if userData fields are empty or null
            const apiKey = userData.tornApiKey || DEBUG_API_KEY;
            const playerId = userData.tornProfileId || DEBUG_PLAYER_ID;
            currentTornUserName = userData.preferredName || 'Unknown'; // Keep using Firebase preferredName or default

            console.log("Determined API Key for use:", apiKey ? "Present" : "MISSING!");
            console.log("Determined Player ID for use:", playerId ? "Present" : "MISSING!");

            let warData = {};
            try {
                const warDoc = await db.collection('factionWars').doc('currentWar').get();
                warData = warDoc.exists ? warDoc.data() : {};
            } catch (firebaseError) {
                console.error("Error fetching warData from Firebase (Firebase data might be missing):", firebaseError);
            }

            console.log("Firebase Auth User (from auth.currentUser):", firebase.auth().currentUser);

            if (apiKey && playerId) {
                userApiKey = apiKey; // Assign to global userApiKey for other functions

                console.log("Entering API call block: Calling initializeAndLoadData...");
                // Pass the determined Faction ID to initializeAndLoadData
                await initializeAndLoadData(apiKey, DEBUG_FACTION_ID);

                // These logs now reflect the API v1 structure
                console.log("AFTER initializeAndLoadData - Global factionApiFullData:", factionApiFullData);
                console.log("AFTER initializeAndLoadData - factionApiFullData.ID (top-level Faction ID):", factionApiFullData?.ID);
                console.log("AFTER initializeAndLoadData - Is factionApiFullData.ranked_wars defined?", !!factionApiFullData?.ranked_wars);


                populateUiComponents(warData, apiKey); // This also uses factionApiFullData

                fetchAndDisplayChainData();
                // Call fetchAndDisplayRankedWarScores after initializeAndLoadData completes and populates factionApiFullData
                fetchAndDisplayRankedWarScores();
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

                    // Adjust these intervals later for performance if needed
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
                            initializeAndLoadData(userApiKey, DEBUG_FACTION_ID); // Pass DEBUG_FACTION_ID here too for periodic refresh
                        } else {
                            console.warn("API key not available for periodic comprehensive faction data refresh.");
                        }
                    }, 2000); // This is very frequent. Change to 60000 (1 minute) or more for production.
            }
        } else {
            console.warn("CRITICAL: API key or Player ID not found. Cannot proceed with Torn API calls.");
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
        console.log("Auth State Changed: User is NOT logged in.");
        const factionWarHubTitleEl = document.getElementById('factionWarHubTitle');
        if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = "Faction War Hub. (Please Login)";
   
   }
});

});