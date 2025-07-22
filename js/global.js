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

    // 1. Load the Footer HTML into its placeholder (RE-ADDED THIS)
    fetch('globalfooter.html')
        .then(response => response.text())
        .then(data => {
            const footerContainer = document.getElementById('footer-container');
            if (footerContainer) {
                footerContainer.innerHTML = data;
                console.log("initializeGlobals: Footer loaded.");
            } else {
                console.error("initializeGlobals: Could not find 'footer-container' to load footer HTML.");
            }
        })
        .catch(error => console.error('initializeGlobals: Error loading global footer:', error));

    // 2. Load the Chat System HTML into its placeholder
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
// HELPER FUNCTIONS (Place these outside initializeGlobals but within global.js)
// These functions are generally useful utilities used by chat functions.
// ==========================================================================================

function countFactionMembers(membersObject) {
    if (!membersObject) return 0;
    return typeof membersObject.total === 'number' ? membersObject.total : Object.keys(membersObject).length;
}

// NOTE: `processProfileFetchQueue` is usually for broader profile fetching, often outside of core chat.
// If your chat's member list or private chat profile images need this, keep it.
// If `displayFactionMembersInChatTab` directly fetches via Firebase 'users' collection, this might be redundant.
async function processProfileFetchQueue() {
    // This is a minimal placeholder to prevent errors if called.
    // Full logic for fetching profile images should be here if needed by chat.
    console.log("[Stub] processProfileFetchQueue called. (Verify if needed by chat)");
}

function updateMemberItemDisplay(itemElement, profileImageUrl) {
    const imgElement = itemElement.querySelector('.member-profile-pic');
    if (imgElement) {
        imgElement.src = profileImageUrl;
    }
}

function formatBattleStats(num) {
    if (isNaN(num) || num === 0) return '0';
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'b';
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'm';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toLocaleString();
}

// Dummy profanity filter if not defined elsewhere. IMPORTANT: Implement real filtering.
function filterProfanity(text) {
    return text;
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
        Object.assign(overlay.style, { position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: '2000', backdropFilter: 'blur(5px)' });
        Object.assign(alertBox.style, { background: '#1e2a38', padding: '25px 30px', borderRadius: '8px', border: '1px solid #4a6a8a', boxShadow: '0 5px 20px rgba(0, 0, 0, 0.6)', textAlign: 'center', width: '90%', maxWidth: '450px', color: '#ecf0f1' });
        Object.assign(titleEl.style, { margin: '0 0 15px 0', color: '#e0a71a', fontSize: '1.4em', fontWeight: '600' });
        Object.assign(messageEl.style, { margin: '0 0 25px 0', fontSize: '1.1em', lineHeight: '1.6', whiteSpace: 'pre-wrap' });
        Object.assign(buttonWrapper.style, { display: 'flex', justifyContent: 'center', gap: '15px' });
        Object.assign(yesBtn.style, { backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', padding: '10px 25px', fontSize: '1em', cursor: 'pointer', fontWeight: 'bold' });
        Object.assign(noBtn.style, { backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', padding: '10px 25px', fontSize: '1em', cursor: 'pointer', fontWeight: 'bold' });
        titleEl.textContent = title; messageEl.textContent = message; yesBtn.textContent = 'Yes, Clear It'; noBtn.textContent = 'No, Cancel';
        const closeModal = (resolution) => { document.body.removeChild(overlay); resolve(resolution); };
        yesBtn.onclick = () => closeModal(true); noBtn.onclick = () => closeModal(false);
        overlay.onclick = (event) => { if (event.target === overlay) closeModal(false); };
        buttonWrapper.appendChild(noBtn); buttonWrapper.appendChild(yesBtn); alertBox.appendChild(titleEl); alertBox.appendChild(messageEl); alertBox.appendChild(buttonWrapper); overlay.appendChild(alertBox); document.body.appendChild(overlay);
    });
}

function showCustomAlert(message, title = "Alert") {
    const overlay = document.createElement('div');
    const alertBox = document.createElement('div');
    const titleEl = document.createElement('h4');
    const messageEl = document.createElement('p');
    const closeBtn = document.createElement('button');
    Object.assign(overlay.style, { position: 'fixed', top: '0', left: '0', width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: '2000', backdropFilter: 'blur(5px)' });
    Object.assign(alertBox.style, { background: '#1e2a38', padding: '25px 30px', borderRadius: '8px', border: '1px solid #4a6a8a', boxShadow: '0 5px 20px rgba(0, 0, 0, 0.6)', textAlign: 'center', width: '90%', maxWidth: '450px', color: '#ecf0f1' });
    Object.assign(titleEl.style, { margin: '0 0 15px 0', color: '#3498db', fontSize: '1.4em', fontWeight: '600' });
    Object.assign(messageEl.style, { margin: '0 0 25px 0', fontSize: '1.1em', lineHeight: '1.6' });
    Object.assign(closeBtn.style, { backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '5px', padding: '10px 20px', fontSize: '1em', cursor: 'pointer', transition: 'background-color 0.2s ease' });
    closeBtn.onmouseover = () => { closeBtn.style.backgroundColor = '#2980b9'; }; closeBtn.onmouseout = () => { closeBtn.style.backgroundColor = '#3498db'; };
    titleEl.textContent = title; messageEl.textContent = message; closeBtn.textContent = 'OK';
    const closeModal = () => { document.body.removeChild(overlay); };
    closeBtn.onclick = closeModal; overlay.onclick = (event) => { if (event.target === overlay) { closeModal(); } };
    alertBox.appendChild(titleEl); alertBox.appendChild(messageEl); alertBox.appendChild(closeBtn); overlay.appendChild(alertBox); document.body.appendChild(overlay);
}

function formatTime(seconds) {
    if (seconds <= 0) return 'Over';
    const h = Math.floor(seconds / 3600); const m = Math.floor((seconds % 3600) / 60); const s = Math.floor(seconds % 60);
    let result = ''; if (h > 0) result += `${h}h `; if (m > 0) result += `${m}m `; if (s > 0) result += `${s}s`; return result.trim();
}

function formatTornTime(timestamp) {
    const date = new Date(timestamp * 1000); const hours = String(date.getUTCHours()).padStart(2, '0'); const minutes = String(date.getUTCMinutes()).padStart(2, '0'); const seconds = String(date.getUTCSeconds()).padStart(2, '0'); return `${hours}:${minutes}:${seconds}`;
}

function formatRelativeTime(timestampInSeconds) {
    if (!timestampInSeconds || timestampInSeconds === 0) { return "N/A"; }
    const now = Math.floor(Date.now() / 1000); const diffSeconds = now - timestampInSeconds;
    if (diffSeconds < 60) { return "Now"; } else if (diffSeconds < 3600) { const minutes = Math.floor(diffSeconds / 60); return `${minutes} min${minutes === 1 ? '' : 's'} ago`; } else if (diffSeconds < 86400) { const hours = Math.floor(diffSeconds / 3600); return `${hours} hour${hours === 1 ? '' : 's'} ago`; } else { const days = Math.floor(diffSeconds / 86400); return `${days} day${days === 1 ? '' : 's'} ago`; }
}

function formatDuration(seconds) {
    if (seconds < 0) seconds = 0;
    const days = Math.floor(seconds / 86400); seconds %= 86400; const hours = Math.floor(seconds / 3600); seconds %= 3600; const minutes = Math.floor(seconds / 60); const secs = Math.floor(seconds % 60);
    const paddedHours = String(hours).padStart(2, '0'); const paddedMinutes = String(minutes).padStart(2, '0'); const paddedSecs = String(secs).padStart(2, '0');
    return `${days}:${paddedHours}:${paddedMinutes}:${paddedSecs}`;
}

function isOnlineWithin59Seconds(relativeTimeStr) {
    if (relativeTimeStr === "Now") { return true; }
    const match = relativeTimeStr.match(/(\d+) second(?:s)? ago/); if (match) { const seconds = parseInt(match[1], 10); return seconds <= 59; } return false;
}

function toggleScrollIndicatorVisibility() {
    // This function assumes a generic scroll wrapper for chat and an indicator element.
    // Ensure these IDs exist in your globalchat.html if you want this feature.
    const scrollWrapper = document.querySelector('.chat-messages-scroll-wrapper');
    const scrollIndicator = document.getElementById('scrollUpIndicator');

    if (!scrollIndicator || !scrollWrapper) { return; }
    
    // Assign to global variable `scrollUpIndicatorEl` only once to attach event listener
    if (!scrollUpIndicatorEl) {
        scrollUpIndicatorEl = scrollIndicator;
        scrollUpIndicatorEl.addEventListener('click', () => {
            if (scrollWrapper) { scrollWrapper.scrollTop = 0; }
        });
    }
    const atTop = scrollWrapper.scrollTop <= 5;
    const hasOverflow = scrollWrapper.scrollHeight > scrollWrapper.clientHeight;
    if (hasOverflow && !atTop) { scrollIndicator.classList.add('visible'); } else { scrollIndicator.classList.remove('visible'); }
}

function handleChatScroll() {
    toggleScrollIndicatorVisibility();
}

function areTargetSetsIdentical(set1, set2) {
    if (set1.length !== set2.length) { return false; }
    if (set1.length === 0) { return true; }
    const sortedSet1 = [...set1].sort(); const sortedSet2 = [...set2].sort();
    for (let i = 0; i < sortedSet1.length; i++) { if (sortedSet1[i] !== sortedSet2[i]) { return false; } } return true;
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function get_ff_colour(value) {
    let r, g, b;
    if (value <= 1) { r = 0x28; g = 0x28; b = 0xc6; } else if (value <= 3) { const t = (value - 1) / 2; r = 0x28; g = Math.round(0x28 + (0xc6 - 0x28) * t); b = Math.round(0xc6 - (0xc6 - 0x28) * t); } else if (value <= 5) { const t = (value - 3) / 2; r = Math.round(0x28 + (0xc6 - 0x28) * t); g = Math.round(0xc6 - (0xc6 - 0x28) * t); b = 0x28; } else { r = 0xc6; g = 0x28; b = 0x28; } return rgbToHex(r, g, b);
}

function get_difficulty_text(ff) {
    if (ff <= 1) return "Extremely easy"; else if (ff <= 2) return "Easy"; else if (ff <= 3.5) return "Moderately difficult"; else if (ff <= 4.5) return "Difficult"; else return "May be impossible";
}

function parseStatValue(statString) {
    if (typeof statString !== 'string' || statString.trim() === '' || statString.toLowerCase() === 'n/a') { return 0; }
    let sanitizedString = statString.toLowerCase().replace(/,/g, ''); let multiplier = 1;
    if (sanitizedString.endsWith('k')) { multiplier = 1000; sanitizedString = sanitizedString.slice(0, -1); } else if (sanitizedString.endsWith('m')) { multiplier = 1000000; sanitizedString = sanitizedString.slice(0, -1); } else if (sanitizedString.endsWith('b')) { multiplier = 1000000000; sanitizedString = sanitizedString.slice(0, -1); }
    const number = parseFloat(sanitizedString); return isNaN(number) ? 0 : number * multiplier;
}

// `applyStatColorCoding` expects a tableBodyElement. Ensure it's called with the correct tbody for dynamically loaded tables.
function applyStatColorCoding(tableBodyElement) {
    if (!tableBodyElement) { console.error("Color Coding Error: Table body element not provided to applyStatColorCoding."); return; }
    const statCells = tableBodyElement.querySelectorAll('td:nth-child(3), td:nth-child(4), td:nth-child(5), td:nth-child(6), td:nth-child(7)');
    statCells.forEach(cell => {
        for (let i = 1; i <= 9; i++) { cell.classList.remove(`stat-tier-${i}`); } cell.classList.remove('stat-cell');
        const value = parseStatValue(cell.textContent); let tierClass = '';
        if (value >= 500000000) { tierClass = 'stat-tier-9'; } else if (value >= 200000000) { tierClass = 'stat-tier-8'; } else if (value >= 100000000) { tierClass = 'stat-tier-7'; } else if (value >= 10000000) { tierClass = 'stat-tier-6'; } else if (value >= 5000000) { tierClass = 'stat-tier-5'; } else if (value >= 1000000) { tierClass = 'stat-tier-4'; } else if (value >= 100000) { tierClass = 'stat-tier-3'; } else if (value >= 10000) { tierClass = 'stat-tier-2'; } else if (value > 0) { tierClass = 'stat-tier-1'; }
        if (tierClass) { cell.classList.add(tierClass); cell.classList.add('stat-cell'); }
    });
}

function updateChainProgress(currentHits, progressBarElement, textElementId) {
    // This is a stub for a function that likely handles visual progress bars for chaining.
    // If your globalchat.html doesn't contain elements with these IDs/structure for chain progress,
    // this function is essentially a no-op but prevents errors if called.
    console.log(`[Stub] updateChainProgress called for hits: ${currentHits}. (Verify if needed by chat or other system)`);
}

function setupProgressText() {
    // This is a stub for a function that likely sets up visual elements for chain progress.
    console.log("[Stub] setupProgressText called. (Verify if needed by chat or other system)");
}

// ==========================================================================================
// CHAT SYSTEM CORE FUNCTIONS
// These are the main functions that drive the chat's behavior.
// ==========================================================================================

// MODIFIED: handleChatTabClick to manage new chat-panel structure
function handleChatTabClick(event) {
    const clickedTabButton = event.currentTarget;
    const targetPanelId = clickedTabButton.dataset.tabTarget;

    console.log(`[Chat Tab Debug] Clicked main chat tab: ${targetPanelId}`);

    if (chatTabButtons) chatTabButtons.forEach(button => button.classList.remove('active'));
    if (chatPanels) chatPanels.forEach(panel => panel.classList.remove('active'));
    if (chatPanels) chatPanels.forEach(panel => panel.classList.add('hidden'));

    const targetPanel = document.getElementById(targetPanelId);
    if (targetPanel) {
        clickedTabButton.classList.add('active');
        targetPanel.classList.remove('hidden');
        targetPanel.classList.add('active');
    } else {
        console.error(`HTML Error: Chat panel with ID '${targetPanelId}' not found.`); return;
    }

    if (unsubscribeFromChat) { unsubscribeFromChat(); unsubscribeFromChat = null; console.log("Unsubscribed from previous faction/war chat listener (main tab switch)."); }
    if (unsubscribeFromPrivateChat) { unsubscribeFromPrivateChat(); unsubscribeFromPrivateChat = null; console.log("Unsubscribed from previous private chat listener (main tab switch)."); }

    switch (targetPanelId) {
        case 'faction-chat-panel':
            const factionChatDisplayArea = targetPanel.querySelector('.chat-messages-scroll-wrapper');
            if (factionChatDisplayArea) { factionChatDisplayArea.innerHTML = '<p>Loading Faction Chat messages...</p>'; }
            setupChatRealtimeListener('faction');
            break;

        case 'war-chat-panel':
            const warChatDisplayArea = targetPanel.querySelector('.chat-messages-scroll-wrapper');
            if (warChatDisplayArea) { warChatDisplayArea.innerHTML = `<p>Welcome to War Chat!</p><p>Functionality not implemented yet.</p>`; }
            setupChatRealtimeListener('war');
            break;

        case 'friends-panel':
            if (friendsPanelContent) { friendsPanelContent.innerHTML = '<p style="text-align: center; color: #888; padding-top: 20px;">Loading friends content...</p>'; }
            const defaultFriendsSubTabButton = document.querySelector('.friends-panel-subtabs .sub-tab-button[data-subtab="recent-chats"]');
            if (defaultFriendsSubTabButton) { handleFriendsSubTabClick({ currentTarget: defaultFriendsSubTabButton }); }
            else { console.error("Default 'Recent Chats' sub-tab button not found."); }
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
            setupSettingsPanel();
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
            if (userApiKey) { populateRecentlyMetTab(friendsPanelContent); }
            else { friendsPanelContent.innerHTML = '<p style="text-align:center; padding: 20px; color: yellow;">API Key needed to view recently met players.</p>'; }
            break;

        case 'faction-members':
            // factionApiFullData should be populated by your main app's data loading (e.g., in war_hub.js)
            if (factionApiFullData && factionApiFullData.members) {
                friendsPanelContent.innerHTML = `<h3>Faction Members</h3><p>Loading faction member data...</p>`;
                displayFactionMembersInChatTab(factionApiFullData.members, friendsPanelContent);
            } else {
                 friendsPanelContent.innerHTML = '<p style="text-align:center; padding: 20px; color: yellow;">Faction data not loaded. Please log in with your API key in the main app.</p>';
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
                                    <th>Name (ID)</th><th>Level</th><th>Last Action</th><th>Str</th><th>Dex</th>
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
            if (auth.currentUser && userApiKey) { populateFriendListTab(friendsPanelContent); }
            else { friendsPanelContent.querySelector('#friends-tbody').innerHTML = '<tr><td colspan="12" style="text-align:center; color: yellow;">Please log in with your API Key to view friend stats.</td></tr>'; }
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
                addIgnoreIcon.addEventListener('click', () => { showCustomAlert('Add ignore functionality to be implemented!', "Not Implemented"); console.log('Attempting to add ignore:', addIgnoreInput.value); });
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
        if (statusElement) { statusElement.textContent = "Please log in and/or enter a Torn Player ID."; statusElement.style.color = 'red'; } return;
    }
    if (statusElement) { statusElement.textContent = "Adding friend..."; statusElement.style.color = 'white'; }
    if (buttonElement) buttonElement.disabled = true;

    try {
        const friendDocRef = db.collection('userProfiles').doc(auth.currentUser.uid).collection('friends').doc(friendId);
        const doc = await friendDocRef.get();
        if (doc.exists) {
            if (statusElement) { statusElement.textContent = "This player is already your friend."; statusElement.style.color = 'orange'; } return;
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
// This function would typically be triggered by non-chat UI in your war_hub.js,
// but it sends messages *into* the chat system, so it needs `chatMessagesCollection`.
// It is kept here as a function that interacts with the chat.
async function sendClaimChatMessage(claimerName, targetName, chainNumber, customMessage = null) {
    if (!chatMessagesCollection || !auth.currentUser) { console.warn("Cannot send claim/unclaim message: Firebase collection or user not available."); return; }
    const messageText = customMessage || `📢 ${claimerName} has claimed ${targetName} as hit #${chainNumber}!`;
    const filteredMessage = typeof filterProfanity === 'function' ? filterProfanity(messageText) : messageText;
    const messageObj = { senderId: auth.currentUser.uid, sender: "Chain Alert:", text: filteredMessage, timestamp: firebase.firestore.FieldValue.serverTimestamp(), type: 'claim_notification' };
    try {
        await chatMessagesCollection.add(messageObj);
        // Assuming displayChatMessage can handle being called with the faction chat's display area ID
        displayChatMessage(messageObj, factionChatPanel?.querySelector('.chat-messages-scroll-wrapper')?.id);
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
        if (chatWindow) chatWindow.classList.add('hidden');
        if (chatMainTabsContainer) chatMainTabsContainer.classList.add('hidden');
        if (chatBarCollapsed) chatBarCollapsed.classList.remove('hidden');
    } else { // Otherwise, toggle normally
        if (chatWindow) chatWindow.classList.toggle('hidden');
        if (chatMainTabsContainer) chatMainTabsContainer.classList.toggle('hidden');
        if (chatBarCollapsed) chatBarCollapsed.classList.toggle('hidden');
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
    // Ensure these elements are part of the specific factionChatPanel, not global search.
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
    // Ensure these elements are part of the specific warChatPanel.
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

    // --- Settings Panel Button Listeners ---
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
                    // Re-query elements, as they might have been injected/re-rendered.
                    const dynamicSelectedChatHeader = friendsPanelContent?.querySelector('#selectedChatHeader');
                    const dynamicSelectedChatDisplay = friendsPanelContent?.querySelector('#selectedChatDisplay');
                    const dynamicPrivateChatMessageInput = friendsPanelContent?.querySelector('#privateChatMessageInput');
                    const dynamicSendPrivateMessageBtn = friendsPanelContent?.querySelector('#sendPrivateMessageBtn');

                    if (dynamicSelectedChatHeader) dynamicSelectedChatHeader.textContent = "Select a Chat";
                    if (dynamicSelectedChatDisplay) dynamicSelectedChatDisplay.innerHTML = '<p class="message-placeholder">Click a chat on the left to start messaging.</p>';
                    if (dynamicPrivateChatMessageInput) dynamicPrivateChatMessageInput.disabled = true;
                    if (dynamicSendPrivateMessageBtn) dynamicSendPrivateMessageBtn.disabled = true;

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
                    const dynamicSelectedChatHeader = friendsPanelContent?.querySelector('#selectedChatHeader');
                    const dynamicSelectedChatDisplay = friendsPanelContent?.querySelector('#selectedChatDisplay');
                    const dynamicPrivateChatMessageInput = friendsPanelContent?.querySelector('#privateChatMessageInput');
                    const dynamicSendPrivateMessageBtn = friendsPanelContent?.querySelector('#sendPrivateMessageBtn');

                    if (dynamicSelectedChatHeader) dynamicSelectedChatHeader.textContent = "Select a Chat";
                    if (dynamicSelectedChatDisplay) dynamicSelectedChatDisplay.innerHTML = '<p class="message-placeholder">Click a chat on the left to start messaging.</p>';
                    if (dynamicPrivateChatMessageInput) dynamicPrivateChatMessageInput.disabled = true;
                    if (dynamicSendPrivateMessageBtn) dynamicSendPrivateMessageBtn.disabled = true;
                }
                const recentChatsSubTabButton = document.querySelector('.friends-panel-subtabs .sub-tab-button[data-subtab="recent-chats"]');
                if (recentChatsSubTabButton) { handleFriendsSubTabClick({ currentTarget: recentChatsSubTabButton }); }
            } catch (error) { console.error("Error deleting all private messages:", error); showCustomAlert(`Failed to delete all messages: ${error.message}`, "Deletion Failed"); }
        });
    }

    // Settings panel controls for saving preferences to localStorage
    if (settingsUserStatusDisplayRadios) settingsUserStatusDisplayRadios.forEach(radio => radio.addEventListener('change', (e) => chatSettings.userStatusDisplay = e.target.value));
    if (settingsFontSizeRadios) settingsFontSizeRadios.forEach(radio => radio.addEventListener('change', (e) => {
        chatSettings.chatFontSize = e.target.value;
        document.querySelectorAll('.chat-messages-scroll-wrapper').forEach(el => {
            el.classList.remove('font-small', 'font-medium', 'font-large'); el.classList.add(`font-${chatSettings.chatFontSize}`);
        });
    }));
    if (settingsChatThemeRadios) settingsChatThemeRadios.forEach(radio => radio.addEventListener('change', (e) => chatSettings.chatTheme = e.target.value));
    if (settingsMessageDensityRadios) settingsMessageDensityRadios.forEach(radio => radio.addEventListener('change', (e) => {
        chatSettings.messageDensity = e.target.value;
        document.querySelectorAll('.chat-messages-scroll-wrapper').forEach(el => {
            el.classList.remove('density-compact', 'density-normal', 'density-spacious'); el.classList.add(`density-${chatSettings.messageDensity}`);
        });
    }));
    if (settingsInputSizeRadios) settingsInputSizeRadios.forEach(radio => radio.addEventListener('change', (e) => {
        chatSettings.chatInputSize = e.target.value;
        document.querySelectorAll('.chat-text-input').forEach(el => {
            el.classList.remove('input-small', 'input-medium', 'input-large'); el.classList.add(`input-${chatSettings.chatInputSize}`);
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
// STUBS FOR NON-CHAT FUNCTIONS (TO PREVENT ERRORS IF CALLED BY CHAT)
// These functions are called by chat features (e.g., `populateRecentlyMetTab` needing `userApiKey`),
// but their primary implementation (data source, UI updates for other parts of the app) is assumed
// to be in your `war_hub.js` or other scripts. These stubs prevent "function not defined" errors.
// ==========================================================================================
let userApiKey = null; // Declare as `let` here to be assignable by external logic
let factionApiFullData = null; // Declare as `let` for external assignment
let globalYourFactionID = null; // Declare as `let` for external assignment

function fetchAndDisplayEnemyFaction(factionID, apiKey) { console.log(`[Stub] fetchAndDisplayEnemyFaction called for ID: ${factionID}. (Full logic in war_hub.js)`); }
async function updateFriendlyMembersTable(apiKey, firebaseAuthUid) {
    const friendListTbody = friendsPanelContent?.querySelector('#friends-tbody');
    if (friendListTbody) { friendListTbody.innerHTML = `<tr><td colspan="12" style="text-align:center; padding: 20px;">Loading friends' details (via stubbed function)...</td></tr>`; }
    console.log(`[Stub] updateFriendlyMembersTable called for user: ${firebaseAuthUid}. (Full logic in war_hub.js)`);
    // Example placeholder: if your war_hub.js populated `factionApiFullData`
    // and `userApiKey`, you might access them here.
    if (apiKey && firebaseAuthUid) {
        // In a real scenario, this would fetch friend stats from Torn API
        // and populate the table with actual data. For now, it's a stub.
        if (friendListTbody) {
            friendListTbody.innerHTML = `<tr><td colspan="12" style="text-align:center; padding: 20px;">API data loading for friends is stubbed.</td></tr>`;
        }
    }
}
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
function checkIfUserIsAdmin() { console.log("[Stub] checkIfUserIsAdmin called. (Logic is in war_hub.js)"); return false; }
function setupDiscordWebhookControls() { console.log("[Stub] setupDiscordWebhookControls called. (Logic is in war_hub.js)"); }
function sendReminderNotifications() { console.log("[Stub] sendReminderNotifications called. (Logic is in war_hub.js)"); }
function resetAllAvailability() { console.log("[Stub] resetAllAvailability called. (Logic is in war_hub.js)"); }
function handleImageUpload(input, display, label, type) { console.log(`[Stub] handleImageUpload called for ${type}. (Logic is in war_hub.js)`); }
function setupMemberClickEvents() { console.log("[Stub] setupMemberClickEvents called. (Logic is in war_hub.js)"); }
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

            // User's API key and faction ID are needed for many chat functions
            // If `userApiKey` and `globalYourFactionID` are populated by `war_hub.js`,
            // ensure `war_hub.js` loads first and populates these, or duplicate the logic here.
            // For now, we manually assign the API key and faction ID if available from user profile.
            userApiKey = userData.tornApiKey || null; // This will update the global userApiKey stub
            // The `globalYourFactionID` would typically be set by a main app initialization function,
            // like `initializeAndLoadData` in your `war_hub.js`. We'll set it here minimally if found.
            if (userData.faction_id) {
                globalYourFactionID = userData.faction_id;
            }

            currentTornUserName = userData.preferredName || 'Unknown';

            // Set up chatMessagesCollection based on user's faction ID for faction chat
            if (globalYourFactionID) {
                chatMessagesCollection = db.collection('factionChats').doc(String(globalYourFactionID)).collection('messages');
                console.log(`Chat messages collection set to: factionChats/${globalYourFactionID}/messages`);
            } else {
                chatMessagesCollection = null;
                console.warn("User's faction ID not found. Faction chat may not be fully functional.");
            }

            // Default to showing faction chat or the tab specified in URL after login/data fetch
            const urlParams = new URLSearchParams(window.location.search);
            const requestedView = urlParams.get('view');
            // Ensure the DOM elements exist before querying them (e.g., chatTabButtons)
            const defaultTabButton = chatTabButtons
                ? (requestedView ? document.querySelector(`.chat-tab[data-tab-target="${requestedView}-panel"]`) : document.querySelector('.chat-tab[data-tab-target="faction-chat-panel"]'))
                : null;

            if (defaultTabButton) {
                handleChatTabClick({ currentTarget: defaultTabButton });
            } else {
                console.error(`Requested view "${requestedView}" or default faction-chat-panel not found, or chat UI not fully loaded. Cannot auto-select a tab.`);
                if (tornpaChatSystem && chatWindow) {
                     toggleChatWindowVisibility(); // Just open the window, user can pick tab.
                }
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