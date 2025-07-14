document.addEventListener('DOMContentLoaded', function() {
    // --- Common Header/Footer UI script (depends on 'auth' from firebase-init.js) ---
    const usefulLinksBtn = document.getElementById('usefulLinksBtn');
    const usefulLinksDropdown = document.getElementById('usefulLinksDropdown');

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

    const headerButtonsContainer = document.getElementById('headerButtonsContainer');
    const signUpButtonHeader = document.getElementById('signUpButtonHeader');
    const homeButtonFooter = document.getElementById('homeButtonFooter'); 
    const logoutButtonHeader = document.getElementById('logoutButtonHeader');

    if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
    if (signUpButtonHeader) signUpButtonHeader.style.display = 'none';
    if (homeButtonFooter) homeButtonFooter.style.display = 'none';

    // Check if 'auth' was successfully initialized by firebase-init.js
    if (typeof auth !== 'undefined' && auth) { 
        auth.onAuthStateChanged(function(user) {
            const currentPagePath = window.location.pathname;
            let pageName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase();
            if (pageName === "" && currentPagePath.length > 1) { // Handles cases like /pages/ or /pages/travel/
                 const pathParts = currentPagePath.substring(0, currentPagePath.length -1).split('/');
                 pageName = pathParts[pathParts.length -1].toLowerCase();
            }
            
            // Define which pages are considered "index" or "login" pages where a logged-in user might be redirected away from,
            // or where the "Sign Up" button might be hidden.
            const nonAuthEntryPages = ['index.html', 'ranked.html', 'login.html']; // Add your actual login/index page names here
            let isThisNonAuthEntryPage = nonAuthEntryPages.includes(pageName) || (pageName === "" && currentPagePath === "/");


            if (user) { // User is signed in
                if (isThisNonAuthEntryPage) { // If on an index/login page AND logged in
                    window.location.href = 'home.html'; // Redirect to home.html
                    return; // Stop further UI changes on this page as we are redirecting
                }
                // For other pages when logged in:
                if (headerButtonsContainer) headerButtonsContainer.style.display = 'flex';
                if (signUpButtonHeader) signUpButtonHeader.style.display = 'none';
                if (homeButtonFooter) homeButtonFooter.style.display = 'inline';
                if (logoutButtonHeader) logoutButtonHeader.style.display = 'inline-flex'; 

            } else { // No user signed in
                if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
                if (signUpButtonHeader) {
                    // Show Sign Up button only if NOT on an index/login page
                    signUpButtonHeader.style.display = isThisNonAuthEntryPage ? 'none' : 'inline-flex';
                }
                if (homeButtonFooter) homeButtonFooter.style.display = 'none';
                if (logoutButtonHeader) logoutButtonHeader.style.display = 'none'; // Hide logout when not logged in
                
                // If the user is NOT logged in, and they are trying to access a page that IS NOT an allowed non-auth page,
                // then redirect them to the login page.
                const allowedNonAuthPagesIncludingThis = [...nonAuthEntryPages, 'travel.html', 'terms.html', 'faq.html', 'about.html', 'report.html']; // Add all public pages
                if (!allowedNonAuthPagesIncludingThis.includes(pageName) && !(pageName === "" && currentPagePath === "/")) {
                    // window.location.href = 'ranked.html'; // Or your primary login page
                }
            }
        });

        if (logoutButtonHeader) {
            logoutButtonHeader.onclick = function() { 
                auth.signOut().then(() => {
                    console.log('User signed out');
                    // After logout, onAuthStateChanged will fire and handle UI.
                    // You might want to explicitly redirect to login page if not handled by onAuthStateChanged logic for the current page.
                    const currentPagePath = window.location.pathname;
                    let pageName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase();
                     if (pageName === "" && currentPagePath.length > 1) {
                        const pathParts = currentPagePath.substring(0, currentPagePath.length -1).split('/');
                        pageName = pathParts[pathParts.length -1].toLowerCase();
                    }
                    const nonAuthEntryPages = ['index.html', 'ranked.html', 'login.html'];
                    if (!nonAuthEntryPages.includes(pageName) && !(pageName === "" && currentPagePath === "/")) {
                         window.location.href = 'ranked.html'; // Or your primary login page
                    }
                }).catch((error) => {
                    console.error('Sign out error', error);
                });
            };
        }

    } else {
        console.warn("Firebase auth object (from firebase-init.js) is not available. UI for auth state will not update fully.");
        // Fallback UI if auth is completely unavailable
        if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
        if (signUpButtonHeader) {
            const currentPagePath = window.location.pathname;
            let pageName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase();
            if (pageName === "" && currentPagePath.length > 1) {
                 const pathParts = currentPagePath.substring(0, currentPagePath.length -1).split('/');
                 pageName = pathParts[pathParts.length -1].toLowerCase();
            }
            const nonAuthEntryPages = ['index.html', 'ranked.html', 'login.html'];
            signUpButtonHeader.style.display = (nonAuthEntryPages.includes(pageName) || (pageName === "" && currentPagePath === "/")) ? 'none' : 'inline-flex';
        }
        if (homeButtonFooter) homeButtonFooter.style.display = 'none';
        if (logoutButtonHeader) {
            logoutButtonHeader.style.display = 'none';
            logoutButtonHeader.onclick = function() { alert('Logout functionality (Firebase) not ready.'); };
        }
    }
    // Any Travel.html specific JavaScript actions would go below this line
    // For the provided HTML, there are no unique actions for this page.
});



// Function to fetch Torn City market price for a single item
async function fetchTornCityItemPrice(itemId, apiKey) {
    try {
        const response = await fetch(`https://api.torn.com/market/${itemId}?selections=itemmarket&key=${apiKey}`);
        const data = await response.json();

        if (data.error) {
            console.warn(`API Error fetching Torn City market for item ${itemId}: ${data.error.error}`);
            return null; // Return null if there's an error
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

// Function to fetch Torn City market price for a single item (Keep as is)
async function fetchTornCityItemPrice(itemId, apiKey) {
    try {
        const response = await fetch(`https://api.torn.com/market/${itemId}?selections=itemmarket&key=${apiKey}`);
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

// UPDATED: Function to display items for a selected country using YATA data
async function displayItemsForCountry(selectedCountryId, apiKey) {
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
        // Error message already set by fetchYATATravelData
        loadingIndicator.style.display = 'none';
        return;
    }

    const travelCapacity = parseInt(travelCapacityInput.value, 10);
    if (isNaN(travelCapacity) || travelCapacity <= 0) {
        errorDisplay.textContent = 'Please enter a valid positive number for your travel capacity.';
        loadingIndicator.style.display = 'none';
        return;
    }

    // YATA data structure: data -> countries -> country_id -> items -> item_id -> {cost, stock}
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
        // YATA export doesn't directly provide category, so we'll try to infer from allTornItems
        category: allTornItems[itemId] ? allTornItems[itemId].type : 'Unknown'
    }));

    // --- Apply Category Filter ---
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
            return null; // Skip if item details are missing
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

    // Sort by profit, highest first
    itemsToDisplay.sort((a, b) => {
        if (typeof a.profitPerItem !== 'number' && typeof b.profitPerItem !== 'number') return 0;
        if (typeof a.profitPerItem !== 'number') return 1; // 'N/A' to the bottom
        if (typeof b.profitPerItem !== 'number') return -1; // 'N/A' to the bottom
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

// Keep the updated fetchDataBtn listener (as provided in previous step)
// Make sure this listener is defined within your DOMContentLoaded block.
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

// Keep the updated destinationSelect listener (as provided in previous step)
// Make sure this listener is defined within your DOMContentLoaded block.
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

// Keep the new categoryFilterSelect listener (as provided in previous step)
// Make sure this listener is defined within your DOMContentLoaded block.
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

async function displayItemsForCountry(selectedCountryId, apiKey) {
    itemListDiv.innerHTML = ''; // Clear previous items
    loadingIndicator.textContent = 'Fetching item details and Torn City prices...';
    loadingIndicator.style.display = 'block';
    errorDisplay.textContent = '';

    if (Object.keys(allTornItems).length === 0) {
        errorDisplay.textContent = 'Item details not loaded. Please ensure your API key is valid and try again.';
        loadingIndicator.style.display = 'none';
        return;
    }

    const yataData = await fetchYATATravelData(); // Assumes fetchYATATravelData is defined and accessible
    if (!yataData) {
        // Error message already set by fetchYATATravelData
        loadingIndicator.style.display = 'none';
        return;
    }

    const travelCapacity = parseInt(travelCapacityInput.value, 10);
    if (isNaN(travelCapacity) || travelCapacity <= 0) {
        errorDisplay.textContent = 'Please enter a valid positive number for your travel capacity.';
        loadingIndicator.style.display = 'none';
        return;
    }

    // YATA data structure: data -> countries -> country_id -> items -> item_id -> {cost, stock}
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
        // YATA export doesn't directly provide category, so we'll infer from allTornItems
        category: allTornItems[itemId] ? allTornItems[itemId].type : 'Unknown'
    }));

    // Apply Category Filter
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
            return null; // Skip if item details are missing
        }

        const tornCityPrice = await fetchTornCityItemPrice(itemId, apiKey); // Assumes fetchTornCityItemPrice is defined and accessible
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

    // Sort by profit, highest first
    itemsToDisplay.sort((a, b) => {
        if (typeof a.profitPerItem !== 'number' && typeof b.profitPerItem !== 'number') return 0;
        if (typeof a.profitPerItem !== 'number') return 1; // 'N/A' to the bottom
        if (typeof b.profitPerItem !== 'number') return -1; // 'N/A' to the bottom
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


// Add an event listener to the destination select dropdown
destinationSelect.addEventListener('change', async () => {
    const selectedCountryId = destinationSelect.value;
    const apiKey = apiKeyInput.value.trim();

    if (!apiKey) {
        errorDisplay.textContent = 'Please enter your Torn API Key before selecting a country.';
        destinationSelect.value = ""; // Reset dropdown if no API key
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

document.addEventListener('DOMContentLoaded', function() {
    // ... your existing Firebase/UI related code here ...

    // --- Torn Travel Helper Script ---
    const apiKeyInput = document.getElementById('api-key');
    const destinationSelect = document.getElementById('destination-select');
    const fetchDataBtn = document.getElementById('fetch-data-btn');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorDisplay = document.getElementById('error-display');
    const selectedCountryNameSpan = document.getElementById('selected-country-name');
    const itemListDiv = document.getElementById('item-list');
    const travelCapacityInput = document.getElementById('travel-capacity');

    // Function to fetch and populate destinations
    async function fetchAndPopulateDestinations() {
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            errorDisplay.textContent = 'Please enter your Torn API Key.';
            return;
        }

        loadingIndicator.style.display = 'block';
        errorDisplay.textContent = ''; // Clear previous errors
        destinationSelect.innerHTML = '<option value="">Loading destinations...</option>'; // Reset dropdown

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
            destinationSelect.innerHTML = '<option value="">-- Select a country --</option>'; // Default option
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

    // Event listener for the "Fetch Travel Data" button
    fetchDataBtn.addEventListener('click', fetchAndPopulateDestinations);

    // Optional: Call this function on page load if you want destinations to be populated automatically
    // fetchAndPopulateDestinations();
});

// --- Torn Item Details Cache ---
let allTornItems = {}; // To store item details: item_id -> {name, image, description}

// Function to fetch all item details
async function fetchAllTornItems(apiKey) {
    if (Object.keys(allTornItems).length > 0) {
        // Items already fetched, no need to fetch again
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

// Modify the fetchDataBtn click handler to also fetch all items
fetchDataBtn.removeEventListener('click', fetchAndPopulateDestinations); // Remove old listener first
fetchDataBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
        errorDisplay.textContent = 'Please enter your Torn API Key.';
        return;
    }

    // Attempt to fetch all items (will use cache if already loaded)
    await fetchAllTornItems(apiKey);
    
    // Then proceed with populating destinations
    await fetchAndPopulateDestinations();

    // Now that both are potentially loaded, we can clear loading and proceed
    if (destinationSelect.value) { // If a destination is already selected after populating
        selectedCountryNameSpan.textContent = destinationSelect.options[destinationSelect.selectedIndex].textContent;
        // This is where you'd call a function to display items for the selected country
        // We'll build that function in the next step.
    } else {
        selectedCountryNameSpan.textContent = 'Selected Country'; // Reset to default
    }
});

// Optional: You might want to call fetchAllTornItems on initial page load if an API key
// is already stored or available, to preload the data.
// For now, it's tied to the 'Fetch Travel Data' button.