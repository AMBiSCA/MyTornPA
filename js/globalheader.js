// mysite/js/globalheader.js

// ... (existing code above this block) ...

// --- Firebase Auth State Listener (Controls UI) ---
if (auth) {
    auth.onAuthStateChanged(function(user) {
        // Log the user object itself, not just user.toString() which can be 'gi' for a Firebase User object
        console.log("globalheader.js: Auth state changed. User object details:", user);
        if (user) {
            console.log("globalheader.js: User UID:", user.uid); // Log the UID specifically

            const currentPagePath = window.location.pathname;
            const pageName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase();
            const publicLandingPages = ['index.html', ''];
            const isSignUpPage = (pageName === 'signup.html');
            const isHomePage = (pageName === 'home.html' || pageName === '');

            const elements = {
                headerButtonsContainer,
                signUpButtonHeader,
                homeButtonHeader,
                logoutButtonHeader,
                usefulLinksBtn,
                contactUsBtn,
                tornCityHomepageLink,
                loggedInUserDisplay,
                headerEditProfileBtn, // Assuming this exists or will be added for profile editing
                headerLogoLink
            };

            // --- USER IS LOGGED IN ---
            // Existing UI visibility logic
            if (elements.signUpButtonHeader) elements.signUpButtonHeader.style.display = 'none';
            if (elements.tornCityHomepageLink) elements.tornCityHomepageLink.style.display = 'none';
            // if (elements.loggedInUserDisplay) elements.loggedInUserDisplay.style.display = 'none'; // Re-evaluate this, might be for logged-out state

            if (elements.headerButtonsContainer) elements.headerButtonsContainer.style.display = 'flex';
            if (elements.logoutButtonHeader) elements.logoutButtonHeader.style.display = 'inline-flex';
            // if (elements.headerEditProfileBtn) elements.headerEditProfileBtn.style.display = 'inline-flex'; // Show if you have this button
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

            // --- Fetch user's Torn API Key from Firestore and make it globally available ---
            // Ensure both user and user.uid exist before attempting Firestore lookup
            if (user && user.uid && window.db) {
                window.db.collection('users').doc(user.uid).get()
                    .then(doc => {
                        if (doc.exists && doc.data().tornApiKey) {
                            window.currentUserTornApiKey = doc.data().tornApiKey;
                            console.log("globalheader.js: Torn API Key fetched and set globally.");
                            if (elements.loggedInUserDisplay) {
                                elements.loggedInUserDisplay.textContent = `Welcome, ${user.email || 'User'}!`;
                                elements.loggedInUserDisplay.style.display = 'inline-block';
                                elements.loggedInUserDisplay.style.color = '#eee'; // Reset color if it was red
                            }

                            // If initializeMarketPulsePage exists, call it now that the key is ready
                            if (typeof initializeMarketPulsePage === 'function') {
                                initializeMarketPulsePage();
                            }
                        } else {
                            console.warn("globalheader.js: User document or Torn API Key not found in Firestore for:", user.uid);
                            window.currentUserTornApiKey = null; // Ensure it's null if not found
                            if (elements.loggedInUserDisplay) {
                                elements.loggedInUserDisplay.textContent = `Welcome, ${user.email || 'User'}! (API Key Needed)`;
                                elements.loggedInUserDisplay.style.color = '#ff6b6b'; // Red color for warning
                                elements.loggedInUserDisplay.style.display = 'inline-block';
                            }
                            // Call initializeMarketPulsePage even if key is null, so it can display the error
                            if (typeof initializeMarketPulsePage === 'function') {
                                initializeMarketPulsePage();
                            }
                        }
                    })
                    .catch(error => {
                        console.error("globalheader.js: Error fetching user document:", error);
                        window.currentUserTornApiKey = null;
                        if (elements.loggedInUserDisplay) {
                            elements.loggedInUserDisplay.textContent = `Welcome, ${user.email || 'User'}! (Error fetching profile)`;
                            elements.loggedInUserDisplay.style.color = '#ff6b6b';
                            elements.loggedInUserDisplay.style.display = 'inline-block';
                        }
                        // Call initializeMarketPulsePage to display the error there
                        if (typeof initializeMarketPulsePage === 'function') {
                            initializeMarketPulsePage();
                        }
                    });
            } else {
                console.error("globalheader.js: User or User UID is missing, or Firestore (window.db) not available. Cannot fetch Torn API Key.");
                window.currentUserTornApiKey = null;
                 if (typeof initializeMarketPulsePage === 'function') {
                    initializeMarketPulsePage();
                }
            }

        } else {
            // --- USER IS LOGGED OUT ---
            // Existing UI visibility logic
            if (elements.headerButtonsContainer) elements.headerButtonsContainer.style.display = 'none';

            // Show logged-out buttons
            if (elements.tornCityHomepageLink) elements.tornCityHomepageLink.style.display = 'inline-flex';
            if (elements.signUpButtonHeader) {
                elements.signUpButtonHeader.style.display = isSignUpPage ? 'none' : 'inline-flex';
            }
            // Update logged-in user display for logged-out state
            if (elements.loggedInUserDisplay) {
                elements.loggedInUserDisplay.textContent = ''; // Clear display
                elements.loggedInUserDisplay.style.display = 'none'; // Hide it
            }
            window.currentUserTornApiKey = null; // Clear the key when logged out

            // If Market Pulse page is loaded, re-initialize it to show "API Key Needed" error
            if (typeof initializeMarketPulsePage === 'function') {
                initializeMarketPulsePage();
            }
        }
    });
} else {
    // --- FALLBACK IF FIREBASE FAILS TO LOAD ---
    console.warn("globalheader.js: Firebase auth object is NULL. Can't update header UI.");
    // Hide all conditional buttons as a fallback
    if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
    if (signUpButtonHeader) signUpButtonHeader.style.display = 'none';
    window.currentUserTornApiKey = null; // Ensure key is null
    if (typeof initializeMarketPulsePage === 'function') {
        initializeMarketPulsePage(); // Attempt to initialize market pulse to show error
    }
}

// ... (rest of existing code below this block) ...