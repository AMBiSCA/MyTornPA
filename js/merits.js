const allHonors = [
    // --- Chaining Honors ---
    { id: 253, name: "Chainer 1", requirement: "Participate in a 10 length chain", statKey: "personalstats.chains", threshold: 10, category: "honors-chaining-list", type: "count" },
    { id: 255, name: "Chainer 2", requirement: "Participate in a 100 length chain", statKey: "personalstats.chains", threshold: 100, category: "honors-chaining-list", type: "count" },
    { id: 257, name: "Chainer 3", requirement: "Participate in a 1,000 length chain", statKey: "personalstats.chains", threshold: 1000, category: "honors-chaining-list", type: "count" },
    { id: 475, name: "Chainer 4", requirement: "Participate in a 10,000 length chain", statKey: "personalstats.chains", threshold: 10000, category: "honors-chaining-list", type: "count" },
    { id: 476, name: "Chainer 5", requirement: "Participate in a 100,000 length chain", statKey: "personalstats.chains", threshold: 100000, category: "honors-chaining-list", type: "count" },
    { id: 256, name: "Carnage", requirement: "Make a single hit that earns your faction 10 or more respect", statKey: "personalstats.best_chain_hit", threshold: 10, category: "honors-chaining-list", type: "count" },
    { id: 477, name: "Massacre", requirement: "Make a single hit that earns your faction 100 or more respect", statKey: "personalstats.best_chain_hit", threshold: 100, category: "honors-chaining-list", type: "count" },
    { id: 478, name: "Genocide", requirement: "Make a single hit that earns your faction 1,000 or more respect", statKey: "personalstats.best_chain_hit", threshold: 1000, category: "honors-chaining-list", type: "count" },
    { id: 916, name: "Chain Saver", requirement: "Save a 100+ chain 10 seconds before it breaks", statKey: "personalstats.chains_saved", threshold: 1, category: "honors-chaining-list", type: "count" }, // Placeholder, needs specific log/stat check
    { id: 641, name: "Strongest Link", requirement: "Make 100 hits in a single chain", statKey: "personalstats.max_chain", threshold: 100, category: "honors-chaining-list", type: "count" },

    // --- Weapons Honors ---
    { id: 146, name: "2800 Ft/S", requirement: "Achieve 100 finishing hits with rifles", statKey: "personalstats.rifhits", threshold: 100, category: "honors-weapons-list", type: "count" },
    { id: 148, name: "Act of Faith", requirement: "Achieve 100 finishing hits with SMGs", statKey: "personalstats.smghits", threshold: 100, category: "honors-weapons-list", type: "count" },
    { id: 142, name: "Axe Wound", requirement: "Achieve 100 finishing hits with clubbing weapons", statKey: "personalstats.axehits", threshold: 100, category: "honors-weapons-list", type: "count" },
    { id: 147, name: "Cartridge Packer", requirement: "Achieve 100 finishing hits with shotguns", statKey: "personalstats.shohits", threshold: 100, category: "honors-weapons-list", type: "count" },
    { id: 871, name: "Leonidas", requirement: "Achieve a finishing hit with Kick", statKey: "personalstats.kickhits", threshold: 1, category: "honors-weapons-list", type: "count" }, // Placeholder for specific kick hits
    { id: 144, name: "Lend A Hand", requirement: "Achieve 100 finishing hits with machine guns", statKey: "personalstats.machits", threshold: 100, category: "honors-weapons-list", type: "count" }, // Placeholder
    { id: 143, name: "Pin Puller", requirement: "Achieve 100 finishing hits with temporary weapons", statKey: "personalstats.temphits", threshold: 100, category: "honors-weapons-list", type: "count" }, // Placeholder
    { id: 28, name: "Machinist", requirement: "Achieve 100 finishing hits with mechanical weapons", statKey: "personalstats.mechits", threshold: 100, category: "honors-weapons-list", type: "count" }, // Placeholder
    { id: 150, name: "Slasher", requirement: "Achieve 100 finishing hits with slashing weapons", statKey: "personalstats.slahits", threshold: 100, category: "honors-weapons-list", type: "count" },
    { id: 141, name: "Stumped", requirement: "Achieve 100 finishing hits with heavy artillery", statKey: "personalstats.artihits", threshold: 100, category: "honors-weapons-list", type: "count" }, // Placeholder
    { id: 149, name: "The Stabbist", requirement: "Achieve 100 finishing hits with piercing weapons", statKey: "personalstats.piehits", threshold: 100, category: "honors-weapons-list", type: "count" },
    { id: 145, name: "Yours Says Replica...", requirement: "Achieve 100 finishing hits with pistols", statKey: "personalstats.pishits", threshold: 100, category: "honors-weapons-list", type: "count" },
    { id: 515, name: "Unarmed", requirement: "Achieve 100 fists or kick finishing hits", statKey: "personalstats.h2hhits", threshold: 100, category: "honors-weapons-list", type: "count" },
    { id: 491, name: "Modded", requirement: "Equip two high-tier mods to a weapon", statKey: "personalstats.modded_weapons", threshold: 1, category: "honors-weapons-list", type: "count" }, // Placeholder, needs inventory access
    { id: 778, name: "Specialist", requirement: "Achieve 100% EXP on 25 different weapons", statKey: "personalstats.weapons_mastered", threshold: 25, category: "honors-weapons-list", type: "count" }, // Placeholder, needs /user/weapon_exp selection
    { id: 781, name: "Riddled", requirement: "Defeat an opponent after hitting at least 10 different body parts in a single attack", statKey: "personalstats.distinct_body_hits", threshold: 1, category: "honors-weapons-list", type: "count" }, // Placeholder, needs log or specific stat
    { id: 611, name: "War Machine", requirement: "Achieve 1,000 finishing hits in every category", statKey: "personalstats.all_finishing_hits", threshold: 1000, category: "honors-weapons-list", type: "count" }, // Placeholder, needs complex check
    { id: 800, name: "Surplus", requirement: "Use 100 rounds of special ammunition", statKey: "personalstats.specialammoused", threshold: 100, category: "honors-weapons-list", type: "count" },
    { id: 793, name: "Bandolier", requirement: "User 1,000 rounds of special ammunition", statKey: "personalstats.specialammoused", threshold: 1000, category: "honors-weapons-list", type: "count" },
    { id: 791, name: "Quartermaster", requirement: "Use 10,000 rounds of special ammunition", statKey: "personalstats.specialammoused", threshold: 10000, category: "honors-weapons-list", type: "count" },
    { id: 942, name: "Maimed", requirement: "Use 2,500 Hollow Point rounds", statKey: "personalstats.hollowammoused", threshold: 2500, category: "honors-weapons-list", type: "count" },
    { id: 951, name: "Dragon's Breath", requirement: "Use a 12 Gauge Incendiary round", statKey: "personalstats.incendiaryammoused", threshold: 1, category: "honors-weapons-list", type: "count" },
    { id: 945, name: "Marked", requirement: "Use 2,500 Tracer rounds", statKey: "personalstats.tracerammoused", threshold: 2500, category: "honors-weapons-list", type: "count" },
    { id: 944, name: "Scorched", requirement: "Use 2,500 Incendiary rounds", statKey: "personalstats.incendiaryammoused", threshold: 2500, category: "honors-weapons-list", type: "count" },
    { id: 943, name: "Penetrated", requirement: "Use 2,500 Piercing rounds", statKey: "personalstats.piercingammoused", threshold: 2500, category: "honors-weapons-list", type: "count" },
    { id: 851, name: "Mod Boss", requirement: "Own at least 20 weapon mods", statKey: "personalstats.weapon_mods_owned", threshold: 20, category: "honors-weapons-list", type: "count" }, // Placeholder
    { id: 902, name: "Gone Fishing", requirement: "Be defeated by a Trout", statKey: "personalstats.defeated_by_trout", threshold: 1, category: "honors-weapons-list", type: "boolean" },

    // --- Attacking / General Honors ---
    { id: 15, name: "Kill Streaker 1", requirement: "Achieve a 10 kill streak", statKey: "personalstats.killstreak", threshold: 10, category: "honors-attacking-list", type: "count" },
    { id: 16, name: "Kill Streaker 2", requirement: "Achieve a 100 kill streak", statKey: "personalstats.killstreak", threshold: 100, category: "honors-attacking-list", type: "count" },
    { id: 17, name: "Kill Streaker 3", requirement: "Achieve a 500 kill streak", statKey: "personalstats.killstreak", threshold: 500, category: "honors-attacking-list", type: "count" },
    { id: 1004, name: "Wham!", requirement: "Deal over 100,000 total damage", statKey: "personalstats.attackdamage", threshold: 100000, category: "honors-attacking-list", type: "count" },
    { id: 254, name: "Flatline", requirement: "Achieve a one hit kill", statKey: "personalstats.onehitkills", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 490, name: "Sidekick", requirement: "Assist in 250 attacks", statKey: "personalstats.attacksassisted", threshold: 250, category: "honors-attacking-list", type: "count" },
    { id: 20, name: "Precision", requirement: "Achieve 25 critical hits", statKey: "personalstats.attackcriticalhits", threshold: 25, category: "honors-attacking-list", type: "count" },
    { id: 227, name: "50 Cal", requirement: "Achieve 1,000 Critical Hits", statKey: "personalstats.attackcriticalhits", threshold: 1000, category: "honors-attacking-list", type: "count" },
    { id: 230, name: "Domino Effect", requirement: "Beat someone wearing this honor", statKey: "personalstats.domino_effect_wins", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 232, name: "Bounty Hunter", requirement: "Collect 250 bounties", statKey: "personalstats.bountiescollected", threshold: 250, category: "honors-attacking-list", type: "count" },
    { id: 236, name: "Dead Or Alive", requirement: "Earn $10,000,000 from bounty hunting", statKey: "personalstats.totalbountyreward", threshold: 10000000, category: "honors-attacking-list", type: "count" },
    { id: 140, name: "Spray And Pray", requirement: "Fire 1,000 rounds", statKey: "personalstats.roundsfired", threshold: 1000, category: "honors-attacking-list", type: "count" },
    { id: 151, name: "Two Halves Make A Hole", requirement: "Fire 10,000 rounds", statKey: "personalstats.roundsfired", threshold: 10000, category: "honors-attacking-list", type: "count" },
    { id: 247, name: "Blood Money", requirement: "Make $1,000,000 from a single mugging", statKey: "personalstats.largestmug", threshold: 1000000, category: "honors-attacking-list", type: "count" },
    { id: 270, name: "Deadlock", requirement: "Stalemate 100 times", statKey: "personalstats.defendstalemated", threshold: 100, category: "honors-attacking-list", type: "count" },
    { id: 1001, name: "Boom!", requirement: "Deal over 10,000,000 total damage", statKey: "personalstats.attackdamage", threshold: 10000000, category: "honors-attacking-list", type: "count" },
    { id: 955, name: "Yoink", requirement: "Successfully mug someone who just mugged someone else", statKey: "personalstats.yoink_mugs", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 228, name: "007", requirement: "Win 1,000 attacks and 1,000 defends", statKey: "personalstats.attackswon", threshold: 1000, category: "honors-attacking-list", type: "count_complex", checkAlso: "personalstats.defendswon", thresholdAlso: 1000 },
    { id: 22, name: "Self Defense", requirement: "Win 50 Defends", statKey: "personalstats.defendswon", threshold: 50, category: "honors-attacking-list", type: "count" },
    { id: 27, name: "Night Walker", requirement: "Win 100 stealthed attacks", statKey: "personalstats.attacksstealthed", threshold: 100, category: "honors-attacking-list", type: "count" },
    { id: 615, name: "Guardian Angel", requirement: "Defeat someone while they are attacking someone else", statKey: "personalstats.guardian_angel_wins", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 481, name: "Semper Fortis", requirement: "Defeat someone who has more battle stats than you in a solo attack", statKey: "personalstats.semper_fortis_wins", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 627, name: "Manu Forti", requirement: "Defeat someone who has at least double your battle stats in a solo attack", statKey: "personalstats.manu_forti_wins", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 631, name: "Vae Victis", requirement: "Defeat someone who has five times more battlestats than you in a solo attack", statKey: "personalstats.vae_victis_wins", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 500, name: "Survivalist", requirement: "Win an attack with only 1% life remaining", statKey: "personalstats.survivalist_wins", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 1002, name: "Bam!", requirement: "Deal over 1,000,000 total damage", statKey: "personalstats.attackdamage", threshold: 1000000, category: "honors-attacking-list", type: "count" },
    { id: 639, name: "Double Dragon", requirement: "Assist in a single attack", statKey: "personalstats.double_dragon_assists", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 517, name: "Pressure Point", requirement: "Achieve 100 One Hit kills", statKey: "personalstats.onehitkills", threshold: 100, category: "honors-attacking-list", type: "count" },
    { id: 601, name: "Fury", requirement: "Achieve 10,000 hits.", statKey: "personalstats.attackhits", threshold: 10000, category: "honors-attacking-list", type: "count" },
    { id: 665, name: "Boss Fight", requirement: "Participate in the defeat of Lootable NPC's.", statKey: "personalstats.npc_defeats", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 608, name: "1337", requirement: "Deal exactly 1,337 damage to an opponent in a single hit", statKey: "personalstats.exact_1337_damage", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 896, name: "Going Postal", requirement: "Defeat a company co-worker", statKey: "personalstats.company_coworker_defeats", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 605, name: "Friendly Fire", requirement: "Defeat a fellow faction member", statKey: "personalstats.friendly_fire_defeats", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 739, name: "Church Mouse", requirement: "Be mugged for $1", statKey: "personalstats.mugged_for_1", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 317, name: "Phoenix", requirement: "Defeat someone after losing to them within 10 minutes", statKey: "personalstats.phoenix_wins", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 740, name: "Devastation", requirement: "Deal at least 5,000 damage in a single hit", statKey: "personalstats.bestdamage", threshold: 5000, category: "honors-attacking-list", type: "count" },
    { id: 741, name: "Obliteration", requirement: "Deal at least 10,000 damage in a single hit", statKey: "personalstats.bestdamage", threshold: 10000, category: "honors-attacking-list", type: "count" },
    { id: 786, name: "Annihilation", requirement: "Deal at least 15,000 damage in a single hit", statKey: "personalstats.bestdamage", threshold: 15000, category: "honors-attacking-list", type: "count" },
    { id: 1003, name: "Kapow!", requirement: "Deal over 100,000,000 total damage", statKey: "personalstats.attackdamage", threshold: 100000000, category: "honors-attacking-list", type: "count" },
    { id: 670, name: "Giant Slayer", requirement: "Receive loot from a defeated NPC", statKey: "personalstats.giant_slayer_loots", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 763, name: "Bare", requirement: "Win 250 unarmored attacks or defends", statKey: "personalstats.unarmoredwon", threshold: 250, category: "misc-awards-list", type: "count" },
    { id: 488, name: "Vengeance", requirement: "Successfully perform a faction retaliation hit", statKey: "personalstats.retals", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 719, name: "Invictus", requirement: "Successfully defend against someone who has at least double your battle stats", statKey: "personalstats.invictus_defends", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 834, name: "Lead Salad", requirement: "Fire 100,000 rounds", statKey: "personalstats.roundsfired", threshold: 100000, category: "honors-attacking-list", type: "count" },
    { id: 836, name: "Peppered", requirement: "Fire 1,000,000 rounds", statKey: "personalstats.roundsfired", threshold: 1000000, category: "honors-attacking-list", type: "count" },
    { id: 828, name: "Finale", requirement: "Defeat someone on the 25th turn of an attack", statKey: "personalstats.finale_wins", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 827, name: "Deadly Duo", requirement: "Defeat someone with your spouse", statKey: "personalstats.deadly_duo_wins", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 838, name: "Lovestruck", requirement: "Defeat a married couple", statKey: "personalstats.lovestruck_wins", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 843, name: "Hands Solo", requirement: "Defeat someone using only your fists on May 4th", statKey: "personalstats.hands_solo_wins", threshold: 1, category: "honors-attacking-list", type: "count" },
    { id: 414, name: "Triple Tap", requirement: "Achieve three headshots in a row", statKey: "personalstats.triple_tap", threshold: 1, category: "honors-attacking-list", type: "count" },

    // ... all other honors...
];

const allMedals = [
    // ... all medals...
];


// --- DOM Elements ---
const loadingIndicator = document.getElementById('loading-indicator');
const errorDisplay = document.getElementById('error-display');
const playerNameSpan = document.getElementById('player-name');
const playerLevelSpan = document.getElementById('player-level');
const playerTotalStatsSpan = document.getElementById('player-total-stats');
const playerNetworthSpan = document.getElementById('player-networth');
const playerAwardsSpan = document.getElementById('player-awards');

const tabsContainer = document.querySelector('.tabs-container');
const tabContents = document.querySelectorAll('.tab-pane');

// Lists for dynamic content
const honorsAttackingList = document.getElementById('honors-attacking-list');
const honorsWeaponsList = document.getElementById('honors-weapons-list');
const honorsChainingList = document.getElementById('honors-chaining-list');
const medalsCombatList = document.getElementById('medals-combat-list');
const medalsCommitmentList = document.getElementById('medals-commitment-list');
const medalsCrimesList = document.getElementById('medals-crimes-list');
const playerStatsList = document.getElementById('player-stats-list');
const miscAwardsList = document.getElementById('misc-awards-list');
const awardsProgressList = document.getElementById('awards-progress-list');


// --- Helper Functions ---
function showLoading() {
    loadingIndicator.classList.remove('js-hidden-initially');
    errorDisplay.classList.add('js-hidden-initially');
}

function hideLoading() {
    loadingIndicator.classList.add('js-hidden-initially');
}

function showError(message) {
    errorDisplay.textContent = `Error: ${message}`;
    errorDisplay.classList.remove('js-hidden-initially');
    hideLoading();
}

function hideError() {
    errorDisplay.classList.add('js-hidden-initially');
    errorDisplay.textContent = '';
}

function formatNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) {
        return 'N/A';
    }
    return num.toLocaleString();
}

function getNestedProperty(obj, path) {
    if (path === "rank_text") {
        return (obj.basic && obj.basic.rank) ? obj.basic.rank : (obj.rank || 'N/A');
    }
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
}

function clearAllLists() {
    honorsAttackingList.innerHTML = '';
    honorsWeaponsList.innerHTML = '';
    honorsChainingList.innerHTML = '';
    medalsCombatList.innerHTML = '';
    medalsCommitmentList.innerHTML = '';
    medalsCrimesList.innerHTML = '';
    playerStatsList.innerHTML = '';
    miscAwardsList.innerHTML = '';
    awardsProgressList.innerHTML = '';
}


// --- Main Data Handling Functions ---
async function fetchTornDataDirectly(apiKey) {
    if (!apiKey) {
        throw new Error("No Torn API key found.");
    }
    const selections = "basic,personalstats,medals,honors"; 
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
            } catch (e) {}
            throw new Error(`Torn API error: ${response.status} - ${errorDetail}`);
        }
        const data = await response.json();
        if (data.error && data.error.error) {
            throw new Error(`Torn API error: ${data.error.error}`);
        }
        console.log('Torn API Data fetched:', data);
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
    if (playerData) {
        playerNameSpan.textContent = playerData.name || 'N/A';
        playerLevelSpan.textContent = formatNumber(playerData.level) || 'N/A';
        const totalStats = playerData.personalstats ? playerData.personalstats.totalstats : undefined;
        playerTotalStatsSpan.textContent = totalStats !== undefined ? formatNumber(totalStats) : 'N/A';
        const networth = playerData.personalstats ? playerData.personalstats.networth : undefined;
        playerNetworthSpan.textContent = networth !== undefined ? `$${formatNumber(networth)}` : 'N/A';
        const awards = playerData.personalstats ? playerData.personalstats.awards : undefined;
        playerAwardsSpan.textContent = awards !== undefined ? formatNumber(awards) : 'N/A';
    } else {
        playerNameSpan.textContent = 'N/A';
        playerLevelSpan.textContent = 'N/A';
        playerTotalStatsSpan.textContent = 'N/A';
        playerNetworthSpan.textContent = 'N/A';
        playerAwardsSpan.textContent = 'N/A';
    }
}

function getAchievementStatus(achievement, playerData) {
    const value = getNestedProperty(playerData, achievement.statKey);
    let statusIconClass = 'not-started';
    let statusSymbol = '◎';
    let progressText = '';
    let isCompleted = false;
    let calculatedPercentage = 0;

    if (value !== undefined && value !== null) {
        if (achievement.type === 'count' || achievement.type === 'level') {
            if (value >= achievement.threshold) {
                statusIconClass = 'completed';
                statusSymbol = '✔';
                isCompleted = true;
                calculatedPercentage = 100;
            } else {
                statusIconClass = 'in-progress';
                statusSymbol = '';
                calculatedPercentage = (value / achievement.threshold) * 100;
                progressText = ` (Progress: ${formatNumber(value)}/${formatNumber(achievement.threshold)})`;
                if (achievement.type === 'level') {
                    progressText = ` (Current Level: ${formatNumber(value)})`;
                }
            }
        } else if (achievement.type === 'boolean') {
            if (value > 0) {
                statusIconClass = 'completed';
                statusSymbol = '✔';
                isCompleted = true;
                calculatedPercentage = 100;
            }
        } else if (achievement.type === 'count_complex' && achievement.name === "007") {
            const attacksWon = getNestedProperty(playerData, achievement.statKey);
            const defendsWon = getNestedProperty(playerData, achievement.checkAlso);
            const attacksThreshold = achievement.threshold;
            const defendsThreshold = achievement.thresholdAlso;

            if (attacksWon >= attacksThreshold && defendsWon >= defendsThreshold) {
                statusIconClass = 'completed'; statusSymbol = '✔'; isCompleted = true; calculatedPercentage = 100;
            } else {
                statusIconClass = 'in-progress'; statusSymbol = '';
                const progressAttacks = (attacksWon / attacksThreshold) * 100;
                const progressDefends = (defendsWon / defendsThreshold) * 100;
                calculatedPercentage = Math.min(progressAttacks, progressDefends);
                progressText = ` (Attacks: ${formatNumber(attacksWon)}/${formatNumber(attacksThreshold)}, Defends: ${formatNumber(defendsWon)}/${formatNumber(defendsThreshold)})`;
            }
        } else if (achievement.type === 'count_time_convert') {
            const valueInDays = value / (24 * 60 * 60);
             if (valueInDays >= achievement.threshold) {
                statusIconClass = 'completed'; statusSymbol = '✔'; isCompleted = true; calculatedPercentage = 100;
            } else {
                statusIconClass = 'in-progress'; statusSymbol = '';
                calculatedPercentage = (valueInDays / achievement.threshold) * 100;
                progressText = ` (Progress: ${formatNumber(valueInDays.toFixed(1))}/${formatNumber(achievement.threshold)} days)`;
            }
        } else if (achievement.type === 'rank') {
             let currentRankValue = getNestedProperty(playerData, achievement.statKey);
             if (currentRankValue === achievement.threshold) {
                 statusIconClass = 'completed'; statusSymbol = '✔'; isCompleted = true; calculatedPercentage = 100;
             } else {
                 statusIconClass = 'not-started';
             }
             progressText = ` (Current: ${currentRankValue || 'N/A'})`;
        }
        else if (value > 0 && !isCompleted) {
            statusIconClass = 'in-progress';
            statusSymbol = '';
            progressText = ` (Current: ${formatNumber(value)})`;
            calculatedPercentage = 1;
        }
    }
    return { statusIconClass, statusSymbol, progressText, isCompleted, calculatedPercentage };
}

function updateAchievementsDisplay(playerData) {
    clearAllLists();
    const achievementLists = {
        'honors-attacking-list': honorsAttackingList,
        'honors-weapons-list': honorsWeaponsList,
        'honors-chaining-list': honorsChainingList,
        'medals-combat-list': medalsCombatList,
        'medals-commitment-list': medalsCommitmentList,
        'medals-crimes-list': medalsCrimesList,
        'misc-awards-list': miscAwardsList,
    };
    const userOwnedHonorsIds = new Set(playerData.honors_awarded || []); 
    const userOwnedMedalsIds = new Set(playerData.medals_awarded || []);
    const allAchievementsWithStatus = [];

    const processAndDisplay = (achievement, type) => {
        const { statusIconClass, statusSymbol, progressText, isCompleted, calculatedPercentage } = getAchievementStatus(achievement, playerData);
        const listItem = document.createElement('li');
        listItem.classList.add('achievement-item'); 
        listItem.dataset.id = achievement.id; 
        listItem.dataset.type = type; 

        let isAwardedByApi = false;
        if (type === 'honor' && userOwnedHonorsIds.has(achievement.id)) {
            isAwardedByApi = true;
        } else if (type === 'medal' && userOwnedMedalsIds.has(achievement.id)) {
            isAwardedByApi = true;
        }

        let finalDisplayIconHtml = '';
        let finalIconClass = statusIconClass;

        if (isAwardedByApi) {
            finalDisplayIconHtml = '<i class="fas fa-check"></i>';
            finalIconClass = 'completed';
            listItem.classList.add('awarded-by-api');
        } else {
            finalDisplayIconHtml = statusSymbol;
        }

        listItem.innerHTML = `
            <span class="merit-status-icon ${finalIconClass}">${finalDisplayIconHtml}</span>
            <span class="merit-details">
                <span class="merit-name">${achievement.name}</span> -
                <span class="merit-requirement">${achievement.requirement}</span>
                <span class="merit-progress">${progressText}</span>
            </span>
            `;

        if (achievementLists[achievement.category]) {
            achievementLists[achievement.category].appendChild(listItem);
        } else {
            console.warn(`Category list not found for: ${achievement.category}.`);
        }

        if (!isCompleted) {
            allAchievementsWithStatus.push({
                achievement,
                statusIconClass,
                statusSymbol,
                progressText,
                calculatedPercentage
            });
        }
    };

    allHonors.forEach(ach => processAndDisplay(ach, 'honor'));
    allMedals.forEach(ach => processAndDisplay(ach, 'medal'));
    populateAwardsProgressTab(allAchievementsWithStatus);
}

function populateAwardsProgressTab(achievementsInPrgoress) {
    awardsProgressList.innerHTML = '';
    if (achievementsInPrgoress.length === 0) {
        awardsProgressList.innerHTML = '<li>No awards currently in progress. Start working on some!</li>';
        return;
    }
    achievementsInPrgoress.sort((a, b) => b.calculatedPercentage - a.calculatedPercentage);
    achievementsInPrgoress.forEach(item => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <span class="merit-status-icon ${item.statusIconClass}">${item.statusSymbol}</span>
            <span class="merit-details">
                <span class="merit-name">${item.achievement.name}</span> -
                <span class="merit-requirement">${item.achievement.requirement}</span>
                <span class="merit-progress">${item.progressText || ''} (${item.calculatedPercentage.toFixed(1)}% complete)</span>
            </span>
        `;
        awardsProgressList.appendChild(listItem);
    });
}

function populatePlayerStats(playerData) {
    const statsContainer = document.getElementById('player-stats-list');
    statsContainer.innerHTML = '';
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
        'Level': 'level',
        'Rank': (playerData.basic && playerData.basic.rank) ? 'basic.rank' : 'rank'
    };

    for (const [displayName, statPath] of Object.entries(statsMapping)) {
        let value;
        if (displayName === 'Rank') {
            value = (playerData.basic && playerData.basic.rank) ? playerData.basic.rank : playerData.rank;
        } else if (typeof statPath === 'string') {
            value = getNestedProperty(playerData, statPath);
        } else {
            value = 'N/A';
        }
        const li = document.createElement('li');
        const spanId = `stat-${displayName.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}`;
        li.innerHTML = `<span class="stat-label"><strong>${displayName}:</strong></span><span class="stat-value" id="${spanId}">${typeof value === 'number' ? formatNumber(value) : (value || 'N/A')}</span>`;
        statsContainer.appendChild(li);
    }

    const totalAwardsLi = document.createElement('li');
    totalAwardsLi.innerHTML = `<strong>Total Awards Tracked:</strong> <span id="total-awards-tracked">${formatNumber(allHonors.length + allMedals.length)}</span>`;
    statsContainer.appendChild(totalAwardsLi);
}

function switchTab(tabId) {
    tabsContainer.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    tabContents.forEach(pane => {
        pane.classList.remove('active');
        pane.style.display = 'none';
    });

    const activeButton = tabsContainer.querySelector(`[data-tab="${tabId.replace('-tab', '')}"]`);
    const activePane = document.getElementById(tabId);

    if (activeButton) {
        activeButton.classList.add('active');
    }
    if (activePane) {
        activePane.style.display = 'flex';
        activePane.classList.add('active');
    }
}

async function initializeMeritsPage() {
    hideError();
    showLoading();
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            const db = firebase.firestore();
            try {
                const userDocRef = db.collection('userProfiles').doc(user.uid);
                const doc = await userDocRef.get();
                if (doc.exists && doc.data() && doc.data().tornApiKey) {
                    const tornApiKey = doc.data().tornApiKey;
                    const playerData = await fetchTornDataDirectly(tornApiKey);
                    if (playerData) {
                        displayPlayerSummary(playerData);
                        updateAchievementsDisplay(playerData);
                        populatePlayerStats(playerData);
                        switchTab('honors-tab'); 
                    }
                } else {
                    hideLoading();
                    showError('No Torn API key found for your account. Please set it in your profile settings.');
                }
            } catch (firestoreError) {
                console.error("Error fetching API key from Firestore:", firestoreError);
                hideLoading();
                showError('Failed to retrieve your API key. Please check your internet connection or try again later.');
            }
        } else {
            hideLoading();
            showError('Please log in to view your Torn Honors & Medals.');
        }
    });
}

// Run initialization and set up event listeners when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the main page logic
    initializeMeritsPage();

    // Set up the event listener for the page's TABS
    if (tabsContainer) {
        tabsContainer.addEventListener('click', (event) => {
            const targetButton = event.target.closest('.tab-button');
            if (targetButton) {
                const tabName = targetButton.dataset.tab;
                switchTab(`${tabName}-tab`);
            }
        });
    }

    // --- START: Code to make Header Buttons work ---

    // Logic for the "Useful Links" dropdown
    const usefulLinksBtn = document.getElementById('usefulLinksBtn');
    const usefulLinksDropdown = document.getElementById('usefulLinksDropdown');
    if (usefulLinksBtn) {
        usefulLinksBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            usefulLinksDropdown.style.display = usefulLinksDropdown.style.display === 'block' ? 'none' : 'block';
        });
    }

    // Logic for the "Contact" dropdown
    const contactBtn = document.getElementById('contactUsBtn');
    const contactDropdown = document.getElementById('contactUsDropdown');
    if (contactBtn) {
        contactBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            contactDropdown.style.display = contactDropdown.style.display === 'block' ? 'none' : 'block';
        });
    }

    // Close dropdowns if clicking elsewhere on the page
    window.addEventListener('click', (e) => {
        if (usefulLinksDropdown && usefulLinksBtn && !usefulLinksBtn.contains(e.target)) {
            usefulLinksDropdown.style.display = 'none';
        }
        if (contactDropdown && contactBtn && !contactBtn.contains(e.target)) {
            contactDropdown.style.display = 'none';
        }
    });

    // Firebase Auth state listener to show/hide buttons and handle logout
    if (typeof auth !== 'undefined' && auth) {
        auth.onAuthStateChanged(function(user) {
            const headerButtonsContainer = document.getElementById('headerButtonsContainer');
            const logoutButtonHeader = document.getElementById('logoutButtonHeader');
            
            if (user) {
                // User is signed in
                if (headerButtonsContainer) headerButtonsContainer.style.display = 'flex';
                if (logoutButtonHeader) logoutButtonHeader.style.display = 'inline-flex';

                // Make the Logout button work
                if (logoutButtonHeader) {
                    logoutButtonHeader.onclick = function() {
                        auth.signOut().then(() => {
                            console.log('User signed out');
                            window.location.href = 'home.html'; // Redirect to home after logout
                        }).catch((error) => {
                            console.error('Sign out error', error);
                        });
                    };
                }
            } else {
                // No user is signed in
                if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
            }
        });
    } else {
        console.error("Firebase auth is not defined. Header buttons may not function correctly.");
    }
    // --- END: Code for Header Buttons ---
});