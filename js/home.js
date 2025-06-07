// js/home.js
document.addEventListener('DOMContentLoaded', function() {
  console.log("home.js: DOMContentLoaded event fired. All systems go (hopefully)!");

  // --- Firebase Configuration ---
  // Removed Firebase initialization here. It should be handled ONLY by firebase-init.js.
  // If firebase-init.js is not loaded, this section will need to be re-added.
  // Assuming firebase-init.js is loaded BEFORE home.js for correct initialization.
  let db = null;
  let auth = null;

  // Ensure Firebase is initialized globally by firebase-init.js
  if (typeof firebase !== 'undefined' && firebase.app && firebase.auth && firebase.firestore) {
    auth = firebase.auth();
    db = firebase.firestore();
  } else {
    console.error("home.js: Firebase SDK not fully loaded or missing components. Check firebase-init.js.");
    const criticalErrorEl = document.getElementById('criticalErrorDisplay');
    if (criticalErrorEl) criticalErrorEl.textContent = 'Critical error: Core libraries failed to load.';
  }

  if (!db) console.error("home.js: Firestore (db) could not be initialized.");
  if (!auth) console.error("home.js: Firebase Auth (auth) could not be initialized.");

  // --- Modal Control Functions (Auth Modal) ---
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

  // --- DOM Element Getters (home.js specific and used for content) ---
  // Removed: usefulLinksBtn, usefulLinksDropdown, headerContactUsBtn, headerContactUsDropdown
  // Removed: headerButtonsContainer, signUpButtonHeader, logoutButtonHeader
  // These are managed by globalheader.js

  const headerEditProfileBtn = document.getElementById('headerEditProfileBtn'); // This button is in the header, but its click handler needs to be here.
  const homeButtonFooter = document.getElementById('homeButtonFooter'); // This is a footer button.
  const mainHomepageContent = document.getElementById('mainHomepageContent'); // The main content container for this page.
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

  // --- Initial UI State (home.js specific content visibility) ---
  if (mainHomepageContent) mainHomepageContent.style.display = 'none'; // Will be set to 'block' on login.
  // Removed header related display: none. globalheader.js handles it.
  if (homeButtonFooter) homeButtonFooter.style.display = 'none'; // Footer button state
  if (tornTipPlaceholderEl) tornTipPlaceholderEl.style.display = 'none';
  if (profileSetupModal) profileSetupModal.style.display = 'none';
  if (apiKeyMessageEl) apiKeyMessageEl.style.display = 'block';
  if (lastLogonInfoEl) lastLogonInfoEl.style.display = 'none';
  if (shareFactionStatsToggleDashboard) shareFactionStatsToggleDashboard.disabled = true;
  if (personalStatsModal) personalStatsModal.style.display = 'none';
  
  // This block handles header button visibility for the 'home.html' page based on its current path.
  // This logic is now handled by globalheader.js, but ensures the home button itself is hidden on home.html.
  if (window.location.pathname.includes('home.html') || window.location.pathname.includes('/pages/home.html') || window.location.pathname === '/') {
    const homeButtonHeaderEl = document.getElementById('homeButtonHeader'); // Get this specific button
    if (homeButtonHeaderEl) homeButtonHeaderEl.style.display = 'none'; // Hide it if currently on home.html
  }


  // --- Event Listeners for Modals and Buttons (home.js specific) ---
  // The signUpButtonHeader click listener is still here, as it directly opens the authModal.
  const signUpButtonHeader = document.getElementById('signUpButtonHeader'); // Need to redeclare if not global
  if (signUpButtonHeader) {
    signUpButtonHeader.addEventListener('click', openAuthModal);
  }
  if (closeAuthModalBtn) {
    closeAuthModalBtn.addEventListener('click', closeAuthModal);
  }
  if (authModal) {
    authModal.addEventListener('click', function(event) {
        if (event.target === authModal) closeAuthModal();
    });
  }

  // Removed all Dropdown Logic (Useful Links & Contact Us) - now exclusively in globalheader.js

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

  function formatTimeRemaining(secs) { /* ... (unchanged) ... */ return ""; }
  function formatTimeAgo(tsSecs) { /* ... (unchanged) ... */ return ""; }
  function updateStatDisplay(elementId, current, max, isCooldown = false, valueFromApi = 0, prefixText = "") { /* ... (unchanged) ... */ }
  function clearQuickStats() { /* ... (unchanged) ... */ }
  async function fetchDataForPersonalStatsModal(apiKey, firestoreProfileData) { /* ... (unchanged) ... */ }
  async function fetchAllRequiredData(user, dbInstance) { /* ... (unchanged) ... */ }

  // --- Event Listener for Personal Stats Modal ---
  if (togglePersonalStatsCheckbox && personalStatsLabel) {
    togglePersonalStatsCheckbox.addEventListener('change', function() { /* ... (unchanged) ... */ });
  } else {
      console.warn("Personal Stats checkbox or its label not found during initial setup.");
  }

  if (closePersonalStatsModalBtn && personalStatsModal) {
    closePersonalStatsModalBtn.addEventListener('click', function() { /* ... (unchanged) ... */ });
  } else {
      console.warn("Personal Stats Modal or its close button not found.");
  }

  if (shareFactionStatsToggleDashboard && auth && db) {
    shareFactionStatsToggleDashboard.addEventListener('change', async function() { /* ... (unchanged) ... */ });
  }

  // --- Profile Setup Modal Logic (home.js specific) ---
  function showProfileSetupModal() { if (profileSetupModal) profileSetupModal.style.display = 'flex'; }
  function hideProfileSetupModal() { if (profileSetupModal) { profileSetupModal.style.display = 'none'; if (nameErrorEl) nameErrorEl.textContent = ''; if (profileSetupErrorEl) profileSetupErrorEl.textContent = ''; } }
  if (skipProfileSetupBtn) skipProfileSetupBtn.addEventListener('click', hideProfileSetupModal);
  if (closeProfileModalBtn && profileSetupModal) closeProfileModalBtn.addEventListener('click', hideProfileSetupModal); 

  // headerEditProfileBtn click listener remains here, as it triggers home.js's profile modal logic
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
                delete profileDataToSave.tcpRegisteredAt; 
            } else if (!currentDoc.exists) {
                 profileDataToSave.tcpRegisteredAt = firebase.firestore.FieldValue.serverTimestamp();
            }
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
            if (profileDataToSave.tornApiKey || (currentDoc.exists && currentDoc.data().tornApiKey && !profileDataToSave.hasOwnProperty('tornApiKey')) ) {
                if (apiKeyMessageEl) apiKeyMessageEl.style.display = 'none'; 
                fetchAllRequiredData(user, db); 
            } else { 
                clearQuickStats(); 
                if (apiKeyMessageEl) apiKeyMessageEl.style.display = 'block'; 
                if (document.getElementById('quickStatsError')) document.getElementById('quickStatsError').textContent = 'API Key not configured.'; 
            }
        } catch (error) { console.error("Error saving profile: ", error); if (profileSetupErrorEl) profileSetupErrorEl.textContent = "Error saving."; }
    });
  }

  // --- Firebase Auth State Change Listener (home.js specific content logic) ---
  if (auth) {
    auth.onAuthStateChanged(async function(user) {
      console.log('home.js: Auth State Changed. User:', user ? user.uid : 'No user');
      const isHomePage = window.location.pathname.includes('home.html') || window.location.pathname.endsWith('/') || window.location.pathname === '';
      
      // Get the homeButtonHeaderEl here if it's needed for internal logic
      const homeButtonHeaderEl = document.getElementById('homeButtonHeader'); 

      if (user) { 
        // User is signed in. This block controls the main content for home.html
        if (mainHomepageContent) mainHomepageContent.style.display = 'block'; // Make homepage content visible.
        // Removed headerButtonsContainer, signUpButtonHeader visibility as globalheader.js handles these
        // Removed footer button visibility as globalheader.js handles it or it's static.
        // Removed logoutButtonHeader visibility as globalheader.js handles it.
        // Removed homeButtonHeaderEl visibility as globalheader.js handles it.

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
                fetchAllRequiredData(user, db);
            } else {
                if (apiKeyMessageEl) apiKeyMessageEl.style.display = 'block';
                clearQuickStats(); 
                if(document.getElementById('quickStatsError')) document.getElementById('quickStatsError').textContent = 'API Key not configured. Set in profile.';
            }
        }

      } else { // User is signed out
        // This block controls the main content for home.html when logged out.
        if (mainHomepageContent) mainHomepageContent.style.display = 'none'; // Hide homepage content.
        // Removed header related visibility as globalheader.js handles it.
        // Removed footer button visibility as globalheader.js handles it or it's static.
        
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

  // Removed logoutButtonHeader click listener here. It's in globalheader.js.

  // --- Tool Category Toggle (specific to home.js content) ---
  document.querySelectorAll('.tool-category-toggle').forEach(toggle => {
    toggle.addEventListener('click', function() { this.classList.toggle('active'); 
    const content = this.nextElementSibling; if (content) content.classList.toggle('open'); });
  });

  console.log("home.js: All initial event listeners and setup attempts complete.");
});