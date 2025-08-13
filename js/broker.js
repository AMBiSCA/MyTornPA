console.log("--- LATEST BROKER.JS FILE LOADED ---"); 

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
    let userInventory = {};
    let watchlist = [];
    let tornApiKey = null;
    let selectedItemId = null;

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
                            // Initialize the page data
                            await Promise.all([
                                fetchAllItems(tornApiKey),
                                fetchUserInventory(tornApiKey)
                            ]);
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
        itemTableBody.innerHTML = `<tr><td colspan="5" class="error-message">${message}</td></tr>`;
    }

    // --- Data Fetching Functions ---
    async function fetchAllItems(apiKey) {
        itemTableBody.innerHTML = '<tr><td colspan="5">Loading item data from Torn...</td></tr>';
        try {
            const response = await fetch(`https://api.torn.com/torn/?selections=items&key=${apiKey}`);
            const data = await response.json();
            if (data.error) throw new Error(data.error.error);
            allItems = data.items;
            itemTableBody.innerHTML = '<tr><td colspan="5">Add an item to your watchlist to begin...</td></tr>';
        } catch (error) {
            handleApiError(`Could not fetch item data: ${error.message}`);
        }
    }

    async function fetchUserInventory(apiKey) {
        try {
            const response = await fetch(`https://api.torn.com/user/?selections=inventory&key=${apiKey}`);
            const data = await response.json();
            if (data.error) throw new Error(data.error.error);
            
            userInventory = {};
            if (data.inventory) {
                // -- FIX 1: The API returns an object, so we use Object.values() to get an array --
                Object.values(data.inventory).forEach(item => {
                    userInventory[item.ID] = item.quantity;
                });
            }
        } catch (error) {
            console.error("Could not fetch user inventory:", error.message);
        }
    }

    // mysite/js/broker.js (Corrected Function)

async function fetchWatchlistPrices(apiKey, itemIds) {
    if (itemIds.length === 0) return {};
    try {
        // CORRECTED: The URL now includes /v2/ as it should.
        const response = await fetch(`https://api.torn.com/market/v2/${itemIds.join(',')}?selections=itemmarket,bazaar&key=${apiKey}`);
        const data = await response.json();
        if (data.error) {
            // This is where the error in your screenshot is coming from.
            throw new Error(data.error.error);
        }
        return data;
    } catch (error) {
        console.error("Could not fetch watchlist prices:", error.message);
        // Display the specific error in the table
        itemTableBody.innerHTML = `<tr><td colspan="5" class="error-message">API Error: ${error.message}</td></tr>`;
        return {};
    }
}

    // --- UI Rendering ---
    async function refreshWatchlistDisplay() {
        if (watchlist.length === 0) {
            itemTableBody.innerHTML = '<tr><td colspan="5">Add an item to your watchlist to begin...</td></tr>';
            currentItemsSpan.textContent = '0';
            return;
        }

        itemTableBody.innerHTML = `<tr><td colspan="5">Fetching prices for ${watchlist.length} item(s)...</td></tr>`;
        currentItemsSpan.textContent = watchlist.length;

        const priceData = await fetchWatchlistPrices(tornApiKey, watchlist);
        itemTableBody.innerHTML = ''; // Clear table for new rows

        watchlist.forEach(itemId => {
            const itemInfo = allItems[itemId];
            const bazaarListings = priceData.bazaar ? priceData.bazaar[itemId] : null;
            const marketListings = priceData.itemmarket ? priceData.itemmarket[itemId] : null;

            const bazaarPrice = bazaarListings ? bazaarListings[0].cost.toLocaleString() : 'N/A';
            const marketPrice = marketListings ? marketListings[0].cost.toLocaleString() : 'N/A';
            const userStock = userInventory[itemId] || 0;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><a href="https://www.torn.com/imarket.php#/p=shop&step=browse&type=${itemId}" target="_blank" class="item-link">${itemInfo.name}</a></td>
                <td>$${marketPrice}</td>
                <td>$${bazaarPrice}</td>
                <td>${userStock.toLocaleString()}</td>
                <td><button class="action-btn remove-btn" data-id="${itemId}">Remove</button></td>
            `;
            itemTableBody.appendChild(row);
        });
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
            refreshWatchlistDisplay();
        }
        searchInput.value = '';
        selectedItemId = null;
    });

    itemTableBody.addEventListener('click', (e) => {
        if (e.target && e.target.classList.contains('remove-btn')) {
            const itemIdToRemove = e.target.dataset.id;
            watchlist = watchlist.filter(id => id !== itemIdToRemove);
            refreshWatchlistDisplay();
        }
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.filter-group')) {
            searchResultsDiv.style.display = 'none';
        }
    });
});