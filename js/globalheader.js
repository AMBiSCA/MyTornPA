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
    const contactUsBtn = document.getElementById('headerContactUsBtn'); // Corrected ID here to match HTML
    const contactUsDropdown = document.getElementById('headerContactUsDropdown'); // This is the dropdown-content DIV
    
    const tornCityHomepageLink = document.getElementById('tornCityHomepageLink');
    const loggedInUserDisplay = document.getElementById('logged-in-user-display');
    const headerEditProfileBtn = document.getElementById('headerEditProfileBtn');

    // --- Initial display of elements (managed by JS based on rules) ---
    // All header elements are initially hidden. Their display will be set by auth.onAuthStateChanged.
    // This is safer than relying on HTML default and then hiding.
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

    // --- Firebase Auth state listener (UPDATED LOGIC for all header elements) ---
    // This script should manage the header UI based on Firebase authentication state.
    // It should NOT call social.js's initialization functions.
    if (typeof auth !== 'undefined') {
        auth.onAuthStateChanged(function(user) {
            console.log("globalheader.js: Auth state changed. User:", user);

            const currentPagePath = window.location.pathname;
            const pageName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase();
            const indexPages = ['index.html', 'home.html', ''];
            const isHomePage = indexPages.includes(pageName);
            const isSignUpPage = (pageName === 'signup.html');

            if (user) {
                // User is signed in
                console.log("globalheader.js: User IS signed in:", user.uid);

                // Elements NOT shown in header when logged in
                if (loggedInUserDisplay) loggedInUserDisplay.style.display = 'none'; // "Hello, [Name]!" (if you have one)
                if (tornCityHomepageLink) tornCityHomepageLink.style.display = 'none'; // "Torn City - Homepage" link (if you have one)
                if (signUpButtonHeader) signUpButtonHeader.style.display = 'none'; // Hide Register button
                
                // Main header buttons container: ALWAYS shown when logged in, unless it's the very root index
                if (headerButtonsContainer) {
                    // Assuming 'home.html' is the hub page, we should *show* the buttons on it.
                    // If 'index.html' is a public landing, then hide.
                    if (isSignUpPage || isHomePage) { // Assuming home.html is the current hub page
                        headerButtonsContainer.style.display = 'none'; // Hide all if on signup/home (if home is the hub)
                    } else {
                        headerButtonsContainer.style.display = 'flex'; // Show if on other pages
                    }
                }
                
                // Specific button visibility for logged-in state
                if (logoutButtonHeader) logoutButtonHeader.style.display = 'inline-flex'; // Show Logout
                if (headerEditProfileBtn) headerEditProfileBtn.style.display = 'inline-flex'; // Always show Edit Profile when logged in

                // Home button logic: show if not on home page itself
                if (homeButtonHeader) {
                    if (isHomePage) {
                        homeButtonHeader.style.display = 'none'; // Hide Home button if already on the home page
                    } else {
                        homeButtonHeader.style.display = 'inline-flex'; // Show Home button on other pages
                    }
                }

            } else {
                // No user is signed in (Logged Out)
                console.log("globalheader.js: No user is signed in.");

                // Hide all logged-in specific elements
                if (loggedInUserDisplay) loggedInUserDisplay.style.display = 'none';
                if (headerButtonsContainer) headerButtonsContainer.style.display = 'none'; // Hide main buttons container
                if (logoutButtonHeader) logoutButtonHeader.style.display = 'none';
                if (homeButtonHeader) homeButtonHeader.style.display = 'none';
                if (headerEditProfileBtn) headerEditProfileBtn.style.display = 'none';

                // Display logged-out specific elements (based on current page)
                if (tornCityHomepageLink) tornCityHomepageLink.style.display = 'inline-flex'; // Torn City Homepage link: Show
                if (signUpButtonHeader) { // Register button: Show (unless on signup page)
                    if (isSignUpPage) {
                        signUpButtonHeader.style.display = 'none'; // Hide Register button if already on the signup page
                    } else {
                        signUpButtonHeader.style.display = 'inline-flex'; // Show Register button on other pages
                    }
                }
            }
        });
    } else {
        console.warn("Firebase auth object is not available for header UI script. Ensure Firebase App and Auth SDKs are loaded correctly before globalheader.js.");
        // Fallback: If Firebase not loaded, assume logged out state and set minimal header
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