document.addEventListener('DOMContentLoaded', function() {
    // --- Common Header/Footer UI script (depends on 'auth' and 'db' from firebase-init.js) ---
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

    // Initial UI state before auth check
    if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
    if (signUpButtonHeader) signUpButtonHeader.style.display = 'none';
    if (homeButtonFooter) homeButtonFooter.style.display = 'none';
    if (logoutButtonHeader) logoutButtonHeader.style.display = 'none';


    // --- Battle Stat Gains Tracker JavaScript Elements ---
    // (Declared here so they are in scope for auth checks too if needed for enabling/disabling)
    const lastRecordedTimestampEl = document.getElementById('lastRecordedTimestamp');
    const lastStatsListEl = document.getElementById('lastStatsList');
    const lastStrengthEl = document.getElementById('lastStrength');
    const lastSpeedEl = document.getElementById('lastSpeed');
    const lastDefenseEl = document.getElementById('lastDefense');
    const lastDexterityEl = document.getElementById('lastDexterity');
    const refreshStatsButton = document.getElementById('refreshStatsButton');
    const gainsMessageEl = document.getElementById('gainsMessage');
    const gainsStatsListEl = document.getElementById('gainsStatsList');
    const gainStrengthEl = document.getElementById('gainStrength');
    const gainSpeedEl = document.getElementById('gainSpeed');
    const gainDefenseEl = document.getElementById('gainDefense');
    const gainDexterityEl = document.getElementById('gainDexterity');
    const statTrackerInterfaceExists = !!document.getElementById('statTrackerInterface');


    if (typeof auth !== 'undefined' && auth && typeof db !== 'undefined') {
        auth.onAuthStateChanged(function(user) {
            const currentPagePath = window.location.pathname;
            let pageName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase();
            if (pageName === "" && currentPagePath.length > 1 && currentPagePath.endsWith('/')) { 
                const pathParts = currentPagePath.substring(0, currentPagePath.length -1).split('/');
                pageName = pathParts[pathParts.length -1].toLowerCase();
            } else if (pageName === "" && currentPagePath === "/") {
                // Handles root path
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

                // Stat Tracker Page Specific Logic for logged-in user
                if (statTrackerInterfaceExists) {
                    if(refreshStatsButton) refreshStatsButton.disabled = false;
                    fetchLastRecordedStats(user.uid); // Load last stats on page load for logged-in user
                }

            } else { // No user signed in
                if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
                if (signUpButtonHeader) {
                    // Show sign-up button on non-entry pages if user is not logged in.
                    // Hide it on entry pages (index, login, ranked) as those are for signing in/up.
                    signUpButtonHeader.style.display = isThisNonAuthEntryPage ? 'none' : 'inline-flex';
                }
                if (homeButtonFooter) homeButtonFooter.style.display = 'none';
                if (logoutButtonHeader) logoutButtonHeader.style.display = 'none';
                
                // Define pages accessible without login
                const allowedNonAuthPages = [...nonAuthEntryPages, 'travel.html', 'terms.html', 'faq.html', 'about.html', 'report.html', 'merits.html', 'item_watcher.html']; 
                
                // If current page is NOT in allowed list and user is not logged in, redirect to login.
                // This means mypa.html (stat tracker) now requires login.
                if (!allowedNonAuthPages.includes(pageName) && !(pageName === "" && currentPagePath === "/")) {
                     window.location.href = 'login.html'; // Or your primary login page
                     return;
                }

                // Stat Tracker Page Specific Logic for logged-out user
                if (statTrackerInterfaceExists) {
                    displayLastRecordedStats(null); // Clear displayed stats
                    if(gainsMessageEl) gainsMessageEl.textContent = 'Please log in to track your stats.';
                    if(gainsStatsListEl) gainsStatsListEl.style.display = 'none';
                    if(refreshStatsButton) refreshStatsButton.disabled = true;
                }
            }
        });

        if (logoutButtonHeader) {
            logoutButtonHeader.onclick = function() { 
                auth.signOut().then(() => {
                    console.log('User signed out');
                    window.location.href = 'login.html'; 
                }).catch((error) => {
                    console.error('Sign out error', error);
                });
            };
        }

    } else {
        console.warn("Firebase auth object and/or db object (from firebase-init.js) is not available. UI and functionality will be limited.");
        // Fallback UI if Firebase isn't ready (e.g. redirect to an error page or show minimal public content)
        if (statTrackerInterfaceExists) {
            if(lastRecordedTimestampEl) lastRecordedTimestampEl.textContent = 'System not ready. Firebase might not be initialized.';
            if(gainsMessageEl) gainsMessageEl.textContent = 'System not ready.';
            if(refreshStatsButton) refreshStatsButton.disabled = true;
        }
    }

    // --- Battle Stat Gains Tracker JavaScript Logic ---
    const STAT_SNAPSHOT_COLLECTION = 'user_stat_snapshots';

    async function getUserTornApiKey() {
        // CRITICAL: Implement this function securely.
        // This placeholder prompts the user, which is NOT secure or good UX for production.
        // const apiKey = prompt("DEV ONLY: Enter Torn API Key (Limited Access Recommended)");
        // if (apiKey) return apiKey;
        
        // EXAMPLE: Fetch from a user profile in Firestore (you'd need to set this up)
        if (auth && auth.currentUser) {
            try {
                // Assume you have a 'user_profiles' collection where API keys are stored
                const userProfileRef = db.collection('user_profiles').doc(auth.currentUser.uid);
                const doc = await userProfileRef.get();
                if (doc.exists && doc.data().tornApiKey) {
                    return doc.data().tornApiKey;
                } else {
                    alert("Torn API key not found in your profile. Please add it in your settings.");
                    console.warn("Torn API key not found for user:", auth.currentUser.uid);
                    return null;
                }
            } catch (error) {
                console.error("Error fetching API key from profile:", error);
                alert("Could not retrieve your Torn API key due to an error.");
                return null;
            }
        }
        
        console.error("getUserTornApiKey() needs a proper implementation.");
        alert("API Key retrieval is not configured. This feature requires an API key.");
        return null;
    }

    function displayLastRecordedStats(statsData) {
        if (!statTrackerInterfaceExists) return; // Only run if on the right page

        if (statsData && statsData.timestamp) {
            const dateString = statsData.timestamp.toDate ? statsData.timestamp.toDate().toLocaleString() : 'N/A';
            lastRecordedTimestampEl.textContent = `As of: ${dateString}`;
            lastStrengthEl.textContent = `Strength: ${statsData.strength?.toLocaleString() || '---'}`;
            lastSpeedEl.textContent = `Speed: ${statsData.speed?.toLocaleString() || '---'}`;
            lastDefenseEl.textContent = `Defense: ${statsData.defense?.toLocaleString() || '---'}`;
            lastDexterityEl.textContent = `Dexterity: ${statsData.dexterity?.toLocaleString() || '---'}`;
        } else {
            lastRecordedTimestampEl.textContent = 'No previous stats recorded. Click button to get a baseline.';
            lastStrengthEl.textContent = `Strength: ---`;
            lastSpeedEl.textContent = `Speed: ---`;
            lastDefenseEl.textContent = `Defense: ---`;
            lastDexterityEl.textContent = `Dexterity: ---`;
        }
    }

    async function fetchLastRecordedStats(userId) {
        if (!statTrackerInterfaceExists) return null;
        if (!userId || typeof db === 'undefined') {
            console.warn("fetchLastRecordedStats: User not logged in or Firestore (db) not initialized.");
            displayLastRecordedStats(null);
            return null;
        }
        try {
            const docRef = db.collection(STAT_SNAPSHOT_COLLECTION).doc(userId);
            const docSnap = await docRef.get();
            if (docSnap.exists()) {
                const data = docSnap.data();
                displayLastRecordedStats(data);
                return data;
            } else {
                displayLastRecordedStats(null);
                return null;
            }
        } catch (error) {
            console.error("Error fetching last recorded stats:", error);
            if(lastRecordedTimestampEl) lastRecordedTimestampEl.textContent = 'Error loading previous stats.';
            return null;
        }
    }

    function displayGains(gains, lastTimestamp) {
        if (!statTrackerInterfaceExists) return;

        if (!gains) {
            gainsMessageEl.textContent = 'Current stats recorded as baseline. Check again later for gains!';
            gainsStatsListEl.style.display = 'none';
            return;
        }

        const dateString = lastTimestamp?.toDate ? lastTimestamp.toDate().toLocaleString() : 'a previous check';
        gainsMessageEl.textContent = `Gains since ${dateString}:`;
        
        gainStrengthEl.textContent = `Strength: ${gains.strength >= 0 ? '+' : ''}${gains.strength?.toLocaleString() || 'N/A'}`;
        gainSpeedEl.textContent = `Speed: ${gains.speed >= 0 ? '+' : ''}${gains.speed?.toLocaleString() || 'N/A'}`;
        gainDefenseEl.textContent = `Defense: ${gains.defense >= 0 ? '+' : ''}${gains.defense?.toLocaleString() || 'N/A'}`;
        gainDexterityEl.textContent = `Dexterity: ${gains.dexterity >= 0 ? '+' : ''}${gains.dexterity?.toLocaleString() || 'N/A'}`;
        
        gainsStatsListEl.style.display = 'block';
    }

    async function saveCurrentStats(userId, stats) {
        if (!statTrackerInterfaceExists) return;
        if (!userId || typeof db === 'undefined') {
            console.error("saveCurrentStats: User not logged in or Firestore (db) not initialized.");
            return;
        }
        try {
            const statDataToSave = {
                strength: stats.strength,
                speed: stats.speed,
                defense: stats.defense,
                dexterity: stats.dexterity,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };
            await db.collection(STAT_SNAPSHOT_COLLECTION).doc(userId).set(statDataToSave);
            console.log("Current stats saved as baseline for user:", userId);
            // Re-fetch and display to get the accurate server timestamp and update UI
            await fetchLastRecordedStats(userId);
        } catch (error) {
            console.error("Error saving current stats:", error);
            alert("Could not save current stats. See console for details.");
        }
    }

    if (refreshStatsButton) {
        refreshStatsButton.addEventListener('click', async () => {
            if (!auth || !auth.currentUser) {
                alert("Please log in to use this feature.");
                return;
            }
            const userId = auth.currentUser.uid;

            const apiKey = await getUserTornApiKey();
            if (!apiKey) {
                // getUserTornApiKey should ideally alert the user if key is missing.
                return;
            }

            refreshStatsButton.disabled = true;
            refreshStatsButton.textContent = 'Fetching...';
            if(gainsMessageEl) gainsMessageEl.textContent = 'Fetching current stats from Torn...';
            if(gainsStatsListEl) gainsStatsListEl.style.display = 'none';

            try {
                const response = await fetch(`https://api.torn.com/user/?selections=battlestats&key=${apiKey}`);
                if (!response.ok) {
                    let errorMsg = response.statusText;
                    try {
                        const errorData = await response.json();
                        if (errorData && errorData.error && errorData.error.error) {
                             errorMsg = `Code ${errorData.error.code}: ${errorData.error.error}`;
                        }
                    } catch (e) { /* ignore if response not json */ }
                    throw new Error(`Torn API error: ${errorMsg}`);
                }
                const tornData = await response.json();

                if (tornData.error) {
                    throw new Error(`Torn API error: Code ${tornData.error.code} - ${tornData.error.error}`);
                }
                
                if (!tornData.strength || typeof tornData.speed === 'undefined' || typeof tornData.defense === 'undefined' || typeof tornData.dexterity === 'undefined') {
                     console.error("API Response:", tornData); // Log the response for debugging
                    throw new Error('Battle stat data incomplete or not found in API response. Check API key permissions or Torn API changes.');
                }

                const currentStats = {
                    strength: parseInt(tornData.strength, 10) || 0,
                    speed: parseInt(tornData.speed, 10) || 0,
                    defense: parseInt(tornData.defense, 10) || 0,
                    dexterity: parseInt(tornData.dexterity, 10) || 0
                };

                const lastRecordedStats = await db.collection(STAT_SNAPSHOT_COLLECTION).doc(userId).get()
                    .then(docSnap => docSnap.exists() ? docSnap.data() : null)
                    .catch(err => { console.error("Error fetching last stats for calculation:", err); return null; });


                if (lastRecordedStats) {
                    const gains = {
                        strength: currentStats.strength - (lastRecordedStats.strength || 0),
                        speed: currentStats.speed - (lastRecordedStats.speed || 0),
                        defense: currentStats.defense - (lastRecordedStats.defense || 0),
                        dexterity: currentStats.dexterity - (lastRecordedStats.dexterity || 0)
                    };
                    displayGains(gains, lastRecordedStats.timestamp);
                } else {
                    displayGains(null); // No previous stats, so this is baseline
                }

                await saveCurrentStats(userId, currentStats);

            } catch (error) {
                console.error("Error refreshing stats:", error);
                if(gainsMessageEl) gainsMessageEl.textContent = `Error: ${error.message}`;
                if(gainsStatsListEl) gainsStatsListEl.style.display = 'none';
                alert(`Could not fetch or process stats: ${error.message}`);
            } finally {
                if(refreshStatsButton) {
                    refreshStatsButton.disabled = false;
                    refreshStatsButton.textContent = 'Refresh Stats & Calculate Gains';
                }
            }
        });
    }
    // --- END of Battle Stat Gains Tracker JavaScript Logic ---
});