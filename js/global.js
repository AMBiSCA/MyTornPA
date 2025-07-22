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

