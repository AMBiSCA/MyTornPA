// --- Global variable to store all Torn items (no longer populated from Torn API, keep for compatibility) ---
// We'll keep this variable, but it won't be filled by Torn API anymore.
// Its usage will be replaced by data from YATA where possible.
let allTornItems = {};

// --- Global variables to store YATA travel data (cached for efficiency) ---
let yataTravelData = null;
let lastYataFetchTime = 0;
const YATA_CACHE_DURATION = 5 * 60 * 1000;

document.addEventListener('DOMContentLoaded', function() {
    // ... (your existing const declarations for UI elements) ...
    const destinationSelect = document.getElementById('destination-select');
    const fetchDataBtn = document.getElementById('fetch-data-btn');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorDisplay = document.getElementById('error-display');
    const selectedCountryNameSpan = document.getElementById('selected-country-name');
    const itemListDiv = document.getElementById('item-list');
    const travelCapacityInput = document.getElementById('travel-capacity');
    const categoryFilterSelect = document.getElementById('category-filter');

    let currentTornApiKey = null;

    // --- Firebase Auth State Listener (Keep as is, but Torn API key needs fewer permissions now) ---
    if (typeof auth !== 'undefined' && auth && typeof db !== 'undefined' && db) {
        auth.onAuthStateChanged(async function(user) {
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
                            loadingIndicator.textContent = 'Fetching essential data using your stored API key...';
                            loadingIndicator.style.display = 'block';

                            // REMOVE OR MODIFY: await fetchAllTornItems(currentTornApiKey);
                            // As YATA now provides item names, fetchAllTornItems from Torn API is no longer strictly needed for names.
                            // We still need to call this to fill the `allTornItems` for CATEGORIES
                            // OR, if `allTornItems` is ONLY used for categories, we'll need to fetch categories differently.
                            // Let's keep fetchAllTornItems, but change its role if we want categories.
                            await fetchAllTornItems(currentTornApiKey); // Keep this for categories, or if some items lack names in YATA
                            await fetchAndPopulateDestinations(currentTornApiKey); // Still needs Torn API "Travel" permission

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
                console.log("User not logged in.");
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

    // --- Helper Functions ---

    // fetchTornCityItemPrice remains UNCHANGED (still needs Torn API 'Market' permission)
    async function fetchTornCityItemPrice(itemId, apiKey) {
        try {
            const response = await fetch(`https://api.torn.com/v2/market/${itemId}?selections=itemmarket&key=${apiKey}`);
            const data = await response.json();
            if (data.error) {
                console.warn(`API Error fetching Torn City market for item ${itemId}: ${data.error.error}`);
                return null;
            }
            const listings = data.itemmarket;
            if (listings && listings.length > 0) {
                const lowestPrice = listings.reduce((min, listing) => Math.min(min, listing.cost), Infinity);
                return lowestPrice;
            }
            return null;
        } catch (error) {
            console.error(`Error fetching Torn City market price for item ${itemId}:`, error);
            return null;
        }
    }

    // fetchAllTornItems remains UNCHANGED for now, as we still need 'type' (category) from Torn API
    // We *could* try to infer categories from item names, but using Torn API `items` selection is more reliable for that.
    // So, 'Items' permission is still needed for proper category filtering.
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
            allTornItems = data.items;
            console.log('Successfully loaded all Torn items:', Object.keys(allTornItems).length);
            loadingIndicator.style.display = 'none';
        } catch (error) {
            errorDisplay.textContent = 'Failed to fetch all Torn items. Check your network.';
            console.error('Fetch all items error:', error);
            loadingIndicator.style.display = 'none';
        }
    }

    // fetchYATATravelData remains UNCHANGED
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

    // fetchAndPopulateDestinations remains UNCHANGED (still needs Torn API 'Travel' permission for names)
    async function fetchAndPopulateDestinations(apiKey) {
        if (!apiKey) {
            errorDisplay.textContent = 'API Key is required to fetch destinations.';
            return;
        }
        loadingIndicator.style.display = 'block';
        errorDisplay.textContent = '';
        destinationSelect.innerHTML = '<option value="">Loading destinations...</option>';
        try {
            const response = await fetch(`https://api.torn.com/v2/torn?selections=travel&key=${apiKey}`);
            const data = await response.json();
            if (data.error) {
                errorDisplay.textContent = `API Error: ${data.error.error}`;
                console.error('Torn API Error:', data.error);
                loadingIndicator.style.display = 'none';
                return;
            }
            const destinations = data.travel;
            destinationSelect.innerHTML = '<option value="">-- Select a country --</option>';
            for (const countryId in destinations) {
                if (destinations.hasOwnProperty(countryId)) {
                    const country = destinations[countryId];
                    const option = document.createElement('option');
                    option.value = countryId;
                    option.textContent = country.name;
                    destinationSelect.appendChild(option);
                }
            }
            loadingIndicator.style.display = 'none';
        } catch (error) {
            errorDisplay.textContent = 'Failed to fetch travel destinations. Check your network connection.';
            console.error('Fetch error:', error);
            loadingIndicator.style.display = 'none';
        }
    }

    // UPDATED: displayItemsForCountry function to use YATA's item names and infer categories
    async function displayItemsForCountry(selectedCountryId, apiKey) {
        itemListDiv.innerHTML = '';
        loadingIndicator.textContent = 'Fetching item details and Torn City prices...';
        loadingIndicator.style.display = 'block';
        errorDisplay.textContent = '';

        // Removed the check for allTornItems.length, as we will get name from YATA directly.
        // We still need allTornItems for category lookup.

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

        const countryData = yataData.data.countries[selectedCountryId];

        if (!countryData || !countryData.stocks || countryData.stocks.length === 0) { // Changed .items to .stocks
            itemListDiv.innerHTML = `<p>No live item data available for this country from YATA. It might be an unpopular travel destination or data isn't available.</p>`;
            loadingIndicator.style.display = 'none';
            return;
        }

        // Changed from Object.entries(countryData.items) to countryData.stocks
        const itemsForSelectedCountry = countryData.stocks.map(itemInfo => ({
            itemId: itemInfo.id,
            name: itemInfo.name, // Directly get name from YATA data!
            foreignPrice: itemInfo.cost,
            foreignStock: itemInfo.quantity, // Quantity is stock in YATA
            // Infer category from allTornItems, if loaded. This still needs Torn API 'Items' permission.
            category: allTornItems[itemInfo.id] ? allTornItems[itemInfo.id].type : 'Unknown'
        }));

        const selectedCategory = categoryFilterSelect.value;
        let filteredItems = itemsForSelectedCountry;
        if (selectedCategory !== 'all') {
            // Filter based on the category we infer from allTornItems
            filteredItems = itemsForSelectedCountry.filter(item => item.category === selectedCategory);
        }

        if (filteredItems.length === 0) {
            itemListDiv.innerHTML = `<p>No items found for the selected category in this country based on YATA data.</p>`;
            loadingIndicator.style.display = 'none';
            return;
        }

        const itemPromises = filteredItems.map(async (itemData) => {
            const itemId = itemData.itemId;
            // No longer need itemDetails.name or .description directly from allTornItems for display
            // But still need it for image and potentially other static info
            const itemDetailsFromTornAPI = allTornItems[itemId]; // This is needed for image if not in YATA

            const tornCityPrice = await fetchTornCityItemPrice(itemId, apiKey);
            const profitPerItem = tornCityPrice !== null ? tornCityPrice - itemData.foreignPrice : 'N/A';
            const totalPotentialProfit = tornCityPrice !== null ? profitPerItem * Math.min(itemData.foreignStock, travelCapacity) : 'N/A';
            const canCarry = Math.min(itemData.foreignStock, travelCapacity);

            return {
                id: itemId,
                name: itemData.name, // Use name from YATA
                image: itemDetailsFromTornAPI ? itemDetailsFromTornAPI.image : '', // Get image from Torn API items data
                description: itemDetailsFromTornAPI ? itemDetailsFromTornAPI.description : 'No description available.',
                foreignPrice: itemData.foreignPrice,
                foreignStock: itemData.foreignStock,
                tornCityPrice: tornCityPrice,
                profitPerItem: profitPerItem,
                totalPotentialProfit: totalPotentialProfit,
                canCarry: canCarry,
                category: itemData.category // Use inferred category
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
                </div>
            `;
            itemListDiv.appendChild(itemCard);
        });

        loadingIndicator.style.display = 'none';
    }

    // --- Event Listeners (remain unchanged, they still pass apiKey to the functions) ---
    // ... fetchDataBtn.addEventListener('click', ...);
    // ... destinationSelect.addEventListener('change', ...);
    // ... categoryFilterSelect.addEventListener('change', ...);

}); // End of DOMContentLoaded