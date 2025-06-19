// mysite/js/social.js - FINAL VERSION (Using onclick method)

// --- Globally Scoped Functions for onclick ---
// These are placed outside the DOMContentLoaded listener so the HTML onclick can find them.
function openFactionInfoModal() {
    document.getElementById('factionInfoModal')?.classList.add('modal-is-visible');
}
function openManageFriendsModal() {
    document.getElementById('manageFriendsModal')?.classList.add('modal-is-visible');
}
function openLeadershipModal() {
    document.getElementById('leadershipPanelModal')?.classList.add('modal-is-visible');
}
function openOnTheHuntModal() {
    document.getElementById('onTheHuntModal')?.classList.add('modal-is-visible');
}


// --- Main script logic ---
document.addEventListener('DOMContentLoaded', function() {
    console.log("social.js: Script loaded.");

    let db = null;
    let auth = null;
    let currentUserId = null;
    let currentUserProfileData = null;
    
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

    // Working Buttons (using addEventListener)
    const hubActionGlobalChatBtn = document.getElementById('hubActionGlobalChatFinal');
    const hubActionFactionChatBtn = document.getElementById('hubActionFactionChatFinal');
    const hubActionFriendsChatBtn = document.getElementById('hubActionFriendsChatBtnFinal');
    
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
    
    const chatTabsContainer = document.getElementById('chatTabsContainer');


    // --- HELPER FUNCTIONS ---

    function setupButtonListener(buttonEl, callback) {
        if (buttonEl) {
            buttonEl.addEventListener('click', callback);
        }
    }

    // This function is still used by the close buttons
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
        hubChatModal.classList.add('modal-is-visible');
        chatTabsContainer.querySelectorAll('.chat-tab-button').forEach(tab => tab.classList.remove('active'));
        hubChatModal.querySelectorAll('.chat-messages-area').forEach(area => area.classList.remove('active'));
        const tabToShow = document.getElementById(`${chatTypeToShow}ChatTabBtn`);
        const contentToShow = document.getElementById(`${chatTypeToShow}ChatContent`);
        if(tabToShow) tabToShow.classList.add('active');
        if(contentToShow) contentToShow.classList.add('active');
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
            profileSetupModal.classList.add('modal-is-visible'); // Use class-based method
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

    // Working buttons still use addEventListener
    setupButtonListener(hubActionGlobalChatBtn, () => showChatModal('global'));
    setupButtonListener(hubActionFactionChatBtn, () => showChatModal('faction'));
    setupButtonListener(hubActionFriendsChatBtn, () => showChatModal('friends'));
    
    // NOTE: The listeners for the 4 problem buttons have been REMOVED from this script.
    // They are now handled by the onclick="" in the HTML file.

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