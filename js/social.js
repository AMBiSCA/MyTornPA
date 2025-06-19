// mysite/js/social.js - FINAL DIAGNOSTIC TEST
document.addEventListener('DOMContentLoaded', function() {
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
    const hubActionFriendsChatBtn = document.getElementById('hubActionFriendsChatBtnFinal'); // Corrected ID again to be safe
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

    function displayUserFactionInfo() {
        showModal(factionInfoModal);
    }

    function displayLeadershipView() {
        showModal(leadershipPanelModal);
    }
    
    function displayOnTheHuntView() {
        showModal(onTheHuntModal);
    }
    
    // --- MAIN INITIALIZATION & AUTH ---

    async function initializeHubContent(user) {
        if (!user) {
            if (theHubMainUi) theHubMainUi.style.display = 'none';
            return;
        }
        currentUserId = user.uid;
        theHubMainUi.style.display = 'grid';
        setupToggleSwitch(shareStatsToggleFinal, 'shareStatsWithFaction');
        setupToggleSwitch(lookingForFactionToggleFinal, 'isLookingForFaction');
        setupToggleSwitch(lookingForRecruitToggleFinal, 'isLookingForRecruits');
        setupToggleSwitch(appearOnlineToggleFinal, 'appearOnline');
    }
    
    // --- EVENT LISTENER ATTACHMENTS ---
    
    setupButtonListener(hubActionGlobalChatBtn, () => showChatModal('global'));
    setupButtonListener(hubActionFactionChatBtn, () => showChatModal('faction'));
    setupButtonListener(hubActionFriendsChatBtn, () => showChatModal('friends'));
    
    // Non-working buttons
    setupButtonListener(viewFriendsBtnHub, () => showModal(manageFriendsModal));
    setupButtonListener(hubActionLeadershipViewBtn, displayLeadershipView);
    setupButtonListener(hubActionOnTheHuntViewBtn, displayOnTheHuntView);

    // =================================================================
    // =========== THIS IS THE TEST ===========
    // We are rewiring the "Faction Info" button to do what "Global Chat" does.
    console.log("TESTING: Rewiring 'Faction Info' button to open the Chat Modal.");
    setupButtonListener(hubActionFactionInfoBtn, () => showChatModal('global'));
    // =================================================================

    // Modal Close Buttons
    setupButtonListener(closeChatModalButton, () => hideModal(hubChatModal));
    setupButtonListener(closeManageFriendsModalBtn, () => hideModal(manageFriendsModal));
    setupButtonListener(closeFactionInfoModalBtn, () => hideModal(factionInfoModal));
    setupButtonListener(closeLeadershipPanelModalBtn, () => hideModal(leadershipPanelModal));
    setupButtonListener(closeOnTheHuntModalBtn, () => hideModal(onTheHuntModal));

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