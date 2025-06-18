document.addEventListener('DOMContentLoaded', () => {
    // Get button references
    // Corrected ID to match HTML: 'fetchTargetsBtn'
    const fetchMyTargetsButton = document.getElementById('fetchTargetsBtn'); 
    const fairFightApiKeyErrorDiv = document.getElementById('fairFightApiKeyError'); 
    const downloadDataBtn = document.getElementById('downloadDataBtn'); 

    // Initial state: disable button
    if (fetchMyTargetsButton) fetchMyTargetsButton.disabled = true; 

    // Firebase Auth state listener
    if (typeof auth !== 'undefined' && typeof db !== 'undefined') {
        auth.onAuthStateChanged(async function(user) {
            if (user) {
                console.log("User is signed in on fairfight.js:", user.uid);
                try {
                    const userDocRef = db.collection('userProfiles').doc(user.uid);
                    const userDoc = await userDocRef.get();

                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        const tornApiKey = userData.tornApiKey; 
                        const playerId = userData.tornId; 

                        console.log("DEBUG FAIRFIGHT: Value of tornApiKey retrieved from Firestore:", tornApiKey);
                        if (tornApiKey) {
                            if (fairFightApiKeyErrorDiv) fairFightApiKeyErrorDiv.textContent = ''; 
                            
                            if (fetchMyTargetsButton) { 
                                if (playerId) {
                                    fetchMyTargetsButton.disabled = false;
                                    fetchMyTargetsButton.onclick = () => handleMyTargetsCheck(user, tornApiKey, playerId);
                                } else {
                                    const message = 'Your Torn Player ID is not set in your profile. Cannot fetch recommended targets.';
                                    if (fairFightApiKeyErrorDiv) fairFightApiKeyErrorDiv.textContent = message;
                                    showMainError(message);
                                    fetchMyTargetsButton.disabled = true;
                                }
                            }

                        } else {
                            const message = 'Your Torn API Key is not set in your profile. Please update your profile settings with a valid key.';
                            if (fairFightApiKeyErrorDiv) fairFightApiKeyErrorDiv.textContent = message;
                            showMainError(message);
                            if (fetchMyTargetsButton) fetchMyTargetsButton.disabled = true;
                        }
                    } else {
                        const message = 'User profile not found in database. Please ensure your profile is set up.';
                        if (fairFightApiKeyErrorDiv) fairFightApiKeyErrorDiv.textContent = message;
                        showMainError(message);
                        if (fetchMyTargetsButton) fetchMyTargetsButton.disabled = true;
                    }
                } catch (error) {
                    console.error("Error fetching Torn API Key/ID from profile on fairfight.js:", error);
                    const message = `Error fetching API Key/ID from profile: ${error.message}. Please try again.`;
                    if (fairFightApiKeyErrorDiv) fairFightApiKeyErrorDiv.textContent = message;
                    showMainError(message);
                    if (fetchMyTargetsButton) fetchMyTargetsButton.disabled = true;
                }
            } else {
                // User is signed out
                console.log("No user is signed in on fairfight.js.");
                if (fairFightApiKeyErrorDiv) fairFightApiKeyErrorDiv.textContent = 'Please sign in to use this feature.';
                
                if (fetchMyTargetsButton) { 
                    fetchMyTargetsButton.disabled = true;
                    fetchMyTargetsButton.onclick = () => showMainError('Please sign in to use this feature.');
                }
            }
        });
    } else {
        console.error("Firebase auth or Firestore not available for fairfight.js script.");
        const message = 'Firebase is not loaded. Cannot check login status. Please refresh the page.';
        if (fairFightApiKeyErrorDiv) fairFightApiKeyErrorDiv.textContent = message;
        showMainError(message);
    }

    // BEGIN: Download Data Button Logic (html2canvas) - Copied from factionpeeper.js
    if (downloadDataBtn) {
        downloadDataBtn.addEventListener('click', () => {
            const modalContent = document.querySelector('.modal-content'); 
            const tableContainer = document.querySelector('.modal-table-container');
            const modalTableBody = document.getElementById('modal-results-table-body'); 

            if (!modalContent || !tableContainer || !modalTableBody) {
                console.error('Error: Required modal elements not found for screenshot.');
                alert('Could not find the table to download. Please ensure data is loaded and the results modal is open.');
                return;
            }

            // Temporarily store original styles
            const originalModalContentMaxHeight = modalContent.style.maxHeight;
            const originalModalTableContainerMaxHeight = tableContainer.style.maxHeight;
            const originalModalTableContainerOverflow = tableContainer.style.overflowY;
            const originalScrollTop = tableContainer.scrollTop; 

            // Apply temporary styles to capture full content
            modalContent.style.maxHeight = 'fit-content';
            tableContainer.style.maxHeight = 'fit-content';
            tableContainer.style.overflowY = 'visible';
            tableContainer.scrollTop = 0; 

            // Adding a small delay to allow reflow and repaint before capturing
            setTimeout(() => {
                html2canvas(tableContainer, { 
                    scale: 2, 
                    useCORS: true, 
                    logging: false, 
                    allowTaint: true, 
                }).then(function(canvas) {
                    const link = document.createElement('a');
                    link.href = canvas.toDataURL('image/png');
                    
                    const modalTitleEl = document.querySelector('#resultsModalOverlay .modal-title');
                    const baseFileName = modalTitleEl ? modalTitleEl.textContent.replace(/[^a-zA-Z0-9]/g, '_') : 'Fair_Fight_Data';
                    link.download = `${baseFileName}.png`;
                    
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    console.log('Image download initiated.');

                    // Restore original styles immediately after capture
                    modalContent.style.maxHeight = originalModalContentMaxHeight;
                    tableContainer.style.maxHeight = originalModalTableContainerMaxHeight;
                    tableContainer.style.overflowY = originalModalTableContainerOverflow;
                    tableContainer.scrollTop = originalScrollTop; 

                }).catch(error => {
                    console.error('Error generating image:', error);
                    alert('Failed to generate image. Please try again.');

                    // Ensure styles are restored even on error
                    modalContent.style.maxHeight = originalModalContentMaxHeight;
                    tableContainer.style.maxHeight = originalModalTableContainerMaxHeight;
                    tableContainer.style.overflowY = originalModalTableContainerOverflow;
                    tableContainer.scrollTop = originalScrollTop; 
                });
            }, 100); 
        });
    }
}); 


function clearAllInputErrors() {
    // Removed individual and faction specific error clearing.
    const myTargetsResults = document.getElementById('myTargetsResults');
    if(myTargetsResults) myTargetsResults.textContent = '';
}