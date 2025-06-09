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


    // --- Start Gym Gain Estimation Logic - NEW CODE BLOCK ---

    // This array must be identical to the one in the original script
    const Gymlist2 = [{Gym:"Premier Fitness",Energy:5,Str:2,Spe:2,Def:2,Dex:2},{Gym:"Average Joes",Energy:5,Str:2.4,Spe:2.4,Def:2.8,Dex:2.4},{Gym:"Woody's Workout",Energy:5,Str:2.8,Spe:3.2,Def:3,Dex:2.8},{Gym:"Beach Bods",Energy:5,Str:3.2,Spe:3.2,Def:3.2,Dex:"0"},{Gym:"Silver Gym",Energy:5,Str:3.4,Spe:3.6,Def:3.4,Dex:3.2},{Gym:"Pour Femme",Energy:5,Str:3.4,Spe:3.6,Def:3.6,Dex:3.8},{Gym:"Davies Den",Energy:5,Str:3.7,Spe:"0",Def:3.7,Dex:3.7},{Gym:"Global Gym",Energy:5,Str:4,Spe:4,Def:4,Dex:4},{Gym:"Knuckle Heads",Energy:10,Str:4.8,Spe:4.4,Def:4,Dex:4.2},{Gym:"Pioneer Fitness",Energy:10,Str:4.4,Spe:4.6,Def:4.8,Dex:4.4},{Gym:"Anabolic Anomalies",Energy:10,Str:5,Spe:4.6,Def:5.2,Dex:4.6},{Gym:"Core",Energy:10,Str:5,Spe:5.2,Def:5,Dex:5},{Gym:"Racing Fitness",Energy:10,Str:5,Spe:5.4,Def:4.8,Dex:5.2},{Gym:"Complete Cardio",Energy:10,Str:5.5,Spe:5.8,Def:5.5,Dex:5.2},{Gym:"Legs Bums and Tums",Energy:10,Str:"0",Spe:5.6,Def:5.6,Dex:5.8},{Gym:"Deep Burn",Energy:10,Str:6,Spe:6,Def:6,Dex:6},{Gym:"Apollo Gym",Energy:10,Str:6,Spe:6.2,Def:6.4,Dex:6.2},{Gym:"Gun Shop",Energy:10,Str:6.6,Spe:6.4,Def:6.2,Dex:6.2},{Gym:"Force Training",Energy:10,Str:6.4,Spe:6.6,Def:6.4,Dex:6.8},{Gym:"Cha Cha's",Energy:10,Str:6.4,Spe:6.4,Def:6.8,Dex:7},{Gym:"Atlas",Energy:10,Str:7,Spe:6.4,Def:6.4,Dex:6.6},{Gym:"Last Round",Energy:10,Str:6.8,Spe:6.6,Def:7,Dex:6.6},{Gym:"The Edge",Energy:10,Str:6.8,Spe:7,Def:7,Dex:6.8},{Gym:"George's",Energy:10,Str:7.3,Spe:7.3,Def:7.3,Dex:7.3},{Gym:"Balboas Gym",Energy:25,Str:"0",Spe:"0",Def:7.5,Dex:7.5},{Gym:"Frontline Fitness",Energy:25,Str:7.5,Spe:7.5,Def:"0",Dex:"0"},{Gym:"Gym 3000",Energy:50,Str:8,Spe:"0",Def:"0",Dex:"0"},{Gym:"Mr. Isoyamas",Energy:50,Str:"0",Spe:"0",Def:8,Dex:"0"},{Gym:"Total Rebound",Energy:50,Str:"0",Spe:8,Def:"0",Dex:8},{Gym:"Elites",Energy:50,Str:"0",Spe:"0",Def:"0",Dex:8},{Gym:"Sports Science Lab",Energy:25,Str:9,Spe:9,Def:9,Dex:9}];

    function ROUND(num, places) {
        return +(Math.round(num + "e+" + places) + "e-" + places);
    }

    function calculateTotal(stat, happy, dots, energyP, perks, typ, trains) {
        let S = stat;
        // Apply special stat calculation for S > 5e7
        if (S > 5e7) S = 5e7 + (S - 5e7) / (8.77635 * Math.log(S));

        let H = happy;
        let [A, B, C] = {str:[1600,1700,700],spe:[1600,2000,1350],dex:[1800,1500,1000],def:[2100,-600,1500]}[typ];

        let total = 0;
        for (let i = 0; i < trains; i++) {
            S = stat + total; // Use the current total for the next iteration's stat
            // Apply special stat calculation for S > 5e7 within the loop
            if (S > 5e7) S = 5e7 + (S - 5e7) / (8.77635 * Math.log(S));

            total += (S * ROUND(1 + 0.07 * ROUND(Math.log(1 + H / 250), 4), 4) + 8 * H**1.05 + (1 - (H / 99999)**2) * A + B) * (1 / 200000) * dots * energyP * perks;

            let dH = ROUND(energyP / 2, 0); // Happy decrease per train
            H -= dH;
            if (H < 0) H = 0; // Happy cannot go below 0
        }
        return total; // Return only the total gain
    }

    // Helper for API error handling specific to Gym Gain Estimator
    function handleGymApiError(errorObj, errorDisplayElement) {
        let message = `Torn API Error (${errorObj.code}): ${errorObj.error}`;
        switch (errorObj.code) {
            case 2:
                message = 'Incorrect Torn API Key. Please update it in your profile settings.';
                break;
            case 5:
                message = 'Too many requests to Torn API. Please wait a few minutes and try again.';
                break;
            case 14:
                message = 'Daily Torn API read limit reached. Please wait until tomorrow.';
                break;
            default:
                // Use generic message if unhandled
                break;
        }
        if (errorDisplayElement) {
            errorDisplayElement.style.display = 'block';
            errorDisplayElement.textContent = message;
        }
    }

    async function fetchAndDisplayGymGains() {
        const gymEstimatorInfo = document.getElementById('gymEstimatorInfo');
        const gymEstimatorError = document.getElementById('gymEstimatorError');
        const gymGainStrength = document.getElementById('gymGainStrength');
        const gymGainDefense = document.getElementById('gymGainDefense');
        const gymGainSpeed = document.getElementById('gymGainSpeed');
        const gymGainDexterity = document.getElementById('gymGainDexterity');
        const refreshGymGainButton = document.getElementById('refreshGymGainButton'); // Get button reference

        // Reset display
        if (gymEstimatorInfo) gymEstimatorInfo.textContent = 'Using your current energy and active gym to estimate gains...';
        if (gymEstimatorError) {
            gymEstimatorError.style.display = 'none';
            gymEstimatorError.textContent = '';
        }
        if (gymGainStrength) gymGainStrength.textContent = '---';
        if (gymGainDefense) gymGainDefense.textContent = '---';
        if (gymGainSpeed) gymGainSpeed.textContent = '---';
        if (gymGainDexterity) gymGainDexterity.textContent = '---';
        if (refreshGymGainButton) refreshGymGainButton.disabled = true; // Disable button during fetch

        const apiKey = await getUserTornApiKey(); // Use the existing getUserTornApiKey

        if (!apiKey) {
            if (gymEstimatorError) {
                gymEstimatorError.style.display = 'block';
                gymEstimatorError.textContent = 'Torn API Key is required to calculate gym gains. Please set it in your profile settings.';
            }
            if (gymEstimatorInfo) gymEstimatorInfo.textContent = ''; // Clear info message
            if (refreshGymGainButton) refreshGymGainButton.disabled = false; // Re-enable button
            return;
        }

        try {
            const urlStats = `https://api.torn.com/user/?selections=battlestats,gym,bars,perks&key=${apiKey}`;
            const response = await fetch(urlStats);
            const data = await response.json();

            if (data.hasOwnProperty("error")) {
                handleGymApiError(data.error, gymEstimatorError);
                return;
            }

            const strength = data.strength;
            const defense = data.defense;
            const speed = data.speed;
            const dexterity = data.dexterity;
            const happy = data.happy.current;
            const energy = data.energy.current;
            const gymNumber = data.active_gym - 1; // Adjust for 0-indexed array

            if (gymNumber < 0 || gymNumber >= Gymlist2.length) {
                if (gymEstimatorError) {
                    gymEstimatorError.style.display = 'block';
                    gymEstimatorError.textContent = 'Could not determine active gym or gym data is invalid from Torn API.';
                }
                return;
            }

            const currentGym = Gymlist2[gymNumber];
            const EnergyPerTrain = currentGym.Energy;
            const trains = parseInt(energy / EnergyPerTrain);

            if (trains === 0) {
                if (gymEstimatorInfo) gymEstimatorInfo.textContent = `You currently have ${energy} energy. Need ${EnergyPerTrain} energy for one train at ${currentGym.Gym}. Train more to gain!`;
                return;
            }

            if (gymEstimatorInfo) gymEstimatorInfo.textContent = `Estimating gains for ${energy} energy at ${currentGym.Gym} (${trains} trains)...`;

            // Calculate modifiers
            let modifierAll = 1, modifierStr = 1, modifierSpe = 1, modifierDef = 1, modifierDex = 1;
            let n, string;

            if (data.hasOwnProperty('property_perks')) {
                for (let i = 0; i < data.property_perks.length; i++) {
                    string = data.property_perks[i];
                    if (string.includes('gym gains')) {
                        n = parseFloat(string.match(/\d+/)[0]);
                        modifierAll *= (n / 100) + 1;
                    }
                }
            }
            if (data.hasOwnProperty('education_perks')) {
                for (let i = 0; i < data.education_perks.length; i++) {
                    string = data.education_perks[i];
                    modifierAll *= (string.includes('1% gym gains')) ? 1.01 : 1;
                    modifierDex *= (string.includes('dexterity gym gains')) ? 1.01 : 1;
                    modifierDef *= (string.includes('defense gym gains')) ? 1.01 : 1;
                    modifierSpe *= (string.includes('speed gym gains')) ? 1.01 : 1;
                    modifierStr *= (string.includes('strength gym gains')) ? 1.01 : 1;
                }
            }
            if (data.hasOwnProperty('company_perks')) {
                for (let i = 0; i < data.company_perks.length; i++) {
                    string = data.company_perks[i];
                    modifierDex *= (string.includes('dexterity gym gains')) ? 1.1 : 1;
                    modifierDef *= (string.includes('defense gym gains')) ? 1.1 : 1;
                    modifierAll *= (string.includes('gym gains')) ? 1.03 : 1;
                }
            }
            if (data.hasOwnProperty('book_perks')) {
                for (let i = 0; i < data.book_perks.length; i++) {
                    string = data.book_perks[i];
                    modifierAll *= (string.includes('all gym gains')) ? 1.2 : 1;
                    modifierStr *= (string.includes('strength gym gains')) ? 1.3 : 1;
                    modifierDef *= (string.includes('defense gym gains')) ? 1.3 : 1;
                    modifierSpe *= (string.includes('speed gym gains')) ? 1.3 : 1;
                    modifierDex *= (string.includes('dexterity gym gains')) ? 1.3 : 1;
                }
            }
            if (data.hasOwnProperty('faction_perks')) {
                for (let i = 0; i < data.faction_perks.length; i++) {
                    string = data.faction_perks[i];
                    if (string.includes('gym gains')) {
                        n = parseFloat(string.match(/\d+/)[0]);
                        n = (n / 100) + 1;
                        if (string.includes('strength')) {
                            modifierStr *= n;
                        } else if (string.includes('speed')) {
                            modifierSpe *= n;
                        } else if (string.includes('defense')) {
                            modifierDef *= n;
                        } else if (string.includes('dexterity')) {
                            modifierDex *= n;
                        }
                    }
                }
            }

            modifierStr *= modifierAll;
            modifierSpe *= modifierAll;
            modifierDef *= modifierAll;
            modifierDex *= modifierAll;

            const gainSpe = calculateTotal(speed, happy, currentGym.Spe, EnergyPerTrain, modifierSpe, 'spe', trains);
            const gainDef = calculateTotal(defense, happy, currentGym.Def, EnergyPerTrain, modifierDef, 'def', trains);
            const gainDex = calculateTotal(dexterity, happy, currentGym.Dex, EnergyPerTrain, modifierDex, 'dex', trains);
            const gainStr = calculateTotal(strength, happy, currentGym.Str, EnergyPerTrain, modifierStr, 'str', trains);

            if (gymGainStrength) gymGainStrength.textContent = ROUND(gainStr, 2).toLocaleString();
            if (gymGainDefense) gymGainDefense.textContent = ROUND(gainDef, 2).toLocaleString();
            if (gymGainSpeed) gymGainSpeed.textContent = ROUND(gainSpe, 2).toLocaleString();
            if (gymGainDexterity) gymGainDexterity.textContent = ROUND(gainDex, 2).toLocaleString();

            // Highlight the largest gain(s) based on gym dots
            const gainsElements = [
                { id: 'gymGainStrength', value: gainStr, dots: parseFloat(currentGym.Str) },
                { id: 'gymGainDefense', value: gainDef, dots: parseFloat(currentGym.Def) },
                { id: 'gymGainSpeed', value: gainSpe, dots: parseFloat(currentGym.Spe) },
                { id: 'gymGainDexterity', value: gainDex, dots: parseFloat(currentGym.Dex) }
            ];

            let maxDotValue = 0;
            gainsElements.forEach(g => {
                if (g.dots > maxDotValue) {
                    maxDotValue = g.dots;
                }
            });

            gainsElements.forEach(g => {
                const element = document.getElementById(g.id);
                if (element) {
                    if (g.dots === maxDotValue && maxDotValue > 0) { // Only highlight if there's actual gain potential
                        element.style.color = 'lightgreen';
                        element.style.fontWeight = 'bold';
                    } else {
                        element.style.color = ''; // Reset if not the largest
                        element.style.fontWeight = '';
                    }
                }
            });

        } catch (error) {
            console.error('Error fetching gym gain data:', error);
            if (gymEstimatorError) {
                gymEstimatorError.style.display = 'block';
                gymEstimatorError.textContent = `Failed to fetch Torn data for gym gains: ${error.message}.`;
            }
            if (gymEstimatorInfo) gymEstimatorInfo.textContent = ''; // Clear info message
        } finally {
            if (refreshGymGainButton) refreshGymGainButton.disabled = false; // Re-enable button
        }
    }

    // --- End Gym Gain Estimation Logic - NEW CODE BLOCK ---


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

                // NEW: Trigger gym gain estimation for logged-in users
                const gymGainEstimatorExists = !!document.getElementById('gymGainEstimator');
                if (gymGainEstimatorExists) {
                    fetchAndDisplayGymGains();
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

                // NEW: Clear gym gain display for logged-out users and disable button
                const gymEstimatorError = document.getElementById('gymEstimatorError');
                const gymEstimatorInfo = document.getElementById('gymEstimatorInfo');
                const gymGainStrength = document.getElementById('gymGainStrength');
                const gymGainDefense = document.getElementById('gymGainDefense');
                const gymGainSpeed = document.getElementById('gymGainSpeed');
                const gymGainDexterity = document.getElementById('gymGainDexterity');
                const refreshGymGainButton = document.getElementById('refreshGymGainButton');

                if (gymEstimatorError) {
                    gymEstimatorError.style.display = 'block';
                    gymEstimatorError.textContent = 'Please log in to see gym gain estimates.';
                    if (gymEstimatorInfo) gymEstimatorInfo.textContent = ''; // Clear info message
                    if (gymGainStrength) gymGainStrength.textContent = '---';
                    if (gymGainDefense) gymGainDefense.textContent = '---';
                    if (gymGainSpeed) gymGainSpeed.textContent = '---';
                    if (gymGainDexterity) gymGainDexterity.textContent = '---';
                    if (refreshGymGainButton) refreshGymGainButton.disabled = true;
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
        // NEW: Also handle gym gain section if Firebase not available
        const gymEstimatorError = document.getElementById('gymEstimatorError');
        const refreshGymGainButton = document.getElementById('refreshGymGainButton');
        if (gymEstimatorError) {
            gymEstimatorError.style.display = 'block';
            gymEstimatorError.textContent = 'System not ready. Firebase might not be initialized, gym gain estimation unavailable.';
        }
        if (refreshGymGainButton) refreshGymGainButton.disabled = true;
    }

    // --- Battle Stat Gains Tracker JavaScript Logic ---
    const STAT_SNAPSHOT_COLLECTION = 'user_stat_snapshots';

    async function getUserTornApiKey() {
        // This function is already present in your original mypa.js and correctly fetches from Firestore.
        // I have removed my placeholder getTornApiKey and am using this one directly in fetchAndDisplayGymGains.
        if (auth && auth.currentUser) {
            try {
                const userProfileRef = db.collection('user_profiles').doc(auth.currentUser.uid);
                const doc = await userProfileRef.get();
                if (doc.exists && doc.data().tornApiKey) {
                    return doc.data().tornApiKey;
                } else {
                    // Changed alert to console.warn and display error in box
                    console.warn("Torn API key not found in user profile for:", auth.currentUser.uid);
                    return null;
                }
            } catch (error) {
                console.error("Error fetching API key from profile:", error);
                return null;
            }
        }
        console.error("getUserTornApiKey() called when user is not logged in.");
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

    // NEW: Add event listener for the new gym gain refresh button
    const refreshGymGainButton = document.getElementById('refreshGymGainButton');
    if (refreshGymGainButton) {
        refreshGymGainButton.addEventListener('click', fetchAndDisplayGymGains);
    }

    // --- END of Battle Stat Gains Tracker JavaScript Logic ---
});