// --- merits.js ---

// DOM Elements
const loadingIndicator = document.getElementById('loading-indicator');
const errorDisplay = document.getElementById('error-display');
const playerNameSpan = document.getElementById('player-name');
const playerLevelSpan = document.getElementById('player-level');
const playerTotalStatsSpan = document.getElementById('player-total-stats'); // Updated order in HTML

const playerNetworthSpan = document.getElementById('player-networth');

const playerAwardsSpan = document.getElementById('player-awards'); // Updated order in HTML

const tabsContainer = document.querySelector('.tabs-container');
const tabContents = document.querySelectorAll('.tab-pane');

// Lists for dynamic content
const honorsAttackingList = document.getElementById('honors-attacking-list');
const honorsWeaponsList = document.getElementById('honors-weapons-list');
const honorsChainingList = document.getElementById('honors-chaining-list');

const medalsCombatList = document.getElementById('medals-combat-list');
const medalsCommitmentList = document.getElementById('medals-commitment-list'); // This list will now hold both Level and Commitment Medals

const medalsCrimesList = document.getElementById('medals-crimes-list');

const playerStatsList = document.getElementById('player-stats-list');


// --- Static Merit/Medal Data (SAMPLE - EXPAND THIS!) ---
// This is a SAMPLE subset. You will need to expand this with ALL your honor/medal requirements.
// The 'statKey' maps to the Torn API response path (e.g., playerData.personalstats.attackswon)
// The 'type' helps determine how to check progress (e.g., 'count', 'level', 'boolean')
// 'category' maps to the <ul> ID in HTML
const allHonors = [
    // Chaining Honors
    { name: "Chainer 1", requirement: "Participate in a 10 length chain", statKey: "personalstats.chains", threshold: 10, category: "honors-chaining-list", type: "count" },
    { name: "Chainer 2", requirement: "Participate in a 100 length chain", statKey: "personalstats.chains", threshold: 100, category: "honors-chaining-list", type: "count" },
    { name: "Chainer 3", requirement: "Participate in a 1,000 length chain", statKey: "personalstats.chains", threshold: 1000, category: "honors-chaining-list", type: "count" },
    { name: "Chainer 4", requirement: "Participate in a 10,000 length chain", statKey: "personalstats.chains", threshold: 10000, category: "honors-chaining-list", type: "count" },
    { name: "Chainer 5", requirement: "Participate in a 100,000 length chain", statKey: "personalstats.chains", threshold: 100000, category: "honors-chaining-list", type: "count" },
    { name: "Carnage", requirement: "Make a single hit that earns your faction 10 or more respect", statKey: "personalstats.best_chain_hit", threshold: 10, category: "honors-chaining-list", type: "count" },
    { name: "Massacre", requirement: "Make a single hit that earns your faction 100 or more respect", statKey: "personalstats.best_chain_hit", threshold: 100, category: "honors-chaining-list", type: "count" },
    { name: "Strongest Link", requirement: "Make 100 hits in a single chain", statKey: "personalstats.max_chain", threshold: 100, category: "honors-chaining-list", type: "count" },

    // Weapons Honors
    { name: "2800 Ft/S", requirement: "Achieve 100 finishing hits with rifles", statKey: "personalstats.rifhits", threshold: 100, category: "honors-weapons-list", type: "count" },
    { name: "Axe Wound", requirement: "Achieve 100 finishing hits with clubbing weapons", statKey: "personalstats.axehits", threshold: 100, category: "honors-weapons-list", type: "count" },
    { name: "Unarmed", requirement: "Achieve 100 fists or kick finishing hits", statKey: "personalstats.h2hhits", threshold: 100, category: "honors-weapons-list", type: "count" },

    // General Attacking Honors - NOW ALL ASSIGNED TO 'honors-attacking-list'
    { name: "Kill Streaker 1", requirement: "Achieve a 10 kill streak", statKey: "personalstats.killstreak", threshold: 10, category: "honors-attacking-list", type: "count" },
    { name: "Kill Streaker 2", requirement: "Achieve a 100 kill streak", statKey: "personalstats.killstreak", threshold: 100, category: "honors-attacking-list", type: "count" },
    { name: "Wham!", requirement: "Deal over 100,000 total damage", statKey: "personalstats.attackdamage", threshold: 100000, category: "honors-attacking-list", type: "count" },
    { name: "Bounty Hunter", requirement: "Collect 250 bounties", statKey: "personalstats.bountiescollected", threshold: 250, category: "honors-attacking-list", type: "count" },
];

const allMedals = [
    // Combat Medals
    { name: "Anti Social", requirement: "Win 50 attacks", statKey: "personalstats.attackswon", threshold: 50, category: "medals-combat-list", type: "count" },
    { name: "Happy Slapper", requirement: "Win 250 attacks", statKey: "personalstats.attackswon", threshold: 250, category: "medals-combat-list", type: "count" },
    { name: "Scar Maker", requirement: "Win 500 attacks", statKey: "personalstats.attackswon", threshold: 500, category: "medals-combat-list", type: "count" },
    { name: "Hired Gun", requirement: "Collect 25 bounties", statKey: "personalstats.bountiescollected", threshold: 25, category: "medals-combat-list", type: "count" },
    { name: "Bouncer", requirement: "Win 50 defends", statKey: "personalstats.defendswon", threshold: 50, category: "medals-combat-list", type: "count" },
    { name: "Brick wall", requirement: "Win 250 defends", statKey: "personalstats.defendswon", threshold: 250, category: "medals-combat-list", type: "count" },
    { name: "Boom Headshot", requirement: "Deal 500 critical hits", statKey: "personalstats.attackcriticalhits", threshold: 500, category: "medals-combat-list", type: "count" },

    // Level & Commitment Medals - NOW ALL ASSIGNED TO 'medals-commitment-list'
    { name: "Citizenship", requirement: "Be a donator for 30 days", statKey: "personalstats.daysbeendonator", threshold: 30, category: "medals-commitment-list", type: "count" },
    { name: "Devoted", requirement: "Be a donator for 100 days", statKey: "personalstats.daysbeendonator", threshold: 100, category: "medals-commitment-list", type: "count" },
    { name: "One Year of Service", requirement: "Live in Torn for One Year", statKey: "personalstats.days_old", threshold: 365, category: "medals-commitment-list", type: "count" },
    { name: "Two Years of Service", requirement: "Live in Torn for Two Years", statKey: "personalstats.days_old", threshold: 730, category: "medals-commitment-list", type: "count" },
    { name: "Level Five", requirement: "Reach level Five", statKey: "level", threshold: 5, category: "medals-commitment-list", type: "level" },
    { name: "Level Ten", requirement: "Reach level Ten", statKey: "level", threshold: 10, category: "medals-commitment-list", type: "level" },
    { name: "Level Fifteen", requirement: "Reach level Fifteen", statKey: "level", threshold: 15, category: "medals-commitment-list", type: "level" },
    { name: "Level One Hundred", requirement: "Reach level One Hundred", statKey: "level", threshold: 100, category: "medals-commitment-list", type: "level" },

    // Crimes Medals
    { name: "Trainee Troublemaker", requirement: "Commit 100 Criminal offenses", statKey: "personalstats.criminaloffenses", threshold: 100, category: "medals-crimes-list", type: "count" },
    { name: "Mastermind", requirement: "Participate in 100 Organized Crimes", statKey: "personalstats.organisedcrimes", threshold: 100, category: "medals-crimes-list", type: "count" },
    { name: "Sneak Thief", requirement: "Commit 1,000 Theft crimes", statKey: "personalstats.theft", threshold: 1000, category: "medals-crimes-list", type: "count" },
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
    if (typeof num !== 'number' || isNaN(num)) {
        return 'N/A';
    }
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

    medalsCombatList.innerHTML = '';
    medalsCommitmentList.innerHTML = ''; // This now clears the combined list

    medalsCrimesList.innerHTML = '';

    playerStatsList.innerHTML = '';
}


// --- Main Data Handling Functions ---

/**
 * Fetches Torn player data directly from the Torn API.
 * This function assumes the API key is retrieved from Firestore.
 * @param {string} apiKey - The Torn API key for the current user.
 * @returns {Promise<object>} A promise that resolves with the player data.
 */
async function fetchTornDataDirectly(apiKey) {
    if (!apiKey) {
        throw new Error("No Torn API key found.");
    }

    // Torn API v2 selections: streamlined to basic and personalstats for robustness.
    // 'basic' contains name, level, gender. 'personalstats' contains a vast array of user stats.
    const selections = "basic,personalstats";
    const tornApiUrl = `https://api.torn.com/user/?selections=${selections}&key=${apiKey}`;

    try {
        const response = await fetch(tornApiUrl);

        if (!response.ok) {
            let errorDetail = await response.text();
            try {
                const errorJson = JSON.parse(errorDetail);
                if (errorJson && errorJson.error && errorJson.error.error) {
                    errorDetail = errorJson.error.error;
                }
            } catch (e) {
                // Not JSON, use raw text
            }
            throw new Error(`Torn API error: ${response.status} - ${errorDetail}`);
        }

        const data = await response.json();

        if (data.error && data.error.error) {
            throw new Error(`Torn API error: ${data.error.error}`);
        }

        console.log('Torn API Data fetched:', data); // For debugging
        hideLoading();
        return data;

    } catch (error) {
        console.error('Error fetching Torn data:', error);
        if (error.message.includes("Invalid key") || error.message.includes("Incorrect key")) {
            showError('Invalid Torn API key. Please update your API key in your profile settings.');
        } else if (error.message.includes("Too many requests")) {
            showError('Torn API rate limit hit. Please wait a moment and refresh.');
        } else if (error.message.includes("wrongfields")) {
            showError('Torn API returned "wrongfields". This usually means a requested data field does not exist. Check console for details.');
        } else {
            showError(`Failed to load Torn data: ${error.message}.`);
        }
        return null;
    }
}

function displayPlayerSummary(playerData) {
    console.log("displayPlayerSummary: Processing playerData:", playerData);

    if (playerData) {
        playerNameSpan.textContent = playerData.name || 'N/A';
        playerLevelSpan.textContent = formatNumber(playerData.level) || 'N/A';

        // Networth is in personalstats
        const networth = playerData.personalstats ? playerData.personalstats.networth : undefined;
        playerNetworthSpan.textContent = networth !== undefined ? `$${formatNumber(networth)}` : 'N/A';

        // Total Stats and Awards are in personalstats
        const totalStats = playerData.personalstats ? playerData.personalstats.totalstats : undefined;
        playerTotalStatsSpan.textContent = totalStats !== undefined ? formatNumber(totalStats) : 'N/A';

        const awards = playerData.personalstats ? playerData.personalstats.awards : undefined;
        playerAwardsSpan.textContent = awards !== undefined ? formatNumber(awards) : 'N/A';

        // More granular logging for debugging specific values
        console.log(`  Name: ${playerNameSpan.textContent}`);
        console.log(`  Level: ${playerLevelSpan.textContent}`);
        // console.log(`  Rank (after checks): ${playerRankSpan.textContent}`); // DELETE OR COMMENT OUT
        console.log(`  Networth: ${playerNetworthSpan.textContent}`);
        // console.log(`  Life: ${playerLifeSpan ? playerLifeSpan.textContent : 'N/A (span not found)'}`); // DELETE OR COMMENT OUT
        console.log(`  Total Stats: ${playerTotalStatsSpan.textContent}`);
        console.log(`  Awards: ${playerAwardsSpan.textContent}`);

    } else {
        console.warn("displayPlayerSummary: playerData is missing.");
        playerNameSpan.textContent = 'N/A';
        playerLevelSpan.textContent = 'N/A';
        // playerRankSpan.textContent = 'N/A'; // DELETE OR COMMENT OUT
        playerNetworthSpan.textContent = 'N/A';
        // if (playerLifeSpan) { // DELETE OR COMMENT OUT
        //     playerLifeSpan.textContent = 'N/A'; // DELETE OR COMMENT OUT
        // }
        playerTotalStatsSpan.textContent = 'N/A';
        playerAwardsSpan.textContent = 'N/A';
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

        'medals-combat-list': medalsCombatList,
        'medals-commitment-list': medalsCommitmentList, // This now points to the combined list

        'medals-crimes-list': medalsCrimesList,
    };

    // Helper to process a list of achievements (Honors or Medals)
    const processAchievements = (achievements, isMedal = false) => {
        achievements.forEach(achievement => {
            const value = getNestedProperty(playerData, achievement.statKey);

            // Detailed logging for each achievement processing step
            // console.log(`Processing ${achievement.name}:`);
            // console.log(`  Stat Key: ${achievement.statKey}`);
            // console.log(`  Value from API:`, value);
            // console.log(`  Threshold: ${achievement.threshold}`);

            let statusIconClass = 'not-started';
            let statusSymbol = '◎'; // Default not started symbol
            let progressText = '';
            let isCompleted = false;

            if (value !== undefined && value !== null) {
                if (achievement.type === 'count' || achievement.type === 'level') {
                    if (value >= achievement.threshold) {
                        statusIconClass = 'completed';
                        statusSymbol = '✔';
                        isCompleted = true;
                    } else {
                        statusIconClass = 'in-progress';
                        statusSymbol = '●';
                        progressText = ` (Progress: ${formatNumber(value)}/${formatNumber(achievement.threshold)})`;
                        if (achievement.type === 'level') {
                            progressText = ` (Current Level: ${formatNumber(value)})`; // Specific for level
                        }
                    }
                }
                // Add more complex type checks here if needed (e.g., for boolean flags, or specific item counts)
            }

            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <span class="merit-status-icon ${statusIconClass}">${statusSymbol}</span>
                <span class="merit-details">
                    <span class="merit-name">${achievement.name}</span> -
                    <span class="merit-requirement">${achievement.requirement}</span>
                    <span class="merit-progress">${progressText}</span>
                </span>
            `;
            // Append to the correct list based on category
            if (achievementLists[achievement.category]) {
                achievementLists[achievement.category].appendChild(listItem);
            } else {
                console.warn(`Category list not found for: ${achievement.category}. Check HTML ID or allHonors/allMedals category assignment.`);
            }
        });
    };

    processAchievements(allHonors);
    processAchievements(allMedals);
}

/**
 * Populates the Player Stats Overview tab.
 * @param {object} playerData - The player data from the Torn API.
 */
function populatePlayerStats(playerData) {
    const statsContainer = document.getElementById('player-stats-list');
    statsContainer.innerHTML = ''; // Clear previous stats

    // Ensure playerData and at least personalstats are available for basic overview
    if (!playerData || !playerData.personalstats) {
        statsContainer.innerHTML = '<li>No detailed stats available.</li>';
        return;
    }

    const statsMapping = {
        'Attacks Won': 'personalstats.attackswon',
        'Defends Won': 'personalstats.defendswon',
        'Crimes Committed (Total)': 'personalstats.criminaloffenses',
        'Items Found': 'personalstats.cityfinds',
        'Medical Items Used': 'personalstats.medicalitemsused',
        'Times Hospitalized': 'personalstats.hospital',
        'Times Jailed': 'personalstats.jailed',
        'Travels Made': 'personalstats.traveltimes',
        'Bounties Collected': 'personalstats.bountiescollected',
        'Busted People from Jail': 'personalstats.peoplebusted',
        'Revives Given': 'personalstats.revives',
        'Max Chain Hits (Personal)': 'personalstats.max_chain',
        'Total Damage Dealt': 'personalstats.attackdamage',
        'Total Critical Hits': 'personalstats.attackcriticalhits',
        'Total Respect Earned': 'personalstats.respectforfaction',
        'Networth': 'personalstats.networth',
        'Strength': 'personalstats.strength',
        'Defense': 'personalstats.defense',
        'Speed': 'personalstats.speed',
        'Dexterity': 'personalstats.dexterity',
        'Life': 'personalstats.life',
        'Level': 'level', // Path is direct from playerData
        'Rank': (playerData.basic && playerData.basic.rank) ? 'basic.rank' : 'rank' // Path for rank, conditional check
    };

    for (const [displayName, statPath] of Object.entries(statsMapping)) {
        let value;
        // Special handling for 'Rank' as its path might be conditional
        if (displayName === 'Rank') {
            value = (playerData.basic && playerData.basic.rank) ? playerData.basic.rank : playerData.rank;
        } else if (typeof statPath === 'string') {
             value = getNestedProperty(playerData, statPath);
        } else {
            // Fallback for unexpected statPath type, though should be string for this map
            value = 'N/A';
        }

        const li = document.createElement('li');
        li.innerHTML = `<strong>${displayName}:</strong> <span id="stat-${displayName.replace(/\s/g, '-').toLowerCase()}">${typeof value === 'number' ? formatNumber(value) : (value || 'N/A')}</span>`;
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
        // Ensure ALL panes are hidden explicitly
        pane.classList.remove('active'); // Remove active class if it was somehow present
        pane.style.display = 'none'; // Directly set display to none
    });

    // Activate the clicked tab button and its content pane
    const activeButton = tabsContainer.querySelector(`[data-tab="${tabId.replace('-tab', '')}"]`);
    const activePane = document.getElementById(tabId);

    if (activeButton) {
        activeButton.classList.add('active');
    }
    if (activePane) {
        activePane.style.display = 'flex'; // Directly set display to flex for active pane
        // Add active class if your CSS uses it for styling beyond just display
        activePane.classList.add('active');
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

    // Listen for Firebase authentication state changes
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            console.log("User is logged in:", user.uid);
            // Fetch the user's API key from Firestore
            const db = firebase.firestore();
            try {
                const userDocRef = db.collection('userProfiles').doc(user.uid);
                const doc = await userDocRef.get();

                if (doc.exists && doc.data() && doc.data().tornApiKey) {
                    const tornApiKey = doc.data().tornApiKey;
                    console.log("Torn API Key retrieved from Firestore.");

                    const playerData = await fetchTornDataDirectly(tornApiKey);
                    if (playerData) {
                        displayPlayerSummary(playerData);
                        updateAchievementsDisplay(playerData);
                        populatePlayerStats(playerData); // Populate stats for the overview tab

                        // Initial tab display: ensure correct tab is shown after data loads
                        // The 'active' class on honors-tab in HTML will handle initial display via CSS
                        // but if we were explicitly showing a different tab, we'd call switchTab here.
                        // For now, it defaults to Honors tab via HTML/CSS.
                    } else {
                        // Error message handled by fetchTornDataDirectly
                        console.log("Player data could not be fetched by fetchTornDataDirectly (error already displayed).");
                    }
                } else {
                    hideLoading();
                    showError('No Torn API key found for your account. Please set it in your profile settings.');
                    console.warn("tornApiKey field is missing in user's Firestore document or document does not exist.");
                }
            } catch (firestoreError) {
                console.error("Error fetching API key from Firestore:", firestoreError);
                hideLoading();
                if (firestoreError.code === 'permission-denied') {
                     showError('Permission denied to access your data. Please check Firebase Security Rules.');
                } else {
                     showError('Failed to retrieve your API key. Please check your internet connection or try again later.');
                }
            }
        } else {
            console.log("No user logged in. Redirecting or prompting login.");
            hideLoading();
            showError('Please log in to view your Torn Honors & Medals.');
            // Optionally redirect to login page
            // window.location.href = 'login.html';
        }
    });
}

// Run initialization when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeMeritsPage);