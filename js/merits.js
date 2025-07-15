// --- merits.js ---

// DOM Elements
const loadingIndicator = document.getElementById('loading-indicator');
const errorDisplay = document.getElementById('error-display');
const playerNameSpan = document.getElementById('player-name');
const playerLevelSpan = document.getElementById('player-level');
const playerRankSpan = document.getElementById('player-rank');
const playerNetworthSpan = document.getElementById('player-networth');
const tabsContainer = document.querySelector('.tabs-container');
const tabContents = document.querySelectorAll('.tab-pane');

// Lists for dynamic content
const honorsAttackingList = document.getElementById('honors-attacking-list');
const honorsWeaponsList = document.getElementById('honors-weapons-list');
const honorsChainingList = document.getElementById('honors-chaining-list');
const honorsAttackingGeneralList = document.getElementById('honors-attacking-general-list');

const medalsCombatList = document.getElementById('medals-combat-list');
const medalsCommitmentList = document.getElementById('medals-commitment-list');
const medalsLevelList = document.getElementById('medals-level-list');
const medalsCrimesList = document.getElementById('medals-crimes-list');

const playerStatsList = document.getElementById('player-stats-list');


// --- Static Merit/Medal Data ---
// This is a SAMPLE subset. You will need to expand this with ALL your honor/medal requirements.
// The 'statKey' maps to the Torn API response path (e.g., playerData.attacks.attacks_won)
// The 'type' helps determine how to check progress (e.g., 'count', 'level', 'boolean')
// 'category' maps to the <ul> ID in HTML
const allHonors = [
    // Attacking Honors (Chaining is separate for now)
    { name: "Chainer 1", requirement: "Participate in a 10 length chain", statKey: "factions.chain_hits", threshold: 10, category: "honors-chaining-list", type: "count" },
    { name: "Chainer 2", requirement: "Participate in a 100 length chain", statKey: "factions.chain_hits", threshold: 100, category: "honors-chaining-list", type: "count" },
    { name: "Chainer 3", requirement: "Participate in a 1,000 length chain", statKey: "factions.chain_hits", threshold: 1000, category: "honors-chaining-list", type: "count" },
    { name: "Chainer 4", requirement: "Participate in a 10,000 length chain", statKey: "factions.chain_hits", threshold: 10000, category: "honors-chaining-list", type: "count" },
    { name: "Chainer 5", requirement: "Participate in a 100,000 length chain", statKey: "factions.chain_hits", threshold: 100000, category: "honors-chaining-list", type: "count" },
    { name: "Carnage", requirement: "Make a single hit that earns your faction 10 or more respect", statKey: "factions.best_chain_hit", threshold: 10, category: "honors-chaining-list", type: "count" }, // This is simplified, real logic is more complex for "best_chain_hit"
    { name: "Massacre", requirement: "Make a single hit that earns your faction 100 or more respect", statKey: "factions.best_chain_hit", threshold: 100, category: "honors-chaining-list", type: "count" },
    { name: "Strongest Link", requirement: "Make 100 hits in a single chain", statKey: "factions.max_chain_hits", threshold: 100, category: "honors-chaining-list", type: "count" }, // This might be personalstats.max_chain depending on API

    // Weapons Honors (Requires parsing multiple personalstats.weapon_xp, .finishing_hits_*)
    { name: "2800 Ft/S", requirement: "Achieve 100 finishing hits with rifles", statKey: "personalstats.finishing_hits_rifle", threshold: 100, category: "honors-weapons-list", type: "count" },
    { name: "Axe Wound", requirement: "Achieve 100 finishing hits with clubbing weapons", statKey: "personalstats.finishing_hits_club", threshold: 100, category: "honors-weapons-list", type: "count" },
    { name: "Unarmed", requirement: "Achieve 100 fists or kick finishing hits", statKey: "personalstats.finishing_hits_unarmed", threshold: 100, category: "honors-weapons-list", type: "count" },

    // General Attacking Honors
    { name: "Kill Streaker 1", requirement: "Achieve a 10 kill streak", statKey: "personalstats.kill_streak", threshold: 10, category: "honors-attacking-general-list", type: "count" },
    { name: "Kill Streaker 2", requirement: "Achieve a 100 kill streak", statKey: "personalstats.kill_streak", threshold: 100, category: "honors-attacking-general-list", type: "count" },
    { name: "Wham!", requirement: "Deal over 100,000 total damage", statKey: "personalstats.total_dam_dealt", threshold: 100000, category: "honors-attacking-general-list", type: "count" },
    { name: "Bounty Hunter", requirement: "Collect 250 bounties", statKey: "personalstats.bounties_collected", threshold: 250, category: "honors-attacking-general-list", type: "count" },

    // ... add more Honors here following the structure ...
];

const allMedals = [
    // Combat Medals
    { name: "Anti Social", requirement: "Win 50 attacks", statKey: "attacks.attacks_won", threshold: 50, category: "medals-combat-list", type: "count" },
    { name: "Happy Slapper", requirement: "Win 250 attacks", statKey: "attacks.attacks_won", threshold: 250, category: "medals-combat-list", type: "count" },
    { name: "Scar Maker", requirement: "Win 500 attacks", statKey: "attacks.attacks_won", threshold: 500, category: "medals-combat-list", type: "count" },
    { name: "Hired Gun", requirement: "Collect 25 bounties", statKey: "personalstats.bounties_collected", threshold: 25, category: "medals-combat-list", type: "count" },
    { name: "Bouncer", requirement: "Win 50 defends", statKey: "personalstats.defends_won", threshold: 50, category: "medals-combat-list", type: "count" },
    { name: "Brick wall", requirement: "Win 250 defends", statKey: "personalstats.defends_won", threshold: 250, category: "medals-combat-list", type: "count" },
    { name: "Boom Headshot", requirement: "Deal 500 critical hits", statKey: "personalstats.critical_hits", threshold: 500, category: "medals-combat-list", type: "count" },


    // Commitment Medals
    { name: "Citizenship", requirement: "Be a donator for 30 days", statKey: "personalstats.donator_days", threshold: 30, category: "medals-commitment-list", type: "count" },
    { name: "Devoted", requirement: "Be a donator for 100 days", statKey: "personalstats.donator_days", threshold: 100, category: "medals-commitment-list", type: "count" },
    { name: "One Year of Service", requirement: "Live in Torn for One Year", statKey: "personalstats.days_old", threshold: 365, category: "medals-commitment-list", type: "count" },
    { name: "Two Years of Service", requirement: "Live in Torn for Two Years", statKey: "personalstats.days_old", threshold: 730, category: "medals-commitment-list", type: "count" },

    // Level Medals
    { name: "Level Five", requirement: "Reach level Five", statKey: "basic.level", threshold: 5, category: "medals-level-list", type: "level" },
    { name: "Level Ten", requirement: "Reach level Ten", statKey: "basic.level", threshold: 10, category: "medals-level-list", type: "level" },
    { name: "Level Fifteen", requirement: "Reach level Fifteen", statKey: "basic.level", threshold: 15, category: "medals-level-list", type: "level" },
    { name: "Level One Hundred", requirement: "Reach level One Hundred", statKey: "basic.level", threshold: 100, category: "medals-level-list", type: "level" },

    // Crimes Medals (Simplified for demonstration as Crimes 1.0 vs 2.0 is complex)
    { name: "Trainee Troublemaker", requirement: "Commit 100 Criminal offenses", statKey: "personalstats.crimes.total", threshold: 100, category: "medals-crimes-list", type: "count" },
    { name: "Mastermind", requirement: "Participate in 100 Organized Crimes", statKey: "personalstats.organized_crimes", threshold: 100, category: "medals-crimes-list", type: "count" },
    { name: "Sneak Thief", requirement: "Commit 1,000 Theft crimes", statKey: "personalstats.crimes.theft", threshold: 1000, category: "medals-crimes-list", type: "count" },

    // ... add more Medals here following the structure ...
];


// --- Helper Functions ---

/**
 * Shows the loading indicator.
 */
function showLoading() {
    loadingIndicator.classList.remove('js-hidden-initially');
    errorDisplay.classList.add('js-hidden-initially'); // Hide any previous errors
}

/**
 * Hides the loading indicator.
 */
function hideLoading() {
    loadingIndicator.classList.add('js-hidden-initially');
}

/**
 * Shows an error message.
 * @param {string} message - The error message to display.
 */
function showError(message) {
    errorDisplay.textContent = `Error: ${message}`;
    errorDisplay.classList.remove('js-hidden-initially');
    hideLoading();
}

/**
 * Hides the error message.
 */
function hideError() {
    errorDisplay.classList.add('js-hidden-initially');
    errorDisplay.textContent = '';
}

/**
 * Formats a number with commas.
 * @param {number} num - The number to format.
 * @returns {string} The formatted number.
 */
function formatNumber(num) {
    return num.toLocaleString();
}

/**
 * Gets a nested property from an object using a dot-notation string.
 * E.g., getNestedProperty(playerData, "attacks.attacks_won")
 * @param {object} obj - The object to search within.
 * @param {string} path - The dot-notation path to the property.
 * @returns {*} The value of the property, or undefined if not found.
 */
function getNestedProperty(obj, path) {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

/**
 * Clears all dynamic content lists.
 */
function clearAllLists() {
    honorsAttackingList.innerHTML = '';
    honorsWeaponsList.innerHTML = '';
    honorsChainingList.innerHTML = '';
    honorsAttackingGeneralList.innerHTML = '';

    medalsCombatList.innerHTML = '';
    medalsCommitmentList.innerHTML = '';
    medalsLevelList.innerHTML = '';
    medalsCrimesList.innerHTML = '';

    playerStatsList.innerHTML = '';
}


// --- Main Data Handling Functions ---

/**
 * Fetches Torn player data from your Firebase backend.
 * @returns {Promise<object>} A promise that resolves with the player data.
 */
async function fetchTornData() {
    showLoading();
    hideError(); // Clear previous errors

    try {
        // IMPORTANT: Replace '/api/torn-data' with the actual endpoint of your Firebase Function
        // or backend service that calls the Torn API with the user's key.
        const response = await fetch('/api/torn-data', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // If your backend endpoint requires a Firebase ID token for auth:
                // 'Authorization': `Bearer ${await firebase.auth().currentUser.getIdToken()}`
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Backend error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('Torn API Data fetched:', data); // For debugging
        hideLoading();
        return data;

    } catch (error) {
        console.error('Error fetching Torn data:', error);
        showError('Failed to load Torn data. Please try again later.');
        return null;
    }
}

/**
 * Displays basic player information in the summary section.
 * @param {object} playerData - The player data from the Torn API.
 */
function displayPlayerSummary(playerData) {
    if (playerData && playerData.basic) {
        playerNameSpan.textContent = playerData.basic.name || 'N/A';
        playerLevelSpan.textContent = playerData.basic.level || 'N/A';
        playerRankSpan.textContent = playerData.basic.rank || 'N/A';
        playerNetworthSpan.textContent = playerData.personalstats && playerData.personalstats.networth ? `$${formatNumber(playerData.personalstats.networth)}` : 'N/A';
    } else {
        playerNameSpan.textContent = 'N/A';
        playerLevelSpan.textContent = 'N/A';
        playerRankSpan.textContent = 'N/A';
        playerNetworthSpan.textContent = 'N/A';
    }
}

/**
 * Updates the display for Honors and Medals based on player data.
 * @param {object} playerData - The player data from the Torn API.
 */
function updateAchievementsDisplay(playerData) {
    clearAllLists(); // Clear previous content

    const achievementLists = {
        'honors-attacking-list': honorsAttackingList,
        'honors-weapons-list': honorsWeaponsList,
        'honors-chaining-list': honorsChainingList,
        'honors-attacking-general-list': honorsAttackingGeneralList,
        'medals-combat-list': medalsCombatList,
        'medals-commitment-list': medalsCommitmentList,
        'medals-level-list': medalsLevelList,
        'medals-crimes-list': medalsCrimesList,
    };

    // Process Honors
    allHonors.forEach(honor => {
        const value = getNestedProperty(playerData, honor.statKey);
        let statusIconClass = 'not-started';
        let progressText = '';
        let isCompleted = false;

        if (value !== undefined && value !== null) {
            if (honor.type === 'count' || honor.type === 'level') {
                if (value >= honor.threshold) {
                    statusIconClass = 'completed';
                    isCompleted = true;
                } else {
                    statusIconClass = 'in-progress';
                    progressText = ` (Progress: ${formatNumber(value)}/${formatNumber(honor.threshold)})`;
                }
            } else {
                // For other types, you'd add specific logic
                // For now, if value exists and isn't 0, assume progress or completion
                 if (value > 0) { // Generic check for non-count/level stats
                    statusIconClass = 'in-progress';
                    progressText = ` (Current: ${formatNumber(value)})`;
                 }
            }
        }

        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <span class="merit-status-icon ${statusIconClass}">${isCompleted ? '✔' : (statusIconClass === 'in-progress' ? '●' : '◎')}</span>
            <span class="merit-details">
                <span class="merit-name">${honor.name}</span> -
                <span class="merit-requirement">${honor.requirement}</span>
                <span class="merit-progress">${progressText}</span>
            </span>
        `;
        achievementLists[honor.category].appendChild(listItem);
    });

    // Process Medals (similar logic to Honors, you can refactor if too much duplication)
    allMedals.forEach(medal => {
        const value = getNestedProperty(playerData, medal.statKey);
        let statusIconClass = 'not-started';
        let progressText = '';
        let isCompleted = false;

        if (value !== undefined && value !== null) {
            if (medal.type === 'count' || medal.type === 'level') {
                if (value >= medal.threshold) {
                    statusIconClass = 'completed';
                    isCompleted = true;
                } else {
                    statusIconClass = 'in-progress';
                    progressText = ` (Progress: ${formatNumber(value)}/${formatNumber(medal.threshold)})`;
                    if (medal.type === 'level') {
                        progressText = ` (Current Level: ${formatNumber(value)})`; // Specific for level
                    }
                }
            }
            // Add more specific medal types here if needed
        }

        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <span class="merit-status-icon ${statusIconClass}">${isCompleted ? '✔' : (statusIconClass === 'in-progress' ? '●' : '◎')}</span>
            <span class="merit-details">
                <span class="merit-name">${medal.name}</span> -
                <span class="merit-requirement">${medal.requirement}</span>
                <span class="merit-progress">${progressText}</span>
            </span>
        `;
        achievementLists[medal.category].appendChild(listItem);
    });
}

/**
 * Populates the Player Stats Overview tab.
 * @param {object} playerData - The player data from the Torn API.
 */
function populatePlayerStats(playerData) {
    const statsContainer = document.getElementById('player-stats-list');
    statsContainer.innerHTML = ''; // Clear previous stats

    if (!playerData || !playerData.personalstats) {
        statsContainer.innerHTML = '<li>No detailed stats available.</li>';
        return;
    }

    const statsMapping = {
        'Attacks Won': 'attacks.attacks_won',
        'Defends Won': 'personalstats.defends_won',
        'Crimes Committed': 'personalstats.crimes.total',
        'Items Found': 'personalstats.items_found',
        'Medical Items Used': 'personalstats.medical_items_used',
        'Times Hospitalized': 'personalstats.times_hospitalized',
        'Times Jailed': 'personalstats.times_jailed',
        'Travels Made': 'personalstats.travel_count',
        'Bounties Collected': 'personalstats.bounties_collected',
        'Busted People from Jail': 'personalstats.busting_busted',
        'Revives Given': 'personalstats.revives', // Ensure this stat is fetched via API
        'Max Chain Hits': 'personalstats.max_chain', // Or factions.max_chain_hits
        'Total Damage Dealt': 'personalstats.total_dam_dealt',
        'Total Critical Hits': 'personalstats.critical_hits',
        'Total Respect Earned': 'personalstats.respect',
        'Networth': 'personalstats.networth',
        'Strength': 'personalstats.strength',
        'Defense': 'personalstats.defense',
        'Speed': 'personalstats.speed',
        'Dexterity': 'personalstats.dexterity',
        'Life': 'personalstats.life',
        'Level': 'basic.level',
        'Rank': 'basic.rank'
    };

    for (const [displayName, statPath] of Object.entries(statsMapping)) {
        const value = getNestedProperty(playerData, statPath);
        const li = document.createElement('li');
        li.innerHTML = `<strong>${displayName}:</strong> <span id="stat-${statPath.replace(/\./g, '-')}">${typeof value === 'number' ? formatNumber(value) : (value || 'N/A')}</span>`;
        statsContainer.appendChild(li);
    }
}


// --- Tab Switching Logic ---

/**
 * Handles switching between tabs.
 * @param {string} tabId - The ID of the tab to activate (e.g., 'honors-tab').
 */
function switchTab(tabId) {
    // Deactivate all tab buttons and content panes
    tabsContainer.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    tabContents.forEach(pane => {
        pane.classList.add('js-hidden-initially');
    });

    // Activate the clicked tab button and its content pane
    const activeButton = tabsContainer.querySelector(`[data-tab="${tabId.replace('-tab', '')}"]`);
    const activePane = document.getElementById(tabId);

    if (activeButton) {
        activeButton.classList.add('active');
    }
    if (activePane) {
        activePane.classList.remove('js-hidden-initially');
    }
}

// Event listener for tab buttons
tabsContainer.addEventListener('click', (event) => {
    const targetButton = event.target.closest('.tab-button');
    if (targetButton) {
        const tabName = targetButton.dataset.tab;
        switchTab(`${tabName}-tab`);
    }
});


// --- Initialization Function ---

/**
 * Initializes the Merits page, fetches data, and updates UI.
 */
async function initializeMeritsPage() {
    hideError();
    showLoading(); // Show loading initially

    // Check Firebase authentication state
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            console.log("User is logged in:", user.uid);
            const playerData = await fetchTornData();
            if (playerData) {
                displayPlayerSummary(playerData);
                updateAchievementsDisplay(playerData);
                populatePlayerStats(playerData); // Populate stats for the overview tab
            } else {
                showError('Could not load player data. Ensure your API key is correctly set in Firebase.');
            }
        } else {
            console.log("No user logged in.");
            hideLoading();
            showError('Please log in to view your Torn Honors & Medals.');
            // Optionally redirect to login page
            // window.location.href = 'login.html';
        }
    });
}

// Run initialization when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeMeritsPage);