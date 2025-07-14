
let allTornItems = {};
let yataTravelData = null;
let lastYataFetchTime = 0;
const YATA_CACHE_DURATION = 5 * 60 * 1000; // Cache YATA data for 5 minutes (adjust as needed)


document.addEventListener('DOMContentLoaded', function() {
    // --- Torn Travel Helper Script ---
    // MOVE ALL THESE CONST DECLARATIONS TO THE VERY TOP OF THIS BLOCK
    const apiKeyInput = document.getElementById('api-key');
    const destinationSelect = document.getElementById('destination-select');
    const fetchDataBtn = document.getElementById('fetch-data-btn');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorDisplay = document.getElementById('error-display');
    const selectedCountryNameSpan = document.getElementById('selected-country-name');
    const itemListDiv = document.getElementById('item-list');
    const travelCapacityInput = document.getElementById('travel-capacity');
    const categoryFilterSelect = document.getElementById('category-filter'); // Ensure this is also here

    // --- All functions must be defined within this DOMContentLoaded scope ---
    // Function to fetch Torn City market price for a single item
    async function fetchTornCityItemPrice(itemId, apiKey) {
        // ... (your existing fetchTornCityItemPrice code) ...
        try {
            const response = await fetch(`https://api.torn.com/market/${itemId}?selections=itemmarket&key=${apiKey}`);
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

    // Function to fetch all item details
    async function fetchAllTornItems(apiKey) {
        // ... (your existing fetchAllTornItems code) ...
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
            const response = await fetch(`https://api.torn.com/torn/?selections=items&key=${apiKey}`);
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
            errorDisplay.textContent = 'Failed to fetch all Torn items. Check your API key and network.';
            console.error('Fetch all items error:', error);
            loadingIndicator.style.display = 'none';
        }
    }

    // Function to fetch YATA travel data
    async function fetchYATATravelData() {
        // ... (your existing fetchYATATravelData code) ...
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

    // Function to fetch and populate destinations
    async function fetchAndPopulateDestinations() {
        // ... (your existing fetchAndPopulateDestinations code) ...
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            errorDisplay.textContent = 'Please enter your Torn API Key.';
            return;
        }

        loadingIndicator.style.display = 'block';
        errorDisplay.textContent = '';
        destinationSelect.innerHTML = '<option value="">Loading destinations...</option>';

        try {
            const response = await fetch(`https://api.torn.com/torn/?selections=travel&key=${apiKey}`);
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
            errorDisplay.textContent = 'Failed to fetch travel destinations. Check your API key and network connection.';
            console.error('Fetch error:', error);
            loadingIndicator.style.display = 'none';
        }
    }

    // UPDATED: Function to display items for a selected country using YATA data
    async function displayItemsForCountry(selectedCountryId, apiKey) {
        // ... (your existing displayItemsForCountry code) ...
        itemListDiv.innerHTML = ''; // Clear previous items
        loadingIndicator.textContent = 'Fetching item details and Torn City prices...';
        loadingIndicator.style.display = 'block';
        errorDisplay.textContent = '';

        if (Object.keys(allTornItems).length === 0) {
            errorDisplay.textContent = 'Item details not loaded. Please ensure your API key is valid and try again.';
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

        const countryData = yataData.data.countries[selectedCountryId];

        if (!countryData || !countryData.items || Object.keys(countryData.items).length === 0) {
            itemListDiv.innerHTML = `<p>No live item data available for this country from YATA. It might be an unpopular travel destination or data isn't available.</p>`;
            loadingIndicator.style.display = 'none';
            return;
        }

        const itemsForSelectedCountry = Object.entries(countryData.items).map(([itemId, itemInfo]) => ({
            itemId: itemId,
            foreignPrice: itemInfo.cost,
            foreignStock: itemInfo.stock,
            category: allTornItems[itemId] ? allTornItems[itemId].type : 'Unknown'
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
            const itemDetails = allTornItems[itemId];
            if (!itemDetails) {
                console.warn(`Item details for ID ${itemId} not found in Torn API cache. Skipping.`);
                return null;
            }

            const tornCityPrice = await fetchTornCityItemPrice(itemId, apiKey);
            const profitPerItem = tornCityPrice !== null ? tornCityPrice - itemData.foreignPrice : 'N/A';
            const totalPotentialProfit = tornCityPrice !== null ? profitPerItem * Math.min(itemData.foreignStock, travelCapacity) : 'N/A';
            const canCarry = Math.min(itemData.foreignStock, travelCapacity);

            return {
                id: itemId,
                name: itemDetails.name,
                image: itemDetails.image,
                description: itemDetails.description,
                foreignPrice: itemData.foreignPrice,
                foreignStock: itemData.foreignStock,
                tornCityPrice: tornCityPrice,
                profitPerItem: profitPerItem,
                totalPotentialProfit: totalPotentialProfit,
                canCarry: canCarry,
                category: itemData.category || 'Unknown'
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


    // --- Event Listeners (ensure these are also within the DOMContentLoaded block) ---

    // Event listener for the "Fetch Travel Data" button
    fetchDataBtn.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            errorDisplay.textContent = 'Please enter your Torn API Key.';
            return;
        }

        errorDisplay.textContent = '';
        loadingIndicator.textContent = 'Fetching essential data...';
        loadingIndicator.style.display = 'block';

        await fetchAllTornItems(apiKey);
        await fetchAndPopulateDestinations();

        if (destinationSelect.value) {
            const selectedCountryId = destinationSelect.value;
            selectedCountryNameSpan.textContent = destinationSelect.options[destinationSelect.selectedIndex].textContent;
            await displayItemsForCountry(selectedCountryId, apiKey);
        } else {
            selectedCountryNameSpan.textContent = 'Selected Country';
            itemListDiv.innerHTML = '<p>Select a destination and click "Fetch Travel Data" to see items.</p>';
        }
        loadingIndicator.style.display = 'none';
    });

    // Event listener to the destination select dropdown
    destinationSelect.addEventListener('change', async () => {
        const selectedCountryId = destinationSelect.value;
        const apiKey = apiKeyInput.value.trim();

        if (!apiKey) {
            errorDisplay.textContent = 'Please enter your Torn API Key before selecting a country.';
            destinationSelect.value = "";
            return;
        }

        if (selectedCountryId) {
            selectedCountryNameSpan.textContent = destinationSelect.options[destinationSelect.selectedIndex].textContent;
            await displayItemsForCountry(selectedCountryId, apiKey);
        } else {
            selectedCountryNameSpan.textContent = 'Selected Country';
            itemListDiv.innerHTML = '<p>Select a destination and click "Fetch Travel Data" to see items.</p>';
        }
    });

    // Event listener to the category filter dropdown
    categoryFilterSelect.addEventListener('change', async () => {
        const selectedCountryId = destinationSelect.value;
        const apiKey = apiKeyInput.value.trim();

        if (selectedCountryId && apiKey) {
            await displayItemsForCountry(selectedCountryId, apiKey);
        } else if (!apiKey) {
            errorDisplay.textContent = 'Please enter your Torn API Key to filter items.';
            categoryFilterSelect.value = "all";
        }
    });

    // You can uncomment this line if you want destinations to be populated automatically on page load
    // If uncommenting, ensure the API key input is pre-filled or handled appropriately on load
    // fetchAndPopulateDestinations();
}); // End of DOMContentLoaded