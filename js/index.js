// js/index.js
document.addEventListener('DOMContentLoaded', function() {
  console.log("index.js: DOMContentLoaded event fired.");

  const firebaseConfig = {
    apiKey: "AIzaSyAI5QB7LbFyndbk_khADbKb33iqLSO4EOw",
    authDomain: "mytorn-d03ae.firebaseapp.com",
    projectId: "mytorn-d03ae",
    storageBucket: "mytorn-d03ae.appspot.com",
    messagingSenderId: "205970466308",
    appId: "1:205970466308:web:b2f8ec5d1a38ef05213751"
  };

  let auth = window.auth || null;
  let db = window.db || null; 

  if (!auth || !db) {  
    if (typeof firebase !== 'undefined' && firebase.app && firebase.auth && firebase.firestore) { 
      if (!firebase.apps.length) {
        try {
          firebase.initializeApp(firebaseConfig);
          console.log("Firebase initialized by index.js (fallback).");
          auth = firebase.auth();
          db = firebase.firestore(); 
        } catch (e) {
          console.error("Error initializing Firebase from index.js (fallback):", e);
        }
      } else {
        auth = firebase.auth();
        db = firebase.firestore(); 
      }
    } else {
      console.error("index.js: Firebase SDK not loaded or Firestore component missing. Authentication and Firestore operations will not work.");
      const loginErrorGlobal = document.getElementById('loginError') || document.body;
      if (loginErrorGlobal) loginErrorGlobal.textContent = 'Critical error: Core libraries failed to load.';
      return;  
    }
  }
  
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const loginBtn = document.getElementById('loginBtn');
  const loginError = document.getElementById('loginError');
  const rememberMeCheckbox = document.getElementById('rememberMe');
  const showPasswordCheckbox = document.getElementById('showPasswordCheckbox');
  // const termsAgreementCheckboxLogin = document.getElementById('termsAgreementCheckbox'); // Element removed from HTML, variable kept if other logic might use, but checks removed

  const registerOverlay = document.getElementById('registerOverlay');
  const registerEmail = document.getElementById('registerEmail');
  const registerPassword = document.getElementById('registerPassword');
  const registerBtn = document.getElementById('registerBtn');
  const registerError = document.getElementById('registerError');
  const closeRegisterBtn = document.getElementById('closeRegister');
  const registerTermsAgreementCheckbox = document.getElementById('registerTermsAgreementCheckbox'); // This was for reg popup, also likely removed from HTML


  const forgotPasswordOverlay = document.getElementById('forgotPasswordOverlay');
  const forgotEmailInput = document.getElementById('forgotEmail');
  const resetPasswordBtn = document.getElementById('resetPasswordBtn');
  const forgotError = document.getElementById('forgotError');
  const forgotSuccess = document.getElementById('forgotSuccess');
  const closeForgotBtn = document.getElementById('closeForgot');

  const showRegisterBtn = document.getElementById('showRegister');  
  const showForgotPasswordBtn = document.getElementById('showForgotPassword');

  const headerButtonsContainer = document.getElementById('headerButtonsContainer');
  const signUpButtonHeader = document.getElementById('signUpButtonHeader');  
  const logoutButtonHeader = document.getElementById('logoutButtonHeader');  
  const homeButtonHeader = document.getElementById('homeButtonHeader');       
  const tornCityHomepageLink = document.getElementById('tornCityHomepageLink');  
    
  const usefulLinksBtn = document.getElementById('usefulLinksBtn');
  const usefulLinksDropdown = document.getElementById('usefulLinksDropdown');
  const contactUsBtn = document.getElementById('contactUsBtn');
  const contactUsDropdown = document.getElementById('contactUsDropdown');
  const liveChatLinkContactUs = document.getElementById('liveChatLinkContactUs');

  const googleSignInButtonLogin = document.getElementById('googleSignInButtonLogin');

  const customAlertOverlay = document.getElementById('customAlertOverlay');
  const customAlertTitleEl = document.getElementById('customAlertTitle');
  const customAlertMessageEl = document.getElementById('customAlertMessage');
  const customAlertCloseBtn = document.getElementById('customAlertClose');

  const whatsNewListElement = document.getElementById('whats-new-list');
  const tornTipElement = document.getElementById('dynamic-torn-tip');

  const authModal = document.getElementById('authModal');  
  const closeAuthModalBtn = document.getElementById('closeAuthModalBtn');

  if (emailInput && rememberMeCheckbox) {
    const rememberedEmail = localStorage.getItem('rememberedUserEmail');
    if (rememberedEmail) {
      emailInput.value = rememberedEmail;
      rememberMeCheckbox.checked = true;
    }
  }

  if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
  if (tornCityHomepageLink) tornCityHomepageLink.style.display = 'none';
  if (homeButtonHeader) homeButtonHeader.style.display = 'none';
  if (logoutButtonHeader) logoutButtonHeader.style.display = 'none';

  function openAuthModal() { 
    if (authModal) {
        authModal.classList.add('is-active');  
        console.log("index.js: Authentication modal (#authModal) opened.");
    } else {
        console.error("index.js: #authModal element not found in HTML!");
    }
  }

  function closeAuthModal() {
    if (authModal) {
        authModal.classList.remove('is-active');
        console.log("index.js: Authentication modal (#authModal) closed.");
    }
  }

  if (signUpButtonHeader && registerOverlay) {
    signUpButtonHeader.addEventListener('click', function(event) {
      event.preventDefault();
      if (registerOverlay) {
        registerOverlay.style.display = 'flex';
        if (loginError) loginError.textContent = '';
        if (forgotPasswordOverlay) forgotPasswordOverlay.style.display = 'none';
        if (authModal && authModal.classList.contains('is-active')) {
            closeAuthModal();
        }
        console.log("index.js: signUpButtonHeader clicked, showing registerOverlay.");
      } else {
        console.error("index.js: registerOverlay element not found for signUpButtonHeader.");
      }
    });
  }

  if (closeAuthModalBtn) {  
    closeAuthModalBtn.addEventListener('click', closeAuthModal);
  }
  if (authModal) {  
    authModal.addEventListener('click', function(event) {
        if (event.target === authModal) {
            closeAuthModal();
        }
    });
  }

  if (showPasswordCheckbox && passwordInput) { showPasswordCheckbox.addEventListener('change', function() { passwordInput.type = this.checked ? 'text' : 'password'; });}
  if (whatsNewListElement) { const allUtilities = [ { text: "Battle Stat Peeper", title: "Know Your Enemy (Or Friend?)", message: "Our Battle Stat Peeper: See their stats before you see the 'Attack Lost' screen. Knowledge is power... or a good reason to run." }, { text: "Faction Activity Peeper", title: "Who's *Actually* Active?", message: "Is your faction a well-oiled war machine or just a collection of expert chat loggers? Our Activity Peeper tries to tell the difference." }, { text: "Faction People Peeper", title: "The Faction Dossier", message: "Get the dirt! Level, age, 'vitamin' usage... Our Faction People Peeper gives you the lowdown. Don't mention where you heard it." }, { text: "Events Calendar", title: "Upcoming: Events Calendar!", message: "Never again miss... uh... whatever important Torn event is happening! Our new Events Calendar is coming soon to organize your chaos." }, { text: "Merits & Honours Guide", title: "Merit Badge Collector", message: "Baffled by Honours? Mystified by Merits? Our guide will show you what you're missing out on (and how to feel slightly superior)." }, { text: "Item Watcher", title: "The (Alleged) Item Watcher", message: "Keep an 'eye' on certain... 'things'. Our Item Watcher is here. Use responsibly. Or don't. We're not your lawyer." }, { text: "RW Weapon Pricer", title: "Ranked War Bling-Bling", message: "Need the hottest hardware for the wars? Our RW Weapon Pricer (work in progress!) will help you find those 'must-have' items. Wallet discretion advised." }, { text: "City Travel Profit Monitor", title: "Globetrotter's Ledger", message: "Are your exotic trips actually funding your empire, or just your expensive postcard collection? Our Travel Profit Monitor spills the beans." } ]; if (allUtilities.length > 0) { function getRandomUtilities(utilitiesArray, count) { if (count > utilitiesArray.length) return [...utilitiesArray]; const shuffled = [...utilitiesArray].sort(() => 0.5 - Math.random()); return shuffled.slice(0, count); } const utilitiesToShow = getRandomUtilities(allUtilities, 2); whatsNewListElement.innerHTML = ''; utilitiesToShow.forEach(utility => { const listItem = document.createElement('li'); const linkItem = document.createElement('a'); linkItem.href = "#"; linkItem.classList.add('whats-new-item'); linkItem.textContent = utility.text; linkItem.setAttribute('data-title', utility.title); linkItem.setAttribute('data-message', utility.message); linkItem.addEventListener('click', (e) => { e.preventDefault(); if (customAlertTitleEl && customAlertMessageEl && customAlertOverlay) { customAlertTitleEl.textContent = linkItem.dataset.title || 'Notification'; customAlertMessageEl.textContent = linkItem.dataset.message || 'No details provided.'; customAlertOverlay.style.display = 'flex'; } }); listItem.appendChild(linkItem); whatsNewListElement.appendChild(listItem); }); } else { whatsNewListElement.innerHTML = '<li>No new features to show right now!</li>'; } } else { console.warn("Element with ID 'whats-new-list' not found."); }
  if (tornTipElement) { const allTornTips = [ "Read the tutorial. Seriously. It's the only free advice you'll get that isn't a scam.", "Begging in global chat? Bold strategy. Let me know how it works out for your hospital bill.", "Enjoy newbie protection. It's the last time you'll feel truly safe. For about a week.", "Get a job. Even 'Grocer' sounds better than 'Permanently Unemployed Mugging Victim'.", "Education: it's like a gym for your brain, only the gains take months and no one can see them.", "Find a mentor, preferably one who hasn't been mugged in the last hour." ]; if (allTornTips.length > 0) { function getRandomTip(tipsArray) { const randomIndex = Math.floor(Math.random() * tipsArray.length); return tipsArray[randomIndex]; } tornTipElement.textContent = getRandomTip(allTornTips); } else { tornTipElement.textContent = 'Remember to always question your life choices in Torn City!'; } } else { console.warn("Element with ID 'dynamic-torn-tip' not found."); }
  
  // CORRECTED condition for attaching loginBtn event listener
  if (loginBtn && emailInput && passwordInput && loginError && rememberMeCheckbox && auth) {
    loginBtn.addEventListener('click', () => {
        loginError.textContent = '';
        const emailVal = emailInput.value.trim();
        const passwordVal = passwordInput.value;

        if (!emailVal || !passwordVal) {
            loginError.textContent = 'Please enter both email and password.';
            return;
        }
        
        const persistenceToSet = rememberMeCheckbox.checked ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION;
        auth.setPersistence(persistenceToSet)
            .then(() => auth.signInWithEmailAndPassword(emailVal, passwordVal))
            .then((userCredential) => {
                const user = userCredential.user;
                // Removed Firestore update for termsAgreed here
                if (rememberMeCheckbox.checked) {
                    localStorage.setItem('rememberedUserEmail', emailVal);
                } else {
                    localStorage.removeItem('rememberedUserEmail');
                }
                return Promise.resolve(); 
            })
            .then(() => {
                console.log("Login successful."); 
            })
            .catch(error => {
                loginError.textContent = `Login Error: ${error.message}`;
                console.error("Login error:", error.code, error.message);
            });
    });
  }

  // CORRECTED condition for attaching googleSignInButtonLogin event listener
  if (googleSignInButtonLogin && loginError && auth) { 
    googleSignInButtonLogin.addEventListener('click', () => {
        if (loginError) loginError.textContent = ''; 
        
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL) 
            .then(() => auth.signInWithPopup(provider))
            .then((result) => {
                const user = result.user;
                const isNewUser = result.additionalUserInfo.isNewUser;
                if (user && db) {
                    const userProfileRef = db.collection('userProfiles').doc(user.uid);
                    const profileData = {}; // Initialize empty, termsAgreed removed
                    if (isNewUser) {
                        console.log("New user signed in with Google. Creating initial profile.");
                        profileData.email = user.email;
                        profileData.uid = user.uid;
                        profileData.preferredName = user.displayName ? user.displayName.substring(0, 10) : 'User';
                        profileData.profileSetupComplete = false;
                        profileData.shareFactionStats = false; 
                        profileData.tcpRegisteredAt = firebase.firestore.FieldValue.serverTimestamp();
                    }
                    return userProfileRef.set(profileData, { merge: true });
                }
            })
            .then(() => {
                console.log("Google Sign-In successful."); 
            })
            .catch((error) => {
                console.error('Google Sign-In error:', error.code, error.message);
                if (loginError) loginError.textContent = `Google Sign-In Error: ${error.message}`;
            });
    });
  }

  if (showRegisterBtn && registerOverlay) { showRegisterBtn.addEventListener('click', () => { registerOverlay.style.display = 'flex'; if(loginError) loginError.textContent=''; if (forgotPasswordOverlay) forgotPasswordOverlay.style.display = 'none';}); }
  if (closeRegisterBtn && registerOverlay) { closeRegisterBtn.addEventListener('click', () => { registerOverlay.style.display = 'none'; if(registerError) registerError.textContent = ''; if (registerEmail) registerEmail.value = ''; if (registerPassword) registerPassword.value = ''; if (registerTermsAgreementCheckbox) registerTermsAgreementCheckbox.checked = false; }); }
  
  if (registerBtn && registerEmail && registerPassword && registerError && auth) {
    registerBtn.addEventListener('click', () => {
        registerError.textContent = '';
        const email = registerEmail.value.trim();
        const password = registerPassword.value;

        if (!email || !password) {
            registerError.textContent = 'Please enter both email and password.';
            return;
        }
        const passwordValid = password.length >= 6 && /[A-Z]/.test(password) && /[!@#$%^&*(),.?":{}|<>]/.test(password);
        if (!passwordValid) {
            registerError.textContent = 'Password: min 6 chars, 1 capital, 1 special.';
            return;
        }

        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                if (user) {
                    if (!db && firebase && typeof firebase.firestore === 'function') {
                        db = firebase.firestore();
                        console.log("Firestore db initialized inside registerBtn event for profile creation.");
                    }

                    if (db) {
                        const userProfileRef = db.collection('userProfiles').doc(user.uid);
                        userProfileRef.set({
                            email: user.email,
                            uid: user.uid,
                            profileSetupComplete: false,  
                            shareFactionStats: false, 
                            tcpRegisteredAt: firebase.firestore.FieldValue.serverTimestamp()
                        }, { merge: true })
                        .then(() => {
                            console.log(`Initial basic user profile created for ${user.uid}.`);
                        })
                        .catch((firestoreError) => {
                            console.error("Error creating initial user profile in Firestore:", firestoreError);
                        });
                    } else {
                        console.error("Firestore (db) is not available. Cannot save initial user profile.");
                    }

                    if (typeof user.sendEmailVerification === 'function') {
                        user.sendEmailVerification()
                            .then(() => {
                                console.log("Verification email sent.");
                                if (registerError) {
                                    registerError.style.color = '#4CAF50';
                                    registerError.textContent = 'Registration successful! Please check your email to verify your account and then log in.';
                                }
                            })
                            .catch((error) => {
                                console.error("Error sending verification email:", error);
                                if (registerError) registerError.textContent = `Registration succeeded, but failed to send verification email: ${error.message}`;
                            });
                    } else {
                        if (registerError) registerError.textContent = 'Registration successful, but user object not found for verification or function unavailable.';
                    }
                } else {
                     if (registerError) registerError.textContent = 'Registration successful, but user object is null.';
                }

                setTimeout(() => {
                    if (registerError) {
                        registerError.textContent = '';
                        registerError.style.color = '#f44336';  
                    }
                    if (registerOverlay) registerOverlay.style.display = 'none';
                    if (registerEmail) registerEmail.value = '';
                    if (registerPassword) registerPassword.value = '';
                    if (registerTermsAgreementCheckbox) registerTermsAgreementCheckbox.checked = false;  
                }, 6000);
            })
            .catch((error) => {
                if (registerError) registerError.textContent = `Registration Error: ${error.message}`;
                console.error("Registration error:", error.code, error.message);
            });
    });
  }
  if (showForgotPasswordBtn && forgotPasswordOverlay) { showForgotPasswordBtn.addEventListener('click', () => { forgotPasswordOverlay.style.display = 'flex'; if(loginError) loginError.textContent=''; if (registerOverlay) registerOverlay.style.display = 'none'; }); }
  if (closeForgotBtn && forgotPasswordOverlay) { closeForgotBtn.addEventListener('click', () => { forgotPasswordOverlay.style.display = 'none'; if(forgotError) forgotError.textContent = ''; if(forgotSuccess) forgotSuccess.textContent = ''; if (forgotEmailInput) forgotEmailInput.value = ''; }); }
  if (resetPasswordBtn && forgotEmailInput && forgotError && forgotSuccess && auth) { resetPasswordBtn.addEventListener('click', () => { if(forgotError) forgotError.textContent = ''; if(forgotSuccess) forgotSuccess.textContent = ''; const email = forgotEmailInput.value.trim(); if (!email) { if(forgotError) forgotError.textContent = 'Please enter your email address.'; return; } auth.sendPasswordResetEmail(email) .then(() => { if(forgotSuccess) forgotSuccess.textContent = 'Password reset email sent! Check your inbox.'; }) .catch((error) => { if(forgotError) forgotError.textContent = `Error: ${error.message}`; console.error("Password Reset error:", error.code, error.message); }); }); }

  const allHeaderDropdownsToManage = []; if (usefulLinksDropdown) allHeaderDropdownsToManage.push(usefulLinksDropdown); if (contactUsDropdown) allHeaderDropdownsToManage.push(contactUsDropdown); function closeAllManagedHeaderDropdowns(exceptThisOne) { allHeaderDropdownsToManage.forEach(dropdown => { if (dropdown !== exceptThisOne) { dropdown.style.display = 'none'; } }); } function setupManagedDropdown(button, dropdown) { if (button && dropdown) { button.addEventListener('click', function(event) { event.stopPropagation(); const isCurrentlyShown = dropdown.style.display === 'block'; closeAllManagedHeaderDropdowns(dropdown); dropdown.style.display = isCurrentlyShown ? 'none' : 'block'; }); } } setupManagedDropdown(usefulLinksBtn, usefulLinksDropdown); setupManagedDropdown(contactUsBtn, contactUsDropdown); window.addEventListener('click', function(event) { let clickedInsideADropdownTriggerOrContent = false; if (usefulLinksBtn && usefulLinksBtn.contains(event.target)) clickedInsideADropdownTriggerOrContent = true; if (contactUsBtn && contactUsBtn.contains(event.target)) clickedInsideADropdownTriggerOrContent = true; if (!clickedInsideADropdownTriggerOrContent) { allHeaderDropdownsToManage.forEach(dropdown => { if (dropdown.style.display === 'block' && dropdown.contains(event.target)) { clickedInsideADropdownTriggerOrContent = true; } }); } if (!clickedInsideADropdownTriggerOrContent) { closeAllManagedHeaderDropdowns(null); } });
  if (liveChatLinkContactUs) { liveChatLinkContactUs.addEventListener('click', function(event) { event.preventDefault(); console.log("Live Chat link clicked."); closeAllManagedHeaderDropdowns(null); }); }
  
  if (customAlertOverlay && customAlertCloseBtn) { customAlertCloseBtn.addEventListener('click', () => customAlertOverlay.style.display = 'none'); customAlertOverlay.addEventListener('click', (e) => { if (e.target === customAlertOverlay) customAlertOverlay.style.display = 'none'; }); }

  if (auth) {
    auth.onAuthStateChanged(function(user) {
      console.log("index.js: Auth state changed. User:", user ? user.uid : "None");
      const currentPagePath = window.location.pathname.toLowerCase();
      const isIndexPage = currentPagePath === '/' ||  
                            currentPagePath.endsWith('/index.html') ||  
                            (firebaseConfig.projectId && currentPagePath.endsWith('/' + firebaseConfig.projectId.toLowerCase() + '/')) ||
                            (firebaseConfig.projectId && currentPagePath.endsWith('/' + firebaseConfig.projectId.toLowerCase() + '/index.html'));

      const currentHeaderButtonsContainer = document.getElementById('headerButtonsContainer');
      const currentSignUpButtonHeader = document.getElementById('signUpButtonHeader');
      const currentTornCityHomepageLink = document.getElementById('tornCityHomepageLink');
      const currentLogoutButtonHeader = document.getElementById('logoutButtonHeader');
      const currentHomeButtonHeader = document.getElementById('homeButtonHeader');
      const currentHeaderEditProfileBtn = document.getElementById('headerEditProfileBtn');


      if (user) {  
        console.log("index.js: User is SIGNED IN.");
        if (isIndexPage) {
          console.log("index.js: User logged in, redirecting from index.html to pages/home.html");
          window.location.href = 'pages/home.html';  
          return;  
        }
        
        if (currentHeaderButtonsContainer) currentHeaderButtonsContainer.style.display = 'flex';
        if (currentSignUpButtonHeader) currentSignUpButtonHeader.style.display = 'none';  
        if (currentTornCityHomepageLink) currentTornCityHomepageLink.style.display = 'none';  
        if (currentLogoutButtonHeader) currentLogoutButtonHeader.style.display = 'inline-flex';
        if (currentHomeButtonHeader) currentHomeButtonHeader.style.display = 'none';  
        if (currentHeaderEditProfileBtn) currentHeaderEditProfileBtn.style.display = 'inline-flex';


      } else {  
        console.log("index.js: User is SIGNED OUT. Setting up header for login page.");
        if (currentHeaderButtonsContainer) currentHeaderButtonsContainer.style.display = 'none';
        
        if (currentTornCityHomepageLink) currentTornCityHomepageLink.style.display = 'inline-flex';  
        if (currentSignUpButtonHeader) currentSignUpButtonHeader.style.display = 'inline-flex';  
        
        if (currentLogoutButtonHeader) currentLogoutButtonHeader.style.display = 'none';
        if (currentHomeButtonHeader) currentHomeButtonHeader.style.display = 'none';  
        if (currentHeaderEditProfileBtn) currentHeaderEditProfileBtn.style.display = 'none';  
      }
    });
  } else {
    console.error("index.js: Firebase auth object not available for onAuthStateChanged. Header UI will be static.");
    const staticHeaderButtonsContainer = document.getElementById('headerButtonsContainer');
    const staticTornCityLink = document.getElementById('tornCityHomepageLink');
    const staticSignUpButton = document.getElementById('signUpButtonHeader');
    const staticHomeButtonHeader = document.getElementById('homeButtonHeader');

    if(staticHeaderButtonsContainer) staticHeaderButtonsContainer.style.display = 'none';
    if (staticTornCityLink) staticTornCityLink.style.display = 'inline-flex';
    if (staticSignUpButton) staticSignUpButton.style.display = 'inline-flex';
    if (staticHomeButtonHeader) staticHomeButtonHeader.style.display = 'none';
  }

  if (logoutButtonHeader && auth) {
    logoutButtonHeader.addEventListener('click', () => {
      auth.signOut()
        .then(() => {
            console.log('User signed out successfully from index.js.');
        })
        .catch((error) => {
            console.error('Sign out error:', error);
            if (loginError) loginError.textContent = `Logout Error: ${error.message}`;
        });
    });
  }
  console.log("index.js: DOMContentLoaded setup and event listeners complete.");
});