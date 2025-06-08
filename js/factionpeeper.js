// mysite/js/factionpeeper.js
// This script focuses ONLY on the Faction People Peeper page's main functionalities.
// Header button visibility and dropdowns are now handled EXCLUSIVELY by globalheader.js.
document.addEventListener('DOMContentLoaded', function() {
    console.log("factionpeeper.js: DOMContentLoaded event fired. Faction Peeper is loading!");

    // --- Firebase Configuration (Re-added for robustness on this page, similar to home.js) ---
    const firebaseConfig = {
        apiKey: "AIzaSyAI5QB7LbFyndbk_khADbKb33iqLSO4EOw", // Replace with your actual config
        authDomain: "mytorn-d03ae.firebaseapp.com",
        projectId: "mytorn-d03ae",
        storageBucket: "mytorn-d03ae.appspot.com",
        messagingSenderId: "205970466308",
        appId: "1:205970466308:web:b2f8ec5d1a38ef05213751"
    };

    let db = null;
    let auth = null;

    if (typeof firebase !== 'undefined' && firebase.app && firebase.auth && firebase.firestore) {
        if (!firebase.apps.length) { // Only initialize if no app exists
            try {
                firebase.initializeApp(firebaseConfig);
                console.log("factionpeeper.js: Firebase initialized (fallback)");
            } catch (e) {
                console.error("factionpeeper.js: Error initializing Firebase:", e);
            }
        }
        if (firebase.apps.length > 0) {
            auth = firebase.auth();
            db = firebase.firestore();
        }
    } else {
        console.error("factionpeeper.js: Firebase SDK not fully loaded. Check firebase-init.js.");
        const criticalErrorEl = document.getElementById('criticalErrorDisplay');
        if (criticalErrorEl) criticalErrorEl.textContent = 'Critical error: Core libraries failed to load.';
    }

    if (!db) console.error("factionpeeper.js: Firestore (db) could not be initialized.");
    if (!auth) console.error("factionpeeper.js: Firebase Auth (auth) could not be initialized.");


    // --- Stat selection logic and other common functions (These are core to Faction Peeper) ---
    const popularPresetStats = ['Level', 'Age', 'Last Action', 'Xanax Taken', 'Refills', 'Total War Hits'];
    const statCategories = [
        { name: "⭐ Most Popular.", stats: popularPresetStats },
        { name: "⚔️ Combat.", stats: [ 'Attacks Won', 'Attacks Lost', 'Attacks Draw', 'Defends Won', 'Defends Lost', 'Total Attack Hits', 'Attack Damage Dealt', 'Best Single Hit Damage', 'Critical Hits', 'One-Hit Kills', 'Best Kill Streak', 'ELO Rating', 'Stealth Attacks', 'Highest Level Beaten', 'Unarmed Fights Won', 'Times You Ran Away', 'Opponent Ran Away', 'Total War Assists' ] },
        { name: "💰 Economy & Items.", stats: [ 'Networth', 'Money Mugged', 'Largest Mug', 'Bazaar Profit ($)', 'Bazaar Sales (#)', 'Bazaar Customers', 'Points Bought', 'Points Sold', 'Items Bought (Market/Shops)', 'City Items Bought', 'Items Bought Abroad', 'Items Sent', 'Items Looted', 'Items Dumped', 'Trades Made', 'Businesses Owned', 'Properties Owned' ] },
        { name: "🚨 Crime & Jail.", stats: [ 'Criminal Record (Total)', 'Times Jailed', 'People Busted', 'Failed Busts', 'Arrests Made' ] },
        { name: "💊 Medical & Drugs.", stats: [ 'Medical Items Used', 'Times Hospitalized', 'Drugs Used (Times)', 'Times Overdosed', 'Times Rehabbed', 'Boosters Used', 'Energy Drinks Used', 'Alcohol Used', 'Candy Used', 'Nerve Refills Used' ] },
        { name: "📈 Activity & Progress.", stats: [ 'Daily Login Streak', 'Best Active Streak', 'User Activity', 'Awards', 'Donator Days', 'Missions Completed', 'Contracts Completed', 'Mission Credits Earned', 'Job Points Used', 'Stat Trains Received', 'Travels Made', 'City Finds', 'Dump Finds', 'Items Dumped', 'Books Read', 'Viruses Coded', 'Races Won', 'Racing Skill', 'Status', 'Respect' ] },
        { name: "🎯 Bounties & Revives.", stats: [ 'Total Bounties', 'Bounties Placed', 'Bounties Collected', 'Money Spent on Bounties', 'Money From Bounties Collected', 'Revives Made', 'Revives Received', 'Revive Skill' ] }
    ];
    const statDropdownsParentContainer = document.getElementById('statDropdownsParentContainer');
    const selectedStatsDisplay = document.getElementById('selectedStatsDisplay');
    const chkMostPopular = document.getElementById('chkMostPopular');
    const maxSelection = 6;
    let selected = new Set();

    function renderSelectedStats() {
        if (!selectedStatsDisplay) return;
        selectedStatsDisplay.innerHTML = '';
        if (selected.size === 0) {
            selectedStatsDisplay.style.paddingTop = '0'; selectedStatsDisplay.style.paddingBottom = '0'; selectedStatsDisplay.style.minHeight = '0';
        } else {
            selectedStatsDisplay.style.paddingTop = '10px'; selectedStatsDisplay.style.paddingBottom = '10px'; selectedStatsDisplay.style.minHeight = '40px';
        }
        selected.forEach(statName => {
            const tag = document.createElement('div');
            tag.className = 'selected-stat-tag'; tag.textContent = statName;
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-tag'; removeBtn.innerHTML = '&times;'; removeBtn.title = `Remove ${statName}`;
            removeBtn.onclick = (e) => {
                e.stopPropagation(); selected.delete(statName);
                let isStillPreset = chkMostPopular && chkMostPopular.checked && popularPresetStats.length === selected.size;
                if(isStillPreset){
                    for(const pStat of popularPresetStats){ if(!selected.has(pStat)){isStillPreset = false; break;}}
                }
                if(chkMostPopular && chkMostPopular.checked && !isStillPreset) chkMostPopular.checked = false;
                renderSelectedStats(); updateDropdownOptions();
            };
            tag.appendChild(removeBtn); selectedStatsDisplay.appendChild(tag);
        });
        const statsErrorDiv = document.getElementById('statsError');
        if (!statsErrorDiv) return;
        if (selected.size > maxSelection) { statsErrorDiv.textContent = `Error: More than ${maxSelection} stats selected!`; }
        else if (selected.size === maxSelection) { statsErrorDiv.textContent = `Maximum ${maxSelection} stats selected.`;}
        else { statsErrorDiv.textContent = ''; }
    }

    function updateDropdownOptions() {
        if (!statDropdownsParentContainer) return;
        const dropdowns = statDropdownsParentContainer.querySelectorAll('.stats-dropdown');
        const limitReached = selected.size >= maxSelection;
        dropdowns.forEach(selectElement => {
            Array.from(selectElement.options).forEach(option => {
                if (option.value === "") { option.disabled = false; return; }
                const isSelected = selected.has(option.value);
                option.disabled = isSelected || (limitReached && !isSelected);
                option.style.color = option.disabled ? "#888" : "";
            });
        });
    }

    // --- REMOVED ALL HEADER-SPECIFIC DOM GETTERS AND DROPDOWN LOGIC ---
    // (usefulLinksBtn, usefulLinksDropdown, contactUsBtn, contactUsDropdown, headerButtonsContainer, signUpButtonHeader, homeButtonFooter, logoutButtonHeader, window.addEventListener('click'))
    // (closeOtherDropdowns function)
    // This is now handled by globalheader.js.

    if(chkMostPopular) {
        chkMostPopular.addEventListener('change', () => {
            selected.clear();
            if (chkMostPopular.checked) {
                popularPresetStats.forEach(stat => {
                    if(selected.size < maxSelection) selected.add(stat);
                });
            }
            renderSelectedStats(); updateDropdownOptions();
            if (statDropdownsParentContainer) {
                statDropdownsParentContainer.querySelectorAll('.stats-dropdown').forEach(sel => sel.value = "");
            }
        });
    }

    let currentRowForDropdowns;
    if (statDropdownsParentContainer) {
        statCategories.forEach((category, index) => {
            if (index === 0) {
                currentRowForDropdowns = document.createElement('div');
                currentRowForDropdowns.className = 'dropdown-row single-dropdown';
                statDropdownsParentContainer.appendChild(currentRowForDropdowns);
            } else if (index === 1 || index === 4) { // Adjust this if you add/remove categories for layout
                currentRowForDropdowns = document.createElement('div');
                currentRowForDropdowns.className = 'dropdown-row';
                statDropdownsParentContainer.appendChild(currentRowForDropdowns);
            }

            const categoryContainer = document.createElement('div');
            categoryContainer.className = 'dropdown-category';
            const categoryLabel = document.createElement('label');
            categoryLabel.textContent = category.name;
            const dropdownId = `dropdown-${category.name.replace(/[^a-zA-Z0-9]/g, '')}`;
            categoryLabel.htmlFor = dropdownId;
            categoryContainer.appendChild(categoryLabel);

            const selectElement = document.createElement('select');
            selectElement.className = 'stats-dropdown'; selectElement.id = dropdownId;
            const defaultOption = document.createElement('option');
            defaultOption.value = ""; defaultOption.textContent = `--- Select ---`;
            selectElement.appendChild(defaultOption);

            category.stats.forEach(stat => {
                const option = document.createElement('option');
                option.value = stat; option.textContent = stat;
                selectElement.appendChild(option);
            });
            selectElement.onchange = (e) => {
                const selectedStatName = e.target.value;
                if (selectedStatName) {
                    if (!selected.has(selectedStatName)) {
                        if (selected.size < maxSelection) {
                            selected.add(selectedStatName);
                            if(chkMostPopular && chkMostPopular.checked) {
                                let isStillExactPreset = popularPresetStats.length === selected.size;
                                if(isStillExactPreset) {
                                    for(const pStat of popularPresetStats) { if(!selected.has(pStat)){isStillExactPreset = false; break;}}
                                }
                                if(!isStillExactPreset) chkMostPopular.checked = false;
                            }
                        } else {
                            const statsErrorDiv = document.getElementById('statsError');
                            if (statsErrorDiv) statsErrorDiv.textContent = `Cannot select more than ${maxSelection} stats.`;
                            setTimeout(() => {
                                if(statsErrorDiv && selected.size <= maxSelection) statsErrorDiv.textContent = selected.size === maxSelection ? `Maximum ${maxSelection} stats selected.` : '';
                            }, 3000);
                        }
                    }
                    renderSelectedStats(); updateDropdownOptions();
                }
                e.target.value = "";
            };
            categoryContainer.appendChild(selectElement);
            if (currentRowForDropdowns) currentRowForDropdowns.appendChild(categoryContainer);
        });
    }
    if (selectedStatsDisplay) {
        renderSelectedStats();
        updateDropdownOptions();
    }

    const clearSelectionsBtn = document.getElementById('clearSelectionsBtn');
    if (clearSelectionsBtn) {
        clearSelectionsBtn.addEventListener('click', () => {
            selected.clear();
            if(chkMostPopular) chkMostPopular.checked = false;
            renderSelectedStats();
            updateDropdownOptions();
            if (statDropdownsParentContainer) {
                statDropdownsParentContainer.querySelectorAll('.stats-dropdown').forEach(sel => sel.value = "");
            }
            const statsErrorDiv = document.getElementById('statsError');
            if(statsErrorDiv) statsErrorDiv.textContent = '';
        });
    }

    const downloadDataBtn = document.getElementById('downloadDataBtn');
    if (downloadDataBtn) {
        downloadDataBtn.addEventListener('click', () => {
            // START: HTML2CANVAS SCREENSHOT LOGIC (This should remain here)
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
                    link.download = 'Faction_Members_Data.png'; 
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
            // END: HTML2CANVAS SCREENSHOT LOGIC
        });
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
        const tableBody = document.getElementById('modal-results-table-body');
        const tableHeader = document.getElementById('modal-results-table-header');
        if(tableBody) tableBody.innerHTML = '';
        if(tableHeader) tableHeader.innerHTML = '';
    }

    function getValueForStat(statDisplayName, userData) { /* ... (unchanged) ... */ return 'N/A'; }
    function showMainError(message) { /* ... (unchanged) ... */ }

    // --- DOM Element Getters (for this page's elements) ---
    // These are for the factionpeeper.html specific controls.
    const fetchDataButton = document.getElementById('fetchData');
    const apiKeyErrorDiv = document.getElementById('apiKeyError'); // For error display on this page.
    const factionIdInput = document.getElementById('factionId');
    const clearChoicesButton = document.getElementById('clearChoices');


    // --- Initial Setup and Event Listeners (Core to Faction Peeper Page) ---
    if (fetchDataButton) {
        fetchDataButton.disabled = true; // Disable until login status is known
        // Initial listener to prompt login if not authenticated
        fetchDataButton.addEventListener('click', () => showMainError('Please sign in to fetch data.'));
    }

    if (clearChoicesButton) {
        clearChoicesButton.addEventListener('click', () => {
            if (factionIdInput) factionIdInput.value = '';
            if (chkMostPopular) chkMostPopular.checked = false;
            selected.clear();
            renderSelectedStats();
            updateDropdownOptions();
            if (statDropdownsParentContainer) {
                statDropdownsParentContainer.querySelectorAll('.stats-dropdown').forEach(sel => sel.value = "");
            }
            const statsErrorDiv = document.getElementById('statsError');
            if(statsErrorDiv) statsErrorDiv.textContent = '';
            showMainError(''); // Clear any main errors
        });
    }

    // --- Firebase Auth State Changed Listener (Core to Faction Peeper Page) ---
    // This listener handles the visibility and data fetching for the Faction Peeper page content.
    if (typeof auth !== 'undefined' && auth) {
        auth.onAuthStateChanged(function(user) {
            console.log("factionpeeper.js: Auth state changed. User:", user);

            if (user) {
                console.log("factionpeeper.js: User is signed in:", user.uid);
                // No need to control mainHomepageContent here, as this is factionpeeper page.
                
                if (fetchDataButton) {
                    fetchDataButton.disabled = false; // Enable button on login
                    if (apiKeyErrorDiv) apiKeyErrorDiv.textContent = ''; // Clear API error message

                    // Remove any old 'sign in' listener before adding the functional one
                    const oldListener = fetchDataButton._authClickListener; // _authClickListener is a custom property for listener ref
                    if (oldListener) {
                        fetchDataButton.removeEventListener('click', oldListener);
                    }
                    const newListener = () => fetchData(user); // Define the new functional listener
                    fetchDataButton.addEventListener('click', newListener);
                    fetchDataButton._authClickListener = newListener; // Store ref to the new listener
                }

            } else {
                console.log("factionpeeper.js: No user is signed in.");
                // No main content visibility control for this page when logged out.
                
                if (fetchDataButton) {
                    fetchDataButton.disabled = true; // Disable button when logged out
                    if (apiKeyErrorDiv) apiKeyErrorDiv.textContent = 'Please sign in to fetch data.';

                    // Remove old listener (if enabled for logged in user)
                    const oldListener = fetchDataButton._authClickListener;
                    if (oldListener) {
                        fetchDataButton.removeEventListener('click', oldListener);
                    }
                    // Add a listener that prompts for login
                    fetchDataButton.addEventListener('click', () => showMainError('Please sign in to fetch data.'));
                    fetchDataButton._authClickListener = null; // Clear stored ref as it's not a functional listener
                }
            }
        });
    } else {
        console.warn("factionpeeper.js: Firebase auth object is not available. Fetch data button disabled.");
        // If Firebase Auth itself isn't loaded at all, disable button and show error
        if (fetchDataButton) {
            fetchDataButton.disabled = true;
            if (apiKeyErrorDiv) apiKeyErrorDiv.textContent = 'Firebase is not loaded. Cannot check login status.';
            fetchDataButton.addEventListener('click', () => showMainError('Firebase is not ready. Cannot fetch data.'));
        }
    }

    console.log("factionpeeper.js: All initial setup and listeners complete.");
});