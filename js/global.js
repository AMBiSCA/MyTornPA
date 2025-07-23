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