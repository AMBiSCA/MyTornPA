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
            const chatTextInput = document.querySelector('.chat-text-input');
            const chatSendBtn = document.querySelector('.chat-send-btn');
            const allTabs = document.querySelectorAll('.chat-tab');
            const allPanels = document.querySelectorAll('.chat-panel');

            // Open/Close Logic
            if(chatBarCollapsed) {
                chatBarCollapsed.addEventListener('click', () => {
                    if(chatWindow) chatWindow.classList.remove('hidden');
                    chatBarCollapsed.classList.add('hidden');
                });
            }
            // You will need a close button inside the chat window later.

            // Tab Switching Logic
            allTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const targetPanelId = tab.dataset.tabTarget;
                    const targetPanel = document.getElementById(targetPanelId);
                    allTabs.forEach(t => t.classList.remove('active'));
                    allPanels.forEach(p => p.classList.add('hidden'));
                    tab.classList.add('active');
                    if (targetPanel) targetPanel.classList.remove('hidden');
                });
            });

            // Send Message Logic
            if (chatSendBtn) chatSendBtn.addEventListener('click', sendChatMessage);
            if (chatTextInput) {
                chatTextInput.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        sendChatMessage();
                    }
                });
            }
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
                if (factionId) {
                    chatMessagesCollection = db.collection('factionChats').doc(String(factionId)).collection('messages');
                    setupChatRealtimeListener();
                }
            }
        } else {
            if (unsubscribeFromChat) unsubscribeFromChat();
            chatMessagesCollection = null;
            const chatDisplayArea = document.getElementById('chat-display-area');
            if (chatDisplayArea) chatDisplayArea.innerHTML = '<p>Please log in to use chat.</p>';
        }
    });

    // ---- CORE CHAT FUNCTIONS ----
    function displayChatMessage(messageObj) {
        const chatDisplayArea = document.getElementById('chat-display-area');
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

    async function sendChatMessage() {
        const chatTextInput = document.querySelector('.chat-text-input');
        if (!chatTextInput || !auth.currentUser || !chatMessagesCollection) return;
        const messageText = chatTextInput.value.trim();
        if (messageText === '') return;
        
        const messageObj = {
            senderId: auth.currentUser.uid,
            sender: currentTornUserName,
            text: messageText,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        try {
            await chatMessagesCollection.add(messageObj);
            chatTextInput.value = '';
            chatTextInput.focus();
        } catch (error) {
            console.error("Error sending message to Firebase:", error);
        }
    }

    function setupChatRealtimeListener() {
        const chatDisplayArea = document.getElementById('chat-display-area');
        if (!chatMessagesCollection) return;
        if (chatDisplayArea) chatDisplayArea.innerHTML = '<p>Loading messages...</p>';
        if (unsubscribeFromChat) unsubscribeFromChat();
        unsubscribeFromChat = chatMessagesCollection.orderBy('timestamp', 'asc').limitToLast(50)
            .onSnapshot(snapshot => {
                if (chatDisplayArea) chatDisplayArea.innerHTML = '';
                if (snapshot.empty) {
                    if (chatDisplayArea) chatDisplayArea.innerHTML = `<p>No messages yet.</p>`;
                    return;
                }
                snapshot.forEach(doc => displayChatMessage(doc.data()));
            }, error => {
                console.error("Error listening to chat messages:", error);
                if (chatDisplayArea) chatDisplayArea.innerHTML = `<p style="color: red;">Error loading messages.</p>`;
            });
    }
}

// Run the main initialization function
initializeGlobals();