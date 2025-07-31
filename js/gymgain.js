// =======================================================
// GLOBAL DATA & HELPER FUNCTIONS (DEFINED ONCE AT TOP LEVEL)
// =======================================================

// Data Arrays (Accessible globally)
const Gymlist2 = [{Gym:"Premier Fitness",Energy:5,Str:2,Spe:2,Def:2,Dex:2},{Gym:"Average Joes",Energy:5,Str:2.4,Spe:2.4,Def:2.8,Dex:2.4},{Gym:"Woody's Workout",Energy:5,Str:2.8,Spe:3.2,Def:3,Dex:2.8},{Gym:"Beach Bods",Energy:5,Str:3.2,Spe:3.2,Def:3.2,Dex:"0"},{Gym:"Silver Gym",Energy:5,Str:3.4,Spe:3.6,Def:3.4,Dex:3.2},{Gym:"Pour Femme",Energy:5,Str:3.4,Spe:3.6,Def:3.6,Dex:3.8},{Gym:"Davies Den",Energy:5,Str:3.7,Spe:"0",Def:3.7,Dex:3.7},{Gym:"Global Gym",Energy:5,Str:4,Spe:4,Def:4,Dex:4},{Gym:"Knuckle Heads",Energy:10,Str:4.8,Spe:4.4,Def:4,Dex:4.2},{Gym:"Pioneer Fitness",Energy:10,Str:4.4,Spe:4.6,Def:4.8,Dex:4.4},{Gym:"Anabolic Anomalies",Energy:10,Str:5,Spe:4.6,Def:5.2,Dex:4.6},{Gym:"Core",Energy:10,Str:5,Spe:5.2,Def:5,Dex:5},{Gym:"Racing Fitness",Energy:10,Str:5,Spe:5.4,Def:4.8,Dex:5.2},{Gym:"Complete Cardio",Energy:10,Str:5.5,Spe:5.8,Def:5.5,Dex:5.2},{Gym:"Legs Bums and Tums",Energy:10,Str:"0",Spe:5.6,Def:5.6,Dex:5.8},{Gym:"Deep Burn",Energy:10,Str:6,Spe:6,Def:6,Dex:6},{Gym:"Apollo Gym",Energy:10,Str:6,Spe:6.2,Def:6.4,Dex:6.2},{Gym:"Gun Shop",Energy:10,Str:6.6,Spe:6.4,Def:6.2,Dex:6.2},{Gym:"Force Training",Energy:10,Str:6.4,Spe:6.6,Def:6.4,Dex:6.8},{Gym:"Cha Cha's",Energy:10,Str:6.4,Spe:6.4,Def:6.8,Dex:7},{Gym:"Atlas",Energy:10,Str:7,Spe:6.4,Def:6.4,Dex:6.6},{Gym:"Last Round",Energy:10,Str:6.8,Spe:6.6,Def:7,Dex:6.6},{Gym:"The Edge",Energy:10,Str:6.8,Spe:7,Def:7,Dex:6.8},{Gym:"George's",Energy:10,Str:7.3,Spe:7.3,Def:7.3,Dex:7.3},{Gym:"Balboas Gym",Energy:25,Str:"0",Spe:"0",Def:7.5,Dex:7.5},{Gym:"Frontline Fitness",Energy:25,Str:7.5,Spe:7.5,Def:"0",Dex:"0"},{Gym:"Gym 3000",Energy:50,Str:8,Spe:"0",Def:"0",Dex:"0"},{Gym:"Mr. Isoyamas",Energy:50,Str:"0",Spe:"0",Def:8,Dex:"0"},{Gym:"Total Rebound",Energy:50,Str:"0",Spe:8,Def:"0",Dex:"0"},{Gym:"Elites",Energy:50,Str:"0",Spe:"0",Def:"0",Dex:8},{Gym:"Sports Science Lab",Energy:25,Str:9,Spe:9,Def:9,Dex:9}];
const GYM_STAT_REQUIREMENTS = [{level:1,total_stats:0,gym_name:"Premier Fitness"},{level:2,total_stats:250000,gym_name:"Average Joe's"},{level:3,total_stats:1000000,gym_name:"Woody's Workout"},{level:4,total_stats:5000000,gym_name:"Beach Bods"},{level:5,total_stats:10000000,gym_name:"Silver Gym"},{level:6,total_stats:25000000,gym_name:"Pour Femme"},{level:7,total_stats:50000000,gym_name:"Davies Den"},{level:8,total_stats:75000000,gym_name:"Global Gym"},{level:9,total_stats:100000000,gym_name:"Knuckle Heads"},{level:10,total_stats:150000000,gym_name:"Pioneer Fitness"},{level:11,total_stats:200000000,gym_name:"Anabolic Anomalies"},{level:12,total_stats:250000000,gym_name:"Core"},{level:13,total_stats:300000000,gym_name:"Racing Fitness"},{level:14,total_stats:350000000,gym_name:"Complete Cardio"},{level:15,total_stats:400000000,gym_name:"Legs Bums and Tums"},{level:16,total_stats:450000000,gym_name:"Deep Burn"},{level:17,total_stats:500000000,gym_name:"Apollo Gym"},{level:18,total_stats:550000000,gym_name:"Gun Shop"},{level:19,total_stats:600000000,gym_name:"Force Training"},{level:20,total:650000000,gym_name:"Cha Cha's"},{level:21,total_stats:700000000,gym_name:"Atlas"},{level:22,total_stats:750000000,gym_name:"Last Round"},{level:30,total_stats:1150000000,gym_name:"Elites"},{level:31,total_stats:1200000000,gym_name:"Sports Science Lab"}];

// Helper Functions (Accessible globally)
function ROUND(num, places) { return +(Math.round(num + "e+" + places) + "e-" + places); }

function calculateTotal(stat, happy, dots, energyP, perks, typ, trains) {
    let S = stat; if (S > 5e7) S = 5e7 + (S - 5e7) / (8.77635 * Math.log(S));
    let H = happy; let [A, B, C] = { str: [1600, 1700, 700], spe: [1600, 2000, 1350], dex: [1800, 1500, 1000], def: [2100, -600, 1500] }[typ];
    let result = (S * ROUND(1 + 0.07 * ROUND(Math.log(1 + H / 250), 4), 4) + 8 * H ** 1.05 + (1 - (H / 99999) ** 2) * A + B) * (1 / 200000) * dots * energyP * perks;
    let total = 0;
    for (let i = 0; i < trains; i++) {
        S = stat + total; if (S > 5e7) S = 5e7 + (S - 5e7) / (8.77635 * Math.log(S));
        total += (S * ROUND(1 + 0.07 * ROUND(Math.log(1 + H / 250), 4), 4) + 8 * H ** 1.05 + (1 - (H / 99999) ** 2) * A + B) * (1 / 200000) * dots * energyP * perks;
        let dH = ROUND(energyP / 2, 0); H -= dH;
    }
    return [result, total];
}

function calculateETillNextGym(currentStr, currentDef, currentSpe, currentDex, currentHappy, currentGym, currentGymNumber) {
    const currentTotalStats = currentStr + currentDef + currentSpe + currentDex;
    let nextGymRequirement = null;
    for (let i = currentGymNumber + 1; i < GYM_STAT_REQUIREMENTS.length; i++) { if (GYM_STAT_REQUIREMENTS[i].total_stats > currentTotalStats) { nextGymRequirement = GYM_STAT_REQUIREMENTS[i]; break; } }
    if (!nextGymRequirement) {
        const highestGymStats = GYM_STAT_REQUIREMENTS[GYM_STAT_REQUIREMENTS.length - 1].total_stats;
        if (currentTotalStats >= highestGymStats) { return "Max Gym Reached"; } return "N/A (List End)";
    }
    const targetTotalStats = nextGymRequirement.total_stats;
    const remainingStatsNeeded = targetTotalStats - currentTotalStats; if (remainingStatsNeeded <= 0) return 0;
    const energyPerTrain = currentGym.Energy; const modifier = 1; let estimatedEnergyNeeded = 0; let gainedStats = 0; let trainsCount = 0; let happyForCalc = currentHappy;
    const statsTrained = [];
    if (parseFloat(currentGym.Str) > 0) statsTrained.push({ type: 'str', dots: parseFloat(currentGym.Str) });
    if (parseFloat(currentGym.Def) > 0) statsTrained.push({ type: 'def', dots: parseFloat(currentGym.Def) });
    if (parseFloat(currentGym.Spe) > 0) statsTrained.push({ type: 'spe', dots: parseFloat(currentGym.Spe) });
    if (parseFloat(currentGym.Dex) > 0) statsTrained.push({ type: 'dex', dots: parseFloat(currentGym.Dex) });
    if (statsTrained.length === 0) return "N/A (This gym doesn't train stats)";
    while (gainedStats < remainingStatsNeeded) {
        if (trainsCount > 10000000) { return `Very High E (${(estimatedEnergyNeeded/1000000).toFixed(1)}M)`; }
        let totalGainThisTrain = 0;
        for (const stat of statsTrained) {
            const singleTrainGain = calculateTotal(currentStr + gainedStats / statsTrained.length, happyForCalc, stat.dots, energyPerTrain, modifier, stat.type, 1)[0];
            totalGainThisTrain += singleTrainGain;
        }
        gainedStats += totalGainThisTrain; estimatedEnergyNeeded += energyPerTrain; trainsCount++;
        let dH = ROUND(energyPerTrain / 2, 0); happyForCalc = Math.max(0, happyForCalc - dH);
    }
    return estimatedEnergyNeeded;
}

// NEW FUNCTION: calculateRelativeTime (used by displayGainsTable and will be for download function)
function calculateRelativeTime(timestamp) {
    if (!timestamp) return 'Never';

    let date;
    if (typeof timestamp.toDate === 'function') {
        date = timestamp.toDate(); // Firestore Timestamp object
    } else if (timestamp instanceof Date) {
        date = timestamp; // Already a Date object
    } else if (typeof timestamp === 'number') {
        date = new Date(timestamp * 1000); // Unix timestamp in seconds
    } else {
        return 'Invalid Date';
    }

    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    let interval = seconds / 31536000; // seconds in a year
    if (interval > 1) {
        return Math.floor(interval) + (Math.floor(interval) === 1 ? ' year ago' : ' years ago');
    }
    interval = seconds / 2592000; // seconds in a month
    if (interval > 1) {
        return Math.floor(interval) + (Math.floor(interval) === 1 ? ' month ago' : ' months ago');
    }
    interval = seconds / 86400; // seconds in a day
    if (interval > 1) {
        return Math.floor(interval) + (Math.floor(interval) === 1 ? ' day ago' : ' days ago');
    }
    interval = seconds / 3600; // seconds in an hour
    if (interval > 1) {
        return Math.floor(interval) + (Math.floor(interval) === 1 ? ' hour ago' : ' hours ago');
    }
    interval = seconds / 60; // seconds in a minute
    if (interval > 1) {
        return Math.floor(interval) + (Math.floor(interval) === 1 ? ' minute ago' : ' minutes ago');
    }
    return 'just now';
}

// Helper to parse stat strings (e.g., "1.2m", "500k") into numbers
function parseStatValue(statString) {
    if (typeof statString === 'number') {
        return statString;
    }
    if (typeof statString !== 'string' || statString.trim() === '' || statString.toLowerCase() === 'n/a' || statString === '--') {
        return 0; // Handle initial '--' state gracefully
    }

    let value = statString.trim().toLowerCase();
    let multiplier = 1;
    if (value.endsWith('k')) {
        multiplier = 1000;
        value = value.slice(0, -1);
    } else if (value.endsWith('m')) {
        multiplier = 1000000;
        value = value.slice(0, -1);
    } else if (value.endsWith('b')) {
        multiplier = 1000000000;
        value = value.slice(0, -1);
    }

    const number = parseFloat(value.replace(/,/g, ''));
    return isNaN(number) ? 0 : number * multiplier;
}

// Helper to format gain values (+X, -Y, 0) with appropriate CSS class.
function formatGainValue(gain) {
    if (typeof gain !== 'number' || isNaN(gain)) {
        return '<span class="gain-neutral">N/A</span>';
    }
    const formatted = gain.toLocaleString();
    if (gain > 0) {
        return `<span class="gain-positive">+${formatted}</span>`;
    } else if (gain < 0) {
        return `<span class="gain-negative">${formatted}</span>`;
    } else {
        return `<span class="gain-neutral">0</span>`;
    }
}


document.addEventListener('DOMContentLoaded', () => {
    // =======================================================
    // 1. ELEMENT REFERENCES & GLOBAL VARIABLES (within DOMContentLoaded)
    // =======================================================
    const gymFeedback = document.getElementById('gymFeedback');
    const gymError = document.getElementById('gymError');

    // Firebase (should be globally available from firebase-init.js)
    const auth = firebase.auth();
    const db = firebase.firestore();

    // Left Panel Stats
    const strengthStat = document.getElementById('strengthStat');
    const defenseStat = document.getElementById('defenseStat');
    const speedStat = document.getElementById('speedStat');
    const dexterityStat = document.getElementById('dexterityStat');
    const availableEnergy = document.getElementById('availableEnergy');
    const perTrainEnergyValueDisplay = document.getElementById('perTrainEnergyValue');
    const perTrainGainStr = document.getElementById('perTrainGainStr');
    const perTrainGainDef = document.getElementById('perTrainGainDef');
    const perTrainGainSpe = document.getElementById('perTrainGainSpe');
    const perTrainGainDex = document.getElementById('perTrainGainDex');
    const xanaxGainStr = document.getElementById('xanaxGainStr');
    const xanaxGainDef = document.getElementById('xanaxGainDef');
    const xanaxGainSpe = document.getElementById('xanaxGainSpe');
    const xanaxGainDex = document.getElementById('xanaxGainDex');
    const maxEnergyValueDisplay = document.getElementById('maxEnergyValue');
    const maxEnergyGainStr = document.getElementById('maxEnergyGainStr');
    const maxEnergyGainDef = document.getElementById('maxEnergyGainDef');
    const maxEnergyGainSpe = document.getElementById('maxEnergyGainSpe');
    const maxEnergyGainDex = document.getElementById('maxEnergyGainDex');
    const happyJumpGainStr = document.getElementById('happyJumpGainStr');
    const happyJumpGainDef = document.getElementById('happyJumpGainDef');
    const happyJumpGainSpe = document.getElementById('happyJumpGainSpe');
    const happyJumpGainDex = document.getElementById('happyJumpGainDex');
    const currentGymNameDisplay = document.getElementById('currentGymName');
    const nextGymNameDisplay = document.getElementById('nextGymName');
    const nextGymReqStatsDisplay = document.getElementById('nextGymReqStats');
    const statsRemainingDisplay = document.getElementById('statsRemaining');
    const eToNextGymDetailedDisplay = document.getElementById('eToNextGymDetailed');

    let currentUser = null; // Firebase User Object

    // --- NEW TAB SYSTEM ELEMENTS (Right Panel) ---
    const tabButtons = document.querySelectorAll('#statProgressionContainer .tab-button-bb');
    const tabPanes = document.querySelectorAll('#personalTabContentContainer .tab-pane-bb');
    const downloadPersonalTabBtn = document.getElementById('downloadPersonalTabBtn');

    // References for "Current Gym Stats" tab (already handled in fetchTornPlayerStats)
    const currentGymStr = document.getElementById('currentGymStr');
    const currentGymDef = document.getElementById('currentGymDef');
    const currentGymSpd = document.getElementById('currentGymSpd');
    const currentGymDex = document.getElementById('currentGymDex');
    const currentGymTotal = document.getElementById('currentGymTotal');

    // References for "Gym Gains Tracking" tab (New IDs for stat-item structure)
    const startPersonalTrackingBtn = document.getElementById('startPersonalTrackingBtn');
    const stopPersonalTrackingBtn = document.getElementById('stopPersonalTrackingBtn');
    const personalTrackingStatus = document.getElementById('personalTrackingStatus');
    const personalGainsStartedAt = document.getElementById('personalGainsStartedAt');
    const noPersonalGainsData = document.getElementById('noPersonalGainsData');
    const personalGainStrSpan = document.getElementById('personalGainStr');
    const personalGainDefSpan = document.getElementById('personalGainDef');
    const personalGainSpdSpan = document.getElementById('personalGainSpd');
    const personalGainDexSpan = document.getElementById('personalGainDex');
    const personalGainTotalSpan = document.getElementById('personalGainTotal');
    const personalGainStrItem = document.getElementById('personalGainStrItem');
    const personalGainDefItem = document.getElementById('personalGainDefItem');
    const personalGainSpdItem = document.getElementById('personalGainSpdItem');
    const personalGainDexItem = document.getElementById('personalGainDexItem');
    const personalGainTotalItem = document.getElementById('personalGainTotalItem');


    // References for "Work Stats" tab
    const workJob = document.getElementById('workJob');
    const workRank = document.getElementById('workRank');
    const workStats = document.getElementById('workStats');

    // References for "Crimes" tab
    const crimesCommitted = document.getElementById('crimesCommitted');
    const nerveGained = document.getElementById('nerveGained');
    const jailTime = document.getElementById('jailTime');

    // --- GAIN TRACKING SPECIFIC GLOBALS ---
    const PERSONAL_GAIN_TRACKING_COLLECTION = 'personalGainSessions'; // Collection for personal tracking snapshots
    const PERSONAL_TRACKING_STATUS_DOC_PREFIX = 'personalTrackingStatus_'; // Document to hold active tracking session ID for a specific user
    
    let userApiKey = null;
    let userTornProfileId = null; // User's Torn ID
    let activePersonalTrackingSessionId = null; // ID of the currently active session in Firestore
    let activePersonalTrackingStartedAt = null; // Start timestamp of the active session
    let personalBaselineStatsCache = null; // Cache for the baseline stats of the active session (for current user)

    // Real-time Firestore unsubscribe functions
    let unsubscribeFromPersonalTrackingStatus = null;
    let unsubscribeFromUserStats = null; // For listening to user's current stats during tracking


    // =======================================================
    // 2. CORE FUNCTIONS (LEFT PANEL - NO CHANGES)
    // =======================================================
    // The updatePlayerStats function is for a simulated gym mechanic and is not
    // related to fetching or displaying actual Torn stats/gains, so it remains
    // as it was, untouched.
    async function updatePlayerStats(userId, stat, amount, energyCost) {
        if (!currentUser) { gymError.textContent = "You must be logged in to train!"; return; }
        try {
            gymFeedback.textContent = ''; gymError.textContent = '';
            const userRef = db.collection('userProfiles').doc(userId);
            await db.runTransaction(async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists) { throw new Error("Player data not found. Please log in again."); }
                let currentEnergy = userDoc.data().energy || 0;
                const maxEnergy = 100;
                if (currentEnergy < energyCost) { throw new Error("Not enough energy to train! You need " + energyCost + " energy."); }
                let newEnergy = currentEnergy - energyCost;
                if (stat === 'rest') {
                    newEnergy = Math.min(maxEnergy, currentEnergy + amount);
                    transaction.update(userRef, { energy: newEnergy });
                } else if (stat === 'full-body') {
                    const currentStrength = userDoc.data().strength || 0;
                    const currentDefense = userDoc.data().defense || 0;
                    const currentSpeed = userDoc.data().speed || 0;
                    const currentDexterity = userDoc.data().dexterity || 0;
                    transaction.update(userRef, {
                        strength: currentStrength + amount,
                        defense: currentDefense + amount,
                        speed: currentSpeed + amount,
                        dexterity: currentDexterity + amount,
                        energy: newEnergy
                    });
                } else {
                    const currentStatValue = userDoc.data()[stat] || 0;
                    const newStatValue = currentStatValue + amount;
                    transaction.update(userRef, {
                        [stat]: newStatValue,
                        energy: newEnergy
                    });
                }
            });
        } catch (error) {
            console.error("Error updating player stats (gym mechanic):", error);
            gymError.textContent = error.message || "Failed to update stats. Please try again.";
        } finally {
            if (currentUser) { fetchTornPlayerStats(currentUser.uid); }
        }
    }


    // =======================================================
    // 3. CORE FUNCTIONS (RIGHT PANEL - NEW / MODIFIED)
    // =======================================================

    /**
     * Fetches Torn API player stats and updates both left panel and "Current Gym Stats" tab.
     * Also updates userApiKey and userTornProfileId globals.
     */
    async function fetchTornPlayerStats(userId) {
        if (!userId) { console.warn("No user ID available to fetch Torn stats."); return; }
        
        // Reset displays on the left panel
        strengthStat.textContent = '--'; defenseStat.textContent = '--'; speedStat.textContent = '--'; dexterityStat.textContent = '--';
        availableEnergy.textContent = '--/--'; perTrainGainStr.textContent = 'Calculating...'; perTrainGainDef.textContent = 'Calculating...';
        perTrainGainSpe.textContent = 'Calculating...'; perTrainGainDex.textContent = 'Calculating...'; perTrainEnergyValueDisplay.textContent = '--';
        xanaxGainStr.textContent = 'Calculating...'; xanaxGainDef.textContent = 'Calculating...'; xanaxGainSpe.textContent = 'Calculating...';
        xanaxGainDex.textContent = 'Calculating...'; maxEnergyGainStr.textContent = 'Calculating...'; maxEnergyGainDef.textContent = 'Calculating...';
        maxEnergyGainSpe.textContent = 'Calculating...'; maxEnergyGainDex.textContent = 'Calculating...'; maxEnergyValueDisplay.textContent = '--';
        happyJumpGainStr.textContent = 'Calculating...'; happyJumpGainDef.textContent = 'Calculating...';
        happyJumpGainSpe.textContent = 'Calculating...'; happyJumpGainDex.textContent = 'Calculating...';
        gymError.textContent = ''; // Clear previous errors

        // Reset displays on the new "Current Gym Stats" tab
        currentGymStr.textContent = '--';
        currentGymDef.textContent = '--';
        currentGymSpd.textContent = '--';
        currentGymDex.textContent = '--';
        currentGymTotal.textContent = '--';

        try {
            const userProfileDocRef = db.collection('userProfiles').doc(userId);
            const userProfileDocSnap = await userProfileDocRef.get();
            if (userProfileDocSnap.exists) {
                const playerData = userProfileDocSnap.data();
                userTornProfileId = playerData.tornProfileId; // Store globally for other functions
                userApiKey = playerData.tornApiKey; // Store globally for other functions

                if (userApiKey && userTornProfileId) {
                    const apiUrl = `https://api.torn.com/user/${userTornProfileId}?selections=bars,personalstats,gym,crimes,job&key=${userApiKey}`; // Added crimes, job for new tabs
                    console.log("Fetching Torn API data from:", apiUrl);
                    const response = await fetch(apiUrl);
                    const data = await response.json();
                    console.log("Torn API Response:", data);
                    if (data.error) {
                        gymError.textContent = `Torn API Error: ${data.error.error.message || data.error.error || 'Unknown error'}. Check your API key and Torn ID in profile.`;
                        console.error("Torn API returned an error:", data.error);
                        // Also clear relevant new tab data if API fails
                        currentGymStr.textContent = 'N/A'; currentGymDef.textContent = 'N/A'; currentGymSpd.textContent = 'N/A'; currentGymDex.textContent = 'N/A'; currentGymTotal.textContent = 'N/A';
                        workJob.textContent = 'N/A'; workRank.textContent = 'N/A'; workStats.textContent = 'N/A';
                        crimesCommitted.textContent = 'N/A'; nerveGained.textContent = 'N/A'; jailTime.textContent = 'N/A';
                    } else {
                        const currentStrength = data.personalstats?.strength || 0;
                        const currentDefense = data.personalstats?.defense || 0;
                        const currentSpeed = data.personalstats?.speed || 0;
                        const currentDexterity = data.personalstats?.dexterity || 0;
                        const currentTotal = currentStrength + currentDefense + currentSpeed + currentDexterity; // Calculate total
                        const currentHappy = data.happy?.current || 0;
                        const currentEnergy = data.energy?.current || 0;
                        const maxEnergy = data.energy?.maximum || 0;

                        // Update Left Panel DOM elements
                        strengthStat.textContent = currentStrength.toLocaleString();
                        defenseStat.textContent = currentDefense.toLocaleString();
                        speedStat.textContent = currentSpeed.toLocaleString();
                        dexterityStat.textContent = currentDexterity.toLocaleString();
                        availableEnergy.textContent = `${currentEnergy}/${maxEnergy}`;
                        maxEnergyValueDisplay.textContent = maxEnergy;

                        // Update New "Current Gym Stats" tab DOM elements
                        currentGymStr.textContent = currentStrength.toLocaleString();
                        currentGymDef.textContent = currentDefense.toLocaleString();
                        currentGymSpd.textContent = currentSpeed.toLocaleString();
                        currentGymDex.textContent = currentDexterity.toLocaleString();
                        currentGymTotal.textContent = currentTotal.toLocaleString();
                        
                        // Update Work Stats tab (assuming data.job exists)
                        workJob.textContent = data.job?.company_name || 'N/A';
                        workRank.textContent = data.job?.position || 'N/A';
                        workStats.textContent = `Manual: ${data.job?.manual_labor || '0'} | Intelligence: ${data.job?.intelligence || '0'} | Endurance: ${data.job?.endurance || '0'}`;

                        // Update Crimes tab (assuming data.crimes exists)
                        crimesCommitted.textContent = data.crimes?.total || '0';
                        nerveGained.textContent = data.personalstats?.nerve || '0'; // Assuming nerve from personalstats
                        jailTime.textContent = (data.status?.state === 'Jail') ? `${data.status.until || '0'}s` : '0';


                        const gymNumber = (data.active_gym !== undefined && data.active_gym !== null) ? data.active_gym - 1 : -1;
                        if (gymNumber >= 0 && gymNumber < Gymlist2.length) {
                            const currentGym = Gymlist2[gymNumber];
                            const energyPerTrain = currentGym.Energy;
                            let modifierStr = 1, modifierSpe = 1, modifierDef = 1, modifierDex = 1;

                            const gainStrPerTrain = calculateTotal(currentStrength, currentHappy, parseFloat(currentGym.Str), energyPerTrain, modifierStr, 'str', 1);
                            const gainDefPerTrain = calculateTotal(currentDefense, currentHappy, parseFloat(currentGym.Def), energyPerTrain, modifierDef, 'def', 1);
                            const gainSpePerTrain = calculateTotal(currentSpeed, currentHappy, parseFloat(currentGym.Spe), energyPerTrain, modifierSpe, 'spe', 1);
                            const gainDexPerTrain = calculateTotal(currentDexterity, currentHappy, parseFloat(currentGym.Dex), energyPerTrain, modifierDex, 'dex', 1);
                            
                            const XANAX_ENERGY = 250;
                            const trainsPerXanax = parseInt(XANAX_ENERGY / energyPerTrain);
                            const gainStrXanax = calculateTotal(currentStrength, currentHappy, parseFloat(currentGym.Str), energyPerTrain, modifierStr, 'str', trainsPerXanax);
                            const gainDefXanax = calculateTotal(currentDefense, currentHappy, parseFloat(currentGym.Def), energyPerTrain, modifierDef, 'def', trainsPerXanax);
                            const gainSpeXanax = calculateTotal(currentSpeed, currentHappy, parseFloat(currentGym.Spe), energyPerTrain, modifierSpe, 'spe', trainsPerXanax);
                            const gainDexXanax = calculateTotal(currentDexterity, currentHappy, parseFloat(currentGym.Dex), energyPerTrain, modifierDex, 'dex', trainsPerXanax);
                            
                            const trainsPerMaxEnergy = parseInt(maxEnergy / energyPerTrain);
                            const gainStrMaxEnergy = calculateTotal(currentStrength, currentHappy, parseFloat(currentGym.Str), energyPerTrain, modifierStr, 'str', trainsPerMaxEnergy);
                            const gainDefMaxEnergy = calculateTotal(currentDefense, currentHappy, parseFloat(currentGym.Def), energyPerTrain, modifierDef, 'def', trainsPerMaxEnergy);
                            const gainSpeMaxEnergy = calculateTotal(currentSpeed, currentHappy, parseFloat(currentGym.Spe), energyPerTrain, modifierSpe, 'spe', trainsPerMaxEnergy);
                            const gainDexMaxEnergy = calculateTotal(currentDexterity, currentHappy, parseFloat(currentGym.Dex), energyPerTrain, modifierDex, 'dex', trainsPerMaxEnergy);
                            
                            const HAPPY_JUMP_ENERGY = 1150;
                            const PI_HAPPY_BONUS = 4000;
                            const E_DVD_HAPPY_PER_UNIT = 2500;
                            const HAPPY_JUMP_HAPPY_VAL = (currentHappy + (5 * E_DVD_HAPPY_PER_UNIT) + PI_HAPPY_BONUS) * 2;
                            const trainsPerHappyJump = parseInt(HAPPY_JUMP_ENERGY / energyPerTrain);
                            const gainStrHappyJump = calculateTotal(currentStrength, HAPPY_JUMP_HAPPY_VAL, parseFloat(currentGym.Str), energyPerTrain, modifierStr, 'str', trainsPerHappyJump);
                            const gainDefHappyJump = calculateTotal(currentDefense, HAPPY_JUMP_HAPPY_VAL, parseFloat(currentGym.Def), energyPerTrain, modifierDef, 'def', trainsPerHappyJump);
                            const gainSpeHappyJump = calculateTotal(currentSpeed, HAPPY_JUMP_HAPPY_VAL, parseFloat(currentGym.Spe), energyPerTrain, modifierSpe, 'spe', trainsPerHappyJump);
                            const gainDexHappyJump = calculateTotal(currentDexterity, HAPPY_JUMP_HAPPY_VAL, parseFloat(currentGym.Dex), energyPerTrain, modifierDex, 'dex', trainsPerHappyJump);
                            
                            const displayGain = (gainValue, gymDots) => gymDots > 0 ? ROUND(gainValue, 2).toLocaleString() : `<span style="color: grey;">N/A</span>`;
                            
                            perTrainEnergyValueDisplay.textContent = energyPerTrain;
                            perTrainGainStr.innerHTML = displayGain(gainStrPerTrain[0], parseFloat(currentGym.Str));
                            perTrainGainDef.innerHTML = displayGain(gainDefPerTrain[0], parseFloat(currentGym.Def));
                            perTrainGainSpe.innerHTML = displayGain(gainSpePerTrain[0], parseFloat(currentGym.Spe));
                            perTrainGainDex.innerHTML = displayGain(gainDexPerTrain[0], parseFloat(currentGym.Dex));
                            
                            xanaxGainStr.innerHTML = displayGain(gainStrXanax[1], parseFloat(currentGym.Str));
                            xanaxGainDef.innerHTML = displayGain(gainDefXanax[1], parseFloat(currentGym.Def));
                            xanaxGainSpe.innerHTML = displayGain(gainSpeXanax[1], parseFloat(currentGym.Spe));
                            xanaxGainDex.innerHTML = displayGain(gainDexXanax[1], parseFloat(currentGym.Dex));
                            
                            maxEnergyGainStr.innerHTML = displayGain(gainStrMaxEnergy[1], parseFloat(currentGym.Str));
                            maxEnergyGainDef.innerHTML = displayGain(gainDefMaxEnergy[1], parseFloat(currentGym.Def));
                            maxEnergyGainSpe.innerHTML = displayGain(gainSpeMaxEnergy[1], parseFloat(currentGym.Spe));
                            maxEnergyGainDex.innerHTML = displayGain(gainDexMaxEnergy[1], parseFloat(currentGym.Dex));
                            
                            happyJumpGainStr.innerHTML = displayGain(gainStrHappyJump[1], parseFloat(currentGym.Str));
                            happyJumpGainDef.innerHTML = displayGain(gainDefHappyJump[1], parseFloat(currentGym.Def));
                            happyJumpGainSpe.innerHTML = displayGain(gainSpeHappyJump[1], parseFloat(currentGym.Spe));
                            happyJumpGainDex.innerHTML = displayGain(gainDexHappyJump[1], parseFloat(currentGym.Dex));
                            
                            currentGymNameDisplay.textContent = currentGym.Gym;
                            
                            const nextGymEnergyNeeded = calculateETillNextGym(currentStrength, currentDefense, currentSpeed, currentDexterity, currentHappy, currentGym, gymNumber);
                            if (typeof nextGymEnergyNeeded === 'string') {
                                eToNextGymDetailedDisplay.textContent = nextGymEnergyNeeded;
                                nextGymNameDisplay.textContent = '--';
                                nextGymReqStatsDisplay.textContent = '--';
                                statsRemainingDisplay.textContent = '--';
                            } else {
                                eToNextGymDetailedDisplay.textContent = nextGymEnergyNeeded.toLocaleString();
                                let nextGymReq = null;
                                for (let i = gymNumber + 1; i < GYM_STAT_REQUIREMENTS.length; i++) {
                                    if (GYM_STAT_REQUIREMENTS[i].total_stats > currentTotalStats) {
                                        nextGymReq = GYM_STAT_REQUIREMENTS[i];
                                        break;
                                    }
                                }
                                if (nextGymReq) {
                                    nextGymNameDisplay.textContent = nextGymReq.gym_name;
                                    nextGymReqStatsDisplay.textContent = nextGymReq.total_stats.toLocaleString();
                                    statsRemainingDisplay.textContent = (nextGymReq.total_stats - currentTotalStats).toLocaleString();
                                } else {
                                    nextGymNameDisplay.textContent = 'Final Gym';
                                    nextGymReqStatsDisplay.textContent = 'N/A';
                                    statsRemainingDisplay.textContent = 'N/A';
                                }
                            }
                        } else {
                            gymError.textContent = "Could not determine current gym from Torn API data.";
                            console.warn("Gym number invalid or out of bounds:", gymNumber);
                        }
                    }
                } else {
                    gymError.textContent = "Torn Profile ID or API Key missing from your profile. Please update your profile settings.";
                    console.error("Torn Profile ID or API Key missing from user profile in Firestore.");
                }
            } else {
                gymError.textContent = "Player profile data not found in Firestore. Make sure you are logged in.";
                console.error("User profile document not found in Firestore for UID:", userId);
            }
        } catch (error) {
            console.error("Error fetching Torn API stats:", error);
            gymError.textContent = `Failed to fetch live game stats. Error: ${error.message}. Check your connection or API key.`;
        }
    }

    /**
     * Updates the UI elements related to personal gains tracking status (buttons, text).
     */
    function updatePersonalGainTrackingUI() {
        if (!startPersonalTrackingBtn || !stopPersonalTrackingBtn || !personalTrackingStatus || !personalGainsStartedAt) {
            console.error("UI Error: Personal tracking UI elements not found.");
            return;
        }

        if (activePersonalTrackingSessionId) {
            startPersonalTrackingBtn.classList.add('hidden');
            stopPersonalTrackingBtn.classList.remove('hidden');
            stopPersonalTrackingBtn.disabled = false;
            stopPersonalTrackingBtn.textContent = 'Stop Tracking';
            
            personalTrackingStatus.textContent = 'Currently tracking gains.';
            if (activePersonalTrackingStartedAt) {
                const startedDate = activePersonalTrackingStartedAt.toDate ? activePersonalTrackingStartedAt.toDate() : activePersonalTrackingStartedAt;
                personalGainsStartedAt.textContent = 'Session started: ' + startedDate.toLocaleString();
            } else {
                personalGainsStartedAt.textContent = '';
            }
        } else {
            startPersonalTrackingBtn.classList.remove('hidden');
            startPersonalTrackingBtn.disabled = false;
            startPersonalTrackingBtn.textContent = 'Start Tracking Gains';
            stopPersonalTrackingBtn.classList.add('hidden');
            personalGainsStartedAt.textContent = '';
            personalTrackingStatus.textContent = 'Ready to start tracking.';
            // Also hide the stat items and show "no data available" message if no session
            personalGainStrItem.classList.add('hidden');
            personalGainDefItem.classList.add('hidden');
            personalGainSpdItem.classList.add('hidden');
            personalGainDexItem.classList.add('hidden');
            personalGainTotalItem.classList.add('hidden');
            noPersonalGainsData.classList.remove('hidden');
            noPersonalGainsData.textContent = 'No gains data available. Click "Start Tracking Gains" to begin a new session.';
        }
    }

    /**
     * Fetches current battle stats for the current user and saves them as a snapshot.
     */
    async function startPersonalTrackingGains() {
        console.log("Attempting to start personal tracking gains...");
        if (!currentUser || !userApiKey || !userTornProfileId) {
            alert("Cannot start tracking: User not fully logged in or API key/Torn ID missing. Please log in and ensure your profile settings are complete.");
            return;
        }

        if (startPersonalTrackingBtn) {
            startPersonalTrackingBtn.disabled = true;
            startPersonalTrackingBtn.textContent = 'Starting...';
        }

        try {
            // Get current stats directly from the live DOM or by refetching from Torn API if needed
            // For simplicity, we'll try to use already fetched data, but a refetch could be safer.
            // Let's assume fetchTornPlayerStats has already populated these or call it first.
            await fetchTornPlayerStats(currentUser.uid); // Ensure latest stats are available

            const currentStrength = parseStatValue(strengthStat.textContent);
            const currentDefense = parseStatValue(defenseStat.textContent);
            const currentSpeed = parseStatValue(speedStat.textContent);
            const currentDexterity = parseStatValue(dexterityStat.textContent);
            const currentTotal = currentStrength + currentDefense + currentSpeed + currentDexterity;

            if (currentStrength === 0 && currentDefense === 0 && currentSpeed === 0 && currentDexterity === 0) {
                 throw new Error("Cannot start tracking with zero stats. Please ensure your Torn API key is valid and stats are loading correctly.");
            }

            const personalTrackingDocRef = db.collection(PERSONAL_GAIN_TRACKING_COLLECTION).doc(currentUser.uid);
            const newSessionId = personalTrackingDocRef.collection('sessions').doc().id; // Generate a new sub-collection doc ID

            await personalTrackingDocRef.set({
                activeSessionId: newSessionId,
                startedByUid: currentUser.uid,
                startedAt: firebase.firestore.FieldValue.serverTimestamp(),
                isActive: true,
                tornProfileId: userTornProfileId // Store Torn ID for snapshot context
            }, { merge: true }); // Merge to avoid overwriting other user data if present

            await personalTrackingDocRef.collection('sessions').doc(newSessionId).set({
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                strength: currentStrength,
                defense: currentDefense,
                speed: currentSpeed,
                dexterity: currentDexterity,
                total: currentTotal
            });

            console.log("Personal gains tracking started. Snapshot saved for user:", currentUser.uid);
            alert("Personal gains tracking started successfully!");

        } catch (error) {
            console.error("Error starting personal gains tracking:", error);
            alert("Failed to start personal tracking gains: " + error.message);
        } finally {
            updatePersonalGainTrackingUI(); // Update UI based on new state
        }
    }

    /**
     * Stops the current personal gains tracking session.
     */
    async function stopPersonalTrackingGains() {
        console.log("Attempting to stop personal tracking gains...");
        if (!currentUser) {
            alert("You must be logged in to stop tracking.");
            return;
        }

        if (stopPersonalTrackingBtn) {
            stopPersonalTrackingBtn.disabled = true;
            stopPersonalTrackingBtn.textContent = 'Stopping...';
        }

        try {
            const personalTrackingDocRef = db.collection(PERSONAL_GAIN_TRACKING_COLLECTION).doc(currentUser.uid);
            const statusDoc = await personalTrackingDocRef.get();

            if (statusDoc.exists && statusDoc.data().activeSessionId) {
                const activeSessionIdToUpdate = statusDoc.data().activeSessionId;

                // Update the active session document in the subcollection to mark it inactive
                await personalTrackingDocRef.collection('sessions').doc(activeSessionIdToUpdate).update({
                    isActive: false, // Mark the individual session as inactive
                    stoppedAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Clear the activeSessionId from the main user's document
                await personalTrackingDocRef.update({
                    activeSessionId: firebase.firestore.FieldValue.delete(), // Remove the field
                    isActive: false // Also set isActive to false on main doc
                });
                
                console.log("Personal gains tracking stopped for session:", activeSessionIdToUpdate);
                alert("Personal gains tracking stopped successfully!");

            } else {
                alert("No active personal tracking session found to stop.");
            }
        } catch (error) {
            console.error("Error stopping personal gains tracking:", error);
            alert("Failed to stop personal tracking gains: " + error.message);
        } finally {
            updatePersonalGainTrackingUI(); // Update UI based on new state
        }
    }

    /**
     * Sets up a real-time listener for the active personal gains tracking session status.
     * This updates the buttons and status message, and triggers gains display.
     */
    function setupPersonalRealtimeTrackingStatusListener() {
        if (!currentUser) {
            console.warn("Cannot setup personal tracking listener: No current user.");
            return;
        }
        if (unsubscribeFromPersonalTrackingStatus) {
            unsubscribeFromPersonalTrackingStatus();
            unsubscribeFromPersonalTrackingStatus = null;
        }

        const personalTrackingDocRef = db.collection(PERSONAL_GAIN_TRACKING_COLLECTION).doc(currentUser.uid);

        unsubscribeFromPersonalTrackingStatus = personalTrackingDocRef.onSnapshot(async (doc) => {
            if (doc.exists && doc.data().activeSessionId) {
                activePersonalTrackingSessionId = doc.data().activeSessionId;
                activePersonalTrackingStartedAt = doc.data().startedAt;

                // Fetch baseline stats only if not already cached for this session
                if (!personalBaselineStatsCache || personalBaselineStatsCache.sessionId !== activePersonalTrackingSessionId) {
                    console.log("Fetching baseline snapshot for new active session:", activePersonalTrackingSessionId);
                    const baselineDoc = await personalTrackingDocRef.collection('sessions').doc(activePersonalTrackingSessionId).get();
                    if (baselineDoc.exists) {
                        personalBaselineStatsCache = {
                            sessionId: activePersonalTrackingSessionId,
                            data: baselineDoc.data()
                        };
                    } else {
                        console.warn("Active personal session ID found, but baseline snapshot is missing from Firestore. Resetting status.");
                        activePersonalTrackingSessionId = null;
                        activePersonalTrackingStartedAt = null;
                        personalBaselineStatsCache = null;
                    }
                }
            } else {
                activePersonalTrackingSessionId = null;
                activePersonalTrackingStartedAt = null;
                personalBaselineStatsCache = null;
            }
            updatePersonalGainTrackingUI(); // Update button states and status message

            // Always display gains if session is active, or clear if not
            if (document.getElementById('personal-gym-gains-tab').classList.contains('active')) {
                displayPersonalGains(); // Only call if this tab is active
            }

        }, (error) => {
            console.error("Error listening to personal tracking status:", error);
            activePersonalTrackingSessionId = null;
            activePersonalTrackingStartedAt = null;
            personalBaselineStatsCache = null;
            updatePersonalGainTrackingUI();
            if (document.getElementById('personal-gym-gains-tab').classList.contains('active')) {
                displayPersonalGains();
            }
        });
        console.log("Real-time personal tracking status listener set up.");
    }

    /**
     * Displays the personal gains by comparing current stats to the active snapshot.
     */
    async function displayPersonalGains() {
        // Hide all stat items initially
        personalGainStrItem.classList.add('hidden');
        personalGainDefItem.classList.add('hidden');
        personalGainSpdItem.classList.add('hidden');
        personalGainDexItem.classList.add('hidden');
        personalGainTotalItem.classList.add('hidden');

        if (!noPersonalGainsData) {
            console.error("HTML Error: noPersonalGainsData element not found.");
            return;
        }

        if (!currentUser || !userApiKey || !userTornProfileId) {
            noPersonalGainsData.textContent = 'Please log in with your API key to track gains.';
            noPersonalGainsData.classList.remove('hidden');
            return;
        }

        if (!activePersonalTrackingSessionId || !personalBaselineStatsCache) {
            noPersonalGainsData.textContent = 'No active gains tracking session. Click "Start Tracking Gains" to begin.';
            noPersonalGainsData.classList.remove('hidden');
            return;
        }

        noPersonalGainsData.textContent = 'Calculating gains...';
        noPersonalGainsData.classList.remove('hidden'); // Show loading message

        try {
            // Re-fetch user stats directly from Torn API to get the absolute latest
            const apiUrl = `https://api.torn.com/user/${userTornProfileId}?selections=personalstats&key=${userApiKey}&comment=MyTornPA_GymGain_GainsRefresh`;
            const response = await fetch(apiUrl);
            const data = await response.json();

            if (!response.ok || data.error) {
                throw new Error(`Torn API Error: ${data.error?.error || 'API Error'}.`);
            }

            const currentStats = {
                strength: parseStatValue(data.personalstats?.strength),
                defense: parseStatValue(data.personalstats?.defense),
                speed: parseStatValue(data.personalstats?.speed),
                dexterity: parseStatValue(data.personalstats?.dexterity)
            };
            currentStats.total = currentStats.strength + currentStats.defense + currentStats.speed + currentStats.dexterity;

            const baselineStats = personalBaselineStatsCache.data;

            const strengthGain = currentStats.strength - baselineStats.strength;
            const defenseGain = currentStats.defense - baselineStats.defense;
            const speedGain = currentStats.speed - baselineStats.speed;
            const dexterityGain = currentStats.dexterity - baselineStats.dexterity;
            const totalGain = currentStats.total - baselineStats.total;

            personalGainStrSpan.innerHTML = formatGainValue(strengthGain);
            personalGainDefSpan.innerHTML = formatGainValue(defenseGain);
            personalGainSpdSpan.innerHTML = formatGainValue(speedGain);
            personalGainDexSpan.innerHTML = formatGainValue(dexterityGain);
            personalGainTotalSpan.innerHTML = formatGainValue(totalGain);

            personalGainStrItem.classList.remove('hidden');
            personalGainDefItem.classList.remove('hidden');
            personalGainSpdItem.classList.remove('hidden');
            personalGainDexItem.classList.remove('hidden');
            personalGainTotalItem.classList.remove('hidden');
            noPersonalGainsData.classList.add('hidden'); // Hide loading message
            
        } catch (error) {
            console.error("Error displaying personal gains:", error);
            noPersonalGainsData.textContent = `Error loading gains: ${error.message}`;
            noPersonalGainsData.classList.remove('hidden');
            // Hide all stat items on error
            personalGainStrItem.classList.add('hidden');
            personalGainDefItem.classList.add('hidden');
            personalGainSpdItem.classList.add('hidden');
            personalGainDexItem.classList.add('hidden');
            personalGainTotalItem.classList.add('hidden');
        }
    }


    /**
     * Captures the content of the currently active tab in the right panel as an image
     * and triggers a download. Requires html2canvas library.
     */
    function downloadPersonalTabAsImage() {
        const activeTabPane = document.querySelector('#personalTabContentContainer .tab-pane-bb.active');

        if (!activeTabPane) {
            console.error('No active tab pane found to screenshot.');
            alert('Could not find active content to download.');
            return;
        }

        let filename = 'tornpa_gymgain_';
        let contentToCapture = activeTabPane;

        // Customize filename based on active tab
        if (activeTabPane.id === 'current-gym-stats-tab') {
            filename += 'current_gym_stats.png';
            // Capture the .current-stats-personal div directly if only that part is desired,
            // otherwise capture the whole activeTabPane.
            contentToCapture = activeTabPane.querySelector('.current-stats-personal') || activeTabPane;
        } else if (activeTabPane.id === 'personal-gym-gains-tab') {
            filename += 'personal_gains_tracking.png';
            contentToCapture = activeTabPane.querySelector('.personal-gains-display') || activeTabPane;
        } else if (activeTabPane.id === 'personal-work-stats-tab') {
            filename += 'work_stats.png';
            contentToCapture = activeTabPane.querySelector('.current-work-stats') || activeTabPane;
        } else if (activeTabPane.id === 'personal-crimes-tab') {
            filename += 'crime_stats.png';
            contentToCapture = activeTabPane.querySelector('.current-crime-stats') || activeTabPane;
        } else {
            console.warn('Unknown active tab for screenshot, using generic filename and capturing entire pane.');
            filename += 'tab_content.png';
        }

        // Create a temporary container for rendering the screenshot
        // This ensures the screenshot has a consistent background and padding,
        // and doesn't capture the entire scrollable area if the tab has one.
        const tempRenderContainer = document.createElement('div');
        tempRenderContainer.style.background = '#222'; // Match tab-content-container-bb background
        tempRenderContainer.style.padding = '15px'; // Match tab-content-container-bb padding
        tempRenderContainer.style.borderRadius = '8px'; // Match tab-content-container-bb border-radius
        tempRenderContainer.style.position = 'absolute';
        tempRenderContainer.style.left = '-9999px'; // Move off-screen
        tempRenderContainer.style.width = contentToCapture.offsetWidth + 'px'; // Maintain width
        tempRenderContainer.style.height = 'auto'; // Auto height

        // Clone the content to be captured to avoid altering the live DOM
        const clonedContent = contentToCapture.cloneNode(true);
        // Ensure any hidden elements (like "No gains data available" message) are hidden in clone for screenshot
        if (clonedContent.id === 'personal-gym-gains-tab') { // Special handling for gains tab
            const noGainsMsg = clonedContent.querySelector('#noPersonalGainsData');
            if (noGainsMsg && !noGainsMsg.classList.contains('hidden')) {
                 clonedContent.querySelectorAll('.personal-gains-display .stat-item').forEach(item => item.classList.add('hidden'));
            } else if (noGainsMsg) {
                 noGainsMsg.classList.add('hidden'); // Hide "no data" if stats are showing
            }
        }
        
        // Temporarily hide scrollbars or other unwanted elements in the clone
        clonedContent.style.overflowY = 'hidden';
        clonedContent.style.paddingRight = '0'; // Remove padding for scrollbar

        tempRenderContainer.appendChild(clonedContent);
        document.body.appendChild(tempRenderContainer);

        html2canvas(tempRenderContainer, {
            scale: 2, // Capture at a higher resolution for better quality
            useCORS: true,
            logging: false,
            backgroundColor: null // Allow transparency or rely on tempRenderContainer's background
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = filename;
            link.href = canvas.toDataURL('image/png');

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }).catch(error => {
            console.error('Error capturing element for download:', error);
            alert('Could not download image. An error occurred. Please check the console for details.');
        }).finally(() => {
            if (tempRenderContainer.parentNode) {
                document.body.removeChild(tempRenderContainer); // Clean up temp container
            }
        });
    }

    // --- Tab Switching Logic ---
    function showTab(tabId) {
        tabPanes.forEach(pane => {
            if (pane.id === tabId) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });

        tabButtons.forEach(button => {
            if (button.dataset.tab + '-tab' === tabId) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });

        // Unsubscribe from any active Firestore listeners when switching tabs
        // to prevent unnecessary real-time updates for inactive tabs.
        if (unsubscribeFromPersonalTrackingStatus) {
            unsubscribeFromPersonalTrackingStatus();
            unsubscribeFromPersonalTrackingStatus = null;
            console.log("Unsubscribed from personal tracking status listener (on tab switch).");
        }
        if (unsubscribeFromUserStats) {
            unsubscribeFromUserStats();
            unsubscribeFromUserStats = null;
            console.log("Unsubscribed from user stats listener for gains (on tab switch).");
        }

        // Trigger data load/refresh when switching to a tab that needs it
        if (tabId === 'current-gym-stats-tab') {
            // Already populated on authStateChanged, no explicit refresh needed here unless desired
            // fetchTornPlayerStats(currentUser.uid); // Uncomment if you want to re-fetch every time this tab is clicked
        } else if (tabId === 'personal-gym-gains-tab') {
            console.log("Switched to Personal Gym Gains Tracking tab.");
            if (currentUser && userApiKey && userTornProfileId) {
                setupPersonalRealtimeTrackingStatusListener(); // Set up listener for this user
                // The listener will call displayPersonalGains when status changes
            } else {
                noPersonalGainsData.textContent = 'Please log in with your API key to track gains.';
                noPersonalGainsData.classList.remove('hidden');
                // Hide all stat items on no login
                personalGainStrItem.classList.add('hidden');
                personalGainDefItem.classList.add('hidden');
                personalGainSpdItem.classList.add('hidden');
                personalGainDexItem.classList.add('hidden');
                personalGainTotalItem.classList.add('hidden');
            }

        } else if (tabId === 'personal-work-stats-tab') {
            console.log("Switched to Work Stats tab.");
            // Data is fetched with main fetchTornPlayerStats, just ensure it's displayed
            // (Mock data already shown by default if API call fails)
        } else if (tabId === 'personal-crimes-tab') {
            console.log("Switched to Crimes tab.");
            // Data is fetched with main fetchTornPlayerStats, just ensure it's displayed
            // (Mock data already shown by default if API call fails)
        }
    }


    // =======================================================
    // 4. EVENT LISTENERS & INITIALIZATION
    // =======================================================

    // Attach click listeners to the new tab buttons
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            showTab(button.dataset.tab + '-tab');
        });
    });

    // Handle initial tab display (make "Current Gym Stats" active on load)
    // This will be called after authStateChanged fully runs to ensure user data is ready.
    // showTab('current-gym-stats-tab'); // This call is moved to after user data is guaranteed.


    // Download button for the personal tabs
    if (downloadPersonalTabBtn) {
        downloadPersonalTabBtn.addEventListener('click', downloadPersonalTabAsImage);
    }


    // --- Event Listeners for Personal Gain Tracking Buttons ---
    if (startPersonalTrackingBtn) {
        startPersonalTrackingBtn.addEventListener('click', startPersonalTrackingGains);
    }
    if (stopPersonalTrackingBtn) {
        stopPersonalTrackingBtn.addEventListener('click', stopPersonalTrackingGains);
    }


    // --- Authentication and Initial Data Load ---
    auth.onAuthStateChanged(async (user) => {
        currentUser = user; // Set global currentUser variable
        if (user) {
            console.log("User logged in:", currentUser.uid);
            await fetchTornPlayerStats(currentUser.uid); // Fetch initial data

            // Now that user data is loaded, set up the listener for personal tracking status
            // Only set up if the "Gym Gains Tracking" tab might be needed.
            // If the user navigates directly to another tab, this listener will be set up when that tab is clicked.
            if (document.getElementById('personal-gym-gains-tab').classList.contains('active')) {
                setupPersonalRealtimeTrackingStatusListener();
            } else {
                // Ensure UI is correctly initialized even if not on gains tab
                updatePersonalGainTrackingUI();
            }
            
            // Initial call to show the default tab if not already handled
            // Ensure this is called *after* initial fetchTornPlayerStats to populate default tab.
            showTab('current-gym-stats-tab');


        } else {
            console.log("No user logged in. Displaying login message.");
            // If no user, clear displays and prompt login
            gymError.textContent = 'Please log in to view your gym stats.';
            strengthStat.textContent = '--'; // Clear left panel stats
            defenseStat.textContent = '--';
            speedStat.textContent = '--';
            dexterityStat.textContent = '--';
            availableEnergy.textContent = '--/--';
            // Also clear right panel "Current Gym Stats" tab
            currentGymStr.textContent = '--';
            currentGymDef.textContent = '--';
            currentGymSpd.textContent = '--';
            currentGymDex.textContent = '--';
            currentGymTotal.textContent = '--';
            // Also update gains tracking UI to reflect logged-out state
            activePersonalTrackingSessionId = null; // Ensure no active session
            updatePersonalGainTrackingUI();
            noPersonalGainsData.textContent = 'Please log in to track gains.';
            
            // Clear mock data from work/crimes if no user
            workJob.textContent = '--'; workRank.textContent = '--'; workStats.textContent = '--';
            crimesCommitted.textContent = '--'; nerveGained.textContent = '--'; jailTime.textContent = '--';

            // Unsubscribe all listeners if user logs out
            if (unsubscribeFromPersonalTrackingStatus) {
                unsubscribeFromPersonalTrackingStatus();
                unsubscribeFromPersonalTrackingStatus = null;
            }
            if (unsubscribeFromUserStats) {
                unsubscribeFromUserStats();
                unsubscribeFromUserStats = null;
            }
            // window.location.href = 'login.html'; // Uncomment if you want to force redirect
        }
    });

    // The train-btn listeners remain as they are for the left panel functionality.
    document.querySelectorAll('.train-btn').forEach(button => {
        button.addEventListener('click', () => {
            if (!currentUser) { gymError.textContent = "You must be logged in to train!"; return; }
            const card = button.closest('.gym-action-card');
            const trainingType = card.dataset.trainingType;
            const energyCost = parseInt(button.dataset.energyCost);
            let statToBoost = '';
            let boostAmount = 0;
            switch (trainingType) {
                case 'strength': statToBoost = 'strength'; boostAmount = 2; break;
                case 'defense': statToBoost = 'defense'; boostAmount = 2; break;
                case 'speed': statToBoost = 'speed'; boostAmount = 2; break;
                case 'dexterity': statToBoost = 'dexterity'; boostAmount = 2; break;
                case 'full-body': statToBoost = 'full-body'; boostAmount = 1; break;
                case 'rest': statToBoost = 'rest'; boostAmount = 20; break;
                default: gymError.textContent = "Unknown training type selected."; return;
            }
            updatePlayerStats(currentUser.uid, statToBoost, boostAmount, energyCost);
        });
    });

}); // End DOMContentLoaded