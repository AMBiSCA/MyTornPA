// mysite/js/social.js - Main script for The Hub page functionalities.
// Header button visibility and dropdowns are handled by globalheader.js.
// This script manages the visibility and data loading for the Hub page itself.
document.addEventListener('DOMContentLoaded', function() {
    console.log("social.js: DOMContentLoaded event fired. The Hub is loading!");

    let isAdminMode = false;
    let isTestMode = true; // << CHANGE THIS TO 'false' TO SEE LIVE DATA / NEW UI IN LEADERSHIP PANEL

    let db = null;
    let auth = null; // Will be assigned from global Firebase object
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
    const usersPerPage = 12;
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

    let globalChatUnsub = null;
    let factionChatUnsub = null;
    let friendChatUnsub = null;
    let friendsListUnsub = null;
    let recentChatsUnsub = null;
    let dmChatUnsub = null;

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
    const theHubMainUi = document.getElementById('theHubMainUi'); // The main content container for the Hub
    
    const homeButtonFooter = document.getElementById('homeButtonFooter');

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
    const factionChatTabBtn = document = document.getElementById('factionChatTabBtn');
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
    if (theHubMainUi) theHubMainUi.style.display = 'none'; // Initially hidden
    if (homeButtonFooter) homeButtonFooter.style.display = 'inline-block'; // This is a footer button


    // --- Core Initialization Function for The Hub Content (Now internal to social.js's logic) ---
    // This function will be called once the user's authentication status is confirmed.
    async function initializeHubContent(user) {
        if (!user) {
            console.log("initializeHubContent: No user object received, cannot initialize content.");
            if (theHubMainUi) theHubMainUi.style.display = 'none'; // Keep hidden if no user
            return;
        }

        currentUserId = user.uid;
        console.log("initializeHubContent: User is signed in. Initializing social hub content...");

        const profileComplete = await loadHubUserProfileData(); // Load profile and get completion status

        if (!profileComplete) {
            console.log("initializeHubContent: User profile is incomplete. Showing profile setup modal.");
            if (theHubMainUi) theHubMainUi.style.display = 'none'; // Ensure hidden if profile incomplete
            showProfileSetupModal(); // Prompt user to complete profile
            return;
        }

        // If profile is complete, display the main UI and load all dynamic content
        if (theHubMainUi) theHubMainUi.style.display = 'grid'; // Make main content visible

        // Setup toggle switches based on loaded data
        setupToggleSwitch(shareStatsToggleFinal, 'shareStatsWithFaction');
        setupToggleSwitch(lookingForFactionToggleFinal, 'isLookingForFaction');
        setupToggleSwitch(lookingForRecruitToggleFinal, 'isLookingForRecruits');
        setupToggleSwitch(appearOnlineToggleFinal, 'appearOnline');

        // Update user online status
        updateUserOnlineStatus(true);

        // Load all initial dynamic content
        setupGlobalChatListener();
        loadFriendsList();
        loadRecentChats();
        
        console.log("initializeHubContent: All core social hub content initialization complete.");
    };


    // --- General Utility for attaching listeners ---
    function setupButtonListener(buttonEl, buttonName, callback) {
        if (buttonEl) {
            console.log(`Attaching listener to: ${buttonName} (ID: ${buttonEl.id || 'N/A'})`);
            buttonEl.addEventListener('click', callback);
        }
    }

    // --- API & Data Fetching Functions ---
    async function fetchUserBattleStats(apiKey, userId) { /* ... (unchanged) ... */ return { strength: 0, defense: 0, speed: 0, dexterity: 0, total: 0, error: "Error" }; }
    async function fetchFactionMembersWithStats(factionId, apiKey) { /* ... (unchanged) ... */ return []; }
    function getLevelGradientOpacity(level) { /* ... (unchanged) ... */ return 0; }
    async function displayFactionBattleStats(factionId, apiKey) { /* ... (unchanged) ... */ }
    async function getFactionInfo(apiKey, tornProfileId) { /* ... (unchanged) ... */ return null; }

    // MODIFIED: loadHubUserProfileData now updates UI, and *also* returns profile completion status
    async function loadHubUserProfileData() {
        if (!currentUserId || !db) {
            if (hubFinalPreferredNameEl) hubFinalPreferredNameEl.textContent = 'N/A';
            if (hubFinalTornProfileIdEl) hubFinalTornProfileIdEl.textContent = 'N/A';
            console.log("loadHubUserProfileData: currentUserId or db is null. Cannot load profile.");
            return false; // Indicate failure
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
                return !!currentUserProfileData.profileSetupComplete; // Return profile completion status
            } else {
                currentUserProfileData = null;
                if (hubFinalPreferredNameEl) hubFinalPreferredNameEl.textContent = 'Setup Profile';
                if (hubFinalTornProfileIdEl) hubFinalTornProfileIdEl.textContent = 'Setup Profile';
                console.warn("loadHubUserProfileData: User profile document does not exist.");
                return false; // Indicate failure
            }
        } catch (error) {
            console.error("loadHubUserProfileData: Error loading hub user profile:", error);
            return false; // Indicate failure
        }
    }

    async function updateHubUserProfileSetting(settingKey, value) { /* ... (unchanged) ... */ }
    function setupToggleSwitch(checkboxElement, settingKey) { /* ... (unchanged) ... */ }
    function formatChatTimestamp(timestamp) { /* ... (unchanged) ... */ return ''; }
    function displayChatMessage(messageData, chatContentEl) { /* ... (unchanged) ... */ }
    async function sendGlobalChatMessage() { /* ... (unchanged) ... */ }
    function displayFactionChatMessage(messageData) { /* ... (unchanged) ... */ }
    async function sendFactionChatMessage() { /* ... (unchanged) ... */ }
    function setupGlobalChatListener() { /* ... (unchanged) ... */ }
    function setupFactionChatListener() { /* ... (unchanged) ... */ }
    async function updateUserOnlineStatus(isOnline) { /* ... (unchanged) ... */ }
    async function addFriend(friendTornId) { /* ... (unchanged) ... */ }
    async function removeFriend(friendUserIdToRemove, friendName) { /* ... (unchanged) ... */ }
    async function blockFriend(friendUserIdToBlock, friendName) { /* ... (unchanged) ... */ }
    function renderFriendListItem(friendData, containerEl, isRecentChat = false, isManageModal = false) { /* ... (unchanged) ... */ }
    function loadFriendsList() { /* ... (unchanged) ... */ }
    function loadRecentChats() { /* ... (unchanged) ... */ }
    function startDirectMessage(friendUserId, friendName) { /* ... (unchanged) ... */ }
    async function sendDirectMessage() { /* ... (unchanged) ... */ }
    function showChatModal(chatTypeToShow = 'global', initialFriendsView = null) { /* ... (unchanged) ... */ }
    function closeChatModal() { /* ... (unchanged) ... */ }
    async function displayUserFactionInfo(tabToShow = 'general') { /* ... (unchanged) ... */ }
    function displayFactionsPage() { /* ... (unchanged) ... */ }
    async function loadRecruitingFactions() { /* ... (unchanged) ... */ }
    function applyAllFilters() { /* ... (unchanged) ... */ }
    function resetAllFilters() { /* ... (unchanged) ... */ }
    async function displayLeadershipView() { /* ... (unchanged) ... */ }
    async function loadLookingForFactionUsers() { /* ... (unchanged) ... */ }
    function displayLookingForFactionUsersPage() { /* ... (unchanged) ... */ }
    function applyLeadershipFilters() { /* ... (unchanged) ... */ }
    function resetLeadershipFilters() { /* ... (unchanged) ... */ }


    // --- EVENT LISTENER ATTACHMENTS (for social.js specific elements) ---
    // The headerEditProfileBtn's click listener remains here as it calls a function defined in social.js
    if (headerEditProfileBtn) {
        headerEditProfileBtn.addEventListener('click', showProfileSetupModal);
    }

    setupButtonListener(closePersonalStatsDialogBtn, "Close Personal Stats", () => { if(personalStatsModal) personalStatsModal.style.display = 'none'; });
    setupButtonListener(skipProfileSetupBtn, "Skip Profile Setup", hideProfileSetupModal);
    setupButtonListener(closeProfileModalBtn, "Close Profile Modal", hideProfileSetupModal);

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
            // After saving, re-initialize the hub content to reflect changes and load data
            if (auth.currentUser) { // Use auth.currentUser here
                initializeHubContent(auth.currentUser); // Call the internal initialization
            }
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

    if (chatTabsContainer) { /* ... (unchanged chat tab logic) ... */ }
    if (sendChatMessageBtn && chatMessageInput) { /* ... (unchanged chat send logic) ... */ }

    setupButtonListener(hubActionFactionInfoBtn, "Faction Info Button", () => displayUserFactionInfo('general'));
    setupButtonListener(closeFactionInfoModalBtn, "Close Faction Info Modal", () => { if (factionInfoModal) factionInfoModal.style.display = 'none'; });
    if (factionInfoModal) factionInfoModal.addEventListener('click', (e) => { if (e.target === factionInfoModal) factionInfoModal.style.display = 'none'; });

    if (factionInfoTabsContainer) { /* ... (unchanged faction info tabs logic) ... */ }

    setupButtonListener(hubActionLeadershipViewBtn, "Leadership View Button", displayLeadershipView);
    setupButtonListener(hubActionOnTheHuntViewBtn, "On The Hunt View Button", () => displayOnTheHuntView(false));

    setupButtonListener(closeLeadershipPanelModalBtn, "Close Leadership Panel Modal", () => { if(leadershipPanelModal) leadershipPanelModal.style.display = 'none';});
    if(leadershipPanelModal) leadershipPanelModal.addEventListener('click', (e) => { if(e.target === leadershipPanelModal) leadershipPanelModal.style.display = 'none';});
    
    setupButtonListener(closeOnTheHuntModalBtn, "Close On The Hunt Modal", () => { if(onTheHuntModal) onTheHuntModal.style.display = 'none';});
    if(onTheHuntModal) onTheHuntModal.addEventListener('click', (e) => { if(e.target === onTheHuntModal) onTheHuntModal.style.display = 'none';});
    
    if (prevFactionPageBtn) { /* ... (unchanged pagination logic) ... */ }
    if (nextFactionPageBtn) { /* ... (unchanged pagination logic) ... */ }

    if (applyLeadershipFiltersBtn) { /* ... (unchanged filter logic) ... */ }
    if (resetLeadershipFiltersBtn) { /* ... (unchanged filter logic) ... */ }
    if (leadershipFilterMaxLevelSlider && leadershipFilterMaxLevelValue) { /* ... (unchanged filter logic) ... */ }
    if (leadershipFilterTotalBattlestatsSlider && leadershipFilterTotalBattlestatsValue) { /* ... (unchanged filter logic) ... */ }

    if (prevLeadershipPageBtn) { /* ... (unchanged pagination logic) ... */ }
    if (nextLeadershipPageBtn) { /* ... (unchanged pagination logic) ... */ }

    setupButtonListener(closeAccessSettingsModalBtn, "Close Access Settings Modal", () => { if (accessSettingsModal) accessSettingsModal.style.display = 'none'; });
    if (accessSettingsModal) accessSettingsModal.addEventListener('click', (e) => { if (e.target === accessSettingsModal) accessSettingsModal.style.display = 'none'; });
    setupButtonListener(saveViewerAccessBtn, "Save Viewer Access Button", async () => {});

    // --- Core Firebase Auth state listener for social.js content ---
    // This listener is central to social.js functioning correctly.
    if (typeof auth !== 'undefined') {
        auth.onAuthStateChanged(function(user) {
            console.log("social.js: Auth state changed in social.js. User:", user);
            if (user) {
                // User is signed in, initialize the Hub content
                initializeHubContent(user);
            } else {
                // User is signed out, hide Hub content and clear states
                console.log("social.js: User signed out. Hiding Hub content.");
                currentUserId = null;
                currentUserProfileData = null;
                if (theHubMainUi) theHubMainUi.style.display = 'none'; // Hide the main content
                
                // Clear chat listeners and reset state
                if (globalChatUnsub) { globalChatUnsub(); globalChatUnsub = null; }
                if (factionChatUnsub) { factionChatUnsub(); factionChatUnsub = null; }
                if (friendsListUnsub) { friendsListUnsub(); friendsListUnsub = null; }
                if (recentChatsUnsub) { recentChatsUnsub(); recentChatsUnsub = null; }
                if (dmChatUnsub) { dmChatUnsub(); dmChatUnsub = null; }
                currentDmFriendId = null;
                // No redirection logic here, globalheader.js manages full page redirects.
            }
        });
    } else {
        console.error("CRITICAL: Firebase auth object is NULL. Hub UI will not function.");
        if (theHubMainUi) theHubMainUi.style.display = 'none'; // Ensure hidden if Firebase is unavailable
    }

    window.addEventListener('beforeunload', async () => {
        if (currentUserId && currentUserProfileData && currentUserProfileData.appearOnline) {
            await updateUserOnlineStatus(false);
        }
    });

    console.log("social.js: End of script.");
});