// --- Global variables ---
let allTornItems = {}; // To store item details: item_id -> {name, type, image, market_price} (market_price IS stored here again)
let yataTravelData = null; // To store cached YATA travel data
let lastYataFetchTime = 0; // Timestamp of last YATA fetch
const YATA_CACHE_DURATION = 5 * 60 * 1000; // Cache YATA data for 5 minutes (adjust as needed)

// --- Torn City Price Cache is NO LONGER needed, as prices are from allTornItems ---
// const tornCityPriceCache = {};
// const TORN_CITY_PRICE_CACHE_DURATION = 15 * 60 * 1000;


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

// --- Hardcoded Item Category Map (for filtering, as Torn API 'items' endpoint is unreliable for types directly) ---
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
    "419": "Special", "420": "Special", "421": "Special", "327": "Special",
    "259": "Special", "616": "Special", "619": "Special", "620": "Special", "621": "Special",
    "622": "Special", "623": "Special", "624": "Special", "625": "Special", "626": "Special",
    "412": "Special", "414": "Special", "440": "Special", "381": "Special", "382": "Special",
    "383": "Special", "278": "Special", "279": "Special", "294": "Special", "427": "Special",
    "429": "Special", "433": "Special", "434": "Special", "437": "Special", "270": "Special",
    "407": "Special", "361": "Special", "435": "Special", "436": "Special", "408": "Special",
    "411": "Special", "415": "Special", "416": "Special", "418": "Special", "431": "Special",
    "432": "Special", "426": "Special", "409": "Special", "410": "Special", "406": "Special",
    "273": "Special", // Bottle of Beer (also matched as Chamois Plushie above, order matters for map access)

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
    // --- UI element references ---
    const destinationSelect = document.getElementById('destination-select');
    const fetchDataBtn = document.getElementById('fetch-data-btn');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorDisplay = document.getElementById('error-display');
    const selectedCountryNameSpan = document.getElementById('selected-country-name');
    const itemListDiv = document.getElementById('item-list');
    const travelCapacityInput = document.getElementById('travel-capacity');
    const categoryFilterSelect = document.getElementById('category-filter');
    const itemSearchInput = document.getElementById('item-search'); // Reference to the search input
    
    let currentTornApiKey = null; // Variable to hold the fetched Torn API key

    // --- HELPER FUNCTIONS (ALL DEFINED HERE AT THE TOP OF DOMContentLoaded SCOPE) ---

    // Function to fetch all item details (Uses Torn API 'Items' selection for images & market_price)
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
        // loadingIndicator.style.display = 'block'; // Commented out to hide indicator
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
                        // We are specifically NOT using item.name or item.type as they are scrambled from this endpoint
                        image: `https://www.torn.com/images/items/${itemId}/large.png`, // Correct image URL
                        market_price: item.value ? item.value.market_price : null // <-- Store market_price from here
                    };
                }
            }
            allTornItems = itemsById;
            console.log('Successfully loaded all Torn items:', Object.keys(allTornItems).length);

            // DEBUGGING LOGS (can remove after verification)
            console.log("Checking specific item data after fetchAllTornItems (images & market_price):");
            if (allTornItems['8']) { console.log("ID 8 (Axe):", allTornItems['8'].image, "Market Price:", allTornItems['8'].market_price); }
            if (allTornItems['31']) { console.log("ID 31 (M249 SAW):", allTornItems['31'].image, "Market Price:", allTornItems['31'].market_price); }
            if (allTornItems['1125']) { console.log("ID 1125 (Card Skimmer):", allTornItems['1125'].image, "Market Price:", allTornItems['1125'].market_price); }
            if (allTornItems['206']) { console.log("ID 206 (Xanax):", allTornItems['206'].image, "Market Price:", allTornItems['206'].market_price); }
            if (allTornItems['200']) { console.log("ID 200 (Opium):", allTornItems['200'].image, "Market Price:", allTornItems['200'].market_price); }
            if (allTornItems['266']) { console.log("ID 266 (Nessie Plushie):", allTornItems['266'].image, "Market Price:", allTornItems['266'].market_price); }
            if (allTornItems['617']) { console.log("ID 617 (Banana Orchid):", allTornItems['617'].image, "Market Price:", allTornItems['617'].market_price); }
            // END DEBUGGING LOGS

            loadingIndicator.style.display = 'none';

        } catch (error) {
            errorDisplay.textContent = 'Failed to fetch all Torn items. Check your network.';
            console.error('Fetch all items error:', error);
            loadingIndicator.style.display = 'none';
        }
    }

    // Function to fetch Torn City market price for a single item (This function is NO LONGER needed in this strategy)
    // async function fetchTornCityItemPrice(itemId, apiKey) { ... } // DELETED

    // Function to fetch YATA travel data
    async function fetchYATATravelData() {
        const now = Date.now();
        if (yataTravelData && (now - lastYataFetchTime < YATA_CACHE_DURATION)) {
            console.log("Using cached YATA travel data.");
            return yataTravelData;
        }
        loadingIndicator.textContent = 'Fetching live travel data from YATA... This might take a moment.';
        // loadingIndicator.style.display = 'block'; // Commented out to hide indicator
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
            return data; // Ensure it returns the data
        } catch (error) {
            errorDisplay.textContent = 'Failed to fetch live travel data from YATA. Please try again later.';
            console.error('YATA Fetch error:', error);
            loadingIndicator.style.display = 'none';
            return null;
        }
    }

    // Function to fetch and populate destinations (using hardcoded map)
    async function fetchAndPopulateDestinations() {
        loadingIndicator.textContent = 'Loading destinations...';
        // loadingIndicator.style.display = 'block'; // Commented out to hide indicator
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
            return null; // Return null on error to ensure subsequent calls don't proceed with bad data
        }
    }

async function fetchTornCityItemPrice(itemId, apiKey) {
    if (!apiKey) {
        console.error(`API Key is MISSING. Cannot fetch price for item ${itemId}.`);
        return null;
    }

    try {
        // *** URL updated to include /v2/ as ordered ***
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

    // Find all matching items from all countries in YATA data
    const matchedItems = [];
    const lowerCaseSearchQuery = searchQuery.toLowerCase();
    for (const countryCode in yataData.stocks) {
        if (yataData.stocks.hasOwnProperty(countryCode)) {
            const country = yataData.stocks[countryCode];
            const countryName = countryNameMap[countryCode] || countryCode;
            for (const itemInfo of country.stocks) {
                if (itemInfo.name.toLowerCase().includes(lowerCaseSearchQuery)) {
                    matchedItems.push({
                        itemId: itemInfo.id,
                        name: itemInfo.name,
                        foreignPrice: itemInfo.cost,
                        foreignStock: itemInfo.quantity,
                        countryName: countryName,
                        category: itemCategoryMap[itemInfo.id] || 'Other',
                    });
                }
            }
        }
    }

    if (matchedItems.length === 0) {
        itemListDiv.innerHTML = `<p>No items found matching "${searchQuery}" in any country.</p>`;
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

    // *** KEY CHANGE: Fetch reliable prices for each SEARCHED item individually ***
    const itemsToDisplay = await Promise.all(filteredItems.map(async (itemData) => {
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
            countryName: itemData.countryName,
            tornCityPrice: tornCityPrice,
            profitPerItem: profitPerItem,
            totalPotentialProfit: totalPotentialProfit,
            canCarry: canCarry,
            category: itemData.category,
        };
    }));

    // Sort and display the results
    itemsToDisplay.sort((a, b) => {
        const profitA = typeof a.profitPerItem === 'number' ? a.profitPerItem : -Infinity;
        const profitB = typeof b.profitPerItem === 'number' ? b.profitPerItem : -Infinity;
        return profitB - profitA;
    });

    itemListDiv.innerHTML = '';
    itemsToDisplay.forEach(item => {
        const itemCard = document.createElement('div');
        itemCard.classList.add('item-card');
        itemCard.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="item-details">
                <h3>${item.name} (${item.category}) in ${item.countryName}</h3>
                <p>Foreign Price: $${item.foreignPrice.toLocaleString()}</p>
                <p>Foreign Stock: ${item.foreignStock.toLocaleString()}</p>
                <p>Torn City Price: ${item.tornCityPrice !== null ? '$' + item.tornCityPrice.toLocaleString() : 'Not available'}</p>
                <p class="profit-info">Profit per item: ${typeof item.profitPerItem === 'number' ? '$' + item.profitPerItem.toLocaleString() : item.profitPerItem}</p>
                <p class="profit-info">You can carry: ${item.canCarry} items (Potential profit: ${typeof item.totalPotentialProfit === 'number' ? '$' + item.totalPotentialProfit.toLocaleString() : item.totalPotentialProfit})</p>
                <p style="font-size: 0.8em; color: #888;">ID: ${item.id}</p>
            </div>
        `;
        itemListDiv.appendChild(itemCard);
    });

    loadingIndicator.style.display = 'none';
}
    // --- Firebase Auth State Listener & Initial Data Load ---
    if (typeof auth !== 'undefined' && auth && typeof db !== 'undefined' && db) {
        auth.onAuthStateChanged(async function(user) {
            const usefulLinksBtn = document.getElementById('usefulLinksBtn');
            const usefulLinksDropdown = document.getElementById('usefulLinksDropdown');
            const headerButtonsContainer = document.getElementById('headerButtonsContainer');
            const signUpButtonHeader = document.getElementById('signUpButtonHeader');
            const homeButtonFooter = document.getElementById('homeButtonFooter');
            const logoutButtonHeader = document.getElementById('logoutButtonHeader');

            // --- Common Header/Footer UI script (re-integrated here) ---
            if (usefulLinksBtn && usefulLinksDropdown) {
                usefulLinksBtn.addEventListener('click', function(event) {
                    event.stopPropagation();
                    usefulLinksDropdown.classList.toggle('show');
                });
            }
            window.addEventListener('click', function(event) {
                if (usefulLinksBtn && usefulLinksDropdown && usefulLinksDropdown.classList.contains('show')) {
                    if (!usefulLinksBtn.contains(event.target) && !usefulLinksDropdown.contains(event.target)) {
                        usefulLinksDropdown.classList.remove('show');
                    }
                }
            });

            if (user) { // User is signed in
                console.log("User logged in:", user.uid); // DEBUG
                const userDocRef = firebase.firestore().collection('userProfiles').doc(user.uid);
                try {
                    const doc = await userDocRef.get();
                    if (doc.exists) {
                        const userData = doc.data();
                        currentTornApiKey = userData.tornApiKey || null;
                        console.log("Fetched Torn API Key from Firebase:", currentTornApiKey); // DEBUG

                        if (currentTornApiKey) {
                            // Update UI for logged-in state
                            if (headerButtonsContainer) headerButtonsContainer.style.display = 'flex';
                            if (signUpButtonHeader) signUpButtonHeader.style.display = 'none';
                            if (homeButtonFooter) homeButtonFooter.style.display = 'inline';
                            if (logoutButtonHeader) logoutButtonHeader.style.display = 'inline-flex';

                            errorDisplay.textContent = ''; // Clear any previous API key errors
                            loadingIndicator.textContent = 'Fetching essential data using your stored API key...';
                            // loadingIndicator.style.display = 'block'; // Commented out to hide indicator

                            // Initial data fetches on login/page load
                            await fetchAllTornItems(currentTornApiKey); // Needed for images and category fallback
                            await fetchAndPopulateDestinations();

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
                            // Hide logged-in UI if no API key
                            if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
                            if (signUpButtonHeader) signUpButtonHeader.style.display = 'inline-flex'; // Show sign up if no key
                            if (homeButtonFooter) homeButtonFooter.style.display = 'none';
                            if (logoutButtonHeader) logoutButtonHeader.style.display = 'none';
                        }
                    } else {
                        errorDisplay.textContent = 'User profile not found in database.';
                        console.error("User profile not found for UID:", user.uid); // DEBUG
                        loadingIndicator.style.display = 'none';
                        // Hide logged-in UI if no profile
                        if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
                        if (signUpButtonHeader) signUpButtonHeader.style.display = 'inline-flex';
                        if (homeButtonFooter) homeButtonFooter.style.display = 'none';
                        if (logoutButtonHeader) logoutButtonHeader.style.display = 'none';
                    }
                } catch (error) {
                    errorDisplay.textContent = 'Error fetching user profile: ' + error.message;
                    console.error('Error fetching user profile from Firestore:', error); // DEBUG
                    loadingIndicator.style.display = 'none';
                    // Hide logged-in UI on error
                    if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
                    if (signUpButtonHeader) signUpButtonHeader.style.display = 'inline-flex';
                    if (homeButtonFooter) homeButtonFooter.style.display = 'none';
                    if (logoutButtonHeader) logoutButtonHeader.style.display = 'none';
                }
            } else {
                // No user signed in
                currentTornApiKey = null;
                errorDisplay.textContent = 'You must be logged in to use the Travel Helper. Please log in.';
                loadingIndicator.style.display = 'none';
                itemListDiv.innerHTML = '<p>Please log in to use the Travel Helper.</p>';
                destinationSelect.innerHTML = '<option value="">-- Log in to load destinations --</option>';

                // Update UI for not logged-in state
                if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
                // Define nonAuthEntryPages for safety, or simplify
                const currentPagePath = window.location.pathname;
                let pageName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase();
                const nonAuthEntryPages = ['index.html', 'ranked.html', 'login.html', 'travel.html']; // Travel.html is now accessible unauthenticated
                let isThisNonAuthEntryPage = nonAuthEntryPages.includes(pageName) || (pageName === "" && currentPagePath === "/");

                if (signUpButtonHeader) signUpButtonHeader.style.display = isThisNonAuthEntryPage ? 'none' : 'inline-flex';
                if (homeButtonFooter) homeButtonFooter.style.display = 'none';
                if (logoutButtonHeader) logoutButtonHeader.style.display = 'none';
            }
        });

        // Logout functionality
        const logoutButtonHeader = document.getElementById('logoutButtonHeader'); // Re-get here for scope
        if (logoutButtonHeader) {
            logoutButtonHeader.onclick = function() {
                auth.signOut().then(() => {
                    console.log('User signed out');
                    // Redirect or update UI after logout
                    const currentPagePath = window.location.pathname;
                    let pageName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase();
                    const nonAuthEntryPages = ['index.html', 'ranked.html', 'login.html', 'travel.html'];
                    if (!nonAuthEntryPages.includes(pageName) && !(pageName === "" && currentPagePath === "/")) {
                        window.location.href = 'ranked.html'; // Or your primary login page
                    }
                }).catch((error) => {
                    console.error('Sign out error', error);
                });
            };
        }
    } else {
        console.warn("Firebase auth or firestore object (from firebase-init.js) is not available. API key fetching will not work."); // DEBUG
        errorDisplay.textContent = "Firebase is not initialized. Please ensure firebase-init.js is loaded correctly.";
        loadingIndicator.style.display = 'none';
    }


    // --- Event Listeners ---

    fetchDataBtn.addEventListener('click', async () => {
        if (!currentTornApiKey) {
            errorDisplay.textContent = 'No Torn API Key available. Please ensure you are logged in and your key is stored.';
            return;
        }
        errorDisplay.textContent = '';
        loadingIndicator.textContent = 'Refetching travel data...';
        // loadingIndicator.style.display = 'block'; // Commented out to hide indicator

        await fetchAllTornItems(currentTornApiKey); // Needed for images and category fallback
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
    
    // NEW: Event listener for the Item Search input
    itemSearchInput.addEventListener('input', async () => {
        const searchQuery = itemSearchInput.value.trim(); // Get the current search query
        const apiKey = currentTornApiKey; // Ensure API key is available

        // If search query is empty, revert to showing items based on selected country/category
        if (searchQuery === '') {
            const selectedCountryId = destinationSelect.value;
            if (selectedCountryId && apiKey) {
                selectedCountryNameSpan.textContent = destinationSelect.options[destinationSelect.selectedIndex].textContent;
                await displayItemsForCountry(selectedCountryId, apiKey);
            } else {
                // If no country selected, clear item list or show default message
                selectedCountryNameSpan.textContent = 'Selected Country';
                itemListDiv.innerHTML = '<p>Select a destination or search for an item to see details.</p>';
            }
            return; // Exit if search query is empty
        }

        if (!apiKey) {
            errorDisplay.textContent = 'No Torn API Key available. Please log in to search items.';
            return;
        }

        // Call a new function to handle the item search and display results
        await searchItemsAndDisplayResults(searchQuery, apiKey);
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