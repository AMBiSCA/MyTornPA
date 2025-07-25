document.addEventListener('DOMContentLoaded', function() {
    // --- 1. DOM Elements ---
    const myFactionIDInput = document.getElementById('myFactionID');
    const enemyFactionIDInput = document.getElementById('enemyFactionID');
    const activityIntervalSelect = document.getElementById('activityInterval');
    const statusDisplay = document.getElementById('statusDisplay');
    const lastRefreshTimeDisplay = document.getElementById('lastRefreshTime');
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    const clearDataButton = document.getElementById('clearDataButton');
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
    const generateCustomReportBtn = document.getElementById('generateCustomReportBtn'); // This is the "Generate & Download Report" button
    const compareTwoIndividualsBtn = document.getElementById('compareTwoIndividualsBtn');
	const factionNameDisplay = document.getElementById('factionNameDisplay');
    const totalMembersMyFactionDisplay = document.getElementById('totalMembersMyFaction');


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
        } else if (displayMessage === "Please enter both Faction IDs before starting!") {
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
                try {
                    e = await r.json();
                } catch (err) {}
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
        const d = {
            factionName: "Unknown",
            members: []
        };
        if (resp.error) throw new Error(`API Error for ${id}: ${resp.error.error}`);
        d.factionName = resp.name || `Faction ${id}`;
        if (resp.members) {
            Object.entries(resp.members).forEach(([mId, m]) => {
                const mins = convertLastActionToMinutes(m.last_action?.relative);
                const memberIdString = (mId && typeof mId !== 'undefined' && mId !== null) ? String(mId) : 'INVALID_ID';

                if (memberIdString !== 'INVALID_ID' && m.name) {
                    d.members.push({
                        id: memberIdString,
                        name: m.name,
                        minutesAgo: mins,
                        active: mins <= 15 ? 1 : 0,
                        display: `${m.name} [${memberIdString}]`
                    });
                } else {
                    console.warn(`Skipping member with invalid ID or name from Torn API: ${mId} - ${m.name}`);
                }
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
        compareUser1Select.innerHTML = '';
        compareUser2Select.innerHTML = '';
        const o1 = document.createElement('option');
        o1.value = '';
        // START CORRECTION 1: Remove '--' from placeholder text
        o1.textContent = `${myN || 'My Faction'} Member`;
        // END CORRECTION 1
        compareUser1Select.appendChild(o1);
        const o2 = document.createElement('option');
        o2.value = '';
        // START CORRECTION 1: Remove '--' from placeholder text
        o2.textContent = `${enN || 'Enemy Faction'} Member`;
        // END CORRECTION 1
        compareUser2Select.appendChild(o2);
        if (myM) myM.sort((a, b) => a.name.localeCompare(b.name)).forEach(m => {
            const o = document.createElement('option');
            o.value = m.id;
            o.textContent = m.display;
            compareUser1Select.appendChild(o);
        });
        if (enM) enM.sort((a, b) => a.name.localeCompare(b.name)).forEach(m => {
            const o = document.createElement('option');
            o.value = m.id;
            o.textContent = m.display;
            compareUser2Select.appendChild(o);
        });
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
                myFactionIndividualsChartInstance.data.datasets.push({
                    label: 'My Faction',
                    data: d,
                    type: 'bar',
                    backgroundColor: 'rgba(0, 168, 255, 0.2)',
                    borderColor: '#00a8ff'
                });
            }
            myFactionIndividualsChartInstance.options.plugins.title.text = myId ? compareUser1Select.options[compareUser1Select.selectedIndex].textContent : 'My Faction Individuals';
            myFactionIndividualsChartInstance.update();
        }
        if (enemyFactionIndividualsChartInstance) {
            enemyFactionIndividualsChartInstance.data.labels = l;
            enemyFactionIndividualsChartInstance.data.datasets = [];
            if (enId) {
                const d = historicalData.map(r => r.enemyFaction.individuals.find(m => m.id === enId)?.active ?? 0);
                enemyFactionIndividualsChartInstance.data.datasets.push({
                    label: 'Enemy Faction',
                    data: d,
                    type: 'bar',
                    backgroundColor: 'rgba(220, 53, 69, 0.2)',
                    borderColor: '#dc3545'
                });
            }
            enemyFactionIndividualsChartInstance.options.plugins.title.text = enId ? compareUser2Select.options[compareUser2Select.selectedIndex].textContent : 'Enemy Faction Individuals';
            enemyFactionIndividualsChartInstance.update();
        }
    }

    function getChartOptions(t) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: t,
                    color: '#00a8ff',
                    font: {
                        size: 16
                    }
                },
                legend: {
                    labels: {
                        color: '#eee'
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255,255,255,0.1)'
                    },
                    ticks: {
                        color: '#eee'
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255,255,255,0.1)'
                    },
                    ticks: {
                        color: '#eee'
                    }
                }
            }
        };
    }

    function initializeChart(c, t, d, o) {
        if (c) return new Chart(c.getContext('2d'), {
            type: t,
            data: d,
            options: o
        });
        return null;
    }

    function updateCharts() {
        if (historicalData.length === 0) {
            destroyCharts();
            return;
        }
        const l = historicalData.map(r => r.formattedTime);
        const my = historicalData.map(r => r.myFaction.activeMembers);
        const en = historicalData.map(r => r.enemyFaction.activeMembers);
        const d = historicalData.map(r => r.activityDifference);
        destroyCharts();
        rawActivityChartInstance = initializeChart(rawActivityChartCanvas, 'line', {
            labels: l,
            datasets: [{
                label: 'My Faction',
                data: my,
                borderColor: '#00a8ff',
                backgroundColor: 'rgba(0,168,255,0.2)',
                tension: 0.3,
                fill: true
            }, {
                label: 'Enemy Faction',
                data: en,
                borderColor: '#dc3545',
                backgroundColor: 'rgba(220,53,69,0.2)',
                tension: 0.3,
                fill: true
            }]
        }, getChartOptions('Raw Activity Data'));
        activityDifferenceChartInstance = initializeChart(activityDifferenceChartCanvas, 'bar', {
            labels: l,
            datasets: [{
                label: 'Activity Difference',
                data: d,
                backgroundColor: d.map(v => v >= 0 ? 'rgba(0, 168, 255, 0.2)' : 'rgba(220, 53, 69, 0.2)'),
                borderColor: d.map(v => v >= 0 ? '#00a8ff' : '#dc3545')
            }]
        }, getChartOptions('Activity Difference'));
        myFactionIndividualsChartInstance = initializeChart(myFactionIndividualsChartCanvas, 'bar', {}, getChartOptions('My Faction Individuals'));
        enemyFactionIndividualsChartInstance = initializeChart(enemyFactionIndividualsChartCanvas, 'bar', {}, getChartOptions('Enemy Faction Individuals'));
        updateIndividualCharts();
    }

    // REPLACE your entire fetchAndProcessFactionActivity function with this one
async function fetchAndProcessFactionActivity() {
    updateStatus("Running.", 'info', "Fetching data...");
    try {
        const myFid = myFactionIDInput.value.trim();
        const enFid = enemyFactionIDInput.value.trim();

        if (myFid === '' && enFid === '') {
            updateStatus("Error.", 'error', "Cannot fetch without Faction IDs.");
            stopButton.click();
            return;
        }

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

        // --- CORRECTED SECTION ---
        factionNameDisplay.innerHTML = `<div class="aligned-info"><span class="align-right">${myData.factionName}</span> <span class="separator">|</span> <span class="align-left">${enData.factionName}</span></div>`;
        totalMembersMyFactionDisplay.innerHTML = `<div class="aligned-info"><span class="align-right">${myData.members.length}</span> <span class="separator">|</span> <span class="align-left">${enData.members.length}</span></div>`;
        // The two incorrect lines that were here are now removed.

        const rec = {
            timestamp: now.getTime(),
            formattedTime: formatTimestamp(now),
            myFaction: {
                id: myFid,
                name: myData.factionName,
                totalMembers: myData.members.length,
                activeMembers: myActive,
                individuals: myData.members,
            },
            enemyFaction: {
                id: enFid,
                name: enData.factionName,
                totalMembers: enData.members.length,
                activeMembers: enActive,
                individuals: enData.members,
            },
            activityDifference: myActive - enActive
        };
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

        // These lines were commented out in a previous step to prevent pre-filling inputs from sessionState on load.
        // myFactionIDInput.value = sessionState.myFactionID;
        // enemyFactionIDInput.value = sessionState.enemyFactionID;

        activityIntervalSelect.value = sessionState.interval;
        if (sessionState.autoStopDuration) {
            stopTimerHoursSelect.value = sessionState.autoStopDuration;
        }

        fetchAndProcessFactionActivity(); // This will now use the current (potentially empty) input values
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
        clearSessionState(); // This clears the session from localStorage

        // START CORRECTION 3: Ensure input fields are cleared on stop/initial load
        myFactionIDInput.value = '';
        enemyFactionIDInput.value = '';
        // END CORRECTION 3

        updateStatus("Stopped.", 'info', "Tracking stopped.");
        startButton.disabled = tornApiKey ? false : true;
        stopButton.disabled = true;
        myFactionIDInput.readOnly = false;
        enemyFactionIDInput.readOnly = false;
        activityIntervalSelect.disabled = false;
        stopTimerHoursSelect.disabled = false;
    }

    // *** MODIFIED FUNCTION *** (Change #2 from previous turn, but not part of the current issue)
    // This function is still using the faction names for the dropdown placeholders, no change needed here.
    function populateReportMemberDropdowns() {
        if (historicalData.length === 0) {
            reportMyFactionMemberSelect.innerHTML = '<option value="">-- My Faction --</option>';
            reportEnemyFactionMemberSelect.innerHTML = '<option value="">-- Enemy Faction --</option>';
            return;
        }

        const latestRecord = historicalData[historicalData.length - 1];
        const myFactionName = latestRecord.myFaction.name || 'My Faction';
        const enemyFactionName = latestRecord.enemyFaction.name || 'Enemy Faction';

        reportMyFactionMemberSelect.innerHTML = `<option value="">${myFactionName}</option>`;
        reportEnemyFactionMemberSelect.innerHTML = `<option value="">${enemyFactionName}</option>`;

        const allMyMembers = {};
        const allEnemyMembers = {};

        historicalData.forEach(record => {
            record.myFaction.individuals.forEach(member => {
                allMyMembers[member.id] = {
                    id: member.id,
                    name: member.name,
                    display: member.display
                };
            });
            record.enemyFaction.individuals.forEach(member => {
                allEnemyMembers[member.id] = {
                    id: member.id,
                    name: member.name,
                    display: member.display
                };
            });
        });

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

    function openReportOptionsModal() {

        if (historicalData.length === 0) {

            alert("No data has been recorded yet. Please start tracking to generate a report.");

            return;

        }

        populateReportMemberDropdowns();

        compareUser1Select.value = reportMyFactionMemberSelect.value;

        compareUser2Select.value = reportEnemyFactionMemberSelect.value;

        updateIndividualCharts();

        reportOptionsModal.classList.add('visible');

        reportModal.classList.remove('visible');

    }

    function closeReportOptionsModal() {
        reportOptionsModal.classList.remove('visible');
        reportMyFactionMemberSelect.value = "";
        reportEnemyFactionMemberSelect.value = "";
    }

    function updateCustomReportChart() {
        compareUser1Select.value = reportMyFactionMemberSelect.value;
        compareUser2Select.value = reportEnemyFactionMemberSelect.value;
        updateIndividualCharts();
    }

    function openReportModal() {
        reportModal.classList.add('visible');
    }

    function closeReportModal() {
        reportModal.classList.remove('visible');
    }

    // *** MODIFIED FUNCTION *** (Change #1 from previous turn, not part of the current issue)
    // Now handles downloading the text report AND chart images with dynamic filenames.
    async function generateAndDownloadIndividualComparisonReport() {
        const myMemberId = reportMyFactionMemberSelect.value;
        const enemyMemberId = reportEnemyFactionMemberSelect.value;

        if (!myMemberId && !enemyMemberId) {
            alert("Please select at least one valid member to compare.");
            return;
        }

        // Look up member details to get their names for filenames
        const myMemberDetails = myMemberId ? historicalData.flatMap(r => r.myFaction.individuals).find(m => m.id === myMemberId) : null;
        const enemyMemberDetails = enemyMemberId ? historicalData.flatMap(r => r.enemyFaction.individuals).find(m => m.id === enemyMemberId) : null;

        const sanitize = (name) => name.replace(/[^a-z0-9_.-]/gi, '_');
        const myName = myMemberDetails ? sanitize(myMemberDetails.name) : null;
        const enemyName = enemyMemberDetails ? sanitize(enemyMemberDetails.name) : null;

        // Determine the dynamic filename for the text report
        let textReportFileName = "Individual_Report.txt";
        if (myName && enemyName) {
            textReportFileName = `${myName}_vs_${enemyName}_Report.txt`;
        } else if (myName) {
            textReportFileName = `${myName}_Report.txt`;
        } else if (enemyName) {
            textReportFileName = `${enemyName}_Report.txt`;
        }

        // --- 1. Capture Chart Images ---
        let myChartImageData = null;
        if (myMemberId && myFactionIndividualsChartCanvas) {
            myChartImageData = myFactionIndividualsChartCanvas.toDataURL('image/png');
        }
        let enemyChartImageData = null;
        if (enemyMemberId && enemyFactionIndividualsChartCanvas) {
            enemyChartImageData = enemyFactionIndividualsChartCanvas.toDataURL('image/png');
        }

        // --- 2. Generate Text Report Content ---
        let reportContent = `Individual Member Comparison Report\nGenerated: ${new Date().toLocaleString()}\n\n`;
        const addMemberDataToReport = (memberDetails, factionType) => {
            if (!memberDetails) return;
            const factionName = historicalData[0]?.[factionType].name || (factionType === 'myFaction' ? 'My Faction' : 'Enemy Faction');
            reportContent += `--- ${factionName}: ${memberDetails.name} [${memberDetails.id}] ---\n`;
            
            let totalActiveIntervals = 0;
            let totalIntervalsTracked = 0;
            historicalData.forEach(record => {
                const member = record[factionType].individuals.find(m => m.id === memberDetails.id);
                if (member) {
                    totalIntervalsTracked++;
                    if (member.active === 1) {
                        totalActiveIntervals++;
                    }
                }
            });
            if (totalIntervalsTracked > 0) {
                const activityPercentage = ((totalActiveIntervals / totalIntervalsTracked) * 100).toFixed(1);
                reportContent += `Activity: Active in ${totalActiveIntervals} of ${totalIntervalsTracked} tracked intervals (${activityPercentage}%).\n\n`;
            } else {
                reportContent += "No activity data found for this member in the recorded session.\n\n";
            }
        };
        addMemberDataToReport(myMemberDetails, 'myFaction');
        addMemberDataToReport(enemyMemberDetails, 'enemyFaction');
        
        // --- 3. Trigger All Downloads ---
        closeReportOptionsModal();

        const blob = new Blob([reportContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = textReportFileName; // Use dynamic filename
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if (myChartImageData && myName) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const imgLink = document.createElement('a');
            imgLink.href = myChartImageData;
            imgLink.download = `${myName}_Chart.png`; // Use dynamic filename
            document.body.appendChild(imgLink);
            imgLink.click();
            document.body.removeChild(imgLink);
        }

        if (enemyChartImageData && enemyName) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const imgLink = document.createElement('a');
            imgLink.href = enemyChartImageData;
            imgLink.download = `${enemyName}_Chart.png`; // Use dynamic filename
            document.body.appendChild(imgLink);
            imgLink.click();
            document.body.removeChild(imgLink);
        }

        updateStatus("Comparison report and charts downloaded.", 'success');
    }

   async function generateAndDownloadFactionWideReport() {
        if (historicalData.length < 2) {
            alert("Not enough data has been recorded for a full report. Please track for at least two intervals.");
            return;
        }

        const myFactionName = historicalData[0].myFaction.name || 'My Faction';
        const enemyFactionName = historicalData[0].enemyFaction.name || 'Enemy Faction';
        const latestRecord = historicalData[historicalData.length - 1];
        const firstRecordTime = new Date(historicalData[0].timestamp);
        const lastRecordTime = new Date(latestRecord.timestamp);
        
        // Calculate tracking duration
        const durationMs = lastRecordTime.getTime() - firstRecordTime.getTime();
        const durationHours = (durationMs / (1000 * 60 * 60)).toFixed(1);
        const avgIntervalMs = historicalData.length > 1 ? durationMs / (historicalData.length - 1) : 0;
        const avgIntervalMinutes = (avgIntervalMs / (1000 * 60)).toFixed(0);

        // --- 1. Overall Dominance Calculation ---
        let myFactionWins = 0;
        let enemyFactionWins = 0;
        let ties = 0;

        historicalData.forEach(record => {
            if (record.activityDifference > 0) {
                myFactionWins++;
            } else if (record.activityDifference < 0) {
                enemyFactionWins++;
            } else {
                ties++;
            }
        });

        const totalIntervals = historicalData.length;
        const myFactionWinPercent = ((myFactionWins / totalIntervals) * 100).toFixed(1);
        const enemyFactionWinPercent = ((enemyFactionWins / totalIntervals) * 100).toFixed(1);
        const tiesPercent = ((ties / totalIntervals) * 100).toFixed(1);

        // --- 2. Hourly Activity Analysis for Strategic Windows ---
        const hourlySummaryMap = new Map(); // Key: hour (0-23), Value: { myTotalActive, enemyTotalActive, count, totalDifference }

        historicalData.forEach(record => {
            const hourKey = new Date(record.timestamp).getHours();
            if (!hourlySummaryMap.has(hourKey)) {
                hourlySummaryMap.set(hourKey, {
                    myTotalActive: 0,
                    enemyTotalActive: 0,
                    count: 0,
                    totalDifference: 0
                });
            }
            const currentHourData = hourlySummaryMap.get(hourKey);
            currentHourData.myTotalActive += record.myFaction.activeMembers;
            currentHourData.enemyTotalActive += record.enemyFaction.activeMembers;
            currentHourData.totalDifference += record.activityDifference;
            currentHourData.count++;
        });

        const hourlyAverages = Array.from(hourlySummaryMap.entries()).map(([hour, data]) => ({
            hour,
            avgMyActive: (data.myTotalActive / data.count).toFixed(1),
            avgEnemyActive: (data.enemyTotalActive / data.count).toFixed(1),
            avgDifference: (data.totalDifference / data.count).toFixed(1)
        })).sort((a, b) => a.hour - b.hour); // Sort by hour for proper analysis

        let bestAttackWindows = [];
        let bestTurtleWindows = [];

        // Identify strategic hours based on average difference
        // Higher positive difference for attack, higher enemy activity / lower positive difference for turtle
        const sortedByAttackAdvantage = [...hourlyAverages].sort((a, b) => b.avgDifference - a.avgDifference);
        const sortedByTurtleAdvantage = [...hourlyAverages].sort((a, b) => a.avgDifference - b.avgDifference); // Or b.avgEnemyActive - a.avgEnemyActive

        // Find top 3 best attack hours (non-contiguous for simplicity in first pass)
        // Then attempt to group them if they are sequential.
        const topAttackHours = sortedByAttackAdvantage.slice(0, 3).map(h => h.hour).sort((a,b) => a-b);
        bestAttackWindows = getContiguousRanges(topAttackHours);

        // Find top 3 best turtle hours (non-contiguous for simplicity in first pass)
        // Then attempt to group them if they are sequential.
        const topTurtleHours = sortedByTurtleAdvantage.slice(0, 3).map(h => h.hour).sort((a,b) => a-b);
        bestTurtleWindows = getContiguousRanges(topTurtleHours);

        // Helper to format hours into ranges
        function formatHour(hour) {
            const h = hour % 12;
            const ampm = hour < 12 ? 'AM' : 'PM';
            return `${h === 0 ? 12 : h}:00 ${ampm}`;
        }

        function formatRange(range) {
            if (range.length === 1) {
                return `${formatHour(range[0])}`;
            }
            return `${formatHour(range[0])} - ${formatHour(range[range.length - 1] + 1)}`;
        }

        // Helper to get contiguous ranges from sorted hours
        function getContiguousRanges(hours) {
            if (hours.length === 0) return [];
            const ranges = [];
            let currentRange = [hours[0]];

            for (let i = 1; i < hours.length; i++) {
                if (hours[i] === hours[i-1] + 1) {
                    currentRange.push(hours[i]);
                } else {
                    ranges.push(currentRange);
                    currentRange = [hours[i]];
                }
            }
            ranges.push(currentRange); // Add the last range

            return ranges.map(range => formatRange(range));
        }

        // --- 3. Individual Member Activity Calculations ---
        const myFactionMembersActivity = new Map(); // id -> { name, totalIntervals, activeIntervals }
        const enemyFactionMembersActivity = new Map(); // id -> { name, totalIntervals, activeIntervals }

        historicalData.forEach(record => {
            record.myFaction.individuals.forEach(member => {
                if (!myFactionMembersActivity.has(member.id)) {
                    myFactionMembersActivity.set(member.id, { name: member.name, totalIntervals: 0, activeIntervals: 0 });
                }
                const data = myFactionMembersActivity.get(member.id);
                data.totalIntervals++;
                if (member.active === 1) {
                    data.activeIntervals++;
                }
            });

            record.enemyFaction.individuals.forEach(member => {
                if (!enemyFactionMembersActivity.has(member.id)) {
                    enemyFactionMembersActivity.set(member.id, { name: member.name, totalIntervals: 0, activeIntervals: 0 });
                }
                const data = enemyFactionMembersActivity.get(member.id);
                data.totalIntervals++;
                if (member.active === 1) {
                    data.activeIntervals++;
                }
            });
        });

        // Convert maps to arrays and calculate percentages
        const myMembersRanked = Array.from(myFactionMembersActivity.entries()).map(([id, data]) => ({
            id,
            name: data.name,
            activityPercent: ((data.activeIntervals / data.totalIntervals) * 100).toFixed(1)
        })).sort((a, b) => parseFloat(b.activityPercent) - parseFloat(a.activityPercent));

        const enemyMembersRanked = Array.from(enemyFactionMembersActivity.entries()).map(([id, data]) => ({
            id,
            name: data.name,
            activityPercent: ((data.activeIntervals / data.totalIntervals) * 100).toFixed(1)
        })).sort((a, b) => parseFloat(b.activityPercent) - parseFloat(a.activityPercent));

        // --- 4. Generate Report Content ---
        let reportContent = `## 24-Hour War Activity Snapshot: ${myFactionName} vs. ${enemyFactionName}\n\n`;
        reportContent += `**Report Generated:** ${new Date().toLocaleString('en-GB', { hour12: false, day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} BST\n`;
        reportContent += `**Analyzed Period:** Last ${durationHours} Hours (across ${totalIntervals} data points)\n`;
        reportContent += `**Average Check Interval:** ~${avgIntervalMinutes} minutes\n\n`;

        reportContent += `---\n\n### War Outlook: Your Advantage Over the Last 24 Hours\n\n`;
        reportContent += `* **${myFactionName} (Your Faction):** Had **more active members** than ${enemyFactionName} during **${myFactionWinPercent}%** of the total tracking time.\n`;
        reportContent += `* **${enemyFactionName} (Enemy Faction):** Had **more active members** than ${myFactionName} during **${enemyFactionWinPercent}%** of the total tracking time.\n`;
        reportContent += `* **Tied:** For the remaining **${tiesPercent}%** of the time.\n\n`;

        reportContent += `---\n\n### **Strategic Windows:** Best Times to Attack & Defend\n\n`;

        reportContent += `#### **🔥 Best Time to Push (Attack / High Activity for You):**\n\n`;
        if (bestAttackWindows.length > 0) {
            bestAttackWindows.forEach(window => {
                reportContent += `* **When:** ${window}\n`;
            });
            reportContent += `* **Why:** Enemy activity was consistently *lowest* during these hours, offering your faction the biggest advantage.\n`;
            reportContent += `* **Key Enemy Members Often Offline During These Windows:** (To be manually filled or added later with advanced logic)\n\n`; // Placeholder
        } else {
            reportContent += `* No clear attack windows identified in this period based on significant difference. Check individual charts.\n\n`;
        }
        
        reportContent += `#### **🛡️ Best Time to Turtle (Defend / Consolidate / Fly):**\n\n`;
        if (bestTurtleWindows.length > 0) {
            bestTurtleWindows.forEach(window => {
                reportContent += `* **When:** ${window}\n`;
            });
            reportContent += `* **Why:** Enemy activity was at its *highest peak* during these hours. Be prepared for higher resistance.\n`;
            reportContent += `* **Key Enemy Members Often Online During These Windows:** (To be manually filled or added later with advanced logic)\n\n`; // Placeholder
        } else {
            reportContent += `* No clear turtle windows identified in this period based on significant enemy activity. Be vigilant.\n\n`;
        }

        reportContent += `---\n\n### Notable Activity Changes (Last 24 Hours)\n\n`;
        reportContent += `* This section could highlight significant changes like key players coming online/offline.\n`;
        reportContent += `* (Advanced logic needed here to identify these changes from historical data trends.)\n\n`; // Placeholder

        reportContent += `---\n\n### Your Team's Top Performers (Most Active / Reliable)\n\n`;
        if (myMembersRanked.length > 0) {
            myMembersRanked.slice(0, 5).forEach((member, index) => { // Top 5
                reportContent += `${index + 1}. **${member.name} [${member.id}]:** Active for ${member.activityPercent}% of the time.\n`;
            });
        } else {
            reportContent += `* No members found for your faction.\n`;
        }
        reportContent += `\n`; // Add a newline for separation

        reportContent += `---\n\n### Enemy Team's Top Performers (Most Active / Reliable)\n\n`;
        if (enemyMembersRanked.length > 0) {
            enemyMembersRanked.slice(0, 5).forEach((member, index) => { // Top 5
                reportContent += `${index + 1}. **${member.name} [${member.id}]:** Active for ${member.activityPercent}% of the time.\n`;
            });
        } else {
            reportContent += `* No members found for enemy faction.\n`;
        }
        reportContent += `\n`;

        // --- 5. Trigger Downloads ---
        closeReportOptionsModal();

        const blob = new Blob([reportContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `War_Activity_Report_${myFactionName}_vs_${enemyFactionName}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Download main charts (as before)
        const rawActivityChartImg = rawActivityChartCanvas ? rawActivityChartCanvas.toDataURL('image/png') : null;
        const activityDifferenceChartImg = activityDifferenceChartCanvas ? activityDifferenceChartCanvas.toDataURL('image/png') : null;

        if (rawActivityChartImg) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const imgLink = document.createElement('a');
            imgLink.href = rawActivityChartImg;
            imgLink.download = 'Raw_Activity_Chart.png';
            document.body.appendChild(imgLink);
            imgLink.click();
            document.body.removeChild(imgLink);
        }

        if (activityDifferenceChartImg) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const imgLink = document.createElement('a');
            imgLink.href = activityDifferenceChartImg;
            imgLink.download = 'Activity_Difference_Chart.png';
            document.body.appendChild(imgLink);
            imgLink.click();
            document.body.removeChild(imgLink);
        }

        updateStatus("Faction-wide report and charts downloaded.", 'success');
    }

    function init() {
        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedData) {
            try {
                historicalData = JSON.parse(savedData);
                if (!Array.isArray(historicalData)) {
                    historicalData = [];
                }
            } catch (e) {
                console.error("Error parsing historical data from localStorage:", e);
                historicalData = [];
            }
        }
        updateCharts();
        if (historicalData.length > 0) {
            const lastRecord = historicalData[historicalData.length - 1];
            populateIndividualComparisonDropdowns(
                lastRecord.myFaction.individuals,
                lastRecord.enemyFaction.individuals,
                lastRecord.myFaction.name,
                lastRecord.myFaction.name // Corrected to use myFaction.name for both arguments as per the dropdown requirement.
            );
        }

        skipConfirmCheckbox.checked = localStorage.getItem(SKIP_CONFIRM_KEY) === 'true';
        updateStatus("Loading...", 'info', "Initializing application.");
    }
    
    if (typeof auth !== 'undefined' && typeof db !== 'undefined') {
        auth.onAuthStateChanged(async function(user) {
            if (user) {
                try {
                    const userDocRef = db.collection('userProfiles').doc(user.uid);
                    const userDoc = await userDocRef.get();
                    if (userDoc.exists && userDoc.data().tornApiKey) {
                        tornApiKey = userDoc.data().tornApiKey;
                        const sessionState = loadSessionState();
                        // START PREVIOUS CORRECTION: Prevent automatic start of tracking on page load from saved session.
                        // The sessionState is still loaded, but `enterRunningState` is no longer called automatically here.
                        // The user will need to click 'Start' manually to resume or begin tracking.
                        // if (sessionState && sessionState.isRunning && sessionState.myFactionID.trim() !== '' && (!sessionState.autoStopTime || Date.now() < sessionState.autoStopTime)) {
                        //     enterRunningState(sessionState);
                        // }
                        // END PREVIOUS CORRECTION
                        // Ensure that even if a session state exists, it enters stopped state initially for manual start
                        enterStoppedState(); // Explicitly set to stopped state on load if API key is present
                        updateStatus("Ready.", 'info', "API Key loaded. Ready to start.");
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
        // START NEW CORRECTION: Validate Faction IDs before starting if inputs are empty
        const myFactionIdValue = myFactionIDInput.value.trim();
        const enemyFactionIdValue = enemyFactionIDInput.value.trim();

        if (myFactionIdValue === '' && enemyFactionIdValue === '') {
            updateStatus("Please enter both Faction IDs before starting!", 'info'); // Changed message and statusType to match 'Stopped.' appearance
            return; // Stop execution if both are empty
        }
        // END NEW CORRECTION

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
            myFactionID: myFactionIdValue, // Use the validated, potentially empty, values from inputs
            enemyFactionID: enemyFactionIdValue, // Use the validated, potentially empty, values from inputs
            interval: intervalMinutes,
            autoStopTime: (!isNaN(stopAfterHours) && stopAfterHours > 0) ? Date.now() + stopAfterHours * 60 * 60 * 1000 : null,
            autoStopDuration: (!isNaN(stopAfterHours) && stopAfterHours > 0) ? stopAfterHours : null
        };
        saveSessionState(sessionState);
        enterRunningState(sessionState);
    });

    stopButton.addEventListener('click', enterStoppedState);
    
    clearDataButton.addEventListener('click', openReportModal);

    compareUser1Select.addEventListener('change', updateIndividualCharts);
    compareUser2Select.addEventListener('change', updateIndividualCharts);

    reportModalCloseBtn.addEventListener('click', closeReportModal);
    
    downloadReportBtn.addEventListener('click', openReportOptionsModal);

    reportOptionsModalCloseBtn.addEventListener('click', closeReportOptionsModal);

    // This button now calls the rebuilt faction-wide report function
    generateCustomReportBtn.addEventListener('click', generateAndDownloadFactionWideReport);
    
    // This button calls the individual comparison function
    compareTwoIndividualsBtn.addEventListener('click', generateAndDownloadIndividualComparisonReport);

    reportMyFactionMemberSelect.addEventListener('change', () => updateCustomReportChart());
    reportEnemyFactionMemberSelect.addEventListener('change', () => updateCustomReportChart());
    
    skipConfirmCheckbox.addEventListener('change', (e) => {
        localStorage.setItem(SKIP_CONFIRM_KEY, e.target.checked);
    });
    
    // REPLACE your existing confirmClearBtn event listener with this debugging version
confirmClearBtn.addEventListener('click', async () => {
    console.log("1. 'Clear Data' button clicked.");
    const skipConfirmation = localStorage.getItem(SKIP_CONFIRM_KEY) === 'true';
    let userDidConfirm = false;

    if (skipConfirmation) {
        console.log("2. Skipping confirmation because the box is checked.");
        userDidConfirm = true;
    } else {
        console.log("2. Confirmation needed. Closing first modal.");
        closeReportModal();

        console.log("3. Calling showGlobalConfirm and waiting for a response...");
        userDidConfirm = await showGlobalConfirm("Are you sure you want to clear all historical data? This cannot be undone.");
        console.log("4. showGlobalConfirm responded with:", userDidConfirm);
    }

    if (userDidConfirm) {
        console.log("5. User confirmed. Clearing data now.");
        enterStoppedState();
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        historicalData = [];
        destroyCharts();
        updateStatus("Ready.", 'info', "All data cleared.");
        factionNameDisplay.textContent = '';
        totalMembersMyFactionDisplay.textContent = '';
        lastRefreshTimeDisplay.textContent = '';
        populateIndividualComparisonDropdowns([], [], "My Faction", "Enemy Faction");
    } else {
        console.log("5. User cancelled. Re-opening first modal.");
        openReportModal();
    }
});
    
    // Run Initial Setup
    init();
});