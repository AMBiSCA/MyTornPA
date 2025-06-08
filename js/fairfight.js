// mysite/js/fairfight.js

// Constants specific to Fair Fight display (copied from original UserScript, adapted)
const FF_VERSION = "MyTornPA-FF-1.0"; // Custom version for your website
// Assuming these images are in mysite/images/
const BLUE_ARROW = "../images/blue-arrow.svg";
const GREEN_ARROW = "../images/green-arrow.svg";
const RED_ARROW = "../images/red-arrow.svg";

// Color utility functions (copied from original UserScript)
function rgbToHex(r, g, b) {
    return (
        "#" +
        ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
    );
}

function get_ff_colour(value) {
    let r, g, b;
    if (value <= 1) {
        r = 0x28; g = 0x28; b = 0xc6; // Blue
    } else if (value <= 3) {
        const t = (value - 1) / 2;
        r = 0x28; g = Math.round(0x28 + (0xc6 - 0x28) * t); b = Math.round(0xc6 - (0xc6 - 0x28) * t);
    } else if (value <= 5) {
        const t = (value - 3) / 2;
        r = Math.round(0x28 + (0xc6 - 0x28) * t); g = Math.round(0xc6 - (0xc6 - 0x28) * t); b = 0x28;
    } else {
        r = 0xc6; g = 0x28; b = 0x28; // Red
    }
    return rgbToHex(r, g, b);
}

function get_contrast_color(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = r * 0.299 + g * 0.587 + b * 0.114;
    return brightness > 126 ? "black" : "white";
}

function get_difficulty_text(ff) {
    if (ff <= 1) return "Extremely easy";
    else if (ff <= 2) return "Easy";
    else if (ff <= 3.5) return "Moderately difficult";
    else if (ff <= 4.5) return "Difficult";
    else return "May be impossible";
}

// Utility for formatting numbers (already in battlestats.js, just moving it up for clarity)
function formatNumber(num) {
    if (num === "N/A" || num === null || num === undefined || isNaN(Number(num))) return "N/A";
    const number = Number(num);
    if (Math.abs(number) >= 1e9) return (number / 1e9).toFixed(2) + 'b';
    if (Math.abs(number) >= 1e6) return (number / 1e6).toFixed(2) + 'm';
    if (Math.abs(number) >= 1e3) return (number / 1e3).toFixed(0) + 'k';
    return number.toLocaleString();
}


document.addEventListener('DOMContentLoaded', () => {
    // Get button references
    const fetchIndividualFFButton = document.getElementById('fetchIndividualFF');
    const fetchFactionFFButton = document.getElementById('fetchFactionFF');
    const generateRandomTargetsBtn = document.getElementById('generateRandomTargetsBtn'); // New button
    const fairFightApiKeyErrorDiv = document.getElementById('fairFightApiKeyError');
    const downloadDataBtn = document.getElementById('downloadDataBtn');

    // State variables
    let currentUserTornApiKey = null;
    let currentUserLevel = null; // To store the logged-in user's level
    let currentUserId = null; // To store the logged-in user's ID

    // Initial state: disable buttons
    if (fetchIndividualFFButton) fetchIndividualFFButton.disabled = true;
    if (fetchFactionFFButton) fetchFactionFFButton.disabled = true;
    if (generateRandomTargetsBtn) generateRandomTargetsBtn.disabled = true;

    // Firebase Auth state listener
    if (typeof auth !== 'undefined' && typeof db !== 'undefined') {
        auth.onAuthStateChanged(async function(user) {
            if (user) {
                console.log("User is signed in on fairfight.js:", user.uid);
                currentUserId = user.uid; // Store user ID

                try {
                    const userDocRef = db.collection('userProfiles').doc(user.uid);
                    const userDoc = await userDocRef.get();

                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        const tornApiKey = userData.tornApiKey;
                        const userLevel = userData.userLevel; // Assuming userLevel is stored in Firestore

                        console.log("DEBUG FAIRFIGHT: Value of tornApiKey retrieved from Firestore:", tornApiKey);
                        console.log("DEBUG FAIRFIGHT: Value of userLevel retrieved from Firestore:", userLevel);

                        if (tornApiKey) {
                            currentUserTornApiKey = tornApiKey; // Store for global use
                            // If userLevel is not directly in profile, fetch it now
                            if (!userLevel) {
                                console.log("User level not found in profile, attempting to fetch from Torn API.");
                                try {
                                    const response = await fetch(`https://api.torn.com/user/?selections=basic&key=${tornApiKey}`);
                                    const data = await response.json();
                                    if (data.level) {
                                        currentUserLevel = data.level;
                                        // Optionally, save it back to Firestore for future use
                                        await userDocRef.update({ userLevel: data.level });
                                        console.log("Fetched and saved user level:", currentUserLevel);
                                    } else {
                                        console.warn("Could not fetch user level from Torn API:", data.error?.message || "Unknown error");
                                        showMainError("Could not retrieve your Torn level. Some features might be limited.");
                                    }
                                } catch (fetchError) {
                                    console.error("Error fetching user level from Torn API:", fetchError);
                                    showMainError("Failed to fetch your Torn level. Please check your API key and try again.");
                                }
                            } else {
                                currentUserLevel = userLevel;
                            }

                            if (fairFightApiKeyErrorDiv) fairFightApiKeyErrorDiv.textContent = ''; // Clear any previous error messages
                            
                            // Enable buttons
                            if (fetchIndividualFFButton) {
                                fetchIndividualFFButton.disabled = false;
                                fetchIndividualFFButton.onclick = () => handleIndividualFFCheck(user, currentUserTornApiKey);
                            }
                            if (fetchFactionFFButton) {
                                fetchFactionFFButton.disabled = false;
                                fetchFactionFFButton.onclick = () => handleFactionFFCheck(user, currentUserTornApiKey);
                            }
                            if (generateRandomTargetsBtn) {
                                generateRandomTargetsBtn.disabled = false;
                                generateRandomTargetsBtn.onclick = () => handleGenerateRandomTargets(user, currentUserTornApiKey, currentUserLevel, currentUserId);
                            }
                        } else {
                            const message = 'Your Torn API Key is not set in your profile. Please update your profile settings with a valid key.';
                            if (fairFightApiKeyErrorDiv) fairFightApiKeyErrorDiv.textContent = message;
                            showMainError(message);
                            if (fetchIndividualFFButton) fetchIndividualFFButton.disabled = true;
                            if (fetchFactionFFButton) fetchFactionFFButton.disabled = true;
                            if (generateRandomTargetsBtn) generateRandomTargetsBtn.disabled = true;
                        }
                    } else {
                        const message = 'User profile not found in database. Please ensure your profile is set up.';
                        if (fairFightApiKeyErrorDiv) fairFightApiKeyErrorDiv.textContent = message;
                        showMainError(message);
                        if (fetchIndividualFFButton) fetchIndividualFFButton.disabled = true;
                        if (fetchFactionFFButton) fetchFactionFFButton.disabled = true;
                        if (generateRandomTargetsBtn) generateRandomTargetsBtn.disabled = true;
                    }
                } catch (error) {
                    console.error("Error fetching Torn API Key/Level from profile on fairfight.js:", error);
                    const message = `Error fetching API Key/Level from profile: ${error.message}. Please try again.`;
                    if (fairFightApiKeyErrorDiv) fairFightApiKeyErrorDiv.textContent = message;
                    showMainError(message);
                    if (fetchIndividualFFButton) fetchIndividualFFButton.disabled = true;
                    if (fetchFactionFFButton) fetchFactionFFButton.disabled = true;
                    if (generateRandomTargetsBtn) generateRandomTargetsBtn.disabled = true;
                }
            } else {
                // User is signed out
                console.log("No user is signed in on fairfight.js.");
                if (fairFightApiKeyErrorDiv) fairFightApiKeyErrorDiv.textContent = 'Please sign in to use this feature.';
                
                if (fetchIndividualFFButton) {
                    fetchIndividualFFButton.disabled = true;
                    fetchIndividualFFButton.onclick = () => showMainError('Please sign in to use this feature.');
                }
                if (fetchFactionFFButton) {
                    fetchFactionFFButton.disabled = true;
                    fetchFactionFFButton.onclick = () => showMainError('Please sign in to use this feature.');
                }
                if (generateRandomTargetsBtn) { // Disable new button as well
                    generateRandomTargetsBtn.disabled = true;
                    generateRandomTargetsBtn.onclick = () => showMainError('Please sign in to use this feature.');
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


// Helper function to show a prominent error message (can be re-used from your existing common utils)
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
    // Adjusted selector to peeper-tool-container for this page
    const containerDiv = document.querySelector('.peeper-tool-container') || document.body;
    if (containerDiv) {
        const formContainer = document.querySelector('.stats-container');
        if (formContainer && formContainer.parentNode) {
            formContainer.parentNode.insertBefore(mainPageStatus, formContainer.nextSibling);
        } else {
            containerDiv.appendChild(mainPageStatus);
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

// Global scope, not in DOMContentLoaded, to ensure it's accessible by onclick on the close button
function closeResultsModal() {
    const overlay = document.getElementById('resultsModalOverlay');
    if (overlay) overlay.classList.remove('visible');
    const tableHeader = document.getElementById('modal-results-table-header');
    const tableBody = document.getElementById('modal-results-table-body');
    const modalTitle = document.querySelector('#resultsModalOverlay .modal-title');
    const modalSummary = document.querySelector('#resultsModalOverlay .modal-summary');
    if(tableHeader) tableHeader.innerHTML = '';
    if(tableBody) tableBody.innerHTML = '';
    if(modalTitle) modalTitle.textContent = 'Fair Fight Report'; // Default title for this modal
    if(modalSummary) modalSummary.innerHTML = ''; 
}

// Function to clear all input errors (adapted from battlestats.js)
function clearAllInputErrors() {
    const playerIdError = document.getElementById('playerIdError');
    if(playerIdError) playerIdError.textContent = '';
    const factionIdError = document.getElementById('factionIdError');
    if(factionIdError) factionIdError.textContent = '';
    const individualFFResults = document.getElementById('individualFFResults');
    if(individualFFResults) individualFFResults.textContent = '';
    const factionFFResults = document.getElementById('factionFFResults');
    if(factionFFResults) factionFFResults.textContent = '';
    const randomTargetsStatus = document.getElementById('randomTargetsStatus'); // Clear new status div
    if(randomTargetsStatus) randomTargetsStatus.textContent = '';
    showMainError(''); // Clear main errors
}


// --- Main Handlers for Fetching Fair Fight Data ---

// Handles individual player FF data check
async function handleIndividualFFCheck(user, tornApiKey) {
    clearAllInputErrors();
    const playerId = document.getElementById('playerId').value.trim();
    const individualFFResultsDiv = document.getElementById('individualFFResults');

    let isValid = true;
    if (!playerId || isNaN(playerId)) {
        document.getElementById('playerIdError').textContent = 'Valid Player ID is required.';
        isValid = false;
    }
    if (!tornApiKey) {
        if (fairFightApiKeyErrorDiv) fairFightApiKeyErrorDiv.textContent = 'Torn API Key not available. Please sign in or set your key in profile.';
        showMainError('Torn API Key not available. Please sign in or set your key in profile.');
        isValid = false;
    }

    if (!isValid) return;
    if(individualFFResultsDiv) individualFFResultsDiv.textContent = 'Fetching Fair Fight data...';
    let loadingTimeoutId = setTimeout(() => { showLoadingSpinner(); }, 1000);

    try {
        // Call your Netlify Function, passing necessary parameters
        const functionUrl = `/.netlify/functions/fetch-fairfight-data?type=player&id=${playerId}&apiKey=${tornApiKey}`;
        const response = await fetch(functionUrl);
        const data = await response.json();

        if (!response.ok) { // Check if the function itself returned an error status
            throw new Error(data.error || `Netlify Function Error: ${response.status}`);
        }
        if (data.error) { // Check for custom errors from the function's body
            throw new Error(data.error);
        }

        if(individualFFResultsDiv) individualFFResultsDiv.textContent = '';

        const modalTitle = document.querySelector('#resultsModalOverlay .modal-title');
        const modalSummary = document.querySelector('#resultsModalOverlay .modal-summary');
        const tableHeader = document.getElementById('modal-results-table-header');
        const tableBody = document.getElementById('modal-results-table-body');

        if (modalTitle) modalTitle.textContent = 'Individual Fair Fight Report';
        if (tableHeader) tableHeader.innerHTML = '';
        if (tableBody) tableBody.innerHTML = '';

        if (!data.fair_fight) { // No Fair Fight data returned for the player
            if (modalSummary) modalSummary.innerHTML = `Player: <span>${playerId}</span> | Status: <span style="color: #ff4d4d;">No Fair Fight data available.</span>`;
            displayErrorInModal(`No Fair Fight data for Player ID ${playerId}. It might be unspied or unavailable.`);
        } else {
            const ff_score = data.fair_fight;
            const difficulty = get_difficulty_text(ff_score);
            const background_colour = get_ff_colour(ff_score);
            const text_colour = get_contrast_color(background_colour);
            const last_updated_seconds = data.last_updated; // Unix timestamp in seconds
            const last_updated_ms = last_updated_seconds * 1000;
            const now_ms = Date.now();
            const age_seconds = (now_ms - last_updated_ms) / 1000;

            let fresh = "";
            if (age_seconds < 24 * 60 * 60) {
                fresh = ""; // Less than 1 day old, no "age" shown
            } else if (age_seconds < 31 * 24 * 60 * 60) {
                var days = Math.round(age_seconds / (24 * 60 * 60));
                fresh = days === 1 ? "(1 day old)" : `(${days} days old)`;
            } else if (age_seconds < 365 * 24 * 60 * 60) {
                var months = Math.round(age_seconds / (31 * 24 * 60 * 60));
                fresh = months === 1 ? "(1 month old)" : `(${months} months old)`;
            } else {
                var years = Math.round(age_seconds / (365 * 24 * 60 * 60));
                fresh = years === 1 ? "(1 year old)" : `(${years} years old)`;
            }

            const ff_string = ff_score.toFixed(2);
            let statDetails = "";
            if (data.bs_estimate_human) {
                statDetails = `<span style="font-size: 11px; font-weight: normal; margin-left: 8px; vertical-align: middle; color: #cccccc; font-style: italic;">Est. Stats: <span>${data.bs_estimate_human}</span></span>`;
            }

            if (modalSummary) {
                modalSummary.innerHTML = `Player: <span>${data.player_name || 'N/A'} [${playerId}]</span> | 
                                            FairFight: <span style="background: ${background_colour}; color: ${text_colour}; padding: 2px 6px; border-radius: 4px; display: inline-block;">${ff_string} (${difficulty}) ${fresh}</span>${statDetails}`;
            }

            // Populate table with detailed FF stats
            const headers = ["Stat", "Value"];
            const headerRow = document.createElement('tr');
            headers.forEach(h => { const th = document.createElement('th'); th.textContent = h; headerRow.appendChild(th); });
            if (tableHeader) tableHeader.appendChild(headerRow);

            const statsToShow = [
                { label: "Fair Fight Score", value: ff_string },
                { label: "Difficulty", value: difficulty },
                { label: "Last Updated", value: new Date(last_updated_ms).toLocaleString() },
                { label: "Estimated Battle Stats", value: data.bs_estimate_human || "N/A" },
            ];
            statsToShow.forEach(s => { 
                const tr = document.createElement('tr'); 
                tr.insertCell().textContent = s.label; 
                tr.insertCell().textContent = s.value; 
                if (tableBody) tableBody.appendChild(tr); 
            });
        }
        showResultsModal();

    } catch (error) {
        console.error("Individual Fair Fight Check Error:", error);
        if(individualFFResultsDiv) individualFFResultsDiv.textContent = `Error: ${error.message.substring(0,100)}`;
        displayErrorInModal(`Error fetching individual Fair Fight data: ${error.message}`);
    } finally {
        clearTimeout(loadingTimeoutId);
        hideLoadingSpinner();
    }
}


// Handles faction-wide FF data check
async function handleFactionFFCheck(user, tornApiKey) {
    clearAllInputErrors();
    const factionId = document.getElementById('factionId').value.trim();
    const factionFFResultsDiv = document.getElementById('factionFFResults');

    let isValid = true;
    if (!factionId || isNaN(factionId)) {
        document.getElementById('factionIdError').textContent = 'Valid Faction ID is required.';
        isValid = false;
    }
    if (!tornApiKey) {
        if (fairFightApiKeyErrorDiv) fairFightApiKeyErrorDiv.textContent = 'Torn API Key not available. Please sign in or set your key in profile.';
        showMainError('Torn API Key not available. Please sign in or set your key in profile.');
        isValid = false;
    }

    if (!isValid) return;
    if(factionFFResultsDiv) factionFFResultsDiv.textContent = 'Fetching faction members and Fair Fight data...';
    let loadingTimeoutId = setTimeout(() => { showLoadingSpinner(); }, 1000);

    try {
        // Call your Netlify Function for faction data
        const functionUrl = `/.netlify/functions/fetch-fairfight-data?type=faction&id=${factionId}&apiKey=${tornApiKey}`;
        const response = await fetch(functionUrl);
        const data = await response.json();

        if (!response.ok) { // Check if the function itself returned an error status
            throw new Error(data.error || `Netlify Function Error: ${response.status}`);
        }
        if (data.error) { // Check for custom errors from the function's body
            throw new Error(data.error);
        }

        if(factionFFResultsDiv) factionFFResultsDiv.textContent = '';

        const modalTitle = document.querySelector('#resultsModalOverlay .modal-title');
        const modalSummary = document.querySelector('#resultsModalOverlay .modal-summary');
        const tableHeader = document.getElementById('modal-results-table-header');
        const tableBody = document.getElementById('modal-results-table-body');

        if (modalTitle) modalTitle.textContent = `Faction Fair Fight Report: ${data.faction_name || 'N/A'}`;
        if (tableHeader) tableHeader.innerHTML = '';
        if (tableBody) tableBody.innerHTML = '';

        if (!data.members || data.members.length === 0) {
            if (modalSummary) modalSummary.innerHTML = `Faction: <span>${data.faction_name || factionId}</span> | Status: <span style="color: #ff4d4d;">No members found or no Fair Fight data available for them.</span>`;
            displayErrorInModal(`No Fair Fight data for Faction ID ${factionId}. It might be empty or members are unspied.`);
        } else {
            if (modalSummary) {
                modalSummary.innerHTML = `Faction: <span>${data.faction_name || factionId}</span> | 
                                            Total Members: <span>${data.members.length}</span> | 
                                            Fair Fight data for members below.`;
            }

            const headers = ["Name", "ID", "Fair Fight", "Difficulty", "Est. Stats", "Last Updated", "Torn Profile"];
            const headerRow = document.createElement('tr');
            headers.forEach(h => { const th = document.createElement('th'); th.textContent = h; headerRow.appendChild(th); });
            if (tableHeader) tableHeader.appendChild(headerRow);

            data.members.forEach(member => {
                const tr = document.createElement('tr');
                tr.insertCell().textContent = member.name || member.id;
                tr.insertCell().textContent = member.id;

                if (member.ff_data && member.ff_data.fair_fight) {
                    const ff_score = member.ff_data.fair_fight;
                    const ff_string = ff_score.toFixed(2);
                    const difficulty = get_difficulty_text(ff_score);
                    const background_colour = get_ff_colour(ff_score);
                    const text_colour = get_contrast_color(background_colour);
                    const last_updated_ms = member.ff_data.last_updated * 1000;
                    const age_seconds = (Date.now() - last_updated_ms) / 1000;

                    let fresh = "";
                    if (age_seconds < 24 * 60 * 60) { fresh = ""; } // Less than 1 day old
                    else if (age_seconds < 31 * 24 * 60 * 60) { var days = Math.round(age_seconds / (24 * 60 * 60)); fresh = days === 1 ? "(1 day old)" : `(${days} days old)`; }
                    else if (age_seconds < 365 * 24 * 60 * 60) { var months = Math.round(age_seconds / (31 * 24 * 60 * 60)); fresh = months === 1 ? "(1 month old)" : `(${months} months old)`; }
                    else { var years = Math.round(age_seconds / (365 * 24 * 60 * 60)); fresh = years === 1 ? "(1 year old)" : `(${years} years old)`; }

                    const ffCell = tr.insertCell();
                    ffCell.style.backgroundColor = background_colour;
                    ffCell.style.color = text_colour;
                    ffCell.style.fontWeight = 'bold';
                    ffCell.textContent = `${ff_string} ${fresh}`;
                    
                    tr.insertCell().textContent = difficulty;
                    tr.insertCell().textContent = member.ff_data.bs_estimate_human || "N/A";
                    tr.insertCell().textContent = new Date(last_updated_ms).toLocaleString();
                    
                    const tornProfileLink = document.createElement('a');
                    tornProfileLink.href = `https://www.torn.com/profiles.php?XID=${member.id}`;
                    tornProfileLink.textContent = `[${member.id}]`;
                    tornProfileLink.target = "_blank"; // Open in new tab
                    tornProfileLink.rel = "noopener noreferrer";
                    tr.insertCell().appendChild(tornProfileLink);

                } else {
                    const noDataCell = tr.insertCell();
                    noDataCell.textContent = member.ff_data?.message || "No FF data";
                    noDataCell.colSpan = headers.length - 2; // Span across remaining columns
                    noDataCell.style.color = "#aaa";
                    noDataCell.style.fontStyle = "italic";
                    
                    // Still provide link to Torn profile if no FF data
                    const tornProfileLink = document.createElement('a');
                    tornProfileLink.href = `https://www.torn.com/profiles.php?XID=${member.id}`;
                    tornProfileLink.textContent = `[${member.id}]`;
                    tornProfileLink.target = "_blank"; // Open in new tab
                    tornProfileLink.rel = "noopener noreferrer";
                    tr.insertCell().appendChild(tornProfileLink);
                }
                if (tableBody) tableBody.appendChild(tr);
            });
        }
        showResultsModal();

    } catch (error) {
        console.error("Faction Fair Fight Check Error:", error);
        if(factionFFResultsDiv) factionFFResultsDiv.textContent = `Error: ${error.message.substring(0,100)}`;
        displayErrorInModal(`Error fetching faction Fair Fight data: ${error.message}`);
    } finally {
        clearTimeout(loadingTimeoutId);
        hideLoadingSpinner();
    }
}

// --- New Function: Handle Generating Random Targets ---
async function handleGenerateRandomTargets(user, tornApiKey, userLevel, currentUserId) {
    clearAllInputErrors(); // Clear all existing error messages
    const randomTargetsStatusDiv = document.getElementById('randomTargetsStatus');
    
    if (!tornApiKey) {
        const message = 'Torn API Key not available. Please sign in or set your key in profile.';
        if (randomTargetsStatusDiv) randomTargetsStatusDiv.textContent = message;
        showMainError(message);
        return;
    }
    if (!userLevel) {
        const message = 'Your Torn level could not be determined. Please ensure your profile is updated or check your API key.';
        if (randomTargetsStatusDiv) randomTargetsStatusDiv.textContent = message;
        showMainError(message);
        return;
    }
    if (!currentUserId) {
        const message = 'Your user ID is not available. Please sign in again.';
        if (randomTargetsStatusDiv) randomTargetsStatusDiv.textContent = message;
        showMainError(message);
        return;
    }

    if (randomTargetsStatusDiv) randomTargetsStatusDiv.textContent = 'Generating random targets, please wait...';
    let loadingTimeoutId = setTimeout(() => { showLoadingSpinner(); }, 1000);

    try {
        // Pass your current level and ID to the Netlify function for dynamic filtering
        const functionUrl = `/.netlify/functions/generate-random-targets?apiKey=${tornApiKey}&userLevel=${userLevel}&selfId=${currentUserId}&numTargets=10&minFairFight=2.5&maxFairFight=4.0&maxDaysInactive=365`;
        
        const response = await fetch(functionUrl);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `Netlify Function Error: ${response.status}`);
        }
        if (data.error) {
            throw new Error(data.error);
        }

        if(randomTargetsStatusDiv) randomTargetsStatusDiv.textContent = ''; // Clear status

        const modalTitle = document.querySelector('#resultsModalOverlay .modal-title');
        const modalSummary = document.querySelector('#resultsModalOverlay .modal-summary');
        const tableHeader = document.getElementById('modal-results-table-header');
        const tableBody = document.getElementById('modal-results-table-body');

        if (modalTitle) modalTitle.textContent = 'Generated Fair Fight Targets';
        if (tableHeader) tableHeader.innerHTML = '';
        if (tableBody) tableBody.innerHTML = '';

        if (!data.targets || data.targets.length === 0) {
            if (modalSummary) modalSummary.innerHTML = `Status: <span style="color: #f39c12;">No targets found matching your criteria. Try again or adjust settings.</span>`;
            displayErrorInModal('No suitable targets found after many attempts. Try adjusting criteria.');
        } else {
            if (modalSummary) {
                modalSummary.innerHTML = `Found <span>${data.targets.length}</span> potential targets based on your preferences (Level ${userLevel}).`;
            }

            const headers = ["Name", "ID", "Level", "Fair Fight", "Difficulty", "Est. Stats", "Last Active", "Torn Profile"];
            const headerRow = document.createElement('tr');
            headers.forEach(h => { const th = document.createElement('th'); th.textContent = h; headerRow.appendChild(th); });
            if (tableHeader) tableHeader.appendChild(headerRow);

            data.targets.forEach(target => {
                const tr = document.createElement('tr');
                tr.insertCell().textContent = target.name || 'N/A';
                tr.insertCell().textContent = target.id;
                tr.insertCell().textContent = target.level;

                const ff_score = target.fair_fight_data.fair_fight;
                const ff_string = ff_score.toFixed(2);
                const difficulty = get_difficulty_text(ff_score);
                const background_colour = get_ff_colour(ff_score);
                const text_colour = get_contrast_color(background_colour);
                
                const ffCell = tr.insertCell();
                ffCell.style.backgroundColor = background_colour;
                ffCell.style.color = text_colour;
                ffCell.style.fontWeight = 'bold';
                ffCell.textContent = ff_string;
                
                tr.insertCell().textContent = difficulty;
                tr.insertCell().textContent = target.fair_fight_data.bs_estimate_human || "N/A";
                
                // Format last active time nicely
                const lastActionTimestamp = target.last_action.timestamp;
                const nowSeconds = Math.floor(Date.now() / 1000);
                const ageSeconds = nowSeconds - lastActionTimestamp;
                let lastActiveText;

                if (ageSeconds < 60) {
                    lastActiveText = `${ageSeconds}s ago`;
                } else if (ageSeconds < 3600) {
                    lastActiveText = `${Math.floor(ageSeconds / 60)}m ago`;
                } else if (ageSeconds < 86400) {
                    lastActiveText = `${Math.floor(ageSeconds / 3600)}h ago`;
                } else {
                    lastActiveText = `${Math.floor(ageSeconds / 86400)}d ago`;
                }
                tr.insertCell().textContent = lastActiveText;


                const tornProfileLink = document.createElement('a');
                tornProfileLink.href = `https://www.torn.com/profiles.php?XID=${target.id}`;
                tornProfileLink.textContent = `[${target.id}]`;
                tornProfileLink.target = "_blank"; // Open in new tab
                tornProfileLink.rel = "noopener noreferrer";
                tr.insertCell().appendChild(tornProfileLink);

                if (tableBody) tableBody.appendChild(tr);
            });
        }
        showResultsModal();

    } catch (error) {
        console.error("Generate Random Targets Error:", error);
        if(randomTargetsStatusDiv) randomTargetsStatusDiv.textContent = `Error: ${error.message.substring(0,150)}`;
        displayErrorInModal(`Error generating targets: ${error.message}`);
    } finally {
        clearTimeout(loadingTimeoutId);
        hideLoadingSpinner();
    }
}