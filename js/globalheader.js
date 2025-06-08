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
    // CORRECTED: Changed ID from 'headerContactUsBtn' to 'contactUsBtn' to match HTML
    const contactUsBtn = document.getElementById('contactUsBtn');
    const contactUsDropdown = document.getElementById('contactUsDropdown'); // Actual content div
    const tornCityHomepageLink = document.getElementById('tornCityHomepageLink');
    const loggedInUserDisplay = document.getElementById('loggedInUserDisplay'); // Assuming this ID from HTML
    const headerEditProfileBtn = document.getElementById('headerEditProfileBtn');

    // --- Initial display of elements ---
    // Setting display properties with !important to force initial hide against any default CSS.
    // This is crucial for *buttons* which are conditionally visible.
    if (headerButtonsContainer) headerButtonsContainer.style.setProperty('display', 'none', 'important');
    if (signUpButtonHeader) signUpButtonHeader.style.setProperty('display', 'none', 'important');
    if (homeButtonHeader) homeButtonHeader.style.setProperty('display', 'none', 'important');
    if (logoutButtonHeader) logoutButtonHeader.style.setProperty('display', 'none', 'important');
    if (tornCityHomepageLink) tornCityHomepageLink.style.setProperty('display', 'none', 'important');
    if (loggedInUserDisplay) loggedInUserDisplay.style.setProperty('display', 'none', 'important');
    if (headerEditProfileBtn) headerEditProfileBtn.style.setProperty('display', 'none', 'important');

    // For dropdown BUTTONS: Explicitly hide them initially. Their visibility is managed by auth state.
    if (usefulLinksBtn) usefulLinksBtn.style.setProperty('display', 'none', 'important');
    if (contactUsBtn) contactUsBtn.style.setProperty('display', 'none', 'important');     

    // For dropdown CONTENT (usefulLinksDropdown, contactUsDropdown):
    // We DO NOT set inline display:none !important initially here.
    // We rely on global.css .dropdown-content { display: none; } for initial hide.
    // This is crucial so that removeProperty('display') can work when the 'show' class is added.


    // --- Dropdown Logic ---
    function closeOtherDropdowns(currentDropdownElement, currentButtonElement) {
        const allDropdownContents = document.querySelectorAll('.dropdown-content.show');
        allDropdownContents.forEach(dropdownContent => {
            if (dropdownContent !== currentDropdownElement) {
                dropdownContent.classList.remove('show');
                // IMPORTANT FIX: Remove inline display style to let CSS (display: none;) re-hide it
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
                // <<< CRITICAL FIX HERE (Confirmed present in this code) >>>
                // When showing the dropdown, explicitly remove any inline 'display' property
                // so that the '.show' class can apply its 'display: block;'.
                usefulLinksDropdown.style.removeProperty('display'); 
            } else {
                usefulLinksDropdown.classList.remove('show');
                usefulLinksBtn.classList.remove('active');
                // When hiding, also remove inline 'display' to let global.css default 'display: none;' take over.
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
                // <<< CRITICAL FIX HERE (Confirmed present in this code) >>>
                // When showing the dropdown, explicitly remove any inline 'display' property
                // so that the '.show' class can apply its 'display: block;'.
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

    // --- Firebase Auth state listener (Controls header button visibility) ---
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
                    if (isHomePage || pageName === 'social.html') { 
                        homeButtonHeader.style.setProperty('display', 'none', 'important');
                    } else {
                        homeButtonHeader.style.setProperty('display', 'inline-flex', 'important'); 
                    }
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
});