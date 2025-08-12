// --- GLOBAL VARIABLES FOR NOTIFICATION SYSTEM ---
// These are now at the top level, so all functions can see them.
const unreadChatTornIds = new Set();
let unsubscribeFromUnreadListener = null;


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
    // The unreadChatTornIds and unsubscribeFromUnreadListener variables were moved out of this function.
    let currentTornUserName = 'Unknown';
    let currentUserFactionId = null;
    let userTornApiKey = null;
    let currentUserAllianceIds = [];

    // ---- Torn API Base URL ----
    const TORN_API_BASE_URL = 'https://api.torn.com/v2';

    // ---- Load the Chat System ----
    fetch('globalchat.html')
        .then(response => response.text())
        .then(data => {
            const chatSystemPlaceholder = document.getElementById('chat-system-placeholder');
            if (chatSystemPlaceholder) {
                chatSystemPlaceholder.innerHTML = data;
                console.log("global.js: Global chat HTML loaded successfully into placeholder.");

                // --- DOM Element References ---
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

                function openChatPanel(panelToShow) {
                    if (chatWindow) chatWindow.classList.remove('hidden');
                    if (chatMainTabsContainer) chatMainTabsContainer.classList.remove('hidden');
                    allPanels.forEach(p => p.classList.add('hidden'));
                    if (panelToShow) panelToShow.classList.remove('hidden');
                }

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
                function updateAllianceInfoIconTitle() {
                    if (allianceInfoIcon) {
                        if (currentUserAllianceIds && currentUserAllianceIds.length > 0) {
                            allianceInfoIcon.title = `Saved Alliances: ${currentUserAllianceIds.join(', ')}\n(Chatting in first saved ID)`;
                        } else {
                            allianceInfoIcon.title = 'No Alliance IDs saved. Enter one above (max 3).';
                        }
                    }
                }
                minimizeChatBtns.forEach(btn => {
                    btn.addEventListener('click', () => {
                        if (chatWindow) chatWindow.classList.add('hidden');
                        if (chatMainTabsContainer) chatMainTabsContainer.classList.add('hidden');
                    });
                });
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
                                if (recentChatsSubTab) {
                                    recentChatsSubTab.click();
                                } else {
                                    friendsPanelContent.innerHTML = `<p style="text-align: center; color: #888; padding-top: 20px;">Recent chats content could not load.</p>`;
                                }
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
                                if (factionChatTextInput) factionChatTextInput.focus();
                                setupChatRealtimeListener('faction');
                                break;
                            case 'war-chat-panel':
                                if (warChatTextInput) warChatTextInput.focus();
                                setupChatRealtimeListener('war');
                                break;
                            case 'settings-panel':
                                allianceFactionIdInput.value = '';
                                updateAllianceInfoIconTitle();
                                break;
                        }
                    });
                });
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
                setupMessageSending(globalChatTextInput, globalChatSendBtn, 'global');
                setupMessageSending(allianceChatTextInput, allianceChatSendBtn, 'alliance');

            } else {
                console.error("global.js: Error: #chat-system-placeholder element not found for loading chat HTML.");
            }
        })
        .catch(error => console.error('global.js: Error loading global chat:', error));

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
                window.currentUserFactionId = currentUserFactionId;
                window.userTornApiKey = userTornApiKey;
                window.TORN_API_BASE_URL = TORN_API_BASE_URL;
                window.currentUserAllianceIds = currentUserAllianceIds;
                console.log(`User logged in. Faction ID: ${currentUserFactionId}, Name: ${currentTornUserName}, API Key Present: ${!!userTornApiKey}, Alliance IDs: [${currentUserAllianceIds.join(', ')}]`);
                unsubscribeFromUnreadListener = setupUnreadChatsListener(user);
            } else {
                console.warn("User profile not found for authenticated user:", user.uid);
                currentUserFactionId = null;
                userTornApiKey = null;
                currentUserAllianceIds = [];
                window.currentUserFactionId = null;
                window.userTornApiKey = null;
                window.TORN_API_BASE_URL = null;
                window.currentUserAllianceIds = [];
            }
        } else {
            if (unsubscribeFromChat) unsubscribeFromChat();
            if (unsubscribeFromUnreadListener) unsubscribeFromUnreadListener();
            chatMessagesCollection = null;
            currentUserFactionId = null;
            userTornApiKey = null;
            currentUserAllianceIds = [];
            window.currentUserFactionId = null;
            window.userTornApiKey = null;
            window.TORN_API_BASE_URL = null;
            window.currentUserAllianceIds = [];
            const chatDisplayAreaFaction = document.getElementById('chat-display-area');
            const chatDisplayAreaWar = document.getElementById('war-chat-display-area');
            const chatDisplayAreaGlobal = document.getElementById('global-chat-display-area');
            const chatDisplayAreaAlliance = document.getElementById('alliance-chat-display-area');
            if (chatDisplayAreaFaction) chatDisplayAreaFaction.innerHTML = '<p>Please log in to use chat.</p>';
            if (chatDisplayAreaWar) chatDisplayAreaWar.innerHTML = '<p>Please log in to use war chat.</p>';
            if (chatDisplayAreaGlobal) chatDisplayAreaGlobal.innerHTML = '<p>Please log in to use global chat.</p>';
            if (chatDisplayAreaAlliance) chatDisplayAreaAlliance.innerHTML = '<p>Please log in to use alliance chat.</p>';
            console.log("User logged out. Chat functionalities are reset.");
        }
    });
}

async function populateFactionOverview(overviewContent) {
    if (!overviewContent) {
        console.error("Faction Overview panel content area not found or not provided!");
        return;
    }
    overviewContent.innerHTML = `<p style="text-align: center; color: #888; padding-top: 20px;">Loading Faction Overview...</p>`;
    try {
        const factionId = window.currentUserFactionId;
        const apiKey = window.userTornApiKey;
        const db = firebase.firestore();
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
            snapshot.forEach(doc => {
                allMemberFirebaseData[doc.id] = doc.data();
            });
        }
        const processedMembers = membersArray.map((tornData) => {
            const memberId = String(tornData.user_id || tornData.id);
            const firebaseData = allMemberFirebaseData[memberId] || {};
            return {
                tornData,
                firebaseData
            };
        });
        processedMembers.sort((a, b) => a.tornData.name.localeCompare(b.tornData.name));
        const memberRowsHtml = processedMembers.map(member => {
            const {
                tornData,
                firebaseData
            } = member;
            const name = tornData.name;
            const memberId = tornData.id;
            const energy = `${firebaseData.energy?.current || 'N/A'} / ${firebaseData.energy?.maximum || 'N/A'}`;
            const drugCooldown = firebaseData.cooldowns?.drug || 0;
            const energyRefillUsed = firebaseData.energyRefillUsed ? 'Yes' : 'No';
            const status = tornData.status.description;
            const reviveSetting = tornData.revive_setting || 'No one';
            let drugCdHtml = `<span class="status-okay">None 🍁</span>`;
            if (drugCooldown > 0) {
                const hours = Math.floor(drugCooldown / 3600);
                const minutes = Math.floor((drugCooldown % 3600) / 60);
                let cdText = (hours > 0) ? `${hours}hr ${minutes}m` : `${minutes}m`;
                const cdClass = drugCooldown > 18000 ? 'status-hospital' : 'status-other';
                drugCdHtml = `<span class="${cdClass}">${cdText}</span>`;
            }
            let reviveCircleClass = 'rev-circle-red';
            if (reviveSetting === 'Everyone') reviveCircleClass = 'rev-circle-green';
            else if (reviveSetting === 'Friends & faction') reviveCircleClass = 'rev-circle-orange';
            let statusClass = 'status-okay';
            if (tornData.status.state === 'Hospital') statusClass = 'status-hospital';
            if (tornData.status.state === 'Traveling') statusClass = 'status-other';
            return `
                <tr>
                    <td class="overview-name"><a href="https://www.torn.com/profiles.php?XID=${memberId}" target="_blank">${name}</a></td>
                    <td class="overview-energy energy-text">${energy}</td>
                    <td class="overview-drugcd">${drugCdHtml}</td>
                    <td class="overview-revive"><div class="rev-circle ${reviveCircleClass}" title="${reviveSetting}"></div></td>
                    <td class="overview-refill">${energyRefillUsed}</td>
                    <td class="overview-status ${statusClass}">${status}</td>
                </tr>
            `;
        }).join('');
        overviewContent.innerHTML = `
            <table class="overview-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Energy</th>
                        <th>Drug C/D</th>
                        <th>Rev</th>
                        <th>Refill</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${memberRowsHtml}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error("Error populating Faction Overview:", error);
        overviewContent.innerHTML = `<p style="color: red; text-align: center;">Error: ${error.message}</p>`;
    }
}

function updateFriendNotification(friendName, hasNewMessage) {
    const friendElement = document.getElementById(`friend-${friendName}`);
    if (friendElement) {
        if (hasNewMessage) {
            friendElement.classList.add('has-new-message');
        } else {
            friendElement.classList.remove('has-new-message');
        }
    }
}
async function addOrUpdateUserAllianceId(newAllianceId) {
    const user = auth.currentUser;
    if (!user) {
        console.warn('Cannot save alliance ID: User not logged in.');
        return;
    }
    const currentAllianceIds = currentUserAllianceIds || [];
    const trimmedNewId = newAllianceId.trim();
    if (!trimmedNewId) {
        alert('Please enter a valid Alliance ID.');
        return;
    }
    if (currentAllianceIds.includes(trimmedNewId)) {
        alert(`Alliance ID '${trimmedNewId}' is already saved.`);
        return;
    }
    if (currentAllianceIds.length >= 3) {
        alert('You can only save up to 3 Alliance IDs. Please clear one first.');
        return;
    }
    try {
        await db.collection('userProfiles').doc(user.uid).update({
            allianceIds: firebase.firestore.FieldValue.arrayUnion(trimmedNewId)
        });
        currentUserAllianceIds.push(trimmedNewId);
        console.log(`Alliance ID '${trimmedNewId}' added for user ${user.uid}`);
        alert(`Alliance ID '${trimmedNewId}' saved successfully!`);
    } catch (error) {
        console.error('Error adding alliance ID:', error);
        alert('Failed to add Alliance ID. Please try again.');
    }
}
async function clearUserAllianceIds() {
    const user = auth.currentUser;
    if (!user) {
        console.warn('Cannot clear alliance IDs: User not logged in.');
        return;
    }
    try {
        await db.collection('userProfiles').doc(user.uid).update({
            allianceIds: []
        });
        currentUserAllianceIds = [];
        console.log(`All Alliance IDs cleared for user ${user.uid}`);
    } catch (error) {
        console.error('Error clearing alliance IDs:', error);
        alert('Failed to clear Alliance IDs. Please try again.');
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
        <div class="pcw-messages">
            <p style="color: #888;">Loading messages...</p>
        </div>
        <div class="pcw-input-area">
            <input type="text" class="pcw-input" placeholder="Type a message...">
            <button class="pcw-send-btn">Send</button>
        </div>
    `;
    document.body.appendChild(chatDiv);
    chatDiv.querySelector('.pcw-close-btn').addEventListener('click', () => {
        chatDiv.remove();
    });
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
                    return {
                        id: friendTornId,
                        name: friendName,
                        image: profileImage
                    };
                }
                return {
                    id: friendTornId,
                    name: `Unknown [${friendTornId}]`,
                    image: '../../images/default_profile_icon.png'
                };
            });
        });
        const friendDetails = await Promise.all(friendDetailsPromises);
        let cardsHtml = '';
        friendDetails.forEach(friend => {
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
        membersListContainer.addEventListener('click', async (event) => {
            const removeButton = event.target.closest('.remove-friend-button');
            const messageButton = event.target.closest('.message-friend-button');
            if (removeButton) {
                const friendIdToRemove = removeButton.dataset.friendId;
                const userConfirmed = await showCustomConfirm(`Are you sure you want to remove friend [${friendIdToRemove}]?`, "Confirm Removal");
                if (userConfirmed) {
                    await db.collection('userProfiles').doc(currentUser.uid).collection('friends').doc(friendIdToRemove).delete();
                    populateFriendListTab(targetDisplayElement);
                }
            } else if (messageButton) {
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

function displayPrivateChatMessage(messageObj, displayElement, isMyMessage) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message');
    if (isMyMessage) {
        messageElement.classList.add('my-message');
    }
    const timestamp = messageObj.timestamp?.toDate().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    }) || '';
    const senderName = isMyMessage ? 'You' : (messageObj.sender || 'Unknown');
    const messageText = messageObj.text || '';
    messageElement.innerHTML = `
            <span class="chat-timestamp">[${timestamp}]</span>
            <span class="chat-sender">${senderName}:</span>
            <span class="chat-text">${messageText}</span>
        `;
    displayElement.appendChild(messageElement);
}
async function loadAndHandlePrivateChat(friendTornId, friendName, chatWindowElement) {
    const messagesContainer = chatWindowElement.querySelector('.pcw-messages');
    const inputField = chatWindowElement.querySelector('.pcw-input');
    const sendButton = chatWindowElement.querySelector('.pcw-send-btn');
    const currentUser = auth.currentUser;
    if (!currentUser) {
        messagesContainer.innerHTML = '<p style="color: red;">You must be logged in.</p>';
        return;
    }
    let friendFirebaseUid = null;
    try {
        const profileQuery = await db.collection('userProfiles').where('tornProfileId', '==', friendTornId).limit(1).get();
        if (profileQuery.empty) {
            messagesContainer.innerHTML = `<p style="color: orange;">Cannot open chat. ${friendName} is not a registered user of this platform.</p>`;
            inputField.disabled = true;
            sendButton.disabled = true;
            return;
        }
        friendFirebaseUid = profileQuery.docs[0].id;
    } catch (error) {
        console.error("Error fetching friend's Firebase UID:", error);
        messagesContainer.innerHTML = `<p style="color: red;">Error initializing chat.</p>`;
        return;
    }
    const participants = [currentUser.uid, friendFirebaseUid].sort();
    const chatDocId = `private_${participants[0]}_${participants[1]}`;
    const messagesCollectionRef = db.collection('privateChats').doc(chatDocId).collection('messages');
    const chatDocRef = db.collection('privateChats').doc(chatDocId);
    chatDocRef.get().then(doc => {
        if (doc.exists && doc.data().unreadFor === currentUser.uid) {
            chatDocRef.update({
                unreadFor: null
            });
        }
    }).catch(err => console.error("Error marking chat as read:", err));
    try {
        await chatDocRef.set({
            participants: participants,
        }, {
            merge: true
        });
    } catch (error) {
        console.error("Error ensuring parent chat document exists:", error);
        messagesContainer.innerHTML = `<p style="color: red;">A permissions error occurred while setting up the chat.</p>`;
        return;
    }
    const unsubscribe = messagesCollectionRef.orderBy('timestamp', 'asc').onSnapshot(snapshot => {
        messagesContainer.innerHTML = '';
        if (snapshot.empty) {
            messagesContainer.innerHTML = `<p style="color: #888;">No messages yet. Say hello!</p>`;
        } else {
            snapshot.forEach(doc => {
                const messageData = doc.data();
                const isMyMessage = messageData.senderId === currentUser.uid;
                displayPrivateChatMessage(messageData, messagesContainer, isMyMessage);
            });
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }, error => {
        console.error("Error loading private messages:", error);
        messagesContainer.innerHTML = `<p style="color: red;">Error loading messages: ${error.message}</p>`;
    });
    const sendMessage = async () => {
        const messageText = inputField.value.trim();
        if (messageText === '') return;
        const messageObj = {
            senderId: currentUser.uid,
            sender: currentTornUserName,
            text: messageText,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        try {
            await chatDocRef.update({
                lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessageSnippet: messageText,
                unreadFor: friendFirebaseUid
            });
            await messagesCollectionRef.add(messageObj);
            inputField.value = '';
            inputField.focus();
            updateBellIcon(true);
        } catch (error) {
            console.error("Error sending private message:", error);
            alert("Failed to send message.");
        }
    };
    sendButton.addEventListener('click', sendMessage);
    inputField.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendMessage();
        }
    });
    const closeButton = chatWindowElement.querySelector('.pcw-close-btn');
    const newCloseButtonListener = () => {
        unsubscribe();
        closeButton.removeEventListener('click', newCloseButtonListener);
    };
    closeButton.addEventListener('click', newCloseButtonListener);
}

function updateBellIcon(hasNotification) {
    const bellIcon = document.getElementById('open-notifications-icon');
    if (bellIcon) {
        if (hasNotification) {
            bellIcon.classList.add('has-notification');
        } else {
            bellIcon.classList.remove('has-notification');
        }
    }
}

function showCustomConfirmWithOptions(message, title = "Confirm") {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'custom-confirm-overlay';
        overlay.innerHTML = `
            <div class="custom-confirm-box">
                <h4>${title}</h4>
                <p>${message}</p>
                <div class="custom-confirm-checkbox">
                    <input type="checkbox" id="confirm-dont-ask-again">
                    <label for="confirm-dont-ask-again">Don't ask me again</label>
                </div>
                <div class="custom-confirm-actions">
                    <button class="action-button danger">Yes</button>
                    <button class="action-button">No</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        const yesBtn = overlay.querySelector('.danger');
        const noBtn = overlay.querySelector('.action-button:not(.danger)');
        const checkbox = overlay.querySelector('#confirm-dont-ask-again');
        const closeConfirm = (confirmed) => {
            const dontAskAgain = checkbox.checked;
            document.body.removeChild(overlay);
            resolve({
                confirmed,
                dontAskAgain
            });
        };
        yesBtn.onclick = () => closeConfirm(true);
        noBtn.onclick = () => closeConfirm(false);
    });
}
async function deletePrivateChat(chatDocId) {
    try {
        const messagesRef = db.collection('privateChats').doc(chatDocId).collection('messages');
        const messagesSnapshot = await messagesRef.get();
        const batch = db.batch();
        messagesSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        await db.collection('privateChats').doc(chatDocId).delete();
        console.log(`Successfully deleted chat and all messages for doc: ${chatDocId}`);
        return true;
    } catch (error) {
        console.error("Error deleting private chat:", error);
        alert("Failed to delete chat.");
        return false;
    }
}

function setupUnreadChatsListener(user) {
    console.log("Setting up listener for unread chats for user:", user.uid);
    const unreadQuery = db.collection('privateChats').where('participants', 'array-contains', user.uid);
    const unsubscribe = unreadQuery.onSnapshot(async (snapshot) => {
        unreadChatTornIds.clear();
        for (const doc of snapshot.docs) {
            const chatData = doc.data();
            if (chatData.unreadFor === user.uid) {
                const otherParticipantUid = chatData.participants.find(uid => uid !== user.uid);
                if (otherParticipantUid) {
                    try {
                        const profileDoc = await db.collection('userProfiles').doc(otherParticipantUid).get();
                        if (profileDoc.exists) {
                            const tornId = profileDoc.data().tornProfileId;
                            if (tornId) {
                                unreadChatTornIds.add(String(tornId));
                            }
                        }
                    } catch (err) {
                        console.error("Error fetching user profile for notification:", err);
                    }
                }
            }
        }
        console.log("Updated list of unread Torn IDs:", unreadChatTornIds);
    }, (error) => {
        console.error("Error in unread chat listener:", error);
    });
    return unsubscribe;
}
async function loadRecentPrivateChats(targetDisplayElement) {
    if (!targetDisplayElement) {
        console.error("HTML Error: Target display element not provided for Recent Chats tab.");
        return;
    }
    targetDisplayElement.innerHTML = `<p style="text-align:center; padding: 20px;">Loading recent conversations...</p>`;
    const currentUser = auth.currentUser;
    if (!currentUser) {
        targetDisplayElement.innerHTML = '<p style="text-align:center; color: orange;">Please log in to see your chats.</p>';
        return;
    }
    try {
        const chatsSnapshot = await db.collection('privateChats')
            .where('participants', 'array-contains', currentUser.uid)
            .orderBy('lastMessageAt', 'desc')
            .limit(20)
            .get();
        if (chatsSnapshot.empty) {
            targetDisplayElement.innerHTML = '<p style="text-align:center; padding: 20px;">No recent private chats found.</p>';
            return;
        }
        const chatDetailsPromises = chatsSnapshot.docs.map(async (doc) => {
            const chatData = doc.data();
            const otherParticipantUid = chatData.participants.find(uid => uid !== currentUser.uid);
            if (!otherParticipantUid) return null;
            const userProfileDoc = await db.collection('userProfiles').doc(otherParticipantUid).get();
            if (!userProfileDoc.exists) return null;
            const profileData = userProfileDoc.data();
            const friendTornId = profileData.tornProfileId;
            const friendName = profileData.preferredName || profileData.name || `User ${friendTornId}`;
            const userDoc = await db.collection('users').doc(friendTornId).get();
            const friendImage = userDoc.exists ? userDoc.data().profile_image : '../../images/default_profile_icon.png';
            const lastMessageSnapshot = await db.collection('privateChats').doc(doc.id).collection('messages').orderBy('timestamp', 'desc').limit(1).get();
            const lastMessage = lastMessageSnapshot.empty ? {
                text: 'No messages yet...'
            } : lastMessageSnapshot.docs[0].data();
            return {
                chatId: doc.id,
                tornId: String(friendTornId),
                name: friendName,
                image: friendImage,
                lastMessage: lastMessage.text
            };
        });
        const chatDetails = (await Promise.all(chatDetailsPromises)).filter(Boolean);
        let listHtml = '';
        chatDetails.forEach(chat => {
            const isUnread = unreadChatTornIds.has(chat.tornId);
            const unreadClass = isUnread ? 'has-new-message' : '';
            if (isUnread) {
                updateBellIcon(true);
            }
            listHtml += `
                <div class="recent-chat-item ${unreadClass}" id="friend-${chat.tornId}" data-friend-id="${chat.tornId}" data-friend-name="${chat.name}">
                    <img src="${chat.image}" class="rc-avatar" alt="${chat.name}'s avatar">
                    <div class="rc-details" title="Open chat with ${chat.name}">
                        <span class="rc-name">${chat.name}</span>
                        <span class="rc-last-message">${chat.lastMessage}</span>
                    </div>
                    <button class="item-button rc-delete-btn" data-chat-id="${chat.chatId}" data-friend-name="${chat.name}" title="Delete Chat">🗑️</button>
                </div>
            `;
        });
        targetDisplayElement.innerHTML = `<div class="recent-chats-list">${listHtml}</div>`;
        targetDisplayElement.querySelector('.recent-chats-list').addEventListener('click', async (event) => {
            const chatItem = event.target.closest('.recent-chat-item');
            const deleteButton = event.target.closest('.rc-delete-btn');
            if (deleteButton) {
                event.stopPropagation();
                const chatId = deleteButton.dataset.chatId;
                const friendName = deleteButton.dataset.friendName;
                const confirmDelete = localStorage.getItem('confirmDeleteChat') !== 'false';
                if (confirmDelete) {
                    const result = await showCustomConfirmWithOptions(`Are you sure you want to delete your entire chat history with ${friendName}? This cannot be undone.`, "Confirm Deletion");
                    if (result.dontAskAgain) {
                        localStorage.setItem('confirmDeleteChat', 'false');
                    }
                    if (!result.confirmed) {
                        return;
                    }
                }
                const success = await deletePrivateChat(chatId);
                if (success) {
                    loadRecentPrivateChats(targetDisplayElement);
                }
            } else if (chatItem) {
                const friendId = chatItem.dataset.friendId;
                const friendName = chatItem.dataset.friendName;
                openPrivateChatWindow(friendId, friendName);
            }
        });
    } catch (error) {
        console.error("Error populating Recent Chats tab:", error);
        targetDisplayElement.innerHTML = `<p style="color: red; text-align:center;">Error loading recent chats: ${error.message}</p>`;
    }
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
                    return {
                        id: ignoredTornId,
                        name: ignoredName,
                        image: profileImage
                    };
                }
                return {
                    id: ignoredTornId,
                    name: `Unknown [${ignoredTornId}]`,
                    image: '../../images/default_profile_icon.png'
                };
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
        membersListContainer.addEventListener('click', async (event) => {
            if (event.target.classList.contains('unignore-button')) {
                const ignoredIdToRemove = event.target.dataset.ignoredId;
                const userConfirmed = await showCustomConfirm(`Are you sure you want to unignore user [${ignoredIdToRemove}]?`, "Confirm Removal");
                if (userConfirmed) {
                    await db.collection('userProfiles').doc(currentUser.uid).collection('ignored').doc(ignoredIdToRemove).delete();
                    populateIgnoreListTab(targetDisplayElement);
                }
            }
        });
    } catch (error) {
        console.error("Error populating Ignore List tab:", error);
        targetDisplayElement.innerHTML = `<p style="color: red; text-align:center;">Error: ${error.message}</p>`;
    }
}

function displayChatMessage(messageObj, chatDisplayAreaId) {
    const chatDisplayArea = document.getElementById(chatDisplayAreaId);
    if (!chatDisplayArea) return;
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message');
    const timestamp = messageObj.timestamp?.toDate().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    }) || new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    });
    const senderName = messageObj.sender || 'Unknown';
    const messageText = messageObj.text || '';
    messageElement.innerHTML = `<span class="chat-timestamp">[${timestamp}]</span> <span class="chat-sender">${senderName}:</span> <span class="chat-text">${messageText}</span>`;
    chatDisplayArea.appendChild(messageElement);
    chatDisplayArea.scrollTop = chatDisplayArea.scrollHeight;
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
    if (collectionType === 'faction') {
        if (currentUserFactionId) {
            targetCollection = db.collection('factionChats').doc(currentUserFactionId).collection('messages');
            consoleLogPath = `factionChats/${currentUserFactionId}/messages`;
        } else {
            console.warn("Faction ID not available for current user. Cannot send faction chat message.");
            alert("Faction ID not found. Please complete your profile to use faction chat.");
            return;
        }
    } else if (collectionType === 'war') {
        targetCollection = db.collection('warChats').doc('currentWar').collection('messages');
        consoleLogPath = `warChats/currentWar/messages`;
    } else if (collectionType === 'global') {
        targetCollection = db.collection('globalChats').doc('allUsers').collection('messages');
        consoleLogPath = `globalChats/allUsers/messages`;
    } else if (collectionType === 'alliance') {
        if (currentUserAllianceIds && currentUserAllianceIds.length > 0) {
            const allianceIdToChatIn = currentUserAllianceIds[0];
            targetCollection = db.collection('allianceChats').doc(allianceIdToChatIn).collection('messages');
            consoleLogPath = `allianceChats/${allianceIdToChatIn}/messages`;
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
        if (collectionType === 'faction' || collectionType === 'alliance' || collectionType === 'global') {
            const parentCollection = collectionType === 'faction' ? 'factionChats' : (collectionType === 'alliance' ? 'allianceChats' : 'globalChats');
            const docId = collectionType === 'faction' ? currentUserFactionId : (collectionType === 'alliance' ? currentUserAllianceIds[0] : 'allUsers');
            await db.collection(parentCollection).doc(docId).set({}, {
                merge: true
            });
        }
        await targetCollection.add(messageObj);
        textInput.value = '';
        textInput.focus();
    } catch (error) {
        console.error(`Error sending ${collectionType} message to Firebase:`, error);
        alert(`Failed to send ${collectionType} message.`);
    }
}

function setupChatRealtimeListener(type) {
    let chatDisplayArea = null;
    let collectionRef = null;
    let displayAreaId = '';
    let consoleLogPath = '';
    if (unsubscribeFromChat) {
        unsubscribeFromChat();
        console.log("Unsubscribed from previous chat listener.");
    }
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
        collectionRef = db.collection('warChats').doc('currentWar').collection('messages');
        displayAreaId = 'war-chat-display-area';
        consoleLogPath = `warChats/currentWar/messages`;
    } else if (type === 'global' && auth.currentUser) {
        collectionRef = db.collection('globalChats').doc('allUsers').collection('messages');
        displayAreaId = 'global-chat-display-area';
        consoleLogPath = `globalChats/allUsers/messages`;
    } else if (type === 'alliance' && auth.currentUser) {
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
    } else if (!auth.currentUser) {
        const displayAreas = {
            'faction': 'chat-display-area',
            'war': 'war-chat-display-area',
            'global': 'global-chat-display-area',
            'alliance': 'alliance-chat-display-area'
        };
        chatDisplayArea = document.getElementById(displayAreas[type]);
        if (chatDisplayArea) chatDisplayArea.innerHTML = '<p>Please log in to use chat.</p>';
        console.warn(`User not logged in. Cannot set up ${type} chat listener.`);
        return;
    }
    chatDisplayArea = document.getElementById(displayAreaId);
    if (chatDisplayArea) chatDisplayArea.innerHTML = `<p>Loading ${type} messages...</p>`;
    console.log(`Setting up ${type} chat listener for path: ${consoleLogPath}`);
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
                if (chatDisplayArea) chatDisplayArea.innerHTML = `<p style="color: red;">Error loading ${type} messages.</p>`;
            });
    }
}
async function populateRecentlyMetTab(targetDisplayElement) {
    if (!targetDisplayElement) {
        console.error("HTML Error: Target display element not provided for Recently Met tab.");
        return;
    }
    targetDisplayElement.innerHTML = `<p style="text-align:center; padding: 20px;">Loading war history to find opponents...</p>`;
    try {
        const userApiKey = window.userTornApiKey;
        const globalYourFactionID = window.currentUserFactionId;
        const db = firebase.firestore();
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
                        opponentsMap.set(member.id, {
                            id: member.id,
                            name: member.name,
                            position: 'Opponent'
                        });
                    }
                });
            }
        });
        const uniqueOpponentIds = Array.from(opponentsMap.keys()).map(String);
        if (uniqueOpponentIds.length === 0) {
            targetDisplayElement.innerHTML = '<p style="text-align:center; padding: 20px;">Could not find any opponents in recent wars.</p>';
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
        targetDisplayElement.innerHTML = '';
        targetDisplayElement.appendChild(membersListContainer);
        for (const opponent of opponentsMap.values()) {
            const tornPlayerId = String(opponent.id);
            const memberName = opponent.name || `Unknown (${tornPlayerId})`;
            const memberRank = opponent.position || '';
            let profilePicUrl;
            const registeredUserData = registeredUsersData.get(tornPlayerId);
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
            const memberItemDiv = document.createElement('div');
            memberItemDiv.classList.add('member-item');
            if (memberRank === "Leader" || memberRank === "Co-leader") {
                memberItemDiv.classList.add('leader-member');
            }
            memberItemDiv.innerHTML = `
                <div class="member-info-left">
                    <span class="member-rank">${memberRank}</span>
                    <div class="member-identity">
                        <img src="${profilePicUrl}" alt="${memberName}'s profile pic" class="member-profile-pic">
                        <a href="https://www.torn.com/profiles.php?XID=${tornPlayerId}" target="_blank" class="member-name">${memberName} [${tornPlayerId}]</a>
                    </div>
                </div>
                <div class="member-actions">
                    <button class="add-member-button item-button" data-member-id="${tornPlayerId}" title="Add Friend">👤<span class="plus-sign">+</span></button>
                    ${messageButton}
                    <a href="https://www.torn.com/profiles.php?XID=${tornPlayerId}" target="_blank" class="item-button profile-link-button" title="View Torn Profile">🔗</a>
                </div>
            `;
            membersListContainer.appendChild(memberItemDiv);
        }
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
                    await friendDocRef.set({
                        addedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
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
    const rankOrder = {
        "Leader": 0,
        "Co-leader": 1,
        "Council": 2,
        "Right Hand": 3,
        "Left Hand": 4,
        "Captain": 5,
        "Lieutenant": 6,
        "Sergeant": 7,
        "Corporal": 8,
        "Recruit": 9,
        "Applicant": 10,
        "Member": 99
    };
    membersArray.sort((a, b) => {
        const orderA = rankOrder[a.position] !== undefined ? rankOrder[a.position] : rankOrder["Member"];
        const orderB = rankOrder[b.position] !== undefined ? rankOrder[b.position] : rankOrder["Member"];
        if (orderA !== orderB) {
            return orderA - orderB;
        }
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
                <button class="remove-friend-button item-button" data-member-id="${tornPlayerId}" title="Remove Friend">
                    👤<span class="plus-sign">-</span>
                </button>
            `;
        } else {
            actionButtonHtml = `
                <button class="add-member-button item-button" data-member-id="${tornPlayerId}" title="Add Friend">
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
                await friendDocRef.set({
                    addedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
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
}
initializeGlobals();