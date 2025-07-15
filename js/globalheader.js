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
    const loggedInUserDisplay = document.getElementById('loggedInUserDisplay');
    const headerEditProfileBtn = document.getElementById('headerEditProfileBtn');
    const headerLogoLink = document.querySelector('.header-left a'); // More robust selector for the logo link

    // --- Dropdown Logic (Does not depend on Firebase Auth) ---
    function closeOtherDropdowns(currentDropdown) {
        document.querySelectorAll('.dropdown-content.show').forEach(dropdown => {
            if (dropdown !== currentDropdown) {
                dropdown.classList.remove('show');
                const button = dropdown.previousElementSibling;
                if (button) button.classList.remove('active');
            }
        });
    }

    function setupDropdown(button, dropdown) {
        if (button && dropdown) {
            button.addEventListener('click', function(event) {
                event.stopPropagation();
                const isShowing = dropdown.classList.contains('show');
                closeOtherDropdowns(dropdown);
                if (!isShowing) {
                    dropdown.classList.add('show');
                    button.classList.add('active');
                }
            });
        }
    }

    setupDropdown(usefulLinksBtn, usefulLinksDropdown);
    setupDropdown(contactUsBtn, contactUsDropdown);

    window.addEventListener('click', function() {
        closeOtherDropdowns(null); // Close all dropdowns
    });

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
        // If Firebase fails, we can't show a proper header state.
        // You could display an error message here if needed.
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
    // This ENTIRE section only runs if 'auth' was successfully initialized.
    if (auth) {
        auth.onAuthStateChanged(function(user) {
            console.log("globalheader.js: Auth state changed. User:", user);

            const currentPagePath = window.location.pathname;
            const pageName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase();
            const publicLandingPages = ['index.html', ''];
            const isSignUpPage = (pageName === 'signup.html');
            const isHomePage = (pageName === 'home.html' || pageName === '');

            // Ensure all elements exist before trying to manipulate them
            const elements = {
                headerButtonsContainer,
                signUpButtonHeader,
                homeButtonHeader,
                logoutButtonHeader,
                usefulLinksBtn,
                contactUsBtn,
                tornCityHomepageLink,
                loggedInUserDisplay,
                headerEditProfileBtn,
                headerLogoLink
            };

            if (user) {
                // --- USER IS LOGGED IN ---
                if (elements.signUpButtonHeader) elements.signUpButtonHeader.style.display = 'none';
                if (elements.tornCityHomepageLink) elements.tornCityHomepageLink.style.display = 'none';
                if (elements.loggedInUserDisplay) elements.loggedInUserDisplay.style.display = 'none'; // Assuming this is for logged-out state

                if (elements.headerButtonsContainer) elements.headerButtonsContainer.style.display = 'flex';
                if (elements.logoutButtonHeader) elements.logoutButtonHeader.style.display = 'inline-flex';
                if (elements.headerEditProfileBtn) elements.headerEditProfileBtn.style.display = 'inline-flex';
                if (elements.usefulLinksBtn) elements.usefulLinksBtn.style.display = 'inline-flex';
                if (elements.contactUsBtn) elements.contactUsBtn.style.display = 'inline-flex';

                if (elements.homeButtonHeader) {
                    if (isHomePage || pageName === 'social.html' || pageName === 'dashboard.html') {
                        elements.homeButtonHeader.style.display = 'none';
                    } else {
                        elements.homeButtonHeader.style.display = 'inline-flex';
                    }
                }

                // Attach listeners for logged-in state
                if (elements.logoutButtonHeader) {
                    elements.logoutButtonHeader.removeEventListener('click', logoutHandler);
                    elements.logoutButtonHeader.addEventListener('click', logoutHandler);
                }
                if (elements.homeButtonHeader) {
                     elements.homeButtonHeader.removeEventListener('click', homeNavHandler);
                     elements.homeButtonHeader.addEventListener('click', homeNavHandler);
                }
                if (elements.headerLogoLink) {
                    elements.headerLogoLink.removeEventListener('click', homeNavHandler);
                    elements.headerLogoLink.addEventListener('click', homeNavHandler);
                }

            } else {
                // --- USER IS LOGGED OUT ---
                if (elements.headerButtonsContainer) elements.headerButtonsContainer.style.display = 'none';
                
                // Show logged-out buttons
                if (elements.tornCityHomepageLink) elements.tornCityHomepageLink.style.display = 'inline-flex';
                if (elements.signUpButtonHeader) {
                    elements.signUpButtonHeader.style.display = isSignUpPage ? 'none' : 'inline-flex';
                }
            }
        });
    } else {
        // --- FALLBACK IF FIREBASE FAILS TO LOAD ---
        console.warn("globalheader.js: Firebase auth object is NULL. Can't update header UI.");
        // Hide all conditional buttons as a fallback
        if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
        if (signUpButtonHeader) signUpButtonHeader.style.display = 'none';
    }

    console.log("globalheader.js: End of script.");
});