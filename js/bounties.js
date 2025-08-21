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
                        bountyApiKeyErrorDiv.textContent = 'User profile not found.';
                    }
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                    bountyApiKeyErrorDiv.textContent = 'Error fetching user profile.';
                }
            } else {
                // User is signed out
                if (bountyApiKeyErrorDiv) bountyApiKeyErrorDiv.textContent = 'Please sign in to use this feature.';
                if (applyFiltersBtn) applyFiltersBtn.disabled = true;
                bountyTableBody.innerHTML = '<tr><td colspan="6">Please sign in to view bounties.</td></tr>';
            }
        });
    } else {
        bountyApiKeyErrorDiv.textContent = 'Firebase is not initialized correctly.';
    }

    async function fetchBounties(apiKey) {
        try {
            bountyTableBody.innerHTML = '<tr><td colspan="6">Fetching bounties from Torn...</td></tr>';
            
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

            // Get a unique list of bounties (one per target)
            const uniqueBounties = [];
            const processedTargetIds = new Set();
            for (const bounty of bounties) {
                if (!processedTargetIds.has(bounty.target_id)) {
                    uniqueBounties.push(bounty);
                    processedTargetIds.add(bounty.target_id);
                }
            }

            const limitedBounties = uniqueBounties.slice(0, 50);
            
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
            totalBountiesSpan.textContent = uniqueBounties.length;

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
            
            const reasonText = bounty.reason || 'None';
            const status = bounty.status || {};
            const statusText = status.description || 'Loading...';

            let statusClass = '';
            
            switch (status.state) {
                case 'Hospital':
                    statusClass = 'status-red';
                    break;
                case 'Jail':
                    statusClass = 'status-orange';
                    break;
                case 'Traveling':
                case 'Abroad':
                    statusClass = 'status-blue';
                    break;
                case 'Okay':
                    statusClass = 'status-green';
                    break;
            }

            row.innerHTML = `
                <td><a href="https://www.torn.com/profiles.php?XID=${bounty.target_id}" target="_blank" class="bounty-link">${bounty.target_name} [${bounty.target_id}]</a></td>
                <td>${bounty.target_level}</td>
                <td>$${bounty.reward.toLocaleString('en-US')}</td>
                <td>${reasonText}</td>
                <td class="${statusClass}" data-until="${status.until || 0}" data-state="${status.state || ''}">
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

        // Filtering logic
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
        
        // Sorting logic
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

// Global variables to hold the two different blocker message elements
let unavailableBlocker = null;
let rotateBlocker = null;

/**
 * Creates the two different overlay messages and adds them to the page.
 * This function only runs once.
 */
/**
 * Creates the two different overlay messages and adds them to the page.
 * This function only runs once.
 */
function createRequiredOverlays() {
    // Return if overlays have already been created
    if (document.getElementById('unavailable-blocker')) return;

    // --- Create the "Feature Unavailable" Blocker ---
    unavailableBlocker = document.createElement('div');
    unavailableBlocker.id = 'unavailable-blocker';
    unavailableBlocker.innerHTML = `
        <div>
            <h2>Feature Unavailable on Mobile</h2>
            <p>For the best experience, this tool is designed for full-size tablets and desktop computers.</p>
            <a href="home.html" class="blocker-btn">Go to Homepage</a>
        </div>
    `;
    document.body.appendChild(unavailableBlocker);

    // --- Create the "Please Rotate" Blocker ---
    rotateBlocker = document.createElement('div');
    rotateBlocker.id = 'rotate-blocker';
    rotateBlocker.innerHTML = `
        <div>
            <h2>Please Rotate Your Device</h2>
            <p>This page is best viewed in landscape mode.</p>
        </div>
    `;
    document.body.appendChild(rotateBlocker);

    // --- Add CSS styles for both blockers ---
    const style = document.createElement('style');
    style.textContent = `
        #unavailable-blocker, #rotate-blocker {
            display: none; /* Hidden by default */
            flex-direction: column;
            justify-content: center; /* Vertical Center */
            align-items: center;     /* Horizontal Center */
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background-color: #222;
            color: #eee;
            text-align: center;
            z-index: 99999;
            padding: 20px;
            box-sizing: border-box; /* Ensures padding doesn't affect dimensions */
        }
        /* Target the content inside the blocker for precise centering */
        #unavailable-blocker > div, #rotate-blocker > div {
            max-width: 95%;
        }
        #unavailable-blocker h2, #rotate-blocker h2 {
            margin-top: 0;
            margin-bottom: 10px;
        }
        /* --- THIS IS THE NEW RULE TO ENSURE THE HEADING IS BLUE --- */
        #unavailable-blocker h2 {
            color: #00a8ff;
        }
        #unavailable-blocker p, #rotate-blocker p {
            margin-top: 0;
            margin-bottom: 25px; /* Added more space before button */
            font-size: 0.8em;
            max-width: 90%;
            margin-left: auto; /* Helps ensure centering */
            margin-right: auto; /* Helps ensure centering */
        }
        .blocker-btn {
            display: inline-block;
            padding: 12px 25px;
            background-color: #00a8ff;
            color: #1a1a1a;
            font-weight: bold;
            text-decoration: none;
            border-radius: 5px;
            transition: background-color 0.2s ease;
        }
        .blocker-btn:hover {
            background-color: #4dc4ff;
        }
    `;
    document.head.appendChild(style);
}

function manageDeviceOverlay() {
    // Make sure the overlay elements exist
    createRequiredOverlays();

    // Hide both blockers to reset the state
    unavailableBlocker.style.display = 'none';
    rotateBlocker.style.display = 'none';

    // --- Define Device Sizes (based on the shortest side of the screen) ---
    const shortestSide = Math.min(window.screen.width, window.screen.height);
    const isPhoneOrSmallTablet = shortestSide < 768; // Covers phones and small tablets like iPad Mini
    const isBigTablet = shortestSide >= 768;      // Covers larger tablets like iPad Air/Pro

    // Get current orientation
    const isPortrait = window.innerHeight > window.innerWidth;

    // --- Apply the Logic ---
    if (isPhoneOrSmallTablet) {
        // For phones and small tablets, ALWAYS show the "unavailable" message
        unavailableBlocker.style.display = 'flex';
    } else if (isBigTablet) {
        // For big tablets, ONLY show the "rotate" message if they are in portrait mode
        if (isPortrait) {
            rotateBlocker.style.display = 'flex';
        }
        // If they are in landscape, nothing is shown and the page is usable.
    }
}

// --- Event Listeners to run the logic ---
document.addEventListener('DOMContentLoaded', manageDeviceOverlay);
window.addEventListener('resize', manageDeviceOverlay);
window.addEventListener('orientationchange', manageDeviceOverlay);