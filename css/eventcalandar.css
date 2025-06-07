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
            if (pageName === "" && currentPagePath.length > 1) { 
                 const pathParts = currentPagePath.substring(0, currentPagePath.length -1).split('/');
                 pageName = pathParts[pathParts.length -1].toLowerCase();
            }
            
            const nonAuthEntryPages = ['index.html', 'ranked.html', 'login.html']; 
            let isThisNonAuthEntryPage = nonAuthEntryPages.includes(pageName) || (pageName === "" && currentPagePath === "/");


            if (user) { // User is signed in
                if (isThisNonAuthEntryPage) { 
                    window.location.href = 'home.html'; 
                    return; 
                }
                if (headerButtonsContainer) headerButtonsContainer.style.display = 'flex';
                if (signUpButtonHeader) signUpButtonHeader.style.display = 'none';
                if (homeButtonFooter) homeButtonFooter.style.display = 'inline';
                if (logoutButtonHeader) logoutButtonHeader.style.display = 'inline-flex'; 

            } else { // No user signed in
                if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
                if (signUpButtonHeader) {
                    signUpButtonHeader.style.display = isThisNonAuthEntryPage ? 'none' : 'inline-flex';
                }
                if (homeButtonFooter) homeButtonFooter.style.display = 'none';
                if (logoutButtonHeader) logoutButtonHeader.style.display = 'none';
                
                const allowedNonAuthPagesIncludingThis = [...nonAuthEntryPages, 'travel.html', 'terms.html', 'faq.html', 'about.html', 'report.html', 'merit_tracker.html', 'merits.html']; // Added merits.html
                if (!allowedNonAuthPagesIncludingThis.includes(pageName) && !(pageName === "" && currentPagePath === "/")) {
                    // window.location.href = 'ranked.html'; // Or your primary login page
                }
            }
        });

        if (logoutButtonHeader) {
            logoutButtonHeader.onclick = function() { 
                auth.signOut().then(() => {
                    console.log('User signed out');
                    const currentPagePath = window.location.pathname;
                    let pageName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase();
                     if (pageName === "" && currentPagePath.length > 1) {
                        const pathParts = currentPagePath.substring(0, currentPagePath.length -1).split('/');
                        pageName = pathParts[pathParts.length -1].toLowerCase();
                    }
                    const nonAuthEntryPages = ['index.html', 'ranked.html', 'login.html'];
                    if (!nonAuthEntryPages.includes(pageName) && !(pageName === "" && currentPagePath === "/")) {
                         window.location.href = 'ranked.html'; 
                    }
                }).catch((error) => {
                    console.error('Sign out error', error);
                });
            };
        }

    } else {
        console.warn("Firebase auth object (from firebase-init.js) is not available. UI for auth state will not update fully.");
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
    // Any merits.html specific JavaScript actions for the tracker would go below this line.
    // For the provided HTML, the main content is a placeholder, so no unique JS yet.
});