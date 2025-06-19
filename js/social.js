// mysite/js/social.js - DEBUG VERSION 2 (with !important)
document.addEventListener('DOMContentLoaded', function() {
    console.log("--- social.js script started ---");

    let db = null;
    let auth = null;
    let currentUserId = null;

    try {
        auth = firebase.auth();
        db = firebase.firestore();
    } catch (e) {
        console.error("CRITICAL: Error getting Firebase instances:", e);
    }

    // --- DOM Element Getters ---
    const theHubMainUi = document.getElementById('theHubMainUi');

    // --- Let's specifically check the buttons and modals in question ---
    const hubActionFactionInfoBtn = document.getElementById('hubActionFactionInfoFinal');
    const viewFriendsBtnHub = document.getElementById('viewFriendsBtnFinal');
    const hubActionLeadershipViewBtn = document.getElementById('hubActionLeadershipViewFinal');
    const hubActionOnTheHuntViewBtn = document.getElementById('hubActionOnTheHuntViewFinal');

    const factionInfoModal = document.getElementById('factionInfoModal');
    const manageFriendsModal = document.getElementById('manageFriendsModal');
    const leadershipPanelModal = document.getElementById('leadershipPanelModal');
    const onTheHuntModal = document.getElementById('onTheHuntModal');

    // --- DEBUG LOGS: Check if the elements were found ---
    console.log("DEBUG: Faction Info Button found?", !!hubActionFactionInfoBtn);
    console.log("DEBUG: Manage Friends Button found?", !!viewFriendsBtnHub);
    console.log("DEBUG: Leadership View Button found?", !!hubActionLeadershipViewBtn);
    console.log("DEBUG: On The Hunt Button found?", !!hubActionOnTheHuntViewBtn);

    console.log("DEBUG: Faction Info Modal found?", !!factionInfoModal);
    console.log("DEBUG: Manage Friends Modal found?", !!manageFriendsModal);
    console.log("DEBUG: Leadership Panel Modal found?", !!leadershipPanelModal);
    console.log("DEBUG: On The Hunt Modal found?", !!onTheHuntModal);
    

    // --- HELPER FUNCTIONS (with debugging) ---

    function setupButtonListener(buttonEl, callback) {
        if (buttonEl) {
            const buttonId = buttonEl.id || 'NO ID';
            console.log(`DEBUG: Attaching listener to button: ${buttonId}`);
            buttonEl.addEventListener('click', callback);
        }
    }

    // THIS IS THE NEW "NUCLEAR OPTION" VERSION OF THE FUNCTION
    function showModal(modalElement) {
        if (modalElement) {
            console.log(`DEBUG: Forcing modal ${modalElement.id} to be visible with !important`);
            
            // This sets the style with high priority to override any conflicting CSS
            modalElement.style.setProperty('display', 'flex', 'important');
        } else {
            console.error("DEBUG: showModal was called, but the modalElement was not found!");
        }
    }

    function hideModal(modalElement) {
        if (modalElement) {
            console.log(`DEBUG: hideModal called for ->`, modalElement.id);
            modalElement.style.display = 'none';
        } else {
             console.error("DEBUG: hideModal was called, but the modalElement was not found!");
        }
    }

    // --- MODAL DISPLAY FUNCTIONS (with debugging) ---

    function displayUserFactionInfo() {
        console.log("DEBUG: displayUserFactionInfo() function was called.");
        showModal(factionInfoModal);
    }
    
    function displayLeadershipView() {
        console.log("DEBUG: displayLeadershipView() function was called.");
        showModal(leadershipPanelModal);
    }
    
    function displayOnTheHuntView() {
        console.log("DEBUG: displayOnTheHuntView() function was called.");
        showModal(onTheHuntModal);
    }


    // --- MAIN INITIALIZATION ---

    async function initializeHubContent(user) {
        if (!user) {
            if (theHubMainUi) theHubMainUi.style.display = 'none';
            return;
        }
        currentUserId = user.uid;
        // Assume profile is complete for now to simplify debugging
        if (theHubMainUi) theHubMainUi.style.display = 'grid'; 
    }
    
    // --- EVENT LISTENER ATTACHMENTS ---
    console.log("--- Attaching Event Listeners ---");
    
    // Wire up the four problem buttons
    setupButtonListener(viewFriendsBtnHub, () => {
        console.log("DEBUG: 'Manage Friends List' button clicked!");
        showModal(manageFriendsModal);
    });
    setupButtonListener(hubActionFactionInfoBtn, displayUserFactionInfo);
    setupButtonListener(hubActionLeadershipViewBtn, displayLeadershipView);
    setupButtonListener(hubActionOnTheHuntViewBtn, displayOnTheHuntView);

    // Wire up their close buttons
    const closeManageFriendsModalBtn = document.getElementById('closeManageFriendsModalBtn');
    const closeFactionInfoModalBtn = document.getElementById('closeFactionInfoModalBtn');
    const closeLeadershipPanelModalBtn = document.getElementById('closeLeadershipPanelModalBtn');
    const closeOnTheHuntModalBtn = document.getElementById('closeOnTheHuntModalBtn');
    
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