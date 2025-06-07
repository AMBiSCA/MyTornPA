// mysite/js/social.js - Debugging for Faction Chat Display 
// This script focuses ONLY on the Hub page's main functionalities (chat, profile toggles, recruitment, etc.).
// Header button visibility and dropdowns are now handled by globalheader.js.
document.addEventListener('DOMContentLoaded', function() {
    console.log("social.js: DOMContentLoaded event fired. The Hub is loading!");

    let isAdminMode = false;
    let isTestMode = true; // << CHANGE THIS TO 'false' TO SEE LIVE DATA / NEW UI IN LEADERSHIP PANEL

    let db = null;
    let auth = null;
    let currentUserId = null;
    let currentUserProfileData = null;
    
    // Variables for "On The Hunt" Faction Scout Pagination
    let allRecruitingFactionsData = [];
    let currentFactionPage = 1;
    const factionsPerPage = 12;
    let currentlyDisplayedFactions = [];

    // NEW: Variables for "Leadership View - Looking For Factions" Pagination
    let allLookingForFactionUsersData = [];
    let currentLeadershipPage = 1;
    const usersPerPage = 12; // Same as factionsPerPage for consistent layout
    let currentlyDisplayedUsers = [];

    // NEW: Custom Respect Steps for the slider (retained for "On The Hunt")
    const respectSteps = [
        0, 10000, 20000, 30000, 40000, 50000, 75000, 100000, 150000, 200000, 250000,
        300000, 400000, 500000, 600000, 700000, 800000, 900000, 1000000,
        1500000, 2000000, 2500000, 3000000, 4000000, 5000000, 7500000,
        10000000, 12500000, 15000000, 17500000, 20000000
    ];

    // NEW: Custom Battlestats Steps for the slider (for "Leadership View")
    const battlestatsSteps = [
        0, 100000, 250000, 500000, 1000000, 2500000, 5000000, 10000000,
        25000000, 50000000, 100000000, 250000000, 500000000, 1000000000, 2500000000,
        5000000000, 7500000000, 10000000000 // Up to 10 Billion
    ];


    // Helper function to format numbers (10000 -> 10k, 1000000 -> 1m)
    function formatNumberForDisplay(num) {
        if (num >= 1000000000) {
            return (num / 1000000000).toLocaleString(undefined, {maximumFractionDigits:1}) + 'b';
        } else if (num >= 1000000) {
            return (num / 1000000).toLocaleString(undefined, {maximumFractionDigits:1}) + 'm';
        } else if (num >= 1000) {
            return (num / 1000).toLocaleString(undefined, {maximumFractionDigits:0}) + 'k';
        }
        return num.toLocaleString();
    }

    // Store unsubs for chat listeners to prevent memory leaks when switching tabs/logging out
    let globalChatUnsub = null;
    let factionChatUnsub = null;
    let friendChatUnsub = null;
    let friendsListUnsub = null;
    let recentChatsUnsub = null;
    let dmChatUnsub = null;

    // Store the ID of the friend currently being DMed
    let currentDmFriendId = null;

    // --- Firebase Service Assignments (Assuming firebase-init.js has already initialized the global 'firebase' object) ---
    console.log("social.js: Attempting to get Firebase service instances...");
    if (typeof firebase !== 'undefined' && firebase.app) {
        try {
            auth = firebase.auth();
            db = firebase.firestore();
            console.log("Firebase Auth and Firestore instances obtained successfully.");
        } catch (e) {
            console.error("CRITICAL: Error getting Firebase Auth/Firestore instances:", e);
        }
    } else {
        console.error("CRITICAL: Firebase library not loaded or app not initialized by firebase-init.js!");
    }
    if (!auth) console.error("CRITICAL POST-INIT CHECK: Firebase Auth (auth) is NULL in social.js.");
    if (!db) console.error("CRITICAL POST-INIT CHECK: Firebase Firestore (db) is NULL in social.js.");


    // --- DOM Element Getters ---
    const factionFiltersContainer = document.getElementById('factionFiltersContainer');
    const toggleFiltersBtn = document.getElementById('toggleFiltersBtn');
    const filterArrowIcon = document.getElementById('filterArrowIcon');
    const filterOptions = document.getElementById('filterOptions');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    const theHubMainUi = document.getElementById('theHubMainUi');
    
    const homeButtonFooter = document.getElementById('homeButtonFooter'); // This is a FOOTER button, remains here
    // REMOVED: usefulLinksBtn, usefulLinksDropdown, headerContactUsBtn, headerContactUsDropdown
    // These are now exclusively managed by globalheader.js

    const headerEditProfileBtn = document.getElementById('headerEditProfileBtn'); // This button opens profile modal, its click is in social.js
    const profileSetupModal = document.getElementById('profileSetupModal');
    const preferredNameInput = document.getElementById('preferredName');
    const profileSetupApiKeyInput = document.getElementById('profileSetupApiKey');
    const profileSetupProfileIdInput = document.getElementById('profileSetupProfileId');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const skipProfileSetupBtn = document.getElementById('skipProfileSetupBtn');
    const nameErrorEl = document.getElementById('nameError');
    const profileSetupErrorEl = document.getElementById('profileSetupError');
    const closeProfileModalBtn = document.getElementById('closeProfileModalBtn');
    const shareFactionStatsModalToggle = document.getElementById('shareFactionStatsModalToggle');
    const personalStatsModal = document.getElementById('personalStatsModal');
    const closePersonalStatsDialogBtn = document.getElementById('closePersonalStatsDialogBtn');
    const hubFinalPreferredNameEl = document.getElementById('hubFinalPreferredName');
    const hubFinalTornProfileIdEl = document.getElementById('hubFinalTornProfileId');
    const shareStatsToggleFinal = document.getElementById('shareStatsToggleFinal');
    const lookingForFactionToggleFinal = document.getElementById('lookingForFactionToggleFinal');
    const lookingForRecruitToggleFinal = document.getElementById('lookingForRecruitToggleFinal');
    const appearOnlineToggleFinal = document.getElementById('appearOnlineToggleFinal');
    const hubChatModal = document.getElementById('hubChatModal');
    const closeChatModalButton = document.getElementById('closeChatModalBtn');
    const hubActionGlobalChatBtn = document.getElementById('hubActionGlobalChatFinal');
    const hubActionFactionChatBtn = document.getElementById('hubActionFactionChatFinal');
    const hubActionFriendsChatBtn = document.getElementById('hubActionFriendsChatFinal');
    const viewFriendsBtnHub = document.getElementById('viewFriendsBtnFinal');
    const chatTabsContainer = document.getElementById('chatTabsContainer');
    const globalChatTabBtn = document.getElementById('globalChatTabBtn');
    const factionChatTabBtn = document.getElementById('factionChatTabBtn');
    const friendChatTabBtn = document.getElementById('friendChatTabBtn');
    const globalChatContent = document.getElementById('globalChatContent');
    const factionChatContent = document.getElementById('factionChatContent');
    const friendChatContent = document.getElementById('friendChatContent');
    const chatMessageInput = document.getElementById('chatMessageInput');
    const sendChatMessageBtn = document.getElementById('sendChatMessageBtn');
    const friendsInitialViewEl = document.getElementById('friendsInitialView');
    const directMessageViewEl = document.getElementById('directMessageView');
    const recentChatsListEl = document.getElementById('recentChatsList');
    const fullFriendsListEl = document.getElementById('fullFriendsList');
    const dmOpponentNameEl = document.getElementById('dmOpponentName');
    const dmMessagesAreaEl = document.getElementById('dmMessagesArea');
    const friendsOnlineCountFinal = document.getElementById('friendsOnlineCountFinal');
    const addFriendForm = document.getElementById('addFriendForm');
    const friendIdInput = document.getElementById('friendIdInput');
    const addFriendBtn = document.getElementById('addFriendBtn');
    const hubActionFactionInfoBtn = document.getElementById('hubActionFactionInfoFinal');
    const factionInfoModal = document.getElementById('factionInfoModal');
    const factionInfoModalTitleEl = document.getElementById('factionInfoModalTitle');
    const generalInfoContent = document.getElementById('generalInfoContent');
    const closeFactionInfoModalBtn = document.getElementById('closeFactionInfoModalBtn');
    const hubActionLeadershipViewBtn = document.getElementById('hubActionLeadershipViewFinal');
    const hubActionOnTheHuntViewBtn = document.getElementById('hubActionOnTheHuntViewFinal');
    const accessSettingsModal = document.getElementById('accessSettingsModal');
    const closeAccessSettingsModalBtn = document.getElementById('closeAccessSettingsModalBtn');
    const saveViewerAccessBtn = document.getElementById('saveViewerAccessBtn');
    const viewerSlotsContainer = document.getElementById('viewerSlotsContainer');
    const accessSettingsErrorEl = document.getElementById('accessSettingsError');
    const nameBlocklist = ["admin", "moderator", "root", "idiot", "system", "support"];
    const leadershipPanelModal = document.getElementById('leadershipPanelModal');
    const closeLeadershipPanelModalBtn = document.getElementById('closeLeadershipPanelModalBtn');
    const leadershipPanelModalBody = document.getElementById('leadershipPanelModalBody');
    const onTheHuntModal = document.getElementById('onTheHuntModal');
    const closeOnTheHuntModalBtn = document.getElementById('closeOnTheHuntModalBtn');
    const onTheHuntModalBody = document.getElementById('onTheHuntModalBody');
    const recruitingFactionsList = document.getElementById('recruitingFactionsList');

    // NEW DOM Elements for Faction Pagination
    const factionPaginationControls = document.getElementById('factionPaginationControls');
    const prevFactionPageBtn = document.getElementById('prevFactionPageBtn');
    const nextFactionPageBtn = document.getElementById('nextFactionPageBtn');
    const factionPageInfo = document.getElementById('factionPageInfo');

    // NEW DOM Elements for Faction Filters
    const filterMinRespectSlider = document.getElementById('filterMinRespectSlider');
    const filterMinRespectValue = document.getElementById('filterMinRespectValue');
    const filterMinMembersSlider = document.getElementById('filterMinMembersSlider');
    const filterMinMembersValue = document.getElementById('filterMinMembersValue');
    const filterTierBronze = document.getElementById('filterTierBronze');
    const filterTierSilver = document.getElementById('filterTierSilver');
    const filterTierGold = document.getElementById('filterTierGold');
    const filterTierPlatinum = document.getElementById('filterTierPlatinum');

    // NEW DOM Elements for Leadership View Filters & List
    const leadershipFilterMaxLevelSlider = document.getElementById('leadershipFilterMaxLevelSlider');
    const leadershipFilterMaxLevelValue = document.getElementById('leadershipFilterMaxLevelValue');
    const leadershipFilterTotalBattlestatsSlider = document.getElementById('leadershipFilterTotalBattlestatsSlider');
    const leadershipFilterTotalBattlestatsValue = document.getElementById('leadershipFilterTotalBattlestatsValue');
    const applyLeadershipFiltersBtn = document.getElementById('applyLeadershipFiltersBtn');
    const resetLeadershipFiltersBtn = document.getElementById('resetLeadershipFiltersBtn');
    const lookingForFactionsList = document.getElementById('lookingForFactionsList');
    const leadershipPaginationControls = document.getElementById('leadershipPaginationControls');
    const prevLeadershipPageBtn = document.getElementById('prevLeadershipPageBtn');
    const nextLeadershipPageBtn = document.getElementById('nextLeadershipPageBtn');
    const leadershipPageInfo = document.getElementById('leadershipPageInfo');

    // NEW DOM elements for Faction Info Tabs
    const factionInfoTabsContainer = document.getElementById('factionInfoTabs');
    const generalInfoTabBtn = document.getElementById('generalInfoTabBtn');
    const battleStatsTabBtn = document.getElementById('battleStatsTabBtn');
    const factionBattleStatsContent = document.getElementById('factionBattleStatsContent');
    const factionBattleStatsTableBody = document.getElementById('factionBattleStatsTableBody');

    // NEW DOM Elements for Manage Friends Modal
    const manageFriendsModal = document.getElementById('manageFriendsModal');
    const closeManageFriendsModalBtn = document.getElementById('closeManageFriendsModalBtn');
    const fullFriendsListInManageModal = document.getElementById('fullFriendsListInManageModal');
    const recentChatsListInManageModal = document.getElementById('recentChatsListInManageModal');
    const allFriendsSearchInput = document.getElementById('allFriendsSearchInput');
    const recentChatsSearchInput = document.getElementById('recentChatsSearchInput');


    // Initial UI State (only for elements managed by social.js)
    if (theHubMainUi) theHubMainUi.style.display = 'none';
    if (homeButtonFooter) homeButtonFooter.style.display = 'inline-block';

    function setupButtonListener(buttonEl, buttonName, callback) {
        if (buttonEl) {
            console.log(`Attaching listener to: ${buttonName} (ID: ${buttonEl.id || 'N/A'})`);
            buttonEl.addEventListener('click', callback);
        }
    }
    // REMOVED: closeAllDropdowns function (now in globalheader.js)

    async function fetchUserBattleStats(apiKey, userId) {
        console.log(`Placeholder: Fetching battlestats for User ID: ${userId} with API Key: ${apiKey}`);
        try {
            const response = await fetch(`https://api.torn.com/user/${userId}?selections=battlestats&key=${apiKey}`);
            const data = await response.json();

            if (data.error) {
                console.error("Torn API Error fetching battlestats for user ID:", userId, data.error.error);
                return {
                    strength: 0, defense: 0, speed: 0, dexterity: 0, total: 0,
                    error: data.error.error
                };
            }
            const totalStats = data.battlestats.strength + data.battlestats.defense + data.battlestats.speed + data.battlestats.dexterity;
            return {
                strength: data.battlestats.strength,
                defense: data.battlestats.defense,
                speed: data.battlestats.speed,
                dexterity: data.battlestats.dexterity,
                total: totalStats
            };
        } catch (error) {
            console.error("Error fetching battlestats from Torn API for user ID:", userId, error);
            return { strength: 0, defense: 0, speed: 0, dexterity: 0, total: 0, error: error.message };
        }
    }

    async function fetchFactionMembersWithStats(factionId, apiKey) {
        if (!factionId || !apiKey) {
            console.warn("Faction ID or API key missing, cannot fetch faction members.");
            return [];
        }

        if (isTestMode) {
            console.log("Using dummy faction member data for testing.");
            const dummyFactions = [
                { name: "JohnDoe", level: 10, strength: 10000, defense: 12000, speed: 9000, dexterity: 11000, total: 42000 },
                { name: "JaneSmith", level: 25, strength: 50000, defense: 45000, speed: 55000, dexterity: 60000, total: 210000 },
                { name: "AlphaWolf", level: 50, strength: 200000, defense: 220000, speed: 190000, dexterity: 210000, total: 820000 },
                { name: "BattleMaiden", level: 75, strength: 1000000, defense: 950000, speed: 1100000, dexterity: 1050000, total: 4100000 },
                { name: "HighRoller", level: 90, strength: 5000000, defense: 5100000, speed: 4900000, dexterity: 5200000, total: 20200000 },
                { name: "ElitePlayer", level: 99, strength: 20000000, defense: 21000000, speed: 19500000, dexterity: 20500000, total: 81000000 },
                { name: "Legendary", level: 100, strength: 50000000, defense: 52000000, speed: 48000000, dexterity: 51000000, total: 201000000 },
                { name: "Newbie", level: 1, strength: 10, defense: 10, speed: 10, dexterity: 10, total: 40 },
                { name: "MidTier", level: 40, strength: 150000, defense: 160000, speed: 140000, dexterity: 170000, total: 620000 },
                { name: "Prodigy", level: 85, strength: 10000000, defense: 10500000, speed: 9800000, dexterity: 10200000, total: 40500000 }
            ];
            return dummyFactions;
        }

        try {
            const factionApiUrl = `https://api.torn.com/faction/${factionId}?selections=basic&key=${apiKey}&comment=MyTornPA_FactionMembers`;
            console.log(`Fetching faction members from Torn API: ${factionApiUrl}`);
            const response = await fetch(factionApiUrl);
            const data = await response.json();

            if (data.error) {
                console.error("Torn API Error fetching faction members:", data.error.error);
                return [];
            }

            const members = data.members;
            const memberStats = [];

            for (const memberId in members) {
                const member = members[memberId];
                const stats = await fetchUserBattleStats(apiKey, memberId);
                
                let memberLevel = 0;
                try {
                    const userProfileResponse = await fetch(`https://api.torn.com/user/${memberId}?selections=profile&key=${apiKey}&comment=MyTornPA_MemberLevel`);
                    const userProfileData = await userProfileResponse.json();
                    if (!userProfileData.error && userProfileData.level) {
                        memberLevel = userProfileData.level;
                    }
                } catch (userError) {
                    console.warn(`Could not fetch level for user ${member.name} (${memberId}):`, userError);
                }

                memberStats.push({
                    name: member.name,
                    level: memberLevel,
                    strength: stats.strength,
                    defense: stats.defense,
                    speed: stats.speed,
                    dexterity: stats.dexterity,
                    total: stats.total
                });
            }
            memberStats.sort((a, b) => b.total - a.total);
            return memberStats;

        } catch (error) {
            console.error("Error fetching faction members with stats:", error);
            return [];
        }
    }

    function getLevelGradientOpacity(level) {
        const minLevel = 1;
        const maxLevel = 100;
        const clampedLevel = Math.min(Math.max(level, minLevel), maxLevel);
        return (clampedLevel - minLevel) / (maxLevel - minLevel);
    }

    async function displayFactionBattleStats(factionId, apiKey) {
        if (!factionBattleStatsTableBody) return;

        factionBattleStatsTableBody.innerHTML = '<tr><td colspan="7" class="text-placeholder-final">Loading faction battle stats...</td></tr>';

        if (!apiKey || !factionId || factionId === 0) {
            factionBattleStatsTableBody.innerHTML = '<tr><td colspan="7" class="specific-error-message">Cannot load battle stats: Missing Torn API Key, Torn Profile ID, or you are not in a faction.</td></tr>';
            return;
        }

        const membersWithStats = await fetchFactionMembersWithStats(factionId, apiKey);

        if (membersWithStats.length === 0) {
            factionBattleStatsTableBody.innerHTML = '<tr><td colspan="7" class="text-placeholder-final">No battle stats found for your faction members.</td></tr>';
            return;
        }

        factionBattleStatsTableBody.innerHTML = '';

        membersWithStats.forEach(member => {
            const row = document.createElement('tr');
            const gradientOpacity = getLevelGradientOpacity(member.level);

            row.innerHTML = `
                <td>${member.name}</td>
                <td class="level-cell" style="--gradient-opacity: ${gradientOpacity};"><span style="color: black;">${member.level}</span></td>
                <td>${formatNumberForDisplay(member.strength)}</td>
                <td>${formatNumberForDisplay(member.defense)}</td>
                <td>${formatNumberForDisplay(member.speed)}</td>
                <td>${formatNumberForDisplay(member.dexterity)}</td>
                <td>${formatNumberForDisplay(member.total)}</td>
            `;
            row.querySelector('.level-cell').style.setProperty('--gradient-opacity', gradientOpacity);
            factionBattleStatsTableBody.appendChild(row);
        });
    }

    function showProfileSetupModal() {
        if (profileSetupModal) { profileSetupModal.style.display = 'flex'; }
        else { console.error("profileSetupModal element not found!"); }
    }
    function hideProfileSetupModal() {
        if (profileSetupModal) {
            profileSetupModal.style.display = 'none';
            if(nameErrorEl) nameErrorEl.textContent='';
            if(profileSetupErrorEl) profileSetupErrorEl.textContent='';
        } else { console.error("profileSetupModal element not found!"); }
    }

    async function getFactionInfo(apiKey, tornProfileId) {
        if (!apiKey || !tornProfileId) {
            console.warn("API Key or Torn Profile ID missing, cannot fetch faction info.");
            return null;
        }
        try {
            const userApiUrl = `https://api.torn.com/user/${tornProfileId}?selections=profile&key=${apiKey}&comment=MyTornPA_FactionCheck`;
            console.log(`getFactionInfo: Fetching from Torn API: ${userApiUrl}`);
            const response = await fetch(userApiUrl);
            const data = await response.json();

            if (data.error) {
                console.error("Torn API Error fetching faction info:", data.error.error);
                return null;
            }

            if (data.faction && data.faction.faction_id && data.faction.faction_id !== 0) {
                console.log("getFactionInfo: Faction info found:", data.faction);
                return {
                    faction_id: data.faction.faction_id,
                    faction_name: data.faction.faction_name || 'Unknown Faction'
                };
            } else {
                console.log("getFactionInfo: User is not in a faction or faction ID is 0.");
                return null;
            }
        } catch (error) {
            console.error("getFactionInfo: Error fetching faction info:", error);
            return null;
        }
    }

    async function loadHubUserProfileData() {
        if (!currentUserId || !db) {
            if (hubFinalPreferredNameEl) hubFinalPreferredNameEl.textContent = 'N/A';
            if (hubFinalTornProfileIdEl) hubFinalTornProfileIdEl.textContent = 'N/A';
            console.log("loadHubUserProfileData: currentUserId or db is null. Cannot load profile.");
            return;
        }
        try {
            const doc = await db.collection('userProfiles').doc(currentUserId).get();
            if (doc.exists) {
                currentUserProfileData = doc.data();
                if (hubFinalPreferredNameEl) hubFinalPreferredNameEl.textContent = currentUserProfileData.preferredName || 'Not Set';
                if (hubFinalTornProfileIdEl) hubFinalTornProfileIdEl.textContent = currentUserProfileData.tornProfileId || 'Not Set';
                if (shareStatsToggleFinal) shareStatsToggleFinal.checked = !!currentUserProfileData.shareStatsWithFaction;
                if (lookingForFactionToggleFinal) lookingForFactionToggleFinal.checked = !!currentUserProfileData.isLookingForFaction;
                if (lookingForRecruitToggleFinal) lookingForRecruitToggleFinal.checked = !!currentUserProfileData.isLookingForRecruits;
                if (appearOnlineToggleFinal) appearOnlineToggleFinal.checked = currentUserProfileData.appearOnline !== undefined ? !!currentUserProfileData.appearOnline : true;
                console.log("loadHubUserProfileData: Successfully loaded User Profile Data:", currentUserProfileData);
            } else {
                currentUserProfileData = null;
                if (hubFinalPreferredNameEl) hubFinalPreferredNameEl.textContent = 'Setup Profile';
                if (hubFinalTornProfileIdEl) hubFinalTornProfileIdEl.textContent = 'Setup Profile';
                console.warn("loadHubUserProfileData: User profile document does not exist.");
            }
        } catch (error) {
            console.error("loadHubUserProfileData: Error loading hub user profile:", error);
        }
    }

    async function updateHubUserProfileSetting(settingKey, value) {
        if (!currentUserId || !db) { return; }
        try {
            await db.collection('userProfiles').doc(currentUserId).set({ [settingKey]: value, lastProfileUpdate: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
            console.log(`Hub Profile setting '${settingKey}' updated to: ${value}`);
            await loadHubUserProfileData();
            if (settingKey === 'appearOnline') {
                await updateUserOnlineStatus(value);
            }
        } catch (error) { console.error(`Error updating Hub Profile setting '${settingKey}':`, error); }
    }

    function setupToggleSwitch(checkboxElement, settingKey) {
        if (!checkboxElement) { return; }
        const switchContainer = checkboxElement.parentElement;
        if (switchContainer && switchContainer.classList.contains('hub-switch-final')) {
            switchContainer.addEventListener('click', (event) => {
                if (event.target !== checkboxElement) {
                    checkboxElement.checked = !checkboxElement.checked;
                    checkboxElement.dispatchEvent(new Event('change'));
                }
            });
        }
        checkboxElement.addEventListener('change', function() {
            updateHubUserProfileSetting(settingKey, this.checked);
        });
        if (currentUserProfileData && currentUserProfileData[settingKey] !== undefined) {
            checkboxElement.checked = !!currentUserProfileData[settingKey];
        } else if (settingKey === 'appearOnline' && (!currentUserProfileData || currentUserProfileData.appearOnline === undefined)) {
            checkboxElement.checked = true;
        }
    }

    function formatChatTimestamp(timestamp) {
        if (!timestamp) return '';
        if (timestamp.toDate) {
            const date = timestamp.toDate();
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' +
                    date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
        if (timestamp instanceof Date) {
            return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' +
                    timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
        return String(timestamp);
    }

    function displayChatMessage(messageData, chatContentEl) {
        if (!chatContentEl) {
            console.error("Chat content element not found for displaying messages.");
            return;
        }
        const messageEl = document.createElement('div');
        messageEl.classList.add('chat-message');
        if (messageData.senderId === currentUserId) {
            messageEl.classList.add('chat-message-own');
        } else {
            messageEl.classList.add('chat-message-other');
        }
        const senderName = messageData.senderName || 'Unknown User';
        const messageText = messageData.message || '';
        const timestamp = messageData.timestamp ? formatChatTimestamp(messageData.timestamp) : 'Just now';
        messageEl.innerHTML = `
            <span class="chat-sender-name">${senderName}</span>
            <span class="chat-time">${timestamp}</span>
            <p class="chat-text">${messageText}</p>
        `;
        chatContentEl.appendChild(messageEl);
        chatContentEl.scrollTop = chatContentEl.scrollHeight;
    }

    async function sendGlobalChatMessage() {
        if (!db || !currentUserId || !currentUserProfileData || !chatMessageInput || !globalChatContent) {
            console.warn("Cannot send message: Firebase DB, user, profile, or chat elements not ready.");
            return;
        }
        const message = chatMessageInput.value.trim();
        if (message.length === 0) return;
        const senderName = currentUserProfileData.preferredName || 'Anonymous';
        if (!senderName || senderName === 'Not Set' || nameBlocklist.includes(senderName.toLowerCase())) {
            alert("Please set a valid preferred name in your profile before chatting.");
            return;
        }
        try {
            await db.collection('globalChat').add({
                senderId: currentUserId,
                senderName: senderName,
                message: message,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            chatMessageInput.value = '';
            console.log("Global chat message sent successfully!");
        } catch (error) {
            console.error("Error sending global chat message:", error);
            alert("Failed to send message. Please try again.");
        }
    }

    function displayFactionChatMessage(messageData) {
        displayChatMessage(messageData, factionChatContent);
    }

    async function sendFactionChatMessage() {
        if (!db || !currentUserId || !currentUserProfileData || !chatMessageInput || !factionChatContent) {
            console.warn("Cannot send faction message: Firebase DB, user, profile, or chat elements not ready.");
            return;
        }
        const message = chatMessageInput.value.trim();
        if (message.length === 0) return;
        const profileComplete = currentUserProfileData.profileSetupComplete;
        const tornProfileId = currentUserProfileData.tornProfileId;
        const tornApiKey = currentUserProfileData.tornApiKey;
        const factionId = currentUserProfileData.factionId;
        const senderName = currentUserProfileData.preferredName;
        console.log(`sendFactionChatMessage (before send): profileComplete: ${profileComplete}, tornProfileId: ${tornProfileId}, tornApiKey: ${tornApiKey}, factionId: ${factionId}, senderName: ${senderName}`);
        if (!profileComplete || !tornProfileId || !tornApiKey || !factionId || factionId === 0 || !senderName || senderName === 'Not Set' || nameBlocklist.includes(senderName.toLowerCase())) {
            alert("To use Faction Chat, your profile must be fully set up with a preferred name, Torn API Key, Torn Profile ID, and you must belong to a faction.");
            chatMessageInput.value = '';
            return;
        }
        try {
            await db.collection('factionChats').doc(String(factionId)).collection('messages').add({
                senderId: currentUserId,
                senderName: senderName,
                message: message,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                factionId: factionId
            });
            chatMessageInput.value = '';
            console.log("Faction chat message sent successfully to faction:", factionId);
        } catch (error) {
            console.error("Error sending faction chat message:", error);
            alert("Failed to send faction message. Please try again.");
        }
    }

    function setupGlobalChatListener() {
        if (!db || !globalChatContent) {
            console.warn("Cannot set up global chat listener: Firebase DB or globalChatContent not ready.");
            return;
        }
        if (globalChatUnsub) { globalChatUnsub(); globalChatUnsub = null; }
        globalChatContent.innerHTML = '<p class="chat-system-message">Loading global messages...</p>';
        globalChatUnsub = db.collection('globalChat')
            .orderBy('timestamp')
            .limitToLast(50)
            .onSnapshot(snapshot => {
                globalChatContent.innerHTML = '';
                const messages = [];
                snapshot.forEach(doc => messages.push(doc.data()));
                messages.forEach(msg => displayChatMessage(msg, globalChatContent));
                globalChatContent.scrollTop = globalChatContent.scrollHeight;
            }, error => {
                console.error("Error listening to global chat:", error);
                globalChatContent.innerHTML = '<p class="chat-system-message">Error loading global chat messages.</p>';
            });
        console.log("Global chat listener active.");
    }

    function setupFactionChatListener() {
        if (!db || !factionChatContent || !currentUserId || !currentUserProfileData) {
            console.warn("Cannot set up faction chat listener: Firebase DB, content, or user profile not ready. Displaying fallback message.");
            if (factionChatContent) {
                factionChatContent.innerHTML = '<p class="chat-system-message">Please ensure your profile is fully set up.</p>';
            }
            return;
        }
        if (factionChatUnsub) { factionChatUnsub(); factionChatUnsub = null; console.log("Faction Chat: Unsubscribed previous listener."); }
        const factionId = currentUserProfileData.factionId;
        const profileComplete = currentUserProfileData.profileSetupComplete;
        const tornProfileId = currentUserProfileData.tornProfileId;
        const tornApiKey = currentUserProfileData.tornApiKey;
        console.log(`setupFactionChatListener: Attemping to set up listener for Faction ID: ${factionId}`);
        console.log(`  Profile Complete: ${profileComplete}, Torn Profile ID: ${tornProfileId}, Torn API Key: ${tornApiKey}`);
        if (!profileComplete || !tornProfileId || !tornApiKey || !factionId || factionId === 0) {
            factionChatContent.innerHTML = '<p class="chat-system-message">To use Faction Chat, your profile must be fully set up with a preferred name, Torn API Key, Torn Profile ID, and you must belong to a faction.</p>';
            console.warn("Faction Chat Listener NOT set up: Profile incomplete or not in faction.");
            return;
        }
        factionChatContent.innerHTML = `<p class="chat-system-message">Loading faction messages for ${currentUserProfileData.factionName || 'your faction'}...</p>`;
        factionChatUnsub = db.collection('factionChats').doc(String(factionId)).collection('messages')
            .orderBy('timestamp')
            .limitToLast(50)
            .onSnapshot(snapshot => {
                console.log("Faction Chat: New Snapshot Received (Faction Listener). Number of documents:", snapshot.docs.length);
                factionChatContent.innerHTML = '';
                if (snapshot.empty) {
                    factionChatContent.innerHTML = '<p class="chat-system-message">No faction messages yet. Be the first to say hi!</p>';
                }
                const messages = [];
                snapshot.forEach(doc => messages.push(doc.data()));
                messages.forEach(msg => {
                    console.log("Faction Chat: Displaying message:", msg);
                    displayFactionChatMessage(msg);
                });
                factionChatContent.scrollTop = factionChatContent.scrollHeight;
            }, error => {
                console.error("Error listening to faction chat:", error);
                let errorMessage = 'Error loading faction chat messages.';
                if (error.code === 'permission-denied') errorMessage += ' You may not have permission to view this chat.';
                else if (error.code === 'not-found') errorMessage += ' Faction chat not found or may not exist yet.';
                factionChatContent.innerHTML = `<p class="chat-system-message">${errorMessage}</p>`;
            });
        console.log(`Faction chat listener active for faction: ${factionId}`);
    }

    async function updateUserOnlineStatus(isOnline) {
        if (!db || !currentUserId || !currentUserProfileData) return;
        const userProfileRef = db.collection('userProfiles').doc(currentUserId);
        const presenceRef = db.collection('presence').doc(currentUserId);
        const userStatus = isOnline ? 'online' : 'offline';
        const lastSeen = firebase.firestore.FieldValue.serverTimestamp();
        try {
            await userProfileRef.set({
                appearOnline: isOnline,
                lastSeen: lastSeen,
                status: userStatus,
                preferredName: currentUserProfileData.preferredName || 'Anonymous'
            }, { merge: true });
            await presenceRef.set({
                userId: currentUserId,
                preferredName: currentUserProfileData.preferredName || 'Anonymous',
                status: userStatus,
                lastSeen: lastSeen,
                lastUpdate: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            console.log(`User ${currentUserId} status updated to: ${userStatus}`);
        } catch (error) {
            console.error("Error updating user online status:", error);
        }
    }

    async function addFriend(friendTornId) {
        if (!db || !currentUserId || !currentUserProfileData) {
            alert("System not ready to add friend. Please log in.");
            return;
        }
        if (!currentUserProfileData.preferredName || currentUserProfileData.preferredName === 'Not Set') {
            alert("Please set your Preferred Name in your profile before adding friends.");
            return;
        }
        const friendTornIdTrimmed = friendTornId.trim();
        if (!friendTornIdTrimmed) {
            alert("Please enter a Torn Profile ID.");
            return;
        }
        if (friendTornIdTrimmed === currentUserProfileData.tornProfileId) {
            alert("You cannot add yourself as a friend.");
            return;
        }
        try {
            const friendProfileQuery = await db.collection('userProfiles')
                .where('tornProfileId', '==', friendTornIdTrimmed)
                .limit(1)
                .get();
            if (friendProfileQuery.empty) {
                alert(`No user found with Torn Profile ID: ${friendTornIdTrimmed}. They might not use MyTornPA.`);
                return;
            }
            const friendDoc = friendProfileQuery.docs[0];
            const friendUserId = friendDoc.id;
            const friendData = friendDoc.data();
            const friendPreferredName = friendData.preferredName || `Torn ID: ${friendTornIdTrimmed}`;
            const existingFriendDoc = await db.collection('userProfiles').doc(currentUserId)
                .collection('friends').doc(friendUserId).get();
            if (existingFriendDoc.exists) {
                alert(`${friendPreferredName} is already on your friends list.`);
                return;
            }
            await db.collection('userProfiles').doc(currentUserId).collection('friends').doc(friendUserId).set({
                userId: friendUserId,
                tornProfileId: friendTornIdTrimmed,
                preferredName: friendPreferredName,
                addedOn: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessageTimestamp: null
            });
            await db.collection('userProfiles').doc(friendUserId).collection('friends').doc(currentUserId).set({
                userId: currentUserId,
                tornProfileId: currentUserProfileData.tornProfileId || 'Unknown',
                preferredName: currentUserProfileData.preferredName,
                addedOn: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessageTimestamp: null
            });
            alert(`${friendPreferredName} has been added to your friends list!`);
            if (friendIdInput) friendIdInput.value = '';
            loadFriendsList();
            loadRecentChats();
        } catch (error) {
            console.error("Error adding friend:", error);
            alert(`Failed to add friend: ${error.message}`);
        }
    }

    async function removeFriend(friendUserIdToRemove, friendName) {
        if (!db || !currentUserId) return;
        if (!confirm(`Are you sure you want to remove ${friendName} from your friends list?`)) {
            return;
        }
        try {
            await db.collection('userProfiles').doc(currentUserId)
                .collection('friends').doc(friendUserIdToRemove).delete();
            await db.collection('userProfiles').doc(friendUserIdToRemove)
                .collection('friends').doc(currentUserId).delete();
            alert(`${friendName} has been removed from your friends list.`);
            loadFriendsList();
            loadRecentChats();
            if (currentDmFriendId === friendUserIdToRemove) {
                currentDmFriendId = null;
                if(directMessageViewEl) directMessageViewEl.style.display = 'none';
                if(friendsInitialViewEl) friendsInitialViewEl.style.display = 'block';
            }
        } catch (error) {
            console.error("Error removing friend:", error);
            alert(`Failed to remove friend: ${error.message}`);
        }
    }

    async function blockFriend(friendUserIdToBlock, friendName) {
        if (!db || !currentUserId) return;
        if (!confirm(`Are you sure you want to block ${friendName}? Blocking will also remove them from your friends list and prevent future communication.`)) {
            return;
        }
        try {
            await removeFriend(friendUserIdToBlock, friendName);

            await db.collection('userProfiles').doc(currentUserId).collection('blockedUsers').doc(friendUserIdToBlock).set({
                userId: friendUserIdToBlock,
                preferredName: friendName,
                blockedOn: firebase.firestore.FieldValue.serverTimestamp()
            });

            alert(`${friendName} has been blocked.`);
            console.log(`User ${friendName} (${friendUserIdToBlock}) has been blocked by ${currentUserId}.`);

            loadFriendsList();
            loadRecentChats();
            if (currentDmFriendId === friendUserIdToBlock) {
                currentDmFriendId = null;
                if(directMessageViewEl) directMessageViewEl.style.display = 'none';
                if(friendsInitialViewEl) friendsInitialViewEl.style.display = 'block';
            }

        } catch (error) {
            console.error("Error blocking friend:", error);
            alert(`Failed to block friend: ${error.message}`);
        }
    }


    function renderFriendListItem(friendData, containerEl, isRecentChat = false, isManageModal = false) {
        if (!containerEl) return;
        const listItem = document.createElement('li');
        listItem.classList.add('friend-list-item');
        if (!friendData.isOnline) {
            listItem.classList.add('offline');
        }
        listItem.dataset.friendId = friendData.userId;
        listItem.dataset.friendName = friendData.preferredName;
        let lastMessageInfo = '';
        if (isRecentChat && friendData.lastMessageTimestamp) {
            const timestamp = formatChatTimestamp(friendData.lastMessageTimestamp);
            lastMessageInfo = `<span class="chat-time">${timestamp}</span>`;
        }
        let actionButtonsHtml = '';
        if (isManageModal) {
            actionButtonsHtml = `
                <div class="friend-actions">
                    <button class="btn btn-primary start-chat-btn">Chat</button>
                    <button class="btn btn-danger remove-friend-btn">Remove</button>
                    <button class="btn btn-warning block-friend-btn">Block</button>
                </div>
            `;
        }
        listItem.innerHTML = `
            <span class="friend-name-display">${friendData.preferredName || 'Unknown User'}</span>
            ${lastMessageInfo}
            <span class="friend-status-indicator ${friendData.isOnline ? 'online' : 'offline'}" title="${friendData.isOnline ? 'Online' : 'Offline'}"></span>
            ${actionButtonsHtml}
        `;
        const startChatBtn = listItem.querySelector('.start-chat-btn');
        const removeFriendBtnItem = listItem.querySelector('.remove-friend-btn');
        const blockFriendBtnItem = listItem.querySelector('.block-friend-btn');

        if (startChatBtn) {
            startChatBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (hubChatModal) {
                    hubChatModal.style.display = 'flex';
                    if (friendChatTabBtn) friendChatTabBtn.click();
                    startDirectMessage(friendData.userId, friendData.preferredName);
                } else {
                    console.warn('Chat modal not available to start DM.');
                    alert('Chat system is not fully loaded. Please try again.');
                }
            });
        }
        if (removeFriendBtnItem) {
            removeFriendBtnItem.addEventListener('click', (e) => {
                e.stopPropagation();
                removeFriend(friendData.userId, friendData.preferredName);
            });
        }
        if (blockFriendBtnItem) {
            blockFriendBtnItem.addEventListener('click', (e) => {
                e.stopPropagation();
                blockFriend(friendData.userId, friendData.preferredName);
            });
        }
        listItem.addEventListener('click', () => {
            if (!event.target.closest('button')) {
                if (hubChatModal) {
                    hubChatModal.style.display = 'flex';
                    if (friendChatTabBtn) friendChatTabBtn.click();
                    startDirectMessage(friendData.userId, friendData.preferredName);
                } else {
                    console.warn('Chat modal not available to start DM.');
                    alert('Chat system is not fully loaded. Please try again.');
                }
            }
        });
        containerEl.appendChild(listItem);
    }

    function loadFriendsList() {
        if (!db || !currentUserId) return;
        if (friendsListUnsub) { friendsListUnsub(); friendsListUnsub = null; }
        
        if (fullFriendsListEl) {
            fullFriendsListEl.innerHTML = '<li><p class="chat-system-message">Loading friends list...</p></li>';
        }
        if (fullFriendsListInManageModal) {
            fullFriendsListInManageModal.innerHTML = '<li><p class="chat-system-message">Loading friends list...</p></li>';
        }

        let onlineCount = 0;
        if (isTestMode) {
            const dummyFriends = [
                { userId: "dummyFriend1", preferredName: "TestUserA", isOnline: true, tornProfileId: "12345" },
                { userId: "dummyFriend2", preferredName: "OfflineDude", isOnline: false, tornProfileId: "67890" },
                { userId: "dummyFriend3", preferredName: "OnlinePal", isOnline: true, tornProfileId: "11223" },
                { userId: "dummyFriend4", preferredName: "BusyBee", isOnline: false, tornProfileId: "44556" },
                { userId: "dummyFriend5", preferredName: "GeminiBot", isOnline: true, tornProfileId: "00001" }
            ];
            
            if (fullFriendsListEl) fullFriendsListEl.innerHTML = '';
            if (fullFriendsListInManageModal) fullFriendsListInManageModal.innerHTML = '';

            onlineCount = 0;
            dummyFriends.forEach(friend => {
                if (friend.isOnline) onlineCount++;
                if (fullFriendsListEl) renderFriendListItem(friend, fullFriendsListEl, false, false);
                if (fullFriendsListInManageModal) renderFriendListItem(friend, fullFriendsListInManageModal, false, true);
            });
            if(friendsOnlineCountFinal) friendsOnlineCountFinal.textContent = onlineCount.toString();
            console.log("Friends list loaded with dummy data for both displays.");
            return;
        }
        friendsListUnsub = db.collection('userProfiles').doc(currentUserId).collection('friends')
            .orderBy('preferredName')
            .onSnapshot(async snapshot => {
                if (fullFriendsListEl) fullFriendsListEl.innerHTML = '';
                if (fullFriendsListInManageModal) fullFriendsListInManageModal.innerHTML = '';

                onlineCount = 0;
                if (snapshot.empty) {
                    const message = '<li><p class="chat-system-message">No friends added yet. Add some above!</p></li>';
                    if (fullFriendsListEl) fullFriendsListEl.innerHTML = message;
                    if (fullFriendsListInManageModal) fullFriendsListInManageModal.innerHTML = message;
                    if(friendsOnlineCountFinal) friendsOnlineCountFinal.textContent = '0';
                    return;
                }
                const friendPromises = snapshot.docs.map(async doc => {
                    const friend = doc.data();
                    const presenceDoc = await db.collection('presence').doc(friend.userId).get();
                    const isOnline = presenceDoc.exists && presenceDoc.data().status === 'online' &&
                                     (Date.now() - presenceDoc.data().lastUpdate.toDate().getTime() < 300000);
                    if (isOnline) onlineCount++;
                    return { ...friend, isOnline };
                });
                const friends = await Promise.all(friendPromises);
                friends.forEach(friend => {
                    if (fullFriendsListEl) renderFriendListItem(friend, fullFriendsListEl, false, false);
                    if (fullFriendsListInManageModal) renderFriendListItem(friend, fullFriendsListInManageModal, false, true);
                });
                if(friendsOnlineCountFinal) friendsOnlineCountFinal.textContent = onlineCount.toString();
            }, error => {
                console.error("Error loading friends list:", error);
                const errorMessage = '<li><p class="chat-system-message">Error loading friends list.</p></li>';
                if (fullFriendsListEl) fullFriendsListEl.innerHTML = errorMessage;
                if (fullFriendsListInManageModal) fullFriendsListInManageModal.innerHTML = errorMessage;
                if(friendsOnlineCountFinal) friendsOnlineCountFinal.textContent = 'N/A';
            });
        console.log("Friends list listener active.");
    }

    function loadRecentChats() {
        if (!db || !currentUserId) return;
        if (recentChatsUnsub) { recentChatsUnsub(); recentChatsUnsub = null; }
        
        if (recentChatsListEl) {
            recentChatsListEl.innerHTML = '<li><p class="chat-system-message">Loading recent chats...</p></li>';
        }
        if (recentChatsListInManageModal) {
            recentChatsListInManageModal.innerHTML = '<li><p class="chat-system-message">Loading recent chats...</p></li>';
        }

        if (isTestMode) {
            const dummyRecentChats = [
                { userId: "dummyFriend5", preferredName: "GeminiBot", isOnline: true, lastMessageTimestamp: new Date(Date.now() - 60000) },
                { userId: "dummyFriend1", preferredName: "TestUserA", isOnline: true, lastMessageTimestamp: new Date(Date.now() - 3600000) },
                { userId: "dummyFriend2", preferredName: "OfflineDude", isOnline: false, lastMessageTimestamp: new Date(Date.now() - 86400000) }
            ];
            if (recentChatsListEl) recentChatsListEl.innerHTML = '';
            if (recentChatsListInManageModal) recentChatsListInManageModal.innerHTML = '';

            dummyRecentChats.forEach(chat => {
                if (recentChatsListEl) renderFriendListItem(chat, recentChatsListEl, true, false);
                if (recentChatsListInManageModal) renderFriendListItem(chat, recentChatsListInManageModal, true, true);
            });
            console.log("Recent chats loaded with dummy data for both displays.");
            return;
        }
        recentChatsUnsub = db.collection('userProfiles').doc(currentUserId).collection('friends')
            .where('lastMessageTimestamp', '!=', null)
            .orderBy('lastMessageTimestamp', 'desc')
            .limit(10)
            .onSnapshot(async snapshot => {
                if (recentChatsListEl) recentChatsListEl.innerHTML = '';
                if (recentChatsListInManageModal) recentChatsListInManageModal.innerHTML = '';

                if (snapshot.empty) {
                    const message = '<li><p class="chat-system-message">No recent chats.</p></li>';
                    if (recentChatsListEl) recentChatsListEl.innerHTML = message;
                    if (recentChatsListInManageModal) recentChatsListInManageModal.innerHTML = message;
                    return;
                }
                const chatPromises = snapshot.docs.map(async doc => {
                    const friend = doc.data();
                    const presenceDoc = await db.collection('presence').doc(friend.userId).get();
                    const isOnline = presenceDoc.exists && presenceDoc.data().status === 'online' &&
                                     (Date.now() - presenceDoc.data().lastUpdate.toDate().getTime() < 300000);
                    return { ...friend, isOnline };
                });
                const recentFriends = await Promise.all(chatPromises);
                recentFriends.forEach(friend => {
                    if (recentChatsListEl) renderFriendListItem(friend, recentChatsListEl, true, false);
                    if (recentChatsListInManageModal) renderFriendListItem(friend, recentChatsListInManageModal, true, true);
                });
            }, error => {
                console.error("Error loading recent chats:", error);
                const errorMessage = '<li><p class="chat-system-message">Error loading recent chats.</p></li>';
                if (recentChatsListEl) recentChatsListEl.innerHTML = errorMessage;
                if (recentChatsListInManageModal) recentChatsListInManageModal.innerHTML = errorMessage;
            });
        console.log("Recent chats listener active.");
    }

    async function startDirectMessage(friendUserId, friendName) {
        if (!db || !currentUserId || !directMessageViewEl || !dmMessagesAreaEl || !dmOpponentNameEl) return;
        if (dmChatUnsub) { dmChatUnsub(); dmChatUnsub = null; }
        currentDmFriendId = friendUserId;
        friendsInitialViewEl.style.display = 'none';
        directMessageViewEl.style.display = 'block';
        dmOpponentNameEl.textContent = `Chat with ${friendName}`;
        dmMessagesAreaEl.innerHTML = '<p class="chat-system-message">Loading direct messages...</p>';
        if (isTestMode) {
            const dummyDMMessages = [
                { senderId: "dummyFriend5", senderName: "GeminiBot", message: "Hey there!", timestamp: new Date(Date.now() - 120000) },
                { senderId: currentUserId, senderName: currentUserProfileData?.preferredName || "You", message: "Hi Gemini! How are you?", timestamp: new Date(Date.now() - 60000) },
                { senderId: "dummyFriend5", senderName: "GeminiBot", message: "I'm doing great, thanks for asking! This is dummy data, by the way.", timestamp: new Date(Date.now() - 30000) }
            ];
            dmMessagesAreaEl.innerHTML = '';
            dummyDMMessages.forEach(msg => displayChatMessage(msg, dmMessagesAreaEl));
            dmMessagesAreaEl.scrollTop = dmMessagesAreaEl.scrollHeight;
            console.log("DM chat loaded with dummy data.");
            return;
        }
        const chatDocId = currentUserId < friendUserId ? `${currentUserId}_${friendUserId}` : `${friendUserId}_${currentUserId}`;
        dmChatUnsub = db.collection('privateChats').doc(chatDocId).collection('messages')
            .orderBy('timestamp')
            .limit(50)
            .onSnapshot(snapshot => {
                dmMessagesAreaEl.innerHTML = '';
                if (snapshot.empty) {
                    dmMessagesAreaEl.innerHTML = '<p class="chat-system-message">No messages yet. Say hello!</p>';
                }
                snapshot.forEach(doc => displayChatMessage(doc.data(), dmMessagesAreaEl));
                dmMessagesAreaEl.scrollTop = dmMessagesAreaEl.scrollHeight;
            }, error => {
                console.error("Error listening to direct messages:", error);
                dmMessagesAreaEl.innerHTML = '<p class="chat-system-message">Error loading direct messages.</p>';
            });
        console.log(`Direct message listener active for chat with ${friendName} (${friendUserId}).`);
    }

    async function sendDirectMessage() {
        if (!db || !currentUserId || !currentDmFriendId || !chatMessageInput || !dmMessagesAreaEl) {
            console.warn("Cannot send DM: System not ready or no active DM chat.");
            return;
        }
        const message = chatMessageInput.value.trim();
        if (message.length === 0) return;
        const senderName = currentUserProfileData.preferredName || 'Anonymous';
        const chatDocId = currentUserId < currentDmFriendId ? `${currentUserId}_${currentDmFriendId}` : `${friendUserId}_${currentUserId}`;
        try {
            await db.collection('privateChats').doc(chatDocId).collection('messages').add({
                senderId: currentUserId,
                senderName: senderName,
                message: message,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            const messageTimestamp = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('userProfiles').doc(currentUserId).collection('friends').doc(currentDmFriendId).update({
                lastMessageTimestamp: messageTimestamp
            });
            await db.collection('userProfiles').doc(currentDmFriendId).collection('friends').doc(currentUserId).update({
                lastMessageTimestamp: messageTimestamp
            });
            chatMessageInput.value = '';
            console.log(`DM sent to ${currentDmFriendId}`);
        } catch (error) {
            console.error("Error sending direct message:", error);
            alert("Failed to send direct message.");
        }
    }

    function showChatModal(chatTypeToShow = 'global', initialFriendsView = null) {
        if (!(hubChatModal && chatTabsContainer && globalChatTabBtn && factionChatTabBtn && friendChatTabBtn &&
              globalChatContent && factionChatContent && friendChatContent &&
              chatMessageInput && sendChatMessageBtn)) {
            console.error("Chat modal core components missing.");
            alert("Error: Chat components missing.");
            return;
        }
        hubChatModal.style.display = 'flex';
        [globalChatTabBtn, factionChatTabBtn, friendChatTabBtn].forEach(btn => btn.classList.remove('active'));
        [globalChatContent, factionChatContent, friendChatContent].forEach(content => content.classList.remove('active'));
        if (friendsInitialViewEl) friendsInitialViewEl.style.display = 'none';
        if (directMessageViewEl) directMessageViewEl.style.display = 'none';
        if (globalChatUnsub) { globalChatUnsub(); globalChatUnsub = null; }
        if (factionChatUnsub) { factionChatUnsub(); factionChatUnsub = null; }
        if (friendsListUnsub) { friendsListUnsub(); friendsListUnsub = null; }
        if (recentChatsUnsub) { recentChatsUnsub(); recentChatsUnsub = null; }
        if (dmChatUnsub) { dmChatUnsub(); dmChatUnsub = null; }
        currentDmFriendId = null;
        let tabToActivateBtn = globalChatTabBtn;
        let contentToActivateArea = globalChatContent;
        if (chatTypeToShow === 'faction') {
            tabToActivateBtn = factionChatTabBtn;
            contentToActivateArea = factionChatContent;
            factionChatContent.innerHTML = `<p class="chat-system-message">Checking profile for faction chat access...</p>`;
            loadHubUserProfileData().then(() => setupFactionChatListener()).catch(error => {
                console.error("Error loading profile data before setting up faction chat:", error);
                factionChatContent.innerHTML = '<p class="chat-system-message">Failed to load profile for faction chat. Please try again.</p>';
            });
        } else if (chatTypeToShow === 'friends') {
            tabToActivateBtn = friendChatTabBtn;
            contentToActivateArea = friendChatContent;
            if (friendsInitialViewEl) {
                friendsInitialViewEl.style.display = 'block';
                directMessageViewEl.style.display = 'none';
                loadRecentChats();
                loadFriendsList();
            }
        } else {
            setupGlobalChatListener();
        }
        if (tabToActivateBtn) tabToActivateBtn.classList.add('active');
        if (contentToActivateArea) contentToActivateArea.classList.add('active');
    }

    function closeChatModal() {
        if (hubChatModal) hubChatModal.style.display = 'none';
        if (globalChatUnsub) { globalChatUnsub(); globalChatUnsub = null; }
        if (factionChatUnsub) { factionChatUnsub(); factionChatUnsub = null; }
        if (friendsListUnsub) { friendsListUnsub(); friendsListUnsub = null; }
        if (recentChatsUnsub) { recentChatsUnsub(); recentChatsUnsub = null; }
        if (dmChatUnsub) { dmChatUnsub(); dmChatUnsub = null; }
        currentDmFriendId = null;
    }

    async function displayUserFactionInfo(tabToShow = 'general') {
        if (!factionInfoModal || !factionInfoModalTitleEl || !generalInfoContent || !factionInfoTabsContainer || !generalInfoTabBtn || !battleStatsTabBtn || !factionBattleStatsContent) {
            console.error("Faction Info modal core elements NOT FOUND!");
            alert("Error: Faction Info modal structure is missing.");
            return;
        }

        factionInfoModalTitleEl.textContent = "Faction Info";
        factionInfoModal.style.display = 'flex';

        [generalInfoTabBtn, battleStatsTabBtn].forEach(btn => btn.classList.remove('active'));
        [generalInfoContent, factionBattleStatsContent].forEach(content => content.classList.remove('active'));

        if (tabToShow === 'general') {
            generalInfoTabBtn.classList.add('active');
            generalInfoContent.classList.add('active');
            
            if (!currentUserProfileData || !currentUserProfileData.factionId || currentUserProfileData.factionId === 0) {
                generalInfoContent.innerHTML = "<p>You are not currently in a faction or your profile needs to be updated with your Torn API key and ID.</p>";
            } else {
                const factionID = currentUserProfileData.factionId;
                const factionName = currentUserProfileData.factionName || "Unknown Faction";
                generalInfoContent.innerHTML = `
                    <p><strong>Faction Name:</strong> ${factionName}</p>
                    <p><strong>Faction ID:</strong> ${factionID}</p>
                    <p><em>(More faction details can be added here with Torn API integration)</em></p>
                `;
            }
        } else if (tabToShow === 'battlestats') {
            battleStatsTabBtn.classList.add('active');
            factionBattleStatsContent.classList.add('active');
            if (!currentUserProfileData || !currentUserProfileData.tornApiKey || !currentUserProfileData.tornProfileId || !currentUserProfileData.factionId || currentUserProfileData.factionId === 0) {
                factionBattleStatsTableBody.innerHTML = '<tr><td colspan="7" class="specific-error-message">To view faction battle stats, please ensure your profile is fully set up with your Torn API Key and Torn Profile ID, and you are in a faction.</td></tr>';
            } else {
                await displayFactionBattleStats(currentUserProfileData.factionId, currentUserProfileData.tornApiKey);
            }
        }
    }

    function displayFactionsPage() {
        if (!recruitingFactionsList || !factionPageInfo || !prevFactionPageBtn || !nextFactionPageBtn) return;

        recruitingFactionsList.innerHTML = '';

        const factionsToDisplay = currentlyDisplayedFactions.length > 0 ? currentlyDisplayedFactions : allRecruitingFactionsData;

        if (factionsToDisplay.length === 0) {
            recruitingFactionsList.innerHTML = '<li class="text-placeholder-final">No factions currently recruiting or data not loaded.</li>';
            if (factionPaginationControls) factionPaginationControls.style.display = 'none';
            return;
        }
        
        if (factionPaginationControls) factionPaginationControls.style.display = 'block';


        const startIndex = (currentFactionPage - 1) * factionsPerPage;
        const endIndex = startIndex + factionsPerPage;
        const paginatedFactions = factionsToDisplay.slice(startIndex, endIndex);

        paginatedFactions.forEach(faction => {
            const factionItem = document.createElement('li');
            factionItem.classList.add('recruiting-faction-item');
            factionItem.innerHTML = `
                <h5>${faction.name}</h5>
                <p>Total Respect:<strong> ${formatNumberForDisplay(faction.totalRespect)}</strong></p>
                <p>Members:<strong> ${faction.members}/${faction.maxMembers}</strong></p>
                <a href="https://www.torn.com/factions.php?action=join&ID=${faction.id}" target="_blank" rel="noopener noreferrer" class="apply-link">Apply Now!</a>
            `;
            recruitingFactionsList.appendChild(factionItem);
        });

        const totalPages = Math.ceil(factionsToDisplay.length / factionsPerPage);
        factionPageInfo.textContent = `Page ${currentFactionPage} of ${totalPages}`;

        prevFactionPageBtn.disabled = currentFactionPage === 1;
        nextFactionPageBtn.disabled = currentFactionPage === totalPages || totalPages === 0;
    }


    async function loadRecruitingFactions() {
        if (!recruitingFactionsList) return;
        recruitingFactionsList.innerHTML = '<li class="text-placeholder-final">Loading recruiting factions...</li>';
        allRecruitingFactionsData = [];
        currentFactionPage = 1;

        if (isTestMode) {
            const dummyFactions = [
            { id: 100, name: "The Elite Crew of Torn City", totalRespect: 15000000, members: 75, maxMembers: 100, level: "Gold" },
            { id: 101, name: "Shadow Syndicate", totalRespect: 8000000, members: 50, maxMembers: 75, level: "Silver" },
            { id: 102, name: "Warriors of Everlasting Light", totalRespect: 19500000, members: 100, maxMembers: 100, level: "Platinum" },
            { id: 103, name: "Mercenary Guild", totalRespect: 5000000, members: 30, maxMembers: 50, level: "Bronze" },
            { id: 104, name: "Nightfall Brigade", totalRespect: 12000000, members: 60, maxMembers: 90, level: "Gold" },
            { id: 105, name: "Dragons Horde", totalRespect: 9500000, members: 40, maxMembers: 60, level: "Silver" },
            { id: 106, name: "Steel Phalanx Division X", totalRespect: 18000000, members: 85, maxMembers: 100, level: "Platinum" },
            { id: 107, name: "Crimson Raiders", totalRespect: 7000000, members: 25, maxMembers: 50, level: "Bronze" },
            { id: 108, name: "Void Walkers", totalRespect: 13000000, members: 65, maxMembers: 80, level: "Gold" },
            { id: 109, name: "Serpent's Coil", totalRespect: 6000000, members: 35, maxMembers: 70, level: "Silver" },
            { id: 110, name: "Ironclad Legion of Doom", totalRespect: 20000000, members: 90, maxMembers: 100, level: "Platinum" },
            { id: 111, name: "Phoenix Ascendant", totalRespect: 10000000, members: 55, maxMembers: 75, level: "Gold" },
            { id: 112, name: "Gryphon Knights", totalRespect: 16000000, members: 80, maxMembers: 100, level: "Platinum" },
            { id: 113, name: "Wraith Protocol", totalRespect: 4000000, members: 20, maxMembers: 40, level: "Bronze" },
            { id: 114, name: "Titan Corps Omega", totalRespect: 18500000, members: 95, maxMembers: 100, level: "Platinum" },
            { id: 115, name: "Solar Sentinels", totalRespect: 14000000, members: 70, maxMembers: 90, level: "Gold" },
            { id: 116, name: "Lunar Legionnaires United", totalRespect: 11000000, members: 45, maxMembers: 65, level: "Silver" },
            { id: 117, name: "Starlight Vanguards", totalRespect: 19000000, members: 88, maxMembers: 100, level: "Platinum" },
            { id: 118, name: "Nebula Nomads", totalRespect: 3000000, members: 15, maxMembers: 30, level: "Bronze" },
            { id: 119, name: "Comet Crusaders Prime", totalRespect: 17000000, members: 82, maxMembers: 100, level: "Platinum" },
            { id: 120, name: "Galaxy Guardians", totalRespect: 19800000, members: 98, maxMembers: 100, level: "Platinum" },
            { id: 121, name: "Cosmic Coalition", totalRespect: 1000000, members: 10, maxMembers: 25, level: "Bronze" },
            { id: 122, name: "Astral Alliance", totalRespect: 2500000, members: 18, maxMembers: 35, level: "Bronze" },
            { id: 123, name: "Meteor Mercs", totalRespect: 3500000, members: 22, maxMembers: 45, level: "Bronze" },
            { id: 124, name: "Blackhole Brigade", totalRespect: 17500000, members: 99, maxMembers: 100, level: "Platinum" }
            ];
            allRecruitingFactionsData = dummyFactions;
            currentlyDisplayedFactions = [...allRecruitingFactionsData];
            console.log("Recruiting factions loaded with dummy data for pagination test.");
        } else {
            try {
                const snapshot = await db.collection('recruitingFactions')
                    .get();

                if (snapshot.empty) {
                    console.log("No factions currently recruiting from Firestore.");
                } else {
                    snapshot.forEach(doc => {
                        allRecruitingFactionsData.push({ id: doc.id, ...doc.data() });
                    });
                    currentlyDisplayedFactions = [...allRecruitingFactionsData];
                    console.log("Recruiting factions loaded from Firestore.");
                }
            } catch (error) {
                console.error("Error loading recruiting factions from Firestore:", error);
                recruitingFactionsList.innerHTML = '<li class="specific-error-message">Error loading recruiting factions.</li>';
                if (factionPaginationControls) factionPaginationControls.style.display = 'none';
                return;
            }
        }
        displayFactionsPage();
        if (factionPaginationControls) {
            factionPaginationControls.style.display = currentlyDisplayedFactions.length > 0 ? 'block' : 'none';
        }
    }


    async function displayOnTheHuntView(isUpdate = false) {
        console.log("displayOnTheHuntView called.");
        if (!onTheHuntModal || !onTheHuntModalBody || !recruitingFactionsList) {
            console.error("CRITICAL: 'On The Hunt' modal HTML elements NOT FOUND.");
            alert("Error: The 'On The Hunt' modal structure is missing.");
            return;
        }
        onTheHuntModal.style.display = 'flex';
        if (!isUpdate || allRecruitingFactionsData.length === 0) {
            await loadRecruitingFactions();
        } else {
            displayFactionsPage();
        }

        if (filterMinRespectSlider && filterMinRespectValue) {
            filterMinRespectSlider.max = respectSteps.length - 1;
            const savedIndex = parseInt(localStorage.getItem('filterMinRespectIndex') || '0');
            filterMinRespectSlider.value = savedIndex;
            filterMinRespectValue.textContent = formatNumberForDisplay(respectSteps[savedIndex]);

            filterMinRespectSlider.oninput = () => {
                const currentIndex = parseInt(filterMinRespectSlider.value);
                filterMinRespectValue.textContent = formatNumberForDisplay(respectSteps[currentIndex]);
                localStorage.setItem('filterMinRespectIndex', currentIndex);
            };
        }
        if (filterMinMembersSlider && filterMinMembersValue) {
            filterMinMembersSlider.value = localStorage.getItem('filterMinMembers') || filterMinMembersSlider.min;
            filterMinMembersValue.textContent = filterMinMembersSlider.value;
            filterMinMembersSlider.oninput = () => {
                filterMinMembersValue.textContent = filterMinMembersSlider.value;
                localStorage.setItem('filterMinMembers', filterMinMembersSlider.value);
            };
        }
        const savedTiers = JSON.parse(localStorage.getItem('filterTiers')) || [];
        [filterTierBronze, filterTierSilver, filterTierGold, filterTierPlatinum].forEach(checkbox => {
            if (checkbox) {
                checkbox.checked = savedTiers.includes(checkbox.value);
                checkbox.onchange = () => {
                    const currentTiers = JSON.parse(localStorage.getItem('filterTiers')) || [];
                    const newTiers = checkbox.checked
                        ? [...currentTiers, checkbox.value]
                        : currentTiers.filter(tier => tier !== checkbox.value);
                    localStorage.setItem('filterTiers', JSON.stringify(newTiers));
                };
            }
        });
    }

function applyAllFilters() {
    if (!filterMinRespectSlider || !filterMinMembersSlider || !filterTierBronze) {
        console.error("Filter input elements not all found for applyAllFilters.");
        return;
    }

    const minRespectIndex = parseInt(filterMinRespectSlider.value);
    const minRespect = respectSteps[minRespectIndex];

    const minMembers = parseInt(filterMinMembersSlider.value) || 0;
    
    const selectedTiers = [filterTierBronze, filterTierSilver, filterTierGold, filterTierPlatinum]
                                .filter(checkbox => checkbox && checkbox.checked)
                                .map(checkbox => checkbox.value);

    currentlyDisplayedFactions = allRecruitingFactionsData.filter(faction => {
        const respectMatch = faction.totalRespect >= minRespect;
        const membersMatch = faction.members >= minMembers;
        
        const levelMatch = selectedTiers.length === 0 || (faction.level && selectedTiers.includes(faction.level));

        return respectMatch && membersMatch && levelMatch;
    });

    currentFactionPage = 1; 
    displayFactionsPage();

    if (factionPaginationControls) {
        factionPaginationControls.style.display = currentlyDisplayedFactions.length > 0 ? 'block' : 'none';
    }
}

function resetAllFilters() {
    if (!filterMinRespectSlider || !filterMinMembersSlider || !filterTierBronze) {
        console.error("Filter input elements not all found for resetAllFilters.");
        return;
    }

    filterMinRespectSlider.value = 0;
    if(filterMinRespectValue) filterMinRespectValue.textContent = formatNumberForDisplay(respectSteps[0]);
    localStorage.removeItem('filterMinRespectIndex');

    filterMinMembersSlider.value = filterMinMembersSlider.min;
    if(filterMinMembersValue) filterMinMembersValue.textContent = filterMinMembersSlider.value;
    localStorage.removeItem('filterMinMembers');

    [filterTierBronze, filterTierSilver, filterTierGold, filterTierPlatinum].forEach(checkbox => {
        if (checkbox) checkbox.checked = false;
    });
    localStorage.removeItem('filterTiers');

    currentlyDisplayedFactions = [...allRecruitingFactionsData];
    currentFactionPage = 1;
    displayFactionsPage();

    if (factionPaginationControls) {
       factionPaginationControls.style.display = currentlyDisplayedFactions.length > 0 ? 'block' : 'none';
    }
}

async function displayLeadershipView() {
    console.log("displayLeadershipView called.");
    if (!leadershipPanelModal || !leadershipPanelModalBody || !lookingForFactionsList) {
        console.error("CRITICAL: 'Leadership View' modal HTML elements NOT FOUND.");
        alert("Error: The 'Leadership View' modal structure is missing.");
        return;
    }

    leadershipPanelModal.style.display = 'flex';
    await loadLookingForFactionUsers();

    if (leadershipFilterMaxLevelSlider && leadershipFilterMaxLevelValue) {
        leadershipFilterMaxLevelSlider.value = localStorage.getItem('leadershipFilterMaxLevel') || leadershipFilterMaxLevelSlider.max;
        leadershipFilterMaxLevelValue.textContent = leadershipFilterMaxLevelSlider.value;
        leadershipFilterMaxLevelSlider.oninput = () => {
            leadershipFilterMaxLevelValue.textContent = leadershipFilterMaxLevelSlider.value;
            localStorage.setItem('leadershipFilterMaxLevel', leadershipFilterMaxLevelSlider.value);
        };
    }

    if (leadershipFilterTotalBattlestatsSlider && leadershipFilterTotalBattlestatsValue) {
        leadershipFilterTotalBattlestatsSlider.max = battlestatsSteps.length - 1;
        const savedIndex = parseInt(localStorage.getItem('leadershipFilterTotalBattlestatsIndex') || '0');
        leadershipFilterTotalBattlestatsSlider.value = savedIndex;
        leadershipFilterTotalBattlestatsValue.textContent = formatNumberForDisplay(battlestatsSteps[savedIndex]);

        leadershipFilterTotalBattlestatsSlider.oninput = () => {
            const currentIndex = parseInt(leadershipFilterTotalBattlestatsSlider.value);
            leadershipFilterTotalBattlestatsValue.textContent = formatNumberForDisplay(battlestatsSteps[currentIndex]);
            localStorage.setItem('leadershipFilterTotalBattlestatsIndex', currentIndex);
        };
    }
}


async function loadLookingForFactionUsers() {
    if (!lookingForFactionsList || !db) return;
    lookingForFactionsList.innerHTML = '<li class="text-placeholder-final">Loading players looking for factions...</li>';
    allLookingForFactionUsersData = [];
    currentLeadershipPage = 1;

    if (isTestMode) {
        const dummyUsers = [
            { userId: "player1", preferredName: "TestUserAlpha", tornProfileId: "123456", level: 50, strength: 1000000, defense: 1200000, speed: 900000, dexterity: 1100000, totalBattlestats: 4200000, isLookingForFaction: true },
            { userId: "player2", preferredName: "BattleKing", tornProfileId: "789012", level: 90, strength: 30000000, defense: 35000000, speed: 40000000, dexterity: 45000000, totalBattlestats: 150000000, isLookingForFaction: true },
            { userId: "player3", preferredName: "NewbieP", tornProfileId: "345678", level: 12, strength: 20000, defense: 25000, speed: 15000, dexterity: 20000, totalBattlestats: 80000, isLookingForFaction: true },
            { userId: "player4", preferredName: "MidTierGuy", tornProfileId: "901234", level: 75, strength: 5000000, defense: 6000000, speed: 7000000, dexterity: 7000000, totalBattlestats: 25000000, isLookingForFaction: true },
            { userId: "player5", preferredName: "XanAddict", tornProfileId: "567890", level: 99, strength: 120000000, defense: 130000000, speed: 125000000, dexterity: 125000000, totalBattlestats: 500000000, isLookingForFaction: true },
            { userId: "player6", preferredName: "LowStats", tornProfileId: "112233", level: 30, strength: 250000, defense: 300000, speed: 350000, dexterity: 300000, totalBattlestats: 1200000, isLookingForFaction: true },
            { userId: "player7", preferredName: "HighLevel", tornProfileId: "445566", level: 100, strength: 180000000, defense: 190000000, speed: 190000000, dexterity: 190000000, totalBattlestats: 750000000, isLookingForFaction: true },
            { userId: "player8", preferredName: "CasualPlayer", tornProfileId: "778899", level: 40, strength: 700000, defense: 750000, speed: 800000, dexterity: 750000, totalBattlestats: 3000000, isLookingForFaction: true },
            { userId: "player9", preferredName: "Grinder", tornProfileId: "000000", level: 95, strength: 450000000, defense: 500000000, speed: 550000000, dexterity: 500000000, totalBattlestats: 2000000000, isLookingForFaction: true },
            { userId: "player10", preferredName: "QuickJoin", tornProfileId: "987654", level: 25, strength: 100000, defense: 150000, speed: 120000, dexterity: 130000, totalBattlestats: 500000, isLookingForFaction: true },
            { userId: "player11", preferredName: "Veteran", tornProfileId: "123123", level: 100, strength: 2500000000, defense: 2500000000, speed: 2500000000, dexterity: 2500000000, totalBattlestats: 10000000000, isLookingForFaction: true },
            { userId: "player12", preferredName: "FreshStart", tornProfileId: "456456", level: 10, strength: 10000, defense: 15000, speed: 10000, dexterity: 15000, totalBattlestats: 50000, isLookingForFaction: true },
            { userId: "player13", preferredName: "LookingForFun", tornProfileId: "789789", level: 60, strength: 2000000, defense: 2500000, speed: 2800000, dexterity: 2700000, totalBattlestats: 10000000, isLookingForFaction: true },
            { userId: "player14", preferredName: "ActiveSeeker", tornProfileId: "012012", level: 85, strength: 18000000, defense: 20000000, speed: 21000000, dexterity: 21000000, totalBattlestats: 80000000, isLookingForFaction: true },
            { userId: "player15", preferredName: "DailyPlayer", tornProfileId: "345345", level: 70, strength: 9000000, defense: 10000000, speed: 10500000, dexterity: 10500000, totalBattlestats: 40000000, isLookingForFaction: true }
        ];
        allLookingForFactionUsersData = dummyUsers;
        currentlyDisplayedUsers = [...allLookingForFactionUsersData];
        console.log("Looking for faction users loaded with dummy data.");
    } else {
        try {
            const snapshot = await db.collection('userProfiles')
                .where('isLookingForFaction', '==', true)
                .get();

            const userPromises = snapshot.docs.map(async doc => {
                const userData = doc.data();
                const tornProfileId = userData.tornProfileId;
                const tornApiKey = currentUserProfileData ? currentUserProfileData.tornApiKey : null;
                let totalBattlestats = 0;
                let userLevel = userData.level || 1;

                if (tornProfileId && tornApiKey) {
                    const stats = await fetchUserBattleStats(tornApiKey, tornProfileId);
                    totalBattlestats = stats.total;
                    
                    const userProfileResponse = await fetch(`https://api.torn.com/user/${tornProfileId}?selections=profile&key=${tornApiKey}`);
                    const userProfileData = await userProfileResponse.json();
                    if (!userProfileData.error && userProfileData.level) {
                        userLevel = userProfileData.level;
                    }

                } else {
                    console.warn(`User ${userData.preferredName} (${userData.userId}) is looking for faction but unable to fetch live stats (missing leader API key or user Torn ID).`);
                }

                return {
                    userId: doc.id,
                    preferredName: userData.preferredName || `TornID: ${tornProfileId || 'N/A'}`,
                    tornProfileId: tornProfileId,
                    level: userLevel,
                    totalBattlestats: totalBattlestats,
                    isLookingForFaction: true
                };
            });
            allLookingForFactionUsersData = await Promise.all(userPromises);
            currentlyDisplayedUsers = [...allLookingForFactionUsersData];
            console.log("Looking for faction users loaded from Firestore.");
        } catch (error) {
            console.error("Error loading users looking for factions from Firestore:", error);
            lookingForFactionsList.innerHTML = '<li class="specific-error-message">Error loading players. Ensure leader\'s API key is valid.</li>';
            if (leadershipPaginationControls) leadershipPaginationControls.style.display = 'none';
            return;
        }
    }
    displayLookingForFactionUsersPage();
    if (leadershipPaginationControls) {
        leadershipPaginationControls.style.display = currentlyDisplayedUsers.length > 0 ? 'block' : 'none';
    }
}

function displayLookingForFactionUsersPage() {
    if (!lookingForFactionsList || !leadershipPageInfo || !prevLeadershipPageBtn || !nextLeadershipPageBtn) return;

    lookingForFactionsList.innerHTML = '';

    const usersToDisplay = currentlyDisplayedUsers.length > 0 ? currentlyDisplayedUsers : allLookingForFactionUsersData;

    if (usersToDisplay.length === 0) {
        lookingForFactionsList.innerHTML = '<li class="text-placeholder-final">No players currently looking for factions based on filters.</li>';
        if (leadershipPaginationControls) leadershipPaginationControls.style.display = 'none';
        return;
    }
    
    if (leadershipPaginationControls) leadershipPaginationControls.style.display = 'block';

    const startIndex = (currentLeadershipPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    const paginatedUsers = usersToDisplay.slice(startIndex, endIndex);

    paginatedUsers.forEach(user => {
        const userItem = document.createElement('li');
        userItem.classList.add('looking-for-faction-item');
        userItem.innerHTML = `
            <h5>${user.preferredName}</h5>
            <p>Level:<strong> ${user.level}</strong></p>
            <p>Total Stats:<strong> ${formatNumberForDisplay(user.totalBattlestats)}</strong></p>
            <a href="https://www.torn.com/profiles.php?XID=${user.tornProfileId}" target="_blank" rel="noopener noreferrer" class="interested-link">Interested?</a>
        `;
        lookingForFactionsList.appendChild(userItem);
    });

    const totalPages = Math.ceil(usersToDisplay.length / usersPerPage);
    leadershipPageInfo.textContent = `Page ${currentLeadershipPage} of ${totalPages}`;

    prevLeadershipPageBtn.disabled = currentLeadershipPage === 1;
    nextLeadershipPageBtn.disabled = currentLeadershipPage === totalPages || totalPages === 0;
}


function applyLeadershipFilters() {
    if (!leadershipFilterMaxLevelSlider || !leadershipFilterTotalBattlestatsSlider) {
        console.error("Leadership filter input elements not all found for applyLeadershipFilters.");
        return;
    }

    const maxLevel = parseInt(leadershipFilterMaxLevelSlider.value) || 100;
    const minBattlestatsIndex = parseInt(leadershipFilterTotalBattlestatsSlider.value);
    const minBattlestats = battlestatsSteps[minBattlestatsIndex];

    currentlyDisplayedUsers = allLookingForFactionUsersData.filter(user => {
        const levelMatch = user.level <= maxLevel;
        const battlestatsMatch = user.totalBattlestats >= minBattlestats;
        
        return levelMatch && battlestatsMatch;
    });

    currentLeadershipPage = 1;
    displayLookingForFactionUsersPage();

    if (leadershipPaginationControls) {
        leadershipPaginationControls.style.display = currentlyDisplayedUsers.length > 0 ? 'block' : 'none';
    }
}

function resetLeadershipFilters() {
    if (!leadershipFilterMaxLevelSlider || !leadershipFilterTotalBattlestatsSlider) {
        console.error("Leadership filter input elements not all found for resetLeadershipFilters.");
        return;
    }

    leadershipFilterMaxLevelSlider.value = leadershipFilterMaxLevelSlider.max;
    if(leadershipFilterMaxLevelValue) leadershipFilterMaxLevelValue.textContent = leadershipFilterMaxLevelSlider.max;
    localStorage.removeItem('leadershipFilterMaxLevel');

    leadershipFilterTotalBattlestatsSlider.value = 0;
    if(leadershipFilterTotalBattlestatsValue) leadershipFilterTotalBattlestatsValue.textContent = formatNumberForDisplay(battlestatsSteps[0]);
    localStorage.removeItem('leadershipFilterTotalBattlestatsIndex');

    currentlyDisplayedUsers = [...allLookingForFactionUsersData];
    currentLeadershipPage = 1;
    displayLookingForFactionUsersPage();

    if (leadershipPaginationControls) {
        leadershipPaginationControls.style.display = currentlyDisplayedUsers.length > 0 ? 'block' : 'none';
    }
}

    // REMOVED: usefulLinksBtn and headerContactUsBtn event listeners (now in globalheader.js)
    // REMOVED: window click listener for dropdowns (now in globalheader.js)

    setupButtonListener(closePersonalStatsDialogBtn, "Close Personal Stats", () => { if(personalStatsModal) personalStatsModal.style.display = 'none'; });
    setupButtonListener(skipProfileSetupBtn, "Skip Profile Setup", hideProfileSetupModal);
    setupButtonListener(closeProfileModalBtn, "Close Profile Modal", hideProfileSetupModal);
    // headerEditProfileBtn: This button is in the header, but its function (showProfileSetupModal) is in social.js.
    // The listener for it needs to be in globalheader.js, but it will call showProfileSetupModal from social.js.
    // This requires globalheader.js to have access to showProfileSetupModal, which can be done by making it global or passing it.
    // For simplicity, let's keep its direct listener here in social.js, as it pertains to content unique to social.js.
    // HOWEVER, the visibility of headerEditProfileBtn is managed by globalheader.js.
    if (headerEditProfileBtn) {
        headerEditProfileBtn.addEventListener('click', showProfileSetupModal);
    }


    setupButtonListener(saveProfileBtn, "Save Profile", async () => {
        if (!currentUserId || !db) {
            profileSetupErrorEl.textContent = "Error: User not authenticated or database not ready.";
            console.error("Save Profile: currentUserId or db is null.");
            return;
        }
        nameErrorEl.textContent = ''; profileSetupErrorEl.textContent = '';
        const preferredName = preferredNameInput.value.trim();
        const tornApiKey = profileSetupApiKeyInput.value.trim();
        const tornProfileId = profileSetupProfileIdInput.value.trim();
        const shareStats = shareFactionStatsModalToggle.checked;
        if (preferredName.length === 0) { nameErrorEl.textContent = "Preferred name is required!"; console.warn("Save Profile: Preferred name is empty."); return; }
        if (preferredName.length > 10) { nameErrorEl.textContent = "Preferred name max 10 characters."; console.warn("Save Profile: Preferred name too long."); return; }
        if (nameBlocklist.includes(preferredName.toLowerCase())) { nameErrorEl.textContent = "Invalid preferred name. Please choose another."; console.warn("Save Profile: Preferred name is blocklisted."); return; }
        let updateData = {
            preferredName: preferredName,
            shareStatsWithFaction: shareStats,
            profileSetupComplete: true,
            lastProfileUpdate: firebase.firestore.FieldValue.serverTimestamp()
        };
        if (tornProfileId) updateData.tornProfileId = tornProfileId; else updateData.tornProfileId = firebase.firestore.FieldValue.delete();
        if (tornApiKey) updateData.tornApiKey = tornApiKey; else updateData.tornApiKey = firebase.firestore.FieldValue.delete();
        let factionInfo = null;
        if (tornApiKey && tornProfileId) {
            console.log("Save Profile: Attempting to fetch faction info during profile save...");
            factionInfo = await getFactionInfo(tornApiKey, tornProfileId);
            if (factionInfo) {
                updateData.factionId = factionInfo.faction_id;
                updateData.factionName = factionInfo.faction_name;
            } else {
                updateData.factionId = 0;
                updateData.factionName = firebase.firestore.FieldValue.delete();
            }
        } else {
            updateData.factionId = 0;
            updateData.factionName = firebase.firestore.FieldValue.delete();
        }
        try {
            await db.collection('userProfiles').doc(currentUserId).set(updateData, { merge: true });
            console.log("Save Profile: Profile data saved successfully to Firestore!");
            hideProfileSetupModal();
            await loadHubUserProfileData();
            setupToggleSwitch(shareStatsToggleFinal, 'shareStatsWithFaction');
            setupToggleSwitch(lookingForFactionToggleFinal, 'isLookingForFaction');
            setupToggleSwitch(lookingForRecruitToggleFinal, 'isLookingForRecruits');
            setupToggleSwitch(appearOnlineToggleFinal, 'appearOnline');
            console.log("Save Profile: UI elements and toggle switches re-initialized with new profile data.");
        } catch (error) {
            console.error("Save Profile: Error saving profile:", error);
            profileSetupErrorEl.textContent = `Error saving profile: ${error.message}`;
        }
    });

    setupButtonListener(closeChatModalButton, "Close Chat Modal", closeChatModal);
    setupButtonListener(hubActionGlobalChatBtn, "Global Chat Button", () => showChatModal('global'));
    setupButtonListener(hubActionFactionChatBtn, "Faction Chat Button", () => showChatModal('faction'));
    setupButtonListener(hubActionFriendsChatBtn, "Friends Chat Button", () => showChatModal('friends', 'showRecentsAndList'));
    
    setupButtonListener(viewFriendsBtnHub, "Manage Friends List Button", () => {
        if (manageFriendsModal) manageFriendsModal.style.display = 'flex';
        if (fullFriendsListInManageModal) {
            fullFriendsListInManageModal.innerHTML = '<li><p class="chat-system-message">Loading friends list...</p></li>';
        }
        if (recentChatsListInManageModal) {
            recentChatsListInManageModal.innerHTML = '<li><p class="chat-system-message">Loading recent chats...</p></li>';
        }
        loadFriendsList();
        loadRecentChats();
    });

    if (closeManageFriendsModalBtn) {
        closeManageFriendsModalBtn.addEventListener('click', () => {
            if (manageFriendsModal) manageFriendsModal.style.display = 'none';
            if (fullFriendsListInManageModal) {
                fullFriendsListInManageModal.innerHTML = '<li><p class="text-placeholder-final">Friend list loading or empty.</p></li>';
            }
            if (recentChatsListInManageModal) {
                recentChatsListInManageModal.innerHTML = '<li><p class="text-placeholder-final">No recent chats.</p></li>';
            }
        });
    }

    if (addFriendBtn && friendIdInput) {
        addFriendBtn.addEventListener('click', async () => {
            const friendTornId = friendIdInput.value;
            await addFriend(friendTornId);
        });
    }

// Event Listeners for Faction Filters (On The Hunt)
    if (toggleFiltersBtn && filterOptions && filterArrowIcon) {
        toggleFiltersBtn.addEventListener('click', () => {
            const isHidden = filterOptions.style.display === 'none';
            filterOptions.style.display = isHidden ? 'flex' : 'none';
            filterArrowIcon.innerHTML = isHidden ? '&#9650;' : '&#9660;';
            localStorage.setItem('filtersHidden', !isHidden);
        });
    }

    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyAllFilters);
    }

    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetAllFilters);
    }

    if (filterMinRespectSlider && filterMinRespectValue) {
        filterMinRespectSlider.addEventListener('input', () => {
            const displayedValue = respectSteps[parseInt(filterMinRespectSlider.value)];
            filterMinRespectValue.textContent = formatNumberForDisplay(displayedValue);
        });
    }
    if (filterMinMembersSlider && filterMinMembersValue) {
        filterMinMembersSlider.addEventListener('input', () => {
            filterMinMembersValue.textContent = filterMinMembersSlider.value;
        });
    }
    [filterTierBronze, filterTierSilver, filterTierGold, filterTierPlatinum].forEach(checkbox => {
        if (checkbox) {
            checkbox.addEventListener('change', applyAllFilters);
        }
    });

    if (chatTabsContainer) {
      chatTabsContainer.addEventListener('click', (event) => {
        const clickedTab = event.target.closest('.chat-tab-button');
        if (!clickedTab || clickedTab.classList.contains('active')) return;
        console.log(`Chat Tabs: Clicking tab: ${clickedTab.id}`);
        if (globalChatUnsub) { globalChatUnsub(); globalChatUnsub = null; console.log("Chat Tabs: Unsubscribed global chat."); }
        if (factionChatUnsub) { factionChatUnsub(); factionChatUnsub = null; console.log("Chat Tabs: Unsubscribed faction chat."); }
        if (friendsListUnsub) { friendsListUnsub(); friendsListUnsub = null; console.log("Chat Tabs: Unsubscribed friends list."); }
        if (recentChatsUnsub) { recentChatsUnsub(); recentChatsUnsub = null; console.log("Chat Tabs: Unsubscribed recent chats."); }
        if (dmChatUnsub) { dmChatUnsub(); dmChatUnsub = null; console.log("Chat Tabs: Unsubscribed DM chat."); }
        currentDmFriendId = null;
        document.querySelectorAll('#chatTabsContainer .chat-tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.chat-content-wrapper > .chat-messages-area').forEach(content => content.classList.remove('active'));
        clickedTab.classList.add('active');
        const targetContentEl = document.getElementById(clickedTab.dataset.target);
        if (targetContentEl) targetContentEl.classList.add('active');
        if (clickedTab.dataset.target === 'friendChatContent') {
            if (friendsInitialViewEl) {
                friendsInitialViewEl.style.display = 'block';
                if (directMessageViewEl) directMessageViewEl.style.display = 'none';
                loadRecentChats();
                loadFriendsList();
            }
        } else if (friendsInitialViewEl && directMessageViewEl) {
            friendsInitialViewEl.style.display = 'none';
            directMessageViewEl.style.display = 'none';
        }
        if (clickedTab.id === 'globalChatTabBtn') {
            if(globalChatContent) globalChatContent.innerHTML = '<p class="chat-system-message">Loading global messages...</p>';
            setupGlobalChatListener();
        } else if (clickedTab.id === 'factionChatTabBtn') {
            if(factionChatContent) factionChatContent.innerHTML = `<p class="chat-system-message">Checking profile for faction chat access...</p>`;
            loadHubUserProfileData().then(() => setupFactionChatListener()).catch(error => {
                console.error("Chat Tabs: Error loading profile data before setting up faction chat:", error);
                if(factionChatContent) factionChatContent.innerHTML = '<p class="chat-system-message">Failed to load profile for faction chat. Please try again.</p>';
            });
        }
      });
    }

    if (sendChatMessageBtn && chatMessageInput) {
        const sendMessage = () => {
            const activeTab = chatTabsContainer ? chatTabsContainer.querySelector('.chat-tab-button.active') : null;
            if (activeTab) {
                if (activeTab.id === 'globalChatTabBtn') sendGlobalChatMessage();
                else if (activeTab.id === 'factionChatTabBtn') sendFactionChatMessage();
                else if (activeTab.id === 'friendChatTabBtn' && currentDmFriendId) sendDirectMessage();
            }
        };
        sendChatMessageBtn.addEventListener('click', sendMessage);
        chatMessageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); sendMessage(); }
        });
    }

    setupButtonListener(hubActionFactionInfoBtn, "Faction Info Button", () => displayUserFactionInfo('general'));
    setupButtonListener(closeFactionInfoModalBtn, "Close Faction Info Modal", () => { if (factionInfoModal) factionInfoModal.style.display = 'none'; });
    if (factionInfoModal) factionInfoModal.addEventListener('click', (e) => { if (e.target === factionInfoModal) factionInfoModal.style.display = 'none'; });

    if (factionInfoTabsContainer) {
        factionInfoTabsContainer.addEventListener('click', (event) => {
            const clickedTab = event.target.closest('.faction-info-tab-button');
            if (!clickedTab || clickedTab.classList.contains('active')) return;

            const targetTab = clickedTab.dataset.target;
            displayUserFactionInfo(targetTab === 'factionBattleStatsContent' ? 'battlestats' : 'general');
        });
    }

    setupButtonListener(hubActionLeadershipViewBtn, "Leadership View Button", displayLeadershipView);
    setupButtonListener(hubActionOnTheHuntViewBtn, "On The Hunt View Button", () => displayOnTheHuntView(false));

    setupButtonListener(closeLeadershipPanelModalBtn, "Close Leadership Panel Modal", () => { if(leadershipPanelModal) leadershipPanelModal.style.display = 'none';});
    if(leadershipPanelModal) leadershipPanelModal.addEventListener('click', (e) => { if(e.target === leadershipPanelModal) leadershipPanelModal.style.display = 'none';});
    
    setupButtonListener(closeOnTheHuntModalBtn, "Close On The Hunt Modal", () => { if(onTheHuntModal) onTheHuntModal.style.display = 'none';});
    if(onTheHuntModal) onTheHuntModal.addEventListener('click', (e) => { if(e.target === onTheHuntModal) onTheHuntModal.style.display = 'none';});
    
    if (prevFactionPageBtn) {
        prevFactionPageBtn.addEventListener('click', () => {
            if (currentFactionPage > 1) {
                currentFactionPage--;
                displayFactionsPage();
            }
        });
    }
    if (nextFactionPageBtn) {
        nextFactionPageBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(currentlyDisplayedFactions.length / factionsPerPage);
            if (currentFactionPage < totalPages) {
                currentFactionPage++;
                displayFactionsPage();
            }
        });
    }

    if (applyLeadershipFiltersBtn) {
        applyLeadershipFiltersBtn.addEventListener('click', applyLeadershipFilters);
    }
    if (resetLeadershipFiltersBtn) {
        resetLeadershipFiltersBtn.addEventListener('click', resetLeadershipFilters);
    }
    if (leadershipFilterMaxLevelSlider && leadershipFilterMaxLevelValue) {
        leadershipFilterMaxLevelSlider.addEventListener('input', () => {
            leadershipFilterMaxLevelValue.textContent = leadershipFilterMaxLevelSlider.value;
        });
    }
    if (leadershipFilterTotalBattlestatsSlider && leadershipFilterTotalBattlestatsValue) {
        leadershipFilterTotalBattlestatsSlider.addEventListener('input', () => {
            const displayedValue = battlestatsSteps[parseInt(leadershipFilterTotalBattlestatsSlider.value)];
            leadershipFilterTotalBattlestatsValue.textContent = formatNumberForDisplay(displayedValue);
        });
    }

    if (prevLeadershipPageBtn) {
        prevLeadershipPageBtn.addEventListener('click', () => {
            if (currentLeadershipPage > 1) {
                currentLeadershipPage--;
                displayLookingForFactionUsersPage();
            }
        });
    }
    if (nextLeadershipPageBtn) {
        nextLeadershipPageBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(currentlyDisplayedUsers.length / usersPerPage);
            if (currentLeadershipPage < totalPages) {
                currentLeadershipPage++;
                displayLookingForFactionUsersPage();
            }
        });
    }

    setupButtonListener(closeAccessSettingsModalBtn, "Close Access Settings Modal", () => { if (accessSettingsModal) accessSettingsModal.style.display = 'none'; });
    if (accessSettingsModal) accessSettingsModal.addEventListener('click', (e) => { if (e.target === accessSettingsModal) accessSettingsModal.style.display = 'none'; });
    setupButtonListener(saveViewerAccessBtn, "Save Viewer Access Button", async () => {});

    // REMOVED: auth.onAuthStateChanged listener and updateUserOnlineStatus (now in globalheader.js)
    // The social.js script should NOT manage general user auth state or header button visibility.
    // However, it STILL NEEDS `auth` and `db` to be initialized, which firebase-init.js handles.
    // And it needs currentUserProfileData, which loadHubUserProfileData will get.

    // If social.js requires currentUserProfileData on load, you might need an initial call
    // or rely on a Firebase listener if it's the *only* thing that should trigger it.
    // For now, I'm removing the global onAuthStateChanged from social.js to centralize it in globalheader.js.
    // This means functions like loadHubUserProfileData() will need to be called explicitly
    // when a user is confirmed logged in (e.g., from globalheader.js if it fully initializes social.js).

    // Since showProfileSetupModal() is called by headerEditProfileBtn, and its listener is now in social.js,
    // this setup is okay. However, if other parts of social.js relied on onAuthStateChanged to
    // *enable* features, that logic will need to be re-evaluated.

    // For now, I am going to put a simple immediate check for a logged-in user to populate data
    // assuming globalheader.js will handle the visual states.
    if (typeof auth !== 'undefined' && auth.currentUser) {
        currentUserId = auth.currentUser.uid;
        // Proceed to load profile data if user is already logged in when social.js runs
        loadHubUserProfileData();
        updateUserOnlineStatus(true); // Ensure online status is set even if globalheader.js also does it
    } else if (typeof auth !== 'undefined') {
        // If not logged in, but auth is available, set up listener for when they *do* log in.
        auth.onAuthStateChanged(function(user) {
            if (user) {
                currentUserId = user.uid;
                loadHubUserProfileData();
                updateUserOnlineStatus(true);
                setupGlobalChatListener(); // Start global chat only when user is known to be logged in
            } else {
                currentUserId = null;
                currentUserProfileData = null;
                // Clear chat listeners if user logs out while on this page
                if (globalChatUnsub) { globalChatUnsub(); globalChatUnsub = null; }
                if (factionChatUnsub) { factionChatUnsub(); factionChatUnsub = null; }
                if (friendsListUnsub) { friendsListUnsub(); friendsListUnsub = null; }
                if (recentChatsUnsub) { recentChatsUnsub(); recentChatsUnsub = null; }
                if (dmChatUnsub) { dmChatUnsub(); dmChatUnsub = null; }
                currentDmFriendId = null;
                // No need for redirection logic here, globalheader.js handles it.
            }
        });
    }


    window.addEventListener('beforeunload', async () => {
        if (currentUserId && currentUserProfileData && currentUserProfileData.appearOnline) {
            await updateUserOnlineStatus(false);
        }
    });

    console.log("social.js: End of script.");
});