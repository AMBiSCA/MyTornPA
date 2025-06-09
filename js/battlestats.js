// This is your battlestats.js file

document.addEventListener('DOMContentLoaded', () => {
    // Get button references
    const checkBattleStatsButton = document.getElementById('checkBattleStats');
    const fetchFactionStatsButton = document.getElementById('fetchFactionStats');
    const tornStatsApiKeyErrorDiv = document.getElementById('tornStatsApiKeyError'); // Get new error div
    const downloadDataBtn = document.getElementById('downloadDataBtn'); // Get the download button

    // Initial state: disable buttons
    if (checkBattleStatsButton) checkBattleStatsButton.disabled = true;
    if (fetchFactionStatsButton) fetchFactionStatsButton.disabled = true;
    // REMOVED: Initial 'Checking login status...' message
    // The API key and button status will be handled by the onAuthStateChanged listener below.

    // Firebase Auth state listener to enable/disable buttons and manage API key fetching
    // Ensure 'auth' and 'db' are available from firebase-init.js (loaded before this script)
    if (typeof auth !== 'undefined' && typeof db !== 'undefined') { 
        auth.onAuthStateChanged(async function(user) { 
            if (user) {
                console.log("User is signed in on battlestats.js:", user.uid);
                // Attempt to fetch API key from Firestore immediately upon login
                try {
                    const userDocRef = db.collection('userProfiles').doc(user.uid);
                    const userDoc = await userDocRef.get(); 

                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        // CORRECTED: Fetching tornStatsAPIKey with exact casing from Firestore
                        const storedTornStatsApiKey = userData.tornStatsApiKey; 
                        
                        // DEBUG LOGS - Keep these to verify the fix!
                        console.log("DEBUG BATTLESTATS: Value of storedTornStatsApiKey retrieved from Firestore:", storedTornStatsApiKey);
                        console.log("DEBUG BATTLESTATS: Type of storedTornStatsApiKey:", typeof storedTornStatsApiKey);
                        console.log("DEBUG BATTLESTATS: Is storedTornStatsApiKey truthy?", !!storedTornStatsApiKey);
                        // END DEBUG LOGS

                        if (storedTornStatsApiKey) {
                            // REMOVED: tornStatsApiKeyErrorDiv.textContent = 'TornStats API Key automatically retrieved from your profile.';
                            if (tornStatsApiKeyErrorDiv) tornStatsApiKeyErrorDiv.textContent = ''; // Clear any previous error messages
                            
                            // Enable buttons and attach click handlers
                            if (checkBattleStatsButton) {
                                checkBattleStatsButton.disabled = false;
                                // Pass the retrieved TornStats API key
                                checkBattleStatsButton.onclick = () => handleIndividualCheck(user, storedTornStatsApiKey);
                            }
                            if (fetchFactionStatsButton) {
                                fetchFactionStatsButton.disabled = false;
                                // Pass the retrieved TornStats API key
                                fetchFactionStatsButton.onclick = () => handleFactionCheck(user, storedTornStatsApiKey);
                            }
                        } else {
                            // TornStats API key is missing or empty in Firestore
                            const message = 'Your TornStats API Key is not set in your profile. Please update your profile settings with a valid key.';
                            if (tornStatsApiKeyErrorDiv) tornStatsApiKeyErrorDiv.textContent = message;
                            showMainError(message); // Show prominent error
                            // Buttons remain disabled
                            if (checkBattleStatsButton) checkBattleStatsButton.disabled = true;
                            if (fetchFactionStatsButton) fetchFactionStatsButton.disabled = true;
                        }
                    } else {
                        // User profile document not found
                        const message = 'User profile not found in database. Please ensure your profile is set up.';
                        if (tornStatsApiKeyErrorDiv) tornStatsApiKeyErrorDiv.textContent = message;
                        showMainError(message); // Show prominent error
                        // Buttons remain disabled
                        if (checkBattleStatsButton) checkBattleStatsButton.disabled = true;
                        if (fetchFactionStatsButton) fetchFactionStatsButton.disabled = true;
                    }
                } catch (error) {
                    console.error("Error fetching TornStats API Key from profile on battlestats.js:", error);
                    const message = `Error fetching TornStats API Key from profile: ${error.message}. Please try again.`;
                    if (tornStatsApiKeyErrorDiv) tornStatsApiKeyErrorDiv.textContent = message;
                    showMainError(message); // Show prominent error
                    // Buttons remain disabled
                    if (checkBattleStatsButton) checkBattleStatsButton.disabled = true;
                    if (fetchFactionStatsButton) fetchFactionStatsButton.disabled = true;
                }
            } else {
                // User is signed out
                console.log("No user is signed in on battlestats.js.");
                if (tornStatsApiKeyErrorDiv) tornStatsApiKeyErrorDiv.textContent = 'Please sign in to use this feature.';
                // Ensure buttons are disabled and their handlers display login prompt
                if (checkBattleStatsButton) {
                    checkBattleStatsButton.disabled = true;
                    checkBattleStatsButton.onclick = () => showMainError('Please sign in to use this feature.');
                }
                if (fetchFactionStatsButton) {
                    fetchFactionStatsButton.disabled = true;
                    fetchFactionStatsButton.onclick = () => showMainError('Please sign in to use this feature.');
                }
            }
        });
    } else {
        // Firebase Auth or Firestore not initialized (should be caught by firebase-init.js errors)
        console.error("Firebase auth or Firestore not available for battlestats.js script.");
        const message = 'Firebase is not loaded. Cannot check login status. Please refresh the page.';
        if (tornStatsApiKeyErrorDiv) tornStatsApiKeyErrorDiv.textContent = message;
        showMainError(message);
    }
});

// Helper function to show a prominent error message (can be re-used from your existing common utils)
function showMainError(message) {
    if (!message || message.trim() === '') {
        const existingMainInputError = document.querySelector('.main-input-error-feedback');
        if (existingMainInputError) {
            existingMainInputError.remove();
        }
        return; // Exit if message is empty
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
    const containerDiv = document.querySelector('.faction-peeper-tool-container') || document.body; // Fallback to body if container not found
    // IMPORTANT: Changed selector to .peeper-tool-container for battlestats page
    const battleStatsContainerDiv = document.querySelector('.peeper-tool-container') || document.body;
    if (battleStatsContainerDiv) {
        // Try to insert after a logical element if possible, otherwise just append
        // This targets the specific input-group in battlestats.html
        const formContainer = document.querySelector('.stats-container'); // Assuming your main form inputs are in .stats-container
        if (formContainer && formContainer.parentNode) {
            formContainer.parentNode.insertBefore(mainPageStatus, formContainer.nextSibling);
        } else {
            battleStatsContainerDiv.appendChild(mainPageStatus);
        }
    }
    setTimeout(() => { if(mainPageStatus.parentElement) mainPageStatus.remove(); }, 7000);
}


function showLoadingSpinner() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.add('visible');
}
function hideLoadingSpinner() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.classList.remove('visible');
}
function showResultsModal() {
    const overlay = document.getElementById('resultsModalOverlay');
    if (overlay) overlay.classList.add('visible');
}
function closeResultsModal() {
    const overlay = document.getElementById('resultsModalOverlay');
    if (overlay) overlay.classList.remove('visible');
    const tableHeader = document.getElementById('modal-results-table-header');
    const tableBody = document.getElementById('modal-results-table-body');
    const modalTitle = document.querySelector('#resultsModalOverlay .modal-title');
    const modalSummary = document.querySelector('#resultsModalOverlay .modal-summary');
    if(tableHeader) tableHeader.innerHTML = '';
    if(tableBody) tableBody.innerHTML = '';
    if(modalTitle) modalTitle.textContent = 'Spy Report'; 
    if(modalSummary) modalSummary.innerHTML = ''; 
}

function formatBattleStat(num) {
    if (num === "N/A" || num === null || num === undefined || isNaN(Number(num))) return "N/A";
    const number = Number(num);
    if (Math.abs(number) >= 1e9) return (number / 1e9).toFixed(2) + 'b';
    if (Math.abs(number) >= 1e6) return (number / 1e6).toFixed(2) + 'm';
    if (Math.abs(number) >= 1e3) return (number / 1e3).toFixed(0) + 'k';
    return number.toLocaleString();
}

async function fetchApi(url) {
    const response = await fetch(url);
    if (!response.ok) {
        let errorData;
        try { errorData = await response.json(); } catch (e) { /* Not JSON */ }
        const errorMessage = errorData?.error?.message || errorData?.error || `API Error ${response.status}`;
        throw new Error(`${errorMessage.substring(0,150)}`);
    }
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text();
        try { return JSON.parse(responseText); } catch(e) {
            console.warn("Non-JSON response or parse error:", responseText.substring(0, 200));
            throw new Error(`Received unexpected response format. Content: ${responseText.substring(0,100)}`);
        }
    }
    return response.json();
}

function clearAllInputErrors() {
    const tornStatsApiKeyError = document.getElementById('tornStatsApiKeyError');
    if(tornStatsApiKeyError) tornStatsApiKeyError.textContent = '';
    
    const playerIdError = document.getElementById('playerIdError'); 
    if(playerIdError) playerIdError.textContent = '';
    
    const factionIdError = document.getElementById('factionIdError');
    if(factionIdError) factionIdError.textContent = '';

    const battleStatsResultsDiv = document.getElementById('battleStatsResults');
    if(battleStatsResultsDiv) battleStatsResultsDiv.textContent = '';
    const factionStatsResultsDiv = document.getElementById('factionStatsResults');
    if(factionStatsResultsDiv) factionStatsResultsDiv.textContent = '';
}

// NOTE: Modified to accept user and tornStatsApiKey
async function handleIndividualCheck(user, tornStatsApiKey) { 
    clearAllInputErrors();
    const targetPlayerId = document.getElementById('playerId').value.trim();
    const battleStatsResultsDiv = document.getElementById('battleStatsResults');
    const tornStatsApiKeyError = document.getElementById('tornStatsApiKeyError'); 
    
    let isValid = true;

    // Check if TornStats API key was provided
    if (!tornStatsApiKey) {
        const message = 'TornStats API Key not available. Please sign in or set your key in profile.';
        if(tornStatsApiKeyError) tornStatsApiKeyError.textContent = message;
        showMainError(message);
        isValid = false;
    }

    if (!targetPlayerId || isNaN(targetPlayerId)) {
        document.getElementById('playerIdError').textContent = 'Valid Target Profile ID is required.';
        isValid = false;
    }

    if (!isValid) return;
    if(battleStatsResultsDiv) battleStatsResultsDiv.textContent = 'Fetching...';
    let loadingTimeoutId = setTimeout(() => { showLoadingSpinner(); }, 1000);

    try {
        const url = `https://www.tornstats.com/api/v2/${tornStatsApiKey}/spy/user/${targetPlayerId}`; 
        const data = await fetchApi(url);
        if(battleStatsResultsDiv) battleStatsResultsDiv.textContent = ''; 

        const modalTitle = document.querySelector('#resultsModalOverlay .modal-title');
        const modalSummary = document.querySelector('#resultsModalOverlay .modal-summary');
        const tableHeader = document.getElementById('modal-results-table-header');
        const tableBody = document.getElementById('modal-results-table-body');

        if (modalTitle) modalTitle.textContent = 'Individual Spy Report';
        if (tableHeader) tableHeader.innerHTML = ''; 
        if (tableBody) tableBody.innerHTML = '';   

        if (!data.spy || data.spy.status === false || !data.spy.player_name) {
            const errorMessage = data.spy?.message || data.message || "No spy data available or key/ID invalid.";
            if (modalSummary) modalSummary.innerHTML = `User: <span>${targetPlayerId}</span> | Status: <span style="color: #ff4d4d;">${errorMessage}</span>`;
            displayErrorInModal(`No spy data for User ID ${targetPlayerId}. Reason: ${errorMessage}`);
        } else {
            const spy = data.spy;
            if (modalSummary) {
                modalSummary.innerHTML = `Player: <span>${spy.player_name || 'N/A'} [${targetPlayerId}]</span> | 
                                        Faction: <span>${spy.player_faction || 'N/A'}</span>`;
            }
            const headers = ["Stat", "Value"];
            const headerRow = document.createElement('tr');
            headers.forEach(h => { const th = document.createElement('th'); th.textContent = h; headerRow.appendChild(th); });
            if (tableHeader) tableHeader.appendChild(headerRow);

            const statsToShow = [
                { label: "Strength", value: formatBattleStat(spy.strength) },
                { label: "Defense", value: formatBattleStat(spy.defense) },
                { label: "Speed", value: formatBattleStat(spy.speed) },
                { label: "Dexterity", value: formatBattleStat(spy.dexterity) },
                { label: "Total Stats", value: formatBattleStat(spy.total) }
            ];
            statsToShow.forEach(s => { const tr = document.createElement('tr'); tr.insertCell().textContent = s.label; tr.insertCell().textContent = s.value; if (tableBody) tableBody.appendChild(tr); });
        }
        showResultsModal();
    } catch (error) {
        console.error("Individual Check Error:", error);
        if(battleStatsResultsDiv) battleStatsResultsDiv.textContent = `Error: ${error.message.substring(0,100)}`; 
        displayErrorInModal(`Error fetching individual spy data: ${error.message}`); 
    } finally {
        clearTimeout(loadingTimeoutId);
        hideLoadingSpinner();
    }
}

// NOTE: Modified to accept user and tornStatsApiKey
async function handleFactionCheck(user, tornStatsApiKey) { 
    clearAllInputErrors();
    const targetFactionId = document.getElementById('factionId').value.trim();
    const factionStatsResultsDiv = document.getElementById('factionStatsResults');
    const tornStatsApiKeyError = document.getElementById('tornStatsApiKeyError'); 


    let isValid = true;
    // Check if TornStats API key was provided
    if (!tornStatsApiKey) {
        const message = 'TornStats API Key not available. Please sign in or set your key in profile.';
        if(tornStatsApiKeyError) tornStatsApiKeyError.textContent = message;
        showMainError(message);
        isValid = false;
    }

    if (!targetFactionId || isNaN(targetFactionId)) {
        document.getElementById('factionIdError').textContent = 'Valid Target Faction ID is required.';
        isValid = false;
    }
    if (!isValid) return;
    if(factionStatsResultsDiv) factionStatsResultsDiv.textContent = 'Fetching faction members...';
    let loadingTimeoutId = setTimeout(() => { showLoadingSpinner(); }, 1000);

    try {
        const factionListUrl = `https://www.tornstats.com/api/v2/${tornStatsApiKey}/spy/faction/${targetFactionId}`; 
        const factionListData = await fetchApi(factionListUrl);
        if(factionStatsResultsDiv) factionStatsResultsDiv.textContent = ''; 

        const modalTitle = document.querySelector('#resultsModalOverlay .modal-title');
        const modalSummary = document.querySelector('#resultsModalOverlay .modal-summary');
        const tableHeader = document.getElementById('modal-results-table-header');
        const tableBody = document.getElementById('modal-results-table-body');

        if (modalTitle) modalTitle.textContent = 'Faction Spy Report';
        if (tableHeader) tableHeader.innerHTML = '';
        if (tableBody) tableBody.innerHTML = '';

        if (!factionListData.status || !factionListData.faction || !factionListData.faction.members || Object.keys(factionListData.faction.members).length === 0) {
            const errorMessage = factionListData.message || "No members found or invalid Faction ID/API Key.";
            if (modalSummary) modalSummary.innerHTML = `Faction: <span>${targetFactionId}</span> | Status: <span style="color: #ff4d4d;">${errorMessage}</span>`;
            displayErrorInModal(`Error with faction data: ${errorMessage} (Faction ID: ${targetFactionId})`);
            showResultsModal();
            return;
        }

        const factionName = factionListData.faction.name || `Faction ${targetFactionId}`;
        const members = factionListData.faction.members;
        const memberIds = Object.keys(members);
        const totalMembers = memberIds.length;
        let processedCount = 0;
        let successfulRetrievals = 0;

        if (modalSummary) {
            modalSummary.innerHTML = `Faction: <span>${factionName}</span> | 
Total Members: <span>${totalMembers}</span> | 
                                        Processed: <span id="modal-processed-count">0</span> |
                                        Successful: <span id="modal-successful-count">0</span>`;
        }
        const headers = ["Name", "ID", "Strength", "Defense", "Speed", "Dexterity", "Total"];
        const headerRow = document.createElement('tr');
        headers.forEach(h => { const th = document.createElement('th'); th.textContent = h; headerRow.appendChild(th); });
        if (tableHeader) tableHeader.appendChild(headerRow);
        showResultsModal(); 

        if(factionStatsResultsDiv) factionStatsResultsDiv.textContent = `Processing stats for ${totalMembers} members... (0%)`;
        
        const BATCH_SIZE = 5; 
        const DELAY_BETWEEN_BATCHES = 300; 

        for (let i = 0; i < totalMembers; i += BATCH_SIZE) {
            const batchMemberIds = memberIds.slice(i, i + BATCH_SIZE);
            
            const batchPromises = batchMemberIds.map(memberId => {
                const memberUrl = `https://www.tornstats.com/api/v2/${tornStatsApiKey}/spy/user/${memberId}`; 
                return fetchApi(memberUrl)
                    .then(data => ({ status_internal: 'fulfilled', memberId: memberId, data: data })) 
                    .catch(error => ({ status_internal: 'rejected', memberId: memberId, reason: error }));
            });

            const batchResults = await Promise.allSettled(batchPromises);

            for (const result of batchResults) {
                processedCount++;
                const percentComplete = totalMembers > 0 ? Math.round((processedCount / totalMembers) * 100) : 0;
                if(factionStatsResultsDiv) factionStatsResultsDiv.innerHTML = `Processing stats for ${totalMembers} members... (${percentComplete}%)`;

                const processedCountSpan = document.getElementById('modal-processed-count');
                if(processedCountSpan) processedCountSpan.textContent = processedCount;

                if (result.status === 'fulfilled' && result.value.status_internal === 'fulfilled') {
                    const { memberId, data: memberData } = result.value;
                    if (memberData.spy && memberData.spy.status !== false && memberData.spy.total !== undefined) {
                        successfulRetrievals++;
                        const spy = memberData.spy;
                        const tr = document.createElement('tr');
                        tr.insertCell().textContent = spy.player_name || members[memberId]?.name || 'N/A';
                        tr.insertCell().textContent = memberId;
                        tr.insertCell().textContent = formatBattleStat(spy.strength);
                        tr.insertCell().textContent = formatBattleStat(spy.defense);
                        tr.insertCell().textContent = formatBattleStat(spy.speed);
                        tr.insertCell().textContent = formatBattleStat(spy.dexterity);
                        tr.insertCell().textContent = formatBattleStat(spy.total);
                        if (tableBody) tableBody.appendChild(tr);
                    } else {
                        const tr = document.createElement('tr');
                        tr.insertCell().textContent = members[memberId]?.name || `User ${memberId}`;
                        tr.insertCell().textContent = memberId;
                        const noDataCell = tr.insertCell();
                        noDataCell.textContent = memberData.spy?.message || memberData.message || "No spy data";
                        noDataCell.colSpan = headers.length - 2;
                        noDataCell.style.color = "#aaa";
                        if (tableBody) tableBody.appendChild(tr);
                    }
                } else { 
                    const memberId = result.value?.memberId || (result.reason?.memberId || batchMemberIds[batchResults.indexOf(result)] || "Unknown ID");
                    const errorReason = result.value?.reason || result.reason;
                    const tr = document.createElement('tr');
                    tr.insertCell().textContent = members[memberId]?.name || `User ${memberId}`;
                    tr.insertCell().textContent = memberId;
                    const errorCell = tr.insertCell();
                    errorCell.textContent = `Error: ${String(errorReason).substring(0,50)}`;
                    errorCell.colSpan = headers.length - 2;
                    errorCell.style.color = "#ff4d4d";
                    if (tableBody) tableBody.appendChild(tr);
                    console.error(`Error fetching stats for member ${memberId}:`, errorReason);
                }
                const successfulCountSpan = document.getElementById('modal-successful-count');
                if(successfulCountSpan) successfulCountSpan.textContent = successfulRetrievals;
            }

            if (i + BATCH_SIZE < totalMembers) { 
                await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES)); 
            }
        }

        if(factionStatsResultsDiv) factionStatsResultsDiv.textContent = `Processed ${totalMembers} members. View results in modal.`;
         if (successfulRetrievals === 0 && totalMembers > 0) {
            displayErrorInModal(`Processed ${totalMembers} members for ${factionName}, but no spy data was successfully retrieved. Check API key permissions or member privacy settings.`);
        } else if (tableBody && tableBody.childElementCount === 0 && totalMembers > 0) { 
            displayErrorInModal(`No data could be displayed for faction ${factionName} despite processing members.`);
        }

    } catch (error) {
        console.error("Faction Check Error (Outer):", error); 
        if(factionStatsResultsDiv) factionStatsResultsDiv.textContent = `Error: ${error.message.substring(0,100)}`;
        displayErrorInModal(`Error fetching faction spy data: ${error.message}`);
    } finally {
        clearTimeout(loadingTimeoutId);
        hideLoadingSpinner();
    }
}

function displayErrorInModal(message) {
    const tableBody = document.getElementById('modal-results-table-body');
    const modalSummary = document.querySelector('#resultsModalOverlay .modal-summary');

    if (tableBody && tableBody.childElementCount === 0) { 
        tableBody.innerHTML = ''; 
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        const headerRow = document.getElementById('modal-results-table-header').querySelector('tr');
        const colSpan = headerRow ? headerRow.childElementCount : 1;
        td.colSpan = colSpan > 0 ? colSpan : 1;
        td.textContent = message;
        td.style.textAlign = 'center';
        td.style.color = '#ffcc00';
        td.style.padding = '20px';
        tr.appendChild(td);
        tableBody.appendChild(tr);
    } else if (modalSummary) { 
        const existingNotice = modalSummary.querySelector('.modal-notice-message');
        if (existingNotice) existingNotice.remove(); 

        const noticeDiv = document.createElement('div'); 
        noticeDiv.className = 'modal-notice-message'; 
        noticeDiv.style.color = '#ffcc00';
        noticeDiv.style.marginTop = '10px';
        noticeDiv.style.fontSize = '0.9em';
        noticeDiv.textContent = `Notice: ${message.substring(0,120)}`;
        modalSummary.appendChild(noticeDiv);
    }
}


    // BEGIN: Download Data Button Logic (html2canvas)
    if (downloadDataBtn) {
        downloadDataBtn.addEventListener('click', () => {
            const modalContent = document.querySelector('.modal-content'); // The full modal content area
            const tableContainer = document.querySelector('.modal-table-container'); 
            const modalTableBody = document.getElementById('modal-results-table-body'); // The actual table body with rows

            if (!modalContent || !tableContainer || !modalTableBody) {
                console.error('Error: Required modal elements not found for screenshot.');
                alert('Could not find the table to download. Please ensure data is loaded and the results modal is open.');
                return;
            }

            // Temporarily store original styles
            const originalModalContentMaxHeight = modalContent.style.maxHeight;
            const originalModalTableContainerMaxHeight = tableContainer.style.maxHeight;
            const originalModalTableContainerOverflow = tableContainer.style.overflowY;
            const originalScrollTop = tableContainer.scrollTop; // Save current scroll position

            // Apply temporary styles to capture full content
            modalContent.style.maxHeight = 'fit-content'; 
            tableContainer.style.maxHeight = 'fit-content'; 
            tableContainer.style.overflowY = 'visible'; 
            tableContainer.scrollTop = 0; // Scroll to the top to ensure the beginning of the table is captured

            // Adding a small delay to allow reflow and repaint before capturing
            setTimeout(() => {
                html2canvas(tableContainer, { // Capture the entire table container
                    scale: 2, // Increase resolution for better quality
                    useCORS: true, // Important if you have images (like background) loaded from different origins
                    logging: false, // Turn off console logging from html2canvas
                    allowTaint: true, // Allow images/backgrounds from same origin that might be "tainted" by canvas
                }).then(function(canvas) {
                    const link = document.createElement('a');
                    link.href = canvas.toDataURL('image/png'); 
                    
                    // Determine filename based on modal title if possible
                    const modalTitleEl = document.querySelector('#resultsModalOverlay .modal-title');
                    const baseFileName = modalTitleEl ? modalTitleEl.textContent.replace(/[^a-zA-Z0-9]/g, '_') : 'Battle_Stats_Data';
                    link.download = `${baseFileName}.png`; 
                    
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    console.log('Image download initiated.'); 

                    // Restore original styles immediately after capture
                    modalContent.style.maxHeight = originalModalContentMaxHeight;
                    tableContainer.style.maxHeight = originalModalTableContainerMaxHeight;
                    tableContainer.style.overflowY = originalModalTableContainerOverflow;
                    tableContainer.scrollTop = originalScrollTop; // Restore scroll position

                }).catch(error => {
                    console.error('Error generating image:', error);
                    alert('Failed to generate image. Please try again.');

                    // Ensure styles are restored even on error
                    modalContent.style.maxHeight = originalModalContentMaxHeight;
                    tableContainer.style.maxHeight = originalModalTableContainerMaxHeight;
                    tableContainer.style.overflowY = originalModalTableContainerOverflow;
                    tableContainer.scrollTop = originalScrollTop; // Restore scroll position
                });
            }, 100); // Small delay to allow CSS changes to apply and browser to render
        });
    }
    // END: Download Data Button Logic (html2canvas)

}); // End of DOMContentLoaded