// mysite/js/globalheader.js
// This script manages the header UI based on Firebase authentication state.
// Notification bell logic is now handled EXCLUSIVELY by a separate script (e.g., notification.js).
document.addEventListener('DOMContentLoaded', function() {
    // Get header element references
    const headerButtonsContainer = document.getElementById('headerButtonsContainer');
    const signUpButtonHeader = document.getElementById('signUpButtonHeader');
    const homeButtonHeader = document.getElementById('homeButtonHeader');
    const logoutButtonHeader = document.getElementById('logoutButtonHeader');

    const usefulLinksBtn = document.getElementById('usefulLinksBtn');
    const usefulLinksDropdown = document.getElementById('usefulLinksDropdown');
    const contactUsBtn = document.getElementById('headerContactUsBtn');
    const contactUsDropdown = document.getElementById('headerContactUsDropdown');
    
    const tornCityHomepageLink = document.getElementById('tornCityHomepageLink');
    const loggedInUserDisplay = document.getElementById('logged-in-user-display');
    const headerEditProfileBtn = document.getElementById('headerEditProfileBtn');

    // --- Initial display of elements (managed by JS based on rules) ---
    if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
    if (signUpButtonHeader) signUpButtonHeader.style.display = 'none';
    if (homeButtonHeader) homeButtonHeader.style.display = 'none';
    if (logoutButtonHeader) logoutButtonHeader.style.display = 'none';
    if (tornCityHomepageLink) tornCityHomepageLink.style.display = 'none';
    if (loggedInUserDisplay) loggedInUserDisplay.style.display = 'none';
    if (headerEditProfileBtn) headerEditProfileBtn.style.display = 'none';

    // --- Dropdown Logic ---
    function closeOtherDropdowns(currentDropdownElement, currentButtonElement) {
        const allDropdownContents = document.querySelectorAll('.dropdown-content.show');
        allDropdownContents.forEach(dropdownContent => {
            if (dropdownContent !== currentDropdownElement) {
                dropdownContent.classList.remove('show');
                const associatedButton = dropdownContent.previousElementSibling;
                if (associatedButton && associatedButton.classList.contains('btn') && associatedButton.classList.contains('active')) {
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
        }
    });

    // --- Firebase Auth state listener ---
    if (typeof auth !== 'undefined') {
        auth.onAuthStateChanged(function(user) {
            console.log("globalheader.js: Auth state changed. User:", user);

            const currentPagePath = window.location.pathname;
            const pageName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase();
            const indexPages = ['index.html', 'home.html', ''];
            const isHomePage = indexPages.includes(pageName);
            const isSignUpPage = (pageName === 'signup.html');

            if (user) {
                console.log("globalheader.js: User IS signed in:", user.uid);

                if (loggedInUserDisplay) loggedInUserDisplay.style.display = 'none';
                if (tornCityHomepageLink) tornCityHomepageLink.style.display = 'none';
                if (signUpButtonHeader) signUpButtonHeader.style.display = 'none';
                
                if (headerButtonsContainer) {
                    if (isSignUpPage || isHomePage) {
                        headerButtonsContainer.style.display = 'none';
                    } else {
                        headerButtonsContainer.style.display = 'flex';
                    }
                }
                
                if (logoutButtonHeader) logoutButtonHeader.style.display = 'inline-flex';
                if (headerEditProfileBtn) headerEditProfileBtn.style.display = 'inline-flex';

                if (homeButtonHeader) {
                    if (isHomePage) {
                        homeButtonHeader.style.display = 'none';
                    } else {
                        homeButtonHeader.style.display = 'inline-flex';
                    }
                }

                // >>> ADDED: Call the social hub initializer after user is confirmed logged in and header is set up
                if (typeof window.initializeSocialHub === 'function') {
                    window.initializeSocialHub(user);
                } else {
                    console.warn("globalheader.js: window.initializeSocialHub is not defined. Social hub content might not load.");
                }

            } else {
                console.log("globalheader.js: No user is signed in.");

                if (loggedInUserDisplay) loggedInUserDisplay.style.display = 'none';
                if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
                if (logoutButtonHeader) logoutButtonHeader.style.display = 'none';
                if (homeButtonHeader) homeButtonHeader.style.display = 'none';
                if (headerEditProfileBtn) headerEditProfileBtn.style.display = 'none';

                if (tornCityHomepageLink) tornCityHomepageLink.style.display = 'inline-flex';
                if (signUpButtonHeader) {
                    if (isSignUpPage) {
                        signUpButtonHeader.style.display = 'none';
                    } else {
                        signUpButtonHeader.style.display = 'inline-flex';
                    }
                }
            }
        });
    } else {
        console.warn("Firebase auth object is not available for header UI script. Ensure Firebase App and Auth SDKs are loaded correctly before globalheader.js.");
        if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
        if (logoutButtonHeader) logoutButtonHeader.style.display = 'none';
        if (signUpButtonHeader) signUpButtonHeader.style.display = 'inline-flex';
        if (tornCityHomepageLink) tornCityHomepageLink.style.display = 'inline-flex';
        if (loggedInUserDisplay) loggedInUserDisplay.style.display = 'none';
        if (homeButtonHeader) homeButtonHeader.style.display = 'none';
        if (headerEditProfileBtn) headerEditProfileBtn.style.display = 'none';
    }
    console.log("globalheader.js: End of script.");
});