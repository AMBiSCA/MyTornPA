const DEFAULT_PROFILE_ICONS = [
    '../../images/account.png',
    '../../images/avatar-design.png',
    '../../images/boy.png',
    '../../images/boys.png',
    '../../images/boysy.png',
    '../../images/business-man.png',
    '../../images/customer-service.png',
    '../../images/display-pic.png',
    '../../images/man.png',
    '../../images/man3w.png',
    '../../images/mans.png',
    '../../images/men.png',
    '../../images/office-man.png',
    '../../images/piccy.png',
    '../../images/profile.png',
    '../../images/user.png',
    '../../images/user2.png',
    '../../images/user-image-with-black-background.png',
    '../../images/working.png'
];

function initializeGlobals() {
    // ---- Firebase Setup ----
    const db = firebase.firestore();
    const auth = firebase.auth();
    let chatMessagesCollection = null;
    let unsubscribeFromChat = null;
    let currentTornUserName = 'Unknown';
    let currentUserFactionId = null;
    let userTornApiKey = null;

    // ---- Torn API Base URL ----
    const TORN_API_BASE_URL = 'https://api.torn.com/v2';
    		
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
                // UPDATED: Load user's alliance IDs from profile (now an array)
                currentUserAllianceIds = userData.allianceIds || [];

                // Make globals accessible to functions outside this scope, especially for re-rendering
                window.currentUserFactionId = currentUserFactionId;
                window.userTornApiKey = userTornApiKey;
                window.TORN_API_BASE_URL = TORN_API_BASE_URL;
                // UPDATED: Expose currentUserAllianceIds globally
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
            const chatDisplayAreaGlobal = document.getElementById('global-chat-display-area'); // NEW: Global Chat display area
            const chatDisplayAreaAlliance = document.getElementById('alliance-chat-display-area'); // NEW: Alliance Chat display area

            if (chatDisplayAreaFaction) chatDisplayAreaFaction.innerHTML = '<p>Please log in to use chat.</p>';
            if (chatDisplayAreaWar) chatDisplayAreaWar.innerHTML = '<p>Please log in to use war chat.</p>';
            if (chatDisplayAreaGlobal) chatDisplayAreaGlobal.innerHTML = '<p>Please log in to use global chat.</p>'; // NEW: Global Chat message
            if (chatDisplayAreaAlliance) chatDisplayAreaAlliance.innerHTML = '<p>Please log in to use alliance chat.</p>'; // NEW: Alliance Chat message
            console.log("User logged out. Chat functionalities are reset.");
        }
    });
	
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
}

// Run the main initialization function
initializeGlobals();