// ==========================================================================================
// GLOBAL JAVASCRIPT FILE - global.js
// This file contains global variables, Firebase initialization, DOM element references,
// and core functions ONLY related to the chat system, as explicitly requested.
// ==========================================================================================

// --- CORE FIREBASE INITIALIZATION (MUST BE GLOBAL) ---
// These are essential for any Firebase interaction, including chat.
const db = firebase.firestore();
const auth = firebase.auth();

// --- GLOBAL VARIABLES SPECIFIC TO CHAT SYSTEM ---
// These are declared globally so all chat functions can access them.
let currentTornUserName = 'Unknown'; // User's display name for chat
let chatMessagesCollection = null; // Dynamically set for faction chat
let unsubscribeFromChat = null; // Listener unsubscribe for faction/war chat
let unsubscribeFromPrivateChat = null; // Listener unsubscribe for private chat
let currentSelectedPrivateChatId = null; // Stores the ID of the currently open private chat
let chatSettings = {}; // Stores user-specific chat display settings (font, theme, etc.)

// --- GLOBAL DOM ELEMENT REFERENCES FOR CHAT SYSTEM ---
// These are declared globally and will be assigned values AFTER 'globalchat.html' is loaded.
let tornpaChatSystem = null;
let chatBarCollapsed = null;
let chatWindow = null;
let openFactionChatIcon = null;
let openWarChatIcon = null;
let openFriendsIcon = null;
let openNotificationsIcon = null;
let openSettingsIcon = null;
let chatMainTabsContainer = null;
let chatTabButtons = null; // NodeList of main chat tab buttons
let chatPanels = null; // NodeList of all chat panel divs
let factionChatPanel = null;
let warChatPanel = null;
let friendsPanel = null;
let notificationsPanel = null;
let settingsPanel = null;
let minimizeChatBtns = null; // NodeList of minimize buttons
let friendsSubTabButtons = null; // NodeList of friends sub-tab buttons
let friendsPanelContent = null; // Content area for friends sub-tabs

// Elements that are dynamically created/re-created within the friendsPanelContent for private chat
// These are assigned within `handleFriendsSubTabClick` and `initPrivateChatTabEventListeners`.
let recentChatsList = null;
let selectedChatHeader = null;
let selectedChatDisplay = null;
let privateChatMessageInput = null;
let sendPrivateMessageBtn = null;

// Settings Panel DOM Elements (they are within `settingsPanel`, but their references need to be global too)
// These will be assigned after globalchat.html is loaded in initializeGlobals.
let settingsToggleWarChat = null;
let settingsProfanityFilter = null; // Global one, for settings UI
let settingsMuteSiteSounds = null;
let settingsMuteWarSounds = null;
let settingsAppearOnlineOffline = null;
let settingsUserStatusDisplayRadios = null; // NodeList
let settingsFontSizeRadios = null; // NodeList
let settingsChatThemeRadios = null; // NodeList
let settingsMessageDensityRadios = null; // NodeList
let settingsInputSizeRadios = null; // NodeList
let settingsShowTimestamps = null;
let settingsAutoScrollChat = null;
let settingsProfanityFilterLocal = null; // Local one for settings UI
let settingsNotificationMethodRadios = null; // NodeList
let clearChatHistoryButton = null;
let saveAllSettingsButton = null;
let closeAllPrivateChatsBtn = null;
let deleteAllPrivateMessagesBtn = null;


// --- CONSTANTS (ONLY CHAT-RELATED) ---
const MAX_MESSAGES_VISIBLE = 7; // For chat display area messages
const REMOVAL_DELAY_MS = 500;
const DEFAULT_PROFILE_ICONS = [ // For displaying user avatars
    '../../images/account.png', '../../images/boy.png', '../../images/business-man.png',
    '../../images/user.png', '../../images/profile.png' // Simplified for brevity
];
const memberProfileCache = {}; // Cache for profile images

// ==========================================================================================
// CORE INITIALIZATION FUNCTION
// This function runs when global.js is loaded. It loads the chat HTML and then
// initializes all chat-specific DOM element references and event listeners.
// ==========================================================================================
function initializeGlobals() {
    console.log("initializeGlobals: Script loaded, starting chat system setup...");

    // 1. Load the Chat System HTML into its placeholder
    // This is crucial because all chat DOM element references depend on this HTML being present.
    fetch('globalchat.html')
        .then(response => response.text())
        .then(data => {
            const chatPlaceholder = document.getElementById('chat-system-placeholder');
            if (chatPlaceholder) {
                chatPlaceholder.innerHTML = data;
                console.log("initializeGlobals: Chat system HTML loaded into placeholder.");

                // --- Assign GLOBAL DOM Element References AFTER HTML is in the DOM ---
                // These must be reassigned here each time globalchat.html is loaded,
                // as fetch replaces the innerHTML.
                tornpaChatSystem = document.getElementById('tornpa-chat-system');
                chatBarCollapsed = document.getElementById('chat-bar-collapsed');
                chatWindow = document.getElementById('chat-window');
                openFactionChatIcon = document.getElementById('open-faction-chat-icon');
                openWarChatIcon = document.getElementById('open-war-chat-icon');
                openFriendsIcon = document.getElementById('open-friends-icon');
                openNotificationsIcon = document.getElementById('open-notifications-icon');
                openSettingsIcon = document.getElementById('open-settings-icon');
                chatMainTabsContainer = document.querySelector('.chat-main-tabs-container');
                chatTabButtons = document.querySelectorAll('.chat-main-tabs-container .chat-tab');
                chatPanels = document.querySelectorAll('.chat-panel');
                factionChatPanel = document.getElementById('faction-chat-panel');
                warChatPanel = document.getElementById('war-chat-panel');
                friendsPanel = document.getElementById('friends-panel');
                notificationsPanel = document.getElementById('notifications-panel');
                settingsPanel = document.getElementById('settings-panel');
                minimizeChatBtns = document.querySelectorAll('.minimize-chat-btn');
                friendsSubTabButtons = document.querySelectorAll('.friends-panel-subtabs .sub-tab-button');
                friendsPanelContent = document.querySelector('.friends-panel-content');

                // Assign Settings Panel DOM Elements
                settingsToggleWarChat = document.getElementById('toggleWarChat');
                settingsProfanityFilter = document.getElementById('profanityFilter');
                settingsMuteSiteSounds = document.getElementById('muteSiteSounds');
                settingsMuteWarSounds = document.getElementById('muteWarSounds');
                settingsAppearOnlineOffline = document.getElementById('appearOnlineOffline');
                settingsUserStatusDisplayRadios = document.querySelectorAll('input[name="userStatusDisplay"]');
                settingsFontSizeRadios = document.querySelectorAll('input[name="fontSize"]');
                settingsChatThemeRadios = document.querySelectorAll('input[name="chatTheme"]');
                settingsMessageDensityRadios = document.querySelectorAll('input[name="messageDensity"]');
                settingsInputSizeRadios = document.querySelectorAll('input[name="inputSize"]');
                settingsShowTimestamps = document.getElementById('showTimestamps');
                settingsAutoScrollChat = document.getElementById('autoScrollChat');
                settingsProfanityFilterLocal = document.getElementById('profanityFilterLocal');
                settingsNotificationMethodRadios = document.querySelectorAll('input[name="notificationMethod"]');
                clearChatHistoryButton = document.getElementById('clearChatHistoryLocal');
                saveAllSettingsButton = document.getElementById('saveAllSettings');
                closeAllPrivateChatsBtn = document.getElementById('closeAllPrivateChats');
                deleteAllPrivateMessagesBtn = document.getElementById('deleteAllPrivateMessages');

                console.log("initializeGlobals: Chat system DOM elements now successfully referenced.");

                // Now that all chat HTML and its elements are available, set up listeners.
                setupChatEventListeners(); // Call the specific chat event listener setup function.
            } else {
                console.error("initializeGlobals: Could not find 'chat-system-placeholder' to load chat HTML.");
            }
        })
        .catch(error => console.error('initializeGlobals: Error loading global chat HTML:', error));

    // The Authentication Listener will now be attached once the DOM is ready,
    // and will manage user-specific data fetching (like faction ID for chat).
}

// ==========================================================================================
// CHAT SYSTEM CORE FUNCTIONS
// These are the main functions that drive the chat's behavior.
// ==========================================================================================

// MODIFIED: handleChatTabClick to manage new chat-panel structure
function handleChatTabClick(event) {
    const clickedTabButton = event.currentTarget;
    const targetPanelId = clickedTabButton.dataset.tabTarget; // e.g., 'faction-chat-panel'

    console.log(`[Chat Tab Debug] Clicked main chat tab: ${targetPanelId}`);

    // Remove 'active' from all main chat tab buttons and panels
    if (chatTabButtons) chatTabButtons.forEach(button => button.classList.remove('active'));
    if (chatPanels) chatPanels.forEach(panel => panel.classList.remove('active'));
    if (chatPanels) chatPanels.forEach(panel => panel.classList.add('hidden'));

    // Add 'active' to the clicked tab button and show its corresponding panel
    const targetPanel = document.getElementById(targetPanelId);
    if (targetPanel) {
        clickedTabButton.classList.add('active');
        targetPanel.classList.remove('hidden');
        targetPanel.classList.add('active');
    } else {
        console.error(`HTML Error: Chat panel with ID '${targetPanelId}' not found.`);
        return;
    }

    // Unsubscribe from any active real-time chat listener
    if (unsubscribeFromChat) {
        unsubscribeFromChat();
        unsubscribeFromChat = null;
        console.log("Unsubscribed from previous faction/war chat listener (main tab switch).");
    }
    if (unsubscribeFromPrivateChat) {
        unsubscribeFromPrivateChat();
        unsubscribeFromPrivateChat = null;
        console.log("Unsubscribed from previous private chat listener (main tab switch).");
    }

    // Configure specific panels based on the selected tab
    switch (targetPanelId) {
        case 'faction-chat-panel':
            const factionChatDisplayArea = targetPanel.querySelector('.chat-messages-scroll-wrapper');
            if (factionChatDisplayArea) { factionChatDisplayArea.innerHTML = '<p>Loading Faction Chat messages...</p>'; }
            setupChatRealtimeListener('faction'); // Initialize faction chat listener
            break;

        case 'war-chat-panel':
            const warChatDisplayArea = targetPanel.querySelector('.chat-messages-scroll-wrapper');
            if (warChatDisplayArea) { warChatDisplayArea.innerHTML = `<p>Welcome to War Chat!</p><p>Functionality not implemented yet.</p>`; }
            setupChatRealtimeListener('war'); // Initialize war chat listener
            break;

        case 'friends-panel':
            if (friendsPanelContent) { friendsPanelContent.innerHTML = '<p style="text-align: center; color: #888; padding-top: 20px;">Loading friends content...</p>'; }
            const defaultFriendsSubTabButton = document.querySelector('.friends-panel-subtabs .sub-tab-button[data-subtab="recent-chats"]');
            if (defaultFriendsSubTabButton) {
                handleFriendsSubTabClick({ currentTarget: defaultFriendsSubTabButton });
            } else {
                 console.error("Default 'Recent Chats' sub-tab button not found.");
            }
            break;

        case 'notifications-panel':
            const notificationsContentWrapper = targetPanel.querySelector('.notifications-content-wrapper');
            if (notificationsContentWrapper) {
                notificationsContentWrapper.innerHTML = `
                    <div class="notification-section site-notifications"><h4>Site Notifications 🌐</h4><div class="notification-list" id="site-notification-list"><p>No new site notifications.</p></div></div>
                    <div class="notification-section friend-notifications"><h4>Friend Notifications 👥</h4><div class="notification-list" id="friend-notification-list"><p>No new friend notifications.</p></div></div>
                    <div class="notification-section general-notifications"><h4>Other Notifications 🔔</h4><div class="notification-list" id="general-notification-list"><p>No other notifications.</p></div></div>
                `;
            }
            break;

        case 'settings-panel':
            setupSettingsPanel(); // Load and apply settings
            break;

        default:
            console.warn(`Unknown chat panel: ${targetPanelId}`);
            if (targetPanel) targetPanel.innerHTML = `<p style="color: red;">Error: Unknown chat panel selected.</p>`;
            break;
    }
}

// NEW FUNCTION: Handles clicks on sub-tabs within the Friends panel
async function handleFriendsSubTabClick(event) {
    const clickedSubTabButton = event.currentTarget;
    const targetSubTab = clickedSubTabButton.dataset.subtab;

    console.log(`[Friends Sub-tab Debug] Clicked sub-tab: ${targetSubTab}`);

    if (friendsSubTabButtons) friendsSubTabButtons.forEach(button => { button.classList.remove('active'); });
    clickedSubTabButton.classList.add('active');

    if (friendsPanelContent) { friendsPanelContent.innerHTML = ''; } else { console.error("HTML Error: friendsPanelContent not found."); return; }
    if (unsubscribeFromPrivateChat) { unsubscribeFromPrivateChat(); unsubscribeFromPrivateChat = null; console.log("Unsubscribed from previous private chat listener (sub-tab switch)."); }

    switch (targetSubTab) {
        case 'recent-chats':
            friendsPanelContent.innerHTML = `
                <div id="privateChatFullLayout" class="private-chat-tab-content">
                    <div class="private-chat-layout-panels">
                        <div class="recent-chats-panel">
                            <div class="panel-header">Recent Chats</div>
                            <div class="recent-chats-list-scroll-wrapper">
                                <ul id="recentChatsList" class="recent-chats-list"><li class="chat-item loading-message">Loading recent chats...</li></ul>
                            </div>
                        </div>
                        <div class="selected-chat-panel">
                            <div id="selectedChatHeader" class="panel-header">Select a Chat</div>
                            <div class="selected-chat-messages-scroll-wrapper">
                                <div id="selectedChatDisplay" class="chat-display-area"><p class="message-placeholder">Click a chat on the left to start messaging.</p></div>
                            </div>
                            <div class="selected-chat-input-area">
                                <input type="text" id="privateChatMessageInput" class="chat-text-input" placeholder="Type your private message...">
                                <button id="sendPrivateMessageBtn" class="chat-send-btn">Send</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            // Re-assign global DOM elements for private chat after they are injected
            recentChatsList = friendsPanelContent.querySelector('#recentChatsList');
            selectedChatHeader = friendsPanelContent.querySelector('#selectedChatHeader');
            selectedChatDisplay = friendsPanelContent.querySelector('#selectedChatDisplay');
            privateChatMessageInput = friendsPanelContent.querySelector('#privateChatMessageInput');
            sendPrivateMessageBtn = friendsPanelContent.querySelector('#sendPrivateMessageBtn');
            setTimeout(() => { initPrivateChatTabEventListeners(); }, 0);
            break;

        case 'recently-met':
            // Need a userApiKey for this. Assume it's available or provided by main app.
            if (userApiKey) { populateRecentlyMetTab(friendsPanelContent); }
            else { friendsPanelContent.innerHTML = '<p style="text-align:center; padding: 20px; color: yellow;">API Key needed to view recently met players.</p>'; }
            break;

        case 'faction-members':
            if (factionApiFullData && factionApiFullData.members) {
                friendsPanelContent.innerHTML = `<h3>Faction Members</h3><p>Loading faction member data...</p>`;
                displayFactionMembersInChatTab(factionApiFullData.members, friendsPanelContent);
            } else {
                 friendsPanelContent.innerHTML = '<p style="text-align:center; padding: 20px; color: yellow;">Faction data not loaded. Please log in with your API key.</p>';
            }
            break;

        case 'friend-list':
             friendsPanelContent.innerHTML = `
                <div class="friend-list-full-layout">
                    <div class="add-friend-section">
                        <input type="text" id="addFriendIdInput" placeholder="Torn Player ID">
                        <button id="addFriendBtn">Add Friend</button>
                        <p id="addFriendStatus" style="text-align: center; margin-top: 5px; font-size: 0.9em;"></p>
                    </div>
                    <div class="friend-list-table-container">
                         <table class="friendly-members-table">
                            <thead>
                                <tr>
                                    <th>Name (ID)</th><th>Last Action</th><th>Str</th><th>Dex</th>
                                    <th>Spd</th><th>Def</th><th>Total</th><th>Status</th>
                                    <th>Nerve</th><th>Energy</th><th>Drug CD</th><th>Revivable</th>
                                </tr>
                            </thead>
                            <tbody id="friends-tbody"><tr><td colspan="12" style="text-align:center; padding: 20px;">Loading your friends...</td></tr></tbody>
                        </table>
                    </div>
                </div>
             `;
            const newAddFriendBtn = friendsPanelContent.querySelector('#addFriendBtn');
            const newAddFriendIdInput = friendsPanelContent.querySelector('#addFriendIdInput');
            const newAddFriendStatus = friendsPanelContent.querySelector('#addFriendStatus');

            if (newAddFriendBtn) {
                newAddFriendBtn.addEventListener('click', async () => {
                    const friendId = newAddFriendIdInput.value.trim();
                    await addFriendLogic(friendId, newAddFriendIdInput, newAddFriendBtn, newAddFriendStatus);
                });
            }
            if (auth.currentUser) { populateFriendListTab(friendsPanelContent); }
            else { friendsPanelContent.querySelector('#friends-tbody').innerHTML = '<tr><td colspan="12" style="text-align:center; color: yellow;">Please log in to view friend stats.</td></tr>'; }
            break;

        case 'ignore-list':
            friendsPanelContent.innerHTML = `
                <div class="blocked-people-layout">
                    <div class="friends-list-section"><div class="header-box"><b>Add to Ignore List</b></div><div class="search-bar">
                        <input type="text" id="addIgnoreInput" placeholder="Add Profile/Faction ID">
                        <span class="search-icon add-ignore-icon" title="Add to Ignore">➕</span>
                    </div></div>
                    <div class="ignores-list-section"><div class="header-box"><b>Your Ignore List</b></div>
                        <div id="ignoresScrollableList" class="scrollable-list"><p style="text-align:center; padding: 10px;">Loading ignores...</p></div>
                    </div>
                </div>
            `;
            populateDummyIgnores(friendsPanelContent.querySelector('#ignoresScrollableList'));
            const addIgnoreInput = friendsPanelContent.querySelector('#addIgnoreInput');
            const addIgnoreIcon = friendsPanelContent.querySelector('.add-ignore-icon');
            if (addIgnoreIcon) {
                addIgnoreIcon.addEventListener('click', () => { alert('Add ignore functionality to be implemented!'); console.log('Attempting to add ignore:', addIgnoreInput.value); });
            }
            break;

        default:
            console.warn(`Unknown friends sub-tab: ${targetSubTab}`);
            friendsPanelContent.innerHTML = `<p style="color: red;">Error: Unknown sub-tab selected.</p>`;
            break;
    }
}

// NEW FUNCTION: Helper to encapsulate add friend logic for dynamic buttons (used by Faction Members and Recently Met)
async function addFriendLogic(friendId, inputElement, buttonElement, statusElement) {
    if (!friendId || !auth.currentUser) {
        if (statusElement) { statusElement.textContent = "Please log in and/or enter a Torn Player ID."; statusElement.style.color = 'red'; }
        return;
    }
    if (statusElement) { statusElement.textContent = "Adding friend..."; statusElement.style.color = 'white'; }
    if (buttonElement) buttonElement.disabled = true;

    try {
        const friendDocRef = db.collection('userProfiles').doc(auth.currentUser.uid).collection('friends').doc(friendId);
        const doc = await friendDocRef.get();
        if (doc.exists) {
            if (statusElement) { statusElement.textContent = "This player is already your friend."; statusElement.style.color = 'orange'; }
            return;
        }
        await friendDocRef.set({ addedAt: firebase.firestore.FieldValue.serverTimestamp() });
        if (statusElement) { statusElement.textContent = `Successfully added friend [${friendId}]!`; statusElement.style.color = 'lightgreen'; }
        if (inputElement) inputElement.value = '';

        // If the friend list tab is currently open, refresh it.
        const friendListTbodyInFriendsPanel = friendsPanelContent.querySelector('#friends-tbody');
        if (friendListTbodyInFriendsPanel && auth.currentUser) {
            populateFriendListTab(friendsPanelContent);
        }
    } catch (error) {
        console.error("Error adding friend:", error);
        if (statusElement) { statusElement.textContent = `Error adding friend: ${error.message}`; statusElement.style.color = 'red'; }
    } finally {
        if (buttonElement) buttonElement.disabled = false;
        if (statusElement) setTimeout(() => { statusElement.textContent = ''; }, 3000);
    }
}

// MODIFIED: sendClaimChatMessage (assumes chatMessagesCollection and currentTornUserName are global)
async function sendClaimChatMessage(claimerName, targetName, chainNumber, customMessage = null) {
    if (!chatMessagesCollection || !auth.currentUser) { console.warn("Cannot send claim/unclaim message: Firebase collection or user not available."); return; }
    const messageText = customMessage || `📢 ${claimerName} has claimed ${targetName} as hit #${chainNumber}!`;
    const filteredMessage = typeof filterProfanity === 'function' ? filterProfanity(messageText) : messageText;
    const messageObj = { senderId: auth.currentUser.uid, sender: "Chain Alert:", text: filteredMessage, timestamp: firebase.firestore.FieldValue.serverTimestamp(), type: 'claim_notification' };
    try {
        await chatMessagesCollection.add(messageObj);
        displayChatMessage(messageObj, factionChatPanel.querySelector('.chat-messages-scroll-wrapper').id);
    } catch (error) { console.error("Error sending claim/unclaim message to Firebase:", error); }
}

// MODIFIED: displayPrivateChatMessage (requires `displayElement` to be passed, no `friendsPanelContent` query here)
function displayPrivateChatMessage(messageObj, displayElement, isMyMessage) {
    if (!displayElement) { console.error("Error: displayElement for private chat message is null."); return; }
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', isMyMessage ? 'user-message' : 'bot-message');
    const timestamp = messageObj.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    messageElement.innerHTML = `<span class="chat-timestamp">[${timestamp}]</span> <span class="chat-sender">${messageObj.sender || 'Unknown'}:</span> <span class="chat-text">${messageObj.text || ''}</span>`;
    displayElement.appendChild(messageElement);
}

// MODIFIED: sendPrivateChatMessage (uses globally assigned private chat elements, which are assigned in handleFriendsSubTabClick)
async function sendPrivateChatMessage() {
    if (!privateChatMessageInput || !selectedChatDisplay || !auth.currentUser || !currentSelectedPrivateChatId) { console.warn("[Private Chat Send] Cannot send private message: Missing input field, logged-in user, or no private chat selected."); return; }
    const messageText = privateChatMessageInput.value.trim();
    if (messageText === '') { return; }
    const currentUserUid = auth.currentUser.uid;
    const chatDocId = currentSelectedPrivateChatId;
    const filteredMessage = typeof filterProfanity === 'function' ? filterProfanity(messageText) : messageText;
    const messageObj = { senderId: currentUserUid, sender: currentTornUserName, text: filteredMessage, timestamp: firebase.firestore.FieldValue.serverTimestamp() };
    try {
        const friendId = chatDocId.replace(`private_${currentUserUid}_`, '').replace(`private_`, '');
        const participants = [currentUserUid, friendId].sort();
        await db.collection('privateChatMessages').doc(chatDocId).set({ participants: participants, lastMessageAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
        await db.collection('privateChatMessages').doc(chatDocId).collection('messages').add(messageObj);
        privateChatMessageInput.value = ''; privateChatMessageInput.focus();
    } catch (error) { console.error("[Private Chat Send] Error sending private message to Firebase:", error); showCustomAlert("Failed to send private message. Please check the console for details.", "Send Error"); }
}

// MODIFIED: handlePrivateChatInputKeydown (uses globally assigned input)
function handlePrivateChatInputKeydown(event) {
    if (event.key === 'Enter') { event.preventDefault(); sendPrivateChatMessage(); }
}

// MODIFIED: selectPrivateChat (uses globally assigned private chat elements)
async function selectPrivateChat(friendIdTorn) {
    if (!auth.currentUser) {
        if (selectedChatHeader) selectedChatHeader.textContent = "Chat Unavailable";
        if (selectedChatDisplay) selectedChatDisplay.innerHTML = `<p class="message-placeholder" style="color: yellow;">Please log in to use private chat.</p>`;
        if (privateChatMessageInput) privateChatMessageInput.disabled = true;
        if (sendPrivateMessageBtn) sendPrivateMessageBtn.disabled = true;
        return;
    }
    const currentUserIdFirebase = auth.currentUser.uid; let friendFirebaseUid = null; let friendName = `User ID: ${friendIdTorn}`;
    try {
        const userProfilesSnapshot = await db.collection('userProfiles').where('tornProfileId', '==', friendIdTorn).limit(1).get();
        if (!userProfilesSnapshot.empty) {
            friendFirebaseUid = userProfilesSnapshot.docs[0].id;
            friendName = userProfilesSnapshot.docs[0].data().preferredName || userProfilesSnapshot.docs[0].data().name || friendName;
        } else {
            if (selectedChatHeader) selectedChatHeader.textContent = `Chat with Unknown User (${friendIdTorn})`;
            if (selectedChatDisplay) selectedChatDisplay.innerHTML = `<p class="message-placeholder" style="color: red;">Error: User with Torn ID ${friendIdTorn} is not a registered user of this app. Private chat is only available between registered users.</p>`;
            if (privateChatMessageInput) privateChatMessageInput.disabled = true; if (sendPrivateMessageBtn) sendPrivateMessageBtn.disabled = true; return;
        }
    } catch (error) {
        console.error("Error fetching friend's Firebase UID or name for private chat:", error);
        if (selectedChatHeader) selectedChatHeader.textContent = `Chat with Error (${friendIdTorn})`;
        if (selectedChatDisplay) selectedChatDisplay.innerHTML = `<p class="message-placeholder" style="color: red;">Error: Could not retrieve friend details for private chat. ${error.message}</p>`;
        if (privateChatMessageInput) privateChatMessageInput.disabled = true; if (sendPrivateMessageBtn) sendPrivateMessageBtn.disabled = true; return;
    }
    if (!recentChatsList || !selectedChatHeader || !selectedChatDisplay || !privateChatMessageInput || !sendPrivateMessageBtn) { console.error("Private chat UI elements not found. Ensure handleFriendsSubTabClick injected them correctly."); return; }

    recentChatsList.querySelectorAll('.chat-item').forEach(item => { item.classList.remove('active-chat'); });
    const selectedChatItem = recentChatsList.querySelector(`.chat-item[data-friend-id="${friendIdTorn}"]`);
    if (selectedChatItem) { selectedChatItem.classList.add('active-chat'); }

    selectedChatHeader.textContent = `Chat with ${friendName}`;
    const participants = [currentUserIdFirebase, friendFirebaseUid].sort();
    currentSelectedPrivateChatId = `private_${participants[0]}_${participants[1]}`;

    try { await db.collection('privateChatMessages').doc(currentSelectedPrivateChatId).set({ participants: participants, createdAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true }); }
    catch (error) {
        console.error("[Private Chat] Error ensuring parent chat document existence before listening:", error);
        if (selectedChatHeader) selectedChatHeader.textContent = `Error: Cannot initialize chat`;
        if (selectedChatDisplay) selectedChatDisplay.innerHTML = `<p class="message-placeholder" style="color: red;">Failed to set up chat. Permissions error: ${error.message}.</p>`;
        if (privateChatMessageInput) privateChatMessageInput.disabled = true; if (sendPrivateMessageBtn) sendPrivateMessageBtn.disabled = true; return;
    }
    if (unsubscribeFromPrivateChat) { unsubscribeFromPrivateChat(); unsubscribeFromPrivateChat = null; }
    if (selectedChatDisplay) selectedChatDisplay.innerHTML = '<p class="message-placeholder">Loading messages...</p>';
    const privateChatMessagesCollectionRef = db.collection('privateChatMessages').doc(currentSelectedPrivateChatId).collection('messages');
    unsubscribeFromPrivateChat = privateChatMessagesCollectionRef.orderBy('timestamp', 'asc').limit(100)
        .onSnapshot(snapshot => {
            if (!selectedChatDisplay) return;
            selectedChatDisplay.innerHTML = '';
            if (snapshot.empty) { selectedChatDisplay.innerHTML = `<p class="message-placeholder">No messages yet. Be the first to say hello to ${friendName}!</p>`; }
            else { snapshot.forEach(doc => { displayPrivateChatMessage(doc.data(), selectedChatDisplay, doc.data().senderId === currentUserIdFirebase); }); }
            setTimeout(() => { if (selectedChatDisplay && selectedChatDisplay.scrollHeight > 0) { selectedChatDisplay.scrollTop = selectedChatDisplay.scrollHeight; } }, 0);
        }, error => {
            console.error("Error listening to private chat messages:", error);
            if (selectedChatDisplay) selectedChatDisplay.innerHTML = `<p class="message-placeholder" style="color: red;">Error loading chat: ${error.message}</p>`;
        });
    if (privateChatMessageInput) privateChatMessageInput.disabled = false;
    if (sendPrivateMessageBtn) sendPrivateMessageBtn.disabled = false;
    if (privateChatMessageInput) privateChatMessageInput.focus();
}

// MODIFIED: initPrivateChatTabEventListeners (uses globally assigned private chat elements)
function initPrivateChatTabEventListeners() {
    if (!privateChatMessageInput || !sendPrivateMessageBtn || !recentChatsList) { return; }
    sendPrivateMessageBtn.removeEventListener('click', sendPrivateChatMessage);
    sendPrivateMessageBtn.addEventListener('click', sendPrivateChatMessage);
    privateChatMessageInput.removeEventListener('keydown', handlePrivateChatInputKeydown);
    privateChatMessageInput.addEventListener('keydown', handlePrivateChatInputKeydown);
    recentChatsList.removeEventListener('click', handleRecentChatClick);
    recentChatsList.addEventListener('click', handleRecentChatClick);
    loadRecentChats();
}

// NEW FUNCTION: Centralized click handler for recent chat items (to allow re-attachment)
async function handleRecentChatClick(event) {
    const chatItem = event.target.closest('.chat-item');
    if (!chatItem) return;

    if (event.target.closest('.delete-chat-btn')) {
        const chatDocIdToDelete = chatItem.dataset.chatDocId;
        const friendName = chatItem.querySelector('.chat-info .chat-name')?.textContent;
        const userConfirmed = await showCustomConfirm(`Are you sure you want to delete the chat with ${friendName}?`, "Confirm Chat Deletion");
        if (userConfirmed) { deletePrivateChat(chatDocIdToDelete, chatItem.dataset.friendId); }
        return;
    }
    const selectedFriendIdTorn = chatItem.dataset.friendId;
    if (selectedFriendIdTorn) { selectPrivateChat(selectedFriendIdTorn); }
}

// MODIFIED: loadRecentChats (now populates into friendsPanelContent)
async function loadRecentChats() {
    const recentChatsListEl = friendsPanelContent.querySelector('#recentChatsList');
    if (!recentChatsListEl) { return; }
    recentChatsListEl.innerHTML = '<li class="chat-item loading-message">Loading your recent chats...</li>';
    if (!auth.currentUser) { recentChatsListEl.innerHTML = '<li class="chat-item message-placeholder" style="color: yellow;">Please log in to see your private chats.</li>'; return; }
    const currentUserIdFirebase = auth.currentUser.uid;
    try {
        const chatsSnapshot = await db.collection('privateChatMessages').where('participants', 'array-contains', currentUserIdFirebase).orderBy('lastMessageAt', 'desc').limit(20).get();
        if (chatsSnapshot.empty) { recentChatsListEl.innerHTML = '<li class="chat-item message-placeholder">No recent private chats. Start one by messaging a friend!</li>'; return; }
        const friendDetailsPromises = [];
        for (const chatDoc of chatsSnapshot.docs) {
            const otherParticipantFirebaseUid = chatDoc.data().participants.find(uid => uid !== currentUserIdFirebase);
            if (!otherParticipantFirebaseUid) continue;
            friendDetailsPromises.push(db.collection('userProfiles').doc(otherParticipantFirebaseUid).get().then(userProfileDoc => {
                if (!userProfileDoc.exists) return null;
                const profileData = userProfileDoc.data();
                const friendTornId = profileData.tornProfileId; let friendName = profileData.preferredName || profileData.name || `User ID ${friendTornId}`;
                if (!friendTornId) return null;
                return db.collection('users').doc(String(friendTornId)).get().then(userDoc => {
                    let friendProfileImage = '../../images/default_profile_icon.png';
                    if (userDoc.exists) friendProfileImage = userDoc.data().profile_image || friendProfileImage;
                    return { friendFirebaseUid: otherParticipantFirebaseUid, friendName, friendProfileImage, chatDocId: chatDoc.id, friendTornId };
                });
            }).catch(error => { console.error(`Error fetching details for chat participant ${otherParticipantFirebaseUid}:`, error); return null; }));
        }
        const validChatsToDisplay = (await Promise.all(friendDetailsPromises)).filter(detail => detail !== null);
        if (validChatsToDisplay.length === 0) { recentChatsListEl.innerHTML = '<li class="chat-item message-placeholder">No valid chat partners found.</li>'; return; }
        let chatItemsHtml = validChatsToDisplay.map(detail => `
            <li class="chat-item" data-chat-doc-id="${detail.chatDocId}" data-friend-id="${detail.friendTornId}">
                <div class="chat-info"><img src="${detail.friendProfileImage}" alt="${detail.friendName}'s profile pic" class="profile-pic-small"><span class="chat-name">${detail.friendName}</span></div>
                <button class="delete-chat-btn" title="Delete Chat">🗑️</button>
            </li>`).join('');
        recentChatsListEl.innerHTML = chatItemsHtml;
    } catch (error) {
        console.error("[Recent Chats] Error loading recent chats:", error);
        recentChatsListEl.innerHTML = `<li class="chat-item message-placeholder" style="color: red;">Error loading chats: ${error.message}</li>`;
    }
}

// MODIFIED: deletePrivateChat (no functional change, but ensures elements are globally referenced)
async function deletePrivateChat(chatDocId, friendIdTorn) {
    try {
        const messagesRef = db.collection('privateChatMessages').doc(chatDocId).collection('messages');
        const messagesSnapshot = await messagesRef.get();
        if (!messagesSnapshot.empty) {
            const batch = db.batch();
            messagesSnapshot.docs.forEach(doc => { batch.delete(doc.ref); });
            await batch.commit();
        }
        await db.collection('privateChatMessages').doc(chatDocId).delete();
        const recentChatsListEl = friendsPanelContent.querySelector('#recentChatsList');
        if (recentChatsListEl) {
            loadRecentChats();
            if (currentSelectedPrivateChatId === chatDocId) {
                currentSelectedPrivateChatId = null;
                if (selectedChatHeader) selectedChatHeader.textContent = "Select a Chat";
                if (selectedChatDisplay) selectedChatDisplay.innerHTML = '<p class="message-placeholder">Click a chat on the left to start messaging.</p>';
                if (privateChatMessageInput) privateChatMessageInput.disabled = true;
                if (sendPrivateMessageBtn) sendPrivateMessageBtn.disabled = true;
                if (unsubscribeFromPrivateChat) { unsubscribeFromPrivateChat(); unsubscribeFromPrivateChat = null; }
            }
        }
        showCustomAlert("Chat deleted successfully.", "Deletion Complete");
    } catch (error) { console.error("Error deleting private chat:", error); showCustomAlert(`Failed to delete chat: ${error.message}`, "Deletion Failed"); }
}

// MODIFIED: displayChatMessage (now explicitly passes chatDisplayAreaId for dynamic targeting)
function displayChatMessage(messageObj, chatDisplayAreaId) {
    const chatDisplayArea = document.getElementById(chatDisplayAreaId);
    if (!chatDisplayArea) { console.error(`Chat display area '${chatDisplayAreaId}' not found in displayChatMessage function.`); return; }
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message');
    if (messageObj.timestamp && typeof messageObj.timestamp.toMillis === 'function') { messageElement.id = `msg-${messageObj.timestamp.toMillis()}`; }
    const timestamp = messageObj.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    messageElement.innerHTML = `<span class="chat-timestamp">[${timestamp}]</span> <span class="chat-sender">${messageObj.sender || 'Unknown'}:</span> <span class="chat-text">${messageObj.text || ''}</span>`;
    chatDisplayArea.appendChild(messageElement);
    chatDisplayArea.scrollTop = chatDisplayArea.scrollHeight;
}

// MODIFIED: manageChatMessages (now explicitly passes chatDisplayAreaId for dynamic targeting)
function manageChatMessages(chatDisplayAreaId) {
    const chatDisplayArea = document.getElementById(chatDisplayAreaId);
    if (!chatDisplayArea) { console.error(`Chat display area '${chatDisplayAreaId}' not found. Cannot manage messages.`); return; }
    const messages = chatDisplayArea.querySelectorAll('.chat-message');
    if (messages.length > MAX_MESSAGES_VISIBLE) {
        const messagesToRemoveCount = messages.length - MAX_MESSAGES_VISIBLE;
        for (let i = 0; i < messagesToRemoveCount; i++) {
            const messageToFade = messages[i]; messageToFade.classList.add('fade-out');
            setTimeout(() => { if (messageToFade.parentNode === chatDisplayArea) { chatDisplayArea.removeChild(messageToFade); } }, REMOVAL_DELAY_MS);
        }
    }
}

// MODIFIED: sendChatMessage (now explicit about its textInput and collectionType)
async function sendChatMessage(textInput, collectionType) {
    if (!textInput || !auth.currentUser) { console.warn("Cannot send message: Text input or logged-in user not available."); return; }
    const messageText = textInput.value.trim();
    if (messageText === '') { return; }

    let targetCollectionRef = null;
    let displayAreaId = '';

    if (collectionType === 'faction' && auth.currentUser.uid) {
        const userProfileRef = db.collection('userProfiles').doc(auth.currentUser.uid);
        const doc = await userProfileRef.get();
        if (doc.exists && doc.data().faction_id) {
            targetCollectionRef = db.collection('factionChats').doc(String(doc.data().faction_id)).collection('messages');
            displayAreaId = 'chat-display-area';
            chatMessagesCollection = targetCollectionRef; // Crucially update the global reference
        } else { console.warn("Faction ID not found for current user. Cannot send faction chat message."); return; }
    } else if (collectionType === 'war') {
        targetCollectionRef = db.collection('warChats').doc('currentWar').collection('messages');
        displayAreaId = 'war-chat-display-area';
    } else { console.error("Invalid collectionType or user not logged in for sending message."); return; }

    const messageObj = { senderId: auth.currentUser.uid, sender: currentTornUserName, text: messageText, timestamp: firebase.firestore.FieldValue.serverTimestamp() };
    try {
        await targetCollectionRef.add(messageObj);
        textInput.value = ''; textInput.focus();
    } catch (error) { console.error(`Error sending ${collectionType} message to Firebase:`, error); showCustomAlert(`Failed to send ${collectionType} message. See console for details.`, "Send Failed"); }
}

// MODIFIED: setupChatRealtimeListener (now explicitly takes type for collection/display area)
function setupChatRealtimeListener(type) {
    let chatDisplayArea = null;
    let collectionRef = null;
    let displayAreaId = '';

    if (unsubscribeFromChat) { unsubscribeFromChat(); unsubscribeFromChat = null; }

    if (type === 'faction' && auth.currentUser) {
        displayAreaId = 'chat-display-area';
        chatDisplayArea = document.getElementById(displayAreaId);
        if (chatDisplayArea) chatDisplayArea.innerHTML = '<p>Loading faction messages...</p>';
        db.collection('userProfiles').doc(auth.currentUser.uid).get().then(doc => {
            if (doc.exists && doc.data().faction_id) {
                collectionRef = db.collection('factionChats').doc(String(doc.data().faction_id)).collection('messages');
                chatMessagesCollection = collectionRef; // Update global chatMessagesCollection
            } else { if (chatDisplayArea) chatDisplayArea.innerHTML = '<p>Faction ID not found for chat.</p>'; return; }
            if (collectionRef) {
                unsubscribeFromChat = collectionRef.orderBy('timestamp', 'asc').limitToLast(50)
                    .onSnapshot(snapshot => {
                        if (chatDisplayArea) chatDisplayArea.innerHTML = '';
                        if (snapshot.empty) { if (chatDisplayArea) chatDisplayArea.innerHTML = `<p>No faction messages yet.</p>`; return; }
                        snapshot.forEach(doc => displayChatMessage(doc.data(), displayAreaId));
                        setTimeout(() => { if (chatDisplayArea && chatDisplayArea.scrollHeight > 0) { chatDisplayArea.scrollTop = chatDisplayArea.scrollHeight; } }, 0);
                    }, error => { console.error("Error listening to faction chat messages:", error); if (chatDisplayArea) chatDisplayArea.innerHTML = `<p style="color: red;">Error loading faction messages.</p>`; });
            }
        }).catch(error => { console.error("Error fetching user profile for faction chat:", error); if (chatDisplayArea) chatDisplayArea.innerHTML = `<p style="color: red;">Error accessing faction chat.</p>`; });

    } else if (type === 'war') {
        displayAreaId = 'war-chat-display-area';
        chatDisplayArea = document.getElementById(displayAreaId);
        if (chatDisplayArea) chatDisplayArea.innerHTML = '<p>Loading war messages...</p>';
        collectionRef = db.collection('warChats').doc('currentWar').collection('messages');
        if (collectionRef) {
            unsubscribeFromChat = collectionRef.orderBy('timestamp', 'asc').limitToLast(50)
                .onSnapshot(snapshot => {
                    if (chatDisplayArea) chatDisplayArea.innerHTML = '';
                    if (snapshot.empty) { if (chatDisplayArea) chatDisplayArea.innerHTML = `<p>No war messages yet.</p>`; return; }
                    snapshot.forEach(doc => displayChatMessage(doc.data(), displayAreaId));
                    setTimeout(() => { if (chatDisplayArea && chatDisplayArea.scrollHeight > 0) { chatDisplayArea.scrollTop = chatDisplayArea.scrollHeight; } }, 0);
                }, error => { console.error("Error listening to war chat messages:", error); if (chatDisplayArea) chatDisplayArea.innerHTML = `<p style="color: red;">Error loading war messages.</p>`; });
        }
    } else {
        console.warn("Unknown chat type or user not logged in for real-time listener.");
        if (document.getElementById('chat-display-area')) document.getElementById('chat-display-area').innerHTML = '<p>Chat unavailable.</p>';
        if (document.getElementById('war-chat-display-area')) document.getElementById('war-chat-display-area').innerHTML = '<p>War Chat unavailable.</p>';
    }
    const activeScrollWrapper = document.getElementById(displayAreaId);
    if (activeScrollWrapper) {
        activeScrollWrapper.removeEventListener('scroll', handleChatScroll);
        activeScrollWrapper.addEventListener('scroll', handleChatScroll);
    }
}

// NEW FUNCTION: Toggles the main chat window visibility
function toggleChatWindowVisibility(forceHide = false) {
    if (forceHide) { // If forceHide is true, always hide
        chatWindow.classList.add('hidden');
        chatMainTabsContainer.classList.add('hidden');
        chatBarCollapsed.classList.remove('hidden');
    } else { // Otherwise, toggle normally
        chatWindow.classList.toggle('hidden');
        chatMainTabsContainer.classList.toggle('hidden');
        chatBarCollapsed.classList.toggle('hidden');
    }
}

// ==========================================================================================
// CHAT SYSTEM EVENT LISTENER SETUP (Called once after chat HTML is loaded)
// This function attaches all event listeners related to the chat UI.
// ==========================================================================================
function setupChatEventListeners() {
    console.log("setupChatEventListeners: Attaching chat UI event listeners.");

    // --- Main Chat Window Toggle Listeners (from collapsed bar) ---
    if (openFactionChatIcon) openFactionChatIcon.addEventListener('click', () => {
        toggleChatWindowVisibility();
        if (!chatWindow.classList.contains('hidden')) {
            const factionChatTabButton = document.querySelector('.chat-tab[data-tab-target="faction-chat-panel"]');
            if (factionChatTabButton) handleChatTabClick({ currentTarget: factionChatTabButton });
        }
    });
    if (openWarChatIcon) openWarChatIcon.addEventListener('click', () => {
        toggleChatWindowVisibility();
        if (!chatWindow.classList.contains('hidden')) {
            const warChatTabButton = document.querySelector('.chat-tab[data-tab-target="war-chat-panel"]');
            if (warChatTabButton) handleChatTabClick({ currentTarget: warChatTabButton });
        }
    });
    if (openFriendsIcon) openFriendsIcon.addEventListener('click', () => {
        toggleChatWindowVisibility();
        if (!chatWindow.classList.contains('hidden')) {
            const friendsTabButton = document.querySelector('.chat-tab[data-tab-target="friends-panel"]');
            if (friendsTabButton) handleChatTabClick({ currentTarget: friendsTabButton });
        }
    });
    if (openNotificationsIcon) openNotificationsIcon.addEventListener('click', () => {
        toggleChatWindowVisibility();
        if (!chatWindow.classList.contains('hidden')) {
            const notificationsTabButton = document.querySelector('.chat-tab[data-tab-target="notifications-panel"]');
            if (notificationsTabButton) handleChatTabClick({ currentTarget: notificationsTabButton });
        }
    });
    if (openSettingsIcon) openSettingsIcon.addEventListener('click', () => {
        toggleChatWindowVisibility();
        if (!chatWindow.classList.contains('hidden')) {
            const settingsTabButton = document.querySelector('.chat-tab[data-tab-target="settings-panel"]');
            if (settingsTabButton) handleChatTabClick({ currentTarget: settingsTabButton });
        }
    });

    // --- Minimize button for all chat panels ---
    if (minimizeChatBtns) {
        minimizeChatBtns.forEach(button => {
            button.addEventListener('click', () => toggleChatWindowVisibility(true)); // Pass true to force hide
        });
    }

    // --- Main Chat Tab Buttons (Faction Chat, War Chat, Friends, Notifications, Settings) ---
    if (chatTabButtons) {
        chatTabButtons.forEach(button => {
            button.addEventListener('click', handleChatTabClick);
        });
    }

    // --- Friends Panel Sub-Tab Buttons ---
    if (friendsSubTabButtons) {
        friendsSubTabButtons.forEach(button => {
            button.addEventListener('click', handleFriendsSubTabClick);
        });
    }

    // --- Faction Chat Input / Send Button Listeners (within faction-chat-panel) ---
    const factionChatTextInputEl = factionChatPanel?.querySelector('.chat-text-input');
    const factionChatSendBtnEl = factionChatPanel?.querySelector('.chat-send-btn');
    if (factionChatSendBtnEl) {
        factionChatSendBtnEl.addEventListener('click', () => sendChatMessage(factionChatTextInputEl, 'faction'));
    }
    if (factionChatTextInputEl) {
        factionChatTextInputEl.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                sendChatMessage(factionChatTextInputEl, 'faction');
            }
        });
    }

    // --- War Chat Input / Send Button Listeners (within war-chat-panel) ---
    const warChatTextInputEl = warChatPanel?.querySelector('.chat-text-input');
    const warChatSendBtnEl = warChatPanel?.querySelector('.chat-send-btn');
    if (warChatSendBtnEl) {
        warChatSendBtnEl.addEventListener('click', () => sendChatMessage(warChatTextInputEl, 'war'));
    }
    if (warChatTextInputEl) {
        warChatTextInputEl.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                sendChatMessage(warChatTextInputEl, 'war');
            }
        });
    }

    // --- Settings Panel Button Listeners (assuming they exist globally after HTML load) ---
    if (saveAllSettingsButton) {
        saveAllSettingsButton.addEventListener('click', () => {
            localStorage.setItem('chatSettings', JSON.stringify(chatSettings));
            showCustomAlert("Chat settings saved locally!", "Settings Saved");
        });
    }

    if (clearChatHistoryButton) {
        clearChatHistoryButton.addEventListener('click', async () => {
            const confirmed = await showCustomConfirm("Are you sure you want to clear your local chat history?", "Confirm Clear");
            if (confirmed) {
                const displayArea = factionChatPanel?.querySelector('.chat-messages-scroll-wrapper');
                if (displayArea) displayArea.innerHTML = '<p>Local chat history cleared.</p>';
                showCustomAlert("Your local chat display has been cleared.", "Cleared");
            }
        });
    }

    if (closeAllPrivateChatsBtn) {
        closeAllPrivateChatsBtn.addEventListener('click', async () => {
            const confirmed = await showCustomConfirm("Are you sure you want to close all open private chats?", "Confirm Close");
            if (confirmed) {
                if (unsubscribeFromPrivateChat) {
                    unsubscribeFromPrivateChat();
                    unsubscribeFromPrivateChat = null;
                    currentSelectedPrivateChatId = null;
                    if (selectedChatHeader) selectedChatHeader.textContent = "Select a Chat";
                    if (selectedChatDisplay) selectedChatDisplay.innerHTML = '<p class="message-placeholder">Click a chat on the left to start messaging.</p>';
                    if (privateChatMessageInput) privateChatMessageInput.disabled = true;
                    if (sendPrivateMessageBtn) sendPrivateMessageBtn.disabled = true;

                    const recentChatsSubTabButton = document.querySelector('.friends-panel-subtabs .sub-tab-button[data-subtab="recent-chats"]');
                    if (recentChatsSubTabButton) { handleFriendsSubTabClick({ currentTarget: recentChatsSubTabButton }); }
                }
                showCustomAlert("All private chats closed.", "Action Complete");
            }
        });
    }

    if (deleteAllPrivateMessagesBtn) {
        deleteAllPrivateMessagesBtn.addEventListener('click', async () => {
            const confirmed = await showCustomConfirm("Are you sure you want to DELETE ALL of your private chat messages from the server? This action is irreversible.", "Confirm Delete All");
            if (!confirmed) return;
            if (!auth.currentUser) { showCustomAlert("You must be logged in to delete messages.", "Error"); return; }
            const currentUserUid = auth.currentUser.uid; let deleteCount = 0;
            try {
                const chatsSnapshot = await db.collection('privateChatMessages').where('participants', 'array-contains', currentUserUid).get();
                const chatDeletePromises = [];
                chatsSnapshot.forEach(chatDoc => {
                    const messagesRef = db.collection('privateChatMessages').doc(chatDoc.id).collection('messages');
                    chatDeletePromises.push(messagesRef.get().then(msgSnapshot => {
                        const batch = db.batch(); msgSnapshot.docs.forEach(msgDoc => { batch.delete(msgDoc.ref); deleteCount++; }); return batch.commit();
                    }).then(() => db.collection('privateChatMessages').doc(chatDoc.id).delete()));
                });
                await Promise.all(chatDeletePromises);
                showCustomAlert(`Successfully deleted ${deleteCount} private messages and all chat threads.`, "Deletion Complete");
                if (unsubscribeFromPrivateChat) {
                    unsubscribeFromPrivateChat(); unsubscribeFromPrivateChat = null; currentSelectedPrivateChatId = null;
                    if (selectedChatHeader) selectedChatHeader.textContent = "Select a Chat";
                    if (selectedChatDisplay) selectedChatDisplay.innerHTML = '<p class="message-placeholder">Click a chat on the left to start messaging.</p>';
                    if (privateChatMessageInput) privateChatMessageInput.disabled = true;
                    if (sendPrivateMessageBtn) sendPrivateMessageBtn.disabled = true;
                }
                const recentChatsSubTabButton = document.querySelector('.friends-panel-subtabs .sub-tab-button[data-subtab="recent-chats"]');
                if (recentChatsSubTabButton) { handleFriendsSubTabClick({ currentTarget: recentChatsSubTabButton }); }
            } catch (error) { console.error("Error deleting all private messages:", error); showCustomAlert(`Failed to delete all messages: ${error.message}`, "Deletion Failed"); }
        });
    }

    // Settings panel controls for saving preferences to localStorage
    // These listeners are placed directly on the input elements, as they exist only once.
    if (settingsUserStatusDisplayRadios) settingsUserStatusDisplayRadios.forEach(radio => radio.addEventListener('change', (e) => chatSettings.userStatusDisplay = e.target.value));
    if (settingsFontSizeRadios) settingsFontSizeRadios.forEach(radio => radio.addEventListener('change', (e) => {
        chatSettings.chatFontSize = e.target.value;
        document.querySelectorAll('.chat-messages-scroll-wrapper').forEach(el => {
            el.classList.remove('font-small', 'font-medium', 'font-large');
            el.classList.add(`font-${chatSettings.chatFontSize}`);
        });
    }));
    if (settingsChatThemeRadios) settingsChatThemeRadios.forEach(radio => radio.addEventListener('change', (e) => chatSettings.chatTheme = e.target.value));
    if (settingsMessageDensityRadios) settingsMessageDensityRadios.forEach(radio => radio.addEventListener('change', (e) => {
        chatSettings.messageDensity = e.target.value;
        document.querySelectorAll('.chat-messages-scroll-wrapper').forEach(el => {
            el.classList.remove('density-compact', 'density-normal', 'density-spacious');
            el.classList.add(`density-${chatSettings.messageDensity}`);
        });
    }));
    if (settingsInputSizeRadios) settingsInputSizeRadios.forEach(radio => radio.addEventListener('change', (e) => {
        chatSettings.chatInputSize = e.target.value;
        document.querySelectorAll('.chat-text-input').forEach(el => {
            el.classList.remove('input-small', 'input-medium', 'input-large');
            el.classList.add(`input-${chatSettings.chatInputSize}`);
        });
    }));
    if (settingsShowTimestamps) settingsShowTimestamps.addEventListener('change', (e) => chatSettings.showTimestamps = e.target.checked);
    if (settingsAutoScrollChat) settingsAutoScrollChat.addEventListener('change', (e) => chatSettings.autoScrollChat = e.target.checked);
    if (settingsProfanityFilterLocal) settingsProfanityFilterLocal.addEventListener('change', (e) => chatSettings.profanityFilterLocal = e.target.checked);
    if (settingsToggleWarChat) settingsToggleWarChat.addEventListener('change', (e) => chatSettings.toggleWarChat = e.target.checked);
    if (settingsMuteSiteSounds) settingsMuteSiteSounds.addEventListener('change', (e) => chatSettings.muteSiteSounds = e.target.checked);
    if (settingsMuteWarSounds) settingsMuteWarSounds.addEventListener('change', (e) => chatSettings.muteWarSounds = e.target.checked);
    if (settingsAppearOnlineOffline) settingsAppearOnlineOffline.addEventListener('change', (e) => chatSettings.appearOnlineOffline = e.target.checked);
    if (settingsNotificationMethodRadios) settingsNotificationMethodRadios.forEach(radio => radio.addEventListener('change', (e) => chatSettings.notificationMethod = e.target.value));
}

// ==========================================================================================
// REMAINING HELPER FUNCTIONS (NOT DIRECTLY CHAT-UI RELATED BUT MAY BE USED BY CHAT FUNCTIONS)
// These functions are kept because they are called by the chat-related functions.
// ==========================================================================================

// This function (and ones it calls) would normally be in your war_hub.js if it only updates the main war hub.
// But if it's called by chat features like "Recently Met" for data, it needs to be accessible globally.
// I've included a minimal version here, assuming its full implementation is in war_hub.js.
function fetchAndDisplayEnemyFaction(factionID, apiKey) {
    // This is a minimal placeholder. Your actual fetchAndDisplayEnemyFaction
    // in war_hub.js would do real API calls and update `enemyTargetsContainer`.
    // For chat-only purposes, this function doesn't need to do much.
    console.log(`[Stub] fetchAndDisplayEnemyFaction called for ID: ${factionID}. (Full logic in war_hub.js)`);
    // Example of what it might do minimally for chat if needed:
    if (factionID && apiKey) {
        // Here you would typically fetch real enemy data.
        // For this chat-only global.js, we just acknowledge the call.
        // If other chat-related functions *strictly* rely on a global `enemyDataGlobal` being populated by this,
        // you might need to add a minimal mock or an actual fetch here.
    }
}

// Dummy function for updateFriendlyMembersTable - if it's not strictly part of chat functionality
// it might belong in your war_hub.js. If it is used by the Friends tab to show stats, keep it here.
// I'm assuming for 'Friend List' tab, you want it to actually populate data.
async function updateFriendlyMembersTable(apiKey, firebaseAuthUid) {
    const friendListTbody = friendsPanelContent?.querySelector('#friends-tbody');
    if (!friendListTbody) { console.error("HTML Error: #friends-tbody not found for updateFriendlyMembersTable."); return; }
    friendListTbody.innerHTML = `<tr><td colspan="12" style="text-align:center; padding: 20px;">Loading friends' details...</td></tr>`;

    if (!auth.currentUser || !apiKey) { friendListTbody.innerHTML = `<tr><td colspan="12" style="text-align:center; padding: 20px;">Login and API Key required.</td></tr>`; return; }

    try {
        const userProfileDoc = await db.collection('userProfiles').doc(firebaseAuthUid).get();
        if (!userProfileDoc.exists || !userProfileDoc.data().friends) { friendListTbody.innerHTML = `<tr><td colspan="12" style="text-align:center; padding: 20px;">No friends added yet.</td></tr>`; return; }
        const friendTornIds = userProfileDoc.data().friends;

        const fetchPromises = friendTornIds.map(id =>
            fetch(`https://api.torn.com/user/${id}?selections=profile,personalstats,battlestats,workstats,cooldowns,bars,revive&key=${apiKey}&comment=MyTornPA_FriendDetails`)
            .then(res => res.json())
            .then(data => ({ id: id, data: data }))
            .catch(error => { console.error(`Error fetching Torn data for friend ${id}:`, error); return { id: id, data: { error: true } }; })
        );

        const fetchedFriendData = await Promise.all(fetchPromises);
        let allRowsHtml = '';
        for (const { id: tornPlayerId, data: friendData } of fetchedFriendData) {
            if (friendData.error || friendData.name === undefined) { // Check for API errors or missing essential data
                 allRowsHtml += `<tr data-id="${tornPlayerId}" class="status-error"><td><a href="https://www.torn.com/profiles.php?XID=${tornPlayerId}" target="_blank">Error [${tornPlayerId}]</a></td><td colspan="11" style="text-align:center; color: red;">API Error or Data Missing</td></tr>`;
                 continue;
            }

            const name = friendData.name || 'N/A';
            const level = friendData.level || 'N/A';
            const lastAction = friendData.last_action ? formatRelativeTime(friendData.last_action.timestamp) : 'N/A';
            const statusState = friendData.status?.state || ''; const statusDescription = friendData.status?.description || 'N/A';
            let formattedStatus = statusDescription; let statusClass = 'status-okay';
            if (statusState === 'Hospital') { statusClass = 'status-hospital'; } else if (statusState === 'Traveling') { statusClass = 'status-traveling'; } else if (statusState !== 'Okay') { statusClass = 'status-other'; }
            const strength = formatBattleStats(friendData.battlestats?.strength || 0); const dexterity = formatBattleStats(friendData.battlestats?.dexterity || 0);
            const speed = formatBattleStats(friendData.battlestats?.speed || 0); const defense = formatBattleStats(friendData.battlestats?.defense || 0);
            const totalStats = formatBattleStats((friendData.battlestats?.strength || 0) + (friendData.battlestats?.speed || 0) + (friendData.battlestats?.dexterity || 0) + (friendData.battlestats?.defense || 0));
            const nerveCurrent = friendData.bars?.nerve?.current ?? 'N/A'; const nerveMaximum = friendData.bars?.nerve?.maximum ?? 'N/A'; const nerve = `${nerveCurrent} / ${nerveMaximum}`;
            const energyCurrent = friendData.bars?.energy?.current ?? 'N/A'; const energyMaximum = friendData.bars?.energy?.maximum ?? 'N/A'; const energy = `${energyCurrent} / ${energyMaximum}`;
            const drugCooldownValue = friendData.cooldowns?.drug ?? 0; let drugCooldown, drugCooldownClass = '';
            if (drugCooldownValue > 0) {
                const hours = Math.floor(drugCooldownValue / 3600); const minutes = Math.floor((drugCooldownValue % 3600) / 60);
                drugCooldown = `${hours > 0 ? `${hours}h` : ''} ${minutes > 0 ? `${minutes}m` : ''}`.trim() || '<1m';
                if (drugCooldownValue > 18000) drugCooldownClass = 'status-hospital'; else if (drugCooldownValue > 7200) drugCooldownClass = 'status-other'; else drugCooldownClass = 'status-okay';
            } else { drugCooldown = 'None 🍁'; drugCooldownClass = 'status-okay'; }
            const reviveSetting = (friendData.revive_setting || '').trim(); let revivableClass = '';
            if (reviveSetting === 'Everyone') { revivableClass = 'revivable-text-green'; } else if (reviveSetting === 'Friends & faction') { revivableClass = 'revivable-text-orange'; } else if (reviveSetting === 'No one') { revivableClass = 'revivable-text-red'; }
            const profileUrl = `https://www.torn.com/profiles.php?XID=${tornPlayerId}`;

            allRowsHtml += `
                <tr data-id="${tornPlayerId}">
                    <td><a href="${profileUrl}" target="_blank">${name} [${tornPlayerId}]</a></td>
                    <td>${level}</td>
                    <td>${strength}</td><td>${dexterity}</td><td>${speed}</td><td>${defense}</td><td>${totalStats}</td>
                    <td class="${statusClass}">${formattedStatus}</td>
                    <td class="nerve-text">${nerve}</td>
                    <td class="energy-text">${energy}</td>
                    <td class="${drugCooldownClass}">${drugCooldown}</td>
                    <td class="${revivableClass}">${reviveSetting}</td>
                </tr>`;
        }
        friendListTbody.innerHTML = allRowsHtml || '<tr><td colspan="12" style="text-align:center; padding: 20px;">No detailed friend data available or no friends added.</td></tr>';
        applyStatColorCoding(friendListTbody);
    } catch (error) { console.error("Error fetching or displaying friends:", error); friendListTbody.innerHTML = `<tr><td colspan="12" style="text-align:center; padding: 20px;">Error loading friends: ${error.message}</td></tr>`; }
}


// --- DUMMY FUNCTIONS FOR METHODS USED BY CHAT FUNCTIONS, BUT ARE PART OF MAIN WAR_HUB.JS ---
// These are placeholders to prevent "function not defined" errors.
// Their real logic lives in your war_hub.js.
function setupWarClaimsListener() { console.log("[Stub] setupWarClaimsListener called. (Logic is in war_hub.js)"); }
function autoUnclaimHitTargets() { console.log("[Stub] autoUnclaimHitTargets called. (Logic is in war_hub.js)"); }
function updateOnlineMemberCounts() { console.log("[Stub] updateOnlineMemberCounts called. (Logic is in war_hub.js)"); }
function fetchAndDisplayChainData() { console.log("[Stub] fetchAndDisplayChainData called. (Logic is in war_hub.js)"); }
function displayQuickFFTargets(key, id) { console.log(`[Stub] displayQuickFFTargets called for ${id}. (Logic is in war_hub.js)`); }
function setupTeamLeadAutocomplete(members) { console.log("[Stub] setupTeamLeadAutocomplete called. (Logic is in war_hub.js)"); }
function updateAllTimers() { console.log("[Stub] updateAllTimers called. (Logic is in war_hub.js)"); }
function initializeAndLoadData(apiKey, factionId) { console.log(`[Stub] initializeAndLoadData called for faction: ${factionId}. (Logic is in war_hub.js)`); }
function populateWarStatusDisplay(data) { console.log("[Stub] populateWarStatusDisplay called. (Logic is in war_hub.js)"); }
function loadWarStatusForEdit(data) { console.log("[Stub] loadWarStatusForEdit called. (Logic is in war_hub.js)"); }
function displayWarRoster() { console.log("[Stub] displayWarRoster called. (Logic is in war_hub.js)"); }
function setupFactionHitsListener(db, factionId) { console.log(`[Stub] setupFactionHitsListener called for faction: ${factionId}. (Logic is in war_hub.js)`); }
function updateDualChainTimers(key, yourFactionId, enemyFactionId) { console.log(`[Stub] updateDualChainTimers called. (Logic is in war_hub.js)`); }
function checkIfUserIsAdmin() { console.log("[Stub] checkIfUserIsAdmin called. (Logic is in war_hub.js)"); return false; } // Must return boolean
function setupDiscordWebhookControls() { console.log("[Stub] setupDiscordWebhookControls called. (Logic is in war_hub.js)"); }
function sendReminderNotifications() { console.log("[Stub] sendReminderNotifications called. (Logic is in war_hub.js)"); }
function resetAllAvailability() { console.log("[Stub] resetAllAvailability called. (Logic is in war_hub.js)"); }
function handleImageUpload(input, display, label, type) { console.log(`[Stub] handleImageUpload called for ${type}. (Logic is in war_hub.js)`); }
// This applies to the *table* in your main app. The chat's friend list uses populateFriendListTab.
function setupMemberClickEvents() { console.log("[Stub] setupMemberClickEvents called. (Logic is in war_hub.js)"); }
function applyStatColorCoding(tableBodyElement) { console.log("[Stub] applyStatColorCoding called. (Logic is in war_hub.js)"); }
function setupProgressText() { console.log("[Stub] setupProgressText called. (Logic is in war_hub.js)"); }
function updateRankedWarDisplay(rankedWarData, yourFactionId) { console.log("[Stub] updateRankedWarDisplay called. (Logic is in war_hub.js)"); }


// ==========================================================================================
// MAIN DOMContentLoaded EVENT LISTENER
// This is the primary entry point after all HTML and scripts are loaded.
// ==========================================================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event fired. Calling initializeGlobals.");
    initializeGlobals(); // Start the process of loading HTML and setting up listeners.

    // Handle authentication state changes once all global DOM elements are ready.
    // This part should handle fetching API key, user data, and initiating relevant fetches/listeners.
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            console.log("User is logged in:", user.uid);
            const userProfileRef = db.collection('userProfiles').doc(user.uid);
            const doc = await userProfileRef.get();
            const userData = doc.exists ? doc.data() : {};

            userApiKey = userData.tornApiKey || null; // Update global userApiKey
            currentTornUserName = userData.preferredName || 'Unknown';

            // Only initiate chat-specific fetches/listeners if API key and faction ID are available
            // If globalYourFactionID is derived from userData.faction_id in initializeAndLoadData,
            // ensure that function or a similar call runs when a user logs in.
            // For this chat-only global.js, we simulate minimum setup:
            if (userData.faction_id) {
                globalYourFactionID = userData.faction_id; // Set global faction ID for chat collection
                chatMessagesCollection = db.collection('factionChats').doc(String(globalYourFactionID)).collection('messages');
                console.log(`Chat messages collection set to: factionChats/${globalYourFactionID}/messages`);

                // Start faction chat listener if faction chat panel is active by default
                // or when the user manually switches to it.
                // The handleChatTabClick will call setupChatRealtimeListener.
            } else {
                chatMessagesCollection = null;
                console.warn("User's faction ID not found. Faction chat may not be fully functional.");
            }

            // Default to showing faction chat or the tab specified in URL after login/data fetch
            const urlParams = new URLSearchParams(window.location.search);
            const requestedView = urlParams.get('view');
            const defaultTabButton = requestedView
                ? document.querySelector(`.chat-tab[data-tab-target="${requestedView}-panel"]`)
                : document.querySelector('.chat-tab[data-tab-target="faction-chat-panel"]');

            if (defaultTabButton) {
                // Trigger a click to open the default/requested tab and load its content
                handleChatTabClick({ currentTarget: defaultTabButton });
            } else {
                console.error(`Requested view "${requestedView}" or default faction-chat-panel not found. Cannot auto-select a tab.`);
                // If no default tab, simply open the chat window
                toggleChatWindowVisibility();
            }

        } else {
            console.log("User is logged out.");
            userApiKey = null;
            chatMessagesCollection = null;
            currentTornUserName = 'Unknown';
            if (unsubscribeFromChat) { unsubscribeFromChat(); unsubscribeFromChat = null; }
            if (unsubscribeFromPrivateChat) { unsubscribeFromPrivateChat(); unsubscribeFromPrivateChat = null; }

            // Clear chat UI when logged out
            if (chatPanels) chatPanels.forEach(panel => panel.classList.add('hidden'));
            if (factionChatPanel) {
                const displayArea = factionChatPanel.querySelector('.chat-messages-scroll-wrapper');
                if (displayArea) displayArea.innerHTML = '<p>Please log in to use chat.</p>';
                const inputArea = factionChatPanel.querySelector('.chat-input-area');
                if (inputArea) inputArea.style.display = 'none';
            }
            if (warChatPanel) {
                const displayArea = warChatPanel.querySelector('.chat-messages-scroll-wrapper');
                if (displayArea) displayArea.innerHTML = '<p>Please log in to use war chat.</p>';
                const inputArea = warChatPanel.querySelector('.chat-input-area');
                if (inputArea) inputArea.style.display = 'none';
            }
            if (friendsPanelContent) friendsPanelContent.innerHTML = '<p>Please log in to view friends and private chats.</p>';
            if (notificationsPanel) notificationsPanel.innerHTML = '<p>Please log in to view notifications.</p>';
            if (settingsPanel) settingsPanel.innerHTML = '<p>Please log in to adjust settings.</p>';

            toggleChatWindowVisibility(true); // Force hide the chat window.
        }
    });
});