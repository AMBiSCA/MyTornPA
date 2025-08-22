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
                }
                if (profileSetupModal && !document.getElementById('profileSetupModal')) {
                    document.body.appendChild(profileSetupModal);
                }
                if (customAlertFromHTML && !document.getElementById('customAlert')) {
                    document.body.appendChild(customAlertFromHTML);
                }
                if (globalConfirmModalFromHTML && !document.getElementById('globalConfirmModal')) {
                    document.body.appendChild(globalConfirmModalFromHTML);
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

        // --- Theme Switcher Logic ---
        const themeToggleButton = document.getElementById('theme-toggle-btn');
        const body = document.body;
        if (localStorage.getItem('theme') === 'eye-soothing') {
            body.classList.add('eye-soothing-mode');
        }
        if (themeToggleButton) {
            themeToggleButton.addEventListener('click', () => {
                body.classList.toggle('eye-soothing-mode');
                if (body.classList.contains('eye-soothing-mode')) {
                    localStorage.setItem('theme', 'eye-soothing');
                } else {
                    localStorage.removeItem('theme');
                }
            });
        }

        // --- Custom Alert System ---
        const nativeAlert = window.alert;
        function hideCustomAlert() {
            const customAlertEl = document.getElementById('customAlert');
            if (customAlertEl) customAlertEl.classList.remove('visible');
        }
        function handleAlertClicks(event) {
            const customAlertEl = document.getElementById('customAlert');
            const customAlertOkBtn = document.getElementById('customAlertOkBtn');
            const contentBox = customAlertEl.querySelector('.modal-content-box');
            if (event.target === customAlertOkBtn || (contentBox && !contentBox.contains(event.target))) {
                hideCustomAlert();
            }
        }
        window.showCustomAlert = function(message, title = 'Notification') {
            const customAlertEl = document.getElementById('customAlert');
            const customAlertTitleEl = document.getElementById('customAlertTitle');
            const customAlertMessageEl = document.getElementById('customAlertMessage');
            if (customAlertEl && customAlertMessageEl && customAlertTitleEl) {
                customAlertTitleEl.textContent = title;
                customAlertMessageEl.textContent = message;
                customAlertEl.classList.add('visible');
                customAlertEl.removeEventListener('click', handleAlertClicks);
                customAlertEl.addEventListener('click', handleAlertClicks);
            } else {
                nativeAlert(message);
            }
        };
        window.alert = function(message) {
            if (typeof message === 'string' && message.trim() !== '') {
                window.showCustomAlert(message);
            }
        };

        // --- Get references to all necessary elements ---
        let auth = window.auth;
        const logoutButtonHeader = document.getElementById('logoutButtonHeader');
        const headerEditProfileBtn = document.getElementById('headerEditProfileBtn');
        const homeButtonHeader = document.getElementById('homeButtonHeader');
        const signUpButtonHeader = document.getElementById('signUpButtonHeader');
        const usefulLinksBtn = document.getElementById('usefulLinksBtn');
        const usefulLinksDropdown = document.getElementById('usefulLinksDropdown');
        const contactUsBtn = document.getElementById('contactUsBtn');
        const contactUsDropdown = document.getElementById('contactUsDropdown');
        const headerLogoLink = document.getElementById('headerLogoLink');
        const authModal = document.getElementById('authModal');
        const closeAuthModalBtn = document.getElementById('closeAuthModalBtn');
        const profileSetupModal = document.getElementById('profileSetupModal');
        const closeProfileModalBtn = document.getElementById('closeProfileModalBtn');
        const skipProfileSetupBtn = document.getElementById('skipProfileSetupBtn');

        if (auth) {
            auth.onAuthStateChanged(function(user) {
                console.log("globalheader.js: Auth state changed. User:", user ? user.uid : "None");
                const currentPagePath = window.location.pathname;
                const pageName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase().replace('.html', '');
                const isHomePage = (pageName === 'home');

                if (user) {
                    // --- User is SIGNED IN ---
                    console.log("globalheader.js: User is SIGNED IN. Adding body class.");
                    document.body.classList.add('user-is-logged-in');

                    // Handle page-specific buttons (Home vs Edit Profile)
                    if (isHomePage) {
                        if (headerEditProfileBtn) headerEditProfileBtn.style.display = 'inline-flex';
                        if (homeButtonHeader) homeButtonHeader.style.display = 'none';
                    } else {
                        if (homeButtonHeader) homeButtonHeader.style.display = 'inline-flex';
                        if (headerEditProfileBtn) headerEditProfileBtn.style.display = 'none';
                    }

                    // Attach event listeners for logged-in users
                    if (logoutButtonHeader) logoutButtonHeader.addEventListener('click', handleLogout);
                    if (homeButtonHeader) homeButtonHeader.addEventListener('click', handleHomeNavigation);
                    if (headerLogoLink) headerLogoLink.addEventListener('click', handleHomeNavigation);
                    if (headerEditProfileBtn) headerEditProfileBtn.addEventListener('click', handleEditProfile);

                } else {
                    // --- User is SIGNED OUT ---
                    console.log("globalheader.js: User is SIGNED OUT. Removing body class.");
                    document.body.classList.remove('user-is-logged-in');

                    // Attach event listeners for logged-out users
                    if (signUpButtonHeader) signUpButtonHeader.addEventListener('click', handleSignUpNavigation);
                    if (headerLogoLink) headerLogoLink.addEventListener('click', handleHomeNavigation);
                }
                closeAllManagedHeaderDropdowns(null);
            });
        } else {
            console.warn("globalheader.js: Firebase auth not available. Header UI will default to logged out.");
            document.body.classList.remove('user-is-logged-in');
        }

        function handleLogout() {
            auth.signOut().then(() => {
                console.log('User signed out.');
                window.location.href = '/index.html';
            }).catch((error) => {
                console.error('Sign out error:', error);
                alert('Error signing out: ' + error.message);
            });
        }
        function handleHomeNavigation() { window.location.href = '/pages/home.html'; }
        function handleSignUpNavigation() { window.location.href = '/index.html'; }
        function handleEditProfile() { if (profileSetupModal) profileSetupModal.style.display = 'flex'; }
        
        const allHeaderDropdownsToManage = [usefulLinksDropdown, contactUsDropdown].filter(Boolean);
        function closeAllManagedHeaderDropdowns(exceptThisOne) {
            allHeaderDropdownsToManage.forEach(dropdown => {
                if (dropdown !== exceptThisOne) dropdown.style.display = 'none';
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