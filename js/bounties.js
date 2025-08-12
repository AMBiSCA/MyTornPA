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
    let tornApiKey = null;

    // Initial state: disable button and show loading message
    if (applyFiltersBtn) applyFiltersBtn.disabled = true;
    bountyTableBody.innerHTML = '<tr><td colspan="5">Please sign in to view bounties.</td></tr>';

    // Firebase Auth state listener
    if (typeof auth !== 'undefined' && typeof db !== 'undefined') {
        auth.onAuthStateChanged(async function(user) {
            if (user) {
                try {
                    const userDocRef = db.collection('userProfiles').doc(user.uid);
                    const userDoc = await userDocRef.get();

                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        tornApiKey = userData.tornApiKey;

                        if (tornApiKey) {
                            if (bountyApiKeyErrorDiv) bountyApiKeyErrorDiv.textContent = '';
                            if (applyFiltersBtn) {
                                applyFiltersBtn.disabled = false;
                            }
                            await fetchBounties(tornApiKey);
                            applyFiltersAndSort();
                            applyFiltersBtn.addEventListener('click', applyFiltersAndSort);

                        } else {
                            const message = 'Your Torn API Key is not set in your profile.';
                            if (bountyApiKeyErrorDiv) bountyApiKeyErrorDiv.textContent = message;
                            if (applyFiltersBtn) applyFiltersBtn.disabled = true;
                            bountyTableBody.innerHTML = `<tr><td colspan="5" class="error-message">${message}</td></tr>`;
                        }
                    } else {
                        const message = 'User profile not found in database.';
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

    // Function to fetch data directly from the Torn API
    async function fetchBounties(apiKey) {
        try {
            bountyTableBody.innerHTML = '<tr><td colspan="5">Fetching bounties from Torn...</td></tr>';
            
            const bountiesUrl = `https://api.torn.com/v2/torn/bounties?key=${apiKey}`;
            const bountiesResponse = await fetch(bountiesUrl);
            const bountiesData = await bountiesResponse.json();
            
            if (bountiesData.error) {
                bountyTableBody.innerHTML = `<tr><td colspan="5" class="error-message">Error fetching data: ${bountiesData.error.error}</td></tr>`;
                return;
            }
            
            let bounties = [];
            if (bountiesData.bounties) {
                if (Array.isArray(bountiesData.bounties)) {
                    bounties = bountiesData.bounties;
                } else if (typeof bountiesData.bounties === 'object') {
                    bounties = Object.values(bountiesData.bounties);
                }
            }

            const bountyPromises = bounties.map(async (bounty) => {
                const userUrl = `https://api.torn.com/v2/user/${bounty.target_id}?selections=basic&key=${apiKey}`;
                const userResponse = await fetch(userUrl);
                const userData = await userResponse.json();
                
                if (userData.error) {
                    return { ...bounty, target_name: 'Error', target_level: 0, error: userData.error.error };
                }
                
                return {
                    ...bounty,
                    target_name: userData.basic.name,
                    target_level: userData.basic.level,
                };
            });
            
            const enrichedBounties = await Promise.all(bountyPromises);
            allBounties = enrichedBounties.filter(bounty => !bounty.error);
            totalBountiesSpan.textContent = allBounties.length;

        } catch (error) {
            console.error('Error fetching bounties:', error);
            bountyTableBody.innerHTML = `<tr><td colspan="5" class="error-message">Failed to load bounties. Please try again later.</td></tr>`;
        }
    }

    // Function to apply filters and sort
    function applyFiltersAndSort() {
        if (!allBounties || allBounties.length === 0) {
            bountyTableBody.innerHTML = '<tr><td colspan="5">No bounties match your criteria.</td></tr>';
            currentBountiesSpan.textContent = 0;
            return;
        }

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
                bounty.reward >= minBounty
            );
        }
        
        // 3. Sort the results
        const sortBy = sortBySelect.value;
        filteredBounties.sort((a, b) => {
            if (sortBy === 'amount-desc') return b.reward - a.reward;
            if (sortBy === 'amount-asc') return a.reward - b.reward;
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
                <td><a href="https://www.torn.com/profiles.php?XID=${bounty.target_id}" target="_blank" class="bounty-link">${bounty.target_name} [${bounty.target_id}]</a></td>
                <td>${bounty.target_level}</td>
                <td>$${bounty.reward.toLocaleString('en-US')}</td>
                <td>${bounty.reason}</td>
                <td><a href="https://www.torn.com/profiles.php?XID=${bounty.target_id}" target="_blank" class="fetch-btn action-btn">Attack</a></td>
            `;
            bountyTableBody.appendChild(row);
        });
    }
});