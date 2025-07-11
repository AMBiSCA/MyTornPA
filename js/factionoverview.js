// factionoverview.js - Comprehensive JavaScript for the Faction Overview Page

// =====================================================================================================================
// GLOBAL VARIABLES & FIREBASE INITIALIZATION
// These variables store data, DOM references, and application state.
// They are declared at the top of the file for easy identification and management.
// =====================================================================================================================

// Firebase (initialized in firebase-init.js, made globally available)
// Assuming 'db' and 'auth' are accessible from 'firebase-init.js'
// const db = firebase.firestore();
// const auth = firebase.auth();

let factionOverviewUserApiKey = null; // Stores the logged-in user's personal Torn API key (if set)
let factionOverviewGlobalYourFactionID = null; // Stores the user's faction ID

// --- NEW GLOBAL VARIABLE: Stores the central API key for faction-wide data ---
let primaryFactionApiKey = null; // This key will be used for faction-level API calls
// --- END NEW ---

let factionOverviewPageContentContainer = null; // Main container for all dynamic content on this page

let currentActiveSubTab = 'armory-withdrawals'; // Tracks which sub-tab is currently active (default to Armory Withdrawals)

// Data storage for raw API responses (recent 100 items for each category)
// These will be arrays of objects
let armoryWithdrawalsData = [];
let armoryDepositsData = [];
let fundDepositsData = [];
let fundWithdrawalsData = [];
let crimeData = [];

// Data storage for aggregated historical data (for Logistics and Oversight)
let historicalArmoryLogs = []; // Stores all historical armory actions (withdrawals/deposits)
let historicalFundLogs = []; // Stores all historical fund movements (deposits/withdrawals)

// Chart.js instances (if applicable for Logistics/Oversight)
let logisticsUsageChartInstance = null;
let oversightActivityChartInstance = null;
let oversightFundTrendChartInstance = null;

// Timers for automatic data refresh
let factionOverviewRefreshInterval = null; // Main interval for API fetches

// Access control related variables
let designatedBankers = []; // Stores an array of Torn Player IDs for designated bankers


// =====================================================================================================================
// DOM ELEMENT GETTERS
// Selectors for elements in factionoverview.html (or elements that JS will dynamically create)
// =====================================================================================================================

let factionOverviewSubTabsContainer = null;
let factionOverviewSearchInput = null;
let factionOverviewSearchButton = null;
let factionOverviewClearSearchButton = null;
let factionOverviewDateFromInput = null;
let factionOverviewDateToInput = null;
let factionOverviewCurrentDataTable = null; // Reference to the active table being displayed
let factionOverviewCogSettingsButton = null; // The gear icon for banker settings


// =====================================================================================================================
// CORE UI RENDERING FUNCTIONS
// Functions responsible for dynamically generating and injecting the main HTML structure.
// =====================================================================================================================

/**
 * Renders the main layout of the Faction Overview page, including sub-tabs and controls.
 * This function is called when the 'Faction Financials' tab (page) is loaded.
 */
function renderFactionOverviewPageLayout() {
    // Ensure we have a container to inject into
    factionOverviewPageContentContainer = document.getElementById('factionOverviewPageContentContainer');
    if (!factionOverviewPageContentContainer) {
        console.error("HTML Error: Main content container #factionOverviewPageContentContainer not found.");
        return;
    }

    // Clear any existing content (e.g., "Loading..." message)
    factionOverviewPageContentContainer.innerHTML = '';

    // Construct the HTML for the entire Faction Overview page dynamically
    const pageHtml = `
        <div class="fo-header-area">
            <h2 class="fo-page-title">Faction Financials Overview</h2>
            <button id="factionOverviewCogSettingsButton" class="fo-cog-button" title="Banker Access Settings">⚙️</button>
        </div>

        <div class="fo-sub-tabs-container" id="factionOverviewSubTabsContainer">
            <button class="fo-sub-tab-button active" data-tab-id="armory-withdrawals">Armory Withdrawals</button>
            <button class="fo-sub-tab-button" data-tab-id="armory-deposits">Armory Deposits</button>
            <button class="fo-sub-tab-button" data-tab-id="fund-deposits">Fund Deposits</button>
            <button class="fo-sub-tab-button" data-tab-id="fund-withdrawals">Fund Withdrawals</button>
            <button class="fo-sub-tab-button" data-tab-id="crime">Crime</button>
            <button class="fo-sub-tab-button" data-tab-id="logistics">Logistics</button>
            <button class="fo-sub-tab-button" data-tab-id="oversight">Oversight</button>
        </div>

        <div class="fo-controls-bar">
            <input type="text" id="factionOverviewSearchInput" class="fo-search-input" placeholder="Search Player/Item/Type...">
            <button id="factionOverviewSearchButton" class="fo-button">Search</button>
            <button id="factionOverviewClearSearchButton" class="fo-button">Clear</button>

            <label for="factionOverviewDateFromInput" class="fo-date-label">From:</label>
            <input type="date" id="factionOverviewDateFromInput" class="fo-date-input">
            <label for="factionOverviewDateToInput" class="fo-date-label">To:</label>
            <input type="date" id="factionOverviewDateToInput" class="fo-date-input">
        </div>

        <div id="factionOverviewDisplayArea" class="fo-display-area">
            <p style="text-align: center; padding-top: 20px; color: #aaa;">Please select a sub-tab to view data.</p>
        </div>
    `;

    factionOverviewPageContentContainer.innerHTML = pageHtml;

    // After injecting HTML, get references to the new dynamic elements
    factionOverviewSubTabsContainer = document.getElementById('factionOverviewSubTabsContainer');
    factionOverviewSearchInput = document.getElementById('factionOverviewSearchInput');
    factionOverviewSearchButton = document.getElementById('factionOverviewSearchButton');
    factionOverviewClearSearchButton = document.getElementById('factionOverviewClearSearchButton');
    factionOverviewDateFromInput = document.getElementById('factionOverviewDateFromInput');
    factionOverviewDateToInput = document.getElementById('factionOverviewDateToInput');
    factionOverviewCogSettingsButton = document.getElementById('factionOverviewCogSettingsButton');

    // Attach event listeners to the dynamically created elements
    setupFactionOverviewEventListeners();

    // Automatically load the default tab
    switchFactionOverviewSubTab(currentActiveSubTab);
}

/**
 * Populates the main display area with content for the specified sub-tab.
 * This is the core logic for switching between the different financial views.
 * @param {string} tabId The ID of the sub-tab to display (e.g., 'armory-withdrawals').
 */
async function switchFactionOverviewSubTab(tabId) {
    const displayArea = document.getElementById('factionOverviewDisplayArea');
    if (!displayArea) {
        console.error("HTML Error: factionOverviewDisplayArea not found for sub-tab content.");
        return;
    }

    // Update active state of sub-tab buttons
    if (factionOverviewSubTabsContainer) {
        factionOverviewSubTabsContainer.querySelectorAll('.fo-sub-tab-button').forEach(button => {
            button.classList.remove('active');
        });
        const clickedButton = factionOverviewSubTabsContainer.querySelector(`.fo-sub-tab-button[data-tab-id="${tabId}"]`);
        if (clickedButton) {
            clickedButton.classList.add('active');
            currentActiveSubTab = tabId; // Update global state
        }
    }

    displayArea.innerHTML = `<p style="text-align: center; padding-top: 20px; color: #ccc;">Loading ${tabId.replace('-', ' ')} data...</p>`;

    // --- Content rendering logic based on tabId ---
    let dataToDisplay = [];
    let columns = [];
    let viewTitle = ``; // Will be set dynamically

    // Decide which data and columns to use based on the selected tab
    switch (tabId) {
        case 'armory-withdrawals':
            dataToDisplay = armoryWithdrawalsData;
            columns = [
                { header: 'Date/Time', key: 'timestamp', sortable: false }, // Sorting removed per user request
                { header: 'User', key: 'user', sortable: false },
                { header: 'Item', key: 'item', sortable: false },
                { header: 'Quantity', key: 'quantity', sortable: false }
            ];
            viewTitle = 'Armory Withdrawals Log';
            break;

        case 'armory-deposits':
            dataToDisplay = armoryDepositsData;
            columns = [
                { header: 'Date/Time', key: 'timestamp', sortable: false },
                { header: 'User', key: 'user', sortable: false },
                { header: 'Item', key: 'item', sortable: false },
                { header: 'Quantity', key: 'quantity', sortable: false }
            ];
            viewTitle = 'Armory Deposits Log';
            break;

        case 'fund-deposits':
            dataToDisplay = fundDepositsData;
            columns = [
                { header: 'Date/Time', key: 'timestamp', sortable: false },
                { header: 'User', key: 'user', sortable: false },
                { header: 'Amount', key: 'amount', sortable: false }
            ];
            viewTitle = 'Fund Deposits Log';
            break;

        case 'fund-withdrawals':
            dataToDisplay = fundWithdrawalsData;
            columns = [
                { header: 'Date/Time', key: 'timestamp', sortable: false },
                { header: 'Sender', key: 'sender', sortable: false },
                { header: 'Recipient', key: 'recipient', sortable: false },
                { header: 'Amount', key: 'amount', sortable: false }
            ];
            viewTitle = 'Fund Withdrawals Log';
            break;

        case 'crime':
            dataToDisplay = crimeData;
            columns = [
                { header: 'Date/Time', key: 'timestamp', sortable: false },
                { header: 'User', key: 'user', sortable: false },
                { header: 'Crime Type', key: 'crimeType', sortable: false },
                { header: 'Result', key: 'result', sortable: false }
            ];
            viewTitle = 'Crime Log';
            break;

        case 'logistics':
            renderLogisticsTabContent(displayArea);
            return;

        case 'oversight':
            populateOversightData(); // Call populateOversightData directly here
            return;

        default:
            displayArea.innerHTML = `<p style="text-align: center; color: red;">Error: Unknown sub-tab selected.</p>`;
            return;
    }

    renderDynamicDataTable(displayArea, dataToDisplay, columns, viewTitle);
    applyCurrentFiltersAndSort();
}

/**
 * Generates and injects an HTML table for displaying generic log data.
 * @param {HTMLElement} targetElement The DOM element to inject the table into.
 * @param {Array<Object>} data An array of objects to display.
 * @param {Array<Object>} columns An array of column definitions.
 * @param {string} title The title for the table/view.
 */
function renderDynamicDataTable(targetElement, data, columns, title) {
    let tableHtml = `
        <h3 class="fo-view-title">✨ ${title}</h3>
        <div class="fo-table-container">
            <table class="fo-data-table">
                <thead>
                    <tr>
    `;

    columns.forEach(col => {
        tableHtml += `<th>${col.header}</th>`;
    });
    tableHtml += `
                    </tr>
                </thead>
                <tbody>
    `;

    if (data.length === 0) {
        tableHtml += `<tr><td colspan="${columns.length}" style="text-align: center; padding: 20px;">No data available for this period.</td></tr>`;
    } else {
        const itemsToDisplay = data.slice(0, 10);
        itemsToDisplay.forEach(row => {
            tableHtml += `<tr>`;
            columns.forEach(col => {
                let displayValue = row[col.key] !== undefined ? row[col.key] : 'N/A';
                if (col.key === 'timestamp' && displayValue !== 'N/A') {
                    displayValue = formatTimestampToLocale(displayValue);
                } else if (col.key === 'amount' && typeof displayValue === 'number') {
                    displayValue = `$${displayValue.toLocaleString()}`;
                } else if (col.key === 'quantity' && typeof displayValue === 'number') {
                    displayValue = displayValue.toLocaleString();
                }

                if (displayValue === 'N/A' || displayValue === null || displayValue === '') {
                    displayValue = '';
                }
                
                tableHtml += `<td title="${displayValue}">${displayValue}</td>`;
            });
            tableHtml += `</tr>`;
        });
    }

    tableHtml += `
                </tbody>
            </table>
        </div>
    `;

    targetElement.innerHTML = tableHtml;

    factionOverviewCurrentDataTable = targetElement.querySelector('.fo-data-table');
}

/**
 * Renders the content specifically for the Logistics sub-tab.
 * This will query `historicalArmoryLogs` and display summaries.
 * @param {HTMLElement} targetElement The DOM element to inject content into.
 */
async function populateLogisticsData() { // Made async
    const stockBody = document.getElementById('foLogisticsStockBody');
    const largeMovesBody = document.getElementById('foLogisticsLargeMovesBody');

    if (!stockBody || !largeMovesBody) {
        console.error("HTML Error: Logistics tab body elements not found.");
        return;
    }

    stockBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 15px;">Calculating real stock data...</td></tr>`;
    largeMovesBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 15px;">Analyzing real large movements...</td></tr>`;

    if (historicalArmoryLogs.length === 0) {
        stockBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 15px;">No historical armory data available. Ensure your API key is set and data is being saved to Firebase.</td></tr>`;
        largeMovesBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 15px;">No historical armory data for movements.</td></tr>`;
        return;
    }

    let liveArmoryData = {};
    try {
        if (!factionOverviewGlobalYourFactionID || !factionOverviewUserApiKey) { // THIS IS THE PROBLEM!
            throw new Error("Faction ID or API key missing for live armory data.");
        }
        const armoryApiUrl = `https://api.torn.com/v2/faction/${String(factionOverviewGlobalYourFactionID)}?selections=armory&key=${factionOverviewUserApiKey}&comment=MyTornPA_LiveArmoryStock`;
        const response = await fetch(armoryApiUrl);
        const data = await response.json();

        if (!response.ok || data.error) {
            throw new Error(data.error ? data.error.error : response.statusText);
        }
        liveArmoryData = data.armory || {};
        console.log("[DEBUG] Live Armory Data fetched:", liveArmoryData);

    } catch (error) {
        console.error("Error fetching live armory data:", error);
        stockBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 15px; color: red;">Error loading live stock: ${error.message}</td></tr>`;
        return;
    }


    const itemNetQuantities = {};
    const itemUsagePerDay = {};
    const sevenDaysAgo = new Date().getTime() - (7 * 24 * 60 * 60 * 1000);
    const now = new Date().getTime();

    const sortedArmoryLogs = [...historicalArmoryLogs].sort((a, b) => a.timestamp - b.timestamp);

    sortedArmoryLogs.forEach(entry => {
        const rawItemName = entry.item.replace(/(?:Deposited - |Retrieved - |Loaned - |Given - |Used - |Filled - )/, '').trim();
        const quantity = entry.quantity || 0;

        if (rawItemName === 'N/A' || quantity === 'N/A' || !rawItemName) return;

        if (!itemNetQuantities[rawItemName]) {
            itemNetQuantities[rawItemName] = 0;
            itemUsagePerDay[rawItemName] = {};
        }

        if (entry.category === 'armoryDeposit') {
            itemNetQuantities[rawItemName] += quantity;
        } else if (entry.category === 'armoryAction') {
            if (entry.rawNews.includes("retrieved") || entry.rawNews.includes("withdrew") || 
                entry.rawNews.includes("used") || entry.rawNews.includes("loaned") || 
                entry.rawNews.includes("gave")) {
                itemNetQuantities[rawItemName] -= quantity;
            }
        }

        if (entry.category === 'armoryAction' && entry.timestamp >= sevenDaysAgo && entry.timestamp <= now) {
            if (entry.rawNews.includes("used") || entry.rawNews.includes("loaned") || entry.rawNews.includes("gave") || entry.rawNews.includes("retrieved") || entry.rawNews.includes("withdrew")) {
                const dayTimestamp = new Date(entry.timestamp).setUTCHours(0, 0, 0, 0);
                if (!itemUsagePerDay[rawItemName]) {
                    itemUsagePerDay[rawItemName] = {};
                }
                itemUsagePerDay[rawItemName][dayTimestamp] = (itemUsagePerDay[rawItemName][dayTimestamp] || 0) + quantity;
            }
        }
    });

    const currentStockData = [];
    for (const itemId in liveArmoryData) {
        if (liveArmoryData.hasOwnProperty(itemId)) {
            const liveItem = liveArmoryData[itemId];
            const itemName = liveItem.name;
            const onHandQty = liveItem.quantity;

            let totalUsedLast7Days = 0;
            let daysWithUsageCount = 0;

            if (itemUsagePerDay[itemName]) {
                totalUsedLast7Days = Object.values(itemUsagePerDay[itemName]).reduce((sum, qty) => sum + qty, 0);
                daysWithUsageCount = Object.keys(itemUsagePerDay[itemName]).length;
            }

            const avgDailyUse = daysWithUsageCount > 0 ? (totalUsedLast7Days / daysWithUsageCount).toFixed(1) : 0;
            const weeklyChange = -totalUsedLast7Days;

            currentStockData.push({
                itemName: itemName,
                onHandQty: onHandQty,
                avgDailyUse: parseFloat(avgDailyUse),
                weeklyChange: weeklyChange
            });
        }
    }

    currentStockData.sort((a, b) => a.itemName.localeCompare(b.itemName));

    let stockHtml = '';
    if (currentStockData.length > 0) {
        currentStockData.forEach(item => {
            stockHtml += `
                <tr>
                    <td>${item.itemName}</td>
                    <td>${item.onHandQty.toLocaleString()}</td>
                    <td>${item.avgDailyUse}</td>
                    <td style="color: ${item.weeklyChange < 0 ? '#dc3545' : '#28a745'};">${item.weeklyChange.toLocaleString()}</td>
                </tr>
            `;
        });
    } else {
        stockHtml = `<tr><td colspan="4" style="text-align: center; padding: 15px;">No armory stock data available.</td></tr>`;
    }
    stockBody.innerHTML = stockHtml;

    const largeMovesThreshold = 50;
    const highValueItems = ['Armored Vest', 'Magnum', 'HEG', 'Xanax', 'Flash Grenade'];

    const recentLargeMoves = historicalArmoryLogs.filter(entry => {
        const isRecent = entry.timestamp >= sevenDaysAgo;
        if (!isRecent) return false;

        const rawItemName = entry.item.replace(/(?:Deposited - |Retrieved - |Loaned - |Given - |Used - |Filled - )/, '').trim();
        const quantity = entry.quantity || 0;

        const isLargeQuantity = quantity >= largeMovesThreshold;
        const isHighValueItem = highValueItems.includes(rawItemName);

        return isLargeQuantity || isHighValueItem;
    }).sort((a, b) => b.timestamp - a.timestamp);

    let largeMovesHtml = '';
    if (recentLargeMoves.length > 0) {
        recentLargeMoves.forEach(move => {
            let type = '';
            if (move.rawNews.includes('withdrew') || move.rawNews.includes('used') || move.rawNews.includes('loaned') || move.rawNews.includes('gave') || move.rawNews.includes('retrieved')) {
                type = 'Withdrawal';
            } else if (move.rawNews.includes('deposited')) {
                type = 'Deposit';
            } else if (move.rawNews.includes('filled')) {
                type = 'Fill';
            }

            largeMovesHtml += `
                <tr>
                    <td>${formatTimestampToLocale(move.timestamp)}</td>
                    <td>${move.user}</td>
                    <td>${move.item.replace(/(?:Deposited - |Retrieved - |Loaned - |Given - |Used - |Filled - )/, '').trim()}</td>
                    <td>${(move.quantity || move.amount || '').toLocaleString()}</td>
                    <td>${type}</td>
                </tr>
            `;
        });
    } else {
        largeMovesHtml = `<tr><td colspan="5" style="text-align: center; padding: 15px;">No large armory movements found in the last 7 days.</td></tr>`;
    }
    largeMovesBody.innerHTML = largeMovesHtml;
}