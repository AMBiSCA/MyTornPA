// This function will run when the script is loaded
function initializeGlobals() {
    // ... (rest of your existing code) ...

    fetch('globalchat.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('chat-system-placeholder').innerHTML = data;
            
            const chatBarCollapsed = document.getElementById('chat-bar-collapsed');
            const chatWindow = document.getElementById('chat-window');
            const chatMainTabsContainer = document.querySelector('.chat-main-tabs-container');
            
            const openFactionChatIcon = document.getElementById('open-faction-chat-icon');
            const openWarChatIcon = document.getElementById('open-war-chat-icon');
            const openFriendsIcon = document.getElementById('open-friends-icon'); // The icon you are clicking
            const openNotificationsIcon = document.getElementById('open-notifications-icon');
            const openSettingsIcon = document.getElementById('open-settings-icon');

            const factionChatPanel = document.getElementById('faction-chat-panel');
            const warChatPanel = document.getElementById('war-chat-panel');
            const friendsPanel = document.getElementById('friends-panel'); // The panel you want to show
            const notificationsPanel = document.getElementById('notifications-panel');
            const settingsPanel = document.getElementById('settings-panel');

            const minimizeChatBtns = document.querySelectorAll('.minimize-chat-btn');

            const allPanels = document.querySelectorAll('.chat-panel');
            const allTabs = document.querySelectorAll('.chat-tab');

            const factionChatTextInput = factionChatPanel.querySelector('.chat-text-input');
            const factionChatSendBtn = factionChatPanel.querySelector('.chat-send-btn');

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
                    if (chatMainTabsContainer) chatMainTabsContainer.classList.add('hidden');
                    if (factionChatTextInput) factionChatTextInput.focus();
                    setupChatRealtimeListener('faction');
                });
            }

            // War Chat Icon Click
            if (openWarChatIcon) {
                openWarChatIcon.addEventListener('click', () => {
                    openChatPanel(warChatPanel);
                    if (chatMainTabsContainer) chatMainTabsContainer.classList.add('hidden');
                    if (warChatTextInput) warChatTextInput.focus();
                    setupChatRealtimeListener('war');
                });
            }

            // Friends Icon Click - THIS IS THE SECTION WE ARE UPDATING
            if (openFriendsIcon) {
                openFriendsIcon.addEventListener('click', () => {
                    openChatPanel(friendsPanel); // Ensure the friendsPanel is opened
                    if (chatMainTabsContainer) chatMainTabsContainer.classList.remove('hidden'); // Show main tabs
                    
                    // Also ensure the correct *main* tab is active (the Friends tab itself)
                    allTabs.forEach(t => t.classList.remove('active'));
                    const friendsMainTab = document.querySelector('.chat-tab[data-tab-target="friends-panel"]');
                    if (friendsMainTab) friendsMainTab.classList.add('active');

                    // And ensure the first sub-tab ('Recent Chats') within friends panel is active
                    const friendsSubTabs = friendsPanel.querySelectorAll('.friends-panel-subtabs .sub-tab-button');
                    const recentChatsSubTab = friendsPanel.querySelector('.sub-tab-button[data-subtab="recent-chats"]');
                    
                    friendsSubTabs.forEach(t => t.classList.remove('active'));
                    if (recentChatsSubTab) recentChatsSubTab.classList.add('active');

                    // You might also need to load content into friends-panel-content here
                    // For example:
                    // if (friendsPanel.querySelector('.friends-panel-content')) {
                    //     friendsPanel.querySelector('.friends-panel-content').innerHTML = '<p>Loading recent chats...</p>';
                    //     // Add actual logic to load recent chats data
                    // }
                });
            }

            // Notifications Icon Click
            if (openNotificationsIcon) {
                openNotificationsIcon.addEventListener('click', () => {
                    openChatPanel(notificationsPanel);
                    if (chatMainTabsContainer) chatMainTabsContainer.classList.remove('hidden');
                    allTabs.forEach(t => t.classList.remove('active'));
                    document.querySelector('[data-tab-target="notifications-panel"]').classList.add('active');
                });
            }

            // Settings Icon Click
            if (openSettingsIcon) {
                openSettingsIcon.addEventListener('click', () => {
                    openChatPanel(settingsPanel);
                    if (chatMainTabsContainer) chatMainTabsContainer.classList.remove('hidden');
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
            // This part should be fine as it handles clicks on the main tabs once the chat window is open
            allTabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    const targetPanelId = tab.dataset.tabTarget;
                    const targetPanel = document.getElementById(targetPanelId);

                    if (['friends-panel', 'notifications-panel', 'settings-panel'].includes(targetPanelId)) {
                        allTabs.forEach(t => t.classList.remove('active'));
                        allPanels.forEach(p => p.classList.add('hidden'));
                        tab.classList.add('active');
                        if (targetPanel) targetPanel.classList.remove('hidden');
                        
                        // Ensure main tabs are visible for these panels
                        if (chatMainTabsContainer) chatMainTabsContainer.classList.remove('hidden');

                        // Activate the first sub-tab when switching to Friends panel via main tab click
                        if (targetPanelId === 'friends-panel') {
                            const friendsSubTabs = friendsPanel.querySelectorAll('.friends-panel-subtabs .sub-tab-button');
                            const recentChatsSubTab = friendsPanel.querySelector('.sub-tab-button[data-subtab="recent-chats"]');
                            friendsSubTabs.forEach(t => t.classList.remove('active'));
                            if (recentChatsSubTab) recentChatsSubTab.classList.add('active');
                            // You might also need to trigger content loading here
                        }

                    } else {
                        // This block handles if Faction or War chat is somehow selected via main tabs
                        // (though the intended flow is via the collapsed bar icons)
                        if (chatMainTabsContainer) chatMainTabsContainer.classList.add('hidden');
                        allTabs.forEach(t => t.classList.remove('active'));
                        tab.classList.add('active');
                        allPanels.forEach(p => p.classList.add('hidden'));
                        if (targetPanel) targetPanel.classList.remove('hidden');

                        if (targetPanelId === 'faction-chat-panel') {
                            setupChatRealtimeListener('faction');
                        } else if (targetPanelId === 'war-chat-panel') {
                            setupChatRealtimeListener('war');
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

    // ... (rest of your existing code for authentication and chat functions) ...
}

// Run the main initialization function
initializeGlobals();