// Stat selection logic (remains the same as before)
const popularPresetStats = ['Level', 'Age', 'Last Action', 'Xanax Taken', 'Refills', 'Total War Hits'];
const statCategories = [
    { name: "⭐ Most Popular.", stats: popularPresetStats },
    { name: "⚔️ Combat.", stats: ['Attacks Won', 'Attacks Lost', 'Attacks Draw', 'Defends Won', 'Defends Lost', 'Total Attack Hits', 'Attack Damage Dealt', 'Best Single Hit Damage', 'Critical Hits', 'One-Hit Kills', 'Best Kill Streak', 'ELO Rating', 'Stealth Attacks', 'Highest Level Beaten', 'Unarmed Fights Won', 'Times You Ran Away', 'Opponent Ran Away', 'Total War Assists'] },
    { name: "💰 Economy & Items.", stats: ['Networth', 'Money Mugged', 'Largest Mug', 'Bazaar Profit ($)', 'Bazaar Sales (#)', 'Bazaar Customers', 'Points Bought', 'Points Sold', 'Items Bought (Market/Shops)', 'City Items Bought', 'Items Bought Abroad', 'Items Sent', 'Items Looted', 'Items Dumped', 'Trades Made', 'Businesses Owned', 'Properties Owned'] },
    { name: "🚨 Crime & Jail.", stats: ['Criminal Record (Total)', 'Times Jailed', 'People Busted', 'Failed Busts', 'Arrests Made'] },
    { name: "💊 Medical & Drugs.", stats: ['Medical Items Used', 'Times Hospitalized', 'Drugs Used (Times)', 'Times Overdosed', 'Times Rehabbed', 'Boosters Used', 'Energy Drinks Used', 'Alcohol Used', 'Candy Used', 'Nerve Refills Used'] },
    { name: "📈 Activity & Progress.", stats: ['Daily Login Streak', 'Best Active Streak', 'User Activity', 'Awards', 'Donator Days', 'Missions Completed', 'Contracts Completed', 'Mission Credits Earned', 'Job Points Used', 'Stat Trains Received', 'Travels Made', 'City Finds', 'Dump Finds', 'Items Dumped', 'Books Read', 'Viruses Coded', 'Races Won', 'Racing Skill', 'Status', 'Respect'] },
    { name: "🎯 Bounties & Revives.", stats: ['Total Bounties', 'Bounties Placed', 'Bounties Collected', 'Money Spent on Bounties', 'Money From Bounties Collected', 'Revives Made', 'Revives Received', 'Revive Skill'] }
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
        } else if (index === 1 || index === 4) {
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

function showLoadingSpinner() {
    document.getElementById('loadingOverlay')?.classList.add('visible');
}
function hideLoadingSpinner() {
    document.getElementById('loadingOverlay')?.classList.remove('visible');
}
function showResultsModal() {
    document.getElementById('resultsModalOverlay')?.classList.add('visible');
}
function closeResultsModal() {
    const overlay = document.getElementById('resultsModalOverlay');
    if (overlay) overlay.classList.remove('visible');
    const tableBody = document.getElementById('modal-results-table-body');
    if (tableBody) tableBody.innerHTML = '';
}

function getValueForStat(statDisplayName, userData) {
    let value = 'N/A';
    const personalstats = userData.personalstats || {};

    switch (statDisplayName) {
        case 'Level': value = userData.level; break;
        case 'Age': value = userData.age; break;
        case 'Last Action': value = userData.last_action?.relative; break;
        case 'Status': value = userData.status?.description; break;
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
        default: value = 'N/A';
    }

    if (value === undefined || value === null || value === "") {
        return 'N/A';
    }

    if (typeof value === 'number' && !isNaN(value)) {
        return value.toLocaleString();
    }
    
    // Handle cases like "22 hours ago" -> "22 Hours Ago"
    if (typeof value === 'string' && value.includes(' ago')) {
        return value.charAt(0).toUpperCase() + value.slice(1).replace(' ago', ' Ago');
    }

    return String(value);
}

// *** THIS IS THE MAIN MODIFIED FUNCTION ***
async function fetchData(user) {
    showLoadingSpinner();
    const userIdError = document.getElementById('userIdError');
    const statsError = document.getElementById('statsError');

    // Clear previous errors
    if (userIdError) userIdError.textContent = '';
    if (statsError) statsError.textContent = '';
    document.querySelector('.main-input-error-feedback')?.remove();

    const userIdInput = document.getElementById('userId');
    const userId = userIdInput ? userIdInput.value.trim() : '';

    let hasError = false;
    if (!userId || isNaN(userId)) {
        if (userIdError) userIdError.textContent = 'Profile ID is required and must be a number.';
        hasError = true;
    }
    if (selected.size === 0) {
        if (statsError) statsError.textContent = 'Please select at least one stat.';
        hasError = true;
    } else if (selected.size > maxSelection) {
        if (statsError) statsError.textContent = `Maximum ${maxSelection} stats selected.`;
        hasError = true;
    }

    if (hasError) {
        hideLoadingSpinner();
        return;
    }

    let currentApiKey = '';
    try {
        const userDocRef = db.collection('userProfiles').doc(user.uid);
        const userDoc = await userDocRef.get();
        if (userDoc.exists && userDoc.data().tornApiKey) {
            currentApiKey = userDoc.data().tornApiKey;
        } else {
            throw new Error('Your Torn API Key is not set in your profile.');
        }
    } catch (error) {
        showMainError(`Error fetching API Key: ${error.message}`);
        hideLoadingSpinner();
        return;
    }

    try {
        const selections = ['profile', 'personalstats']; // Always fetch these
        const apiUrl = `https://api.torn.com/user/${userId}?selections=${selections.join(',')}&key=${currentApiKey}`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) {
            const errorText = await response.text().catch(() => "Could not read error text");
            throw new Error(`Torn API Error (HTTP ${response.status}): ${errorText.substring(0, 100)}`);
        }
        
        const userData = await response.json();
        if (userData.error) {
            throw new Error(`Torn API Error: ${userData.error.error}`);
        }

        // --- Populate the modal ---
        const modalUserName = document.getElementById('modal-user-name');
        const modalUserId = document.getElementById('modal-user-id');
        const modalTableBody = document.getElementById('modal-results-table-body');

        if (modalUserName) modalUserName.textContent = userData.name || 'Unknown';
        if (modalUserId) modalUserId.textContent = userData.player_id || userId;
        if (modalTableBody) modalTableBody.innerHTML = '';

        Array.from(selected).forEach(statName => {
            const tr = document.createElement('tr');
            
            const statCell = tr.insertCell();
            statCell.textContent = statName;

            const valueCell = tr.insertCell();
            valueCell.textContent = getValueForStat(statName, userData);

            if (modalTableBody) modalTableBody.appendChild(tr);
        });

        hideLoadingSpinner();
        showResultsModal();

    } catch (error) {
        console.error("Fetch Error:", error);
        hideLoadingSpinner();
        showMainError(`Error: ${error.message}`);
    }
}

function showMainError(message) {
    document.querySelector('.main-input-error-feedback')?.remove();
    if (!message || message.trim() === '') return;
    
    const mainPageStatus = document.createElement('div');
    mainPageStatus.textContent = message;
    mainPageStatus.className = 'main-input-error-feedback';
    
    const containerDiv = document.querySelector('.profile-peeper-tool-container');
    const buttonsContainer = containerDiv?.querySelector('.action-buttons-container');
    buttonsContainer?.insertAdjacentElement('afterend', mainPageStatus);

    setTimeout(() => mainPageStatus.remove(), 7000);
}

// Auth and other initial setup logic (largely unchanged)
document.addEventListener('DOMContentLoaded', function() {
    const fetchDataButton = document.getElementById('fetchData');
    const userIdErrorDiv = document.getElementById('userIdError');

    if (fetchDataButton) fetchDataButton.disabled = true;

    if (typeof auth !== 'undefined' && auth) {
        auth.onAuthStateChanged(function(user) {
            if (user) {
                // User is signed in
                if (fetchDataButton) {
                    fetchDataButton.disabled = false;
                    if (userIdErrorDiv) userIdErrorDiv.textContent = '';
                    else showMainError('');

                    const existingListener = fetchDataButton._authClickListener;
                    if (existingListener) {
                        fetchDataButton.removeEventListener('click', existingListener);
                    }
                    const newListener = () => fetchData(user);
                    fetchDataButton.addEventListener('click', newListener);
                    fetchDataButton._authClickListener = newListener;
                }
            } else {
                // No user is signed in
                if (fetchDataButton) {
                    fetchDataButton.disabled = true;
                    showMainError('Please sign in to fetch data.');

                    const existingListener = fetchDataButton._authClickListener;
                    if (existingListener) {
                        fetchDataButton.removeEventListener('click', existingListener);
                    }
                }
            }
        });
    } else {
        // Firebase auth script not loaded
        if (fetchDataButton) {
            fetchDataButton.disabled = true;
            showMainError('Firebase is not ready. Cannot fetch data.');
        }
    }
});