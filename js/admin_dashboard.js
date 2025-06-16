// Global state variables for batch processing
let currentFactionMembers = []; // Stores all member IDs for the current faction
let currentFactionName = "";
let currentFactionId = "";
let currentBatchStartIndex = 0;
const BATCH_SIZE = 5; // Process 5 players per batch invocation
let totalMembersToProcess = 0;

// Global variables for overall batch processing summary
let totalProcessedSuccess = 0;
let totalProcessedSkipped = 0;
let totalProcessedErrors = 0;   // Reset new totals

// Removed: FACTIONS_TO_REFRESH array as it's no longer used.

document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logoutButtonHeader');
    const factionIdInput = document.getElementById('factionIdInput'); // Keep this input field
    const factionIdError = document.getElementById('factionIdError'); // Keep its error display

    const fetchFactionDataBtn = document.getElementById('fetchFactionDataBtn'); // Keep this button
    // Removed: const refreshAllFactionsBtn = document.getElementById('refreshAllFactionsBtn'); // Removed this button's reference
    const refreshDatabaseFactionsBtn = document.getElementById('refreshDatabaseFactionsBtn'); // Keep this button
    const saveToFirebaseBtn = document.getElementById('saveToFirebaseBtn'); 
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

    // --- Page Protection ---
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
    // Batch Processing Functions
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
        clearStatus();
        dataDisplayArea.innerHTML = '';
        saveToFirebaseBtn.style.display = 'none';
    }

    /**
     * Displays the final consolidated status message after all batches for a single or monitored faction.
     * @param {number} [processedFactionCount=1] - Optional, for multi-faction runs (current faction number).
     * @param {number} [totalFactionsToProcess=1] - Optional, for multi-faction runs (total factions in list).
     */
    function displayFinalBatchStatus(processedFactionCount = 1, totalFactionsToProcess = 1) {
        let finalMessage = `Status: Finished.`;
        if (totalFactionsToProcess > 1) {
            finalMessage += ` Processed Faction ${processedFactionCount} of ${totalFactionsToProcess} (${currentFactionId} - ${currentFactionName}).`;
        } else {
            finalMessage += ` Found ${totalMembersToProcess} members for ${currentFactionId} - ${currentFactionName}.`;
        }
        finalMessage += ` Successfully processed ${totalProcessedSuccess} spy reports.`;
        if (totalProcessedSkipped > 0) finalMessage += ` Skipped ${totalProcessedSkipped} members (no spy report / invalid).`;
        if (totalProcessedErrors > 0) finalMessage += ` Failed to retrieve ${totalProcessedErrors} members (API errors).`;
        
        updateStatus(finalMessage, false);
    }


    /**
     * Recursively processes batches of players for a single faction.
     * This function is awaited by the orchestrating multi-faction processes.
     */
    async function processNextBatch() {
        if (currentBatchStartIndex >= totalMembersToProcess) {
            console.log("Batch processing finished for current faction.");
            return; // Indicate completion of this faction's batches
        }

        const currentBatch = currentFactionMembers.slice(currentBatchStartIndex, currentBatchStartIndex + BATCH_SIZE);
        // No per-batch status updates are needed per user request.
        
        try {
            const response = await fetch('/.netlify/functions/process-spy-batch', { // Calling the new batch function
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    factionId: currentFactionId,
                    factionName: currentFactionName,
                    memberIDs: currentFactionMembers,
                    startIndex: currentBatchStartIndex,
                    batchSize: BATCH_SIZE
                })
            });

            if (!response.ok) {
                const errorBody = await response.json().catch(() => ({ message: response.statusText }));
                throw new Error(`Batch Function Error (${response.status}): ${errorBody.message || 'Unknown error'}`);
            }

            const result = await response.json();

            if (result.success) {
                totalProcessedSuccess += result.processedSummary.successCount;
                totalProcessedSkipped += result.processedSummary.skippedCount;
                totalProcessedErrors += result.processedSummary.errorCount;

                currentBatchStartIndex = result.nextStartIndex;
                
                if (!result.isComplete) {
                    setTimeout(processNextBatch, 500);
                } else {
                    return processNextBatch(); // If complete, run once more to trigger final status / next faction
                }
            } else {
                throw new Error(`Batch function reported failure: ${result.message || 'Unknown issue'}`);
            }

        } catch (error) {
            updateStatus(`Error processing batch for Faction ${currentFactionId}: ${error.message}. Process stopped for this faction.`, true);
            console.error("Batch processing error for current faction:", error);
            showMainError(`Failed to process batch for Faction ${currentFactionId}: ${error.message}`);
            throw error; // Propagate error to stop current faction's processing
        }
    }


    // --- Single Faction Data Fetch (via input field) ---
    if (fetchFactionDataBtn) { // Ensure button exists before attaching listener
        fetchFactionDataBtn.addEventListener('click', async () => {
            console.log("Fetch Faction Data button clicked - initiating batch process for single faction!");
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

            updateStatus(`Status: Running.`, false); 
            fetchFactionDataBtn.disabled = true; // Disable single fetch button
            refreshDatabaseFactionsBtn.disabled = true; // Disable the other button too

            try {
                const response = await fetch('/.netlify/functions/get-faction-members', { // Call the new initial function
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
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

                    // Start batch processing
                    await new Promise(resolve => setTimeout(resolve, 500)); // Slight delay before first batch
                    await processNextBatch(); // Process all batches for this single faction

                    displayFinalBatchStatus(); // Display final status for this single faction
                    fetchFactionDataBtn.disabled = false; // Re-enable button after single faction is done
                    refreshDatabaseFactionsBtn.disabled = false;
                } else {
                    updateStatus(`Status: Finished. No members found for Faction ID ${currentFactionId}. Check faction ID.`, true);
                    fetchFactionDataBtn.disabled = false;
                    refreshDatabaseFactionsBtn.disabled = false;
                }

            } catch (error) {
                updateStatus(`Error fetching members list: ${error.message}. Process stopped.`, true);
                console.error("Initial member list fetch error:", error);
                showMainError(`Failed to fetch faction members: ${error.message}`);
                fetchFactionDataBtn.disabled = false;
                refreshDatabaseFactionsBtn.disabled = false;
            }
        });
    } // End if (fetchFactionDataBtn)


    // --- REMOVED: Refresh All Monitored Factions Logic ---
    // The previous 'refreshAllFactionsBtn' logic and FACTIONS_TO_REFRESH are removed.


    // --- Refresh All Database Factions Logic ---
    let currentDbFactionIndex = 0; // To track which faction from database list is being processed
    let allDbFactionsToProcess = []; // To store the list of factions fetched from DB

    if (refreshDatabaseFactionsBtn) {
        refreshDatabaseFactionsBtn.addEventListener('click', async () => {
            console.log("Refresh All Database Factions button clicked - initiating fetch of unique faction IDs from database.");
            
            fetchFactionDataBtn.disabled = true; // Disable single fetch button
            refreshDatabaseFactionsBtn.disabled = true; // Disable self

            resetBatchProcessState(); // Clear any previous status/state

            updateStatus("Status: Running. Fetching unique faction IDs from your database...", false);

            let currentAuthenticatedUser = firebase.auth().currentUser;
            if (!currentAuthenticatedUser) {
                updateStatus("Not authenticated. Please log in again.", true);
                showMainError("Authentication required to fetch data.");
                fetchFactionDataBtn.disabled = false;
                refreshDatabaseFactionsBtn.disabled = false;
                return;
            }

            try {
                // Call the new Netlify Function to get unique faction IDs from Firestore
                const response = await fetch('/.netlify/functions/get-all-database-faction-ids', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}) // No specific data needed for this function
                });

                if (!response.ok) {
                    const errorBody = await response.json().catch(() => ({ message: response.statusText }));
                    throw new Error(`Get DB Factions Function Error (${response.status}): ${errorBody.message || 'Unknown error'}`);
                }

                const result = await response.json();

                if (result.success && result.factionIds && result.factionIds.length > 0) {
                    allDbFactionsToProcess = result.factionIds;
                    currentDbFactionIndex = 0; // Start from the first faction from DB

                    updateStatus(`Status: Running. Found ${allDbFactionsToProcess.length} unique factions in your database. Starting refresh process...`, false);
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay before starting first faction

                    await processNextDbFaction(); // Start processing the list of factions from DB

                } else {
                    updateStatus("Status: Finished. No unique faction IDs found in your database. Ensure data is saved with 'faction_id'.", true);
                    fetchFactionDataBtn.disabled = false;
                    refreshDatabaseFactionsBtn.disabled = false;
                }

            } catch (error) {
                updateStatus(`Error fetching database faction IDs: ${error.message}. Process stopped.`, true);
                console.error("Error fetching database faction IDs:", error);
                showMainError(`Failed to fetch database faction IDs: ${error.message}`);
                fetchFactionDataBtn.disabled = false;
                refreshDatabaseFactionsBtn.disabled = false;
            }
        });
    }

    /**
     * Processes the next faction from the list fetched from the database.
     */
    async function processNextDbFaction() {
        if (currentDbFactionIndex >= allDbFactionsToProcess.length) {
            updateStatus(`Status: Finished. All ${allDbFactionsToProcess.length} database factions have been processed.`, false);
            console.log("All database factions processed.");
            fetchFactionDataBtn.disabled = false;
            refreshDatabaseFactionsBtn.disabled = false;
            return;
        }

        resetBatchProcessState(); // Reset state for each new faction
        currentFactionId = allDbFactionsToProcess[currentDbFactionIndex];

        updateStatus(`Status: Running. Fetching members for database Faction ID: ${currentFactionId} (${currentDbFactionIndex + 1} of ${allDbFactionsToProcess.length})...`, false);

        let currentAuthenticatedUser = firebase.auth().currentUser;
        if (!currentAuthenticatedUser) {
            updateStatus("Not authenticated. Please log in again.", true);
            showMainError("Authentication required to fetch data.");
            fetchFactionDataBtn.disabled = false;
            refreshDatabaseFactionsBtn.disabled = false;
            return;
        }

        try {
            const response = await fetch('/.netlify/functions/get-faction-members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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

                updateStatus(`Status: Running. Processing batches for ${currentFactionId} - ${currentFactionName} (${currentDbFactionIndex + 1} of ${allDbFactionsToProcess.length} factions)...`, false);
                await new Promise(resolve => setTimeout(resolve, 500));
                await processNextBatch(); // This will complete all batches for THIS faction
                
                displayFinalBatchStatus(currentDbFactionIndex + 1, allDbFactionsToProcess.length); // Display status for this faction
                currentDbFactionIndex++; // Move to the next faction in the list
                await new Promise(resolve => setTimeout(resolve, 2000)); // Delay before starting next faction's process
                processNextDbFaction(); // Recursively call for the next faction
                
            } else {
                updateStatus(`Status: Finished. No members found for database Faction ID ${currentFactionId}. Skipping.`, true);
                console.warn(`No members found for database Faction ID ${currentFactionId}.`);
                displayFinalBatchStatus(currentDbFactionIndex + 1, allDbFactionsToProcess.length); // Even on skip, display final status for this one.
                currentDbFactionIndex++;
                await new Promise(resolve => setTimeout(resolve, 2000));
                processNextDbFaction();
            }

        } catch (error) {
            updateStatus(`Error processing database Faction ID ${currentFactionId}: ${error.message}. Skipping.`, true);
            console.error(`Error processing database faction ${currentFactionId}:`, error);
            displayFinalBatchStatus(currentDbFactionIndex + 1, allDbFactionsToProcess.length); // Even on error, display final status for this one.
            currentDbFactionIndex++;
            await new Promise(resolve => setTimeout(resolve, 2000));
            processNextDbFaction();
        }
    }


    // --- Save to Firebase Button Logic ---
    if (saveToFirebaseBtn) {
        saveToFirebaseBtn.addEventListener('click', async () => {
            updateStatus("This 'Save to Firebase' button is deprecated in the new batch processing flow. Data is saved automatically per batch.", true);
            console.warn("Manual 'Save to Firebase' button clicked, but it's deprecated for this tool.");
            saveToFirebaseBtn.disabled = false;
        });
    }

    // Removed: Other existing Faction Peeper related event listeners and init call if they were here.
    // Assuming other functions from your original admin_dashboard.js like init(), etc.
    // and listeners for myFactionIDInput, enemyFactionIDInput, startButton, stopButton, clearDataButton, etc.
    // are for a separate tool and should remain untouched in their original sections of the file.
});