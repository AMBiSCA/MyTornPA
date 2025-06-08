document.addEventListener('DOMContentLoaded', function() {
    const intervalSelect = document.getElementById('interval');
    const currentIntervalDisplay = document.getElementById('currentInterval');
    const fetchActivityBtn = document.getElementById('fetchActivity');
    const stopActivityBtn = document.getElementById('stopActivity');
    const clearDataBtn = document.getElementById('clearData');
    const activityLogsDiv = document.getElementById('activityLogs');

    // New buttons for charts
    const trackOverallBtn = document.getElementById('trackOverall');
    const trackIndividualBtn = document.getElementById('trackIndividual');

    // Chart containers
    const overallChartsContainer = document.getElementById('overallCharts');
    const individualChartsContainer = document.getElementById('individualCharts');

    // Update current interval display when selection changes
    if (intervalSelect && currentIntervalDisplay) {
        intervalSelect.addEventListener('change', function() {
            currentIntervalDisplay.textContent = this.value + " minutes";
        });
        // Initialize display
        currentIntervalDisplay.textContent = intervalSelect.value + " minutes";
    }

    // Function to toggle chart container visibility
    function toggleChartVisibility(container, initFunction = null) {
        if (container.classList.contains('show')) {
            container.classList.remove('show');
        } else {
            // Hide other chart containers if they are open
            if (container === overallChartsContainer) {
                individualChartsContainer.classList.remove('show');
            } else if (container === individualChartsContainer) {
                overallChartsContainer.classList.remove('show');
            }
            container.classList.add('show');
            // If an initialization function is provided, call it
            if (initFunction && typeof initFunction === 'function') {
                initFunction();
            }
        }
    }

    // Button event listeners
    if (fetchActivityBtn) {
        fetchActivityBtn.addEventListener('click', () => {
            const myFaction = document.getElementById('myFaction') ? document.getElementById('myFaction').value : '';
            const enemyFaction = document.getElementById('enemyFaction') ? document.getElementById('enemyFaction').value : '';
            const intervalMinutes = intervalSelect ? intervalSelect.value : '30';

            logActivity(`Starting activity tracking with My Faction: ${myFaction}, Enemy: ${enemyFaction}, Interval: ${intervalMinutes} mins.`);
            // TODO: Implement actual call to Firebase Function to start scheduled tracking
            // This would send myFaction, enemyFaction, and intervalMinutes to your Firebase backend.
        });
    }

    if (stopActivityBtn) {
        stopActivityBtn.addEventListener('click', () => {
            logActivity("Stopping faction activity tracking...");
            // TODO: Implement actual call to Firebase Function to stop scheduled tracking
        });
    }

    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', () => {
            if (activityLogsDiv) {
                activityLogsDiv.innerHTML = "";
            }
            logActivity("Cleared activity data.", true); // Log to console only
            // TODO: Implement actual call to Firebase Function to clear data in Firebase
        });
    }

    // New chart toggle buttons
    if (trackOverallBtn) {
        trackOverallBtn.addEventListener('click', () => {
            toggleChartVisibility(overallChartsContainer, initOverallCharts);
        });
    }

    if (trackIndividualBtn) {
        trackIndividualBtn.addEventListener('click', () => {
            toggleChartVisibility(individualChartsContainer, initIndividualCharts);
        });
    }

    // Function to log messages to the activity log div
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

    // Placeholder for initializing Overall Charts
    let overallChart1Instance = null; // To store Chart.js instance for updates
    let overallChart2Instance = null;

    function initOverallCharts() {
        console.log("Initializing Overall Activity Charts...");
        // Destroy existing chart instances if they exist
        if (overallChart1Instance) overallChart1Instance.destroy();
        if (overallChart2Instance) overallChart2Instance.destroy();

        const ctx1 = document.getElementById('overallChart1').getContext('2d');
        overallChart1Instance = new Chart(ctx1, {
            type: 'line', // Example chart type
            data: {
                labels: ['Time 1', 'Time 2', 'Time 3'], // Placeholder labels
                datasets: [
                    {
                        label: 'My Faction Active',
                        data: [10, 12, 15], // Placeholder data
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    },
                    {
                        label: 'Enemy Faction Active',
                        data: [8, 10, 11], // Placeholder data
                        borderColor: 'rgb(255, 99, 132)',
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Allows flexible sizing
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: '#eee' }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: '#eee' }
                    }
                },
                plugins: {
                    legend: { labels: { color: '#eee' } }
                }
            }
        });

        const ctx2 = document.getElementById('overallChart2').getContext('2d');
        overallChart2Instance = new Chart(ctx2, {
            type: 'bar', // Another example chart type
            data: {
                labels: ['My Faction', 'Enemy Faction'],
                datasets: [
                    {
                        label: 'Online Status (Current)',
                        data: [15, 11], // Placeholder data
                        backgroundColor: ['rgb(75, 192, 192, 0.5)', 'rgb(255, 99, 132, 0.5)'],
                        borderColor: ['rgb(75, 192, 192)', 'rgb(255, 99, 132)'],
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: '#eee' }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: '#eee' }
                    }
                },
                plugins: {
                    legend: { labels: { color: '#eee' } }
                }
            }
        });
        // TODO: Fetch real data from Firebase and update charts
    }

    // Placeholder for initializing Individual Charts
    let individualChart1Instance = null;
    let individualChart2Instance = null;

    function initIndividualCharts() {
        console.log("Initializing Individual Activity Charts...");
        // Destroy existing chart instances if they exist
        if (individualChart1Instance) individualChart1Instance.destroy();
        if (individualChart2Instance) individualChart2Instance.destroy();

        // TODO: Populate faction1Users and faction2Users dropdowns from Firebase data
        const faction1UsersSelect = document.getElementById('faction1Users');
        const faction2UsersSelect = document.getElementById('faction2Users');

        // Example: Add placeholder options
        faction1UsersSelect.innerHTML = '<option value="">Select My Faction User</option><option value="user1">User One</option><option value="user2">User Two</option>';
        faction2UsersSelect.innerHTML = '<option value="">Select Enemy Faction User</option><option value="enemy1">Enemy User One</option><option value="enemy2">Enemy User Two</option>';


        const ctx3 = document.getElementById('individualChart1').getContext('2d');
        individualChart1Instance = new Chart(ctx3, {
            type: 'line',
            data: {
                labels: ['Time A', 'Time B', 'Time C'],
                datasets: [{
                    label: 'Selected My Faction Member Activity',
                    data: [5, 7, 6],
                    borderColor: 'rgb(0, 168, 255)', // Blue
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: '#eee' }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: '#eee' }
                    }
                },
                plugins: {
                    legend: { labels: { color: '#eee' } }
                }
            }
        });

        const ctx4 = document.getElementById('individualChart2').getContext('2d');
        individualChart2Instance = new Chart(ctx4, {
            type: 'bar',
            data: {
                labels: ['Online (1)', 'Offline (0)'],
                datasets: [{
                    label: 'User Status Distribution',
                    data: [1, 0], // Placeholder: 1 if online, 0 if offline
                    backgroundColor: ['rgba(0, 168, 255, 0.5)', 'rgba(200, 200, 200, 0.5)'],
                    borderColor: ['rgb(0, 168, 255)', 'rgb(200, 200, 200)'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: '#eee' }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.1)' },
                        ticks: { color: '#eee' }
                    }
                },
                plugins: {
                    legend: { labels: { color: '#eee' } }
                }
            }
        });

        // Add event listeners for dropdown changes to update charts
        faction1UsersSelect.addEventListener('change', updateIndividualCharts);
        faction2UsersSelect.addEventListener('change', updateIndividualCharts);

        // TODO: Fetch real data from Firebase and update charts
    }

    function updateIndividualCharts() {
        console.log("Updating Individual Activity Charts based on selection...");
        const selectedMyUser = document.getElementById('faction1Users').value;
        const selectedEnemyUser = document.getElementById('faction2Users').value;

        // In a real application, you would fetch data for the selected user(s)
        // from Firebase and then update the chart instances.
        console.log(`Selected My Faction User: ${selectedMyUser}`);
        console.log(`Selected Enemy Faction User: ${selectedEnemyUser}`);

        // Example: Update chart titles/data based on selection (placeholder)
        if (selectedMyUser) {
            individualChart1Instance.data.datasets[0].label = `${selectedMyUser} Activity`;
            individualChart1Instance.update();
        }
        // Similar logic for individualChart2Instance
    }

    // Initialize Firebase (Assuming firebase-init.js handles the actual initialization)
    // You typically don't need to do anything here if firebase-init.js sets up the app.
    // However, if you need to access specific Firebase services (like Firestore) here,
    // you would get references after Firebase is initialized.
});