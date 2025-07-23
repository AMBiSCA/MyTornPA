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

function initializeGlobals() {
    // ---- Firebase Setup ----
    const db = firebase.firestore();
    const auth = firebase.auth();
    let chatMessagesCollection = null;
    let unsubscribeFromChat = null;
    let currentTornUserName = 'Unknown';
    let currentUserFactionId = null;
    let userTornApiKey = null;

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
                        setupChatRealtimeListener('alliance'); // Assuming 'alliance' collection type
                    });
                }

                if (openWarChatIcon) {
                    openWarChatIcon.addEventListener('click', () => {
                        openChatPanel(warChatPanel);
                        if (warChatTextInput) warChatTextInput.focus();
                        setupChatRealtimeListener('war');
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
                    openSettingsIcon.addEventListener('click', () => {
                        openChatPanel(settingsPanel);
                    });
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
                                setupChatRealtimeListener('war');
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
                        friendsPanelContent.innerHTML = `<p style="text-align: center; color: #888; padding-top: 20px;">Recent chats content would load here.</p>`;
                        // TODO: Implement actual loadRecentPrivateChats(friendsPanelContent);
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
                            friendsPanelContent.innerHTML = `<p style="text-align:center; padding: 10px; color: orange;">Faction ID or API key not found. Please log in and ensure your profile is complete.</p>`;
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
                // NEW: Setup message sending for alliance chat
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
                currentTornUserName = userData.preferredName || 'Unknown User';
                userTornApiKey = userData.tornApiKey; // Corrected casing

                // Make globals accessible to functions outside this scope, especially for re-rendering
                window.currentUserFactionId = currentUserFactionId;
                window.userTornApiKey = userTornApiKey;
                window.TORN_API_BASE_URL = TORN_API_BASE_URL; // Expose TORN_API_BASE_URL globally

                console.log(`User logged in. Faction ID: ${currentUserFactionId}, Name: ${currentTornUserName}, API Key Present: ${!!userTornApiKey}`);
            } else {
                console.warn("User profile not found for authenticated user:", user.uid);
                currentUserFactionId = null;
                userTornApiKey = null;
                // Clear globals on logout/missing profile
                window.currentUserFactionId = null;
                window.userTornApiKey = null;
                window.TORN_API_BASE_URL = null;
            }
        } else {
            // User is signed out
            if (unsubscribeFromChat) unsubscribeFromChat();
            chatMessagesCollection = null;
            currentUserFactionId = null;
            currentUserFactionId = null; // Clear API key on logout
            // Clear globals on logout
            window.currentUserFactionId = null;
            window.userTornApiKey = null;
            window.TORN_API_BASE_URL = null;

            const chatDisplayAreaFaction = document.getElementById('chat-display-area');
            const chatDisplayAreaWar = document.getElementById('war-chat-display-area');
            const chatDisplayAreaAlliance = document.getElementById('alliance-chat-display-area'); // NEW: Alliance Chat display area

            if (chatDisplayAreaFaction) chatDisplayAreaFaction.innerHTML = '<p>Please log in to use chat.</p>';
            if (chatDisplayAreaWar) chatDisplayAreaWar.innerHTML = '<p>Please log in to use war chat.</p>';
            if (chatDisplayAreaAlliance) chatDisplayAreaAlliance.innerHTML = '<p>Please log in to use alliance chat.</p>'; // NEW: Alliance Chat message
            console.log("User logged out. Chat functionalities are reset.");
        }
    });
	
	function openPrivateChatWindow(userId, userName) {
    // First, remove any other private chat window that might be open
    const existingWindow = document.querySelector('.private-chat-window');
    if (existingWindow) {
        // Important: Manually trigger the close button's click to unsubscribe from listeners
        existingWindow.querySelector('.pcw-close-btn').click();
    }

    // Create the main window container
    const chatDiv = document.createElement('div');
    chatDiv.className = 'private-chat-window';
    chatDiv.id = `private-chat-window-${userId}`;

    // Create the inner HTML for the window
    chatDiv.innerHTML = `
        <div class="pcw-header">
            <span class="pcw-title" title="${userName} [${userId}]">Chat with ${userName}</span>
            <button class="pcw-close-btn" title="Close">×</button>
        </div>
        <div class="pcw-messages">
            <p style="color: #888;">Loading messages...</p>
        </div>
        <div class="pcw-input-area">
            <input type="text" class="pcw-input" placeholder="Type a message...">
            <button class="pcw-send-btn">Send</button>
        </div>
    `;

    // Add the new chat window to the page
    document.body.appendChild(chatDiv);

    // Make the close button work (it now only handles removing the element)
    chatDiv.querySelector('.pcw-close-btn').addEventListener('click', () => {
        chatDiv.remove();
    });

    // --- THIS IS THE NEW LINE ---
    // After creating the window, call the function to load its messages and make it work
    loadAndHandlePrivateChat(userId, userName, chatDiv);
}
	
	async function populateFriendListTab(targetDisplayElement) {
    if (!targetDisplayElement) {
        console.error("HTML Error: Target display element not provided for Friend List tab.");
        return;
    }
    targetDisplayElement.innerHTML = `<p style="text-align:center; padding: 20px;">Loading your friend list...</p>`;

    const currentUser = auth.currentUser;
    if (!currentUser) {
        targetDisplayElement.innerHTML = '<p style="text-align:center; color: orange;">Please log in to see your friends.</p>';
        return;
    }

    try {
        const friendsSnapshot = await db.collection('userProfiles').doc(currentUser.uid).collection('friends').get();

        if (friendsSnapshot.empty) {
            targetDisplayElement.innerHTML = '<p style="text-align:center; padding: 20px;">You have not added any friends yet.</p>';
            return;
        }

        const friendDetailsPromises = friendsSnapshot.docs.map(doc => {
            const friendTornId = doc.id;
            return db.collection('users').doc(friendTornId).get().then(userDoc => {
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    const friendName = userData.name || `User ID ${friendTornId}`;
                    const profileImage = userData.profile_image || '../../images/default_profile_icon.png';
                    return { id: friendTornId, name: friendName, image: profileImage };
                }
                return { id: friendTornId, name: `Unknown [${friendTornId}]`, image: '../../images/default_profile_icon.png' };
            });
        });

        const friendDetails = await Promise.all(friendDetailsPromises);

        let cardsHtml = '';
        friendDetails.forEach(friend => {
            // --- CHANGE IS HERE: The link is now a button with data attributes ---
            cardsHtml += `
                <div class="member-item">
                    <div class="member-identity">
                        <img src="${friend.image}" alt="${friend.name}'s profile pic" class="member-profile-pic">
                        <a href="https://www.torn.com/profiles.php?XID=${friend.id}" target="_blank" class="member-name">${friend.name}</a>
                    </div>
                    <div class="member-actions">
                        <button class="item-button message-friend-button" data-friend-id="${friend.id}" data-friend-name="${friend.name}" title="Send Message">✉️</button>
                        <button class="item-button remove-friend-button" data-friend-id="${friend.id}" title="Remove Friend">🗑️</button>
                    </div>
                </div>`;
        });

        const membersListContainer = document.createElement('div');
        membersListContainer.className = 'members-list-container';
        membersListContainer.innerHTML = cardsHtml;
        targetDisplayElement.innerHTML = '';
        targetDisplayElement.appendChild(membersListContainer);

        // Add event listener for remove and message buttons
        membersListContainer.addEventListener('click', async (event) => {
            const removeButton = event.target.closest('.remove-friend-button');
            const messageButton = event.target.closest('.message-friend-button');

            if (removeButton) {
                const friendIdToRemove = removeButton.dataset.friendId;
                const userConfirmed = await showCustomConfirm(`Are you sure you want to remove friend [${friendIdToRemove}]?`, "Confirm Removal");
                if (userConfirmed) {
                    await db.collection('userProfiles').doc(currentUser.uid).collection('friends').doc(friendIdToRemove).delete();
                    populateFriendListTab(targetDisplayElement); // Refresh the list
                }
            } else if (messageButton) {
                // --- CHANGE IS HERE: This handles the click on the new message button ---
                const friendId = messageButton.dataset.friendId;
                const friendName = messageButton.dataset.friendName;
                openPrivateChatWindow(friendId, friendName);
            }
        });

    } catch (error) {
        console.error("Error populating Friend List tab:", error);
        targetDisplayElement.innerHTML = `<p style="color: red; text-align:center;">Error: ${error.message}</p>`;
    }
}

// This helper function creates the HTML for a single message bubble
function displayPrivateChatMessage(messageObj, displayElement) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message'); // Using existing class for style consistency

    const timestamp = messageObj.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '';
    const senderName = messageObj.sender || 'Unknown';
    const messageText = messageObj.text || '';

    // Simple message structure
    messageElement.innerHTML = `
        <span class="chat-timestamp">[${timestamp}]</span>
        <span class="chat-sender">${senderName}:</span>
        <span class="chat-text">${messageText}</span>
    `;
    displayElement.appendChild(messageElement);
}

// This function loads messages and handles sending for a private chat window
function loadAndHandlePrivateChat(userId, userName, chatWindowElement) {
    const messagesContainer = chatWindowElement.querySelector('.pcw-messages');
    const inputField = chatWindowElement.querySelector('.pcw-input');
    const sendButton = chatWindowElement.querySelector('.pcw-send-btn');

    const currentUser = auth.currentUser;
    if (!currentUser) {
        messagesContainer.innerHTML = '<p style="color: red;">You must be logged in.</p>';
        return;
    }

    // Determine the unique ID for the chat document in Firestore
    const participants = [currentUser.uid, userId].sort();
    const chatDocId = `private_${participants[0]}_${participants[1]}`;
    const messagesCollectionRef = db.collection('privateChats').doc(chatDocId).collection('messages');

    // --- Real-time listener to load and display messages ---
    const unsubscribe = messagesCollectionRef.orderBy('timestamp', 'asc').onSnapshot(snapshot => {
        messagesContainer.innerHTML = ''; // Clear "Loading..." message
        if (snapshot.empty) {
            messagesContainer.innerHTML = `<p style="color: #888;">No messages yet. Say hello!</p>`;
        } else {
            snapshot.forEach(doc => {
                displayPrivateChatMessage(doc.data(), messagesContainer);
            });
            // Auto-scroll to the bottom
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }, error => {
        console.error("Error loading private messages:", error);
        messagesContainer.innerHTML = `<p style="color: red;">Error loading messages.</p>`;
    });

    // --- Function to send a message ---
    const sendMessage = async () => {
        const messageText = inputField.value.trim();
        if (messageText === '') return;

        const messageObj = {
            senderId: currentUser.uid,
            sender: currentTornUserName, // Global variable for the current user's name
            text: messageText,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            // Ensure the parent document exists
            await db.collection('privateChats').doc(chatDocId).set({ 
                participants: participants,
                lastMessageAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // Add the new message
            await messagesCollectionRef.add(messageObj);
            inputField.value = '';
            inputField.focus();
        } catch (error) {
            console.error("Error sending private message:", error);
            alert("Failed to send message.");
        }
    };

    // --- Hook up the send button and Enter key ---
    sendButton.addEventListener('click', sendMessage);
    inputField.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendMessage();
        }
    });

    // When the window is closed, we must stop listening for messages to prevent memory leaks
    const closeButton = chatWindowElement.querySelector('.pcw-close-btn');
    closeButton.addEventListener('click', () => {
        unsubscribe(); // This stops the real-time listener
    });
}


async function populateIgnoreListTab(targetDisplayElement) {
    if (!targetDisplayElement) {
        console.error("HTML Error: Target display element not provided for Ignore List tab.");
        return;
    }
    targetDisplayElement.innerHTML = `<p style="text-align:center; padding: 20px;">Loading your ignore list...</p>`;

    const currentUser = auth.currentUser;
    if (!currentUser) {
        targetDisplayElement.innerHTML = '<p style="text-align:center; color: orange;">Please log in to see your ignore list.</p>';
        return;
    }

    try {
        // IMPORTANT: This assumes your ignored users are stored in a subcollection named 'ignored'
        const ignoredSnapshot = await db.collection('userProfiles').doc(currentUser.uid).collection('ignored').get();

        if (ignoredSnapshot.empty) {
            targetDisplayElement.innerHTML = '<p style="text-align:center; padding: 20px;">Your ignore list is empty.</p>';
            return;
        }

        const ignoredDetailsPromises = ignoredSnapshot.docs.map(doc => {
            const ignoredTornId = doc.id;
            return db.collection('users').doc(ignoredTornId).get().then(userDoc => {
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    const ignoredName = userData.name || `User ID ${ignoredTornId}`;
                    const profileImage = userData.profile_image || '../../images/default_profile_icon.png';
                    return { id: ignoredTornId, name: ignoredName, image: profileImage };
                }
                return { id: ignoredTornId, name: `Unknown [${ignoredTornId}]`, image: '../../images/default_profile_icon.png' };
            });
        });

        const ignoredDetails = await Promise.all(ignoredDetailsPromises);

        let cardsHtml = '';
        ignoredDetails.forEach(ignored => {
            cardsHtml += `
                <div class="member-item">
                    <div class="member-identity">
                        <img src="${ignored.image}" alt="${ignored.name}'s profile pic" class="member-profile-pic">
                        <a href="https://www.torn.com/profiles.php?XID=${ignored.id}" target="_blank" class="member-name">${ignored.name}</a>
                    </div>
                    <div class="member-actions">
                        <button class="item-button unignore-button" data-ignored-id="${ignored.id}" title="Remove from Ignore List">🗑️</button>
                    </div>
                </div>`;
        });

        const membersListContainer = document.createElement('div');
        membersListContainer.className = 'members-list-container';
        membersListContainer.innerHTML = cardsHtml;
        targetDisplayElement.innerHTML = '';
        targetDisplayElement.appendChild(membersListContainer);

        // Add event listener for unignore buttons
        membersListContainer.addEventListener('click', async (event) => {
            if (event.target.classList.contains('unignore-button')) {
                const ignoredIdToRemove = event.target.dataset.ignoredId;
                const userConfirmed = await showCustomConfirm(`Are you sure you want to unignore user [${ignoredIdToRemove}]?`, "Confirm Removal");
                if (userConfirmed) {
                    await db.collection('userProfiles').doc(currentUser.uid).collection('ignored').doc(ignoredIdToRemove).delete();
                    populateIgnoreListTab(targetDisplayElement); // Refresh the list
                }
            }
        });

    } catch (error) {
        console.error("Error populating Ignore List tab:", error);
        targetDisplayElement.innerHTML = `<p style="color: red; text-align:center;">Error: ${error.message}</p>`;
    }
}
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
        } else if (collectionType === 'alliance') { // NEW: Alliance chat collection
            // You need a way to determine the alliance ID.
            // For example, if you store it in userProfile or have a specific doc for alliances.
            // For now, let's assume a fixed 'defaultAlliance' ID for testing, or derive it from currentUserFactionId.
            // Example: db.collection('alliances').doc(currentUserFactionId).collection('messages');
            // Or if a single global alliance chat: db.collection('allianceChats').doc('globalAlliance').collection('messages');
            // For demonstration, let's use a placeholder 'yourAllianceId' that needs to be properly defined.
            // This is a critical point: how do you identify the specific alliance chat?
            const allianceId = 'defaultAllianceChat'; // <<-- IMPORTANT: Replace with actual alliance ID logic
            targetCollection = db.collection('allianceChats').doc(allianceId).collection('messages');
            console.log(`Attempting to send message to alliance chat path: allianceChats/${allianceId}/messages`);
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

        } else if (type === 'alliance' && auth.currentUser) { // NEW: Alliance chat listener
            // You need a way to determine the alliance ID for the current user.
            // This is a critical step for your application logic.
            // Example: Get alliance ID from userProfile, or a global config.
            // For now, using a placeholder 'defaultAllianceChat'.
            const allianceId = 'defaultAllianceChat'; // <<-- IMPORTANT: Replace with actual alliance ID logic

            collectionRef = db.collection('allianceChats').doc(allianceId).collection('messages');
            displayAreaId = 'alliance-chat-display-area';
            chatDisplayArea = document.getElementById(displayAreaId);
            if (chatDisplayArea) chatDisplayArea.innerHTML = '<p>Loading alliance messages...</p>';
            console.log(`Setting up alliance chat listener for path: allianceChats/${allianceId}/messages`);

            if (collectionRef) {
                unsubscribeFromChat = collectionRef.orderBy('timestamp', 'asc').limitToLast(50)
                    .onSnapshot(snapshot => {
                        if (chatDisplayArea) chatDisplayArea.innerHTML = '';
                        if (snapshot.empty) {
                            if (chatDisplayArea) chatDisplayArea.innerHTML = `<p>No alliance messages yet.</p>`;
                            return;
                        }
                        snapshot.forEach(doc => displayChatMessage(doc.data(), displayAreaId));
                    }, error => {
                        console.error("Error listening to alliance chat messages:", error);
                        if (chatDisplayArea) chatDisplayArea.innerHTML = `<p style="color: red;">Error loading alliance messages.</p>`;
                    });
            }
        }
        else {
            console.warn("Unknown chat type or user not logged in for real-time listener.");
        }
    }
} // END of initializeGlobals function

async function populateRecentlyMetTab(targetDisplayElement) {
    if (!targetDisplayElement) {
        console.error("HTML Error: Target display element not provided for Recently Met tab.");
        return;
    }

    targetDisplayElement.innerHTML = `<p style="text-align:center; padding: 20px;">Loading war history to find opponents...</p>`;

    try {
        const userApiKey = window.userTornApiKey;
        const globalYourFactionID = window.currentUserFactionId;
        const db = firebase.firestore(); // Ensure db is accessible

        if (!userApiKey || !globalYourFactionID) {
            targetDisplayElement.innerHTML = `<p style="text-align:center; padding: 10px; color: orange;">API key or Faction ID not available. Please log in.</p>`;
            return;
        }

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
                        // Store full member object including name, and potentially rank if available from API
                        opponentsMap.set(member.id, { id: member.id, name: member.name, position: 'Opponent' }); // Default position for display
                    }
                });
            }
        });

        const uniqueOpponentIds = Array.from(opponentsMap.keys()).map(String);
        if (uniqueOpponentIds.length === 0) {
            targetDisplayElement.innerHTML = '<p style="text-align:center; padding: 20px;">Could not find any opponents in recent wars.</p>';
            return;
        }

        // Fetch registered user profile images from 'users' collection
        const registeredUsersData = new Map();
        const chunkSize = 30;
        for (let i = 0; i < uniqueOpponentIds.length; i += chunkSize) {
            const chunk = uniqueOpponentIds.slice(i, i + chunkSize);
            const querySnapshot = await db.collection('users').where(firebase.firestore.FieldPath.documentId(), 'in', chunk).get();
            querySnapshot.forEach(doc => {
                registeredUsersData.set(doc.id, doc.data());
            });
        }

        const membersListContainer = document.createElement('div');
        membersListContainer.className = 'members-list-container';

        let cardsHtml = '';
        for (const opponent of opponentsMap.values()) {
            const tornPlayerId = String(opponent.id);
            const memberName = opponent.name || `Unknown (${tornPlayerId})`;
            const memberRank = opponent.position || '';
            const registeredUserData = registeredUsersData.get(tornPlayerId);
            let profilePicUrl;

            if (registeredUserData && registeredUserData.profile_image) {
                profilePicUrl = registeredUserData.profile_image;
            } else {
                const randomIndex = Math.floor(Math.random() * DEFAULT_PROFILE_ICONS.length);
                profilePicUrl = DEFAULT_PROFILE_ICONS[randomIndex];
            }

            let messageButton;
            if (registeredUserData) {
                messageButton = `<button class="item-button message-button" data-member-id="${tornPlayerId}" title="Send Message on MyTornPA">✉️</button>`;
            } else {
                const tornMessageUrl = `https://www.torn.com/messages.php#/p=compose&XID=${tornPlayerId}`;
                messageButton = `<a href="${tornMessageUrl}" target="_blank" class="item-button message-button" title="Send Message on Torn">✉️</a>`;
            }

            cardsHtml += `
                <div class="member-item">
                    <div class="member-info-left">
                        <span class="member-rank">${memberRank}</span>
                        <div class="member-identity">
                            <img src="${profilePicUrl}" alt="${memberName}'s profile pic" class="member-profile-pic">
                            <a href="https://www.torn.com/profiles.php?XID=${tornPlayerId}" target="_blank" class="member-name">${memberName} [${tornPlayerId}]</a>
                        </div>
                    </div>
                    <div class="member-actions">
                        <button class="add-member-button" data-member-id="${tornPlayerId}" title="Add Friend">👤<span class="plus-sign">+</span></button>
                        ${messageButton}
                        <a href="https://www.torn.com/profiles.php?XID=${tornPlayerId}" target="_blank" class="item-button profile-link-button" title="View Torn Profile">🔗</a>
                    </div>
                </div>
            `;
        }

        membersListContainer.innerHTML = cardsHtml;
        targetDisplayElement.innerHTML = '';
        targetDisplayElement.appendChild(membersListContainer);

        const authInstance = firebase.auth();
        const dbInstance = firebase.firestore();

        membersListContainer.addEventListener('click', async (event) => {
            const clickedButton = event.target.closest('button');
            const clickedLink = event.target.closest('a.profile-link-button');

            const element = clickedButton || clickedLink;
            if (!element) return;

            const memberId = element.dataset.memberId;
            if (!memberId || !authInstance.currentUser) return;

            const currentUserId = authInstance.currentUser.uid;
            const friendDocRef = dbInstance.collection('userProfiles').doc(currentUserId).collection('friends').doc(memberId);

            if (element.classList.contains('add-member-button')) {
                try {
                    await friendDocRef.set({ addedAt: firebase.firestore.FieldValue.serverTimestamp() });
                    console.log(`Added friend: ${memberId}`);
                    populateRecentlyMetTab(targetDisplayElement);
                } catch (error) {
                    console.error("Error adding friend:", error);
                    alert("Failed to add friend. See console for details.");
                }
            } else if (element.classList.contains('remove-friend-button')) {
                const userConfirmed = await showCustomConfirm(`Are you sure you want to remove ${memberId} from your friends list?`, "Confirm Friend Removal");
                if (!userConfirmed) return;
                try {
                    await friendDocRef.delete();
                    console.log(`Removed friend: ${memberId}`);
                    populateRecentlyMetTab(targetDisplayElement);
                } catch (error) {
                    console.error("Error removing friend:", error);
                    alert("Failed to remove friend. See console for details.");
                }
            } else if (element.classList.contains('message-button') && registeredUsersData.has(memberId)) {
                console.log(`Message button clicked for member ID: ${memberId}. Switching to private chat.`);
                const privateChatTabButton = document.querySelector('.chat-tab[data-tab-target="private-chat-panel"]');
                if (privateChatTabButton) {
                    privateChatTabButton.click();
                    setTimeout(() => {
                        if (typeof selectPrivateChat === 'function') {
                            selectPrivateChat(memberId);
                        } else {
                            console.warn("selectPrivateChat function not available.");
                            alert("Private chat functionality is not fully loaded. Please try again or refresh.");
                        }
                    }, 100);
                } else {
                    console.warn("Private Chat tab button not found. Cannot switch tab.");
                    window.open(`https://www.torn.com/messages.php#/p=compose&XID=${memberId}`, '_blank');
                }
            }
        });

    } catch (error) {
        console.error("Error populating Recently Met tab:", error);
        targetDisplayElement.innerHTML = `<p style="color: red; text-align:center; padding: 20px;">Error: ${error.message}</p>`;
    }
}

async function displayFactionMembersInChatTab(factionMembersApiData, targetDisplayElement) {
    const db = firebase.firestore();
    const auth = firebase.auth();
    const TORN_API_BASE_URL_GLOBAL = window.TORN_API_BASE_URL;

    if (!targetDisplayElement) {
        console.error("HTML Error: Target display element not provided for faction members list.");
        return;
    }
    targetDisplayElement.innerHTML = `<p style="text-align:center; padding: 10px;">Loading faction members details...</p>`;

    let friendsSet = new Set();
    const currentUser = auth.currentUser;
    if (currentUser) {
        try {
            const friendsSnapshot = await db.collection('userProfiles').doc(currentUser.uid).collection('friends').get();
            friendsSnapshot.forEach(doc => friendsSet.add(doc.id));
        } catch (error) {
            console.error("Error fetching friends list for faction members tab:", error);
        }
    }

    if (!factionMembersApiData || typeof factionMembersApiData !== 'object' || Object.keys(factionMembersApiData).length === 0) {
        targetDisplayElement.innerHTML = `<p style="text-align:center; padding: 10px;">No faction members found.</p>`;
        return;
    }

    const membersArray = Object.values(factionMembersApiData);
    const rankOrder = { "Leader": 0, "Co-leader": 1, "Council": 2, "Right Hand": 3, "Left Hand": 4, "Captain": 5, "Lieutenant": 6, "Sergeant": 7, "Corporal": 8, "Recruit": 9, "Applicant": 10, "Member": 99 };
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
        const tornPlayerId = String(member.id);
        const memberName = member.name || `Unknown (${tornPlayerId})`;
        const memberRank = member.position || 'Member';
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
            <div class="member-info-left">
                <span class="member-rank">${memberRank}</span>
                <div class="member-identity">
                    <img src="../../images/default_profile_icon.png" alt="${memberName}'s profile picture" class="member-profile-pic">
                    <span class="member-name">${memberName}</span>
                </div>
            </div>
            <div class="member-actions">
                ${actionButtonHtml}
                <button class="item-button message-button" data-member-id="${tornPlayerId}" title="Send Message">✉️</button>
                <a href="https://www.torn.com/profiles.php?XID=${tornPlayerId}" target="_blank" class="item-button profile-link-button" title="View Torn Profile">🔗</a>
            </div>
        `;

        membersListContainer.appendChild(memberItemDiv);

        (async () => {
            try {
                const docRef = db.collection('users').doc(tornPlayerId);
                const docSnap = await docRef.get();
                if (docSnap.exists) {
                    const firebaseMemberData = docSnap.data();
                    const profileImageUrl = firebaseMemberData.profile_image || '../../images/default_profile_icon.png';
                    const imgElement = memberItemDiv.querySelector('.member-profile-pic');
                    if (imgElement) imgElement.src = profileImageUrl;
                }
            } catch (error) {
                console.error(`[Firestore Error] Failed to fetch profile pic for ${tornPlayerId}:`, error);
            }
        })();
    }

    membersListContainer.addEventListener('click', async (event) => {
        const clickedButton = event.target.closest('button');
        const clickedLink = event.target.closest('a.profile-link-button');

        const element = clickedButton || clickedLink;
        if (!element) return;

        const memberId = element.dataset.memberId;
        if (!memberId || !auth.currentUser) return;

        const currentUserId = auth.currentUser.uid;
        const friendDocRef = db.collection('userProfiles').doc(currentUserId).collection('friends').doc(memberId);

        if (element.classList.contains('add-member-button')) {
            try {
                await friendDocRef.set({ addedAt: firebase.firestore.FieldValue.serverTimestamp() });
                console.log(`Added friend: ${memberId}`);
                if (window.currentUserFactionId && window.userTornApiKey && TORN_API_BASE_URL_GLOBAL) {
                    const response = await fetch(`${TORN_API_BASE_URL_GLOBAL}/faction/${window.currentUserFactionId}?selections=members&key=${window.userTornApiKey}`);
                    const data = await response.json();
                    if (data.members) {
                        displayFactionMembersInChatTab(data.members, targetDisplayElement);
                    }
                }
            } catch (error) {
                console.error("Error adding friend:", error);
                alert("Failed to add friend. See console for details.");
            }
        } else if (element.classList.contains('remove-friend-button')) {
            const userConfirmed = await showCustomConfirm(`Are you sure you want to remove ${memberId} from your friends list?`, "Confirm Friend Removal");
            if (!userConfirmed) return;
            try {
                await friendDocRef.delete();
                console.log(`Removed friend: ${memberId}`);
                if (window.currentUserFactionId && window.userTornApiKey && TORN_API_BASE_URL_GLOBAL) {
                    const response = await fetch(`${TORN_API_BASE_URL_GLOBAL}/faction/${window.currentUserFactionId}?selections=members&key=${window.userTornApiKey}`);
                    const data = await response.json();
                    if (data.members) {
                        displayFactionMembersInChatTab(data.members, targetDisplayElement);
                    }
                }
            } catch (error) {
                console.error("Error removing friend:", error);
                alert("Failed to remove friend. See console for details.");
            }
        } else if (element.classList.contains('message-button')) {
            console.log(`Message button clicked for member ID: ${memberId}. Switching to private chat.`);
            const privateChatTabButton = document.querySelector('.chat-tab[data-chat-tab="private-chat"]');
            if (privateChatTabButton) {
                privateChatTabButton.click();
                setTimeout(() => {
                    if (typeof selectPrivateChat === 'function') {
                        selectPrivateChat(memberId);
                    } else {
                        console.warn("selectPrivateChat function not available.");
                        alert("Private chat functionality is not fully loaded. Please try again or refresh.");
                    }
                }, 100);
            } else {
                console.warn("Private Chat tab button not found. Cannot switch tab.");
                window.open(`https://www.torn.com/messages.php#/p=compose&XID=${memberId}`, '_blank');
            }
        }
    });
}


// Run the main initialization function
initializeGlobals();