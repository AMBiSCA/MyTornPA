const DEFAULT_PROFILE_ICONS = [
    '../../images/account.png',
    '../../images/avatar-design.png',
    '../../images/boy.png',
    '../../images/boys.png',
    '../../images/boysy.png',
    '../../images/business-man.png',
    '../../images/customer-service.png',
    '../../images/circle.png',
    '../../images/display-pic.png',
    '../../images/man.png',
    '../../images/man3w.png',
    '../../images/mans.png',
    '../../images/men.png',
    '../../images/office-man.png',
    '../../images/bussiness-man.png',
    '../../images/piccy.png',
    '../../images/profile.png',
    '../../images/user.png',
    '../../images/user2.png',
    '../../images/user-image-with-black-background.png',
    '../../images/working.png'
];

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

    let result = '';
    if (days > 0) result += `${days}d `;
    result += `${paddedHours}:${paddedMinutes}:${paddedSecs}`;
    return result.trim();
}

// Function to format UTC timestamp to a readable time/date string
function formatUtcTimestamp(timestampInSeconds) {
    if (!timestampInSeconds) return 'N/A';
    const date = new Date(timestampInSeconds * 1000);
    // You can adjust the format as needed, e.g., 'en-GB' for UK locale
    return date.toLocaleString('en-GB', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false, timeZoneName: 'short' // 'short' usually gives 'GMT', 'BST', 'UTC' etc.
    });
}

function initializeGlobals() {
    // ---- Firebase Setup ----
    const db = firebase.firestore();
    const auth = firebase.auth();
    let chatMessagesCollection = null; // Used by generic setupChatRealtimeListener
    let unsubscribeFromChat = null; // Stores unsubscribe function for current chat listener
    let currentTornUserName = 'Unknown';
    let currentUserFactionId = null;
    let userTornApiKey = null;
    // UPDATED: Variable to store the user's saved alliance IDs as an array
    let currentUserAllianceIds = [];

    // NEW GLOBAL VARS FOR WAR CHAT
    let currentActiveRankedWarId = null;
    let currentActiveRankedWarData = null; // To store names, start/end times etc.
    // Store the interval ID to clear it later when switching away from war chat
    let warChatTimerInterval = null;
    // END NEW GLOBAL VARS

    // ---- Torn API Base URL ----
    const TORN_API_BASE_URL = 'https://api.torn.com/v2';

    // ---- Load the Footer ----
    fetch('globalfooter.html')
        .then(response => response.text())
        .then(data => {
            const footerContainer = document.getElementById('footer-container');
            if (footerContainer) {
                footerContainer.innerHTML = data;
                console.log("global.js: Global footer HTML loaded successfully.");
            } else {
                console.error("global.js: Error: #footer-container element not found for loading footer HTML.");
            }
        })
        .catch(error => console.error('global.js: Error loading global footer:', error));

    // ---- Load the Chat System ----
    fetch('globalchat.html')
        .then(response => response.text())
        .then(data => {
            const chatSystemPlaceholder = document.getElementById('chat-system-placeholder');
            if (chatSystemPlaceholder) {
                chatSystemPlaceholder.innerHTML = data;
                console.log("global.js: Global chat HTML loaded successfully into placeholder.");

                // --- DOM Element References (after globalchat.html is loaded) ---
                const chatBarCollapsed = document.getElementById('chat-bar-collapsed');
                const chatWindow = document.getElementById('chat-window');
                const chatMainTabsContainer = document.querySelector('.chat-main-tabs-container');
                const openGraphIcon = document.getElementById('open-graph-icon');
                const factionOverviewPanel = document.getElementById('faction-overview-panel');
                const openFactionChatIcon = document.getElementById('open-faction-chat-icon');
                const openWarChatIcon = document.getElementById('open-war-chat-icon');
                const openFriendsIcon = document.getElementById('open-friends-icon');
                const openNotificationsIcon = document.getElementById('open-notifications-icon');
                const openSettingsIcon = document.getElementById('open-settings-icon');

                // NEW: Alliance Chat icon reference
                const openAllianceChatIcon = document.getElementById('open-alliance-chat-icon');

                const factionChatPanel = document.getElementById('faction-chat-panel');
                const warChatPanel = document.getElementById('war-chat-panel');
                const friendsPanel = document.getElementById('friends-panel');
                const notificationsPanel = document.getElementById('notifications-panel');
                const settingsPanel = document.getElementById('settings-panel');

                // NEW: Alliance Chat panel reference
                const allianceChatPanel = document.getElementById('alliance-chat-panel');

                const minimizeChatBtns = document.querySelectorAll('.minimize-chat-btn');

                const allPanels = document.querySelectorAll('.chat-panel');
                const allTabs = document.querySelectorAll('.chat-tab');

                const factionChatTextInput = factionChatPanel.querySelector('.chat-text-input');
                const factionChatSendBtn = factionChatPanel.querySelector('.chat-send-btn');

                const warChatTextInput = warChatPanel.querySelector('.chat-text-input');
                const warChatSendBtn = warChatPanel.querySelector('.chat-send-btn');

                // NEW: Alliance Chat input and send button references
                const allianceChatTextInput = allianceChatPanel.querySelector('.chat-text-input');
                const allianceChatSendBtn = allianceChatPanel.querySelector('.chat-send-btn');

                // NEW: Settings panel elements for Alliance Chat
                const allianceFactionIdInput = document.getElementById('allianceFactionId');
                const saveAllianceButton = document.getElementById('saveAlliance');
                const clearAlliancesButton = document.getElementById('clearAlliances');
                const allianceInfoIcon = document.getElementById('allianceInfoIcon'); // For hover display


                const friendsPanelContent = document.querySelector('#friends-panel .friends-panel-content');
                const recentlyMetSubTab = document.querySelector('.sub-tab-button[data-subtab="recently-met"]');
                const factionMembersSubTab = document.querySelector('.sub-tab-button[data-subtab="faction-members"]');
                // NEW: Friends sub-tab references
                const recentChatsSubTab = document.querySelector('.sub-tab-button[data-subtab="recent-chats"]');
                const friendListSubTab = document.querySelector('.sub-tab-button[data-subtab="friend-list"]');
                const ignoreListSubTab = document.querySelector('.sub-tab-button[data-subtab="ignore-list"]');


                // --- Helper to open a specific chat panel and hide others ---
                function openChatPanel(panelToShow) {
                    if (chatWindow) chatWindow.classList.remove('hidden');

                    if (chatMainTabsContainer) chatMainTabsContainer.classList.remove('hidden'); // Show main tabs when window opens

                    allPanels.forEach(p => p.classList.add('hidden'));
                    if (panelToShow) panelToShow.classList.remove('hidden');
                }

                // --- Event Listeners for Collapsed Chat Bar Icons ---
                if (openFactionChatIcon) {
                    openFactionChatIcon.addEventListener('click', () => {
                        openChatPanel(factionChatPanel);
                        if (factionChatTextInput) factionChatTextInput.focus();
                        setupChatRealtimeListener('faction');
                    });
                }

                // NEW: Alliance Chat collapsed icon listener
                if (openAllianceChatIcon) {
                    openAllianceChatIcon.addEventListener('click', () => {
                        openChatPanel(allianceChatPanel);
                        if (allianceChatTextInput) allianceChatTextInput.focus();
                        setupChatRealtimeListener('alliance');
                    });
                }

                if (openWarChatIcon) {
                    openWarChatIcon.addEventListener('click', () => {
                        openChatPanel(warChatPanel);
                        if (warChatTextInput) warChatTextInput.focus();
                        setupChatRealtimeListener('war'); // Trigger war chat setup
                    });
                }

                if (openFriendsIcon) {
                    openFriendsIcon.addEventListener('click', () => {
                        openChatPanel(friendsPanel);
                        // When friends icon is clicked, activate the default sub-tab (Recent Chats)
                        if (recentChatsSubTab) {
                            recentChatsSubTab.click(); // This triggers the sub-tab's own listener
                        } else {
                            friendsPanelContent.innerHTML = `<p style="text-align: center; color: #888; padding-top: 20px;">Recent chats content would load here.</p>`;
                        }
                    });
                }

                if (openNotificationsIcon) {
                    openNotificationsIcon.addEventListener('click', () => {
                        openChatPanel(notificationsPanel);
                    });
                }

                if (openSettingsIcon) {
                    openSettingsIcon.addEventListener('click', async () => {
                        openChatPanel(settingsPanel);
                        // No need to pre-fill allianceFactionIdInput with any specific value
                        // as it's for adding new ones now.
                        allianceFactionIdInput.value = ''; // Clear the input field for new entry
                        updateAllianceInfoIconTitle(); // Update tooltip to show all saved IDs
                    });
                }

                if (openGraphIcon) {
                    openGraphIcon.addEventListener('click', () => {
                        openChatPanel(factionOverviewPanel);
                        populateFactionOverview(); // This calls the function to load the data
                    });
                }

                // NEW: Save Alliance ID button listener
                if (saveAllianceButton) {
                    saveAllianceButton.addEventListener('click', async () => {
                        const newAllianceId = allianceFactionIdInput.value.trim();
                        if (newAllianceId) {
                            // Call the updated function to add the alliance ID to the array
                            await addOrUpdateUserAllianceId(newAllianceId);
                            allianceFactionIdInput.value = ''; // Clear input field after adding
                            updateAllianceInfoIconTitle(); // Update tooltip after saving
                        } else {
                            alert('Please enter an Alliance ID.');
                        }
                    });
                }

                // NEW: Clear All Alliances button listener
                if (clearAlliancesButton) {
                    clearAlliancesButton.addEventListener('click', async () => {
                        const userConfirmed = await showCustomConfirm('Are you sure you want to remove ALL saved Alliance IDs?', 'Confirm Clear');
                        if (userConfirmed) {
                            await clearUserAllianceIds(); // This will clear `currentUserAllianceIds` as well
                            alert('All Alliance IDs cleared!');
                            allianceFactionIdInput.value = ''; // Clear input field
                            updateAllianceInfoIconTitle(); // Update tooltip
                        }
                    });
                }

                // NEW: Function to update the alliance info icon title
                function updateAllianceInfoIconTitle() {
                    if (allianceInfoIcon) {
                        if (currentUserAllianceIds && currentUserAllianceIds.length > 0) {
                            allianceInfoIcon.title = `Saved Alliances: ${currentUserAllianceIds.join(', ')}\n(Chatting in first saved ID)`;
                        } else {
                            allianceInfoIcon.title = 'No Alliance IDs saved. Enter one above (max 3).';
                        }
                    }
                }


                // --- Minimize Button Logic ---
                minimizeChatBtns.forEach(btn => {
                    btn.addEventListener('click', () => {
                        if (chatWindow) chatWindow.classList.add('hidden');
                        if (chatMainTabsContainer) chatMainTabsContainer.classList.add('hidden');
                    });
                });

                // --- Tab Switching Logic for main tabs ---
                allTabs.forEach(tab => {
                    tab.addEventListener('click', () => {
                        const targetPanelId = tab.dataset.tabTarget;
                        const targetPanel = document.getElementById(targetPanelId);

                        // Remove active from all main tabs and hide all panels
                        allTabs.forEach(t => t.classList.remove('active'));
                        allPanels.forEach(p => p.classList.add('hidden'));

                        // Set the clicked main tab as active and show its panel
                        tab.classList.add('active');
                        if (targetPanel) {
                            targetPanel.classList.remove('hidden');
                        }

                        // Handle specific panel logic after it's shown
                        switch (targetPanelId) {
                            case 'friends-panel':
                                // Automatically click the "Recent Chats" sub-tab when the "Friends" main tab is opened
                                if (recentChatsSubTab) {
                                    recentChatsSubTab.click(); // Triggers the dedicated listener below
                                } else {
                                    friendsPanelContent.innerHTML = `<p style="text-align: center; color: #888; padding-top: 20px;">Recent chats content could not load.</p>`;
                                }
                                break;

                            case 'alliance-chat-panel': // Case for the new Alliance Chat main tab
                                setupMessageSending(allianceChatTextInput, allianceChatSendBtn, 'alliance');
                                setupChatRealtimeListener('alliance');
                                if (allianceChatTextInput) allianceChatTextInput.focus();
                                break;

                            case 'faction-chat-panel':
                                if (factionChatTextInput) factionChatTextInput.focus();
                                setupChatRealtimeListener('faction');
                                break;

                            case 'war-chat-panel':
                                if (warChatTextInput) warChatTextInput.focus();
                                setupChatRealtimeListener('war'); // Trigger war chat setup here
                                break;

                            case 'settings-panel': // When settings panel is opened via tab, update alliance input
                                // No need to pre-fill the input, as it's for adding new IDs
                                allianceFactionIdInput.value = ''; // Clear for new entry
                                updateAllianceInfoIconTitle(); // Ensure tooltip is fresh
                                break;

                            // No default needed here, as panels will be hidden by default unless a specific case matches.
                        }
                    });
                });

                // --- Individual Sub-Tab Event Listeners for Friends Panel ---
                // These handle direct clicks on the sub-tab buttons within the Friends panel.

                if (recentChatsSubTab) {
                    recentChatsSubTab.addEventListener('click', () => {
                        friendsPanel.querySelectorAll('.sub-tab-button').forEach(btn => btn.classList.remove('active'));
                        recentChatsSubTab.classList.add('active');
                        // Call the new function to load the chats
                        loadRecentPrivateChats(friendsPanelContent);
                    });
                }

                if (recentlyMetSubTab) {
                    recentlyMetSubTab.addEventListener('click', () => {
                        friendsPanel.querySelectorAll('.sub-tab-button').forEach(btn => btn.classList.remove('active'));
                        recentlyMetSubTab.classList.add('active');
                        populateRecentlyMetTab(friendsPanelContent);
                    });
                }

                if (factionMembersSubTab) {
                    factionMembersSubTab.addEventListener('click', async () => {
                        friendsPanel.querySelectorAll('.sub-tab-button').forEach(btn => btn.classList.remove('active'));
                        factionMembersSubTab.classList.add('active');

                        if (!currentUserFactionId || !userTornApiKey) {
                            friendsPanelContent.innerHTML = `<p style="text-align:center; padding: 10px; color: orange;">Faction ID or API key not available. Please log in and ensure your profile is complete.</p>`;
                            return;
                        }

                        friendsPanelContent.innerHTML = `<p style="text-align:center; padding: 10px;">Loading faction members...</p>`;
                        try {
                            const response = await fetch(`${TORN_API_BASE_URL}/faction/${currentUserFactionId}?selections=members&key=${userTornApiKey}`);
                            const data = await response.json();
                            if (data.members) {
                                displayFactionMembersInChatTab(data.members, friendsPanelContent);
                            } else {
                                friendsPanelContent.innerHTML = `<p style="text-align:center; padding: 10px; color: red;">Error: Could not retrieve faction members. Check API key or faction ID. ${data.error ? data.error.message : ''}</p>`;
                                console.error("Error fetching faction members:", data);
                            }
                        } catch (error) {
                            friendsPanelContent.innerHTML = `<p style="text-align:center; padding: 10px; color: red;">Network Error: Failed to fetch faction members.</p>`;
                            console.error("Network error fetching faction members:", error);
                        }
                    });
                }

                // NEW: Event Listener for Friend List Sub-Tab
                if (friendListSubTab) {
                    friendListSubTab.addEventListener('click', () => {
                        friendsPanel.querySelectorAll('.sub-tab-button').forEach(btn => btn.classList.remove('active'));
                        friendListSubTab.classList.add('active');
                        // Call the new function to populate the content area
                        populateFriendListTab(friendsPanelContent);
                    });
                }

                // NEW: Event Listener for Ignore List Sub-Tab
                if (ignoreListSubTab) {
                    ignoreListSubTab.addEventListener('click', () => {
                        friendsPanel.querySelectorAll('.sub-tab-button').forEach(btn => btn.classList.remove('active'));
                        ignoreListSubTab.classList.add('active');
                        // Call the new function to populate the content area
                        populateIgnoreListTab(friendsPanelContent);
                    });
                }


                // ---- CORE CHAT FUNCTIONS (Defined here to ensure scope for setupMessageSending) ----
                function displayChatMessage(messageObj, chatDisplayAreaId) {
                    const chatDisplayArea = document.getElementById(chatDisplayAreaId);
                    if (!chatDisplayArea) return;
                    const messageElement = document.createElement('div');
                    messageElement.classList.add('chat-message');
                    const timestamp = messageObj.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const senderName = messageObj.sender || 'Unknown';
                    const messageText = messageObj.text || '';
                    messageElement.innerHTML = `<span class="chat-timestamp">[${timestamp}]</span> <span class="chat-sender">${senderName}:</span> <span class="chat-text">${messageText}</span>`;
                    chatDisplayArea.appendChild(messageElement);
                    chatDisplayArea.scrollTop = chatDisplayArea.scrollHeight; // Auto-scroll to latest message
                }

                async function sendChatMessage(textInput, collectionType) {
                    if (!textInput || !auth.currentUser) {
                        console.warn("Cannot send message: User not authenticated.");
                        return;
                    }
                    const messageText = textInput.value.trim();
                    if (messageText === '') return;

                    let targetCollection = null;
                    let consoleLogPath = '';
                    let docIdForParent = null; 

                    if (collectionType === 'faction') {
                        if (currentUserFactionId) {
                            targetCollection = db.collection('factionChats').doc(currentUserFactionId).collection('messages');
                            consoleLogPath = `factionChats/${currentUserFactionId}/messages`;
                            docIdForParent = currentUserFactionId;
                        } else {
                            console.warn("Faction ID not available for current user. Cannot send faction chat message.");
                            alert("Faction ID not found. Please complete your profile to use faction chat.");
                            return;
                        }
                    } else if (collectionType === 'war') {
                        // Use the globally stored currentActiveRankedWarId
                        if (currentActiveRankedWarId) {
                            targetCollection = db.collection('warChats').doc(currentActiveRankedWarId).collection('messages');
                            consoleLogPath = `warChats/${currentActiveRankedWarId}/messages`;
                            docIdForParent = currentActiveRankedWarId;
                        } else {
                            console.warn("No active ranked war ID. Cannot send war chat message.");
                            alert("No active war chat available. Please wait for a war to start or check war settings.");
                            return;
                        }
                    } else if (collectionType === 'alliance') {
                        if (currentUserAllianceIds && currentUserAllianceIds.length > 0) {
                            const allianceIdToChatIn = currentUserAllianceIds[0];
                            targetCollection = db.collection('allianceChats').doc(allianceIdToChatIn).collection('messages');
                            consoleLogPath = `allianceChats/${allianceIdToChatIn}/messages`;
                            docIdForParent = allianceIdToChatIn;
                        } else {
                            console.warn("No Alliance ID available for current user. Cannot send alliance chat message.");
                            alert("No Alliance ID saved. Please go to Settings > Alliance Chat Settings and enter your alliance's ID to use this chat.");
                            return;
                        }
                    }

                    if (!targetCollection) {
                        console.error("No valid chat collection determined for sending message.");
                        return;
                    }

                    console.log(`Attempting to send message to ${consoleLogPath}`);

                    const messageObj = {
                        senderId: auth.currentUser.uid,
                        sender: currentTornUserName,
                        text: messageText,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    };
                    try {
                        // Ensure the parent document exists for faction/alliance/war chats if it's the first message
                        if (docIdForParent) {
                            const parentCollectionName = (collectionType === 'faction') ? 'factionChats' :
                                                         (collectionType === 'alliance') ? 'allianceChats' :
                                                         (collectionType === 'war') ? 'warChats' : null;

                            if (parentCollectionName) {
                                await db.collection(parentCollectionName).doc(docIdForParent).set({}, { merge: true }); // Empty merge to ensure existence
                            }
                        }

                        await targetCollection.add(messageObj);
                        textInput.value = ''; // Clear input field
                        textInput.focus(); // Keep focus on input field
                    } catch (error) {
                        console.error(`Error sending ${collectionType} message to Firebase:`, error);
                        alert(`Failed to send ${collectionType} message.`);
                    }
                }
                // END CORE CHAT FUNCTIONS
                
                // Initialize message sending handlers after the core functions are defined
                setupMessageSending(factionChatTextInput, factionChatSendBtn, 'faction');
                setupMessageSending(warChatTextInput, warChatSendBtn, 'war');
                setupMessageSending(allianceChatTextInput, allianceChatSendBtn, 'alliance');


            } else {
                console.error("global.js: Error: #chat-system-placeholder element not found for loading chat HTML.");
            }
        })
        .catch(error => console.error('global.js: Error loading global chat:', error));

    // ---- AUTHENTICATION LISTENER ----
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userProfileRef = db.collection('userProfiles').doc(user.uid);
            const doc = await userProfileRef.get();
            if (doc.exists) {
                const userData = doc.data();
                currentUserFactionId = String(userData.faction_id);
                currentTornUserName = userData.preferredName || 'Unknown';
                userTornApiKey = userData.tornApiKey;
                currentUserAllianceIds = userData.allianceIds || [];

                // Make globals accessible to functions outside this scope, especially for re-rendering
                window.currentUserFactionId = currentUserFactionId;
                window.userTornApiKey = userTornApiKey;
                window.TORN_API_BASE_URL = TORN_API_BASE_URL;
                window.currentUserAllianceIds = currentUserAllianceIds;

                console.log(`User logged in. Faction ID: ${currentUserFactionId}, Name: ${currentTornUserName}, API Key Present: ${!!userTornApiKey}, Alliance IDs: [${currentUserAllianceIds.join(', ')}]`);
            } else {
                console.warn("User profile not found for authenticated user:", user.uid);
                currentUserFactionId = null;
                userTornApiKey = null;
                currentUserAllianceIds = []; // Clear alliance IDs if profile not found
                // Clear globals on logout/missing profile
                window.currentUserFactionId = null;
                window.userTornApiKey = null;
                window.TORN_API_BASE_URL = null;
                window.currentUserAllianceIds = [];
            }
        } else {
            // User is signed out
            if (unsubscribeFromChat) unsubscribeFromChat();
            chatMessagesCollection = null;
            currentUserFactionId = null;
            userTornApiKey = null;
            currentUserAllianceIds = []; // Clear alliance IDs on logout
            // Clear globals on logout
            window.currentUserFactionId = null;
            window.userTornApiKey = null;
            window.TORN_API_BASE_URL = null;
            window.currentUserAllianceIds = [];

            const chatDisplayAreaFaction = document.getElementById('chat-display-area');
            const chatDisplayAreaWar = document.getElementById('war-chat-display-area');
            const chatDisplayAreaAlliance = document.getElementById('alliance-chat-display-area'); // NEW: Alliance Chat display area

            if (chatDisplayAreaFaction) chatDisplayAreaFaction.innerHTML = '<p>Please log in to use chat.</p>';
            if (chatDisplayAreaWar) chatDisplayAreaWar.innerHTML = '<p>Please log in to use war chat.</p>';
            if (chatDisplayAreaAlliance) chatDisplayAreaAlliance.innerHTML = '<p>Please log in to use alliance chat.</p>'; // NEW: Alliance Chat message
            console.log("User logged out. Chat functionalities are reset.");
        }
    });

    // NEW FUNCTION: Fetches active ranked war and sets up context for War Chat
    async function fetchAndSetWarChatContext() {
        const warChatTitle = document.getElementById('war-chat-title');
        const warFactionsDisplay = document.getElementById('war-factions-display');
        const warTimerDisplay = document.getElementById('war-timer-display');
        const warChatDisplayArea = document.getElementById('war-chat-display-area');

        // Reset display while loading
        if (warChatTitle) warChatTitle.textContent = "War Chat - Loading...";
        if (warFactionsDisplay) warFactionsDisplay.textContent = "Loading War Details...";
        if (warTimerDisplay) warTimerDisplay.textContent = "Time: N/A";
        if (warChatDisplayArea) warChatDisplayArea.innerHTML = `<p>Fetching war details...</p>`; // Clear existing messages/loading states

        currentActiveRankedWarId = null; // Reset
        currentActiveRankedWarData = null; // Reset

        if (!auth.currentUser || !userTornApiKey || !currentUserFactionId) {
            if (warChatTitle) warChatTitle.textContent = "War Chat - Login Required";
            if (warChatDisplayArea) warChatDisplayArea.innerHTML = `<p>Please log in and ensure your API key and faction ID are set in your profile.</p>`;
            return;
        }

        try {
            // Fetch active ranked wars for the current user's faction
            const warsApiUrl = `${TORN_API_BASE_URL}/faction/wars?key=${userTornApiKey}&comment=MyTornPA_WarChat_Info`;
            const response = await fetch(warsApiUrl);
            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(`Torn API Error: ${data.error?.error || response.statusText}`);
            }

            const nowInSeconds = Math.floor(Date.now() / 1000);
            let currentOrUpcomingWar = null;

            if (data.rankedwars && data.rankedwars.length > 0) {
                // Prioritize finding an *active* war (already started AND has an end time in the future)
                currentOrUpcomingWar = data.rankedwars.find(war => nowInSeconds >= war.start && war.end !== null && nowInSeconds < war.end);

                // If no truly active war, look for an *upcoming* war (start time in the future, end is null)
                // You might also add a check here like && war.start < (nowInSeconds + 24 * 3600) to only show wars
                // starting within the next 24 hours, to avoid showing very distant future wars.
                if (!currentOrUpcomingWar) {
                    currentOrUpcomingWar = data.rankedwars.find(war => nowInSeconds < war.start && war.end === null);
                }
            }

            if (currentOrUpcomingWar) {
                currentActiveRankedWarId = String(currentOrUpcomingWar.id);
                currentActiveRankedWarData = currentOrUpcomingWar;

                const yourFaction = currentOrUpcomingWar.factions.find(f => String(f.id) === String(currentUserFactionId));
                const opponentFaction = currentOrUpcomingWar.factions.find(f => String(f.id) !== String(currentUserFactionId));

                const yourFactionName = yourFaction?.name || "Your Faction";
                const opponentFactionName = opponentFaction?.name || "Opponent Faction";

                if (warFactionsDisplay) warFactionsDisplay.textContent = `${yourFactionName} vs ${opponentFactionName}`;

                // Set up real-time countdown for the war
                const updateWarTimer = () => {
                    const currentSecond = Math.floor(Date.now() / 1000);
                    let timeLeft = 0;
                    let timerText = "";

                    if (currentSecond < currentOrUpcomingWar.start) {
                        // War is upcoming
                        timeLeft = currentOrUpcomingWar.start - currentSecond;
                        timerText = `Starts in: ${formatDuration(timeLeft)}`;
                        if (warChatTitle) warChatTitle.textContent = "War Chat - Upcoming War";
                        warTimerDisplay.classList.remove('active-war', 'ended-war');
                        warTimerDisplay.classList.add('pending-war');
                    } else if (currentOrUpcomingWar.end === null || currentSecond < currentOrUpcomingWar.end) {
                        // War has started and is ongoing (either end is null, or it's before end)
                        if (currentOrUpcomingWar.end === null) {
                            timerText = `Ongoing (No End Time)`; // Can't calculate countdown for indefinite wars
                        } else {
                            timeLeft = currentOrUpcomingWar.end - currentSecond;
                            timerText = `Ends in: ${formatDuration(timeLeft)}`;
                        }
                        if (warChatTitle) warChatTitle.textContent = "War Chat - Active War!";
                        warTimerDisplay.classList.remove('pending-war', 'ended-war');
                        warTimerDisplay.classList.add('active-war');
                    } else {
                        // War has ended
                        timerText = `War Ended: ${formatDuration(currentSecond - currentOrUpcomingWar.end)} ago`;
                        if (warChatTitle) warChatTitle.textContent = "War Chat - Ended";
                        warTimerDisplay.classList.remove('active-war', 'pending-war');
                        warTimerDisplay.classList.add('ended-war');
                    }
                    
                    if (warTimerDisplay) warTimerDisplay.textContent = timerText;

                    // If war has clearly ended, clear the interval and refresh context
                    if (currentOrUpcomingWar.end !== null && currentSecond >= currentOrUpcomingWar.end) {
                        clearInterval(warChatTimerInterval); // Use the global variable
                        warChatTimerInterval = null; // Clear the global variable
                        fetchAndSetWarChatContext(); // Re-run to update to "No Active War" or next pending
                    }
                };

                // Clear any existing timer before setting a new one
                if (warChatTimerInterval) {
                    clearInterval(warChatTimerInterval);
                }
                updateWarTimer(); // Run immediately
                warChatTimerInterval = setInterval(updateWarTimer, 1000); // Set the global variable for assignment

            } else {
                if (warChatTitle) warChatTitle.textContent = "War Chat";
                if (warFactionsDisplay) warFactionsDisplay.textContent = "No active ranked war.";
                if (warTimerDisplay) warTimerDisplay.textContent = "";
                if (warChatDisplayArea) warChatDisplayArea.innerHTML = `<p>There is no active ranked war to display messages for.</p>`;
                if (warChatTimerInterval) { // Clear if no active war, but interval was somehow running
                    clearInterval(warChatTimerInterval);
                    warChatTimerInterval = null;
                }
            }

            // Now, establish the Firestore listener based on currentActiveRankedWarId
            if (currentActiveRankedWarId) {
                chatMessagesCollection = db.collection('warChats').doc(currentActiveRankedWarId).collection('messages');
                
                // IMPORTANT: Ensure the parent war document exists (e.g., for metadata)
                await db.collection('warChats').doc(currentActiveRankedWarId).set(
                    {
                        faction1Id: yourFaction?.id,
                        faction1Name: yourFaction?.name,
                        faction2Id: opponentFaction?.id,
                        faction2Name: opponentFaction?.name,
                        warStart: currentOrUpcomingWar?.start,
                        warEnd: currentOrUpcomingWar?.end,
                        warStatus: (nowInSeconds < currentOrUpcomingWar.start) ? 'pending' : ((currentOrUpcomingWar.end === null || nowInSeconds < currentOrUpcomingWar.end) ? 'active' : 'ended'),
                        // Add default settings or load from a central war config here
                        warChatEnabledForAll: true // Default to enabled, will be overridden by settings later
                    },
                    { merge: true }
                );

                unsubscribeFromChat = chatMessagesCollection
                    .orderBy('timestamp', 'asc')
                    .limitToLast(50)
                    .onSnapshot(snapshot => {
                        if (warChatDisplayArea) warChatDisplayArea.innerHTML = '';
                        if (snapshot.empty) {
                            if (warChatDisplayArea) warChatDisplayArea.innerHTML = `<p>No war messages yet. Be the first to say hello!</p>`;
                            return;
                        }
                        snapshot.forEach(doc => displayChatMessage(doc.data(), 'war-chat-display-area'));
                    }, error => {
                        console.error("Error listening to war chat messages:", error);
                        if (warChatDisplayArea) warChatDisplayArea.innerHTML = `<p style="color: red;">Error loading war messages: ${error.message}</p>`;
                    });
                console.log(`War chat real-time listener set up for war: ${currentActiveRankedWarId}`);
                
                // Add a scroll event listener for the war chat display area if needed for custom scroll indicators
                const scrollWrapper = document.getElementById('war-chat-display-area');
                if (scrollWrapper) {
                    // Example: scrollWrapper.addEventListener('scroll', someScrollHandlerFunction);
                }

            } else {
                chatMessagesCollection = null; // No active war, so no collection to listen to
                if (unsubscribeFromChat) unsubscribeFromChat(); // Unsubscribe if a previous listener was active
                console.log("No active ranked war found, war chat listener not set up.");
            }

        } catch (error) {
            console.error("Error fetching active ranked war for chat:", error);
            if (warChatTitle) warChatTitle.textContent = "War Chat - Error";
            if (warFactionsDisplay) warFactionsDisplay.textContent = "Could not fetch war details.";
            if (warTimerDisplay) warTimerDisplay.textContent = "Error";
            if (warChatDisplayArea) warChatDisplayArea.innerHTML = `<p style="color: red;">Failed to load war chat: ${error.message}</p>`;
            if (warChatTimerInterval) { // Clear if error but interval was somehow running
                clearInterval(warChatTimerInterval);
                warChatTimerInterval = null;
            }
            chatMessagesCollection = null;
            if (unsubscribeFromChat) unsubscribeFromChat();
        }
    }

    // Now, inside your existing setupChatRealtimeListener function, modify the 'war' case:
    function setupChatRealtimeListener(type) {
        // Clear previous listener first
        if (unsubscribeFromChat) {
            unsubscribeFromChat();
            unsubscribeFromChat = null; // Ensure it's explicitly null
            console.log("Unsubscribed from previous chat listener.");
        }
        // Also clear any active war chat timer if switching away from war chat
        if (warChatTimerInterval) {
            clearInterval(warChatTimerInterval);
            warChatTimerInterval = null;
            console.log("Cleared war chat timer interval.");
        }


        let chatDisplayArea = null; // Declare here so it's fresh for each type
        let collectionRef = null;
        let displayAreaId = '';
        let consoleLogPath = '';

        if (type === 'faction' && auth.currentUser) {
            if (currentUserFactionId) {
                collectionRef = db.collection('factionChats').doc(currentUserFactionId).collection('messages');
                displayAreaId = 'chat-display-area';
                consoleLogPath = `factionChats/${currentUserFactionId}/messages`;
            } else {
                chatDisplayArea = document.getElementById('chat-display-area');
                if (chatDisplayArea) chatDisplayArea.innerHTML = '<p>Faction ID not found for chat. Please ensure your profile is complete.</p>';
                console.warn("User has no faction ID to set up faction chat listener.");
                return;
            }
        } else if (type === 'war') {
            // For war chat, we need to first determine the active war.
            // fetchAndSetWarChatContext will handle setting up chatMessagesCollection and listener.
            fetchAndSetWarChatContext(); // This function does all the heavy lifting for war chat
            return; // Exit here, as the listener is set up within fetchAndSetWarChatContext
        } else if (type === 'alliance' && auth.currentUser) {
            // Use the first saved alliance ID for displaying messages
            if (currentUserAllianceIds && currentUserAllianceIds.length > 0) {
                const allianceIdToListenTo = currentUserAllianceIds[0];
                collectionRef = db.collection('allianceChats').doc(allianceIdToListenTo).collection('messages');
                displayAreaId = 'alliance-chat-display-area';
                consoleLogPath = `allianceChats/${allianceIdToListenTo}/messages`;
            } else {
                chatDisplayArea = document.getElementById('alliance-chat-display-area');
                if (chatDisplayArea) chatDisplayArea.innerHTML = "<p>No Alliance ID saved. Go to Settings to enter one.</p>";
                console.warn("User has no alliance ID to set up alliance chat listener.");
                return;
            }
        } else if (!auth.currentUser) { // If user is not logged in for any chat type
            const displayAreas = {
                'faction': 'chat-display-area',
                'war': 'war-chat-display-area',
                'alliance': 'alliance-chat-display-area'
            };
            chatDisplayArea = document.getElementById(displayAreas[type]);
            if (chatDisplayArea) chatDisplayArea.innerHTML = '<p>Please log in to use chat.</p>';
            console.warn(`User not logged in. Cannot set up ${type} chat listener.`);
            return;
        }

        // This block only executes for 'faction' or 'alliance' chat after their respective collectionRefs are set
        chatDisplayArea = document.getElementById(displayAreaId); // Re-get it, it might be set above
        if (chatDisplayArea) chatDisplayArea.innerHTML = `<p>Loading ${type} messages...</p>`;
        console.log(`Setting up ${type} chat listener for path: ${consoleLogPath}`);

        if (collectionRef) {
            unsubscribeFromChat = collectionRef.orderBy('timestamp', 'asc').limitToLast(50)
                .onSnapshot(snapshot => {
                    if (chatDisplayArea) chatDisplayArea.innerHTML = ''; // Clear previous messages
                    if (snapshot.empty) {
                        if (chatDisplayArea) chatDisplayArea.innerHTML = `<p>No ${type} messages yet.</p>`;
                        return;
                    }
                    snapshot.forEach(doc => displayChatMessage(doc.data(), displayAreaId));
                }, error => {
                    console.error(`Error listening to ${type} chat messages:`, error);
                    if (chatDisplayArea) chatDisplayArea.innerHTML = `<p style="color: red;">Error loading ${type} messages.</p>`;
                });
        }
    }
} // END of initializeGlobals function


// Run the main initialization function
initializeGlobals();