// This function will run when the script is loaded
function initializeGlobals() {
    // ---- Firebase Setup ----
    const db = firebase.firestore();
    const auth = firebase.auth();
    let chatMessagesCollection = null;
    let unsubscribeFromChat = null;
    let currentTornUserName = 'Unknown';

    // ---- Load the Footer ----
    fetch('globalfooter.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('footer-container').innerHTML = data;
        })
        .catch(error => console.error('Error loading global footer:', error));

    // ---- Load the Chat System ----
    fetch('globalchat.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('chat-system-placeholder').innerHTML = data;
            
            const chatBarCollapsed = document.getElementById('chat-bar-collapsed');
            const chatWindow = document.getElementById('chat-window');
            const chatMainTabsContainer = document.querySelector('.chat-main-tabs-container'); // This will now always be hidden when chat window is open
            
            // Get specific chat icons from the collapsed bar
            const openFactionChatIcon = document.getElementById('open-faction-chat-icon');
            const openWarChatIcon = document.getElementById('open-war-chat-icon');
            const openFriendsIcon = document.getElementById('open-friends-icon');
            const openNotificationsIcon = document.getElementById('open-notifications-icon');
            const openSettingsIcon = document.getElementById('open-settings-icon');

            // Get specific chat panels
            const factionChatPanel = document.getElementById('faction-chat-panel');
            const warChatPanel = document.getElementById('war-chat-panel');
            const friendsPanel = document.getElementById('friends-panel');
            const notificationsPanel = document.getElementById('notifications-panel');
            const settingsPanel = document.getElementById('settings-panel');

            // Get minimize buttons (newly added in HTML)
            const minimizeChatBtns = document.querySelectorAll('.minimize-chat-btn');

            // Get all chat panels and tabs for easy iteration (allTabs is now mostly for activating sub-tabs)
            const allPanels = document.querySelectorAll('.chat-panel');
            const allTabs = document.querySelectorAll('.chat-tab');

            // Input and send buttons for Faction Chat
            const factionChatTextInput = factionChatPanel.querySelector('.chat-text-input');
            const factionChatSendBtn = factionChatPanel.querySelector('.chat-send-btn');

            // Input and send buttons for War Chat (assuming they exist now in HTML)
            const warChatTextInput = warChatPanel.querySelector('.chat-text-input');
            const warChatSendBtn = warChatPanel.querySelector('.chat-send-btn');


            // --- Helper to open a specific chat panel and hide others ---
            function openChatPanel(panelToShow) {
                if (chatWindow) chatWindow.classList.remove('hidden');
                if (chatBarCollapsed) chatBarCollapsed.classList.add('hidden');
                if (chatMainTabsContainer) chatMainTabsContainer.classList.add('hidden'); // ALWAYS HIDE MAIN TABS HERE
                
                allPanels.forEach(p => p.classList.add('hidden')); // Hide all panels
                if (panelToShow) panelToShow.classList.remove('hidden'); // Show the target panel
            }

            // --- Event Listeners for Collapsed Chat Bar Icons ---

            // Faction Chat Icon Click
            if (openFactionChatIcon) {
                openFactionChatIcon.addEventListener('click', () => {
                    openChatPanel(factionChatPanel);
                    if (factionChatTextInput) factionChatTextInput.focus();
                    setupChatRealtimeListener('faction');
                });
            }

            // War Chat Icon Click
            if (openWarChatIcon) {
                openWarChatIcon.addEventListener('click', () => {
                    openChatPanel(warChatPanel);
                    if (warChatTextInput) warChatTextInput.focus();
                    setupChatRealtimeListener('war');
                });
            }

            // Friends Icon Click
            if (openFriendsIcon) {
                openFriendsIcon.addEventListener('click', () => {
                    openChatPanel(friendsPanel); // Show the friendsPanel
                    
                    // Activate the first sub-tab ('Recent Chats') within friends panel
                    const friendsSubTabs = friendsPanel.querySelectorAll('.friends-panel-subtabs .sub-tab-button');
                    const recentChatsSubTab = friendsPanel.querySelector('.sub-tab-button[data-subtab="recent-chats"]');
                    
                    friendsSubTabs.forEach(t => t.classList.remove('active'));
                    if (recentChatsSubTab) {
                        recentChatsSubTab.classList.add('active');
                        // You might want to trigger content loading for 'Recent Chats' here
                    }
                });
            }

            // Notifications Icon Click
            if (openNotificationsIcon) {
                openNotificationsIcon.addEventListener('click', () => {
                    openChatPanel(notificationsPanel);
                    // For Notification/Settings, they don't have sub-tabs or input area yet,
                    // so no need for further activation logic unless you add them.
                });
            }

            // Settings Icon Click
            if (openSettingsIcon) {
                openSettingsIcon.addEventListener('click', () => {
                    openChatPanel(settingsPanel);
                    // For Notification/Settings, they don't have sub-tabs or input area yet,
                    // so no need for further activation logic unless you add them.
                });
            }
            
            // --- Minimize Button Logic (for the new '-' buttons) ---
            minimizeChatBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    if (chatWindow) chatWindow.classList.add('hidden');
                    if (chatBarCollapsed) chatBarCollapsed.classList.remove('hidden');
                });
            });

            // --- Tab Switching Logic for main tabs ---
            // This section is now less relevant because the main tabs are always hidden
            // when the chat window is opened from the bottom bar.
            // However, if you have other ways of interacting with the main tabs,
            // this logic still ensures correct panel switching if those tabs become visible.
            allTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const targetPanelId = tab.dataset.tabTarget;
                    const targetPanel = document.getElementById(targetPanelId);

                    allTabs.forEach(t => t.classList.remove('active'));
                    allPanels.forEach(p => p.classList.add('hidden'));
                    tab.classList.add('active');
                    if (targetPanel) targetPanel.classList.remove('hidden');
                    
                    // This will also ensure sub-tab activation if Friends tab is clicked
                    if (targetPanelId === 'friends-panel') {
                        const friendsSubTabs = friendsPanel.querySelectorAll('.friends-panel-subtabs .sub-tab-button');
                        const recentChatsSubTab = friendsPanel.querySelector('.sub-tab-button[data-subtab="recent-chats"]');
                        friendsSubTabs.forEach(t => t.classList.remove('active'));
                        if (recentChatsSubTab) {
                            recentChatsSubTab.classList.add('active');
                            // You might also need to trigger content loading here
                        }
                    }
                });
            });

            // --- Send Message Logic (now applies to respective chat inputs) ---
            function setupMessageSending(textInput, sendBtn, collectionType) {
                if (sendBtn) {
                    sendBtn.onclick = async () => {
                        await sendChatMessage(textInput, collectionType);
                    };
                }
                if (textInput) {
                    textInput.onkeydown = async (event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            await sendChatMessage(textInput, collectionType);
                        }
                    };
                }
            }
            
            setupMessageSending(factionChatTextInput, factionChatSendBtn, 'faction');
            setupMessageSending(warChatTextInput, warChatSendBtn, 'war');

        })
        .catch(error => console.error('Error loading global chat:', error));

    // ---- AUTHENTICATION LISTENER ----
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userProfileRef = db.collection('userProfiles').doc(user.uid);
            const doc = await userProfileRef.get();
            if (doc.exists) {
                const userData = doc.data();
                const factionId = userData.faction_id;
                currentTornUserName = userData.preferredName || 'Unknown User';
            }
        } else {
            if (unsubscribeFromChat) unsubscribeFromChat();
            chatMessagesCollection = null;
            const chatDisplayAreaFaction = document.getElementById('chat-display-area');
            const chatDisplayAreaWar = document.getElementById('war-chat-display-area');

            if (chatDisplayAreaFaction) chatDisplayAreaFaction.innerHTML = '<p>Please log in to use chat.</p>';
            if (chatDisplayAreaWar) chatDisplayAreaWar.innerHTML = '<p>Please log in to use war chat.</p>';
        }
    });

    // ---- CORE CHAT FUNCTIONS ----
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
        chatDisplayArea.scrollTop = chatDisplayArea.scrollHeight;
    }

    async function sendChatMessage(textInput, collectionType) {
        if (!textInput || !auth.currentUser) return;
        const messageText = textInput.value.trim();
        if (messageText === '') return;
        
        let targetCollection = null;
        if (collectionType === 'faction' && auth.currentUser.uid) {
            const userProfileRef = db.collection('userProfiles').doc(auth.currentUser.uid);
            const doc = await userProfileRef.get();
            if (doc.exists && doc.data().faction_id) {
                targetCollection = db.collection('factionChats').doc(String(doc.data().faction_id)).collection('messages');
            } else {
                console.warn("Faction ID not found for current user. Cannot send faction chat message.");
                return;
            }
        } else if (collectionType === 'war') {
            targetCollection = db.collection('warChats').doc('currentWar').collection('messages');
        }

        if (!targetCollection) {
            console.error("No valid chat collection determined for sending message.");
            return;
        }

        const messageObj = {
            senderId: auth.currentUser.uid,
            sender: currentTornUserName,
            text: messageText,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        try {
            await targetCollection.add(messageObj);
            textInput.value = '';
            textInput.focus();
        } catch (error) {
            console.error(`Error sending ${collectionType} message to Firebase:`, error);
        }
    }

    function setupChatRealtimeListener(type) {
        let chatDisplayArea = null;
        let collectionRef = null;

        if (unsubscribeFromChat) unsubscribeFromChat();

        if (type === 'faction' && auth.currentUser) {
            db.collection('userProfiles').doc(auth.currentUser.uid).get().then(doc => {
                if (doc.exists && doc.data().faction_id) {
                    collectionRef = db.collection('factionChats').doc(String(doc.data().faction_id)).collection('messages');
                    chatDisplayArea = document.getElementById('chat-display-area');
                    if (chatDisplayArea) chatDisplayArea.innerHTML = '<p>Loading faction messages...</p>';
                    
                    if (collectionRef) {
                        unsubscribeFromChat = collectionRef.orderBy('timestamp', 'asc').limitToLast(50)
                            .onSnapshot(snapshot => {
                                if (chatDisplayArea) chatDisplayArea.innerHTML = '';
                                if (snapshot.empty) {
                                    if (chatDisplayArea) chatDisplayArea.innerHTML = `<p>No faction messages yet.</p>`;
                                    return;
                                }
                                snapshot.forEach(doc => displayChatMessage(doc.data(), 'chat-display-area'));
                            }, error => {
                                console.error("Error listening to faction chat messages:", error);
                                if (chatDisplayArea) chatDisplayArea.innerHTML = `<p style="color: red;">Error loading faction messages.</p>`;
                            });
                    }
                } else {
                    chatDisplayArea = document.getElementById('chat-display-area');
                    if (chatDisplayArea) chatDisplayArea.innerHTML = '<p>Faction ID not found for chat.</p>';
                }
            }).catch(error => {
                console.error("Error fetching user profile for faction chat:", error);
                chatDisplayArea = document.getElementById('chat-display-area');
                if (chatDisplayArea) chatDisplayArea.innerHTML = `<p style="color: red;">Error accessing faction chat.</p>`;
            });

        } else if (type === 'war') {
            collectionRef = db.collection('warChats').doc('currentWar').collection('messages');
            chatDisplayArea = document.getElementById('war-chat-display-area');
            if (chatDisplayArea) chatDisplayArea.innerHTML = '<p>Loading war messages...</p>';

            if (collectionRef) {
                unsubscribeFromChat = collectionRef.orderBy('timestamp', 'asc').limitToLast(50)
                    .onSnapshot(snapshot => {
                        if (chatDisplayArea) chatDisplayArea.innerHTML = '';
                        if (snapshot.empty) {
                            if (chatDisplayArea) chatDisplayArea.innerHTML = `<p>No war messages yet.</p>`;
                            return;
                        }
                        snapshot.forEach(doc => displayChatMessage(doc.data(), 'war-chat-display-area'));
                    }, error => {
                        console.error("Error listening to war chat messages:", error);
                        if (chatDisplayArea) chatDisplayArea.innerHTML = `<p style="color: red;">Error loading war messages.</p>`;
                    });
            }

        } else {
            console.warn("Unknown chat type or user not logged in for real-time listener.");
        }
    }
}

// Run the main initialization function
initializeGlobals();

// MODIFIED: handleChatTabClick to manage new chat-panel structure
function handleChatTabClick(event) {
    const clickedTabButton = event.currentTarget;
    const targetPanelId = clickedTabButton.dataset.tabTarget; // e.g., 'faction-chat-panel'

    console.log(`[Chat Tab Debug] Clicked main chat tab: ${targetPanelId}`);

    // Remove 'active' from all main chat tab buttons and panels
    chatTabButtons.forEach(button => button.classList.remove('active'));
    chatPanels.forEach(panel => panel.classList.remove('active'));
    chatPanels.forEach(panel => panel.classList.add('hidden')); // Ensure all panels are hidden by default

    // Add 'active' to the clicked tab button and show its corresponding panel
    clickedTabButton.classList.add('active');
    const targetPanel = document.getElementById(targetPanelId);
    if (targetPanel) {
        targetPanel.classList.remove('hidden');
        targetPanel.classList.add('active');
    } else {
        console.error(`HTML Error: Chat panel with ID '${targetPanelId}' not found.`);
        return;
    }

    // Unsubscribe from any active real-time chat listener (faction or private)
    if (unsubscribeFromChat) {
        unsubscribeFromChat();
        unsubscribeFromChat = null;
        console.log("Unsubscribed from previous faction chat listener (main tab switch).");
    }
    if (unsubscribeFromPrivateChat) { // NEW: Unsubscribe from private chat listener
        unsubscribeFromPrivateChat();
        unsubscribeFromPrivateChat = null;
        console.log("Unsubscribed from previous private chat listener (main tab switch).");
    }

    // Configure specific panels
    switch (targetPanelId) {
        case 'faction-chat-panel':
            // The faction-chat-panel already has its own specific chat-display-area and chat-input-area
            const factionChatDisplayArea = targetPanel.querySelector('.chat-messages-scroll-wrapper');
            if (factionChatDisplayArea) {
                factionChatDisplayArea.innerHTML = '<p>Loading Faction Chat messages...</p>';
            }
            setupChatRealtimeListener(); // This will populate factionChatDisplayArea
            break;

        case 'war-chat-panel':
            const warChatDisplayArea = targetPanel.querySelector('.chat-messages-scroll-wrapper');
            if (warChatDisplayArea) {
                warChatDisplayArea.innerHTML = `<p>Welcome to War Chat!</p><p>Functionality not implemented yet.</p>`;
            }
            break;

        case 'friends-panel':
            // When switching to the friends panel, default to the "Recent Chats" sub-tab
            // and clear its content, then trigger its logic.
            friendsPanelContent.innerHTML = '<p style="text-align: center; color: #888; padding-top: 20px;">Loading friends content...</p>';
            const defaultFriendsSubTabButton = document.querySelector('.sub-tab-button[data-subtab="recent-chats"]');
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
                    <div class="notification-section site-notifications">
                        <h4>Site Notifications 🌐</h4>
                        <div class="notification-list" id="site-notification-list">
                            <p>No new site notifications.</p>
                        </div>
                    </div>
                    <div class="notification-section friend-notifications">
                        <h4>Friend Notifications 👥</h4>
                        <div class="notification-list" id="friend-notification-list">
                            <p>No new friend notifications.</p>
                        </div>
                    </div>
                    <div class="notification-section general-notifications">
                        <h4>Other Notifications 🔔</h4>
                        <div class="notification-list" id="general-notification-list">
                            <p>No other notifications.</p>
                        </div>
                    </div>
                `;
            }
            break;

        case 'settings-panel':
            setupSettingsPanel(); // This will load, display, and attach listeners for settings
            break;

        default:
            console.warn(`Unknown chat panel: ${targetPanelId}`);
            targetPanel.innerHTML = `<p style="color: red;">Error: Unknown chat panel selected.</p>`;
            break;
    }

    // Adjust visibility of the general chat input area based on the active main chat panel.
    // Assuming only faction/war chat panels have internal input areas that are always shown
    // when their panel is active. Other panels manage their own inputs or don't need one.
    // The previous global `chatInputArea` might not be directly used anymore if inputs are internal.
    // If chatTextInput/chatSendBtn refer to the faction chat's internal inputs, they'll be visible
    // when faction-chat-panel is active.
}

// NEW FUNCTION: Handles clicks on sub-tabs within the Friends panel
async function handleFriendsSubTabClick(event) {
    const clickedSubTabButton = event.currentTarget;
    const targetSubTab = clickedSubTabButton.dataset.subtab;

    console.log(`[Friends Sub-tab Debug] Clicked sub-tab: ${targetSubTab}`);

    // Remove 'active' class from all sub-tab buttons
    friendsSubTabButtons.forEach(button => {
        button.classList.remove('active');
    });
    // Add 'active' class to the clicked sub-tab button
    clickedSubTabButton.classList.add('active');

    // Clear the content area
    if (friendsPanelContent) {
        friendsPanelContent.innerHTML = '';
    } else {
        console.error("HTML Error: friendsPanelContent not found.");
        return;
    }

    // Unsubscribe from private chat listener if active when switching sub-tabs
    if (unsubscribeFromPrivateChat) {
        unsubscribeFromPrivateChat();
        unsubscribeFromPrivateChat = null;
        console.log("Unsubscribed from previous private chat listener (sub-tab switch).");
    }

    switch (targetSubTab) {
        case 'recent-chats':
            friendsPanelContent.innerHTML = `
                <div id="privateChatFullLayout" class="private-chat-tab-content">
                    <div class="private-chat-layout-panels">
                        <div class="recent-chats-panel">
                            <div class="panel-header">Recent Chats</div>
                            <div class="recent-chats-list-scroll-wrapper">
                                <ul id="recentChatsList" class="recent-chats-list">
                                    <li class="chat-item loading-message">Loading recent chats...</li>
                                </ul>
                            </div>
                        </div>
                        <div class="selected-chat-panel">
                            <div id="selectedChatHeader" class="panel-header">Select a Chat</div>
                            <div class="selected-chat-messages-scroll-wrapper">
                                <div id="selectedChatDisplay" class="chat-display-area">
                                    <p class="message-placeholder">Click a chat on the left to start messaging.</p>
                                </div>
                            </div>
                            <div class="selected-chat-input-area">
                                <input type="text" id="privateChatMessageInput" class="chat-text-input" placeholder="Type your private message...">
                                <button id="sendPrivateMessageBtn" class="chat-send-btn">Send</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            // Initialize private chat listeners and load recent chats after HTML is injected
            setTimeout(() => {
                initPrivateChatTabEventListeners(); // This will call loadRecentChats()
            }, 0);
            break;

        case 'recently-met':
            populateRecentlyMetTab(friendsPanelContent);
            break;

        case 'faction-members':
            friendsPanelContent.innerHTML = `<h3>Faction Members</h3><p>Loading faction member data...</p>`;
            if (factionApiFullData && factionApiFullData.members) {
                displayFactionMembersInChatTab(factionApiFullData.members, friendsPanelContent);
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
                                    <th>Name (ID)</th>
                                    <th>Last Action</th>
                                    <th>Str</th>
                                    <th>Dex</th>
                                    <th>Spd</th>
                                    <th>Def</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Nerve</th>
                                    <th>Energy</th>
                                    <th>Drug CD</th>
                                    <th>Revivable</th>
                                </tr>
                            </thead>
                            <tbody id="friends-tbody">
                                <tr><td colspan="12" style="text-align:center; padding: 20px;">Loading your friends...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
             `;
            // Attach event listener for the new Add Friend button (dynamically created)
            const newAddFriendBtn = friendsPanelContent.querySelector('#addFriendBtn');
            const newAddFriendIdInput = friendsPanelContent.querySelector('#addFriendIdInput');
            const newAddFriendStatus = friendsPanelContent.querySelector('#addFriendStatus');

            if (newAddFriendBtn) {
                newAddFriendBtn.addEventListener('click', async () => {
                    const friendId = newAddFriendIdInput.value.trim();
                    await addFriendLogic(friendId, newAddFriendIdInput, newAddFriendBtn, newAddFriendStatus);
                });
            }
            // Populate the friend list table
            if (auth.currentUser && userApiKey) {
                updateFriendlyMembersTable(userApiKey, auth.currentUser.uid);
            } else {
                 friendsPanelContent.querySelector('#friends-tbody').innerHTML = '<tr><td colspan="12" style="text-align:center; color: yellow;">Please log in to view friend stats.</td></tr>';
            }
            break;

        case 'ignore-list':
            friendsPanelContent.innerHTML = `
                <div class="blocked-people-layout">
                    <div class="friends-list-section"> <div class="header-box">
                            <b>Add to Ignore List</b>
                        </div>
                        <div class="search-bar">
                            <input type="text" id="addIgnoreInput" placeholder="Add Profile/Faction ID">
                            <span class="search-icon add-ignore-icon" title="Add to Ignore">➕</span>
                        </div>
                    </div>
                    <div class="ignores-list-section">
                        <div class="header-box">
                            <b>Your Ignore List</b>
                        </div>
                        <div id="ignoresScrollableList" class="scrollable-list">
                            <p style="text-align:center; padding: 10px;">Loading ignores...</p>
                        </div>
                    </div>
                </div>
            `;
            // Populate dummy ignores or actual ones if you implement ignore list persistence
            populateDummyIgnores(friendsPanelContent.querySelector('#ignoresScrollableList')); // Assuming you have generateDummyIgnores
            // Add event listener for adding ignores (if implemented)
            const addIgnoreInput = friendsPanelContent.querySelector('#addIgnoreInput');
            const addIgnoreIcon = friendsPanelContent.querySelector('.add-ignore-icon');
            if (addIgnoreIcon) {
                addIgnoreIcon.addEventListener('click', () => {
                    // Implement add to ignore logic here, similar to addFriendLogic
                    alert('Add ignore functionality to be implemented!');
                    console.log('Attempting to add ignore:', addIgnoreInput.value);
                });
            }
            break;

        default:
            console.warn(`Unknown friends sub-tab: ${targetSubTab}`);
            friendsPanelContent.innerHTML = `<p style="color: red;">Error: Unknown sub-tab selected.</p>`;
            break;
    }
}

// NEW FUNCTION: Helper to encapsulate add friend logic for dynamic buttons
async function addFriendLogic(friendId, inputElement, buttonElement, statusElement) {
    if (!friendId) {
        statusElement.textContent = "Please enter a Torn Player ID.";
        statusElement.style.color = 'orange';
        return;
    }

    if (!auth.currentUser) {
        statusElement.textContent = "You must be logged in to add friends.";
        statusElement.style.color = 'red';
        return;
    }

    statusElement.textContent = "Adding friend...";
    statusElement.style.color = 'white';
    buttonElement.disabled = true;

    try {
        const friendDocRef = db.collection('userProfiles').doc(auth.currentUser.uid).collection('friends').doc(friendId);
        const doc = await friendDocRef.get();
        if (doc.exists) {
            statusElement.textContent = "This player is already your friend.";
            statusElement.style.color = 'orange';
            return;
        }

        await friendDocRef.set({
            addedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        statusElement.textContent = `Successfully added friend [${friendId}]!`;
        statusElement.style.color = 'lightgreen';
        inputElement.value = '';

        // Refresh the friend list tab if it's currently open
        const friendsListTableBody = document.getElementById('friends-tbody');
        if (friendsListTableBody && auth.currentUser && userApiKey) {
            updateFriendlyMembersTable(userApiKey, auth.currentUser.uid); // Your existing function
        }

    } catch (error) {
        console.error("Error adding friend:", error);
        statusElement.textContent = `Error adding friend: ${error.message}`;
        statusElement.style.color = 'red';
    } finally {
        buttonElement.disabled = false;
        setTimeout(() => { statusElement.textContent = ''; }, 3000); // Clear status after a few seconds
    }
}

// MODIFIED: sendClaimChatMessage (no functional change, but ensure it's here)
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

// MODIFIED: displayPrivateChatMessage (now receives a displayElement)
function displayPrivateChatMessage(messageObj, displayElement, isMyMessage) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message');
    messageElement.classList.add(isMyMessage ? 'user-message' : 'bot-message');

    const timestamp = messageObj.timestamp && typeof messageObj.timestamp.toDate === 'function'
        ? messageObj.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const senderName = messageObj.sender || 'Unknown';
    const messageText = messageObj.text || '';

    messageElement.innerHTML = `
        <span class="chat-timestamp">[${timestamp}]</span>
        <span class="chat-sender">${senderName}:</span>
        <span class="chat-text">${messageText}</span>
    `;
    displayElement.appendChild(messageElement);
}

// MODIFIED: sendPrivateChatMessage (now uses element IDs relative to the dynamically injected private chat layout)
async function sendPrivateChatMessage() {
    console.log("[Private Chat Send] --- START: Attempting to send message ---");

    // Get references dynamically as they are injected with the recent-chats sub-tab
    const privateChatMessageInputEl = friendsPanelContent.querySelector('#privateChatMessageInput');
    const selectedChatDisplayEl = friendsPanelContent.querySelector('#selectedChatDisplay');

    if (!privateChatMessageInputEl || !selectedChatDisplayEl || !auth.currentUser || !userApiKey || !currentSelectedPrivateChatId) {
        console.warn("[Private Chat Send] Cannot send private message: Missing input field, logged-in user, API key, or no private chat selected.");
        console.log("[Private Chat Send] --- END (Warning): Missing prerequisites ---");
        return;
    }

    const messageText = privateChatMessageInputEl.value.trim();
    if (messageText === '') {
        console.log("[Private Chat Send] --- END (Info): Empty message, not sending ---");
        return;
    }

    console.log("[Private Chat Send] Message text is not empty. Proceeding.");

    const currentUserUid = auth.currentUser.uid;
    const senderName = currentTornUserName;
    const chatDocId = currentSelectedPrivateChatId;

    const filteredMessage = typeof filterProfanity === 'function' ? filterProfanity(messageText) : messageText;

    const messageObj = {
        senderId: currentUserUid,
        sender: senderName,
        text: filteredMessage,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        const friendId = chatDocId.replace(`private_${currentUserUid}_`, '').replace(`private_`, ''); // Extract friend's UID
        const participants = [currentUserUid, friendId].sort();

        console.log("[Private Chat Send] Ensuring parent chat document:", chatDocId, "with participants:", participants);
        await db.collection('privateChatMessages').doc(chatDocId).set(
            { participants: participants, lastMessageAt: firebase.firestore.FieldValue.serverTimestamp() },
            { merge: true }
        );
        console.log(`[Private Chat Send] Successfully ensured parent chat document ${chatDocId} exists.`);

        console.log("[Private Chat Send] Adding message to subcollection...");
        await db.collection('privateChatMessages').doc(chatDocId).collection('messages').add(messageObj);
        console.log("[Private Chat Send] Private message sent to Firebase:", messageObj);

        privateChatMessageInputEl.value = '';
        privateChatMessageInputEl.focus();

        console.log("[Private Chat Send] --- END: Message sent successfully ---");
        
    } catch (error) {
        console.error("[Private Chat Send] Error sending private message to Firebase:", error);
        alert("Failed to send private message. Please check the console for details.");
        console.log("[Private Chat Send] --- END (Error): Message sending failed ---");
    }
}

// MODIFIED: handlePrivateChatInputKeydown (no functional change, but included for completeness)
function handlePrivateChatInputKeydown(event) {
    console.log("[Private Chat Keydown] Keydown event detected. Key:", event.key);
    if (event.key === 'Enter') {
        event.preventDefault();
        sendPrivateChatMessage();
        console.log("[Private Chat Keydown] Enter key pressed. Calling sendPrivateChatMessage.");
    }
}

// MODIFIED: selectPrivateChat (now uses element IDs relative to the dynamically injected private chat layout)
async function selectPrivateChat(friendIdTorn) {
    if (!auth.currentUser || !userApiKey) {
        console.warn("User not logged in or API key missing. Cannot select private chat.");
        const selectedChatHeaderEl = friendsPanelContent.querySelector('#selectedChatHeader');
        const selectedChatDisplayEl = friendsPanelContent.querySelector('#selectedChatDisplay');
        if (selectedChatHeaderEl) selectedChatHeaderEl.textContent = "Chat Unavailable";
        if (selectedChatDisplayEl) selectedChatDisplayEl.innerHTML = `<p class="message-placeholder" style="color: yellow;">Please log in to use private chat.</p>`;
        const privateChatMessageInputEl = friendsPanelContent.querySelector('#privateChatMessageInput');
        const sendPrivateMessageBtnEl = friendsPanelContent.querySelector('#sendPrivateMessageBtn');
        if (privateChatMessageInputEl) privateChatMessageInputEl.disabled = true;
        if (sendPrivateMessageBtnEl) sendPrivateMessageBtnEl.disabled = true;
        return;
    }
    const currentUserIdFirebase = auth.currentUser.uid;

    let friendFirebaseUid = null;
    let friendName = `User ID: ${friendIdTorn}`;

    try {
        const userProfilesSnapshot = await db.collection('userProfiles').where('tornProfileId', '==', friendIdTorn).limit(1).get();

        if (!userProfilesSnapshot.empty) {
            friendFirebaseUid = userProfilesSnapshot.docs[0].id;
            const friendProfileData = userProfilesSnapshot.docs[0].data();
            friendName = friendProfileData.preferredName || friendProfileData.name || friendName;
            console.log(`[Private Chat] Found friend's Firebase UID: ${friendFirebaseUid} for Torn ID: ${friendIdTorn}`);
        } else {
            const selectedChatHeaderEl = friendsPanelContent.querySelector('#selectedChatHeader');
            const selectedChatDisplayEl = friendsPanelContent.querySelector('#selectedChatDisplay');
            if (selectedChatHeaderEl) selectedChatHeaderEl.textContent = `Chat with Unknown User (${friendIdTorn})`;
            if (selectedChatDisplayEl) selectedChatDisplayEl.innerHTML = `<p class="message-placeholder" style="color: red;">Error: User with Torn ID ${friendIdTorn} is not a registered user of this app. Private chat is only available between registered users.</p>`;
            const privateChatMessageInputEl = friendsPanelContent.querySelector('#privateChatMessageInput');
            const sendPrivateMessageBtnEl = friendsPanelContent.querySelector('#sendPrivateMessageBtn');
            if (privateChatMessageInputEl) privateChatMessageInputEl.disabled = true;
            if (sendPrivateMessageBtnEl) sendPrivateMessageBtnEl.disabled = true;
            return;
        }
    } catch (error) {
        console.error("Error fetching friend's Firebase UID or name for private chat:", error);
        const selectedChatHeaderEl = friendsPanelContent.querySelector('#selectedChatHeader');
        const selectedChatDisplayEl = friendsPanelContent.querySelector('#selectedChatDisplay');
        if (selectedChatHeaderEl) selectedChatHeaderEl.textContent = `Chat with Error (${friendIdTorn})`;
        if (selectedChatDisplayEl) selectedChatDisplayEl.innerHTML = `<p class="message-placeholder" style="color: red;">Error: Could not retrieve friend details for private chat. ${error.message}</p>`;
        const privateChatMessageInputEl = friendsPanelContent.querySelector('#privateChatMessageInput');
        const sendPrivateMessageBtnEl = friendsPanelContent.querySelector('#sendPrivateMessageBtn');
        if (privateChatMessageInputEl) privateChatMessageInputEl.disabled = true;
        if (sendPrivateMessageBtnEl) sendPrivateMessageBtnEl.disabled = true;
        return;
    }

    const recentChatsListEl = friendsPanelContent.querySelector('#recentChatsList');
    const selectedChatHeaderEl = friendsPanelContent.querySelector('#selectedChatHeader');
    const selectedChatDisplayEl = friendsPanelContent.querySelector('#selectedChatDisplay');
    const privateChatMessageInputEl = friendsPanelContent.querySelector('#privateChatMessageInput');
    const sendPrivateMessageBtnEl = friendsPanelContent.querySelector('#sendPrivateMessageBtn');

    if (!recentChatsListEl || !selectedChatHeaderEl || !selectedChatDisplayEl || !privateChatMessageInputEl || !sendPrivateMessageBtnEl) {
        console.error("Private chat UI elements not found after sub-tab switch. Ensure handleFriendsSubTabClick injected them correctly.");
        return;
    }

    recentChatsListEl.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active-chat');
    });
    const selectedChatItem = recentChatsListEl.querySelector(`.chat-item[data-friend-id="${friendIdTorn}"]`);
    if (selectedChatItem) {
        selectedChatItem.classList.add('active-chat');
    }

    selectedChatHeaderEl.textContent = `Chat with ${friendName}`;

    const participants = [currentUserIdFirebase, friendFirebaseUid].sort();
    const chatDocId = `private_${participants[0]}_${participants[1]}`;
    currentSelectedPrivateChatId = chatDocId;

    console.log(`[Private Chat Debug] Attempting to open chat: ${chatDocId}`);
    console.log(`[Private Chat Debug] Your Firebase UID: ${currentUserIdFirebase}`);
    console.log(`[Private Chat Debug] Friend's Firebase UID: ${friendFirebaseUid}`);
    console.log(`[Private Chat Debug] Participants array for doc: ${participants}`);

    try {
        await db.collection('privateChatMessages').doc(chatDocId).set(
            { participants: participants, createdAt: firebase.firestore.FieldValue.serverTimestamp() },
            { merge: true }
        );
        console.log(`[Private Chat Debug] Successfully attempted to set parent chat document.`);
    } catch (error) {
        console.error("[Private Chat] Error ensuring parent chat document existence before listening:", error);
        selectedChatHeaderEl.textContent = `Error: Cannot initialize chat`;
        selectedChatDisplayEl.innerHTML = `<p class="message-placeholder" style="color: red;">Failed to set up chat. Permissions error: ${error.message}. Check console.</p>`;
        privateChatMessageInputEl.disabled = true;
        sendPrivateMessageBtnEl.disabled = true;
        return;
    }

    // Unsubscribe from previous private chat listener if switching conversations
    if (unsubscribeFromPrivateChat) {
        unsubscribeFromPrivateChat();
        unsubscribeFromPrivateChat = null;
    }

    selectedChatDisplayEl.innerHTML = '<p class="message-placeholder">Loading messages...</p>';

    const privateChatMessagesCollectionRef = db.collection('privateChatMessages').doc(chatDocId).collection('messages');

    unsubscribeFromPrivateChat = privateChatMessagesCollectionRef // Assign to new private chat unsubscribe variable
        .orderBy('timestamp', 'asc')
        .limit(100)
        .onSnapshot(snapshot => {
            selectedChatDisplayEl.innerHTML = '';

            if (snapshot.empty) {
                selectedChatDisplayEl.innerHTML = `<p class="message-placeholder">No messages yet. Be the first to say hello to ${friendName}!</p>`;
            } else {
                snapshot.forEach(doc => {
                    const messageData = doc.data();
                    const isMyMessage = messageData.senderId === currentUserIdFirebase;
                    displayPrivateChatMessage(messageData, selectedChatDisplayEl, isMyMessage);
                });
            }

            // --- FIX FOR PRIVATE CHAT SCROLLING ---
            // This is the same patient scrolling logic from the main chat fix.
            setTimeout(() => {
                if (!selectedChatDisplayEl) return;

                if (selectedChatDisplayEl.scrollHeight > 0) {
                    selectedChatDisplayEl.scrollTop = selectedChatDisplayEl.scrollHeight;
                } else {
                    let attempts = 0;
                    const scrollCheckInterval = setInterval(() => {
                        attempts++;
                        if (selectedChatDisplayEl.scrollHeight > 0 || attempts > 20) {
                            selectedChatDisplayEl.scrollTop = selectedChatDisplayEl.scrollHeight;
                            clearInterval(scrollCheckInterval);
                        }
                    }, 100);
                }
            }, 0);
              // --- END FIX ---

        }, error => {
            console.error("Error listening to private chat messages:", error);
            selectedChatDisplayEl.innerHTML = `<p class="message-placeholder" style="color: red;">Error loading chat: ${error.message}</p>`;
        });
    
    privateChatMessageInputEl.disabled = false;
    sendPrivateMessageBtnEl.disabled = false;
    privateChatMessageInputEl.focus();
}

// MODIFIED: initPrivateChatTabEventListeners (now gets elements from friendsPanelContent)
// Function to initialize event listeners specific to the Private Chat tab's elements
function initPrivateChatTabEventListeners() {
    console.log("[Private Chat Init] --- START: Initializing event listeners ---");

    // Get references dynamically after they've been injected
    const privateChatMessageInputEl = friendsPanelContent.querySelector('#privateChatMessageInput');
    const sendPrivateMessageBtnEl = friendsPanelContent.querySelector('#sendPrivateMessageBtn');
    const recentChatsListEl = friendsPanelContent.querySelector('#recentChatsList'); // Needed for click listener

    console.log("[Private Chat Init] Input element found:", privateChatMessageInputEl);
    console.log("[Private Chat Init] Send button found:", sendPrivateMessageBtnEl);
    console.log("[Private Chat Init] Recent chats list found:", recentChatsListEl);


    if (!privateChatMessageInputEl || !sendPrivateMessageBtnEl || !recentChatsListEl) {
        console.error("Private chat input/send/list elements not found for event listeners. Check HTML injection and timing.");
        console.log("[Private Chat Init] --- END (Error): Elements not found ---");
        return;
    }

    sendPrivateMessageBtnEl.removeEventListener('click', sendPrivateChatMessage);
    sendPrivateMessageBtnEl.addEventListener('click', sendPrivateChatMessage);
    console.log("[Private Chat Init] Send button listener attached.");

    privateChatMessageInputEl.removeEventListener('keydown', handlePrivateChatInputKeydown);
    privateChatMessageInputEl.addEventListener('keydown', handlePrivateChatInputKeydown);
    console.log("[Private Chat Init] Input keydown listener attached.");

    // NEW: Event listener for clicking on recent chat items
    // Removed existing anonymous listener from loadRecentChats to handle here once.
    recentChatsListEl.removeEventListener('click', handleRecentChatClick); // Ensure no duplicate listeners
    recentChatsListEl.addEventListener('click', handleRecentChatClick);
    console.log("[Private Chat Init] Recent chats list click listener attached.");


    console.log("[Private Chat Init] --- END: Listeners initialized successfully ---");

    // --- NEW: Call loadRecentChats() here to populate the left panel ---
    loadRecentChats();
}

// NEW FUNCTION: Centralized click handler for recent chat items (to allow re-attachment)
async function handleRecentChatClick(event) {
    const chatItem = event.target.closest('.chat-item');
    if (!chatItem) return;

    if (event.target.closest('.delete-chat-btn')) {
        const chatDocIdToDelete = chatItem.dataset.chatDocId;
        const friendName = chatItem.querySelector('.chat-info .chat-name').textContent; // Adjusted selector
        const userConfirmed = await showCustomConfirm(`Are you sure you want to delete the chat with ${friendName}?`, "Confirm Chat Deletion");
        if (userConfirmed) {
            if (typeof deletePrivateChat === 'function') {
                deletePrivateChat(chatDocIdToDelete, chatItem.dataset.friendId);
            }
        }
        return;
    }

    const selectedFriendIdTorn = chatItem.dataset.friendId;
    if (selectedFriendIdTorn) {
        selectPrivateChat(selectedFriendIdTorn);
    }
}


// MODIFIED: loadRecentChats (now populates into friendsPanelContent)
async function loadRecentChats() {
    console.log("[Recent Chats] Loading recent chats list.");

    const recentChatsListEl = friendsPanelContent.querySelector('#recentChatsList'); // Get from new location
    if (!recentChatsListEl) {
        console.error("Recent chats list element not found. Cannot load recent chats.");
        return;
    }

    recentChatsListEl.innerHTML = '<li class="chat-item loading-message">Loading your recent chats...</li>';

    if (!auth.currentUser) {
        recentChatsListEl.innerHTML = '<li class="chat-item message-placeholder" style="color: yellow;">Please log in to see your private chats.</li>';
        return;
    }
    const currentUserIdFirebase = auth.currentUser.uid;

    try {
        const chatsSnapshot = await db.collection('privateChatMessages')
            .where('participants', 'array-contains', currentUserIdFirebase)
            .orderBy('lastMessageAt', 'desc')
            .limit(20)
            .get();

        if (chatsSnapshot.empty) {
            recentChatsListEl.innerHTML = '<li class="chat-item message-placeholder">No recent private chats. Start one by messaging a friend!</li>';
            return;
        }

        const friendDetailsPromises = [];

        for (const chatDoc of chatsSnapshot.docs) {
            const chatDocId = chatDoc.id;
            const chatData = chatDoc.data();
            const otherParticipantFirebaseUid = chatData.participants.find(uid => uid !== currentUserIdFirebase);
            
            if (!otherParticipantFirebaseUid) continue;

            friendDetailsPromises.push(
                db.collection('userProfiles').doc(otherParticipantFirebaseUid).get().then(userProfileDoc => {
                    if (!userProfileDoc.exists) {
                        console.warn(`[Recent Chats] User profile not found for UID: ${otherParticipantFirebaseUid}. Skipping.`);
                        return null;
                    }

                    const profileData = userProfileDoc.data();
                    const friendTornId = profileData.tornProfileId;
                    let friendName = profileData.preferredName || profileData.name || `User ID ${friendTornId}`;

                    if (!friendTornId) {
                        console.warn(`[Recent Chats] User profile for ${friendName} is missing a Torn ID. Skipping.`);
                        return null;
                    }

                    return db.collection('users').doc(String(friendTornId)).get().then(userDoc => {
                        let friendProfileImage = '../../images/default_profile_icon.png';
                        if (userDoc.exists) {
                            friendProfileImage = userDoc.data().profile_image || friendProfileImage;
                        } else {
                            console.warn(`[Recent Chats] No document found in 'users' collection for Torn ID: ${friendTornId}. Using default image.`);
                        }
                        
                        return { friendFirebaseUid: otherParticipantFirebaseUid, friendName, friendProfileImage, chatDocId, friendTornId };
                    });
                }).catch(error => {
                    console.error(`Error fetching details for chat participant ${otherParticipantFirebaseUid}:`, error);
                    return null;
                })
            );
        }

        const resolvedFriendDetails = await Promise.all(friendDetailsPromises);
        
        const validChatsToDisplay = resolvedFriendDetails.filter(detail => detail !== null);

        if (validChatsToDisplay.length === 0) {
            recentChatsListEl.innerHTML = '<li class="chat-item message-placeholder">No valid chat partners found.</li>';
            return;
        }

        let chatItemsHtml = '';
        validChatsToDisplay.forEach(detail => {
            chatItemsHtml += `
                <li class="chat-item" data-chat-doc-id="${detail.chatDocId}" data-friend-id="${detail.friendTornId}">
                    <div class="chat-info">
                        <img src="${detail.friendProfileImage}" alt="${detail.friendName}'s profile pic" class="profile-pic-small">
                        <span class="chat-name">${detail.friendName}</span>
                    </div>
                    <button class="delete-chat-btn" title="Delete Chat">🗑️</button>
                </li>
            `;
        });
        
        recentChatsListEl.innerHTML = chatItemsHtml;

        // Note: The event listener is attached once in initPrivateChatTabEventListeners for delegation
        // so no need to re-attach here.

    } catch (error) {
        console.error("[Recent Chats] Error loading recent chats:", error);
        recentChatsListEl.innerHTML = `<li class="chat-item message-placeholder" style="color: red;">Error loading chats: ${error.message}</li>`;
    }
}

// MODIFIED: deletePrivateChat (no functional change, but ensure it's here)
async function deletePrivateChat(chatDocId, friendIdTorn) {
    console.log(`[Delete Chat] Initializing deletion for chat: ${chatDocId}`);

    try {
        // Step 1: Get a reference to the 'messages' subcollection
        const messagesRef = db.collection('privateChatMessages').doc(chatDocId).collection('messages');
        const messagesSnapshot = await messagesRef.get();

        // Step 2: Delete all documents within the 'messages' subcollection using a batch
        if (!messagesSnapshot.empty) {
            const batch = db.batch();
            messagesSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();
            console.log(`[Delete Chat] Successfully deleted ${messagesSnapshot.size} messages from subcollection.`);
        } else {
            console.log("[Delete Chat] No messages found in subcollection to delete.");
        }

        // Step 3: Delete the parent chat document
        await db.collection('privateChatMessages').doc(chatDocId).delete();
        console.log(`[Delete Chat] Successfully deleted parent chat document: ${chatDocId}`);

        // After deleting, reload the recent chats list to update the UI
        const recentChatsListEl = friendsPanelContent.querySelector('#recentChatsList');
        if (recentChatsListEl) {
            loadRecentChats();
            // Clear the currently displayed chat if it was the one deleted
            if (currentSelectedPrivateChatId === chatDocId) {
                currentSelectedPrivateChatId = null;
                const selectedChatHeaderEl = friendsPanelContent.querySelector('#selectedChatHeader');
                const selectedChatDisplayEl = friendsPanelContent.querySelector('#selectedChatDisplay');
                const privateChatMessageInputEl = friendsPanelContent.querySelector('#privateChatMessageInput');
                const sendPrivateMessageBtnEl = friendsPanelContent.querySelector('#sendPrivateMessageBtn');

                if (selectedChatHeaderEl) selectedChatHeaderEl.textContent = "Select a Chat";
                if (selectedChatDisplayEl) selectedChatDisplayEl.innerHTML = '<p class="message-placeholder">Click a chat on the left to start messaging.</p>';
                if (privateChatMessageInputEl) privateChatMessageInputEl.disabled = true;
                if (sendPrivateMessageBtnEl) sendPrivateMessageBtnEl.disabled = true;
                if (unsubscribeFromPrivateChat) {
                    unsubscribeFromPrivateChat();
                    unsubscribeFromPrivateChat = null;
                }
            }
        } else {
            console.warn("Could not find recentChatsList element to refresh UI after deletion.");
        }
        showCustomAlert("Chat deleted successfully.", "Deletion Complete"); // Provide user feedback

    } catch (error) {
        console.error("Error deleting private chat:", error);
        showCustomAlert(`Failed to delete chat: ${error.message}`, "Deletion Failed");
    }
}

// MODIFIED: displayChatMessage (now uses chatMessagesDisplay from faction-chat-panel)
function displayChatMessage(messageObj) {
    // Ensure chatMessagesDisplay refers to the correct element within the faction-chat-panel
    const factionChatDisplayArea = factionChatPanel.querySelector('.chat-messages-scroll-wrapper');
    if (!factionChatDisplayArea) {
        console.error("Faction chat display area not found in displayChatMessage function.");
        return;
    }

    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message');

    // Add a unique ID to each message element using its timestamp
    if (messageObj.timestamp && typeof messageObj.timestamp.toMillis === 'function') {
        messageElement.id = `msg-${messageObj.timestamp.toMillis()}`;
    }

    const timestamp = messageObj.timestamp && typeof messageObj.timestamp.toDate === 'function'
        ? messageObj.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const senderName = messageObj.sender || 'Unknown';
    const messageText = messageObj.text || '';

    messageElement.innerHTML = `
        <span class="chat-timestamp">[${timestamp}]</span>
        <span class="chat-sender">${senderName}:</span>
        <span class="chat-text">${messageText}</span>
    `;
    
    factionChatDisplayArea.appendChild(messageElement); // Append to the correct display area
}

// MODIFIED: manageChatMessages (now uses chatMessagesDisplay from faction-chat-panel)
function manageChatMessages() {
    const factionChatDisplayArea = factionChatPanel.querySelector('.chat-messages-scroll-wrapper');
    if (!factionChatDisplayArea) {
        console.error("Faction chat display area not found. Cannot manage messages.");
        return;
    }
    const messages = factionChatDisplayArea.querySelectorAll('.chat-message');
    if (messages.length > MAX_MESSAGES_VISIBLE) {
        const messagesToRemoveCount = messages.length - MAX_MESSAGES_VISIBLE;
        for (let i = 0; i < messagesToRemoveCount; i++) {
            const messageToFade = messages[i];
            messageToFade.classList.add('fade-out');
            setTimeout(() => {
                if (messageToFade.parentNode === factionChatDisplayArea) {
                    factionChatDisplayArea.removeChild(messageToFade);
                }
            }, REMOVAL_DELAY_MS);
        }
    }
}

// MODIFIED: sendChatMessage (now uses specific inputs within faction-chat-panel)
async function sendChatMessage() {
    // Get references specific to the faction chat panel
    const factionChatTextInput = factionChatPanel.querySelector('.chat-text-input');
    const factionChatSendBtn = factionChatPanel.querySelector('.chat-send-btn');
    const factionChatDisplayArea = factionChatPanel.querySelector('.chat-messages-scroll-wrapper');


    if (!factionChatTextInput || !auth.currentUser || !userApiKey || !chatMessagesCollection) {
        console.warn("Cannot send message: Chat input, logged-in user, API key, or Firebase collection not available.");
        return;
    }

    const messageText = factionChatTextInput.value.trim();
    if (messageText === '') {
        return; // Don't send empty messages
    }

    const filteredMessage = typeof filterProfanity === 'function' ? filterProfanity(messageText) : messageText;

    const messageObj = {
        senderId: auth.currentUser.uid,
        sender: currentTornUserName,
        text: filteredMessage,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        await chatMessagesCollection.add(messageObj);
        console.log("Message sent to Firebase:", messageObj);

        factionChatTextInput.value = ''; // Clear the input field after sending
        factionChatTextInput.focus(); // Keep focus on the input field

    } catch (error) {
        console.error("Error sending message to Firebase:", error);
        alert("Failed to send message. See console for details.");
    }
}

// MODIFIED: setupChatRealtimeListener (now uses factionChatPanel's specific display area)
function setupChatRealtimeListener() {
    if (!chatMessagesCollection) {
        console.error("Firebase chatMessagesCollection is not defined. Cannot set up chat listener.");
        if (factionChatPanel) { // Refer to the specific panel
            const displayArea = factionChatPanel.querySelector('.chat-messages-scroll-wrapper');
            if (displayArea) displayArea.innerHTML = `<p style="color: red;">Error: Faction chat not available (Faction ID missing or chat not initialized).</p>`;
        }
        return;
    }

    const factionChatDisplayArea = factionChatPanel.querySelector('.chat-messages-scroll-wrapper');
    if (factionChatDisplayArea) {
        factionChatDisplayArea.innerHTML = `<p>Loading messages...</p>`;
    }

    if (unsubscribeFromChat) {
        unsubscribeFromChat();
        console.log("Unsubscribed from previous faction chat listener.");
    }

    unsubscribeFromChat = chatMessagesCollection
        .orderBy('timestamp', 'asc')
        .limit(100)
        .onSnapshot(snapshot => {
            if (factionChatDisplayArea) {
                factionChatDisplayArea.innerHTML = '';
            }

            if (snapshot.empty) {
                if (factionChatDisplayArea) {
                    factionChatDisplayArea.innerHTML = `<p>No messages yet. Be the first to say hello!</p>`;
                }
                toggleScrollIndicatorVisibility();
                return;
            }
            
            snapshot.forEach(doc => {
                displayChatMessage(doc.data());
            });
            
            console.log("Chat messages updated in real-time.");
            
            setTimeout(() => {
                const scrollWrapper = factionChatPanel.querySelector('.chat-messages-scroll-wrapper');
                if (!scrollWrapper) return;

                if (scrollWrapper.scrollHeight > 0) {
                    scrollWrapper.scrollTop = scrollWrapper.scrollHeight;
                    toggleScrollIndicatorVisibility();
                } else {
                    let attempts = 0;
                    const scrollCheckInterval = setInterval(() => {
                        attempts++;
                        if (scrollWrapper.scrollHeight > 0 || attempts > 20) {
                            scrollWrapper.scrollTop = scrollWrapper.scrollHeight;
                            toggleScrollIndicatorVisibility();
                            clearInterval(scrollCheckInterval);
                        }
                    }, 100);
                }
            }, 0);

        }, error => {
            console.error("Error listening to chat messages:", error);
            if (factionChatDisplayArea) {
                factionChatDisplayArea.innerHTML = `<p style="color: red;">Error loading messages: ${error.message}</p>`;
            }
        });
    console.log("Faction chat real-time listener set up.");
    
    // Ensure scroll listener is attached to the correct scroll wrapper for faction chat
    const scrollWrapper = factionChatPanel.querySelector('.chat-messages-scroll-wrapper');
    if (scrollWrapper) {
        scrollWrapper.removeEventListener('scroll', handleChatScroll);
        scrollWrapper.addEventListener('scroll', handleChatScroll);
    }
}

// MODIFIED: displayFactionMembersInChatTab (now targets friendsPanelContent)
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
        const tornPlayerId = String(member.id); // Ensure ID is a string for consistency
        const memberName = member.name;
        const memberRank = member.position;
        const isFriend = friendsSet.has(tornPlayerId);

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

        // Fetch and update profile picture for each member
        (async () => {
            try {
                const userDoc = await db.collection('users').doc(tornPlayerId).get();
                if (userDoc.exists) {
                    const firebaseMemberData = userDoc.data();
                    const profileImageUrl = firebaseMemberData.profile_image || '../../images/default_profile_icon.png';
                    const imgElement = memberItemDiv.querySelector('.member-profile-pic');
                    if (imgElement) imgElement.src = profileImageUrl;
                }
            } catch (error) {
                console.error(`[Firestore Error] Failed to fetch profile pic for ${tornPlayerId}:`, error);
            }
        })();
    }

    // Add delegated event listeners for action buttons within the displayed members
    membersListContainer.addEventListener('click', async (event) => {
        const button = event.target.closest('button');
        if (!button) return;

        const memberId = button.dataset.memberId;
        if (!memberId) return;

        if (button.classList.contains('add-member-button')) {
            const tempInput = document.createElement('input'); // Dummy elements for addFriendLogic
            const tempBtn = document.createElement('button');
            const tempStatus = document.createElement('p');
            await addFriendLogic(memberId, tempInput, tempBtn, tempStatus);
            // After adding, re-render the list to show updated button state (or just update this specific button)
            displayFactionMembersInChatTab(factionMembersApiData, targetDisplayElement);
        } else if (button.classList.contains('remove-friend-button')) {
            const userConfirmed = await showCustomConfirm(`Are you sure you want to remove Torn ID: ${memberId} from your friends list?`, "Confirm Friend Removal");
            if (userConfirmed) {
                try {
                    if (!auth.currentUser) {
                        alert("Error: User not logged in. Cannot remove friend.");
                        return;
                    }
                    await db.collection('userProfiles').doc(auth.currentUser.uid).collection('friends').doc(memberId).delete();
                    showCustomAlert(`Successfully removed ${memberId} from friends.`, "Friend Removed");
                    displayFactionMembersInChatTab(factionMembersApiData, targetDisplayElement); // Re-render
                } catch (error) {
                    console.error("Error removing friend from database:", error);
                    showCustomAlert("Failed to remove friend. See console for details.", "Error");
                }
            }
        } else if (button.classList.contains('message-button')) {
            console.log(`Message button clicked for member ID: ${memberId}. Switching to private chat.`);
            // Switch to the "Recent Chats" sub-tab and then select the specific chat
            const recentChatsSubTabButton = document.querySelector('.sub-tab-button[data-subtab="recent-chats"]');
            if (recentChatsSubTabButton) {
                handleFriendsSubTabClick({ currentTarget: recentChatsSubTabButton });
                // Give a moment for the HTML to render before selecting the chat
                setTimeout(() => selectPrivateChat(memberId), 100);
            } else {
                console.warn("Recent Chats sub-tab button not found. Cannot switch to private chat programmatically.");
                // Fallback to Torn.com direct message
                window.open(`https://www.torn.com/messages.php#/p=compose&XID=${memberId}`, '_blank');
            }
        }
    });
}

// MODIFIED: populateRecentlyMetTab (now targets friendsPanelContent)
async function populateRecentlyMetTab(targetDisplayElement) {
    if (!targetDisplayElement) {
        console.error("HTML Error: Target display element not provided for Recently Met tab.");
        return;
    }

    targetDisplayElement.innerHTML = `<p style="text-align:center; padding: 20px;">Loading war history to find opponents...</p>`;

    try {
        const historyUrl = `https://api.torn.com/v2/faction/rankedwars?sort=DESC&limit=5&key=${userApiKey}&comment=MyTornPA_RecentlyMet`;
        const historyResponse = await fetch(historyUrl);
        const historyData = await historyResponse.json();

        if (historyData.error) throw new Error(historyData.error.error);

        const wars = historyData.rankedwars || [];
        if (wars.length === 0) {
            targetDisplayElement.innerHTML = '<p style="text-align:center; padding: 20px;">No recent wars found to populate this list.</p>';
            return;
        }

        targetDisplayElement.innerHTML = '<p style="text-align:center; padding: 20px;">Loading opponent details from war reports...</p>';
        const reportPromises = wars.map(war =>
            fetch(`https://api.torn.com/v2/faction/${war.id}/rankedwarreport?key=${userApiKey}&comment=MyTornPA_WarReport`).then(res => res.json())
        );
        const warReports = await Promise.all(reportPromises);

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

        const registeredUserIds = new Set();
        const chunkSize = 30;
        for (let i = 0; i < uniqueOpponentIds.length; i += chunkSize) {
            const chunk = uniqueOpponentIds.slice(i, i + chunkSize);
            const querySnapshot = await db.collection('userProfiles').where('tornProfileId', 'in', chunk).get();
            querySnapshot.forEach(doc => {
                registeredUserIds.add(doc.data().tornProfileId);
            });
        }

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
                messageButton = `<a href="${tornMessageUrl}" target="_blank" class="item-button message-button external-link" title="Send Message on Torn">✉️</a>`; // Added class
            }
            // Check if user is already a friend
            let friendsSet = new Set();
            if (auth.currentUser) {
                const friendsSnapshot = await db.collection('userProfiles').doc(auth.currentUser.uid).collection('friends').get();
                friendsSnapshot.forEach(doc => friendsSet.add(doc.id));
            }
            const isFriend = friendsSet.has(String(opponent.id));
            let addRemoveFriendButton;
            if (isFriend) {
                addRemoveFriendButton = `<button class="remove-friend-button" data-member-id="${opponent.id}" title="Remove Friend">👤<span class="plus-sign">-</span></button>`;
            } else {
                addRemoveFriendButton = `<button class="add-member-button" data-member-id="${opponent.id}" title="Add Friend">👤<span class="plus-sign">+</span></button>`;
            }


            cardsHtml += `
                <div class="member-item">
                    <div class="member-identity">
                        <img src="${profilePic}" alt="${opponent.name}'s profile pic" class="member-profile-pic">
                        <a href="https://www.torn.com/profiles.php?XID=${opponent.id}" target="_blank" class="member-name">${opponent.name} [${opponent.id}]</a>
                    </div>
                    <div class="member-actions">
                        ${addRemoveFriendButton}
                        ${messageButton}
                    </div>
                </div>
            `;
        }

        membersListContainer.innerHTML = cardsHtml;
        targetDisplayElement.innerHTML = ''; // Clear the "loading..." message
        targetDisplayElement.appendChild(membersListContainer);

        // Add delegated event listener for action buttons on newly added content
        membersListContainer.addEventListener('click', async (event) => {
            const button = event.target.closest('button');
            if (!button) return;

            const memberId = button.dataset.memberId;
            if (!memberId) return;

            if (button.classList.contains('add-member-button')) {
                const tempInput = document.createElement('input'); // Dummy elements for addFriendLogic
                const tempBtn = document.createElement('button');
                const tempStatus = document.createElement('p');
                await addFriendLogic(memberId, tempInput, tempBtn, tempStatus);
                // After adding, re-render the list to show updated button state
                populateRecentlyMetTab(targetDisplayElement);
            } else if (button.classList.contains('remove-friend-button')) {
                const userConfirmed = await showCustomConfirm(`Are you sure you want to remove Torn ID: ${memberId} from your friends list?`, "Confirm Friend Removal");
                if (userConfirmed) {
                    try {
                        if (!auth.currentUser) {
                            alert("Error: User not logged in. Cannot remove friend.");
                            return;
                        }
                        await db.collection('userProfiles').doc(auth.currentUser.uid).collection('friends').doc(memberId).delete();
                        showCustomAlert(`Successfully removed ${memberId} from friends.`, "Friend Removed");
                        populateRecentlyMetTab(targetDisplayElement); // Re-render
                    } catch (error) {
                        console.error("Error removing friend from database:", error);
                        showCustomAlert("Failed to remove friend. See console for details.", "Error");
                    }
                }
            } else if (button.classList.contains('message-button')) {
                 console.log(`Message button clicked for member ID: ${memberId}. Switching to private chat.`);
                const recentChatsSubTabButton = document.querySelector('.sub-tab-button[data-subtab="recent-chats"]');
                if (recentChatsSubTabButton) {
                    handleFriendsSubTabClick({ currentTarget: recentChatsSubTabButton });
                    setTimeout(() => selectPrivateChat(memberId), 100);
                } else {
                    console.warn("Recent Chats sub-tab button not found. Cannot switch to private chat programmatically.");
                    window.open(`https://www.torn.com/messages.php#/p=compose&XID=${memberId}`, '_blank');
                }
            }
        });

    } catch (error) {
        console.error("Error populating Recently Met tab:", error);
        targetDisplayElement.innerHTML = `<p style="color: red; text-align:center; padding: 20px;">Error: ${error.message}</p>`;
    }
}

// NEW FUNCTION: populateFriendListTab (replaces functionality of fetchAndDisplayFriends for the new structure)
async function populateFriendListTab(targetDisplayElement) {
    if (!targetDisplayElement) {
        console.error("HTML Error: Target display element not provided for Friend List tab.");
        return;
    }

    const friendListTbody = targetDisplayElement.querySelector('#friends-tbody');
    if (!friendListTbody) {
        console.error("HTML Error: #friends-tbody not found within targetDisplayElement for friend list.");
        return;
    }

    friendListTbody.innerHTML = `<tr><td colspan="12" style="text-align:center; padding: 20px;">Loading friends...</td></tr>`;

    if (!auth.currentUser) {
        friendListTbody.innerHTML = `<tr><td colspan="12" style="text-align:center; padding: 20px;">Please log in to view your friends.</td></tr>`;
        return;
    }

    try {
        const userProfileDocRef = db.collection('userProfiles').doc(auth.currentUser.uid);
        const userProfileDoc = await userProfileDocRef.get();

        if (userProfileDoc.exists && userProfileDoc.data().friends) {
            const friendTornIds = userProfileDoc.data().friends;
            console.log("Friend Torn IDs from user profile:", friendTornIds);

            if (friendTornIds.length === 0) {
                friendListTbody.innerHTML = `<tr><td colspan="12" style="text-align:center; padding: 20px;">You have no friends added yet.</td></tr>`;
                return;
            }

            // Fetch detailed user data for each friend
            const friendDetailsPromises = friendTornIds.map(id => db.collection('users').doc(String(id)).get());
            const friendDocs = await Promise.all(friendDetailsPromises);

            let allRowsHtml = '';
            let friendsFound = 0;

            for (const friendDoc of friendDocs) {
                if (friendDoc.exists) {
                    const friend = friendDoc.data();
                    const tornPlayerId = friendDoc.id;

                    const name = friend.name || 'N/A';
                    const level = friend.level || 'N/A';
                    const lastAction = friend.last_action ? formatRelativeTime(friend.last_action.timestamp) : 'N/A';
                    const statusState = friend.status?.state || '';
                    const statusDescription = friend.status?.description || 'N/A';
                    let formattedStatus = statusDescription;
                    let statusClass = 'status-okay';

                    if (statusState === 'Hospital') { statusClass = 'status-hospital'; }
                    else if (statusState === 'Traveling') { statusClass = 'status-traveling'; }
                    else if (statusState !== 'Okay') { statusClass = 'status-other'; }

                    const strength = formatBattleStats(friend.battlestats?.strength || 0);
                    const dexterity = formatBattleStats(friend.battlestats?.dexterity || 0);
                    const speed = formatBattleStats(friend.battlestats?.speed || 0);
                    const defense = formatBattleStats(friend.battlestats?.defense || 0);
                    const totalStats = formatBattleStats((friend.battlestats?.strength || 0) + (friend.battlestats?.speed || 0) + (friend.battlestats?.dexterity || 0) + (friend.battlestats?.defense || 0));

                    const nerveCurrent = friend.nerve?.current ?? 'N/A';
                    const nerveMaximum = friend.nerve?.maximum ?? 'N/A';
                    const nerve = `${nerveCurrent} / ${nerveMaximum}`;

                    const energyCurrent = friend.energy?.current ?? 'N/A';
                    const energyMaximum = friend.energy?.maximum ?? 'N/A';
                    const energy = `${energyCurrent} / ${energyMaximum}`;

                    const drugCooldownValue = friend.cooldowns?.drug ?? 0;
                    let drugCooldown, drugCooldownClass = '';
                    if (drugCooldownValue > 0) {
                        const hours = Math.floor(drugCooldownValue / 3600);
                        const minutes = Math.floor((drugCooldownValue % 3600) / 60);
                        drugCooldown = `${hours > 0 ? `${hours}h` : ''} ${minutes > 0 ? `${minutes}m` : ''}`.trim() || '<1m';
                        if (drugCooldownValue > 18000) drugCooldownClass = 'status-hospital'; else if (drugCooldownValue > 7200) drugCooldownClass = 'status-other'; else drugCooldownClass = 'status-okay';
                    } else {
                        drugCooldown = 'None 🍁'; drugCooldownClass = 'status-okay';
                    }

                    const reviveSetting = (friend.revive_setting || '').trim();
                    let revivableClass = '';
                    if (reviveSetting === 'Everyone') { revivableClass = 'revivable-text-green'; }
                    else if (reviveSetting === 'Friends & faction') { revivableClass = 'revivable-text-orange'; }
                    else if (reviveSetting === 'No one') { revivableClass = 'revivable-text-red'; }


                    const profileUrl = `https://www.torn.com/profiles.php?XID=${tornPlayerId}`;

                    allRowsHtml += `
                        <tr data-id="${tornPlayerId}">
                            <td><a href="${profileUrl}" target="_blank">${name} [${tornPlayerId}]</a></td>
                            <td>${lastAction}</td>
                            <td>${strength}</td>
                            <td>${dexterity}</td>
                            <td>${speed}</td>
                            <td>${defense}</td>
                            <td>${totalStats}</td>
                            <td class="${statusClass}">${formattedStatus}</td>
                            <td class="nerve-text">${nerve}</td>
                            <td class="energy-text">${energy}</td>
                            <td class="${drugCooldownClass}">${drugCooldown}</td>
                            <td class="${revivableClass}">${reviveSetting}</td>
                        </tr>
                    `;
                    friendsFound++;
                } else {
                    console.warn(`Friend document with ID ${friendDoc.id} does not exist in 'users' collection.`);
                    // Fallback for missing user data, but still show the friend's ID if known from userProfiles.friends
                     allRowsHtml += `
                        <tr data-id="${friendDoc.id}" class="status-other">
                            <td><a href="https://www.torn.com/profiles.php?XID=${friendDoc.id}" target="_blank">Unknown [${friendDoc.id}]</a></td>
                            <td colspan="11" style="text-align: center;">(No detailed Torn data available in database)</td>
                        </tr>
                    `;
                }
            }

            if (friendsFound === 0) {
                friendListTbody.innerHTML = `<tr><td colspan="12" style="text-align:center; padding: 20px;">No friend data found for your listed friends.</td></tr>`;
            } else {
                friendListTbody.innerHTML = allRowsHtml;
                applyStatColorCoding(friendListTbody); // Apply color coding to the newly loaded table
            }

        } else {
            friendListTbody.innerHTML = `<tr><td colspan="12" style="text-align:center; padding: 20px;">You have no friends added yet.</td></tr>`;
        }
    } catch (error) {
        console.error("Error fetching or displaying friends:", error);
        friendListTbody.innerHTML = `<tr><td colspan="12" style="text-align:center; padding: 20px;">Error loading friends: ${error.message}</td></tr>`;
    }
}

// NEW FUNCTION: populateDummyIgnores
function populateDummyIgnores(targetDisplayElement) {
    if (!targetDisplayElement) {
        console.error("HTML Error: Target display element not provided for dummy ignores list.");
        return;
    }
    const dummyIgnores = [
        { id: 'user_12345', name: 'IgnoredPlayer1', type: 'user' },
        { id: 'faction_67890', name: 'RivalFaction', type: 'faction' },
        { id: 'user_98765', name: 'SpammerX', type: 'user' },
        { id: 'user_11223', name: 'BlockedTrader', type: 'user' },
        { id: 'faction_44556', name: 'AnnoyingFaction', type: 'faction' }
    ];

    let ignoresHtml = '';
    if (dummyIgnores.length === 0) {
        ignoresHtml = '<p style="text-align:center; padding: 10px;">Your ignore list is empty.</p>';
    } else {
        dummyIgnores.forEach(ignore => {
            const displayId = ignore.id.split('_')[1];
            const iconHtml = ignore.type === 'user' ? `<img src="../../images/default_profile_icon.png" alt="Profile Pic" class="profile-pic">` : `<span class="item-icon faction-icon">🏢</span>`;
            ignoresHtml += `
                <div class="list-item ignore-entry" data-id="${ignore.id}" data-type="${ignore.type}">
                    ${iconHtml}
                    <span class="item-name">${ignore.name} [${displayId}]</span>
                    <button class="item-button trash-button" title="Remove from Ignore List">🗑️</button>
                </div>
            `;
        });
    }
    targetDisplayElement.innerHTML = ignoresHtml;

    // Add event listener for removing ignores (delegated)
    targetDisplayElement.addEventListener('click', async (event) => {
        const button = event.target.closest('.trash-button');
        if (!button) return;

        const ignoreEntry = button.closest('.ignore-entry');
        const idToRemove = ignoreEntry.dataset.id;
        const nameToRemove = ignoreEntry.querySelector('.item-name').textContent;

        const userConfirmed = await showCustomConfirm(`Are you sure you want to remove ${nameToRemove} from your ignore list?`, "Confirm Removal");
        if (userConfirmed) {
            // Implement actual removal logic here (e.g., from Firebase)
            alert(`Simulating removal of ${nameToRemove} (${idToRemove}). Real removal logic not yet implemented.`);
            // For now, just remove from DOM
            ignoreEntry.remove();
            if (targetDisplayElement.children.length === 0) {
                targetDisplayElement.innerHTML = '<p style="text-align:center; padding: 10px;">Your ignore list is empty.</p>';
            }
        }
    });
}

// NEW FUNCTION: setupSettingsPanel to load/save settings from/to localStorage
function setupSettingsPanel() {
    console.log("[Settings Panel] Setting up settings controls.");

    // Load existing settings from localStorage or set defaults
    const savedSettings = JSON.parse(localStorage.getItem('chatSettings')) || {};
    chatSettings = { // Initialize with defaults
        userStatusDisplay: savedSettings.userStatusDisplay || 'none',
        chatFontSize: savedSettings.chatFontSize || 'medium',
        chatTheme: savedSettings.chatTheme || 'dark',
        messageDensity: savedSettings.messageDensity || 'normal',
        chatInputSize: savedSettings.chatInputSize || 'medium',
        showTimestamps: savedSettings.showTimestamps !== undefined ? savedSettings.showTimestamps : true,
        autoScrollChat: savedSettings.autoScrollChat !== undefined ? savedSettings.autoScrollChat : true,
        profanityFilterLocal: savedSettings.profanityFilterLocal !== undefined ? savedSettings.profanityFilterLocal : true, // Default to true
        toggleWarChat: savedSettings.toggleWarChat !== undefined ? savedSettings.toggleWarChat : true,
        muteSiteSounds: savedSettings.muteSiteSounds !== undefined ? savedSettings.muteSiteSounds : false,
        muteWarSounds: savedSettings.muteWarSounds !== undefined ? savedSettings.muteWarSounds : false,
        appearOnlineOffline: savedSettings.appearOnlineOffline !== undefined ? savedSettings.appearOnlineOffline : true,
        notificationMethod: savedSettings.notificationMethod || 'soundOnly'
    };

    // Apply loaded settings to UI controls
    settingsUserStatusDisplayRadios.forEach(radio => radio.checked = (radio.value === chatSettings.userStatusDisplay));
    settingsFontSizeRadios.forEach(radio => radio.checked = (radio.value === chatSettings.chatFontSize));
    settingsChatThemeRadios.forEach(radio => radio.checked = (radio.value === chatSettings.chatTheme));
    settingsMessageDensityRadios.forEach(radio => radio.checked = (radio.value === chatSettings.messageDensity));
    settingsInputSizeRadios.forEach(radio => radio.checked = (radio.value === chatSettings.chatInputSize));

    if (settingsShowTimestamps) settingsShowTimestamps.checked = chatSettings.showTimestamps;
    if (settingsAutoScrollChat) settingsAutoScrollChat.checked = chatSettings.autoScrollChat;
    if (settingsProfanityFilterLocal) settingsProfanityFilterLocal.checked = chatSettings.profanityFilterLocal;
    if (settingsToggleWarChat) settingsToggleWarChat.checked = chatSettings.toggleWarChat;
    if (settingsMuteSiteSounds) settingsMuteSiteSounds.checked = chatSettings.muteSiteSounds;
    if (settingsMuteWarSounds) settingsMuteWarSounds.checked = chatSettings.muteWarSounds;
    if (settingsAppearOnlineOffline) settingsAppearOnlineOffline.checked = chatSettings.appearOnlineOffline;
    settingsNotificationMethodRadios.forEach(radio => radio.checked = (radio.value === chatSettings.notificationMethod));

    // Apply CSS classes based on settings (example for font size)
    const chatMessageElements = document.querySelectorAll('.chat-messages-scroll-wrapper');
    chatMessageElements.forEach(el => {
        el.classList.remove('font-small', 'font-medium', 'font-large');
        el.classList.add(`font-${chatSettings.chatFontSize}`);
        el.classList.remove('density-compact', 'density-normal', 'density-spacious');
        el.classList.add(`density-${chatSettings.messageDensity}`);
    });

    const chatInputElements = document.querySelectorAll('.chat-text-input');
    chatInputElements.forEach(el => {
        el.classList.remove('input-small', 'input-medium', 'input-large');
        el.classList.add(`input-${chatSettings.chatInputSize}`);
    });

    // Add event listeners for settings controls (only once)
    if (!settingsPanel.dataset.listenersAttached) { // Prevent re-attaching
        settingsPanel.dataset.listenersAttached = true;

        settingsUserStatusDisplayRadios.forEach(radio => radio.addEventListener('change', (e) => chatSettings.userStatusDisplay = e.target.value));
        settingsFontSizeRadios.forEach(radio => radio.addEventListener('change', (e) => {
            chatSettings.chatFontSize = e.target.value;
            chatMessageElements.forEach(el => {
                el.classList.remove('font-small', 'font-medium', 'font-large');
                el.classList.add(`font-${chatSettings.chatFontSize}`);
            });
        }));
        settingsChatThemeRadios.forEach(radio => radio.addEventListener('change', (e) => chatSettings.chatTheme = e.target.value));
        settingsMessageDensityRadios.forEach(radio => radio.addEventListener('change', (e) => {
            chatSettings.messageDensity = e.target.value;
            chatMessageElements.forEach(el => {
                el.classList.remove('density-compact', 'density-normal', 'density-spacious');
                el.classList.add(`density-${chatSettings.messageDensity}`);
            });
        }));
        settingsInputSizeRadios.forEach(radio => radio.addEventListener('change', (e) => {
            chatSettings.chatInputSize = e.target.value;
            chatInputElements.forEach(el => {
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
        settingsNotificationMethodRadios.forEach(radio => radio.addEventListener('change', (e) => chatSettings.notificationMethod = e.target.value));

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
                    // This only clears the *displayed* messages. Real chat is in Firebase.
                    const displayArea = factionChatPanel.querySelector('.chat-messages-scroll-wrapper');
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
                        const selectedChatHeaderEl = friendsPanelContent.querySelector('#selectedChatHeader');
                        const selectedChatDisplayEl = friendsPanelContent.querySelector('#selectedChatDisplay');
                        const privateChatMessageInputEl = friendsPanelContent.querySelector('#privateChatMessageInput');
                        const sendPrivateMessageBtnEl = friendsPanelContent.querySelector('#sendPrivateMessageBtn');

                        if (selectedChatHeaderEl) selectedChatHeaderEl.textContent = "Select a Chat";
                        if (selectedChatDisplayEl) selectedChatDisplayEl.innerHTML = '<p class="message-placeholder">Click a chat on the left to start messaging.</p>';
                        if (privateChatMessageInputEl) privateChatMessageInputEl.disabled = true;
                        if (sendPrivateMessageBtnEl) sendPrivateMessageBtnEl.disabled = true;

                        // Re-select the Recent Chats sub-tab to refresh the list
                        const recentChatsSubTabButton = document.querySelector('.sub-tab-button[data-subtab="recent-chats"]');
                        if (recentChatsSubTabButton) {
                            handleFriendsSubTabClick({ currentTarget: recentChatsSubTabButton });
                        }
                    }
                    showCustomAlert("All private chats closed.", "Action Complete");
                }
            });
        }

        if (deleteAllPrivateMessagesBtn) {
            deleteAllPrivateMessagesBtn.addEventListener('click', async () => {
                 const confirmed = await showCustomConfirm("Are you sure you want to DELETE ALL of your private chat messages from the server? This action is irreversible.", "Confirm Delete All");
                 if (!confirmed) return;

                 if (!auth.currentUser) {
                     showCustomAlert("You must be logged in to delete messages.", "Error");
                     return;
                 }

                 const currentUserUid = auth.currentUser.uid;
                 let deleteCount = 0;
                 try {
                     // Find all private chat documents where the current user is a participant
                     const chatsSnapshot = await db.collection('privateChatMessages')
                         .where('participants', 'array-contains', currentUserUid)
                         .get();

                     const chatDeletePromises = [];

                     chatsSnapshot.forEach(chatDoc => {
                         const chatDocId = chatDoc.id;
                         const messagesRef = db.collection('privateChatMessages').doc(chatDocId).collection('messages');
                         
                         // Collect promises for deleting messages within each subcollection
                         chatDeletePromises.push(messagesRef.get().then(msgSnapshot => {
                             const batch = db.batch();
                             msgSnapshot.docs.forEach(msgDoc => {
                                 batch.delete(msgDoc.ref);
                                 deleteCount++;
                             });
                             return batch.commit();
                         }).then(() => {
                             // After messages are deleted, delete the parent chat document itself
                             return db.collection('privateChatMessages').doc(chatDocId).delete();
                         }));
                     });

                     await Promise.all(chatDeletePromises);
                     showCustomAlert(`Successfully deleted ${deleteCount} private messages and all chat threads.`, "Deletion Complete");

                     // After deletion, refresh the private chat UI
                     if (unsubscribeFromPrivateChat) {
                        unsubscribeFromPrivateChat();
                        unsubscribeFromPrivateChat = null;
                        currentSelectedPrivateChatId = null;
                        // Clear the selected chat display
                        const selectedChatHeaderEl = friendsPanelContent.querySelector('#selectedChatHeader');
                        const selectedChatDisplayEl = friendsPanelContent.querySelector('#selectedChatDisplay');
                        const privateChatMessageInputEl = friendsPanelContent.querySelector('#privateChatMessageInput');
                        const sendPrivateMessageBtnEl = friendsPanelContent.querySelector('#sendPrivateMessageBtn');

                        if (selectedChatHeaderEl) selectedChatHeaderEl.textContent = "Select a Chat";
                        if (selectedChatDisplayEl) selectedChatDisplayEl.innerHTML = '<p class="message-placeholder">Click a chat on the left to start messaging.</p>';
                        if (privateChatMessageInputEl) privateChatMessageInputEl.disabled = true;
                        if (sendPrivateMessageBtnEl) sendPrivateMessageBtnEl.disabled = true;
                    }
                     // Reload the recent chats list to show it's empty
                    const recentChatsSubTabButton = document.querySelector('.sub-tab-button[data-subtab="recent-chats"]');
                    if (recentChatsSubTabButton) {
                        handleFriendsSubTabClick({ currentTarget: recentChatsSubTabButton });
                    }


                 } catch (error) {
                     console.error("Error deleting all private messages:", error);
                     showCustomAlert(`Failed to delete all messages: ${error.message}`, "Deletion Failed");
                 }
            });
        }
    }
}

// NEW FUNCTION: Toggles the main chat window visibility
function toggleChatWindowVisibility() {
    chatWindow.classList.toggle('hidden');
    // Also toggle the main tabs container if the window is hidden/shown
    if (chatWindow.classList.contains('hidden')) {
        chatMainTabsContainer.classList.add('hidden');
    } else {
        chatMainTabsContainer.classList.remove('hidden');
    }
}

// MODIFIED: setupEventListeners - this function now focuses on the main DOMContentLoaded setup
// and the main chat window open/close logic. It should be called once from DOMContentLoaded.
function setupEventListeners(apiKey) {
    // --- Main Chat Window Toggle Listeners ---
    if (openFactionChatIcon) openFactionChatIcon.addEventListener('click', () => {
        toggleChatWindowVisibility();
        if (!chatWindow.classList.contains('hidden')) { // If opening, default to faction chat
            const factionChatTabButton = document.querySelector('.chat-tab[data-tab-target="faction-chat-panel"]');
            if (factionChatTabButton) handleChatTabClick({ currentTarget: factionChatTabButton });
        }
    });
    if (openWarChatIcon) openWarChatIcon.addEventListener('click', () => {
        toggleChatWindowVisibility();
        if (!chatWindow.classList.contains('hidden')) { // If opening, default to war chat
            const warChatTabButton = document.querySelector('.chat-tab[data-tab-target="war-chat-panel"]');
            if (warChatTabButton) handleChatTabClick({ currentTarget: warChatTabButton });
        }
    });
    if (openFriendsIcon) openFriendsIcon.addEventListener('click', () => {
        toggleChatWindowVisibility();
        if (!chatWindow.classList.contains('hidden')) { // If opening, default to friends panel
            const friendsTabButton = document.querySelector('.chat-tab[data-tab-target="friends-panel"]');
            if (friendsTabButton) handleChatTabClick({ currentTarget: friendsTabButton });
        }
    });
    if (openNotificationsIcon) openNotificationsIcon.addEventListener('click', () => {
        toggleChatWindowVisibility();
        if (!chatWindow.classList.contains('hidden')) { // If opening, default to notifications panel
            const notificationsTabButton = document.querySelector('.chat-tab[data-tab-target="notifications-panel"]');
            if (notificationsTabButton) handleChatTabClick({ currentTarget: notificationsTabButton });
        }
    });
    if (openSettingsIcon) openSettingsIcon.addEventListener('click', () => {
        toggleChatWindowVisibility();
        if (!chatWindow.classList.contains('hidden')) { // If opening, default to settings panel
            const settingsTabButton = document.querySelector('.chat-tab[data-tab-target="settings-panel"]');
            if (settingsTabButton) handleChatTabClick({ currentTarget: settingsTabButton });
        }
    });

    // Minimize button for all chat panels
    minimizeChatBtns.forEach(button => {
        button.addEventListener('click', toggleChatWindowVisibility);
    });

    // --- Main Chat Tab Listeners (for Faction Chat, War Chat, Friends, Notifications, Settings) ---
    chatTabButtons.forEach(button => {
        button.addEventListener('click', handleChatTabClick);
    });

    // --- Friends Panel Sub-Tab Listeners ---
    friendsSubTabButtons.forEach(button => {
        button.addEventListener('click', handleFriendsSubTabClick);
    });

    // --- Faction Chat Input / Send Button Listeners ---
    // These should refer to the elements within the faction-chat-panel
    const factionChatTextInputEl = factionChatPanel.querySelector('.chat-text-input');
    const factionChatSendBtnEl = factionChatPanel.querySelector('.chat-send-btn');

    if (factionChatSendBtnEl) {
        factionChatSendBtnEl.addEventListener('click', sendChatMessage);
    }
    if (factionChatTextInputEl) {
        factionChatTextInputEl.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                sendChatMessage();
            }
        });
    }

    // --- Game Plan & Announcement Image Upload/Clear Listeners ---
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
                showCustomAlert('Game Plan image cleared!', "Image Cleared");
            } catch (error) {
                console.error("Error clearing game plan image:", error);
                showCustomAlert('Failed to clear image.', "Error");
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
                showCustomAlert('Announcement image cleared!', "Image Cleared");
            } catch (error) {
                console.error("Error clearing announcement image:", error);
                showCustomAlert('Failed to clear image.', "Error");
            }
        });
    }

    // Admin Controls Listeners (assuming these are in your leader-config tab)
    const adminControls = document.getElementById('availability-admin-controls'); // If this element exists
    if (adminControls) {
        adminControls.addEventListener('click', async (event) => {
            const button = event.target.closest('button');
            if (!button) return;

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
            } else if (button.id === 'reset-availability-btn') {
                const confirmed = await showCustomConfirm("Are you sure you want to reset ALL availability data for everyone?", "Confirm Reset");
                if (confirmed) {
                    await resetAllAvailability(); // Your existing function
                }
            }
        });
    }

    // Discord Webhook Controls (if you have them in leader-config)
    setupDiscordWebhookControls(); // Your existing function

    // Save buttons for Leader Config sections (War Status, Admins, Energy Track, Big Hitters)
    if (saveWarStatusControlsBtn) {
        saveWarStatusControlsBtn.addEventListener('click', async () => {
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
                enemyFactionID: enemyId
            };
            try {
                await db.collection('factionWars').doc('currentWar').set(statusData, { merge: true });
                populateWarStatusDisplay(statusData);
                await fetchAndDisplayEnemyFaction(enemyId, userApiKey);
                saveWarStatusControlsBtn.textContent = "Saved! ✅";
            } catch (error) {
                console.error('ERROR during Save War Status:', error);
                saveWarStatusControlsBtn.textContent = "Error! ❌";
                showCustomAlert("Failed to save war status. Please check the console.", "Save Failed");
            } finally {
                setTimeout(() => {
                    saveWarStatusControlsBtn.disabled = false;
                    saveWarStatusControlsBtn.textContent = originalText;
                }, 2000);
            }
        });
    }

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
                showCustomAlert("Failed to save admins. Check console.", "Save Error");
            } finally {
                setTimeout(() => {
                    saveAdminsBtn.disabled = false;
                    saveAdminsBtn.textContent = originalText;
                }, 2000);
            }
        });
    }

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

    if (saveSelectionsBtnBH) {
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

} // End of setupEventListeners

// MODIFIED: DOMContentLoaded Listener - now orchestrates the new chat system's initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded. Initializing chat system...");

    // Initial setup of main event listeners (only once)
    // Pass userApiKey and currentUser.uid when available from auth state
    // `setupEventListeners` is now responsible for setting up all global listeners for the chat window, tabs, and buttons.
    // It should be called before `auth.onAuthStateChanged` to ensure listeners are ready.
    setupEventListeners(); // Call once at DOMContentLoaded

    // Handle authentication state changes
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userProfileRef = db.collection('userProfiles').doc(user.uid);
            const doc = await userProfileRef.get();
            const userData = doc.exists ? doc.data() : {};

            const apiKey = userData.tornApiKey || null;
            const playerId = userData.tornProfileId || null;
            currentTornUserName = userData.preferredName || 'Unknown';

            // Clear All War Data Button Listener (moved here to ensure 'db' is available and user is authenticated)
            if (clearAllWarDataBtn) {
                clearAllWarDataBtn.removeEventListener('click', handleClearAllWarData); // Prevent duplicate listeners
                clearAllWarDataBtn.addEventListener('click', handleClearAllWarData);
            }
            // Handler for Clear All War Data Button
            async function handleClearAllWarData() {
                const confirmMessage = "Are you sure you want to clear ALL war data?\nThis will reset all war controls, the game plan, and announcements. This cannot be undone.";
                const userConfirmed = await showCustomConfirm(confirmMessage, "Confirm Data Deletion");

                if (!userConfirmed) {
                    return;
                }

                const originalText = clearAllWarDataBtn.textContent;
                clearAllWarDataBtn.disabled = true;
                clearAllWarDataBtn.textContent = "Clearing...";

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
                    tab4Admins: [],
                    energyTrackingMembers: []
                };

                try {
                    await db.collection('factionWars').doc('currentWar').set(clearedData, { merge: true });

                    // Update UI elements
                    populateWarStatusDisplay(clearedData);
                    loadWarStatusForEdit(clearedData);
                    if (gamePlanDisplay) gamePlanDisplay.innerHTML = '<p>No game plan available.</p>';
                    if (factionAnnouncementsDisplay) factionAnnouncementsDisplay.innerHTML = '<p>No current announcements.</p>';
                    if (gamePlanEditArea) gamePlanEditArea.value = "";
                    if (quickAnnouncementInput) quickAnnouncementInput.value = "";
                    if (enemyFactionIDInput) enemyFactionIDInput.value = "";
                    if (nextChainTimeInput) nextChainTimeInput.value = "";
                    const currentTeamLeadInput = document.getElementById('currentTeamLeadInput');
                    if (currentTeamLeadInput) currentTeamLeadInput.value = "";

                    if (factionApiFullData && factionApiFullData.members) {
                        populateFriendlyMemberCheckboxes(factionApiFullData.members, [], []);
                    }
                    populateEnemyMemberCheckboxes({}, []);
                    displayEnemyTargetsTable(null);

                    clearAllWarDataBtn.textContent = "Cleared! ✅";

                } catch (error) {
                    console.error("Error clearing war data:", error);
                    clearAllWarDataBtn.textContent = "Error! ❌";
                    showCustomAlert("Failed to clear data. Please check the console.", "Error");
                } finally {
                    setTimeout(() => {
                        clearAllWarDataBtn.disabled = false;
                        clearAllWarDataBtn.textContent = originalText;
                    }, 2000);
                }
            }


            if (apiKey && playerId) {
                userApiKey = apiKey; // Set global API key

                await initializeAndLoadData(apiKey, userData.faction_id); // Pass user's faction_id

                setupProgressText();

                const factionWarHubTitleEl = document.getElementById('factionWarHubTitle');
                if (factionWarHubTitleEl && factionApiFullData && factionApiFullData.name) {
                    factionWarHubTitleEl.textContent = `${factionApiFullData.name}'s War Hub`;
                }

                // Initial calls to update UI components
                displayWarRoster();
                setupFactionHitsListener(db, userData.faction_id);
                setupWarClaimsListener();

                // These now refer to generic elements that might be on multiple panels
                userEnergyDisplay = document.getElementById('rw-user-energy');
                onlineFriendlyMembersDisplay = document.getElementById('onlineFriendlyMembersDisplay');
                onlineEnemyMembersDisplay = document.getElementById('onlineEnemyMembersDisplay');

                updateUserEnergyDisplay();
                updateOnlineMemberCounts();
                fetchAndDisplayChainData();
                displayQuickFFTargets(userApiKey, playerId);
                setupChatRealtimeListener(); // Sets up faction chat listener

                // Autocomplete for team lead (assuming allFactionMembers is available globally or fetched)
                if (factionApiFullData && factionApiFullData.members) {
                    setupTeamLeadAutocomplete(factionApiFullData.members);
                }

                // Set up interval updates
                // Ensure intervals are cleared on logout if implemented, or they will keep running.
                setInterval(updateAllTimers, 1000);
                setInterval(() => {
                    if (userApiKey && globalEnemyFactionID) {
                        fetchAndDisplayEnemyFaction(globalEnemyFactionID, userApiKey);
                    }
                }, 15000);
                setInterval(() => {
                    if (userApiKey && globalYourFactionID) {
                        updateDualChainTimers(userApiKey, globalYourFactionID, globalEnemyFactionID);
                        fetchAndDisplayChainData();
                    }
                }, 5000);
                setInterval(() => {
                    if (userApiKey && globalYourFactionID) {
                        initializeAndLoadData(userApiKey, globalYourFactionID);
                    }
                }, 300000);
                setInterval(() => {
                    if (userApiKey) {
                        updateUserEnergyDisplay();
                        updateOnlineMemberCounts();
                    }
                }, 60000);
                setInterval(() => {
                    if (userApiKey && playerId) {
                        displayQuickFFTargets(userApiKey, playerId);
                    }
                }, 10000);

            } else {
                console.warn("API key or Player ID not found. User is logged in but profile data is incomplete.");
                const factionWarHubTitleEl = document.getElementById('factionWarHubTitle');
                if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = "Faction War Hub. (API Key & Player ID Needed)";
                populateWarStatusDisplay({});
                loadWarStatusForEdit({});
                if (gamePlanDisplay) gamePlanDisplay.innerHTML = 'No game plan available.';
                if (factionAnnouncementsDisplay) factionAnnouncementsDisplay.innerHTML = 'No current announcements.';
                displayEnemyTargetsTable(null);
                populateFriendlyMemberCheckboxes({}, [], []);
                populateEnemyMemberCheckboxes({}, []);
            }
            // Default to showing faction chat or the tab specified in URL
            const urlParams = new URLSearchParams(window.location.search);
            const requestedView = urlParams.get('view');
            const defaultTabButton = requestedView
                ? document.querySelector(`.chat-tab[data-tab-target="${requestedView}-panel"]`)
                : document.querySelector('.chat-tab[data-tab-target="faction-chat-panel"]');

            if (defaultTabButton) {
                handleChatTabClick({ currentTarget: defaultTabButton });
            } else {
                 // Fallback if no matching tab is found, show faction chat and log an error
                console.error(`Requested view "${requestedView}" or default faction-chat-panel not found. Showing first available tab.`);
                const firstTab = document.querySelector('.chat-tab');
                if(firstTab) handleChatTabClick({ currentTarget: firstTab });
            }


        } else {
            userApiKey = null;
            // Clear UI elements when logged out
            console.log("User not logged in. Clearing UI.");
            const factionWarHubTitleEl = document.getElementById('factionWarHubTitle');
            if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = "Faction War Hub. (Please Login)";
            populateWarStatusDisplay({});
            loadWarStatusForEdit({});
            if (gamePlanDisplay) gamePlanDisplay.innerHTML = 'No game plan available.';
            if (factionAnnouncementsDisplay) factionAnnouncementsDisplay.innerHTML = 'No current announcements.';
            displayEnemyTargetsTable(null);
            populateFriendlyMemberCheckboxes({}, [], []);
            populateEnemyMemberCheckboxes({}, []);
            // Clear chat panels and hide chat input
            chatPanels.forEach(panel => panel.classList.add('hidden'));
            if (factionChatPanel) {
                const displayArea = factionChatPanel.querySelector('.chat-messages-scroll-wrapper');
                if (displayArea) displayArea.innerHTML = '<p>Please log in to use chat.</p>';
                const inputArea = factionChatPanel.querySelector('.chat-input-area');
                if (inputArea) inputArea.style.display = 'none'; // Hide input for faction chat
            }

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
            if (unsubscribeFromPrivateChat) { // NEW: Clear private chat listener too
                unsubscribeFromPrivateChat();
                unsubscribeFromPrivateChat = null;
            }
            // Hide the entire chat window
            toggleChatWindowVisibility(true); // Force hide
        }
    });
});