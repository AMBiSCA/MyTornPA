// mysite/js/admin_dashboard.js - FINAL VERSION with Multi-ID Queue & Enter Key

document.addEventListener('DOMContentLoaded', () => {
    // --- UI Elements ---
    const fetchFactionDataBtn = document.getElementById('fetchFactionDataBtn');
    const refreshDatabaseFactionsBtn = document.getElementById('refreshDatabaseFactionsBtn');
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
                try {
                    const db = firebase.firestore();
                    const userDocRef = db.collection('userProfiles').doc(user.uid);
                    const userDoc = await userDocRef.get();
                    if (userDoc.exists && userDoc.data().tornApiKey) {
                        tornApiKey = userDoc.data().tornApiKey;
                        updateStatus("Authentication successful. Ready.", false);
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
    
    /**
     * This is the core logic for processing a single faction.
     * It checks for duplicates, fetches data, and saves to Firestore.
     * @param {string} factionId The ID of the faction to process.
     */
    async function processSingleFaction(factionId) {
        updateStatus(`--- Starting Faction ID ${factionId} ---`);
        
        const db = firebase.firestore();
        const factionIdNum = parseInt(factionId, 10);

        // 1. Check for duplicates
        updateStatus(`Checking if Faction ID ${factionIdNum} already exists...`);
        const querySnapshot = await db.collection('factionTargets').where('factionID', '==', factionIdNum).limit(1).get();

        if (!querySnapshot.empty) {
            throw new Error(`Faction ID ${factionIdNum} is already in the database. Skipping.`);
        }
        
        // 2. Fetch the data
        updateStatus(`Faction ${factionIdNum} is new. Fetching data...`);
        const functionUrl = `/.netlify/functions/fetch-fairfight-data?type=faction&id=${factionId}&apiKey=${tornApiKey}`;
        const response = await fetch(functionUrl);
        const data = await response.json();

        if (!response.ok || data.error) {
            throw new Error(data.error || `Function returned status ${response.status}`);
        }

        if (!data.members || data.members.length === 0) {
            throw new Error(`No members found for Faction ID ${factionId}.`);
        }
        
        // 3. Save the data
        const members = data.members;
        const factionName = data.faction_name;
        updateStatus(`Found ${members.length} members for ${factionName}. Now saving...`);
        
        const batch = db.batch();
        let successfulSaves = 0;

        for (const member of members) {
            if (member.ff_data && member.ff_data.fair_fight) {
                const targetRef = db.collection('factionTargets').doc(member.id.toString());
                const dataToSave = {
                    playerID: parseInt(member.id),
                    playerName: member.name,
                    factionID: factionIdNum,
                    factionName: factionName,
                    fairFightScore: member.ff_data.fair_fight,
                    estimatedBattleStats: member.ff_data.bs_estimate_human || "N/A",
                    difficulty: get_difficulty_text(member.ff_data.fair_fight),
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                };
                batch.set(targetRef, dataToSave, { merge: true });
                successfulSaves++;
            }
        }

        if (successfulSaves > 0) {
            await batch.commit();
        }
        updateStatus(`--- Finished Faction ID ${factionId}. Saved ${successfulSaves} targets. ---`, false);
    }


    /**
     * This function manages the queue of IDs, processing them one by one.
     * @param {string[]} factionIds - An array of faction IDs to process.
     */
    async function processFactionQueue(factionIds) {
        clearStatus();
        factionIdError.textContent = '';
        updateStatus(`Starting process for ${factionIds.length} factions.`);
        
        fetchFactionDataBtn.disabled = true;
        if (refreshDatabaseFactionsBtn) refreshDatabaseFactionsBtn.disabled = true;
        factionIdInput.disabled = true;

        let factionsProcessed = 0;
        for (const id of factionIds) {
            try {
                // await will pause the loop until this faction is completely done
                await processSingleFaction(id);
                factionsProcessed++;
            } catch (error) {
                updateStatus(`Failed to process Faction ID ${id}: ${error.message}`, true);
            }
        }

        updateStatus(`Queue finished. Processed ${factionsProcessed} / ${factionIds.length} factions.`);
        
        fetchFactionDataBtn.disabled = false;
        if (refreshDatabaseFactionsBtn) refreshDatabaseFactionsBtn.disabled = false;
        factionIdInput.disabled = false;
        factionIdInput.value = '';
    }

    /**
     * The main handler that decides what to do when the user clicks Go or hits Enter.
     */
    async function handleGo() {
        if (!tornApiKey) {
            showMainError("Your Torn API key is not loaded. Cannot fetch data.");
            return;
        }

        const inputText = factionIdInput.value.trim();

        // Check for manual refresh command
        if (inputText.toLowerCase() === 'refresh') {
            clearStatus();
            updateStatus("Manual refresh trigger detected. Starting process...");
            factionIdInput.disabled = true;
            fetchFactionDataBtn.disabled = true;
            if (refreshDatabaseFactionsBtn) refreshDatabaseFactionsBtn.disabled = true;
            
            try {
                const response = await fetch('/.netlify/functions/refresh-all-targets', { method: 'POST' });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(errorText || `Refresh function failed with status ${response.status}`);
                }
                const result = await response.text();
                updateStatus(`Manual refresh completed! Server response: ${result}`);
            } catch (error) {
                updateStatus(`Manual refresh failed: ${error.message}`, true);
            } finally {
                factionIdInput.disabled = false;
                fetchFactionDataBtn.disabled = false;
                if (refreshDatabaseFactionsBtn) refreshDatabaseFactionsBtn.disabled = false;
                factionIdInput.value = '';
            }
        } else {
            // Handle one or more faction IDs
            const ids = inputText.split(',')
                               .map(id => id.trim())
                               .filter(id => id && !isNaN(id));
            
            if (ids.length > 0) {
                processFactionQueue(ids);
            } else {
                factionIdError.textContent = 'Please enter valid, comma-separated Faction IDs.';
            }
        }
    }

    // --- EVENT LISTENERS ---
    if (fetchFactionDataBtn) {
        fetchFactionDataBtn.addEventListener('click', handleGo);
    }

    if (factionIdInput) {
        factionIdInput.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault(); // Stop default form submission behavior
                handleGo();
            }
        });
    }

    // --- REFRESH ALL DATABASE FACTIONS (Placeholder for button) ---
    if (refreshDatabaseFactionsBtn) {
        refreshDatabaseFactionsBtn.addEventListener('click', () => {
            updateStatus("This button is not active. Type 'refresh' in the box above and hit Enter to start a manual refresh.", true);
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