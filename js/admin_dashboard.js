// Removed: Global variable combinedFactionMembersData as it's no longer used for frontend table display.

// Global state variables for batch processing
let currentFactionMembers = []; // Stores all member IDs for the current faction
let currentFactionName = "";
let currentFactionId = "";
let currentBatchStartIndex = 0;
const BATCH_SIZE = 5; // Process 5 players per batch invocation
let totalMembersToProcess = 0;

// New global variables for overall batch processing summary
let totalProcessedSuccess = 0;
let totalProcessedSkipped = 0;
let totalProcessedErrors = 0;   // Reset new totals

document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logoutButtonHeader');
    const factionIdInput = document.getElementById('factionIdInput');
    const factionIdError = document.getElementById('factionIdError');
    const fetchFactionDataBtn = document.getElementById('fetchFactionDataBtn');
    const saveToFirebaseBtn = document.getElementById('saveToFirebaseBtn'); // This button is for a separate save functionality now, as the Netlify function saves directly
    const updatesBox = document.getElementById('updatesBox');
    const adminToolContainer = document.querySelector('.admin-tool-container'); // Get the main container
    const dataDisplayArea = document.createElement('div'); // New div for general output/status, not strictly a table now.
    dataDisplayArea.id = 'fetchedFactionDataTableContainer';
    dataDisplayArea.style.marginTop = '20px';
    // Append this to your admin-tool-container or another suitable element
    if (adminToolContainer) { // Ensure container exists before appending
        adminToolContainer.appendChild(dataDisplayArea);
    }


    // --- Helper for updates box ---
    // Modified to include the temporary prefix stripping workaround AND clear default message
    function updateStatus(message, isError = false) {
        const timestamp = new Date().toLocaleTimeString();
        let cleanedMessage = message;
        // Temporary workaround: try to remove the specific error prefix if it's there
        const problematicPrefix = '[error: #8d4d | "Error"] ~ '; // Note the space at the end
        if (cleanedMessage.startsWith(problematicPrefix)) {
            cleanedMessage = cleanedMessage.substring(problematicPrefix.length);
        }

        updatesBox.innerHTML += `<p style="color:${isError ? '#ff4d4d' : '#eee'};"><strong>[${timestamp}]</strong> ${cleanedMessage}</p>`;
        updatesBox.scrollTop = updatesBox.scrollHeight; // Scroll to bottom
    }
    function clearStatus() {
        updatesBox.innerHTML = ''; // <--- CORRECTED: Clear the box completely, removing "Status updates will appear here."
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

    // Removed: getValueForStat function as it's no longer used for frontend table display.
    // Removed: formatBattleStat function as it's no longer used for frontend table display.
    // Removed: renderDataTable function as it's no longer used for frontend table display.


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
        totalProcessedSuccess = 0; // Reset new totals
        totalProcessedSkipped = 0; // Reset new totals
        totalProcessedErrors = 0;   // Reset new totals
        clearStatus(); // <--- This will now completely clear the updatesBox
        dataDisplayArea.innerHTML = '';
        saveToFirebaseBtn.style.display = 'none'; // Ensure save button is hidden
    }

    /**
     * Displays the final consolidated status message after all batches.
     */
    function displayFinalBatchStatus() {
        let finalMessage = `Status: Finished.`;
        // <--- CORRECTED: Use Faction ID and Name
        finalMessage += ` Found ${totalMembersToProcess} members for ${currentFactionId} - ${currentFactionName}.`;
        finalMessage += ` Successfully processed ${totalProcessedSuccess} spy reports.`;
        if (totalProcessedSkipped > 0) finalMessage += ` Skipped ${totalProcessedSkipped} members (no spy report / invalid).`;
        if (totalProcessedErrors > 0) finalMessage += ` Failed to retrieve ${totalProcessedErrors} members (API errors).`;
        // Removed: `Check Netlify logs for detailed progress.`
        
        updateStatus(finalMessage, false);
    }


    /**
     * Recursively processes batches of players.
     */
    async function processNextBatch() {
        if (currentBatchStartIndex >= totalMembersToProcess) {
            displayFinalBatchStatus(); // Show final status once all done
            console.log("Batch processing finished.");
            fetchFactionDataBtn.disabled = false; // Re-enable button
            return;
        }

        const currentBatch = currentFactionMembers.slice(currentBatchStartIndex, currentBatchStartIndex + BATCH_SIZE);
        const batchNumber = Math.floor(currentBatchStartIndex / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(totalMembersToProcess / BATCH_SIZE);

        // Only update status at the very beginning of the overall process.
        // No per-batch status updates are needed per user request.
        // The initial "Status: Running" will persist from the initial fetch.
        
        fetchFactionDataBtn.disabled = true; // Keep button disabled during processing

        try {
            const response = await fetch('/.netlify/functions/process-spy-batch', { // Calling the new batch function
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    factionId: currentFactionId,
                    factionName: currentFactionName,
                    memberIDs: currentFactionMembers, // Send full list for context in batch function
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
                // Accumulate totals across batches
                totalProcessedSuccess += result.processedSummary.successCount;
                totalProcessedSkipped += result.processedSummary.skippedCount;
                totalProcessedErrors += result.processedSummary.errorCount;

                currentBatchStartIndex = result.nextStartIndex;
                
                // If not complete, call next batch after a small delay to respect Netlify/TornStats limits
                if (!result.isComplete) {
                    setTimeout(processNextBatch, 500); // Small delay between batches (e.g., 500ms)
                } else {
                    processNextBatch(); // If complete, run once more to trigger final status update
                }
            } else {
                throw new Error(`Batch function reported failure: ${result.message || 'Unknown issue'}`);
            }

        } catch (error) {
            updateStatus(`Error processing batch: ${error.message}. Process stopped.`, true);
            console.error("Batch processing error:", error);
            showMainError(`Failed to process batch: ${error.message}`);
            fetchFactionDataBtn.disabled = false; // Re-enable button on error
        }
    }


    // --- Fetch All Data (Initial Trigger for Batch Processing) ---
    if (fetchFactionDataBtn) {
        fetchFactionDataBtn.addEventListener('click', async () => {
            console.log("Fetch Faction Data button clicked - initiating batch process!");
            resetBatchProcessState(); // Clear any previous state

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

            // Simplified initial status: Just "Status: Running"
            updateStatus(`Status: Running.`, false); 
            fetchFactionDataBtn.disabled = true; // Disable button immediately

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
                    currentBatchStartIndex = 0; // Reset for start of new batch process

                    // No specific "Step 1/2 complete" message, just continue with "Running"
                    setTimeout(processNextBatch, 500); // Start processing first batch after slight delay
                } else {
                    updateStatus(`Status: Finished. No members found for Faction ID ${currentFactionId}. Check faction ID.`, true); // Indicate finished with error for no members
                    fetchFactionDataBtn.disabled = false; // Re-enable button
                }

            } catch (error) {
                updateStatus(`Error fetching members list: ${error.message}. Process stopped.`, true);
                console.error("Initial member list fetch error:", error);
                showMainError(`Failed to fetch faction members: ${error.message}`);
                fetchFactionDataBtn.disabled = false; // Re-enable button on error
            }
        });
    } // End if (fetchFactionDataBtn)

    // --- Save to Firebase Button Logic ---
    // This button is no longer part of the automated batch process flow.
    // Its original logic (saving combinedFactionMembersData) is independent.
    // If you need a manual save button for some other purpose, keep it.
    // Otherwise, you can safely remove the HTML for saveToFirebaseBtn.
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