// Suggested filename: js/static-page-header.js
document.addEventListener('DOMContentLoaded', function() {
    console.log("Static page header script (static-page-header.js) loaded.");

    // Ensure this matches your actual Firebase project configuration
    const firebaseConfig = {
        apiKey: "AIzaSyAI5QB7LbFyndbk_khADbKb33iqLSO4EOw", // REPLACE WITH YOUR ACTUAL KEY
        authDomain: "mytorn-d03ae.firebaseapp.com",
        projectId: "mytorn-d03ae",
        storageBucket: "mytorn-d03ae.appspot.com",
        messagingSenderId: "205970466308",
        appId: "1:205970466308:web:b2f8ec5d1a38ef05213751"
    };

    let auth = window.auth; // Attempt to use globally initialized auth (e.g., from firebase-init.js)

    if (!auth) {
        console.log("static-page-header.js: window.auth not found, attempting Firebase fallback initialization.");
        if (typeof firebase !== 'undefined' && firebase.app && firebase.auth) {
            if (!firebase.apps.length) {
                try {
                    firebase.initializeApp(firebaseConfig);
                    console.log("Firebase initialized by static-page-header.js (fallback).");
                    auth = firebase.auth();
                } catch (e) {
                    console.error("Error initializing Firebase from static-page-header.js (fallback):", e);
                    // Display error to user on page if critical elements are missing
                    document.body.insertAdjacentHTML('afterbegin', '<p style="color:red; text-align:center; background:white; padding:10px;">Critical Error: Could not initialize core services. Header may not function.</p>');
                    return; 
                }
            } else {
                auth = firebase.auth(); // Use existing app's auth
                console.log("static-page-header.js: Using existing Firebase app instance.");
            }
        } else {
            console.error("static-page-header.js: Firebase SDK not loaded. Header updates will not work.");
            document.body.insertAdjacentHTML('afterbegin', '<p style="color:red; text-align:center; background:white; padding:10px;">Critical Error: Firebase SDK not available. Header may not function.</p>');
            return; 
        }
    }

    // Header Elements
    const headerButtonsContainer = document.getElementById('headerButtonsContainer'); // Contains logged-in buttons
    const logoutButtonHeader = document.getElementById('logoutButtonHeader');
    const headerEditProfileBtn = document.getElementById('headerEditProfileBtn'); // Assuming this ID exists
    // const homeButtonHeader = document.getElementById('homeButtonHeader'); // This is usually hidden on static pages when logged in, or links to home.html

    const tornCityHomepageLink = document.getElementById('tornCityHomepageLink'); // Logged-out link to Torn
    const signUpButtonHeader = document.getElementById('signUpButtonHeader');     // Logged-out "Register!" button

    // Dropdown elements for logged-in state
    const usefulLinksBtn = document.getElementById('usefulLinksBtn');
    const usefulLinksDropdown = document.getElementById('usefulLinksDropdown');
    const contactUsBtn = document.getElementById('contactUsBtn');
    const contactUsDropdown = document.getElementById('contactUsDropdown');

    // Initially hide all dynamic sections to prevent flash of incorrect content
    if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
    if (tornCityHomepageLink) tornCityHomepageLink.style.display = 'none';
    if (signUpButtonHeader) signUpButtonHeader.style.display = 'none';
    if (logoutButtonHeader) logoutButtonHeader.style.display = 'none';
    if (headerEditProfileBtn) headerEditProfileBtn.style.display = 'none';


    auth.onAuthStateChanged(function(user) {
        console.log("static-page-header.js: Auth state changed. User:", user ? user.uid : "None");

        if (user) { // User is SIGNED IN
            console.log("static-page-header.js: User is SIGNED IN. Configuring logged-in header.");
            if (headerButtonsContainer) headerButtonsContainer.style.display = 'flex'; // Show the main container for logged-in buttons
            if (headerEditProfileBtn) headerEditProfileBtn.style.display = 'inline-flex'; // Show Edit Profile
            if (usefulLinksBtn) usefulLinksBtn.style.display = 'inline-flex'; // Show Useful Links
            if (contactUsBtn) contactUsBtn.style.display = 'inline-flex'; // Show Contact Us
            if (logoutButtonHeader) logoutButtonHeader.style.display = 'inline-flex'; // Show Logout

            if (tornCityHomepageLink) tornCityHomepageLink.style.display = 'none'; // Hide Torn City link
            if (signUpButtonHeader) signUpButtonHeader.style.display = 'none';     // Hide Register button

            if (logoutButtonHeader) {
                // Ensure only one listener is attached, or manage removal if called multiple times
                // For simplicity, this example re-adds, but a more robust solution might check first
                logoutButtonHeader.replaceWith(logoutButtonHeader.cloneNode(true)); // Simple way to remove previous listeners
                document.getElementById('logoutButtonHeader').addEventListener('click', () => { // Re-get element after clone
                    auth.signOut().then(() => {
                        console.log('User signed out from static page.');
                        // UI will update via onAuthStateChanged, or redirect if preferred:
                        // window.location.reload(); // Or redirect to a specific page
                    }).catch((error) => {
                        console.error('Sign out error on static page:', error);
                        alert('Error signing out: ' + error.message);
                    });
                });
            }

            // Initialize dropdowns for logged-in users
            setupManagedDropdown(usefulLinksBtn, usefulLinksDropdown);
            setupManagedDropdown(contactUsBtn, contactUsDropdown);

        } else { // User is SIGNED OUT
            console.log("static-page-header.js: User is SIGNED OUT. Configuring logged-out header.");
            if (headerButtonsContainer) headerButtonsContainer.style.display = 'none'; // Hide container for logged-in buttons
            
            if (tornCityHomepageLink) {
                tornCityHomepageLink.style.display = 'inline-flex'; // Show Torn City link
                // Ensure href is correct (it should be set in HTML, but can be a fallback)
                // tornCityHomepageLink.href = "https://www.torn.com/index.php"; 
            }
            if (signUpButtonHeader) {
                signUpButtonHeader.style.display = 'inline-flex'; // Show Register button
                // Ensure only one listener or manage removal
                signUpButtonHeader.replaceWith(signUpButtonHeader.cloneNode(true));
                document.getElementById('signUpButtonHeader').addEventListener('click', function() { // Re-get element
                    // Redirect to index.html for registration/login
                    // Adjust path if your static pages are in a different directory structure than 'pages/'
                    window.location.href = '../index.html'; 
                });
            }
        }
    });

    // --- Dropdown management logic (can be shared in a global.js) ---
    const allHeaderDropdownsToManage = [];
    if (usefulLinksDropdown) allHeaderDropdownsToManage.push(usefulLinksDropdown);
    if (contactUsDropdown) allHeaderDropdownsToManage.push(contactUsDropdown);

    function closeAllManagedHeaderDropdowns(exceptThisOne) {
        allHeaderDropdownsToManage.forEach(dropdown => {
            if (dropdown !== exceptThisOne && dropdown) { // Added null check for dropdown
                dropdown.style.display = 'none';
            }
        });
    }

    function setupManagedDropdown(button, dropdown) {
        if (button && dropdown) {
            // Simple way to remove previous listeners before adding new ones if this runs multiple times
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
            
            newButton.addEventListener('click', function(event) {
                event.stopPropagation();
                const isCurrentlyShown = dropdown.style.display === 'block';
                closeAllManagedHeaderDropdowns(dropdown); 
                dropdown.style.display = isCurrentlyShown ? 'none' : 'block';
            });
        }
    }
    
    // Global click listener to close dropdowns when clicking outside
    window.addEventListener('click', function(event) {
        let clickedInsideADropdownTriggerOrContent = false;
        
        const currentUsefulLinksBtn = document.getElementById('usefulLinksBtn'); // Re-get in case of cloning
        const currentContactUsBtn = document.getElementById('contactUsBtn');   // Re-get in case of cloning

        if (currentUsefulLinksBtn && currentUsefulLinksBtn.contains(event.target)) clickedInsideADropdownTriggerOrContent = true;
        if (currentContactUsBtn && currentContactUsBtn.contains(event.target)) clickedInsideADropdownTriggerOrContent = true;
        
        if (!clickedInsideADropdownTriggerOrContent) {
            allHeaderDropdownsToManage.forEach(dropdown => {
                if (dropdown && dropdown.style.display === 'block' && dropdown.contains(event.target)) {
                    clickedInsideADropdownTriggerOrContent = true;
                }
            });
        }

        if (!clickedInsideADropdownTriggerOrContent) {
            closeAllManagedHeaderDropdowns(null);
        }
    });
    // --- End Dropdown management logic ---

    console.log("static-page-header.js: DOMContentLoaded setup and event listeners initialization attempt complete.");
});