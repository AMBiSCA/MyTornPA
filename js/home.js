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
    // Removed as per user request: const profileSetupTornStatsApiKeyInput = document.getElementById('profileSetupTornStatsApiKey');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
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

    // NEW DOM ELEMENTS FOR MEMBERSHIP AND DELETE ACCOUNT BUTTONS / MODALS
    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    const upgradeMembershipBtn = document.getElementById('upgradeMembershipBtn');
    const membershipOptionsModal = document.getElementById('membershipOptionsModal');
    const closeMembershipOptionsBtn = document.getElementById('closeMembershipOptionsBtn');
    const startFreeTrialBtn = document.getElementById('startFreeTrialBtn');
    const buySoloMembershipBtn = document.getElementById('buySoloMembershipBtn');
    const buyYearlyMembershipBtn = document.getElementById('buyYearlyMembershipBtn');
    const freeTrialConfirmationModal = document.getElementById('freeTrialConfirmationModal');
    const closeFreeTrialConfirmationBtn = document.getElementById('closeFreeTrialConfirmationBtn');
    const confirmFreeTrialYesBtn = document.getElementById('confirmFreeTrialYesBtn');
    const confirmFreeTrialNoBtn = document.getElementById('confirmFreeTrialNoBtn');
	const subscribePromptModal = document.getElementById('subscribePromptModal');
const closeSubscribePromptBtn = document.getElementById('closeSubscribePromptBtn');
const closeSubscribeModalBtn = document.getElementById('closeSubscribeModalBtn');
const goToProfileBtn = document.getElementById('goToProfileBtn');
const termsCheckbox = document.getElementById('termsAgreementProfileModal');
// ... other DOM elements
// Function to hide the subscribe prompt
const hideSubscribePrompt = () => {
    if (subscribePromptModal) {
        subscribePromptModal.style.display = 'none';
    }
};
 if(closeSubscribePromptBtn) closeSubscribePromptBtn.addEventListener('click', hideSubscribePrompt);
if(closeSubscribeModalBtn) closeSubscribeModalBtn.addEventListener('click', hideSubscribePrompt);

// Make the 'View Memberships' button open the profile modal
if(goToProfileBtn) {
    goToProfileBtn.addEventListener('click', () => {
        hideSubscribePrompt();
        membershipOptionsModal.style.display = 'flex';
    });
}

// --- Logic for the new Terms Prompt Modal ---
const termsPromptModal = document.getElementById('termsPromptModal');
const closeTermsPromptBtn = document.getElementById('closeTermsPromptBtn');
const closeTermsModalBtn = document.getElementById('closeTermsModalBtn');
const goToProfileFromTermsPromptBtn = document.getElementById('goToProfileFromTermsPromptBtn');

// Function to close the new modal
const hideTermsPrompt = () => {
    if (termsPromptModal) {
        termsPromptModal.style.display = 'none';
    }
};

// Attach listeners to the new modal's buttons
if(closeTermsPromptBtn) closeTermsPromptBtn.addEventListener('click', hideTermsPrompt);
if(closeTermsModalBtn) closeTermsModalBtn.addEventListener('click', hideTermsPrompt);
if(goToProfileFromTermsPromptBtn) {
    goToProfileFromTermsPromptBtn.addEventListener('click', () => {
        hideTermsPrompt();
        showProfileSetupModal(); // This opens the main profile settings
    });
}

// --- Dropdown Menu Logic ---
// This handles both 'Useful Links' and 'Contact' dropdowns

const allDropdowns = [
    { button: usefulLinksBtn, content: usefulLinksDropdown },
    { button: headerContactUsBtn, content: headerContactUsDropdown }
];

allDropdowns.forEach(dropdown => {
    if (dropdown.button && dropdown.content) {
        // When a dropdown button is clicked...
        dropdown.button.addEventListener('click', (event) => {
            event.stopPropagation(); // Prevents the window click listener from firing immediately

            const isAlreadyOpen = dropdown.content.style.display === 'block';

            // First, close all other dropdowns to avoid overlap
            allDropdowns.forEach(otherDropdown => {
                if (otherDropdown.content !== dropdown.content) {
                    otherDropdown.content.style.display = 'none';
                }
            });

            // Then, toggle the visibility of the one that was clicked
            dropdown.content.style.display = isAlreadyOpen ? 'none' : 'block';
        });
    }
});

// Add a single listener to the window to close any open dropdown when clicking elsewhere
window.addEventListener('click', (event) => {
    allDropdowns.forEach(dropdown => {
        // If a dropdown is open AND the click was not on its button...
        if (dropdown.content && dropdown.content.style.display === 'block' && !dropdown.button.contains(event.target)) {
            // ...hide it.
            dropdown.content.style.display = 'none';
        }
    });
});


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
    let membershipCountdownInterval = null;
    let currentUserProfile = null;

	
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
	
async function updateToolLinksAccess(profile) {
    const toolLinks = document.querySelectorAll('.tool-item-button');
    if (!profile) {
        toolLinks.forEach(link => {
            if (link.classList.contains('member-only')) {
                link.classList.add('disabled-link');
            }
        });
        return;
    }

    // --- MODIFIED MEMBERSHIP CHECK ---
    const hasPaidMembership = profile.membershipEndTime && profile.membershipEndTime > Date.now();
    const hasPersonalComp = profile.hasFreeAccess === true;
    const hasFactionComp = await isFactionComped(profile, db); // Check the leader's status

    const isMember = hasPaidMembership || hasPersonalComp || hasFactionComp;
    // --- END MODIFICATION ---

    const hasAgreedToTerms = profile.termsAgreed === true;

    toolLinks.forEach(link => {
        const isRestrictedByTerms = !hasAgreedToTerms;
        const isRestrictedByMembership = link.classList.contains('member-only') && !isMember;

        if (isRestrictedByTerms || isRestrictedByMembership) {
            link.classList.add('disabled-link');
        } else {
            link.classList.remove('disabled-link');
        }
    });
}

// Function to validate if a string contains only numerical digits
function isValidTornProfileId(idString) {
    // Return true if the string consists only of one or more digits
    return /^\d+$/.test(idString);
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
	
	
	
	function startMembershipCountdown(membershipInfo) {
    // Clear any existing timer to prevent multiple timers running
    if (membershipCountdownInterval) {
        clearInterval(membershipCountdownInterval);
    }

    const countdownContainer = document.getElementById('trialCountdownContainer');

    // If the container element is missing, or if no valid info was passed to the function, stop.
    if (!countdownContainer || !membershipInfo || !membershipInfo.membershipEndTime) {
        if(countdownContainer) countdownContainer.style.display = 'none'; // Ensure it's hidden
        return;
    }
    
    // Function to update the timer text, runs every second
    const updateTimer = () => {
        const remainingTime = membershipInfo.membershipEndTime - Date.now();

        // When the timer runs out...
        if (remainingTime <= 0) {
            clearInterval(membershipCountdownInterval); // Stop the timer
            countdownContainer.style.display = 'none'; // Hide the box
            return;
        }

        // --- NEW LOGIC STARTS HERE ---

        const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
        const label = membershipInfo.membershipType === 'trial' ? 'Free Trial' : 'Membership';
        let countdownText = '';

        if (remainingTime > thirtyDaysInMs) {
            // If MORE than 30 days are left, show only the total number of days
            const days = Math.ceil(remainingTime / (1000 * 60 * 60 * 24));
            countdownText = `${label} ends in: ${days} days`;

        } else {
            // If 30 days or LESS are left, show the detailed d h m countdown
            const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
            const hours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
            countdownText = `${label} ends in: ${days}d ${hours}h ${minutes}m`;
        }
        
        countdownContainer.textContent = countdownText;

        // --- NEW LOGIC ENDS HERE ---
        
        // Make sure the box is visible
        countdownContainer.style.display = 'block';
    };

    updateTimer(); // Run it once immediately
    membershipCountdownInterval = setInterval(updateTimer, 1000); // Then run it every second
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

   // Replace your entire fetchDataForPersonalStatsModal function with this updated code
// Replace your entire fetchDataForPersonalStatsModal function with this updated code
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

    const selections = "profile,personalstats,battlestats,workstats,basic,cooldowns,bars"; // Keep all selections to fetch data
    const apiUrl = `https://api.torn.com/user/?selections=${selections}&key=${apiKey}&comment=MyTornPA_Modal`;

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
        console.log(`[DEBUG] Final API URL for Personal Stats Modal: ${apiUrl}`);
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
            if (data.error.code === 2 || data.error.code === 10) {
                throw new Error(`The member's API key is invalid or lacks sufficient permissions. (Error: ${data.error.error})`);
            } else {
                throw new Error(`API Error: ${data.error.error || data.error.message || JSON.stringify(data.error)}`);
            }
        }

        if (!data || Object.keys(data).length === 0) {
            throw new Error("Failed to retrieve any meaningful data after API call.");
        }

        // --- Data to send to Netlify function (this remains comprehensive for saving) ---
        const userId = data.player_id;
        if (userId) {
            const userDataToSave = {
                name: data.name || null,
                tornProfileId: data.player_id || null,
                profile_image: data.profile_image || null,
                level: data.level || null,
                rank: data.rank || null,
                age: data.age || null,
                gender: data.gender || null,
                role: data.role || null,
                donator: data.donator || false,
                revivable: data.revivable || null,
                signup_date: data.signup || null,
                last_action_timestamp: data.last_action?.timestamp || null,
                faction_id: data.faction?.faction_id || null,
                faction_name: data.faction?.faction_name || null,
                faction_tag: data.faction?.faction_tag || null,
                faction_position: data.faction?.position || null,
                nerve: data.nerve || {},
                energy: data.energy || {},
                happy: data.happy || {},
                life: data.life || {},
                status: data.status || {},
                traveling: data.status?.state === 'Traveling' || false,
                hospitalized: data.status?.state === 'Hospital' || false,
                cooldowns: data.cooldowns || {},
                personalstats: data.personalstats || {},
                battlestats: data.battlestats || {},
                workstats: data.workstats || {},
                awards: data.awards || null,
                basicicons: data.basicicons || null,
                chain: data.chain || null,
                competition: data.competition || null,
                enemies: data.enemies || null,
                friends: data.friends || null,
                job: data.job || null,
                karma: data.karma || null,
                married: data.married || null,
                property: data.property || null,
                property_id: data.property_id || null,
                states: data.states || {},
                travel: data.travel || {},
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            };

            console.log(`[DEBUG] Prepared user data for Netlify Function:`, userDataToSave);
            console.log(`[DEBUG] userDataToSave.profile_image:`, userDataToSave.profile_image);

            try {
                // Call the Netlify Function to securely save ALL data to Firestore
                const netlifyFunctionResponse = await fetch('/.netlify/functions/update-user-faction', { // Changed to update-user-faction
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        uid: auth.currentUser.uid, // Firebase UID
                        tornPlayerId: String(userId), // Torn Player ID
                        userData: userDataToSave // Send the whole comprehensive object
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


        // --- HTML Content Generation (ONLY displaying requested fields in the modal) ---
        let htmlContent = '<h4>User Information</h4>';
		htmlContent += `
            <div class="member-detail-header">
                <div class="member-header-top-row center-content-flex">
                    ${data.profile_image ? `<img src="${data.profile_image}" alt="${data.name}" class="member-detail-profile-image-modal">` : ''}
                </div>
            </div>`;
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
            const apiKey = profileDataFromFirestore.tornApiKey;

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
                const hospitalUntil = statusObject.until || 0;
                const statusState = statusObject.state || "";
                const statusDesc = statusObject.description || "";
                if (statusState.toLowerCase() === "hospital" || statusDesc.toLowerCase().includes("in hospital")) {
                    inHospital = true;
                    if (hospitalUntil > nowSecondsApi) {
                        hospitalTimeRemaining = hospitalUntil - nowSecondsApi;
                    } else {
                        determinedHospitalStatusText = "Yes 😥";
                    }
                } else {
                    determinedHospitalStatusText = "No 😁";
                }
            } else if (data.status && typeof data.status === 'object' && data.status !== null) {
                const statusObject = data.status;
                const hospitalUntil = statusObject.until || 0;
                const statusState = statusObject.state || "";
                const statusDesc = statusObject.description || "";
                if (statusState.toLowerCase() === "hospital" || statusDesc.toLowerCase().includes("in hospital")) {
                    inHospital = true;
                    if (hospitalUntil > nowSecondsApi) {
                        hospitalTimeRemaining = hospitalUntil - nowSecondsApi;
                    } else {
                        determinedHospitalStatusText = "Yes 😥";
                    }
                } else {
                    determinedHospitalStatusText = "No 😁";
                }
            } else {
                console.warn("Hospital Check - Valid status object not found in data.profile.status or data.status.");
            }

            if (inHospital && hospitalTimeRemaining > 0) {
                updateStatDisplay("hospitalStat", null, null, true, hospitalTimeRemaining, "Yes");
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

            // --- *** THIS IS THE ONLY CORRECTED SECTION *** ---
            // It safely checks for the nested faction object and uses the correct property names.
            const factionData = data?.profile?.faction || data?.faction || null;
            
            if (factionData) {
   const updatePayload = {
    uid: user.uid, // User's Firebase UID
    faction_id: factionData.faction_id ?? null,
    faction_name: factionData.faction_name ?? null,
    position: factionData.position ?? null,
    // --- NEW: Add profile_image, Torn name, and Torn Player ID ---
    profile_image: data.profile_image || null,
    name: data.name || null,
    // THIS LINE IS NOW FIXED
    tornProfileId: String(data.player_id || '') 
    // --- END NEW ---
};
    console.log('Sending updated faction and profile data to Netlify function:', updatePayload);

    try {
        const factionUpdateResponse = await fetch('/.netlify/functions/update-user-faction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatePayload),
        });

        if (!factionUpdateResponse.ok) {
            const errorData = await factionUpdateResponse.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! Status: ${factionUpdateResponse.status}`);
        }
        const responseData = await factionUpdateResponse.json();
        console.log('Faction & Profile data update successful:', responseData.message);

    } catch (error) {
        console.error('Faction & Profile data update via Netlify function failed:', error.message);
    }
} else {
    // This 'else' block handles cases where no faction data is found, ensure it still clears errors
    console.warn("No faction data found in API response to send to Netlify function.");
    // Optionally, if you have a specific UI error display for this, update it here.
}

        } catch (error) {
            console.error("Error in fetchAllRequiredData:", error);
            clearQuickStats();
            if (quickStatsErrorEl) quickStatsErrorEl.textContent = `Error loading data: ${error.message}. Check API key or Torn API status.`;
        }
    }


    if (togglePersonalStatsCheckbox && personalStatsLabel) {
        togglePersonalStatsCheckbox.addEventListener('change', function() {
            if (this.checked) {
                const user = auth.currentUser;
                if (user && db) {
                    db.collection('userProfiles').doc(user.uid).get().then(doc => {
                        if (doc.exists && doc.data().tornApiKey) {
                            fetchDataForPersonalStatsModal(doc.data().tornApiKey, doc.data());
                        } else {
                           if (personalStatsModalBody) {
                                personalStatsModalBody.innerHTML = '<p style="color:orange;">API Key needed. Please set it in your profile.</p>';
                                personalStatsModal.style.display = 'flex';
                            }
                            this.checked = false;
                        }
                    }).catch(err => {
                        console.error("Error fetching profile for stats modal:", err);
                        this.checked = false;
                    });
                }
           } else {
                if (personalStatsModal) personalStatsModal.classList.remove('visible');
            }
        });
    }

   closePersonalStatsModalBtn.addEventListener('click', function() {
            console.log("Personal Stats Modal close button clicked.");
            personalStatsModal.classList.remove('visible');
            if (togglePersonalStatsCheckbox) togglePersonalStatsCheckbox.checked = false;
        });

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
	
	

    function showProfileSetupModal() { if (profileSetupModal) profileSetupModal.style.display = 'flex'; }
    function hideProfileSetupModal() { if (profileSetupModal) { profileSetupModal.style.display = 'none'; if (nameErrorEl) nameErrorEl.textContent = ''; if (profileSetupErrorEl) profileSetupErrorEl.textContent = ''; } }
    if (closeProfileModalBtn && profileSetupModal) closeProfileModalBtn.addEventListener('click', hideProfileSetupModal);

 // Locate this block in your home.js and replace it completely.
if (headerEditProfileBtn && auth && db) {
    headerEditProfileBtn.addEventListener('click', async function(event) {
        event.preventDefault();
        const user = auth.currentUser;
        if (!user || !db) return;

        // --- Prepare input fields ---
        if(preferredNameInput) preferredNameInput.value = '';
        if(profileSetupApiKeyInput) profileSetupApiKeyInput.value = '';
        if(termsCheckbox) termsCheckbox.checked = false;
        if(shareFactionStatsModalToggle) shareFactionStatsModalToggle.checked = false;

        // --- MODIFIED: We no longer make the Profile ID field read-only ---
        if (profileSetupProfileIdInput) {
            profileSetupProfileIdInput.value = ''; // Clear the value
            profileSetupProfileIdInput.removeAttribute('readonly'); // Ensure it is NOT readonly
            profileSetupProfileIdInput.type = 'text'; // Ensure it's a text field
        }
        // --- END MODIFICATION ---

        try {
            const userProfileRef = db.collection('userProfiles').doc(user.uid);
            const doc = await userProfileRef.get(); // Fetch the current user profile

            if (doc.exists) {
                const data = doc.data();
                
                // Populate fields with data from Firebase
                if(preferredNameInput) preferredNameInput.value = data.preferredName || '';
                if(profileSetupApiKeyInput) profileSetupApiKeyInput.value = data.tornApiKey || '';
                
                // --- MODIFIED: Populate TornProfileId but DO NOT make it readonly ---
                if(profileSetupProfileIdInput) {
                    profileSetupProfileIdInput.value = data.tornProfileId ? String(data.tornProfileId) : '';
                    // The line that set it to readonly here has been removed.
                }
                // --- END MODIFICATION ---

                if(termsCheckbox) termsCheckbox.checked = data.termsAgreed === true;
                if(shareFactionStatsModalToggle) shareFactionStatsModalToggle.checked = data.shareFactionStats === true;

            } else {
                // If no profile exists, set preferredName from Firebase displayName (if available)
                if(preferredNameInput && user.displayName) {
                    preferredNameInput.value = user.displayName.substring(0,10);
                }
                // We don't need to do anything to the profile ID input here, it's already cleared and writable.
            }
        } catch (err) {
            console.error("Error fetching profile for edit:", err);
            if(profileSetupErrorEl) profileSetupErrorEl.textContent = "Could not load profile.";
        }
        showProfileSetupModal(); // Show the modal after attempting to populate it
    });
}

  // Replace your old block with this NEW version
if (saveProfileBtn && auth && db) { // Ensure auth and db are available
    saveProfileBtn.addEventListener('click', async () => {
        // Clear previous errors
        profileSetupErrorDisplay.textContent = '';
        profileSetupErrorDisplay.style.display = 'none';

        const preferredName = preferredNameInput.value.trim();
        const tornProfileId = profileSetupProfileIdInput.value.trim();
        const tornApiKey = profileSetupApiKeyInput.value.trim();
        const termsAgreed = termsAgreementProfileModalCheckbox.checked;

        // --- ALL VALIDATION CHECKS GO HERE, IN ORDER ---

        // 1. Check if terms are agreed
        if (!termsAgreed) {
            profileSetupErrorDisplay.textContent = "You must agree to the Terms of Service and Privacy Policy.";
            profileSetupErrorDisplay.style.display = 'block';
            return;
        }

        // 2. Check for empty fields
        if (preferredName === '' || tornProfileId === '' || tornApiKey === '') {
            profileSetupErrorDisplay.textContent = "All fields are required.";
            profileSetupErrorDisplay.style.display = 'block';
            return;
        }

        // 3. NEW: Validate Torn Profile ID is purely numerical
        if (!isValidTornProfileId(tornProfileId)) {
            profileSetupErrorDisplay.textContent = "Torn Profile ID must be numerical values only (e.g., 239420).";
            profileSetupErrorDisplay.style.display = 'block';
            return; // Stop the function if validation fails
        }

        // --- END VALIDATION CHECKS ---

        // Disable button and show loading state
        saveProfileBtn.disabled = true;
        const originalButtonText = saveProfileBtn.innerHTML;
        saveProfileBtn.innerHTML = 'Verifying & Saving...';

        try {
            const user = auth.currentUser;
            if (!user) {
                profileSetupErrorDisplay.textContent = "User not authenticated. Please log in again.";
                profileSetupErrorDisplay.style.display = 'block';
                return;
            }

            // --- Fetch data from Torn API to verify key and get faction info ---
            const apiUrl = `https://api.torn.com/user/${tornProfileId}?selections=profile&key=${tornApiKey}&comment=MyTornPA_ProfileSetup`;
            const response = await fetch(apiUrl);
            const tornData = await response.json();

            if (!response.ok || tornData.error) {
                // Specific error handling for Torn API issues
                let errorMessage = tornData.error ? tornData.error.error : "Invalid API Key or Torn Profile ID. Please check them.";
                throw new Error(errorMessage);
            }

            // Reference to the user's profile document in Firestore
            const userProfileRef = db.collection('userProfiles').doc(user.uid);

            // Fetch current user's Firebase profile to retain existing data like tcpRegisteredAt, etc.
            // This is important to avoid overwriting fields not handled by this modal.
            const currentUserProfileSnap = await userProfileRef.get();
            const existingProfileData = currentUserProfileSnap.exists ? currentUserProfileSnap.data() : {};

            // Build the data object to save to Firestore
            const profileDataToSave = {
                ...existingProfileData, // Merge existing data to preserve fields not handled by the modal
                preferredName: preferredName,
                tornApiKey: tornApiKey,
                tornProfileId: String(tornProfileId), // Ensure it's saved as a string
                name: tornData.name || preferredName, // Use Torn name if available, else preferred name
                faction_id: tornData.faction?.faction_id || null,
                faction_name: tornData.faction?.faction_name || null,
                position: tornData.faction?.position || null,
                termsAgreed: termsAgreed,
                profileSetupComplete: true, // Mark profile setup as complete
                shareFactionStats: shareFactionStatsModalToggle ? shareFactionStatsModalToggle.checked : false,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Set tcpRegisteredAt only if it's a new profile setup
            if (!existingProfileData.tcpRegisteredAt) {
                profileDataToSave.tcpRegisteredAt = firebase.firestore.FieldValue.serverTimestamp();
            }

            // Save profile data to Firestore
            await userProfileRef.set(profileDataToSave); // No merge needed if we explicitly merged existing data above

            console.log("Profile data saved successfully!");
            // Display success message
            profileSetupErrorDisplay.textContent = "Profile saved successfully! Reloading page...";
            profileSetupErrorDisplay.style.color = 'lightgreen';
            profileSetupErrorDisplay.style.display = 'block';

            // Give a moment to read the success message, then close modal and reload
            setTimeout(() => {
                const profileSetupModal = document.getElementById('profileSetupModal');
                if (profileSetupModal) profileSetupModal.style.display = 'none';
                location.reload(); // Reload the page to apply new settings
            }, 1500);

        } catch (error) {
            console.error("Error saving profile:", error);
            profileSetupErrorDisplay.textContent = `Error saving profile: ${error.message}`;
            profileSetupErrorDisplay.style.color = 'red';
            profileSetupErrorDisplay.style.display = 'block';
        } finally {
            saveProfileBtn.disabled = false;
            saveProfileBtn.innerHTML = originalButtonText; // Restore original button text
        }
    });
}

const toolsSection = document.getElementById('toolsSection');
if (toolsSection) {
    toolsSection.addEventListener('click', async function(event) { // Note: now async
        const link = event.target.closest('.tool-item-button');
        if (!link) {
            return;
        }

        const profile = currentUserProfile;
        
        // --- MODIFIED MEMBERSHIP CHECK ---
        let isMember = false;
        if (profile) {
            const hasPaidMembership = profile.membershipEndTime && profile.membershipEndTime > Date.now();
            const hasPersonalComp = profile.hasFreeAccess === true;
            const hasFactionComp = await isFactionComped(profile, db); // Check the leader's status

            isMember = hasPaidMembership || hasPersonalComp || hasFactionComp;
        }
        // --- END MODIFICATION ---

        const hasAgreedToTerms = profile ? profile.termsAgreed === true : false;
        const needsMembership = link.classList.contains('member-only');

        if (!hasAgreedToTerms) {
            event.preventDefault();
            if (termsPromptModal) termsPromptModal.style.display = 'flex';
        } else if (needsMembership && !isMember) {
            event.preventDefault();
            const subscribeModal = document.getElementById('subscribePromptModal');
            if (subscribeModal) subscribeModal.style.display = 'flex';
        }
    });
}
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
						currentUserProfile = profile;
						console.log("1. Profile loaded on page start:", currentUserProfile); // <-- ADD THIS
						
						// ... inside onAuthStateChanged, after fetching the profile
profile = doc.exists ? doc.data() : null;

// START: Add this new block
// --- Check for an active membership and start the countdown ---
if (profile && profile.membershipEndTime) {
    const membershipInfo = {
        membershipType: profile.membershipType,
        membershipEndTime: profile.membershipEndTime
    };
    // If the membership is still active, start the timer
    if (membershipInfo.membershipEndTime > Date.now()) {
        startMembershipCountdown(membershipInfo);
    }
}



// --- Activate the gatekeeper for member-only links ---
updateToolLinksAccess(profile);; //

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
            }).catch(error => {
                console.error('Sign out error:', error);
            });
        });
    }

    document.querySelectorAll('.tool-category-toggle').forEach(toggle => {
        toggle.addEventListener('click', function() { this.classList.toggle('active');
        const content = this.nextElementSibling; if (content) content.classList.toggle('open'); });
    });

    // --- NEW: Membership Modals JavaScript ---

    // Function to hide any open modal overlays
    function hideAllModalOverlays() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    // Locate this block in your home.js
if (upgradeMembershipBtn) {
    upgradeMembershipBtn.addEventListener('click', () => {
        // Find the entire free trial card element by its unique class
        const freeTrialCard = document.querySelector('.card-free-trial');
        
        // Check the globally available profile for the flag
        if (currentUserProfile && currentUserProfile.hasUsedTrial === true) {
            // If trial has been used, HIDE the entire card
            if (freeTrialCard) {
                freeTrialCard.classList.add('hidden-by-js'); // Add a class to hide it
            }
        } else {
            // Otherwise, make sure the card is VISIBLE for new users (if it was hidden before)
            if (freeTrialCard) {
                freeTrialCard.classList.remove('hidden-by-js'); // Remove class to show it
            }
        }

        // Now, hide the profile modal and show the membership options
        hideProfileSetupModal();
        if (membershipOptionsModal) {
            membershipOptionsModal.style.display = 'flex';
        }
    });
}
    // 2. Close button for Membership Options Modal
    if (closeMembershipOptionsBtn && membershipOptionsModal) {
        closeMembershipOptionsBtn.addEventListener('click', () => {
            console.log("Close Membership Options button clicked.");
            membershipOptionsModal.style.display = 'none';
        });
    }

    // 3. Click outside to close Membership Options Modal
    if (membershipOptionsModal) {
        membershipOptionsModal.addEventListener('click', (event) => {
            if (event.target === membershipOptionsModal) {
                console.log("Clicked outside Membership Options Modal. Closing.");
                membershipOptionsModal.style.display = 'none';
            }
        });
    }

    // 4. Start Free Trial Button opens Free Trial Confirmation Modal
    if (startFreeTrialBtn && freeTrialConfirmationModal && membershipOptionsModal) {
        startFreeTrialBtn.addEventListener('click', () => {
            console.log("Start Free Trial button clicked. Opening Free Trial Confirmation Modal.");
            membershipOptionsModal.style.display = 'none'; // Close the options modal first
            freeTrialConfirmationModal.style.display = 'flex';
        });
    }

    // 5. Close button for Free Trial Confirmation Modal
    if (closeFreeTrialConfirmationBtn && freeTrialConfirmationModal) {
        closeFreeTrialConfirmationBtn.addEventListener('click', () => {
            console.log("Close Free Trial Confirmation button clicked.");
            freeTrialConfirmationModal.style.display = 'none';
        });
    }

    // 6. Click outside to close Free Trial Confirmation Modal
    if (freeTrialConfirmationModal) {
        freeTrialConfirmationModal.addEventListener('click', (event) => {
            if (event.target === freeTrialConfirmationModal) {
                console.log("Clicked outside Free Trial Confirmation Modal. Closing.");
                freeTrialConfirmationModal.style.display = 'none';
            }
        });
    }

    // 7. 'Yes' button in Free Trial Confirmation Modal
if (confirmFreeTrialYesBtn && freeTrialConfirmationModal) {
    confirmFreeTrialYesBtn.addEventListener('click', async () => {
        console.log("Confirm Free Trial 'Yes' clicked. Writing to Firebase...");
        
        const user = auth.currentUser;
        if (!user) {
            console.error("User not logged in. Cannot start trial.");
            // Optionally show an error message to the user here
            return;
        }

        // Set the end time to 7 days from now
        const trialEndTime = Date.now() + 7 * 24 * 60 * 60 * 1000;

        const membershipInfo = {
            membershipType: 'trial',
            membershipEndTime: trialEndTime,
            hasUsedTrial: true
        };

        try {
            // Get a reference to the user's profile document
            const userProfileRef = db.collection('userProfiles').doc(user.uid);
            
            // Update the document with the new membership fields
            await userProfileRef.update(membershipInfo);
            
            console.log("Successfully saved trial info to Firebase.");

            // Hide the confirmation modal
            freeTrialConfirmationModal.style.display = 'none';

            // Start the countdown timer with the new info
            startMembershipCountdown(membershipInfo);
			
			// >>> ADD THIS LINE TO REFRESH THE PAGE <<<
            location.reload(); 

        } catch (error) {
            console.error("Error saving trial info to Firebase:", error);
            // Optionally show an error message to the user here
        }
    });
}
    // 8. 'No' button in Free Trial Confirmation Modal
    if (confirmFreeTrialNoBtn && freeTrialConfirmationModal) {
        confirmFreeTrialNoBtn.addEventListener('click', () => {
            console.log("Confirm Free Trial 'No' clicked. Closing modal.");
            freeTrialConfirmationModal.style.display = 'none';
            // Optionally, you could re-open the membership options modal here if desired:
            // membershipOptionsModal.style.display = 'flex';
        });
    }

    // 9. Solo Membership Button (from options modal)
    if (buySoloMembershipBtn && membershipOptionsModal) {
        buySoloMembershipBtn.addEventListener('click', () => {
            console.log("Solo Membership button clicked.");
            // --- Placeholder for Solo Membership Payment/Enrollment Logic ---
            alert("Proceeding to Solo Membership (15 Xanax/Month) payment. (Functionality to be implemented later)");
            // After initiating payment, close the modal
            membershipOptionsModal.style.display = 'none';
        });
    }

    // 10. Yearly Membership Button (from options modal)
    if (buyYearlyMembershipBtn && membershipOptionsModal) {
        buyYearlyMembershipBtn.addEventListener('click', () => {
            console.log("Yearly Membership button clicked.");
            // --- Placeholder for Yearly Membership Payment/Enrollment Logic ---
            alert("Proceeding to Yearly Membership (150 Xanax/Year) payment. (Functionality to be implemented later)");
            // After initiating payment, close the modal
            membershipOptionsModal.style.display = 'none';
        });
    }

    // 11. Delete Account Button (from profile setup modal)
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', () => {
            console.log("Delete Account button clicked.");
            // --- Placeholder for Delete Account Confirmation/Logic ---
            alert("Delete Account functionality will be implemented here. (Requires confirmation step!)");
            // You'll likely want another confirmation modal here before proceeding.
            // For now, it just alerts.
        });
    }
	
	
	
	
// --- NEW: Logic for the "Copy" buttons in the Membership Modal ---
    document.addEventListener('click', function(event) {

        // Check if the clicked element is one of our copy buttons
        if (event.target.matches('.copy-btn')) {
            
            // Find the ID of the text we need to copy from the button's 'data-copy-target' attribute
            const targetId = event.target.dataset.copyTarget;
            const targetElement = document.getElementById(targetId);

            if (targetElement) {
                // Get the text content (e.g., "AMBiSCA [2662550]")
                const textToCopy = targetElement.textContent;

                // Use the modern navigator.clipboard API to copy the text
                navigator.clipboard.writeText(textToCopy.trim()).then(() => {
                    
                    // --- Provide feedback to the user ---
                    const originalText = event.target.textContent; // "Copy"
                    event.target.textContent = 'Copied!'; // Change button text
                    
                    // Change it back to "Copy" after 2 seconds
                    setTimeout(() => {
                        event.target.textContent = originalText;
                    }, 2000);

                }).catch(err => {
                    console.error('Failed to copy text: ', err);
                });
            }
        }
    });
	
	
  

    console.log("home.js: All initial event listeners and setup attempts complete.");
}); // End of DOMContentLoaded