// mysite/js/admin_dashboard.js - FINAL VERSION with UID-BASED ADMIN ACCESS CONTROL

document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration: ALLOWED ADMIN UIDs ---
    // IMPORTANT: Add the UIDs of users who should have access to this admin dashboard.
    // You can find a user's UID in the Firebase Authentication console.
    // To add more UIDs, simply add another comma-separated UID string in this array.
    const ALLOWED_ADMIN_UIDS = [
        "OxwatQjtUCPtLSBUrBqVseBpqeT2", // ADD YOUR FIRST ADMIN UID HERE
        // "ANOTHER_ADMIN_UID_HERE",    // Example of how to add more
        // "YET_ANOTHER_ADMIN_UID",
    ];


    // --- UI Elements ---
    const fetchFactionDataBtn = document.getElementById('fetchFactionDataBtn');
    const refreshDatabaseFactionsBtn = document.getElementById('refreshDatabaseFactionsBtn');
    const factionIdInput = document.getElementById('factionIdInput');
    const factionIdError = document.getElementById('factionIdError');
    const updatesBox = document.getElementById('updatesBox');
    const adminToolContainer = document.querySelector('.admin-tool-container');
    const totalTargetsCountSpan = document.getElementById('totalTargetsCount'); 

    // --- Status Update Functions for Concise Logging ---
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


    // --- Helper for displaying prominent errors on the page (for non-admin users, this won't be seen) ---
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
        if (adminToolContainer) adminToolContainer.appendChild(errorDiv);
        setTimeout(() => { if (errorDiv.parentElement) errorDiv.remove(); }, 7000);
    }

    // --- Function to update the total target count display ---
    async function updateTargetCountDisplay() {
        if (!totalTargetsCountSpan) return; 
        totalTargetsCountSpan.textContent = 'Counting...';
        
        try {
            const db = firebase.firestore();
            const snapshot = await db.collection('factionTargets').get();
            totalTargetsCountSpan.textContent = snapshot.size; 
        } catch (error) {
            console.error("Error fetching target count:", error);
            totalTargetsCountSpan.textContent = 'Error';
        }
    }

    // --- Page Protection & Auth Handling ---
    let tornApiKey = null;
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            // User is logged in, now check if they are an allowed admin UID
            if (ALLOWED_ADMIN_UIDS.includes(user.uid)) {
                console.log("Admin Dashboard: User IS signed in and IS an allowed admin.", user.uid);
                // User is authorized, proceed with dashboard initialization
                const db = firebase.firestore();
                try {
                    const userDoc = await db.collection('userProfiles').doc(user.uid).get();
                    if (userDoc.exists && userDoc.data().tornApiKey) {
                        tornApiKey = userDoc.data().tornApiKey;
                        updateTargetCountDisplay(); 
                    } else {
                        showMainError("Admin user profile not found or Torn API Key is missing. Admin features may be limited.");
                        totalTargetsCountSpan.textContent = 'N/A';
                    }
                } catch (profileError) {
                    console.error("Admin Dashboard: Error fetching user profile:", profileError);
                    showMainError("Error loading admin profile data. Please try again.");
                    totalTargetsCountSpan.textContent = 'Error';
                }
            } else {
                // User is logged in but NOT an allowed admin
                console.warn("Admin Dashboard: Unauthorized user logged in. Redirecting to home page.");
                // Redirect unauthorized logged-in users to the main home page
                window.location.href = '/pages/home.html'; 
            }
        } else {
            // No user is signed in at all
            console.log("Admin Dashboard: No user signed in. Redirecting to login page.");
            // Redirect unauthenticated users to the main index/login page
            window.location.href = '/index.html'; 
        }
    });
    
    // --- Core Logic for Processing a Single Faction ---
    async function processSingleFaction(factionId) {
        const db = firebase.firestore();
        const factionIdNum = parseInt(factionId, 10);

        // Check if faction ID is already in the database
        try {
            const querySnapshot = await db.collection('factionTargets').where('factionID', '==', factionIdNum).limit(1).get();
            if (!querySnapshot.empty) {
                console.warn(`Faction ID ${factionIdNum} is already in the database. Skipping.`);
                return { status: 'skipped', reason: 'already_in_db', message: `Faction ID ${factionIdNum} already exists.` };
            }
        } catch (dbError) {
            console.error(`Database check error for Faction ID ${factionIdNum}:`, dbError);
            return { status: 'error', reason: 'db_check_failed', message: `DB check failed for ${factionIdNum}: ${dbError.message}` };
        }
        
        const functionUrl = `/.netlify/functions/fetch-fairfight-data?type=faction&id=${factionId}&apiKey=${tornApiKey}`;
        
        try {
            const response = await fetch(functionUrl);
            const data = await response.json();

            // Check for actual HTTP errors (e.g., 500 from Netlify function)
            if (!response.ok) {
                console.error(`Netlify Function HTTP Error for Faction ID ${factionId}: Status ${response.status} - ${data.error || response.statusText}`);
                return { status: 'error', reason: 'netlify_http_error', message: `Netlify function error for ${factionId}: ${data.error || response.statusText}` };
            }

            // Check for 'soft' errors returned by the Netlify function (status: "skipped" or "error")
            if (data.status === "skipped" || data.status === "error") {
                console.warn(`Faction ID ${factionId} skipped due to API issue: ${data.message || 'Unknown reason'}`);
                return { status: 'skipped', reason: 'api_soft_error', message: data.message || `API skipped for ID ${factionId}` };
            }

            // Check if no members or no valid FF data for members
            if (!data.members || data.members.length === 0) {
                console.warn(`No members found for Faction ID ${factionId} or no valid data.`);
                return { status: 'skipped', reason: 'no_members_or_data', message: `No members or data for ID ${factionId}.` };
            }
            
            const members = data.members;
            const factionName = data.faction_name;
            const batch = db.batch();
            let successfulSaves = 0;

            for (const member of members) {
                // Only save members who have fair_fight data and it's a number
                if (member.ff_data && typeof member.ff_data.fair_fight === 'number') {
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
                } else {
                    console.warn(`Skipping member ${member.id} (${member.name || 'Unknown'}) due to missing or invalid FF data.`);
                }
            }

            if (successfulSaves > 0) await batch.commit();
            
            // Return success with count
            return { status: 'success', savedCount: successfulSaves, message: `Faction ID ${factionId}: Saved ${successfulSaves} targets.` };

        } catch (fetchError) {
            console.error(`Caught fetch error for Faction ID ${factionId}:`, fetchError);
            return { status: 'error', reason: 'fetch_exception', message: `Fetch failed for ${factionId}: ${fetchError.message}` };
        }
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
        let factionsSkipped = 0; 
        let factionsFailed = 0; 
        let alreadyInDbIds = []; 

        for (const [index, id] of factionIds.entries()) {
            setStatus(2, `Processing: ${index + 1} / ${factionIds.length} - Faction ID ${id}`);
            const result = await processSingleFaction(id); 

            if (result.status === 'success') {
                totalTargetsSaved += result.savedCount;
                factionsProcessed++;
            } else if (result.status === 'skipped') {
                factionsSkipped++;
                if (result.reason === 'already_in_db') {
                    alreadyInDbIds.push(id); 
                } else {
                    console.warn(`Skipped Faction ID ${id} (${result.reason}): ${result.message}`);
                }
            } else if (result.status === 'error') {
                factionsFailed++;
                factionsProcessed++; 
                appendStatus(`Failed Faction ID ${id}: ${result.message}`, true); 
                console.error(`ERROR: Faction ID ${id} failed: ${result.message}`);
            }
        }

        setStatus(3, `Queue finished. Processed ${factionsProcessed} / ${factionIds.length} factions. Saved ${totalTargetsSaved} targets.`);
        
        if (alreadyInDbIds.length > 0) {
            appendStatus(`The following ${alreadyInDbIds.length} Faction ID(s) were already in the database and skipped: ${alreadyInDbIds.join(', ')}.`);
        }
        if (factionsSkipped > alreadyInDbIds.length) { 
             appendStatus(`Additionally, ${factionsSkipped - alreadyInDbIds.length} faction(s) were skipped due to API or data issues. Check browser console for details.`);
        }
        if (factionsFailed > 0) {
            appendStatus(`Some factions failed processing. See above for details.`);
        }
        
        updateTargetCountDisplay(); 

        fetchFactionDataBtn.disabled = false;
        if (refreshDatabaseFactionsBtn) refreshDatabaseFactionsBtn.disabled = false;
        factionIdInput.disabled = false;
        factionIdInput.value = '';
    }

    // --- Main Handler for Clicks and Enter Key ---
    async function handleGo() {
        if (!tornApiKey) {
            showMainError("Your Torn API key is not loaded. Please ensure you are logged in and your API key is set in your profile.");
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