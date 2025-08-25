// mysite/js/globalheader.js
// Manages global header loading and authentication UI.

document.addEventListener('DOMContentLoaded', function() {
    console.log("globalheader.js: DOMContentLoaded event fired.");

    // Loads header HTML, then initializes its logic
    async function loadGlobalHeaderAndInitializeLogic() {
        const headerPath = '../pages/globalheader.html';
        try {
            const response = await fetch(headerPath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const html = await response.text();
            const headerPlaceholder = document.getElementById('global-header-placeholder');

            if (headerPlaceholder) {
                headerPlaceholder.innerHTML = html;
                console.log("globalheader.js: Global header HTML loaded.");
                initializeHeaderLogicAfterLoad();
            } else {
                console.error('globalheader.js: Placeholder #global-header-placeholder not found!');
            }
        } catch (error) {
            console.error('globalheader.js: Error loading global header:', error);
        }
    }

    function initializeHeaderLogicAfterLoad() {
        console.log("globalheader.js: Initializing header logic.");

        // --- Auth State Change Handler ---
        const auth = window.auth;
        if (!auth) {
            console.error("globalheader.js: Firebase Auth object not found.");
            return; // Stop if Firebase isn't initialized
        }

        const headerButtonsContainer = document.getElementById('headerButtonsContainer');
        const logoutButtonHeader = document.getElementById('logoutButtonHeader');
        const headerEditProfileBtn = document.getElementById('headerEditProfileBtn');
        const tornCityHomepageLink = document.getElementById('tornCityHomepageLink');
        const usefulLinksBtn = document.getElementById('usefulLinksBtn');
        const contactUsBtn = document.getElementById('contactUsBtn');
        const homeButtonHeader = document.getElementById('homeButtonHeader');
        const profileSetupModal = document.getElementById('profileSetupModal');


        auth.onAuthStateChanged(function(user) {
            console.log("globalheader.js: Auth state changed. User:", user ? user.uid : "None");
            const currentPagePath = window.location.pathname;
            const pageName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase().replace('.html', '');
            const isHomePage = (pageName === 'home');
            const isIndexPage = (pageName === 'index' || pageName === '');

            // --- Reset Header to a clean state ---
            if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
            if (tornCityHomepageLink) tornCityHomepageLink.style.display = 'none';
            if (logoutButtonHeader) logoutButtonHeader.style.display = 'none';
            if (headerEditProfileBtn) headerEditProfileBtn.style.display = 'none';
            // We will manage the display of the headerEditProfileBtn with the CSS class.
            if (homeButtonHeader) homeButtonHeader.style.display = 'none';
           
            if (user) {
                // --- User is LOGGED IN ---
                // 1. Prepare all the correct buttons while the container is hidden
                if (usefulLinksBtn) usefulLinksBtn.style.display = 'inline-flex';
                if (contactUsBtn) contactUsBtn.style.display = 'inline-flex';
                if (logoutButtonHeader) logoutButtonHeader.style.display = 'inline-flex';

                if (isHomePage) {
                if (headerEditProfileBtn) headerEditProfileBtn.style.display = 'inline-flex';
            } else {
                if (homeButtonHeader) homeButtonHeader.style.display = 'inline-flex';
            }
                // 2. Now, show the container with the correct buttons already set. This prevents the flash.
                if (headerButtonsContainer) headerButtonsContainer.style.display = 'flex';

                // --- Assign event listeners for logged-in state ---
                if (logoutButtonHeader) logoutButtonHeader.onclick = handleLogout;
                if (homeButtonHeader) homeButtonHeader.onclick = () => window.location.href = '/pages/home.html';
                if (headerEditProfileBtn) headerEditProfileBtn.onclick = () => {
                    if (profileSetupModal) profileSetupModal.style.display = 'flex';
                };

            } else {
                // --- User is LOGGED OUT ---
                if (tornCityHomepageLink) tornCityHomepageLink.style.display = 'inline-flex';
                if (!isIndexPage) {
                    if (homeButtonHeader) homeButtonHeader.style.display = 'inline-flex';
                }
            }
            closeAllManagedHeaderDropdowns(null);
        });

        // --- Header Action Handlers ---
        function handleLogout() {
            auth.signOut().then(() => {
                console.log('User signed out.');
                window.location.href = '/index.html';
            }).catch((error) => {
                console.error('Sign out error:', error);
                alert('Error signing out: ' + error.message);
            });
        }

        // --- Dropdown Menu Logic ---
        const usefulLinksDropdown = document.getElementById('usefulLinksDropdown');
        const contactUsDropdown = document.getElementById('contactUsDropdown');
        const allHeaderDropdownsToManage = [usefulLinksDropdown, contactUsDropdown].filter(Boolean);

        function closeAllManagedHeaderDropdowns(exceptThisOne) {
            allHeaderDropdownsToManage.forEach(dropdown => {
                if (dropdown !== exceptThisOne) {
                    dropdown.style.display = 'none';
                }
            });
        }

        function setupManagedDropdown(button, dropdown) {
            if (button && dropdown) {
                button.addEventListener('click', (event) => {
                    event.stopPropagation();
                    const isCurrentlyShown = dropdown.style.display === 'block';
                    closeAllManagedHeaderDropdowns(dropdown); // Close others
                    dropdown.style.display = isCurrentlyShown ? 'none' : 'block';
                });
            }
        }
        
        setupManagedDropdown(usefulLinksBtn, usefulLinksDropdown);
        setupManagedDropdown(contactUsBtn, contactUsDropdown);

        // Global click listener to close dropdowns when clicking away
        window.addEventListener('click', () => {
            closeAllManagedHeaderDropdowns(null);
        });

        console.log("globalheader.js: Header logic initialization complete.");
    }

    loadGlobalHeaderAndInitializeLogic();
    console.log("globalheader.js: End of script.");
});