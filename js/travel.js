// --- Global variables (declared outside DOMContentLoaded for broader scope if needed, though most access is within the listener) ---
let allTornItems = {}; // To store item details: item_id -> {name, type, image}
let yataTravelData = null; // To store cached YATA travel data
let lastYataFetchTime = 0; // Timestamp of last YATA fetch
const YATA_CACHE_DURATION = 5 * 60 * 1000; // Cache YATA data for 5 minutes (adjust as needed)

// --- Hardcoded Country Name Map (for destination dropdown) ---
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

// --- Hardcoded Item Category Map (for filtering, as Torn API 'items' endpoint is unreliable for types) ---
const itemCategoryMap = {
    // Plushies
    "207": "Plushie", "212": "Plushie", "205": "Plushie", "206": "Plushie", "204": "Plushie",
    "213": "Plushie", "211": "Plushie", "214": "Plushie", "215": "Plushie", "266": "Plushie",
    "618": "Plushie", "258": "Plushie", "261": "Plushie", "274": "Plushie", "281": "Plushie",
    "269": "Plushie", "384": "Plushie", "273": "Plushie", // Note: 273 is Chamois Plushie (from YATA sample for Swi), also Bottle of Beer. Prioritize Plushie for common travel.

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
    "273": "Special", // Bottle of Beer (also matched as Plushie above, order matters for map access)
    "419": "Special", // Small Suitcase
    "420": "Special", // Medium Suitcase
    "421": "Special", // Large Suitcase
    "327": "Special", // Blank Tokens
    "259": "Special", // Mayan Statue
    "616": "Special", // Trout
    "619": "Special", // Steel Drum
    "620": "Special", // Nodding Turtle
    "621": "Special", "622": "Special", "623": "Special", "624": "Special", "625": "Special", "626": "Special",
    "412": "Special", "414": "Special", "440": "Special", "381": "Special", "382": "Special",
    "383": "Special", "278": "Special", "279": "Special", "294": "Special", "427": "Special",
    "429": "Special", "433": "Special", "434": "Special", "437": "Special", "270": "Special",
    "407": "Special", "361": "Special", "435": "Special", "436": "Special", "408": "Special",
    "411": "Special", "415": "Special", "416": "Special", "418": "Special", "431": "Special",
    "432": "Special", "426": "Special", "409": "Special", "410": "Special", "406": "Special",

    // Weapons (from YATA samples)
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
    // --- UI element references ---
    const destinationSelect = document.getElementById('destination-select');
    const fetchDataBtn = document.getElementById('fetch-data-btn');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorDisplay = document.getElementById('error-display');
    const selectedCountryNameSpan = document.getElementById('selected-country-name');
    const itemListDiv = document.getElementById('item-list');
    const travelCapacityInput = document.getElementById('travel-capacity');
    const categoryFilterSelect = document.getElementById('category-filter');

    let currentTornApiKey = null; // Variable to hold the fetched Torn API key

    // --- HELPER FUNCTIONS (ALL DEFINED HERE AT THE TOP OF DOMContentLoaded SCOPE) ---

    
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
    loadingIndicator.style.display = 'block';
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
                    name: item.name, // This might be the 'scrambled' name, but we won't use it for card display
                    type: item.type, // This is the Torn API's category
                    image: `https://www.torn.com/images/items/${itemId}/large.png`, // Correct image URL
                    // --- NEW: Store market_price from Torn API 'items' endpoint ---
                    market_price: item.value ? item.value.market_price : null // Get market_price, check if 'value' exists
                };
            }
        }
        allTornItems = itemsById;
        console.log('Successfully loaded all Torn items:', Object.keys(allTornItems).length);

        // DEBUGGING LOGS (can remove after verification)
        console.log("Checking specific item data after fetchAllTornItems (with market_price):");
        if (allTornItems['8']) { console.log("ID 8 (Axe):", allTornItems['8'].name, allTornItems['8'].image, allTornItems['8'].type, "Market Price:", allTornItems['8'].market_price); }
        if (allTornItems['31']) { console.log("ID 31 (M249 SAW):", allTornItems['31'].name, allTornItems['31'].image, allTornItems['31'].type, "Market Price:", allTornItems['31'].market_price); }
        if (allTornItems['1125']) { console.log("ID 1125 (Card Skimmer):", allTornItems['1125'].name, allTornItems['1125'].image, allTornItems['1125'].type, "Market Price:", allTornItems['1125'].market_price); }
        if (allTornItems['617']) { console.log("ID 617 (Banana Orchid):", allTornItems['617'].name, allTornItems['617'].image, allTornItems['617'].type, "Market Price:", allTornItems['617'].market_price); }
        // END DEBUGGING LOGS

        loadingIndicator.style.display = 'none';

    } catch (error) {
        errorDisplay.textContent = 'Failed to fetch all Torn items. Check your network.';
        console.error('Fetch all items error:', error);
        loadingIndicator.style.display = 'none';
    }
}

    // Function to fetch YATA travel data
    async function fetchYATATravelData() {
        const now = Date.now();
        if (yataTravelData && (now - lastYataFetchTime < YATA_CACHE_DURATION)) {
            console.log("Using cached YATA travel data.");
            return yataTravelData;
        }
        loadingIndicator.textContent = 'Fetching live travel data from YATA... This might take a moment.';
        loadingIndicator.style.display = 'block';
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
            return yataTravelData;
        } catch (error) {
            errorDisplay.textContent = 'Failed to fetch live travel data from YATA. Please try again later.';
            console.error('YATA Fetch error:', error);
            loadingIndicator.style.display = 'none';
            return null;
        }
    }

    // Function to fetch and populate destinations (using hardcoded map)
    async function fetchAndPopulateDestinations() {
        loadingIndicator.style.display = 'block';
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
        }
    }


   // Function to display items for a selected country (UPDATED to use market_price from allTornItems)
async function displayItemsForCountry(selectedCountryId, apiKey) {
    itemListDiv.innerHTML = '';
    loadingIndicator.textContent = 'Fetching item details and Torn City prices...';
    loadingIndicator.style.display = 'block';
    errorDisplay.textContent = '';

    console.log("displayItemsForCountry called with selectedCountryId:", selectedCountryId);

    if (Object.keys(allTornItems).length === 0) {
        errorDisplay.textContent = 'Item details cache not loaded. Please ensure API key is valid.';
        loadingIndicator.style.display = 'none';
        return;
    }

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

    console.log("YATA Data (stocks key exists?):", yataData.stocks ? true : false); // DEBUG
    console.log("Attempting to access countryData for key:", selectedCountryId); // DEBUG

    const countryData = yataData.stocks[selectedCountryId];

    console.log("Country Data from YATA for selected ID:", countryData); // DEBUG
    if (countryData) {
        console.log("Number of stocks in countryData:", countryData.stocks ? countryData.stocks.length : 0); // DEBUG
    }

    if (!countryData || !countryData.stocks || countryData.stocks.length === 0) {
        itemListDiv.innerHTML = `<p>No live item data available for this country from YATA. It might be an unpopular travel destination or data isn't available.</p>`;
        loadingIndicator.style.display = 'none';
        return;
    }

    const itemsForSelectedCountry = countryData.stocks.map(itemInfo => {
        const categoryFromMap = itemCategoryMap[itemInfo.id];
        const categoryFromAllTornItems = allTornItems[itemInfo.id] ? allTornItems[itemInfo.id].type : 'Unknown';
        const tornItemData = allTornItems[itemInfo.id]; // Get the stored item data

        return {
            itemId: itemInfo.id,
            name: itemInfo.name, // Use name from YATA (should be correct)
            foreignPrice: itemInfo.cost,
            foreignStock: itemInfo.quantity, // YATA uses 'quantity' for stock
            category: categoryFromMap || categoryFromAllTornItems || 'Other',
            // --- NEW: Get Torn City Price from allTornItems cache ---
            tornCityPrice: tornItemData ? tornItemData.market_price : null // Use stored market_price
        };
    });

    const selectedCategory = categoryFilterSelect.value;
    let filteredItems = itemsForSelectedCountry;
    if (selectedCategory !== 'all') {
        filteredItems = itemsForSelectedCountry.filter(item => item.category === selectedCategory);
    }

    if (filteredItems.length === 0) {
        itemListDiv.innerHTML = `<p>No items found for the selected category in this country based on YATA data.</p>`;
        loadingIndicator.style.display = 'none';
        return;
    }

    const itemPromises = filteredItems.map(async (itemData) => { // This can now be a simple .map, no await inside
        const itemId = itemData.itemId;
        const tornItemData = allTornItems[itemId]; // Get the stored item data

        const imageUrl = `https://www.torn.com/images/items/${itemId}/large.png`;
        const itemDescription = 'No description available.'; // Still placeholder

        // No more fetchTornCityItemPrice call here!
        const tornCityPrice = itemData.tornCityPrice; // Use the already retrieved price

        const profitPerItem = (tornCityPrice !== null && tornCityPrice > 0) ? tornCityPrice - itemData.foreignPrice : 'N/A';
        const totalPotentialProfit = (tornCityPrice !== null && tornCityPrice > 0 && typeof profitPerItem === 'number') ? profitPerItem * Math.min(itemData.foreignStock, travelCapacity) : 'N/A';
        const canCarry = Math.min(itemData.foreignStock, travelCapacity);

        return {
            id: itemId,
            name: itemData.name,
            image: imageUrl,
            description: itemDescription,
            foreignPrice: itemData.foreignPrice,
            foreignStock: itemData.foreignStock,
            tornCityPrice: tornCityPrice,
            profitPerItem: profitPerItem,
            totalPotentialProfit: totalPotentialProfit,
            canCarry: canCarry,
            category: itemData.category
        };
    });

    // Since itemPromises no longer contains awaits for individual items,
    // we can simplify this. It's essentially just mapping an already prepared array.
    const itemsToDisplay = itemPromises.filter(item => item !== null); // No more Promise.all needed for this part

    if (itemsToDisplay.length === 0) {
        itemListDiv.innerHTML = `<p>Could not load any item data for the selected country and category.</p>`;
        loadingIndicator.style.display = 'none';
        return;
    }

    itemsToDisplay.sort((a, b) => {
        // Handle 'N/A' correctly for sorting: push to bottom
        const profitA = typeof a.profitPerItem === 'number' ? a.profitPerItem : -Infinity;
        const profitB = typeof b.profitPerItem === 'number' ? b.profitPerItem : -Infinity;
        return profitB - profitA;
    });

    itemsToDisplay.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.classList.add('item-card');
        itemCard.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="item-details">
                <h3>${item.name} (${item.category})</h3>
                <p>Foreign Price: $${item.foreignPrice.toLocaleString()}</p>
                <p>Foreign Stock: ${item.foreignStock.toLocaleString()}</p>
                <p>Torn City Price: ${item.tornCityPrice !== null && item.tornCityPrice > 0 ? '$' + item.tornCityPrice.toLocaleString() : 'Not available'}</p>
                <p class="profit-info">Profit per item: ${typeof item.profitPerItem === 'number' ? '$' + item.profitPerItem.toLocaleString() : item.profitPerItem}</p>
                <p class="profit-info">You can carry: ${item.canCarry} items (Potential profit: ${typeof item.totalPotentialProfit === 'number' ? '$' + item.totalPotentialProfit.toLocaleString() : item.totalPotentialProfit})</p>
                <p style="font-size: 0.8em; color: #888;">ID: ${item.id}</p>
            </div>
        `;
        itemListDiv.appendChild(itemCard);
    });

    loadingIndicator.style.display = 'none';
}

    // --- Firebase Auth State Listener & Initial Data Load (RE-INTEGRATED from your previous code) ---
    // Ensure 'auth' and 'db' (Firestore) are accessible, presumably from firebase-init.js
    if (typeof auth !== 'undefined' && auth && typeof db !== 'undefined' && db) {
        auth.onAuthStateChanged(async function(user) {
            if (user) {
                console.log("User logged in:", user.uid); // DEBUG
                // User is signed in, fetch their API key from Firestore
                const userDocRef = firebase.firestore().collection('userProfiles').doc(user.uid);
                try {
                    const doc = await userDocRef.get();
                    if (doc.exists) {
                        const userData = doc.data();
                        currentTornApiKey = userData.tornApiKey || null;
                        console.log("Fetched Torn API Key from Firebase:", currentTornApiKey); // DEBUG

                        if (currentTornApiKey) {
                            errorDisplay.textContent = ''; // Clear any previous API key errors
                            loadingIndicator.textContent = 'Fetching essential data using your stored API key...';
                            loadingIndicator.style.display = 'block';

                            // Initial data fetches on login/page load
                            await fetchAllTornItems(currentTornApiKey); // Still needed for image URLs and category fallback
                            await fetchAndPopulateDestinations(); // No API key needed here anymore

                            // If a destination is already selected after populating, display items
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
                        console.error("User profile not found for UID:", user.uid); // DEBUG
                        loadingIndicator.style.display = 'none';
                    }
                } catch (error) {
                    errorDisplay.textContent = 'Error fetching user profile: ' + error.message;
                    console.error('Error fetching user profile from Firestore:', error); // DEBUG
                    loadingIndicator.style.display = 'none';
                }
            } else {
                // User is not signed in
                currentTornApiKey = null;
                errorDisplay.textContent = 'You must be logged in to use the Travel Helper. Please log in.';
                loadingIndicator.style.display = 'none';
                itemListDiv.innerHTML = '<p>Please log in to use the Travel Helper.</p>';
                destinationSelect.innerHTML = '<option value="">-- Log in to load destinations --</option>';
            }
        });
    } else {
        console.warn("Firebase auth or firestore object (from firebase-init.js) is not available. API key fetching will not work."); // DEBUG
        errorDisplay.textContent = "Firebase is not initialized. Please ensure firebase-init.js is loaded correctly.";
        loadingIndicator.style.display = 'none';
    }


    // --- Event Listeners (RE-INTEGRATED from your previous code) ---

    // The Fetch Data button will now just trigger a re-fetch with the already loaded API key
    fetchDataBtn.addEventListener('click', async () => {
        if (!currentTornApiKey) {
            errorDisplay.textContent = 'No Torn API Key available. Please ensure you are logged in and your key is stored.';
            return;
        }
        errorDisplay.textContent = '';
        loadingIndicator.textContent = 'Refetching travel data...';
        loadingIndicator.style.display = 'block';

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

    destinationSelect.addEventListener('change', async () => {
        const selectedCountryId = destinationSelect.value;
        if (!currentTornApiKey) {
            errorDisplay.textContent = 'No Torn API Key available. Please log in and ensure your key is stored.';
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
            errorDisplay.textContent = 'No Torn API Key available. Please log in and ensure your key is stored.';
            categoryFilterSelect.value = "all";
            return;
        }

        if (selectedCountryId) {
            await displayItemsForCountry(selectedCountryId, currentTornApiKey);
        }
    });

    // Initial load will now be handled by the Firebase onAuthStateChanged listener
}); // End of DOMContentLoaded