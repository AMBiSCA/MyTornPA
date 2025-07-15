// js/market-pulse.js
// This script manages the Torn Market Pulse page. It waits for the Torn API Key
// to be provided by globalheader.js (which fetches it from Firebase).

document.addEventListener('DOMContentLoaded', () => {
    console.log('market-pulse.js: DOM content loaded. Waiting for API Key...');

    const BASE_API_URL_V2 = 'https://api.torn.com/v2';

    // Global State & Caches
    let allTornItems = []; // Cache for all Torn items (from torn/items)
    let currentChartInstance = null; // To store the Chart.js instance
    let historicalMarketData = {}; // Simulates historical data for chart. Key: itemId, Value: Array of {timestamp, price}
    let userTornApiKey = null; // Will hold the user's Torn API key

    // --- Utility Functions ---
    function showLoadingIndicator(message = 'Loading data, please wait...') {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.textContent = message;
            loadingIndicator.style.display = 'block';
        }
    }

    function hideLoadingIndicator() {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    }

    function displayErrorMessage(message) {
        const errorDisplay = document.getElementById('error-display');
        if (errorDisplay) {
            errorDisplay.textContent = `Error: ${message}`;
            errorDisplay.style.display = 'block';
        }
        hideLoadingIndicator(); // Always hide loading indicator on error
    }

    function clearMessages() {
        hideLoadingIndicator();
        const errorDisplay = document.getElementById('error-display');
        if (errorDisplay) {
            errorDisplay.style.display = 'none';
        }
    }

    function formatNumber(num) {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num);
    }

    // --- API Fetching Functions ---

    /**
     * Fetches a list of all Torn items.
     * Caches the result to avoid repeated API calls.
     */
    async function fetchAllTornItems() {
        if (allTornItems.length > 0) {
            return allTornItems; // Return cached data if available
        }

        clearMessages();
        showLoadingIndicator('Fetching Torn item list...');
        try {
            if (!userTornApiKey) {
                // This scenario should be rare if initialization logic is correct, but good to have
                throw new Error('Torn API key is not available for this request.');
            }
            const response = await fetch(`${BASE_API_URL_V2}/torn/?selections=items&key=${userTornApiKey}`);
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.error || 'Failed to fetch Torn items.');
            }

            allTornItems = Object.values(data.items); // Convert object to array for easier search
            console.log('All Torn items fetched:', allTornItems.length);
            return allTornItems;
        } catch (error) {
            console.error('Error fetching all Torn items:', error);
            displayErrorMessage(`Could not fetch Torn items: ${error.message}`);
            return [];
        } finally {
            hideLoadingIndicator();
        }
    }

    /**
     * Fetches current market listings for a specific item.
     * @param {number} itemId - The ID of the item.
     * @returns {Promise<object|null>} - Market data or null if error.
     */
    async function fetchItemMarket(itemId) {
        clearMessages();
        showLoadingIndicator(`Fetching market data for item ID ${itemId}...`);
        try {
            if (!userTornApiKey) {
                throw new Error('Torn API key is not available for this request.');
            }
            const response = await fetch(`${BASE_API_URL_V2}/market/${itemId}/itemmarket?key=${userTornApiKey}`);
            const data = await response.json();

            if (data.error) {
                throw new Error(data.error.error || `Failed to fetch market data for item ID ${itemId}.`);
            }
            console.log(`Market data for ${itemId}:`, data.itemmarket);
            return data.itemmarket;
        } catch (error) {
            console.error(`Error fetching market data for item ID ${itemId}:`, error);
            displayErrorMessage(`Could not fetch market data for item ID ${itemId}: ${error.message}`);
            return null;
        } finally {
            hideLoadingIndicator();
        }
    }

    // --- Charting Functions (using Chart.js) ---

    /**
     * Creates or updates the price trend chart using Chart.js.
     * Includes a simulation for historical data.
     * @param {object} itemData - The item data, including average_price and id.
     * @param {string} period - The time period for the chart ('24h', '7d', '30d', 'all').
     */
    function createOrUpdateChart(itemData, period = '7d') {
        const ctx = document.getElementById('priceTrendChart').getContext('2d');

        if (currentChartInstance) {
            currentChartInstance.destroy(); // Destroy existing chart instance
        }

        // --- HISTORICAL DATA SIMULATION START ---
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        const currentPrice = itemData.average_price || 0;

        // Initialize or update simulated historical data for this item
        if (!historicalMarketData[itemData.id] || historicalMarketData[itemData.id].length === 0) {
            historicalMarketData[itemData.id] = [];
            // Generate 30 days of initial simulated data points
            for (let i = 29; i >= 0; i--) {
                const pastTime = now - i * oneDay;
                // Simulate some variation around the current price
                const simulatedPrice = currentPrice * (1 + (Math.random() - 0.5) * 0.15); // +/- 7.5% variation
                historicalMarketData[itemData.id].push({ timestamp: pastTime, price: Math.max(1, Math.round(simulatedPrice)) });
            }
        } else {
            // Add the current price as a new data point if it's sufficiently new
            const lastDataPoint = historicalMarketData[itemData.id][historicalMarketData[itemData.id].length - 1];
            if (now - lastDataPoint.timestamp > oneDay / 4) { // Add new point if last one is older than 6 hours
                historicalMarketData[itemData.id].push({ timestamp: now, price: Math.round(currentPrice) });
                // Keep history size reasonable (e.g., last 31 days)
                historicalMarketData[itemData.id] = historicalMarketData[itemData.id].filter(dp => (now - dp.timestamp) < 31 * oneDay);
            }
        }

        // Filter data points based on the selected period
        let periodMs;
        switch (period) {
            case '24h': periodMs = oneDay; break;
            case '7d': periodMs = 7 * oneDay; break;
            case '30d': periodMs = 30 * oneDay; break;
            case 'all': periodMs = 31 * oneDay; break; // 'All time' uses our max simulated history
            default: periodMs = 7 * oneDay; break;
        }

        const periodStart = now - periodMs;
        let filteredData = historicalMarketData[itemData.id].filter(dp => dp.timestamp >= periodStart);

        // Ensure at least two points for the chart to draw a line, even if simulated data is sparse
        if (filteredData.length < 2) {
             filteredData = [
                { timestamp: periodStart, price: itemData.average_price || 0 },
                { timestamp: now, price: itemData.average_price || 0 }
             ];
             console.warn("Not enough historical data, using current price for a flat line segment.");
        }


        const labels = filteredData.map(dp => {
            const date = new Date(dp.timestamp);
            if (period === '24h') {
                return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            } else if (period === '7d' || period === '30d' || period === 'all') {
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
            return date.toLocaleString(); // Fallback
        });
        const prices = filteredData.map(dp => dp.price);
        // --- HISTORICAL DATA SIMULATION END ---

        currentChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${itemData.name} Price`,
                    data: prices,
                    borderColor: '#00a8ff', // Blue line
                    backgroundColor: 'rgba(0, 168, 255, 0.2)', // Light blue fill
                    tension: 0.3, // Smoother line
                    fill: true,
                    pointRadius: 3,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#00a8ff',
                    pointBorderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false, // Allows chart to fill container
                plugins: {
                    legend: {
                        display: false // No legend as we have only one dataset
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `Price: ${formatNumber(context.raw)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)' // Light grid lines
                        },
                        ticks: {
                            color: '#eee', // White tick labels
                            autoSkip: true,
                            maxTicksLimit: 10 // Limit number of ticks to avoid clutter
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#eee',
                            callback: function(value, index, ticks) {
                                return formatNumber(value); // Format Y-axis labels as currency
                            }
                        },
                        beginAtZero: false // Important for price charts to show true scale
                    }
                },
                layout: {
                    padding: {
                        left: 10,
                        right: 10,
                        top: 0,
                        bottom: 0
                    }
                }
            }
        });
    }

    /**
     * Updates the "Current Snapshot" metrics section.
     * @param {object} itemData - The market data for the item.
     * @param {string} period - The currently selected chart period (e.g., '24h', '7d').
     */
    function updateMetrics(itemData, period) {
        document.getElementById('current-avg-price').textContent = formatNumber(itemData.average_price || 0);

        let changeAmount = 0;
        let changePercent = 0;
        let changeIcon = '';
        let changeClass = 'neutral';

        const currentPrice = itemData.average_price || 0;
        const historicalPoints = historicalMarketData[itemData.id] || [];

        const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
        let referencePrice = null;

        for (let i = historicalPoints.length - 1; i >= 0; i--) {
            if (historicalPoints[i].timestamp <= twentyFourHoursAgo) {
                referencePrice = historicalPoints[i].price;
                break;
            }
        }

        if (referencePrice && currentPrice !== referencePrice) {
            changeAmount = currentPrice - referencePrice;
            changePercent = (changeAmount / referencePrice) * 100;

            if (changeAmount > 0) {
                changeIcon = '&#9650;'; // Up arrow
                changeClass = 'positive';
            } else if (changeAmount < 0) {
                changeIcon = '&#9660;'; // Down arrow
                changeClass = 'negative';
            }
        } else {
            changeIcon = '&#9679;'; // Dot for no change
            changeClass = 'neutral';
        }

        const changeElement = document.getElementById('24hr-change');
        changeElement.innerHTML = `${formatNumber(changeAmount)} (${changePercent.toFixed(1)}% <span class="${changeClass}">${changeIcon}</span>)`;
        changeElement.className = changeClass; // Set class for overall color

        const periodStartMs = Date.now() - (period === '24h' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 31) * 24 * 60 * 60 * 1000;
        const relevantData = historicalMarketData[itemData.id] ? historicalMarketData[itemData.id].filter(dp => dp.timestamp >= periodStartMs) : [];
        const pricesInPeriod = relevantData.map(dp => dp.price);
        const periodHigh = pricesInPeriod.length ? Math.max(...pricesInPeriod) : itemData.average_price;
        const periodLow = pricesInPeriod.length ? Math.min(...pricesInPeriod) : itemData.average_price;

        document.getElementById('period-high').textContent = formatNumber(periodHigh || 0);
        document.getElementById('period-low').textContent = formatNumber(periodLow || 0);

        const estimatedVolume = Math.floor(Math.random() * 5000) + 1000;
        document.getElementById('estimated-volume').textContent = `${estimatedVolume} units`;
    }

    /**
     * Displays a specific item's market data (chart and metrics).
     * @param {number} itemId - The ID of the item to display.
     * @param {string} [period='7d'] - The default period for the chart.
     */
    async function displayItemMarketData(itemId, period = '7d') {
        const itemMarketData = await fetchItemMarket(itemId);
        if (itemMarketData && itemMarketData.item) {
            const itemSearchInput = document.getElementById('item-search');
            if (itemSearchInput) {
                itemSearchInput.value = itemMarketData.item.name;
                itemSearchInput.dataset.itemId = itemId;
            }

            createOrUpdateChart(itemMarketData.item, period);
            updateMetrics(itemMarketData.item, period);

            document.querySelectorAll('.chart-filter-btn').forEach(button => {
                if (button.dataset.time === period) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            });
        } else {
            console.error("Failed to get item market data for display or item not found.");
        }
    }

    // --- Top Market Movers Functions ---

    /**
     * Fetches and displays the top market movers.
     * This simulates "top movers" as real-time tracking of movers requires a backend.
     */
    async function populateTopMovers() {
        const topMoversList = document.getElementById('top-movers-list');
        topMoversList.innerHTML = '<p style="text-align: center; color: #bbb;">Finding top market movers...</p>';

        const items = await fetchAllTornItems();
        if (!items || items.length === 0) {
            topMoversList.innerHTML = '<p style="text-align: center; color: #e74c3c;">Could not load top movers.</p>';
            return;
        }

        const popularItemNames = [
            "Xanax", "Energy Drink", "Can of Beer", "Empty Can", "Feathery Hotel Coupon",
            "Lion Plushie", "Teddy Bear", "Flower Lei", "Orchid", "Gold AK47",
            "Point Bag", "Drug Pack", "Medical Kit", "Bottle of Beer", "Brick", "Plank",
            "Sheep Plushie", "Stink Bomb", "Smoke Grenade", "Taser", "Flash Grenade"
        ];

        const popularItems = items.filter(item => popularItemNames.includes(item.name));
        const moverItems = [];

        for (const item of popularItems) {
            const marketData = await fetchItemMarket(item.id);
            if (marketData && marketData.item) {
                const currentPrice = marketData.item.average_price || 0;
                let simulatedChangeAmount = 0;
                let simulatedChangePercent = 0;

                const historicalPoints = historicalMarketData[item.id] || [];
                const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
                let referencePrice = null;

                for (let i = historicalPoints.length - 1; i >= 0; i--) {
                    if (historicalPoints[i].timestamp <= twentyFourHoursAgo) {
                        referencePrice = historicalPoints[i].price;
                        break;
                    }
                }

                if (referencePrice && currentPrice !== referencePrice) {
                    simulatedChangeAmount = currentPrice - referencePrice;
                    simulatedChangePercent = (simulatedChangeAmount / referencePrice) * 100;
                } else if (currentPrice > 0 && historicalPoints.length > 0) {
                    if (historicalPoints[0].price !== currentPrice) {
                        simulatedChangeAmount = currentPrice - historicalPoints[0].price;
                        simulatedChangePercent = (simulatedChangeAmount / historicalPoints[0].price) * 100;
                    }
                }

                moverItems.push({
                    id: item.id,
                    name: item.name,
                    average_price: currentPrice,
                    simulatedChangeAmount: simulatedChangeAmount,
                    simulatedChangePercent: simulatedChangePercent
                });
            }
        }

        moverItems.sort((a, b) => Math.abs(b.simulatedChangePercent) - Math.abs(a.simulatedChangePercent));

        const moversToDisplay = moverItems.slice(0, 8);

        topMoversList.innerHTML = '';

        if (moversToDisplay.length === 0) {
            topMoversList.innerHTML = '<p style="text-align: center; color: #bbb;">No prominent movers found right now.</p>';
            return;
        }

        moversToDisplay.forEach(mover => {
            const moverCard = document.createElement('div');
            moverCard.classList.add('mover-card');
            moverCard.dataset.itemId = mover.id;

            let changeClass = 'neutral';
            let changeIcon = '&#9679;';
            if (mover.simulatedChangePercent > 0) {
                changeClass = 'positive';
                changeIcon = '&#9650;';
            } else if (mover.simulatedChangePercent < 0) {
                changeClass = 'negative';
                changeIcon = '&#9660;';
            }

            moverCard.innerHTML = `
                <span class="mover-name">${mover.name}</span>
                <span class="mover-price">${formatNumber(mover.average_price)}</span>
                <span class="mover-change ${changeClass}">${mover.simulatedChangePercent.toFixed(1)}% ${changeIcon}</span>
            `;
            topMoversList.appendChild(moverCard);
        });
    }

    // --- Event Listeners ---
    const itemSearchInput = document.getElementById('item-search');
    if (itemSearchInput) {
        itemSearchInput.addEventListener('keypress', async (event) => {
            if (event.key === 'Enter') {
                const searchTerm = itemSearchInput.value.trim().toLowerCase();
                if (searchTerm) {
                    const foundItem = allTornItems.find(item => item.name.toLowerCase() === searchTerm);
                    if (foundItem) {
                        await displayItemMarketData(foundItem.id, '7d');
                    } else {
                        displayErrorMessage(`Item "${itemSearchInput.value}" not found.`);
                    }
                } else {
                    displayErrorMessage('Please enter an item name.');
                }
            }
        });
    }

    document.querySelectorAll('.chart-filter-btn').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.chart-filter-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const selectedPeriod = button.dataset.time;
            const currentItemId = document.getElementById('item-search').dataset.itemId;

            if (currentItemId) {
                displayItemMarketData(parseInt(currentItemId), selectedPeriod);
            } else {
                displayErrorMessage('Please select an item first (type in search or click a mover).');
            }
        });
    });

    const topMoversListElement = document.getElementById('top-movers-list');
    if (topMoversListElement) {
        topMoversListElement.addEventListener('click', async (event) => {
            const moverCard = event.target.closest('.mover-card');
            if (moverCard && moverCard.dataset.itemId) {
                const itemId = parseInt(moverCard.dataset.itemId);
                document.getElementById('item-search').dataset.itemId = itemId;
                await displayItemMarketData(itemId, '7d');
            }
        });
    }

    // --- Main Initialization Function for Market Pulse Page ---
    // This function will be called once the Torn API Key is ready.
    async function initializeMarketPulsePage() {
        showLoadingIndicator('Loading market data...');
        clearMessages(); // Ensure any previous API key errors are cleared

        await fetchAllTornItems();

        await populateTopMovers();

        if (allTornItems.length > 0) {
            const defaultItem = allTornItems.find(item => item.name === "Xanax") || allTornItems.find(item => item.name === "Feathery Hotel Coupon") || allTornItems[0];
            if (defaultItem) {
                document.getElementById('item-search').dataset.itemId = defaultItem.id;
                await displayItemMarketData(defaultItem.id, '7d');
            } else {
                displayErrorMessage('No suitable default item to display.');
            }
        } else {
            displayErrorMessage('Could not load Torn items for market analysis.');
        }

        hideLoadingIndicator();
    }

    // --- Start the API Key observation process ---
    // This will wait for window.currentUserTornApiKey to be set by globalheader.js
    async function waitForApiKey() {
        showLoadingIndicator('Waiting for user API key...');
        const maxAttempts = 40; // 40 attempts * 500ms = 20 seconds total wait
        let attempts = 0;

        while (!window.currentUserTornApiKey && attempts < maxAttempts) {
            console.log(`market-pulse.js: Waiting for window.currentUserTornApiKey. Attempt ${attempts + 1}/${maxAttempts}`);
            await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
            attempts++;
        }

        userTornApiKey = window.currentUserTornApiKey; // Assign the key

        if (userTornApiKey) {
            console.log('market-pulse.js: Torn API Key found! Proceeding with initialization.');
            initializeMarketPulsePage();
        } else {
            displayErrorMessage('Torn API Key not found. Please log in and ensure your API key is configured correctly in your profile settings.');
        }
    }

    // Kick off the waiting process
    waitForApiKey();
});