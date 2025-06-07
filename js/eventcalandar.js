document.addEventListener('DOMContentLoaded', function() {
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

    if (typeof auth !== 'undefined') {
        auth.onAuthStateChanged(function(user) {
            const currentPagePath = window.location.pathname;
            const pageName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase();
            const indexPages = ['', 'index.html']; 
            const isThisPageIndexPage = indexPages.includes(pageName);

            if (user) {
                if (headerButtonsContainer) headerButtonsContainer.style.display = 'flex';
                if (signUpButtonHeader) signUpButtonHeader.style.display = 'none';
                if (homeButtonFooter) homeButtonFooter.style.display = 'inline';
                
                if (isThisPageIndexPage && logoutButtonHeader) { 
                    logoutButtonHeader.style.display = 'none'; 
                } else if (logoutButtonHeader) { 
                    logoutButtonHeader.style.display = 'inline-flex'; 
                }

            } else {
                if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
                if (signUpButtonHeader) {
                    if (!isThisPageIndexPage) { 
                        signUpButtonHeader.style.display = 'inline-flex';
                    } else {
                        signUpButtonHeader.style.display = 'none'; 
                    }
                }
                if (homeButtonFooter) homeButtonFooter.style.display = 'none';
            }
        });
    } else {
        console.error("Firebase auth object is not available for header/footer UI script on eventcalendar.js.");
        if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
        if (signUpButtonHeader) {
            const currentPagePath = window.location.pathname;
            const pageName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase();
            const indexPages = ['', 'index.html'];
            if (!indexPages.includes(pageName)) {
                signUpButtonHeader.style.display = 'inline-flex';
            } else {
                signUpButtonHeader.style.display = 'none';
            }
        }
        if (homeButtonFooter) homeButtonFooter.style.display = 'none';
    }
    
    if (logoutButtonHeader && typeof auth !== 'undefined') {
        logoutButtonHeader.onclick = function() { 
            auth.signOut().then(() => {
                console.log('User signed out from eventcalendar.html');
            }).catch((error) => {
                console.error('Sign out error from eventcalendar.html', error);
            });
        };
    } else if (logoutButtonHeader) { 
        logoutButtonHeader.onclick = function() { alert('Logout functionality (Firebase) not ready.'); };
    }
});