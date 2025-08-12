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
    let timerInterval = null; // To hold our timer

    // Function to update all active timers every second
    function updateTimers() {
        const now = Math.floor(Date.now() / 1000);
        document.querySelectorAll('[data-until]').forEach(cell => {
            const until = parseInt(cell.dataset.until, 10);
            if (isNaN(until) || until === 0) {
                // If there's no 'until' time, we don't need to process it.
                // We also remove the attribute to prevent re-checking.
                if (cell.hasAttribute('data-until')) {
                    cell.removeAttribute('data-until');
                }
                return;
            }

            if (now >= until) {
                cell.textContent = 'Okay';
                cell.removeAttribute('data-until'); // Stop updating
                return;
            }

            const remaining = until - now;
            const hours = Math.floor(remaining / 3600);
            const minutes = Math.floor((remaining % 3600) / 60);
            const seconds = remaining % 60;

            let timeString = '';
            if (hours > 0) {
                timeString += `${hours}h `;
            }
            if (minutes > 0 || hours > 0) {
                timeString += `${minutes.toString().padStart(2, '0')}m `;
            }
            timeString += `${seconds.toString().padStart(2, '0')}s`;

            const state = cell.dataset.state;
            cell.textContent = `${state} for ${timeString}`;
        });
    }

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
                            bountyTableBody.innerHTML = `<tr><td colspan="6" class="error-message">${message}</td></tr>`;
                        }
                    } else {
                        // ... (error handling as before)
                    }
                } catch (error) {
                    // ... (error handling as before)
                }
            } else {
                // User is signed out
                if (bountyApiKeyErrorDiv) bountyApiKeyErrorDiv.textContent = 'Please sign in to use this feature.';
                if (applyFiltersBtn) applyFiltersBtn.disabled = true;
                bountyTableBody.innerHTML = '<tr><td colspan="6">Please sign in to view bounties.</td></tr>';
            }
        });
    } else {
        // ... (error handling as before)
    }

   async function fetchBounties(apiKey) {
    try {
        bountyTableBody.innerHTML = '<tr><td colspan="6">Fetching bounties from Torn...</td></tr>';
        
        // FINAL CORRECTION: Restored the exact /v2/ URL.
        const bountiesUrl = `https://api.torn.com/v2/torn/bounties?key=${apiKey}`;
        
        const bountiesResponse = await fetch(bountiesUrl);
        const bountiesData = await bountiesResponse.json();
        
        if (bountiesData.error) {
            bountyTableBody.innerHTML = `<tr><td colspan="6" class="error-message">Error fetching data: ${bountiesData.error.error}</td></tr>`;
            return;
        }
        
        let bounties = [];
        if (bountiesData.bounties) {
            bounties = Object.values(bountiesData.bounties);
        }

        const limitedBounties = bounties.slice(0, 50);

        const bountyPromises = limitedBounties.map(async (bounty) => {
            const userUrl = `https://api.torn.com/user/${bounty.target_id}?selections=basic&key=${apiKey}`;
            try {
                const userResponse = await fetch(userUrl);
                const userData = await userResponse.json();
                if (userData.error) {
                    return { ...bounty, status: { description: 'Error' } };
                }
                return { ...bounty, status: userData.status };
            } catch {
                return { ...bounty, status: { description: 'Fetch Failed' } };
            }
        });
        
        const enrichedBounties = await Promise.all(bountyPromises);
        
        allBounties = enrichedBounties;
        totalBountiesSpan.textContent = allBounties.length;

    } catch (error) {
        console.error('Error fetching bounties:', error);
        bountyTableBody.innerHTML = `<tr><td colspan="6" class="error-message">Failed to load bounties. Please try again later.</td></tr>`;
    }
}
    function displayBounties(bountiesToShow) {
        bountyTableBody.innerHTML = '';
        currentBountiesSpan.textContent = bountiesToShow.length;

        if (timerInterval) {
            clearInterval(timerInterval);
        }

        if (bountiesToShow.length === 0) {
            bountyTableBody.innerHTML = '<tr><td colspan="6">No bounties match your criteria.</td></tr>';
            return;
        }

        bountiesToShow.forEach(bounty => {
            const row = document.createElement('tr');
            
            const reasonText = bounty.reason || ''; 
            const status = bounty.status || {};
            const statusText = status.description || 'Loading...';

            row.innerHTML = `
                <td><a href="https://www.torn.com/profiles.php?XID=${bounty.target_id}" target="_blank" class="bounty-link">${bounty.target_name} [${bounty.target_id}]</a></td>
                <td>${bounty.target_level}</td>
                <td>$${bounty.reward.toLocaleString('en-US')}</td>
                <td>${reasonText}</td>
                <td data-until="${status.until || 0}" data-state="${status.state || ''}">
                    ${statusText}
                </td>
                <td><a href="https://www.torn.com/profiles.php?XID=${bounty.target_id}" target="_blank" class="fetch-btn action-btn">Attack</a></td>
            `;
            bountyTableBody.appendChild(row);
        });

        timerInterval = setInterval(updateTimers, 1000);
    }

    function applyFiltersAndSort() {
        if (!allBounties || allBounties.length === 0) {
            bountyTableBody.innerHTML = '<tr><td colspan="6">No bounties match your criteria.</td></tr>';
            currentBountiesSpan.textContent = 0;
            return;
        }

        let filteredBounties = [...allBounties];

        // Filtering logic (as before)
        const minLevel = parseInt(minLevelInput.value, 10);
        const maxLevel = parseInt(maxLevelInput.value, 10);
        if (!isNaN(minLevel) && !isNaN(maxLevel)) {
            filteredBounties = filteredBounties.filter(bounty => 
                bounty.target_level >= minLevel && bounty.target_level <= maxLevel
            );
        }

        const minBounty = parseInt(minBountyInput.value, 10);
        if (!isNaN(minBounty)) {
            filteredBounties = filteredBounties.filter(bounty => 
                bounty.reward >= minBounty
            );
        }
        
        // Sorting logic (as before)
        const sortBy = sortBySelect.value;
        filteredBounties.sort((a, b) => {
            if (sortBy === 'amount-desc') return b.reward - a.reward;
            if (sortBy === 'amount-asc') return a.reward - b.reward;
            if (sortBy === 'level-desc') return b.target_level - a.target_level;
            if (sortBy === 'level-asc') return a.target_level - b.target_level;
            return 0;
        });

        displayBounties(filteredBounties);
    }
});