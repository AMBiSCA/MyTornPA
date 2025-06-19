// mysite/js/social.js - Main script for The Hub page functionalities.
document.addEventListener('DOMContentLoaded', function() {
    console.log("social.js: DOMContentLoaded event fired. The Hub is loading!");

    let db = null;
    let auth = null;
    let currentUserId = null;
    let currentUserProfileData = null;
    
    // --- Pagination & Data Variables ---
    let allRecruitingFactionsData = [];
    let currentFactionPage = 1;
    const factionsPerPage = 12;

    let allLookingForFactionUsersData = [];
    let currentLeadershipPage = 1;
    const usersPerPage = 12;

    // --- Firebase Service Assignments ---
    try {
        auth = firebase.auth();
        db = firebase.firestore();
        console.log("Firebase Auth and Firestore instances obtained successfully.");
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
    const hubActionFriendsChatBtn = document.getElementById('hubActionFriendsChatBtnFinal'); // Corrected ID
    const viewFriendsBtnHub = document.getElementById('viewFriendsBtnFinal');
    const hubActionFactionInfoBtn = document.getElementById('hubActionFactionInfoFinal');
    const hubActionLeadershipViewBtn = document.getElementById('hubActionLeadershipViewFinal');
    const hubActionOnTheHuntViewBtn = document.getElementById('hubActionOnTheHuntViewFinal');

    // Chat Modal Elements
    const hubChatModal = document.getElementById('hubChatModal');
    const closeChatModalButton = document.getElementById('closeChatModalBtn');
    const chatTabsContainer = document.getElementById('chatTabsContainer');
    
    // Other Modals & their Close Buttons
    const manageFriendsModal = document.getElementById('manageFriendsModal');
    const closeManageFriendsModalBtn = document.getElementById('closeManageFriendsModalBtn');
    const factionInfoModal = document.getElementById('factionInfoModal');
    const closeFactionInfoModalBtn = document.getElementById('closeFactionInfoModalBtn');
    const leadershipPanelModal = document.getElementById('leadershipPanelModal');
    const closeLeadershipPanelModalBtn = document.getElementById('closeLeadershipPanelModalBtn');
    const onTheHuntModal = document.getElementById('onTheHuntModal');
    const closeOnTheHuntModalBtn = document.getElementById('closeOnTheHuntModalBtn');
    
    // Faction Info Modal specifics
    const factionInfoTabs = document.getElementById('factionInfoTabs');
    const generalInfoContent = document.getElementById('generalInfoContent');
    const factionBattleStatsContent = document.getElementById('factionBattleStatsContent');

    // Leadership View specifics
    const lookingForFactionsList = document.getElementById('lookingForFactionsList');
    const leadershipPaginationControls = document.getElementById('leadershipPaginationControls');
    const prevLeadershipPageBtn = document.getElementById('prevLeadershipPageBtn');
    const nextLeadershipPageBtn = document.getElementById('nextLeadershipPageBtn');
    const leadershipPageInfo = document.getElementById('leadershipPageInfo');
    
    // On The Hunt specifics
    const recruitingFactionsList = document.getElementById('recruitingFactionsList');
    const factionPaginationControls = document.getElementById('factionPaginationControls');
    const prevFactionPageBtn = document.getElementById('prevFactionPageBtn');
    const nextFactionPageBtn = document.getElementById('nextFactionPageBtn');
    const factionPageInfo = document.getElementById('factionPageInfo');


    // --- HELPER FUNCTIONS ---

    function setupButtonListener(buttonEl, buttonName, callback) {
        if (buttonEl) {
            buttonEl.addEventListener('click', callback);
        }
    }

    function showModal(modalElement) {
        if (modalElement) modalElement.style.display = 'flex';
    }

    function hideModal(modalElement) {
        if (modalElement) modalElement.style.display = 'none';
    }

    // --- PROFILE & TOGGLE FUNCTIONS ---

    async function updateHubUserProfileSetting(settingKey, value) {
        if (!currentUserId || !db) return;
        try {
            await db.collection('userProfiles').doc(currentUserId).update({ [settingKey]: value });
            console.log(`Setting '${settingKey}' updated to '${value}'.`);
        } catch (error) {
            console.error(`Error updating setting '${settingKey}':`, error);
        }
    }

    function setupToggleSwitch(checkboxElement, settingKey) {
        if (!checkboxElement) return;
        checkboxElement.addEventListener('change', () => {
            updateHubUserProfileSetting(settingKey, checkboxElement.checked);
        });
    }

    // --- CHAT FUNCTIONS ---

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

    // --- FACTION INFO MODAL FUNCTIONS ---

    function displayUserFactionInfo() {
        showModal(factionInfoModal);
        // Add logic to load faction data when the modal opens
        loadFactionData();
    }
    
    async function loadFactionData() {
        if (!currentUserProfileData) return;
        console.log("Loading faction info...");
        generalInfoContent.innerHTML = `<p>Faction: ${currentUserProfileData.factionName || 'N/A'}</p><p>Faction ID: ${currentUserProfileData.factionId || 'N/A'}</p>`;
        // TODO: Add your logic here to fetch and display more detailed faction info or battle stats.
    }

    function setupFactionInfoTabs() {
        if (!factionInfoTabs) return;
        factionInfoTabs.addEventListener('click', (event) => {
            if (event.target.matches('.faction-info-tab-button')) {
                factionInfoTabs.querySelectorAll('.faction-info-tab-button').forEach(tab => tab.classList.remove('active'));
                event.target.classList.add('active');
                
                const targetContentId = event.target.dataset.target;
                factionInfoModal.querySelectorAll('.faction-info-modal-body-custom, #factionBattleStatsContent').forEach(content => {
                    content.style.display = content.id === targetContentId ? 'block' : 'none';
                });
            }
        });
    }

    // --- LEADERSHIP VIEW FUNCTIONS ---

    function displayLeadershipView() {
        showModal(leadershipPanelModal);
        loadLookingForFactionUsers();
    }

    async function loadLookingForFactionUsers() {
        lookingForFactionsList.innerHTML = '<li><p>Loading users...</p></li>';
        // TODO: Fetch your list of users looking for a faction from Firebase here.
        // For now, using placeholder data.
        allLookingForFactionUsersData = [
            { name: 'Player1 [123]', level: 10 }, { name: 'Player2 [456]', level: 25 },
        ];
        currentLeadershipPage = 1;
        displayLookingForFactionUsersPage();
    }
    
    function displayLookingForFactionUsersPage() {
        if (!lookingForFactionsList) return;
        lookingForFactionsList.innerHTML = '';
        const totalPages = Math.ceil(allLookingForFactionUsersData.length / usersPerPage);
        if (leadershipPageInfo) leadershipPageInfo.textContent = `Page ${currentLeadershipPage} of ${totalPages || 1}`;
        if (leadershipPaginationControls) leadershipPaginationControls.style.display = totalPages > 1 ? 'block' : 'none';

        const startIndex = (currentLeadershipPage - 1) * usersPerPage;
        const endIndex = startIndex + usersPerPage;
        const pageUsers = allLookingForFactionUsersData.slice(startIndex, endIndex);

        if (pageUsers.length === 0) {
            lookingForFactionsList.innerHTML = '<li><p>No users found matching criteria.</p></li>';
            return;
        }

        pageUsers.forEach(user => {
            const li = document.createElement('li');
            li.className = 'looking-for-faction-item'; // Use your existing class
            li.innerHTML = `<h5>${user.name}</h5><p>Level: <strong>${user.level}</strong></p>`;
            lookingForFactionsList.appendChild(li);
        });
    }

    // --- ON THE HUNT FUNCTIONS ---
    
    function displayOnTheHuntView() {
        showModal(onTheHuntModal);
        loadRecruitingFactions();
    }
    
    async function loadRecruitingFactions() {
        recruitingFactionsList.innerHTML = '<li><p>Loading recruiting factions...</p></li>';
        // TODO: Fetch your list of recruiting factions from Firebase here.
        allRecruitingFactionsData = [
            { name: 'The Cool Faction', respect: '1.2m' }, { name: 'Another Crew', respect: '500k' },
        ];
        currentFactionPage = 1;
        displayFactionsPage();
    }
    
    function displayFactionsPage() {
         if (!recruitingFactionsList) return;
        recruitingFactionsList.innerHTML = '';
        const totalPages = Math.ceil(allRecruitingFactionsData.length / factionsPerPage);
        if (factionPageInfo) factionPageInfo.textContent = `Page ${currentFactionPage} of ${totalPages || 1}`;
        if (factionPaginationControls) factionPaginationControls.style.display = totalPages > 1 ? 'block' : 'none';

        const startIndex = (currentFactionPage - 1) * factionsPerPage;
        const endIndex = startIndex + factionsPerPage;
        const pageFactions = allRecruitingFactionsData.slice(startIndex, endIndex);

        if (pageFactions.length === 0) {
            recruitingFactionsList.innerHTML = '<li><p>No factions found matching criteria.</p></li>';
            return;
        }
        
        pageFactions.forEach(faction => {
            const li = document.createElement('li');
            li.className = 'recruiting-faction-item'; // Use your existing class
            li.innerHTML = `<h5>${faction.name}</h5><p>Respect: <strong>${faction.respect}</strong></p>`;
            recruitingFactionsList.appendChild(li);
        });
    }

    // --- MAIN INITIALIZATION & AUTH ---

    async function initializeHubContent(user) {
        if (!user) {
            if (theHubMainUi) theHubMainUi.style.display = 'none';
            return;
        }
        currentUserId = user.uid;
        const profileComplete = await loadHubUserProfileData();

        if (!profileComplete) {
            showModal(profileSetupModal);
            return;
        }
        
        showModal(theHubMainUi);
        theHubMainUi.style.display = 'grid'; // Ensure it uses grid display

        setupToggleSwitch(shareStatsToggleFinal, 'shareStatsWithFaction');
        setupToggleSwitch(lookingForFactionToggleFinal, 'isLookingForFaction');
        setupToggleSwitch(lookingForRecruitToggleFinal, 'isLookingForRecruits');
        setupToggleSwitch(appearOnlineToggleFinal, 'appearOnline');
    }

    async function loadHubUserProfileData() {
        if (!currentUserId || !db) return false;
        try {
            const doc = await db.collection('userProfiles').doc(currentUserId).get();
            if (doc.exists) {
                currentUserProfileData = doc.data();
                if (hubFinalPreferredNameEl) hubFinalPreferredNameEl.textContent = currentUserProfileData.preferredName || 'N/A';
                if (hubFinalTornProfileIdEl) hubFinalTornProfileIdEl.textContent = currentUserProfileData.tornProfileId || 'N/A';
                if (shareStatsToggleFinal) shareStatsToggleFinal.checked = !!currentUserProfileData.shareStatsWithFaction;
                if (lookingForFactionToggleFinal) lookingForFactionToggleFinal.checked = !!currentUserProfileData.isLookingForFaction;
                if (lookingForRecruitToggleFinal) lookingForRecruitToggleFinal.checked = !!currentUserProfileData.isLookingForRecruits;
                if (appearOnlineToggleFinal) appearOnlineToggleFinal.checked = currentUserProfileData.appearOnline !== false;
                return !!currentUserProfileData.profileSetupComplete;
            }
            return false;
        } catch (error) {
            console.error("Error loading profile:", error);
            return false;
        }
    }
    
    // --- EVENT LISTENER ATTACHMENTS ---
    
    // Profile Modal
    setupButtonListener(skipProfileSetupBtn, "Skip Profile Setup", () => hideModal(profileSetupModal));
    setupButtonListener(closeProfileModalBtn, "Close Profile Modal", () => hideModal(profileSetupModal));
    setupButtonListener(saveProfileBtn, "Save Profile", async () => {
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

    // Main Hub Buttons
    setupButtonListener(hubActionGlobalChatBtn, "Global Chat Button", () => showChatModal('global'));
    setupButtonListener(hubActionFactionChatBtn, "Faction Chat Button", () => showChatModal('faction'));
    setupButtonListener(hubActionFriendsChatBtn, "Friends Chat Button", () => showChatModal('friends'));
    setupButtonListener(viewFriendsBtnHub, "Manage Friends Button", () => showModal(manageFriendsModal));
    setupButtonListener(hubActionFactionInfoBtn, "Faction Info Button", displayUserFactionInfo);
    setupButtonListener(hubActionLeadershipViewBtn, "Leadership View Button", displayLeadershipView);
    setupButtonListener(hubActionOnTheHuntViewBtn, "On The Hunt View Button", displayOnTheHuntView);

    // Modal Close Buttons
    setupButtonListener(closeChatModalButton, "Close Chat Modal", () => hideModal(hubChatModal));
    setupButtonListener(closeManageFriendsModalBtn, "Close Manage Friends Modal", () => hideModal(manageFriendsModal));
    setupButtonListener(closeFactionInfoModalBtn, "Close Faction Info Modal", () => hideModal(factionInfoModal));
    setupButtonListener(closeLeadershipPanelModalBtn, "Close Leadership Panel Modal", () => hideModal(leadershipPanelModal));
    setupButtonListener(closeOnTheHuntModalBtn, "Close On The Hunt Modal", () => hideModal(onTheHuntModal));
    
    // Pagination Buttons
    setupButtonListener(prevFactionPageBtn, "Prev Faction Page", () => { if(currentFactionPage > 1) { currentFactionPage--; displayFactionsPage(); } });
    setupButtonListener(nextFactionPageBtn, "Next Faction Page", () => { if((currentFactionPage * factionsPerPage) < allRecruitingFactionsData.length) { currentFactionPage++; displayFactionsPage(); } });
    setupButtonListener(prevLeadershipPageBtn, "Prev Leadership Page", () => { if(currentLeadershipPage > 1) { currentLeadershipPage--; displayLookingForFactionUsersPage(); } });
    setupButtonListener(nextLeadershipPageBtn, "Next Leadership Page", () => { if((currentLeadershipPage * usersPerPage) < allLookingForFactionUsersData.length) { currentLeadershipPage++; displayLookingForFactionUsersPage(); } });
    
    // Setup tabs for Faction Info modal
    setupFactionInfoTabs();

    // --- Core Firebase Auth state listener ---
    if (auth) {
        auth.onAuthStateChanged(user => {
            if (user) {
                initializeHubContent(user);
            } else {
                if (theHubMainUi) theHubMainUi.style.display = 'none';
                // Potentially redirect to login page
                // window.location.href = '/index.html';
            }
        });
    } else {
        console.error("CRITICAL: Firebase auth object is NULL. Hub UI will not function.");
    }
});