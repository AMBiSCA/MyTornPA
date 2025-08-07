// mysite/js/fairfight.js

// Constants specific to Fair Fight display (copied from original UserScript, adapted)
const FF_VERSION = "MyTornPA-FF-1.0"; // Custom version for your website
// Assuming these images are in mysite/images/
const BLUE_ARROW = "../images/blue-arrow.svg";
const GREEN_ARROW = "../images/green-arrow.svg";
const RED_ARROW = "../images/red.svg"; // Corrected a potential typo if 'red-arrow.svg' was intended

// Color utility functions (copied from original UserScript)
function rgbToHex(r, g, b) {
    return (
        "#" +
        ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
    );
}

// Function to handle the landscape blocker logic
function toggleLandscapeBlocker() {
    const isMobileLandscape = window.innerWidth > window.innerHeight && window.innerWidth <= 1024;
    let blocker = document.getElementById('landscape-blocker');

    if (isMobileLandscape) {
        // Only create the blocker if it doesn't already exist
        if (!blocker) {
            blocker = document.createElement('div');
            blocker.id = 'landscape-blocker';
            blocker.innerHTML = `
                <h2>Please Rotate Your Device</h2>
                <p>For the best experience, please use this page in portrait mode.</p>
            `;
            // Apply all the necessary styles directly with JavaScript
            Object.assign(blocker.style, {
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                backgroundColor: '#222',
                color: '#eee',
                textAlign: 'center',
                padding: '20px',
                zIndex: '99999'
            });
            document.body.appendChild(blocker);
        }

        // Hide main page content
        document.body.style.overflow = 'hidden';
        const header = document.querySelector('header');
        if (header) header.style.display = 'none';
        const mainContent = document.getElementById('mainHomepageContent');
        if (mainContent) mainContent.style.display = 'none';
        const footer = document.querySelector('footer');
        if (footer) footer.style.display = 'none';

    } else {
        // Remove the blocker if it exists
        if (blocker) {
            blocker.remove();
        }

        // Re-show main page content
        document.body.style.overflow = '';
        const header = document.querySelector('header');
        if (header) header.style.display = '';
        const mainContent = document.getElementById('mainHomepageContent');
        if (mainContent) mainContent.style.display = '';
        const footer = document.querySelector('footer');
        if (footer) footer.style.display = '';
    }
}

// Run the function on page load and window resize
window.addEventListener('load', toggleLandscapeBlocker);
window.addEventListener('resize', toggleLandscapeBlocker);

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
    const fetchMyTargetsButton = document.getElementById('fetchTargetsBtn'); // Corrected ID to match HTML
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
                        const tornApiKey = userData.tornApiKey; // Get Torn API key from user profile
                        // CORRECTED: Use 'tornProfileId' as confirmed in Firestore
                        const playerId = userData.tornProfileId; 

                        console.log("DEBUG FAIRFIGHT: Value of tornApiKey retrieved from Firestore:", tornApiKey);
                        console.log("DEBUG FAIRFIGHT: Value of tornProfileId retrieved from Firestore:", playerId);

                        if (tornApiKey) {
                            if (fairFightApiKeyErrorDiv) fairFightApiKeyErrorDiv.textContent = ''; // Clear any previous error messages
                            
                            if (fetchMyTargetsButton) { // Enable "Fetch My Targets" button if API key and player ID exist
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
        // Changed selector to be more general as 'stats-container' might not exist now
        const formContainer = document.querySelector('.target-finder-container'); 
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

// *** NEW FUNCTION ADDED HERE ***
function displayErrorInModal(message) {
    const modalTitle = document.querySelector('#resultsModalOverlay .modal-title');
    const modalSummary = document.querySelector('#resultsModalOverlay .modal-summary');
    const tableBody = document.getElementById('modal-results-table-body');
    const tableHeader = document.getElementById('modal-results-table-header');

    if (modalTitle) modalTitle.textContent = 'An Error Occurred';
    if (tableHeader) tableHeader.innerHTML = ''; // Clear table header
    if (tableBody) tableBody.innerHTML = '';    // Clear table body

    // Display the error message in the summary area
    if (modalSummary) {
        modalSummary.innerHTML = `<span style="color: #ff4d4d; font-weight: bold;">${message}</span>`;
    }

    showResultsModal(); // Show the modal with the error message
}

// Function to clear all input errors (adapted from battlestats.js)
function clearAllInputErrors() {
    // Only need to clear 'myTargetsResults' related feedback if you have a specific div for it.
    const myTargetsResults = document.getElementById('myTargetsResults');
    if(myTargetsResults) myTargetsResults.textContent = '';
    const fairFightApiKeyErrorDiv = document.getElementById('fairFightApiKeyError');
    if(fairFightApiKeyErrorDiv) fairFightApiKeyErrorDiv.textContent = '';
    showMainError(''); // Clear the main page error message
}


// Handles fetching recommended targets for the logged-in user
async function handleMyTargetsCheck(user, tornApiKey, playerId) {
    clearAllInputErrors(); // Clear existing errors
    const myTargetsResultsDiv = document.getElementById('myTargetsResults') || document.createElement('div'); 
    myTargetsResultsDiv.id = 'myTargetsResults'; 
    
    let isValid = true;
    if (!tornApiKey) {
        const message = 'Torn API Key not available. Please sign in or set your key in profile.';
        if (fairFightApiKeyErrorDiv) fairFightApiKeyErrorDiv.textContent = message;
        showMainError(message);
        isValid = false;
    }
    if (!playerId) {
        const message = 'Your Torn Player ID is not set in your profile. Cannot fetch recommended targets.';
        if (fairFightApiKeyErrorDiv) fairFightApiKeyErrorDiv.textContent = message;
        showMainError(message);
        isValid = false;
    }

    if (!isValid) return;

    // Provide initial feedback on the main page before opening modal
    if(myTargetsResultsDiv) myTargetsResultsDiv.textContent = 'Fetching recommended targets...';
    let loadingTimeoutId = setTimeout(() => { showLoadingSpinner(); }, 1000);

    try {
        // Call your Netlify Function for recommended targets using POST
        const functionUrl = `/.netlify/functions/get-recommended-targets`;
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ apiKey: tornApiKey, playerId: playerId }) // Pass player ID if needed by your function
        });
        const data = await response.json();

        if (!response.ok) { // Check if the function itself returned an error status
            throw new Error(data.error || `Netlify Function Error: ${response.status}`);
        }
        if (data.error) { // Check for custom errors from the function's body
            throw new Error(data.error);
        }

        if(myTargetsResultsDiv) myTargetsResultsDiv.textContent = ''; // Clear initial message

        const modalTitle = document.querySelector('#resultsModalOverlay .modal-title');
        const modalSummary = document.querySelector('#resultsModalOverlay .modal-summary');
        const tableHeader = document.getElementById('modal-results-table-header');
        const tableBody = document.getElementById('modal-results-table-body');

        if (modalTitle) modalTitle.textContent = 'Recommended Targets';
        if (tableHeader) tableHeader.innerHTML = '';
        if (tableBody) tableBody.innerHTML = '';

        if (!data.targets || data.targets.length === 0) {
            if (modalSummary) modalSummary.innerHTML = `Player: <span>${playerId}</span> | Status: <span style="color: #ff4d4d;">${data.message || 'No recommended targets found.'}</span>`;
            displayErrorInModal(data.message || `No recommended targets found for player ID ${playerId}.`);
        } else {
            if (modalSummary) {
                // Ensure data.playerName is available from your Netlify function if you want to display it
                modalSummary.innerHTML = `Player: <span>${data.playerName || 'You'} [${playerId}]</span> | 
                                         Found <span>${data.targets.length}</span> Recommended Targets.`;
            }

            const headers = ["Name", "ID", "Fair Fight", "Difficulty", "Est. Stats", "Status", "Attack Link"];
            const headerRow = document.createElement('tr');
            headers.forEach(h => { const th = document.createElement('th'); th.textContent = h; headerRow.appendChild(th); });
            if (tableHeader) tableHeader.appendChild(headerRow);

            data.targets.forEach(target => {
                const tr = document.createElement('tr');
                tr.insertCell().textContent = target.playerName || target.playerID;
                tr.insertCell().textContent = target.playerID;

                const ffCell = tr.insertCell();
                ffCell.style.backgroundColor = get_ff_colour(parseFloat(target.fairFightScore));
                ffCell.style.color = get_contrast_color(get_ff_colour(parseFloat(target.fairFightScore)));
                ffCell.style.fontWeight = 'bold';
                ffCell.textContent = target.fairFightScore;
                
                tr.insertCell().textContent = target.difficulty;
                tr.insertCell().textContent = target.estimatedBattleStats || "N/A";

                const statusCell = tr.insertCell();
                statusCell.textContent = target.status.text;
                statusCell.style.color = target.status.color;
                statusCell.style.fontWeight = 'bold';

                const attackLinkCell = tr.insertCell();
                const attackLink = document.createElement('a');
                attackLink.href = target.attackUrl;
                attackLink.textContent = 'Attack';
                attackLink.target = '_blank'; // Open in new tab
                attackLinkCell.appendChild(attackLink);

                if (tableBody) tableBody.appendChild(tr);
            });
        }
        showResultsModal();

    } catch (error) {
        console.error("Recommended Targets Check Error:", error);
        // Display error in the main results div and then in the modal
        if(myTargetsResultsDiv) myTargetsResultsDiv.textContent = `Error: ${error.message.substring(0,100)}`;
        displayErrorInModal(`Error fetching recommended targets: ${error.message}`);
    } finally {
        clearTimeout(loadingTimeoutId);
        hideLoadingSpinner();
    }
}

function toggleLandscapeBlocker() {
    // This condition is now more robust, checking for landscape orientation on most mobile devices including tablets
    const isMobileLandscape = window.matchMedia("(max-width: 1280px) and (orientation: landscape)").matches;
    let blocker = document.getElementById('landscape-blocker');

    // This block is for pages other than the one you are on now
    const mainContent = document.getElementById('mainHomepageContent');
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');

    if (isMobileLandscape) {
        // Only create the blocker if it doesn't already exist
        if (!blocker) {
            blocker = document.createElement('div');
            blocker.id = 'landscape-blocker';
            blocker.innerHTML = `
                <h2>Please Rotate Your Device</h2>
                <p>For the best experience, please use this page in portrait mode.</p>
            `;
            // Apply all the necessary styles directly with JavaScript
            Object.assign(blocker.style, {
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                backgroundColor: '#222',
                color: '#eee',
                textAlign: 'center',
                padding: '20px',
                zIndex: '99999'
            });
            document.body.appendChild(blocker);
        }

        // Hide main page content
        document.body.style.overflow = 'hidden';
        if (header) header.style.display = 'none';
        if (mainContent) mainContent.style.display = 'none';
        if (footer) footer.style.display = 'none';

    } else {
        // Remove the blocker if it exists
        if (blocker) {
            blocker.remove();
        }

        // Re-show main page content
        document.body.style.overflow = '';
        if (header) header.style.display = ''; // Reverts to stylesheet's display
        if (mainContent) mainContent.style.display = ''; // Reverts to stylesheet's display
        
        const footer = document.querySelector('footer');
        if (footer) footer.style.display = 'block'; // Explicitly set to 'block'
    }
}
// Run the function on page load and window resize
window.addEventListener('load', toggleLandscapeBlocker);
window.addEventListener('resize', toggleLandscapeBlocker);


function toggleLandscapeBlocker() {
    const isMobileLandscape = window.matchMedia("(max-width: 1280px) and (orientation: landscape)").matches;
    let blocker = document.getElementById('landscape-blocker');

    if (isMobileLandscape) {
        // If the blocker doesn't exist, create and show it.
        if (!blocker) {
            blocker = document.createElement('div');
            blocker.id = 'landscape-blocker';
            blocker.innerHTML = `
                <div style="transform: rotate(0deg); font-size: 50px; margin-bottom: 20px;">📱</div>
                <h2>Please Rotate Your Device</h2>
                <p>This page is best viewed in portrait mode.</p>
            `;
            // These styles will make it cover the entire screen.
            Object.assign(blocker.style, {
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100vw',  // Use viewport width
                height: '100vh', // Use viewport height
                backgroundColor: '#1c1c1c', // A solid, dark color
                color: '#eee',
                textAlign: 'center',
                zIndex: '99999' // A very high number to ensure it's on top of everything
            });
            document.body.appendChild(blocker);
        }
        // Also, prevent the page from scrolling underneath the blocker.
        document.body.style.overflow = 'hidden';

    } else {
        // If we are in portrait, remove the blocker if it exists.
        if (blocker) {
            blocker.remove();
        }
        // And restore the ability to scroll the page.
        document.body.style.overflow = '';
    }
}

// Run the function when the page first loads and whenever it's resized.
window.addEventListener('load', toggleLandscapeBlocker);
window.addEventListener('resize', toggleLandscapeBlocker);