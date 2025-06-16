// Removed: Global variable combinedFactionMembersData as it's no longer used for frontend table display.

// Global state variables for batch processing
let currentFactionMembers = []; // Stores all member IDs for the current faction
let currentFactionName = "";
let currentFactionId = "";
let currentBatchStartIndex = 0;
const BATCH_SIZE = 10; // Process 10 players per batch invocation
let totalMembersToProcess = 0;

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
    function updateStatus(message, isError = false) {
        const timestamp = new Date().toLocaleTimeString();
        updatesBox.innerHTML += `<p style="color:${isError ? '#ff4d4d' : '#eee'};"><strong>[${timestamp}]</strong> ${message}</p>`;
        updatesBox.scrollTop = updatesBox.scrollHeight; // Scroll to bottom
    }
    function clearStatus() {
        updatesBox.innerHTML = '<p>Status updates will appear here.</p>';
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
        clearStatus();
        dataDisplayArea.innerHTML = '';
        saveToFirebaseBtn.style.display = 'none'; // Ensure save button is hidden
    }

    /**
     * Recursively processes batches of players.
     */
    async function processNextBatch() {
        if (currentBatchStartIndex >= totalMembersToProcess) {
            updateStatus(`Batch processing complete for ${currentFactionName} (ID: ${currentFactionId}). All ${totalMembersToProcess} members attempted.`, false);
            console.log("Batch processing finished.");
            fetchFactionDataBtn.disabled = false; // Re-enable button
            return;
        }

        const currentBatch = currentFactionMembers.slice(currentBatchStartIndex, currentBatchStartIndex + BATCH_SIZE);
        const batchNumber = Math.floor(currentBatchStartIndex / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(totalMembersToProcess / BATCH_SIZE);

        updateStatus(`Processing batch ${batchNumber} of ${totalBatches} for ${currentFactionName} (ID: ${currentFactionId}). Players in this batch: ${currentBatch.length}. Total processed so far: ${currentBatchStartIndex}.`, false);
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
                currentBatchStartIndex = result.nextStartIndex;
                updateStatus(`Batch ${batchNumber} processed. Success: ${result.processedSummary.successCount}, Skipped: ${result.processedSummary.skippedCount}, Errors: ${result.processedSummary.errorCount}. Remaining: ${totalMembersToProcess - currentBatchStartIndex}.`, false);

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

            updateStatus(`Step 1/2: Fetching all members for Faction ID: ${currentFactionId} from Torn API...`);
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

                    updateStatus(`Step 1/2 Complete: Found ${totalMembersToProcess} members for ${currentFactionName}. Starting batch processing (Step 2/2)...`, false);
                    setTimeout(processNextBatch, 500); // Start processing first batch after slight delay
                } else {
                    updateStatus(`Step 1/2 Complete: No members found for Faction ID ${currentFactionId}. Check faction ID.`, true);
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