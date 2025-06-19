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
 // NEW: Get reference to the Torn Stats API Key input
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
    if (secs <= 0) return "OK 😊"; // Added emoji here as requested for other cooldowns
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
                    let displayValue = formatTimeRemaining(remaining); // This will be "OK 😊" if remaining is 0
                    if (remaining <= 0) { // If timer just hit 0, ensure correct text based on ID
                        if (elementId === "hospitalStat" && prefixText.toUpperCase() === "YES") {
                            displayValue = "No 😁";
                        } else {
                            displayValue = "OK 😊";
                        }
                    }

                    if (elementId === "hospitalStat" && prefixText.toUpperCase() === "YES") {
                        displayValue = `Yes 😥 (${formatTimeRemaining(remaining)})`; // Always show timer when active for hospital
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
        } else if (valueFromApi === "Yes 😥") { // If it's explicitly "Yes 😥" (in hospital, no active timer)
            element.classList.add("stat-value-red");
        } else { // For "N/A" or any other unexpected value (e.g., "No" if it slips through)
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
    if (personalStatsModal) personalStatsModal.style.display = 'none';
    if (shareFactionStatsToggleDashboard) { shareFactionStatsToggleDashboard.disabled = true; shareFactionStatsToggleDashboard.checked = false; }
    if (lastLogonInfoEl) lastLogonInfoEl.style.display = 'none';
    if (lastActiveTimeoutId) clearTimeout(lastActiveTimeoutId); lastActiveTimeoutId = null;
  }

async function fetchDataForPersonalStatsModal(apiKey, firestoreProfileData) {
    if (!personalStatsModal || !personalStatsModalBody) {
        console.error("Personal Stats Modal elements not found!");
        if(togglePersonalStatsCheckbox) togglePersonalStatsCheckbox.checked = false;
        return;
    }
    console.log("fetchDataForPersonalStatsModal called. API key available. Firestore data:", firestoreProfileData ? "Available" : "Not Available");
    personalStatsModalBody.innerHTML = '<p>Loading your detailed stats...</p>';
    personalStatsModal.style.display = 'flex';

    const selections = "profile,personalstats,battlestats,workstats";
    const apiUrl = `https://api.torn.com/user/?selections=${selections}&key=${apiKey}&comment=MyTornPA_Modal`;
    console.log("Fetching Personal Stats Modal data from API (key hidden for log)");

    function formatTcpAnniversaryDate(dateObject) {
        if (!dateObject) return 'N/A'; // Handle null or undefined upfront
        let jsDate;
        if (dateObject instanceof Date) {
            jsDate = dateObject;
        } else if (dateObject && typeof dateObject.toDate === 'function') { // Firestore Timestamp
            jsDate = dateObject;
        } else {
            console.warn("formatTcpAnniversaryDate: input was not a Date or convertible Firestore Timestamp. Value:", dateObject);
            return 'N/A';
        }
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return jsDate.toLocaleDateString(undefined, options);
    }

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        console.log("Personal Stats Modal API Response (Torn Data):", data);

        if (!response.ok) throw new Error(`API Error ${response.status}: ${data?.error?.error || response.statusText}`);
        if (data.error) throw new Error(`API Error: ${data.error.error || data.error.message || JSON.stringify(data.error)}`);

        let htmlContent = '<h4>User Information</h4>';
        htmlContent += `<p><strong>Name:</strong> <span class="stat-value-api">${data.name || 'N/A'}</span></p>`;
        htmlContent += `<p><strong>User ID:</strong> <span class="stat-value-api">${data.player_id || data.userID || 'N/A'}</span></p>`;
        htmlContent += `<p><strong>Level:</strong> <span class="stat-value-api">${data.level || 'N/A'}</span></p>`;

        let xanaxDisplay = 'N/A';
        if (data.personalstats && data.personalstats.xantaken !== undefined) {
            if (typeof data.personalstats.xantaken === 'number') {
                xanaxDisplay = data.personalstats.xantaken.toLocaleString();
            } else {
                xanaxDisplay = data.personalstats.xantaken;
            }
        }
        htmlContent += `<p><strong>Xanax Used:</strong> <span class="stat-value-api">${xanaxDisplay}</span></p>`;

        // Use the consistent field name 'tcpRegisteredAt' when accessing from firestoreProfileData
        const tcpAnniversaryDateVal = firestoreProfileData ? firestoreProfileData.tcpRegisteredAt : null;
        htmlContent += `<p><strong>TCP Anniversary:</strong> <span class="stat-value-api">${formatTcpAnniversaryDate(tcpAnniversaryDateVal)}</span></p>`;

        htmlContent += '<h4>Battle Stats</h4>';
        const bsObject = data.battlestats;
        let battleStatsDisplayed = false;

        if (bsObject && typeof bsObject.strength === 'number' && typeof bsObject.defense === 'number' && typeof bsObject.speed === 'number' && typeof bsObject.dexterity === 'number') {
            console.log("Displaying Battle Stats from nested 'battlestats' object.");
            const effStr = Math.floor(bsObject.strength * (1 + (bsObject.strength_modifier || 0) / 100));
            const effDef = Math.floor(bsObject.defense * (1 + (bsObject.defense_modifier || 0) / 100));
            const effSpd = Math.floor(bsObject.speed * (1 + (bsObject.speed_modifier || 0) / 100));
            const effDex = Math.floor(bsObject.dexterity * (1 + (bsObject.dexterity_modifier || 0) / 100));
            const totalBs = bsObject.total || (bsObject.strength + bsObject.defense + bsObject.speed + bsObject.dexterity);

            htmlContent += `<p><strong>Strength:</strong> <span class="stat-value-api">${bsObject.strength.toLocaleString()}</span> <span class="sub-detail">(Mod: ${bsObject.strength_modifier || 0}%) Eff: ${effStr.toLocaleString()}</span></p>`;
            htmlContent += `<p><strong>Defense:</strong> <span class="stat-value-api">${bsObject.defense.toLocaleString()}</span> <span class="sub-detail">(Mod: ${bsObject.defense_modifier || 0}%) Eff: ${effDef.toLocaleString()}</span></p>`;
            htmlContent += `<p><strong>Speed:</strong> <span class="stat-value-api">${bsObject.speed.toLocaleString()}</span> <span class="sub-detail">(Mod: ${bsObject.speed_modifier || 0}%) Eff: ${effSpd.toLocaleString()}</span></p>`;
            htmlContent += `<p><strong>Dexterity:</strong> <span class="stat-value-api">${bsObject.dexterity.toLocaleString()}</span> <span class="sub-detail">(Mod: ${bsObject.dexterity_modifier || 0}%) Eff: ${effDex.toLocaleString()}</span></p>`;
            htmlContent += `<p><strong>Total:</strong> <span class="stat-value-api">${totalBs.toLocaleString()}</span></p>`;
            battleStatsDisplayed = true;
        }
        else if (typeof data.strength === 'number' && typeof data.defense === 'number' && typeof data.speed === 'number' && typeof data.dexterity === 'number') {
            console.log("Displaying Battle Stats from top-level individual fields as 'battlestats' object was missing/invalid.");
            const strength_modifier = data.strength_modifier || 0;
            const defense_modifier = data.defense_modifier || 0;
            const speed_modifier = data.speed_modifier || 0;
            const dexterity_modifier = data.dexterity_modifier || 0;

            const effStr = Math.floor(data.strength * (1 + strength_modifier / 100));
            const effDef = Math.floor(data.defense * (1 + defense_modifier / 100));
            const effSpd = Math.floor(data.speed * (1 + speed_modifier / 100));
            const effDex = Math.floor(data.dexterity * (1 + dexterity_modifier / 100));
            const totalBs = data.total || (data.strength + data.defense + data.speed + data.dexterity);

            htmlContent += `<p><strong>Strength:</strong> <span class="stat-value-api">${data.strength.toLocaleString()}</span> <span class="sub-detail">(Mod: ${strength_modifier}%) Eff: ${effStr.toLocaleString()}</span></p>`;
            htmlContent += `<p><strong>Defense:</strong> <span class="stat-value-api">${data.defense.toLocaleString()}</span> <span class="sub-detail">(Mod: ${defense_modifier}%) Eff: ${effDef.toLocaleString()}</span></p>`;
            htmlContent += `<p><strong>Speed:</strong> <span class="stat-value-api">${data.speed.toLocaleString()}</span> <span class="sub-detail">(Mod: ${speed_modifier}%) Eff: ${effSpd.toLocaleString()}</span></p>`;
            htmlContent += `<p><strong>Dexterity:</strong> <span class="stat-value-api">${data.dexterity.toLocaleString()}</span> <span class="sub-detail">(Mod: ${dexterity_modifier}%) Eff: ${effDex.toLocaleString()}</span></p>`;
            htmlContent += `<p><strong>Total:</strong> <span class="stat-value-api">${totalBs.toLocaleString()}</span></p>`;
            battleStatsDisplayed = true;
        }

        if (!battleStatsDisplayed) {
            htmlContent += '<p>Battle stats data not available or in unexpected format.</p>';
            console.warn("fetchDataForPersonalStatsModal: Could not find usable battle stats in 'battlestats' object or as top-level fields.");
        }

        htmlContent += '<h4>Work Stats</h4>';
        const wsObject = data.workstats;
        let workStatsDisplayed = false;

        if (wsObject && typeof wsObject.manual_labor === 'number' && typeof wsObject.intelligence === 'number' && typeof wsObject.endurance === 'number') {
            console.log("Displaying Work Stats from nested 'workstats' object.");
            htmlContent += `<p><strong>Manual Labor:</strong> <span class="stat-value-api">${wsObject.manual_labor.toLocaleString()}</span></p>`;
            htmlContent += `<p><strong>Intelligence:</strong> <span class="stat-value-api">${wsObject.intelligence.toLocaleString()}</span></p>`;
            htmlContent += `<p><strong>Endurance:</strong> <span class="stat-value-api">${wsObject.endurance.toLocaleString()}</span></p>`;
            workStatsDisplayed = true;
        }
        else if (typeof data.manual_labor === 'number' && typeof data.intelligence === 'number' && typeof data.endurance === 'number') {
            console.log("Displaying Work Stats from top-level individual fields as 'workstats' object was missing/invalid.");
            htmlContent += `<p><strong>Manual Labor:</strong> <span class="stat-value-api">${data.manual_labor.toLocaleString()}</span></p>`;
            htmlContent += `<p><strong>Intelligence:</strong> <span class="stat-value-api">${data.intelligence.toLocaleString()}</span></p>`;
            htmlContent += `<p><strong>Endurance:</strong> <span class="stat-value-api">${data.endurance.toLocaleString()}</span></p>`;
            workStatsDisplayed = true;
        }
        else if (data.job && typeof data.job.manual_labor === 'number' && typeof data.job.intelligence === 'number' && typeof data.job.endurance === 'number') {
            console.log("Displaying Work Stats from nested 'job' object.");
            htmlContent += `<p><strong>Position:</strong> <span class="stat-value-api">${data.job.position || 'N/A'} at ${data.job.company_name || 'N/A'}</span></p>`;
            htmlContent += `<p><strong>Manual Labor:</strong> <span class="stat-value-api">${data.job.manual_labor.toLocaleString()}</span></p>`;
            htmlContent += `<p><strong>Intelligence:</strong> <span class="stat-value-api">${data.job.intelligence.toLocaleString()}</span></p>`;
            htmlContent += `<p><strong>Endurance:</strong> <span class="stat-value-api">${data.job.endurance.toLocaleString()}</span></p>`;
            workStatsDisplayed = true;
        }

        if (!workStatsDisplayed) {
            htmlContent += '<p>Work stats data not available or in unexpected format.</p>';
            console.warn("fetchDataForPersonalStatsModal: Could not find usable work stats in 'workstats' object, as top-level fields, or in 'job' object.");
        }

        personalStatsModalBody.innerHTML = htmlContent;
    } catch (error) {
        console.error("Error fetching/displaying personal stats in modal:", error);
        personalStatsModalBody.innerHTML = `<p style="color:red;">Error loading Personal Stats: ${error.message}. Check API key and console.</p>`;
    }
}

  // REVISED fetchAllRequiredData function
  async function fetchAllRequiredData(user, dbInstance) {
    if (!user || !dbInstance) {
        console.error("fetchAllRequiredData: User or DB not provided.");
        clearQuickStats();
        return;
    }
    console.log("fetchAllRequiredData called for user:", user.uid);
    const quickStatsErrorEl = document.getElementById('quickStatsError');
    if (quickStatsErrorEl) quickStatsErrorEl.textContent = 'Loading data...';
    if (apiKeyMessageEl) apiKeyMessageEl.style.display = 'none';
    if (shareFactionStatsToggleDashboard) shareFactionStatsToggleDashboard.disabled = false;
    if (togglePersonalStatsCheckbox) togglePersonalStatsCheckbox.disabled = false;
    if (personalStatsLabel) personalStatsLabel.style.cursor = 'pointer';

    ["drugCooldownStat", "boosterCooldownStat"].forEach(id => {
        if (activeCooldownIntervals[id]) clearInterval(activeCooldownIntervals[id]);
        delete activeCooldownIntervals[id];
        delete activeCooldownEndTimes[id];
        updateStatDisplay(id, 0, 0, true, 0);
    });
    updateStatDisplay("hospitalStat", null, null, false, "N/A");
    updateStatDisplay("travelStatus", null, null, false, "N/A");

    try {
        const userProfileRef = dbInstance.collection('userProfiles').doc(user.uid);
        const doc = await userProfileRef.get();
        if (!doc.exists) {
            console.log("User profile not found in Firestore.");
            clearQuickStats();
            return;
        }
        const profileDataFromFirestore = doc.data();
        const apiKey = profileDataFromFirestore.tornApiKey; // This is the TORN CITY API key

        if (!apiKey) {
            console.log("No API key found in user profile.");
            clearQuickStats();
            if (quickStatsErrorEl && profileDataFromFirestore.profileSetupComplete) quickStatsErrorEl.textContent = 'API Key not found. Please set it in your profile.';
            if (togglePersonalStatsCheckbox) togglePersonalStatsCheckbox.disabled = true;
            if (personalStatsLabel) personalStatsLabel.style.cursor = 'default';
            return;
        }

        const selections = "bars,cooldowns,travel,profile";
        const apiUrl = `https://api.torn.com/user/?selections=${selections}&key=${apiKey}&comment=MyTornPA_HomeDashboard`;
        console.log(`Fetching dashboard data (selections: ${selections}, key hidden)`);

        const response = await fetch(apiUrl);
        const data = await response.json();
        console.log("Dashboard API Response:", data);

        if (!response.ok) {
            const errorMsg = data?.error?.error || response.statusText;
            throw new Error(`API Error ${response.status}: ${errorMsg}`);
        }
        if (data.error) {
            throw new Error(`API Error: ${data.error.error || data.error.message || JSON.stringify(data.error)}`);
        }

        const barDataSource = data.bars || data;
        updateStatDisplay("nerveStat", barDataSource.nerve?.current, barDataSource.nerve?.maximum);
        updateStatDisplay("energyStat", barDataSource.energy?.current, barDataSource.energy?.maximum);
        updateStatDisplay("happyStat", barDataSource.happy?.current, barDataSource.happy?.maximum);
        updateStatDisplay("lifeStat", barDataSource.life?.current, barDataSource.life?.maximum);

        if (data.cooldowns) {
            updateStatDisplay("drugCooldownStat", 0, 0, true, data.cooldowns.drug || 0);
            updateStatDisplay("boosterCooldownStat", 0, 0, true, data.cooldowns.booster || 0);
        } else {
            updateStatDisplay("drugCooldownStat", 0, 0, true, 0);
            updateStatDisplay("boosterCooldownStat", 0, 0, true, 0);
            console.warn("Cooldowns data missing from API response.");
        }

        const nowSecondsApi = Math.floor(Date.now() / 1000);
        let inHospital = false;
        let hospitalTimeRemaining = 0;
        let determinedHospitalStatusText = "N/A";

        const profileFromApi = data.profile;

        if (profileFromApi && typeof profileFromApi.status === 'object' && profileFromApi.status !== null) {
            const statusObject = profileFromApi.status;
            console.log("Hospital Check - Primary: Using statusObject from data.profile.status:", statusObject);
            const hospitalUntil = statusObject.until || 0;
            const statusState = statusObject.state || "";
            const statusDesc = statusObject.description || "";

            if (statusState.toLowerCase() === "hospital" || statusDesc.toLowerCase().includes("in hospital")) {
                inHospital = true;
                if (hospitalUntil > nowSecondsApi) {
                    hospitalTimeRemaining = hospitalUntil - nowSecondsApi;
                    // determinedHospitalStatusText is not set here, relies on inHospital and hospitalTimeRemaining for timed display
                } else {
                    determinedHospitalStatusText = "Yes 😥"; // In hospital, but timer is up or not specified
                }
            } else {
                determinedHospitalStatusText = "No 😁";
            }
        } else if (data.status && typeof data.status === 'object' && data.status !== null) {
            console.log("Hospital Check - Fallback: Using statusObject from data.status:", data.status);
            const statusObject = data.status;
            const hospitalUntil = statusObject.until || 0;
            const statusState = statusObject.state || "";
            const statusDesc = statusObject.description || "";
            console.log(`Hospital Check (from data.status) - Values: until: ${hospitalUntil}, state: '${statusState}', desc: '${statusDesc}'`);

            if (statusState.toLowerCase() === "hospital" || statusDesc.toLowerCase().includes("in hospital")) {
                inHospital = true;
                if (hospitalUntil > nowSecondsApi) {
                    hospitalTimeRemaining = hospitalUntil - nowSecondsApi;
                      // determinedHospitalStatusText is not set here, relies on inHospital and hospitalTimeRemaining for timed display
                } else {
                    determinedHospitalStatusText = "Yes 😥";
                }
            } else {
                determinedHospitalStatusText = "No 😁";
            }
        } else {
            console.warn("Hospital Check - Valid status object not found in data.profile.status or data.status.");
            // determinedHospitalStatusText remains "N/A" (its initial value if status cannot be determined)
        }

        if (inHospital && hospitalTimeRemaining > 0) {
            updateStatDisplay("hospitalStat", null, null, true, hospitalTimeRemaining, "Yes"); // Prefix "Yes" for timed display
        } else {
            updateStatDisplay("hospitalStat", null, null, false, determinedHospitalStatusText);
        }

        if (data.travel && typeof data.travel.destination === 'string') {
            if (data.travel.time_left > 0) {
                updateStatDisplay("travelStatus", null, null, false, `Yes (${data.travel.destination}, ${formatTimeRemaining(data.travel.time_left)})`);
            } else {
                updateStatDisplay("travelStatus", null, null, false, `No (${data.travel.destination})`);
            }
        } else {
            updateStatDisplay("travelStatus", null, null, false, "No");
            console.warn("Travel data missing or not as expected in API response.");
        }

        if (quickStatsErrorEl) quickStatsErrorEl.textContent = '';


        // --- NEW CODE STARTS HERE (Faction update from existing data - using snake_case) ---
        const currentFactionData = {
            faction_id: null,
            faction_name: null,
            position: null // Initialize position with snake_case
        };

        if (data.profile && data.profile.faction) {
            const faction = data.profile.faction;
            // Use snake_case to match your desired storage and the data you observed
            if (typeof faction.faction_id === 'number') { // Corrected from ID
                currentFactionData.faction_id = faction.faction_id;
            }
            if (typeof faction.faction_name === 'string') { // Corrected from name
                currentFactionData.faction_name = faction.faction_name;
            }
            if (typeof faction.position === 'string') { // Corrected from position to match direct observation
                currentFactionData.position = faction.position;
            }
        }

        console.log('Sending current faction data to Netlify function:', currentFactionData);

        // Add a small delay to avoid potential rate limit issues, even with simplified Netlify function
        setTimeout(() => {
            fetch('/.netlify/functions/update-user-faction', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    uid: user.uid,
                    faction_id: currentFactionData.faction_id,      // Pass snake_case
                    faction_name: currentFactionData.faction_name,  // Pass snake_case
                    position: currentFactionData.position,          // Pass snake_case
                }),
            })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errorData => {
                        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                // Ensure log output matches the snake_case keys now
                console.log('Faction update via provided data successful:', data.message, `(Faction ID: ${data.faction_id}, Name: ${data.faction_name}, Position: ${data.position})`);
            })
            .catch(error => {
                console.error('Faction update via provided data failed:', error.message);
            });
        }, 500); // Small 0.5-second delay
        // --- NEW CODE ENDS HERE ---

    } catch (error) {
        console.error("Error in fetchAllRequiredData:", error);
        clearQuickStats();
        if (quickStatsErrorEl) quickStatsErrorEl.textContent = `Error loading data: ${error.message}. Check API key or Torn API status.`;
    }
  }


  // --- Event Listener for Personal Stats Modal (MORE ROBUST VERSION) ---
  if (togglePersonalStatsCheckbox && personalStatsLabel) {
    togglePersonalStatsCheckbox.addEventListener('change', function() {
        console.log("Personal Stats checkbox 'change' event. Checked:", this.checked);
        if (this.checked) {
            const user = auth.currentUser;
            if (user && db) {
                db.collection('userProfiles').doc(user.uid).get().then(doc => {
                    if (doc.exists) {
                        const firestoreProfileData = doc.data();
                        if (firestoreProfileData && firestoreProfileData.tornApiKey) {
                            fetchDataForPersonalStatsModal(firestoreProfileData.tornApiKey, firestoreProfileData);
                        } else {
                            console.log("API Key missing in Firestore profile or profile data is empty/invalid.");
                            if (personalStatsModal && personalStatsModalBody) {
                                personalStatsModalBody.innerHTML = '<p style="color:orange;">API Key needed. Please set it in your profile.</p>';
                                personalStatsModal.style.display = 'flex';
                            }
                            this.checked = false;
                        }
                    } else {
                        console.log("No Firestore profile document found for user.");
                        if (personalStatsModal && personalStatsModalBody) {
                            personalStatsModalBody.innerHTML = '<p style="color:red;">User profile not found. Please complete setup.</p>';
                            personalStatsModal.style.display = 'flex';
                        }
                        this.checked = false;
                    }
                }).catch(err => {
                    console.error("Error getting user profile for personal stats modal:", err);
                    if (personalStatsModal && personalStatsModalBody) {
                        personalStatsModalBody.innerHTML = '<p style="color:red;">Error fetching profile. Please try again.</p>';
                        personalStatsModal.style.display = 'flex';
                    }
                    this.checked = false;
                });
            } else {
                console.log("User not logged in or DB not ready for personal stats modal.");
                if (personalStatsModal && personalStatsModalBody) {
                    personalStatsModalBody.innerHTML = '<p style="color:red;">User not logged in or database error.</p>';
                    personalStatsModal.style.display = 'flex';
                }
                this.checked = false;
            }
        } else {
            if (personalStatsModal && personalStatsModal.style.display === 'flex') {
                console.log("Personal Stats checkbox unchecked, hiding modal if it was open.");
                personalStatsModal.style.display = 'none';
            }
        }
    });
  } else {
      console.warn("Personal Stats checkbox or its label not found during initial setup.");
  }

  if (closePersonalStatsModalBtn && personalStatsModal) {
    closePersonalStatsModalBtn.addEventListener('click', function() {
        console.log("Personal Stats Modal close button clicked.");
        personalStatsModal.style.display = 'none';
        if (togglePersonalStatsCheckbox) togglePersonalStatsCheckbox.checked = false;
    });
  } else {
      console.warn("Personal Stats Modal or its close button not found.");
  }

  if (shareFactionStatsToggleDashboard && auth && db) {
    shareFactionStatsToggleDashboard.addEventListener('change', async function() {
        const user = auth.currentUser; if (!user || !db) return;
        try {
            await db.collection('userProfiles').doc(user.uid).set({ shareFactionStats: this.checked }, { merge: true });
            console.log("Faction share preference updated:", this.checked);
            if(shareFactionStatsModalToggle) shareFactionStatsModalToggle.checked = this.checked;
        } catch (error) { console.error("Error updating faction share preference:", error); }
    });
  }

  // --- Profile Setup Modal Logic ---
  function showProfileSetupModal() { if (profileSetupModal) profileSetupModal.style.display = 'flex'; }
  function hideProfileSetupModal() { if (profileSetupModal) { profileSetupModal.style.display = 'none'; if (nameErrorEl) nameErrorEl.textContent = ''; if (profileSetupErrorEl) profileSetupErrorEl.textContent = ''; } }
  if (skipProfileSetupBtn) skipProfileSetupBtn.addEventListener('click', hideProfileSetupModal);
  if (closeProfileModalBtn && profileSetupModal) closeProfileModalBtn.addEventListener('click', hideProfileSetupModal);

  if (headerEditProfileBtn && auth && db) {
    headerEditProfileBtn.addEventListener('click', async function(event) {
        event.preventDefault();
        const user = auth.currentUser; if (!user || !db) return;
        try {
            const doc = await db.collection('userProfiles').doc(user.uid).get();
            if (doc.exists) {
                const data = doc.data();
                if(preferredNameInput) preferredNameInput.value = data.preferredName || '';
                if(profileSetupApiKeyInput) profileSetupApiKeyInput.value = data.tornApiKey || '';
                if(profileSetupProfileIdInput) profileSetupProfileIdInput.value = data.tornProfileId || '';
                // NEW: Populate Torn Stats API Key input
                if(profileSetupTornStatsApiKeyInput) profileSetupTornStatsApiKeyInput.value = data.tornStatsApiKey || '';
                if(shareFactionStatsModalToggle) shareFactionStatsModalToggle.checked = data.shareFactionStats === true;
            } else { if(preferredNameInput && user.displayName) preferredNameInput.value = user.displayName.substring(0,10); }
        } catch (err) { console.error("Error fetching profile for edit:", err); if(profileSetupErrorEl) profileSetupErrorEl.textContent = "Could not load profile."; }
        showProfileSetupModal();
    });
  }

  if (saveProfileBtn && auth && db) {
    saveProfileBtn.addEventListener('click', async () => {
        if (!preferredNameInput || !profileSetupApiKeyInput || !profileSetupProfileIdInput || !auth.currentUser || !db) { if (profileSetupErrorEl) profileSetupErrorEl.textContent = 'Internal error.'; return; }
        if (nameErrorEl) nameErrorEl.textContent = ''; if (profileSetupErrorEl) profileSetupErrorEl.textContent = '';
        const preferredNameVal = preferredNameInput.value.trim();
        if (!preferredNameVal) { if (nameErrorEl) nameErrorEl.textContent = 'Name required.'; return; }
        if (preferredNameVal.length > 10) { if (nameErrorEl) nameErrorEl.textContent = 'Max 10 chars.'; return; }
        if (nameBlocklist.some(w => preferredNameVal.toLowerCase().includes(w))) { if (nameErrorEl) nameErrorEl.textContent = 'Name not allowed.'; return; }
        const user = auth.currentUser;
        const profileDataToSave = {
            preferredName: preferredNameVal,
            tornApiKey: profileSetupApiKeyInput.value.trim() || null,
            tornProfileId: profileSetupProfileIdInput.value.trim() || null,
            tornStatsApiKey: profileSetupTornStatsApiKeyInput.value.trim() || null,
            profileSetupComplete: true,
            shareFactionStats: shareFactionStatsModalToggle ? shareFactionStatsModalToggle.checked : false,
            tcpRegisteredAt: firebase.firestore.FieldValue.serverTimestamp()

        };

        try {
            const userProfileRef = db.collection('userProfiles').doc(user.uid);
            const currentDoc = await userProfileRef.get();

            if (currentDoc.exists && currentDoc.data().tcpRegisteredAt) {
                // If it already exists, don't overwrite it with a new server timestamp
                delete profileDataToSave.tcpRegisteredAt;
            } else if (!currentDoc.exists) {
                // If doc doesn't exist, tcpRegisteredAt will be set as part of initial save.
                 profileDataToSave.tcpRegisteredAt = firebase.firestore.FieldValue.serverTimestamp();
            }
            // If doc exists but tcpRegisteredAt doesn't, it will be added by profileDataToSave.

            if (!currentDoc.exists || currentDoc.data().preferredName !== preferredNameVal) {
                profileDataToSave.nameChangeCount = (currentDoc.exists && currentDoc.data().nameChangeCount ? currentDoc.data().nameChangeCount : 0) + 1;
                profileDataToSave.lastNameChangeTimestamp = firebase.firestore.FieldValue.serverTimestamp();
            }

            await userProfileRef.set(profileDataToSave, { merge: true });
            if (user.displayName !== preferredNameVal) await user.updateProfile({ displayName: preferredNameVal });
            if (welcomeMessageEl) welcomeMessageEl.textContent = `Welcome back, ${preferredNameVal}!`;
            if (localStorage.getItem(`hasSeenWelcomeTip_${user.uid}`) !== 'true') { displayRandomTip(); localStorage.setItem(`hasSeenWelcomeTip_${user.uid}`, 'true'); }
            else if (tornTipPlaceholderEl) { tornTipPlaceholderEl.style.display = 'none'; }
            hideProfileSetupModal();
            if (shareFactionStatsToggleDashboard) shareFactionStatsToggleDashboard.checked = profileDataToSave.shareFactionStats;
            // The call to fetchAllRequiredData will now handle the faction update
            if (profileDataToSave.tornApiKey || (currentDoc.exists && currentDoc.data().tornApiKey && !profileDataToSave.hasOwnProperty('tornApiKey')) ) { // check if API key is available after save
                fetchAllRequiredData(user, db); // This will now trigger the faction update indirectly
                if (apiKeyMessageEl) apiKeyMessageEl.style.display = 'none';
            } else {
                clearQuickStats();
                if (apiKeyMessageEl) apiKeyMessageEl.style.display = 'block';
                if (document.getElementById('quickStatsError')) document.getElementById('quickStatsError').textContent = 'API Key not configured.';
            }

            // --- REMOVED DIRECT FACTION UPDATE CALL FROM HERE ---
            // The faction update will now be handled inside fetchAllRequiredData after it gets the data
            // --- END REMOVED CODE ---

        } catch (error) { console.error("Error saving profile: ", error); if (profileSetupErrorEl) profileSetupErrorEl.textContent = "Error saving."; }
    });
  }

  // --- Firebase Auth State Change Listener ---
  if (auth) {
    auth.onAuthStateChanged(async function(user) {
      console.log('Auth State Changed. User:', user ? user.uid : 'No user');
      const isHomePage = window.location.pathname.includes('home.html') || window.location.pathname.endsWith('/') || window.location.pathname === '';

      const homeButtonHeaderEl = document.getElementById('homeButtonHeader');

      if (user) {
        if (mainHomepageContent) mainHomepageContent.style.display = 'block';
        if (headerButtonsContainer) headerButtonsContainer.style.display = 'flex';
        if (signUpButtonHeader) signUpButtonHeader.style.display = 'none';
        if (homeButtonFooter) homeButtonFooter.style.display = (isHomePage && window.location.pathname !== '/') ? 'none' : 'inline-block';
        if (logoutButtonHeader) logoutButtonHeader.style.display = 'inline-flex';
        if (homeButtonHeaderEl) homeButtonHeaderEl.style.display = isHomePage ? 'none' : 'inline-flex';

        let userDisplayName = "User", showSetup = true, firstTip = false, profile = null;
        if (db) {
            try {
                const doc = await db.collection('userProfiles').doc(user.uid).get();
                profile = doc.exists ? doc.data() : null;
                if (profile && profile.preferredName && profile.profileSetupComplete) {
                    userDisplayName = profile.preferredName; showSetup = false;
                    if (localStorage.getItem(`hasSeenWelcomeTip_${user.uid}`) !== 'true') firstTip = true;
                    if (profile.lastLoginTimestamp && lastLogonValueEl && lastLogonInfoEl) {
                        lastLogonValueEl.textContent = formatTimeAgo(profile.lastLoginTimestamp.seconds);
                        lastLogonInfoEl.style.display = 'block';
                        if(lastActiveTimeoutId) clearTimeout(lastActiveTimeoutId);
                        lastActiveTimeoutId = setTimeout(() => { if(lastLogonInfoEl) lastLogonInfoEl.style.display = 'none'; }, 120000);
                    } else if (lastLogonInfoEl) { lastLogonValueEl.textContent = "Welcome!"; lastLogonInfoEl.style.display = 'block'; }
                    db.collection('userProfiles').doc(user.uid).update({ lastLoginTimestamp: firebase.firestore.FieldValue.serverTimestamp() }).catch(console.error);
                    if(shareFactionStatsToggleDashboard) shareFactionStatsToggleDashboard.checked = profile.shareFactionStats === true;

                    // --- REMOVED DIRECT FACTION UPDATE CALL FROM HERE ---
                    // The faction update will now be handled inside fetchAllRequiredData after it gets the data
                    // --- END REMOVED CODE ---

                } else { userDisplayName = user.displayName ? user.displayName.substring(0,10) : "User"; }
            } catch (e) { console.error("Error fetching profile on auth change:", e); userDisplayName = user.displayName ? user.displayName.substring(0,10) : "User"; }
        } else { userDisplayName = user.displayName ? user.displayName.substring(0,10) : "User"; }
        if (welcomeMessageEl) welcomeMessageEl.textContent = `Welcome back, ${userDisplayName}!`;
        if (showSetup) {
            if (welcomeMessageEl && (!profile || !profile.preferredName)) welcomeMessageEl.textContent = `Welcome, ${userDisplayName}! Setup profile.`;
            if (tornTipPlaceholderEl) tornTipPlaceholderEl.style.display = 'none';
            showProfileSetupModal(); clearQuickStats();
            if (apiKeyMessageEl) apiKeyMessageEl.style.display = 'block';
            if(document.getElementById('quickStatsError')) document.getElementById('quickStatsError').textContent = 'Please complete profile for stats.';
        } else {
            if (firstTip) { displayRandomTip(); localStorage.setItem(`hasSeenWelcomeTip_${user.uid}`, 'true'); }
            else if (tornTipPlaceholderEl) { tornTipPlaceholderEl.style.display = 'none'; }
            if (profile && profile.tornApiKey) {
                if (apiKeyMessageEl) apiKeyMessageEl.style.display = 'none';
                fetchAllRequiredData(user, db); // This will now trigger the faction update
            } else {
                if (apiKeyMessageEl) apiKeyMessageEl.style.display = 'block';
                clearQuickStats();
                if(document.getElementById('quickStatsError')) document.getElementById('quickStatsError').textContent = 'API Key not configured. Set in profile.';
            }
        }

      } else { // User is signed out
        if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
        if (signUpButtonHeader) signUpButtonHeader.style.display = 'inline-flex';
        if (mainHomepageContent) mainHomepageContent.style.display = 'none';
        if (homeButtonFooter) homeButtonFooter.style.display = (isHomePage && window.location.pathname !== '/') ? 'none' : 'inline-block';
        if (logoutButtonHeader) logoutButtonHeader.style.display = 'none';
        if (homeButtonHeaderEl) homeButtonHeaderEl.style.display = 'inline-flex';

        clearQuickStats();
        if (welcomeMessageEl) welcomeMessageEl.textContent = 'Please sign in or sign up to use MyTornPA!';
        if (tornTipPlaceholderEl) tornTipPlaceholderEl.style.display = 'none';

        const nonAuthPaths = ['/index.html', '/signup.html', '/terms.html', '/faq.html'];
        const currentPath = window.location.pathname.toLowerCase();
        const isPublicPage = nonAuthPaths.some(p => currentPath.endsWith(p)) || currentPath === '/' || currentPath === '/mytornpa/' || currentPath === '/mytornpa/index.html';


        if (!isPublicPage) {
            console.log('User NOT signed in AND on a protected page. Redirecting to index.html from:', window.location.pathname);
            window.location.href = '../index.html';
        } else {
            console.log('User NOT signed in. On a public page, index, or root. No redirect needed:', window.location.pathname);
        }
      }
    });
  } else { console.error("Firebase auth object not available for auth state listener."); }

  if (logoutButtonHeader && auth) {
    logoutButtonHeader.addEventListener('click', () => {
        auth.signOut().then(() => {
            console.log('User signed out.');
            // window.location.href = '../index.html'; // Optional redirect after logout
        }).catch(error => {
            console.error('Sign out error:', error);
        });
    });
  }


  document.querySelectorAll('.tool-category-toggle').forEach(toggle => {
    toggle.addEventListener('click', function() { this.classList.toggle('active');
    const content = this.nextElementSibling; if (content) content.classList.toggle('open'); });
  });

  console.log("home.js: All initial event listeners and setup attempts complete.");
});