document.addEventListener('DOMContentLoaded', function() {
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
  const registerOverlay = document.getElementById('registerOverlay');
  const registerEmail = document.getElementById('registerEmail');
  const registerPassword = document.getElementById('registerPassword');
  const registerBtn = document.getElementById('registerBtn');
  const registerError = document.getElementById('registerError');
  const closeRegisterBtn = document.getElementById('closeRegister');
  const registerTermsAgreementCheckbox = document.getElementById('registerTermsAgreementCheckbox');
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
  const headerEditProfileBtn = document.getElementById('headerEditProfileBtn');

  if (auth) {
    auth.getRedirectResult()
        .then((result) => {
            if (result.credential) {
                const user = result.user;
                const isNewUser = result.additionalUserInfo.isNewUser;
                if (user && db) {
                    const userProfileRef = db.collection('userProfiles').doc(user.uid);
                    if (isNewUser) {
                        const profileData = {
                            email: user.email,
                            uid: user.uid,
                            profileSetupComplete: false,
                            shareFactionStats: false,
                            preferredName: user.displayName ? user.displayName.substring(0, 10) : 'User',
                            tcpRegisteredAt: firebase.firestore.FieldValue.serverTimestamp()
                        };
                        return userProfileRef.set(profileData, { merge: true });
                    }
                }
            }
        })
        .catch((error) => {
            if (loginError) loginError.textContent = `Google Sign-In Error: ${error.message}`;
        });
  }

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
  if (headerEditProfileBtn) headerEditProfileBtn.style.display = 'none';

  function openAuthModal() {
    if (authModal) {
        authModal.classList.add('is-active');
    }
  }

  function closeAuthModal() {
    if (authModal) {
        authModal.classList.remove('is-active');
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
  
  if (whatsNewListElement) {
    const allUtilities = [
      { text: "Faction BattleStats Overview", href: "pages/war_page_hub.html?view=friendly-status", title: "Know Your Enemy (Or Friend?)", message: "Our Battle Stat Peeper: See their stats before you see the 'Attack Lost' screen. Knowledge is power... or a good reason to run." },
      { text: "Faction Activity Monitor", href: "pages/activitywatch.html", title: "Who's *Actually* Active?", message: "Is your faction a well-oiled war machine or just a collection of expert chat loggers? Our Activity Peeper tries to tell the difference." },
      { text: "Faction Members Overview", href: "pages/FactionPeeper.html", title: "The Faction Dossier", message: "Get the dirt! Level, age, 'vitamin' usage... Our Faction People Peeper gives you the lowdown. Don't mention where you heard it." },
      { text: "Event Calendar", href: "pages/eventcalendar.html", title: "Upcoming: Events Calendar!", message: "Never again miss... uh... whatever important Torn event is happening! Our new Events Calendar is coming soon to organize your chaos." },
      { text: "Merit/Honor Tracker", href: "pages/merits.html", title: "Merit Badge Collector", message: "Baffled by Honours? Mystified by Merits? Our guide will show you what you're missing out on (and how to feel slightly superior)." },
      { text: "Item Market Watcher", href: "pages/market-pulse.html", title: "The (Alleged) Item Watcher", message: "Keep an 'eye' on certain... 'things'. Our Item Watcher is here. Use responsibly. Or don't. We're not your lawyer." },
      { text: "Travel Helper", href: "pages/travel.html", title: "Globetrotter's Ledger", message: "Are your exotic trips actually funding your empire, or just your expensive postcard collection? Our Travel Profit Monitor spills the beans." },
      { text: "Fair Fight Targets", href: "pages/fairfight.html", title: "Find Your Next Target", message: "Looking for a fair fight? This tool helps you find targets at your level." },
      { text: "Character Progression", href: "pages/gymgain.html", title: "Track Your Gains", message: "Monitor your character's gym gains and progression over time." }
    ];

    if (allUtilities.length > 0) {
        function getRandomUtilities(utilitiesArray, count) {
            if (count > utilitiesArray.length) return [...utilitiesArray];
            const shuffled = [...utilitiesArray].sort(() => 0.5 - Math.random());
            return shuffled.slice(0, count);
        }
        const utilitiesToShow = getRandomUtilities(allUtilities, 2);
        whatsNewListElement.innerHTML = '';
        utilitiesToShow.forEach(utility => {
            const listItem = document.createElement('li');
            const linkItem = document.createElement('a');
            linkItem.href = utility.href;
            linkItem.classList.add('whats-new-item');
            linkItem.textContent = utility.text;
            linkItem.setAttribute('data-title', utility.title);
            linkItem.setAttribute('data-message', utility.message);
            linkItem.addEventListener('click', (e) => {
                e.preventDefault();
                if (customAlertTitleEl && customAlertMessageEl && customAlertOverlay) {
                    customAlertTitleEl.textContent = linkItem.dataset.title || 'Notification';
                    customAlertMessageEl.textContent = linkItem.dataset.message || 'No details provided.';
                    customAlertOverlay.style.display = 'flex';
                }
            });
            listItem.appendChild(linkItem);
            whatsNewListElement.appendChild(listItem);
        });
    } else {
      whatsNewListElement.innerHTML = '<li>No new features to show right now!</li>';
    }
  } else {
    console.warn("Element with ID 'whats-new-list' not found.");
  }
  if (tornTipElement) {
    const allTornTips = [
      "Read the tutorial. Seriously. It's the only free advice you'll get that isn't a scam.",
      "Begging in global chat? Bold strategy. Let me know how it works out for your hospital bill.",
      "Enjoy newbie protection. It's the last time you'll feel truly safe. For about a week.",
      "Get a job. Even 'Grocer' sounds better than 'Permanently Unemployed Mugging Victim'.",
      "Education: it's like a gym for your brain, only the gains take months and no one can see them.",
      "Find a mentor, preferably one who hasn't been mugged in the last hour.",
      "Always check your Bazaar prices; undercutting yourself is a common newbie mistake.",
      "Don't be afraid to ask questions in the 'Questions & Answers' forum. That's what it's for!",
      "Gym gains are permanent. Don't neglect your stats early on.",
      "Crime success rate is tied to Nerve. Train it carefully.",
      "Join an active faction. The bonuses and community are invaluable.",
      "Don't click suspicious links; phishing scams are rampant.",
      "Invest in a safe early. Property is muggable!",
      "Participate in faction wars for easy respect and loot.",
      "Save your energy for training. Attacks cost energy.",
      "Don't sell your unique items for cheap. Check the item market!",
      "Travel is profitable. Look up best items to smuggle for profit.",
      "Learn about the stock market. It's a long-term investment.",
      "Always fly with a full flight bag. Maximize profits!",
      "Don't auto-accept trades. Always verify the contents.",
      "Hospitals are your friend when you're beaten. Don't be afraid to go.",
      "Don't gamble more than you can afford to lose. Torn casino is ruthless.",
      "Figure out your playstyle: banker, fighter, trader, etc.",
      "Don't hoard energy cans early on; use them for quick stat gains.",
      "Merits are precious. Spend them wisely.",
      "Don't attack higher-level players unless you know what you're doing.",
      "Keep an eye on events and competitions for free rewards.",
      "Learn to chain. Faction chains bring great benefits.",
      "Be wary of 'free money' offers; they're almost always traps.",
      "Don't trust players who offer to 'double your money'.",
      "Always verify user IDs before sending money or items.",
      "Join official Torn City Discord for more community help.",
      "Crimes are a good way to make initial money and nerve.",
      "Don't forget to take your daily Happy Jump if you're training.",
      "Spend your Torn Dollars (TD) wisely. They're hard to get.",
      "Don't neglect your happiness. It boosts gym gains.",
      "The 'City' tab has useful events and missions.",
      "Don't open all your loot boxes at once. Save some for events.",
      "Don't spam global chat. It annoys people and can lead to mutes.",
      "Always use a VPN if you're worried about DDoSing, but most aren't needed.",
      "Trade with trusted traders. Check their forums and reputation.",
      "Don't beg for free stuff. Earn it.",
      "Check the 'New Player' forum section for useful guides.",
      "Don't attack faction members unless it's a faction war.",
      "Keep track of your drug cooldowns for optimal use.",
      "Don't forget to visit the Education center daily.",
      "Crime 2.0 is a complex system. Read guides to understand it.",
      "Don't waste energy on useless attacks. Be strategic.",
      "Don't be a loan shark unless you know the risks.",
      "Always verify before sending expensive items via trade.",
      "Don't rely solely on mugging. It's inconsistent.",
      "Happy jumps are key for serious stat training. Plan them out.",
      "Don't store too much cash on hand if you're not in a safe property.",
      "Faction armories can provide great gear. Contribute to your faction.",
      "Participate in mini-games for extra cash or items.",
      "Check your mail daily for faction messages or game updates.",
      "Don't ignore the 'missions' tab. They offer good rewards.",
      "The forums are a wealth of information. Use the search function.",
      "Don't click random links in messages. They could be keyloggers.",
      "Always log out when you're done playing, especially on shared computers.",
      "Don't share your account details with anyone, ever.",
      "Use official Torn City tools, not suspicious third-party ones.",
      "Don't trust anyone offering free 'scripts' or 'cheats'.",
      "Property upgrades are long-term investments. Prioritize safe/bank.",
      "Don't buy items from untrusted sources; they might be duped.",
      "Learn about the revive system. It's crucial for chaining.",
      "Don't forget to check the 'Events' calendar for special occasions.",
      "Consider starting a company for passive income, eventually.",
      "Don't neglect your daily free refill. It's valuable.",
      "The 'Hospital' is a safe zone. Go there if you're being repeatedly attacked.",
      "Don't engage in chat arguments; it rarely ends well.",
      "Always respect other players. Even in a crime game, good etiquette helps.",
      "Don't get involved in RMT (Real Money Trading). It's against the rules.",
      "Learn about 'honor bar' requirements. They give merits.",
      "Don't overextend your money on training if you can't afford it.",
      "The 'Staff' tab has information about game moderators.",
      "Don't forget to claim your daily login reward if there is one.",
      "Work towards 'Passive Perks' from education courses.",
      "Don't put all your eggs in one basket; diversify your income.",
      "Learn about faction specializations and how they benefit members.",
      "Don't just train one stat. A balanced approach is often better.",
      "The 'Item Market' changes rapidly. Keep an eye on trends.",
      "Don't fall for emotional blackmail in trades or interactions.",
      "Always read the fine print on contracts or deals.",
      "Don't store all your items in your inventory if you're active; use a vault.",
      "Consider using a trade chat extension for easier trading.",
      "Don't neglect your blood bags. They can save you from hosp.",
      "Always have some cash for emergencies, like revives or hospital bills.",
      "Don't get into debt you can't repay. Loan sharks are unforgiving.",
      "Learn about different weapon types and their effectiveness.",
      "Don't underestimate the power of a good armor set.",
      "Always carry a FHC (Faction Happy Chemical) if you're doing serious training.",
      "Don't leave your Torn tab open forever. Remember to log out sometimes.",
      "The 'Travel' system can be dangerous. Be prepared for muggings.",
      "Don't annoy staff members. They have the power to mute or ban.",
      "Always double-check recipient IDs before sending mail or money.",
      "Don't be afraid to take a break from the game if you're feeling burnt out.",
      "The game is a marathon, not a sprint. Patience is key.",
      "Don't forget to participate in the daily 'Wheel of Fortune' for a chance at prizes.",
      "Always aim to complete your daily 'Crimes' to maximize nerve gains.",
      "Don't neglect your 'Gym' training. Consistent effort pays off in the long run.",
      "Remember to check the 'Hospital' for new players to revive for cash or experience.",
      "Don't store valuable items in your inventort for long. Use a vault or faction armory.",
      "Always be aware of your surroundings, especially in the city. You can be mugged anytime.",
      "Don't trust strangers with your money or items, especially if they promise huge returns.",
      "Learn about 'drug merits' and how to acquire them for stat bonuses.",
      "Always carry enough medical items to heal yourself in an emergency.",
      "Don't forget to participate in 'Ranked Wars' with your faction for honor and loot.",
      "Always keep an eye on your energy and nerve bars. Don't let them cap unless you plan to.",
      "Don't invest heavily in a company without understanding its mechanics and market.",
      "Always consider what type of player you want to be: fighter, trader, banker, etc.",
      "Don't neglect your 'battle stats'. They are fundamental to survival and success.",
      "Always set a secure unique password for your Torn City account.",
      "Don't open all your boosters at once; save them for optimal use with happy jumps.",
      "Always use a secure internet connection when logging into your account.",
      "Don't get scammed! If it sounds too good to be true, it probably is.",
      "Remember to participate in 'Territory Wars' if your faction is involved.",
      "Don't forget about 'stock blocks' as a long-term investment strategy.",
      "Always be polite in public chats, even if others aren't.",
      "Don't let your 'nerve' bar stay full; use it for crimes.",
      "Remember to join a 'company' for daily income and perks.",
      "Don't forget to check the 'Achievements' section for potential merits.",
      "Always prioritize completing 'daily tasks' or 'challenges' for easy rewards.",
      "Don't hoard 'energy' or 'nerve' beyond what's useful; use it to progress.",
      "Remember to update your 'profile' regularly to attract trades or faction invites.",
      "Don't be afraid to 'mug' inactive players, but know the risks.",
      "Always be careful when initiating 'attacks'. Check your target's stats.",
      "Don't get involved in 'faction hoppers' scams. Stick with one faction.",
      "Remember to use your 'points' wisely in the Points Market.",
      "Don't neglect 'blood bags'. They are a cheap way to heal after fights.",
      "Always check the 'news' for game updates or important announcements.",
      "Don't just focus on money; happiness, stats, and respect are also key.",
      "Remember to verify the 'level' and 'stats' of anyone offering you a deal.",
      "Don't get greedy; taking small, consistent profits is better than large, risky ones.",
      "Always be aware of 'bounty' targets. They can be profitable.",
      "Don't forget to collect your 'hourly bank interest' if you have funds there.",
      "Remember to use 'energy drinks' for quick stat boosts during training.",
      "Don't let your 'hospital time' run out when you're busy; use a med-out if needed."
    ];
    if (allTornTips.length > 0) {
      function getRandomTip(tipsArray) {
        const randomIndex = Math.floor(Math.random() * tipsArray.length);
        return tipsArray[randomIndex];
      }
      tornTipElement.textContent = getRandomTip(allTornTips);
    } else {
      tornTipElement.textContent = 'Remember to always question your life choices in Torn City!';
    }
  } else {
    console.warn("Element with ID 'dynamic-torn-tip' not found.");
  }

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
                if (rememberMeCheckbox.checked) {
                    localStorage.setItem('rememberedUserEmail', emailVal);
                } else {
                    localStorage.removeItem('rememberedUserEmail');
                }
                return Promise.resolve();
            })
            .then(() => {})
            .catch(error => {
                loginError.textContent = `Login Error: ${error.message}`;
            });
    });
  }

  if (googleSignInButtonLogin && loginError && auth) {
    googleSignInButtonLogin.addEventListener('click', () => {
        if (loginError) loginError.textContent = '';
        const provider = new firebase.auth.GoogleAuthProvider();
        auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
            .then(() => {
                return auth.signInWithRedirect(provider);
            })
            .catch((error) => {
                if (loginError) loginError.textContent = `Google Sign-In Error: ${error.message}`;
            });
    });
  }

  if (showRegisterBtn && registerOverlay) { showRegisterBtn.addEventListener('click', () => { registerOverlay.style.display = 'flex'; if(loginError) loginError.textContent=''; if (forgotPasswordOverlay) forgotPasswordOverlay.style.display = 'none'; }); }
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
                    }
                    if (db) {
                        const userProfileRef = db.collection('userProfiles').doc(user.uid);
                        userProfileRef.set({
                            email: user.email,
                            uid: user.uid,
                            profileSetupComplete: false,
                            shareFactionStats: false,
                            tcpRegisteredAt: firebase.firestore.FieldValue.serverTimestamp()
                        }, { merge: true });
                    }
                    if (typeof user.sendEmailVerification === 'function') {
                        user.sendEmailVerification()
                            .then(() => {
                                if (registerError) {
                                    registerError.style.color = '#4CAF50';
                                    registerError.textContent = 'Registration successful! Please check your email to verify your account and then log in.';
                                }
                            })
                            .catch((error) => {
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
            });
    });
  }
  if (showForgotPasswordBtn && forgotPasswordOverlay) { showForgotPasswordBtn.addEventListener('click', () => { forgotPasswordOverlay.style.display = 'flex'; if(loginError) loginError.textContent=''; if (registerOverlay) registerOverlay.style.display = 'none'; }); }
  if (closeForgotBtn && forgotPasswordOverlay) { closeForgotBtn.addEventListener('click', () => { forgotPasswordOverlay.style.display = 'none'; if(forgotError) forgotError.textContent = ''; if(forgotSuccess) forgotSuccess.textContent = ''; if (forgotEmailInput) forgotEmailInput.value = ''; }); }
  if (resetPasswordBtn && forgotEmailInput && forgotError && forgotSuccess && auth) { resetPasswordBtn.addEventListener('click', () => { if(forgotError) forgotError.textContent = ''; if(forgotSuccess) forgotSuccess.textContent = ''; const email = forgotEmailInput.value.trim(); if (!email) { if(forgotError) forgotError.textContent = 'Please enter your email address.'; return; } auth.sendPasswordResetEmail(email) .then(() => { if(forgotSuccess) forgotSuccess.textContent = 'Password reset email sent! Check your inbox.'; }) .catch((error) => { if(forgotError) forgotError.textContent = `Error: ${error.message}`; }); }); }
  const allHeaderDropdownsToManage = []; if (usefulLinksDropdown) allHeaderDropdownsToManage.push(usefulLinksDropdown); if (contactUsDropdown) allHeaderDropdownsToManage.push(contactUsDropdown); function closeAllManagedHeaderDropdowns(exceptThisOne) { allHeaderDropdownsToManage.forEach(dropdown => { if (dropdown !== exceptThisOne) { dropdown.style.display = 'none'; } }); } function setupManagedDropdown(button, dropdown) { if (button && dropdown) { button.addEventListener('click', function(event) { event.stopPropagation(); const isCurrentlyShown = dropdown.style.display === 'block'; closeAllManagedHeaderDropdowns(dropdown); dropdown.style.display = isCurrentlyShown ? 'none' : 'block'; }); } } setupManagedDropdown(usefulLinksBtn, usefulLinksDropdown); setupManagedDropdown(contactUsBtn, contactUsDropdown); window.addEventListener('click', function(event) { let clickedInsideADropdownTriggerOrContent = false; if (usefulLinksBtn && usefulLinksBtn.contains(event.target)) clickedInsideADropdownTriggerOrContent = true; if (contactUsBtn && contactUsBtn.contains(event.target)) clickedInsideADropdownTriggerOrContent = true; if (!clickedInsideADropdownTriggerOrContent) { allHeaderDropdownsToManage.forEach(dropdown => { if (dropdown.style.display === 'block' && dropdown.contains(event.target)) { clickedInsideADropdownTriggerOrContent = true; } }); } if (!clickedInsideADropdownTriggerOrContent) { closeAllManagedHeaderDropdowns(null); } });
  if (liveChatLinkContactUs) { liveChatLinkContactUs.addEventListener('click', function(event) { event.preventDefault(); closeAllManagedHeaderDropdowns(null); }); }
  if (customAlertOverlay && customAlertCloseBtn) { customAlertCloseBtn.addEventListener('click', () => customAlertOverlay.style.display = 'none'); customAlertOverlay.addEventListener('click', (e) => { if (e.target === customAlertOverlay) customAlertOverlay.style.display = 'none'; }); }
  if (auth) {
    auth.onAuthStateChanged(function(user) {
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
        if (isIndexPage) {
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
        if (currentHeaderButtonsContainer) currentHeaderButtonsContainer.style.display = 'none';
        if (currentTornCityHomepageLink) currentTornCityHomepageLink.style.display = 'inline-flex';
        if (currentSignUpButtonHeader) currentSignUpButtonHeader.style.display = 'inline-flex';
        if (currentLogoutButtonHeader) currentLogoutButtonHeader.style.display = 'none';
        if (currentHomeButtonHeader) currentHomeButtonHeader.style.display = 'none';
        if (currentHeaderEditProfileBtn) currentHeaderEditProfileBtn.style.display = 'none';
      }
    });
  } else {
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
        .then(() => {})
        .catch((error) => {
          if (loginError) loginError.textContent = `Logout Error: ${error.message}`;
        });
    });
  }
});