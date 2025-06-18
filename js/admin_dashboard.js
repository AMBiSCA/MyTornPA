// mysite/js/admin_dashboard.js - FINAL PRODUCTION VERSION + BATTLESTATS

document.addEventListener('DOMContentLoaded', () => {
    // --- UI Elements ---
    const fetchFactionDataBtn = document.getElementById('fetchFactionDataBtn');
    const refreshDatabaseFactionsBtn = document.getElementById('refreshDatabaseFactionsBtn'); // Assumed to exist, handled if not
    const factionIdInput = document.getElementById('factionIdInput');
    const factionIdError = document.getElementById('factionIdError');
    const updatesBox = document.getElementById('updatesBox');
    const adminToolContainer = document.querySelector('.admin-tool-container');

    // --- Helper for updates box ---
    function updateStatus(message, isError = false) {
        const timestamp = new Date().toLocaleTimeString();
        updatesBox.innerHTML += `<p style="color:${isError ? '#ff4d4d' : '#eee'};"><strong>[${timestamp}]</strong> ${message}</p>`;
        updatesBox.scrollTop = updatesBox.scrollHeight;
    }

    function clearStatus() {
        updatesBox.innerHTML = '';
    }
    
    // --- Helper for displaying prominent errors ---
    function showMainError(message) {
        const existingError = document.querySelector('.main-input-error-feedback');
        if (existingError) existingError.remove();
        if (!message) return;

        const errorDiv = document.createElement('div');
        errorDiv.textContent = message;
        errorDiv.className = 'main-input-error-feedback';
        errorDiv.style.textAlign = 'center';
        errorDiv.style.padding = '10px';
        errorDiv.style.backgroundColor = 'rgba(255,0,0,0.1)';
        errorDiv.style.border = '1px solid red';
        errorDiv.style.borderRadius = '5px';
        errorDiv.style.marginTop = '15px';

        if (adminToolContainer) {
            adminToolContainer.appendChild(errorDiv);
        }
        setTimeout(() => { if (errorDiv.parentElement) errorDiv.remove(); }, 7000);
    }

    // --- Page Protection & Auth Handling ---
    let tornApiKey = null;
    if (typeof firebase !== 'undefined' && typeof firebase.auth !== 'undefined') {
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                console.log("Admin is logged in:", user.email);
                // Fetch the admin's API key from their profile to use for all requests
                try {
                    const db = firebase.firestore();
                    const userDocRef = db.collection('userProfiles').doc(user.uid);
                    const userDoc = await userDocRef.get();
                    if (userDoc.exists && userDoc.data().tornApiKey) {
                        tornApiKey = userDoc.data().tornApiKey;
                        updateStatus("Authentication successful. Ready to fetch data.", false);
                    } else {
                        showMainError("Admin user profile not found or Torn API Key is missing.");
                        updateStatus("Could not find your API key in your profile.", true);
                    }
                } catch (error) {
                     showMainError("Error fetching your user profile.");
                     console.error("Error fetching admin profile:", error);
                }
            } else {
                console.log("No admin logged in. Redirecting...");
                window.location.href = '/admin_login.html';
            }
        });
    } else {
        showMainError("Firebase SDK not loaded. Page cannot function.");
    }
    
    // --- SINGLE FACTION FETCH & SAVE LOGIC ---
    if (fetchFactionDataBtn) {
        fetchFactionDataBtn.addEventListener('click', async () => {
            clearStatus();
            factionIdError.textContent = '';
            
            const factionId = factionIdInput.value.trim();
            if (!factionId || isNaN(factionId)) {
                factionIdError.textContent = 'Please enter a valid numeric Faction ID.';
                return;
            }

            if (!tornApiKey) {
                showMainError("Your Torn API key is not loaded. Cannot fetch data.");
                return;
            }

            updateStatus(`Fetching data for Faction ID ${factionId}...`);
            fetchFactionDataBtn.disabled = true;
            if (refreshDatabaseFactionsBtn) refreshDatabaseFactionsBtn.disabled = true;

            try {
                // Step 1: Call your working Netlify function
                const functionUrl = `/.netlify/functions/fetch-fairfight-data?type=faction&id=${factionId}&apiKey=${tornApiKey}`;
                const response = await fetch(functionUrl);
                const data = await response.json();

                if (!response.ok || data.error) {
                    throw new Error(data.error || `Function returned status ${response.status}`);
                }

                if (!data.members || data.members.length === 0) {
                    updateStatus(`No members found for Faction ID ${factionId}.`, true);
                    return;
                }
                
                // Step 2: If successful, automatically save to Firestore
                const members = data.members;
                const factionName = data.faction_name;
                updateStatus(`Found ${members.length} members for ${factionName}. Now saving to database...`);
                
                const db = firebase.firestore();
                const batch = db.batch();
                let successfulSaves = 0;

                for (const member of members) {
                    // Check for valid data returned from ffscouter
                    if (member.ff_data && member.ff_data.fair_fight) {
                        const targetRef = db.collection('factionTargets').doc(member.id.toString());
                        
                        const dataToSave = {
                            playerID: parseInt(member.id),
                            playerName: member.name,
                            factionID: parseInt(factionId),
                            factionName: factionName,
                            fairFightScore: member.ff_data.fair_fight,
                            estimatedBattleStats: member.ff_data.bs_estimate_human || "N/A", // <-- ADDED THIS LINE
                            difficulty: get_difficulty_text(member.ff_data.fair_fight),
                            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                        };
                        
                        batch.set(targetRef, dataToSave, { merge: true });
                        successfulSaves++;
                    }
                }

                await batch.commit();
                updateStatus(`Save complete. Successfully saved ${successfulSaves} targets to the database.`, false);

            } catch (error) {
                console.error("Error during fetch & save:", error);
                updateStatus(`An error occurred: ${error.message}`, true);
                showMainError(error.message);
            } finally {
                fetchFactionDataBtn.disabled = false;
                if (refreshDatabaseFactionsBtn) refreshDatabaseFactionsBtn.disabled = false;
            }
        });
    }

    // --- REFRESH ALL DATABASE FACTIONS (Placeholder) ---
    if (refreshDatabaseFactionsBtn) {
        refreshDatabaseFactionsBtn.addEventListener('click', () => {
            updateStatus("Refresh All functionality has not been implemented yet.", true);
        });
    }

    // --- Helper function for displaying difficulty ---
    function get_difficulty_text(ff) {
        if (ff <= 1) return "Extremely easy";
        else if (ff <= 2) return "Easy";
        else if (ff <= 3.5) return "Moderately difficult";
        else if (ff <= 4.5) return "Difficult";
        else return "May be impossible";
    }
});