// This function will run when the script is loaded
function initializeGlobals() {
    // ---- Firebase Setup ----
    const db = firebase.firestore();
    const auth = firebase.auth();
    let chatMessagesCollection = null;
    let unsubscribeFromChat = null;
    let currentTornUserName = 'Unknown';

    // ---- Load the Footer ----
    // Path: From global.js (in /js), go up one level (../) to the project root, then find globalfooter.html
    // Assuming globalfooter.html is also in the 'mysite/' root directory.
    fetch('../globalfooter.html')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status} for ../globalfooter.html`);
            }
            return response.text();
        })
        .then(data => {
            document.getElementById('footer-container').innerHTML = data;
        })
        .catch(error => console.error('Error loading global footer:', error));

    // ---- Load the Chat System HTML dynamically ----
    // Path: From global.js (in /js), go up one level (../) to the project root, then find globalchat.html
    fetch('../globalchat.html')
        .then(response => {
            if (!response.ok) {
                // This will catch 404s and other HTTP errors
                throw new Error(`HTTP error! Status: ${response.status} for ../globalchat.html`);
            }
            return response.text();
        })
        .then(data => {
            const chatPlaceholder = document.getElementById('chat-system-placeholder');
            if (chatPlaceholder) {
                chatPlaceholder.innerHTML = data;
                // --- IMPORTANT: Call setupChatFunctionality ONLY AFTER HTML IS LOADED ---
                setupChatFunctionality();
            } else {
                console.error('Error: #chat-system-placeholder not found in the DOM. Cannot inject chat HTML.');
            }
        })
        .catch(error => {
            console.error('Error loading global chat HTML:', error);
            const chatPlaceholder = document.getElementById('chat-system-placeholder');
            if (chatPlaceholder) {
                chatPlaceholder.innerHTML = '<p style="color: red; text-align: center;">Failed to load chat. Check console for errors.</p>';
            }
        });

    // --- FUNCTION TO SET UP CHAT DOM LISTENERS AFTER HTML IS LOADED ---
    function setupChatFunctionality() {
        // Ensure all selectors target elements *within* the #tornpa-chat-system,
        // which is the main container loaded from globalchat.html
        const chatBarCollapsed = document.getElementById('chat-bar-collapsed');
        const chatWindow = document.getElementById('chat-window');

        // Use specific IDs or parent selectors to avoid conflicts
        const chatTextInput = document.querySelector('#tornpa-chat-system #faction-chat-panel .chat-text-input');
        const chatSendBtn = document.querySelector('#tornpa-chat-system #faction-chat-panel .chat-send-btn');
        const allTabs = document.querySelectorAll('#tornpa-chat-system .chat-tab');
        const allPanels = document.querySelectorAll('#tornpa-chat-system .chat-panel');

        // Open/Close Logic
        if(chatBarCollapsed) {
            chatBarCollapsed.addEventListener('click', () => {
                if(chatWindow) {
                    chatWindow.classList.remove('hidden'); // Show the chat window
                    // Also ensure the currently active chat panel is shown
                    const activePanelOnOpen = document.querySelector('#tornpa-chat-system .chat-panel.active');
                    if (activePanelOnOpen) {
                        activePanelOnOpen.classList.remove('hidden');
                    }
                }
                chatBarCollapsed.classList.add('hidden'); // Hide the collapsed bar
            });
        }

        // If you add a close button to your chatWindow, attach its listener here
        const closeChatBtn = document.getElementById('close-chat-btn'); // Assuming globalchat.html has a button with this ID
        if (closeChatBtn) {
            closeChatBtn.addEventListener('click', () => {
                if (chatWindow) chatWindow.classList.add('hidden');
                if (chatBarCollapsed) chatBarCollapsed.classList.remove('hidden');
            });
        }


        // Tab Switching Logic
        allTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetPanelId = tab.dataset.tabTarget; // Uses data-tab-target from globalchat.html
                const targetPanel = document.getElementById(targetPanelId);

                allTabs.forEach(t => t.classList.remove('active')); // Deactivate all tabs
                allPanels.forEach(p => p.classList.add('hidden')); // Hide all panels

                tab.classList.add('active'); // Activate clicked tab
                if (targetPanel) {
                    targetPanel.classList.remove('hidden'); // Show the target panel
                }
            });
        });

        // Ensure the initially active chat panel is visible when the chat system is first displayed
        const initialActivePanel = document.querySelector('#tornpa-chat-system .chat-panel.active');
        if (initialActivePanel) {
            initialActivePanel.classList.remove('hidden');
        }

        // Send Message Logic (specific to the faction chat panel within the global system)
        if (chatSendBtn) chatSendBtn.addEventListener('click', sendChatMessage);
        if (chatTextInput) {
            chatTextInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    sendChatMessage();
                }
            });
        }

        // After the chat HTML and its elements are ready, set up the Firebase real-time listener
        // This prevents trying to access `chatDisplayArea` before it exists.
        // It also checks if Firebase auth/collection is already set from the onAuthStateChanged listener.
        if (auth.currentUser && chatMessagesCollection) {
            setupChatRealtimeListener();
        } else {
            // If not ready, the auth.onAuthStateChanged will call setupChatRealtimeListener once ready.
            console.log("Firebase auth or chat collection not yet ready. Realtime listener will start on auth state change.");
        }
    }

    // ---- AUTHENTICATION LISTENER (remains outside setupChatFunctionality as it's global) ----
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
                    // Check if the chat system HTML is already in the DOM before trying to setup listener
                    if (document.getElementById('tornpa-chat-system')) {
                         setupChatRealtimeListener();
                    } else {
                        // If chat HTML isn't yet loaded, setupChatFunctionality will call this once it is.
                        console.log("Chat system HTML not yet loaded. Realtime listener will be set up when chat functionality is initialized.");
                    }
                }
            }
        } else {
            if (unsubscribeFromChat) unsubscribeFromChat();
            chatMessagesCollection = null;
            // Target the chat display area within the global chat system (if it exists)
            const chatDisplayArea = document.querySelector('#tornpa-chat-system #faction-chat-panel #chat-display-area');
            if (chatDisplayArea) chatDisplayArea.innerHTML = '<p>Please log in to use chat.</p>';
        }
    });

    // ---- CORE CHAT FUNCTIONS (remain outside, but are called from setupChatFunctionality/auth listener) ----
    function displayChatMessage(messageObj) {
        // Ensure selector targets the specific chat display area of the global chat
        const chatDisplayArea = document.querySelector('#tornpa-chat-system #faction-chat-panel #chat-display-area');
        if (!chatDisplayArea) {
            console.error("Chat display area element not found to display message.");
            return;
        }
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
        // Ensure selector targets the specific chat input of the global chat
        const chatTextInput = document.querySelector('#tornpa-chat-system #faction-chat-panel .chat-text-input');
        if (!chatTextInput || !auth.currentUser || !chatMessagesCollection) {
            console.warn("Cannot send message: Chat input, user, or Firebase collection not ready.");
            return;
        }
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
        // Ensure selector targets the specific chat display area of the global chat
        const chatDisplayArea = document.querySelector('#tornpa-chat-system #faction-chat-panel #chat-display-area');
        if (!chatMessagesCollection || !chatDisplayArea) {
            console.warn("Cannot setup chat real-time listener: Chat collection or display area element not available.");
            return;
        }

        chatDisplayArea.innerHTML = '<p>Loading messages...</p>'; // Clear and show loading
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