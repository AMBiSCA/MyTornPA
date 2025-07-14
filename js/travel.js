// --- Global variable to store all Torn items (cached for efficiency) ---
let allTornItems = {};

// --- Global variables to store YATA travel data (cached for efficiency) ---
let yataTravelData = null;
let lastYataFetchTime = 0;
const YATA_CACHE_DURATION = 5 * 60 * 1000; // Cache YATA data for 5 minutes (adjust as needed)
const countryNameMap = {
    "mex": "Mexico",
    "cay": "Cayman Islands",
    "can": "Canada",
    "haw": "Hawaii",
    "uni": "United Kingdom", // Assumed 'uni' is United Kingdom based on items
    "arg": "Argentina",
    "swi": "Switzerland",
    "jap": "Japan",
    "chi": "China",
    "uae": "United Arab Emirates",
    "sou": "South Africa"
};
document.addEventListener('DOMContentLoaded', function() {
    // --- Torn Travel Helper Script - UI element references ---
    // REMOVED: const apiKeyInput = document.getElementById('api-key');
    const destinationSelect = document.getElementById('destination-select');
    const fetchDataBtn = document.getElementById('fetch-data-btn');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorDisplay = document.getElementById('error-display');
    const selectedCountryNameSpan = document.getElementById('selected-country-name');
    const itemListDiv = document.getElementById('item-list');
    const travelCapacityInput = document.getElementById('travel-capacity');
    const categoryFilterSelect = document.getElementById('category-filter');
    const itemCategoryMap = {
    // Plushies (Common travel plushies with their IDs)
    "207": "Plushie", // Panda Plushie
    "212": "Plushie", // Camel Plushie
    "205": "Plushie", // Lion Plushie
    "206": "Plushie", // Monkey Plushie
    "204": "Plushie", // Chamois Plushie
    "213": "Plushie", // Nessie Plushie
    "211": "Plushie", // Stingray Plushie
    "214": "Plushie", // Jaguar Plushie
    "215": "Plushie", // Wolverine Plushie
    // YATA Sample IDs (verify these with actual item IDs from Torn)
    "266": "Plushie", // Nessie Plushie (from YATA sample for Uni)
    "618": "Plushie", // Stingray Plushie (from YATA sample for Cay)
    "258": "Plushie", // Jaguar Plushie (from YATA sample for Mex)
    "261": "Plushie", // Wolverine Plushie (from YATA sample for Can)
    "274": "Plushie", // Panda Plushie (from YATA sample for Chi)
    "281": "Plushie", // Lion Plushie (from YATA sample for Sou)
    "269": "Plushie", // Monkey Plushie (from YATA sample for Arg)
    "384": "Plushie", // Camel Plushie (from YATA sample for UAE)
    "273": "Plushie", // Chamois Plushie (from YATA sample for Swi)

    // Flowers (Common travel flowers with their IDs)
    "203": "Flower", // Cherry Blossom
    "201": "Flower", // Orchid
    "209": "Flower", // Dahlia
    "200": "Flower", // Tribulus Omanense
    "210": "Flower", // Edelweiss
    "202": "Flower", // Ceibo Flower
    "216": "Flower", // Crocus
    "217": "Flower", // Banana Orchid
    "218": "Flower", // African Violet
    "219": "Flower", // Peony
    // YATA Sample IDs (verify these with actual item IDs from Torn)
    "277": "Flower", // Cherry Blossom (from YATA sample for Jap)
    "260": "Flower", // Dahlia (from YATA sample for Mex)
    "617": "Flower", // Banana Orchid (from YATA sample for Cay)
    "263": "Flower", // Crocus (from YATA sample for Can)
    "264": "Flower", // Orchid (from YATA sample for Haw)
    "267": "Flower", // Heather (from YATA sample for Uni)
    "271": "Flower", // Ceibo Flower (from YATA sample for Arg)
    "272": "Flower", // Edelweiss (from YATA sample for Swi)
    "276": "Flower", // Peony (from YATA sample for Chi)
    "385": "Flower", // Tribulus Omanense (from YATA sample for UAE)
    "282": "Flower", // African Violet (from YATA sample for Sou)

    // Drugs (Common travel drugs with their IDs from YATA samples)
    "196": "Drug", // Cannabis
    "197": "Drug", // Ecstasy
    "198": "Drug", // Ketamine
    "199": "Drug", // LSD
    "200": "Drug", // Opium
    "201": "Drug", // PCP
    "203": "Drug", // Shrooms
    "204": "Drug", // Speed
    "205": "Drug", // Vicodin
    "206": "Drug", // Xanax

    // Special items that might be profitable or common travel items (IDs from YATA samples)
    "273": "Special", // Bottle of Beer
    "419": "Special", // Small Suitcase
    "420": "Special", // Medium Suitcase
    "421": "Special", // Large Suitcase
    "327": "Special", // Blank Tokens
    "259": "Special", // Mayan Statue (from your screenshot)
    "616": "Special", // Trout
    "619": "Special", // Steel Drum
    "620": "Special", // Nodding Turtle
    "621": "Special", // Snorkel
    "622": "Special", // Flippers
    "623": "Special", // Speedo
    "624": "Special", // Bikini
    "625": "Special", // Wetsuit
    "626": "Special", // Diving Gloves
    "412": "Special", // Sports Shades
    "414": "Special", // Proda Sunglasses
    "440": "Special", // Pillow
    "381": "Special", // Gold Laptop
    "382": "Special", // Gold Plated AK-47
    "383": "Special", // Digital Organizer
    "278": "Special", // Kabuki Mask
    "279": "Special", // Maneki Neko
    "294": "Special", // Bottle of Sake
    "427": "Special", // Sumo Doll
    "429": "Special", // Chopsticks
    "433": "Special", // Sensu
    "434": "Special", // Yakitori Lantern
    "437": "Special", // Glow Stick
    "270": "Special", // Soccer Ball
    "407": "Special", // Compass
    "361": "Special", // Neumune Tablet
    "435": "Special", // Dozen White Roses
    "436": "Special", // Snowboard
    "408": "Special", // Sextant
    "411": "Special", // Model Space Ship
    "415": "Special", // Ship in a Bottle
    "416": "Special", // Paper Weight
    "418": "Special", // Tailor's Dummy
    "431": "Special", // Dart Board
    "432": "Special", // Crazy Straw
    "426": "Special", // Bottle of Tequila
    "409": "Special", // Yucca Plant
    "410": "Special", // Fire Hydrant
    "406": "Special", // Afro Comb

    // Weapons (from YATA samples you provided)
    "8": "Weapon", // Axe
    "11": "Weapon", // Samurai Sword
    "20": "Weapon", // Desert Eagle
    "21": "Weapon", // Dual 92G Berettas
    "26": "Weapon", // AK-47
    "31": "Weapon", // M249 SAW
    "63": "Weapon", // Minigun
    "99": "Weapon", // Springfield 1911
    "108": "Weapon", // 9mm Uzi
    "110": "Weapon", // Leather Bullwhip
    "111": "Weapon", // Ninja Claws
    "175": "Weapon", // Taser
    "177": "Weapon", // Cobra Derringer
    "229": "Weapon", // Claymore Mine
    "230": "Weapon", // Flare Gun
    "231": "Weapon", // Heckler & Koch SL8
    "232": "Weapon", // SIG 550
    "399": "Weapon", // ArmaLite M-15A4
    "612": "Weapon", // Tavor TAR-21
    "613": "Weapon", // Harpoon
    "614": "Weapon", // Diamond Bladed Knife
    "615": "Weapon", // Naval Cutlass
    "217": "Weapon", // Claymore Sword
    "218": "Weapon", // Crossbow
    "219": "Weapon", // Enfield SA-80
    "220": "Weapon", // Grenade
    "221": "Weapon", // Stick Grenade
    "397": "Weapon", // Flail
    "438": "Weapon", // Cricket Bat
    "1246": "Weapon", // Inkwell (often used for training)
    "252": "Weapon", // Ithaca 37
    "253": "Weapon", // Lorcin 380
    "262": "Weapon", // Hockey Stick
    "402": "Weapon", // Ice Pick
    "255": "Weapon", // Flamethrower
    "256": "Weapon", // Tear Gas
    "257": "Weapon", // Throwing Knife
    "333": "Weapon", // Liquid Body Armor (also in armor)
    "391": "Weapon", // Macana
    "398": "Weapon", // SIG 552
    "400": "Weapon", // Guandao
    "222": "Weapon", // Flash Grenade
    "223": "Weapon", // Jackhammer
    "224": "Weapon", // Swiss Army Knife
    "233": "Weapon", // BT MP9
    "234": "Weapon", // Chain Whip
    "235": "Weapon", // Wooden Nunchaku
    "236": "Weapon", // Kama
    "237": "Weapon", // Kodachi
    "238": "Weapon", // Sai
    "239": "Weapon", // Ninja Star
    "395": "Weapon", // Metal Nunchaku
    "240": "Weapon", // Type 98 Anti Tank
    "241": "Weapon", // Bushmaster Carbon 15
    "242": "Weapon", // HEG
    "243": "Weapon", // Taurus
    "244": "Weapon", // Blowgun
    "245": "Weapon", // Bo Staff
    "246": "Weapon", // Fireworks
    "247": "Weapon", // Katana
    "248": "Weapon", // Qsz-92
    "249": "Weapon", // SKS Carbine
    "250": "Weapon", // Twin Tiger Hooks
    "251": "Weapon", // Wushu Double Axes


    // Armor (from YATA samples you provided)
    "50": "Armor", // Outer Tactical Vest
    "107": "Armor", // Trench Coat
    "178": "Armor", // Flak Jacket
    "640": "Armor", // Kevlar Gloves
    "641": "Armor", // WWII Helmet
    "645": "Armor", // Safety Boots
    "332": "Armor", // Combat Vest
    "334": "Armor", // Flexible Body Armor
    "651": "Armor", // Combat Helmet
    "652": "Armor", // Combat Pants
    "653": "Armor", // Combat Boots
    "654": "Armor", // Combat Gloves
    "430": "Armor", // Coconut Bra

    // Clothing (from YATA samples you provided)
    "1125": "Clothing", // Card Skimmer
    "624": "Clothing", // Bikini
    "625": "Clothing", // Wetsuit
    "626": "Clothing", // Diving Gloves
    "623": "Clothing", // Speedo
    "413": "Clothing", // Mountie Hat
    "439": "Clothing", // Frying Pan (sometimes considered a clothing item or misc)

    // Miscellaneous (items that don't fit other common categories well, often quest/crime related)
    "159": "Miscellaneous", // Bolt Cutters
    "328": "Miscellaneous", // PVC Cards
    "335": "Miscellaneous", // Stick of Dynamite
};
    let currentTornApiKey = null; // Variable to hold the fetched Torn API key

    // --- Firebase Auth State Listener (Modified) ---
    // Ensure 'auth' and 'db' (Firestore) are accessible, presumably from firebase-init.js
    if (typeof auth !== 'undefined' && auth && typeof db !== 'undefined' && db) {
        auth.onAuthStateChanged(async function(user) {
            if (user) {
                // User is signed in, fetch their API key from Firestore
                const userDocRef = firebase.firestore().collection('userProfiles').doc(user.uid);
                try {
                    const doc = await userDocRef.get();
                    if (doc.exists) {
                        const userData = doc.data();
                        currentTornApiKey = userData.tornApiKey || null;

                        if (currentTornApiKey) {
                            errorDisplay.textContent = ''; // Clear any previous API key errors
                            // Automatically fetch data if API key is found
                            loadingIndicator.textContent = 'Fetching essential data using your stored API key...';
                            loadingIndicator.style.display = 'block';

                            await fetchAllTornItems(currentTornApiKey);
                            await fetchAndPopulateDestinations(currentTornApiKey); // Pass key to function

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
                        loadingIndicator.style.display = 'none';
                    }
                } catch (error) {
                    errorDisplay.textContent = 'Error fetching user profile: ' + error.message;
                    console.error('Error fetching user profile:', error);
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
        console.warn("Firebase auth or firestore object (from firebase-init.js) is not available. API key fetching will not work.");
        errorDisplay.textContent = "Firebase is not initialized. Please ensure firebase-init.js is loaded correctly.";
        loadingIndicator.style.display = 'none';
    }

    // --- Helper Functions (all remain inside DOMContentLoaded) ---
async function fetchAndPopulateDestinations() {
    // No API key check needed for this function anymore, as it's not calling Torn API.
    loadingIndicator.style.display = 'block';
    errorDisplay.textContent = '';
    destinationSelect.innerHTML = '<option value="">Loading destinations...</option>'; // Reset dropdown

    try {
        // Populate from the hardcoded map
        destinationSelect.innerHTML = '<option value="">-- Select a country --</option>'; // Default option
        for (const countryCode in countryNameMap) {
            if (countryNameMap.hasOwnProperty(countryCode)) {
                const countryName = countryNameMap[countryCode];
                const option = document.createElement('option');
                option.value = countryCode; // Use the short code/ID as the value
                option.textContent = countryName;
                destinationSelect.appendChild(option);
            }
        }
        loadingIndicator.style.display = 'none';

        console.log("Destinations populated from hardcoded list."); // DEBUG message

    } catch (error) {
        errorDisplay.textContent = 'Failed to populate travel destinations from hardcoded list.';
        console.error('Populate destinations error:', error);
        loadingIndicator.style.display = 'none';
    }
}
   
    async function fetchYATATravelData() {
        // ... (existing fetchYATATravelData code) ...
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

   // --- Updated Helper Functions using Torn API v2 URLs ---

// Function to fetch Torn City market price for a single item (UPDATED for V2)
async function fetchTornCityItemPrice(itemId, apiKey) {
    try {
        // Correct Torn API v2 URL for item market
        const response = await fetch(`https://api.torn.com/v2/market/${itemId}?selections=itemmarket&key=${apiKey}`);
        const data = await response.json();

        if (data.error) {
            console.warn(`API Error fetching Torn City market for item ${itemId}: ${data.error.error}`);
            return null;
        }

        const listings = data.itemmarket;
        if (listings && listings.length > 0) {
            // Find the lowest price on the Torn City Item Market
            const lowestPrice = listings.reduce((min, listing) => Math.min(min, listing.cost), Infinity);
            return lowestPrice;
        }
        return null; // No listings found
    } catch (error) {
        console.error(`Error fetching Torn City market price for item ${itemId}:`, error);
        return null;
    }
}

// UPDATED: Function to display items for a selected country using YATA data ONLY (no Torn API 'items' details)
async function displayItemsForCountry(selectedCountryId, apiKey) {
    itemListDiv.innerHTML = '';
    loadingIndicator.textContent = 'Fetching item details and Torn City prices...';
    loadingIndicator.style.display = 'block';
    errorDisplay.textContent = '';

    console.log("displayItemsForCountry called with selectedCountryId:", selectedCountryId);

    // Removed the allTornItems check here, as item images/descriptions are now derived differently.
    // However, if your 'category' filter still needs it for some reason, the fetchAllTornItems call
    // in the onAuthStateChanged or fetchDataBtn listeners still runs.

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

    console.log("YATA Data (stocks key exists?):", yataData.stocks ? true : false);
    console.log("Attempting to access countryData for key:", selectedCountryId);

    const countryData = yataData.stocks[selectedCountryId];

    console.log("Country Data from YATA for selected ID:", countryData);
    if (countryData) {
        console.log("Number of stocks in countryData:", countryData.stocks ? countryData.stocks.length : 0);
    }

    if (!countryData || !countryData.stocks || countryData.stocks.length === 0) {
        itemListDiv.innerHTML = `<p>No live item data available for this country from YATA. It might be an unpopular travel destination or data isn't available.</p>`;
        loadingIndicator.style.display = 'none';
        return;
    }

    const itemsForSelectedCountry = countryData.stocks.map(itemInfo => ({
        itemId: itemInfo.id,
        name: itemInfo.name, // Use name from YATA (should be correct)
        foreignPrice: itemInfo.cost,
        foreignStock: itemInfo.quantity, // YATA uses 'quantity' for stock
        // Use the hardcoded itemCategoryMap for category
        category: itemCategoryMap[itemInfo.id] || 'Other' // This requires itemCategoryMap to be defined
    }));

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

    const itemPromises = filteredItems.map(async (itemData) => {
        const itemId = itemData.itemId;

        // --- CRITICAL CHANGE: Derive image URL directly from ID ---
        const imageUrl = `https://www.torn.com/images/items/${itemId}/large.png`;
        // Default description as Torn API 'items' endpoint is now fully bypassed for details
        const itemDescription = 'No description available.'; // Or you can make a hardcoded map for descriptions

        const tornCityPrice = await fetchTornCityItemPrice(itemId, apiKey); // Still needs Torn API 'Market' permission
        const profitPerItem = tornCityPrice !== null ? tornCityPrice - itemData.foreignPrice : 'N/A';
        const totalPotentialProfit = tornCityPrice !== null ? profitPerItem * Math.min(itemData.foreignStock, travelCapacity) : 'N/A';
        const canCarry = Math.min(itemData.foreignStock, travelCapacity);

        return {
            id: itemId,
            name: itemData.name,
            image: imageUrl, // Use the directly constructed image URL
            description: itemDescription, // Use default description
            foreignPrice: itemData.foreignPrice,
            foreignStock: itemData.foreignStock,
            tornCityPrice: tornCityPrice,
            profitPerItem: profitPerItem,
            totalPotentialProfit: totalPotentialProfit,
            canCarry: canCarry,
            category: itemData.category
        };
    });

    const itemsToDisplay = (await Promise.all(itemPromises)).filter(item => item !== null);

    if (itemsToDisplay.length === 0) {
        itemListDiv.innerHTML = `<p>Could not load any item data for the selected country and category.</p>`;
        loadingIndicator.style.display = 'none';
        return;
    }

    itemsToDisplay.sort((a, b) => {
        if (typeof a.profitPerItem !== 'number' && typeof b.profitPerItem !== 'number') return 0;
        if (typeof a.profitPerItem !== 'number') return 1;
        if (typeof b.profitPerItem !== 'number') return -1;
        return b.profitPerItem - a.profitPerItem;
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

// UPDATED: Function to display items for a selected country using YATA data (Corrected YATA data path and duplicate code)
async function displayItemsForCountry(selectedCountryId, apiKey) {
    itemListDiv.innerHTML = '';
    loadingIndicator.textContent = 'Fetching item details and Torn City prices...';
    loadingIndicator.style.display = 'block';
    errorDisplay.textContent = '';

    console.log("displayItemsForCountry called with selectedCountryId:", selectedCountryId); // DEBUG

    if (Object.keys(allTornItems).length === 0) {
        errorDisplay.textContent = 'Item details not loaded. Please ensure API key is valid and user profile loaded correctly.';
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

    // This is the correct access path and should be the ONLY declaration for countryData
    const countryData = yataData.stocks[selectedCountryId];

    console.log("Country Data from YATA for selected ID:", countryData); // DEBUG
    if (countryData) {
        console.log("Number of stocks in countryData:", countryData.stocks ? countryData.stocks.length : 0); // DEBUG
    }

    // This is the correct check to perform once.
    if (!countryData || !countryData.stocks || countryData.stocks.length === 0) {
        itemListDiv.innerHTML = `<p>No live item data available for this country from YATA. It might be an unpopular travel destination or data isn't available.</p>`;
        loadingIndicator.style.display = 'none';
        return;
    }

    // Map the YATA stock data to our desired item structure
    const itemsForSelectedCountry = countryData.stocks.map(itemInfo => ({
        itemId: itemInfo.id,
        name: itemInfo.name,
        foreignPrice: itemInfo.cost,
        foreignStock: itemInfo.quantity,
        category: allTornItems[itemInfo.id] ? allTornItems[itemInfo.id].type : 'Unknown'
    }));

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

    const itemPromises = filteredItems.map(async (itemData) => {
        const itemId = itemData.itemId;
        const itemDetailsFromTornAPI = allTornItems[itemId];

        const tornCityPrice = await fetchTornCityItemPrice(itemId, apiKey);
        const profitPerItem = tornCityPrice !== null ? tornCityPrice - itemData.foreignPrice : 'N/A';
        const totalPotentialProfit = tornCityPrice !== null ? profitPerItem * Math.min(itemData.foreignStock, travelCapacity) : 'N/A';
        const canCarry = Math.min(itemData.foreignStock, travelCapacity);

        return {
            id: itemId,
            name: itemData.name,
            image: itemDetailsFromTornAPI ? itemDetailsFromTornAPI.image : '',
            description: itemDetailsFromTornAPI ? itemDetailsFromTornAPI.description : 'No description available.',
            foreignPrice: itemData.foreignPrice,
            foreignStock: itemData.foreignStock,
            tornCityPrice: tornCityPrice,
            profitPerItem: profitPerItem,
            totalPotentialProfit: totalPotentialProfit,
            canCarry: canCarry,
            category: itemData.category
        };
    });

    const itemsToDisplay = (await Promise.all(itemPromises)).filter(item => item !== null);

    if (itemsToDisplay.length === 0) {
        itemListDiv.innerHTML = `<p>Could not load any item data for the selected country and category.</p>`;
        loadingIndicator.style.display = 'none';
        return;
    }

    itemsToDisplay.sort((a, b) => {
        if (typeof a.profitPerItem !== 'number' && typeof b.profitPerItem !== 'number') return 0;
        if (typeof a.profitPerItem !== 'number') return 1;
        if (typeof b.profitPerItem !== 'number') return -1;
        return b.profitPerItem - a.profitPerItem;
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
 fetchDataBtn.addEventListener('click', async () => {
    if (!currentTornApiKey) {
        errorDisplay.textContent = 'No Torn API Key available. Please ensure you are logged in and your key is stored.';
        return;
    }
    errorDisplay.textContent = '';
    loadingIndicator.textContent = 'Refetching travel data...';
    loadingIndicator.style.display = 'block';

    await fetchAllTornItems(currentTornApiKey);
    // Corrected: No API key passed to fetchAndPopulateDestinations
    await fetchAndPopulateDestinations(); // <--- This line is changed

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