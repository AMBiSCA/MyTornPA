ocument.addEventListener('DOMContentLoaded', function() {
    console.log("social.js: Script loaded.");

    let db = null;
    let auth = null;
    let currentUserId = null;
    let currentUserProfileData = null;
    
    // Pagination & Data Variables
    let allRecruitingFactionsData = [];
    let currentFactionPage = 1;
    const factionsPerPage = 12;

    let allLookingForFactionUsersData = [];
    let currentLeadershipPage = 1;
    const usersPerPage = 12;

    try {
        auth = firebase.auth();
        db = firebase.firestore();
    } catch (e) {
        console.error("CRITICAL: Error getting Firebase instances:", e);
    }

    // --- DOM Element Getters ---
    const theHubMainUi = document.getElementById('theHubMainUi');
    
    // Profile Elements
    const profileSetupModal = document.getElementById('profileSetupModal');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const skipProfileSetupBtn = document.getElementById('skipProfileSetupBtn');
    const closeProfileModalBtn = document.getElementById('closeProfileModalBtn');
    const preferredNameInput = document.getElementById('preferredName');
    const profileSetupApiKeyInput = document.getElementById('profileSetupApiKey');
    const profileSetupProfileIdInput = document.getElementById('profileSetupProfileId');
    const shareFactionStatsModalToggle = document.getElementById('shareFactionStatsModalToggle');
    const hubFinalPreferredNameEl = document.getElementById('hubFinalPreferredName');
    const hubFinalTornProfileIdEl = document.getElementById('hubFinalTornProfileId');
    const shareStatsToggleFinal = document.getElementById('shareStatsToggleFinal');
    const lookingForFactionToggleFinal = document.getElementById('lookingForFactionToggleFinal');
    const lookingForRecruitToggleFinal = document.getElementById('lookingForRecruitToggleFinal');
    const appearOnlineToggleFinal = document.getElementById('appearOnlineToggleFinal');

    // Main Hub Buttons
    const hubActionGlobalChatBtn = document.getElementById('hubActionGlobalChatFinal');
    const hubActionFactionChatBtn = document.getElementById('hubActionFactionChatFinal');
    const hubActionFriendsChatBtn = document.getElementById('hubActionFriendsChatBtnFinal');
    const viewFriendsBtnHub = document.getElementById('viewFriendsBtnFinal');
    const hubActionFactionInfoBtn = document.getElementById('hubActionFactionInfoFinal');
    const hubActionLeadershipViewBtn = document.getElementById('hubActionLeadershipViewFinal');
    const hubActionOnTheHuntViewBtn = document.getElementById('hubActionOnTheHuntViewFinal');

    // Modals & Close Buttons
    const hubChatModal = document.getElementById('hubChatModal');
    const closeChatModalButton = document.getElementById('closeChatModalBtn');
    const manageFriendsModal = document.getElementById('manageFriendsModal');
    const closeManageFriendsModalBtn = document.getElementById('closeManageFriendsModalBtn');
    const factionInfoModal = document.getElementById('factionInfoModal');
    const closeFactionInfoModalBtn = document.getElementById('closeFactionInfoModalBtn');
    const leadershipPanelModal = document.getElementById('leadershipPanelModal');
    const closeLeadershipPanelModalBtn = document.getElementById('closeLeadershipPanelModalBtn');
    const onTheHuntModal = document.getElementById('onTheHuntModal');
    const closeOnTheHuntModalBtn = document.getElementById('closeOnTheHuntModalBtn');
    
    // Modal-specific Elements
    const chatTabsContainer = document.getElementById('chatTabsContainer');
    const factionInfoTabs = document.getElementById('factionInfoTabs');
    const generalInfoContent = document.getElementById('generalInfoContent');
    const lookingForFactionsList = document.getElementById('lookingForFactionsList');
    const leadershipPaginationControls = document.getElementById('leadershipPaginationControls');
    const prevLeadershipPageBtn = document.getElementById('prevLeadershipPageBtn');
    const nextLeadershipPageBtn = document.getElementById('nextLeadershipPageBtn');
    const leadershipPageInfo = document.getElementById('leadershipPageInfo');
    const recruitingFactionsList = document.getElementById('recruitingFactionsList');
    const factionPaginationControls = document.getElementById('factionPaginationControls');
    const prevFactionPageBtn = document.getElementById('prevFactionPageBtn');
    const nextFactionPageBtn = document.getElementById('nextFactionPageBtn');
    const factionPageInfo = document.getElementById('factionPageInfo');
    const fullFriendsListInManageModal = document.getElementById('fullFriendsListInManageModal');
    const recentChatsListInManageModal = document.getElementById('recentChatsListInManageModal');

    // --- HELPER FUNCTIONS ---

    function setupButtonListener(buttonEl, callback) {
        if (buttonEl) {
            buttonEl.addEventListener('click', callback);
        }
    }

    function showModal(modalElement) {
        if (modalElement) {
            modalElement.classList.add('modal-is-visible');
        }
    }

    function hideModal(modalElement) {
        if (modalElement) {
            modalElement.classList.remove('modal-is-visible');
        }
    }

    // --- PROFILE, TOGGLES, AND MODAL FUNCTIONS ---

    async function updateHubUserProfileSetting(settingKey, value) {
        if (!currentUserId || !db) return;
        try {
            await db.collection('userProfiles').doc(currentUserId).update({ [settingKey]: value });
        } catch (error) {
            console.error(`Error updating setting '${settingKey}':`, error);
        }
    }

    function setupToggleSwitch(checkboxElement, settingKey) {
        if (!checkboxElement) return;
        const switchContainer = checkboxElement.parentElement;
        if (switchContainer) {
            switchContainer.addEventListener('click', (event) => {
                event.preventDefault();
                checkboxElement.checked = !checkboxElement.checked;
                const changeEvent = new Event('change');
                checkboxElement.dispatchEvent(changeEvent);
            });
        }
        checkboxElement.addEventListener('change', () => {
            updateHubUserProfileSetting(settingKey, checkboxElement.checked);
        });
    }

    function showChatModal(chatTypeToShow = 'global') {
        if (!hubChatModal || !chatTabsContainer) return;
        showModal(hubChatModal);
        chatTabsContainer.querySelectorAll('.chat-tab-button').forEach(tab => tab.classList.remove('active'));
        hubChatModal.querySelectorAll('.chat-messages-area').forEach(area => area.classList.remove('active'));
        const tabToShow = document.getElementById(`${chatTypeToShow}ChatTabBtn`);
        const contentToShow = document.getElementById(`${chatTypeToShow}ChatContent`);
        if(tabToShow) tabToShow.classList.add('active');
        if(contentToShow) contentToShow.classList.add('active');
    }
    
    // --- DATA LOADING AND DISPLAY FUNCTIONS (RESTORED) ---
    // NOTE: These functions now correctly call the data loading logic after opening the modal.
    
    function displayUserFactionInfo() {
        showModal(factionInfoModal);
        loadFactionData(); // Load data when modal opens
    }
    
    async function loadFactionData() {
        if (!currentUserProfileData) {
            generalInfoContent.innerHTML = `<p>User profile not loaded.</p>`;
            return;
        }
        generalInfoContent.innerHTML = `<p>Faction: ${currentUserProfileData.factionName || 'N/A'}</p><p>Faction ID: ${currentUserProfileData.factionId || 'N/A'}</p>`;
        // TODO: Add your fetch logic for battle stats, etc. here
    }

    function displayLeadershipView() {
        showModal(leadershipPanelModal);
        loadLookingForFactionUsers(); // Load data when modal opens
    }

    async function loadLookingForFactionUsers() {
        lookingForFactionsList.innerHTML = '<li><p>Loading users...</p></li>';
        // TODO: Add your real Firebase query here to fetch users where 'isLookingForFaction' is true.
        allLookingForFactionUsersData = [{ name: 'Player1 [123]', level: 10 }, { name: 'Player2 [456]', level: 25 }];
        currentLeadershipPage = 1;
        displayLookingForFactionUsersPage();
    }
    
    function displayLookingForFactionUsersPage() {
        if (!lookingForFactionsList) return;
        lookingForFactionsList.innerHTML = '';
        const totalPages = Math.ceil(allLookingForFactionUsersData.length / usersPerPage);
        if (leadershipPageInfo) leadershipPageInfo.textContent = `Page ${currentLeadershipPage} of ${totalPages || 1}`;
        if (leadershipPaginationControls) leadershipPaginationControls.style.display = totalPages > 1 ? 'flex' : 'none';
        const pageUsers = allLookingForFactionUsersData.slice((currentLeadershipPage - 1) * usersPerPage, currentLeadershipPage * usersPerPage);
        if (pageUsers.length === 0) {
            lookingForFactionsList.innerHTML = '<li><p>No users found.</p></li>';
            return;
        }
        pageUsers.forEach(user => {
            const li = document.createElement('li');
            li.className = 'looking-for-faction-item';
            li.innerHTML = `<h5>${user.name}</h5><p>Level: <strong>${user.level}</strong></p>`;
            lookingForFactionsList.appendChild(li);
        });
    }

    function displayOnTheHuntView() {
        showModal(onTheHuntModal);
        loadRecruitingFactions(); // Load data when modal opens
    }
    
    async function loadRecruitingFactions() {
        recruitingFactionsList.innerHTML = '<li><p>Loading recruiting factions...</p></li>';
        // TODO: Add your real Firebase query here to fetch factions that are recruiting.
        allRecruitingFactionsData = [{ name: 'The Cool Faction', respect: '1.2m' }, { name: 'Another Crew', respect: '500k' }];
        currentFactionPage = 1;
        displayFactionsPage();
    }
    
    function displayFactionsPage() {
        if (!recruitingFactionsList) return;
        recruitingFactionsList.innerHTML = '';
        const totalPages = Math.ceil(allRecruitingFactionsData.length / factionsPerPage);
        if (factionPageInfo) factionPageInfo.textContent = `Page ${currentFactionPage} of ${totalPages || 1}`;
        if (factionPaginationControls) factionPaginationControls.style.display = totalPages > 1 ? 'flex' : 'none';
        const pageFactions = allRecruitingFactionsData.slice((currentFactionPage - 1) * factionsPerPage, currentFactionPage * factionsPerPage);
        if (pageFactions.length === 0) {
            recruitingFactionsList.innerHTML = '<li><p>No factions found.</p></li>';
            return;
        }
        pageFactions.forEach(faction => {
            const li = document.createElement('li');
            li.className = 'recruiting-faction-item';
            li.innerHTML = `<h5>${faction.name}</h5><p>Respect: <strong>${faction.respect}</strong></p>`;
            recruitingFactionsList.appendChild(li);
        });
    }
    
    function displayManageFriends() {
        showModal(manageFriendsModal);
        // TODO: Add your function calls here to load the full friends list and recent chats.
        // e.g., loadFullFriendsListForModal();
    }

    // --- MAIN INITIALIZATION & AUTH ---

    async function initializeHubContent(user) {
        if (!user) {
            if (theHubMainUi) theHubMainUi.style.display = 'none';
            return;
        }
        currentUserId = user.uid;
        const profileDoc = await db.collection('userProfiles').doc(currentUserId).get();
        if (!profileDoc.exists || !profileDoc.data().profileSetupComplete) {
            showModal(profileSetupModal);
            return;
        }
        currentUserProfileData = profileDoc.data();
        theHubMainUi.style.display = 'grid';
        setupToggleSwitch(shareStatsToggleFinal, 'shareStatsWithFaction');
        setupToggleSwitch(lookingForFactionToggleFinal, 'isLookingForFaction');
        setupToggleSwitch(lookingForRecruitToggleFinal, 'isLookingForRecruits');
        setupToggleSwitch(appearOnlineToggleFinal, 'appearOnline');
    }
    
    // --- EVENT LISTENER ATTACHMENTS ---
    
    setupButtonListener(skipProfileSetupBtn, () => hideModal(profileSetupModal));
    setupButtonListener(closeProfileModalBtn, () => hideModal(profileSetupModal));
    setupButtonListener(saveProfileBtn, async () => {
        const name = preferredNameInput.value.trim();
        if (name.length === 0) return;
        await db.collection('userProfiles').doc(currentUserId).set({
            preferredName: name,
            shareStatsWithFaction: shareFactionStatsModalToggle.checked,
            profileSetupComplete: true,
            tornApiKey: profileSetupApiKeyInput.value.trim(),
            tornProfileId: profileSetupProfileIdInput.value.trim(),
        }, { merge: true });
        hideModal(profileSetupModal);
        initializeHubContent(auth.currentUser);
    });

    // Working Chat Buttons
    setupButtonListener(hubActionGlobalChatBtn, () => showChatModal('global'));
    setupButtonListener(hubActionFactionChatBtn, () => showChatModal('faction'));
    setupButtonListener(hubActionFriendsChatBtn, () => showChatModal('friends'));
    
    // Restored functionality for the 4 problem buttons
    setupButtonListener(viewFriendsBtnHub, displayManageFriends);
    setupButtonListener(hubActionFactionInfoBtn, displayUserFactionInfo);
    setupButtonListener(hubActionLeadershipViewBtn, displayLeadershipView);
    setupButtonListener(hubActionOnTheHuntViewBtn, displayOnTheHuntView);

    // All Modal Close Buttons
    setupButtonListener(closeChatModalButton, () => hideModal(hubChatModal));
    setupButtonListener(closeManageFriendsModalBtn, () => hideModal(manageFriendsModal));
    setupButtonListener(closeFactionInfoModalBtn, () => hideModal(factionInfoModal));
    setupButtonListener(closeLeadershipPanelModalBtn, () => hideModal(leadershipPanelModal));
    setupButtonListener(closeOnTheHuntModalBtn, () => hideModal(onTheHuntModal));
    
    // Pagination Listeners
    setupButtonListener(prevFactionPageBtn, () => { if(currentFactionPage > 1) { currentFactionPage--; displayFactionsPage(); } });
    setupButtonListener(nextFactionPageBtn, () => { if((currentFactionPage * factionsPerPage) < allRecruitingFactionsData.length) { currentFactionPage++; displayFactionsPage(); } });
    setupButtonListener(prevLeadershipPageBtn, () => { if(currentLeadershipPage > 1) { currentLeadershipPage--; displayLookingForFactionUsersPage(); } });
    setupButtonListener(nextLeadershipPageBtn, () => { if((currentLeadershipPage * usersPerPage) < allLookingForFactionUsersData.length) { currentLeadershipPage++; displayLookingForFactionUsersPage(); } });
    
    // --- Core Firebase Auth state listener ---
    if (auth) {
        auth.onAuthStateChanged(user => {
            if (user) {
                initializeHubContent(user);
            } else {
                if (theHubMainUi) theHubMainUi.style.display = 'none';
            }
        });
    } else {
        console.error("CRITICAL: Firebase auth object is NULL. Hub UI will not function.");
    }
});
