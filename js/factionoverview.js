// factionoverview.js - Comprehensive JavaScript for the Faction Overview Page

// =====================================================================================================================
// GLOBAL VARIABLES & FIREBASE INITIALIZATION
// These variables store data, DOM references, and application state.
// They are declared at the top of the file for easy identification and management.
// =====================================================================================================================

// Firebase (initialized in firebase-init.js, made globally available)
// Ensure 'db' and 'auth' are accessible from 'firebase-init.js' or passed as arguments to relevant functions
// const db = firebase.firestore(); // Assuming these are initialized globally from firebase-init.js
// const auth = firebase.auth();   // If not, they'll need to be passed or re-initialized here.

let factionOverviewUserApiKey = null; // Stores the logged-in user's Torn API key for this page
let factionOverviewGlobalYourFactionID = null; // Stores the user's faction ID

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
// This will require persistent storage (e.g., Firebase Firestore collections)
// For now, we'll conceptualize these, but the actual data fetching/processing will build them up.
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

// Main content container (defined in factionoverview.html)
// This will be assigned in DOMContentLoaded once the element is available
// const factionOverviewPageContentContainer = document.getElementById('factionOverviewPageContentContainer');


// These will be dynamically created by JavaScript:
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
    // This includes the sub-tab navigation, the cog icon, and the main data display area.
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
                { header: 'Date/Time', key: 'timestamp', sortable: true },
                { header: 'User', key: 'user', sortable: true },
                { header: 'Item', key: 'item', sortable: true },
                { header: 'Quantity', key: 'quantity', sortable: true }
            ];
            viewTitle = 'Armory Withdrawals Log';
            break;

        case 'armory-deposits':
            dataToDisplay = armoryDepositsData;
            columns = [
                { header: 'Date/Time', key: 'timestamp', sortable: true },
                { header: 'User', key: 'user', sortable: true },
                { header: 'Item', key: 'item', sortable: true },
                { header: 'Quantity', key: 'quantity', sortable: true }
            ];
            viewTitle = 'Armory Deposits Log';
            break;

        case 'fund-deposits':
            dataToDisplay = fundDepositsData;
            columns = [
                { header: 'Date/Time', key: 'timestamp', sortable: true },
                { header: 'User', key: 'user', sortable: true },
                { header: 'Amount', key: 'amount', sortable: true }
            ];
            viewTitle = 'Fund Deposits Log';
            break;

        case 'fund-withdrawals':
            dataToDisplay = fundWithdrawalsData;
            columns = [
                { header: 'Date/Time', key: 'timestamp', sortable: true },
                { header: 'Sender', key: 'sender', sortable: true },
                { header: 'Recipient', key: 'recipient', sortable: true },
                { header: 'Amount', key: 'amount', sortable: true }
            ];
            viewTitle = 'Fund Withdrawals Log';
            break;

        case 'crime':
            dataToDisplay = crimeData;
            columns = [
                { header: 'Date/Time', key: 'timestamp', sortable: true },
                { header: 'User', key: 'user', sortable: true },
                { header: 'Crime Type', key: 'crimeType', sortable: true },
                { header: 'Result', key: 'result', sortable: true }
            ];
            viewTitle = 'Crime Log';
            break;

        case 'logistics':
            // Logistics tab will have a different layout (summaries, not raw tables)
            renderLogisticsTabContent(displayArea);
            return; // Exit after rendering specific content

        case 'oversight':
            // Oversight tab will also have a different layout (KPIs, alerts)
            renderOversightTabContent(displayArea);
            return; // Exit after rendering specific content

        default:
            displayArea.innerHTML = `<p style="text-align: center; color: red;">Error: Unknown sub-tab selected.</p>`;
            return;
    }

    // Render generic table for transaction logs (Armory/Funds/Crime)
    renderDynamicDataTable(displayArea, dataToDisplay, columns, viewTitle);

    // After rendering, apply current filters if any
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
        <table class="fo-data-table">
            <thead>
                <tr>
    `;

    // Add table headers
    columns.forEach(col => {
        tableHtml += `<th ${col.sortable ? `data-sort-key="${col.key}" class="fo-sortable-header"` : ''}>${col.header} ${col.sortable ? '(▲▼)' : ''}</th>`;
    });
    tableHtml += `
                </tr>
            </thead>
            <tbody>
    `;

    // Add table rows (initially, all data before filtering/sorting)
    if (data.length === 0) {
        tableHtml += `<tr><td colspan="${columns.length}" style="text-align: center; padding: 20px;">No data available for this period.</td></tr>`;
    } else {
        data.forEach(row => {
            tableHtml += `<tr>`;
            columns.forEach(col => {
                let displayValue = row[col.key] !== undefined ? row[col.key] : 'N/A';
                if (col.key === 'timestamp' && displayValue !== 'N/A') {
                    // Format timestamp as a readable date/time (e.g., DD/MM/YYYY HH:MM)
                    displayValue = formatTimestampToLocale(displayValue);
                } else if (col.key === 'amount' && typeof displayValue === 'number') {
                    // Format amounts as currency
                    displayValue = `$${displayValue.toLocaleString()}`;
                }
                tableHtml += `<td>${displayValue}</td>`;
            });
            tableHtml += `</tr>`;
        });
    }

    tableHtml += `
            </tbody>
        </table>
    `;

    targetElement.innerHTML = tableHtml;

    // Get reference to the newly created table
    factionOverviewCurrentDataTable = targetElement.querySelector('.fo-data-table');

    // Attach sorting event listeners to headers
    setupTableSorting(factionOverviewCurrentDataTable, data);
}

/**
 * Renders the content specifically for the Logistics sub-tab.
 * @param {HTMLElement} targetElement The DOM element to inject content into.
 */
// In factionoverview.js, find the existing renderLogisticsTabContent function and replace it entirely with this:

/**
 * Renders the content specifically for the Logistics sub-tab.
 * This will query `historicalArmoryLogs` and display summaries.
 * @param {HTMLElement} targetElement The DOM element to inject content into.
 */
function renderLogisticsTabContent(targetElement) {
    targetElement.innerHTML = `
        <div class="fo-section-panel">
            <h4>📊 Current Faction Armory Stock Levels (Estimated)</h4>
            <table class="fo-data-table fo-summary-table">
                <thead>
                    <tr>
                        <th class="fo-sortable-header" data-sort-key="itemName">Item Name (▲▼)</th>
                        <th class="fo-sortable-header" data-sort-key="onHandQty">On Hand (Qty) (▲▼)</th>
                        <th class="fo-sortable-header" data-sort-key="avgDailyUse">Avg. Daily Use (▲▼)</th>
                        <th class="fo-sortable-header" data-sort-key="weeklyChange">Weekly Change (▲▼)</th>
                    </tr>
                </thead>
                <tbody id="foLogisticsStockBody">
                    <tr><td colspan="4" style="text-align: center; padding: 15px;">Loading stock data...</td></tr>
                </tbody>
            </table>
        </div>

        <div class="fo-section-panel fo-section-panel-full-width">
            <h4>📦 Recent Large Item Movements</h4> <table class="fo-data-table fo-summary-table">
                <thead>
                    <tr>
                        <th class="fo-sortable-header" data-sort-key="timestamp">Date/Time (▲▼)</th>
                        <th class="fo-sortable-header" data-sort-key="user">User (▲▼)</th>
                        <th class="fo-sortable-header" data-sort-key="item">Item (▲▼)</th>
                        <th class="fo-sortable-header" data-sort-key="quantity">Quantity (▲▼)</th>
                        <th class="fo-sortable-header" data-sort-key="type">Type (▲▼)</th>
                    </tr>
                </thead>
                <tbody id="foLogisticsLargeMovesBody">
                    <tr><td colspan="5" style="text-align: center; padding: 15px;">Loading large movements...</td></tr>
                </tbody>
            </table>
        </div>
    `;
    // Fetch and populate data for Logistics (conceptual, actual implementation to follow later)
    // This will involve querying 'historicalArmoryLogs' from Firebase and processing it.
    populateLogisticsData();
}
/**
 * Renders the content specifically for the Oversight sub-tab.
 * @param {HTMLElement} targetElement The DOM element to inject content into.
 */
function renderOversightTabContent(targetElement) {
    targetElement.innerHTML = `
        <h3 class="fo-view-title">✨ Oversight: Key Metrics & Alerts</h3>

        <div class="fo-kpi-grid">
            <div class="fo-kpi-box">
                <h5>Total Funds Deposited (7D)</h5>
                <p id="oversightTotalFundsDeposited">$0</p>
            </div>
            <div class="fo-kpi-box">
                <h5>Total Items Deposited (7D)</h5>
                <p id="oversightTotalItemsDeposited">0</p>
            </div>
            <div class="fo-kpi-box">
                <h5>Funds Withdrawn (7D)</h5>
                <p id="oversightTotalFundsWithdrawn">$0</p>
            </div>
            <div class="fo-kpi-box">
                <h5>Items Withdrawn (7D)</h5>
                <p id="oversightTotalItemsWithdrawn">0</p>
            </div>
        </div>

        <div class="fo-section-panel">
            <h4>👥 Top Active Users (Armory & Funds, Last 30 Days)</h4>
            <ul id="oversightTopUsersList" class="fo-list">
                <li>Loading top users...</li>
            </ul>
        </div>

        <div class="fo-section-panel">
            <h4>🚨 Alerts & Flags (Needs Attention!)</h4>
            <ul id="oversightAlertsList" class="fo-list fo-alerts-list">
                <li>No active alerts.</li>
            </ul>
        </div>
    `;
    // Fetch and populate data for Oversight (conceptual, actual implementation to follow later)
    // This will involve querying 'historicalFundLogs' and 'historicalArmoryLogs' from Firebase and processing them.
    populateOversightData();
}


// =====================================================================================================================
// EVENT LISTENERS SETUP
// Attaches event handlers to dynamically created elements.
// =====================================================================================================================

/**
 * Sets up all event listeners for the Faction Overview page's dynamic elements.
 * This is called once after the main layout is rendered.
 */
function setupFactionOverviewEventListeners() {
    // Event listener for sub-tab buttons
    if (factionOverviewSubTabsContainer) {
        factionOverviewSubTabsContainer.addEventListener('click', (event) => {
            const clickedButton = event.target.closest('.fo-sub-tab-button');
            if (clickedButton) {
                const tabId = clickedButton.dataset.tabId;
                switchFactionOverviewSubTab(tabId);
            }
        });
    }

    // Event listeners for search and filter controls
    if (factionOverviewSearchButton) {
        factionOverviewSearchButton.addEventListener('click', applyCurrentFiltersAndSort);
    }
    if (factionOverviewClearSearchButton) {
        factionOverviewClearSearchButton.addEventListener('click', () => {
            if (factionOverviewSearchInput) factionOverviewSearchInput.value = '';
            if (factionOverviewDateFromInput) factionOverviewDateFromInput.value = '';
            if (factionOverviewDateToInput) factionOverviewDateToInput.value = '';
            applyCurrentFiltersAndSort(); // Re-apply filters to clear them
        });
    }
    if (factionOverviewSearchInput) {
        factionOverviewSearchInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                applyCurrentFiltersAndSort();
            }
        });
    }
    if (factionOverviewDateFromInput) {
        factionOverviewDateFromInput.addEventListener('change', applyCurrentFiltersAndSort);
    }
    if (factionOverviewDateToInput) {
        factionOverviewDateToInput.addEventListener('change', applyCurrentFiltersAndSort);
    }


    // Event listener for Cog / Banker Settings button
    if (factionOverviewCogSettingsButton) {
        factionOverviewCogSettingsButton.addEventListener('click', showBankerSettingsModal);
    }
}

/**
 * Sets up sorting functionality for a given table.
 * @param {HTMLElement} tableElement The <table> element to make sortable.
 * @param {Array<Object>} originalData The original, unsorted array of data.
 */
function setupTableSorting(tableElement, originalData) {
    const headers = tableElement.querySelectorAll('.fo-sortable-header');
    let currentSortColumn = null;
    let currentSortDirection = 'asc'; // 'asc' or 'desc'

    headers.forEach(header => {
        header.addEventListener('click', () => {
            const sortKey = header.dataset.sortKey;

            // Determine sort direction
            if (currentSortColumn === sortKey) {
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortColumn = sortKey;
                currentSortDirection = 'asc'; // Default to ascending for new column
            }

            // Remove (▲▼) from all headers and add to current
            headers.forEach(h => h.textContent = h.textContent.replace(' (▲▼)', ''));
            header.textContent = `${header.textContent.replace(' (▲▼)', '')} (${currentSortDirection === 'asc' ? '▲' : '▼'})`;

            // Sort the data
            const sortedData = [...originalData].sort((a, b) => {
                const valA = a[sortKey];
                const valB = b[sortKey];

                if (typeof valA === 'string' && typeof valB === 'string') {
                    return currentSortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
                }
                // Handle numbers and other types
                return currentSortDirection === 'asc' ? valA - valB : valB - valA;
            });

            // Re-render the table body with sorted data
            const tbody = tableElement.querySelector('tbody');
            if (tbody) {
                tbody.innerHTML = ''; // Clear current rows
                sortedData.forEach(row => {
                    let rowHtml = '<tr>';
                    // Reconstruct row based on current table's columns (from headers)
                    headers.forEach(headerCol => {
                        const colKey = headerCol.dataset.sortKey || ''; // Use dataset.sortKey if it exists
                        let displayValue = row[colKey] !== undefined ? row[colKey] : 'N/A';
                        if (colKey === 'timestamp' && displayValue !== 'N/A') {
                            displayValue = formatTimestampToLocale(displayValue);
                        } else if (colKey === 'amount' && typeof displayValue === 'number') {
                            displayValue = `$${displayValue.toLocaleString()}`;
                        }
                        rowHtml += `<td>${displayValue}</td>`;
                    });
                    rowHtml += '</tr>';
                    tbody.insertAdjacentHTML('beforeend', rowHtml);
                });
            }
        });
    });
}


// =====================================================================================================================
// DATA FETCHING FUNCTIONS
// Handles API calls to Torn and Firebase.
// =====================================================================================================================

/**
 * Fetches data from a Torn API endpoint.
 * @param {string} url The full URL for the Torn API request.
 * @param {string} comment A comment for the API request for Torn's logs.
 * @returns {Promise<Object>} The JSON response data.
 */
async function fetchTornApiData(url, comment) {
    if (!factionOverviewUserApiKey) {
        throw new Error("Torn API Key is not available. Please ensure you are logged in and your API key is set in your profile.");
    }
    const fullUrl = `${url}&key=${factionOverviewUserApiKey}&comment=${comment}`;
    try {
        const response = await fetch(fullUrl);
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const apiErrorMsg = errorData.error ? `: ${errorData.error.error}` : '';
            throw new Error(`Torn API HTTP Error: ${response.status} ${response.statusText}${apiErrorMsg}`);
        }
        const data = await response.json();
        if (data.error) {
            throw new Error(`Torn API Data Error: ${data.error.error} (Code: ${data.error.code})`);
        }
        return data;
    } catch (error) {
        console.error("Error fetching Torn API data:", error);
        throw error; // Re-throw to be caught by calling function
    }
}

/**
 * Fetches the latest raw faction news data for all relevant categories.
 * This will typically fetch the most recent 100 entries.
 */
async function fetchAllRawFactionNewsData() {
    // Use Promise.all to fetch all categories concurrently for efficiency
    try {
        const [armoryWithdrawalsResp, armoryDepositsResp, fundDepositsResp, fundWithdrawalsResp, crimeResp] = await Promise.all([
            fetchTornApiData(`https://api.torn.com/v2/faction/news?cat=armoryAction&limit=100`, 'MyTornPA_ArmoryWithdrawals'),
            fetchTornApiData(`https://api.torn.com/v2/faction/news?cat=armoryDeposit&limit=100`, 'MyTornPA_ArmoryDeposits'),
            fetchTornApiData(`https://api.torn.com/v2/faction/news?cat=depositFunds&limit=100`, 'MyTornPA_FundDeposits'),
            fetchTornApiData(`https://api.torn.com/v2/faction/news?cat=giveFunds&limit=100`, 'MyTornPA_FundWithdrawals'),
            fetchTornApiData(`https://api.torn.com/v2/faction/news?cat=crime&limit=100`, 'MyTornPA_CrimeLog')
        ]);

        // Process and store the fetched data into global variables
        armoryWithdrawalsData = processFactionNewsForTable(armoryWithdrawalsResp?.news || {}, 'armoryAction');
        armoryDepositsData = processFactionNewsForTable(armoryDepositsResp?.news || {}, 'armoryDeposit');
        fundDepositsData = processFactionNewsForTable(fundDepositsResp?.news || {}, 'depositFunds');
        fundWithdrawalsData = processFactionNewsForTable(fundWithdrawalsResp?.news || {}, 'giveFunds');
        crimeData = processFactionNewsForTable(crimeResp?.news || {}, 'crime');

        console.log("All raw faction news data fetched and processed.");

        // If the current tab is one of these, refresh its display
        if (['armory-withdrawals', 'armory-deposits', 'fund-deposits', 'fund-withdrawals', 'crime'].includes(currentActiveSubTab)) {
            // Re-render the current tab to show updated data
            switchFactionOverviewSubTab(currentActiveSubTab);
        }

        // Trigger historical data processing after fetching raw data
        processAndStoreHistoricalData();


    } catch (error) {
        console.error("Failed to fetch all raw faction news data:", error);
        // Display an error message in the main content area if needed
        const displayArea = document.getElementById('factionOverviewDisplayArea');
        if (displayArea) {
            displayArea.innerHTML = `<p style="text-align: center; color: red; padding-top: 50px;">Error loading data: ${error.message}</p>`;
        }
    }
}

// In factionoverview.js, find the existing processFactionNewsForTable function and replace it entirely with this:

/**
 * Processes raw Torn API faction news data (which is an array of news items)
 * into a standardized format for tables, parsing details from the 'text' field.
 * @param {Array<Object>} newsArray The 'news' array from the Torn API response.
 * @param {string} category The category string (e.g., 'armoryAction', 'giveFunds').
 * @returns {Array<Object>} An array of standardized data objects.
 */
function processFactionNewsForTable(newsArray, category) {
    const processed = [];
    // Ensure newsArray is an actual array before trying to iterate.
    const safeNewsArray = Array.isArray(newsArray) ? newsArray : [];

    console.log(`[DEBUG] processFactionNewsForTable: Processing category: ${category}. Received ${safeNewsArray.length} entries.`);
    if (safeNewsArray.length === 0) {
        console.log(`[DEBUG] processFactionNewsForTable: No entries to process for ${category}.`);
    }

    // Helper function to extract name and ID from Torn's <a> HTML string
    const extractPlayerInfoFromHtml = (htmlString) => {
        const match = htmlString.match(/<a href="[^"]+XID=(\d+)">([^<]+)<\/a>/);
        return {
            id: match ? match[1] : 'N/A',
            name: match ? match[2] : 'Unknown'
        };
    };

    safeNewsArray.forEach(entry => {
        const id = entry.id;
        const timestamp = new Date(entry.timestamp * 1000); // Convert Torn timestamp (seconds) to milliseconds
        const sourceText = entry.text; // The raw HTML text string of the news entry

        console.log(`[DEBUG] Processing Entry ID: ${id}, Category: ${category}, Raw Text: "${sourceText}"`);

        // Default values for processed fields
        let user = 'N/A';
        let userId = 'N/A';
        let item = 'N/A';
        let quantity = 'N/A';
        let amount = 'N/A';
        let sender = 'N/A';
        let senderId = 'N/A';
        let recipient = 'N/A';
        let recipientId = 'N/A';
        let crimeType = 'N/A';
        let result = 'N/A';

        // --- Common Parsing: Extract the primary actor (usually the first player link in the text) ---
       const firstPlayerLinkMatch = sourceText.match(/^<a\s+href\s*=\s*"[^"]+XID=(\d+)">([^<]+)<\/a>/);
        if (firstPlayerLinkMatch) {
            userId = firstPlayerLinkMatch[1];
            user = firstPlayerLinkMatch[2];
            console.log(`[DEBUG] Common User: ${user} (ID: ${userId})`);
        }

        if (category === 'armoryAction' || category === 'armoryDeposit') {
            // Pattern 1: "...used one of the faction's [Item Name] items" (e.g., First Aid Kit, Lollipop)
            // Pattern 2: "...loaned 1x [Item Name] to themselves from the faction armory" (e.g., Magnum, HEG)
            // Pattern 3: "...gave 30x [Item Name] to themselves from the faction armory" (e.g., Flash Grenade, Xanax)
            // Pattern 4: "...filled one of the faction's [Item Name] items" (e.g., Empty Blood Bag)
            // Pattern 5: "...deposited [QTY] x [Item Name]" (e.g., 1 x Thompson, 20 x Morphine)
            // Pattern 6: "...deposited [QTY] x [Item Name] items"
            // Pattern 7: "...deposited [QTY] x [Item Name]"

            let match;

            // Try to match usage/withdrawal (Pattern 1, 2, 3)
            match = sourceText.match(/(?:used|loaned|gave)\s+(?:(\d+x)\s+)?(?:one of the faction's\s+)?(.+?)\s+(?:item|items|to themselves|from the faction armory|from)/);
            if (match) {
                quantity = match[1] ? parseInt(match[1].replace('x', ''), 10) : 1; // Default to 1 if "one of the" or no quantity
                item = match[2].trim().replace(/\s+items$/, ''); // Remove " items" if present
            } else {
                // Try to match deposits/fills (Pattern 4, 5, 6, 7)
                match = sourceText.match(/(?:deposited|filled)\s+(?:(\d+)\s+x\s+)?(.+?)(?:\s+items)?(?:\s+to|\s+from)?/); // Capture quantity and item
                if (match) {
                    quantity = match[1] ? parseInt(match[1], 10) : 1; // If "1 x Item" or just "Item"
                    item = match[2].trim();
                }
            }

            console.log(`[DEBUG] Armory Item: ${item}, Quantity: ${quantity}`);
        }
		
		else if (category === 'depositFunds') {
            const amountMatch = sourceText.match(/\$([\d,]+)/);
            amount = amountMatch ? parseInt(amountMatch[1].replace(/,/g, ''), 10) : 'N/A';
            console.log(`[DEBUG] Funds Deposited: ${amount}`);
        } else if (category === 'giveFunds') {
            // Example: "<a href...>Recipient</a> was given $X,XXX,XXX by <a href...>Sender</a>"
            const amountMatch = sourceText.match(/\$([\d,]+)/);
            amount = amountMatch ? parseInt(amountMatch[1].replace(/,/g, ''), 10) : 'N/A';

            // Extract Recipient Info (first player link in the string)
            const recipientLinkMatch = sourceText.match(/^(<a[^>]*>.+?<\/a>)\s+was given/);
            if (recipientLinkMatch) {
                const recipientInfo = extractPlayerInfoFromHtml(recipientLinkMatch[1]);
                recipient = recipientInfo.name;
                recipientId = recipientInfo.id;
            }

            // Extract Sender Info (player link after "by ")
            const senderLinkMatch = sourceText.match(/by\s+(<a[^>]*>.+?<\/a>)$/);
            if (senderLinkMatch) {
                const senderInfo = extractPlayerInfoFromHtml(senderLinkMatch[1]);
                sender = senderInfo.name;
                senderId = senderInfo.id;
            }

            // For 'giveFunds', the primary 'user' for the main table column should logically be the SENDER
            user = sender;
            userId = senderId;
            console.log(`[DEBUG] Funds Given: Sender=${sender} (ID:${senderId}), Recipient=${recipient} (ID:${recipientId}), Amount=${amount}`);

        } else if (category === 'crime') {
            const crimeTypeMatch = sourceText.match(/committed\s+(.+?)\s+\((?:success|failure)\)/);
            const resultMatch = sourceText.match(/\((success|failure)\)/i);
            crimeType = crimeTypeMatch ? crimeTypeMatch[1].trim() : 'N/A';
            result = resultMatch ? resultMatch[1] : 'N/A';
            console.log(`[DEBUG] Crime: Type=${crimeType}, Result=${result}`);
        }

        processed.push({
            id: id,
            timestamp: timestamp.getTime(),
            user: user,
            userId: userId,
            item: item,
            quantity: quantity,
            amount: amount,
            sender: sender,
            senderId: senderId,
            recipient: recipient,
            recipientId: recipientId,
            crimeType: crimeType,
            result: result,
            rawNews: sourceText
        });
    });

    // Sort by timestamp descending by default (most recent first)
    return processed.sort((a, b) => b.timestamp - a.timestamp);
}
/**
 * Placeholder: Fetches historical data from Firebase and processes it for Logistics and Oversight.
 * This function will be expanded during the implementation phase for long-term storage.
 */
async function processAndStoreHistoricalData() {
    // Concept:
    // 1. Fetch ALL available raw API data (potentially iterate through older data if API allows, or rely on already stored data).
    // 2. Combine with data already stored in Firebase (historicalArmoryLogs, historicalFundLogs).
    // 3. Write new data to Firebase to build up the long-term history.
    // 4. Update 'historicalArmoryLogs' and 'historicalFundLogs' global arrays with comprehensive data from Firebase.

    console.log("Placeholder: Processing and storing historical data (requires Firebase integration).");
    // Example:
    // const armoryHistoryRef = db.collection('factionHistoricalData').doc(factionOverviewGlobalYourFactionID).collection('armoryLogs');
    // const fundHistoryRef = db.collection('factionHistoricalData').doc(factionOverviewGlobalYourFactionID).collection('fundLogs');

    // Here you would implement logic to:
    // - Read existing historical data from Firebase
    // - Add new fetched raw data to it (deduplicating by Torn news ID/timestamp)
    // - Write the updated historical data back to Firebase
    // - Update global 'historicalArmoryLogs' and 'historicalFundLogs' for client-side processing
}


// =====================================================================================================================
// DATA PROCESSING & FILTERING LOGIC
// Functions for manipulating and displaying data.
// =====================================================================================================================

/**
 * Applies current search, date, and sort filters to the displayed data.
 * This is called whenever a filter input changes or a sort header is clicked.
 */
function applyCurrentFiltersAndSort() {
    let dataToFilter = []; // This will be the data for the currently active tab
    let columns = []; // Columns for the current tab

    switch (currentActiveSubTab) {
        case 'armory-withdrawals': dataToFilter = [...armoryWithdrawalsData]; break;
        case 'armory-deposits': dataToFilter = [...armoryDepositsData]; break;
        case 'fund-deposits': dataToFilter = [...fundDepositsData]; break;
        case 'fund-withdrawals': dataToFilter = [...fundWithdrawalsData]; break;
        case 'crime': dataToFilter = [...crimeData]; break;
        // Logistics and Oversight handle their own data internally, as they use aggregated data.
        // If they had search/date filters for their *raw* data, this would apply.
        default: return; // Do nothing for Logistics/Oversight here, they're handled by their render functions
    }

    const searchTerm = factionOverviewSearchInput ? factionOverviewSearchInput.value.toLowerCase().trim() : '';
    const dateFrom = factionOverviewDateFromInput ? factionOverviewDateFromInput.value : '';
    const dateTo = factionOverviewDateToInput ? factionOverviewDateToInput.value : '';

    let filteredData = dataToFilter.filter(row => {
        let matchesSearch = true;
        let matchesDate = true;

        // Search filter logic
        if (searchTerm) {
            // Adjust based on relevant keys for each tab
            const searchableFields = [row.user, row.item, row.recipient, row.crimeType, row.amount].map(val => String(val).toLowerCase());
            matchesSearch = searchableFields.some(field => field.includes(searchTerm));
        }

        // Date filter logic
        if (dateFrom || dateTo) {
            const rowDate = new Date(row.timestamp); // Already milliseconds
            if (dateFrom && rowDate < new Date(dateFrom)) {
                matchesDate = false;
            }
            if (dateTo && rowDate > new Date(new Date(dateTo).setHours(23, 59, 59, 999))) { // End of the selected day
                matchesDate = false;
            }
        }
        return matchesSearch && matchesDate;
    });

    // Re-render the current data table with filtered data
    // Need to get the columns for the current tab to re-render it correctly
    if (currentActiveSubTab === 'armory-withdrawals') columns = [ { header: 'Date/Time', key: 'timestamp', sortable: true }, { header: 'User', key: 'user', sortable: true }, { header: 'Item', key: 'item', sortable: true }, { header: 'Quantity', key: 'quantity', sortable: true } ];
    else if (currentActiveSubTab === 'armory-deposits') columns = [ { header: 'Date/Time', key: 'timestamp', sortable: true }, { header: 'User', key: 'user', sortable: true }, { header: 'Item', key: 'item', sortable: true }, { header: 'Quantity', key: 'quantity', sortable: true } ];
    else if (currentActiveSubTab === 'fund-deposits') columns = [ { header: 'Date/Time', key: 'timestamp', sortable: true }, { header: 'User', key: 'user', sortable: true }, { header: 'Amount', key: 'amount', sortable: true } ];
    else if (currentActiveSubTab === 'fund-withdrawals') columns = [ { header: 'Date/Time', key: 'timestamp', sortable: true }, { header: 'Sender', key: 'sender', sortable: true }, { header: 'Recipient', key: 'recipient', sortable: true }, { header: 'Amount', key: 'amount', sortable: true } ];
    else if (currentActiveSubTab === 'crime') columns = [ { header: 'Date/Time', key: 'timestamp', sortable: true }, { header: 'User', key: 'user', sortable: true }, { header: 'Crime Type', key: 'crimeType', sortable: true }, { header: 'Result', key: 'result', sortable: true } ];

    const displayArea = document.getElementById('factionOverviewDisplayArea');
    if (displayArea && columns.length > 0) { // Ensure we have columns for table rendering
        const currentTitle = displayArea.querySelector('.fo-view-title')?.textContent.replace('✨ ', ''); // Keep current title
        renderDynamicDataTable(displayArea, filteredData, columns, currentTitle);
    }
}


// =====================================================================================================================
// LOGISTICS & OVERSIGHT DATA PROCESSING FUNCTIONS
// These functions perform aggregation and calculations for the summary tabs.
// =====================================================================================================================

/**
 * Populates data for the Logistics tab.
 * This will query `historicalArmoryLogs` and display summaries.
 */
function populateLogisticsData() {
    const stockBody = document.getElementById('foLogisticsStockBody');
    const largeMovesBody = document.getElementById('foLogisticsLargeMovesBody');

    if (!stockBody || !largeMovesBody) return;

    // Placeholder for actual data processing from historicalArmoryLogs
    stockBody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 15px;">Processing historical stock data...</td></tr>`;
    largeMovesBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 15px;">Analyzing large movements...</td></tr>`;

    // Example conceptual data (replace with actual calculations from historicalArmoryLogs)
    const currentStockExample = [
        { itemName: 'Medical Kit', onHandQty: 250, avgDailyUse: 15, weeklyChange: -105 },
        { itemName: 'Small Arms Ammo', onHandQty: 15000, avgDailyUse: 500, weeklyChange: -3500 },
        { itemName: 'Flash Grenade', onHandQty: 80, avgDailyUse: 5, weeklyChange: -35 },
    ];
    const largeMovesExample = [
        { timestamp: new Date().getTime() - 86400000, user: 'Player Alpha', item: 'Heavy Artillery', quantity: 1, type: 'Withdrawal' },
        { timestamp: new Date().getTime() - (2 * 86400000), user: 'Player Beta', item: 'Cash', quantity: 1000000, type: 'Deposit' },
    ];

    let stockHtml = '';
    currentStockExample.forEach(item => {
        stockHtml += `
            <tr>
                <td>${item.itemName}</td>
                <td>${item.onHandQty}</td>
                <td>${item.avgDailyUse}</td>
                <td style="color: ${item.weeklyChange < 0 ? '#dc3545' : '#28a745'};">${item.weeklyChange}</td>
            </tr>
        `;
    });
    stockBody.innerHTML = stockHtml;

    let largeMovesHtml = '';
    largeMovesExample.forEach(move => {
        largeMovesHtml += `
            <tr>
                <td>${formatTimestampToLocale(move.timestamp)}</td>
                <td>${move.user}</td>
                <td>${move.item}</td>
                <td>${move.quantity.toLocaleString()}</td>
                <td>${move.type}</td>
            </tr>
        `;
    });
    largeMovesBody.innerHTML = largeMovesHtml;

    // TODO: Implement actual calculation logic using `historicalArmoryLogs` from Firebase
    // Example: Loop through historicalArmoryLogs, group by item, calculate sums/averages.
}

/**
 * Populates data for the Oversight tab.
 * This will query `historicalFundLogs` and `historicalArmoryLogs` and display KPIs and alerts.
 */
function populateOversightData() {
    const totalFundsDepositedEl = document.getElementById('oversightTotalFundsDeposited');
    const totalItemsDepositedEl = document.getElementById('oversightTotalItemsDeposited');
    const totalFundsWithdrawnEl = document.getElementById('oversightTotalFundsWithdrawn');
    const totalItemsWithdrawnEl = document.getElementById('oversightTotalItemsWithdrawn');
    const topUsersList = document.getElementById('oversightTopUsersList');
    const alertsList = document.getElementById('oversightAlertsList');

    if (!totalFundsDepositedEl || !topUsersList || !alertsList) return;

    // Placeholder for actual data processing from historical logs
    totalFundsDepositedEl.textContent = 'Calculating...';
    totalItemsDepositedEl.textContent = 'Calculating...';
    totalFundsWithdrawnEl.textContent = 'Calculating...';
    totalItemsWithdrawnEl.textContent = 'Calculating...';
    topUsersList.innerHTML = '<li>Loading top users...</li>';
    alertsList.innerHTML = '<li>Checking for alerts...</li>';

    // Example conceptual data (replace with actual calculations from historicalFundLogs/ArmoryLogs)
    const sevenDaysAgo = new Date().getTime() - (7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date().getTime() - (30 * 24 * 60 * 60 * 1000);

    // Filter historical data for the last 7 days for KPIs
    const recentFundLogs = historicalFundLogs.filter(log => log.timestamp >= sevenDaysAgo);
    const recentArmoryLogs = historicalArmoryLogs.filter(log => log.timestamp >= sevenDaysAgo);

    let totalFundsDep = recentFundLogs.filter(log => log.category === 'depositFunds').reduce((sum, log) => sum + (log.amount || 0), 0);
    let totalFundsWith = recentFundLogs.filter(log => log.category === 'giveFunds').reduce((sum, log) => sum + (log.amount || 0), 0);
    let totalItemsDep = recentArmoryLogs.filter(log => log.category === 'armoryDeposit').reduce((sum, log) => sum + (log.quantity || 0), 0);
    let totalItemsWith = recentArmoryLogs.filter(log => log.category === 'armoryAction').reduce((sum, log) => sum + (log.quantity || 0), 0);

    totalFundsDepositedEl.textContent = `$${totalFundsDep.toLocaleString()}`;
    totalItemsDepositedEl.textContent = totalItemsDep.toLocaleString();
    totalFundsWithdrawnEl.textContent = `$${totalFundsWith.toLocaleString()}`;
    totalItemsWithdrawnEl.textContent = totalItemsWith.toLocaleString();

    // Calculate top active users (conceptual, from both armory and fund activities)
    const userActivity = {}; // user ID -> count of activities
    [...historicalArmoryLogs, ...historicalFundLogs]
        .filter(log => log.timestamp >= thirtyDaysAgo) // Filter for last 30 days
        .forEach(log => {
            const userId = log.user; // Assuming 'user' field exists
            if (userId) {
                userActivity[userId] = (userActivity[userId] || 0) + 1;
            }
        });

    const sortedUsers = Object.entries(userActivity)
        .sort(([, countA], [, countB]) => countB - countA)
        .slice(0, 3); // Top 3

    let topUsersHtml = '';
    if (sortedUsers.length > 0) {
        sortedUsers.forEach(([userId, count]) => {
            // You might need to map userId to playerName here (from a faction members list)
            const playerName = userId; // Placeholder
            topUsersHtml += `<li>${playerName} (${count} actions)</li>`;
        });
    } else {
        topUsersHtml = '<li>No significant activity in the last 30 days.</li>';
    }
    topUsersList.innerHTML = topUsersHtml;


    // Generate alerts (conceptual, based on pre-defined or configurable rules)
    let alertsHtml = '';
    const activeAlerts = generateAlertsFromData(historicalArmoryLogs, historicalFundLogs); // Function to check rules
    if (activeAlerts.length > 0) {
        activeAlerts.forEach(alert => {
            alertsHtml += `<li>🚨 ${alert}</li>`;
        });
    } else {
        alertsHtml = '<li>No active alerts found.</li>';
    }
    alertsList.innerHTML = alertsHtml;

    // TODO: Implement actual calculation logic for KPIs, Top Users, and Alerts
    // - Use `historicalArmoryLogs` and `historicalFundLogs`
    // - Define specific alert rules (e.g., thresholds for withdrawals, frequent activity)
}

/**
 * Placeholder: Function to generate alerts based on predefined/configurable rules.
 * @param {Array<Object>} armoryData Filtered historical armory logs.
 * @param {Array<Object>} fundData Filtered historical fund logs.
 * @returns {Array<string>} An array of alert messages.
 */
function generateAlertsFromData(armoryData, fundData) {
    const alerts = [];
    const oneDayMs = 24 * 60 * 60 * 1000;
    const now = new Date().getTime();

    // Example Rule 1: High frequency Medical Kit withdrawals
    const medKitWithdrawalsLast24Hrs = armoryData.filter(log =>
        log.category === 'armoryAction' &&
        log.item === 'Medical Kit' &&
        log.timestamp >= (now - oneDayMs)
    );
    const userMedKitCounts = {};
    medKitWithdrawalsLast24Hrs.forEach(log => {
        userMedKitCounts[log.user] = (userMedKitCounts[log.user] || 0) + (log.quantity || 0);
    });
    for (const user in userMedKitCounts) {
        if (userMedKitCounts[user] >= 10) { // Alert if 10 or more Med Kits withdrawn in 24 hrs
            alerts.push(`${user}: ${userMedKitCounts[user]} Med Kits withdrawn in last 24 hrs (High Frequency!)`);
        }
    }

    // Example Rule 2: Large single fund withdrawal
    const largeFundWithdrawals = fundData.filter(log =>
        log.category === 'giveFunds' &&
        log.amount >= 5000000 // Alert if >= $5,000,000 withdrawn
    );
    largeFundWithdrawals.forEach(log => {
        alerts.push(`${log.sender} withdrew $${log.amount.toLocaleString()} to ${log.recipient} (Large Withdrawal!)`);
    });

    // TODO: Implement more alert rules based on your faction's specific needs.
    // These rules can be made configurable via the 'Cog' settings.

    return alerts;
}


// =====================================================================================================================
// ACCESS CONTROL & SETTINGS
// Functions for managing banker permissions and displaying the settings modal.
// =====================================================================================================================

/**
 * Checks if the current logged-in user has permission to view the Faction Overview page.
 * Permissions: Leader, Co-leader, or designated Banker.
 * This function will be called on page load.
 * @returns {Promise<boolean>} True if user has access, false otherwise.
 */
async function checkIfUserHasFactionOverviewAccess() {
    const user = auth.currentUser;
    if (!user) {
        console.warn("Access Check: User not logged in.");
        return false; // Not logged in, no access
    }

    try {
        // Fetch user's profile to get their Torn ID and position
        const userProfileDoc = await db.collection('userProfiles').doc(user.uid).get();
        if (!userProfileDoc.exists) {
            console.warn("Access Check: User profile not found in Firebase.");
            return false; // Profile missing, no access
        }
        const userProfileData = userProfileDoc.data();
        const userTornId = userProfileData.tornProfileId;
        const userPosition = userProfileData.position ? userProfileData.position.toLowerCase() : '';

        // Check if user is Leader or Co-leader
        if (userPosition === 'leader' || userPosition === 'co-leader') {
            console.log("Access Check: User is Leader/Co-leader. Access granted.");
            return true;
        }

        // Fetch designated bankers list from Firebase
        const warDocRef = db.collection('factionWars').doc('currentWar'); // Using 'currentWar' as the central doc
        const warDoc = await warDocRef.get();
        if (warDoc.exists) {
            designatedBankers = warDoc.data().designatedBankers || []; // Load into global variable
        } else {
            designatedBankers = []; // No bankers set yet
        }

        // Check if user's Torn ID is in the designated bankers list
        const hasAccess = designatedBankers.includes(String(userTornId));
        if (hasAccess) {
            console.log("Access Check: User is a designated Banker. Access granted.");
        } else {
            console.warn("Access Check: User is neither Leader/Co-leader nor a designated Banker. Access denied.");
        }
        return hasAccess;

    } catch (error) {
        console.error("Error during Faction Overview access check:", error);
        return false;
    }
}

/**
 * Displays the modal for managing designated bankers.
 * Only accessible to Leaders/Co-leaders.
 */
async function showBankerSettingsModal() {
    const user = auth.currentUser;
    if (!user) {
        showCustomAlert("You must be logged in to access these settings.", "Access Denied");
        return;
    }

    // Check if the current user is a Leader or Co-leader
    try {
        const userProfileDoc = await db.collection('userProfiles').doc(user.uid).get();
        const userPosition = userProfileDoc.exists ? userProfileDoc.data().position.toLowerCase() : '';

        if (userPosition !== 'leader' && userPosition !== 'co-leader') {
            showCustomAlert("Only Leaders and Co-leaders can manage banker access.", "Permission Denied");
            return;
        }

        // Dynamically create the modal HTML
        const modalHtml = `
            <div id="bankerSettingsModalOverlay" class="fo-modal-overlay">
                <div class="fo-modal-content">
                    <button id="bankerSettingsCloseButton" class="fo-modal-close-button">&times;</button>
                    <h3 class="fo-modal-title">Manage Faction Overview Access</h3>
                    <p class="fo-modal-description">Designate up to 3 faction members as 'Bankers' who can view the Faction Overview page.</p>

                    <div id="bankerSelectionContainer" class="fo-banker-selection-grid">
                        <p style="text-align: center; padding: 20px;">Loading faction members...</p>
                        </div>

                    <div class="fo-modal-actions">
                        <button id="saveBankerSettingsButton" class="fo-button fo-button-primary">Save Bankers</button>
                        <button id="cancelBankerSettingsButton" class="fo-button fo-button-secondary">Cancel</button>
                    </div>
                    <p class="fo-modal-note">Note: Leaders and Co-leaders always have access.</p>
                </div>
            </div>
        `;

        // Inject modal HTML into the body
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Get modal elements
        const modalOverlay = document.getElementById('bankerSettingsModalOverlay');
        const closeButton = document.getElementById('bankerSettingsCloseButton');
        const saveButton = document.getElementById('saveBankerSettingsButton');
        const cancelButton = document.getElementById('cancelBankerSettingsButton');
        const bankerSelectionContainer = document.getElementById('bankerSelectionContainer');

        // Show the modal
        if (modalOverlay) {
            modalOverlay.classList.add('visible');
        }

        // Load and display faction members for selection
        await populateBankerCheckboxes(bankerSelectionContainer);

        // Event listeners for the modal
        closeButton.addEventListener('click', () => modalOverlay.remove());
        cancelButton.addEventListener('click', () => modalOverlay.remove());
        modalOverlay.addEventListener('click', (event) => {
            if (event.target === modalOverlay) modalOverlay.remove(); // Close if click outside content
        });

        saveButton.addEventListener('click', async () => {
            await saveDesignatedBankers(bankerSelectionContainer, modalOverlay);
        });

    } catch (error) {
        console.error("Error showing banker settings modal:", error);
        showCustomAlert(`Failed to load banker settings: ${error.message}`, "Error");
    }
}

/**
 * Populates checkboxes for all faction members, indicating current designated bankers.
 * @param {HTMLElement} container The container to inject checkboxes into.
 */
async function populateBankerCheckboxes(container) {
    if (!factionOverviewGlobalYourFactionID || !factionOverviewUserApiKey) {
        container.innerHTML = `<p style="color: red;">Cannot load members: Faction ID or API Key missing.</p>`;
        return;
    }

    container.innerHTML = `<p style="text-align: center; padding: 20px;">Fetching faction members...</p>`;

    try {
        // Fetch all faction members (assuming basic info includes name and ID)
        const factionMembersData = await fetchTornApiData(
            `https://api.torn.com/v2/faction/${factionOverviewGlobalYourFactionID}?selections=members`,
            'MyTornPA_BankerSelectMembers'
        );

        if (!factionMembersData.members) {
            container.innerHTML = `<p style="color: orange;">No faction members found or API error.</p>`;
            return;
        }

        const membersArray = Object.values(factionMembersData.members);
        // Sort members alphabetically by name for easier selection
        membersArray.sort((a, b) => a.name.localeCompare(b.name));

        let checkboxesHtml = '';
        membersArray.forEach(member => {
            const memberId = String(member.id); // Ensure ID is string
            const memberName = member.name || `Unknown (${memberId})`;
            const isLeaderOrCoLeader = member.position.toLowerCase() === 'leader' || member.position.toLowerCase() === 'co-leader';
            const isDisabled = isLeaderOrCoLeader ? 'disabled' : ''; // Leaders/Co-leaders always have access
            const isChecked = isLeaderOrCoLeader || designatedBankers.includes(memberId) ? 'checked' : '';

            checkboxesHtml += `
                <div class="fo-checkbox-item">
                    <input type="checkbox" id="banker-${memberId}" value="${memberId}" ${isChecked} ${isDisabled}>
                    <label for="banker-${memberId}">${memberName} ${isLeaderOrCoLeader ? '(Leader/Co-leader)' : ''}</label>
                </div>
            `;
        });
        container.innerHTML = checkboxesHtml;

    } catch (error) {
        console.error("Error populating banker checkboxes:", error);
        container.innerHTML = `<p style="color: red;">Error loading members: ${error.message}</p>`;
    }
}

/**
 * Saves the selected designated bankers to Firebase.
 * @param {HTMLElement} container The container holding the checkboxes.
 * @param {HTMLElement} modalOverlay The modal overlay element to close.
 */
async function saveDesignatedBankers(container, modalOverlay) {
    const selectedBankerIds = Array.from(container.querySelectorAll('input[type="checkbox"]:checked:not(:disabled)')).map(cb => cb.value);

    // Add back Leaders/Co-leaders to the list, as they always implicitly have access
    // This requires fetching their IDs from factionApiFullData or similar
    if (factionApiFullData && factionApiFullData.members) {
        Object.values(factionApiFullData.members).forEach(member => {
            if (member.position.toLowerCase() === 'leader' || member.position.toLowerCase() === 'co-leader') {
                if (!selectedBankerIds.includes(String(member.id))) {
                    selectedBankerIds.push(String(member.id));
                }
            }
        });
    }

    if (selectedBankerIds.length > 3) {
        showCustomAlert("You can designate a maximum of 3 additional bankers (excluding Leaders/Co-leaders). Please unselect some members.", "Limit Exceeded");
        return;
    }

    try {
        const warDocRef = db.collection('factionWars').doc('currentWar');
        await warDocRef.set({ designatedBankers: selectedBankerIds }, { merge: true });
        designatedBankers = selectedBankerIds; // Update global state
        modalOverlay.remove(); // Close the modal
        showCustomAlert("Banker access settings saved successfully!", "Success");
        console.log("Designated bankers saved:", designatedBankerIds);
    } catch (error) {
        console.error("Error saving designated bankers:", error);
        showCustomAlert(`Failed to save banker settings: ${error.message}`, "Save Error");
    }
}


// =====================================================================================================================
// UTILITY FUNCTIONS
// General helper functions (copied/adapted from your existing JS for consistency).
// =====================================================================================================================

/**
 * Formats a timestamp (in milliseconds) to a locale-specific date and time string.
 * @param {number} timestampMs - The timestamp in milliseconds.
 * @returns {string} Formatted date and time string.
 */
function formatTimestampToLocale(timestampMs) {
    if (typeof timestampMs !== 'number') return 'N/A';
    const date = new Date(timestampMs);
    return date.toLocaleString([], {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false // Use 24-hour format
    });
}

/**
 * Displays a custom alert box. (Copied from your existing JS)
 * @param {string} message The message to display.
 * @param {string} [title="Alert"] Optional title for the alert box.
 */
function showCustomAlert(message, title = "Alert") {
    // --- Create Elements ---
    const overlay = document.createElement('div');
    const alertBox = document.createElement('div');
    const titleEl = document.createElement('h4');
    const messageEl = document.createElement('p');
    const closeBtn = document.createElement('button');

    // --- Apply Styles (using inline styles, consider moving to CSS classes for better maintainability) ---
    // These styles are adapted from your provided global.css and modal styles.
    Object.assign(overlay.style, {
        position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex',
        justifyContent: 'center', alignItems: 'center', zIndex: '2000',
        backdropFilter: 'blur(5px)'
    });
    Object.assign(alertBox.style, {
        background: '#1e2a38', padding: '25px 30px', borderRadius: '8px',
        border: '1px solid #4a6a8a', boxShadow: '0 5px 20px rgba(0, 0, 0, 0.6)',
        textAlign: 'center', width: '90%', maxWidth: '450px', color: '#ecf0f1'
    });
    Object.assign(titleEl.style, {
        margin: '0 0 15px 0', color: '#3498db', fontSize: '1.4em', fontWeight: '600'
    });
    Object.assign(messageEl.style, {
        margin: '0 0 25px 0', fontSize: '1.1em', lineHeight: '1.6'
    });
    Object.assign(closeBtn.style, {
        backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '5px',
        padding: '10px 20px', fontSize: '1em', cursor: 'pointer', transition: 'background-color 0.2s ease'
    });
    closeBtn.onmouseover = () => { closeBtn.style.backgroundColor = '#2980b9'; };
    closeBtn.onmouseout = () => { closeBtn.style.backgroundColor = '#3498db'; };

    //--- Set Content ---
    titleEl.textContent = title;
    messageEl.textContent = message;
    closeBtn.textContent = 'OK';

    //--- Add Event Listeners for Cleanup ---
    const closeModal = () => {
        document.body.removeChild(overlay);
    };
    closeBtn.onclick = closeModal;
    overlay.onclick = (event) => {
        if (event.target === overlay) closeModal();
    };

    //--- Assemble and Append to DOM ---
    alertBox.appendChild(titleEl);
    alertBox.appendChild(messageEl);
    alertBox.appendChild(closeBtn);
    overlay.appendChild(alertBox);
    document.body.appendChild(overlay);
}

/**
 * Displays a custom confirmation box. (Copied from your existing JS)
 * @param {string} message The confirmation message to display.
 * @param {string} [title="Confirm"] Optional title for the confirmation box.
 * @returns {Promise<boolean>} A promise that resolves to true (Yes) or false (No).
 */
function showCustomConfirm(message, title = "Confirm") {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        const alertBox = document.createElement('div');
        const titleEl = document.createElement('h4');
        const messageEl = document.createElement('p');
        const buttonWrapper = document.createElement('div');
        const yesBtn = document.createElement('button');
        const noBtn = document.createElement('button');

        Object.assign(overlay.style, {
            position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex',
            justifyContent: 'center', alignItems: 'center', zIndex: '2000',
            backdropFilter: 'blur(5px)'
        });
        Object.assign(alertBox.style, {
            background: '#1e2a38', padding: '25px 30px', borderRadius: '8px',
            border: '1px solid #4a6a8a', boxShadow: '0 5px 20px rgba(0, 0, 0, 0.6)',
            textAlign: 'center', width: '90%', maxWidth: '450px', color: '#ecf0f1'
        });
        Object.assign(titleEl.style, {
            margin: '0 0 15px 0', color: '#e0a71a', fontSize: '1.4em', fontWeight: '600'
        });
        Object.assign(messageEl.style, {
            margin: '0 0 25px 0', fontSize: '1.1em', lineHeight: '1.6', whiteSpace: 'pre-wrap'
        });
        Object.assign(buttonWrapper.style, {
            display: 'flex', justifyContent: 'center', gap: '15px'
        });
        Object.assign(yesBtn.style, {
            backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px',
            padding: '10px 25px', fontSize: '1em', cursor: 'pointer', fontWeight: 'bold'
        });
        Object.assign(noBtn.style, {
            backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px',
            padding: '10px 25px', fontSize: '1em', cursor: 'pointer', fontWeight: 'bold'
        });

        titleEl.textContent = title;
        messageEl.textContent = message;
        yesBtn.textContent = 'Yes';
        noBtn.textContent = 'No';

        const closeModal = (resolution) => {
            document.body.removeChild(overlay);
            resolve(resolution);
        };

        yesBtn.onclick = () => closeModal(true);
        noBtn.onclick = () => closeModal(false);
        overlay.onclick = (event) => {
            if (event.target === overlay) closeModal(false);
        };

        buttonWrapper.appendChild(noBtn);
        buttonWrapper.appendChild(yesBtn);
        alertBox.appendChild(titleEl);
        alertBox.appendChild(messageEl);
        alertBox.appendChild(buttonWrapper);
        overlay.appendChild(alertBox);
        document.body.appendChild(overlay);
    });
}


// =====================================================================================================================
// INITIALIZATION ON PAGE LOAD
// This section handles the initial setup when the Faction Overview page loads.
// =====================================================================================================================

document.addEventListener('DOMContentLoaded', function() {
    // Get reference to the main content container here as it's now in the HTML
    factionOverviewPageContentContainer = document.getElementById('factionOverviewPageContentContainer');

    // Authenticate user and fetch API key
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                const userProfileDoc = await db.collection('userProfiles').doc(user.uid).get();
                if (userProfileDoc.exists && userProfileDoc.data().tornApiKey) {
                    factionOverviewUserApiKey = userProfileDoc.data().tornApiKey;
                    factionOverviewGlobalYourFactionID = userProfileDoc.data().faction_id; // Get user's faction ID

                    // Check user access before rendering the full page
                    const hasAccess = await checkIfUserHasFactionOverviewAccess();
                    if (hasAccess) {
                        renderFactionOverviewPageLayout(); // Render full UI only if user has access
                        // Initial data fetch and continuous refresh setup
                        await fetchAllRawFactionNewsData(); // Fetch initial recent data
                        // Set up periodic refresh (e.g., every 5 minutes)
                        factionOverviewRefreshInterval = setInterval(fetchAllRawFactionNewsData, 5 * 60 * 1000); // 5 minutes
                        console.log("Faction Overview: Automatic data refresh set to 5 minutes.");
                    } else {
                        // Display access denied message
                        if (factionOverviewPageContentContainer) {
                            factionOverviewPageContentContainer.innerHTML = `
                                <div class="fo-access-denied">
                                    <h3>Access Denied</h3>
                                    <p>You do not have permission to view the Faction Overview page.</p>
                                    <p>Only Leaders, Co-leaders, and designated Bankers can access this feature.</p>
                                    <p>Please contact your faction's leadership if you believe this is an error.</p>
                                </div>
                            `;
                        }
                    }

                } else {
                    // User logged in but no API key or faction ID
                    if (factionOverviewPageContentContainer) {
                        factionOverviewPageContentContainer.innerHTML = `
                            <div class="fo-access-denied">
                                <h3>Torn API Key Required</h3>
                                <p>Please log in and ensure your Torn API Key is correctly set in your user profile to view this page.</p>
                            </div>
                        `;
                    }
                    console.warn("Faction Overview: API Key or Faction ID missing from user profile.");
                }
            } catch (error) {
                console.error("Faction Overview: Error during user authentication/profile fetch:", error);
                if (factionOverviewPageContentContainer) {
                    factionOverviewPageContentContainer.innerHTML = `
                        <div class="fo-access-denied">
                            <h3>Error Loading Page</h3>
                            <p>An error occurred while trying to load your profile and permissions: ${error.message}</p>
                            <p>Please try refreshing the page or contact support.</p>
                        </div>
                    `;
                }
            }
        } else {
            // User is not logged in
            if (factionOverviewPageContentContainer) {
                factionOverviewPageContentContainer.innerHTML = `
                    <div class="fo-access-denied">
                        <h3>Login Required</h3>
                        <p>Please log in to your MyTornPA account to access the Faction Overview.</p>
                    </div>
                `;
            }
            console.log("Faction Overview: User not logged in.");
        }
    });
});