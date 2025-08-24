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
   // mysite/js/broker.js (Final Corrected Function)

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
        promises.push(fetch(`https://api.torn.com/v2/market/${itemId}?selections=itemmarket&key=${tornApiKey}`).then(res => res.json()));
        promises.push(fetch(`https://api.torn.com/v2/market/${itemId}?selections=bazaar&key=${tornApiKey}`).then(res => res.json()));
    });

    const results = await Promise.all(promises);
    itemTableBody.innerHTML = ''; // Clear table for new rows

    for (let i = 0; i < watchlist.length; i++) {
        const itemId = watchlist[i];
        const itemInfo = allItems[itemId];

        const marketData = results[i * 2];
        const bazaarData = results[i * 2 + 1];

        // --- FINAL CORRECTED LINE with the proper nesting (.item) ---
        const averageMarketPrice = marketData?.itemmarket?.item?.average_price ? '$' + marketData.itemmarket.item.average_price.toLocaleString() : 'N/A';

        const bazaarPrice = bazaarData && bazaarData.bazaar && bazaarData.bazaar[0] ? '$' + bazaarData.bazaar[0].cost.toLocaleString() : 'N/A';
        const userStock = userInventory[itemId] || 0;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><a href="https://www.torn.com/imarket.php#/p=shop&step=browse&type=${itemId}" target="_blank" class="item-link">${itemInfo.name}</a></td>
            <td>${averageMarketPrice}</td>
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

// Orientation handler code (unchanged)...
// --- START: Complete and Unified Orientation Handler ---
let portraitBlocker = null;
let landscapeBlocker = null;
function createOverlays() {
    const overlayStyles = {
        display: 'none',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: '#1e1e1e',
        color: '#f0f0f0',
        textAlign: 'center',
        fontFamily: 'sans-serif',
        fontSize: '1.5em',
        zIndex: '99999'
    };
    const buttonStyles = {
        backgroundColor: '#007bff',
        color: 'black',
        padding: '8px 15px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontWeight: 'bold',
        marginTop: '20px',
        textDecoration: 'none',
        fontSize: '16px'
    };
    if (!document.getElementById('tablet-portrait-blocker')) {
        portraitBlocker = document.createElement('div');
        portraitBlocker.id = 'tablet-portrait-blocker';
        Object.assign(portraitBlocker.style, overlayStyles);
        portraitBlocker.innerHTML = `
            <div>
                <h2>Please Rotate Your Device</h2>
                <p style="font-size: 0.7em; margin-top: 5px;">This page is best viewed in portrait mode.</p>
                <button id="return-home-btn-tablet">Return to Home</button>
            </div>`;
        document.body.appendChild(portraitBlocker);
        const tabletReturnBtn = document.getElementById('return-home-btn-tablet');
        if (tabletReturnBtn) {
            Object.assign(tabletReturnBtn.style, buttonStyles);
            tabletReturnBtn.addEventListener('click', () => { window.location.href = 'home.html'; });
        }
    }
    if (!document.getElementById('mobile-landscape-blocker')) {
        landscapeBlocker = document.createElement('div');
        landscapeBlocker.id = 'mobile-landscape-blocker';
        Object.assign(landscapeBlocker.style, overlayStyles);
        landscapeBlocker.innerHTML = `
            <div>
			    <div style="transform: rotate(90deg); font-size: 50px; margin-bottom: 20px;">📱</div>
                <h2>Please Rotate Your Device</h2>
                <p style="font-size: 0.7em; margin-top: 5px;">For the best viewing experience, please use landscape mode.</p>
                <button id="return-home-btn-mobile">Return to Home</button>
            </div>`;
        document.body.appendChild(landscapeBlocker);
        const mobileReturnBtn = document.getElementById('return-home-btn-mobile');
        if (mobileReturnBtn) {
            Object.assign(mobileReturnBtn.style, buttonStyles);
            mobileReturnBtn.addEventListener('click', () => { window.location.href = 'home.html'; });
        }
    }
}
function handleOrientation() {
    if (!portraitBlocker || !landscapeBlocker) {
        createOverlays();
        portraitBlocker = document.getElementById('tablet-portrait-blocker');
        landscapeBlocker = document.getElementById('mobile-landscape-blocker');
        if (!portraitBlocker || !landscapeBlocker) return;
    }
    portraitBlocker.style.display = 'none';
    landscapeBlocker.style.display = 'none';
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;
    const isLandscape = !isPortrait;
    const shortestSide = Math.min(window.screen.width, window.screen.height);
    const isPhone = shortestSide < 600;
    const isTablet = shortestSide >= 600 && shortestSide < 1024;
    if (isPhone && isPortrait) {
        landscapeBlocker.style.display = 'flex';
    } else if (isTablet && isLandscape) {
        portraitBlocker.style.display = 'flex';
    }
}
document.addEventListener('DOMContentLoaded', handleOrientation);
window.addEventListener('resize', handleOrientation);
window.addEventListener('orientationchange', handleOrientation);
// --- END: Complete and Unified Orientation Handler ---
