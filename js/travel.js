document.addEventListener('DOMContentLoaded', function() {
    // --- Common Header/Footer UI script (depends on 'auth' from firebase-init.js) ---
    const usefulLinksBtn = document.getElementById('usefulLinksBtn');
    const usefulLinksDropdown = document.getElementById('usefulLinksDropdown');

    if (usefulLinksBtn && usefulLinksDropdown) {
        usefulLinksBtn.addEventListener('click', function(event) {
            event.stopPropagation(); 
            usefulLinksDropdown.classList.toggle('show');
        });
    }

    window.addEventListener('click', function(event) {
        if (usefulLinksBtn && usefulLinksDropdown && usefulLinksDropdown.classList.contains('show')) {
            if (!usefulLinksBtn.contains(event.target) && !usefulLinksDropdown.contains(event.target)) {
                usefulLinksDropdown.classList.remove('show');
            }
        }
    });

    const headerButtonsContainer = document.getElementById('headerButtonsContainer');
    const signUpButtonHeader = document.getElementById('signUpButtonHeader');
    const homeButtonFooter = document.getElementById('homeButtonFooter'); 
    const logoutButtonHeader = document.getElementById('logoutButtonHeader');

    if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
    if (signUpButtonHeader) signUpButtonHeader.style.display = 'none';
    if (homeButtonFooter) homeButtonFooter.style.display = 'none';

    // Check if 'auth' was successfully initialized by firebase-init.js
    if (typeof auth !== 'undefined' && auth) { 
        auth.onAuthStateChanged(function(user) {
            const currentPagePath = window.location.pathname;
            let pageName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase();
            if (pageName === "" && currentPagePath.length > 1) { // Handles cases like /pages/ or /pages/travel/
                 const pathParts = currentPagePath.substring(0, currentPagePath.length -1).split('/');
                 pageName = pathParts[pathParts.length -1].toLowerCase();
            }
            
            // Define which pages are considered "index" or "login" pages where a logged-in user might be redirected away from,
            // or where the "Sign Up" button might be hidden.
            const nonAuthEntryPages = ['index.html', 'ranked.html', 'login.html']; // Add your actual login/index page names here
            let isThisNonAuthEntryPage = nonAuthEntryPages.includes(pageName) || (pageName === "" && currentPagePath === "/");


            if (user) { // User is signed in
                if (isThisNonAuthEntryPage) { // If on an index/login page AND logged in
                    window.location.href = 'home.html'; // Redirect to home.html
                    return; // Stop further UI changes on this page as we are redirecting
                }
                // For other pages when logged in:
                if (headerButtonsContainer) headerButtonsContainer.style.display = 'flex';
                if (signUpButtonHeader) signUpButtonHeader.style.display = 'none';
                if (homeButtonFooter) homeButtonFooter.style.display = 'inline';
                if (logoutButtonHeader) logoutButtonHeader.style.display = 'inline-flex'; 

            } else { // No user signed in
                if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
                if (signUpButtonHeader) {
                    // Show Sign Up button only if NOT on an index/login page
                    signUpButtonHeader.style.display = isThisNonAuthEntryPage ? 'none' : 'inline-flex';
                }
                if (homeButtonFooter) homeButtonFooter.style.display = 'none';
                if (logoutButtonHeader) logoutButtonHeader.style.display = 'none'; // Hide logout when not logged in
                
                // If the user is NOT logged in, and they are trying to access a page that IS NOT an allowed non-auth page,
                // then redirect them to the login page.
                const allowedNonAuthPagesIncludingThis = [...nonAuthEntryPages, 'travel.html', 'terms.html', 'faq.html', 'about.html', 'report.html']; // Add all public pages
                if (!allowedNonAuthPagesIncludingThis.includes(pageName) && !(pageName === "" && currentPagePath === "/")) {
                    // window.location.href = 'ranked.html'; // Or your primary login page
                }
            }
        });

        if (logoutButtonHeader) {
            logoutButtonHeader.onclick = function() { 
                auth.signOut().then(() => {
                    console.log('User signed out');
                    // After logout, onAuthStateChanged will fire and handle UI.
                    // You might want to explicitly redirect to login page if not handled by onAuthStateChanged logic for the current page.
                    const currentPagePath = window.location.pathname;
                    let pageName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase();
                     if (pageName === "" && currentPagePath.length > 1) {
                        const pathParts = currentPagePath.substring(0, currentPagePath.length -1).split('/');
                        pageName = pathParts[pathParts.length -1].toLowerCase();
                    }
                    const nonAuthEntryPages = ['index.html', 'ranked.html', 'login.html'];
                    if (!nonAuthEntryPages.includes(pageName) && !(pageName === "" && currentPagePath === "/")) {
                         window.location.href = 'ranked.html'; // Or your primary login page
                    }
                }).catch((error) => {
                    console.error('Sign out error', error);
                });
            };
        }

    } else {
        console.warn("Firebase auth object (from firebase-init.js) is not available. UI for auth state will not update fully.");
        // Fallback UI if auth is completely unavailable
        if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
        if (signUpButtonHeader) {
            const currentPagePath = window.location.pathname;
            let pageName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase();
            if (pageName === "" && currentPagePath.length > 1) {
                 const pathParts = currentPagePath.substring(0, currentPagePath.length -1).split('/');
                 pageName = pathParts[pathParts.length -1].toLowerCase();
            }
            const nonAuthEntryPages = ['index.html', 'ranked.html', 'login.html'];
            signUpButtonHeader.style.display = (nonAuthEntryPages.includes(pageName) || (pageName === "" && currentPagePath === "/")) ? 'none' : 'inline-flex';
        }
        if (homeButtonFooter) homeButtonFooter.style.display = 'none';
        if (logoutButtonHeader) {
            logoutButtonHeader.style.display = 'none';
            logoutButtonHeader.onclick = function() { alert('Logout functionality (Firebase) not ready.'); };
        }
    }
    // Any Travel.html specific JavaScript actions would go below this line
    // For the provided HTML, there are no unique actions for this page.
});