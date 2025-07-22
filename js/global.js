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
    fetch('globalchat.html') // <-- CHANGED FILENAME HERE
        .then(response => response.text())
        .then(data => {
            document.getElementById('chat-system-placeholder').innerHTML = data;
            
            // All the event listeners for the chat now live inside this fetch,
            // so they only run after the chat HTML has been loaded.
            const chatBarCollapsed = document.getElementById('chat-bar-collapsed');
            const chatWindow = document.getElementById('chat-window');
            const chatMainTabsContainer = document.querySelector('.chat-main-tabs-container'); // Get the main tabs container
            
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

            // Get all chat panels and tabs for easy iteration
            const allPanels = document.querySelectorAll('.chat-panel');
            const allTabs = document.querySelectorAll('.chat-tab'); // Still needed for tab switching logic for Friends/Notifications/Settings

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
                
                allPanels.forEach(p => p.classList.add('hidden')); // Hide all panels
                if (panelToShow) panelToShow.classList.remove('hidden'); // Show the target panel
            }

            // --- Event Listeners for Collapsed Chat Bar Icons ---

            // Faction Chat Icon Click
            if (openFactionChatIcon) {
                openFactionChatIcon.addEventListener('click', () => {
                    openChatPanel(factionChatPanel);
                    if (chatMainTabsContainer) chatMainTabsContainer.classList.add('hidden'); // Ensure main tabs are hidden
                    // You might want to focus the input here
                    if (factionChatTextInput) factionChatTextInput.focus();
                    setupChatRealtimeListener('faction'); // Pass 'faction' to differentiate if needed later
                });
            }

            // War Chat Icon Click
            if (openWarChatIcon) {
                openWarChatIcon.addEventListener('click', () => {
                    openChatPanel(warChatPanel);
                    if (chatMainTabsContainer) chatMainTabsContainer.classList.add('hidden'); // Ensure main tabs are hidden
                    if (warChatTextInput) warChatTextInput.focus(); // Focus war chat input
                    setupChatRealtimeListener('war'); // Pass 'war' to differentiate if needed later
                });
            }

            // Friends Icon Click
            if (openFriendsIcon) {
                openFriendsIcon.addEventListener('click', () => {
                    openChatPanel(friendsPanel);
                    if (chatMainTabsContainer) chatMainTabsContainer.classList.remove('hidden'); // Show main tabs for Friends, Notifications, Settings
                    // Activate the Friends tab visually if necessary
                    allTabs.forEach(t => t.classList.remove('active'));
                    document.querySelector('[data-tab-target="friends-panel"]').classList.add('active');
                });
            }

            // Notifications Icon Click
            if (openNotificationsIcon) {
                openNotificationsIcon.addEventListener('click', () => {
                    openChatPanel(notificationsPanel);
                    if (chatMainTabsContainer) chatMainTabsContainer.classList.remove('hidden'); // Show main tabs
                    allTabs.forEach(t => t.classList.remove('active'));
                    document.querySelector('[data-tab-target="notifications-panel"]').classList.add('active');
                });
            }

            // Settings Icon Click
            if (openSettingsIcon) {
                openSettingsIcon.addEventListener('click', () => {
                    openChatPanel(settingsPanel);
                    if (chatMainTabsContainer) chatMainTabsContainer.classList.remove('hidden'); // Show main tabs
                    allTabs.forEach(t => t.classList.remove('active'));
                    document.querySelector('[data-tab-target="settings-panel"]').classList.add('active');
                });
            }
            
            // --- Minimize Button Logic (for the new '-' buttons) ---
            minimizeChatBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    if (chatWindow) chatWindow.classList.add('hidden');
                    if (chatBarCollapsed) chatBarCollapsed.classList.remove('hidden');
                });
            });

            // --- Tab Switching Logic for main tabs (Friends, Notifications, Settings) ---
            allTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const targetPanelId = tab.dataset.tabTarget;
                    const targetPanel = document.getElementById(targetPanelId);

                    // Only handle switching if it's one of the panels meant to be under main tabs
                    if (['friends-panel', 'notifications-panel', 'settings-panel'].includes(targetPanelId)) {
                        allTabs.forEach(t => t.classList.remove('active'));
                        allPanels.forEach(p => p.classList.add('hidden'));
                        tab.classList.add('active');
                        if (targetPanel) targetPanel.classList.remove('hidden');
                        
                        // Re-hide main tabs if Faction or War chat is somehow selected via this listener
                        // (Though with the new logic, this block will only apply to friends/notifications/settings)
                        if (targetPanelId === 'faction-chat-panel' || targetPanelId === 'war-chat-panel') {
                             if (chatMainTabsContainer) chatMainTabsContainer.classList.add('hidden');
                        } else {
                            if (chatMainTabsContainer) chatMainTabsContainer.classList.remove('hidden');
                        }
                    }
                });
            });

            // --- Send Message Logic (now applies to respective chat inputs) ---
            function setupMessageSending(textInput, sendBtn, collectionType) {
                if (sendBtn) {
                    sendBtn.onclick = async () => { // Use onclick to allow reassignment
                        await sendChatMessage(textInput, collectionType);
                    };
                }
                if (textInput) {
                    textInput.onkeydown = async (event) => { // Use onkeydown to allow reassignment
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            await sendChatMessage(textInput, collectionType);
                        }
                    };
                }
            }
            
            // Initial setup for faction chat send
            setupMessageSending(factionChatTextInput, factionChatSendBtn, 'faction');
            // Initial setup for war chat send (assuming it now exists)
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
                // No immediate setupChatRealtimeListener call here, it's triggered by icon clicks
            }
        } else {
            if (unsubscribeFromChat) unsubscribeFromChat();
            chatMessagesCollection = null;
            const chatDisplayAreaFaction = document.getElementById('chat-display-area'); // For faction chat
            const chatDisplayAreaWar = document.getElementById('war-chat-display-area'); // For war chat

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
        if (!textInput || !auth.currentUser) return; // Removed chatMessagesCollection check here
        const messageText = textInput.value.trim();
        if (messageText === '') return;
        
        // Determine which collection to use based on collectionType
        let targetCollection = null;
        if (collectionType === 'faction' && auth.currentUser.uid) { // Ensure factionId is available
            const userProfileRef = db.collection('userProfiles').doc(auth.currentUser.uid);
            const doc = await userProfileRef.get();
            if (doc.exists && doc.data().faction_id) {
                targetCollection = db.collection('factionChats').doc(String(doc.data().faction_id)).collection('messages');
            } else {
                console.warn("Faction ID not found for current user. Cannot send faction chat message.");
                return;
            }
        } else if (collectionType === 'war') {
            // For war chat, you'll need to define how to get the 'war' collection reference
            // This might involve a specific war ID or a general war chat collection.
            // For now, I'll put a placeholder. You'll need to adjust this.
            targetCollection = db.collection('warChats').doc('currentWar').collection('messages'); // Placeholder
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

    // Modified to accept a type parameter to distinguish between faction and war chat
    function setupChatRealtimeListener(type) {
        let chatDisplayArea = null;
        let collectionRef = null;

        if (unsubscribeFromChat) unsubscribeFromChat(); // Unsubscribe from previous listener

        if (type === 'faction' && auth.currentUser) {
            // Re-fetch factionId to ensure it's current
            db.collection('userProfiles').doc(auth.currentUser.uid).get().then(doc => {
                if (doc.exists && doc.data().faction_id) {
                    collectionRef = db.collection('factionChats').doc(String(doc.data().faction_id)).collection('messages');
                    chatDisplayArea = document.getElementById('chat-display-area'); // Faction chat display area
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
            // For war chat, you'll need to define the correct collection reference
            // For now, using a placeholder.
            collectionRef = db.collection('warChats').doc('currentWar').collection('messages'); // Placeholder
            chatDisplayArea = document.getElementById('war-chat-display-area'); // War chat display area
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