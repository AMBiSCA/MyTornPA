// mysite/js/broker.js (Final Version with Shorthand Input)

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const itemTableBody = document.getElementById('item-table-body');
    const currentItemsSpan = document.getElementById('current-items');
    const brokerApiKeyErrorDiv = document.getElementById('brokerApiKeyError');
    const searchInput = document.getElementById('item-search');
    const searchResultsDiv = document.getElementById('search-results');
    const addItemBtn = document.getElementById('add-item-btn');

    // Global variables
    let allItems = {};
    let portfolio = {}; // Will store { itemId: { quantity: X, buyPrice: Y } }
    let watchlist = [];
    let tornApiKey = null;
    let selectedItemId = null;
    const PORTFOLIO_STORAGE_KEY = 'tornBrokerPortfolio';

    // --- Data Persistence ---
    function loadPortfolio() {
        const savedData = JSON.parse(localStorage.getItem(PORTFOLIO_STORAGE_KEY));
        if (savedData) {
            portfolio = savedData.portfolio || {};
            watchlist = savedData.watchlist || [];
        }
    }

    function savePortfolio() {
        const dataToSave = {
            watchlist: watchlist,
            portfolio: portfolio
        };
        localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(dataToSave));
    }
    
    // --- NEW HELPER FUNCTION ---
    // Parses strings like "100k", "1.5m", or "2b" into numbers
    function parseShorthandNumber(str) {
        if (typeof str !== 'string' || str.trim() === '') {
            return 0;
        }

        const cleanedStr = str.toLowerCase().trim();
        const lastChar = cleanedStr.charAt(cleanedStr.length - 1);
        
        let numPart = cleanedStr;
        let multiplier = 1;

        if (lastChar === 'k') {
            multiplier = 1000;
            numPart = cleanedStr.slice(0, -1);
        } else if (lastChar === 'm') {
            multiplier = 1000000;
            numPart = cleanedStr.slice(0, -1);
        } else if (lastChar === 'b') {
            multiplier = 1000000000;
            numPart = cleanedStr.slice(0, -1);
        }

        const num = parseFloat(numPart);

        if (isNaN(num)) {
            return 0;
        }

        return Math.round(num * multiplier);
    }


    // --- Firebase Authentication ---
    if (typeof auth !== 'undefined' && typeof db !== 'undefined') {
        auth.onAuthStateChanged(async function(user) {
            if (user) {
                try {
                    const userDoc = await db.collection('userProfiles').doc(user.uid).get();
                    if (userDoc.exists) {
                        tornApiKey = userDoc.data().tornApiKey;
                        if (tornApiKey) {
                            brokerApiKeyErrorDiv.textContent = '';
                            await fetchAllItems(tornApiKey);
                            loadPortfolio();
                            refreshWatchlistDisplay();
                        } else {
                            handleApiError('Your Torn API Key is not set in your profile.');
                        }
                    }
                } catch (error) {
                    handleApiError('Error loading your profile.');
                }
            } else {
                handleApiError('Please sign in to use the Broker\'s Hub.');
            }
        });
    }

    function handleApiError(message) {
        if (brokerApiKeyErrorDiv) brokerApiKeyErrorDiv.textContent = message;
        itemTableBody.innerHTML = `<tr><td colspan="7" class="error-message">${message}</td></tr>`;
    }

    // --- Data Fetching ---
    async function fetchAllItems(apiKey) {
        try {
            const response = await fetch(`https://api.torn.com/torn/?selections=items&key=${apiKey}`);
            const data = await response.json();
            if (data.error) throw new Error(data.error.error);
            allItems = data.items;
        } catch (error) {
            handleApiError(`Could not fetch item data: ${error.message}`);
        }
    }

    // --- Core Calculation & Rendering ---
    function updateRowCalculations(row) {
        const itemId = row.dataset.itemId;
        const marketPrice = parseFloat(row.dataset.marketPrice) || 0;
        
        const quantityInput = row.querySelector('.quantity-input');
        const buyPriceInput = row.querySelector('.buy-price-input');
        const currentValueCell = row.querySelector('.current-value-cell');
        const profitLossCell = row.querySelector('.profit-loss-cell');

        // --- UPDATED to use the new parsing function ---
        const quantity = parseShorthandNumber(quantityInput.value);
        const buyPrice = parseShorthandNumber(buyPriceInput.value);

        // Save the raw string value so "800k" is preserved on refresh
        if (portfolio[itemId]) {
            portfolio[itemId].quantity = quantityInput.value;
            portfolio[itemId].buyPrice = buyPriceInput.value;
            savePortfolio();
        }

        const currentValue = quantity * marketPrice;
        const totalCost = quantity * buyPrice;
        const profitLoss = currentValue - totalCost;

        currentValueCell.textContent = '$' + currentValue.toLocaleString();
        profitLossCell.textContent = '$' + profitLoss.toLocaleString();

        profitLossCell.classList.remove('profit', 'loss', 'neutral');
        if (profitLoss > 0) {
            profitLossCell.classList.add('profit');
        } else if (profitLoss < 0) {
            profitLossCell.classList.add('loss');
        } else {
            profitLossCell.classList.add('neutral');
        }
    }

    async function refreshWatchlistDisplay() {
        if (watchlist.length === 0) {
            itemTableBody.innerHTML = `<tr><td colspan="7">Add an item to your portfolio to begin...</td></tr>`;
            currentItemsSpan.textContent = '0';
            return;
        }

        itemTableBody.innerHTML = `<tr><td colspan="7">Fetching market data for ${watchlist.length} item(s)...</td></tr>`;
        currentItemsSpan.textContent = watchlist.length;

        const promises = watchlist.map(itemId =>
            fetch(`https://api.torn.com/v2/market/${itemId}?selections=itemmarket&key=${tornApiKey}`).then(res => res.json())
        );

        const results = await Promise.all(promises);
        itemTableBody.innerHTML = '';

        for (let i = 0; i < watchlist.length; i++) {
            const itemId = watchlist[i];
            const itemInfo = allItems[itemId];
            const marketData = results[i];
            const itemPortfolioData = portfolio[itemId] || { quantity: '0', buyPrice: '0' };

            const liveMarketPrice = marketData?.itemmarket?.item?.average_price || 0;

            const row = document.createElement('tr');
            row.dataset.itemId = itemId;
            row.dataset.marketPrice = liveMarketPrice;

            // --- UPDATED input type from "number" to "text" ---
            row.innerHTML = `
                <td><a href="https://www.torn.com/imarket.php#/p=shop&step=browse&type=${itemId}" target="_blank" class="item-link">${itemInfo.name}</a></td>
                <td>$${liveMarketPrice.toLocaleString()}</td>
                <td><input type="text" class="quantity-input" value="${itemPortfolioData.quantity}" placeholder="0"></td>
                <td><input type="text" class="buy-price-input" value="${itemPortfolioData.buyPrice}" placeholder="0"></td>
                <td class="current-value-cell">$0</td>
                <td class="profit-loss-cell">$0</td>
                <td><button class="action-btn remove-btn" data-id="${itemId}">Remove</button></td>
            `;

            itemTableBody.appendChild(row);
            
            row.querySelector('.quantity-input').addEventListener('input', () => updateRowCalculations(row));
            row.querySelector('.buy-price-input').addEventListener('input', () => updateRowCalculations(row));
            
            updateRowCalculations(row);
        }
    }

    // --- Event Listeners ---
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase();
        if (query.length < 3) {
            searchResultsDiv.style.display = 'none';
            return;
        }
        const matches = Object.entries(allItems)
            .filter(([id, item]) => item.name.toLowerCase().includes(query))
            .slice(0, 10);
        displaySearchResults(matches);
    });

    function displaySearchResults(matches) {
        if (matches.length === 0) {
            searchResultsDiv.style.display = 'none';
            return;
        }
        searchResultsDiv.innerHTML = '';
        matches.forEach(([id, item]) => {
            const resultItem = document.createElement('div');
            resultItem.textContent = item.name;
            resultItem.classList.add('search-result-item');
            resultItem.addEventListener('click', () => {
                searchInput.value = item.name;
                selectedItemId = id;
                searchResultsDiv.style.display = 'none';
            });
            searchResultsDiv.appendChild(resultItem);
        });
        searchResultsDiv.style.display = 'block';
    }

    addItemBtn.addEventListener('click', () => {
        if (selectedItemId && !watchlist.includes(selectedItemId)) {
            watchlist.push(selectedItemId);
            portfolio[selectedItemId] = { quantity: '0', buyPrice: '0' };
            savePortfolio();
            refreshWatchlistDisplay();
        }
        searchInput.value = '';
        selectedItemId = null;
    });

    itemTableBody.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('remove-btn')) {
            const itemIdToRemove = e.target.dataset.id;
            watchlist = watchlist.filter(id => id !== itemIdToRemove);
            delete portfolio[itemIdToRemove];
            savePortfolio();
            refreshWatchlistDisplay();
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.filter-group')) {
            searchResultsDiv.style.display = 'none';
        }
    });
});


// --- Orientation Handler (Unchanged) ---
let portraitBlocker = null;
let landscapeBlocker = null;
function createOverlays(){/*... function content unchanged ...*/}
function handleOrientation(){/*... function content unchanged ...*/}
document.addEventListener('DOMContentLoaded', handleOrientation);
window.addEventListener('resize', handleOrientation);
window.addEventListener('orientationchange', handleOrientation);