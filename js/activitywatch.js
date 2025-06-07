document.addEventListener('DOMContentLoaded', function() {
    const intervalSelect = document.getElementById('interval');
    const currentIntervalDisplay = document.getElementById('currentInterval');
    const fetchActivityBtn = document.getElementById('fetchActivity');
    const stopActivityBtn = document.getElementById('stopActivity');
    const clearDataBtn = document.getElementById('clearData');
    const activityLogsDiv = document.getElementById('activityLogs');

    // Update current interval display when selection changes
    if (intervalSelect && currentIntervalDisplay) {
        intervalSelect.addEventListener('change', function() {
            currentIntervalDisplay.textContent = this.value + " minutes";
        });
        // Initialize display
        currentIntervalDisplay.textContent = intervalSelect.value + " minutes";
    }

    // Button event listeners
    if (fetchActivityBtn) {
        fetchActivityBtn.addEventListener('click', () => {
            const profileId = document.getElementById('profileId') ? document.getElementById('profileId').value : '';
            const tornApiKey = document.getElementById('tornStatsApiKey') ? document.getElementById('tornStatsApiKey').value : '';
            const myFaction = document.getElementById('myFaction') ? document.getElementById('myFaction').value : '';
            const enemyFaction = document.getElementById('enemyFaction') ? document.getElementById('enemyFaction').value : '';
            const intervalMinutes = intervalSelect ? intervalSelect.value : '30';

            logActivity(`Workspaceing activity with Profile ID: ${profileId}, My Faction: ${myFaction}, Enemy: ${enemyFaction}, Interval: ${intervalMinutes} mins.`);
            // Placeholder for actual fetch logic
            // TODO: Implement actual API calls and activity tracking
        });
    }

    if (stopActivityBtn) {
        stopActivityBtn.addEventListener('click', () => {
            logActivity("Stopping faction activity tracking...");
            // Placeholder for actual stop logic
            // TODO: Clear any running intervals or processes
        });
    }

    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', () => {
            if (activityLogsDiv) {
                activityLogsDiv.innerHTML = "";
            }
            logActivity("Cleared activity data.", true); // Log to console only
        });
    }

    function logActivity(message, consoleOnly = false) {
        console.log(message);
        if (!consoleOnly && activityLogsDiv) {
            const logEntry = document.createElement('p');
            const timestamp = new Date().toLocaleTimeString();
            logEntry.textContent = `[${timestamp}] ${message}`;
            activityLogsDiv.appendChild(logEntry);
            activityLogsDiv.scrollTop = activityLogsDiv.scrollHeight; // Auto-scroll to bottom
        }
    }

    // --- Replicated Header/Footer UI script (depends on 'auth' from firebase-init.js) ---
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
    // 'auth' should be a global variable defined in firebase-init.js
    if (typeof auth !== 'undefined' && auth) { 
        auth.onAuthStateChanged(function(user) {
            const currentPagePath = window.location.pathname;
            // Handle cases where pathname might be just "/" for the root
            const pageName = currentPagePath.endsWith('/') ? 
                             currentPagePath.substring(0, currentPagePath.length -1).substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase() :
                             currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase();
            
            const indexPages = ['', 'index.html', 'home.html']; // Added home.html as a possible index page
            const isThisPageIndexPage = indexPages.includes(pageName) || (pageName === "" && (currentPagePath === "/" || currentPagePath.endsWith("/home.html")));


            if (user) { // User is signed in
                if (headerButtonsContainer) headerButtonsContainer.style.display = 'flex';
                if (signUpButtonHeader) signUpButtonHeader.style.display = 'none';
                if (homeButtonFooter) homeButtonFooter.style.display = 'inline';
                
                if (isThisPageIndexPage && logoutButtonHeader) { 
                    logoutButtonHeader.style.display = 'none'; 
                } else if (logoutButtonHeader) { 
                    logoutButtonHeader.style.display = 'inline-flex'; 
                }

            } else { // No user signed in
                if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
                if (signUpButtonHeader) {
                    if (!isThisPageIndexPage) { 
                        signUpButtonHeader.style.display = 'inline-flex';
                    } else {
                        signUpButtonHeader.style.display = 'none'; 
                    }
                }
                if (homeButtonFooter) homeButtonFooter.style.display = 'none';

                // Optional: Redirect if not on an allowed page when logged out
                // const allowedNonAuthPages = ['', 'index.html', 'home.html', 'faq.html', 'terms.html', 'signup.html'];
                // if (!allowedNonAuthPages.includes(pageName) && pageName !== "report.html" && pageName !== "about.html") {
                //    window.location.href = 'home.html'; 
                // }
            }
        });

        if (logoutButtonHeader) {
            logoutButtonHeader.onclick = function() { 
                auth.signOut().then(() => {
                    console.log('User signed out');
                    window.location.href = 'home.html'; // Redirect to home after logout
                }).catch((error) => {
                    console.error('Sign out error', error);
                });
            };
        }

    } else {
        console.warn("Firebase auth object (from firebase-init.js) is not available when DOMContentLoaded. Header/footer UI might not reflect auth state correctly.");
        // Fallback UI if auth is not available
        if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
        if (signUpButtonHeader) {
            const currentPagePath = window.location.pathname;
            const pageName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase();
            const indexPages = ['', 'index.html', 'home.html'];
            if (!indexPages.includes(pageName)) {
                signUpButtonHeader.style.display = 'inline-flex';
            } else {
                signUpButtonHeader.style.display = 'none';
            }
        }
        if (homeButtonFooter) homeButtonFooter.style.display = 'none';
        if (logoutButtonHeader) {
             logoutButtonHeader.onclick = function() { alert('Logout functionality (Firebase) not ready or auth not loaded.'); };
        }
    }
});