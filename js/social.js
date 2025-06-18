// mysite/js/social.js - CORRECTED SCRIPT

document.addEventListener('DOMContentLoaded', function() {
    console.log("social.js: DOMContentLoaded event fired. The Hub is loading!");

    // All your existing variables at the top remain the same...
    let db = null;
    let auth = null;
    let currentUserId = null;
    let currentUserProfileData = null;
    
    // All other variables for pagination, etc. are assumed to be here.

    // --- Firebase Service Assignments ---
    try {
        auth = firebase.auth();
        db = firebase.firestore();
        console.log("Firebase Auth and Firestore instances obtained successfully.");
    } catch (e) {
        console.error("CRITICAL: Error getting Firebase Auth/Firestore instances:", e);
    }
    
    // --- Getting all DOM Elements ---
    // (This large block of getElementById is assumed to be here and correct)
    const theHubMainUi = document.getElementById('theHubMainUi');
    const hubFinalPreferredNameEl = document.getElementById('hubFinalPreferredName');
    const hubFinalTornProfileIdEl = document.getElementById('hubFinalTornProfileId');
    // ... and all other element variables from the file you sent.


    // ===================================================================
    // === THIS IS THE NEW/MISSING FUNCTION THAT FIXES THE CRASH ===
    // ===================================================================
    /**
     * Takes user data from Firestore and populates the profile box on the Hub page.
     * @param {object} profileData The user's profile data object.
     */
    function displayHubUserDetails(profileData) {
        if (!profileData) {
            console.warn("displayHubUserDetails called with no data.");
            if (hubFinalPreferredNameEl) hubFinalPreferredNameEl.textContent = 'Setup Profile';
            if (hubFinalTornProfileIdEl) hubFinalTornProfileIdEl.textContent = 'Not Set';
            return;
        }

        console.log("Updating Hub UI with user details:", profileData);
        if (hubFinalPreferredNameEl) {
            hubFinalPreferredNameEl.textContent = profileData.preferredName || 'Not Set';
        }
        if (hubFinalTornProfileIdEl) {
            hubFinalTornProfileIdEl.textContent = profileData.tornProfileId || 'Not Set';
        }
        
        // This is where you would also handle setting the toggle switches, for example:
        // const shareStatsToggleFinal = document.getElementById('shareStatsToggleFinal');
        // if(shareStatsToggleFinal) shareStatsToggleFinal.checked = !!profileData.shareStatsWithFaction;
    }
    // ===================================================================


    // --- Core Initialization Function for The Hub Content ---
    async function initializeHubContent(user) {
        if (!user) {
            if (theHubMainUi) theHubMainUi.style.display = 'none';
            return;
        }
        currentUserId = user.uid;
        console.log("Initializing social hub content for user:", currentUserId);

        const userDoc = await db.collection('userProfiles').doc(currentUserId).get();
        if (userDoc.exists) {
            currentUserProfileData = userDoc.data();
            
            // If the profile isn't complete, show the setup modal.
            if (!currentUserProfileData.profileSetupComplete) {
                console.log("User profile is incomplete. Showing setup modal.");
                const profileSetupModal = document.getElementById('profileSetupModal');
                if (profileSetupModal) profileSetupModal.style.display = 'flex';
                return;
            }

            // --- THIS IS THE FIX ---
            // Profile is complete, so display the details and show the page.
            displayHubUserDetails(currentUserProfileData); // Call the function to populate the UI.
            
            if (theHubMainUi) {
                theHubMainUi.style.display = 'grid'; // Make the main content visible!
            }
            
            // All your other initialization logic would go here
            // (e.g., setting up chat, loading friends lists, etc.)
            console.log("All social hub content initialized.");

        } else {
            console.warn("User profile document does not exist. Prompting setup.");
            const profileSetupModal = document.getElementById('profileSetupModal');
            if (profileSetupModal) profileSetupModal.style.display = 'flex';
        }
    }


    // --- Core Firebase Auth state listener for social.js content ---
    if (auth) {
        auth.onAuthStateChanged(function(user) {
            if (user) {
                initializeHubContent(user);
            } else {
                console.log("User signed out. Hiding Hub content.");
                if (theHubMainUi) theHubMainUi.style.display = 'none';
                // Also hide any modals that might be open
                const modals = document.querySelectorAll('.modal-overlay');
                modals.forEach(modal => modal.style.display = 'none');
            }
        });
    } else {
        console.error("CRITICAL: Firebase auth object is NULL. Hub UI will not function.");
    }
    
    // I am including a few key event listeners for your modals as an example.
    // You would add all the other event listeners from your original file here.
    const closeProfileModalBtn = document.getElementById('closeProfileModalBtn');
    if(closeProfileModalBtn) {
        closeProfileModalBtn.addEventListener('click', () => {
            const profileSetupModal = document.getElementById('profileSetupModal');
            if (profileSetupModal) profileSetupModal.style.display = 'none';
        });
    }

    const hubActionOnTheHuntViewBtn = document.getElementById('hubActionOnTheHuntViewFinal');
    const onTheHuntModal = document.getElementById('onTheHuntModal');
    const closeOnTheHuntModalBtn = document.getElementById('closeOnTheHuntModalBtn');

    if(hubActionOnTheHuntViewBtn) {
         hubActionOnTheHuntViewBtn.addEventListener('click', () => {
            if (onTheHuntModal) onTheHuntModal.style.display = 'flex';
        });
    }
    if(closeOnTheHuntModalBtn) {
        closeOnTheHuntModalBtn.addEventListener('click', () => {
            if (onTheHuntModal) onTheHuntModal.style.display = 'none';
        });
    }


    console.log("social.js: End of script.");
});