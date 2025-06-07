// mysite/js/globalheader.js
// This script manages the header UI based on Firebase authentication state.
document.addEventListener('DOMContentLoaded', function() {
    // --- Configuration ---
    // const useMimicNotification = true; // Removed: Notification system entirely removed from header

    // --- Bell Icon SVG ---
    // const bellIconSVG = `...`; // Removed: Bell SVG not needed in header

    // Get header element references
    const headerButtonsContainer = document.getElementById('headerButtonsContainer');
    const signUpButtonHeader = document.getElementById('signUpButtonHeader');
    const homeButtonHeader = document.getElementById('homeButtonHeader');
    const logoutButtonHeader = document.getElementById('logoutButtonHeader');
    const usefulLinksBtn = document.getElementById('usefulLinksBtn'); // Also for dropdowns
    const usefulLinksDropdown = document.getElementById('usefulLinksDropdown');
    const contactUsBtn = document.getElementById('contactUsBtn');
    const contactUsDropdown = document.getElementById('contactUsDropdown');
    // let notificationBellElement = null; // Removed: Bell icon not used in header
    const tornCityHomepageLink = document.getElementById('tornCityHomepageLink');
    const loggedInUserDisplay = document.getElementById('logged-in-user-display'); // Get the user display element
    const headerEditProfileBtn = document.getElementById('headerEditProfileBtn'); // Get Edit Profile button

    // --- Initial setup for header buttons ---
    // Inject bell icon and get its reference (REMOVED)
    // if (headerButtonsContainer) {
    //     headerButtonsContainer.insertAdjacentHTML('afterbegin', bellIconSVG);
    //     notificationBellElement = document.getElementById('notificationBellIcon');
    // }

    // Make the main header buttons container visible by default (CSS defines layout)
    // This is managed by auth.onAuthStateChanged based on new rules
    if (headerButtonsContainer) {
        headerButtonsContainer.style.display = 'none'; // Initially hide, JS will show/hide as needed
    }

    // Hide all elements not immediately visible based on new rules
    if (signUpButtonHeader) signUpButtonHeader.style.display = 'none';
    if (logoutButtonHeader) logoutButtonHeader.style.display = 'none';
    if (tornCityHomepageLink) tornCityHomepageLink.style.display = 'none';
    if (loggedInUserDisplay) loggedInUserDisplay.style.display = 'none';
    if (headerEditProfileBtn) headerEditProfileBtn.style.display = 'none'; // Hide Edit Profile initially

    // --- Mimic Notification Panel Logic (REMOVED from header) ---
    // All functions related to mimic notification panel are removed:
    // closeMimicPanel, openMimicPanel, toggleMimicNotificationPanel, outsideClickListenerMimic.
    // Also removed the bell icon event listener section.

    // --- Dropdown Logic (re-used from previous scripts) ---
    // This function helps close other dropdowns if they are open
    function closeOtherDropdowns(currentDropdown, currentButton) {
        const allDropdowns = document.querySelectorAll('.dropdown-content.show');
        allDropdowns.forEach(dropdown => {
            if (dropdown !== currentDropdown) {
                dropdown.classList.remove('show');
                const associatedButton = dropdown.previousElementSibling;
                if (associatedButton && associatedButton.classList.contains('active')) {
                    associatedButton.classList.remove('active');
                }
            }
        });
    }

    // Useful Links Dropdown
    if (usefulLinksBtn && usefulLinksDropdown) {
        usefulLinksBtn.addEventListener('click', function(event) {
            event.stopPropagation();
            const currentlyOpen = usefulLinksDropdown.classList.contains('show');
            closeOtherDropdowns(usefulLinksDropdown, usefulLinksBtn);
            if (!currentlyOpen) {
                usefulLinksDropdown.classList.add('show');
                usefulLinksBtn.classList.add('active');
            } else {
                usefulLinksDropdown.classList.remove('show');
                usefulLinksBtn.classList.remove('active');
            }
        });
    }

    // Contact Us Dropdown
    if (contactUsBtn && contactUsDropdown) {
        contactUsBtn.addEventListener('click', function(event) {
            event.stopPropagation();
            const currentlyOpen = contactUsDropdown.classList.contains('show');
            closeOtherDropdowns(contactUsDropdown, contactUsBtn);
            if (!currentlyOpen) {
                contactUsDropdown.classList.add('show');
                contactUsBtn.classList.add('active');
            } else {
                contactUsDropdown.classList.remove('show');
                contactUsBtn.classList.remove('active');
            }
        });
    }

    // Global click listener to close dropdowns when clicking outside
    window.addEventListener('click', function(event) {
        // Check for Useful Links dropdown
        if (usefulLinksDropdown && usefulLinksDropdown.classList.contains('show')) {
            if (!usefulLinksBtn.contains(event.target) && !usefulLinksDropdown.contains(event.target)) {
                usefulLinksDropdown.classList.remove('show');
                usefulLinksBtn.classList.remove('active');
            }
        }
        // Check for Contact Us dropdown
        if (contactUsDropdown && contactUsDropdown.classList.contains('show')) {
            if (!contactUsBtn.contains(event.target) && !contactUsDropdown.contains(event.target)) {
                contactUsDropdown.classList.remove('show');
                contactUsBtn.classList.remove('active');
            }
        }
    });

    // --- Firebase Auth state listener (UPDATED LOGIC) ---
    // Ensure 'auth' is available from firebase-init.js (loaded before this script)
    if (typeof auth !== 'undefined') {
        auth.onAuthStateChanged(function(user) {
            console.log("globalheader.js: Auth state changed. User:", user); // Log to debug

            const currentPagePath = window.location.pathname;
            const pageName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase();
            const indexPages = ['index.html', 'home.html', '']; // Assuming 'home.html' is an alias for your root index page
            const isHomePage = indexPages.includes(pageName);

            if (user) {
                // User is signed in
                console.log("globalheader.js: User IS signed in:", user.uid);

                // --- Logged-in state specific visibility ---
                // Name display: NOT shown in header
                if (loggedInUserDisplay) loggedInUserDisplay.style.display = 'none';
                // Torn City Homepage link: NOT shown in header
                if (tornCityHomepageLink) tornCityHomepageLink.style.display = 'none';
                // Notification Bell: NOT shown in header
                // if (notificationBellElement) notificationBellElement.style.display = 'none'; // Already removed bell injection

                // Main header buttons container: ALWAYS shown when logged in
                if (headerButtonsContainer) headerButtonsContainer.style.display = 'flex';

                // Home vs Edit Profile
                if (homeButtonHeader) {
                    if (isHomePage) {
                        homeButtonHeader.style.display = 'none'; // Hide Home on homepage
                    } else {
                        homeButtonHeader.style.display = 'inline-flex'; // Show Home on other pages
                    }
                }
                if (headerEditProfileBtn) {
                    if (isHomePage) {
                        headerEditProfileBtn.style.display = 'inline-flex'; // Show Edit Profile on homepage
                    } else {
                        headerEditProfileBtn.style.display = 'none'; // Hide Edit Profile on other pages
                    }
                }

                // Sign Up button: Hidden when logged in
                if (signUpButtonHeader) signUpButtonHeader.style.display = 'none';

                // Logout button: Shown when logged in
                if (logoutButtonHeader) {
                    logoutButtonHeader.style.display = 'inline-flex';
                    logoutButtonHeader.onclick = function() {
                        auth.signOut().then(() => {
                            console.log('User signed out');
                            // Redirect to home page after logout if needed
                            if (!indexPages.includes(pageName)) {
                                window.location.href = 'home.html'; // Adjust path if home is in root, e.g., '../home.html'
                            }
                        }).catch((error) => {
                            console.error('Sign out error', error);
                        });
                    };
                }

            } else {
                // No user is signed in (Logged Out)
                console.log("globalheader.js: No user is signed in.");

                // --- Logged-out state specific visibility ---
                // Name display: NOT shown in header
                if (loggedInUserDisplay) loggedInUserDisplay.style.display = 'none';
                // Notification Bell: NOT shown in header
                // if (notificationBellElement) notificationBellElement.style.display = 'none'; // Already removed bell injection

                // Torn City Homepage link: Shown when logged out
                if (tornCityHomepageLink) tornCityHomepageLink.style.display = 'inline-flex';

                // Main header buttons container: Hidden when logged out
                if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
                
                // Sign Up button: Shown when logged out (unless on signup page)
                if (signUpButtonHeader) {
                    if (!indexPages.includes(pageName) && pageName !== 'signup.html') {
                        signUpButtonHeader.style.display = 'inline-flex';
                    } else {
                        signUpButtonHeader.style.display = 'none';
                    }
                }

                // Logout button: Hidden when logged out
                if (logoutButtonHeader) logoutButtonHeader.style.display = 'none';

                // Home & Edit Profile buttons: Hidden when logged out
                if (homeButtonHeader) homeButtonHeader.style.display = 'none';
                if (headerEditProfileBtn) headerEditProfileBtn.style.display = 'none';
            }
        });
    } else {
        console.warn("Firebase auth object is not available for header UI script. Ensure Firebase App and Auth SDKs are loaded correctly before globalheader.js.");
        // Fallback: If Firebase not loaded, assume logged out state
        if (headerButtonsContainer) headerButtonsContainer.style.display = 'none'; // Hidden if no auth control
        if (logoutButtonHeader) logoutButtonHeader.style.display = 'none';
        if (signUpButtonHeader) { // Show register if not on index/signup page if auth is not available
            const currentPagePath = window.location.pathname;
            const pageName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase();
            const indexPages = ['index.html', 'home.html', ''];
            if (!indexPages.includes(pageName) && pageName !== 'signup.html') {
                signUpButtonHeader.style.display = 'inline-flex';
            } else {
                signUpButtonHeader.style.display = 'none';
            }
        }
        if (tornCityHomepageLink) tornCityHomepageLink.style.display = 'none'; // Hidden if no auth control
        if (loggedInUserDisplay) loggedInUserDisplay.style.display = 'none';
        if (homeButtonHeader) homeButtonHeader.style.display = 'none';
        if (headerEditProfileBtn) headerEditProfileBtn.style.display = 'none';
    }
});