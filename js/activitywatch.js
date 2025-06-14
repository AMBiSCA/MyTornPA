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
        o1.textContent = `-- ${myN || 'My Faction'} Member --`;
        compareUser1Select.appendChild(o1);
        const o2 = document.createElement('option');
        o2.value = '';
        o2.textContent = `-- ${enN || 'Enemy Faction'} Member --`;
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

    function populateReportMemberDropdowns() {
        reportMyFactionMemberSelect.innerHTML = '<option value="">-- Select My Faction Member --</option>';
        reportEnemyFactionMemberSelect.innerHTML = '<option value="">-- Select Enemy Faction Member --</option>';

        if (historicalData.length === 0) return;

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

    // *** MODIFIED FUNCTION ***
    // This now handles downloading the text report AND the chart images together.
    async function generateAndDownloadIndividualComparisonReport() {
        const myMemberId = reportMyFactionMemberSelect.value;
        const enemyMemberId = reportEnemyFactionMemberSelect.value;

        if (!myMemberId && !enemyMemberId) {
            alert("Please select at least one valid member to compare.");
            return;
        }

        // --- 1. Capture Chart Images ---
        // The charts are already updated by the 'change' event, so we just capture them.
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
        const addMemberDataToReport = (memberId, factionType) => {
            if (!memberId) return;

            const factionName = historicalData[0]?.[factionType].name || (factionType === 'myFaction' ? 'My Faction' : 'Enemy Faction');
            const memberDetails = historicalData[0]?.[factionType].individuals.find(m => m.id === memberId);
            
            if (memberDetails) {
                 reportContent += `--- ${factionName}: ${memberDetails.name} [${memberDetails.id}] ---\n`;
            } else {
                 reportContent += `--- ${factionName} Member [${memberId}] ---\n`;
            }

            let totalActiveIntervals = 0;
            let totalIntervalsTracked = 0;

            historicalData.forEach(record => {
                const member = record[factionType].individuals.find(m => m.id === memberId);
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

        addMemberDataToReport(myMemberId, 'myFaction');
        addMemberDataToReport(enemyMemberId, 'enemyFaction');
        
        // --- 3. Trigger All Downloads ---
        closeReportOptionsModal();

        // Download Text Report
        const blob = new Blob([reportContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'individual_comparison_report.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Download My Faction Chart (if it exists)
        if (myChartImageData) {
            await new Promise(resolve => setTimeout(resolve, 500)); // Delay for browser
            const imgLink = document.createElement('a');
            imgLink.href = myChartImageData;
            imgLink.download = `my_faction_member_${myMemberId}_chart.png`;
            document.body.appendChild(imgLink);
            imgLink.click();
            document.body.removeChild(imgLink);
        }

        // Download Enemy Faction Chart (if it exists)
        if (enemyChartImageData) {
            await new Promise(resolve => setTimeout(resolve, 500)); // Delay for browser
            const imgLink = document.createElement('a');
            imgLink.href = enemyChartImageData;
            imgLink.download = `enemy_faction_member_${enemyMemberId}_chart.png`;
            document.body.appendChild(imgLink);
            imgLink.click();
            document.body.removeChild(imgLink);
        }

        updateStatus("Comparison report and charts downloaded.", 'success');
    }

    // This is the main, comprehensive report generator.
    async function generateAndDownloadCustomReport() {
        // This function generates the general, comprehensive report.
        // For simplicity, we'll keep its chart downloading separate,
        // but it could be merged if needed in the future.
        const selectedMyMemberId = reportMyFactionMemberSelect.value;
        const selectedEnemyMemberId = reportEnemyFactionMemberSelect.value;
        
        let reportContent = `Faction Activity Custom Report\nGenerated: ${new Date().toLocaleString()}\n\n`;
        const myFactionName = historicalData[0].myFaction.name;
        const enemyFactionName = historicalData[0].enemyFaction.name;
        reportContent += `My Faction: ${myFactionName} | Enemy Faction: ${enemyFactionName}\n\n`;

        // ... you can add the rest of your comprehensive report logic here ...
        reportContent += "This is the comprehensive faction-wide report.\n";


        let myChartImageData = null;
        let enemyChartImageData = null;
        if (selectedMyMemberId && myFactionIndividualsChartCanvas) {
            myChartImageData = myFactionIndividualsChartCanvas.toDataURL('image/png');
        }
        if (selectedEnemyMemberId && enemyFactionIndividualsChartCanvas) {
            enemyChartImageData = enemyFactionIndividualsChartCanvas.toDataURL('image/png');
        }

        closeReportOptionsModal();

        const textBlob = new Blob([reportContent], { type: 'text/plain' });
        const textUrl = URL.createObjectURL(textBlob);
        const textA = document.createElement('a');
        textA.href = textUrl;
        textA.download = 'faction_activity_custom_report.txt';
        document.body.appendChild(textA);
        textA.click();
        document.body.removeChild(textA);
        URL.revokeObjectURL(textUrl);

        if (myChartImageData) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const imgA = document.createElement('a');
            imgA.href = myChartImageData;
            imgA.download = `my_faction_member_${selectedMyMemberId}_chart.png`;
            document.body.appendChild(imgA);
            imgA.click();
            document.body.removeChild(imgA);
        }

        if (enemyChartImageData) {
            await new Promise(resolve => setTimeout(resolve, 500));
            const imgA = document.createElement('a');
            imgA.href = enemyChartImageData;
            imgA.download = `enemy_faction_member_${selectedEnemyMemberId}_chart.png`;
            document.body.appendChild(imgA);
            imgA.click();
            document.body.removeChild(imgA);
        }
        
        updateStatus("Report generated.", 'success', "Custom report and charts downloaded.");
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
                lastRecord.enemyFaction.name
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
    
    clearDataButton.addEventListener('click', openReportModal);

    compareUser1Select.addEventListener('change', updateIndividualCharts);
    compareUser2Select.addEventListener('change', updateIndividualCharts);

    reportModalCloseBtn.addEventListener('click', closeReportModal);
    
    downloadReportBtn.addEventListener('click', openReportOptionsModal);

    reportOptionsModalCloseBtn.addEventListener('click', closeReportOptionsModal);

    // Main button for the big report
    generateCustomReportBtn.addEventListener('click', generateAndDownloadCustomReport);
    
    // Button for the specific individual comparison with chart downloads
    compareTwoIndividualsBtn.addEventListener('click', generateAndDownloadIndividualComparisonReport);

    reportMyFactionMemberSelect.addEventListener('change', () => updateCustomReportChart());
    reportEnemyFactionMemberSelect.addEventListener('change', () => updateCustomReportChart());
    
    skipConfirmCheckbox.addEventListener('change', (e) => {
        localStorage.setItem(SKIP_CONFIRM_KEY, e.target.checked);
    });
    
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