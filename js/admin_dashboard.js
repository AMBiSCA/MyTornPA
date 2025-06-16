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
let totalProcessedErrors = 0;

// New global variable for overall faction count (for the "Refresh a total of X Factions" message)
let totalFactionsProcessed = 0; 
let totalFactionsToAttempt = 0; // To show total count in final message

document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logoutButtonHeader');
    const factionIdInput = document.getElementById('factionIdInput'); 
    const factionIdError = document.getElementById('factionIdError'); 

    const fetchFactionDataBtn = document.getElementById('fetchFactionDataBtn');
    const refreshDatabaseFactionsBtn = document.getElementById('refreshDatabaseFactionsBtn'); 
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
        totalFactionsProcessed = 0; // Reset for overall count
        totalFactionsToAttempt = 0; // Reset for overall count
        clearStatus();
        dataDisplayArea.innerHTML = '';
        saveToFirebaseBtn.style.display = 'none';
    }

    /**
     * Displays the overall final status message after the entire multi-faction process.
     */
    function displayOverallFinalStatus() {
        updateStatus(`Status: Finished. Refresh a total of ${totalFactionsToAttempt} Factions.`, false);
        console.log(`Overall batch processing finished. Total factions attempted: ${totalFactionsToAttempt}.`);
    }


    /**
     * Recursively processes batches of players for a single faction.
     * This function is awaited by the orchestrating multi-faction processes.
     */
    async function processNextBatch() {
        if (currentBatchStartIndex >= totalMembersToProcess) {
            console.log("Batch processing finished for current faction.");
            totalFactionsProcessed++; // Increment the count of successfully processed factions
            return; // Indicate completion of this faction's batches
        }

        const currentBatch = currentFactionMembers.slice(currentBatchStartIndex, currentBatchStartIndex + BATCH_SIZE);
        // No per-batch status updates are needed per user request.
        
        try {
            const response = await fetch('/.netlify/functions/process-spy-batch', {
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
                    return processNextBatch();
                }
            } else {
                throw new Error(`Batch function reported failure: ${result.message || 'Unknown issue'}`);
            }

        } catch (error) {
            updateStatus(`Status: Running. Error during processing. Check console for details.`, true); // Generic error message for display
            console.error(`Batch processing error for Faction ${currentFactionId}: ${error.message}. Process stopped for this faction.`, error);
            showMainError(`Failed to process: ${error.message}`);
            // Don't disable buttons here, let the orchestrator handle.
            totalFactionsProcessed++; // Count this faction as attempted, even with error
            throw error; // Propagate error to stop current faction's processing
        }
    }


    // --- Single Faction Data Fetch (via input field) ---
    if (fetchFactionDataBtn) {
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
                    totalFactionsToAttempt = 1; // For a single faction run

                    await new Promise(resolve => setTimeout(resolve, 500));
                    await processNextBatch(); // This will complete all batches for this single faction

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
                updateStatus(`Status: Running. Error fetching members list. Check console for details.`, true); // Generic error message for display
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

            resetBatchProcessState(); // Clear any previous status/state

            updateStatus("Status: Running.", false); // Initial running status for multi-faction run

            let currentAuthenticatedUser = firebase.auth().currentUser;
            if (!currentAuthenticatedUser) {
                updateStatus("Not authenticated. Please log in again.", true);
                showMainError("Authentication required to fetch data.");
                fetchFactionDataBtn.disabled = false;
                refreshDatabaseFactionsBtn.disabled = false;
                return;
            }

            try {
                const response = await fetch('/.netlify/functions/get-all-database-faction-ids', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({})
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

                    // Continue with "Status: Running"
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    await processNextDbFaction(); // Start processing the list of factions from DB

                } else {
                    totalFactionsToAttempt = 0; // No factions found
                    displayOverallFinalStatus(); // Display final status (0 factions processed)
                    fetchFactionDataBtn.disabled = false;
                    refreshDatabaseFactionsBtn.disabled = false;
                }

            } catch (error) {
                totalFactionsToAttempt = 0; // Assume 0 if initial fetch fails
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
            displayOverallFinalStatus(); // Show overall final status
            console.log("All database factions processed.");
            fetchFactionDataBtn.disabled = false;
            refreshDatabaseFactionsBtn.disabled = false;
            return;
        }

        resetBatchProcessState(); // Reset state for each new faction (but keep totalFactionsToAttempt)
        currentFactionId = allDbFactionsToProcess[currentDbFactionIndex];

        // Status is already "Running." No change needed per faction.

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

                // Start batch processing for this faction (will just keep "Status: Running" on screen)
                await new Promise(resolve => setTimeout(resolve, 500));
                await processNextBatch(); // This will complete all batches for THIS faction
                
                // After processing all batches for this faction (success or internal error):
                currentDbFactionIndex++; // Move to the next faction in the list
                await new Promise(resolve => setTimeout(resolve, 2000)); // Delay before starting next faction's process
                processNextDbFaction(); // Recursively call for the next faction
                
            } else {
                updateStatus(`Status: Running. Error: No members found for database Faction ID ${currentFactionId}. Skipping.`, true); // Brief error, but still running overall
                console.warn(`No members found for database Faction ID ${currentFactionId}.`);
                currentDbFactionIndex++;
                await new Promise(resolve => setTimeout(resolve, 2000));
                processNextDbFaction();
            }

        } catch (error) {
            updateStatus(`Status: Running. Error processing database Faction ID ${currentFactionId}. Skipping.`, true); // Brief error, but still running overall
            console.error(`Error processing database faction ${currentFactionId}:`, error);
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
});