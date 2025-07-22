// mysite/js/globalheader.js
// This script dynamically loads the global header HTML and manages its UI based on Firebase authentication state.

document.addEventListener('DOMContentLoaded', function() {
    console.log("globalheader.js: DOMContentLoaded event fired.");

    // Function to load the global header HTML (and modals) and then initialize its JavaScript logic
    async function loadGlobalHeaderAndInitializeLogic() {
        // IMPORTANT: Adjust this path based on where your globalheader.html is located.
        // Based on our last successful attempt, it's in the 'pages/' folder.
        const headerPath = '../pages/globalheader.html'; 

        try {
            const response = await fetch(headerPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const html = await response.text();
            const headerPlaceholder = document.getElementById('global-header-placeholder');
            
            if (headerPlaceholder) {
                // Insert the tched HTML into the placeholder
                headerPlaceholder.innerHTML = html;
                console.log("globalheader.js: Global header HTML loaded successfully into placeholder.");

                // Now, re-insert the modals into the body (this is important for modals to function as overlays)
                // We assume the modals are part of globalheader.html content, appended AFTER the header tag.
                // We extract them and append them directly to the body.
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html; // Load the HTML into a temporary div to parse

                const authModal = tempDiv.querySelector('#authModal');
                const profileSetupModal = tempDiv.querySelector('#profileSetupModal');
                
                if (authModal) {
                    // Check if modal already exists to prevent duplicates if this runs multiple times unexpectedly
                    if (!document.getElementById('authModal')) {
                        document.body.appendChild(authModal);
                        console.log("globalheader.js: Auth Modal appended to body.");
                    }
                }
                if (profileSetupModal) {
                     // Check if modal already exists to prevent duplicates
                    if (!document.getElementById('profileSetupModal')) {
                        document.body.appendChild(profileSetupModal);
                        console.log("globalheader.js: Profile Setup Modal appended to body.");
                    }
                }

                // Call the function that contains all the header-specific JavaScript logic.
                // This function will find elements and attach listeners.
                initializeHeaderLogicAfterLoad();

            } else {
                console.error('globalheader.js: Placeholder div #global-header-placeholder not found!');
            }
        } catch (error) {
            console.error('globalheader.js: Error loading global header HTML or modals:', error);
            document.body.insertAdjacentHTML('afterbegin', '<p style="color:red; text-align:center; background:white; padding:10px;">Error loading global header. Please check console.</p>');
        }
    }

    // This function contains all the *header-specific* JavaScript logic
    // that needs to run *AFTER* the global header HTML (including modals) has been loaded into the DOM.
    function initializeHeaderLogicAfterLoad() {
        console.log("globalheader.js: Initializing header and modal specific JavaScript logic.");

        // --- Firebase Auth (will use global 'auth' from firebase-init.js) ---
        let auth = window.auth; // Use the globally initialized auth object
        if (!auth) {
            console.error("globalheader.js: Firebase Auth object (window.auth) not found. Header authentication features will not work.");
            // Fallback initialization (less ideal, but robust) - only if firebase-init.js failed or is missing
            if (typeof firebase !== 'undefined' && firebase.app && firebase.auth && !firebase.apps.length) {
                try {
                     const firebaseConfig = { // Using a placeholder config, should ideally be from firebase-init.js
                        apiKey: "AIzaSyAI5QB7LbFyndbk_khADbKb33iqLSO4EOw", // REPLACE WITH YOUR ACTUAL KEY from your firebase-init.js
                        authDomain: "mytorn-d03ae.firebaseapp.com",
                        projectId: "mytorn-d03ae",
                        storageBucket: "mytorn-d03ae.appspot.com",
                        messagingSenderId: "205970466308",
                        appId: "1:205970466308:web:b2f8ec5d1a38ef05213751"
                    };
                    firebase.initializeApp(firebaseConfig);
                    auth = firebase.auth();
                    console.log("Firebase initialized by globalheader.js (fallback).");
                } catch (e) {
                    console.error("Error initializing Firebase from globalheader.js (fallback):", e);
                }
            }
            // If still no auth object, subsequent auth-dependent logic will fail gracefully.
        } else {
            console.log("globalheader.js: Using Firebase Auth instance from window.auth.");
        }
        
        // --- Header Elements (selected AFTER HTML is in DOM) ---
        const headerButtonsContainer = document.getElementById('headerButtonsContainer');
        const logoutButtonHeader = document.getElementById('logoutButtonHeader');
        const headerEditProfileBtn = document.getElementById('headerEditProfileBtn'); 
        const tornCityHomepageLink = document.getElementById('tornCityHomepageLink'); 
        const signUpButtonHeader = document.getElementById('signUpButtonHeader');
        const usefulLinksBtn = document.getElementById('usefulLinksBtn');
        const usefulLinksDropdown = document.getElementById('usefulLinksDropdown');
        const contactUsBtn = document.getElementById('contactUsBtn');
        const contactUsDropdown = document.getElementById('contactUsDropdown');
        const loggedInUserDisplay = document.getElementById('logged-in-user-display'); 
        const homeButtonHeader = document.getElementById('homeButtonHeader');
        const headerLogoLink = document.getElementById('headerLogoLink'); // Get the logo link

        // --- Modal Elements (selected AFTER HTML is in DOM) ---
        const authModal = document.getElementById('authModal');
        const closeAuthModalBtn = document.getElementById('closeAuthModalBtn');
        const profileSetupModal = document.getElementById('profileSetupModal');
        const closeProfileModalBtn = document.getElementById('closeProfileModalBtn');
        // No direct use of saveProfileBtn or skipProfileSetupBtn here; they're handled by firebase-init.js


        // Initially hide all dynamic sections to prevent flash of incorrect content
        // (These styles will be overridden by auth.onAuthStateChanged)
        if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
        if (tornCityHomepageLink) tornCityHomepageLink.style.display = 'none';
        if (signUpButtonHeader) signUpButtonHeader.style.display = 'none';
        if (logoutButtonHeader) logoutButtonHeader.style.display = 'none';
        if (headerEditProfileBtn) headerEditProfileBtn.style.display = 'none';
        // Hide modals initially if they were displayed by default CSS
        if (authModal) authModal.style.display = 'none';
        if (profileSetupModal) profileSetupModal.style.display = 'none';


        // --- Firebase Auth State Listener (Controls UI) ---
        if (auth) {
            auth.onAuthStateChanged(function(user) {
                console.log("globalheader.js: Auth state changed. User:", user ? user.uid : "None");

                const currentPagePath = window.location.pathname;
                const pageName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase().replace('.html', '');
                const isLoginPage = (pageName === 'index' || pageName === ''); // Consider index as login
                const isHomePage = (pageName === 'home'); 

                // Reset display styles for all relevant elements before applying new state
                if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
                if (tornCityHomepageLink) tornCityHomepageLink.style.display = 'none';
                if (signUpButtonHeader) signUpButtonHeader.style.display = 'none';
                if (logoutButtonHeader) logoutButtonHeader.style.display = 'none';
                if (headerEditProfileBtn) headerEditProfileBtn.style.display = 'none';
                if (loggedInUserDisplay) loggedInUserDisplay.style.display = 'none';
                if (homeButtonHeader) homeButtonHeader.style.display = 'none'; // Also manage home button

                if (user) { // User is SIGNED IN
                    console.log("globalheader.js: User is SIGNED IN. Configuring logged-in header.");
                    if (headerButtonsContainer) headerButtonsContainer.style.display = 'flex';
                    if (headerEditProfileBtn) headerEditProfileBtn.style.display = 'inline-flex';
                    if (usefulLinksBtn) usefulLinksBtn.style.display = 'inline-flex';
                    if (contactUsBtn) contactUsBtn.style.display = 'inline-flex';
                    if (logoutButtonHeader) logoutButtonHeader.style.display = 'inline-flex';
                    
                    
                    // Home button: show if not on home page
                    if (homeButtonHeader && !isHomePage) {
                        homeButtonHeader.style.display = 'inline-flex';
                    }

                    // Attach Logout Listener
                    if (logoutButtonHeader) {
                        logoutButtonHeader.removeEventListener('click', handleLogout); // Remove previous to prevent duplicates
                        logoutButtonHeader.addEventListener('click', handleLogout);
                    }
                    // Attach Home Button Listener
                    if (homeButtonHeader) {
                         homeButtonHeader.removeEventListener('click', handleHomeNavigation);
                         homeButtonHeader.addEventListener('click', handleHomeNavigation);
                    }
                     // Attach Logo Link Listener
                    if (headerLogoLink) {
                        headerLogoLink.removeEventListener('click', handleHomeNavigation);
                        headerLogoLink.addEventListener('click', handleHomeNavigation);
                    }
                    // Attach Edit Profile Button Listener
                    if (headerEditProfileBtn) {
                        headerEditProfileBtn.removeEventListener('click', handleEditProfile);
                        headerEditProfileBtn.addEventListener('click', handleEditProfile);
                    }


                } else { // User is SIGNED OUT
                    console.log("globalheader.js: User is SIGNED OUT. Configuring logged-out header.");
                    if (headerButtonsContainer) headerButtonsContainer.style.display = 'none'; // Hide logged-in buttons
                    if (tornCityHomepageLink) tornCityHomepageLink.style.display = 'inline-flex';
                    if (signUpButtonHeader && !isLoginPage) { // Only show sign up button if not already on the login page
                        signUpButtonHeader.style.display = 'inline-flex';
                    }
                    // Home button: always show if logged out (leads to landing/login)
                    if (homeButtonHeader) {
                        homeButtonHeader.style.display = 'inline-flex';
                        homeButtonHeader.removeEventListener('click', handleHomeNavigation);
                        homeButtonHeader.addEventListener('click', handleHomeNavigation);
                    }
                    // Logo Link: always leads to landing page
                    if (headerLogoLink) {
                        headerLogoLink.removeEventListener('click', handleHomeNavigation);
                        headerLogoLink.addEventListener('click', handleHomeNavigation);
                    }
                     // Attach Sign Up Button Listener
                    if (signUpButtonHeader) {
                        signUpButtonHeader.removeEventListener('click', handleSignUpNavigation);
                        signUpButtonHeader.addEventListener('click', handleSignUpNavigation);
                    }
                }
                closeAllManagedHeaderDropdowns(null); // Ensure dropdowns are closed on state change
            });
        } else {
            console.warn("globalheader.js: Firebase auth not available. Header UI will not dynamically update.");
            // Default logged-out state if Firebase isn't active
            if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
            if (tornCityHomepageLink) tornCityHomepageLink.style.display = 'inline-flex';
            if (signUpButtonHeader) signUpButtonHeader.style.display = 'inline-flex';
            if (logoutButtonHeader) logoutButtonHeader.style.display = 'none';
            if (headerEditProfileBtn) headerEditProfileBtn.style.display = 'none';
        }

        // --- Navigation Handlers ---
        function handleLogout() {
            auth.signOut().then(() => {
                console.log('User signed out.');
                window.location.href = '../index.html'; // Redirect to login/landing
            }).catch((error) => {
                console.error('Sign out error:', error);
                alert('Error signing out: ' + error.message);
            });
        }

        function handleHomeNavigation() {
            window.location.href = 'home.html';
        }

        function handleSignUpNavigation() {
            window.location.href = '../index.html';
        }

        function handleEditProfile() {
            if (profileSetupModal) {
                profileSetupModal.style.display = 'flex'; // Or 'block' based on your CSS
            }
        }

        // --- Dropdown Management Logic (for header dropdowns) ---
        // Ensure these elements are part of globalheader.html
        const allHeaderDropdownsToManage = [];
        if (usefulLinksDropdown) allHeaderDropdownsToManage.push(usefulLinksDropdown);
        if (contactUsDropdown) allHeaderDropdownsToManage.push(contactUsDropdown);

        function closeAllManagedHeaderDropdowns(exceptThisOne) {
            allHeaderDropdownsToManage.forEach(dropdown => {
                if (dropdown && dropdown !== exceptThisOne && dropdown.style.display === 'block') {
                    dropdown.style.display = 'none';
                }
            });
        }

        function setupManagedDropdown(button, dropdown) {
            if (button && dropdown) {
                // Ensure a clean state by directly managing the element or re-adding listeners.
                // Using removeEventListener/addEventListener is often cleaner if element is stable.
                button.removeEventListener('click', handleDropdownClick); // Remove existing listener
                button.addEventListener('click', handleDropdownClick); // Add new one
                function handleDropdownClick(event) {
                    event.stopPropagation();
                    const isCurrentlyShown = dropdown.style.display === 'block';
                    closeAllManagedHeaderDropdowns(dropdown); // Close others
                    dropdown.style.display = isCurrentlyShown ? 'none' : 'block'; // Toggle current
                }
            }
        }
        
        // Set up dropdowns (using re-acquired elements after potential cloning from first load)
        setupManagedDropdown(document.getElementById('usefulLinksBtn'), document.getElementById('usefulLinksDropdown'));
        setupManagedDropdown(document.getElementById('contactUsBtn'), document.getElementById('contactUsDropdown'));

        // Global click listener to close dropdowns when clicking outside
        window.addEventListener('click', function(event) {
            let clickedInsideADropdownTriggerOrContent = false;
            
            // Check if click target is a dropdown button or inside a dropdown content
            const currentUsefulLinksBtn = document.getElementById('usefulLinksBtn'); 
            const currentContactUsBtn = document.getElementById('contactUsBtn');

            if (currentUsefulLinksBtn && (currentUsefulLinksBtn === event.target || currentUsefulLinksBtn.contains(event.target))) {
                clickedInsideADropdownTriggerOrContent = true;
            }
            if (currentContactUsBtn && (currentContactUsBtn === event.target || currentContactUsBtn.contains(event.target))) {
                clickedInsideADropdownTriggerOrContent = true;
            }
            
            allHeaderDropdownsToManage.forEach(dropdown => {
                if (dropdown && dropdown.contains(event.target)) {
                    clickedInsideADropdownTriggerOrContent = true;
                }
            });

            if (!clickedInsideADropdownTriggerOrContent) {
                closeAllManagedHeaderDropdowns(null); // Close all if click is outside
            }
        });

        // --- Modals Logic (Login/Signup and Profile Setup) ---
        const authModalEl = document.getElementById('authModal');
        const closeAuthModalBtnEl = document.getElementById('closeAuthModalBtn');
        const profileSetupModalEl = document.getElementById('profileSetupModal');
        const closeProfileModalBtnEl = document.getElementById('closeProfileModalBtn');
        const skipProfileSetupBtnEl = document.getElementById('skipProfileSetupBtn'); 

        if (closeAuthModalBtnEl) {
            closeAuthModalBtnEl.removeEventListener('click', closeModalAuth);
            closeAuthModalBtnEl.addEventListener('click', closeModalAuth);
            function closeModalAuth() { if (authModalEl) authModalEl.style.display = 'none'; }
        }

        if (closeProfileModalBtnEl) {
            closeProfileModalBtnEl.removeEventListener('click', closeModalProfile);
            closeProfileModalBtnEl.addEventListener('click', closeModalProfile);
            function closeModalProfile() { if (profileSetupModalEl) profileSetupModalEl.style.display = 'none'; }
        }
        if (skipProfileSetupBtnEl) {
            skipProfileSetupBtnEl.removeEventListener('click', closeModalProfile);
            skipProfileSetupBtnEl.addEventListener('click', closeModalProfile);
        }
        
        // Edit Profile button listener is attached above in the auth.onAuthStateChanged block
        // (to ensure it's only active when logged in).

        console.log("globalheader.js: Header logic initialization complete.");
    }

    // Start the process: load the HTML and then initialize its JS logic
    loadGlobalHeaderAndInitializeLogic();

    console.log("globalheader.js: End of script (initial DOMContentLoaded phase).");
});