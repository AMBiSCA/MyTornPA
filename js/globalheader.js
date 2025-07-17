// mysite/js/globalheader.js
// This script manages the header UI based on Firebase authentication state,
// and dynamically loads the global header HTML.

document.addEventListener('DOMContentLoaded', function() {
    console.log("globalheader.js: DOMContentLoaded event fired.");

    // Function to load the global header HTML and then initialize its JavaScript logic
    async function loadGlobalHeader() {
        // Determine the correct path to globalheader.html
        // Adjust this path if your structure is different.
        // Assuming globalheader.html is in a 'components' folder, one level up from 'js'
        const headerPath = '../pages/globalheader.html'; // Changed from '../components/globalheader.html'

        try {
            const response = await fetch(headerPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const html = await response.text();
            const headerPlaceholder = document.getElementById('global-header-placeholder');
            if (headerPlaceholder) {
                headerPlaceholder.innerHTML = html;
                console.log("globalheader.js: Global header HTML loaded successfully.");
                // Now that the header HTML is in the DOM, initialize its specific JS logic
                initializeHeaderLogic();
            } else {
                console.error('globalheader.js: Placeholder div #global-header-placeholder not found!');
            }
        } catch (error) {
            console.error('globalheader.js: Error loading global header HTML:', error);
        }
    }

    // This function contains all the original logic that needs to run AFTER the header HTML is loaded.
    function initializeHeaderLogic() {
        console.log("globalheader.js: Initializing header specific JavaScript logic.");

        // --- Get header element references ---
        const headerButtonsContainer = document.getElementById('headerButtonsContainer');
        const signUpButtonHeader = document.getElementById('signUpButtonHeader');
        const homeButtonHeader = document.getElementById('homeButtonHeader');
        const logoutButtonHeader = document.getElementById('logoutButtonHeader');
        const usefulLinksBtn = document.getElementById('usefulLinksBtn');
        const usefulLinksDropdown = document.getElementById('usefulLinksDropdown');
        const contactUsBtn = document.getElementById('contactUsBtn');
        const contactUsDropdown = document.getElementById('contactUsDropdown');
        const tornCityHomepageLink = document.getElementById('tornCityHomepageLink');
        const loggedInUserDisplay = document.getElementById('loggedInUserDisplay');
        const headerEditProfileBtn = document.getElementById('headerEditProfileBtn'); // Make sure this element is in globalheader.html if it's referenced
        const headerLogoLink = document.querySelector('.header-left a');

        // --- Dropdown Logic ---
        function closeOtherDropdowns(currentDropdown) {
            document.querySelectorAll('.dropdown-content.show').forEach(dropdown => {
                if (dropdown !== currentDropdown) {
                    dropdown.classList.remove('show');
                    const button = dropdown.previousElementSibling;
                    if (button) button.classList.remove('active');
                }
            });
        }

        function setupDropdown(button, dropdown) {
            if (button && dropdown) {
                button.addEventListener('click', function(event) {
                    event.stopPropagation();
                    const isShowing = dropdown.classList.contains('show');
                    closeOtherDropdowns(dropdown);
                    if (!isShowing) {
                        dropdown.classList.add('show');
                        button.classList.add('active');
                    }
                });
            }
        }

        setupDropdown(usefulLinksBtn, usefulLinksDropdown);
        setupDropdown(contactUsBtn, contactUsDropdown);

        window.addEventListener('click', function(event) {
            // Close dropdowns if the click is outside any dropdown button/content
            if (usefulLinksBtn && usefulLinksDropdown && !usefulLinksBtn.contains(event.target) && !usefulLinksDropdown.contains(event.target)) {
                usefulLinksDropdown.classList.remove('show');
                usefulLinksBtn.classList.remove('active');
            }
            if (contactUsBtn && contactUsDropdown && !contactUsBtn.contains(event.target) && !contactUsDropdown.contains(event.target)) {
                contactUsDropdown.classList.remove('show');
                contactUsBtn.classList.remove('active');
            }
        });


        // --- Firebase Initialization (should be available via firebase-init.js) ---
        let auth = null;
        try {
            if (typeof firebase !== 'undefined' && firebase.auth) {
                auth = firebase.auth();
                console.log("globalheader.js: Firebase Auth instance obtained successfully within initializeHeaderLogic.");
            } else {
                throw new Error("Firebase auth object not found or not initialized.");
            }
        } catch (e) {
            console.error("globalheader.js: CRITICAL ERROR initializing Firebase Auth within initializeHeaderLogic:", e);
        }

        // --- Centralized Navigation and Action Handlers (that require 'auth') ---
        function homeNavHandler() {
            window.location.href = '/pages/home.html';
        }

        function logoutHandler() {
            if (!auth) {
                console.error("Logout failed: Auth service not available.");
                alert("Authentication service is not available. Please try refreshing the page.");
                return;
            }
            auth.signOut().then(() => {
                console.log("User signed out successfully.");
                window.location.href = '/index.html'; // Redirect to login/landing page after logout
            }).catch((error) => {
                console.error("Error signing out:", error);
                alert("Failed to log out. Please try again.");
            });
        }

        // --- Firebase Auth State Listener (Controls UI) ---
        if (auth) {
            auth.onAuthStateChanged(function(user) {
                console.log("globalheader.js: Auth state changed. User:", user);

                const currentPagePath = window.location.pathname;
                // Normalize pageName for comparison: remove leading slash, remove .html extension
                const pageName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase().replace('.html', '');
                
                const publicLandingPages = ['index', '']; // 'index' for index.html, '' for root
                const isSignUpPage = (pageName === 'signup');
                const isHomePage = (pageName === 'home' || pageName === '' || pageName === 'index'); // Consider / or /index.html as home

                // Ensure all elements exist before trying to manipulate them
                const elements = {
                    headerButtonsContainer,
                    signUpButtonHeader,
                    homeButtonHeader,
                    logoutButtonHeader,
                    usefulLinksBtn,
                    contactUsBtn,
                    tornCityHomepageLink,
                    loggedInUserDisplay,
                    headerEditProfileBtn,
                    headerLogoLink
                };

                if (user) {
                    // --- USER IS LOGGED IN ---
                    if (elements.signUpButtonHeader) elements.signUpButtonHeader.style.display = 'none';
                    if (elements.tornCityHomepageLink) elements.tornCityHomepageLink.style.display = 'none';
                    // The loggedInUserDisplay should actually be shown if a user is logged in
                    // Assuming you will populate this display with user info elsewhere or it's just a placeholder
                    if (elements.loggedInUserDisplay) elements.loggedInUserDisplay.style.display = 'block'; 

                    if (elements.headerButtonsContainer) elements.headerButtonsContainer.style.display = 'flex';
                    if (elements.logoutButtonHeader) elements.logoutButtonHeader.style.display = 'inline-flex';
                    if (elements.headerEditProfileBtn) elements.headerEditProfileBtn.style.display = 'inline-flex';
                    if (elements.usefulLinksBtn) elements.usefulLinksBtn.style.display = 'inline-flex';
                    if (elements.contactUsBtn) elements.contactUsBtn.style.display = 'inline-flex';

                    if (elements.homeButtonHeader) {
                        // Hide home button if on home, social, or dashboard page
                        if (isHomePage || pageName === 'social' || pageName === 'dashboard') {
                            elements.homeButtonHeader.style.display = 'none';
                        } else {
                            elements.homeButtonHeader.style.display = 'inline-flex';
                        }
                    }

                    // Attach listeners for logged-in state (ensure they are only attached once)
                    if (elements.logoutButtonHeader) {
                        elements.logoutButtonHeader.removeEventListener('click', logoutHandler); // Remove previous listener to prevent duplicates
                        elements.logoutButtonHeader.addEventListener('click', logoutHandler);
                    }
                    if (elements.homeButtonHeader) {
                        elements.homeButtonHeader.removeEventListener('click', homeNavHandler);
                        elements.homeButtonHeader.addEventListener('click', homeNavHandler);
                    }
                    if (elements.headerLogoLink) {
                        elements.headerLogoLink.removeEventListener('click', homeNavHandler);
                        elements.headerLogoLink.addEventListener('click', homeNavHandler);
                    }

                    // Populate logged-in user display, if needed (example)
                    if (loggedInUserDisplay && user.email) {
                        loggedInUserDisplay.textContent = `Welcome, ${user.email.split('@')[0]}!`;
                    }


                } else {
                    // --- USER IS LOGGED OUT ---
                    if (elements.headerButtonsContainer) elements.headerButtonsContainer.style.display = 'none';
                    if (elements.loggedInUserDisplay) elements.loggedInUserDisplay.style.display = 'none';
                    if (elements.headerEditProfileBtn) elements.headerEditProfileBtn.style.display = 'none';

                    // Show logged-out buttons
                    if (elements.tornCityHomepageLink) elements.tornCityHomepageLink.style.display = 'inline-flex';
                    if (elements.signUpButtonHeader) {
                        elements.signUpButtonHeader.style.display = isSignUpPage ? 'none' : 'inline-flex';
                    }
                    // If you have a login button, make sure it's shown here.
                    // For example, if your home button also acts as a login/welcome back button when logged out:
                    if (elements.homeButtonHeader) {
                         elements.homeButtonHeader.style.display = 'inline-flex'; // Show it for logged-out users to navigate to home/login
                         elements.homeButtonHeader.removeEventListener('click', homeNavHandler);
                         elements.homeButtonHeader.addEventListener('click', homeNavHandler); // Attach the home handler (which leads to /pages/home.html)
                    }
                    // For logo link when logged out, it should probably lead to index.html or home.html
                    if (elements.headerLogoLink) {
                         elements.headerLogoLink.removeEventListener('click', homeNavHandler); // Remove potential previous listeners
                         elements.headerLogoLink.addEventListener('click', homeNavHandler); // Direct to home/index
                    }
                }
            });
        } else {
            // --- FALLBACK IF FIREBASE FAILS TO LOAD ---
            console.warn("globalheader.js: Firebase auth object is NULL. Can't update header UI based on auth state.");
            // Hide all conditional buttons as a fallback if Firebase completely fails
            if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
            if (signUpButtonHeader) signUpButtonHeader.style.display = 'none';
            if (tornCityHomepageLink) tornCityHomepageLink.style.display = 'inline-flex'; // Show Torn City link as a default
            // You might want to show a generic login/home button if auth is totally broken.
            if (homeButtonHeader) {
                homeButtonHeader.style.display = 'inline-flex';
                homeButtonHeader.removeEventListener('click', homeNavHandler);
                homeButtonHeader.addEventListener('click', homeNavHandler);
            }
        }
        console.log("globalheader.js: Header specific JS logic initialized.");
    }

    // Start the process: load the HTML first, then initialize its JS logic
    loadGlobalHeader();

    console.log("globalheader.js: End of script (initial DOMContentLoaded phase).");
});