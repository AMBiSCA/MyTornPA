// mysite/js/admin_dashboard.js - FINAL VERSION with Concise Logging

document.addEventListener('DOMContentLoaded', () => {
    // --- UI Elements ---
    const fetchFactionDataBtn = document.getElementById('fetchFactionDataBtn');
    const refreshDatabaseFactionsBtn = document.getElementById('refreshDatabaseFactionsBtn');
    const factionIdInput = document.getElementById('factionIdInput');
    const factionIdError = document.getElementById('factionIdError');
    const updatesBox = document.getElementById('updatesBox');
    const adminToolContainer = document.querySelector('.admin-tool-container');

    // --- NEW: Status Update Functions for Concise Logging ---
    function setupStatusDisplay() {
        updatesBox.innerHTML = `
            <p id="status-line-1"></p>
            <p id="status-line-2"></p>
            <p id="status-line-3"></p>
        `;
    }

    function setStatus(lineNumber, message, isError = false) {
        const lineElement = document.getElementById(`status-line-${lineNumber}`);
        if (lineElement) {
            const timestamp = new Date().toLocaleTimeString();
            lineElement.innerHTML = `<strong style="color: #888">[${timestamp}]</strong> ${message}`;
            lineElement.style.color = isError ? '#ff4d4d' : '#eee';
        }
    }
    
    function appendStatus(message, isError = false) {
        const timestamp = new Date().toLocaleTimeString();
        updatesBox.innerHTML += `<p style="color:${isError ? '#ff4d4d' : '#eee'};"><strong>[${timestamp}]</strong> ${message}</p>`;
        updatesBox.scrollTop = updatesBox.scrollHeight;
    }


    // --- Helper for displaying prominent errors on the page ---
    function showMainError(message) {
        const existingError = document.querySelector('.main-input-error-feedback');
        if (existingError) existingError.remove();
        if (!message) return;

        const errorDiv = document.createElement('div');
        errorDiv.textContent = message;
        errorDiv.className = 'main-input-error-feedback';
        // ... (styling remains the same)
        if (adminToolContainer) adminToolContainer.appendChild(errorDiv);
        setTimeout(() => { if (errorDiv.parentElement) errorDiv.remove(); }, 7000);
    }

    // --- Page Protection & Auth Handling ---
    let tornApiKey = null;
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            const db = firebase.firestore();
            const userDoc = await db.collection('userProfiles').doc(user.uid).get();
            if (userDoc.exists && userDoc.data().tornApiKey) {
                tornApiKey = userDoc.data().tornApiKey;
            } else {
                showMainError("Admin user profile not found or Torn API Key is missing.");
            }
        } else {
            window.location.href = '/admin_login.html';
        }
    });
    
    // --- Core Logic for Processing a Single Faction ---
    async function processSingleFaction(factionId) {
        const db = firebase.firestore();
        const factionIdNum = parseInt(factionId, 10);

        const querySnapshot = await db.collection('factionTargets').where('factionID', '==', factionIdNum).limit(1).get();
        if (!querySnapshot.empty) {
            throw new Error(`Faction ID ${factionIdNum} is already in the database. Skipping.`);
        }
        
        const functionUrl = `/.netlify/functions/fetch-fairfight-data?type=faction&id=${factionId}&apiKey=${tornApiKey}`;
        const response = await fetch(functionUrl);
        const data = await response.json();

        if (!response.ok || data.error) throw new Error(data.error || `Function returned status ${response.status}`);
        if (!data.members || data.members.length === 0) throw new Error(`No members found for Faction ID ${factionId}.`);
        
        const members = data.members;
        const factionName = data.faction_name;
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

        if (successfulSaves > 0) await batch.commit();
        return successfulSaves;
    }

    // --- Queue Manager for Processing Multiple Factions ---
    async function processFactionQueue(factionIds) {
        setupStatusDisplay();
        factionIdError.textContent = '';
        setStatus(1, `Starting process for ${factionIds.length} factions...`);
        
        fetchFactionDataBtn.disabled = true;
        if (refreshDatabaseFactionsBtn) refreshDatabaseFactionsBtn.disabled = true;
        factionIdInput.disabled = true;

        let factionsProcessed = 0;
        let totalTargetsSaved = 0;
        for (const [index, id] of factionIds.entries()) {
            try {
                setStatus(2, `Processing: ${index + 1} / ${factionIds.length} - Faction ID ${id}`);
                const savedCount = await processSingleFaction(id);
                totalTargetsSaved += savedCount;
                factionsProcessed++;
            } catch (error) {
                appendStatus(`Error on Faction ID ${id}: ${error.message}`, true);
            }
        }

        setStatus(3, `Queue finished. Processed ${factionsProcessed} / ${factionIds.length} factions and saved a total of ${totalTargetsSaved} targets.`);
        
        fetchFactionDataBtn.disabled = false;
        if (refreshDatabaseFactionsBtn) refreshDatabaseFactionsBtn.disabled = false;
        factionIdInput.disabled = false;
        factionIdInput.value = '';
    }

    // --- Main Handler for Clicks and Enter Key ---
    async function handleGo() {
        if (!tornApiKey) {
            showMainError("Your Torn API key is not loaded.");
            return;
        }

        const inputText = factionIdInput.value.trim();

        if (inputText.toLowerCase() === 'refresh') {
            setupStatusDisplay();
            setStatus(1, "Manual refresh trigger detected. Starting process...");
            factionIdInput.disabled = true;
            fetchFactionDataBtn.disabled = true;
            if (refreshDatabaseFactionsBtn) refreshDatabaseFactionsBtn.disabled = true;
            
            try {
                const response = await fetch('/.netlify/functions/refresh-all-targets', { method: 'POST' });
                if (!response.ok) throw new Error(await response.text());
                const result = await response.text();
                setStatus(2, `Manual refresh completed!`);
                setStatus(3, `Server response: ${result}`);
            } catch (error) {
                setStatus(2, `Manual refresh failed: ${error.message}`, true);
            } finally {
                factionIdInput.disabled = false;
                fetchFactionDataBtn.disabled = false;
                if (refreshDatabaseFactionsBtn) refreshDatabaseFactionsBtn.disabled = false;
                factionIdInput.value = '';
            }
        } else {
            const ids = inputText.split(',').map(id => id.trim()).filter(id => id && !isNaN(id));
            if (ids.length > 0) {
                processFactionQueue(ids);
            } else {
                factionIdError.textContent = 'Please enter valid, comma-separated Faction IDs.';
            }
        }
    }

    // --- Event Listeners ---
    if (fetchFactionDataBtn) fetchFactionDataBtn.addEventListener('click', handleGo);
    if (factionIdInput) {
        factionIdInput.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                handleGo();
            }
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