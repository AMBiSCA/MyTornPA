// mysite/js/globalheader.js
// This script dynamically loads the global header HTML and manages its UI based on Firebase authentication state.

document.addEventListener('DOMContentLoaded', function() {
    console.log("globalheader.js: DOMContentLoaded event fired.");

    // Function to load the global header HTML (and modals) and then initialize its JavaScript logic
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
                console.log("globalheader.js: Global header HTML loaded successfully into placeholder.");

                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;

                const authModal = tempDiv.querySelector('#authModal');
                const profileSetupModal = tempDiv.querySelector('#profileSetupModal');
                const customAlertFromHTML = tempDiv.querySelector('#customAlert');
                const globalConfirmModalFromHTML = tempDiv.querySelector('#globalConfirmModal');

                if (authModal && !document.getElementById('authModal')) {
                    document.body.appendChild(authModal);
                    console.log("globalheader.js: Auth Modal appended to body.");
                }
                if (profileSetupModal && !document.getElementById('profileSetupModal')) {
                    document.body.appendChild(profileSetupModal);
                    console.log("globalheader.js: Profile Setup Modal appended to body.");
                }
                if (customAlertFromHTML && !document.getElementById('customAlert')) {
                    document.body.appendChild(customAlertFromHTML);
                    console.log("globalheader.js: Custom Alert Modal appended to body.");
                }
                if (globalConfirmModalFromHTML && !document.getElementById('globalConfirmModal')) {
                    document.body.appendChild(globalConfirmModalFromHTML);
                    console.log("globalheader.js: Global Confirm Modal appended to body.");
                }

                initializeHeaderLogicAfterLoad();

            } else {
                console.error('globalheader.js: Placeholder div #global-header-placeholder not found!');
            }
        } catch (error) {
            console.error('globalheader.js: Error loading global header HTML or modals:', error);
            document.body.insertAdjacentHTML('afterbegin', '<p style="color:red; text-align:center; background:white; padding:10px;">Error loading global header. Please check console.</p>');
        }
    }

    function initializeHeaderLogicAfterLoad() {
        console.log("globalheader.js: Initializing header and modal specific JavaScript logic.");

        // --- Custom Alert System ---
        const customAlertEl = document.getElementById('customAlert');
        const customAlertTitleEl = document.getElementById('customAlertTitle');
        const customAlertMessageEl = document.getElementById('customAlertMessage');
        const customAlertOkBtn = document.getElementById('customAlertOkBtn');

        function hideCustomAlert() {
            if (customAlertEl) {
                customAlertEl.classList.remove('visible');
            }
        }

        window.showCustomAlert = function(message, title = 'Notification') {
            if (customAlertEl && customAlertMessageEl && customAlertOkBtn && customAlertTitleEl) {
                customAlertTitleEl.textContent = title;
                customAlertMessageEl.textContent = message;
                customAlertEl.classList.add('visible');
                
                customAlertEl.removeEventListener('click', handleAlertClicks);
                customAlertEl.addEventListener('click', handleAlertClicks);
            } else {
                console.error("Custom alert elements not found, falling back to native alert.");
                const originalAlert = window.alert;
                originalAlert(message);
            }
        };

        function handleAlertClicks(event) {
            const contentBox = customAlertEl.querySelector('.modal-content-box');
            if (event.target === customAlertOkBtn || !contentBox.contains(event.target)) {
                hideCustomAlert();
                customAlertEl.removeEventListener('click', handleAlertClicks);
            }
        }

        // --- THIS IS THE FIX ---
        // Override the native alert function safely.
        window.alert = function(message) {
            // Only show the custom alert if the message is a non-empty string.
            // This prevents accidental triggers from things like `alert()` or `alert('')`.
            if (typeof message === 'string' && message.trim() !== '') {
                window.showCustomAlert(message);
            } else {
                // If called without a valid message, do nothing or log it for debugging.
                console.log("globalheader.js: Native 'alert' was called without a valid message. Ignoring.");
            }
        };
        // --- End Custom Alert System ---

        let auth = window.auth;
        if (!auth) {
            console.error("globalheader.js: Firebase Auth object (window.auth) not found. Header authentication features will not work.");
        } else {
            console.log("globalheader.js: Using Firebase Auth instance from window.auth.");
        }

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
        const headerLogoLink = document.getElementById('headerLogoLink');
        const authModal = document.getElementById('authModal');
        const closeAuthModalBtn = document.getElementById('closeAuthModalBtn');
        const profileSetupModal = document.getElementById('profileSetupModal');
        const closeProfileModalBtn = document.getElementById('closeProfileModalBtn');
        const skipProfileSetupBtn = document.getElementById('skipProfileSetupBtn');

        if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
        if (tornCityHomepageLink) tornCityHomepageLink.style.display = 'none';
        if (signUpButtonHeader) signUpButtonHeader.style.display = 'none';
        if (logoutButtonHeader) logoutButtonHeader.style.display = 'none';
        if (headerEditProfileBtn) headerEditProfileBtn.style.display = 'none';
        if (authModal) authModal.style.display = 'none';
        if (profileSetupModal) profileSetupModal.style.display = 'none';

        if (auth) {
            auth.onAuthStateChanged(function(user) {
                console.log("globalheader.js: Auth state changed. User:", user ? user.uid : "None");
                const currentPagePath = window.location.pathname;
                const pageName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase().replace('.html', '');
                const isLoginPage = (pageName === 'index' || pageName === '');
                const isHomePage = (pageName === 'home');

                if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
                if (tornCityHomepageLink) tornCityHomepageLink.style.display = 'none';
                if (signUpButtonHeader) signUpButtonHeader.style.display = 'none';
                if (logoutButtonHeader) logoutButtonHeader.style.display = 'none';
                if (headerEditProfileBtn) headerEditProfileBtn.style.display = 'none';
                if (loggedInUserDisplay) loggedInUserDisplay.style.display = 'none';
                if (homeButtonHeader) homeButtonHeader.style.display = 'none';

                if (user) {
                    console.log("globalheader.js: User is SIGNED IN. Configuring logged-in header.");
                    if (headerButtonsContainer) headerButtonsContainer.style.display = 'flex';
                    if (headerEditProfileBtn) headerEditProfileBtn.style.display = 'inline-flex';
                    if (usefulLinksBtn) usefulLinksBtn.style.display = 'inline-flex';
                    if (contactUsBtn) contactUsBtn.style.display = 'inline-flex';
                    if (logoutButtonHeader) logoutButtonHeader.style.display = 'inline-flex';
                    if (homeButtonHeader && !isHomePage) {
                        homeButtonHeader.style.display = 'inline-flex';
                    }

                    if (logoutButtonHeader) logoutButtonHeader.addEventListener('click', handleLogout);
                    if (homeButtonHeader) homeButtonHeader.addEventListener('click', handleHomeNavigation);
                    if (headerLogoLink) headerLogoLink.addEventListener('click', handleHomeNavigation);
                    if (headerEditProfileBtn) headerEditProfileBtn.addEventListener('click', handleEditProfile);
                } else {
                    console.log("globalheader.js: User is SIGNED OUT. Configuring logged-out header.");
                    if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
                    if (tornCityHomepageLink) tornCityHomepageLink.style.display = 'inline-flex';
                    if (signUpButtonHeader && !isLoginPage) {
                        signUpButtonHeader.style.display = 'inline-flex';
                    }
                    if (homeButtonHeader) {
                        homeButtonHeader.style.display = 'inline-flex';
                        homeButtonHeader.addEventListener('click', handleHomeNavigation);
                    }
                    if (headerLogoLink) headerLogoLink.addEventListener('click', handleHomeNavigation);
                    if (signUpButtonHeader) signUpButtonHeader.addEventListener('click', handleSignUpNavigation);
                }
                closeAllManagedHeaderDropdowns(null);
            });
        } else {
            console.warn("globalheader.js: Firebase auth not available. Header UI will not dynamically update.");
            if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
            if (tornCityHomepageLink) tornCityHomepageLink.style.display = 'inline-flex';
            if (signUpButtonHeader) signUpButtonHeader.style.display = 'inline-flex';
        }

        function handleLogout() {
            auth.signOut().then(() => {
                console.log('User signed out.');
                window.location.href = '../index.html';
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
                profileSetupModal.style.display = 'flex';
            }
        }

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
                    closeAllManagedHeaderDropdowns(dropdown);
                    dropdown.style.display = isCurrentlyShown ? 'none' : 'block';
                });
            }
        }
        
        setupManagedDropdown(usefulLinksBtn, usefulLinksDropdown);
        setupManagedDropdown(contactUsBtn, contactUsDropdown);

        window.addEventListener('click', (event) => {
            const isClickInsideDropdown = allHeaderDropdownsToManage.some(d => d.contains(event.target));
            const isClickOnTrigger = usefulLinksBtn?.contains(event.target) || contactUsBtn?.contains(event.target);
            if (!isClickInsideDropdown && !isClickOnTrigger) {
                closeAllManagedHeaderDropdowns(null);
            }
        });

        if (closeAuthModalBtn) closeAuthModalBtn.addEventListener('click', () => { if (authModal) authModal.style.display = 'none'; });
        if (closeProfileModalBtn) closeProfileModalBtn.addEventListener('click', () => { if (profileSetupModal) profileSetupModal.style.display = 'none'; });
        if (skipProfileSetupBtn) skipProfileSetupBtn.addEventListener('click', () => { if (profileSetupModal) profileSetupModal.style.display = 'none'; });

        console.log("globalheader.js: Header logic initialization complete.");
    }

    loadGlobalHeaderAndInitializeLogic();

    console.log("globalheader.js: End of script (initial DOMContentLoaded phase).");
});