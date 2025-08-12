// This file is a customized version of your main Faction Peeper script,
// adapted for a single-player lookup tool.

// Stat selection logic and other functions copied from your main file.
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

function getValueForStat(statDisplayName, userData) {
    let value = 'N/A';
    const lastActionObject = userData.last_action || {};
    const personalstats = userData.personalstats || {};
    const profileData = userData.profile || {};
    
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
        case 'Businesses Owned': value = personalstats.companiesowned; break;
        case 'Properties Owned': value = personalstats.propertiesowned; break;
        default: value = 'N/A';
    }

    if (value === undefined || value === null || value === "") {
        value = 'N/A';
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
        'Revives Made', 'Revives Received', 'Revive Skill',
        'Businesses Owned', 'Properties Owned'
    ];

    if (typeof value === 'number' && !isNaN(value) && numericDisplayStats.includes(statDisplayName)) {
        return value.toLocaleString();
    }
    return String(value);
}

document.addEventListener('DOMContentLoaded', () => {

    const statCategorySelect = document.getElementById('statCategory');
    const playerIdInput = document.getElementById('playerId');
    const checkStatsBtn = document.getElementById('checkStatsBtn');
    const statsResultsContainer = document.getElementById('stats-results-container');
    const statsTableBody = document.getElementById('stats-table-body');
    const playerNameDisplay = document.getElementById('playerNameDisplay');
    const statsApiKeyErrorDiv = document.getElementById('statsApiKeyError');

    let tornApiKey = null;

    if (checkStatsBtn) checkStatsBtn.disabled = true;

    // Populate the dropdown with categories and stats
    if (statCategorySelect) {
        statCategories.forEach(category => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = category.name;
            category.stats.forEach(statName => {
                const option = document.createElement('option');
                option.value = statName;
                option.textContent = statName;
                optgroup.appendChild(option);
            });
            statCategorySelect.appendChild(optgroup);
        });
    }

    if (typeof auth !== 'undefined' && typeof db !== 'undefined') {
        auth.onAuthStateChanged(async function(user) {
            if (user) {
                try {
                    const userDoc = await db.collection('userProfiles').doc(user.uid).get();
                    if (userDoc.exists) {
                        tornApiKey = userDoc.data().tornApiKey;
                        if (tornApiKey) {
                            if (statsApiKeyErrorDiv) statsApiKeyErrorDiv.textContent = '';
                            if (checkStatsBtn) checkStatsBtn.disabled = false;
                        } else {
                            if (statsApiKeyErrorDiv) statsApiKeyErrorDiv.textContent = 'Please set your Torn API Key in your profile settings.';
                            if (checkStatsBtn) checkStatsBtn.disabled = true;
                        }
                    } else {
                        if (statsApiKeyErrorDiv) statsApiKeyErrorDiv.textContent = 'User profile not found.';
                        if (checkStatsBtn) checkStatsBtn.disabled = true;
                    }
                } catch (error) {
                    console.error("Error fetching API Key:", error);
                    if (statsApiKeyErrorDiv) statsApiKeyErrorDiv.textContent = `Error: ${error.message}`;
                    if (checkStatsBtn) checkStatsBtn.disabled = true;
                }
            } else {
                if (statsApiKeyErrorDiv) statsApiKeyErrorDiv.textContent = 'Please sign in to use this feature.';
                if (checkStatsBtn) checkStatsBtn.disabled = true;
            }
        });
    }

    if (checkStatsBtn) {
        checkStatsBtn.addEventListener('click', () => {
            const playerId = playerIdInput.value.trim();
            const statName = statCategorySelect.value;
            if (playerId && tornApiKey && statName) {
                fetchPlayerStats(playerId, tornApiKey, statName);
            } else if (!playerId) {
                if (statsApiKeyErrorDiv) statsApiKeyErrorDiv.textContent = 'Please enter a Player ID.';
            } else if (!tornApiKey) {
                if (statsApiKeyErrorDiv) statsApiKeyErrorDiv.textContent = 'API key is missing. Please check your profile.';
            } else if (!statName) {
                if (statsApiKeyErrorDiv) statsApiKeyErrorDiv.textContent = 'Please select a stat category.';
            }
        });
    }

    async function fetchPlayerStats(playerId, apiKey, statName) {
        try {
            statsResultsContainer.style.display = 'none';
            statsTableBody.innerHTML = '<tr><td colspan="2">Fetching player stats...</td></tr>';
            
            const selectionMapping = {
                'Level': 'basic', 'Age': 'basic', 'Last Action': 'basic', 'Status': 'basic',
                'Networth': 'personalstats', 'Businesses Owned': 'personalstats', 'Properties Owned': 'personalstats',
                'Respect': 'personalstats', 'Xanax Taken': 'personalstats', 'Refills': 'personalstats', 'Total War Hits': 'personalstats', 'Total War Assists': 'personalstats',
                'Attacks Won': 'personalstats', 'Attacks Lost': 'personalstats', 'Attacks Draw': 'personalstats', 'Defends Won': 'personalstats', 'Defends Lost': 'personalstats',
                'Total Attack Hits': 'personalstats', 'Attack Damage Dealt': 'personalstats', 'Best Single Hit Damage': 'personalstats', 'Critical Hits': 'personalstats', 'One-Hit Kills': 'personalstats', 'Best Kill Streak': 'personalstats',
                'ELO Rating': 'personalstats', 'Stealth Attacks': 'personalstats', 'Highest Level Beaten': 'personalstats', 'Unarmed Fights Won': 'personalstats', 'Times You Ran Away': 'personalstats', 'Opponent Ran Away': 'personalstats',
                'Money Mugged': 'personalstats', 'Largest Mug': 'personalstats', 'Bazaar Profit ($)': 'personalstats', 'Bazaar Sales (#)': 'personalstats', 'Bazaar Customers': 'personalstats', 'Points Bought': 'personalstats',
                'Points Sold': 'personalstats', 'Items Bought (Market/Shops)': 'personalstats', 'City Items Bought': 'personalstats', 'Items Bought Abroad': 'personalstats', 'Items Sent': 'personalstats', 'Items Looted': 'personalstats',
                'Items Dumped': 'personalstats', 'Trades Made': 'personalstats',
                'Criminal Record (Total)': 'personalstats', 'Times Jailed': 'personalstats', 'People Busted': 'personalstats', 'Failed Busts': 'personalstats', 'Arrests Made': 'personalstats',
                'Medical Items Used': 'personalstats', 'Times Hospitalized': 'personalstats', 'Drugs Used (Times)': 'personalstats', 'Times Overdosed': 'personalstats', 'Times Rehabbed': 'personalstats', 'Boosters Used': 'personalstats',
                'Energy Drinks Used': 'personalstats', 'Alcohol Used': 'personalstats', 'Candy Used': 'personalstats', 'Nerve Refills Used': 'personalstats',
                'Daily Login Streak': 'personalstats', 'Best Active Streak': 'personalstats', 'User Activity': 'personalstats', 'Awards': 'personalstats', 'Donator Days': 'personalstats',
                'Missions Completed': 'personalstats', 'Contracts Completed': 'personalstats', 'Mission Credits Earned': 'personalstats', 'Job Points Used': 'personalstats', 'Stat Trains Received': 'personalstats',
                'Travels Made': 'personalstats', 'City Finds': 'personalstats', 'Dump Finds': 'personalstats', 'Items Dumped': 'personalstats', 'Books Read': 'personalstats', 'Viruses Coded': 'personalstats', 'Races Won': 'personalstats',
                'Racing Skill': 'personalstats', 'Total Bounties': 'personalstats', 'Bounties Placed': 'personalstats', 'Bounties Collected': 'personalstats', 'Money Spent on Bounties': 'personalstats', 'Money From Bounties Collected': 'personalstats',
                'Revives Made': 'personalstats', 'Revives Received': 'personalstats', 'Revive Skill': 'personalstats',
            };
            const selection = selectionMapping[statName] || 'basic';
            const selections = `basic,${selection}`;

            const playerStatsUrl = `https://api.torn.com/v2/user/${playerId}?selections=${selections}&key=${apiKey}`;
            const response = await fetch(playerStatsUrl);
            const data = await response.json();

            if (data.error) {
                statsTableBody.innerHTML = `<tr><td colspan="2" class="error-message">Error: ${data.error.error}</td></tr>`;
                statsResultsContainer.style.display = 'block';
                return;
            }

            if (!data.basic || !data.basic.name) {
                statsTableBody.innerHTML = `<tr><td colspan="2" class="error-message">Error: Could not retrieve basic player information. Check the ID and your API key permissions.</td></tr>`;
                statsResultsContainer.style.display = 'block';
                return;
            }

            playerNameDisplay.textContent = `${data.basic.name} [${playerId}]`;
            
            const statValue = getValueForStat(statName, data);

            statsTableBody.innerHTML = '';
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${statName}</td>
                <td>${statValue}</td>
            `;
            statsTableBody.appendChild(row);

            statsResultsContainer.style.display = 'block';

        } catch (error) {
            console.error('Error fetching stats:', error);
            statsTableBody.innerHTML = `<tr><td colspan="2" class="error-message">Failed to load stats. Please try again.</td></tr>`;
            statsResultsContainer.style.display = 'block';
        }
    }
});