document.addEventListener('DOMContentLoaded', () => {
    // Get references to elements where stats and messages will be displayed
    const gymFeedback = document.getElementById('gymFeedback');
    const gymError = document.getElementById('gymError');
    const strengthStat = document.getElementById('strengthStat');
    const defenseStat = document.getElementById('defenseStat');
    const speedStat = document.getElementById('speedStat');
    const dexterityStat = document.getElementById('dexterityStat');
    const availableEnergy = document.getElementById('availableEnergy'); // This will now be updated by Torn API as well

    // Additional stat elements from your homepage template for Torn API data
    const nerveStat = document.getElementById('nerveStat');
    const happyStat = document.getElementById('happyStat');
    const drugCooldownStat = document.getElementById('drugCooldownStat');
    const boosterCooldownStat = document.getElementById('boosterCooldownStat');
    const travelStatus = document.getElementById('travelStatus');
    const hospitalStat = document.getElementById('hospitalStat');

    // Initialize Firebase Firestore
    const db = firebase.firestore();
    let currentUser = null; // Variable to hold the current logged-in user

    // Listen for Firebase authentication state changes
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            // User is logged in
            currentUser = user;
            console.log("User logged in:", currentUser.uid);
            loadPlayerStats(currentUser.uid); // Load player stats from Firestore
            fetchTornPlayerStats(currentUser.uid); // Also fetch Torn API stats
        } else {
            // User is logged out
            currentUser = null;
            console.log("No user logged in. Redirecting to login.");
            window.location.href = 'login.html'; // Adjust 'login.html' to your actual login page
        }
    });

    /**
     * Loads the player's battle stats (strength, defense, etc.) from Firestore.
     * Initializes default stats if no data exists for the user.
     * @param {string} userId The UID of the current authenticated user.
     */
    async function loadPlayerStats(userId) {
        try {
            gymFeedback.textContent = ''; // Clear any previous messages
            gymError.textContent = '';
            const docRef = db.collection('users').doc(userId);
            const docSnap = await docRef.get();

            if (docSnap.exists) {
                // Player data found, update display
                const playerData = docSnap.data();
                strengthStat.textContent = playerData.strength || 0;
                defenseStat.textContent = playerData.defense || 0;
                speedStat.textContent = playerData.speed || 0;
                dexterityStat.textContent = playerData.dexterity || 0;
                // Energy will be primarily updated by Torn API call below, but keep a fallback
                availableEnergy.textContent = `${playerData.energy || 100}/100`;
                console.log("Firebase player data loaded:", playerData);
            } else {
                // No player data found, initialize with default values
                console.log("No player data found for user in Firestore, initializing default stats.");
                await docRef.set({
                    strength: 0,
                    defense: 0,
                    speed: 0,
                    dexterity: 0,
                    energy: 100 // Starting energy for gym operations
                });
                // Update display with initial values
                strengthStat.textContent = 0;
                defenseStat.textContent = 0;
                speedStat.textContent = 0;
                dexterityStat.textContent = 0;
                availableEnergy.textContent = '100/100';
            }
        } catch (error) {
            console.error("Error loading player stats from Firestore:", error);
            gymError.textContent = "Error loading your saved stats. Please try again.";
        }
    }

    /**
     * Fetches real-time player stats from the Torn City API using the user's API key.
     * @param {string} userId The UID of the current authenticated user.
     */
    async function fetchTornPlayerStats(userId) {
        if (!userId) {
            console.warn("No user ID available to fetch Torn stats.");
            return;
        }

        try {
            const docRef = db.collection('users').doc(userId);
            const docSnap = await docRef.get();

            if (docSnap.exists) {
                const playerData = docSnap.data();
                const tornProfileId = playerData.profileId; // Assuming you save Torn Profile ID
                const tornApiKey = playerData.apiKey; // This is the Torn API Key

                if (tornApiKey) {
                    // Construct the API URL. Example: player basic stats and cooldowns
                    // Replace 'YOUR_TORN_ID' with the actual player's Torn ID
                    // And 'YOUR_API_KEY' with the fetched API key
                    // The 'selections' parameter specifies what data you want.
                    const apiUrl = `https://api.torn.com/user/${tornProfileId}?selections=basic,cooldowns,personalstats&key=${tornApiKey}`;

                    console.log("Fetching Torn API data with key...");
                    const response = await fetch(apiUrl);
                    const data = await response.json();

                    if (data.error) {
                        gymError.textContent = `Torn API Error: ${data.error.error || 'Unknown error'}. Check your API key and Torn ID in profile.`;
                        console.error("Torn API Error:", data.error);
                        // Optionally update local energy display based on the error or fallback
                        availableEnergy.textContent = 'N/A';
                        nerveStat.textContent = 'N/A';
                        happyStat.textContent = 'N/A';
                        drugCooldownStat.textContent = 'N/A';
                        boosterCooldownStat.textContent = 'N/A';
                        travelStatus.textContent = 'N/A';
                        hospitalStat.textContent = 'N/A';
                    } else {
                        // Update display with data from Torn API
                        // This assumes the Torn API returns 'energy', 'nerve', 'happy', etc.
                        availableEnergy.textContent = `${data.energy.current || '--'}/${data.energy.maximum || '--'}`;
                        nerveStat.textContent = `${data.nerve.current || '--'}/${data.nerve.maximum || '--'}`;
                        happyStat.textContent = `${data.happy.current || '--'}/${data.happy.maximum || '--'}`;

                        // Example for cooldowns and status (you'll need to parse these from Torn API response)
                        // This is a simplified example, actual Torn API cooldowns need more complex parsing (timestamps)
                        drugCooldownStat.textContent = data.cooldowns && data.cooldowns.drug || 'OK';
                        boosterCooldownStat.textContent = data.cooldowns && data.cooldowns.booster || 'OK';
                        travelStatus.textContent = data.travel.standing_in === 'Torn' ? 'No' : 'Yes'; // Simplified
                        hospitalStat.textContent = data.status.state === 'Hospital' ? `Yes (${data.status.until})` : 'No';

                        console.log("Torn API data received:", data);
                    }
                } else {
                    gymError.textContent = "Torn API Key not found in your profile. Update your profile settings.";
                    console.warn("Torn API Key not found for user:", userId);
                    // Clear or set placeholder for API-dependent stats
                    availableEnergy.textContent = 'N/A';
                    nerveStat.textContent = 'N/A';
                    happyStat.textContent = 'N/A';
                    drugCooldownStat.textContent = 'N/A';
                    boosterCooldownStat.textContent = 'N/A';
                    travelStatus.textContent = 'N/A';
                    hospitalStat.textContent = 'N/A';
                }
            } else {
                gymError.textContent = "Player profile data not found.";
                console.warn("Player profile data not found for user:", userId);
            }
        } catch (error) {
            console.error("Error fetching Torn API stats:", error);
            gymError.textContent = "Failed to fetch live game stats. Check your connection or API key.";
        }
    }


    /**
     * Updates player stats and energy in Firestore after a training session.
     * Uses a Firebase transaction to ensure data consistency.
     * @param {string} userId The UID of the current authenticated user.
     * @param {string} stat The name of the stat to boost (e.g., 'strength', 'rest', 'full-body').
     * @param {number} amount The amount of stat points to add or energy to restore.
     * @param {number} energyCost The energy required for this training session.
     */
    async function updatePlayerStats(userId, stat, amount, energyCost) {
        if (!currentUser) {
            gymError.textContent = "You must be logged in to train!";
            return;
        }

        try {
            gymFeedback.textContent = ''; // Clear previous messages
            gymError.textContent = '';
            const userRef = db.collection('users').doc(userId);

            // Use a transaction to safely update data
            await db.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists) {
                    throw new Error("Player data not found. Please log in again.");
                }

                let currentEnergy = userDoc.data().energy || 0; // Local energy for gym mechanic
                const maxEnergy = 100; // Define your game's max energy

                // Check for sufficient energy before training (from our internal energy pool)
                if (currentEnergy < energyCost) {
                    throw new Error("Not enough energy to train! You need " + energyCost + " energy.");
                }

                let newEnergy = currentEnergy - energyCost;
                // If it's a rest action, energy is added
                if (stat === 'rest') {
                    newEnergy = Math.min(maxEnergy, currentEnergy + amount); // 'amount' here is energy restored
                    transaction.update(userRef, { energy: newEnergy });
                    gymFeedback.textContent = `You rested and recovered ${amount} energy! Current energy: ${newEnergy}/${maxEnergy}.`;
                    availableEnergy.textContent = `${newEnergy}/${maxEnergy}`; // Update display
                } else if (stat === 'full-body') {
                    // Boost all stats for full body workout
                    const currentStrength = userDoc.data().strength || 0;
                    const currentDefense = userDoc.data().defense || 0;
                    const currentSpeed = userDoc.data().speed || 0;
                    const currentDexterity = userDoc.data().dexterity || 0;

                    transaction.update(userRef, {
                        strength: currentStrength + amount,
                        defense: currentDefense + amount,
                        speed: currentSpeed + amount,
                        dexterity: currentDexterity + amount,
                        energy: newEnergy // Deduct energy for full body
                    });
                    // Update display
                    strengthStat.textContent = currentStrength + amount;
                    defenseStat.textContent = currentDefense + amount;
                    speedStat.textContent = currentSpeed + amount;
                    dexterityStat.textContent = currentDexterity + amount;
                    availableEnergy.textContent = `${newEnergy}/${maxEnergy}`;
                    gymFeedback.textContent = `You completed a full body workout and gained ${amount} to all stats! Energy remaining: ${newEnergy}/${maxEnergy}.`;
                } else {
                    // Update a specific stat
                    const currentStatValue = userDoc.data()[stat] || 0;
                    const newStatValue = currentStatValue + amount;
                    transaction.update(userRef, {
                        [stat]: newStatValue,
                        energy: newEnergy // Deduct energy for specific training
                    });
                    // Update display
                    document.getElementById(`${stat}Stat`).textContent = newStatValue;
                    availableEnergy.textContent = `${newEnergy}/${maxEnergy}`;
                    gymFeedback.textContent = `You trained ${stat} and gained ${amount} points! Energy remaining: ${newEnergy}/${maxEnergy}.`;
                }
            });

        } catch (error) {
            console.error("Error updating player stats (gym mechanic):", error);
            gymError.textContent = error.message || "Failed to update stats. Please try again.";
            // Reload internal stats to reflect actual values if transaction failed or connection issue
            if (currentUser) {
                loadPlayerStats(currentUser.uid);
            }
        } finally {
            // Always try to refetch Torn API stats after an action, especially if energy changed
            if (currentUser) {
                fetchTornPlayerStats(currentUser.uid);
            }
        }
    }

    // Add event listeners to all "Train" buttons
    document.querySelectorAll('.train-btn').forEach(button => {
        button.addEventListener('click', () => {
            if (!currentUser) {
                gymError.textContent = "Please log in to use the gym!";
                return;
            }

            const card = button.closest('.gym-action-card');
            const trainingType = card.dataset.trainingType;
            const energyCost = parseInt(button.dataset.energyCost); // Get energy cost from button data

            let statToBoost = '';
            let boostAmount = 0; // The amount of stat points gained or energy restored

            // Determine the stat to boost and amount based on training type
            switch (trainingType) {
                case 'strength':
                    statToBoost = 'strength';
                    boostAmount = 2; // Example: gain 2 strength
                    break;
                case 'defense':
                    statToBoost = 'defense';
                    boostAmount = 2; // Example: gain 2 defense
                    break;
                case 'speed':
                    statToBoost = 'speed';
                    boostAmount = 2; // Example: gain 2 speed
                    break;
                case 'dexterity':
                    statToBoost = 'dexterity';
                    boostAmount = 2; // Example: gain 2 dexterity
                    break;
                case 'full-body':
                    statToBoost = 'full-body';
                    boostAmount = 1; // Example: gain 1 to all stats
                    break;
                case 'rest':
                    statToBoost = 'rest';
                    boostAmount = 20; // Example: restore 20 energy
                    break;
                default:
                    gymError.textContent = "Unknown training type selected.";
                    return;
            }

            // Call the function to update stats
            updatePlayerStats(currentUser.uid, statToBoost, boostAmount, energyCost);
        });
    });

    // Header dropdowns (copied from your template / globalheader.js assumed logic)
    const contactBtn = document.getElementById('headerContactUsBtn');
    const contactDropdown = document.getElementById('headerContactUsDropdown');
    contactDropdown.style.display = 'none';
    contactBtn.addEventListener('click', () => {
        const isVisible = contactDropdown.style.display === 'block';
        contactDropdown.style.display = isVisible ? 'none' : 'block';
    });
    window.addEventListener('click', (e) => {
        if (!contactBtn.contains(e.target) && !contactDropdown.contains(e.target)) {
            contactDropdown.style.display = 'none';
        }
    });

    const usefulLinksBtn = document.getElementById('usefulLinksBtn');
    const usefulLinksDropdown = document.getElementById('usefulLinksDropdown');
    usefulLinksDropdown.style.display = 'none';
    usefulLinksBtn.addEventListener('click', () => {
        const isVisible = usefulLinksDropdown.style.display === 'block';
        usefulLinksDropdown.style.display = isVisible ? 'none' : 'block';
    });
    window.addEventListener('click', (e) => {
        if (!usefulLinksBtn.contains(e.target) && !usefulLinksDropdown.contains(e.target) && e.target !== usefulLinksBtn) {
            usefulLinksDropdown.style.display = 'none';
        }
    });
});