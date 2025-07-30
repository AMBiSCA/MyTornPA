// =======================================================
// GLOBAL DATA & HELPER FUNCTIONS (DEFINED ONCE AT TOP LEVEL)
// =======================================================

// Data Arrays (Accessible globally)
const Gymlist2 = [{Gym:"Premier Fitness",Energy:5,Str:2,Spe:2,Def:2,Dex:2},{Gym:"Average Joes",Energy:5,Str:2.4,Spe:2.4,Def:2.8,Dex:2.4},{Gym:"Woody's Workout",Energy:5,Str:2.8,Spe:3.2,Def:3,Dex:2.8},{Gym:"Beach Bods",Energy:5,Str:3.2,Spe:3.2,Def:3.2,Dex:"0"},{Gym:"Silver Gym",Energy:5,Str:3.4,Spe:3.6,Def:3.4,Dex:3.2},{Gym:"Pour Femme",Energy:5,Str:3.4,Spe:3.6,Def:3.6,Dex:3.8},{Gym:"Davies Den",Energy:5,Str:3.7,Spe:"0",Def:3.7,Dex:3.7},{Gym:"Global Gym",Energy:5,Str:4,Spe:4,Def:4,Dex:4},{Gym:"Knuckle Heads",Energy:10,Str:4.8,Spe:4.4,Def:4,Dex:4.2},{Gym:"Pioneer Fitness",Energy:10,Str:4.4,Spe:4.6,Def:4.8,Dex:4.4},{Gym:"Anabolic Anomalies",Energy:10,Str:5,Spe:4.6,Def:5.2,Dex:4.6},{Gym:"Core",Energy:10,Str:5,Spe:5.2,Def:5,Dex:5},{Gym:"Racing Fitness",Energy:10,Str:5,Spe:5.4,Def:4.8,Dex:5.2},{Gym:"Complete Cardio",Energy:10,Str:5.5,Spe:5.8,Def:5.5,Dex:5.2},{Gym:"Legs Bums and Tums",Energy:10,Str:"0",Spe:5.6,Def:5.6,Dex:5.8},{Gym:"Deep Burn",Energy:10,Str:6,Spe:6,Def:6,Dex:6},{Gym:"Apollo Gym",Energy:10,Str:6,Spe:6.2,Def:6.4,Dex:6.2},{Gym:"Gun Shop",Energy:10,Str:6.6,Spe:6.4,Def:6.2,Dex:6.2},{Gym:"Force Training",Energy:10,Str:6.4,Spe:6.6,Def:6.4,Dex:6.8},{Gym:"Cha Cha's",Energy:10,Str:6.4,Spe:6.4,Def:6.8,Dex:7},{Gym:"Atlas",Energy:10,Str:7,Spe:6.4,Def:6.4,Dex:6.6},{Gym:"Last Round",Energy:10,Str:6.8,Spe:6.6,Def:7,Dex:6.6},{Gym:"The Edge",Energy:10,Str:6.8,Spe:7,Def:7,Dex:6.8},{Gym:"George's",Energy:10,Str:7.3,Spe:7.3,Def:7.3,Dex:7.3},{Gym:"Balboas Gym",Energy:25,Str:"0",Spe:"0",Def:7.5,Dex:7.5},{Gym:"Frontline Fitness",Energy:25,Str:7.5,Spe:7.5,Def:"0",Dex:"0"},{Gym:"Gym 3000",Energy:50,Str:8,Spe:"0",Def:"0",Dex:"0"},{Gym:"Mr. Isoyamas",Energy:50,Str:"0",Spe:"0",Def:8,Dex:"0"},{Gym:"Total Rebound",Energy:50,Str:"0",Spe:8,Def:"0",Dex:"0"},{Gym:"Elites",Energy:50,Str:"0",Spe:"0",Def:"0",Dex:8},{Gym:"Sports Science Lab",Energy:25,Str:9,Spe:9,Def:9,Dex:9}];
const GYM_STAT_REQUIREMENTS = [{level:1,total_stats:0,gym_name:"Premier Fitness"},{level:2,total_stats:250000,gym_name:"Average Joe's"},{level:3,total_stats:1000000,gym_name:"Woody's Workout"},{level:4,total_stats:5000000,gym_name:"Beach Bods"},{level:5,total_stats:10000000,gym_name:"Silver Gym"},{level:6,total_stats:25000000,gym_name:"Pour Femme"},{level:7,total_stats:50000000,gym_name:"Davies Den"},{level:8,total_stats:75000000,gym_name:"Global Gym"},{level:9,total_stats:100000000,gym_name:"Knuckle Heads"},{level:10,total_stats:150000000,gym_name:"Pioneer Fitness"},{level:11,total_stats:200000000,gym_name:"Anabolic Anomalies"},{level:12,total_stats:250000000,gym_name:"Core"},{level:13,total_stats:300000000,gym_name:"Racing Fitness"},{level:14,total_stats:350000000,gym_name:"Complete Cardio"},{level:15,total_stats:400000000,gym_name:"Legs Bums and Tums"},{level:16,total_stats:450000000,gym_name:"Deep Burn"},{level:17,total_stats:500000000,gym_name:"Apollo Gym"},{level:18,total_stats:550000000,gym_name:"Gun Shop"},{level:19,total_stats:600000000,gym_name:"Force Training"},{level:20,total_stats:650000000,gym_name:"Cha Cha's"},{level:21,total_stats:700000000,gym_name:"Atlas"},{level:22,total_stats:750000000,gym_name:"Last Round"},{level:30,total_stats:1150000000,gym_name:"Elites"},{level:31,total_stats:1200000000,gym_name:"Sports Science Lab"}];

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

// NEW FUNCTION: calculateRelativeTime (added here to be globally accessible)
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
    const strengthStat = document.getElementById('strengthStat');
    const defenseStat = document.getElementById('defenseStat');
    const speedStat = document.getElementById('speedStat');
    const dexterityStat = document.getElementById('dexterityStat');
    const availableEnergy = document.getElementById('availableEnergy');
    const perTrainEnergyValueDisplay = document.getElementById('perTrainEnergyValue'); // Corrected ID
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
    let statChart;
    const ctx = document.getElementById('statChart').getContext('2d');

    // Variables to store the last logged stats for gain calculation
    let lastLoggedStrength = 0,
        lastLoggedDefense = 0,
        lastLoggedSpeed = 0,
        lastLoggedDexterity = 0;
    // NEW: Variable to store the timestamp of the last logged stat
    let lastLoggedTimestamp = null;
    // NEW: Variable to store the currently selected stat filter for the chart
    let currentStatFilter = 'all'; // Default to 'all'

    // Get references to the log dropdown elements
    const logStatsBtn = document.getElementById('logStatsBtn');
    const logConfirmationModal = document.getElementById('logConfirmationModal');
    const closeLogModalBtn = document.getElementById('closeLogModalBtn');
    const logConfirmationBody = document.getElementById('logConfirmationBody');


    // =======================================================
    // 2. DROPDOWN CONTROL FUNCTIONS (defined once)
    // =======================================================

    /**
     * Positions the log confirmation dropdown such that its right edge aligns
     * with the right edge of the "Log Stats" button, making it open to the left.
     */
    function positionLogDropdown() {
        if (!logStatsBtn || !logConfirmationModal) {
            console.warn("positionLogDropdown: Button or modal not found.");
            return;
        }

        const buttonRect = logStatsBtn.getBoundingClientRect();
        // The modal's positioned parent is '.progression-options'
        const parentContainer = document.querySelector('.progression-options');
        const parentRect = parentContainer ? parentContainer.getBoundingClientRect() : { left: 0, top: 0 };

        // Calculate 'left' position: Align the dropdown's RIGHT edge with the button's RIGHT edge.
        // This means (button's right - parent's left) - the dropdown's own width.
        // Add a small margin to pull it slightly to the left if desired, or set to 0 for exact flush.
        // Subtract 5px to give it a slight margin from the button's right edge, making it move left more.
       const leftPosition = (buttonRect.right - parentRect.left) - logConfirmationModal.offsetWidth + 12; // Changes from -5 to +5 to move it right

        // Calculate 'top' position: Align the dropdown's top edge with the button's top edge.
      const topPosition = (buttonRect.top - parentRect.top) + 35; // Adds 5 pixels down

        logConfirmationModal.style.position = 'absolute';
        logConfirmationModal.style.left = `${leftPosition}px`;
        logConfirmationModal.style.top = `${topPosition}px`;
        logConfirmationModal.style.transform = 'none'; // Remove any previous transforms
        logConfirmationModal.style.zIndex = '1001'; // Ensure it's on top of other content
    }

    /**
     * Shows the log confirmation dropdown with a fade-in effect.
     * Calls positionLogDropdown to ensure correct placement before showing.
     */
    function showLogDropdown() {
        if (!logConfirmationModal) return;

        // Temporarily make it visible to get its width (offsetWidth) for positioning
        // without affecting its opacity or visibility state
        logConfirmationModal.style.display = 'block';
        logConfirmationModal.style.visibility = 'hidden'; // Keep hidden for a moment to calculate width
        logConfirmationModal.style.opacity = '0'; // Ensure it starts invisible for the fade-in

        positionLogDropdown(); // Position it now that its width can be read

        // Apply specific dropdown styling classes
        logConfirmationModal.classList.add('log-popup-dropdown');
        logConfirmationModal.classList.remove('modal-overlay'); // Remove global overlay styling if present


        // Trigger fade-in after a tiny delay to ensure 'display: block' and position apply
        setTimeout(() => {
            logConfirmationModal.style.visibility = 'visible'; // Make visible after positioning
            logConfirmationModal.style.opacity = '1'; // Start fade-in
        }, 10);
    }

    /**
     * Hides the log confirmation dropdown with a fade-out effect.
     */
    function hideLogDropdown() {
        if (!logConfirmationModal) return;

        logConfirmationModal.style.opacity = '0'; // Start fade-out
        // Wait for the CSS transition to complete before setting display to 'none'
        setTimeout(() => {
            logConfirmationModal.style.display = 'none';
            logConfirmationModal.style.visibility = 'hidden';
            logConfirmationModal.classList.remove('log-popup-dropdown'); // Clean up class
            // Do NOT re-add 'modal-overlay' if this element is specifically for a dropdown.
            // If it's a multi-purpose modal, you might conditionally re-add it.
        }, 300); // Matches the transition duration in gymgain.css for .log-popup-dropdown
    }


    // =======================================================
    // 3. CORE FUNCTIONS
    // =======================================================
    async function fetchTornPlayerStats(userId) {
        if (!userId) { console.warn("No user ID available to fetch Torn stats."); return; }
        // Reset displays to indicate loading
        strengthStat.textContent = '--'; defenseStat.textContent = '--'; speedStat.textContent = '--'; dexterityStat.textContent = '--';
        availableEnergy.textContent = '--/--'; perTrainGainStr.textContent = 'Calculating...'; perTrainGainDef.textContent = 'Calculating...';
        perTrainGainSpe.textContent = 'Calculating...'; perTrainGainDex.textContent = 'Calculating...'; perTrainEnergyValueDisplay.textContent = '--';
        xanaxGainStr.textContent = 'Calculating...'; xanaxGainDef.textContent = 'Calculating...'; xanaxGainSpe.textContent = 'Calculating...';
        xanaxGainDex.textContent = 'Calculating...'; maxEnergyGainStr.textContent = 'Calculating...'; maxEnergyGainDef.textContent = 'Calculating...';
        maxEnergyGainSpe.textContent = 'Calculating...'; maxEnergyGainDex.textContent = 'Calculating...'; maxEnergyValueDisplay.textContent = '--';
        happyJumpGainStr.textContent = 'Calculating...'; happyJumpGainDef.textContent = 'Calculating...';
        happyJumpGainSpe.textContent = 'Calculating...'; happyJumpGainDex.textContent = 'Calculating...';
        gymError.textContent = ''; // Clear previous errors

        try {
            const docRef = db.collection('userProfiles').doc(userId);
            const docSnap = await docRef.get();
            if (docSnap.exists) {
                const playerData = docSnap.data();
                const tornProfileId = playerData.tornProfileId;
                const tornApiKey = playerData.tornApiKey;
                if (tornApiKey && tornProfileId) {
                    const apiUrl = `https://api.torn.com/user/${tornProfileId}?selections=bars,personalstats,gym&key=${tornApiKey}`;
                    console.log("Fetching Torn API data from:", apiUrl); // Debug: Log API URL
                    const response = await fetch(apiUrl);
                    const data = await response.json();
                    console.log("Torn API Response:", data); // Debug: Log API response
                    if (data.error) {
                        gymError.textContent = `Torn API Error: ${data.error.error.message || data.error.error || 'Unknown error'}. Check your API key and Torn ID in profile.`;
                        console.error("Torn API returned an error:", data.error);
                    } else {
                        const currentStrength = data.personalstats?.strength || 0;
                        const currentDefense = data.personalstats?.defense || 0;
                        const currentSpeed = data.personalstats?.speed || 0;
                        const currentDexterity = data.personalstats?.dexterity || 0;
                        const currentHappy = data.happy?.current || 0;
                        const currentEnergy = data.energy?.current || 0;
                        const maxEnergy = data.energy?.maximum || 0;

                        // Update the DOM elements with fetched data
                        strengthStat.textContent = currentStrength.toLocaleString();
                        defenseStat.textContent = currentDefense.toLocaleString();
                        speedStat.textContent = currentSpeed.toLocaleString();
                        dexterityStat.textContent = currentDexterity.toLocaleString();
                        availableEnergy.textContent = `${currentEnergy}/${maxEnergy}`;
                        maxEnergyValueDisplay.textContent = maxEnergy;

                        // Debug: Log the values placed into the DOM elements
                        console.log(`DOM Strength after update: ${strengthStat.textContent}`);
                        console.log(`DOM Defense after update: ${defenseStat.textContent}`);
                        console.log(`DOM Speed after update: ${speedStat.textContent}`);
                        console.log(`DOM Dexterity after update: ${dexterityStat.textContent}`);


                        const gymNumber = (data.active_gym !== undefined && data.active_gym !== null) ? data.active_gym - 1 : -1;
                        if (gymNumber >= 0 && gymNumber < Gymlist2.length) { // Gymlist2 is now globally accessible
                            const currentGym = Gymlist2[gymNumber];
                            const energyPerTrain = currentGym.Energy;
                            let modifierStr = 1, modifierSpe = 1, modifierDef = 1, modifierDex = 1;
                            // calculateTotal is now globally accessible
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
                            const currentTotalStats = currentStrength + currentDefense + currentSpeed + currentDexterity;
                            // calculateETillNextGym is now globally accessible
                            const nextGymEnergyNeeded = calculateETillNextGym(currentStrength, currentDefense, currentSpeed, currentDexterity, currentHappy, currentGym, gymNumber);
                            if (typeof nextGymEnergyNeeded === 'string') {
                                eToNextGymDetailedDisplay.textContent = nextGymEnergyNeeded;
                                nextGymNameDisplay.textContent = '--';
                                nextGymReqStatsDisplay.textContent = '--';
                                statsRemainingDisplay.textContent = '--';
                            } else {
                                eToNextGymDetailedDisplay.textContent = nextGymEnergyNeeded.toLocaleString();
                                let nextGymReq = null;
                                for (let i = gymNumber + 1; i < GYM_STAT_REQUIREMENTS.length; i++) { // GYM_STAT_REQUIREMENTS is now globally accessible
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

    // This function was part of a separate feature and is not used by logStats.
    // It is included here as it was in the original file provided.
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

    // THIS IS THE FULLY REVISED AND CORRECTED logStats FUNCTION
    async function logStats() {
        console.log("logStats function started."); // Debug: Entry point
        if (!currentUser) {
            alert("You must be logged in to log your stats.");
            console.warn("logStats: No current user.");
            return;
        }
        const logButton = document.getElementById('logStatsBtn');
        logButton.textContent = 'Logging...';
        logButton.disabled = true;

        try {
            // Debug: Log the text content before parsing
            console.log(`Raw Strength Text: '${strengthStat.textContent}'`);
            console.log(`Raw Defense Text: '${defenseStat.textContent}'`);
            console.log(`Raw Speed Text: '${speedStat.textContent}'`);
            console.log(`Raw Dexterity Text: '${dexterityStat.textContent}'`);

            const strength = parseInt(strengthStat.textContent.replace(/,/g, ''), 10);
            const defense = parseInt(defenseStat.textContent.replace(/,/g, ''), 10);
            const speed = parseInt(speedStat.textContent.replace(/,/g, ''), 10);
            const dexterity = parseInt(dexterityStat.textContent.replace(/,/g, ''), 10);

            // Debug: Log the parsed values
            console.log("Parsed Strength:", strength);
            console.log("Parsed Defense:", defense);
            console.log("Parsed Speed:", speed);
            console.log("Parsed Dexterity:", dexterity);

            // Using Number.isFinite for a more robust check that handles NaN, Infinity, and -Infinity
            if (!Number.isFinite(strength) || !Number.isFinite(defense) || !Number.isFinite(speed) || !Number.isFinite(dexterity)) {
                console.error("Parsed stats are not finite numbers:", {strength, defense, speed, dexterity}); // More detailed error log
                throw new Error("Could not read current stats from the page. Cannot save. Ensure Torn stats are loaded and are valid numbers.");
            }

            const newLog = {
                userId: currentUser.uid,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                strength: strength,
                defense: defense,
                speed: speed,
                dexterity: dexterity
            };
            console.log("New log data prepared:", newLog); // Debug: Log the data to be saved

            // Save the new log to the database first
            await db.collection('stat_history').add(newLog);
            console.log("New log saved to Firestore."); // Debug: Confirmation of save

            // Now that the new log is saved, fetch all history again.
            // This will update the chart AND our "lastLogged" variables for the next click.
            await fetchStatHistory('all'); // Call with 'all' to ensure lastLoggedTimestamp is correctly updated
            console.log("fetchStatHistory('all') completed."); // Debug: Confirmation of history refresh

            // Prepare content for the confirmation modal
            const strengthGain = strength - lastLoggedStrength;
            const defenseGain = defense - lastLoggedDefense;
            const speedGain = speed - lastLoggedSpeed;
            const dexterityGain = dexterity - lastLoggedDexterity;

            console.log("Calculated Gains - Str:", strengthGain, "Def:", defenseGain, "Spe:", speedGain, "Dex:", dexterityGain);

            const timeAgoText = lastLoggedTimestamp ? calculateRelativeTime(lastLoggedTimestamp) : 'Never';
            console.log("Time ago text for modal:", timeAgoText);

            if (logConfirmationBody) {
                logConfirmationBody.innerHTML = `
                    <h3 style="text-align: center; margin-top: 0;">Stats Logged!</h3>
                    <p>You have made the following gains since your last manual update <span style="font-weight: bold;">(${timeAgoText})</span>:</p>
                    <div class="gain-details-list">
                        <p><strong>Strength:</strong> <span>+${strengthGain.toLocaleString()}</span></p>
                        <p><strong>Defense:</strong> <span>+${defenseGain.toLocaleString()}</span></p>
                        <p><strong>Speed:</strong> <span>+${speedGain.toLocaleString()}</span></p>
                        <p><strong>Dexterity:</strong> <span>+${dexterityGain.toLocaleString()}</span></p>
                    </div>
                `;
                console.log("Modal body content updated."); // Debug: Confirmation of modal content
            } else {
                 console.error("logConfirmationBody element not found. Cannot display confirmation details.");
            }

            // *** CALL THE NEW DROPDOWN SHOW FUNCTION HERE ***
            showLogDropdown();

        } catch (error) {
            console.error("Error logging stats: ", error);
            alert(`Failed to log stats. ${error.message}`);
        } finally {
            logButton.textContent = 'Log Stats';
            logButton.disabled = false;
            console.log("logStats function finished, button re-enabled."); // Debug: Exit point
        }
    }

    // THIS FUNCTION IS MODIFIED TO STORE THE LAST STATS AND TIMESTAMP
    // AND NOW ACCEPTS A STAT FILTER PARAMETER
    async function fetchStatHistory(timeFilter = '7') {
        if (!currentUser) { console.warn("fetchStatHistory: No current user."); return; }
        console.log(`Fetching stat history for filter: ${timeFilter} and current stat filter: ${currentStatFilter}`); // Debug: fetch history start
        try {
            let statQuery = db.collection('stat_history').where('userId', '==', currentUser.uid).orderBy('timestamp', 'asc');
            if (timeFilter !== 'all' && (timeFilter === '7' || timeFilter === '30')) {
                const daysToSubtract = parseInt(timeFilter);
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - daysToSubtract);
                statQuery = statQuery.where('timestamp', '>=', startDate);
            }
            const querySnapshot = await statQuery.get();
            console.log(`Found ${querySnapshot.size} stat history documents.`); // Debug: number of documents

            // Capture the latest stats and timestamp from the history for gain calculation
            if (!querySnapshot.empty) {
                const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
                const lastData = lastDoc.data();
                lastLoggedStrength = lastData.strength || 0;
                lastLoggedDefense = lastData.defense || 0;
                lastLoggedSpeed = lastData.speed || 0;
                lastLoggedDexterity = lastData.dexterity || 0;
                lastLoggedTimestamp = lastData.timestamp; // Store the Firestore Timestamp object
                console.log("lastLogged stats and timestamp updated:", { lastLoggedStrength, lastLoggedDefense, lastLoggedSpeed, lastLoggedDexterity, lastLoggedTimestamp }); // Debug: Last logged stats
            } else {
                console.log("No stat history found, lastLogged stats and timestamp remain initial values.");
                lastLoggedStrength = 0;
                lastLoggedDefense = 0;
                lastLoggedSpeed = 0;
                lastLoggedDexterity = 0;
                lastLoggedTimestamp = null; // Reset if no history
            }

            const formattedData = { labels: [], strength: [], defense: [], speed: [], dexterity: [] };
            querySnapshot.forEach(doc => {
                const data = doc.data();
                // Ensure timestamp is valid before converting
                const dateLabel = data.timestamp && data.timestamp.seconds ? new Date(data.timestamp.seconds * 1000).toLocaleDateString() : 'N/A';
                formattedData.labels.push(dateLabel);
                formattedData.strength.push(data.strength);
                formattedData.defense.push(data.defense);
                formattedData.speed.push(data.speed);
                formattedData.dexterity.push(data.dexterity);
            });
            // Pass the currentStatFilter to createOrUpdateChart
            createOrUpdateChart(formattedData, currentStatFilter);
            console.log("Chart updated with new history data."); // Debug: Chart update confirmation
        } catch (error) {
            console.error("Error fetching stat history:", error);
        }
    }

    // Modified createOrUpdateChart to accept an activeStatFilter
    function createOrUpdateChart(chartData, activeStatFilter = 'all') {
        if (statChart) { statChart.destroy(); }

        const datasets = [];
        // Define all datasets with their corresponding colors and labels
        const allDatasets = [
            { label: 'Strength', data: chartData.strength, borderColor: 'rgba(255, 99, 132, 1)', fill: false, tension: 0.1, id: '0' },
            { label: 'Defense', data: chartData.defense, borderColor: 'rgba(54, 162, 235, 1)', fill: false, tension: 0.1, id: '1' },
            { label: 'Speed', data: chartData.speed, borderColor: 'rgba(255, 206, 86, 1)', fill: false, tension: 0.1, id: '2' },
            { label: 'Dexterity', data: chartData.dexterity, borderColor: 'rgba(75, 192, 192, 1)', fill: false, tension: 0.1, id: '3' }
        ];

        if (activeStatFilter === 'all') {
            datasets.push(...allDatasets); // Add all datasets if 'all' is selected
        } else {
            // Find the specific dataset by its 'id' (which matches data-stat-toggle values)
            const filteredDataset = allDatasets.find(ds => ds.id === activeStatFilter);
            if (filteredDataset) {
                datasets.push(filteredDataset); // Add only the selected dataset
            }
        }

        statChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData.labels,
                datasets: datasets // Use the filtered or all datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#ccc' } } },
                scales: {
                    y: { beginAtZero: false, ticks: { color: '#ccc', callback: (value) => (value >= 1e6) ? `${(value/1e6).toFixed(1)}m` : (value >= 1e3) ? `${(value/1e3).toFixed(1)}k` : value }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
                    x: { ticks: { color: '#ccc' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
                }
            }
        });
    }

    // =======================================================
    // 4. EVENT LISTENERS & INITIALIZATION
    // =======================================================

    document.querySelector('.progression-options').addEventListener('click', (e) => {
        e.preventDefault();
        const filter = e.target.closest('[data-time-filter]');
        if (filter) {
            // Re-fetch data and re-create chart with the LATEST activeStatFilter
            fetchStatHistory(filter.dataset.timeFilter);
        }
    });
    
    // Primary click handler for the Log Stats button
    // This will trigger the logStats function, which then calls showLogDropdown after saving.
    if (logStatsBtn) {
        logStatsBtn.addEventListener('click', logStats);
    } else {
        console.error("FAILURE: Could not find the element with ID 'logStatsBtn'. The button does not exist when the script runs.");
    }
    
    // Global listeners for dropdown behavior (these handle closing)
    if (logStatsBtn && logConfirmationModal && closeLogModalBtn) {
        // Listener for the close button inside the modal
        closeLogModalBtn.addEventListener('click', hideLogDropdown);

        // Listener for clicks anywhere on the document to close the dropdown
        document.addEventListener('click', (event) => {
            // If the click was not inside the modal AND not on the button that opened it
            if (!logConfirmationModal.contains(event.target) && !logStatsBtn.contains(event.target)) {
                hideLogDropdown();
            }
        });

        // Prevent clicks INSIDE the modal from bubbling up and closing it
        logConfirmationModal.addEventListener('click', (event) => {
            event.stopPropagation();
        });

        // Re-position on window resize if the dropdown is currently visible
        window.addEventListener('resize', () => {
            if (logConfirmationModal.style.display === 'block' && logConfirmationModal.classList.contains('visible')) {
                positionLogDropdown();
            }
        });
    }

    document.querySelector('.stat-toggle-options').addEventListener('click', (e) => {
        const button = e.target.closest('[data-stat-toggle]');
        if (!button || !statChart) return;

        currentStatFilter = button.dataset.statToggle; // Update the global filter variable
        console.log("Stat filter updated to:", currentStatFilter);

        // Now, update the chart visibility based on the new filter
        if (currentStatFilter === 'all') {
            statChart.data.datasets.forEach((_, index) => {
                statChart.setDatasetVisibility(index, true);
            });
        } else {
            const indexToShow = parseInt(currentStatFilter, 10);
            statChart.data.datasets.forEach((_, index) => {
                // Set visibility for all datasets based on the filter
                statChart.setDatasetVisibility(index, index === indexToShow);
            });
        }
        statChart.update();
    });

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

    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            console.log("User logged in:", currentUser.uid);
            fetchTornPlayerStats(currentUser.uid);
            // On initial load, fetch history and apply the default 'all' filter
            fetchStatHistory('7'); // Initial fetch for the chart and last logged stats (default 7 days)
        } else {
            currentUser = null;
            console.log("No user logged in. Redirecting to login.");
            window.location.href = 'login.html';
        }
    });

});