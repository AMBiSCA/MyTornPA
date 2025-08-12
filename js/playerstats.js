document.addEventListener('DOMContentLoaded', () => {

    const playerIdInput = document.getElementById('playerId');
    const checkStatsBtn = document.getElementById('checkStatsBtn');
    const statsResultsContainer = document.getElementById('stats-results-container');
    const statsTableBody = document.getElementById('stats-table-body');
    const playerNameDisplay = document.getElementById('playerNameDisplay');
    const statsApiKeyErrorDiv = document.getElementById('statsApiKeyError');

    let tornApiKey = null;

    if (checkStatsBtn) checkStatsBtn.disabled = true;

    if (typeof auth !== 'undefined' && typeof db !== 'undefined') {
        auth.onAuthStateChanged(async function(user) {
            if (user) {
                try {
                    const userDoc = await db.collection('userProfiles').doc(user.uid).get();
                    if (userDoc.exists) {
                        tornApiKey = userDoc.data().tornApiKey;
                        if (tornApiKey) {
                            if (statsApiKeyErrorDiv) statsApiKeyErrorDiv.textContent = '';
                            if (checkStatsBtn) checkStatsBtn.disabled = false;
                        } else {
                            if (statsApiKeyErrorDiv) statsApiKeyErrorDiv.textContent = 'Please set your Torn API Key in your profile settings.';
                            if (checkStatsBtn) checkStatsBtn.disabled = true;
                        }
                    } else {
                        if (statsApiKeyErrorDiv) statsApiKeyErrorDiv.textContent = 'User profile not found.';
                        if (checkStatsBtn) checkStatsBtn.disabled = true;
                    }
                } catch (error) {
                    console.error("Error fetching API Key:", error);
                    if (statsApiKeyErrorDiv) statsApiKeyErrorDiv.textContent = `Error: ${error.message}`;
                    if (checkStatsBtn) checkStatsBtn.disabled = true;
                }
            } else {
                if (statsApiKeyErrorDiv) statsApiKeyErrorDiv.textContent = 'Please sign in to use this feature.';
                if (checkStatsBtn) checkStatsBtn.disabled = true;
            }
        });
    }

    if (checkStatsBtn) {
        checkStatsBtn.addEventListener('click', () => {
            const playerId = playerIdInput.value.trim();
            if (playerId && tornApiKey) {
                fetchPlayerStats(playerId, tornApiKey);
            } else if (!playerId) {
                if (statsApiKeyErrorDiv) statsApiKeyErrorDiv.textContent = 'Please enter a Player ID.';
            } else if (!tornApiKey) {
                if (statsApiKeyErrorDiv) statsApiKeyErrorDiv.textContent = 'API key is missing. Please check your profile.';
            }
        });
    }

    async function fetchPlayerStats(playerId, apiKey) {
        try {
            statsResultsContainer.style.display = 'none';
            statsTableBody.innerHTML = '<tr><td colspan="2">Fetching player stats...</td></tr>';

            const playerStatsUrl = `https://api.torn.com/v2/user/${playerId}?selections=personalstats&key=${apiKey}`;
            const response = await fetch(playerStatsUrl);
            const data = await response.json();

            if (data.error) {
                statsTableBody.innerHTML = `<tr><td colspan="2" class="error-message">Error: ${data.error.error}</td></tr>`;
                statsResultsContainer.style.display = 'block';
                return;
            }

            playerNameDisplay.textContent = `${data.basic.name} [${playerId}]`;
            
            const stats = data.personalstats;
            const statsArray = Object.entries(stats).map(([key, value]) => ({ stat: key, value: value }));

            statsTableBody.innerHTML = '';
            statsArray.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.stat}</td>
                    <td>${item.value}</td>
                `;
                statsTableBody.appendChild(row);
            });
            statsResultsContainer.style.display = 'block';

        } catch (error) {
            console.error('Error fetching stats:', error);
            statsTableBody.innerHTML = `<tr><td colspan="2" class="error-message">Failed to load stats. Please try again.</td></tr>`;
            statsResultsContainer.style.display = 'block';
        }
    }
});