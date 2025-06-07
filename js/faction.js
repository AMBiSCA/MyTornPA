// This script is for faction.html (MyTornPA - Factions)

document.addEventListener('DOMContentLoaded', function() {
    console.log("faction.js: DOMContentLoaded event fired.");

    // Check if Firebase is initialized (similar to home.js)
    const db = (typeof firebase !== 'undefined' && typeof firebase.firestore === 'function') ? firebase.firestore() : null;
    if (!db) {
        console.error("faction.js: Firestore (db) is not initialized.");
    }

    // --- START: Elements from home.html header/modal that might be needed if copied ---
    // If you create a global-ui-handler.js, this section might move there or be reduced.
    const usefulLinksBtn = document.getElementById('usefulLinksBtn');
    const usefulLinksDropdown = document.getElementById('usefulLinksDropdown');
    const headerEditProfileBtn = document.getElementById('headerEditProfileBtn');
    const profileSetupModal = document.getElementById('profileSetupModal');
    const closeProfileModalBtn = document.getElementById('closeProfileModalBtn');
    const skipProfileSetupBtn = document.getElementById('skipProfileSetupBtn');
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const preferredNameInput = document.getElementById('preferredName');
    const profileSetupApiKeyInput = document.getElementById('profileSetupApiKey');
    const profileSetupProfileIdInput = document.getElementById('profileSetupProfileId');
    const shareFactionStatsModalToggle = document.getElementById('shareFactionStatsModalToggle');
    const nameErrorEl = document.getElementById('nameError');
    const profileSetupErrorEl = document.getElementById('profileSetupError');
    const logoutButtonHeader = document.getElementById('logoutButtonHeader');
    const headerButtonsContainer = document.getElementById('headerButtonsContainer');
    const signUpButtonHeader = document.getElementById('signUpButtonHeader');
    const factionsButtonHeader = document.getElementById('factionsButtonHeader');
    const homeButtonHeader = document.getElementById('homeButtonHeader');

    if (window.location.pathname.includes('faction.html')) {
        if (factionsButtonHeader) factionsButtonHeader.style.display = 'none'; // Hide factions button if on factions page
        if (homeButtonHeader) homeButtonHeader.style.display = 'inline-flex'; // Ensure home button is visible
    }


    // Simple toggle for useful links dropdown (can be moved to global-ui.js)
    if (usefulLinksBtn && usefulLinksDropdown) {
        usefulLinksBtn.addEventListener('click', function(event) {
            event.stopPropagation();
            usefulLinksDropdown.classList.toggle('show');
        });
    }
    window.addEventListener('click', function(event) {
        if (usefulLinksDropdown && usefulLinksDropdown.classList.contains('show')) {
            if (!usefulLinksBtn.contains(event.target) && !usefulLinksDropdown.contains(event.target)) {
                usefulLinksDropdown.classList.remove('show');
            }
        }
    });

    function showProfileSetupModal() {
        if (profileSetupModal) profileSetupModal.style.display = 'flex';
    }
    function hideProfileSetupModal() {
        if (profileSetupModal) profileSetupModal.style.display = 'none';
        if (nameErrorEl) nameErrorEl.textContent = '';
        if (profileSetupErrorEl) profileSetupErrorEl.textContent = '';
    }

    if (headerEditProfileBtn && typeof auth !== 'undefined' && auth && db) {
        headerEditProfileBtn.addEventListener('click', async function(event) {
            event.preventDefault();
            const user = auth.currentUser;
            if (!user) { console.error("User not authenticated for profile edit."); return; }
            console.log("faction.js: Header Edit Profile button clicked.");
            try {
                const doc = await db.collection('userProfiles').doc(user.uid).get();
                if (doc.exists) {
                    const data = doc.data();
                    if(preferredNameInput) preferredNameInput.value = data.preferredName || '';
                    if(profileSetupApiKeyInput) profileSetupApiKeyInput.value = data.tornApiKey || '';
                    if(profileSetupProfileIdInput) profileSetupProfileIdInput.value = data.tornProfileId || '';
                    if(shareFactionStatsModalToggle) shareFactionStatsModalToggle.checked = data.shareFactionStats === true;
                } else { /* Populate with defaults or leave blank */ }
                showProfileSetupModal();
            } catch (err) {
                console.error("Error fetching profile for edit (faction page):", err);
                if(profileSetupErrorEl) profileSetupErrorEl.textContent = "Could not load profile data.";
                showProfileSetupModal(); // Show modal even if data load fails to show error
            }
        });
    }

    if (closeProfileModalBtn) closeProfileModalBtn.addEventListener('click', hideProfileSetupModal);
    if (skipProfileSetupBtn) skipProfileSetupBtn.addEventListener('click', hideProfileSetupModal);
    
    // Basic Save Profile Logic (consider moving to global-ui.js or enhancing per page)
    if (saveProfileBtn && typeof auth !== 'undefined' && auth && db) {
        saveProfileBtn.addEventListener('click', async () => {
            // Basic validation and save logic - adapt from home.js or make global
            const user = auth.currentUser;
            if (!user) { profileSetupErrorEl.textContent = 'You must be logged in.'; return; }
            if (!preferredNameInput.value.trim()) { nameErrorEl.textContent = 'Preferred Name is required.'; return; }

            const profileDataToSave = {
                preferredName: preferredNameInput.value.trim(),
                tornApiKey: profileSetupApiKeyInput.value.trim() || null,
                tornProfileId: profileSetupProfileIdInput.value.trim() || null,
                shareFactionStats: shareFactionStatsModalToggle ? shareFactionStatsModalToggle.checked : false,
                profileSetupComplete: true, // Assuming saving means setup is complete
                lastLoginTimestamp: firebase.firestore.FieldValue.serverTimestamp() // Update last login
            };
            try {
                await db.collection('userProfiles').doc(user.uid).set(profileDataToSave, { merge: true });
                console.log("Profile saved from faction.js");
                if (user.displayName !== profileDataToSave.preferredName) {
                     await user.updateProfile({ displayName: profileDataToSave.preferredName });
                }
                hideProfileSetupModal();
                // Optionally, refresh parts of the page or give success message
            } catch (error) {
                console.error("Error saving profile from faction.js: ", error);
                profileSetupErrorEl.textContent = "Error saving profile. Try again.";
            }
        });
    }

    // Auth state change listener (copied from home.js, adapt as needed for faction page)
    if (typeof auth !== 'undefined' && auth) {
        auth.onAuthStateChanged(function(user) {
            console.log('FACTION.JS - Auth State Changed:', user ? user.uid : 'No user');
            if (user) {
                // User is signed in.
                if (headerButtonsContainer) headerButtonsContainer.style.display = 'flex';
                if (signUpButtonHeader) signUpButtonHeader.style.display = 'none';
                if (logoutButtonHeader) logoutButtonHeader.style.display = 'inline-flex';

                // You might want to fetch user-specific faction data or check profile status here
                // For example, enable faction search only if profile API key is present

            } else {
                // User is signed out.
                console.log('FACTION.JS - User is NOT signed in. Optional: Redirect or disable features.');
                if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
                if (signUpButtonHeader) signUpButtonHeader.style.display = 'flex'; // Or handle as per your design
                if (logoutButtonHeader) logoutButtonHeader.style.display = 'none';
                // window.location.href = 'index.html'; // Or login.html
            }
        });
    } else {
        console.error("FACTION.JS - Firebase auth object not available.");
    }
    
    if (logoutButtonHeader && typeof auth !== 'undefined' && auth) {
        logoutButtonHeader.onclick = function() {
            auth.signOut().then(() => {
                console.log('User signed out from faction.js.');
                // window.location.href = 'index.html'; // Redirect to home or login
            }).catch((error) => {
                console.error('Sign out error from faction.js:', error);
            });
        };
    }
    // --- END: Elements from home.html header/modal ---


    // --- START: Faction Page Specific JavaScript ---
    const factionIdInput = document.getElementById('factionIdInput');
    const fetchFactionDataBtn = document.getElementById('fetchFactionDataBtn');
    const factionDataDisplay = document.getElementById('factionDataDisplay');

    if (fetchFactionDataBtn) {
        fetchFactionDataBtn.addEventListener('click', async () => {
            const factionId = factionIdInput.value.trim();
            if (!factionId) {
                factionDataDisplay.innerHTML = '<p class="error-message">Please enter a Faction ID or Tag.</p>';
                return;
            }

            factionDataDisplay.innerHTML = '<p class="loading-message">Fetching faction data...</p>';
            
            // This requires an API key, typically the user's.
            // You'll need to get the current user's API key from their profile in Firestore.
            const user = auth.currentUser;
            if (!user) {
                factionDataDisplay.innerHTML = '<p class="error-message">You must be logged in to fetch faction data.</p>';
                return;
            }

            try {
                const userProfileDoc = await db.collection('userProfiles').doc(user.uid).get();
                if (!userProfileDoc.exists || !userProfileDoc.data().tornApiKey) {
                    factionDataDisplay.innerHTML = '<p class="error-message">Your Torn API key is not set up in your profile. Please edit your profile.</p>';
                    return;
                }
                const apiKey = userProfileDoc.data().tornApiKey;

                // Example: Fetching basic faction data (you'll need to adjust selections)
                const apiUrl = `https://api.torn.com/faction/${factionId}?selections=basic,members&key=${apiKey}`;
                console.log("Fetching faction data from:", apiUrl.replace(apiKey, "KEY_HIDDEN"));

                const response = await fetch(apiUrl);
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({ error: { error: "Unknown API error" } }));
                    throw new Error(`API Error ${response.status}: ${errorData?.error?.error || response.statusText}`);
                }
                const data = await response.json();

                if (data.error) {
                    throw new Error(`API Error: ${data.error.error || data.error.message}`);
                }

                // Process and display faction data
                let htmlOutput = `<h3>${data.name} [${data.ID}] - Tag: ${data.tag}</h3>`;
                htmlOutput += `<p>Respect: ${data.respect.toLocaleString()}</p>`;
                htmlOutput += `<p>Age: ${data.age} days</p>`;
                htmlOutput += `<p>Capacity: ${data.capacity}</p>`;
                htmlOutput += `<p>Best Chain: ${data.best_chain}</p>`;
                
                if (data.members) {
                    htmlOutput += `<h4>Members (${Object.keys(data.members).length}):</h4><ul>`;
                    for (const memberId in data.members) {
                        const member = data.members[memberId];
                        htmlOutput += `<li>${member.name} [${memberId}] - ${member.status.description}</li>`;
                    }
                    htmlOutput += `</ul>`;
                }
                factionDataDisplay.innerHTML = htmlOutput;

            } catch (error) {
                console.error("Error fetching faction data:", error);
                factionDataDisplay.innerHTML = `<p class="error-message">Error loading faction data: ${error.message}. Check Faction ID and your API Key permissions.</p>`;
            }
        });
    }
    // --- END: Faction Page Specific JavaScript ---

});