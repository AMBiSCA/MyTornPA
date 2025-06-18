// mysite/js/admin_dashboard.js --- DEBUGGING VERSION ---

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
    
    // --- SINGLE FACTION FETCH & DEBUG LOGIC ---
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
                
                // --- DEBUG REPORTING LOGIC ---
                const members = data.members;
                let reportHTML = `<h3>Debug Report for ${data.faction_name} (${members.length} members)</h3>`;
                
                for (const member of members) {
                    if (member.ff_data && member.ff_data.fair_fight) {
                        // This is a successful member
                        reportHTML += `<p style="color: lightgreen;">[SUCCESS] ${member.name} [${member.id}] | FF: ${member.ff_data.fair_fight.toFixed(2)} | Level: ${member.ff_data.level}</p>`;
                    } else {
                        // This is a failed member
                        const errorMessage = member.ff_data?.message || "Unknown error";
                        reportHTML += `<p style="color: #ff4d4d;">[FAILED] ${member.name} [${member.id}] | Reason: ${errorMessage}</p>`;
                    }
                }
                
                clearStatus();
                updatesBox.innerHTML = reportHTML; // Display the full report

            } catch (error) {
                console.error("Error during fetch & debug:", error);
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
});