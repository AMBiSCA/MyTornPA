// mysite/js/admin_dashboard.js

// Global state variables for batch processing
let currentFactionMembers = []; // Stores all member IDs for the current faction
let currentFactionName = "";
let currentFactionId = "";
let currentBatchStartIndex = 0;
const BATCH_SIZE = 5; // Process 5 players per batch invocation (for API calls)
let totalMembersToProcess = 0;

// Global variables for overall batch processing summary
let totalProcessedSuccess = 0;
let totalProcessedSkipped = 0;
let totalProcessedErrors = 0;

// Global variable for overall faction count
let totalFactionsProcessed = 0;
let totalFactionsToAttempt = 0; // To show total count in final message

document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logoutButtonHeader');
    const factionIdInput = document.getElementById('factionIdInput');
    const factionIdError = document.getElementById('factionIdError');

    const fetchFactionDataBtn = document.getElementById('fetchFactionDataBtn');
    const refreshDatabaseFactionsBtn = document.getElementById('refreshDatabaseFactionsBtn');
    const saveToFirebaseBtn = document.getElementById('saveToFirebaseBtn'); // This remains deprecated
    const updatesBox = document.getElementById('updatesBox');
    const adminToolContainer = document.querySelector('.admin-tool-container');
    const dataDisplayArea = document.createElement('div');
    dataDisplayArea.id = 'fetchedFactionDataTableContainer';
    dataDisplayArea.style.marginTop = '20px';
    if (adminToolContainer) {
        adminToolContainer.appendChild(dataDisplayArea);
    }

    // --- Helper for updates box ---
    function updateStatus(message, isError = false) {
        const timestamp = new Date().toLocaleTimeString();
        let cleanedMessage = message;
        const problematicPrefix = '[error: #8d4d | "Error"] ~ ';
        if (cleanedMessage.startsWith(problematicPrefix)) {
            cleanedMessage = cleanedMessage.substring(problematicPrefix.length);
        }

        updatesBox.innerHTML += `<p style="color:${isError ? '#ff4d4d' : '#eee'};"><strong>[${timestamp}]</strong> ${cleanedMessage}</p>`;
        updatesBox.scrollTop = updatesBox.scrollHeight;
    }

    function clearStatus() {
        updatesBox.innerHTML = '';
    }

    // --- Helper for displaying prominent errors ---
    function showMainError(message) {
        if (!message || message.trim() === '') {
            const existingMainInputError = document.querySelector('.main-input-error-feedback');
            if (existingMainInputError) {
                existingMainInputError.remove();
            }
            return;
        }
        const existingMainInputError = document.querySelector('.main-input-error-feedback');
        if (existingMainInputError) {
            existingMainInputError.remove();
        }
        const mainPageStatus = document.createElement('div');
        mainPageStatus.textContent = message;
        mainPageStatus.className = 'main-input-error-feedback';
        mainPageStatus.style.textAlign = 'center';
        mainPageStatus.style.padding = '10px';
        mainPageStatus.style.backgroundColor = 'rgba(255,0,0,0.1)';
        mainPageStatus.style.border = '1px solid red';
        mainPageStatus.style.borderRadius = '5px';
        mainPageStatus.style.marginTop = '15px';

        if (adminToolContainer) {
            const inputGroup = adminToolContainer.querySelector('.input-group');
            if (inputGroup) {
                inputGroup.insertAdjacentElement('afterend', mainPageStatus);
            } else {
                adminToolContainer.appendChild(mainPageStatus);
            }
        }
        setTimeout(() => { if(mainPageStatus.parentElement) mainPageStatus.remove(); }, 7000);
    }

    // --- Page Protection (Firebase Auth) ---
    if (typeof firebase !== 'undefined' && typeof firebase.auth !== 'undefined') {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                console.log("Admin is logged in:", user.email);
            } else {
                console.log("No admin logged in. Redirecting to login page...");
                window.location.href = '/admin_login.html';
            }
        });
    } else {
        console.error("Firebase Auth SDK not loaded. Cannot protect page.");
        showMainError("Firebase authentication not available. Please check your internet connection or console for errors.");
    }

    // --- Logout Functionality ---
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                if (typeof firebase !== 'undefined' && typeof firebase.auth !== 'undefined') {
                    await firebase.auth().signOut();
                    updateStatus("Logged out successfully. Redirecting...", false);
                    window.location.href = '/admin_login.html';
                } else {
                    updateStatus("Firebase Auth SDK not available for logout.", true);
                    console.error("Firebase Auth SDK not loaded. Cannot perform logout.");
                }
            } catch (error) {
                console.error("Logout error:", error);
                updateStatus(`Failed to log out: ${error.message}`, true);
            }
        });
    }

    // ==========================================================
    // Batch Processing Functions for Fair Fight Data
    // ==========================================================

    /**
     * Resets global state variables for a new batch processing run.
     */
    function resetBatchProcessState() {
        currentFactionMembers = [];
        currentFactionName = "";
        currentFactionId = "";
        currentBatchStartIndex = 0;
        totalMembersToProcess = 0;
        totalProcessedSuccess = 0;
        totalProcessedSkipped = 0;
        totalProcessedErrors = 0;
        totalFactionsProcessed = 0;
        totalFactionsToAttempt = 0;
        clearStatus();
        dataDisplayArea.innerHTML = '';
        if (saveToFirebaseBtn) saveToFirebaseBtn.style.display = 'none';
    }

    /**
     * Displays the overall final status message after the entire multi-faction process or single faction.
     */
    function displayOverallFinalStatus() {
        let finalMessage = `Status: Finished.`;
        if (totalFactionsToAttempt > 1) { // More than 1 faction processed overall
            finalMessage += ` Refreshed a total of ${totalFactionsProcessed} / ${totalFactionsToAttempt} Factions.`;
        } else { // Single faction processed
            finalMessage += ` Found ${totalMembersToProcess} members. Successfully processed ${totalProcessedSuccess} Fair Fight reports.`;
            if (totalProcessedSkipped > 0) finalMessage += ` Skipped ${totalProcessedSkipped}.`;
            if (totalProcessedErrors > 0) finalMessage += ` Failed ${totalProcessedErrors}.`;
        }
        updateStatus(finalMessage, false);
        console.log(`Overall batch processing finished. Total factions attempted: ${totalFactionsToAttempt}, processed: ${totalFactionsProcessed}.`);
    }

    /**
     * Recursively processes batches of players for a single faction, fetching and saving FF data.
     * This function calls the new process-ff-batch Netlify Function.
     * @param {string} idToken The Firebase ID Token of the authenticated user.
     */
    async function processNextBatch(idToken) { // --- MODIFIED: Accepts idToken ---
        if (currentBatchStartIndex >= totalMembersToProcess) {
            console.log("Batch processing finished for current faction.");
            totalFactionsProcessed++; // Increment the count of successfully processed factions
            return;
        }

        // Slice the current batch of member IDs to send to the backend
        const currentBatchMemberIds = currentFactionMembers.slice(currentBatchStartIndex, currentBatchStartIndex + BATCH_SIZE);

        try {
            // Call the new process-ff-batch Netlify Function
            const response = await fetch('/.netlify/functions/process-ff-batch', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}` // --- ADDED AUTHORIZATION HEADER ---
                },
                body: JSON.stringify({
                    factionId: currentFactionId,
                    factionName: currentFactionName,
                    memberIDs: currentBatchMemberIds, // Pass only the current batch of member IDs
                    startIndex: currentBatchStartIndex, // Optional: backend can use for logging
                    batchSize: BATCH_SIZE // Optional: backend can use for logging
                })
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`Batch FF Function Error (${response.status}): ${errorBody.message || 'Unknown error'}`);
            }

            const result = await response.json();

            if (result.success) {
                totalProcessedSuccess += result.processedSummary.successCount;
                totalProcessedSkipped += result.processedSummary.skippedCount;
                totalProcessedErrors += result.processedSummary.errorCount;

                currentBatchStartIndex = result.nextStartIndex;

                if (!result.isComplete) {
                    setTimeout(() => processNextBatch(idToken), 500); // --- MODIFIED: Pass idToken to recursive call ---
                } else {
                    return processNextBatch(idToken); // --- MODIFIED: Pass idToken to recursive call ---
                }
            } else {
                throw new Error(`Batch FF function reported failure: ${result.message || 'Unknown issue'}`);
            }

        } catch (error) {
            updateStatus(`Status: Running. Error during Fair Fight processing. Check console for details.`, true);
            console.error(`Batch FF processing error for Faction ${currentFactionId}: ${error.message}. Process stopped for this faction.`, error);
            showMainError(`Failed to process Fair Fight: ${error.message}`);
            totalFactionsProcessed++; // Count this faction as attempted even if it errored
            throw error; // Re-throw to stop the current chain if a fatal error occurs for this faction
        }
    }

    // --- Single Faction Data Fetch (via input field) ---
    if (fetchFactionDataBtn) {
        fetchFactionDataBtn.addEventListener('click', async () => {
            console.log("Fetch Faction Data button clicked - initiating Fair Fight batch process for single faction!");
            resetBatchProcessState();

            currentFactionId = factionIdInput.value.trim();
            if (!currentFactionId || isNaN(parseInt(currentFactionId, 10))) {
                factionIdError.textContent = 'Please enter a valid numeric Faction ID.';
                updateStatus('Invalid Faction ID entered.', true);
                return;
            } else {
                factionIdError.textContent = '';
            }

            let currentAuthenticatedUser = firebase.auth().currentUser;
            if (!currentAuthenticatedUser) {
                updateStatus("Not authenticated. Please log in again.", true);
                showMainError("Authentication required to fetch data.");
                return;
            }

            // --- GET FIREBASE ID TOKEN ---
            let idToken;
            try {
                idToken = await currentAuthenticatedUser.getIdToken();
                console.log("Firebase ID Token obtained for fetchFactionDataBtn.");
            } catch (error) {
                console.error("Error getting Firebase ID Token for fetchFactionDataBtn:", error);
                updateStatus("Failed to get authentication token. Please log in again.", true);
                showMainError("Authentication token error. Please re-authenticate.");
                return;
            }
            // --- END GET FIREBASE ID TOKEN ---

            updateStatus(`Status: Running. Fetching members for Faction ID ${currentFactionId}...`, false);
            fetchFactionDataBtn.disabled = true;
            refreshDatabaseFactionsBtn.disabled = true;

            try {
                // This calls a backend function to get the member IDs for the faction.
                const response = await fetch('/.netlify/functions/get-faction-members', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${idToken}` // --- ADDED AUTHORIZATION HEADER ---
                    },
                    body: JSON.stringify({ factionId: parseInt(currentFactionId, 10) })
                });

                if (!response.ok) {
                    const errorBody = await response.json().catch(() => ({ message: response.statusText }));
                    throw new Error(`Get Members Function Error (${response.status}): ${errorBody.message || 'Unknown error'}`);
                }

                const result = await response.json();

                if (result.success && result.memberIDs && result.memberIDs.length > 0) {
                    currentFactionMembers = result.memberIDs;
                    currentFactionName = result.factionName;
                    totalMembersToProcess = result.totalMembers;
                    currentBatchStartIndex = 0;
                    totalFactionsToAttempt = 1; // For a single faction run

                    updateStatus(`Status: Running. Processing ${totalMembersToProcess} members for Faction ${currentFactionName} [${currentFactionId}]...`, false);
                    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay before starting FF batch processing
                    await processNextBatch(idToken); // --- MODIFIED: Pass idToken ---

                    displayOverallFinalStatus(); // Display final status after single faction is done
                    fetchFactionDataBtn.disabled = false;
                    refreshDatabaseFactionsBtn.disabled = false;
                } else {
                    totalFactionsToAttempt = 1; // For a single faction run
                    updateStatus(`Status: Finished. No members found for Faction ID ${currentFactionId}. Check faction ID.`, true);
                    fetchFactionDataBtn.disabled = false;
                    refreshDatabaseFactionsBtn.disabled = false;
                }

            } catch (error) {
                totalFactionsToAttempt = 1; // For a single faction run
                updateStatus(`Status: Error. Failed to fetch members list. Check console for details.`, true);
                console.error("Initial member list fetch error:", error);
                showMainError(`Failed to fetch faction members: ${error.message}`);
                fetchFactionDataBtn.disabled = false;
                refreshDatabaseFactionsBtn.disabled = false;
            }
        });
    }

    // --- Refresh All Database Factions Logic ---
    let currentDbFactionIndex = 0;
    let allDbFactionsToProcess = [];

    if (refreshDatabaseFactionsBtn) {
        refreshDatabaseFactionsBtn.addEventListener('click', async () => {
            console.log("Refresh All Database Factions button clicked - initiating fetch of unique faction IDs from database.");

            fetchFactionDataBtn.disabled = true;
            refreshDatabaseFactionsBtn.disabled = true;

            resetBatchProcessState();

            updateStatus("Status: Running. Fetching faction IDs from database...", false);

            let currentAuthenticatedUser = firebase.auth().currentUser;
            if (!currentAuthenticatedUser) {
                updateStatus("Not authenticated. Please log in again.", true);
                showMainError("Authentication required to fetch data.");
                fetchFactionDataBtn.disabled = false;
                refreshDatabaseFactionsBtn.disabled = false;
                return;
            }

            // --- GET FIREBASE ID TOKEN FOR OVERALL REFRESH ---
            let overallIdToken;
            try {
                overallIdToken = await currentAuthenticatedUser.getIdToken();
                console.log("Firebase ID Token obtained for refreshDatabaseFactionsBtn.");
            } catch (error) {
                console.error("Error getting Firebase ID Token for refreshDatabaseFactionsBtn:", error);
                updateStatus("Failed to get authentication token. Please log in again.", true);
                showMainError("Authentication token error. Please re-authenticate.");
                fetchFactionDataBtn.disabled = false;
                refreshDatabaseFactionsBtn.disabled = false;
                return;
            }
            // --- END GET FIREBASE ID TOKEN ---

            try {
                // This fetches a list of Faction IDs from your database (e.g., from a collection of monitored factions)
                const response = await fetch('/.netlify/functions/get-all-database-faction-ids', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${overallIdToken}` // --- ADDED AUTHORIZATION HEADER ---
                    },
                    body: JSON.stringify({}) // Might send user.uid or admin-specific info if needed
                });

                if (!response.ok) {
                    const errorBody = await response.json().catch(() => ({ message: response.statusText }));
                    throw new Error(`Get DB Factions Function Error (${response.status}): ${errorBody.message || 'Unknown error'}`);
                }

                const result = await response.json();

                if (result.success && result.factionIds && result.factionIds.length > 0) {
                    allDbFactionsToProcess = result.factionIds;
                    currentDbFactionIndex = 0;
                    totalFactionsToAttempt = allDbFactionsToProcess.length; // Set total here

                    updateStatus(`Status: Running. Found ${totalFactionsToAttempt} factions to refresh.`, false);
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay

                    await processNextDbFaction(overallIdToken); // --- MODIFIED: Pass idToken ---

                } else {
                    totalFactionsToAttempt = 0; // No factions found
                    displayOverallFinalStatus(); // Display final status (0 factions processed)
                    fetchFactionDataBtn.disabled = false;
                    refreshDatabaseFactionsBtn.disabled = false;
                }

            } catch (error) {
                totalFactionsToAttempt = 0; // Assume 0 if initial fetch fails
                updateStatus(`Status: Error. Failed to fetch database faction IDs. Check console for details.`, true);
                console.error("Error fetching database faction IDs:", error);
                showMainError(`Failed to fetch database faction IDs: ${error.message}`);
                fetchFactionDataBtn.disabled = false;
                refreshDatabaseFactionsBtn.disabled = false;
            }
        });
    }

    /**
     * Processes the next faction from the list fetched from the database.
     * Orchestrates calling get-faction-members and processNextBatch for each.
     * @param {string} overallIdToken The Firebase ID Token for the multi-faction refresh.
     */
    async function processNextDbFaction(overallIdToken) { // --- MODIFIED: Accepts idToken ---
        if (currentDbFactionIndex >= allDbFactionsToProcess.length) {
            displayOverallFinalStatus(); // Show overall final status
            console.log("All database factions processed.");
            fetchFactionDataBtn.disabled = false;
            refreshDatabaseFactionsBtn.disabled = false;
            return;
        }

        // Reset batch process state for each new faction being processed
        resetBatchProcessState(); // This resets totals for the *current* faction processing, but totalFactionsToAttempt remains for overall run
        currentFactionId = allDbFactionsToProcess[currentDbFactionIndex]; // Set the new current faction ID

        updateStatus(`Status: Running. Fetching members for Faction ID ${currentFactionId} (${currentDbFactionIndex + 1}/${totalFactionsToAttempt})...`, false);

        let currentAuthenticatedUser = firebase.auth().currentUser;
        if (!currentAuthenticatedUser) {
            updateStatus("Not authenticated. Please log in again.", true);
            showMainError("Authentication required to fetch data.");
            fetchFactionDataBtn.disabled = false;
            refreshDatabaseFactionsBtn.disabled = false;
            return;
        }

        try {
            // Get member list for the current faction from Torn API
            const response = await fetch('/.netlify/functions/get-faction-members', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${overallIdToken}` // --- ADDED AUTHORIZATION HEADER ---
                },
                body: JSON.stringify({ factionId: parseInt(currentFactionId, 10) })
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`Get Members Function Error (${response.status}): ${errorBody.message || 'Unknown error'} for Faction ID ${currentFactionId}`);
            }

            const result = await response.json();

            if (result.success && result.memberIDs && result.memberIDs.length > 0) {
                currentFactionMembers = result.memberIDs;
                currentFactionName = result.factionName;
                totalMembersToProcess = result.totalMembers;
                currentBatchStartIndex = 0;

                updateStatus(`Status: Running. Processing ${totalMembersToProcess} members for Faction ${currentFactionName} [${currentFactionId}]...`, false);
                await new Promise(resolve => setTimeout(resolve, 500));
                await processNextBatch(overallIdToken); // --- MODIFIED: Pass idToken ---

                // After processing all batches for this faction (success or internal error for this faction):
                currentDbFactionIndex++; // Move to the next faction in the list
                await new Promise(resolve => setTimeout(resolve, 2000)); // Delay before starting next faction's process
                processNextDbFaction(overallIdToken); // --- MODIFIED: Pass idToken ---

            } else {
                updateStatus(`Status: Running. Error: No members found for database Faction ID ${currentFactionId}. Skipping.`, true);
                console.warn(`No members found for database Faction ID ${currentFactionId}.`);
                currentDbFactionIndex++;
                await new Promise(resolve => setTimeout(resolve, 2000));
                processNextDbFaction(overallIdToken); // --- MODIFIED: Pass idToken ---
            }

        } catch (error) {
            updateStatus(`Status: Running. Error processing database Faction ID ${currentFactionId}. Skipping.`, true);
            console.error(`Error processing database faction ${currentFactionId}:`, error);
            currentDbFactionIndex++;
            await new Promise(resolve => setTimeout(resolve, 2000));
            processNextDbFaction(overallIdToken); // --- MODIFIED: Pass idToken ---
        }
    }

    // --- Save to Firebase Button Logic (Deprecated for automatic batch saving) ---
    if (saveToFirebaseBtn) {
        saveToFirebaseBtn.addEventListener('click', async () => {
            updateStatus("This 'Save to Firebase' button is deprecated in the new batch processing flow. Fair Fight data is saved automatically per batch.", true);
            console.warn("Manual 'Save to Firebase' button clicked, but it's deprecated for this tool.");
            if (saveToFirebaseBtn) saveToFirebaseBtn.disabled = false; // Ensure it's re-enabled if disabled
        });
    }
});