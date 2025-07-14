// --- Global variable to store all Torn items (cached for efficiency) ---
let allTornItems = {};

// --- Global variables to store YATA travel data (cached for efficiency) ---
let yataTravelData = null;
let lastYataFetchTime = 0;
const YATA_CACHE_DURATION = 5 * 60 * 1000; // Cache YATA data for 5 minutes (adjust as needed)
const countryNameMap = {
    "1": "United Kingdom",
    "2": "Canada",
    "3": "Japan",
    "4": "Cayman Islands",
    "5": "Mexico",
    "6": "South Africa",
    "7": "Switzerland",
    "8": "United Arab Emirates",
    "9": "Argentina",
    "10": "Hawaii",
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

// Function to fetch all item details (UPDATED for V2)
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
        // Correct Torn API v2 URL for all items
        const response = await fetch(`https://api.torn.com/v2/torn?selections=items&key=${apiKey}`);
        const data = await response.json();

        if (data.error) {
            errorDisplay.textContent = `API Error fetching items: ${data.error.error}`;
            console.error('Torn API Error fetching items:', data.error);
            loadingIndicator.style.display = 'none';
            return;
        }

        allTornItems = data.items;
        console.log('Successfully loaded all Torn items:', Object.keys(allTornItems).length);
        loadingIndicator.style.display = 'none';

    } catch (error) {
        errorDisplay.textContent = 'Failed to fetch all Torn items. Check your network.';
        console.error('Fetch all items error:', error);
        loadingIndicator.style.display = 'none';
    }
}


   // UPDATED: Function to display items for a selected country using YATA data (Corrected YATA data path)
async function displayItemsForCountry(selectedCountryId, apiKey) {
    itemListDiv.innerHTML = '';
    loadingIndicator.textContent = 'Fetching item details and Torn City prices...';
    loadingIndicator.style.display = 'block';
    errorDisplay.textContent = '';

    if (Object.keys(allTornItems).length === 0) {
        // This check is still valid if allTornItems is needed for images/categories
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

    // --- CRITICAL CHANGE HERE: Access yataData.stocks directly ---
    const countryData = yataData.stocks[selectedCountryId];

    // And items are within countryData.stocks, not countryData.items
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
        foreignStock: itemInfo.quantity, // YATA uses 'quantity' for stock
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
        const itemDetailsFromTornAPI = allTornItems[itemId]; // Still needed for image and description

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
                <p style="font-size: 0.8em; color: #888;">ID: ${item.id}</p> </div>
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