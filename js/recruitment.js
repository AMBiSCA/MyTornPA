// --- Firebase and Global Variable Setup ---
const db = firebase.firestore();
const auth = firebase.auth();

let currentUserTornId = null; 
let currentUserTornApiKey = null; 
let currentUserData = null; // To store the currently logged-in user's fetched Torn data
let currentUserIsLeader = false; // Flag to check if current user is a leader

// DOM Elements for this page (from recruitment.html)
const factionsSeekingMembersTbody = document.getElementById('factions-seeking-members-tbody');
const playersSeekingFactionsTbody = document.getElementById('players-seeking-factions-tbody');
const listSelfButton = document.getElementById('list-self-button');
const advertiseFactionButton = document.getElementById('advertise-faction-button');


// --- Utility Functions (Copied from your war_page_hub.js for self-containment) ---

function formatTime(seconds) {
    if (seconds <= 0) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    let result = '';
    if (h > 0) result += `${h}h `;
    if (m > 0) result += `${m}m `;
    if (s > 0) result += `${s}s`;
    return result.trim();
}

function formatRelativeTime(timestampInSeconds) {
    if (!timestampInSeconds || timestampInSeconds === 0) {
        return "N/A";
    }
    const now = Math.floor(Date.now() / 1000);
    const diffSeconds = now - timestampInSeconds;
    if (diffSeconds < 60) {
        return "Now";
    } else if (diffSeconds < 3600) {
        const minutes = Math.floor(diffSeconds / 60);
        return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
    } else if (diffSeconds < 86400) {
        const hours = Math.floor(diffSeconds / 3600);
        return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else {
        const days = Math.floor(diffSeconds / 86400);
        return `${days} day${days === 1 ? '' : 's'} ago`;
    }
}


// --- Core Functions for this page ---

// Function to display factions looking for members (NOW FETCHES FROM FIRESTORE)
async function displayFactionsSeekingMembers() {
    if (!factionsSeekingMembersTbody) return;

    factionsSeekingMembersTbody.innerHTML = '<tr><td colspan="4">Loading recruiting factions...</td></tr>';

    try {
        const snapshot = await db.collection('recruitingFactions') // NEW Collection
                                .where('isActive', '==', true)
                                .orderBy('listingTimestamp', 'desc')
                                .get();

        if (snapshot.empty) {
            factionsSeekingMembersTbody.innerHTML = '<tr><td colspan="4">No factions currently seeking members.</td></tr>';
            return;
        }

        let tableHtml = '';
        snapshot.docs.forEach(doc => {
            const faction = doc.data();
            const profileUrl = `https://www.torn.com/factions.php?step=profile&ID=${faction.factionId}`;
            
            tableHtml += `
                <tr>
                    <td><a href="${profileUrl}" target="_blank">${faction.factionName} [${faction.factionId}]</a></td>
                    <td>${faction.totalMembers || 'N/A'}</td>
                    <td>${faction.contactInfo || 'N/A'}</td>
                    <td><button class="action-button enlist-button" data-faction-id="${faction.factionId}">Enlist</button></td>
                </tr>
            `;
        });
        factionsSeekingMembersTbody.innerHTML = tableHtml;

    } catch (error) {
        console.error("Error displaying factions seeking members:", error);
        factionsSeekingMembersTbody.innerHTML = '<tr><td colspan="4">Error loading factions.</td></tr>';
    }
}

// Function to handle player enlistment (for Factions Seeking Members section)
async function enlistPlayer(factionId) {
    console.log(`Attempting to enlist player for Faction ID: ${factionId}`);
    if (!auth.currentUser) {
        alert("You must be logged in to enlist.");
        return;
    }
    if (!currentUserTornId || !currentUserTornApiKey) {
        alert("Your Torn ID and API key are required for enlistment. Please register them in your profile.");
        return;
    }

    try {
        // --- Use selections for 'bars,cooldowns,travel,profile' ---
        const selections = 'bars,cooldowns,travel,profile'; // As requested
        const apiUrl = `https://api.torn.com/user/${currentUserTornId}?selections=${selections}&key=${currentUserTornApiKey}&comment=MyTornPA_Recruitment`;
        
        console.log(`Fetching player data for enlistment: ${apiUrl}`);
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Torn API HTTP error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        if (data.error) {
            // Specifically handle common API key errors
            if (data.error.code === 2) throw new Error(`Torn API: Invalid API Key. Please check your key permissions.`);
            if (data.error.code === 10) throw new Error(`Torn API: Insufficient API Key Permissions. Ensure 'Bars', 'Cooldowns', 'Travel', and 'Profile' are enabled.`);
            throw new Error(`Torn API error: ${data.error.error}`);
        }

        // Extract data based on new selections
        const profile = data.profile || {};
        const bars = data.bars || {}; 
        const cooldowns = data.cooldowns || {}; 
        const travel = data.travel || {}; 
        
        const xanaxTaken = 'N/A'; // Cannot get from 'personalstats' which is NOT in new selections
        const totalAttacks = 'N/A'; // Cannot get from 'personalstats' which is NOT in new selections
        const playerStrength = 'N/A'; // Cannot get from 'battlestats' which is NOT in new selections
        const playerDefense = 'N/A';   // Cannot get from 'battlestats' which is NOT in new selections
        const playerSpeed = 'N/A';       // Cannot get from 'battlestats' which is NOT in new selections
        const playerDexterity = 'N/A'; // Cannot get from 'battlestats' which is NOT in new selections


        const playerEnlistmentData = {
            factionId: String(factionId), // Ensure it's a string for consistency
            playerId: String(currentUserTornId),
            playerName: profile.name || data.name || 'Unknown', // Fallback to top-level name from basic selection if profile.name is missing
            playerLevel: profile.level || data.level || 0, // Fallback to top-level level from basic selection
            playerStrength: playerStrength, 
            playerDefense: playerDefense,   
            playerSpeed: playerSpeed,       
            playerDexterity: playerDexterity, 
            xanaxTaken: xanaxTaken,         
            totalAttacks: totalAttacks,     
            enlistmentTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
            firebaseUid: auth.currentUser.uid, 
            status: profile.status ? profile.status.description : data.status ? data.status.description : 'Unknown' // Current status (from profile or basic)
        };

        const docRef = db.collection('recruitmentApplications').doc(`${factionId}_${currentUserTornId}`);
        await docRef.set(playerEnlistmentData, { merge: true });

        alert(`Successfully enlisted for Faction ${factionId}! Your profile has been sent.`);
        console.log("Player enlistment data saved:", playerEnlistmentData);

    } catch (error) {
        console.error("Error during player enlistment:", error);
        alert(`Failed to enlist: ${error.message}`);
    }
}


// --- NEW FUNCTION: To list current user in 'Players Seeking Factions' ---
async function listSelfForRecruitment() {
    console.log("Attempting to list player for recruitment.");
    if (!auth.currentUser) {
        alert("You must be logged in to list yourself.");
        return;
    }
    if (!currentUserTornId || !currentUserTornApiKey) {
        alert("Your Torn ID and API key are required to list yourself. Please register them in your profile.");
        return;
    }

    const contactInfo = prompt("Please provide contact info (e.g., Discord Tag, Torn Mail ID) for factions to reach you:");
    if (!contactInfo || contactInfo.trim() === '') {
        alert("Listing cancelled. Contact info is required.");
        return;
    }

    try {
        const selections = 'bars,cooldowns,travel,profile'; // As requested
        const apiUrl = `https://api.torn.com/user/${currentUserTornId}?selections=${selections}&key=${currentUserTornApiKey}&comment=MyTornPA_Recruitment`;
        
        console.log(`Fetching player data for self-listing: ${apiUrl}`);
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Torn API HTTP error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        if (data.error) {
            if (data.error.code === 2) throw new Error(`Torn API: Invalid API Key. Please check your key permissions.`);
            if (data.error.code === 10) throw new Error(`Torn API: Insufficient API Key Permissions. Ensure 'Bars', 'Cooldowns', 'Travel', and 'Profile' are enabled.`);
            throw new Error(`Torn API error: ${data.error.error}`);
        }

        const profile = data.profile || {};
        const bars = data.bars || {}; 
        const cooldowns = data.cooldowns || {}; 
        const travel = data.travel || {}; 

        const xanaxTaken = 'N/A'; // Will be N/A based on current selections
        const totalAttacks = 'N/A'; // Will be N/A based on current selections
        const playerStrength = 'N/A'; // Will be N/A based on current selections
        const playerDefense = 'N/A';   // Will be N/A based on current selections
        const playerSpeed = 'N/A';       // Will be N/A based on current selections
        const playerDexterity = 'N/A'; // Will be N/A based on current selections


        const playerListingData = {
            playerId: String(currentUserTornId),
            playerName: profile.name || data.name || 'Unknown',
            playerLevel: profile.level || data.level || 0,
            playerStrength: playerStrength, 
            playerDefense: playerDefense,   
            playerSpeed: playerSpeed,       
            playerDexterity: playerDexterity, 
            xanaxTaken: xanaxTaken,
            totalAttacks: totalAttacks,
            contactInfo: contactInfo.trim(),
            listingTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
            firebaseUid: auth.currentUser.uid, 
            isActive: true // Player can set this to false later if they find a faction
        };

        const docRef = db.collection('playersSeekingFactions').doc(auth.currentUser.uid); // Using Firebase UID as doc ID
        await docRef.set(playerListingData, { merge: true });

        alert(`Successfully listed yourself for recruitment!`);
        console.log("Player self-listing data saved:", playerListingData);
        displayPlayersSeekingFactions(); // Refresh the list after listing self

    } catch (error) {
        console.error("Error during self-listing:", error);
        alert(`Failed to list yourself: ${error.message}`);
    }
}


// --- NEW FUNCTION: To display 'Players Seeking Factions' ---
async function displayPlayersSeekingFactions() {
    if (!playersSeekingFactionsTbody) return;

    playersSeekingFactionsTbody.innerHTML = '<tr><td colspan="6">Loading player listings...</td></tr>';

    try {
        const snapshot = await db.collection('playersSeekingFactions')
                                .where('isActive', '==', true)
                                .orderBy('listingTimestamp', 'desc') // Show most recent first
                                .limit(50) // Limit to 50 listings
                                .get();

        if (snapshot.empty) {
            playersSeekingFactionsTbody.innerHTML = '<tr><td colspan="6">No players currently seeking factions.</td></tr>';
            return;
        }

        let tableHtml = '';
        snapshot.docs.forEach(doc => {
            const player = doc.data();
            const profileUrl = `https://www.torn.com/profiles.php?XID=${player.playerId}`;
            
            tableHtml += `
                <tr>
                    <td><a href="${profileUrl}" target="_blank">${player.playerName} [${player.playerId}]</a></td>
                    <td>${player.playerLevel}</td>
                    <td>S:${player.playerStrength.toLocaleString()} D:${player.playerDefense.toLocaleString()} Sp:${player.playerSpeed.toLocaleString()} Dx:${player.playerDexterity.toLocaleString()}</td>
                    <td>${player.xanaxTaken.toLocaleString()}</td>
                    <td>${player.totalAttacks.toLocaleString()}</td>
                    <td><button class="action-button contact-player-button" data-player-id="${player.playerId}" data-contact-info="${player.contactInfo}">Contact</button></td>
                </tr>
            `;
        });
        playersSeekingFactionsTbody.innerHTML = tableHtml;

    } catch (error) {
        console.error("Error fetching players seeking factions:", error);
        playersSeekingFactionsTbody.innerHTML = `<tr><td colspan="6">Error loading player listings.</td></tr>`;
    }
}


// --- NEW FUNCTION: To allow a Faction Leader to advertise their faction ---
async function advertiseFaction() {
    console.log("Attempting to advertise faction.");
    if (!auth.currentUser) {
        alert("You must be logged in to advertise your faction.");
        return;
    }
    // Check if the current user is a leader (this flag is set in auth.onAuthStateChanged)
    if (!currentUserIsLeader) { 
        alert("Only designated faction leaders can advertise factions.");
        return;
    }
    if (!currentUserTornApiKey) {
        alert("Your Torn API key is required to advertise your faction. Please register it in your profile.");
        return;
    }

    try {
        // Fetch current user's faction ID from their profile in Firebase
        const userProfileDoc = await db.collection('userProfiles').doc(auth.currentUser.uid).get();
        // --- CRITICAL CORRECTION: Accessing faction_id from userData ---
        const userTornFactionId = userProfileDoc.data()?.faction_id; // Access the faction_id from the Firebase document

        if (!userTornFactionId) {
            alert("Your Torn Faction ID (`faction_id`) is not registered in your profile. Please add it to your profile to advertise your faction.");
            return;
        }

        const selections = 'basic,members'; // Basic info + member count
        const apiUrl = `https://api.torn.com/v2/faction/${userTornFactionId}?selections=${selections}&key=${currentUserTornApiKey}&comment=MyTornPA_RecruitAdvertiseFaction`;

        console.log(`Fetching faction data for advertisement: ${apiUrl}`);
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Torn API HTTP error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        if (data.error) {
            if (data.error.code === 2) throw new Error(`Torn API: Invalid API Key. Please check your key permissions.`);
            if (data.error.code === 10) throw new Error(`Torn API: Insufficient API Key Permissions. Ensure 'Basic' and 'Members' are enabled for your faction API key.`);
            throw new Error(`Torn API error: ${data.error.error}`);
        }

        const factionName = data.basic ? data.basic.name : 'Unknown Faction';
        const totalMembers = data.members ? data.members.total : null; // Ensure null for Firestore if missing

        const contactInfo = prompt(`Please provide contact info for ${factionName} (e.g., Discord Tag, Torn Mail ID for recruiters):`);
        if (!contactInfo || contactInfo.trim() === '') {
            alert("Faction advertisement cancelled. Contact info is required.");
            return;
        }

        const factionListingData = {
            factionId: String(userTornFactionId), 
            factionName: factionName,
            totalMembers: totalMembers,
            contactInfo: contactInfo.trim(),
            listingTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
            firebaseUid: auth.currentUser.uid, // Link to leader's Firebase UID
            isActive: true // Faction can manage this later
        };

        const docRef = db.collection('recruitingFactions').doc(String(userTornFactionId));
        await docRef.set(factionListingData, { merge: true });

        alert(`Successfully advertised ${factionName} for recruitment!`);
        console.log("Faction advertisement data saved:", factionListingData);
        displayFactionsSeekingMembers(); // Refresh the list after advertising

    } catch (error) {
        console.error("Error during faction advertisement:", error);
        alert(`Failed to advertise faction: ${error.message}`);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Basic tab navigation for main content tabs
    const tabButtons = document.querySelectorAll('.tab-button'); 
    const mainTabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            const targetTabDataset = event.currentTarget.dataset.tab;
            const targetTabId = targetTabDataset + '-tab';

            showTab(targetTabId);

            // --- NEW PART: Call updateFriendlyMembersTable when 'friendly-status' tab is active ---
            if (targetTabDataset === 'friendly-status') {
                const user = firebase.auth().currentUser;
                // apiKey will be set below in auth.onAuthStateChanged
                // We need to make sure userApiKey is defined and accessible here.
                // It's already handled by userApiKey from the outer scope if populated.
            }
            // --- END NEW PART ---
        });
    });
    showTab('announcements-tab');
    let listenersInitialized = false;

    // --- Chat Tab Functionality Elements and Handler ---
    const chatTabsContainer = document.querySelector('.chat-tabs-container');
    const chatTabs = document.querySelectorAll('.chat-tab');
    const warChatBox = document.getElementById('warChatBox');
    const chatDisplayArea = document.getElementById('chat-display-area');
    const chatInputArea = document.querySelector('.chat-input-area');

    // Function to handle chat tab clicks
    function handleChatTabClick(event) {
        const clickedTab = event.currentTarget;
        const targetTab = clickedTab.dataset.chatTab;

        console.log(`[Chat Tab Debug] Clicked tab: ${targetTab}`);

        chatTabs.forEach(tab => tab.classList.remove('active'));

        if (warChatBox) {
             warChatBox.classList.remove('chat-content-hidden');
        }

        if (unsubscribeFromChat) {
            unsubscribeFromChat();
            unsubscribeFromChat = null;
            console.log("Unsubscribed from previous chat listener (tab switch).");
        }

        const selectedChatTabButton = document.querySelector(`.chat-tab[data-chat-tab="${targetTab}"]`);
        if (selectedChatTabButton) {
            selectedChatTabButton.classList.add('active');
            selectedChatTabButton.parentNode.scrollLeft = selectedChatTabButton.offsetLeft - (selectedChatTabButton.parentNode.offsetWidth / 2) + (selectedChatTabButton.offsetWidth / 2);
        }

        let nonChatContentPanel = document.getElementById('non-chat-dynamic-content-panel');
        if (nonChatContentPanel) {
            nonChatContentPanel.remove();
        }

        if (targetTab === 'faction-chat' || targetTab === 'private-chat') {
            if (warChatBox) {
                warChatBox.classList.remove('hide-content'); 
                if (chatDisplayArea) {
                    if (targetTab === 'faction-chat') {
                        chatDisplayArea.innerHTML = '<p>Welcome to Faction Chat! Messages will appear here...</p>';
                        setupChatRealtimeListener();
                    } else {
                        chatDisplayArea.innerHTML = '<p>Welcome to Private Chat! Messages will appear here...</p>';
                    }
                    chatDisplayArea.scrollTop = chatDisplayArea.scrollHeight;
                }
            }
        } else {
            if (warChatBox) {
                warChatBox.classList.add('hide-content');

                nonChatContentPanel = document.createElement('div');
                nonChatContentPanel.id = 'non-chat-dynamic-content-panel';
                nonChatContentPanel.className = 'chat-dynamic-panel'; 
                
                nonChatContentPanel.style.position = 'absolute';
                nonChatContentPanel.style.top = '40px'; 
                nonChatContentPanel.style.left = '0';
                nonChatContentPanel.style.right = '0';
                nonChatContentPanel.style.bottom = '0';
                nonChatContentPanel.style.backgroundColor = '#1a1a1a';
                nonChatContentPanel.style.padding = '10px';
                nonChatContentPanel.style.overflowY = 'auto';
                nonChatContentPanel.style.color = '#f0f0f0';
                nonChatContentPanel.style.boxSizing = 'border-sizing'; // Corrected from 'border-box' in prev paste

                if (targetTab === 'settings') {
                    nonChatContentPanel.innerHTML = `
                        <div class="chat-settings-panel">
                            <h3>Chat Settings</h3>
                            <div class="setting-item">
                                <label for="chatFontSize">Font Size:</label>
                                <select id="chatFontSize">
                                    <option value="small">Small</option>
                                    <option value="medium" selected>Medium</option>
                                    <option value="large">Large</option>
                                </select>
                            </div>
                            <div class="setting-item">
                                <label for="notificationToggle">Notifications:</label>
                                <input type="checkbox" id="notificationToggle" checked>
                            </div>
                            <div class="setting-item">
                                <label for="themeSelect">Chat Theme:</label>
                                <select id="themeSelect">
                                    <option value="dark">Dark</option>
                                    <option value="light">Light (Coming Soon)</option>
                                </select>
                            </div>
                            <button class="save-settings-btn">Save Settings</button>
                        </div>
                    `;
                } else if (targetTab === 'faction-members') {
                    console.log("[Chat Tab Debug] Faction Members tab selected.");

                    nonChatContentPanel.innerHTML = `<h3>Faction Members</h3>`; 

                    const members = window.globalFactionMembers || [];
                    
                    console.log("[Chat Tab Debug] Members array before sorting:", members);

                    const rankOrder = {
                        "Leader": 0, "Co-leader": 1, "Member": 99, "Applicant": 100
                    };

                    members.sort((a, b) => {
                        const orderA = rankOrder[a.rank] !== undefined ? rankOrder[a.rank] : rankOrder["Member"];
                        const orderB = rankOrder[b.rank] !== undefined ? rankOrder[b.rank] : rankOrder["Member"];

                        if (orderA !== orderB) { return orderA - orderB; }
                        return a.name.localeCompare(b.name);
                    });

                    const membersListHtml = members.map(member => {
                        const profileImageUrl = member.profile_image 
                            ? `https://www.torn.com/images/profile_images/${member.profile_image}_thumb.jpg` 
                            : '../../images/default_profile_icon.png';

                        let memberClass = ''; 
                        if (member.rank === "Leader" || member.rank === "Co-leader") { memberClass = 'leader-member'; }

                        return `
                            <a href="https://www.torn.com/profiles.php?XID=${member.id}" target="_blank" rel="noopener noreferrer" class="member-item ${memberClass}">
                                <img src="${profileImageUrl}" alt="${member.name}'s profile picture" class="member-profile-pic" onerror="this.onerror=null;this.src='../../images/default_profile_icon.png';">
                                <span class="member-name">${member.name}</span>
                                <span class="member-rank">${member.rank}</span>
                            </a>
                        `;
                    }).join('');

                    nonChatContentPanel.innerHTML += `<div class="members-list-container">${membersListHtml}</div>`;
                    console.log("[Chat Tab Debug] Generated Members HTML length:", membersListHtml.length);
                } else {
                    nonChatContentPanel.innerHTML = `<p style="text-align: center; margin-top: 20px;">Content for "${targetTab.replace('-', ' ')}" will go here.</p>`;
                }
                
                warChatBox.appendChild(nonChatContentPanel);
            }
        }
    }


    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userProfileRef = db.collection('userProfiles').doc(user.uid);
            const doc = await userProfileRef.get();
            const userData = doc.exists ? doc.data() : {};
            
            // --- UPDATED: Correctly retrieve Torn API Key from userData ---
            const apiKey = userData.tornApiKey || null; // Read tornApiKey from userProfiles
            // --- END UPDATED ---

            const playerId = userData.tornProfileId || null;
            currentTornUserName = userData.preferredName || 'Unknown';

            let warData = {};
            try {
                const warDoc = await db.collection('factionWars').doc('currentWar').get();
                warData = warDoc.exists ? warDoc.data() : {};
            } catch (firebaseError) {
                console.error("Error fetching warData from Firebase (Firebase data might be missing):", firebaseError);
            }

            if (apiKey && playerId) {
                userApiKey = apiKey; // Assign to global userApiKey for other functions

                await initializeAndLoadData(apiKey);
                populateUiComponents(warData, apiKey);

                fetchAndDisplayChainData();
                fetchAndDisplayRankedWarScores();
                displayQuickFFTargets(userApiKey, playerId);
                setupChatRealtimeListener();

                if (!listenersInitialized) {
                    setupEventListeners(apiKey);
                    setupMemberClickEvents();

                    chatTabs.forEach(tab => {
                        tab.addEventListener('click', handleChatTabClick);
                    });

                    const initialActiveChatTab = document.querySelector('.chat-tab.active');
                    if (initialActiveChatTab) {
                        handleChatTabClick({ currentTarget: initialActiveChatTab });
                    }
                    
                    listenersInitialized = true;

                    setInterval(updateAllTimers, 1000);
                    setInterval(() => {
                        if (userApiKey && globalEnemyFactionID) {
                            fetchAndDisplayEnemyFaction(globalEnemyFactionID, userApiKey);
                        } else {
                            console.warn("API key or enemy faction ID not available for periodic enemy data refresh.");
                        }
                    }, 2000);
                    setInterval(() => {
                        if (userApiKey && playerId) {
                            displayQuickFFTargets(userApiKey, playerId);
                        } else {
                            console.warn("API key or Player ID not available for periodic Quick FF targets refresh.");
                        }
                    }, 60000);
                    setInterval(() => {
                        if (userApiKey) {
                            initializeAndLoadData(userApiKey);
                        } else {
                            console.warn("API key not available for periodic comprehensive faction data refresh.");
                        }
                    }, 2000);
                }
            } else {
                console.warn("API key or Player ID not found.");
                const factionWarHubTitleEl = document.getElementById('factionWarHubTitle');
                if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = "Faction War Hub. (API Key & Player ID Needed)";
                const quickFFTargetsDisplay = document.getElementById('quickFFTargetsDisplay');
                if (quickFFTargetsDisplay) {
                    quickFFTargetsDisplay.innerHTML = '<span style="color: #ff4d4d;">Login & API/ID needed.</span>';
                }
            }
        } else {
            userApiKey = null;
            listenersInitialized = false;
            console.log("User not logged in.");
            const factionWarHubTitleEl = document.getElementById('factionWarHubTitle');
            if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = "Faction War Hub. (Please Login)";
        }
    });
});