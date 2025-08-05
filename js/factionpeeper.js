// Rest of your main JavaScript file (the one you sent me)
// Stat selection logic and other functions
const popularPresetStats = ['Level', 'Age', 'Last Action', 'Xanax Taken', 'Refills', 'Total War Hits'];
const statCategories = [
    { name: "⭐ Most Popular.", stats: popularPresetStats },
    { name: "⚔️ Combat.", stats: ['Attacks Won', 'Attacks Lost', 'Attacks Draw', 'Defends Won', 'Defends Lost', 'Total Attack Hits', 'Attack Damage Dealt', 'Best Single Hit Damage', 'Critical Hits', 'One-Hit Kills', 'Best Kill Streak', 'ELO Rating', 'Stealth Attacks', 'Highest Level Beaten', 'Unarmed Fights Won', 'Times You Ran Away', 'Opponent Ran Away', 'Total War Assists'] },
    { name: "💰 Economy & Items.", stats: ['Networth', 'Money Mugged', 'Largest Mug', 'Bazaar Profit ($)', 'Bazaar Sales (#)', 'Bazaar Customers', 'Points Bought', 'Points Sold', 'Items Bought (Market/Shops)', 'City Items Bought', 'Items Bought Abroad', 'Items Sent', 'Items Looted', 'Items Dumped', 'Trades Made', 'Businesses Owned', 'Properties Owned'] },
    { name: "🚨 Crime & Jail.", stats: ['Criminal Record (Total)', 'Times Jailed', 'People Busted', 'Failed Busts', 'Arrests Made'] },
    { name: "💊 Medical & Drugs.", stats: ['Medical Items Used', 'Times Hospitalized', 'Drugs Used (Times)', 'Times Overdosed', 'Times Rehabbed', 'Boosters Used', 'Energy Drinks Used', 'Alcohol Used', 'Candy Used', 'Nerve Refills Used'] },
    { name: "📈 Activity & Progress.", stats: ['Daily Login Streak', 'Best Active Streak', 'User Activity', 'Awards', 'Donator Days', 'Missions Completed', 'Contracts Completed', 'Mission Credits Earned', 'Job Points Used', 'Stat Trains Received', 'Travels Made', 'City Finds', 'Dump Finds', 'Items Dumped', 'Books Read', 'Viruses Coded', 'Races Won', 'Racing Skill', 'Status', 'Respect'] },
    { name: "🎯 Bounties & Revives.", stats: ['Total Bounties', 'Bounties Placed', 'Bounties Collected', 'Money Spent on Bounties', 'Money From Bounties Collected', 'Revives Made', 'Revives Received', 'Revive Skill'] }
    // If you add TCP Anniversary, it would go in a new category or an existing one:
    // { name: "🔥 User Info (Firebase)", stats: [ 'TCP Anniversary' ] }
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
            if (isStillPreset) {
                for (const pStat of popularPresetStats) { if (!selected.has(pStat)) { isStillPreset = false; break; } }
            }
            if (chkMostPopular && chkMostPopular.checked && !isStillPreset) chkMostPopular.checked = false;
            renderSelectedStats(); updateDropdownOptions();
        };
        tag.appendChild(removeBtn); selectedStatsDisplay.appendChild(tag);
    });
    const statsErrorDiv = document.getElementById('statsError');
    if (!statsErrorDiv) return;
    if (selected.size > maxSelection) { statsErrorDiv.textContent = `Error: More than ${maxSelection} stats selected!`; }
    else if (selected.size === maxSelection) { statsErrorDiv.textContent = `Maximum ${maxSelection} stats selected.`; }
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
// --- DOM Element Getters (for Contact Us dropdown) ---
const contactUsBtn = document.getElementById('contactUsBtn'); // This is your button
const contactUsDropdown = document.getElementById('contactUsDropdown'); // This is its dropdown

// --- Dropdown Logic (Contact Us) ---
// This function helps close other dropdowns if they are open
function closeOtherDropdowns(currentDropdown, currentButton) {
    const allDropdowns = document.querySelectorAll('.dropdown-content.show');
    allDropdowns.forEach(dropdown => {
        if (dropdown !== currentDropdown) {
            dropdown.classList.remove('show');
            // Remove 'active' class from its associated button if found
            const associatedButton = dropdown.previousElementSibling; // Assuming button is always before dropdown
            if (associatedButton && associatedButton.classList.contains('active')) {
                associatedButton.classList.remove('active');
            }
        }
    });
}

if (contactUsBtn && contactUsDropdown) {
    contactUsBtn.addEventListener('click', function(event) {
        event.stopPropagation(); // Prevents the click from immediately closing it via window listener
        const currentlyOpen = contactUsDropdown.classList.contains('show');
        closeOtherDropdowns(contactUsDropdown, contactUsBtn); // Close others

        if (!currentlyOpen) { // If it was not open, open it
            contactUsDropdown.classList.add('show');
            contactUsBtn.classList.add('active'); // Add active class to button
        } else {
            contactUsDropdown.classList.remove('show');
            contactUsBtn.classList.remove('active'); // Remove active class from button
        }
    });
}

// Global click listener to close dropdowns when clicking outside
window.addEventListener('click', function(event) {
    if (contactUsDropdown && contactUsDropdown.classList.contains('show')) {
        if (!contactUsBtn.contains(event.target) && !contactUsDropdown.contains(event.target)) {
            contactUsDropdown.classList.remove('show');
            contactUsBtn.classList.remove('active');
        }
    }
});
if (chkMostPopular) {
    chkMostPopular.addEventListener('change', () => {
        selected.clear();
        if (chkMostPopular.checked) {
            popularPresetStats.forEach(stat => {
                if (selected.size < maxSelection) selected.add(stat);
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
                        if (chkMostPopular && chkMostPopular.checked) {
                            let isStillExactPreset = popularPresetStats.length === selected.size;
                            if (isStillExactPreset) {
                                for (const pStat of popularPresetStats) { if (!selected.has(pStat)) { isStillExactPreset = false; break; } }
                            }
                            if (!isStillExactPreset) chkMostPopular.checked = false;
                        }
                    } else {
                        const statsErrorDiv = document.getElementById('statsError');
                        if (statsErrorDiv) statsErrorDiv.textContent = `Cannot select more than ${maxSelection} stats.`;
                        setTimeout(() => {
                            if (statsErrorDiv && selected.size <= maxSelection) statsErrorDiv.textContent = selected.size === maxSelection ? `Maximum ${maxSelection} stats selected.` : '';
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
        if (chkMostPopular) chkMostPopular.checked = false;
        renderSelectedStats();
        updateDropdownOptions();
        if (statDropdownsParentContainer) {
            statDropdownsParentContainer.querySelectorAll('.stats-dropdown').forEach(sel => sel.value = "");
        }
        const statsErrorDiv = document.getElementById('statsError');
        if (statsErrorDiv) statsErrorDiv.textContent = '';
    });
}

// NEW: Function to export the table data to a CSV file (for mobile)
function exportTableToCSV(filename) {
    const tableContainer = document.querySelector('.modal-table-container'); // Find the table container
    const table = tableContainer ? tableContainer.querySelector('table') : null; // Find the table inside the container

    if (!table) {
        showMainError("Error: Could not find table to export.");
        return;
    }

    const rows = table.querySelectorAll('tr');
    let csv = [];

    // Loop through table rows and cells to build the CSV data
    for (let i = 0; i < rows.length; i++) {
        let row = [], cols = rows[i].querySelectorAll('td, th');
        
        for (let j = 0; j < cols.length; j++) {
            let data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, '').replace(/"/g, '""');
            row.push(`"${data}"`);
        }
        csv.push(row.join(','));
    }

    // Download CSV file
    const csvFile = new Blob([csv.join('\n')], {type: 'text/csv'});
    const downloadLink = document.createElement('a');
    downloadLink.download = filename || 'data.csv';
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = 'none';

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

// CORRECTED & UPDATED: This is the definitive event listener for your download button.
const downloadDataBtn = document.getElementById('downloadDataBtn');
if (downloadDataBtn) {
    downloadDataBtn.addEventListener('click', () => {
        // Check for mobile screen size
        if (window.innerWidth <= 768) {
            // For mobile, use the CSV export
            const modalTableBody = document.getElementById('modal-results-table-body');
            if (!modalTableBody || modalTableBody.children.length === 0) {
                showMainError("No data to download. Please fetch results first.");
                return;
            }

            const modalTitleEl = document.querySelector('#resultsModalOverlay .modal-title');
            const baseFileName = modalTitleEl ? modalTitleEl.textContent.replace(/[^a-zA-Z0-9]/g, '_') : 'Faction_Data';

            exportTableToCSV(`${baseFileName}.csv`);

        } else {
            // For desktop, use the original html2canvas logic
            const modalContent = document.querySelector('.modal-content');
            const tableContainer = document.querySelector('.modal-table-container');
            const tableElement = document.querySelector('.modal-table'); // NEW: Get the actual table element
            const tableHeaders = document.querySelectorAll('.modal-table thead th');

            if (!modalContent || !tableContainer || !tableElement || tableHeaders.length === 0) {
                console.error('Error: Required modal elements not found for screenshot.');
                alert('Could not find the table to download. Please ensure data is loaded and the results modal is open.');
                return;
            }

            const originalModalContentMaxHeight = modalContent.style.maxHeight;
            const originalModalTableContainerMaxHeight = tableContainer.style.maxHeight;
            const originalModalTableContainerOverflowY = tableContainer.style.overflowY;
            const originalModalTableContainerOverflowX = tableContainer.style.overflowX;
            const originalScrollTop = tableContainer.scrollTop;
            const originalScrollLeft = tableContainer.scrollLeft;

            // Save original header styles and remove sticky position
            const originalHeaderStyles = [];
            tableHeaders.forEach(th => {
                originalHeaderStyles.push({ position: th.style.position, top: th.style.top });
                th.style.position = 'static';
                th.style.top = 'auto';
            });

            modalContent.style.maxHeight = 'fit-content';
            tableContainer.style.maxHeight = 'fit-content';
            tableContainer.style.overflowY = 'visible';
            tableContainer.style.overflowX = 'visible';
            tableContainer.scrollTop = 0;
            tableContainer.scrollLeft = 0;

            const fullTableWidth = tableElement.scrollWidth; // NEW: Get the full width from the table itself
            const fullTableHeight = tableElement.scrollHeight; // NEW: Get the full height from the table itself

            setTimeout(() => {
                html2canvas(tableElement, { // NEW: Pass the table element directly
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    allowTaint: true,
                    // Pass the full dimensions to force the capture
                    width: fullTableWidth,
                    height: fullTableHeight
                }).then(function(canvas) {
                    const link = document.createElement('a');
                    link.href = canvas.toDataURL('image/png');

                    const modalTitleEl = document.querySelector('#resultsModalOverlay .modal-title');
                    const baseFileName = modalTitleEl ? modalTitleEl.textContent.replace(/[^a-zA-Z0-9]/g, '_') : 'Battle_Stats_Data';
                    link.download = `${baseFileName}.png`;

                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    console.log('Image download initiated.');

                    // Restore original styles
                    modalContent.style.maxHeight = originalModalContentMaxHeight;
                    tableContainer.style.maxHeight = originalModalTableContainerMaxHeight;
                    tableContainer.style.overflowY = originalModalTableContainerOverflowY;
                    tableContainer.style.overflowX = originalModalTableContainerOverflowX;
                    tableContainer.scrollTop = originalScrollTop;
                    tableContainer.scrollLeft = originalScrollLeft;
                    
                    // Restore original header styles
                    tableHeaders.forEach((th, index) => {
                        th.style.position = originalHeaderStyles[index].position;
                        th.style.top = originalHeaderStyles[index].top;
                    });
                }).catch(error => {
                    console.error('Error generating image:', error);
                    alert('Failed to generate image. Please try again.');

                    // Ensure styles are restored even on error
                    modalContent.style.maxHeight = originalModalContentMaxHeight;
                    tableContainer.style.maxHeight = originalModalTableContainerMaxHeight;
                    tableContainer.style.overflowY = originalModalTableContainerOverflowY;
                    tableContainer.style.overflowX = originalModalTableContainerOverflowX;
                    tableContainer.scrollTop = originalScrollTop;
                    tableContainer.scrollLeft = originalScrollLeft;
                    
                    // Restore original header styles on error
                    tableHeaders.forEach((th, index) => {
                        th.style.position = originalHeaderStyles[index].position;
                        th.style.top = originalHeaderStyles[index].top;
                    });
                });
            }, 100);
        }
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

function closeResultsModal() {
    const overlay = document.getElementById('resultsModalOverlay');
    if (overlay) overlay.classList.remove('visible');
    const tableBody = document.getElementById('modal-results-table-body');
    const tableHeader = document.getElementById('modal-results-table-header');
    if (tableBody) tableBody.innerHTML = '';
    if (tableHeader) tableHeader.innerHTML = '';
}

function getValueForStat(statDisplayName, userData) {
    let value = 'N/A';
    const lastActionObject = userData.last_action || {};
    const personalstats = userData.personalstats || {};
    const profileData = userData.profile || {};

    // --- UNCOMMENTED LOGGING for Xanax Taken ---
    if (statDisplayName === 'Xanax Taken') {
        console.log(`--- getValueForStat ('Xanax Taken') ---`);
        console.log(`1. Received userData:`, JSON.stringify(userData)); // Log the whole userData
        console.log(`2. userData.personalstats object:`, JSON.stringify(personalstats));
        console.log(`3. Value of personalstats.xantaken:`, personalstats.xantaken);
    }
    // --- End of logging ---

    switch (statDisplayName) {
        case 'Level': value = userData.level; break;
        case 'Age': value = userData.age; break;
        case 'Last Action':
            if (lastActionObject.timestamp && lastActionObject.timestamp > 0) {
                const now = Math.floor(Date.now() / 1000);
                const secondsAgo = now - lastActionObject.timestamp;
                if (secondsAgo < 0) { value = "Just now"; break; }
                const minutesAgo = Math.floor(secondsAgo / 60);
                const hoursAgo = Math.floor(minutesAgo / 60);
                const daysAgo = Math.floor(hoursAgo / 24);
                if (minutesAgo < 1) value = `${Math.max(0, secondsAgo)}s Ago`;
                else if (minutesAgo < 60) value = `${minutesAgo} Mins Ago`;
                else if (hoursAgo < 24) value = `${hoursAgo} Hours Ago`;
                else if (daysAgo < 30) value = `${daysAgo} Day${daysAgo > 1 ? 's' : ''} Ago`;
                else value = "Taking Break";
            } else if (typeof lastActionObject.relative === 'string' && lastActionObject.relative.trim() !== "") {
                value = lastActionObject.relative.replace(' ago', ' Ago');
            } else { value = 'N/A'; }
            break;
        case 'Status': value = userData.status && userData.status.description ? userData.status.description : (userData.status && userData.status.state ? userData.status.state : 'N/A'); break;
        case 'Respect': value = personalstats.respectforfaction; break;
        case 'Xanax Taken': value = personalstats.xantaken; break;
        case 'Total War Hits': value = personalstats.rankedwarhits; break;
        case 'Refills': value = personalstats.refills; break;
        case 'Total War Assists': value = personalstats.attacksassisted; break;
        case 'Attacks Won': value = personalstats.attackswon; break;
        case 'Attacks Lost': value = personalstats.attackslost; break;
        case 'Attacks Draw': value = personalstats.attacksdraw; break;
        case 'Defends Won': value = personalstats.defendswon; break;
        case 'Defends Lost': value = personalstats.defendslost; break;
        case 'Total Attack Hits': value = personalstats.attackhits; break;
        case 'Attack Damage Dealt': value = personalstats.attackdamage; break;
        case 'Best Single Hit Damage': value = personalstats.bestdamage; break;
        case 'Critical Hits': value = personalstats.attackcriticalhits; break;
        case 'One-Hit Kills': value = personalstats.onehitkills; break;
        case 'Best Kill Streak': value = personalstats.bestkillstreak; break;
        case 'ELO Rating': value = personalstats.elo; break;
        case 'Stealth Attacks': value = personalstats.attacksstealthed; break;
        case 'Highest Level Beaten': value = personalstats.highestbeaten; break;
        case 'Unarmed Fights Won': value = personalstats.unarmoredwon; break;
        case 'Times You Ran Away': value = personalstats.yourunaway; break;
        case 'Opponent Ran Away': value = personalstats.theyrunaway; break;
        case 'Money Mugged': value = personalstats.moneymugged; break;
        case 'Largest Mug': value = personalstats.largestmug; break;
        case 'Bazaar Profit ($)': value = personalstats.bazaarprofit; break;
        case 'Bazaar Sales (#)': value = personalstats.bazaarsales; break;
        case 'Bazaar Customers': value = personalstats.bazaarcustomers; break;
        case 'Points Bought': value = personalstats.pointsbought; break;
        case 'Points Sold': value = personalstats.pointssold; break;
        case 'Items Bought (Market/Shops)': value = personalstats.itemsbought; break;
        case 'City Items Bought': value = personalstats.cityitemsbought; break;
        case 'Items Bought Abroad': value = personalstats.itemsboughtabroad; break;
        case 'Items Sent': value = personalstats.itemssent; break;
        case 'Items Looted': value = personalstats.itemslooted; break;
        case 'Items Dumped': value = personalstats.itemsdumped; break;
        case 'Trades Made': value = personalstats.trades; break;
        case 'Criminal Record (Total)': value = personalstats.criminaloffenses; break;
        case 'Times Jailed': value = personalstats.jailed; break;
        case 'People Busted': value = personalstats.peoplebusted; break;
        case 'Failed Busts': value = personalstats.failedbusts; break;
        case 'Arrests Made': value = personalstats.arrestsmade; break;
        case 'Medical Items Used': value = personalstats.medicalitemsused; break;
        case 'Times Hospitalized': value = personalstats.hospital; break;
        case 'Drugs Used (Times)': value = personalstats.drugsused; break;
        case 'Times Overdosed': value = personalstats.overdosed; break;
        case 'Times Rehabbed': value = personalstats.rehabs; break;
        case 'Boosters Used': value = personalstats.boostersused; break;
        case 'Energy Drinks Used': value = personalstats.energydrinkused; break;
        case 'Alcohol Used': value = personalstats.alcoholused; break;
        case 'Candy Used': value = personalstats.candyused; break;
        case 'Nerve Refills Used': value = personalstats.nerverefills; break;
        case 'Daily Login Streak': value = personalstats.activestreak; break;
        case 'Best Active Streak': value = personalstats.bestactivestreak; break;
        case 'User Activity': value = personalstats.useractivity; break;
        case 'Awards': value = personalstats.awards; break;
        case 'Donator Days': value = personalstats.daysbeendonator; break;
        case 'Missions Completed': value = personalstats.missionscompleted; break;
        case 'Contracts Completed': value = personalstats.contractscompleted; break;
        case 'Mission Credits Earned': value = personalstats.missioncreditsearned; break;
        case 'Job Points Used': value = personalstats.jobpointsused; break;
        case 'Stat Trains Received': value = personalstats.trainsreceived; break;
        case 'Travels Made': value = personalstats.traveltimes; break;
        case 'City Finds': value = personalstats.cityfinds; break;
        case 'Dump Finds': value = personalstats.dumpfinds; break;
        case 'Items Dumped': value = personalstats.itemsdumped; break;
        case 'Books Read': value = personalstats.booksread; break;
        case 'Viruses Coded': value = personalstats.virusescoded; break;
        case 'Races Won': value = personalstats.raceswon; break;
        case 'Racing Skill': value = personalstats.racingskill; break;
        case 'Total Bounties': value = personalstats.bountiesreceived; break;
        case 'Bounties Placed': value = personalstats.bountiesplaced; break;
        case 'Bounties Collected': value = personalstats.bountiescollected; break;
        case 'Money Spent on Bounties': value = personalstats.totalbountyspent; break;
        case 'Money From Bounties Collected': value = personalstats.totalbountyreward; break;
        case 'Revives Made': value = personalstats.revives; break;
        case 'Revives Received': value = personalstats.revivesreceived; break;
        case 'Revive Skill': value = personalstats.reviveskill; break;
        case 'Networth': value = personalstats.networth; break;
        case 'Businesses Owned': value = personalstats.companiesowned; break;
        case 'Properties Owned': value = personalstats.propertiesowned; break;
        // If you add TCP Anniversary, you would add a case here:
        // case 'TCP Anniversary': value = userData.firebaseData?.tcpAnniversary; break; // Assuming firebaseData is where you'd store it
        default: value = 'N/A';
    }

    if (value === undefined || value === null || value === "") {
        value = 'N/A';
    }

    if (statDisplayName === 'Xanax Taken') {
        console.log(`4. Value after N/A & switch:`, value);
    }

    const numericDisplayStats = [
        'Level', 'Age', 'Respect', 'Xanax Taken', 'Total War Hits', 'Refills', 'Networth',
        'Attacks Won', 'Attacks Lost', 'Attacks Draw', 'Defends Won', 'Defends Lost',
        'ELO Rating', 'Best Kill Streak', 'Total Attack Hits', 'Attack Damage Dealt', 'Best Single Hit Damage',
        'One-Hit Kills', 'Critical Hits', 'Stealth Attacks', 'Highest Level Beaten', 'Unarmored Fights Won',
        'Times You Ran Away', 'Opponent Ran Away', 'Money Mugged', 'Largest Mug', 'Items Looted',
        'Job Points Used', 'Stat Trains Received', 'Items Bought (Market/Shops)', 'City Items Bought', 'Items Bought Abroad',
        'Items Sent', 'Trades Made', 'Points Bought', 'Points Sold',
        'Bazaar Customers', 'Bazaar Sales (#)', 'Bazaar Profit ($)',
        'Times Jailed', 'People Busted', 'Failed Busts', 'Arrests Made', 'Criminal Record (Total)',
        'Times Hospitalized', 'Medical Items Used', 'Revive Skill', 'Revives Made', 'Revives Received',
        'Drugs Used (Times)', 'Times Overdosed', 'Times Rehabbed',
        'Boosters Used', 'Candy Used', 'Alcohol Used', 'Energy Drinks Used',
        'Nerve Refills Used', 'Daily Login Streak', 'Best Active Streak', 'Awards', 'Donator Days',
        'Missions Completed', 'Contracts Completed', 'Mission Credits Earned',
        'Job Points Used', 'Stat Trains Received', 'Travels Made', 'City Finds', 'Dump Finds', 'Items Dumped', 'Books Read', 'Viruses Coded',
        'Races Won', 'Racing Skill', 'Total Bounties', 'Bounties Placed', 'Bounties Collected',
        'Money Spent on Bounties', 'Money From Bounties Collected',
        'Businesses Owned', 'Properties Owned'
    ];

    if (typeof value === 'number' && !isNaN(value) && numericDisplayStats.includes(statDisplayName)) {
        return value.toLocaleString();
    }
    return String(value);
}

// Helper function to introduce a delay
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// IMPORTANT: Modified fetchData to accept the user object
async function fetchData(user) { // <--- Added 'user' parameter
    
    // --- SPEED TUNING SETTINGS ---
    // This is set to the absolute maximum speed. 
    // WARNING: This will likely cause API rate-limit errors for larger factions.
    const batchSize = 10;
    const delayBetweenBatchesMs = 0; // Set to 0 for maximum speed.
    // --- END OF SETTINGS ---

    const factionIdError = document.getElementById('factionIdError');
    const apiKeyError = document.getElementById('apiKeyError'); 
    const statsError = document.getElementById('statsError');

    // Clear all feedback messages
    if (factionIdError) factionIdError.textContent = '';
    if (apiKeyError) apiKeyError.textContent = '';
    if (statsError) statsError.textContent = '';
    const existingMainInputError = document.querySelector('.main-input-error-feedback');
    if (existingMainInputError) existingMainInputError.remove();


    const factionIdInput = document.getElementById('factionId');
    const factionId = factionIdInput ? factionIdInput.value.trim() : '';

    let hasError = false;
    let currentApiKey = '';

    // --- AUTHENTICATION AND API KEY FETCH FROM FIRESTORE ---
    if (!user || !db) { 
        showMainError('Authentication error: Not signed in. Please sign in and try again.');
        return; 
    } else {
        showLoadingSpinner();
        try {
            const userDocRef = db.collection('userProfiles').doc(user.uid);
            const userDoc = await userDocRef.get();

            if (userDoc.exists) {
                const userData = userDoc.data();
                currentApiKey = userData.tornApiKey;
                if (!currentApiKey) {
                    showMainError('Your Torn API Key is not set in your profile. Please update your profile settings.');
                    hasError = true;
                    hideLoadingSpinner();
                    return;
                }
            } else {
                showMainError('User profile not found in database. Please ensure your profile is set up.');
                hasError = true;
                hideLoadingSpinner();
                return;
            }
        } catch (error) {
            showMainError(`Error fetching API Key from profile: ${error.message}.`);
            hasError = true;
            hideLoadingSpinner();
            return;
        }
    }
    // --- END AUTHENTICATION AND API KEY FETCH ---


    if (!factionId || isNaN(factionId)) {
        if (factionIdError) factionIdError.textContent = 'Faction ID is required and must be a number.'; hasError = true;
    }

    if (selected.size === 0) {
        if (statsError) statsError.textContent = 'Please select at least one stat.'; hasError = true;
    } else if (selected.size > maxSelection) {
        if (statsError) statsError.textContent = `Maximum ${maxSelection} stats selected.`; hasError = true;
    }

    if (hasError) {
        hideLoadingSpinner();
        return;
    }

    try {
        const personalStatsCheckList = [
            'Respect', 'Xanax Taken', 'Total War Hits', 'Refills', 'Total War Assists', 'Attacks Won', 'Attacks Lost', 'Attacks Draw', 'Defends Won', 'Defends Lost', 'Total Attack Hits', 'Attack Damage Dealt', 'Best Single Hit Damage', 'Critical Hits', 'One-Hit Kills', 'Best Kill Streak', 'ELO Rating', 'Stealth Attacks', 'Highest Level Beaten', 'Unarmored Fights Won', 'Times You Ran Away', 'Opponent Ran Away', 'Networth', 'Money Mugged', 'Largest Mug', 'Bazaar Profit ($)', 'Bazaar Sales (#)', 'Bazaar Customers', 'Points Bought', 'Points Sold', 'Items Bought (Market/Shops)', 'City Items Bought', 'Items Bought Abroad', 'Items Sent', 'Items Looted', 'Items Dumped', 'Trades Made', 'Businesses Owned', 'Properties Owned'
        ];
        const personalStatsNeeded = Array.from(selected).some(s => personalStatsCheckList.includes(s));

        // Use the fetched API key
        const factionApiUrl = `https://api.torn.com/faction/${factionId}?selections=basic&key=${currentApiKey}`;
        const factionResponse = await fetch(factionApiUrl);
        if (!factionResponse.ok) {
            const errorText = await factionResponse.text().catch(() => "Could not read error text");
            throw new Error(`Torn API Error (Faction HTTP ${factionResponse.status}): ${factionResponse.statusText}. Response: ${errorText.substring(0, 100)}`);
        }
        const factionData = await factionResponse.json();
        if (factionData.error) throw new Error(`Torn API Error (Faction): ${factionData.error.error}`);
        if (!factionData || !factionData.members || Object.keys(factionData.members).length === 0) {
            throw new Error('No members found for this faction or invalid Faction ID/API Key for faction access.');
        }

        const members = factionData.members;
        const modalFactionName = document.getElementById('modal-faction-name');
        const modalMemberCount = document.getElementById('modal-member-count');
        if (modalFactionName) modalFactionName.textContent = factionData.name || 'Unknown Faction';
        if (modalMemberCount) modalMemberCount.textContent = Object.keys(members).length;

        // Setup table headers
        const displayHeaders = ["Name", "User ID"].concat(Array.from(selected));
        const modalTableHeader = document.getElementById('modal-results-table-header');
        if (modalTableHeader) modalTableHeader.innerHTML = '';
        const tableHeaderRow = document.createElement('tr');
        displayHeaders.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText; tableHeaderRow.appendChild(th);
        });
        if (modalTableHeader) modalTableHeader.appendChild(tableHeaderRow);

        const modalTableBody = document.getElementById('modal-results-table-body');
        if (modalTableBody) modalTableBody.innerHTML = ''; 

        // Show the modal now, so the user can see the table filling up live
        showResultsModal();

        const factionMembersIds = Object.keys(members);
        
        for (let i = 0; i < factionMembersIds.length; i += batchSize) {
            const batchMemberIds = factionMembersIds.slice(i, i + batchSize);

            const batchPromises = batchMemberIds.map(async (memberId) => {
                let combinedData = { member_id_for_table: memberId };
                let errors = [];

                const selections = ['basic', 'profile'];
                if (personalStatsNeeded) {
                    selections.push('personalstats');
                }
                const apiUrl = `https://api.torn.com/user/${memberId}?selections=${selections.join(',')}&key=${currentApiKey}`;

                try {
                    const response = await fetch(apiUrl);
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        errors.push(`API Fetch (HTTP ${response.status}): ${errorData.error?.error || response.statusText}`);
                    } else {
                        const data = await response.json();
                        if (data.error) {
                            errors.push(`API Error: ${data.error.error}`);
                        } else {
                            combinedData = { ...combinedData, ...data };
                        }
                    }
                } catch (e) {
                    errors.push(`Network Error: ${e.message.substring(0, 50)}`);
                }

                if (errors.length > 0) combinedData.error = { error: errors.join('; ') };
                if (!combinedData.name && members[memberId] && members[memberId].name) {
                    combinedData.name = members[memberId].name;
                }
                
                return { memberId, data: combinedData, status: !combinedData.error };
            });

            const batchResultsSettled = await Promise.allSettled(batchPromises);

            const currentBatchResults = [];
            batchResultsSettled.forEach(result => {
                if (result.status === 'fulfilled') {
                    currentBatchResults.push(result.value);
                } else {
                    console.error("Batch promise rejected:", result.reason);
                    const failedMemberId = result.reason?.memberId || 'Unknown ID';
                    currentBatchResults.push({ memberId: failedMemberId, data: { error: { error: `Request rejected for User ${failedMemberId}: ${result.reason?.message || 'Unknown error'}` } }, status: false });
                }
            });

            // Sort the results within this batch alphabetically by name before adding to table
            currentBatchResults.sort((a, b) => {
                const nameA = (a.data.name || members[a.memberId]?.name || `User ${a.memberId}`).toLowerCase();
                const nameB = (b.data.name || members[b.memberId]?.name || `User ${b.memberId}`).toLowerCase();
                return nameA.localeCompare(nameB);
            });

            // PROGRESSIVE LOADING: Add this batch's results to the table immediately
            for (const userResult of currentBatchResults) {
                if (!modalTableBody) continue; 
                
                const tr = document.createElement('tr');
                const memberName = userResult.data.name || `User ${userResult.memberId}`;
                const memberIdForTable = userResult.memberId || 'N/A';

                tr.insertCell().textContent = memberName;
                tr.insertCell().textContent = memberIdForTable;

                if (!userResult.status || userResult.data.error) {
                    const errorCell = tr.insertCell();
                    errorCell.textContent = `Error: ${userResult.data.error?.error || 'Unknown issue'}`;
                    errorCell.style.color = 'red';
                    errorCell.colSpan = selected.size > 0 ? selected.size : 1;
                } else {
                    Array.from(selected).forEach(statDisplayName => {
                        const td = tr.insertCell();
                        td.textContent = getValueForStat(statDisplayName, userResult.data);
                    });
                }
                modalTableBody.appendChild(tr);
            }

            // Delay before starting the next batch
            if (i + batchSize < factionMembersIds.length) {
                await sleep(delayBetweenBatchesMs);
            }
        }
        
        hideLoadingSpinner();

    } catch (error) {
        console.error("Overall Fetch Error:", error);
        hideLoadingSpinner();
        showMainError(`Error: ${error.message}`);
    }
}
// Removed the direct fetchDataButton.addEventListener here.
// It will now be added inside onAuthStateChanged or after user state is known.

// Added this helper function to simplify error message display
function showMainError(message) {
    // ADDED THIS CHECK
    if (!message || message.trim() === '') {
        const existingMainInputError = document.querySelector('.main-input-error-feedback');
        if (existingMainInputError) {
            existingMainInputError.remove();
        }
        return; // Exit if message is empty
    }
    // END ADDITION

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
    const containerDiv = document.querySelector('.faction-peeper-tool-container');
    if (containerDiv) {
        const buttonsContainer = containerDiv.querySelector('.action-buttons-container');
        if (buttonsContainer && buttonsContainer.parentNode === containerDiv) {
            buttonsContainer.insertAdjacentElement('afterend', mainPageStatus);
        } else {
            containerDiv.appendChild(mainPageStatus);
        }
    }
    setTimeout(() => { if (mainPageStatus.parentElement) mainPageStatus.remove(); }, 7000);
}


document.addEventListener('DOMContentLoaded', function() {
    // Corrected: Target the container for the Useful Links dropdown
    const usefulLinksBtn = document.getElementById('usefulLinksBtn');
    const usefulLinksDropdownContainer = document.getElementById('usefulLinksDropdownContainer'); // Changed from usefulLinksDropdown

    // This function helps close other dropdowns if they are open
    function closeOtherDropdowns(currentDropdown, currentButton) {
        const allDropdowns = document.querySelectorAll('.dropdown-content.show'); // This might also include the Useful Links dropdown if it uses .dropdown-content.show
        allDropdowns.forEach(dropdown => {
            // Check if the dropdown's parent container is not the currentDropdownContainer
            if (dropdown.parentNode !== currentDropdown && dropdown.parentNode !== usefulLinksDropdownContainer) { // Added condition for usefulLinksDropdownContainer
                dropdown.classList.remove('show');
                // Remove 'active' class from its associated button if found
                const associatedButton = dropdown.previousElementSibling; // Assuming button is always before dropdown
                if (associatedButton && associatedButton.classList.contains('active')) {
                    associatedButton.classList.remove('active');
                }
            }
        });
    }


    if (usefulLinksBtn && usefulLinksDropdownContainer) { // Check for the container
        usefulLinksBtn.addEventListener('click', function(event) {
            event.stopPropagation();
            const currentlyOpen = usefulLinksDropdownContainer.classList.contains('show'); // Check if the container is open
            closeOtherDropdowns(usefulLinksDropdownContainer, usefulLinksBtn); // Close others

            if (!currentlyOpen) { // If it was not open, open it
                usefulLinksDropdownContainer.classList.add('show'); // Toggle class on container
                usefulLinksBtn.classList.add('active');
            } else {
                usefulLinksDropdownContainer.classList.remove('show'); // Toggle class on container
                usefulLinksBtn.classList.remove('active');
            }
        });
    }

    window.addEventListener('click', function(event) {
        // This global listener should also check the container
        if (usefulLinksDropdownContainer && usefulLinksDropdownContainer.classList.contains('show')) {
            if (!usefulLinksBtn.contains(event.target) && !usefulLinksDropdownContainer.contains(event.target)) {
                usefulLinksDropdownContainer.classList.remove('show');
                usefulLinksBtn.classList.remove('active');
            }
        }

        // Assuming contactUsBtn and contactUsDropdown are globally accessible or defined here
        const contactUsBtn = document.getElementById('contactUsBtn');
        const contactUsDropdown = document.getElementById('contactUsDropdown');
        if (contactUsDropdown && contactUsDropdown.classList.contains('show')) {
            if (!contactUsBtn.contains(event.target) && !contactUsDropdown.contains(event.target)) {
                contactUsDropdown.classList.remove('show');
                contactUsBtn.classList.remove('active');
            }
        }
    });

    const headerButtonsContainer = document.getElementById('headerButtonsContainer');
    const signUpButtonHeader = document.getElementById('signUpButtonHeader');
    const homeButtonFooter = document.getElementById('homeButtonFooter');
    const logoutButtonHeader = document.getElementById('logoutButtonHeader');
    const fetchDataButton = document.getElementById('fetchData'); // Get the button reference here
    const apiKeyErrorDiv = document.getElementById('apiKeyError'); // Get reference to the API key error div

    // --- Initial Setup for Login Status Feedback ---
    // The problematic lines are removed from here.
    if (fetchDataButton) {
        fetchDataButton.disabled = true; // Still disable button until login status is known
    }

    if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
    if (signUpButtonHeader) signUpButtonHeader.style.display = 'none';
    if (homeButtonFooter) homeButtonFooter.style.display = 'none';
    if (logoutButtonHeader) logoutButtonHeader.style.display = 'none';


    if (typeof auth !== 'undefined' && auth) {
        // This listener is crucial for handling the asynchronous Firebase login state
        auth.onAuthStateChanged(function(user) {
            const currentPagePath = window.location.pathname;
            const pageName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase() || 'index.html';
            const indexPages = ['index.html', 'home.html', ''];
            const isThisPageIndexPage = indexPages.includes(pageName);

            if (user) {
                console.log("User is signed in:", user.uid); // Confirm user is logged in
                if (headerButtonsContainer) headerButtonsContainer.style.display = 'flex';
                if (signUpButtonHeader) signUpButtonHeader.style.display = 'none';
                if (homeButtonFooter) homeButtonFooter.style.display = 'inline';

                if (isThisPageIndexPage && logoutButtonHeader) {
                    logoutButtonHeader.style.display = 'none';
                } else if (logoutButtonHeader) {
                    logoutButtonHeader.style.display = 'inline-flex';
                }
                // Add this inside your document.addEventListener('DOMContentLoaded', function() { ... }); block
                const headerLogoLink = document.getElementById('headerLogoLink');
                if (headerLogoLink) {
                    headerLogoLink.addEventListener('click', function(event) {
                        event.preventDefault(); // Prevent the default link behavior (navigating to '#')
                        window.location.href = 'home.html'; // Redirect to home.html
                    });
                }
                // Enable the fetchData button and set its listener with the user object
                if (fetchDataButton) {
                    fetchDataButton.disabled = false; // Enable the button
                    if (apiKeyErrorDiv) apiKeyErrorDiv.textContent = ''; // Clear the message here
                    else showMainError(''); // Clear fallback message too

                    // It's good practice to remove any old listeners before adding new ones
                    // This prevents the handler from being attached multiple times if onAuthStateChanged fires again.
                    // We need a named function reference to remove it correctly.
                    const existingListener = fetchDataButton._authClickListener; // Check if we stored a reference
                    if (existingListener) {
                        fetchDataButton.removeEventListener('click', existingListener);
                    }
                    const newListener = () => fetchData(user);
                    fetchDataButton.addEventListener('click', newListener);
                    fetchDataButton._authClickListener = newListener; // Store reference for future removal
                }

            } else {
                console.log("No user is signed in."); // Confirm no user is logged in
                if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
                if (signUpButtonHeader) {
                    if (!isThisPageIndexPage) {
                        signUpButtonHeader.style.display = 'inline-flex';
                    } else {
                        signUpButtonHeader.style.display = 'none';
                    }
                }
                if (homeButtonFooter) homeButtonFooter.style.display = 'none';
                if (logoutButtonHeader) logoutButtonHeader.style.display = 'none';

                const allowedNonAuthPages = ['index.html', 'home.html', 'faq.html', 'terms.html', 'signup.html', 'report.html', 'about.html', ''];
                if (!allowedNonAuthPages.includes(pageName)) {
                    // This is where you might redirect if a non-logged-in user is on an auth-required page
                    // window.location.href = 'home.html';
                }
                // If no user, disable fetchData button and show login prompt
                if (fetchDataButton) {
                    fetchDataButton.disabled = true; // Disable the button
                    if (apiKeyErrorDiv) apiKeyErrorDiv.textContent = 'Please sign in to fetch data.';
                    else showMainError('Please sign in to fetch data.');

                    // Remove previous listener
                    const existingListener = fetchDataButton._authClickListener;
                    if (existingListener) {
                        fetchDataButton.removeEventListener('click', existingListener);
                    }
                    // Add a new listener that just shows an error (or prompts for login)
                    fetchDataButton.addEventListener('click', () => showMainError('Firebase is not ready. Cannot fetch data.'));
                }
            }
        });
        if (logoutButtonHeader) {
            logoutButtonHeader.onclick = function() {
                auth.signOut().then(() => {
                    console.log('User signed out');
                    window.location.href = 'home.html';
                }).catch((error) => {
                    console.error('Sign out error', error);
                });
            };
        }
    } else {
        console.warn("Firebase auth object is not available when DOMContentLoaded. Header/footer UI might not reflect auth state correctly.");
        if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
        if (signUpButtonHeader) {
            const currentPagePath = window.location.pathname;
            const pageName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase() || 'index.html';
            const indexPages = ['index.html', 'home.html', ''];
            if (!indexPages.includes(pageName)) {
                signUpButtonHeader.style.display = 'inline-flex';
            } else {
                signUpButtonHeader.style.display = 'none';
            }
        }
        if (homeButtonFooter) homeButtonFooter.style.display = 'none';
        if (logoutButtonHeader) {
            logoutButtonHeader.style.display = 'none';
            logoutButtonHeader.onclick = function() { alert('Logout functionality (Firebase) not ready or auth not loaded.'); };
        }
        // If Firebase Auth itself isn't loaded, disable button and show error
        if (fetchDataButton) {
            fetchDataButton.disabled = true;
            if (apiKeyErrorDiv) apiKeyErrorDiv.textContent = 'Firebase is not loaded. Cannot check login status.';
            else showMainError('Firebase is not ready. Cannot fetch data.');
            fetchDataButton.addEventListener('click', () => showMainError('Firebase is not ready. Cannot fetch data.'));
        }
    }
});

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