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

// NEW FUNCTION: calculateRelativeTime (used by download function, keeping for consistency)
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


document.addEventListener('DOMContentLoaded', () => {
    // =======================================================
    // 1. ELEMENT REFERENCES & GLOBAL VARIABLES (within DOMContentLoaded)
    // =======================================================
    const gymFeedback = document.getElementById('gymFeedback');
    const gymError = document.getElementById('gymError');

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

    const db = firebase.firestore(); // Firebase instance needs to be accessible
    let currentUser = null;

    // --- NEW TAB SYSTEM ELEMENTS (Right Panel) ---
    const tabButtons = document.querySelectorAll('#statProgressionContainer .tab-button-bb');
    const tabPanes = document.querySelectorAll('#personalTabContentContainer .tab-pane-bb');
    const downloadPersonalTabBtn = document.getElementById('downloadPersonalTabBtn');

    // References for "Current Gym Stats" tab
    const currentGymStr = document.getElementById('currentGymStr');
    const currentGymDef = document.getElementById('currentGymDef');
    const currentGymSpd = document.getElementById('currentGymSpd');
    const currentGymDex = document.getElementById('currentGymDex');
    const currentGymTotal = document.getElementById('currentGymTotal');

    // References for "Gym Gains Tracking" tab
    const startPersonalTrackingBtn = document.getElementById('startPersonalTrackingBtn');
    const stopPersonalTrackingBtn = document.getElementById('stopPersonalTrackingBtn');
    const personalTrackingStatus = document.getElementById('personalTrackingStatus');
    const personalGainsStartedAt = document.getElementById('personalGainsStartedAt');
    const personalGainsOverviewTbody = document.getElementById('personal-gains-overview-tbody');
    const noPersonalGainsData = document.getElementById('noPersonalGainsData');

    // References for "Work Stats" tab
    const workJob = document.getElementById('workJob');
    const workRank = document.getElementById('workRank');
    const workStats = document.getElementById('workStats');

    // References for "Crimes" tab
    const crimesCommitted = document.getElementById('crimesCommitted');
    const nerveGained = document.getElementById('nerveGained');
    const jailTime = document.getElementById('jailTime');

    // --- GAIN TRACKING SPECIFIC GLOBALS ---
    let userApiKey = null;
    let userTornProfileId = null;
    let activePersonalTrackingSessionId = null; // Stores the ID of the currently active session
    let activePersonalTrackingStartedAt = null; // Stores the start timestamp of the active session
    let personalBaselineStatsCache = {}; // Cache for the baseline stats of the active session
    let unsubscribeFromPersonalTrackingStatus = null;
    let unsubscribeFromPersonalGainsData = null;


    // =======================================================
    // 2. OBSOLETE FUNCTIONS (Removed or Commented Out)
    // =======================================================
    // All functions related to the old chart:
    // - statChart (variable)
    // - ctx (variable)
    // - lastLoggedStrength, lastLoggedDefense, etc. (variables for chart gains)
    // - lastLoggedTimestamp (variable for chart gains)
    // - currentStatFilter (variable for chart)
    // - logStatsBtn, logConfirmationModal, closeLogModalBtn, logConfirmationBody (variables)
    // - positionLogDropdown()
    // - showLogDropdown()
    // - hideLogDropdown()
    // - logStats()
    // - fetchStatHistory()
    // - createOrUpdateChart()
    // - Event listeners for .progression-options and .stat-toggle-options

    // The updatePlayerStats function is for a simulated gym mechanic and is not
    // related to fetching or displaying actual Torn stats/gains, so it remains
    // if you intend to use it for a different purpose on the left side.
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
    // 3. CORE FUNCTIONS (Modified for new structure)
    // =======================================================
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
            const docRef = db.collection('userProfiles').doc(userId);
            const docSnap = await docRef.get();
            if (docSnap.exists) {
                const playerData = docSnap.data();
                userTornProfileId = playerData.tornProfileId; // Store globally for other functions
                userApiKey = playerData.tornApiKey; // Store globally for other functions

                if (userApiKey && userTornProfileId) {
                    const apiUrl = `https://api.torn.com/user/${userTornProfileId}?selections=bars,personalstats,gym&key=${userApiKey}`;
                    console.log("Fetching Torn API data from:", apiUrl);
                    const response = await fetch(apiUrl);
                    const data = await response.json();
                    console.log("Torn API Response:", data);
                    if (data.error) {
                        gymError.textContent = `Torn API Error: ${data.error.error.message || data.error.error || 'Unknown error'}. Check your API key and Torn ID in profile.`;
                        console.error("Torn API returned an error:", data.error);
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


    // --- Tab Switching Logic (Adapted from tornpas-big-brother.js) ---
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

        // Add specific data loading calls for each tab when it becomes active
        if (tabId === 'current-gym-stats-tab') {
            // Stats are already fetched on authStateChanged, but can be explicitly refreshed here if needed
            if (currentUser && userApiKey && userTornProfileId) {
                // fetchTornPlayerStats(currentUser.uid); // Uncomment if you want to re-fetch every time this tab is clicked
            }
            // For now, no specific refresh is needed as fetchTornPlayerStats is called on initial load.
        } else if (tabId === 'personal-gym-gains-tab') {
            console.log("Switched to Personal Gym Gains Tracking tab.");
            // Logic for personal gym gains tracking will go here in the next phase
            // For now, just show the message
            if (noPersonalGainsData) {
                noPersonalGainsData.textContent = 'Loading personal gains data...';
                noPersonalGainsData.classList.remove('hidden');
            }
            if (personalGainsOverviewTbody) {
                personalGainsOverviewTbody.innerHTML = ''; // Clear previous content
            }
            // Temporarily hide tracking buttons until full JS for this tab is implemented
            if (startPersonalTrackingBtn) startPersonalTrackingBtn.classList.add('hidden');
            if (stopPersonalTrackingBtn) stopPersonalTrackingBtn.classList.add('hidden');
            if (personalTrackingStatus) personalTrackingStatus.textContent = "Functionality coming soon!";

        } else if (tabId === 'personal-work-stats-tab') {
            console.log("Switched to Work Stats tab.");
            // Logic to populate work stats (e.g., fetch from Torn API, display)
            workJob.textContent = 'Fetching...';
            workRank.textContent = 'Fetching...';
            workStats.textContent = 'Fetching...';
            // Example: You might fetch data here or have a separate function
            setTimeout(() => { // Simulate data loading
                workJob.textContent = 'Your Job Name';
                workRank.textContent = 'Your Rank';
                workStats.textContent = 'Your Working Stats';
            }, 500);
        } else if (tabId === 'personal-crimes-tab') {
            console.log("Switched to Crimes tab.");
            // Logic to populate crime stats
            crimesCommitted.textContent = 'Fetching...';
            nerveGained.textContent = 'Fetching...';
            jailTime.textContent = 'Fetching...';
            // Example:
            setTimeout(() => { // Simulate data loading
                crimesCommitted.textContent = '1,234';
                nerveGained.textContent = '567';
                jailTime.textContent = '0 min';
            }, 500);
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
    showTab('current-gym-stats-tab');


    // Download button for the personal tabs
    if (downloadPersonalTabBtn) {
        downloadPersonalTabBtn.addEventListener('click', () => {
            // This function will need to be implemented in a later phase
            // to dynamically capture the content of the currently active tab.
            alert('Download functionality for personal tabs is coming soon!');
        });
    }


    // --- Authentication and Initial Data Load ---
    firebase.auth().onAuthStateChanged(async (user) => {
        currentUser = user; // Set global currentUser variable
        if (user) {
            console.log("User logged in:", currentUser.uid);
            // Fetch initial Torn stats for both left panel and "Current Gym Stats" tab
            await fetchTornPlayerStats(currentUser.uid);
            
            // Initial call to show the default tab if not already handled
            // showTab('current-gym-stats-tab'); // This is already called above, so it's fine.

        } else {
            console.log("No user logged in. Redirecting to login.");
            // If no user, reset displays and redirect (or show message)
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
            // Optionally redirect
            // window.location.href = 'login.html'; 
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