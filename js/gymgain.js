// =======================================================
// GLOBAL DATA & HELPER FUNCTIONS
// =======================================================

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
    // 1. ELEMENT REFERENCES & GLOBAL STATE
    // =======================================================
    const auth = firebase.auth();
    const db = firebase.firestore();

    // --- Left Panel Elements ---
    const strengthStat = document.getElementById('strengthStat');
    const defenseStat = document.getElementById('defenseStat');
    const speedStat = document.getElementById('speedStat');
    const dexterityStat = document.getElementById('dexterityStat');
    const availableEnergy = document.getElementById('availableEnergy');
    const gymError = document.getElementById('gymError');
    
    // --- Right Panel Tab System ---
    const tabButtons = document.querySelectorAll('#statProgressionContainer .tab-button-bb');
    const tabPanes = document.querySelectorAll('#personalTabContentContainer .tab-pane-bb');

    // --- Permanent Energy Tracker (Left Panel) ---
    const startPersonalEnergyBtn = document.getElementById('startPersonalEnergyBtn');
    const stopPersonalEnergyBtn = document.getElementById('stopPersonalEnergyBtn');
    const personalEnergyStatus = document.getElementById('personalEnergyStatus');
    const personalEnergyStartedAt = document.getElementById('personalEnergyStartedAt');
    const noPersonalEnergyData = document.getElementById('noPersonalEnergyData');
    const personalGainTrainsItem = document.getElementById('personalGainTrainsItem');
    const personalGainEnergyItem = document.getElementById('personalGainEnergyItem');
    const personalGainTrainsSpan = document.getElementById('personalGainTrains');
    const personalGainEnergySpan = document.getElementById('personalGainEnergy');

    // --- Battle Stat Gains Tracker (Right Panel Tab) ---
    const startPersonalStatsBtn = document.getElementById('startPersonalStatsBtn');
    const stopPersonalStatsBtn = document.getElementById('stopPersonalStatsBtn');
    const personalStatsStatus = document.getElementById('personalStatsStatus');
    const personalStatsStartedAt = document.getElementById('personalStatsStartedAt');
    const noPersonalStatsData = document.getElementById('noPersonalStatsData');
    const personalGainStrItem = document.getElementById('personalGainStrItem');
    const personalGainDefItem = document.getElementById('personalGainDefItem');
    const personalGainSpdItem = document.getElementById('personalGainSpdItem');
    const personalGainDexItem = document.getElementById('personalGainDexItem');
    const personalGainTotalItem = document.getElementById('personalGainTotalItem');
    const personalGainStrSpan = document.getElementById('personalGainStr');
    const personalGainDefSpan = document.getElementById('personalGainDef');
    const personalGainSpdSpan = document.getElementById('personalGainSpd');
    const personalGainDexSpan = document.getElementById('personalGainDex');
    const personalGainTotalSpan = document.getElementById('personalGainTotal');

    // --- Global State Variables ---
    let currentUser = null;
    let userApiKey = null;
    let userTornProfileId = null;

    // Firestore Collection Names
    const STAT_GAINS_SESSIONS_COLLECTION = 'personalStatGainSessions';
    const ENERGY_SESSIONS_COLLECTION = 'personalEnergySessions';

    // State for Stat Gains Tracker
    let activeStatSessionId = null;
    let activeStatSessionStartedAt = null;
    let statBaselineCache = null;
    let unsubscribeFromStatGains = null;
    
    // State for Energy Tracker
    let activeEnergySessionId = null;
    let activeEnergySessionStartedAt = null;
    let energyBaselineCache = null;
    let unsubscribeFromEnergy = null;

    // =======================================================
    // 2. CORE LOGIC
    // =======================================================

    // --- Permanent Energy Tracker Functions (Left Panel) ---

    function updatePersonalEnergyUI() {
        const allItems = [personalGainTrainsItem, personalGainEnergyItem];
        if (activeEnergySessionId) {
            startPersonalEnergyBtn.classList.add('hidden');
            stopPersonalEnergyBtn.classList.remove('hidden');
            personalEnergyStatus.textContent = 'Tracking energy usage...';
            personalEnergyStartedAt.textContent = activeEnergySessionStartedAt ? `Started: ${activeEnergySessionStartedAt.toDate().toLocaleString()}` : '';
            noPersonalEnergyData.classList.add('hidden');
            allItems.forEach(item => item.classList.remove('hidden'));
        } else {
            startPersonalEnergyBtn.classList.remove('hidden');
            stopPersonalEnergyBtn.classList.add('hidden');
            personalEnergyStatus.textContent = 'Not currently tracking.';
            personalEnergyStartedAt.textContent = '';
            noPersonalEnergyData.classList.remove('hidden');
            noPersonalEnergyData.textContent = 'Click "Start" to begin.';
            allItems.forEach(item => item.classList.add('hidden'));
        }
    }

    async function startPersonalEnergyTracking() {
        if (!currentUser || !userApiKey || !userTornProfileId) {
            alert("Please log in and ensure your API key is set.");
            return;
        }
        startPersonalEnergyBtn.disabled = true;
        startPersonalEnergyBtn.textContent = 'Starting...';

        try {
            const apiUrl = `https://api.torn.com/user/${userTornProfileId}?selections=personalstats&key=${userApiKey}&comment=MyTornPA_EnergyStart`;
            const response = await fetch(apiUrl);
            const data = await response.json();
            if (data.error) throw new Error(data.error.error);

            const baseline = { gymtrains: data.personalstats.gymtrains || 0 };
            
            const sessionDocRef = db.collection(ENERGY_SESSIONS_COLLECTION).doc(currentUser.uid);
            await sessionDocRef.set({
                isActive: true,
                startedAt: firebase.firestore.FieldValue.serverTimestamp(),
                baseline: baseline
            });
            alert("Energy tracking started!");
        } catch (error) {
            alert(`Failed to start energy tracking: ${error.message}`);
        } finally {
            startPersonalEnergyBtn.disabled = false;
            startPersonalEnergyBtn.textContent = 'Start Energy Tracking';
        }
    }

    async function stopPersonalEnergyTracking() {
        if (!currentUser) return;
        stopPersonalEnergyBtn.disabled = true;
        stopPersonalEnergyBtn.textContent = 'Stopping...';

        try {
            const sessionDocRef = db.collection(ENERGY_SESSIONS_COLLECTION).doc(currentUser.uid);
            await sessionDocRef.update({
                isActive: false,
                stoppedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert("Energy tracking stopped!");
        } catch (error) {
            alert(`Failed to stop energy tracking: ${error.message}`);
        } finally {
            stopPersonalEnergyBtn.disabled = false;
            stopPersonalEnergyBtn.textContent = 'Stop Energy Tracking';
        }
    }

    function setupPersonalEnergyListener() {
        if (!currentUser) return;
        if (unsubscribeFromEnergy) unsubscribeFromEnergy();

        const sessionDocRef = db.collection(ENERGY_SESSIONS_COLLECTION).doc(currentUser.uid);
        unsubscribeFromEnergy = sessionDocRef.onSnapshot(doc => {
            if (doc.exists && doc.data().isActive) {
                activeEnergySessionId = doc.id; // Technically the UID, but marks it as active
                activeEnergySessionStartedAt = doc.data().startedAt;
                energyBaselineCache = doc.data().baseline;
                displayPersonalEnergyGains();
            } else {
                activeEnergySessionId = null;
                activeEnergySessionStartedAt = null;
                energyBaselineCache = null;
            }
            updatePersonalEnergyUI();
        });
    }

    async function displayPersonalEnergyGains() {
        if (!activeEnergySessionId || !energyBaselineCache) {
            updatePersonalEnergyUI();
            return;
        }

        try {
            const apiUrl = `https://api.torn.com/user/${userTornProfileId}?selections=personalstats&key=${userApiKey}&comment=MyTornPA_EnergyUpdate`;
            const response = await fetch(apiUrl);
            const data = await response.json();
            if (data.error) throw new Error(data.error.error);
            
            const currentTrains = data.personalstats.gymtrains || 0;
            const baselineTrains = energyBaselineCache.gymtrains || 0;

            const trainsGain = currentTrains - baselineTrains;
            const energySpent = trainsGain * 5;

            personalGainTrainsSpan.innerHTML = formatGainValue(trainsGain);
            personalGainEnergySpan.innerHTML = formatGainValue(energySpent);
            
        } catch (error) {
            console.error("Error displaying energy gains:", error);
            noPersonalEnergyData.textContent = `Error: ${error.message}`;
            noPersonalEnergyData.classList.remove('hidden');
        }
    }

    // --- Battle Stat Gains Tracker Functions (Right Panel Tab) ---

    function updatePersonalStatsUI() {
        if (!startPersonalStatsBtn) return;
        const allItems = [personalGainStrItem, personalGainDefItem, personalGainSpdItem, personalGainDexItem, personalGainTotalItem];
        if (activeStatSessionId) {
            startPersonalStatsBtn.classList.add('hidden');
            stopPersonalStatsBtn.classList.remove('hidden');
            personalStatsStatus.textContent = 'Tracking stat gains...';
            personalStatsStartedAt.textContent = activeStatSessionStartedAt ? `Started: ${activeStatSessionStartedAt.toDate().toLocaleString()}` : '';
            noPersonalStatsData.classList.add('hidden');
            allItems.forEach(item => item.classList.remove('hidden'));
        } else {
            startPersonalStatsBtn.classList.remove('hidden');
            stopPersonalStatsBtn.classList.add('hidden');
            personalStatsStatus.textContent = 'Not currently tracking.';
            personalStatsStartedAt.textContent = '';
            noPersonalStatsData.classList.remove('hidden');
            noPersonalStatsData.textContent = 'Click "Start" to begin.';
            allItems.forEach(item => item.classList.add('hidden'));
        }
    }
    
    async function startPersonalStatTracking() {
        if (!currentUser || !userApiKey || !userTornProfileId) {
            alert("Please log in and ensure your API key is set.");
            return;
        }
        startPersonalStatsBtn.disabled = true;
        startPersonalStatsBtn.textContent = 'Starting...';

        try {
            const apiUrl = `https://api.torn.com/user/${userTornProfileId}?selections=personalstats&key=${userApiKey}&comment=MyTornPA_StatGainStart`;
            const response = await fetch(apiUrl);
            const data = await response.json();
            if (data.error) throw new Error(data.error.error);

            const pstats = data.personalstats;
            const baseline = {
                strength: pstats.strength || 0,
                defense: pstats.defense || 0,
                speed: pstats.speed || 0,
                dexterity: pstats.dexterity || 0,
                total: (pstats.strength || 0) + (pstats.defense || 0) + (pstats.speed || 0) + (pstats.dexterity || 0)
            };
            
            const sessionDocRef = db.collection(STAT_GAINS_SESSIONS_COLLECTION).doc(currentUser.uid);
            await sessionDocRef.set({
                isActive: true,
                startedAt: firebase.firestore.FieldValue.serverTimestamp(),
                baseline: baseline
            });
            alert("Stat gain tracking started!");
        } catch (error) {
            alert(`Failed to start stat tracking: ${error.message}`);
        } finally {
            startPersonalStatsBtn.disabled = false;
            startPersonalStatsBtn.textContent = 'Start Stat Tracking';
        }
    }

    async function stopPersonalStatTracking() {
        if (!currentUser) return;
        stopPersonalStatsBtn.disabled = true;
        stopPersonalStatsBtn.textContent = 'Stopping...';

        try {
            const sessionDocRef = db.collection(STAT_GAINS_SESSIONS_COLLECTION).doc(currentUser.uid);
            await sessionDocRef.update({
                isActive: false,
                stoppedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert("Stat gain tracking stopped!");
        } catch (error) {
            alert(`Failed to stop stat tracking: ${error.message}`);
        } finally {
            stopPersonalStatsBtn.disabled = false;
            stopPersonalStatsBtn.textContent = 'Stop Stat Tracking';
        }
    }
    
    function setupPersonalStatListener() {
        if (!currentUser) return;
        if (unsubscribeFromStatGains) unsubscribeFromStatGains();

        const sessionDocRef = db.collection(STAT_GAINS_SESSIONS_COLLECTION).doc(currentUser.uid);
        unsubscribeFromStatGains = sessionDocRef.onSnapshot(doc => {
            if (doc.exists && doc.data().isActive) {
                activeStatSessionId = doc.id;
                activeStatSessionStartedAt = doc.data().startedAt;
                statBaselineCache = doc.data().baseline;
                displayPersonalStatGains();
            } else {
                activeStatSessionId = null;
                activeStatSessionStartedAt = null;
                statBaselineCache = null;
            }
            updatePersonalStatsUI();
        });
    }

    async function displayPersonalStatGains() {
        if (!activeStatSessionId || !statBaselineCache) {
            updatePersonalStatsUI();
            return;
        }

        try {
            const apiUrl = `https://api.torn.com/user/${userTornProfileId}?selections=personalstats&key=${userApiKey}&comment=MyTornPA_StatGainUpdate`;
            const response = await fetch(apiUrl);
            const data = await response.json();
            if (data.error) throw new Error(data.error.error);
            
            const pstats = data.personalstats;
            const currentStats = {
                strength: pstats.strength || 0,
                defense: pstats.defense || 0,
                speed: pstats.speed || 0,
                dexterity: pstats.dexterity || 0,
                total: (pstats.strength || 0) + (pstats.defense || 0) + (pstats.speed || 0) + (pstats.dexterity || 0)
            };

            const baselineStats = statBaselineCache;
            personalGainStrSpan.innerHTML = formatGainValue(currentStats.strength - baselineStats.strength);
            personalGainDefSpan.innerHTML = formatGainValue(currentStats.defense - baselineStats.defense);
            personalGainSpdSpan.innerHTML = formatGainValue(currentStats.speed - baselineStats.speed);
            personalGainDexSpan.innerHTML = formatGainValue(currentStats.dexterity - baselineStats.dexterity);
            personalGainTotalSpan.innerHTML = formatGainValue(currentStats.total - baselineStats.total);
            
        } catch (error) {
            console.error("Error displaying stat gains:", error);
            noPersonalStatsData.textContent = `Error: ${error.message}`;
            noPersonalStatsData.classList.remove('hidden');
        }
    }


    // --- General Page and Tab Logic ---

    async function fetchInitialPageData(userId) {
        // This function populates the static parts of the page that don't need constant updates
        const userProfileDoc = await db.collection('userProfiles').doc(userId).get();
        if (!userProfileDoc.exists) {
            gymError.textContent = "Your user profile could not be found.";
            return;
        }
        const userData = userProfileDoc.data();
        userApiKey = userData.tornApiKey;
        userTornProfileId = userData.tornProfileId;

        if (!userApiKey || !userTornProfileId) {
            gymError.textContent = "Please set your API key and Torn ID in your profile.";
            return;
        }

        const apiUrl = `https://api.torn.com/user/${userTornProfileId}?selections=bars,personalstats,profile&key=${userApiKey}&comment=MyTornPA_GymGain_Initial`;
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.error) {
            gymError.textContent = `API Error: ${data.error.error}`;
            return;
        }
        
        // Populate left panel "Current Stats"
        strengthStat.textContent = (data.personalstats.strength || 0).toLocaleString();
        defenseStat.textContent = (data.personalstats.defense || 0).toLocaleString();
        speedStat.textContent = (data.personalstats.speed || 0).toLocaleString();
        dexterityStat.textContent = (data.personalstats.dexterity || 0).toLocaleString();
        availableEnergy.textContent = `${data.energy.current}/${data.energy.maximum}`;
        
        // Populate right panel "Current Gym Stats" tab
        const currentTotal = data.personalstats.strength + data.personalstats.defense + data.personalstats.speed + data.personalstats.dexterity;
        document.getElementById('currentGymStr').textContent = (data.personalstats.strength || 0).toLocaleString();
        document.getElementById('currentGymDef').textContent = (data.personalstats.defense || 0).toLocaleString();
        document.getElementById('currentGymSpd').textContent = (data.personalstats.speed || 0).toLocaleString();
        document.getElementById('currentGymDex').textContent = (data.personalstats.dexterity || 0).toLocaleString();
        document.getElementById('currentGymTotal').textContent = currentTotal.toLocaleString();
    }

    function showTab(tabId) {
        tabPanes.forEach(pane => pane.classList.toggle('active', pane.id === tabId));
        tabButtons.forEach(button => button.classList.toggle('active', button.dataset.tab + '-tab' === tabId));
        
        // Only set up the listener for the stat gains tab when it's clicked
        if (tabId === 'personal-gym-gains-tab') {
            setupPersonalStatListener();
        } else {
            if (unsubscribeFromStatGains) unsubscribeFromStatGains();
        }
    }

    // =======================================================
    // 3. EVENT LISTENERS & INITIALIZATION
    // =======================================================

    // Tab button listeners
    tabButtons.forEach(button => {
        button.addEventListener('click', () => showTab(button.dataset.tab + '-tab'));
    });
    
    // Tracker button listeners
    startPersonalEnergyBtn.addEventListener('click', startPersonalEnergyTracking);
    stopPersonalEnergyBtn.addEventListener('click', stopPersonalEnergyTracking);
    startPersonalStatsBtn.addEventListener('click', startPersonalStatTracking);
    stopPersonalStatsBtn.addEventListener('click', stopPersonalStatTracking);

    // Auth state change listener
    auth.onAuthStateChanged(async (user) => {
        currentUser = user;
        if (user) {
            gymError.textContent = "Loading your data...";
            await fetchInitialPageData(user.uid);
            setupPersonalEnergyListener(); // Permanent tracker listener starts on login
            showTab('current-gym-stats-tab'); // Set the default tab on the right
            gymError.textContent = ""; // Clear loading message
        } else {
            // Handle logged out state
            if (unsubscribeFromEnergy) unsubscribeFromEnergy();
            if (unsubscribeFromStatGains) unsubscribeFromStatGains();
            gymError.textContent = "Please log in to use this page.";
        }
    });
});