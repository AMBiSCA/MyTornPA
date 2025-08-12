function initializeChatSystem() {
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

    // ---- Firebase Instances (specific to chat) ----
    const db = firebase.firestore();
    const auth = firebase.auth();
    let chatMessagesCollection = null;
    let unsubscribeFromChat = null;

    // ---- Load the Chat System HTML ----
    fetch('globalchat.html')
        .then(response => response.text())
        .then(data => {
            const chatSystemPlaceholder = document.getElementById('chat-system-placeholder');
            if (chatSystemPlaceholder) {
                chatSystemPlaceholder.innerHTML = data;
                console.log("globalchat.js: Global chat HTML loaded successfully into placeholder.");

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
                const openGlobalChatIcon = document.getElementById('open-global-chat-icon');
                const openAllianceChatIcon = document.getElementById('open-alliance-chat-icon');
                const factionChatPanel = document.getElementById('faction-chat-panel');
                const warChatPanel = document.getElementById('war-chat-panel');
                const friendsPanel = document.getElementById('friends-panel');
                const notificationsPanel = document.getElementById('notifications-panel');
                const settingsPanel = document.getElementById('settings-panel');
                const globalChatPanel = document.getElementById('global-chat-panel');
                const allianceChatPanel = document.getElementById('alliance-chat-panel');
                const minimizeChatBtns = document.querySelectorAll('.minimize-chat-btn');
                const allPanels = document.querySelectorAll('.chat-panel');
                const allTabs = document.querySelectorAll('.chat-tab');
                const factionChatTextInput = factionChatPanel.querySelector('.chat-text-input');
                const factionChatSendBtn = factionChatPanel.querySelector('.chat-send-btn');
                const warChatTextInput = warChatPanel.querySelector('.chat-text-input');
                const warChatSendBtn = warChatPanel.querySelector('.chat-send-btn');
                const globalChatTextInput = globalChatPanel.querySelector('.chat-text-input');
                const globalChatSendBtn = globalChatPanel.querySelector('.chat-send-btn');
                const allianceChatTextInput = allianceChatPanel.querySelector('.chat-text-input');
                const allianceChatSendBtn = allianceChatPanel.querySelector('.chat-send-btn');
                const allianceFactionIdInput = document.getElementById('allianceFactionId');
                const saveAllianceButton = document.getElementById('saveAlliance');
                const clearAlliancesButton = document.getElementById('clearAlliances');
                const allianceInfoIcon = document.getElementById('allianceInfoIcon');
                const friendsPanelContent = document.querySelector('#friends-panel .friends-panel-content');
                const recentlyMetSubTab = document.querySelector('.sub-tab-button[data-subtab="recently-met"]');
                const factionMembersSubTab = document.querySelector('.sub-tab-button[data-subtab="faction-members"]');
                const recentChatsSubTab = document.querySelector('.sub-tab-button[data-subtab="recent-chats"]');
                const friendListSubTab = document.querySelector('.sub-tab-button[data-subtab="friend-list"]');
                const ignoreListSubTab = document.querySelector('.sub-tab-button[data-subtab="ignore-list"]');

                // --- Helper to open a specific chat panel and hide others ---
                function openChatPanel(panelToShow) {
                    if (chatWindow) chatWindow.classList.remove('hidden');
                    if (chatMainTabsContainer) chatMainTabsContainer.classList.remove('hidden');
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
                if (openGlobalChatIcon) {
                    openGlobalChatIcon.addEventListener('click', () => {
                        openChatPanel(globalChatPanel);
                        if (globalChatTextInput) globalChatTextInput.focus();
                        setupChatRealtimeListener('global');
                    });
                }
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
                        setupChatRealtimeListener('war');
                    });
                }
                if (openFriendsIcon) {
                    openFriendsIcon.addEventListener('click', () => {
                        openChatPanel(friendsPanel);
                        if (recentChatsSubTab) {
                            recentChatsSubTab.click();
                        } else {
                            friendsPanelContent.innerHTML = `<p style="text-align: center; color: #888; padding-top: 20px;">Recent chats content would load here.</p>`;
                        }
                    });
                }
                if (openNotificationsIcon) {
                    openNotificationsIcon.addEventListener('click', () => {
                        openChatPanel(notificationsPanel);
                        updateBellIcon(false);
                    });
                }
                if (openSettingsIcon) {
                    openSettingsIcon.addEventListener('click', async () => {
                        openChatPanel(settingsPanel);
                        allianceFactionIdInput.value = '';
                        updateAllianceInfoIconTitle();
                    });
                }
                if (openGraphIcon) {
                    openGraphIcon.addEventListener('click', () => {
                        openChatPanel(factionOverviewPanel);
                        const overviewContent = document.getElementById('faction-overview-content');
                        populateFactionOverview(overviewContent);
                    });
                }

                // --- Settings Panel Listeners ---
                if (saveAllianceButton) {
                    saveAllianceButton.addEventListener('click', async () => {
                        const newAllianceId = allianceFactionIdInput.value.trim();
                        if (newAllianceId) {
                            await addOrUpdateUserAllianceId(newAllianceId);
                            allianceFactionIdInput.value = '';
                            updateAllianceInfoIconTitle();
                        } else {
                            alert('Please enter an Alliance ID.');
                        }
                    });
                }
                if (clearAlliancesButton) {
                    clearAlliancesButton.addEventListener('click', async () => {
                        const userConfirmed = await showCustomConfirm('Are you sure you want to remove ALL saved Alliance IDs?', 'Confirm Clear');
                        if (userConfirmed) {
                            await clearUserAllianceIds();
                            alert('All Alliance IDs cleared!');
                            allianceFactionIdInput.value = '';
                            updateAllianceInfoIconTitle();
                        }
                    });
                }

                // --- UI Update Functions ---
                function updateAllianceInfoIconTitle() {
                    if (allianceInfoIcon) {
                        const currentUserAllianceIds = window.currentUserAllianceIds || [];
                        if (currentUserAllianceIds.length > 0) {
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

                // --- Tab Switching Logic ---
                allTabs.forEach(tab => {
                    tab.addEventListener('click', () => {
                        const targetPanelId = tab.dataset.tabTarget;
                        const targetPanel = document.getElementById(targetPanelId);

                        allTabs.forEach(t => t.classList.remove('active'));
                        allPanels.forEach(p => p.classList.add('hidden'));

                        tab.classList.add('active');
                        if (targetPanel) {
                            targetPanel.classList.remove('hidden');
                        }

                        switch (targetPanelId) {
                            case 'friends-panel':
                                if (recentChatsSubTab) recentChatsSubTab.click();
                                break;
                            case 'alliance-chat-panel':
                                setupMessageSending(allianceChatTextInput, allianceChatSendBtn, 'alliance');
                                setupChatRealtimeListener('alliance');
                                if (allianceChatTextInput) allianceChatTextInput.focus();
                                break;
                            case 'global-chat-panel':
                                setupMessageSending(globalChatTextInput, globalChatSendBtn, 'global');
                                setupChatRealtimeListener('global');
                                if (globalChatTextInput) globalChatTextInput.focus();
                                break;
                            case 'faction-chat-panel':
                                setupChatRealtimeListener('faction');
                                if (factionChatTextInput) factionChatTextInput.focus();
                                break;
                            case 'war-chat-panel':
                                setupChatRealtimeListener('war');
                                if (warChatTextInput) warChatTextInput.focus();
                                break;
                            case 'settings-panel':
                                allianceFactionIdInput.value = '';
                                updateAllianceInfoIconTitle();
                                break;
                        }
                    });
                });

                // --- Friends Panel Sub-Tab Listeners ---
                if (recentChatsSubTab) {
                    recentChatsSubTab.addEventListener('click', () => {
                        friendsPanel.querySelectorAll('.sub-tab-button').forEach(btn => btn.classList.remove('active'));
                        recentChatsSubTab.classList.add('active');
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
                        const currentUserFactionId = window.currentUserFactionId;
                        const userTornApiKey = window.userTornApiKey;
                        const TORN_API_BASE_URL = window.TORN_API_BASE_URL;

                        if (!currentUserFactionId || !userTornApiKey) {
                            friendsPanelContent.innerHTML = `<p style="text-align:center; padding: 10px; color: orange;">Faction ID or API key not available.</p>`;
                            return;
                        }
                        friendsPanelContent.innerHTML = `<p style="text-align:center; padding: 10px;">Loading faction members...</p>`;
                        try {
                            const response = await fetch(`${TORN_API_BASE_URL}/faction/${currentUserFactionId}?selections=members&key=${userTornApiKey}`);
                            const data = await response.json();
                            if (data.members) {
                                displayFactionMembersInChatTab(data.members, friendsPanelContent);
                            } else {
                                friendsPanelContent.innerHTML = `<p style="text-align:center; padding: 10px; color: red;">Error: Could not retrieve faction members.</p>`;
                            }
                        } catch (error) {
                            friendsPanelContent.innerHTML = `<p style="text-align:center; padding: 10px; color: red;">Network Error: Failed to fetch faction members.</p>`;
                        }
                    });
                }
                if (friendListSubTab) {
                    friendListSubTab.addEventListener('click', () => {
                        friendsPanel.querySelectorAll('.sub-tab-button').forEach(btn => btn.classList.remove('active'));
                        friendListSubTab.classList.add('active');
                        populateFriendListTab(friendsPanelContent);
                    });
                }
                if (ignoreListSubTab) {
                    ignoreListSubTab.addEventListener('click', () => {
                        friendsPanel.querySelectorAll('.sub-tab-button').forEach(btn => btn.classList.remove('active'));
                        ignoreListSubTab.classList.add('active');
                        populateIgnoreListTab(friendsPanelContent);
                    });
                }

                // --- Setup Message Sending ---
                function setupMessageSending(textInput, sendBtn, collectionType) {
                    const handler = async () => sendChatMessage(textInput, collectionType);
                    if (sendBtn) sendBtn.onclick = handler;
                    if (textInput) {
                        textInput.onkeydown = async (event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                await handler();
                            }
                        };
                    }
                }
                setupMessageSending(factionChatTextInput, factionChatSendBtn, 'faction');
                setupMessageSending(warChatTextInput, warChatSendBtn, 'war');
                setupMessageSending(globalChatTextInput, globalChatSendBtn, 'global');
                setupMessageSending(allianceChatTextInput, allianceChatSendBtn, 'alliance');

            } else {
                console.error("globalchat.js: Error: #chat-system-placeholder element not found.");
            }
        })
        .catch(error => console.error('globalchat.js: Error loading global chat HTML:', error));


    // ---- CORE CHAT FUNCTIONS ----

    function displayChatMessage(messageObj, chatDisplayAreaId) {
        const chatDisplayArea = document.getElementById(chatDisplayAreaId);
        if (!chatDisplayArea) return;
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message');
        const timestamp = messageObj.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '';
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
        const currentUserFactionId = window.currentUserFactionId;
        const currentUserAllianceIds = window.currentUserAllianceIds || [];

        if (collectionType === 'faction') {
            if (!currentUserFactionId) {
                alert("Faction ID not found.");
                return;
            }
            targetCollection = db.collection('factionChats').doc(currentUserFactionId).collection('messages');
        } else if (collectionType === 'war') {
            targetCollection = db.collection('warChats').doc('currentWar').collection('messages');
        } else if (collectionType === 'global') {
            targetCollection = db.collection('globalChats').doc('allUsers').collection('messages');
        } else if (collectionType === 'alliance') {
            if (currentUserAllianceIds.length === 0) {
                alert("No Alliance ID saved. Please go to Settings.");
                return;
            }
            const allianceIdToChatIn = currentUserAllianceIds[0];
            targetCollection = db.collection('allianceChats').doc(allianceIdToChatIn).collection('messages');
        }

        if (!targetCollection) return;

        const messageObj = {
            senderId: auth.currentUser.uid,
            sender: window.currentTornUserName || 'Unknown',
            text: messageText,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            await targetCollection.add(messageObj);
            textInput.value = '';
            textInput.focus();
        } catch (error) {
            console.error(`Error sending ${collectionType} message:`, error);
            alert(`Failed to send ${collectionType} message.`);
        }
    }

    function setupChatRealtimeListener(type) {
        let collectionRef = null;
        let displayAreaId = '';
        const currentUserFactionId = window.currentUserFactionId;
        const currentUserAllianceIds = window.currentUserAllianceIds || [];

        if (unsubscribeFromChat) unsubscribeFromChat();

        if (!auth.currentUser) {
            const displayAreas = {
                'faction': 'chat-display-area', 'war': 'war-chat-display-area',
                'global': 'global-chat-display-area', 'alliance': 'alliance-chat-display-area'
            };
            const chatDisplayArea = document.getElementById(displayAreas[type]);
            if(chatDisplayArea) chatDisplayArea.innerHTML = '<p>Please log in to use chat.</p>';
            return;
        }

        if (type === 'faction') {
            if (!currentUserFactionId) {
                document.getElementById('chat-display-area').innerHTML = '<p>Faction ID not found.</p>'; return;
            }
            collectionRef = db.collection('factionChats').doc(currentUserFactionId).collection('messages');
            displayAreaId = 'chat-display-area';
        } else if (type === 'war') {
            collectionRef = db.collection('warChats').doc('currentWar').collection('messages');
            displayAreaId = 'war-chat-display-area';
        } else if (type === 'global') {
            collectionRef = db.collection('globalChats').doc('allUsers').collection('messages');
            displayAreaId = 'global-chat-display-area';
        } else if (type === 'alliance') {
            if (currentUserAllianceIds.length === 0) {
                 document.getElementById('alliance-chat-display-area').innerHTML = '<p>No Alliance ID saved.</p>'; return;
            }
            const allianceIdToListenTo = currentUserAllianceIds[0];
            collectionRef = db.collection('allianceChats').doc(allianceIdToListenTo).collection('messages');
            displayAreaId = 'alliance-chat-display-area';
        }

        const chatDisplayArea = document.getElementById(displayAreaId);
        if (chatDisplayArea) chatDisplayArea.innerHTML = `<p>Loading ${type} messages...</p>`;
        
        if (collectionRef) {
            unsubscribeFromChat = collectionRef.orderBy('timestamp', 'asc').limitToLast(50)
                .onSnapshot(snapshot => {
                    if (chatDisplayArea) chatDisplayArea.innerHTML = '';
                    if (snapshot.empty) {
                        if (chatDisplayArea) chatDisplayArea.innerHTML = `<p>No ${type} messages yet.</p>`;
                        return;
                    }
                    snapshot.forEach(doc => displayChatMessage(doc.data(), displayAreaId));
                }, error => {
                    console.error(`Error listening to ${type} chat messages:`, error);
                    if (chatDisplayArea) chatDisplayArea.innerHTML = `<p style="color: red;">Error loading messages.</p>`;
                });
        }
    }

    // ---- ALL OTHER HELPER FUNCTIONS ----
    
    async function populateFactionOverview(overviewContent) {
        // This function remains largely the same but uses window globals
        if (!overviewContent) return;
        overviewContent.innerHTML = `<p style="text-align: center; color: #888; padding-top: 20px;">Loading Faction Overview...</p>`;
        try {
            const factionId = window.currentUserFactionId;
            const apiKey = window.userTornApiKey;
            if (!factionId || !apiKey) {
                overviewContent.innerHTML = `<p style="color: orange; text-align: center;">Faction ID or API Key not available.</p>`;
                return;
            }
            await fetch(`/.netlify/functions/refresh-faction-data?factionId=${factionId}`);
            const factionApiUrl = `https://api.torn.com/v2/faction/${factionId}?selections=members&key=${apiKey}&comment=MyTornPA_Overview`;
            const apiResponse = await fetch(factionApiUrl);
            const factionData = await apiResponse.json();
            if (factionData.error) throw new Error(`Torn API Error: ${factionData.error.error}`);
            
            const membersArray = Object.values(factionData.members || {});
            if (membersArray.length === 0) {
                overviewContent.innerHTML = `<p style="text-align: center;">No faction members found.</p>`;
                return;
            }

            const allMemberTornIds = membersArray.map(member => String(member.user_id || member.id));
            const allMemberFirebaseData = {};
            const CHUNK_SIZE = 10;
            for (let i = 0; i < allMemberTornIds.length; i += CHUNK_SIZE) {
                const chunk = allMemberTornIds.slice(i, i + CHUNK_SIZE);
                const query = db.collection('users').where(firebase.firestore.FieldPath.documentId(), 'in', chunk);
                const snapshot = await query.get();
                snapshot.forEach(doc => { allMemberFirebaseData[doc.id] = doc.data(); });
            }
            
            const processedMembers = membersArray.map((tornData) => ({ tornData, firebaseData: allMemberFirebaseData[String(tornData.user_id || tornData.id)] || {} }));
            processedMembers.sort((a, b) => a.tornData.name.localeCompare(b.tornData.name));

            const memberRowsHtml = processedMembers.map(member => {
                const { tornData, firebaseData } = member;
                const energy = `${firebaseData.energy?.current || 'N/A'} / ${firebaseData.energy?.maximum || 'N/A'}`;
                const drugCooldown = firebaseData.cooldowns?.drug || 0;
                let drugCdHtml = `<span class="status-okay">None 🍁</span>`;
                if (drugCooldown > 0) {
                    const hours = Math.floor(drugCooldown / 3600);
                    const minutes = Math.floor((drugCooldown % 3600) / 60);
                    drugCdHtml = `<span class="${drugCooldown > 18000 ? 'status-hospital' : 'status-other'}">${(hours > 0) ? `${hours}hr ${minutes}m` : `${minutes}m`}</span>`;
                }
                const reviveSetting = tornData.revive_setting || 'No one';
                let reviveCircleClass = 'rev-circle-red';
                if (reviveSetting === 'Everyone') reviveCircleClass = 'rev-circle-green';
                else if (reviveSetting === 'Friends & faction') reviveCircleClass = 'rev-circle-orange';

                return `
                    <tr>
                        <td class="overview-name"><a href="https://www.torn.com/profiles.php?XID=${tornData.id}" target="_blank">${tornData.name}</a></td>
                        <td class="overview-energy energy-text">${energy}</td>
                        <td class="overview-drugcd">${drugCdHtml}</td>
                        <td class="overview-revive"><div class="rev-circle ${reviveCircleClass}" title="${reviveSetting}"></div></td>
                        <td class="overview-refill">${firebaseData.energyRefillUsed ? 'Yes' : 'No'}</td>
                        <td class="overview-status ${tornData.status.state === 'Hospital' ? 'status-hospital' : 'status-okay'}">${tornData.status.description}</td>
                    </tr>
                `;
            }).join('');

            overviewContent.innerHTML = `
                <table class="overview-table">
                    <thead><tr><th>Name</th><th>Energy</th><th>Drug C/D</th><th>Rev</th><th>Refill</th><th>Status</th></tr></thead>
                    <tbody>${memberRowsHtml}</tbody>
                </table>
            `;
        } catch (error) {
            console.error("Error populating Faction Overview:", error);
            overviewContent.innerHTML = `<p style="color: red; text-align: center;">Error: ${error.message}</p>`;
        }
    }

    function updateFriendNotification(friendId, hasNewMessage) {
        const friendElement = document.getElementById(`friend-${friendId}`);
        if (friendElement) {
            friendElement.classList.toggle('has-new-message', hasNewMessage);
        }
    }

    async function addOrUpdateUserAllianceId(newAllianceId) {
        const user = auth.currentUser;
        if (!user) return;
        const currentAllianceIds = window.currentUserAllianceIds || [];
        if (currentAllianceIds.includes(newAllianceId.trim())) {
            alert(`Alliance ID '${newAllianceId.trim()}' is already saved.`); return;
        }
        if (currentAllianceIds.length >= 3) {
            alert('You can only save up to 3 Alliance IDs.'); return;
        }
        try {
            await db.collection('userProfiles').doc(user.uid).update({
                allianceIds: firebase.firestore.FieldValue.arrayUnion(newAllianceId.trim())
            });
            window.currentUserAllianceIds.push(newAllianceId.trim());
            alert(`Alliance ID '${newAllianceId.trim()}' saved successfully!`);
        } catch (error) {
            console.error('Error adding alliance ID:', error);
        }
    }

    async function clearUserAllianceIds() {
        const user = auth.currentUser;
        if (!user) return;
        try {
            await db.collection('userProfiles').doc(user.uid).update({ allianceIds: [] });
            window.currentUserAllianceIds = [];
        } catch (error) {
            console.error('Error clearing alliance IDs:', error);
        }
    }

    function openPrivateChatWindow(userId, userName) {
        const existingWindow = document.querySelector('.private-chat-window');
        if (existingWindow) {
            existingWindow.querySelector('.pcw-close-btn').click();
        }
        const chatDiv = document.createElement('div');
        chatDiv.className = 'private-chat-window';
        chatDiv.id = `private-chat-window-${userId}`;
        chatDiv.innerHTML = `
            <div class="pcw-header">
                <span class="pcw-title" title="${userName} [${userId}]">Chat with ${userName}</span>
                <button class="pcw-close-btn" title="Close">×</button>
            </div>
            <div class="pcw-messages"><p style="color: #888;">Loading messages...</p></div>
            <div class="pcw-input-area">
                <input type="text" class="pcw-input" placeholder="Type a message...">
                <button class="pcw-send-btn">Send</button>
            </div>
        `;
        document.body.appendChild(chatDiv);
        chatDiv.querySelector('.pcw-close-btn').addEventListener('click', () => chatDiv.remove());
        loadAndHandlePrivateChat(userId, userName, chatDiv);
    }

    async function populateFriendListTab(targetDisplayElement) {
        if (!targetDisplayElement) return;
        targetDisplayElement.innerHTML = `<p style="text-align:center; padding: 20px;">Loading...</p>`;
        const currentUser = auth.currentUser;
        if (!currentUser) {
            targetDisplayElement.innerHTML = '<p>Please log in.</p>'; return;
        }
        try {
            const friendsSnapshot = await db.collection('userProfiles').doc(currentUser.uid).collection('friends').get();
            if (friendsSnapshot.empty) {
                targetDisplayElement.innerHTML = '<p>You have not added any friends yet.</p>'; return;
            }
            const friendDetailsPromises = friendsSnapshot.docs.map(doc => {
                const friendTornId = doc.id;
                return db.collection('users').doc(friendTornId).get().then(userDoc => {
                    if (userDoc.exists) {
                        const { name, profile_image } = userDoc.data();
                        return { id: friendTornId, name: name || `User ${friendTornId}`, image: profile_image || '../../images/default_profile_icon.png' };
                    }
                    return { id: friendTornId, name: `Unknown [${friendTornId}]`, image: '../../images/default_profile_icon.png' };
                });
            });
            const friendDetails = await Promise.all(friendDetailsPromises);
            const cardsHtml = friendDetails.map(friend => `
                <div class="member-item" id="friend-${friend.id}">
                    <div class="member-identity">
                        <img src="${friend.image}" alt="${friend.name}'s pic" class="member-profile-pic">
                        <a href="https://www.torn.com/profiles.php?XID=${friend.id}" target="_blank" class="member-name">${friend.name}</a>
                    </div>
                    <div class="member-actions">
                        <button class="item-button message-friend-button" data-friend-id="${friend.id}" data-friend-name="${friend.name}" title="Send Message">✉️</button>
                        <button class="item-button remove-friend-button" data-friend-id="${friend.id}" title="Remove Friend">🗑️</button>
                    </div>
                </div>`).join('');
            
            const listContainer = document.createElement('div');
            listContainer.className = 'members-list-container';
            listContainer.innerHTML = cardsHtml;
            targetDisplayElement.innerHTML = '';
            targetDisplayElement.appendChild(listContainer);
            
            listContainer.addEventListener('click', async (event) => {
                const button = event.target.closest('button');
                if (!button) return;
                const friendId = button.dataset.friendId;
                const friendName = button.dataset.friendName;
                if (button.classList.contains('remove-friend-button')) {
                    const confirmed = await showCustomConfirm(`Remove friend [${friendId}]?`, "Confirm");
                    if (confirmed) {
                        await db.collection('userProfiles').doc(currentUser.uid).collection('friends').doc(friendId).delete();
                        populateFriendListTab(targetDisplayElement);
                    }
                } else if (button.classList.contains('message-friend-button')) {
                    openPrivateChatWindow(friendId, friendName);
                }
            });
        } catch (error) {
            console.error("Error populating Friend List:", error);
            targetDisplayElement.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
        }
    }

    function displayPrivateChatMessage(messageObj, displayElement, isMyMessage) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', isMyMessage ? 'my-message' : 'their-message');
        const timestamp = messageObj.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '';
        messageElement.innerHTML = `
            <span class="chat-timestamp">[${timestamp}]</span>
            <span class="chat-sender">${isMyMessage ? 'You' : messageObj.sender}:</span>
            <span class="chat-text">${messageObj.text}</span>
        `;
        displayElement.appendChild(messageElement);
    }

    async function loadAndHandlePrivateChat(friendTornId, friendName, chatWindowElement) {
        const messagesContainer = chatWindowElement.querySelector('.pcw-messages');
        const inputField = chatWindowElement.querySelector('.pcw-input');
        const sendButton = chatWindowElement.querySelector('.pcw-send-btn');
        const currentUser = auth.currentUser;
        if (!currentUser) { messagesContainer.innerHTML = '<p>You must be logged in.</p>'; return; }
        
        updateFriendNotification(friendTornId, false);

        let friendFirebaseUid;
        try {
            const profileQuery = await db.collection('userProfiles').where('tornProfileId', '==', friendTornId).limit(1).get();
            if (profileQuery.empty) {
                messagesContainer.innerHTML = `<p>${friendName} is not a registered user.</p>`;
                inputField.disabled = sendButton.disabled = true;
                return;
            }
            friendFirebaseUid = profileQuery.docs[0].id;
        } catch (error) {
            messagesContainer.innerHTML = `<p>Error initializing chat.</p>`; return;
        }

        const participants = [currentUser.uid, friendFirebaseUid].sort();
        const chatDocId = `private_${participants[0]}_${participants[1]}`;
        const messagesCollectionRef = db.collection('privateChats').doc(chatDocId).collection('messages');

        await db.collection('privateChats').doc(chatDocId).set({ participants }, { merge: true });

        const unsubscribe = messagesCollectionRef.orderBy('timestamp', 'asc').onSnapshot(snapshot => {
            messagesContainer.innerHTML = '';
            if (snapshot.empty) {
                messagesContainer.innerHTML = `<p>No messages yet.</p>`;
            } else {
                snapshot.forEach(doc => {
                    const messageData = doc.data();
                    displayPrivateChatMessage(messageData, messagesContainer, messageData.senderId === currentUser.uid);
                });
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }, error => {
            messagesContainer.innerHTML = `<p>Error loading messages.</p>`;
        });

        const sendMessage = async () => {
            const messageText = inputField.value.trim();
            if (messageText === '') return;
            const messageObj = {
                senderId: currentUser.uid,
                sender: window.currentTornUserName,
                text: messageText,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            try {
                await db.collection('privateChats').doc(chatDocId).update({ lastMessageAt: firebase.firestore.FieldValue.serverTimestamp() });
                await messagesCollectionRef.add(messageObj);
                inputField.value = '';
                inputField.focus();
                updateBellIcon(true);
            } catch (error) {
                alert("Failed to send message.");
            }
        };

        sendButton.onclick = sendMessage;
        inputField.onkeydown = (e) => { if (e.key === 'Enter') sendMessage(); };

        const closeButton = chatWindowElement.querySelector('.pcw-close-btn');
        const newCloseListener = () => {
            unsubscribe();
            closeButton.removeEventListener('click', newCloseListener);
        };
        closeButton.addEventListener('click', newCloseListener);
    }
    
    function updateBellIcon(hasNotification) {
        const bellIcon = document.getElementById('open-notifications-icon');
        if (bellIcon) {
            bellIcon.classList.toggle('has-notification', hasNotification);
        }
    }

    function showCustomConfirm(message, title = "Confirm") {
         // simplified version for brevity
        return Promise.resolve(window.confirm(`${title}\n${message}`));
    }
    
    function showCustomConfirmWithOptions(message, title = "Confirm") {
        return new Promise(resolve => {
            const overlay = document.createElement('div');
            overlay.className = 'custom-confirm-overlay';
            overlay.innerHTML = `
                <div class="custom-confirm-box">
                    <h4>${title}</h4><p>${message}</p>
                    <div class="custom-confirm-checkbox">
                        <input type="checkbox" id="confirm-dont-ask-again"><label for="confirm-dont-ask-again">Don't ask me again</label>
                    </div>
                    <div class="custom-confirm-actions">
                        <button class="action-button danger">Yes</button><button class="action-button">No</button>
                    </div>
                </div>`;
            document.body.appendChild(overlay);
            const closeConfirm = (confirmed) => {
                const dontAskAgain = overlay.querySelector('#confirm-dont-ask-again').checked;
                document.body.removeChild(overlay);
                resolve({ confirmed, dontAskAgain });
            };
            overlay.querySelector('.danger').onclick = () => closeConfirm(true);
            overlay.querySelector('.action-button:not(.danger)').onclick = () => closeConfirm(false);
        });
    }

    async function deletePrivateChat(chatDocId) {
        try {
            const messagesRef = db.collection('privateChats').doc(chatDocId).collection('messages');
            const messagesSnapshot = await messagesRef.get();
            const batch = db.batch();
            messagesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            await db.collection('privateChats').doc(chatDocId).delete();
            return true;
        } catch (error) {
            alert("Failed to delete chat.");
            return false;
        }
    }

    async function loadRecentPrivateChats(targetDisplayElement) {
        if (!targetDisplayElement) return;
        targetDisplayElement.innerHTML = `<p>Loading recent conversations...</p>`;
        const currentUser = auth.currentUser;
        if (!currentUser) { targetDisplayElement.innerHTML = '<p>Please log in.</p>'; return; }
        
        try {
            const chatsSnapshot = await db.collection('privateChats')
                .where('participants', 'array-contains', currentUser.uid)
                .orderBy('lastMessageAt', 'desc').limit(20).get();

            if (chatsSnapshot.empty) { targetDisplayElement.innerHTML = '<p>No recent private chats.</p>'; return; }

            const chatDetailsPromises = chatsSnapshot.docs.map(async (doc) => {
                const chatData = doc.data();
                const otherUid = chatData.participants.find(uid => uid !== currentUser.uid);
                if (!otherUid) return null;

                const profileDoc = await db.collection('userProfiles').doc(otherUid).get();
                if (!profileDoc.exists) return null;
                
                const { tornProfileId, preferredName, name } = profileDoc.data();
                const userDoc = await db.collection('users').doc(tornProfileId).get();
                const image = userDoc.exists ? userDoc.data().profile_image : '../../images/default_profile_icon.png';
                
                const lastMsgSnap = await db.collection('privateChats').doc(doc.id).collection('messages').orderBy('timestamp', 'desc').limit(1).get();
                const lastMessage = lastMsgSnap.empty ? '...' : lastMsgSnap.docs[0].data().text;

                return {
                    chatId: doc.id, tornId: tornProfileId, name: preferredName || name, image, lastMessage
                };
            });
            const chatDetails = (await Promise.all(chatDetailsPromises)).filter(Boolean);
            
            const listHtml = chatDetails.map(chat => `
                <div class="recent-chat-item" id="friend-${chat.tornId}" data-friend-id="${chat.tornId}" data-friend-name="${chat.name}">
                    <img src="${chat.image}" class="rc-avatar" alt="${chat.name}'s avatar">
                    <div class="rc-details" title="Open chat with ${chat.name}">
                        <span class="rc-name">${chat.name}</span>
                        <span class="rc-last-message">${chat.lastMessage}</span>
                    </div>
                    <button class="item-button rc-delete-btn" data-chat-id="${chat.chatId}" data-friend-name="${chat.name}" title="Delete Chat">🗑️</button>
                </div>`).join('');
            
            targetDisplayElement.innerHTML = `<div class="recent-chats-list">${listHtml}</div>`;

            targetDisplayElement.querySelector('.recent-chats-list').addEventListener('click', async (event) => {
                const deleteButton = event.target.closest('.rc-delete-btn');
                const chatItem = event.target.closest('.recent-chat-item');

                if (deleteButton) {
                    event.stopPropagation();
                    const { chatId, friendName } = deleteButton.dataset;
                    const result = await showCustomConfirmWithOptions(`Delete chat with ${friendName}?`, "Confirm");
                    if (result.confirmed) {
                        if (await deletePrivateChat(chatId)) {
                            loadRecentPrivateChats(targetDisplayElement);
                        }
                    }
                } else if (chatItem) {
                    const { friendId, friendName } = chatItem.dataset;
                    openPrivateChatWindow(friendId, friendName);
                }
            });
        } catch (error) {
            targetDisplayElement.innerHTML = `<p>Error loading recent chats.</p>`;
        }
    }

    async function populateIgnoreListTab(targetDisplayElement) {
        // Implementation for ignore list goes here...
        targetDisplayElement.innerHTML = `<p style="text-align:center; padding: 20px;">Ignore List Feature Coming Soon!</p>`;
    }
    async function populateRecentlyMetTab(targetDisplayElement) {
        // Implementation for recently met goes here...
         targetDisplayElement.innerHTML = `<p style="text-align:center; padding: 20px;">Recently Met Feature Coming Soon!</p>`;
    }
    async function displayFactionMembersInChatTab(factionMembersApiData, targetDisplayElement) {
        // Implementation for faction members goes here...
         targetDisplayElement.innerHTML = `<p style="text-align:center; padding: 20px;">Faction Members List Feature Coming Soon!</p>`;
    }
}