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

function formatDuration(seconds) {
    if (seconds < 0) seconds = 0;
    const days = Math.floor(seconds / 86400);
    seconds %= 86400;
    const hours = Math.floor(seconds / 3600);
    seconds %= 3600;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    const paddedHours = String(hours).padStart(2, '0');
    const paddedMinutes = String(minutes).padStart(2, '0');
    const paddedSecs = String(secs).padStart(2, '0');

    let result = '';
    if (days > 0) result += `${days}d `;
    result += `${paddedHours}:${paddedMinutes}:${paddedSecs}`;
    return result.trim();
}

function showCustomAlert(message, title = "Alert") {
    return new Promise(resolve => {
        // Create the overlay and box elements using the same styles
        const overlay = document.createElement('div');
        overlay.className = 'custom-confirm-overlay';

        const alertBox = document.createElement('div');
        alertBox.className = 'custom-confirm-box';

        // Create the content with a single "Okay" button
        alertBox.innerHTML = `
            <h4>${title}</h4>
            <p>${message}</p>
            <div class="custom-confirm-actions">
                <button class="action-button secondary" id="alert-btn-ok">Okay</button>
            </div>
        `;

        // Append to the page
        overlay.appendChild(alertBox);
        document.body.appendChild(overlay);

        const btnOk = document.getElementById('alert-btn-ok');

        // Function to close and resolve the promise
        const closeAlert = () => {
            document.body.removeChild(overlay);
            resolve();
        };

        // Add event listener
        btnOk.addEventListener('click', closeAlert);
    });
}

function showCustomConfirm(message, title = "Are you sure?") {
    return new Promise(resolve => {
        // Create the overlay and box elements
        const overlay = document.createElement('div');
        overlay.className = 'custom-confirm-overlay';

        const confirmBox = document.createElement('div');
        confirmBox.className = 'custom-confirm-box';

        // Create the content
        confirmBox.innerHTML = `
            <h4>${title}</h4>
            <p>${message}</p>
            <div class="custom-confirm-actions">
                <button class="action-button danger" id="confirm-btn-yes">Yes</button>
                <button class="action-button secondary" id="confirm-btn-no">No</button>
            </div>
        `;

        // Append to the page
        overlay.appendChild(confirmBox);
        document.body.appendChild(overlay);

        // Get the new buttons
        const btnYes = document.getElementById('confirm-btn-yes');
        const btnNo = document.getElementById('confirm-btn-no');

        // Function to close and resolve the promise
        const closeConfirm = (decision) => {
            document.body.removeChild(overlay);
            resolve(decision);
        };

        // Add event listeners
        btnYes.addEventListener('click', () => closeConfirm(true));
        btnNo.addEventListener('click', () => closeConfirm(false));
    });
}

function formatUtcTimestamp(timestampInSeconds) {
    if (!timestampInSeconds) return 'N/A';
    const date = new Date(timestampInSeconds * 1000);
    // You can adjust the format as needed, e.g., 'en-GB' for UK locale
    return date.toLocaleString('en-GB', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false, timeZoneName: 'short' // 'short' usually gives 'GMT', 'BST', 'UTC' etc.
    });
}

function initializeGlobals() {
    // ---- Firebase Setup ----
    const db = firebase.firestore();
    const auth = firebase.auth();
    let chatMessagesCollection = null; // Used by generic setupChatRealtimeListener
    let unsubscribeFromChat = null; // Stores unsubscribe function for current chat listener
    let currentTornUserName = 'Unknown';
    let currentUserFactionId = null;
    let userTornApiKey = null;
    let currentUserAllianceIds = [];

    // NEW GLOBAL VARS FOR WAR CHAT
    let currentActiveRankedWarId = null;
    let currentActiveRankedWarData = null; // To store names, start/end times etc.
    // Store the interval ID to clear it later
    let warChatTimerInterval = null; 
    // END NEW GLOBAL VARS

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
                const openGraphIcon = document.getElementById('open-graph-icon');
                const factionOverviewPanel = document.getElementById('faction-overview-panel');
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

                // NEW: Settings panel elements for Alliance Chat
                const allianceFactionIdInput = document.getElementById('allianceFactionId');
                const saveAllianceButton = document.getElementById('saveAlliance');
                const clearAlliancesButton = document.getElementById('clearAlliances');
                const allianceInfoIcon = document.getElementById('allianceInfoIcon'); // For hover display


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
                        setupChatRealtimeListener('alliance');
                    });
                }

                if (openWarChatIcon) {
                    openWarChatIcon.addEventListener('click', () => {
                        openChatPanel(warChatPanel);
                        if (warChatTextInput) warChatTextInput.focus();
                        setupChatRealtimeListener('war'); // Trigger war chat setup
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
                    openSettingsIcon.addEventListener('click', async () => {
                        openChatPanel(settingsPanel);
                        // No need to pre-fill allianceFactionIdInput with any specific value
                        // as it's for adding new ones now.
                        allianceFactionIdInput.value = ''; // Clear the input field for new entry
                        updateAllianceInfoIconTitle(); // Update tooltip to show all saved IDs
                    });
                }

                // Replace your old block with this NEW version
if (openGraphIcon) {
    openGraphIcon.addEventListener('click', async () => { // Make the function async
        openChatPanel(factionOverviewPanel);

        // --- NEW REFRESH LOGIC STARTS HERE ---

        const overviewContent = document.getElementById('faction-overview-content');
        
        // Show a "Refreshing..." message to the user immediately
        if (overviewContent) {
            overviewContent.innerHTML = `<p style="text-align: center; color: #888; padding-top: 20px;">Refreshing latest faction data...</p>`;
        }
        
        try {
            // Check if we have the faction ID needed to make the call
            if (!currentUserFactionId) {
                throw new Error("You must be logged in to refresh faction data.");
            }

            // Call the new Netlify function to update the data in the database
            const response = await fetch(`/.netlify/functions/refresh-faction-data?factionId=${currentUserFactionId}`);
            
            if (!response.ok) {
                // If the function returns an error, show it
                const errorResult = await response.json();
                throw new Error(errorResult.message || 'The refresh process failed.');
            }

            console.log("Backend data refresh was successful.");

        } catch (error) {
            console.error("Error refreshing faction data:", error);
            if (overviewContent) {
                overviewContent.innerHTML = `<p style="color: red; text-align: center;">Error: Could not refresh faction data. ${error.message}</p>`;
            }
            return; // Stop if the refresh fails
        }
        
        // --- NEW REFRESH LOGIC ENDS HERE ---

        // Now that the data is fresh in the database, call your original
        // function to display it on the screen.
        populateFactionOverview();
    });
}

                if (saveAllianceButton) {
    saveAllianceButton.addEventListener('click', async () => {
        const newAllianceId = allianceFactionIdInput.value.trim();
        
        const originalButtonText = saveAllianceButton.textContent;
        saveAllianceButton.textContent = 'Saving...';
        saveAllianceButton.disabled = true;

        if (newAllianceId) {
            const success = await addOrUpdateUserAllianceId(newAllianceId);

            if (success) {
                allianceFactionIdInput.value = '';
                updateAllianceInfoIconTitle();
                saveAllianceButton.textContent = 'Saved!';
                
                setTimeout(() => {
                    saveAllianceButton.textContent = originalButtonText;
                    saveAllianceButton.disabled = false;
                }, 2000); // Revert back to "Save" after 2 seconds
            } else {
                // If it failed, reset the button immediately
                saveAllianceButton.textContent = originalButtonText;
                saveAllianceButton.disabled = false;
            }
        } else {
            // Handle case where input is empty
            await showCustomAlert('Please enter an Alliance Password.', 'Input Required');
            saveAllianceButton.textContent = originalButtonText;
            saveAllianceButton.disabled = false;
        }
    });
}

                if (clearAlliancesButton) {
    clearAlliancesButton.addEventListener('click', async () => {
        const userConfirmed = await showCustomConfirm('Are you sure you want to remove ALL saved Alliance passwords?', 'Confirm Clear');
        
        if (userConfirmed) {
            await clearUserAllianceIds(); // This function already exists in your code
            allianceFactionIdInput.value = ''; 
            updateAllianceInfoIconTitle(); 
        }
    });
}

                function updateAllianceInfoIconTitle() {
    if (allianceInfoIcon) {
        if (currentUserAllianceIds && currentUserAllianceIds.length > 0) {
            // Updated text for when a password is saved
            allianceInfoIcon.title = `Saved Alliance Password: ${currentUserAllianceIds[0]}`;
        } else {
            // Updated text for the new limit
            allianceInfoIcon.title = 'No Alliance Password saved. Enter one above (max 1).';
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
                                setupChatRealtimeListener('war'); // Trigger war chat setup here
                                break;

                            case 'settings-panel': // When settings panel is opened via tab, update alliance input
                                // No need to pre-fill the input, as it's for adding new IDs
                                allianceFactionIdInput.value = ''; // Clear for new entry
                                updateAllianceInfoIconTitle(); // Ensure tooltip is fresh
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
                        // Call the new function to load the chats
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
				
				
// NEW FUNCTION: Display Faction Members in the Chat Tab (add this function)
window.displayFactionMembersInChatTab = async function(membersData, targetDisplayElement) {
    if (!targetDisplayElement) {
        console.error("HTML Error: Target display element not provided for Faction Members tab.");
        return;
    }

    // Convert membersData object to an array of members, and sort them by name
    const membersArray = Object.values(membersData).map(member => ({
        id: member.player_id, // Torn ID
        name: member.name,
        // Include firebaseUid if it's available in the member data or can be fetched
        // For now, we'll fetch it in the loop if needed for direct chat
    }));

    membersArray.sort((a, b) => a.name.localeCompare(b.name));

    let membersHtml = '';
    if (membersArray.length === 0) {
        membersHtml = '<p style="text-align:center; padding: 20px;">No faction members found or data unavailable.</p>';
    } else {
        // Use Promise.all to fetch profile images and Firebase UIDs in parallel
        const memberHtmlPromises = membersArray.map(async (member) => {
            const userDoc = await db.collection('users').doc(String(member.id)).get();
            const profileImage = userDoc.exists && userDoc.data().profile_image ? userDoc.data().profile_image : DEFAULT_PROFILE_ICONS[0];
            const firebaseUid = userDoc.exists && userDoc.data().firebaseUid ? userDoc.data().firebaseUid : null;

            return `
                <div class="member-item">
                    <div class="member-identity">
                        <img src="${profileImage}" alt="${member.name}'s profile pic" class="member-profile-pic">
                        <a href="https://www.torn.com/profiles.php?XID=${member.id}" target="_blank" class="member-name">${member.name} [${member.id}]</a>
                    </div>
                    <div class="member-actions">
                        ${firebaseUid ? `<button class="item-button message-member-button" data-torn-id="${member.id}" data-torn-name="${member.name}" data-firebase-uid="${firebaseUid}" title="Send Message">✉️</button>` : `<span title="User not registered on this platform" style="opacity: 0.5;">✉️</span>`}
                    </div>
                </div>`;
        });
        membersHtml = (await Promise.all(memberHtmlPromises)).join('');
    }

    const membersListContainer = document.createElement('div');
    membersListContainer.className = 'members-list-container';
    membersListContainer.innerHTML = membersHtml;
    targetDisplayElement.innerHTML = ''; // Clear previous content
    targetDisplayElement.appendChild(membersListContainer);

    // Add event listeners for message buttons within this newly added content
    membersListContainer.querySelectorAll('.message-member-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const tornId = event.target.dataset.tornId;
            const tornName = event.target.dataset.tornName;
            // The firebaseUid is implicitly available to openPrivateChatWindow which fetches it internally,
            // but explicitly passing it via data-attribute makes it clearer if needed for other uses.
            // openPrivateChatWindow will handle fetching the firebaseUid if it's not directly passed.
            window.openPrivateChatWindow(tornId, tornName);
        });
    });
};

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
                currentTornUserName = userData.preferredName || 'Unknown';
                userTornApiKey = userData.tornApiKey;
                currentUserAllianceIds = userData.allianceIds || [];

                // Make globals accessible to functions outside this scope, especially for re-rendering
                window.currentUserFactionId = currentUserFactionId;
                window.userTornApiKey = userTornApiKey;
                window.TORN_API_BASE_URL = TORN_API_BASE_URL;
                window.currentUserAllianceIds = currentUserAllianceIds;

                console.log(`User logged in. Faction ID: ${currentUserFactionId}, Name: ${currentTornUserName}, API Key Present: ${!!userTornApiKey}, Alliance IDs: [${currentUserAllianceIds.join(', ')}]`);
            } else {
                console.warn("User profile not found for authenticated user:", user.uid);
                currentUserFactionId = null;
                userTornApiKey = null;
                currentUserAllianceIds = []; // Clear alliance IDs if profile not found
                // Clear globals on logout/missing profile
                window.currentUserFactionId = null;
                window.userTornApiKey = null;
                window.TORN_API_BASE_URL = null;
                window.currentUserAllianceIds = [];
            }
        } else {
            // User is signed out
            if (unsubscribeFromChat) unsubscribeFromChat();
            chatMessagesCollection = null;
            currentUserFactionId = null;
            userTornApiKey = null;
            currentUserAllianceIds = []; // Clear alliance IDs on logout
            // Clear globals on logout
            window.currentUserFactionId = null;
            window.userTornApiKey = null;
            window.TORN_API_BASE_URL = null;
            window.currentUserAllianceIds = [];

            const chatDisplayAreaFaction = document.getElementById('chat-display-area');
            const chatDisplayAreaWar = document.getElementById('war-chat-display-area');
            const chatDisplayAreaAlliance = document.getElementById('alliance-chat-display-area'); // NEW: Alliance Chat display area

            if (chatDisplayAreaFaction) chatDisplayAreaFaction.innerHTML = '<p>Please log in to use chat.</p>';
            if (chatDisplayAreaWar) chatDisplayAreaWar.innerHTML = '<p>Please log in to use war chat.</p>';
            if (chatDisplayAreaAlliance) chatDisplayAreaAlliance.innerHTML = '<p>Please log in to use alliance chat.</p>'; // NEW: Alliance Chat message
            console.log("User logged out. Chat functionalities are reset.");
        }
    });

async function fetchAndSetWarChatContext() {
    const warChatTitle = document.getElementById('war-chat-title');
    const warFactionsDisplay = document.getElementById('war-factions-display');
    const warTimerDisplay = document.getElementById('war-timer-display');
    const warChatDisplayArea = document.getElementById('war-chat-display-area');
    // --- CHANGE: Get the new note element ---
    const warChatNote = document.getElementById('war-chat-note-display');

    // Reset display while loading
    if (warChatTitle) warChatTitle.textContent = "War Chat - Loading...";
    if (warFactionsDisplay) warFactionsDisplay.textContent = "";
    if (warTimerDisplay) warTimerDisplay.textContent = "";
    if (warChatDisplayArea) warChatDisplayArea.innerHTML = `<p>Fetching war details...</p>`;
    // --- CHANGE: Hide the note by default while loading ---
    if (warChatNote) warChatNote.style.display = 'none';

    currentActiveRankedWarId = null;
    currentActiveRankedWarData = null;

    if (!auth.currentUser || !userTornApiKey || !currentUserFactionId) {
        if (warChatTitle) warChatTitle.textContent = "War Chat - Login Required";
        if (warChatDisplayArea) warChatDisplayArea.innerHTML = `<p>Please log in and ensure your API key and faction ID are set in your profile.</p>`;
        return;
    }

    try {
        const warsApiUrl = `${TORN_API_BASE_URL}/faction/wars?key=${userTornApiKey}&comment=MyTornPA_WarChat_Info`;
        const response = await fetch(warsApiUrl);
        const data = await response.json();

        if (!response.ok || data.error) {
            throw new Error(`Torn API Error: ${data.error?.error || response.statusText}`);
        }

        const rankedWar = data.wars ? data.wars.ranked : null;
        const nowInSeconds = Math.floor(Date.now() / 1000);
        let activeWar = null;

        if (rankedWar && rankedWar.war_id && nowInSeconds >= rankedWar.start) {
            if (rankedWar.end === null || rankedWar.end === 0 || nowInSeconds < rankedWar.end) {
                activeWar = rankedWar;
            }
        }
        
        if (activeWar) {
            currentActiveRankedWarId = String(activeWar.war_id);
            currentActiveRankedWarData = activeWar;

            const yourFaction = activeWar.factions.find(f => String(f.id) === String(currentUserFactionId));
            const opponentFaction = activeWar.factions.find(f => String(f.id) !== String(currentUserFactionId));

            const yourFactionName = yourFaction?.name || "Your Faction";
            const opponentFactionName = opponentFaction?.name || "Opponent Faction";

            if (warChatTitle) warChatTitle.textContent = `${yourFactionName} vs ${opponentFactionName} War Chat`;
            if (warFactionsDisplay) warFactionsDisplay.textContent = '';
            
            // --- CHANGE: Hide the note during an active war ---
            if (warChatNote) warChatNote.style.display = 'none';
            
            const updateWarTimer = () => {
                const now = Math.floor(Date.now() / 1000);
                const warHasEnded = activeWar.end && now >= activeWar.end;

                if (warTimerDisplay) warTimerDisplay.textContent = ''; 

                if (warHasEnded) {
                    clearInterval(warChatTimerInterval);
                    warChatTimerInterval = null; 
                    fetchAndSetWarChatContext();
                }
            };

            if (warChatTimerInterval) {
                clearInterval(warChatTimerInterval);
            }
            updateWarTimer();
            warChatTimerInterval = setInterval(updateWarTimer, 1000);

        } else {
            // This is the state for when there is NO active war
            if (warChatTitle) warChatTitle.textContent = "War Chat";
            if (warFactionsDisplay) warFactionsDisplay.textContent = "No active ranked war.";
            if (warTimerDisplay) warTimerDisplay.textContent = "";
            if (warChatDisplayArea) warChatDisplayArea.innerHTML = `<p>There is no active ranked war to display messages for.</p>`;
            
            // --- CHANGE: Show the note when there is NO active war ---
            if (warChatNote) warChatNote.style.display = 'block';
            
            if (warChatTimerInterval) { 
                clearInterval(warChatTimerInterval);
                warChatTimerInterval = null;
            }
        }

        if (currentActiveRankedWarId) {
            chatMessagesCollection = db.collection('warChats').doc(currentActiveRankedWarId).collection('messages');
            
            const yourFaction = currentActiveRankedWarData.factions.find(f => String(f.id) === String(currentUserFactionId));
            const opponentFaction = currentActiveRankedWarData.factions.find(f => String(f.id) !== String(currentUserFactionId));

            await db.collection('warChats').doc(currentActiveRankedWarId).set({
                faction1Id: yourFaction?.id,
                faction1Name: yourFaction?.name,
                faction2Id: opponentFaction?.id,
                faction2Name: opponentFaction?.name,
                warStart: currentActiveRankedWarData?.start,
                warEnd: currentActiveRankedWarData?.end,
                warChatEnabledForAll: true
            }, {
                merge: true
            });

            unsubscribeFromChat = chatMessagesCollection
                .orderBy('timestamp', 'asc')
                .limitToLast(50)
                .onSnapshot(snapshot => {
                    if (warChatDisplayArea) warChatDisplayArea.innerHTML = '';
                    if (snapshot.empty) {
                        if (warChatDisplayArea) warChatDisplayArea.innerHTML = `<p>No war messages yet. Be the first to say hello!</p>`;
                        return;
                    }
                    snapshot.forEach(doc => displayChatMessage(doc.data(), 'war-chat-display-area'));
                }, error => {
                    console.error("Error listening to war chat messages:", error);
                    if (warChatDisplayArea) warChatDisplayArea.innerHTML = `<p style="color: red;">Error loading war messages: ${error.message}</p>`;
                });
            console.log(`War chat real-time listener set up for war: ${currentActiveRankedWarId}`);
            
        } else {
            chatMessagesCollection = null;
            if (unsubscribeFromChat) unsubscribeFromChat();
            console.log("No active ranked war found, war chat listener not set up.");
        }

    } catch (error) {
        console.error("Error fetching active ranked war for chat:", error);
        if (warChatTitle) warChatTitle.textContent = "War Chat - Error";
        if (warFactionsDisplay) warFactionsDisplay.textContent = "Could not fetch war details.";
        if (warTimerDisplay) warTimerDisplay.textContent = ""; 
        if (warChatDisplayArea) warChatDisplayArea.innerHTML = `<p style="color: red;">Failed to load war chat: ${error.message}</p>`;
        if (warChatTimerInterval) {
            clearInterval(warChatTimerInterval);
            warChatTimerInterval = null;
        }
        chatMessagesCollection = null;
        if (unsubscribeFromChat) unsubscribeFromChat();
    }
}
    // Now, inside your existing setupChatRealtimeListener function, modify the 'war' case:
    function setupChatRealtimeListener(type) {
        // Clear previous listener first
        if (unsubscribeFromChat) {
            unsubscribeFromChat();
            unsubscribeFromChat = null; // Ensure it's explicitly null
            console.log("Unsubscribed from previous chat listener.");
        }
        // Also clear any active war chat timer if switching away from war chat
        if (warChatTimerInterval) {
            clearInterval(warChatTimerInterval);
            warChatTimerInterval = null;
            console.log("Cleared war chat timer interval.");
        }


        let chatDisplayArea = null; // Declare here so it's fresh for each type
        let collectionRef = null;
        let displayAreaId = '';
        let consoleLogPath = '';

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
            // For war chat, we need to first determine the active war.
            // fetchAndSetWarChatContext will handle setting up chatMessagesCollection and listener.
            fetchAndSetWarChatContext(); // This function does all the heavy lifting for war chat
            return; // Exit here, as the listener is set up within fetchAndSetWarChatContext
        } else if (type === 'alliance' && auth.currentUser) {
            // Use the first saved alliance ID for displaying messages
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
        } else if (!auth.currentUser) { // If user is not logged in for any chat type
            const displayAreas = {
                'faction': 'chat-display-area',
                'war': 'war-chat-display-area',
                'alliance': 'alliance-chat-display-area'
            };
            chatDisplayArea = document.getElementById(displayAreas[type]);
            if (chatDisplayArea) chatDisplayArea.innerHTML = '<p>Please log in to use chat.</p>';
            console.warn(`User not logged in. Cannot set up ${type} chat listener.`);
            return;
        }

        // This block only executes for 'faction' or 'alliance' chat after their respective collectionRefs are set
        chatDisplayArea = document.getElementById(displayAreaId); // Re-get it, it might be set above
        if (chatDisplayArea) chatDisplayArea.innerHTML = `<p>Loading ${type} messages...</p>`;
        console.log(`Setting up ${type} chat listener for path: ${consoleLogPath}`);

        if (collectionRef) {
            unsubscribeFromChat = collectionRef.orderBy('timestamp', 'asc').limitToLast(50)
                .onSnapshot(snapshot => {
                    if (chatDisplayArea) chatDisplayArea.innerHTML = ''; // Clear previous messages
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

    async function populateFactionOverview() {
        const overviewContent = document.getElementById('faction-overview-content');
        if (!overviewContent) {
            console.error("Faction Overview panel content area not found!");
            return;
        }

        overviewContent.innerHTML = `<p style="text-align: center; color: #888; padding-top: 20px;">Loading Faction Overview...</p>`;

        try {
            const factionId = window.currentUserFactionId;
            const apiKey = window.userTornApiKey;

            if (!factionId || !apiKey) {
                overviewContent.innerHTML = `<p style="color: orange; text-align: center;">Faction ID or API Key not available.</p>`;
                return;
            }

            const factionApiUrl = `https://api.torn.com/v2/faction/${factionId}?selections=members&key=${apiKey}&comment=MyTornPA_Overview`;
            const apiResponse = await fetch(factionApiUrl);
            const tornData = await apiResponse.json();

            if (tornData.error) throw new Error(`Torn API Error: ${tornData.error.error}`);

            const memberIds = Object.keys(tornData.members || {});

            if (memberIds.length === 0) {
                overviewContent.innerHTML = `<p style="text-align: center;">No faction members found.</p>`;
                return;
            }

            const membersToSort = memberIds.map(id => ({ id: id, ...tornData.members[id] }));
            membersToSort.sort((a, b) => a.name.localeCompare(b.name));

            const memberHtmlPromises = membersToSort.map(async (apiMember) => {
                const memberId = apiMember.id;

                // Explicitly ensures the memberId is a string before calling the database.
                const userDoc = await db.collection('users').doc(String(memberId)).get();
                const firestoreMember = userDoc.exists ? userDoc.data() : {};

                const name = apiMember.name;
                const energy = `${firestoreMember.energy?.current || 'N/A'} / ${firestoreMember.energy?.maximum || 'N/A'}`;
                const drugCooldown = firestoreMember.cooldowns?.drug || 0;

                const reviveSettingText = apiMember.revive_setting;

                const energyRefillUsedToday = firestoreMember.energyRefillUsedToday; // This is the boolean from your worker
                const refillStatusHtml = energyRefillUsedToday ? '<span class="status-red">Used</span>' : '<span class="status-green">Available</span>';

                const status = apiMember.status.description;

                let drugCdHtml = `<span class="status-okay">None 🍁</span>`;
                if (drugCooldown > 0) {
                    const hours = Math.floor(drugCooldown / 3600);
                    const minutes = Math.floor((drugCooldown % 3600) / 60);
                    let cdText = (hours > 0) ? `${hours}hr ${minutes}m` : `${minutes}m`;
                    const cdClass = drugCooldown > 18000 ? 'status-hospital' : 'status-other';
                    drugCdHtml = `<span class="${cdClass}">${cdText}</span>`;
                }

                let reviveCircleClass = 'rev-circle-red'; // Default to red
                if (reviveSettingText === 'Everyone') {
                    reviveCircleClass = 'rev-circle-green';
                } else if (reviveSettingText === 'Friends & faction') {
                    reviveCircleClass = 'rev-circle-orange';
                }

                let statusClass = 'status-okay';
                if (apiMember.status.state === 'Hospital') statusClass = 'status-hospital';
                if (apiMember.status.state === 'Traveling') statusClass = 'status-other';

                return `
                    <tr>
                        <td class="overview-name">${name}</td>
                        <td class="overview-energy energy-text">${energy}</td>
                        <td class="overview-drugcd">${drugCdHtml}</td>
                        <td class="overview-revive"><div class="rev-circle ${reviveCircleClass}" title="${reviveSettingText}"></div></td>
                        <td class="overview-refill">${refillStatusHtml}</td>
                        <td class="overview-status ${statusClass}">${status}</td>
                    </tr>
                `;
            });

            const memberRowsHtml = (await Promise.all(memberHtmlPromises)).join('');

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

    // NEW FUNCTION: Add or update a user's alliance ID in their saved list
    async function addOrUpdateUserAllianceId(newAllianceId) {
        const user = auth.currentUser;
        if (!user) {
            console.warn('Cannot save alliance ID: User not logged in.');
            return;
        }

        // Ensure currentUserAllianceIds is an array
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

        if (currentAllianceIds.length >= 3) { // Enforce max 3 IDs
            alert('You can only save up to 3 Alliance IDs. Please clear one first.');
            return;
        }

        try {
            // Use arrayUnion to safely add the new ID to the array in Firestore
            await db.collection('userProfiles').doc(user.uid).update({
                allianceIds: firebase.firestore.FieldValue.arrayUnion(trimmedNewId)
            });
            // Update local variable
            currentUserAllianceIds.push(trimmedNewId); // Add to local array
            console.log(`Alliance ID '${trimmedNewId}' added for user ${user.uid}`);
            alert(`Alliance ID '${trimmedNewId}' saved successfully!`);
        } catch (error) {
            console.error('Error adding alliance ID:', error);
            alert('Failed to add Alliance ID. Please try again.');
        }
    }

    // UPDATED FUNCTION: Clear all user's alliance IDs from Firestore
    async function clearUserAllianceIds() {
        const user = auth.currentUser;
        if (!user) {
            console.warn('Cannot clear alliance IDs: User not logged in.');
            return;
        }
        try {
            // Set the allianceIds field to an empty array
            await db.collection('userProfiles').doc(user.uid).update({
                allianceIds: []
            });
            currentUserAllianceIds = []; // Clear local variable
            console.log(`All Alliance IDs cleared for user ${user.uid}`);
        } catch (error) {
            console.error('Error clearing alliance IDs:', error);
            alert('Failed to clear Alliance IDs. Please try again.');
        }
    }


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
    function displayPrivateChatMessage(messageObj, displayElement, isMyMessage) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message');

        // Add a special class if the message is from the current user
        if (isMyMessage) {
            messageElement.classList.add('my-message');
        }

        const timestamp = messageObj.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '';

        // Use "You" if it's your message, otherwise use the sender's name
        const senderName = isMyMessage ? 'You' : (messageObj.sender || 'Unknown');
        const messageText = messageObj.text || '';

        messageElement.innerHTML = `
            <span class="chat-timestamp">[${timestamp}]</span>
            <span class="chat-sender">${senderName}:</span>
            <span class="chat-text">${messageText}</span>
        `;
        displayElement.appendChild(messageElement);
    }
    // This function loads messages and handles sending for a private chat window
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

        try {
            await db.collection('privateChats').doc(chatDocId).set({
                participants: participants,
                lastMessageAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
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
                    // --- THIS IS THE KEY CHANGE ---
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
                await db.collection('privateChats').doc(chatDocId).update({
                    lastMessageAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                await messagesCollectionRef.add(messageObj);
                inputField.value = '';
                inputField.focus();
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

    // A custom confirmation box that returns a promise with the user's choice
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
                resolve({ confirmed, dontAskAgain });
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
                const lastMessage = lastMessageSnapshot.empty ? { text: 'No messages yet...' } : lastMessageSnapshot.docs[0].data();

                return {
                    chatId: doc.id, // We need the chat document ID for deletion
                    tornId: friendTornId,
                    name: friendName,
                    image: friendImage,
                    lastMessage: lastMessage.text
                };
            });

            const chatDetails = (await Promise.all(chatDetailsPromises)).filter(Boolean);

            let listHtml = '';
            chatDetails.forEach(chat => {
                listHtml += `
                    <div class="recent-chat-item" data-friend-id="${chat.tornId}" data-friend-name="${chat.name}">
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
                    event.stopPropagation(); // Stop the click from opening the chat window
                    const chatId = deleteButton.dataset.chatId;
                    const friendName = deleteButton.dataset.friendName;

                    const confirmDelete = localStorage.getItem('confirmDeleteChat') !== 'false';

                    if (confirmDelete) {
                        const result = await showCustomConfirmWithOptions(`Are you sure you want to delete your entire chat history with ${friendName}? This cannot be undone.`, "Confirm Deletion");

                        if (result.dontAskAgain) {
                            localStorage.setItem('confirmDeleteChat', 'false');
                        }
                        if (!result.confirmed) {
                            return; // User clicked "No"
                        }
                    }

                    // If confirmed or if we are skipping confirmation, proceed to delete
                    const success = await deletePrivateChat(chatId);
                    if (success) {
                        loadRecentPrivateChats(targetDisplayElement); // Refresh the list
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
        let consoleLogPath = '';
        let docIdForParent = null; // New variable to hold the document ID for parent chat collections

        if (collectionType === 'faction') {
            if (currentUserFactionId) {
                targetCollection = db.collection('factionChats').doc(currentUserFactionId).collection('messages');
                consoleLogPath = `factionChats/${currentUserFactionId}/messages`;
                docIdForParent = currentUserFactionId;
            } else {
                console.warn("Faction ID not available for current user. Cannot send faction chat message.");
                alert("Faction ID not found. Please complete your profile to use faction chat.");
                return;
            }
        } else if (collectionType === 'war') {
            // Use the globally stored currentActiveRankedWarId
            if (currentActiveRankedWarId) {
                targetCollection = db.collection('warChats').doc(currentActiveRankedWarId).collection('messages');
                consoleLogPath = `warChats/${currentActiveRankedWarId}/messages`;
                docIdForParent = currentActiveRankedWarId;
            } else {
                console.warn("No active ranked war ID. Cannot send war chat message.");
                alert("No active war chat available. Please wait for a war to start or check war settings.");
                return;
            }
        } else if (collectionType === 'alliance') {
            if (currentUserAllianceIds && currentUserAllianceIds.length > 0) {
                const allianceIdToChatIn = currentUserAllianceIds[0];
                targetCollection = db.collection('allianceChats').doc(allianceIdToChatIn).collection('messages');
                consoleLogPath = `allianceChats/${allianceIdToChatIn}/messages`;
                docIdForParent = allianceIdToChatIn;
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
            // Ensure the parent document exists for faction/alliance/war chats if it's the first message
            if (docIdForParent) { // Check if a parent doc ID was determined
                const parentCollectionName = (collectionType === 'faction') ? 'factionChats' :
                                             (collectionType === 'alliance') ? 'allianceChats' :
                                             (collectionType === 'war') ? 'warChats' : null;

                if (parentCollectionName) {
                    await db.collection(parentCollectionName).doc(docIdForParent).set({}, { merge: true }); // Empty merge to ensure existence
                }
            }

            await targetCollection.add(messageObj);
            textInput.value = ''; // Clear input field
            textInput.focus(); // Keep focus on input field
        } catch (error) {
            console.error(`Error sending ${collectionType} message to Firebase:`, error);
            alert(`Failed to send ${collectionType} message.`);
        }
    }

    function setupChatRealtimeListener(type) {
        // Clear previous listener first
        if (unsubscribeFromChat) {
            unsubscribeFromChat();
            unsubscribeFromChat = null; // Ensure it's explicitly null
            console.log("Unsubscribed from previous chat listener.");
        }
        // Also clear any active war chat timer if switching away from war chat
        if (warChatTimerInterval) {
            clearInterval(warChatTimerInterval);
            warChatTimerInterval = null;
            console.log("Cleared war chat timer interval.");
        }

        let chatDisplayArea = null; // Declare here so it's fresh for each type
        let collectionRef = null;
        let displayAreaId = '';
        let consoleLogPath = '';

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
            // For war chat, we need to first determine the active war.
            // fetchAndSetWarChatContext will handle setting up chatMessagesCollection and listener.
            fetchAndSetWarChatContext(); // This function does all the heavy lifting for war chat
            return; // Exit here, as the listener is set up within fetchAndSetWarChatContext
        } else if (type === 'alliance' && auth.currentUser) {
            // Use the first saved alliance ID for displaying messages
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
        } else if (!auth.currentUser) { // If user is not logged in for any chat type
            const displayAreas = {
                'faction': 'chat-display-area',
                'war': 'war-chat-display-area',
                'alliance': 'alliance-chat-display-area'
            };
            chatDisplayArea = document.getElementById(displayAreas[type]);
            if (chatDisplayArea) chatDisplayArea.innerHTML = '<p>Please log in to use chat.</p>';
            console.warn(`User not logged in. Cannot set up ${type} chat listener.`);
            return;
        }

        // This block only executes for 'faction' or 'alliance' chat after their respective collectionRefs are set
        chatDisplayArea = document.getElementById(displayAreaId); // Re-get it, it might be set above
        if (chatDisplayArea) chatDisplayArea.innerHTML = `<p>Loading ${type} messages...</p>`;
        console.log(`Setting up ${type} chat listener for path: ${consoleLogPath}`);

        if (collectionRef) {
            unsubscribeFromChat = collectionRef.orderBy('timestamp', 'asc').limitToLast(50)
                .onSnapshot(snapshot => {
                    if (chatDisplayArea) chatDisplayArea.innerHTML = ''; // Clear previous messages
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
    // ... populateFactionOverview and other functions ...

    async function populateFactionOverview() {
        const overviewContent = document.getElementById('faction-overview-content');
        if (!overviewContent) {
            console.error("Faction Overview panel content area not found!");
            return;
        }

        overviewContent.innerHTML = `<p style="text-align: center; color: #888; padding-top: 20px;">Loading Faction Overview...</p>`;

        try {
            const factionId = window.currentUserFactionId;
            const apiKey = window.userTornApiKey;

            if (!factionId || !apiKey) {
                overviewContent.innerHTML = `<p style="color: orange; text-align: center;">Faction ID or API Key not available.</p>`;
                return;
            }

            const factionApiUrl = `https://api.torn.com/v2/faction/${factionId}?selections=members&key=${apiKey}&comment=MyTornPA_Overview`;
            const apiResponse = await fetch(factionApiUrl);
            const tornData = await apiResponse.json();

            if (tornData.error) throw new Error(`Torn API Error: ${tornData.error.error}`);

            const memberIds = Object.keys(tornData.members || {});

            if (memberIds.length === 0) {
                overviewContent.innerHTML = `<p style="text-align: center;">No faction members found.</p>`;
                return;
            }

            const membersToSort = memberIds.map(id => ({ id: id, ...tornData.members[id] }));
            membersToSort.sort((a, b) => a.name.localeCompare(b.name));

            const memberHtmlPromises = membersToSort.map(async (apiMember) => {
                const memberId = apiMember.id;

                // Explicitly ensures the memberId is a string before calling the database.
                const userDoc = await db.collection('users').doc(String(memberId)).get();
                const firestoreMember = userDoc.exists ? userDoc.data() : {};

                const name = apiMember.name;
                const energy = `${firestoreMember.energy?.current || 'N/A'} / ${firestoreMember.energy?.maximum || 'N/A'}`;
                const drugCooldown = firestoreMember.cooldowns?.drug || 0;

                const reviveSettingText = apiMember.revive_setting;

                const energyRefillUsedToday = firestoreMember.energyRefillUsedToday; // This is the boolean from your worker
                const refillStatusHtml = energyRefillUsedToday ? '<span class="status-red">Used</span>' : '<span class="status-green">Available</span>';

                const status = apiMember.status.description;

                let drugCdHtml = `<span class="status-okay">None 🍁</span>`;
                if (drugCooldown > 0) {
                    const hours = Math.floor(drugCooldown / 3600);
                    const minutes = Math.floor((drugCooldown % 3600) / 60);
                    let cdText = (hours > 0) ? `${hours}hr ${minutes}m` : `${minutes}m`;
                    const cdClass = drugCooldown > 18000 ? 'status-hospital' : 'status-other';
                    drugCdHtml = `<span class="${cdClass}">${cdText}</span>`;
                }

                let reviveCircleClass = 'rev-circle-red'; // Default to red
                if (reviveSettingText === 'Everyone') {
                    reviveCircleClass = 'rev-circle-green';
                } else if (reviveSettingText === 'Friends & faction') {
                    reviveCircleClass = 'rev-circle-orange';
                }

                let statusClass = 'status-okay';
                if (apiMember.status.state === 'Hospital') statusClass = 'status-hospital';
                if (apiMember.status.state === 'Traveling') statusClass = 'status-other';

                return `
                    <tr>
                        <td class="overview-name">${name}</td>
                        <td class="overview-energy energy-text">${energy}</td>
                        <td class="overview-drugcd">${drugCdHtml}</td>
                        <td class="overview-revive"><div class="rev-circle ${reviveCircleClass}" title="${reviveSettingText}"></div></td>
                        <td class="overview-refill">${refillStatusHtml}</td>
                        <td class="overview-status ${statusClass}">${status}</td>
                    </tr>
                `;
            });

            const memberRowsHtml = (await Promise.all(memberHtmlPromises)).join('');

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

   // UPDATED FUNCTION: Returns true/false instead of showing a success alert.
async function addOrUpdateUserAllianceId(newAllianceId) {
    const user = auth.currentUser;
    if (!user || !currentUserFactionId) {
        await showCustomAlert('Could not verify user or faction ID. Please log in again.', 'Error');
        return false; // Return false on failure
    }

    const trimmedNewId = newAllianceId.trim();
    if (!trimmedNewId) {
        await showCustomAlert('Please enter a valid Alliance Password.', 'Input Required');
        return false; // Return false on failure
    }

    if (currentUserAllianceIds.length >= 1) {
        await showCustomAlert('You can only save one Alliance Password at a time. Please clear your current one first.', 'Limit Reached');
        return false; // Return false on failure
    }

    try {
        const chatRef = db.collection('allianceChats').doc(trimmedNewId);
        const chatDoc = await chatRef.get();

        if (chatDoc.exists) {
            const chatData = chatDoc.data();
            const participatingFactions = chatData.participatingFactions || [];
            const isAlreadyMember = participatingFactions.includes(currentUserFactionId);
            if (!isAlreadyMember && participatingFactions.length >= 3) {
                await showCustomAlert('This alliance is full. A maximum of 3 unique factions can join.', 'Alliance Full');
                return false; // Return false on failure
            }
        }

        await chatRef.set({
            participatingFactions: firebase.firestore.FieldValue.arrayUnion(currentUserFactionId)
        }, { merge: true });

        await db.collection('userProfiles').doc(user.uid).update({
            allianceIds: [trimmedNewId]
        });

        currentUserAllianceIds = [trimmedNewId];
        console.log(`Alliance password '${trimmedNewId}' saved for user ${user.uid}`);
        
        return true; // Return true on success

    } catch (error) {
        console.error('Error saving alliance password:', error);
        await showCustomAlert('Failed to save Alliance Password. Please try again.', 'Error');
        return false; // Return false on failure
    }
}
    // UPDATED FUNCTION: Clear all user's alliance IDs from Firestore
    async function clearUserAllianceIds() {
        const user = auth.currentUser;
        if (!user) {
            console.warn('Cannot clear alliance IDs: User not logged in.');
            return;
        }
        try {
            // Set the allianceIds field to an empty array
            await db.collection('userProfiles').doc(user.uid).update({
                allianceIds: []
            });
            currentUserAllianceIds = []; // Clear local variable
            console.log(`All Alliance IDs cleared for user ${user.uid}`);
        } catch (error) {
            console.error('Error clearing alliance IDs:', error);
            alert('Failed to clear Alliance IDs. Please try again.');
        }
    }


    // THIS FUNCTION IS NOW EXPLICITLY ATTACHED TO WINDOW FOR GLOBAL ACCESS
window.openPrivateChatWindow = async function(tornId, userName) {
    // First, remove any other private chat window that might be open
    const existingWindow = document.querySelector('.private-chat-window');
    if (existingWindow) {
        // Important: Manually trigger the close button's click to unsubscribe from listeners
        // This assumes your existing pcw-close-btn listener properly unsubscribes before removing.
        existingWindow.querySelector('.pcw-close-btn').click();
    }

    // Create the main window container
    const chatDiv = document.createElement('div');
    chatDiv.className = 'private-chat-window';
    chatDiv.id = `private-chat-window-${tornId}`;

    // Create the inner HTML for the window
    chatDiv.innerHTML = `
        <div class="pcw-header">
            <span class="pcw-title" title="${userName} [${tornId}]">Chat with ${userName}</span>
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

    // Make the close button work
    // We remove the old listener and add a new one to prevent multiple event listeners on the same button instance.
    const closeButton = chatDiv.querySelector('.pcw-close-btn');
    const closeWindowAndUnsubscribe = () => {
        // Ensure unsubscribe for the chat listener specific to this window happens here
        // (This part is handled within loadAndHandlePrivateChat, which passes the unsubscribe function to the close button)
        chatDiv.remove();
        closeButton.removeEventListener('click', closeWindowAndUnsubscribe); // Clean up this listener
    };
    closeButton.addEventListener('click', closeWindowAndUnsubscribe);

    // After creating the window, call the function to load its messages and make it work
    // Ensure `loadAndHandlePrivateChat` correctly attaches its own unsubscribe to the close button click as well.
    loadAndHandlePrivateChat(tornId, userName, chatDiv);
};
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
    function displayPrivateChatMessage(messageObj, displayElement, isMyMessage) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message');

        // Add a special class if the message is from the current user
        if (isMyMessage) {
            messageElement.classList.add('my-message');
        }

        const timestamp = messageObj.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '';

        // Use "You" if it's your message, otherwise use the sender's name
        const senderName = isMyMessage ? 'You' : (messageObj.sender || 'Unknown');
        const messageText = messageObj.text || '';

        messageElement.innerHTML = `
            <span class="chat-timestamp">[${timestamp}]</span>
            <span class="chat-sender">${senderName}:</span>
            <span class="chat-text">${messageText}</span>
        `;
        displayElement.appendChild(messageElement);
    }
    // This function loads messages and handles sending for a private chat window
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

        try {
            await db.collection('privateChats').doc(chatDocId).set({
                participants: participants,
                lastMessageAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
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
                    // --- THIS IS THE KEY CHANGE ---
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
                await db.collection('privateChats').doc(chatDocId).update({
                    lastMessageAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                await messagesCollectionRef.add(messageObj);
                inputField.value = '';
                inputField.focus();
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

    // A custom confirmation box that returns a promise with the user's choice
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
                resolve({ confirmed, dontAskAgain });
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
                const lastMessage = lastMessageSnapshot.empty ? { text: 'No messages yet...' } : lastMessageSnapshot.docs[0].data();

                return {
                    chatId: doc.id, // We need the chat document ID for deletion
                    tornId: friendTornId,
                    name: friendName,
                    image: friendImage,
                    lastMessage: lastMessage.text
                };
            });

            const chatDetails = (await Promise.all(chatDetailsPromises)).filter(Boolean);

            let listHtml = '';
            chatDetails.forEach(chat => {
                listHtml += `
                    <div class="recent-chat-item" data-friend-id="${chat.tornId}" data-friend-name="${chat.name}">
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
                    event.stopPropagation(); // Stop the click from opening the chat window
                    const chatId = deleteButton.dataset.chatId;
                    const friendName = deleteButton.dataset.friendName;

                    const confirmDelete = localStorage.getItem('confirmDeleteChat') !== 'false';

                    if (confirmDelete) {
                        const result = await showCustomConfirmWithOptions(`Are you sure you want to delete your entire chat history with ${friendName}? This cannot be undone.`, "Confirm Deletion");

                        if (result.dontAskAgain) {
                            localStorage.setItem('confirmDeleteChat', 'false');
                        }
                        if (!result.confirmed) {
                            return; // User clicked "No"
                        }
                    }

                    // If confirmed or if we are skipping confirmation, proceed to delete
                    const success = await deletePrivateChat(chatId);
                    if (success) {
                        loadRecentPrivateChats(targetDisplayElement); // Refresh the list
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
	
	// NEW FUNCTION: Display Faction Members in the Chat Tab
function displayFactionMembersInChatTab(membersData, targetDisplayElement) {
    if (!targetDisplayElement) {
        console.error("HTML Error: Target display element not provided for Faction Members tab.");
        return;
    }

    // Convert membersData object to an array of members, and sort them by name
    const membersArray = Object.values(membersData).map(member => ({
        id: member.player_id,
        name: member.name,
        // You can add more properties here from the Torn API's faction members data if needed
        // e.g., status, last_action.timestamp, etc.
        // For now, we'll just use name and ID.
    }));

    membersArray.sort((a, b) => a.name.localeCompare(b.name));

    let membersHtml = '';
    if (membersArray.length === 0) {
        membersHtml = '<p style="text-align:center; padding: 20px;">No faction members found or data unavailable.</p>';
    } else {
        membersArray.forEach(member => {
            // Check if player has a profile image stored in your 'users' collection
            // We need an async call here to fetch the profile image
            // For simplicity in this function, we'll use a default or assume one for now
            // and maybe fetch later if this becomes a performance bottleneck or if dynamic image loading is desired.
            // For now, let's just use the default icon.
            const profileImage = DEFAULT_PROFILE_ICONS[0]; // Using a default generic icon for now

            membersHtml += `
                <div class="member-item">
                    <div class="member-identity">
                        <img src="${profileImage}" alt="${member.name}'s profile pic" class="member-profile-pic">
                        <a href="https://www.torn.com/profiles.php?XID=${member.id}" target="_blank" class="member-name">${member.name} [${member.id}]</a>
                    </div>
                    <div class="member-actions">
                        <button class="item-button message-member-button" data-torn-id="${member.id}" data-torn-name="${member.name}" title="Send Message">✉️</button>
                    </div>
                </div>`;
        });
    }

    const membersListContainer = document.createElement('div');
    membersListContainer.className = 'members-list-container';
    membersListContainer.innerHTML = membersHtml;
    targetDisplayElement.innerHTML = ''; // Clear previous content
    targetDisplayElement.appendChild(membersListContainer);

    // Add event listeners for message buttons within this newly added content
    membersListContainer.querySelectorAll('.message-member-button').forEach(button => {
        button.addEventListener('click', (event) => {
            const tornId = event.target.dataset.tornId;
            const tornName = event.target.dataset.tornName;
            // Call the globally exposed function to open private chat
            window.openPrivateChatWindow(tornId, tornName);
        });
    });
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
        let consoleLogPath = '';
        let docIdForParent = null; // New variable to hold the document ID for parent chat collections

        if (collectionType === 'faction') {
            if (currentUserFactionId) {
                targetCollection = db.collection('factionChats').doc(currentUserFactionId).collection('messages');
                consoleLogPath = `factionChats/${currentUserFactionId}/messages`;
                docIdForParent = currentUserFactionId;
            } else {
                console.warn("Faction ID not available for current user. Cannot send faction chat message.");
                alert("Faction ID not found. Please complete your profile to use faction chat.");
                return;
            }
        } else if (collectionType === 'war') {
            // Use the globally stored currentActiveRankedWarId
            if (currentActiveRankedWarId) {
                targetCollection = db.collection('warChats').doc(currentActiveRankedWarId).collection('messages');
                consoleLogPath = `warChats/${currentActiveRankedWarId}/messages`;
                docIdForParent = currentActiveRankedWarId;
            } else {
                console.warn("No active ranked war ID. Cannot send war chat message.");
                alert("No active war chat available. Please wait for a war to start or check war settings.");
                return;
            }
        } else if (collectionType === 'alliance') {
            if (currentUserAllianceIds && currentUserAllianceIds.length > 0) {
                const allianceIdToChatIn = currentUserAllianceIds[0];
                targetCollection = db.collection('allianceChats').doc(allianceIdToChatIn).collection('messages');
                consoleLogPath = `allianceChats/${allianceIdToChatIn}/messages`;
                docIdForParent = allianceIdToChatIn;
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
            // Ensure the parent document exists for faction/alliance/war chats if it's the first message
            if (docIdForParent) { // Check if a parent doc ID was determined
                const parentCollectionName = (collectionType === 'faction') ? 'factionChats' :
                                             (collectionType === 'alliance') ? 'allianceChats' :
                                             (collectionType === 'war') ? 'warChats' : null;

                if (parentCollectionName) {
                    await db.collection(parentCollectionName).doc(docIdForParent).set({}, { merge: true }); // Empty merge to ensure existence
                }
            }

            await targetCollection.add(messageObj);
            textInput.value = ''; // Clear input field
            textInput.focus(); // Keep focus on input field
        } catch (error) {
            console.error(`Error sending ${collectionType} message to Firebase:`, error);
            alert(`Failed to send ${collectionType} message.`);
        }
    }

    function setupChatRealtimeListener(type) {
        // Clear previous listener first
        if (unsubscribeFromChat) {
            unsubscribeFromChat();
            unsubscribeFromChat = null; // Ensure it's explicitly null
            console.log("Unsubscribed from previous chat listener.");
        }
        // Also clear any active war chat timer if switching away from war chat
        if (warChatTimerInterval) {
            clearInterval(warChatTimerInterval);
            warChatTimerInterval = null;
            console.log("Cleared war chat timer interval.");
        }


        let chatDisplayArea = null; // Declare here so it's fresh for each type
        let collectionRef = null;
        let displayAreaId = '';
        let consoleLogPath = '';

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
            // For war chat, we need to first determine the active war.
            // fetchAndSetWarChatContext will handle setting up chatMessagesCollection and listener.
            fetchAndSetWarChatContext(); // This function does all the heavy lifting for war chat
            return; // Exit here, as the listener is set up within fetchAndSetWarChatContext
        } else if (type === 'alliance' && auth.currentUser) {
            // Use the first saved alliance ID for displaying messages
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
        } else if (!auth.currentUser) { // If user is not logged in for any chat type
            const displayAreas = {
                'faction': 'chat-display-area',
                'war': 'war-chat-display-area',
                'alliance': 'alliance-chat-display-area'
            };
            chatDisplayArea = document.getElementById(displayAreas[type]);
            if (chatDisplayArea) chatDisplayArea.innerHTML = '<p>Please log in to use chat.</p>';
            console.warn(`User not logged in. Cannot set up ${type} chat listener.`);
            return;
        }

        // This block only executes for 'faction' or 'alliance' chat after their respective collectionRefs are set
        chatDisplayArea = document.getElementById(displayAreaId); // Re-get it, it might be set above
        if (chatDisplayArea) chatDisplayArea.innerHTML = `<p>Loading ${type} messages...</p>`;
        console.log(`Setting up ${type} chat listener for path: ${consoleLogPath}`);

        if (collectionRef) {
            unsubscribeFromChat = collectionRef.orderBy('timestamp', 'asc').limitToLast(50)
                .onSnapshot(snapshot => {
                    if (chatDisplayArea) chatDisplayArea.innerHTML = ''; // Clear previous messages
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
} // END of initializeGlobals function

// Run the main initialization function
initializeGlobals();