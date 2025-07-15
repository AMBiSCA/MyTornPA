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


// --- Static Merit/Medal Data (SAMPLE - EXPAND THIS!) ---
// This is a SAMPLE subset. You will need to expand this with ALL your honor/medal requirements.
// The 'statKey' maps to the Torn API response path (e.g., playerData.attacks.attacks_won)
// The 'type' helps determine how to check progress (e.g., 'count', 'level', 'boolean')
// 'category' maps to the <ul> ID in HTML
const allHonors = [
    // Attacking Honors (Chaining is separate for now)
    { name: "Chainer 1", requirement: "Participate in a 10 length chain", statKey: "personalstats.chain_hits", threshold: 10, category: "honors-chaining-list", type: "count" },
    { name: "Chainer 2", requirement: "Participate in a 100 length chain", statKey: "personalstats.chain_hits", threshold: 100, category: "honors-chaining-list", type: "count" },
    { name: "Chainer 3", requirement: "Participate in a 1,000 length chain", statKey: "personalstats.chain_hits", threshold: 1000, category: "honors-chaining-list", type: "count" },
    { name: "Chainer 4", requirement: "Participate in a 10,000 length chain", statKey: "personalstats.chain_hits", threshold: 10000, category: "honors-chaining-list", type: "count" },
    { name: "Chainer 5", requirement: "Participate in a 100,000 length chain", statKey: "personalstats.chain_hits", threshold: 100000, category: "honors-chaining-list", type: "count" },
    { name: "Carnage", requirement: "Make a single hit that earns your faction 10 or more respect", statKey: "personalstats.best_chain_hit", threshold: 10, category: "honors-chaining-list", type: "count" },
    { name: "Massacre", requirement: "Make a single hit that earns your faction 100 or more respect", statKey: "personalstats.best_chain_hit", threshold: 100, category: "honors-chaining-list", type: "count" },
    { name: "Strongest Link", requirement: "Make 100 hits in a single chain", statKey: "personalstats.max_chain", threshold: 100, category: "honors-chaining-list", type: "count" }, // Note: Torn API's 'max_chain' is in personalstats
    // Weapons Honors
    { name: "2800 Ft/S", requirement: "Achieve 100 finishing hits with rifles", statKey: "personalstats.finishing_hits.rifle", threshold: 100, category: "honors-weapons-list", type: "count" },
    { name: "Axe Wound", requirement: "Achieve 100 finishing hits with clubbing weapons", statKey: "personalstats.finishing_hits.club", threshold: 100, category: "honors-weapons-list", type: "count" },
    { name: "Unarmed", requirement: "Achieve 100 fists or kick finishing hits", statKey: "personalstats.finishing_hits.unarmed", threshold: 100, category: "honors-weapons-list", type: "count" },
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
    // Crimes Medals (Simplified as 1.0 vs 2.0 is complex; this uses total)
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
    honorsAttackingGeneralList.innerHTML = '';

    medalsCombatList.innerHTML = '';
    medalsCommitmentList.innerHTML = '';
    medalsLevelList.innerHTML = '';
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

    // Selections needed for various merits/medals/stats
    // I've added 'factions' and expanded 'personalstats' sub-selections
    const selections = "basic,personalstats"; // <- REVISED TO MINIMUM SELECTIONS
    const tornApiUrl = `https://api.torn.com/user/?selections=${selections}&key=${apiKey}`;

    try {
        const response = await fetch(tornApiUrl);

        if (!response.ok) {
            let errorDetail = await response.text();
            try {
                // Try to parse JSON error if available
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

        // Check for specific Torn API error messages within the JSON response
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
    if (playerData && playerData.basic) {
        playerNameSpan.textContent = playerData.basic.name || 'N/A';
        playerLevelSpan.textContent = formatNumber(playerData.basic.level) || 'N/A';
        playerRankSpan.textContent = playerData.basic.rank || 'N/A';
        // Networth is in personalstats, ensure it's accessed correctly
        playerNetworthSpan.textContent = playerData.personalstats && playerData.personalstats.networth ? `$${formatNumber(playerData.personalstats.networth)}` : 'N/A';
    } else {
        playerNameSpan.textContent = 'N/A';
        playerLevelSpan.textContent = 'N/A';
        playerRankSpan.textContent = 'N/A';
        playerNetworthSpan.textContent = 'N/A';
    }
}

// ... (inside merits.js)

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

    const processAchievements = (achievements, isMedal = false) => {
        achievements.forEach(achievement => {
            const value = getNestedProperty(playerData, achievement.statKey);

            // --- ADD THESE NEW CONSOLE.LOGS ---
            console.log(`Processing ${achievement.name}:`);
            console.log(`  Stat Key: ${achievement.statKey}`);
            console.log(`  Value from API:`, value);
            console.log(`  Threshold: ${achievement.threshold}`);
            // --- END NEW CONSOLE.LOGS ---

            let statusIconClass = 'not-started';
            let statusSymbol = '◎';
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
                            progressText = ` (Current Level: ${formatNumber(value)})`;
                        }
                    }
                }
            }
            // --- ADD THIS LOG TO SEE IF LIST ITEM IS BEING CREATED AND APPENDED ---
            console.log(`  Status: ${statusIconClass}, Progress: ${progressText}`);
            console.log(`  Appending to: ${achievement.category}`);
            // --- END NEW CONSOLE.LOGS ---

            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <span class="merit-status-icon ${statusIconClass}">${statusSymbol}</span>
                <span class="merit-details">
                    <span class="merit-name">${achievement.name}</span> -
                    <span class="merit-requirement">${achievement.requirement}</span>
                    <span class="merit-progress">${progressText}</span>
                </span>
            `;
            if (achievementLists[achievement.category]) {
                achievementLists[achievement.category].appendChild(listItem);
            } else {
                console.warn(`Category list not found for: ${achievement.category}`);
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

    if (!playerData || (!playerData.personalstats && !playerData.attacks && !playerData.basic)) {
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
        'Max Chain Hits (Personal)': 'personalstats.max_chain',
        'Max Faction Chain Hits': 'factions.max_chain_hits', // Added faction chain for clarity
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


/// ... (rest of merits.js)

async function initializeMeritsPage() {
    hideError();
    showLoading();

    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            console.log("User is logged in:", user.uid);

            // --- ADD THESE NEW CONSOLE.LOGS ---
            console.log("Attempting to get Firestore instance...");
            const db = firebase.firestore();
            console.log("Firestore instance obtained.");

            try {
                const userDocRef = db.collection('userProfiles').doc(user.uid); // <--- CORRECTED
                console.log("User document reference created:", userDocRef.path);

                const doc = await userDocRef.get();
                console.log("User document fetch attempt complete. Doc exists:", doc.exists);

                if (doc.exists && doc.data()) {
                    const userData = doc.data();
                    console.log("User data from Firestore:", userData); // Log all user data

                    if (userData.tornApiKey) {
                        const tornApiKey = userData.tornApiKey;
                        console.log("Torn API Key retrieved from Firestore.");

                        const playerData = await fetchTornDataDirectly(tornApiKey);
                        if (playerData) {
                            displayPlayerSummary(playerData);
                            updateAchievementsDisplay(playerData);
                            populatePlayerStats(playerData);
                        } else {
                            // Error message handled by fetchTornDataDirectly
                            console.log("Player data could not be fetched by fetchTornDataDirectly (error already displayed).");
                        }
                    } else {
                        hideLoading();
                        showError('No Torn API key found for your account. Please set it in your profile settings (e.g., in your user management section).');
                        console.warn("tornApiKey field is missing in user's Firestore document.");
                    }
                } else {
                    hideLoading();
                    showError('User data document not found in Firestore. Please ensure your user profile is correctly set up.');
                    console.warn("User document does not exist in Firestore for UID:", user.uid);
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

// ... (rest of merits.js)
// Run initialization when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeMeritsPage);