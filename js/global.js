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

                // --- Get references to our new top-level containers ---
                const iconBarContainer = document.getElementById('tornpa-icon-bar-container');
                const windowContainer = document.getElementById('tornpa-chat-window-container');
                
                // --- Other DOM references ---
                const chatMainTabsContainer = document.querySelector('.chat-main-tabs-container');
                const minimizeChatBtns = document.querySelectorAll('.minimize-chat-btn');
                const allPanels = document.querySelectorAll('.chat-panel');
                const allTabs = document.querySelectorAll('.chat-tab');
                const factionChatPanel = document.getElementById('faction-chat-panel');
                const warChatPanel = document.getElementById('war-chat-panel');
                const friendsPanel = document.getElementById('friends-panel');
                const notificationsPanel = document.getElementById('notifications-panel');
                const settingsPanel = document.getElementById('settings-panel');
                const allianceChatPanel = document.getElementById('alliance-chat-panel');
                const factionChatTextInput = factionChatPanel.querySelector('.chat-text-input');
                const factionChatSendBtn = factionChatPanel.querySelector('.chat-send-btn');
                const warChatTextInput = warChatPanel.querySelector('.chat-text-input');
                const warChatSendBtn = warChatPanel.querySelector('.chat-send-btn');
                const allianceChatTextInput = allianceChatPanel.querySelector('.chat-text-input');
                const allianceChatSendBtn = allianceChatPanel.querySelector('.chat-send-btn');
                const friendsPanelContent = document.querySelector('#friends-panel .friends-panel-content');
                const recentlyMetSubTab = document.querySelector('.sub-tab-button[data-subtab="recently-met"]');
                const factionMembersSubTab = document.querySelector('.sub-tab-button[data-subtab="faction-members"]');
                const recentChatsSubTab = document.querySelector('.sub-tab-button[data-subtab="recent-chats"]');
                const friendListSubTab = document.querySelector('.sub-tab-button[data-subtab="friend-list"]');
                const ignoreListSubTab = document.querySelector('.sub-tab-button[data-subtab="ignore-list"]');

                // --- BRUTE-FORCE HELPER FUNCTION ---
                function openChatPanel(panelToShow) {
                    // Force the window to be visible by setting style directly
                    if (windowContainer) windowContainer.style.display = 'block';
                    // Force the icon bar to be hidden by setting style directly
                    if (iconBarContainer) iconBarContainer.style.display = 'none';

                    // Original logic for managing panels inside the window
                    allPanels.forEach(p => p.classList.add('hidden'));
                    if (panelToShow) panelToShow.classList.remove('hidden');
                    if (chatMainTabsContainer) chatMainTabsContainer.classList.remove('hidden');
                }

                // --- Event Listeners for Collapsed Chat Bar Icons ---
                if (iconBarContainer) {
                    iconBarContainer.addEventListener('click', (event) => {
                        const clickedIcon = event.target.closest('.chat-bar-icon');
                        if (!clickedIcon) return;

                        let panelToShow = null;
                        let panelId = '';
                        switch (clickedIcon.id) {
                            case 'open-faction-chat-icon': panelId = 'faction-chat-panel'; break;
                            case 'open-alliance-chat-icon': panelId = 'alliance-chat-panel'; break;
                            case 'open-war-chat-icon': panelId = 'war-chat-panel'; break;
                            case 'open-friends-icon': panelId = 'friends-panel'; break;
                            case 'open-notifications-icon': panelId = 'notifications-panel'; break;
                            case 'open-settings-icon': panelId = 'settings-panel'; break;
                        }
                        
                        if (panelId) {
                            panelToShow = document.getElementById(panelId);
                            openChatPanel(panelToShow);
                        }
                    });
                }
                
                // --- BRUTE-FORCE MINIMIZE BUTTON LOGIC ---
                minimizeChatBtns.forEach(btn => {
                    btn.addEventListener('click', () => {
                        // Force the window to be hidden by setting style directly
                        if (windowContainer) windowContainer.style.display = 'none';
                        // Force the icon bar to be visible by setting style directly
                        if (iconBarContainer) iconBarContainer.style.display = 'block';
                    });
                });

                // --- Tab Switching Logic for main tabs ---
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
                            case 'faction-chat-panel':
                                if (factionChatTextInput) factionChatTextInput.focus();
                                setupChatRealtimeListener('faction');
                                break;
                            case 'war-chat-panel':
                                if (warChatTextInput) warChatTextInput.focus();
                                setupChatRealtimeListener('war');
                                break;
                        }
                    });
                });

                // --- Individual Sub-Tab Event Listeners for Friends Panel ---
                if (recentChatsSubTab) {
                    recentChatsSubTab.addEventListener('click', () => {
                        friendsPanel.querySelectorAll('.sub-tab-button').forEach(btn => btn.classList.remove('active'));
                        recentChatsSubTab.classList.add('active');
                        friendsPanelContent.innerHTML = `<p style="text-align: center; color: #888; padding-top: 20px;">Recent chats content would load here.</p>`;
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
                            friendsPanelContent.innerHTML = `<p style="text-align:center; padding: 10px; color: orange;">Faction ID or API key not found.</p>`;
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
                    friendListSubTab.addEventListener('click', async () => {
                        friendsPanel.querySelectorAll('.sub-tab-button').forEach(btn => btn.classList.remove('active'));
                        friendListSubTab.classList.add('active');
                        friendsPanelContent.innerHTML = `<p style="text-align: center; color: #888; padding-top: 20px;">Loading your friend list...</p>`;
                    });
                }
                if (ignoreListSubTab) {
                    ignoreListSubTab.addEventListener('click', async () => {
                        friendsPanel.querySelectorAll('.sub-tab-button').forEach(btn => btn.classList.remove('active'));
                        ignoreListSubTab.classList.add('active');
                        friendsPanelContent.innerHTML = `<p style="text-align: center; color: #888; padding-top: 20px;">Loading your ignore list...</p>`;
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
                setupMessageSending(allianceChatTextInput, allianceChatSendBtn, 'alliance');

            } else {
                console.error("global.js: Error: #chat-system-placeholder element not found.");
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
                userTornApiKey = userData.tornApiKey;
                window.currentUserFactionId = currentUserFactionId;
                window.userTornApiKey = userTornApiKey;
                window.TORN_API_BASE_URL = TORN_API_BASE_URL;
            } else {
                currentUserFactionId = null;
                userTornApiKey = null;
                window.currentUserFactionId = null;
                window.userTornApiKey = null;
                window.TORN_API_BASE_URL = null;
            }
        } else {
            if (unsubscribeFromChat) unsubscribeFromChat();
            chatMessagesCollection = null;
            currentUserFactionId = null;
            userTornApiKey = null;
            window.currentUserFactionId = null;
            window.userTornApiKey = null;
            window.TORN_API_BASE_URL = null;
            const chatDisplayAreaFaction = document.getElementById('chat-display-area');
            const chatDisplayAreaWar = document.getElementById('war-chat-display-area');
            const chatDisplayAreaAlliance = document.getElementById('alliance-chat-display-area');
            if (chatDisplayAreaFaction) chatDisplayAreaFaction.innerHTML = '<p>Please log in to use chat.</p>';
            if (chatDisplayAreaWar) chatDisplayAreaWar.innerHTML = '<p>Please log in to use war chat.</p>';
            if (chatDisplayAreaAlliance) chatDisplayAreaAlliance.innerHTML = '<p>Please log in to use alliance chat.</p>';
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
        if (collectionType === 'faction') {
            if (currentUserFactionId) {
                targetCollection = db.collection('factionChats').doc(currentUserFactionId).collection('messages');
            } else {
                return;
            }
        } else if (collectionType === 'war') {
            targetCollection = db.collection('warChats').doc('currentWar').collection('messages');
        } else if (collectionType === 'alliance') {
            const allianceId = 'defaultAllianceChat';
            targetCollection = db.collection('allianceChats').doc(allianceId).collection('messages');
        }
        if (!targetCollection) return;
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
            console.error(`Error sending ${collectionType} message:`, error);
        }
    }

    function setupChatRealtimeListener(type) {
        let chatDisplayArea = null;
        let collectionRef = null;
        let displayAreaId = '';
        if (unsubscribeFromChat) {
            unsubscribeFromChat();
        }
        if (type === 'faction' && auth.currentUser) {
            if (currentUserFactionId) {
                collectionRef = db.collection('factionChats').doc(currentUserFactionId).collection('messages');
                displayAreaId = 'chat-display-area';
                chatDisplayArea = document.getElementById(displayAreaId);
                if (chatDisplayArea) chatDisplayArea.innerHTML = '<p>Loading faction messages...</p>';
                if (collectionRef) {
                    unsubscribeFromChat = collectionRef.orderBy('timestamp', 'asc').limitToLast(50)
                        .onSnapshot(snapshot => {
                            if (chatDisplayArea) chatDisplayArea.innerHTML = '';
                            if (snapshot.empty) {
                                if (chatDisplayArea) chatDisplayArea.innerHTML = `<p>No faction messages yet.</p>`;
                                return;
                            }
                            snapshot.forEach(doc => displayChatMessage(doc.data(), displayAreaId));
                        }, error => {
                            if (chatDisplayArea) chatDisplayArea.innerHTML = `<p style="color: red;">Error loading messages.</p>`;
                        });
                }
            } else {
                chatDisplayArea = document.getElementById('chat-display-area');
                if (chatDisplayArea) chatDisplayArea.innerHTML = '<p>Faction ID not found for chat.</p>';
            }
        } else if (type === 'war' || (type === 'alliance' && auth.currentUser)) {
            let collectionPath, docId, areaId;
            if (type === 'war') {
                collectionPath = 'warChats';
                docId = 'currentWar';
                areaId = 'war-chat-display-area';
            } else {
                collectionPath = 'allianceChats';
                docId = 'defaultAllianceChat';
                areaId = 'alliance-chat-display-area';
            }
            collectionRef = db.collection(collectionPath).doc(docId).collection('messages');
            displayAreaId = areaId;
            chatDisplayArea = document.getElementById(displayAreaId);
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
                        if (chatDisplayArea) chatDisplayArea.innerHTML = `<p style="color: red;">Error loading messages.</p>`;
                    });
            }
        }
    }
}

async function populateRecentlyMetTab(targetDisplayElement) {
    if (!targetDisplayElement) return;
    targetDisplayElement.innerHTML = `<p style="text-align:center; padding: 20px;">Loading war history...</p>`;
    try {
        const userApiKey = window.userTornApiKey;
        const globalYourFactionID = window.currentUserFactionId;
        const db = firebase.firestore();
        if (!userApiKey || !globalYourFactionID) {
            targetDisplayElement.innerHTML = `<p style="text-align:center; padding: 10px; color: orange;">API key or Faction ID not available.</p>`;
            return;
        }
        const historyUrl = `https://api.torn.com/v2/faction/rankedwars?sort=DESC&limit=5&key=${userApiKey}&comment=MyTornPA_RecentlyMet`;
        const historyResponse = await fetch(historyUrl);
        const historyData = await historyResponse.json();
        if (historyData.error) throw new Error(historyData.error.error);
        const wars = historyData.rankedwars || [];
        if (Object.keys(wars).length === 0) {
            targetDisplayElement.innerHTML = '<p style="text-align:center; padding: 20px;">No recent wars found.</p>';
            return;
        }
        targetDisplayElement.innerHTML = '<p style="text-align:center; padding: 20px;">Loading opponent details...</p>';
        const warIds = Object.keys(wars);
        const reportPromises = warIds.map(warId =>
            fetch(`https://api.torn.com/v2/faction/${warId}/rankedwarreport?key=${userApiKey}&comment=MyTornPA_WarReport`).then(res => res.json())
        );
        const warReports = await Promise.all(reportPromises);
        const opponentsMap = new Map();
        warReports.forEach(reportData => {
            const report = reportData.rankedwarreport;
            if (!report || !report.factions) return;
            const opponentFactionKey = Object.keys(report.factions).find(key => key != globalYourFactionID);
            if (opponentFactionKey) {
                const opponentFaction = report.factions[opponentFactionKey];
                if (opponentFaction.members) {
                    Object.values(opponentFaction.members).forEach(member => {
                        if (!opponentsMap.has(member.id)) {
                            opponentsMap.set(member.id, { id: member.id, name: member.name, position: 'Opponent' });
                        }
                    });
                }
            }
        });
        const uniqueOpponentIds = Array.from(opponentsMap.keys()).map(String);
        if (uniqueOpponentIds.length === 0) {
            targetDisplayElement.innerHTML = '<p style="text-align:center; padding: 20px;">No opponents found in recent wars.</p>';
            return;
        }
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
            let profilePicUrl = registeredUserData?.profile_image || DEFAULT_PROFILE_ICONS[Math.floor(Math.random() * DEFAULT_PROFILE_ICONS.length)];
            let messageButton = registeredUserData
                ? `<button class="item-button message-button" data-member-id="${tornPlayerId}" title="Send Message on MyTornPA">✉️</button>`
                : `<a href="https://www.torn.com/messages.php#/p=compose&XID=${tornPlayerId}" target="_blank" class="item-button" title="Send Message on Torn">✉️</a>`;
            cardsHtml += `<div class="member-item">...</div>`; // Assuming full card HTML
        }
        membersListContainer.innerHTML = cardsHtml;
        targetDisplayElement.innerHTML = '';
        targetDisplayElement.appendChild(membersListContainer);
        // Add event listeners for buttons inside membersListContainer
    } catch (error) {
        targetDisplayElement.innerHTML = `<p style="color: red; text-align:center; padding: 20px;">Error: ${error.message}</p>`;
    }
}

async function displayFactionMembersInChatTab(factionMembersApiData, targetDisplayElement) {
    // ...
}

initializeGlobals();