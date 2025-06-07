document.addEventListener('DOMContentLoaded', function() {
    const intervalSelect = document.getElementById('interval');
    const currentIntervalSpan = document.getElementById('currentInterval');
    const fetchActivityBtn = document.getElementById('fetchActivity');
    const stopActivityBtn = document.getElementById('stopActivity');
    const clearDataBtn = document.getElementById('clearData');
    const activityLogsDiv = document.getElementById('activityLogs');

    if (intervalSelect && currentIntervalSpan) {
        intervalSelect.addEventListener('change', function() {
            currentIntervalSpan.textContent = this.value + " minutes";
        });
        if (intervalSelect.value) {
            currentIntervalSpan.textContent = intervalSelect.value + " minutes";
        }
    }

    if (fetchActivityBtn) {
        fetchActivityBtn.addEventListener('click', () => {
            console.log("Fetching faction activity...");
            if(activityLogsDiv) activityLogsDiv.innerHTML += "<p>Fetching activity data...</p>";
        });
    }

    if (stopActivityBtn) {
        stopActivityBtn.addEventListener('click', () => {
            console.log("Stopping faction activity tracking...");
            if(activityLogsDiv) activityLogsDiv.innerHTML += "<p>Stopping activity tracking.</p>";
        });
    }

    if (clearDataBtn && activityLogsDiv) {
        clearDataBtn.addEventListener('click', () => {
            activityLogsDiv.innerHTML = "";
            console.log("Cleared activity data.");
        });
    }

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

    const homeButtonHeader = document.getElementById('homeButtonHeader');
    if (homeButtonHeader) {
        homeButtonHeader.addEventListener('click', function() {
            window.location.href = 'home.html';
        });
    }

    const signUpButtonHeaderElem = document.getElementById('signUpButtonHeader');
    if (signUpButtonHeaderElem) {
        signUpButtonHeaderElem.addEventListener('click', function() {
            window.location.href = 'signup.html';
        });
    }

    const headerButtonsContainer = document.getElementById('headerButtonsContainer');
    const homeButtonFooter = document.getElementById('homeButtonFooter');
    const logoutButtonHeader = document.getElementById('logoutButtonHeader');

    if (homeButtonFooter) homeButtonFooter.style.display = 'none';

    let authInstance = null;
    if (typeof firebase !== 'undefined' && firebase.apps.length > 0 && typeof firebase.auth === 'function') {
        authInstance = firebase.auth();
    } else {
        console.error("Firebase not initialized or auth service not available. UI updates based on auth state might not work.");
        if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
        if (signUpButtonHeaderElem) {
            const currentPagePath = window.location.pathname;
            let pageName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase();
            if (!pageName) pageName = "index.html";
            const indexPages = ['index.html', 'home.html'];
            if (!indexPages.includes(pageName)) {
                signUpButtonHeaderElem.style.display = 'inline-flex';
            } else {
                signUpButtonHeaderElem.style.display = 'none';
            }
        }
        if (homeButtonFooter) homeButtonFooter.style.display = 'none';
        if (logoutButtonHeader) {
            logoutButtonHeader.style.display = 'none';
            logoutButtonHeader.addEventListener('click', () => alert('Logout functionality (Firebase) not ready.'));
        }
    }

    if (authInstance) {
        authInstance.onAuthStateChanged(function(user) {
            const currentPagePath = window.location.pathname;
            let pageName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase();
            if (!pageName && currentPagePath.endsWith('/')) pageName = "index.html";
            else if (!pageName) pageName = "index.html";

            const indexPages = ['index.html', 'home.html', ''];
            const isThisPageIndexPage = indexPages.includes(pageName);

            if (user) {
                if (headerButtonsContainer) headerButtonsContainer.style.display = 'flex';
                if (signUpButtonHeaderElem) signUpButtonHeaderElem.style.display = 'none';
                if (homeButtonFooter) homeButtonFooter.style.display = 'inline';

                if (logoutButtonHeader) {
                    if (isThisPageIndexPage && (pageName === 'index.html' || pageName === '')) {
                         logoutButtonHeader.style.display = 'none';
                    } else {
                         logoutButtonHeader.style.display = 'inline-flex';
                    }
                }
            } else {
                if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
                if (signUpButtonHeaderElem) {
                    if (!isThisPageIndexPage) {
                        signUpButtonHeaderElem.style.display = 'inline-flex';
                    } else {
                        signUpButtonHeaderElem.style.display = 'none';
                    }
                }
                if (homeButtonFooter) homeButtonFooter.style.display = 'none';
                if (logoutButtonHeader) logoutButtonHeader.style.display = 'none';
            }
        });

        if (logoutButtonHeader && authInstance) {
            logoutButtonHeader.addEventListener('click', function() {
                authInstance.signOut().then(() => {
                    console.log('User signed out');
                }).catch((error) => {
                    console.error('Sign out error', error);
                });
            });
        }
    }
});