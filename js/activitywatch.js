// activitywatch.js - FINAL, REBUILT, AND CORRECTED

document.addEventListener('DOMContentLoaded', function() {
    // --- 1. DOM Elements ---
    const myFactionIDInput = document.getElementById('myFactionID');
    const enemyFactionIDInput = document.getElementById('enemyFactionID');
    const activityIntervalSelect = document.getElementById('activityInterval');
    const statusDisplay = document.getElementById('statusDisplay');
    const lastRefreshTimeDisplay = document.getElementById('lastRefreshTime');
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
	console.log("Attempting to attach event listener to clearDataButton.");
    const clearDataButton = document.getElementById('clearDataButton');
    const factionNameDisplay = document.getElementById('factionNameDisplay');
    const totalMembersMyFactionDisplay = document.getElementById('totalMembersMyFaction');
    const compareUser1Select = document.getElementById('compareUser1');
    const compareUser2Select = document.getElementById('compareUser2');
    const stopTimerHoursSelect = document.getElementById('stopTimerHours');
    const countdownTimerDisplay = document.getElementById('countdownTimer');
    const rawActivityChartCanvas = document.getElementById('rawActivityChart');
    const myFactionIndividualsChartCanvas = document.getElementById('myFactionIndividualsChart');
    const activityDifferenceChartCanvas = document.getElementById('activityDifferenceChart');
    const enemyFactionIndividualsChartCanvas = document.getElementById('enemyFactionIndividualsChart');
    const reportModal = document.getElementById('reportModal');
    const reportModalCloseBtn = document.getElementById('reportModalCloseBtn');
    const downloadReportBtn = document.getElementById('downloadReportBtn');
    const confirmClearBtn = document.getElementById('confirmClearBtn');
    const skipConfirmCheckbox = document.getElementById('skipConfirmCheckbox');
	const reportOptionsModal = document.getElementById('reportOptionsModal');
    const reportOptionsModalCloseBtn = document.getElementById('reportOptionsModalCloseBtn');
    const reportMyFactionMemberSelect = document.getElementById('reportMyFactionMemberSelect');
    const reportEnemyFactionMemberSelect = document.getElementById('reportEnemyFactionMemberSelect');
    const generateCustomReportBtn = document.getElementById('generateCustomReportBtn');
	const compareTwoIndividualsBtn = document.getElementById('compareTwoIndividualsBtn');


    // --- 2. Global Variables & State ---
    let rawActivityChartInstance = null;
    let myFactionIndividualsChartInstance = null;
    let activityDifferenceChartInstance = null;
    let enemyFactionIndividualsChartInstance = null;
    let fetchInterval = null;
    let tornApiKey = null;
    let autoStopInterval = null;
    const SESSION_STORAGE_KEY = 'activitySessionState';
    const LOCAL_STORAGE_KEY = 'factionActivityData';
    let historicalData = [];
    const SKIP_CONFIRM_KEY = 'skipClearConfirmation';

    function saveSessionState(state) {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
    }

    function loadSessionState() {
        const state = localStorage.getItem(SESSION_STORAGE_KEY);
        return state ? JSON.parse(state) : null;
    }

    function clearSessionState() {
        localStorage.removeItem(SESSION_STORAGE_KEY);
    }

    function updateStatus(displayMessage, statusType = 'info', consoleMessage = '') {
        statusDisplay.textContent = displayMessage;
        let bgColor = '#444';
        let textColor = '#eee';
        switch (statusType) {
            case 'success':
                bgColor = '#28a745';
                textColor = 'white';
                break;
            case 'warning':
                bgColor = '#ffc107';
                textColor = 'black';
                break;
            case 'error':
                bgColor = '#dc3545';
                textColor = 'white';
                break;
            case 'info':
            default:
                bgColor = '#00a8ff';
                textColor = 'white';
                break;
        }
        if (displayMessage === "Running.") {
            textColor = '#33FF57';
        } else if (displayMessage === "Ready.") {
            textColor = '#FFD700';
        } else if (displayMessage === "Stopped.") {
            textColor = '#FF3333';
        }
        statusDisplay.style.backgroundColor = bgColor;
        statusDisplay.style.color = textColor;
        console.log(`[Status: ${statusType.toUpperCase()}] ${consoleMessage || displayMessage}`);
    }

    function startAutoStopTimer(endTime) {
        if (autoStopInterval) clearInterval(autoStopInterval);

        function updateCountdown() {
            const remainingMs = endTime - Date.now();
            if (remainingMs <= 0) {
                countdownTimerDisplay.textContent = '0 hours and 0 minutes';
                if (fetchInterval) stopButton.click();
                clearInterval(autoStopInterval);
                return;
            }
            const totalSeconds = Math.round(remainingMs / 1000);
            const h = Math.floor(totalSeconds / 3600);
            const m = Math.floor((totalSeconds % 3600) / 60);
            countdownTimerDisplay.textContent = `${h} hours and ${m} minutes`;
        }
        autoStopInterval = setInterval(updateCountdown, 1000);
        updateCountdown();
    }

    function stopAutoStopTimer() {
        if (autoStopInterval) {
            clearInterval(autoStopInterval);
            autoStopInterval = null;
        }
        countdownTimerDisplay.textContent = '0 hours and 0 minutes';
        if (stopTimerHoursSelect.options.length > 0) {
            const defaultOption = Array.from(stopTimerHoursSelect.options).find(opt => opt.value === "");
            stopTimerHoursSelect.value = defaultOption ? "" : stopTimerHoursSelect.options[0].value;
        }
    }

    function convertLastActionToMinutes(relative) {
        if (!relative) return 0;
        const p = relative.split(' ');
        const v = parseFloat(p[0]);
        const u = p[1];
        if (isNaN(v)) return 0;
        if (u.includes("minute")) return v;
        if (u.includes("hour")) return v * 60;
        if (u.includes("day")) return v * 1440;
        return 0;
    }

    function formatTimestamp(date) {
        const h = String(date.getHours()).padStart(2, '0');
        const m = String(date.getMinutes()).padStart(2, '0');
        const d = date.getDate();
        const mo = date.getMonth() + 1;
        const y = String(date.getFullYear() % 100).padStart(2, '0');
        return `${h}:${m} ${d}/${mo}/${y}`;
    }

    async function fetchTornApi(url) {
        try {
            const r = await fetch(url);
            if (!r.ok) {
                let e;
                try { e = await r.json(); } catch (err) {}
                const m = e?.error?.error || e?.error?.message || `API Error ${r.status}`;
                throw new Error(m);
            }
            return r.json();
        } catch (err) {
            console.error("fetchTornApi error:", err);
            throw err;
        }
    }

    function processFactionDataFromTornApi(id, resp) {
        const d = { factionName: "Unknown", members: [] };
        if (resp.error) throw new Error(`API Error for ${id}: ${resp.error.error}`);
        d.factionName = resp.name || `Faction ${id}`;
        if (resp.members) {
            Object.entries(resp.members).forEach(([mId, m]) => {
                const mins = convertLastActionToMinutes(m.last_action?.relative);
                d.members.push({ id: mId, name: m.name, minutesAgo: mins, active: mins <= 15 ? 1 : 0, display: `${m.name} [${mId}]` });
            });
        }
        return d;
    }

    function destroyCharts() {
        if (rawActivityChartInstance) rawActivityChartInstance.destroy();
        if (myFactionIndividualsChartInstance) myFactionIndividualsChartInstance.destroy();
        if (activityDifferenceChartInstance) activityDifferenceChartInstance.destroy();
        if (enemyFactionIndividualsChartInstance) enemyFactionIndividualsChartInstance.destroy();
        rawActivityChartInstance = myFactionIndividualsChartInstance = activityDifferenceChartInstance = enemyFactionIndividualsChartInstance = null;
    }

    function populateIndividualComparisonDropdowns(myM, enM, myN, enN) {
        compareUser1Select.innerHTML = ''; compareUser2Select.innerHTML = '';
        const o1 = document.createElement('option'); o1.value = ''; o1.textContent = `${myN || 'My Faction'} Member`; compareUser1Select.appendChild(o1);
        const o2 = document.createElement('option'); o2.value = ''; o2.textContent = `${enN || 'Enemy Faction'} Member`; compareUser2Select.appendChild(o2);
        if (myM) myM.sort((a,b) => a.name.localeCompare(b.name)).forEach(m => { const o = document.createElement('option'); o.value = m.id; o.textContent = m.display; compareUser1Select.appendChild(o); });
        if (enM) enM.sort((a,b) => a.name.localeCompare(b.name)).forEach(m => { const o = document.createElement('option'); o.value = m.id; o.textContent = m.display; compareUser2Select.appendChild(o); });
    }

    function updateIndividualCharts() {
        const myId = compareUser1Select.value;
        const enId = compareUser2Select.value;
        const l = historicalData.map(r => r.formattedTime);
        if (myFactionIndividualsChartInstance) {
            myFactionIndividualsChartInstance.data.labels = l;
            myFactionIndividualsChartInstance.data.datasets = [];
            if (myId) {
                const d = historicalData.map(r => r.myFaction.individuals.find(m => m.id === myId)?.active ?? 0);
                myFactionIndividualsChartInstance.data.datasets.push({ label: 'My Faction', data: d, type: 'bar', backgroundColor: 'rgba(0, 168, 255, 0.2)', borderColor: '#00a8ff' });
            }
            myFactionIndividualsChartInstance.options.plugins.title.text = myId ? compareUser1Select.options[compareUser1Select.selectedIndex].textContent : 'My Faction Individuals';
            myFactionIndividualsChartInstance.update();
        }
        if (enemyFactionIndividualsChartInstance) {
            enemyFactionIndividualsChartInstance.data.labels = l;
            enemyFactionIndividualsChartInstance.data.datasets = [];
            if (enId) {
                const d = historicalData.map(r => r.enemyFaction.individuals.find(m => m.id === enId)?.active ?? 0);
                enemyFactionIndividualsChartInstance.data.datasets.push({ label: 'Enemy Faction', data: d, type: 'bar', backgroundColor: 'rgba(220, 53, 69, 0.2)', borderColor: '#dc3545' });
            }
            enemyFactionIndividualsChartInstance.options.plugins.title.text = enId ? compareUser2Select.options[compareUser2Select.selectedIndex].textContent : 'Enemy Faction Individuals';
            enemyFactionIndividualsChartInstance.update();
        }
    }
    
    function getChartOptions(t) { return { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: t, color: '#00a8ff', font: { size: 16 } }, legend: { labels: { color: '#eee' } } }, scales: { x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#eee' } }, y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#eee' } } } }; }
    
    function initializeChart(c, t, d, o) { if (c) return new Chart(c.getContext('2d'), { type: t, data: d, options: o }); return null; }

    function updateCharts() {
        if (historicalData.length === 0) { destroyCharts(); return; }
        const l = historicalData.map(r => r.formattedTime);
        const my = historicalData.map(r => r.myFaction.activeMembers);
        const en = historicalData.map(r => r.enemyFaction.activeMembers);
        const d = historicalData.map(r => r.activityDifference);
        destroyCharts();
        rawActivityChartInstance = initializeChart(rawActivityChartCanvas, 'line', { labels: l, datasets: [{ label: 'My Faction', data: my, borderColor: '#00a8ff', backgroundColor: 'rgba(0,168,255,0.2)', tension: 0.3, fill: true }, { label: 'Enemy Faction', data: en, borderColor: '#dc3545', backgroundColor: 'rgba(220,53,69,0.2)', tension: 0.3, fill: true }] }, getChartOptions('Raw Activity Data'));
        activityDifferenceChartInstance = initializeChart(activityDifferenceChartCanvas, 'bar', { labels: l, datasets: [{ label: 'Activity Difference', data: d, backgroundColor: d.map(v => v >= 0 ? 'rgba(0, 168, 255, 0.2)' : 'rgba(220, 53, 69, 0.2)'), borderColor: d.map(v => v >= 0 ? '#00a8ff' : '#dc3545') }] }, getChartOptions('Activity Difference'));
        myFactionIndividualsChartInstance = initializeChart(myFactionIndividualsChartCanvas, 'bar', {}, getChartOptions('My Faction Individuals'));
        enemyFactionIndividualsChartInstance = initializeChart(enemyFactionIndividualsChartCanvas, 'bar', {}, getChartOptions('Enemy Faction Individuals'));
        updateIndividualCharts();
    }

    async function fetchAndProcessFactionActivity() {
        updateStatus("Running.", 'info', "Fetching data...");
        try {
            const myFid = myFactionIDInput.value.trim();
            const enFid = enemyFactionIDInput.value.trim();
            const myUrl = `https://api.torn.com/faction/${myFid}?selections=basic&key=${tornApiKey}`;
            const myResp = await fetchTornApi(myUrl);
            const myData = processFactionDataFromTornApi(myFid, myResp);
            const enUrl = `https://api.torn.com/faction/${enFid}?selections=basic&key=${tornApiKey}`;
            const enResp = await fetchTornApi(enUrl);
            const enData = processFactionDataFromTornApi(enFid, enResp);
            const now = new Date();
            lastRefreshTimeDisplay.textContent = formatTimestamp(now);
            const myActive = myData.members.filter(m => m.active === 1).length;
            const enActive = enData.members.filter(m => m.active === 1).length;
            factionNameDisplay.textContent = `${myData.factionName} | ${enData.factionName}`;
            totalMembersMyFactionDisplay.textContent = `${myData.members.length} | ${enData.members.length}`;
            const rec = { timestamp: now.getTime(), formattedTime: formatTimestamp(now), myFaction: { id: myFid, name: myData.factionName, totalMembers: myData.members.length, activeMembers: myActive, individuals: myData.members, }, enemyFaction: { id: enFid, name: enData.factionName, totalMembers: enData.members.length, activeMembers: enActive, individuals: enData.members, }, activityDifference: myActive - enActive };
            historicalData.push(rec);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(historicalData));
            updateStatus("Running.", 'success', "Data refreshed.");
            updateCharts();
            populateIndividualComparisonDropdowns(myData.members, enData.members, myData.factionName, enData.factionName);
        } catch (e) {
            console.error("Error in fetch/process:", e);
            updateStatus("Error.", 'error', e.message);
            stopButton.click();
        }
    }
    
    function enterRunningState(sessionState) {
        if (fetchInterval) clearInterval(fetchInterval);

        myFactionIDInput.value = sessionState.myFactionID;
        enemyFactionIDInput.value = sessionState.enemyFactionID;
        activityIntervalSelect.value = sessionState.interval;
        if (sessionState.autoStopDuration) {
            stopTimerHoursSelect.value = sessionState.autoStopDuration;
        }

        fetchAndProcessFactionActivity();
        fetchInterval = setInterval(fetchAndProcessFactionActivity, sessionState.interval * 60 * 1000);
        if (sessionState.autoStopTime) {
            startAutoStopTimer(sessionState.autoStopTime);
        }

        updateStatus("Running.", 'success', "Tracking started.");
        startButton.disabled = true;
        stopButton.disabled = false;
        myFactionIDInput.readOnly = true;
        enemyFactionIDInput.readOnly = true;
        activityIntervalSelect.disabled = true;
        stopTimerHoursSelect.disabled = true;
    }
    
    function enterStoppedState() {
        if (fetchInterval) clearInterval(fetchInterval);
        fetchInterval = null;
        
        stopAutoStopTimer();
        clearSessionState();
        
        updateStatus("Stopped.", 'info', "Tracking stopped.");
        startButton.disabled = tornApiKey ? false : true;
        stopButton.disabled = true;
        myFactionIDInput.readOnly = false;
        enemyFactionIDInput.readOnly = false;
        activityIntervalSelect.disabled = false;
        stopTimerHoursSelect.disabled = false;
    }
	// Helper function to populate member dropdowns in the new report modal
    function populateReportMemberDropdowns() {
        reportMyFactionMemberSelect.innerHTML = '<option value="">-- Select My Faction Member --</option>';
        reportEnemyFactionMemberSelect.innerHTML = '<option value="">-- Select Enemy Faction Member --</option>';

        if (historicalData.length === 0) return;

        const latestRecord = historicalData[historicalData.length - 1]; // Use latest data for names/IDs
        
        // Aggregate all unique members observed throughout historicalData for comprehensive dropdowns
        const allMyMembers = {};
        const allEnemyMembers = {};

        historicalData.forEach(record => {
            record.myFaction.individuals.forEach(member => {
                allMyMembers[member.id] = { name: member.name, display: member.display };
            });
            record.enemyFaction.individuals.forEach(member => {
                allEnemyMembers[member.id] = { name: member.name, display: member.display };
            });
        });

        // Convert to array and sort
        const sortedMyMembers = Object.values(allMyMembers).sort((a, b) => a.name.localeCompare(b.name));
        const sortedEnemyMembers = Object.values(allEnemyMembers).sort((a, b) => a.name.localeCompare(b.name));

        sortedMyMembers.forEach(member => {
            const option = document.createElement('option');
            option.value = member.id;
            option.textContent = member.display;
            reportMyFactionMemberSelect.appendChild(option);
        });

        sortedEnemyMembers.forEach(member => {
            const option = document.createElement('option');
            option.value = member.id;
            option.textContent = member.display;
            reportEnemyFactionMemberSelect.appendChild(option);
        });
    }

    // Opens the new report options modal
    function openReportOptionsModal() {
        if (historicalData.length === 0) {
            alert("No data has been recorded yet. Please start tracking to generate a report.");
            return;
        }

        // Before opening, populate dropdowns with all available members from historical data
        populateReportMemberDropdowns();

        // Ensure the comparison charts on the main page are updated to reflect the selected member
        // from the new modal's dropdown (if one was previously selected, or reset to default)
        // This is crucial for capturing the correct image later.
        // Initially, ensure no specific member is pre-selected for the graph update.
        compareUser1Select.value = reportMyFactionMemberSelect.value;
        compareUser2Select.value = reportEnemyFactionMemberSelect.value;
        updateIndividualCharts(); // This function already updates based on compareUser1/2Select values

        reportOptionsModal.classList.add('visible'); // Show the new modal
        reportModal.classList.remove('visible'); // Ensure the "Session Complete" modal is hidden if it was open
    }

    // Closes the new report options modal
    function closeReportOptionsModal() {
        reportOptionsModal.classList.remove('visible');
        // Reset dropdowns in the modal
        reportMyFactionMemberSelect.value = "";
        reportEnemyFactionMemberSelect.value = "";
        // Optionally, reset the main individual comparison charts if desired after closing
        // compareUser1Select.value = "";
        // compareUser2Select.value = "";
        // updateIndividualCharts();
    }

    // Updates the main individual chart (behind the modal) when a selection is made in the new modal's dropdown
    function updateCustomReportChart(isMyFaction) {
        if (isMyFaction) {
            compareUser1Select.value = reportMyFactionMemberSelect.value;
            // Clear enemy faction selection if a single member is chosen
            if (reportMyFactionMemberSelect.value) {
                compareUser2Select.value = "";
                reportEnemyFactionMemberSelect.value = "";
            }
        } else {
            compareUser2Select.value = reportEnemyFactionMemberSelect.value;
            // Clear my faction selection if a single member is chosen
            if (reportEnemyFactionMemberSelect.value) {
                compareUser1Select.value = "";
                reportMyFactionMemberSelect.value = "";
            }
        }
        updateIndividualCharts(); // This function uses compareUser1Select and compareUser2Select
    }

    function openReportModal() {
        console.log("openReportModal function called!");
        console.log("Report Modal element:", reportModal); 
        
        reportModal.classList.add('visible'); 
        
    }

    function closeReportModal() {
        reportModal.classList.remove('visible'); 
        
    }

    // ... (your existing code) ...
function handleDownloadReport() {
        // --- 1. Initial Checks ---
        if (historicalData.length < 2) { // Need at least 2 points to calculate duration
            alert("You must record data for a minimum of one hour to gain a realistic report.");
            return; // Stop the function here
        }

        const firstTimestamp = historicalData[0].timestamp;
        const lastTimestamp = historicalData[historicalData.length - 1].timestamp;
        const durationMinutes = (lastTimestamp - firstTimestamp) / (1000 * 60); // Difference in minutes

        if (durationMinutes < 60) {
            alert("You must record data for a minimum of one hour to gain a realistic report.");
            return; // Stop the function here
        }

        // --- 2. Report Header ---
        let reportContent = `Faction Activity Comprehensive Report\n`;
        reportContent += `Generated: ${new Date().toLocaleString()}\n\n`;

        const myFactionName = historicalData[0].myFaction.name;
        const enemyFactionName = historicalData[0].enemyFaction.name;
        
        // Get total members from the latest record for sizing top/bottom lists
        const latestRecord = historicalData[historicalData.length - 1];
        const myFactionTotalMembers = latestRecord.myFaction.totalMembers;
        const enemyFactionTotalMembers = latestRecord.enemyFaction.totalMembers;

        reportContent += `My Faction ID: ${latestRecord.myFaction.id} (Name: ${myFactionName}, Total Members: ${myFactionTotalMembers})\n`;
        reportContent += `Enemy Faction ID: ${latestRecord.enemyFaction.id} (Name: ${enemyFactionName}, Total Members: ${enemyFactionTotalMembers})\n\n`;

        reportContent += `--- Hourly Activity Summary ---\n\n`;

        // --- 3. Hourly Summary Aggregation & Report Section ---
        const hourlySummary = {};

        historicalData.forEach(record => {
            const date = new Date(record.timestamp);
            const hourKey = date.getHours(); // Get the hour (0-23)

            if (!hourlySummary[hourKey]) {
                hourlySummary[hourKey] = {
                    myWins: 0,
                    enemyWins: 0,
                    ties: 0,
                    totalIntervals: 0,
                    myTotalActive: 0,
                    enemyTotalActive: 0
                };
            }

            if (record.activityDifference > 0) {
                hourlySummary[hourKey].myWins++;
            } else if (record.activityDifference < 0) {
                hourlySummary[hourKey].enemyWins++;
            } else {
                hourlySummary[hourKey].ties++;
            }
            hourlySummary[hourKey].totalIntervals++;
            hourlySummary[hourKey].myTotalActive += record.myFaction.activeMembers;
            hourlySummary[hourKey].enemyTotalActive += record.enemyFaction.activeMembers;
        });

        const sortedHours = Object.keys(hourlySummary).sort((a, b) => parseInt(a) - parseInt(b));

        sortedHours.forEach(hourKey => {
            const summary = hourlySummary[hourKey];
            const hourDisplay = `${String(hourKey).padStart(2, '0')}:00 - ${String(parseInt(hourKey) + 1).padStart(2, '0')}:00`;
            
            reportContent += `Hour: ${hourDisplay}\n`;
            reportContent += `  Intervals Tracked: ${summary.totalIntervals}\n`;
            
            let dominantFaction = "Equal Activity";
            if (summary.myWins > summary.enemyWins) {
                dominantFaction = myFactionName;
            } else if (summary.enemyWins > summary.myWins) {
                dominantFaction = enemyFactionName;
            }

            reportContent += `  Dominant Faction this hour (by interval wins): ${dominantFaction}\n`;
            reportContent += `  Interval Wins: ${myFactionName} (${summary.myWins}), ${enemyFactionName} (${summary.enemyWins}), Ties (${summary.ties})\n`;
            
            const avgMyActive = (summary.myTotalActive / summary.totalIntervals).toFixed(1);
            const avgEnemyActive = (summary.enemyTotalActive / summary.totalIntervals).toFixed(1);
            reportContent += `  Average Active Members per Interval: ${myFactionName} (${avgMyActive}), ${enemyFactionName} (${avgEnemyActive})\n`;

            reportContent += `------------------------------------\n\n`;
        });

        // --- 4. Individual Member Activity Aggregation & Top/Bottom Lists ---
        reportContent += `\n--- Individual Member Activity Breakdown ---\n\n`;

        function aggregateIndividualActivity(factionData) {
            const memberActivity = {}; // { userId: { name: "...", activeCount: 0, totalIntervalsTracked: 0 } }
            
            historicalData.forEach(record => {
                const factionRecords = (factionData === 'myFaction') ? record.myFaction.individuals : record.enemyFaction.individuals;
                factionRecords.forEach(member => {
                    if (!memberActivity[member.id]) {
                        memberActivity[member.id] = { name: member.name, activeCount: 0, totalIntervalsTracked: 0 };
                    }
                    if (member.active === 1) { // If member was active in this interval
                        memberActivity[member.id].activeCount++;
                    }
                    memberActivity[member.id].totalIntervalsTracked++; // Track all intervals member was observed in
                });
            });
            return Object.values(memberActivity);
        }

        function getTopBottomMembers(members, totalFactionMembers, isTop) {
            let limit;
            if (totalFactionMembers <= 20) limit = 5;
            else if (totalFactionMembers <= 50) limit = 10;
            else limit = 25;

            // Sort members: most active first
            const sortedMembers = members.sort((a, b) => b.activeCount - a.activeCount);

            if (isTop) {
                return sortedMembers.slice(0, limit);
            } else {
                // For least active, sort by activeCount (ascending) then by intervals tracked (ascending)
                const leastActiveSorted = members.sort((a, b) => {
                    if (a.activeCount !== b.activeCount) return a.activeCount - b.activeCount;
                    return a.totalIntervalsTracked - b.totalIntervalsTracked; // Tie-break: less observed intervals are less active
                });
                return leastActiveSorted.slice(0, limit);
            }
        }
        
        // Process My Faction
        const myAggregatedMembers = aggregateIndividualActivity('myFaction');
        const myTopActive = getTopBottomMembers(myAggregatedMembers, myFactionTotalMembers, true);
        const myLeastActive = getTopBottomMembers(myAggregatedMembers, myFactionTotalMembers, false);

        reportContent += `\n--- ${myFactionName} Members ---\n`;
        reportContent += `Top ${myTopActive.length} Most Active (based on intervals active):\n`;
        if (myTopActive.length === 0) {
            reportContent += "  No active members found for this faction.\n";
        } else {
            myTopActive.forEach((m, i) => {
                reportContent += `  ${i + 1}. ${m.name} (Active in ${m.activeCount} of ${m.totalIntervalsTracked} intervals)\n`;
            });
        }
        
        reportContent += `\nBottom ${myLeastActive.length} Least Active (based on intervals active):\n`;
        if (myLeastActive.length === 0) {
            reportContent += "  No members found for this faction.\n";
        } else {
            myLeastActive.forEach((m, i) => {
                reportContent += `  ${i + 1}. ${m.name} (Active in ${m.activeCount} of ${m.totalIntervalsTracked} intervals)\n`;
            });
        }


        // Process Enemy Faction
        const enemyAggregatedMembers = aggregateIndividualActivity('enemyFaction');
        const enemyTopActive = getTopBottomMembers(enemyAggregatedMembers, enemyFactionTotalMembers, true);
        const enemyLeastActive = getTopBottomMembers(enemyAggregatedMembers, enemyFactionTotalMembers, false);

        reportContent += `\n--- ${enemyFactionName} Members ---\n`;
        reportContent += `Top ${enemyTopActive.length} Most Active (based on intervals active):\n`;
        if (enemyTopActive.length === 0) {
            reportContent += "  No active members found for this faction.\n";
        } else {
            enemyTopActive.forEach((m, i) => {
                reportContent += `  ${i + 1}. ${m.name} (Active in ${m.activeCount} of ${m.totalIntervalsTracked} intervals)\n`;
            });
        }

        reportContent += `\nBottom ${enemyLeastActive.length} Least Active (based on intervals active):\n`;
        if (enemyLeastActive.length === 0) {
            reportContent += "  No members found for this faction.\n";
        } else {
            enemyLeastActive.forEach((m, i) => {
                reportContent += `  ${i + 1}. ${m.name} (Active in ${m.activeCount} of ${m.totalIntervalsTracked} intervals)\n`;
            });
        }

        // --- 5. File Generation ---
        const blob = new Blob([reportContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'faction_activity_comprehensive_report.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
// ... (rest of your existing code) ...

    // --- Initial Setup Function ---
    function init() {
        // Load historical data from local storage
        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedData) {
            try {
                historicalData = JSON.parse(savedData);
                // Ensure historicalData is an array, if parsing fails it might be null or not an array
                if (!Array.isArray(historicalData)) {
                    historicalData = [];
                }
            } catch (e) {
                console.error("Error parsing historical data from localStorage:", e);
                historicalData = []; // Clear corrupted data
            }
        }
        updateCharts(); // Draw charts with loaded historical data
        // Populate dropdowns with initial data if available (e.g., from last fetch in historicalData)
        if (historicalData.length > 0) {
            const lastRecord = historicalData[historicalData.length - 1];
            populateIndividualComparisonDropdowns(
                lastRecord.myFaction.individuals,
                lastRecord.enemyFaction.individuals,
                lastRecord.myFaction.name,
                lastRecord.enemyFaction.name
            );
        }

        // Set initial state of skip confirm checkbox
        skipConfirmCheckbox.checked = localStorage.getItem(SKIP_CONFIRM_KEY) === 'true';

        // Initial status update (Firebase auth handles the rest)
        updateStatus("Loading...", 'info', "Initializing application.");
    }
    // End New Function Definitions for Report Modal


    if (typeof auth !== 'undefined' && typeof db !== 'undefined') {
        auth.onAuthStateChanged(async function(user) {
            if (user) {
                try {
                    const userDocRef = db.collection('userProfiles').doc(user.uid);
                    const userDoc = await userDocRef.get();
                    if (userDoc.exists && userDoc.data().tornApiKey) {
                        tornApiKey = userDoc.data().tornApiKey;
                        const sessionState = loadSessionState();
                        if (sessionState && sessionState.isRunning && (!sessionState.autoStopTime || Date.now() < sessionState.autoStopTime)) {
                            enterRunningState(sessionState);
                        } else {
                            enterStoppedState();
                            updateStatus("Ready.", 'info', "API Key loaded.");
                        }
                    } else {
                        tornApiKey = null;
                        enterStoppedState();
                        updateStatus("Ready.", 'warning', "Torn API Key not set in profile.");
                    }
                } catch (error) {
                    tornApiKey = null;
                    enterStoppedState();
                    updateStatus("Ready.", 'error', "Error fetching API Key.");
                }
            } else {
                tornApiKey = null;
                enterStoppedState();
                updateStatus("Ready.", 'info', "Please sign in.");
            }
        });
    } else {
        enterStoppedState();
        updateStatus("Ready.", 'error', "Firebase not loaded.");
    }

    // Event Listeners for Page Controls
    startButton.addEventListener('click', () => {
        const intervalMinutes = parseInt(activityIntervalSelect.value, 10);
        const stopAfterHours = parseInt(stopTimerHoursSelect.value, 10);
        if (isNaN(intervalMinutes) || intervalMinutes < 1) {
            updateStatus("Ready.", 'warning', "Please select a valid interval.");
            return;
        }
        if (!tornApiKey) {
            updateStatus("Ready.", 'error', "Torn API Key not available.");
            return;
        }
        const sessionState = {
            isRunning: true,
            myFactionID: myFactionIDInput.value,
            enemyFactionID: enemyFactionIDInput.value,
            interval: intervalMinutes,
            autoStopTime: (!isNaN(stopAfterHours) && stopAfterHours > 0) ? Date.now() + stopAfterHours * 60 * 60 * 1000 : null,
            autoStopDuration: (!isNaN(stopAfterHours) && stopAfterHours > 0) ? stopAfterHours : null
        };
        saveSessionState(sessionState);
        enterRunningState(sessionState);
    });

    stopButton.addEventListener('click', enterStoppedState);
    
    clearDataButton.addEventListener('click', openReportModal); // This listener will now call openReportModal

    compareUser1Select.addEventListener('change', updateIndividualCharts);
    compareUser2Select.addEventListener('change', updateIndividualCharts);

    // Event Listeners for Report Modal
    reportModalCloseBtn.addEventListener('click', closeReportModal);
    
    downloadReportBtn.addEventListener('click', openReportOptionsModal); 


    // --- NEW LISTENERS FOR REPORT OPTIONS MODAL ---
    reportOptionsModalCloseBtn.addEventListener('click', closeReportOptionsModal);

    // This listener will trigger the actual report generation and download
    generateCustomReportBtn.addEventListener('click', generateAndDownloadCustomReport);
	compareTwoIndividualsBtn.addEventListener('click', generateAndDownloadIndividualComparisonReport);

    // Listeners for dropdowns in the new report options modal to update charts behind
    reportMyFactionMemberSelect.addEventListener('change', () => updateCustomReportChart(true));
    reportEnemyFactionMemberSelect.addEventListener('change', () => updateCustomReportChart(false));

    
    skipConfirmCheckbox.addEventListener('change', (e) => {
        localStorage.setItem(SKIP_CONFIRM_KEY, e.target.checked);
	
    });
	// This is the new function that generates and downloads the custom report and optional image
    async function generateAndDownloadCustomReport() {
        const selectedMyMemberId = reportMyFactionMemberSelect.value;
        const selectedEnemyMemberId = reportEnemyFactionMemberSelect.value;
        
        // --- 1. Report Content Generation ---
        let reportContent = `Faction Activity Custom Report\n`;
        reportContent += `Generated: ${new Date().toLocaleString()}\n\n`;

        const myFactionName = historicalData[0].myFaction.name;
        const enemyFactionName = historicalData[0].enemyFaction.name;
        
        const latestRecord = historicalData[historicalData.length - 1];
        const myFactionTotalMembers = latestRecord.myFaction.totalMembers;
        const enemyFactionTotalMembers = latestRecord.enemyFaction.totalMembers;

        reportContent += `My Faction ID: ${latestRecord.myFaction.id} (Name: ${myFactionName}, Total Members: ${myFactionTotalMembers})\n`;
        reportContent += `Enemy Faction ID: ${latestRecord.enemyFaction.id} (Name: ${enemyFactionName}, Total Members: ${enemyFactionTotalMembers})\n\n`;

        // If specific members are selected, generate a report focused on them
        if (selectedMyMemberId || selectedEnemyMemberId) {
            reportContent += `--- Focused Individual Activity ---\n\n`;

            historicalData.forEach(record => {
                const myMemberData = record.myFaction.individuals.find(m => m.id === selectedMyMemberId);
                const enemyMemberData = record.enemyFaction.individuals.find(m => m.id === selectedEnemyMemberId);

                if (myMemberData || enemyMemberData) {
                    reportContent += `Timestamp: ${record.formattedTime}\n`;
                    if (myMemberData) {
                        reportContent += `  ${myMemberData.name} [${myMemberData.id}]: ${myMemberData.minutesAgo} minutes ago (Active: ${myMemberData.active === 1 ? 'Yes' : 'No'})\n`;
                    }
                    if (enemyMemberData) {
                        reportContent += `  ${enemyMemberData.name} [${enemyMemberData.id}]: ${enemyMemberData.minutesAgo} minutes ago (Active: ${enemyMemberData.active === 1 ? 'Yes' : 'No'})\n`;
                    }
                    reportContent += `------------------------------------\n\n`;
                }
            });

            if (!selectedMyMemberId && !selectedEnemyMemberId) {
                 reportContent += "  No specific members selected for focused report.\n";
            }
			  // This function generates and downloads a text report comparing two selected individuals
    async function generateAndDownloadIndividualComparisonReport() {
        const selectedMyMemberId = reportMyFactionMemberSelect.value;
        const selectedEnemyMemberId = reportEnemyFactionMemberSelect.value;

        if (!selectedMyMemberId && !selectedEnemyMemberId) {
            alert("Please select at least one member to compare.");
            return;
        }

        // --- 1. Report Content Generation ---
        let reportContent = `Individual Member Comparison Report\n`;
        reportContent += `Generated: ${new Date().toLocaleString()}\n\n`;

        const myFactionName = historicalData[0]?.myFaction.name || "My Faction";
        const enemyFactionName = historicalData[0]?.enemyFaction.name || "Enemy Faction";

        const selectedMyMember = selectedMyMemberId ? (
            historicalData.map(r => r.myFaction.individuals.find(m => m.id === selectedMyMemberId)).filter(Boolean)[0] || null
        ) : null;
        const selectedEnemyMember = selectedEnemyMemberId ? (
            historicalData.map(r => r.enemyFaction.individuals.find(m => m.id === selectedEnemyMemberId)).filter(Boolean)[0] || null
        ) : null;
        
        // Error handling if selected member not found in historical data (unlikely if dropdown populated correctly)
        if (selectedMyMemberId && !selectedMyMember) {
             alert(`My Faction Member (ID: ${selectedMyMemberId}) not found in historical data.`);
             return;
        }
        if (selectedEnemyMemberId && !selectedEnemyMember) {
            alert(`Enemy Faction Member (ID: ${selectedEnemyMemberId}) not found in historical data.`);
            return;
        }

        reportContent += `My Faction Member: ${selectedMyMember ? selectedMyMember.name + ' [' + selectedMyMember.id + ']' : 'None selected'}\n`;
        reportContent += `Enemy Faction Member: ${selectedEnemyMember ? selectedEnemyMember.name + ' [' + selectedEnemyMember.id + ']' : 'None selected'}\n\n`;

        reportContent += `--- Activity Overview ---\n\n`;

        // Aggregation for selected members' hourly activity
        const memberHourlyActivity = {}; // { memberId: { hour: { activeCount: N, totalIntervals: M } } }

        historicalData.forEach(record => {
            const date = new Date(record.timestamp);
            const hourKey = date.getHours();

            // Process My Faction Member
            if (selectedMyMemberId) {
                const member = record.myFaction.individuals.find(m => m.id === selectedMyMemberId);
                if (member) {
                    if (!memberHourlyActivity[selectedMyMemberId]) {
                        memberHourlyActivity[selectedMyMemberId] = {};
                    }
                    if (!memberHourlyActivity[selectedMyMemberId][hourKey]) {
                        memberHourlyActivity[selectedMyMemberId][hourKey] = { activeCount: 0, totalIntervals: 0 };
                    }
                    if (member.active === 1) {
                        memberHourlyActivity[selectedMyMemberId][hourKey].activeCount++;
                    }
                    memberHourlyActivity[selectedMyMemberId][hourKey].totalIntervals++;
                }
            }

            // Process Enemy Faction Member
            if (selectedEnemyMemberId) {
                const member = record.enemyFaction.individuals.find(m => m.id === selectedEnemyMemberId);
                if (member) {
                    if (!memberHourlyActivity[selectedEnemyMemberId]) {
                        memberHourlyActivity[selectedEnemyMemberId] = {};
                    }
                    if (!memberHourlyActivity[selectedEnemyMemberId][hourKey]) {
                        memberHourlyActivity[selectedEnemyMemberId][hourKey] = { activeCount: 0, totalIntervals: 0 };
                    }
                    if (member.active === 1) {
                        memberHourlyActivity[selectedEnemyMemberId][hourKey].activeCount++;
                    }
                    memberHourlyActivity[selectedEnemyMemberId][hourKey].totalIntervals++;
                }
            }
        });

        // Add summary for selected My Faction Member
        if (selectedMyMember) {
            reportContent += `--- ${selectedMyMember.name}'s Hourly Activity ---\n`;
            const myMemberHourlyData = memberHourlyActivity[selectedMyMemberId] || {};
            const sortedHours = Object.keys(myMemberHourlyData).sort((a, b) => parseInt(a) - parseInt(b));
            if (sortedHours.length === 0) {
                reportContent += "  No activity recorded for this member.\n";
            } else {
                sortedHours.forEach(hourKey => {
                    const data = myMemberHourlyData[hourKey];
                    const hourDisplay = `${String(hourKey).padStart(2, '0')}:00 - ${String(parseInt(hourKey) + 1).padStart(2, '0')}:00`;
                    reportContent += `  Hour ${hourDisplay}: Active in ${data.activeCount} of ${data.totalIntervals} intervals.\n`;
                });
            }
            reportContent += `\n`;
        }

        // Add summary for selected Enemy Faction Member
        if (selectedEnemyMember) {
            reportContent += `--- ${selectedEnemyMember.name}'s Hourly Activity ---\n`;
            const enemyMemberHourlyData = memberHourlyActivity[selectedEnemyMemberId] || {};
            const sortedHours = Object.keys(enemyMemberHourlyData).sort((a, b) => parseInt(a) - parseInt(b));
            if (sortedHours.length === 0) {
                reportContent += "  No activity recorded for this member.\n";
            } else {
                sortedHours.forEach(hourKey => {
                    const data = enemyMemberHourlyData[hourKey];
                    const hourDisplay = `${String(hourKey).padStart(2, '0')}:00 - ${String(parseInt(hourKey) + 1).padStart(2, '0')}:00`;
                    reportContent += `  Hour ${hourDisplay}: Active in ${data.activeCount} of ${data.totalIntervals} intervals.\n`;
                });
            }
           
		   reportContent += `\n`;
        }

        // --- 2. Trigger Download ---
        closeReportOptionsModal(); // Close the new report options modal
        closeReportModal(); // Also close the "Session Complete" modal if still open

        // Download Text Report
        const textBlob = new Blob([reportContent], { type: 'text/plain' });
        const textUrl = URL.createObjectURL(textBlob);
        const textA = document.createElement('a');
        textA.href = textUrl;
        textA.download = 'individual_comparison_report.txt';
        document.body.appendChild(textA);
        textA.click();
        document.body.removeChild(textA);
        URL.revokeObjectURL(textUrl);

        // Final status update
        updateStatus("Individual comparison report generated.", 'success', "Individual comparison report downloaded.");
    }

        } else {
            // --- Include Hourly Summary (if no specific members are selected) ---
            reportContent += `--- Hourly Activity Summary ---\n\n`;
            const hourlySummary = {}; // Same aggregation logic as before
            historicalData.forEach(record => { /* ... populate hourlySummary ... */
                 const date = new Date(record.timestamp);
                 const hourKey = date.getHours(); 
                 if (!hourlySummary[hourKey]) {
                     hourlySummary[hourKey] = { myWins: 0, enemyWins: 0, ties: 0, totalIntervals: 0, myTotalActive: 0, enemyTotalActive: 0 };
                 }
                 if (record.activityDifference > 0) hourlySummary[hourKey].myWins++;
                 else if (record.activityDifference < 0) hourlySummary[hourKey].enemyWins++;
                 else hourlySummary[hourKey].ties++;
                 hourlySummary[hourKey].totalIntervals++;
                 hourlySummary[hourKey].myTotalActive += record.myFaction.activeMembers;
                 hourlySummary[hourKey].enemyTotalActive += record.enemyFaction.activeMembers;
            });
            const sortedHours = Object.keys(hourlySummary).sort((a, b) => parseInt(a) - parseInt(b));
            sortedHours.forEach(hourKey => { /* ... format hourly summary ... */
                 const summary = hourlySummary[hourKey];
                 const hourDisplay = `${String(hourKey).padStart(2, '0')}:00 - ${String(parseInt(hourKey) + 1).padStart(2, '0')}:00`;
                 reportContent += `Hour: ${hourDisplay}\n`;
                 reportContent += `  Intervals Tracked: ${summary.totalIntervals}\n`;
                 let dominantFaction = "Equal Activity";
                 if (summary.myWins > summary.enemyWins) dominantFaction = myFactionName;
                 else if (summary.enemyWins > summary.myWins) dominantFaction = enemyFactionName;
                 reportContent += `  Dominant Faction this hour (by interval wins): ${dominantFaction}\n`;
                 reportContent += `  Interval Wins: ${myFactionName} (${summary.myWins}), ${enemyFactionName} (${summary.enemyWins}), Ties (${summary.ties})\n`;
                 const avgMyActive = (summary.myTotalActive / summary.totalIntervals).toFixed(1);
                 const avgEnemyActive = (summary.enemyTotalActive / summary.totalIntervals).toFixed(1);
                 reportContent += `  Average Active Members per Interval: ${myFactionName} (${avgMyActive}), ${enemyFactionName} (${avgEnemyActive})\n`;
                 reportContent += `------------------------------------\n\n`;
            });

            // --- Include Top/Bottom Lists (if no specific members are selected) ---
            reportContent += `\n--- Individual Member Activity Breakdown (Overall) ---\n\n`;

            function aggregateIndividualActivity(factionData) { /* ... same as before ... */
                const memberActivity = {};
                historicalData.forEach(record => {
                    const factionRecords = (factionData === 'myFaction') ? record.myFaction.individuals : record.enemyFaction.individuals;
                    factionRecords.forEach(member => {
                        if (!memberActivity[member.id]) {
                            memberActivity[member.id] = { name: member.name, activeCount: 0, totalIntervalsTracked: 0 };
                        }
                        if (member.active === 1) { memberActivity[member.id].activeCount++; }
                        memberActivity[member.id].totalIntervalsTracked++;
                    });
                });
                return Object.values(memberActivity);
            }

            function getTopBottomMembers(members, totalFactionMembers, isTop) { /* ... same as before ... */
                let limit;
                if (totalFactionMembers <= 20) limit = 5;
                else if (totalFactionMembers <= 50) limit = 10;
                else limit = 25;
                const sortedMembers = members.sort((a, b) => b.activeCount - a.activeCount);
                if (isTop) return sortedMembers.slice(0, limit);
                else {
                    const leastActiveSorted = members.sort((a, b) => {
                        if (a.activeCount !== b.activeCount) return a.activeCount - b.activeCount;
                        return a.totalIntervalsTracked - b.totalIntervalsTracked;
                    });
                    return leastActiveSorted.slice(0, limit);
                }
            }
            
            // Process My Faction
            const myAggregatedMembers = aggregateIndividualActivity('myFaction');
            const myTopActive = getTopBottomMembers(myAggregatedMembers, myFactionTotalMembers, true);
            const myLeastActive = getTopBottomMembers(myAggregatedMembers, myFactionTotalMembers, false);

            reportContent += `\n--- ${myFactionName} Members ---\n`;
            reportContent += `Top ${myTopActive.length} Most Active (based on intervals active):\n`;
            if (myTopActive.length === 0) reportContent += "  No active members found for this faction.\n";
            else myTopActive.forEach((m, i) => { reportContent += `  ${i + 1}. ${m.name} (Active in ${m.activeCount} of ${m.totalIntervalsTracked} intervals)\n`; });
            
            reportContent += `\nBottom ${myLeastActive.length} Least Active (based on intervals active):\n`;
            if (myLeastActive.length === 0) reportContent += "  No members found for this faction.\n";
            else myLeastActive.forEach((m, i) => { reportContent += `  ${i + 1}. ${m.name} (Active in ${m.activeCount} of ${m.totalIntervalsTracked} intervals)\n`; });


            // Process Enemy Faction
            const enemyAggregatedMembers = aggregateIndividualActivity('enemyFaction');
            const enemyTopActive = getTopBottomMembers(enemyAggregatedMembers, enemyFactionTotalMembers, true);
            const enemyLeastActive = getTopBottomMembers(enemyAggregatedMembers, enemyFactionTotalMembers, false);

            reportContent += `\n--- ${enemyFactionName} Members ---\n`;
            reportContent += `Top ${enemyTopActive.length} Most Active (based on intervals active):\n`;
            if (enemyTopActive.length === 0) reportContent += "  No active members found for this faction.\n";
            else enemyTopActive.forEach((m, i) => { reportContent += `  ${i + 1}. ${m.name} (Active in ${m.activeCount} of ${m.totalIntervalsTracked} intervals)\n`; });

            reportContent += `\nBottom ${enemyLeastActive.length} Least Active (based on intervals active):\n`;
            if (enemyLeastActive.length === 0) reportContent += "  No members found for this faction.\n";
            else enemyLeastActive.forEach((m, i) => { reportContent += `  ${i + 1}. ${m.name} (Active in ${m.activeCount} of ${m.totalIntervalsTracked} intervals)\n`; });
        }


        // --- 2. Chart Image Capture (if a specific member is selected) ---
        let myChartImageData = null;
        let enemyChartImageData = null;

        // Ensure charts are fully rendered before capturing, though updateCustomReportChart handles immediate updates
        // For robustness, a small timeout might be considered in a complex app, but often not necessary for Chart.js
        if (selectedMyMemberId && myFactionIndividualsChartCanvas) {
            myChartImageData = myFactionIndividualsChartCanvas.toDataURL('image/png');
        }
        if (selectedEnemyMemberId && enemyFactionIndividualsChartCanvas) {
            enemyChartImageData = enemyFactionIndividualsChartCanvas.toDataURL('image/png');
        }


        // --- 3. Trigger Downloads ---
        // Close the modal first for better UX
        closeReportOptionsModal(); // Close the new report options modal
        closeReportModal(); // Also close the "Session Complete" modal if still open

        // Download Text Report
        const textBlob = new Blob([reportContent], { type: 'text/plain' });
        const textUrl = URL.createObjectURL(textBlob);
        const textA = document.createElement('a');
        textA.href = textUrl;
        textA.download = 'faction_activity_custom_report.txt';
        document.body.appendChild(textA);
        textA.click();
        document.body.removeChild(textA);
        URL.revokeObjectURL(textUrl);

        // Download Chart Images (sequentially, might prompt user)
        if (myChartImageData) {
            // Give a tiny delay for browser to process first download, helps with prompts
            await new Promise(resolve => setTimeout(resolve, 500)); 
            const imgA = document.createElement('a');
            imgA.href = myChartImageData;
            imgA.download = `my_faction_member_${selectedMyMemberId}_chart.png`;
            document.body.appendChild(imgA);
            imgA.click();
            document.body.removeChild(imgA);
            // No URL.revokeObjectURL needed for data URLs
        }

        if (enemyChartImageData) {
            await new Promise(resolve => setTimeout(resolve, 500)); 
            const imgA = document.createElement('a');
            imgA.href = enemyChartImageData;
            imgA.download = `enemy_faction_member_${selectedEnemyMemberId}_chart.png`;
            document.body.appendChild(imgA);
            imgA.click();
            document.body.removeChild(imgA);
            // No URL.revokeObjectURL needed for data URLs
        }
        
        // Final status update
        updateStatus("Report generated.", 'success', "Custom report and charts downloaded.");
    }

    confirmClearBtn.addEventListener('click', () => {
        const skipConfirmation = localStorage.getItem(SKIP_CONFIRM_KEY) === 'true';
        if (skipConfirmation || confirm("Are you sure you want to clear all historical data? This cannot be undone.")) {
            enterStoppedState();
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            historicalData = [];
            destroyCharts();
            updateStatus("Ready.", 'info', "All data cleared.");
            factionNameDisplay.textContent = '';
            totalMembersMyFactionDisplay.textContent = '';
            populateIndividualComparisonDropdowns([], [], "My Faction", "Enemy Faction");
            closeReportModal();
        }
    });
	

    // Run Initial Setup
    init();
});