// js/home.js

document.addEventListener('DOMContentLoaded', function() {
    console.log("home.js: DOMContentLoaded event fired. All systems go (hopefully)!");

    // --- Firebase Configuration ---
    const firebaseConfig = {
        apiKey: "AIzaSyAI5QB7LbFyndbk_khADbKb33iqLSO4EOw", // Replace with your actual config
        authDomain: "mytorn-d03ae.firebaseapp.com",
        projectId: "mytorn-d03ae",
        storageBucket: "mytorn-d03ae.appspot.com",
        messagingSenderId: "205970466308",
        appId: "1:205970466308:web:b2f8ec5d1a38ef05213751"
    };

    let db = null;
    let auth = null;

    if (typeof firebase !== 'undefined' && firebase.app && firebase.auth && firebase.firestore) {
        if (!firebase.apps.length) {
            try {
                firebase.initializeApp(firebaseConfig);
                console.log("Firebase initialized by home.js");
            } catch (e) {
                console.error("Error initializing Firebase from home.js:", e);
            }
        }
        if (firebase.apps.length > 0) {
            auth = firebase.auth();
            db = firebase.firestore();
        }
    } else {
        console.error("home.js: Firebase SDK not fully loaded or missing components.");
        const criticalErrorEl = document.getElementById('criticalErrorDisplay');
        if (criticalErrorEl) criticalErrorEl.textContent = 'Critical error: Core libraries failed to load.';
    }

    if (!db) console.error("home.js: Firestore (db) could not be initialized.");
    if (!auth) console.error("home.js: Firebase Auth (auth) could not be initialized.");

    // --- Modal Control Functions ---
    function openAuthModal() {
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.classList.add('is-active');
            console.log("Authentication modal opened.");
        } else {
            console.error("Authentication modal element (#authModal) not found in HTML!");
        }
    }

    function closeAuthModal() {
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.classList.remove('is-active');
            console.log("Authentication modal closed.");
        }
    }

    // --- DOM Element Getters ---
    const usefulLinksBtn = document.getElementById('usefulLinksBtn');
    const usefulLinksDropdown = document.getElementById('usefulLinksDropdown');
    const headerContactUsBtn = document.getElementById('headerContactUsBtn');
    const headerContactUsDropdown = document.getElementById('headerContactUsDropdown');
    const headerEditProfileBtn = document.getElementById('headerEditProfileBtn');
    const headerButtonsContainer = document.getElementById('headerButtonsContainer');
    const signUpButtonHeader = document.getElementById('signUpButtonHeader');
    const homeButtonFooter = document.getElementById('homeButtonFooter');
    const logoutButtonHeader = document.getElementById('logoutButtonHeader');
    const mainHomepageContent = document.getElementById('mainHomepageContent');
    const welcomeMessageEl = document.getElementById('welcomeMessage');
    const tornTipPlaceholderEl = document.getElementById('tornTipPlaceholder');
    const profileSetupModal = document.getElementById('profileSetupModal');
    const preferredNameInput = document.getElementById('preferredName');
    const profileSetupApiKeyInput = document.getElementById('profileSetupApiKey');
    const profileSetupProfileIdInput = document.getElementById('profileSetupProfileId');
    const profileSetupTornStatsApiKeyInput = document.getElementById('profileSetupTornStatsApiKey');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const skipProfileSetupBtn = document.getElementById('skipProfileSetupBtn');
    const nameErrorEl = document.getElementById('nameError');
    const profileSetupErrorEl = document.getElementById('profileSetupError');
    const apiKeyMessageEl = document.getElementById('apiKeyMessage');
    const tornTimePlaceholder = document.getElementById('tornTimePlaceholder');
    const lastLogonValueEl = document.getElementById('lastLogonValue');
    const lastLogonInfoEl = document.getElementById('lastLogonInfo');
    const closeProfileModalBtn = document.getElementById('closeProfileModalBtn');
    const shareFactionStatsModalToggle = document.getElementById('shareFactionStatsModalToggle');
    const shareFactionStatsToggleDashboard = document.getElementById('shareFactionStatsToggleDashboard');
    const togglePersonalStatsCheckbox = document.getElementById('togglePersonalStatsCheckbox');
    const personalStatsModal = document.getElementById('personalStatsModal');
    const personalStatsModalBody = document.getElementById('personalStatsModalBody');
    const closePersonalStatsModalBtn = document.getElementById('closePersonalStatsDialogBtn');
    const personalStatsLabel = document.getElementById('personalStatsLabel');
    const authModal = document.getElementById('authModal');
    const closeAuthModalBtn = document.getElementById('closeAuthModalBtn');

    const nameBlocklist = ["admin", "moderator", "root", "idiot", "system", "support"];

    // --- Torn Tips ---
    const uselessTornTips = ["Always check your six.", "Flying is 90% waiting.", "A Xanax a day..."];
    function displayRandomTip() { if (tornTipPlaceholderEl) { const tip = uselessTornTips[Math.floor(Math.random() * uselessTornTips.length)]; tornTipPlaceholderEl.textContent = "Torn Tip: " + tip; tornTipPlaceholderEl.style.display = 'block'; } }

    // --- Torn Time ---
    function updateTornTime() { if (tornTimePlaceholder) { const now = new Date(); tornTimePlaceholder.textContent = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')}`; } }
    if (tornTimePlaceholder) { updateTornTime(); setInterval(updateTornTime, 1000); }

    // --- Cooldowns and Timers ---
    let activeCooldownIntervals = {};
    let activeCooldownEndTimes = {};
    let lastActiveTimeoutId = null;

    function formatTimeRemaining(secs) {
        if (secs <= 0) return "OK 😊";
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60);
        const s = Math.floor(secs % 60);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    function formatTimeAgo(tsSecs) {
        if (!tsSecs || tsSecs <= 0) return "a while ago";
        const diff = Math.floor(Date.now() / 1000) - tsSecs;
        if (diff < 2) return "just now"; if (diff < 60) return `${diff} sec ago`;
        const mins = Math.floor(diff / 60); if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
        const hrs = Math.floor(mins / 60); if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
        const days = Math.floor(hrs / 24); return `${days} day${days === 1 ? "" : "s"} ago`;
    }

    function updateStatDisplay(elementId, current, max, isCooldown = false, valueFromApi = 0, prefixText = "") {
        const element = document.getElementById(elementId);
        if (!element) { console.warn(`updateStatDisplay: Element ID ${elementId} not found.`); return; }
        if (activeCooldownIntervals[elementId]) clearInterval(activeCooldownIntervals[elementId]);
        delete activeCooldownIntervals[elementId]; delete activeCooldownEndTimes[elementId];
        element.className = 'value';
        const classesToRemove = ["stat-value-green", "stat-value-yellow", "stat-value-red", "stat-value-blue", "stat-value-orange", "stat-value-ok", "stat-value-cooldown-active"];
        element.classList.remove(...classesToRemove);

        if (isCooldown) {
            const initialRemainingSeconds = Number(valueFromApi);
            if (initialRemainingSeconds <= 0) {
                if (elementId === "hospitalStat" && prefixText.toUpperCase() === "YES") {
                    element.textContent = "No 😁";
                    element.classList.add("stat-value-ok");
                } else {
                    element.textContent = "OK 😊";
                    element.classList.add("stat-value-ok");
                }
            } else {
                activeCooldownEndTimes[elementId] = Math.floor(Date.now() / 1000) + initialRemainingSeconds;
                const updateThisTimer = () => {
                    const nowSeconds = Math.floor(Date.now() / 1000);
                    const endTime = activeCooldownEndTimes[elementId];
                    element.classList.remove("stat-value-ok", "stat-value-cooldown-active", "stat-value-red", "stat-value-blue");
                    if (nowSeconds >= endTime) {
                        if (elementId === "hospitalStat" && prefixText.toUpperCase() === "YES") {
                            element.textContent = "No 😁";
                            element.classList.add("stat-value-ok");
                        } else {
                            element.textContent = "OK 😊";
                            element.classList.add("stat-value-ok");
                        }
                        clearInterval(activeCooldownIntervals[elementId]);
                        delete activeCooldownIntervals[elementId]; delete activeCooldownEndTimes[elementId];
                    } else {
                        const remaining = endTime - nowSeconds;
                        let displayValue = formatTimeRemaining(remaining);
                        if (remaining <= 0) {
                            if (elementId === "hospitalStat" && prefixText.toUpperCase() === "YES") {
                                displayValue = "No 😁";
                            } else {
                                displayValue = "OK 😊";
                            }
                        }

                        if (elementId === "hospitalStat" && prefixText.toUpperCase() === "YES") {
                            displayValue = `Yes 😥 (${formatTimeRemaining(remaining)})`;
                            element.classList.add("stat-value-red");
                        } else {
                            element.classList.add("stat-value-cooldown-active");
                        }
                        element.textContent = displayValue;
                    }
                };
                updateThisTimer();
                activeCooldownIntervals[elementId] = setInterval(updateThisTimer, 1000);
            }
        } else if (elementId === "travelStatus") {
            element.textContent = String(valueFromApi);
            const upperVal = String(valueFromApi).toUpperCase();
            element.classList.remove("stat-value-orange", "stat-value-blue");
            if (upperVal.startsWith("YES")) element.classList.add("stat-value-orange");
            else if (upperVal.includes("NO") || upperVal === "N/A") element.classList.add("stat-value-blue");
        } else if (elementId === "hospitalStat") {
            element.textContent = String(valueFromApi);
            const upperVal = String(valueFromApi).toUpperCase();
            element.classList.remove("stat-value-ok", "stat-value-red", "stat-value-blue");

            if (valueFromApi === "No 😁") {
                element.classList.add("stat-value-ok");
            } else if (valueFromApi === "Yes 😥") {
                element.classList.add("stat-value-red");
            } else {
                element.classList.add("stat-value-blue");
            }
        } else {
            element.textContent = (current == null || max == null) ? "N/A" : `${current}/${max}`;
            if (element.textContent !== "N/A") {
                if (elementId === "nerveStat") element.classList.add("stat-value-red");
                else if (elementId === "energyStat") element.classList.add("stat-value-green");
                else if (elementId === "happyStat") element.classList.add("stat-value-yellow");
                else if (elementId === "lifeStat") element.classList.add("stat-value-blue");
            }
        }
    }

    function clearQuickStats() {
        console.log("home.js: Clearing quick stats.");
        updateStatDisplay("nerveStat", "--", "--"); updateStatDisplay("energyStat", "--", "--");
        updateStatDisplay("happyStat", "--", "--"); updateStatDisplay("lifeStat", "--", "--");
        updateStatDisplay("travelStatus", null, null, false, "N/A");
        updateStatDisplay("hospitalStat", null, null, false, "N/A");
        const cooldownIds = ["drugCooldownStat", "boosterCooldownStat"];
        cooldownIds.forEach(id => updateStatDisplay(id, 0, 0, true, 0));
        const errorEl = document.getElementById('quickStatsError'); if (errorEl) errorEl.textContent = '';
        if (apiKeyMessageEl) apiKeyMessageEl.style.display = 'block';
        if (togglePersonalStatsCheckbox) { togglePersonalStatsCheckbox.disabled = true; togglePersonalStatsCheckbox.checked = false; }
        if (personalStatsModal) personalStatsModal.classList.remove('visible');
        if (shareFactionStatsToggleDashboard) { shareFactionStatsToggleDashboard.disabled = true; shareFactionStatsToggleDashboard.checked = false; }
        if (lastLogonInfoEl) lastLogonInfoEl.style.display = 'none';
        if (lastActiveTimeoutId) clearTimeout(lastActiveTimeoutId); lastActiveTimeoutId = null;
    }

   async function fetchDataForPersonalStatsModal(apiKey, firestoreProfileData) {
    console.log(`[DEBUG] Initiating fetch for Personal Stats Modal with API Key: "${apiKey ? 'Provided' : 'Missing'}"`);

    const personalStatsModal = document.getElementById('personalStatsModal');
    const personalStatsModalBody = document.getElementById('personalStatsModalBody');

    if (!personalStatsModal || !personalStatsModalBody) {
        console.error("HTML Error: Personal Stats Modal elements not found!");
        if(togglePersonalStatsCheckbox) togglePersonalStatsCheckbox.checked = false;
        return;
    }

    personalStatsModalBody.innerHTML = '<p>Loading your detailed stats...</p>';
    personalStatsModal.classList.add('visible');

    const selections = "profile,personalstats,battlestats,workstats,basic,cooldowns,bars";
    const apiUrl = `https://api.torn.com/user/?selections=${selections}&key=${apiKey}&comment=MyTornPA_Modal`;

    console.log(`[DEBUG] Constructed Torn API URL for Personal Stats Modal: ${apiUrl}`);

    function formatTcpAnniversaryDate(dateObject) {
        if (!dateObject) return 'N/A';
        let jsDate;
        if (dateObject instanceof Date) {
            jsDate = dateObject;
        } else if (dateObject && typeof dateObject.toDate === 'function') {
            jsDate = dateObject.toDate();
        } else {
            return 'N/A';
        }
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return jsDate.toLocaleDateString(undefined, options);
    }

    try {
        const response = await fetch(apiUrl);
        console.log(`[DEBUG] Torn API HTTP Response Status for Personal Stats Modal: ${response.status} ${response.statusText}`);
        const data = await response.json();
        console.log(`[DEBUG] Full Torn API Response Data for Personal Stats Modal:`, data);


        if (!response.ok) {
            const errorData = data || { message: "Failed to parse API error response." };
            console.error(`[DEBUG] Torn API HTTP Error details for Personal Stats Modal:`, errorData);
            let errorMessage = `API Error ${response.status}: ${errorData?.error?.error || response.statusText}`;
            throw new Error(errorMessage);
        }
        if (data.error) {
            console.error(`[DEBUG] Torn API Data Error details for Personal Stats Modal:`, data.error);
            throw new Error(`API Error: ${data.error.error || data.error.message || JSON.stringify(data.error)}`);
        }

        // --- NEW: Call Netlify Function for Secure Firebase Storage ---
        const userId = data.player_id;
        if (userId) {
            const userDataToSave = {
                name: data.name,
                level: data.level,
                profile_image: data.profile_image || null, // <--- ADDED THIS LINE
                // Quick Stats from 'basic' selection and status object
                nerve: data.nerve || 0,
                energy: data.energy || 0,
                happy: data.happy || 0,
                life: data.life || 0,
                traveling: data.status?.state === 'Traveling' || false,
                hospitalized: data.status?.state === 'Hospital' || false,
                // Cooldowns from 'cooldowns' selection
                cooldowns: {
                    drug: data.cooldowns?.drug || 0,
                    booster: data.cooldowns?.booster || 0,
                },
                // Personal Stats
                personalstats: data.personalstats || {},
                // Battle Stats
                battlestats: {
                    strength: data.strength || data.battlestats?.strength || 0,
                    defense: data.defense || data.battlestats?.defense || 0,
                    speed: data.speed || data.battlestats?.speed || 0,
                    dexterity: data.dexterity || data.battlestats?.dexterity || 0,
                    total: data.total || data.battlestats?.total || 0,
                    strength_modifier: data.strength_modifier || data.battlestats?.strength_modifier || 0,
                    defense_modifier: data.defense_modifier || data.battlestats?.defense_modifier || 0,
                    speed_modifier: data.speed_modifier || data.battlestats?.speed_modifier || 0,
                    dexterity_modifier: data.dexterity_modifier || data.battlestats?.dexterity_modifier || 0,
                },
                // Work Stats
                workstats: {
                    manual_labor: data.manual_labor || data.workstats?.manual_labor || 0,
                    intelligence: data.intelligence || data.workstats?.intelligence || 0,
                    endurance: data.endurance || data.workstats?.endurance || 0,
                },
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp() // Timestamp for last update
            };

            console.log(`[DEBUG] Prepared user data for Netlify Function:`, userDataToSave);

            try {
                // Call the new Netlify Function to securely save data to Firestore
                const netlifyFunctionResponse = await fetch('/.netlify/functions/update-user-data', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userId: String(userId), // Ensure userId is a string
                        userData: userDataToSave,
                    }),
                });

                if (!netlifyFunctionResponse.ok) {
                    const errorDetails = await netlifyFunctionResponse.json();
                    throw new Error(`Netlify Function Error: ${netlifyFunctionResponse.status} - ${errorDetails.error || 'Unknown error'}`);
                }

                console.log(`[DEBUG] Successfully sent user ${userId} data to Netlify Function.`);
            } catch (functionError) {
                console.error(`[ERROR] Failed to send user ${userId} data to Netlify Function:`, functionError);
            }
        } else {
            console.warn("[WARN] User ID not found in Torn API response. Cannot send data to Netlify Function.");
        }
        // --- End: Call Netlify Function for Secure Firebase Storage ---


        let htmlContent = '<h4>User Information</h4>';
        htmlContent += `<p><strong>Name:</strong> <span class="stat-value-api">${data.name || 'N/A'}</span></p>`;
        htmlContent += `<p><strong>User ID:</strong> <span class="stat-value-api">${data.player_id || data.userID || 'N/A'}</span></p>`;
        htmlContent += `<p><strong>Level:</strong> <span class="stat-value-api">${data.level || 'N/A'}</span></p>`;

        let xanaxDisplay = 'N/A';
        if (data.personalstats && data.personalstats.xantaken !== undefined) {
            xanaxDisplay = typeof data.personalstats.xantaken === 'number' ? data.personalstats.xantaken.toLocaleString() : data.personalstats.xantaken;
        }
        htmlContent += `<p><strong>Xanax Used:</strong> <span class="stat-value-api">${xanaxDisplay}</span></p>`;

        const tcpAnniversaryDateVal = firestoreProfileData ? firestoreProfileData.tcpRegisteredAt : null;
        htmlContent += `<p><strong>TCP Anniversary:</strong> <span class="stat-value-api">${formatTcpAnniversaryDate(tcpAnniversaryDateVal)}</span></p>`;

        htmlContent += '<h4>Battle Stats</h4>';
        if (typeof data.strength === 'number' || typeof data.battlestats?.strength === 'number') {
            const bsStrength = data.strength || data.battlestats?.strength;
            const bsDefense = data.defense || data.battlestats?.defense;
            const bsSpeed = data.speed || data.battlestats?.speed;
            const bsDexterity = data.dexterity || data.battlestats?.dexterity;
            
            const strengthModifier = data.strength_modifier || data.battlestats?.strength_modifier || 0;
            const defenseModifier = data.defense_modifier || data.battlestats?.defense_modifier || 0;
            const speedModifier = data.speed_modifier || data.battlestats?.speed_modifier || 0;
            const dexterityModifier = data.dexterity_modifier || data.battlestats?.dexterity_modifier || 0;

            const effStr = Math.floor(bsStrength * (1 + strengthModifier / 100));
            const effDef = Math.floor(bsDefense * (1 + defenseModifier / 100));
            const effSpd = Math.floor(bsSpeed * (1 + speedModifier / 100));
            const effDex = Math.floor(bsDexterity * (1 + dexterityModifier / 100));
            
            const totalBs = data.total || data.battlestats?.total || (bsStrength + bsDefense + bsSpd + bsDexterity);

            htmlContent += `<p><strong>Strength:</strong> <span class="stat-value-api">${bsStrength.toLocaleString()}</span> <span class="sub-detail">(Mod: ${strengthModifier}%) Eff: ${effStr.toLocaleString()}</span></p>`;
            htmlContent += `<p><strong>Defense:</strong> <span class="stat-value-api">${bsDefense.toLocaleString()}</span> <span class="sub-detail">(Mod: ${defenseModifier}%) Eff: ${effDef.toLocaleString()}</span></p>`;
            htmlContent += `<p><strong>Speed:</strong> <span class="stat-value-api">${bsSpeed.toLocaleString()}</span> <span class="sub-detail">(Mod: ${speedModifier}%) Eff: ${effSpd.toLocaleString()}</span></p>`;
            htmlContent += `<p><strong>Dexterity:</strong> <span class="stat-value-api">${bsDexterity.toLocaleString()}</span> <span class="sub-detail">(Mod: ${dexterityModifier}%) Eff: ${effDex.toLocaleString()}</span></p>`;
            htmlContent += `<p><strong>Total:</strong> <span class="stat-value-api">${totalBs.toLocaleString()}</span></p>`;
        } else {
            htmlContent += '<p>Battle stats data not available.</p>';
            console.warn("[DEBUG] Battle stats (strength, defense, speed, dexterity) not found directly in API response data or within 'battlestats' object, or are not numbers.");
        }

        htmlContent += '<h4>Work Stats</h4>';
        if (typeof data.manual_labor === 'number' || typeof data.workstats?.manual_labor === 'number') {
            htmlContent += `<p><strong>Manual Labor:</strong> <span class="stat-value-api">${(data.manual_labor || data.workstats?.manual_labor).toLocaleString()}</span></p>`;
            htmlContent += `<p><strong>Intelligence:</strong> <span class="stat-value-api">${(data.intelligence || data.workstats?.intelligence).toLocaleString()}</span></p>`;
            htmlContent += `<p><strong>Endurance:</strong> <span class="stat-value-api">${(data.endurance || data.workstats?.endurance).toLocaleString()}</span></p>`;
        } else {
            htmlContent += '<p>Work stats data not available.</p>';
            console.warn("[DEBUG] Work stats (manual_labor, intelligence, endurance) not found directly in API response data or within 'workstats' object, or are not numbers.");
        }

        personalStatsModalBody.innerHTML = htmlContent;
    } catch (error) {
        console.error("Error fetching/displaying personal stats in modal:", error);
        personalStatsModalBody.innerHTML = `<p style="color:red;">Error loading Personal Stats: ${error.message}. Check API key and console.</p>`;
    }
}