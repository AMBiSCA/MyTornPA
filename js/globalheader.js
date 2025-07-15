// mysite/js/globalheader.js
// This script manages the header UI based on Firebase authentication state.
document.addEventListener('DOMContentLoaded', function() {
    console.log("globalheader.js: DOMContentLoaded event fired.");

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
    const loggedInUserDisplay = document.getElementById('logged-in-user-display');
    const headerLogoLink = document.querySelector('.header-left a');

    // Add console logs for element existence
    console.log("globalheader.js: Elements found status:", {
        headerButtonsContainer: !!headerButtonsContainer,
        signUpButtonHeader: !!signUpButtonHeader,
        logoutButtonHeader: !!logoutButtonHeader,
        loggedInUserDisplay: !!loggedInUserDisplay,
        usefulLinksBtn: !!usefulLinksBtn,
        contactUsBtn: !!contactUsBtn,
        tornCityHomepageLink: !!tornCityHomepageLink
    });


    // --- Dropdown Logic (Does not depend on Firebase Auth) ---
    function closeAllDropdowns() {
        document.querySelectorAll('.dropdown-content.show').forEach(dropdown => {
            dropdown.classList.remove('show');
            const button = dropdown.previousElementSibling;
            if (button) button.classList.remove('active');
        });
    }

    function setupDropdown(button, dropdown) {
        if (button && dropdown) {
            let timeout;

            button.addEventListener('click', function(event) {
                event.stopPropagation();
                const isShowing = dropdown.classList.contains('show');
                closeAllDropdowns();
                if (!isShowing) {
                    dropdown.classList.add('show');
                    button.classList.add('active');
                }
            });

            button.addEventListener('mouseleave', function() {
                timeout = setTimeout(() => {
                    if (!dropdown.matches(':hover')) {
                        closeAllDropdowns();
                    }
                }, 100);
            });

            dropdown.addEventListener('mouseleave', function() {
                timeout = setTimeout(() => {
                    if (!button.matches(':hover')) {
                        closeAllDropdowns();
                    }
                }, 100);
            });

            button.addEventListener('mouseenter', function() {
                clearTimeout(timeout);
            });
            dropdown.addEventListener('mouseenter', function() {
                clearTimeout(timeout);
            });
        }
    }

    setupDropdown(usefulLinksBtn, usefulLinksDropdown);
    setupDropdown(contactUsBtn, contactUsDropdown);

    // --- CORRECTED FIREBASE INITIALIZATION ---
    let auth = null;
    try {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            auth = firebase.auth();
            console.log("globalheader.js: Firebase Auth instance obtained successfully.");
        } else {
            throw new Error("Firebase auth object not found.");
        }
    } catch (e) {
        console.error("globalheader.js: CRITICAL ERROR initializing Firebase Auth:", e);
    }

    // --- Centralized Navigation and Action Handlers (that require 'auth') ---
    function homeNavHandler() {
        window.location.href = '/pages/home.html';
    }

    function logoutHandler() {
        if (!auth) {
            console.error("Logout failed: Auth service not available.");
            return;
        }
        auth.signOut().then(() => {
            console.log("User signed out successfully.");
            window.location.href = '/index.html';
        }).catch((error) => {
            console.error("Error signing out:", error);
            alert("Failed to log out. Please try again.");
        });
    }

    // --- Firebase Auth State Listener (Controls UI) ---
    if (auth) {
        auth.onAuthStateChanged(function(user) {
            console.log("globalheader.js: Auth state changed. User object:", user);

            const currentPagePath = window.location.pathname;
            const pageName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase();
            const isSignUpPage = (pageName === 'signup.html');
            const isHomePage = (pageName === 'home.html' || pageName === '' || pageName === 'index.html');

            // Define a function to apply display styles
            function applyHeaderDisplay(isLoggedIn) {
                if (isLoggedIn) {
                    // HIDE ELEMENTS THAT SHOULD NOT BE VISIBLE WHEN LOGGED IN
                    if (signUpButtonHeader) signUpButtonHeader.style.display = 'none';
                    if (tornCityHomepageLink) tornCityHomepageLink.style.display = 'none';

                    // SHOW ELEMENTS THAT SHOULD BE VISIBLE WHEN LOGGED IN
                    if (loggedInUserDisplay) {
                        loggedInUserDisplay.style.display = 'inline-flex';
                        loggedInUserDisplay.textContent = user.email || 'Logged In';
                    }
                    if (headerButtonsContainer) headerButtonsContainer.style.display = 'flex';
                    if (logoutButtonHeader) logoutButtonHeader.style.display = 'inline-flex';
                    if (usefulLinksBtn) usefulLinksBtn.style.display = 'inline-flex';
                    if (contactUsBtn) contactUsBtn.style.display = 'inline-flex';

                    if (homeButtonHeader) {
                        if (isHomePage || pageName === 'social.html' || pageName === 'dashboard.html') {
                            homeButtonHeader.style.display = 'none';
                        } else {
                            homeButtonHeader.style.display = 'inline-flex';
                        }
                    }
                } else {
                    // HIDE ELEMENTS THAT SHOULD NOT BE VISIBLE WHEN LOGGED OUT
                    if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
                    if (loggedInUserDisplay) loggedInUserDisplay.style.display = 'none';

                    // SHOW ELEMENTS THAT SHOULD BE VISIBLE WHEN LOGGED OUT
                    if (tornCityHomepageLink) tornCityHomepageLink.style.display = 'inline-flex';
                    if (signUpButtonHeader) {
                        signUpButtonHeader.style.display = isSignUpPage ? 'none' : 'inline-flex';
                    }
                }
            }

            // Apply styles immediately
            applyHeaderDisplay(!!user);
            console.log("globalheader.js: Applied display styles immediately.");

            // Apply styles again after a tiny delay
            setTimeout(() => {
                applyHeaderDisplay(!!user);
                console.log("globalheader.js: Applied display styles after 0ms timeout.");
            }, 0);


            // Attach listeners (unchanged)
            if (logoutButtonHeader) {
                logoutButtonHeader.removeEventListener('click', logoutHandler);
                logoutButtonHeader.addEventListener('click', logoutHandler);
            }
            if (homeButtonHeader) {
                homeButtonHeader.removeEventListener('click', homeNavHandler);
                homeButtonHeader.addEventListener('click', homeNavHandler);
            }
            if (headerLogoLink) {
                headerLogoLink.removeEventListener('click', homeNavHandler);
                headerLogoLink.addEventListener('click', homeNavHandler);
            }
        });
    } else {
        console.warn("globalheader.js: Firebase auth object is NULL. Header UI defaults to logged-out.");
        // Fallback if Firebase fails to initialize: explicitly set to logged-out state.
        if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
        if (signUpButtonHeader) signUpButtonHeader.style.display = 'inline-flex';
        if (tornCityHomepageLink) tornCityHomepageLink.style.display = 'inline-flex';
        if (loggedInUserDisplay) loggedInUserDisplay.style.display = 'none';
    }

    console.log("globalheader.js: End of script.");
});