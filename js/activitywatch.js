// mysite/js/activitywatch.js

document.addEventListener('DOMContentLoaded', function() {
    const intervalSelect = document.getElementById('interval');
    const currentIntervalDisplay = document.getElementById('currentInterval');
    const fetchActivityBtn = document.getElementById('fetchActivity');
    const stopActivityBtn = document.getElementById('stopActivity');
    const clearDataBtn = document.getElementById('clearData');
    const activityLogsDiv = document.getElementById('activityLogs');

    // Update current interval display when selection changes
    if (intervalSelect && currentIntervalDisplay) {
        intervalSelect.addEventListener('change', function() {
            currentIntervalDisplay.textContent = this.value + " minutes";
        });
        // Initialize display
        currentIntervalDisplay.textContent = intervalSelect.value + " minutes";
    }

    // Button event listeners
    if (fetchActivityBtn) {
        fetchActivityBtn.addEventListener('click', () => {
            const profileId = document.getElementById('profileId') ? document.getElementById('profileId').value : '';
            const tornApiKey = document.getElementById('tornStatsApiKey') ? document.getElementById('tornStatsApiKey').value : '';
            const myFaction = document.getElementById('myFaction') ? document.getElementById('myFaction').value : '';
            const enemyFaction = document.getElementById('enemyFaction') ? document.getElementById('enemyFaction').value : '';
            const intervalMinutes = intervalSelect ? intervalSelect.value : '30';

            logActivity(`Workspaceing activity with Profile ID: ${profileId}, My Faction: ${myFaction}, Enemy: ${enemyFaction}, Interval: ${intervalMinutes} mins.`);
            // Placeholder for actual fetch logic
            // TODO: Implement actual API calls and activity tracking
        });
    }

    if (stopActivityBtn) {
        stopActivityBtn.addEventListener('click', () => {
            logActivity("Stopping faction activity tracking...");
            // Placeholder for actual stop logic
            // TODO: Clear any running intervals or processes
        });
    }

    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', () => {
            if (activityLogsDiv) {
                activityLogsDiv.innerHTML = "";
            }
            logActivity("Cleared activity data.", true); // Log to console only
        });
    }

    function logActivity(message, consoleOnly = false) {
        console.log(message);
        if (!consoleOnly && activityLogsDiv) {
            const logEntry = document.createElement('p');
            const timestamp = new Date().toLocaleTimeString();
            logEntry.textContent = `[${timestamp}] ${message}`;
            activityLogsDiv.appendChild(logEntry);
            activityLogsDiv.scrollTop = activityLogsDiv.scrollHeight; // Auto-scroll to bottom
        }
    }

    // --- REMOVED DUPLICATED HEADER/FOOTER UI SCRIPT ---
    // This logic is now solely handled by globalheader.js, which is loaded after this script.
});