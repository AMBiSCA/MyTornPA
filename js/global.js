// This function will run when the script is loaded
function initializeChatAndFooter() {
    // ---- Firebase Setup ----
    const db = firebase.firestore();
    const auth = firebase.auth();
    let chatMessagesCollection = null;
    let unsubscribeFromChat = null;
    let currentTornUserName = 'Unknown';

    // ---- Load the HTML for the footer and chat window ----
    fetch('globalfooter.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('footer-container').innerHTML = data;
            
            // Now that the HTML is loaded, find the elements for opening/closing the window
            const chatBarCollapsed = document.getElementById('chat-bar-collapsed');
            const chatWindow = document.getElementById('chat-window');
            const closeChatButton = document.getElementById('close-chat-button');
            const chatTextInput = document.querySelector('.chat-text-input');
            const chatSendBtn = document.querySelector('.chat-send-btn');

            // --- Open/Close Logic ---
            if (chatBarCollapsed) {
                chatBarCollapsed.addEventListener('click', () => {
                    if(chatWindow) chatWindow.classList.remove('hidden');
                    chatBarCollapsed.classList.add('hidden');
                });
            }
            if (closeChatButton) {
                closeChatButton.addEventListener('click', () => {
                    if(chatWindow) chatWindow.classList.add('hidden');
                    if(chatBarCollapsed) chatBarCollapsed.classList.remove('hidden');
                });
            }

            // --- Send Message Logic ---
            if (chatSendBtn) {
                chatSendBtn.addEventListener('click', sendChatMessage);
            }
            if (chatTextInput) {
                chatTextInput.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        sendChatMessage();
                    }
                });
            }

        })
        .catch(error => {
            console.error('Error loading global footer:', error);
        });

    // ---- AUTHENTICATION LISTENER ----
    // This is the most important part. It waits for a user to log in.
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // A user is signed in.
            const userProfileRef = db.collection('userProfiles').doc(user.uid);
            const doc = await userProfileRef.get();

            if (doc.exists) {
                const userData = doc.data();
                const factionId = userData.faction_id;
                currentTornUserName = userData.preferredName || 'Unknown User';
                
                if (factionId) {
                    // We have the faction ID, so we can set up the correct chat collection
                    chatMessagesCollection = db.collection('factionChats').doc(String(factionId)).collection('messages');
                    console.log(`User logged in. Chat collection set to: factionChats/${factionId}/messages`);
                    // Start listening for new messages
                    setupChatRealtimeListener();
                } else {
                    console.warn("User is logged in but has no faction_id in their profile.");
                }
            }
        } else {
            // User is signed out.
            console.log("User signed out. Unsubscribing from chat.");
            if (unsubscribeFromChat) {
                unsubscribeFromChat();
            }
            chatMessagesCollection = null;
            const chatDisplayArea = document.getElementById('chat-display-area');
            if (chatDisplayArea) {
                chatDisplayArea.innerHTML = '<p>Please log in to use chat.</p>';
            }
        }
    });

    // ---- CORE CHAT FUNCTIONS (from your file) ----

    function displayChatMessage(messageObj) {
        const chatDisplayArea = document.getElementById('chat-display-area');
        if (!chatDisplayArea) return;

        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message');

        const timestamp = messageObj.timestamp && typeof messageObj.timestamp.toDate === 'function' ?
            messageObj.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
            new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const senderName = messageObj.sender || 'Unknown';
        const messageText = messageObj.text || '';

        messageElement.innerHTML = `
            <span class="chat-timestamp">[${timestamp}]</span>
            <span class="chat-sender">${senderName}:</span>
            <span class="chat-text">${messageText}</span>
        `;
        
        chatDisplayArea.appendChild(messageElement);
        chatDisplayArea.scrollTop = chatDisplayArea.scrollHeight; // Auto-scroll
    }

    async function sendChatMessage() {
        const chatTextInput = document.querySelector('.chat-text-input');
        if (!chatTextInput || !auth.currentUser) return;
        
        const messageText = chatTextInput.value.trim();
        if (messageText === '') return;

        if (!chatMessagesCollection) {
            alert("Cannot send message. Chat is not properly initialized. Are you in a faction?");
            return;
        }

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
            alert("Failed to send message. See console for details.");
        }
    }

    function setupChatRealtimeListener() {
        const chatDisplayArea = document.getElementById('chat-display-area');
        if (!chatMessagesCollection) {
            console.error("Cannot set up chat listener: chatMessagesCollection is not defined.");
            return;
        }

        if (chatDisplayArea) chatDisplayArea.innerHTML = '<p>Loading messages...</p>';
        
        if (unsubscribeFromChat) {
            unsubscribeFromChat(); // Stop any previous listener
        }

        unsubscribeFromChat = chatMessagesCollection
            .orderBy('timestamp', 'asc')
            .limitToLast(50) // Get the last 50 messages
            .onSnapshot(snapshot => {
                if (chatDisplayArea) chatDisplayArea.innerHTML = ''; // Clear display
                
                if (snapshot.empty) {
                    if (chatDisplayArea) chatDisplayArea.innerHTML = `<p>No messages yet. Be the first to say hello!</p>`;
                    return;
                }
                
                snapshot.forEach(doc => {
                    displayChatMessage(doc.data());
                });
            }, error => {
                console.error("Error listening to chat messages:", error);
                if (chatDisplayArea) chatDisplayArea.innerHTML = `<p style="color: red;">Error loading messages.</p>`;
            });
    }
}

// Run the main initialization function
initializeChatAndFooter();