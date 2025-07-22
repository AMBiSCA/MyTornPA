function initializeGlobals() {
    // ---- Firebase Setup ----
    const db = firebase.firestore();
    const auth = firebase.auth();
    let chatMessagesCollection = null; // This variable is not strictly needed anymore given the new structure
    let unsubscribeFromChat = null;
    let currentTornUserName = 'Unknown';
    let currentUserFactionId = null; // Declare currentUserFactionId here, accessible throughout initializeGlobals

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
            const chatMainTabsContainer = document.querySelector('.chat-main-tabs-container');
            
            // Get specific chat icons from the collapsed bar
            const openFactionChatIcon = document.getElementById('open-faction-chat-icon');
            const openWarChatIcon = document.getElementById('open-war-chat-icon');
            const openFriendsIcon = document.getElementById('open-friends-icon');
            const openNotificationsIcon = document.getElementById('open-notifications-icon');
            const openSettingsIcon = document.getElementById('open-settings-icon');

            // Get specific chat panels
            const factionChatPanel = document.getElementById('faction-chat-panel');
            const warChatPanel = document.getElementById('war-chat-panel');
            const friendsPanel = document.getElementById('friends-panel'); // This is the overall container for friends
            const notificationsPanel = document.getElementById('notifications-panel');
            const settingsPanel = document.getElementById('settings-panel');

            // Get minimize buttons
            const minimizeChatBtns = document.querySelectorAll('.minimize-chat-btn');

            // Get all chat panels and tabs for easy iteration
            const allPanels = document.querySelectorAll('.chat-panel');
            const allTabs = document.querySelectorAll('.chat-tab'); // These are the main chat window tabs


            // Input and send buttons for Faction Chat
            const factionChatTextInput = factionChatPanel.querySelector('.chat-text-input');
            const factionChatSendBtn = factionChatPanel.querySelector('.chat-send-btn');

            // Input and send buttons for War Chat
            const warChatTextInput = warChatPanel.querySelector('.chat-text-input');
            const warChatSendBtn = warChatPanel.querySelector('.chat-send-btn');


            // --- Helper to open a specific chat panel and hide others ---
            function openChatPanel(panelToShow) {
                if (chatWindow) chatWindow.classList.remove('hidden');
                if (chatBarCollapsed) chatBarCollapsed.classList.add('hidden');
                if (chatMainTabsContainer) chatMainTabsContainer.classList.add('hidden');
                
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

            if (openWarChatIcon) {
                openWarChatIcon.addEventListener('click', () => {
                    openChatPanel(warChatPanel);
                    if (warChatTextInput) warChatTextInput.focus();
                    setupChatRealtimeListener('war');
                });
            }

            // --- REVISED: Friends Icon Click Listener (Person Icon) ---
            if (openFriendsIcon) {
                openFriendsIcon.addEventListener('click', () => {
                    openChatPanel(friendsPanel); // Show the main friendsPanel

                    // Inject the internal structure for Friends/Blocked People sub-tabs
                    friendsPanel.innerHTML = `
                        <div class="friends-panel-content-wrapper">
                            <div class="friends-panel-subtabs">
                                <button class="sub-tab-button active" data-subtab="recent-chats">Recent Chats</button>
                                <button class="sub-tab-button" data-subtab="friends-list">Friends List</button>
                                <button class="sub-tab-button" data-subtab="ignores-list">Ignores</button>
                            </div>

                            <div id="friendsSubTabContent" class="sub-tab-content">
                                </div>
                        </div>
                    `;

                    // Get references to the newly injected elements
                    const friendsSubTabContent = document.getElementById('friendsSubTabContent');
                    const subTabButtons = friendsPanel.querySelectorAll('.sub-tab-button');

                    // Set up event listeners for the new sub-tabs within the friendsPanel
                    subTabButtons.forEach(button => {
                        button.addEventListener('click', async (e) => {
                            // Remove 'active' from all sub-tab buttons
                            subTabButtons.forEach(btn => btn.classList.remove('active'));
                            // Add 'active' to the clicked sub-tab button
                            e.currentTarget.classList.add('active');

                            const targetSubtab = e.currentTarget.dataset.subtab;
                            friendsSubTabContent.innerHTML = '<p style="text-align:center; padding: 10px;">Loading...</p>'; // Show loading

                            switch (targetSubtab) {
                                case 'recent-chats':
                                    friendsSubTabContent.innerHTML = `
                                        <div class="private-chat-layout-panels full-width">
                                            <div class="recent-chats-panel full-width">
                                                <div class="panel-header">Recent Chats</div>
                                                <div class="recent-chats-list-scroll-wrapper">
                                                    <ul id="recentChatsList" class="recent-chats-list">
                                                        <li class="chat-item loading-message">Loading recent chats...</li>
                                                    </ul>
                                                </div>
                                            </div>
                                            <div class="selected-chat-panel" style="display:none;"> 
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
                                    `;
                                    setTimeout(() => {
                                        initPrivateChatTabEventListeners(); // Re-initialize listeners for private chat elements
                                        loadRecentChats(); // Load actual recent chats
                                    }, 0);
                                    break;
                                case 'friends-list':
                                    // Inject friends list HTML into sub-tab content area
                                    friendsSubTabContent.innerHTML = `
                                        <div class="friends-list-section full-width">
                                            <div class="header-box">
                                                <b>Your Friends</b>
                                            </div>
                                            <div class="search-bar">
                                                <input type="text" id="friendsSearchInput" placeholder="Search friends...">
                                                <span class="search-icon">🔍</span>
                                            </div>
                                            <div id="friendsScrollableList" class="scrollable-list">
                                                <p style="text-align:center; padding: 10px;">Loading your friends list...</p>
                                            </div>
                                            <div class="add-friend-section">
                                                <input type="text" id="addFriendIdInput" placeholder="Torn ID to add">
                                                <button id="addFriendBtn">Add Friend</button>
                                                <span id="addFriendStatus" class="status-message"></span>
                                            </div>
                                        </div>
                                    `;
                                    // Call fetchAndDisplayFriends to populate the list
                                    const friendsScrollableListElement = document.getElementById('friendsScrollableList');
                                    if (friendsScrollableListElement) { // Check if element exists after injection
                                        if (auth.currentUser) {
                                            // The fetchAndDisplayFriends function expects `friendsTbody` to display data.
                                            // You need to decide if you want to reuse that table structure, or adapt it
                                            // to render into `friendsScrollableListElement`.
                                            // For simplicity, let's just use populateBlockedPeopleTab for now as it uses the list structure
                                            // This might duplicate efforts but ensures something shows up.
                                            populateBlockedPeopleTab(auth.currentUser.uid, friendsScrollableListElement, document.createElement('div')); // Pass a dummy for ignoresListEl
                                        } else {
                                            friendsScrollableListElement.innerHTML = `<p style="text-align:center; padding: 10px; color: yellow;">Please log in to view friends.</p>`;
                                        }
                                    }
                                    // Re-attach listener for add friend button (it's globally defined in DOMContentLoaded)
                                    const addFriendBtnEl = document.getElementById('addFriendBtn');
                                    if (addFriendBtnEl) {
                                        // Remove previous listener if exists to prevent duplicates
                                        addFriendBtnEl.removeEventListener('click', handleAddFriendWrapper); 
                                        addFriendBtnEl.addEventListener('click', handleAddFriendWrapper);
                                    }
                                    break;
                                case 'ignores-list':
                                    // Inject ignores list HTML into sub-tab content area
                                    friendsSubTabContent.innerHTML = `
                                        <div class="ignores-list-section full-width">
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
                                            <div class="add-ignore-section">
                                                </div>
                                        </div>
                                    `;
                                    // Populate dummy ignores or real ones if you implement them
                                    const ignoresScrollableListElement = document.getElementById('ignoresScrollableList');
                                    if (ignoresScrollableListElement) {
                                        // Reuse populateBlockedPeopleTab for ignores, passing a dummy for friends list
                                        populateBlockedPeopleTab(auth.currentUser.uid, document.createElement('div'), ignoresScrollableListElement);
                                    }
                                    break;
                            }
                        });
                    });

                    // Initially click the "Recent Chats" sub-tab to load its content by default
                    const initialSubTab = friendsPanel.querySelector('.sub-tab-button[data-subtab="recent-chats"]');
                    if (initialSubTab) {
                        initialSubTab.click(); // Programmatically click to load content
                    }
                });
            }
            // --- END REVISED: Friends Icon Click Listener ---

            // --- REVISED: Notifications Icon Click Listener (Bell Icon) ---
            if (openNotificationsIcon) {
                openNotificationsIcon.addEventListener('click', () => {
                    openChatPanel(notificationsPanel);
                    // Call the function that populates NotificationsPanel content if needed
                    // Example: populateNotificationsTab(notificationsPanel);
                    // If content is static HTML already in globalchat.html, no further action here.
                });
            }
            // --- END REVISED: Notifications Icon Click Listener ---

            // --- REVISED: Settings Icon Click Listener (Gear Icon) ---
            if (openSettingsIcon) {
                openSettingsIcon.addEventListener('click', () => {
                    openChatPanel(settingsPanel);
                    // Call the function that populates SettingsPanel content
                    populateSettingsTab(settingsPanel); // Use settingsPanel directly as targetDisplayElement
                });
            }
            // --- END REVISED: Settings Icon Click Listener ---
            
            // --- Minimize Button Logic ---
            minimizeChatBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    if (chatWindow) chatWindow.classList.add('hidden');
                    if (chatBarCollapsed) chatBarCollapsed.classList.remove('hidden');
                });
            });

            // --- Tab Switching Logic for main tabs (if still in use) ---
            allTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const targetPanelId = tab.dataset.tabTarget;
                    const targetPanel = document.getElementById(targetPanelId);

                    allTabs.forEach(t => t.classList.remove('active'));
                    allPanels.forEach(p => p.classList.add('hidden'));
                    tab.classList.add('active');
                    if (targetPanel) targetPanel.classList.remove('hidden');
                    
                    if (targetPanelId === 'friends-panel') {
                        // If friends-panel is opened via main tabs, simulate click on its default sub-tab
                        const initialSubTab = friendsPanel.querySelector('.friends-panel-subtabs .sub-tab-button[data-subtab="recent-chats"]');
                        if (initialSubTab) {
                            initialSubTab.click();
                        }
                    }
                });
            });

            // --- Send Message Logic ---
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
                // Store faction_id as a string in the shared scope variable
                currentUserFactionId = String(userData.faction_id); 
                currentTornUserName = userData.preferredName || 'Unknown User';
                console.log(`User logged in. Faction ID: ${currentUserFactionId}, Name: ${currentTornUserName}`);
            } else {
                console.warn("User profile not found for authenticated user:", user.uid);
                currentUserFactionId = null; // Ensure it's null if profile is missing
            }
        } else {
            // User is signed out
            if (unsubscribeFromChat) unsubscribeFromChat();
            chatMessagesCollection = null;
            currentUserFactionId = null; // Clear faction ID on logout
            const chatDisplayAreaFaction = document.getElementById('chat-display-area');
            const chatDisplayAreaWar = document.getElementById('war-chat-display-area');

            if (chatDisplayAreaFaction) chatDisplayAreaFaction.innerHTML = '<p>Please log in to use chat.</p>';
            if (chatDisplayAreaWar) chatDisplayAreaWar.innerHTML = '<p>Please log in to use war chat.</p>';
            console.log("User logged out. Chat functionalities are reset.");
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
        if (collectionType === 'faction') {
            // Use the globally available currentUserFactionId
            if (currentUserFactionId) { 
                targetCollection = db.collection('factionChats').doc(currentUserFactionId).collection('messages');
                console.log(`Attempting to send message to faction chat path: factionChats/${currentUserFactionId}/messages`);
            } else {
                console.warn("Faction ID not available for current user. Cannot send faction chat message.");
                return;
            }
        } else if (collectionType === 'war') {
            targetCollection = db.collection('warChats').doc('currentWar').collection('messages');
            console.log(`Attempting to send message to war chat path: warChats/currentWar/messages`);
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
            textInput.value = ''; // Clear input field
            textInput.focus();    // Keep focus on input field
        } catch (error) {
            console.error(`Error sending ${collectionType} message to Firebase:`, error);
        }
    }

    function setupChatRealtimeListener(type) {
        let chatDisplayArea = null;
        let collectionRef = null;
        let displayAreaId = '';

        if (unsubscribeFromChat) {
            unsubscribeFromChat(); // Unsubscribe from previous listener to prevent multiple listeners
            console.log("Unsubscribed from previous chat listener.");
        }

        if (type === 'faction' && auth.currentUser) {
            // Use the globally available currentUserFactionId
            if (currentUserFactionId) {
                collectionRef = db.collection('factionChats').doc(currentUserFactionId).collection('messages');
                displayAreaId = 'chat-display-area';
                chatDisplayArea = document.getElementById(displayAreaId);
                if (chatDisplayArea) chatDisplayArea.innerHTML = '<p>Loading faction messages...</p>';
                console.log(`Setting up faction chat listener for path: factionChats/${currentUserFactionId}/messages`);
                
                if (collectionRef) {
                    unsubscribeFromChat = collectionRef.orderBy('timestamp', 'asc').limitToLast(50)
                        .onSnapshot(snapshot => {
                            if (chatDisplayArea) chatDisplayArea.innerHTML = ''; // Clear previous messages
                            if (snapshot.empty) {
                                if (chatDisplayArea) chatDisplayArea.innerHTML = `<p>No faction messages yet.</p>`;
                                return;
                            }
                            snapshot.forEach(doc => displayChatMessage(doc.data(), displayAreaId));
                        }, error => {
                            console.error("Error listening to faction chat messages:", error);
                            if (chatDisplayArea) chatDisplayArea.innerHTML = `<p style="color: red;">Error loading faction messages.</p>`;
                        });
                }
            } else {
                chatDisplayArea = document.getElementById('chat-display-area');
                if (chatDisplayArea) chatDisplayArea.innerHTML = '<p>Faction ID not found for chat. Please ensure your profile is complete.</p>';
                console.warn("User has no faction ID to set up faction chat listener.");
            }
        } else if (type === 'war') {
            collectionRef = db.collection('warChats').doc('currentWar').collection('messages');
            displayAreaId = 'war-chat-display-area';
            chatDisplayArea = document.getElementById(displayAreaId);
            if (chatDisplayArea) chatDisplayArea.innerHTML = '<p>Loading war messages...</p>';
            console.log(`Setting up war chat listener for path: warChats/currentWar/messages`);

            if (collectionRef) {
                unsubscribeFromChat = collectionRef.orderBy('timestamp', 'asc').limitToLast(50)
                    .onSnapshot(snapshot => {
                        if (chatDisplayArea) chatDisplayArea.innerHTML = '';
                        if (snapshot.empty) {
                            if (chatDisplayArea) chatDisplayArea.innerHTML = `<p>No war messages yet.</p>`;
                            return;
                        }
                        snapshot.forEach(doc => displayChatMessage(doc.data(), displayAreaId));
                    }, error => {
                        console.error("Error listening to war chat messages:", error);
                        if (chatDisplayArea) chatDisplayArea.innerHTML = `<p style="color: red;">Error loading war messages.</p>`;
                    });
            }

        } else {
            console.warn("Unknown chat type or user not logged in for real-time listener.");
        }
    }

    // New helper function for adding friend logic (to be called by the add friend button in Friends List sub-tab)
    async function handleAddFriendWrapper(event) {
        const friendId = document.getElementById('addFriendIdInput').value.trim();
        const addFriendStatusEl = document.getElementById('addFriendStatus');

        if (!friendId) {
            if (addFriendStatusEl) { addFriendStatusEl.textContent = "Please enter a Torn Player ID."; addFriendStatusEl.style.color = 'orange'; }
            return;
        }

        if (!auth.currentUser) {
            if (addFriendStatusEl) { addFriendStatusEl.textContent = "You must be logged in to add friends."; addFriendStatusEl.style.color = 'red'; }
            return;
        }

        if (addFriendStatusEl) { addFriendStatusEl.textContent = "Adding friend..."; addFriendStatusEl.style.color = 'white'; }
        event.currentTarget.disabled = true; // Disable the button clicked

        try {
            const friendDocRef = db.collection('userProfiles').doc(auth.currentUser.uid).collection('friends').doc(friendId);
            const doc = await friendDocRef.get();
            if (doc.exists) {
                if (addFriendStatusEl) { addFriendStatusEl.textContent = "This player is already your friend."; addFriendStatusEl.style.color = 'orange'; }
                return;
            }

            await friendDocRef.set({
                addedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            if (addFriendStatusEl) { addFriendStatusEl.textContent = `Successfully added friend [${friendId}]!`; addFriendStatusEl.style.color = 'lightgreen'; }
            document.getElementById('addFriendIdInput').value = '';

            // Refresh the friends list in the current view if it's the friends-list subtab
            const friendsSubTabContent = document.getElementById('friendsSubTabContent');
            if (friendsSubTabContent) {
                 const friendsScrollableListElement = friendsSubTabContent.querySelector('#friendsScrollableList');
                 if (friendsScrollableListElement) {
                     // Re-populate the friends list using the established function
                     populateBlockedPeopleTab(auth.currentUser.uid, friendsScrollableListElement, document.createElement('div'));
                 }
            }

        } catch (error) {
            console.error("Error adding friend:", error);
            if (addFriendStatusEl) { addFriendStatusEl.textContent = `Error adding friend: ${error.message}`; addFriendStatusEl.style.color = 'red'; }
        } finally {
            event.currentTarget.disabled = false; // Re-enable the button
        }
    }
}

// Run the main initialization function
initializeGlobals();