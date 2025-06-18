// mysite/js/globalheader.js
// This script manages the header UI based on Firebase authentication state.
document.addEventListener('DOMContentLoaded', function() {
    // Get header element references (all must be top-level for initial hiding)
    const headerButtonsContainer = document.getElementById('headerButtonsContainer');
    const signUpButtonHeader = document.getElementById('signUpButtonHeader');
    const homeButtonHeader = document.getElementById('homeButtonHeader');
    const logoutButtonHeader = document.getElementById('logoutButtonHeader');
    const usefulLinksBtn = document.getElementById('usefulLinksBtn');
    const usefulLinksDropdown = document.getElementById('usefulLinksDropdown'); // Actual content div
    const contactUsBtn = document.getElementById('contactUsBtn');
    const contactUsDropdown = document.getElementById('contactUsDropdown'); // Actual content div
    const tornCityHomepageLink = document.getElementById('tornCityHomepageLink');
    const loggedInUserDisplay = document.getElementById('loggedInUserDisplay'); 
    const headerEditProfileBtn = document.getElementById('headerEditProfileBtn');
    const headerLogoLink = document.getElementById('headerLogoLink'); // Get reference to the logo link

    // --- Initial display of elements ---
    if (headerButtonsContainer) headerButtonsContainer.style.setProperty('display', 'none', 'important');
    if (signUpButtonHeader) signUpButtonHeader.style.setProperty('display', 'none', 'important');
    if (homeButtonHeader) homeButtonHeader.style.setProperty('display', 'none', 'important'); 
    if (logoutButtonHeader) logoutButtonHeader.style.setProperty('display', 'none', 'important');
    if (tornCityHomepageLink) tornCityHomepageLink.style.setProperty('display', 'none', 'important');
    if (loggedInUserDisplay) loggedInUserDisplay.style.setProperty('display', 'none', 'important');
    if (headerEditProfileBtn) headerEditProfileBtn.style.setProperty('display', 'none', 'important');

    if (usefulLinksBtn) usefulLinksBtn.style.setProperty('display', 'none', 'important');
    if (contactUsBtn) contactUsBtn.style.setProperty('display', 'none', 'important');    

    // --- Dropdown Logic ---
    function closeOtherDropdowns(currentDropdownElement, currentButtonElement) {
        const allDropdownContents = document.querySelectorAll('.dropdown-content.show');
        allDropdownContents.forEach(dropdownContent => {
            if (dropdownContent !== currentDropdownElement) {
                dropdownContent.classList.remove('show');
                dropdownContent.style.removeProperty('display');  
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
                usefulLinksDropdown.style.removeProperty('display');  
            } else {
                usefulLinksDropdown.classList.remove('show');
                usefulLinksBtn.classList.remove('active');
                usefulLinksDropdown.style.removeProperty('display');  
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
                contactUsDropdown.style.removeProperty('display');  
            } else {
                contactUsDropdown.classList.remove('show');
                contactUsBtn.classList.remove('active');
                contactUsDropdown.style.removeProperty('display');  
            }
        });
    }

    // Global click listener to close dropdowns when clicking outside
    window.addEventListener('click', function(event) {
        if (usefulLinksDropdown && usefulLinksDropdown.classList.contains('show')) {
            if (!usefulLinksBtn.contains(event.target) && !usefulLinksDropdown.contains(event.target)) {
                usefulLinksDropdown.classList.remove('show');
                usefulLinksBtn.classList.remove('active');
                usefulLinksDropdown.style.removeProperty('display');  
            }
        }
        if (contactUsDropdown && contactUsDropdown.classList.contains('show')) {
            if (!contactUsBtn.contains(event.target) && !contactUsDropdown.contains(event.target)) {
                contactUsDropdown.classList.remove('show');
                contactUsBtn.classList.remove('active');
                contactUsDropdown.style.removeProperty('display');  
            }
        }
    });

    // --- Firebase Auth state listener (Controls header button visibility and NAVIGATION) ---
    if (typeof auth !== 'undefined') {
        auth.onAuthStateChanged(function(user) {
            console.log("globalheader.js: Auth state changed. User:", user);

            const currentPagePath = window.location.pathname;
            const pageName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase();
            const publicLandingPages = ['index.html', ''];  
            const isSignUpPage = (pageName === 'signup.html');
            const isHomePage = (pageName === 'home.html' || pageName === ''); 

            if (user) {
                console.log("globalheader.js: User IS signed in:", user.uid);

                // Hide elements specific to logged-out state
                if (loggedInUserDisplay) loggedInUserDisplay.style.setProperty('display', 'none', 'important');
                if (tornCityHomepageLink) tornCityHomepageLink.style.setProperty('display', 'none', 'important');
                if (signUpButtonHeader) signUpButtonHeader.style.setProperty('display', 'none', 'important');

                // Show main header buttons container unless it's a specific public landing/signup page
                if (headerButtonsContainer) {
                    if (publicLandingPages.includes(pageName) || isSignUpPage) {
                        headerButtonsContainer.style.setProperty('display', 'none', 'important');
                    } else {
                        headerButtonsContainer.style.setProperty('display', 'flex', 'important'); 
                    }
                }

                // Explicitly set display for each individual button when logged in (forced with !important)
                if (logoutButtonHeader) logoutButtonHeader.style.setProperty('display', 'inline-flex', 'important');
                if (headerEditProfileBtn) headerEditProfileBtn.style.setProperty('display', 'inline-flex', 'important');
                if (usefulLinksBtn) usefulLinksBtn.style.setProperty('display', 'inline-flex', 'important');
                if (contactUsBtn) contactUsBtn.style.setProperty('display', 'inline-flex', 'important');

                // Home button logic (in header): hide if current page is the conceptual "home" or "dashboard"
                if (homeButtonHeader) {
                    if (isHomePage || pageName === 'social.html' || pageName === 'dashboard.html') { 
                        homeButtonHeader.style.setProperty('display', 'none', 'important');
                    } else {
                        homeButtonHeader.style.setProperty('display', 'inline-flex', 'important'); 
                        // Attach click listener for Home button (using a named function to allow removal)
                        homeButtonHeader.removeEventListener('click', homeNavHandler); 
                        homeButtonHeader.addEventListener('click', homeNavHandler);
                    }
                }

                // Attach click listener for Header Logo link
                if (headerLogoLink) {
                    headerLogoLink.removeEventListener('click', logoNavHandler); 
                    headerLogoLink.addEventListener('click', logoNavHandler);
                }

                // --- ADDED LOGOUT FUNCTIONALITY ---
                if (logoutButtonHeader) {
                    logoutButtonHeader.removeEventListener('click', logoutHandler); 
                    logoutButtonHeader.addEventListener('click', logoutHandler);
                }

            } else {
                // No user is signed in (Logged Out)
                console.log("globalheader.js: No user is signed in.");

                // Hide all logged-in specific elements and show logged-out specific elements (forced with !important)
                if (loggedInUserDisplay) loggedInUserDisplay.style.setProperty('display', 'none', 'important');
                if (headerButtonsContainer) headerButtonsContainer.style.setProperty('display', 'none', 'important');
                if (logoutButtonHeader) logoutButtonHeader.style.setProperty('display', 'none', 'important');
                if (homeButtonHeader) homeButtonHeader.style.setProperty('display', 'none', 'important');
                if (headerEditProfileBtn) headerEditProfileBtn.style.setProperty('display', 'none', 'important');
                if (usefulLinksBtn) usefulLinksBtn.style.setProperty('display', 'none', 'important');
                if (contactUsBtn) contactUsBtn.style.setProperty('display', 'none', 'important');

                if (tornCityHomepageLink) tornCityHomepageLink.style.setProperty('display', 'inline-flex', 'important');
                if (signUpButtonHeader) {
                    if (isSignUpPage) {
                        signUpButtonHeader.style.setProperty('display', 'none', 'important');
                    } else {
                        signUpButtonHeader.style.setProperty('display', 'inline-flex', 'important');
                    }
                }
            }
        });
    } else {
        console.warn("globalheader.js: Firebase auth object is not available for header UI script. Ensure Firebase App and Auth SDKs are loaded correctly before globalheader.js.");
        // Fallback for when Firebase auth is not available (forced with !important)
        if (headerButtonsContainer) headerButtonsContainer.style.setProperty('display', 'none', 'important');
        if (logoutButtonHeader) logoutButtonHeader.style.setProperty('display', 'none', 'important');
        if (signUpButtonHeader) signUpButtonHeader.style.setProperty('display', 'inline-flex', 'important');
        if (tornCityHomepageLink) tornCityHomepageLink.style.setProperty('display', 'inline-flex', 'important');
        if (loggedInUserDisplay) loggedInUserDisplay.style.setProperty('display', 'none', 'important');
        if (homeButtonHeader) homeButtonHeader.style.setProperty('display', 'none', 'important');
        if (headerEditProfileBtn) headerEditProfileBtn.style.setProperty('display', 'none', 'important');
        if (usefulLinksBtn) usefulLinksBtn.style.setProperty('display', 'none', 'important');
        if (contactUsBtn) contactUsBtn.style.setProperty('display', 'none', 'important');
    }
    console.log("globalheader.js: End of script.");

    // --- Centralized Navigation Handlers (Using absolute paths for reliability) ---
    // These paths are relative to the website's root (e.g., mysite.netlify.app/)
    function homeNavHandler() {
        console.log("Navigating to /pages/home.html via Home button.");
        window.location.href = '/pages/home.html'; 
    }

    function logoNavHandler() {
        console.log("Navigating to /pages/home.html via Logo link.");
        window.location.href = '/pages/home.html'; 
    }

    function logoutHandler() {
        auth.signOut().then(() => {
            console.log("User signed out successfully.");
            // Redirect to the index/login page (assuming index.html is at the root)
            window.location.href = '/index.html'; 
        }).catch((error) => {
            console.error("Error signing out:", error);
            alert("Failed to log out. Please try again.");
        });
    }
});