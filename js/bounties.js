// mysite/js/bounties.js

document.addEventListener('DOMContentLoaded', () => {

    // DOM Elements for the bounty page
    const sortBySelect = document.getElementById('sort-by');
    const minLevelInput = document.getElementById('min-level');
    const maxLevelInput = document.getElementById('max-level');
    const minBountyInput = document.getElementById('min-bounty');
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const bountyTableBody = document.getElementById('bounty-table-body');
    const currentBountiesSpan = document.getElementById('current-bounties');
    const totalBountiesSpan = document.getElementById('total-bounties');
    const bountyApiKeyErrorDiv = document.getElementById('bountyApiKeyError');

    let allBounties = []; // To store all fetched bounty data

    // Initial state: disable button and show loading message
    if (applyFiltersBtn) applyFiltersBtn.disabled = true;
    bountyTableBody.innerHTML = '<tr><td colspan="5">Please sign in to view bounties.</td></tr>';

    // Firebase Auth state listener
    if (typeof auth !== 'undefined' && typeof db !== 'undefined') {
        auth.onAuthStateChanged(async function(user) {
            if (user) {
                console.log("User is signed in on bounties.js:", user.uid);
                try {
                    const userDocRef = db.collection('userProfiles').doc(user.uid);
                    const userDoc = await userDocRef.get();

                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        const tornApiKey = userData.tornApiKey;

                        console.log("DEBUG BOUNTIES: Torn API Key retrieved from Firestore.");

                        if (tornApiKey) {
                            if (bountyApiKeyErrorDiv) bountyApiKeyErrorDiv.textContent = '';
                            if (applyFiltersBtn) {
                                applyFiltersBtn.disabled = false;
                                applyFiltersBtn.onclick = () => applyFiltersAndSort();
                            }
                            // Automatically fetch bounties once the key is available
                            fetchBounties(tornApiKey);
                        } else {
                            const message = 'Your Torn API Key is not set in your profile. Please update your profile settings with a valid key.';
                            if (bountyApiKeyErrorDiv) bountyApiKeyErrorDiv.textContent = message;
                            if (applyFiltersBtn) applyFiltersBtn.disabled = true;
                            bountyTableBody.innerHTML = `<tr><td colspan="5" class="error-message">${message}</td></tr>`;
                        }
                    } else {
                        const message = 'User profile not found in database. Please ensure your profile is set up.';
                        if (bountyApiKeyErrorDiv) bountyApiKeyErrorDiv.textContent = message;
                        if (applyFiltersBtn) applyFiltersBtn.disabled = true;
                        bountyTableBody.innerHTML = `<tr><td colspan="5" class="error-message">${message}</td></tr>`;
                    }
                } catch (error) {
                    console.error("Error fetching Torn API Key from profile on bounties.js:", error);
                    const message = `Error fetching API Key: ${error.message}. Please try again.`;
                    if (bountyApiKeyErrorDiv) bountyApiKeyErrorDiv.textContent = message;
                    if (applyFiltersBtn) applyFiltersBtn.disabled = true;
                    bountyTableBody.innerHTML = `<tr><td colspan="5" class="error-message">${message}</td></tr>`;
                }
            } else {
                // User is signed out
                console.log("No user is signed in on bounties.js.");
                if (bountyApiKeyErrorDiv) bountyApiKeyErrorDiv.textContent = 'Please sign in to use this feature.';
                if (applyFiltersBtn) applyFiltersBtn.disabled = true;
                bountyTableBody.innerHTML = '<tr><td colspan="5">Please sign in to view bounties.</td></tr>';
            }
        });
    } else {
        console.error("Firebase auth or Firestore not available for bounties.js script.");
        const message = 'Firebase is not loaded. Cannot check login status.';
        if (bountyApiKeyErrorDiv) bountyApiKeyErrorDiv.textContent = message;
        bountyTableBody.innerHTML = `<tr><td colspan="5" class="error-message">${message}</td></tr>`;
    }

    // Function to fetch data from the server-side endpoint
    // This is the secure approach, using a server function to call the Torn API
    async function fetchBounties(tornApiKey) {
        try {
            bountyTableBody.innerHTML = '<tr><td colspan="5">Fetching bounties from Torn...</td></tr>';
            
            // Your server-side function endpoint that handles the API call
            // This function takes the API key and returns processed bounty data
            const functionUrl = `/.netlify/functions/get-bounties`; 
            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apiKey: tornApiKey })
            });

            const data = await response.json();
            
            if (!response.ok || data.error) {
                const errorMessage = data.error || `Netlify Function Error: ${response.status}`;
                bountyTableBody.innerHTML = `<tr><td colspan="5" class="error-message">Error fetching data: ${errorMessage}</td></tr>`;
                return;
            }

            allBounties = data.bounties;
            totalBountiesSpan.textContent = allBounties.length;
            displayBounties(allBounties);

        } catch (error) {
            console.error('Error fetching bounties:', error);
            bountyTableBody.innerHTML = `<tr><td colspan="5" class="error-message">Failed to load bounties. Please try again later.</td></tr>`;
        }
    }

    // Function to apply filters and sorting
    function applyFiltersAndSort() {
        let filteredBounties = [...allBounties];

        // 1. Filter by Level Range
        const minLevel = parseInt(minLevelInput.value, 10);
        const maxLevel = parseInt(maxLevelInput.value, 10);
        if (minLevel >= 1 && maxLevel <= 100) {
            filteredBounties = filteredBounties.filter(bounty => 
                bounty.target_level >= minLevel && bounty.target_level <= maxLevel
            );
        }

        // 2. Filter by Minimum Bounty Amount
        const minBounty = parseInt(minBountyInput.value, 10);
        if (minBounty >= 1000) {
            filteredBounties = filteredBounties.filter(bounty => 
                bounty.amount >= minBounty
            );
        }
        
        // 3. Sort the results
        const sortBy = sortBySelect.value;
        filteredBounties.sort((a, b) => {
            if (sortBy === 'amount-desc') return b.amount - a.amount;
            if (sortBy === 'amount-asc') return a.amount - b.amount;
            if (sortBy === 'level-desc') return b.target_level - a.target_level;
            if (sortBy === 'level-asc') return a.target_level - b.target_level;
        });

        displayBounties(filteredBounties);
    }

    // Function to display bounties in the table
    function displayBounties(bountiesToShow) {
        bountyTableBody.innerHTML = ''; // Clear existing rows
        currentBountiesSpan.textContent = bountiesToShow.length;

        if (bountiesToShow.length === 0) {
            bountyTableBody.innerHTML = '<tr><td colspan="5">No bounties match your criteria.</td></tr>';
            return;
        }

        bountiesToShow.forEach(bounty => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><a href="https://www.torn.com/profiles.php?XID=${bounty.target_player_id}" target="_blank" class="bounty-link">${bounty.target_name} [${bounty.target_player_id}]</a></td>
                <td>${bounty.target_level}</td>
                <td>$${bounty.amount.toLocaleString('en-US')}</td>
                <td>${bounty.reason}</td>
                <td><a href="https://www.torn.com/profiles.php?XID=${bounty.target_player_id}" target="_blank" class="fetch-btn action-btn">Attack</a></td>
            `;
            bountyTableBody.appendChild(row);
        });
    }
});