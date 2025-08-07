// Global Variables
let allTornItems = {};
let yataTravelData = null;
let lastYataFetchTime = 0;
const YATA_CACHE_DURATION = 5 * 60 * 1000;

// Country Name Map
const countryNameMap = {
    "uni": "United Kingdom",
    "can": "Canada",
    "jap": "Japan",
    "cay": "Cayman Islands",
    "mex": "Mexico",
    "sou": "South Africa",
    "swi": "Switzerland",
    "uae": "United Arab Emirates",
    "arg": "Argentina",
    "haw": "Hawaii",
    "chi": "China"
};

// Item Category Map
const itemCategoryMap = {
    // Plushies
    "207": "Plushie", "212": "Plushie", "205": "Plushie", "206": "Plushie", "204": "Plushie",
    "213": "Plushie", "211": "Plushie", "214": "Plushie", "215": "Plushie", "266": "Plushie",
    "618": "Plushie", "258": "Plushie", "261": "Plushie", "274": "Plushie", "281": "Plushie",
    "269": "Plushie", "384": "Plushie", "273": "Plushie",
    // Flowers
    "203": "Flower", "201": "Flower", "209": "Flower", "200": "Flower", "210": "Flower",
    "202": "Flower", "216": "Flower", "217": "Flower", "218": "Flower", "219": "Flower",
    "277": "Flower", "260": "Flower", "617": "Flower", "263": "Flower", "264": "Flower",
    "267": "Flower", "271": "Flower", "272": "Flower", "276": "Flower", "385": "Flower",
    "282": "Flower",
    // Drugs
    "196": "Drug", "197": "Drug", "198": "Drug", "199": "Drug", "200": "Drug",
    "201": "Drug", "203": "Drug", "204": "Drug", "205": "Drug", "206": "Drug",
    // Special items
    "419": "Special", "420": "Special", "421": "Special", "327": "Special",
    "259": "Special", "616": "Special", "619": "Special", "620": "Special", "621": "Special",
    "622": "Special", "623": "Special", "624": "Special", "625": "Special", "626": "Special",
    "412": "Special", "414": "Special", "440": "Special", "381": "Special", "382": "Special",
    "383": "Special", "278": "Special", "279": "Special", "294": "Special", "427": "Special",
    "429": "Special", "433": "Special", "434": "Special", "437": "Special", "270": "Special",
    "407": "Special", "361": "Special", "435": "Special", "436": "Special", "408": "Special",
    "411": "Special", "415": "Special", "416": "Special", "418": "Special", "431": "Special",
    "432": "Special", "426": "Special", "409": "Special", "410": "Special", "406": "Special",
    "273": "Special",
    // Weapons
    "8": "Weapon", "11": "Weapon", "20": "Weapon", "21": "Weapon", "26": "Weapon", "31": "Weapon",
    "63": "Weapon", "99": "Weapon", "108": "Weapon", "110": "Weapon", "111": "Weapon", "175": "Weapon",
    "177": "Weapon", "229": "Weapon", "230": "Weapon", "231": "Weapon", "232": "Weapon", "399": "Weapon",
    "612": "Weapon", "613": "Weapon", "614": "Weapon", "615": "Weapon", "217": "Weapon", "218": "Weapon",
    "219": "Weapon", "220": "Weapon", "221": "Weapon", "397": "Weapon", "438": "Weapon", "1246": "Weapon",
    "252": "Weapon", "253": "Weapon", "262": "Weapon", "402": "Weapon", "255": "Weapon", "256": "Weapon",
    "257": "Weapon", "333": "Weapon", "391": "Weapon", "398": "Weapon", "400": "Weapon", "222": "Weapon",
    "223": "Weapon", "224": "Weapon", "233": "Weapon", "234": "Weapon", "235": "Weapon", "236": "Weapon",
    "237": "Weapon", "238": "Weapon", "239": "Weapon", "395": "Weapon", "240": "Weapon", "241": "Weapon",
    "242": "Weapon", "243": "Weapon", "244": "Weapon", "245": "Weapon", "246": "Weapon", "247": "Weapon",
    "248": "Weapon", "249": "Weapon", "250": "Weapon", "251": "Weapon",
    // Armor
    "50": "Armor", "107": "Armor", "178": "Armor", "640": "Armor", "641": "Armor",
    "645": "Armor", "332": "Armor", "334": "Armor", "651": "Armor", "652": "Armor",
    "653": "Armor", "654": "Armor", "430": "Armor",
    // Clothing
    "1125": "Clothing", "624": "Clothing", "625": "Clothing", "626": "Clothing",
    "623": "Clothing", "413": "Clothing", "439": "Clothing",
    // Miscellaneous
    "159": "Miscellaneous", "328": "Miscellaneous", "335": "Miscellaneous",
};


document.addEventListener('DOMContentLoaded', function() {
    // UI References
    const destinationSelect = document.getElementById('destination-select');
    const fetchDataBtn = document.getElementById('fetch-data-btn');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorDisplay = document.getElementById('error-display');
    const selectedCountryNameSpan = document.getElementById('selected-country-name');
    const itemListDiv = document.getElementById('item-list');
    const travelCapacityInput = document.getElementById('travel-capacity');
    const categoryFilterSelect = document.getElementById('category-filter');
    const itemSearchInput = document.getElementById('item-search');
    
    let currentTornApiKey = null;

    // Helper Functions
    
    // Fetch All Torn Items
    async function fetchAllTornItems(apiKey) {
        if (Object.keys(allTornItems).length > 0) {
            console.log("All Torn items already loaded from cache.");
            return;
        }

        if (!apiKey) {
            errorDisplay.textContent = 'API Key is required to fetch item details.';
            return;
        }

        loadingIndicator.textContent = 'Loading all Torn item data... This might take a moment.';
        errorDisplay.textContent = '';

        try {
            const response = await fetch(`https://api.torn.com/v2/torn?selections=items&key=${apiKey}`);
            const data = await response.json();

            if (data.error) {
                errorDisplay.textContent = `API Error fetching items: ${data.error.error}`;
                console.error('Torn API Error fetching items:', data.error);
                loadingIndicator.style.display = 'none';
                return;
            }

            const itemsById = {};
            for (const itemId in data.items) {
                if (data.items.hasOwnProperty(itemId)) {
                    const item = data.items[itemId];
                    itemsById[itemId] = {
                        image: `https://www.torn.com/images/items/${itemId}/large.png`,
                        market_price: item.value ? item.value.market_price : null
                    };
                }
            }
            allTornItems = itemsById;
            console.log('Successfully loaded all Torn items:', Object.keys(allTornItems).length);
            loadingIndicator.style.display = 'none';

        } catch (error) {
            errorDisplay.textContent = 'Failed to fetch all Torn items. Check your network.';
            console.error('Fetch all items error:', error);
            loadingIndicator.style.display = 'none';
        }
    }

    // Fetch YATA Data
    async function fetchYATATravelData() {
        const now = Date.now();
        if (yataTravelData && (now - lastYataFetchTime < YATA_CACHE_DURATION)) {
            console.log("Using cached YATA travel data.");
            return yataTravelData;
        }
        loadingIndicator.textContent = 'Fetching live travel data from YATA... This might take a moment.';
        errorDisplay.textContent = '';
        try {
            const response = await fetch('https://yata.yt/api/v1/travel/export/');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            yataTravelData = data;
            lastYataFetchTime = now;
            console.log('Successfully loaded YATA travel data.');
            return data;
        } catch (error) {
            errorDisplay.textContent = 'Failed to fetch live travel data from YATA. Please try again later.';
            console.error('YATA Fetch error:', error);
            loadingIndicator.style.display = 'none';
            return null;
        }
    }

    // Populate Destinations
    async function fetchAndPopulateDestinations() {
        loadingIndicator.textContent = 'Loading destinations...';
        errorDisplay.textContent = '';
        destinationSelect.innerHTML = '<option value="">Loading destinations...</option>';
        try {
            destinationSelect.innerHTML = '<option value="">-- Select a country --</option>';
            for (const countryCode in countryNameMap) {
                if (countryNameMap.hasOwnProperty(countryCode)) {
                    const countryName = countryNameMap[countryCode];
                    const option = document.createElement('option');
                    option.value = countryCode;
                    option.textContent = countryName;
                    destinationSelect.appendChild(option);
                }
            }
            loadingIndicator.style.display = 'none';
            console.log("Destinations populated from hardcoded list.");
        } catch (error) {
            errorDisplay.textContent = 'Failed to populate travel destinations from hardcoded list.';
            console.error('Populate destinations error:', error);
            loadingIndicator.style.display = 'none';
            return null;
        }
    }

    async function displayItemsForCountry(selectedCountryId, apiKey) {
    itemListDiv.innerHTML = '';
    loadingIndicator.textContent = 'Fetching item details and Torn City prices...';
    errorDisplay.textContent = '';

    const yataData = await fetchYATATravelData();
    if (!yataData) {
        loadingIndicator.style.display = 'none';
        return;
    }

    const travelCapacity = parseInt(travelCapacityInput.value, 10);
    if (isNaN(travelCapacity) || travelCapacity <= 0) {
        errorDisplay.textContent = 'Please enter a valid positive number for your travel capacity.';
        loadingIndicator.style.display = 'none';
        return;
    }

    const countryData = yataData.stocks[selectedCountryId];
    if (!countryData || !countryData.stocks || countryData.stocks.length === 0) {
        itemListDiv.innerHTML = `<p>No live item data available for this country from YATA.</p>`;
        loadingIndicator.style.display = 'none';
        return;
    }

    let itemsToProcess = countryData.stocks.map(itemInfo => ({
        itemId: itemInfo.id,
        name: itemInfo.name,
        foreignPrice: itemInfo.cost,
        foreignStock: itemInfo.quantity,
        category: itemCategoryMap[itemInfo.id] || 'Other',
    }));

    const selectedCategory = categoryFilterSelect.value;
    if (selectedCategory !== 'all') {
        itemsToProcess = itemsToProcess.filter(item => item.category === selectedCategory);
    }

    if (itemsToProcess.length === 0) {
        itemListDiv.innerHTML = `<p>No items found for the selected category in this country.</p>`;
        loadingIndicator.style.display = 'none';
        return;
    }
    
    const itemsToDisplay = await Promise.all(itemsToProcess.map(async (itemData) => {
        const tornCityPrice = await fetchTornCityItemPrice(itemData.itemId, apiKey);
        const profitPerItem = (tornCityPrice !== null) ? tornCityPrice - itemData.foreignPrice : 'N/A';
        const canCarry = Math.min(itemData.foreignStock, travelCapacity);
        const totalPotentialProfit = (typeof profitPerItem === 'number') ? profitPerItem * canCarry : 'N/A';
        const imageUrl = `https://www.torn.com/images/items/${itemData.itemId}/large.png`;

        return {
            id: itemData.itemId,
            name: itemData.name,
            image: imageUrl,
            foreignPrice: itemData.foreignPrice,
            foreignStock: itemData.foreignStock,
            tornCityPrice: tornCityPrice,
            profitPerItem: profitPerItem,
            totalPotentialProfit: totalPotentialProfit,
            canCarry: canCarry,
            category: itemData.category,
        };
    }));

    itemsToDisplay.sort((a, b) => {
        const profitA = typeof a.profitPerItem === 'number' ? a.profitPerItem : -Infinity;
        const profitB = typeof b.profitPerItem === 'number' ? b.profitPerItem : -Infinity;
        return profitB - profitA;
    });

    itemsToDisplay.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.classList.add('item-card');
        itemCard.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="item-info">
                <h3>${item.name} (${item.category})</h3>
                <div class="item-stats">
                    <span><strong>Foreign Price:</strong> $${item.foreignPrice.toLocaleString()}</span>
                    <span><strong>Torn City Price:</strong> ${item.tornCityPrice !== null ? '$' + item.tornCityPrice.toLocaleString() : 'N/A'}</span>
                    <span><strong>Foreign Stock:</strong> ${item.foreignStock.toLocaleString()}</span>
                    <span><strong>Profit per item:</strong> ${typeof item.profitPerItem === 'number' ? '$' + item.profitPerItem.toLocaleString() : 'N/A'}</span>
                </div>
                <p class="profit-summary">You can carry: ${item.canCarry} items (Potential profit: ${typeof item.totalPotentialProfit === 'number' ? '$' + item.totalPotentialProfit.toLocaleString() : 'N/A'})</p>
            </div>
        `;
        itemListDiv.appendChild(itemCard);
    });

    loadingIndicator.style.display = 'none';
}

// Function to handle the landscape blocker logic
function toggleLandscapeBlocker() {
    const isMobileLandscape = window.innerWidth > window.innerHeight && window.innerWidth <= 1024;
    let blocker = document.getElementById('landscape-blocker');

    if (isMobileLandscape) {
        // Only create the blocker if it doesn't already exist
        if (!blocker) {
            blocker = document.createElement('div');
            blocker.id = 'landscape-blocker';
            blocker.innerHTML = `
                <h2>Please Rotate Your Device</h2>
                <p>For the best experience, please use this page in portrait mode.</p>
            `;
            // Apply all the necessary styles directly with JavaScript
            Object.assign(blocker.style, {
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                backgroundColor: '#222',
                color: '#eee',
                textAlign: 'center',
                padding: '20px',
                zIndex: '99999'
            });
            document.body.appendChild(blocker);
        }

        // Hide main page content
        document.body.style.overflow = 'hidden';
        const header = document.querySelector('header');
        if (header) header.style.display = 'none';
        const mainContent = document.getElementById('mainHomepageContent');
        if (mainContent) mainContent.style.display = 'none';
        const footer = document.querySelector('footer');
        if (footer) footer.style.display = 'none';

    } else {
        // Remove the blocker if it exists
        if (blocker) {
            blocker.remove();
        }

        // Re-show main page content
        document.body.style.overflow = '';
        const header = document.querySelector('header');
        if (header) header.style.display = '';
        const mainContent = document.getElementById('mainHomepageContent');
        if (mainContent) mainContent.style.display = '';
        const footer = document.querySelector('footer');
        if (footer) footer.style.display = '';
    }
}

// Run the function on page load and window resize
window.addEventListener('load', toggleLandscapeBlocker);
window.addEventListener('resize', toggleLandscapeBlocker);

    // Fetch Torn City Price
    async function fetchTornCityItemPrice(itemId, apiKey) {
        if (!apiKey) {
            console.error(`API Key is MISSING. Cannot fetch price for item ${itemId}.`);
            return null;
        }

        try {
            const response = await fetch(`https://api.torn.com/v2/market/${itemId}?selections=bazaar,itemmarket&key=${apiKey}`);
            if (!response.ok) {
                console.error(`Error fetching item ${itemId}. Status: ${response.status} (${response.statusText})`);
                return null;
            }

            const data = await response.json();
            if (data.error) {
                console.error(`API Error for item ${itemId}:`, data.error.error);
                return null;
            }

            let finalPrice = null;
            if (data.itemmarket && data.itemmarket.item && data.itemmarket.item.average_price) {
                finalPrice = data.itemmarket.item.average_price;
            }

            if (!finalPrice) {
                const prices = [];
                if (data.bazaar) {
                    Object.values(data.bazaar).forEach(listing => prices.push(listing.cost));
                }
                if (data.itemmarket && data.itemmarket.listings) {
                    data.itemmarket.listings.forEach(listing => prices.push(listing.price));
                }
                if (prices.length > 0) {
                    finalPrice = Math.min(...prices);
                }
            }
            return finalPrice > 0 ? finalPrice : null;
        } catch (error) {
            console.error(`Failed to fetch price for item ${itemId}:`, error);
            return null;
        }
    }
    
  async function searchItemsAndDisplayResults(searchQuery, apiKey) {
    itemListDiv.innerHTML = '';
    loadingIndicator.textContent = `Searching for "${searchQuery}" and fetching prices...`;
    errorDisplay.textContent = '';
    selectedCountryNameSpan.textContent = `Search results for "${searchQuery}"`;

    const yataData = await fetchYATATravelData();
    if (!yataData) {
        loadingIndicator.style.display = 'none';
        return;
    }

    const travelCapacity = parseInt(travelCapacityInput.value, 10);
    if (isNaN(travelCapacity) || travelCapacity <= 0) {
        errorDisplay.textContent = 'Please enter a valid positive number for your travel capacity.';
        loadingIndicator.style.display = 'none';
        return;
    }

    const matchedItems = [];
    const lowerCaseSearchQuery = searchQuery.toLowerCase();
    
    // Store the best profit item for each unique item ID
    const bestProfitItems = {}; // { itemId: { itemData, totalPotentialProfit } }

    for (const countryCode in yataData.stocks) {
        if (yataData.stocks.hasOwnProperty(countryCode)) {
            const country = yataData.stocks[countryCode];
            const countryName = countryNameMap[countryCode] || countryCode;
            for (const itemInfo of country.stocks) {
                if (itemInfo.name.toLowerCase().includes(lowerCaseSearchQuery)) {
                    // Temporarily store item data with its country
                    const currentItemData = {
                        itemId: itemInfo.id,
                        name: itemInfo.name,
                        foreignPrice: itemInfo.cost,
                        foreignStock: itemInfo.quantity,
                        countryName: countryName,
                        category: itemCategoryMap[itemInfo.id] || 'Other',
                    };

                    // Fetch Torn City price for this item
                    const tornCityPrice = await fetchTornCityItemPrice(currentItemData.itemId, apiKey);
                    const profitPerItem = (tornCityPrice !== null) ? tornCityPrice - currentItemData.foreignPrice : -Infinity;
                    const canCarry = Math.min(currentItemData.foreignStock, travelCapacity);
                    const totalPotentialProfit = (typeof profitPerItem === 'number') ? profitPerItem * canCarry : -Infinity;
                    const imageUrl = `https://www.torn.com/images/items/${currentItemData.itemId}/large.png`; // Define imageUrl here

                    // Only consider if profit is positive and foreign stock > 0
                    if (profitPerItem > 0 && currentItemData.foreignStock > 0) {
                        // Check if this item is already in bestProfitItems and if the current profit is better
                        if (!bestProfitItems[currentItemData.itemId] || totalPotentialProfit > bestProfitItems[currentItemData.itemId].totalPotentialProfit) {
                            bestProfitItems[currentItemData.itemId] = {
                                ...currentItemData,
                                image: imageUrl, // *** ADDED THIS LINE ***
                                tornCityPrice: tornCityPrice,
                                profitPerItem: profitPerItem,
                                totalPotentialProfit: totalPotentialProfit,
                                canCarry: canCarry,
                            };
                        }
                    }
                }
            }
        }
    }

    // Convert bestProfitItems object back into an array for sorting and display
    for (const itemId in bestProfitItems) {
        matchedItems.push(bestProfitItems[itemId]);
    }

    if (matchedItems.length === 0) {
        itemListDiv.innerHTML = `<p>No profitable items found matching "${searchQuery}" in any country or no stock available.</p>`;
        loadingIndicator.style.display = 'none';
        return;
    }

    const selectedCategory = categoryFilterSelect.value;
    let filteredItems = matchedItems;
    if (selectedCategory !== 'all') {
        filteredItems = matchedItems.filter(item => item.category === selectedCategory);
    }

    if (filteredItems.length === 0) {
        itemListDiv.innerHTML = `<p>No items found matching "${searchQuery}" for the selected category.</p>`;
        loadingIndicator.style.display = 'none';
        return;
    }

    // Sort by total potential profit in descending order
    filteredItems.sort((a, b) => {
        const profitA = typeof a.totalPotentialProfit === 'number' ? a.totalPotentialProfit : -Infinity;
        const profitB = typeof b.totalPotentialProfit === 'number' ? b.totalPotentialProfit : -Infinity;
        return profitB - profitA;
    });

    itemListDiv.innerHTML = '';
    filteredItems.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.classList.add('item-card');
        itemCard.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="item-info">
                <h3>${item.name} (${item.category}) in ${item.countryName}</h3>
                <div class="item-stats">
                    <span><strong>Foreign Price:</strong> $${item.foreignPrice.toLocaleString()}</span>
                    <span><strong>Torn City Price:</strong> ${item.tornCityPrice !== null ? '$' + item.tornCityPrice.toLocaleString() : 'N/A'}</span>
                    <span><strong>Foreign Stock:</strong> ${item.foreignStock.toLocaleString()}</span>
                    <span><strong>Profit per item:</strong> ${typeof item.profitPerItem === 'number' ? '$' + item.profitPerItem.toLocaleString() : 'N/A'}</span>
                </div>
                <p class="profit-summary">You can carry: ${item.canCarry} items (Potential profit: ${typeof item.totalPotentialProfit === 'number' ? '$' + item.totalPotentialProfit.toLocaleString() : 'N/A'})</p>
            </div>
        `;
        itemListDiv.appendChild(itemCard);
    });

    loadingIndicator.style.display = 'none';
}
    // Firebase Authentication
    if (typeof auth !== 'undefined' && auth && typeof db !== 'undefined' && db) {
        auth.onAuthStateChanged(async function(user) {
            
            // Header logic has been removed as requested.

            if (user) {
                console.log("User logged in:", user.uid);
                const userDocRef = firebase.firestore().collection('userProfiles').doc(user.uid);
                try {
                    const doc = await userDocRef.get();
                    if (doc.exists) {
                        const userData = doc.data();
                        currentTornApiKey = userData.tornApiKey || null;
                        console.log("Fetched Torn API Key from Firebase:", currentTornApiKey);

                        if (currentTornApiKey) {
                            errorDisplay.textContent = '';
                            loadingIndicator.textContent = 'Fetching essential data...';
                            
                            await fetchAllTornItems(currentTornApiKey);
                            await fetchAndPopulateDestinations();

                            if (destinationSelect.value) {
                                const selectedCountryId = destinationSelect.value;
                                selectedCountryNameSpan.textContent = destinationSelect.options[destinationSelect.selectedIndex].textContent;
                                await displayItemsForCountry(selectedCountryId, currentTornApiKey);
                            } else {
                                selectedCountryNameSpan.textContent = 'Selected Country';
                                itemListDiv.innerHTML = '<p>Select a destination to see items.</p>';
                            }
                            loadingIndicator.style.display = 'none';

                        } else {
                            errorDisplay.textContent = 'No Torn API Key found in your profile. Please add it in your settings.';
                            loadingIndicator.style.display = 'none';
                        }
                    } else {
                        errorDisplay.textContent = 'User profile not found in database.';
                        console.error("User profile not found for UID:", user.uid);
                        loadingIndicator.style.display = 'none';
                    }
                } catch (error) {
                    errorDisplay.textContent = 'Error fetching user profile: ' + error.message;
                    console.error('Error fetching user profile from Firestore:', error);
                    loadingIndicator.style.display = 'none';
                }
            } else {
                currentTornApiKey = null;
                errorDisplay.textContent = 'You must be logged in to use the Travel Helper. Please log in.';
                loadingIndicator.style.display = 'none';
                itemListDiv.innerHTML = '<p>Please log in to use the Travel Helper.</p>';
                destinationSelect.innerHTML = '<option value="">-- Log in to load destinations --</option>';
            }
        });

    } else {
        console.warn("Firebase auth or firestore object is not available.");
        errorDisplay.textContent = "Firebase is not initialized.";
        loadingIndicator.style.display = 'none';
    }


    // Event Listeners
    fetchDataBtn.addEventListener('click', async () => {
        if (!currentTornApiKey) {
            errorDisplay.textContent = 'No Torn API Key available.';
            return;
        }
        errorDisplay.textContent = '';
        loadingIndicator.textContent = 'Refetching travel data...';

        await fetchAllTornItems(currentTornApiKey);
        await fetchAndPopulateDestinations();

        if (destinationSelect.value) {
            const selectedCountryId = destinationSelect.value;
            selectedCountryNameSpan.textContent = destinationSelect.options[destinationSelect.selectedIndex].textContent;
            await displayItemsForCountry(selectedCountryId, currentTornApiKey);
        } else {
            selectedCountryNameSpan.textContent = 'Selected Country';
            itemListDiv.innerHTML = '<p>Select a destination to see items.</p>';
        }
        loadingIndicator.style.display = 'none';
    });
    
    itemSearchInput.addEventListener('input', async () => {
        const searchQuery = itemSearchInput.value.trim();
        const apiKey = currentTornApiKey;
        if (searchQuery === '') {
            const selectedCountryId = destinationSelect.value;
            if (selectedCountryId && apiKey) {
                selectedCountryNameSpan.textContent = destinationSelect.options[destinationSelect.selectedIndex].textContent;
                await displayItemsForCountry(selectedCountryId, apiKey);
            } else {
                selectedCountryNameSpan.textContent = 'Selected Country';
                itemListDiv.innerHTML = '<p>Select a destination or search for an item to see details.</p>';
            }
            return;
        }
        if (!apiKey) {
            errorDisplay.textContent = 'No Torn API Key available.';
            return;
        }
        await searchItemsAndDisplayResults(searchQuery, apiKey);
    });

    destinationSelect.addEventListener('change', async () => {
        const selectedCountryId = destinationSelect.value;
        if (!currentTornApiKey) {
            errorDisplay.textContent = 'No Torn API Key available.';
            destinationSelect.value = "";
            return;
        }

        if (selectedCountryId) {
            selectedCountryNameSpan.textContent = destinationSelect.options[destinationSelect.selectedIndex].textContent;
            await displayItemsForCountry(selectedCountryId, currentTornApiKey);
        } else {
            selectedCountryNameSpan.textContent = 'Selected Country';
            itemListDiv.innerHTML = '<p>Select a destination to see items.</p>';
        }
    });

    categoryFilterSelect.addEventListener('change', async () => {
        const selectedCountryId = destinationSelect.value;
        if (!currentTornApiKey) {
            errorDisplay.textContent = 'No Torn API Key available.';
            categoryFilterSelect.value = "all";
            return;
        }

        if (selectedCountryId) {
            await displayItemsForCountry(selectedCountryId, currentTornApiKey);
        }
    });

});

function toggleLandscapeBlocker() {
    const isMobileLandscape = window.matchMedia("(max-width: 1280px) and (orientation: landscape)").matches;
    let blocker = document.getElementById('landscape-blocker');

    if (isMobileLandscape) {
        // If the blocker doesn't exist, create and show it.
        if (!blocker) {
            blocker = document.createElement('div');
            blocker.id = 'landscape-blocker';
            blocker.innerHTML = `
                <div style="transform: rotate(0deg); font-size: 50px; margin-bottom: 20px;">📱</div>
                <h2 style="color: #00a8ff;">Please Rotate Your Device</h2>
                <p>This page is best viewed in portrait mode.</p>
            `;
            // These styles will make it cover the entire screen.
            Object.assign(blocker.style, {
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100vw',  // Use viewport width
                height: '100vh', // Use viewport height
                backgroundColor: '#1c1c1c', // A solid, dark color
                color: '#eee',
                textAlign: 'center',
                zIndex: '99999' // A very high number to ensure it's on top of everything
            });
            document.body.appendChild(blocker);
        }
        // Also, prevent the page from scrolling underneath the blocker.
        document.body.style.overflow = 'hidden';

    } else {
        // If we are in portrait, remove the blocker if it exists.
        if (blocker) {
            blocker.remove();
        }
        // And restore the ability to scroll the page.
        document.body.style.overflow = '';
    }
}

// Run the function when the page first loads and whenever it's resized.
window.addEventListener('load', toggleLandscapeBlocker);
window.addEventListener('resize', toggleLandscapeBlocker);