// mysite/js/globalheader.js
// This script manages the header UI based on Firebase authentication state.
// Notification bell logic is now handled by a separate script.
document.addEventListener('DOMContentLoaded', function() {
    // --- Configuration ---
    // const useMimicNotification = true; // REMOVED: No longer needed here

    // --- Bell Icon SVG (REMOVED: SVG no longer injected from here) ---
    // const bellIconSVG = `...`; 

    // Get header element references
    const headerButtonsContainer = document.getElementById('headerButtonsContainer');
    const signUpButtonHeader = document.getElementById('signUpButtonHeader');
    const homeButtonHeader = document.getElementById('homeButtonHeader');
    const logoutButtonHeader = document.getElementById('logoutButtonHeader');
    const usefulLinksBtn = document.getElementById('usefulLinksBtn'); 
    const usefulLinksDropdown = document.getElementById('usefulLinksDropdown');
    const contactUsBtn = document.getElementById('contactUsBtn');
    const contactUsDropdown = document.getElementById('contactUsDropdown');
    // const notificationBellButton = document.getElementById('notificationBell'); // REMOVED: Bell logic removed
    const tornCityHomepageLink = document.getElementById('tornCityHomepageLink');
    const loggedInUserDisplay = document.getElementById('logged-in-user-display');
    const headerEditProfileBtn = document.getElementById('headerEditProfileBtn');

    // --- Initial display of elements (managed by JS based on rules) ---
    // These will all be explicitly set by auth.onAuthStateChanged
    if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
    if (signUpButtonHeader) signUpButtonHeader.style.display = 'none';
    if (logoutButtonHeader) logoutButtonHeader.style.display = 'none';
    if (tornCityHomepageLink) tornCityHomepageLink.style.display = 'none';
    if (loggedInUserDisplay) loggedInUserDisplay.style.display = 'none';
    if (headerEditProfileBtn) headerEditProfileBtn.style.display = 'none';
    // if (notificationBellButton) notificationBellButton.style.display = 'none'; // REMOVED: Bell logic removed

    // --- Mimic Notification Panel Logic (ALL REMOVED from this file) ---
    // Functions closeMimicPanel, openMimicPanel, toggleMimicNotificationPanel, outsideClickListenerMimic are removed.
    // Bell button event listener is removed.

    // --- Dropdown Logic (re-used from previous scripts) ---
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
        if (usefulLinksDropdown && usefulLinksDropdown.classList.contains('show')) {
            if (!usefulLinksBtn.contains(event.target) && !usefulLinksDropdown.contains(event.target)) {
                usefulLinksDropdown.classList.remove('show');
                usefulLinksBtn.classList.remove('active');
            }
        }
        if (contactUsDropdown && contactUsDropdown.classList.contains('show')) {
            if (!contactUsBtn.contains(event.target) && !contactUsDropdown.contains(event.target)) {
                contactUsDropdown.classList.remove('show');
                contactUsBtn.classList.remove('active');
            }
        });

    // --- Firebase Auth state listener (UPDATED LOGIC for all header elements) ---
    if (typeof auth !== 'undefined') {
        auth.onAuthStateChanged(function(user) {
            console.log("globalheader.js: Auth state changed. User:", user); 

            const currentPagePath = window.location.pathname;
            const pageName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase();
            const indexPages = ['index.html', 'home.html', ''];
            const isHomePage = indexPages.includes(pageName);

            if (user) {
                // User is signed in
                console.log("globalheader.js: User IS signed in:", user.uid);

                // Elements NOT shown in header when logged in (based on your rules)
                if (loggedInUserDisplay) loggedInUserDisplay.style.display = 'none'; // "Hello, [Name]!"
                if (tornCityHomepageLink) tornCityHomepageLink.style.display = 'none'; // "Torn City - Homepage" link

                // Main header buttons container: ALWAYS shown when logged in
                if (headerButtonsContainer) headerButtonsContainer.style.display = 'flex';
                
                // Set specific element visibility for logged-in state
                if (signUpButtonHeader) signUpButtonHeader.style.display = 'none'; // Hide Register
                if (logoutButtonHeader) logoutButtonHeader.style.display = 'inline-flex'; // Show Logout

                // Home vs Edit Profile logic
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

                // Bell icon: No logic here, as it's managed externally (REMOVED from this file's control)
                // if (notificationBellButton) notificationBellButton.style.display = 'none'; 

            } else {
                // No user is signed in (Logged Out)
                console.log("globalheader.js: No user is signed in.");

                // Hide all logged-in specific elements
                if (loggedInUserDisplay) loggedInUserDisplay.style.display = 'none';
                if (headerButtonsContainer) headerButtonsContainer.style.display = 'none'; // Hide main buttons container
                if (logoutButtonHeader) logoutButtonHeader.style.display = 'none';
                if (homeButtonHeader) homeButtonHeader.style.display = 'none';
                if (headerEditProfileBtn) headerEditProfileBtn.style.display = 'none';
                // if (notificationBellButton) notificationBellButton.style.display = 'none'; // REMOVED: Bell logic removed

                // Display logged-out specific elements
                if (tornCityHomepageLink) tornCityHomepageLink.style.display = 'inline-flex'; // Torn City Homepage link: Shown
                if (signUpButtonHeader) { // Register button: Shown (unless on signup page)
                    if (!isHomePage && pageName !== 'signup.html') { // Not home/index and not signup
                        signUpButtonHeader.style.display = 'inline-flex';
                    } else {
                        signUpButtonHeader.style.display = 'none';
                    }
                }
            }
        });
    } else {
        console.warn("Firebase auth object is not available for header UI script. Ensure Firebase App and Auth SDKs are loaded correctly before globalheader.js.");
        // Fallback: If Firebase not loaded, assume logged out state and set minimal header
        if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
        if (logoutButtonHeader) logoutButtonHeader.style.display = 'none';
        if (signUpButtonHeader) {
            const currentPagePath = window.location.pathname;
            const pageName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase();
            const indexPages = ['index.html', 'home.html', ''];
            if (!indexPages.includes(pageName) && pageName !== 'signup.html') {
                signUpButtonHeader.style.display = 'inline-flex';
            } else {
                signUpButtonHeader.style.display = 'none';
            }
        }
        if (tornCityHomepageLink) tornCityHomepageLink.style.display = 'inline-flex'; // Show torncity link by default if auth not available
        if (loggedInUserDisplay) loggedInUserDisplay.style.display = 'none';
        if (homeButtonHeader) homeButtonHeader.style.display = 'none';
        if (headerEditProfileBtn) headerEditProfileBtn.style.display = 'none';
        // if (notificationBellButton) notificationBellButton.style.display = 'none'; // REMOVED: Bell logic removed
    }
});