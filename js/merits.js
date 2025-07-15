// --- merits.js ---

// DOM Elements
const loadingIndicator = document.getElementById('loading-indicator');
const errorDisplay = document.getElementById('error-display');
const playerNameSpan = document.getElementById('player-name');
const playerLevelSpan = document.getElementById('player-level');
const playerTotalStatsSpan = document.getElementById('player-total-stats'); // Updated order in HTML
const playerRankSpan = document.getElementById('player-rank');
const playerNetworthSpan = document.getElementById('player-networth');
const playerLifeSpan = document.getElementById('player-life');
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
 * This function now assumes the API key is retrieved from Firestore.
 * @param {string} apiKey - The Torn API key for the current user.
 * @returns {Promise<object>} A promise that resolves with the player data.
 */
async function fetchTornDataDirectly(apiKey) {
    if (!apiKey) {
        throw new Error("No Torn API key found.");
    }

    // This is the V2 URL structure. The "v2" refers to the available fields/data, not a different base domain.
    // Streamlined selections to basic and personalstats for robustness.
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

/**
 * Displays basic player information in the summary section.
 * @param {object} playerData - The player data from the Torn API.
 */
function displayPlayerSummary(playerData) {
    console.log("displayPlayerSummary: Processing playerData:", playerData);

    if (playerD