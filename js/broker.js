// mysite/js/broker.js (Final Version Using Your Correct Logic)

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
                Object.values(data.inventory).forEach(item => {
                    userInventory[item.ID] = item.quantity;
                });
            }
        } catch (error) {
            console.error("Could not fetch user inventory:", error.message);
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

        const promises = [];
        watchlist.forEach(itemId => {
            // YOUR FIX: Create two separate promises for each item, one for itemmarket and one for bazaar.
            promises.push(fetch(`https://api.torn.com/market/${itemId}?selections=itemmarket&key=${tornApiKey}`).then(res => res.json()));
            promises.push(fetch(`https://api.torn.com/market/${itemId}?selections=bazaar&key=${tornApiKey}`).then(res => res.json()));
        });

        const results = await Promise.all(promises);
        itemTableBody.innerHTML = ''; // Clear table for new rows

        for (let i = 0; i < watchlist.length; i++) {
            const itemId = watchlist[i];
            const itemInfo = allItems[itemId];

            // The results array will have market data at index 2*i and bazaar data at 2*i + 1
            const marketData = results[i * 2];
            const bazaarData = results[i * 2 + 1];

            const marketPrice = marketData && marketData.itemmarket && marketData.itemmarket[0] ? '$' + marketData.itemmarket[0].cost.toLocaleString() : 'N/A';
            const bazaarPrice = bazaarData && bazaarData.bazaar && bazaarData.bazaar[0] ? '$' + bazaarData.bazaar[0].cost.toLocaleString() : 'N/A';
            const userStock = userInventory[itemId] || 0;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><a href="https://www.torn.com/imarket.php#/p=shop&step=browse&type=${itemId}" target="_blank" class="item-link">${itemInfo.name}</a></td>
                <td>${marketPrice}</td>
                <td>${bazaarPrice}</td>
                <td>${userStock.toLocaleString()}</td>
                <td><button class="action-btn remove-btn" data-id="${itemId}">Remove</button></td>
            `;
            itemTableBody.appendChild(row);
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