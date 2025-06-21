/* ==========================================================================
   War Page Hub JavaScript (war_page_hub.js) - v9 (Selective V2 URL Test)
   ========================================================================== */

// --- Global Variables ---
const db = firebase.firestore();
const auth = firebase.auth();
let userApiKey = null;
let factionApiFullData = null;
let currentTornUserName = 'Unknown';
let apiCallCounter = 0; // Counter for API call intervals
let globalEnemyFactionID = null; // Used to store the enemy ID for periodic fetches
let currentLiveChainSeconds = 0; // Stores the remaining chain timeout for local countdown
let lastChainApiFetchTime = 0; // Stores the timestamp of the last chain API fetch
let globalChainStartedTimestamp = 0; // Stores the actual chain start time from API
let globalChainCurrentNumber = 'N/A'; // Stores the actual chain number from API
let enemyDataGlobal = null; // Stores enemy faction data globally for access by other functions (e.g., Chain Score)
let globalRankedWarData = null;

// --- DOM Element Getters ---
const tabButtons = document.querySelectorAll('.tab-button');
const gamePlanDisplay = document.getElementById('gamePlanDisplay');
const warEnlistedStatus = document.getElementById('warEnlistedStatus');
const warTermedStatus = document.getElementById('warTermedStatus');
const warTermedWinLoss = document.getElementById('warTermedWinLoss');
const warChainingStatus = document.getElementById('warChainingStatus');
const warNoFlyingStatus = document.getElementById('warNoFlyingStatus');
const warTurtleStatus = document.getElementById('warTurtleStatus');
const warNextChainTimeStatus = document.getElementById('warNextChainTimeStatus');
const factionAnnouncementsDisplay = document.getElementById('factionAnnouncementsDisplay');
const factionWarHubTitleEl = document.getElementById('factionWarHubTitle');
const factionOneNameEl = document.getElementById('factionOneName');
const factionOneMembersEl = document.getElementById('factionOneMembers');
const factionTwoNameEl = document.getElementById('factionTwoName');
const factionTwoMembersEl = document.getElementById('factionTwoMembers');
const gamePlanEditArea = document.getElementById('gamePlanEditArea');
const saveGamePlanBtn = document.getElementById('saveGamePlanBtn');
const quickAnnouncementInput = document.getElementById('quickAnnouncementInput');
const postAnnouncementBtn = document.getElementById('postAnnouncementBtn');
const toggleEnlisted = document.getElementById('toggleEnlisted');
const toggleTermedWar = document.getElementById('toggleTermedWar');
const toggleTermedWinLoss = document.getElementById('toggleTermedWinLoss');
const toggleChaining = document.getElementById('toggleChaining');
const toggleNoFlying = document.getElementById('toggleNoFlying');
const toggleTurtleMode = document.getElementById('toggleTurtleMode');
const nextChainTimeInput = document.getElementById('nextChainTimeInput');
const enemyFactionIDInput = document.getElementById('enemyFactionIDInputLeaderConfig');
const saveWarStatusControlsBtn = document.getElementById('saveWarStatusControlsBtn');
const enemyTargetsContainer = document.getElementById('enemyTargetsContainer');
const designatedAdminsContainer = document.getElementById('designatedAdminsContainer');
const bigHitterWatchlistContainer = document.getElementById('bigHitterWatchlistContainer');
const energyTrackingContainer = document.getElementById('energyTrackingContainer');
const saveAdminsBtn = document.getElementById('saveAdminsBtn');
const saveEnergyTrackMembersBtn = document.getElementById('saveEnergyTrackMembersBtn');
const saveSelectionsBtnBH = document.getElementById('saveSelectionsBtnBH'); // Get Big Hitter Save button
const chainTimerDisplay = document.getElementById('chainTimerDisplay');
const currentChainNumberDisplay = document.getElementById('currentChainNumberDisplay');
const chainStartedDisplay = document.getElementById('chainStartedDisplay');
const yourFactionRankedScore = document.getElementById('yourFactionRankedScore');
const opponentFactionRankedScore = document.getElementById('opponentFactionRankedScore');
const warTargetScore = document.getElementById('warTargetScore');
const warStartedTime = document.getElementById('warStartedTime');
const yourFactionNameScoreLabel = document.getElementById('yourFactionNameScoreLabel');
const opponentFactionNameScoreLabel = document.getElementById('opponentFactionNameScoreLabel');

// --- Utility Functions ---

function showTab(tabId) {
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) selectedTab.classList.add('active');
    const selectedButton = document.querySelector(`.tab-button[data-tab="${tabId.replace('-tab', '')}"]`);
    if (selectedButton) selectedButton.classList.add('active');
}

function getFactionImageUrl(imageFileName) {
    return imageFileName ? `https://www.torn.com/factions.php?image=${imageFileName}` : '';
}

function countFactionMembers(membersObject) {
    if (!membersObject) return 0;
    return typeof membersObject.total === 'number' ? membersObject.total : Object.keys(membersObject).length;
}

// NEW/MODIFIED: Function to populate friendly faction member checkboxes (Admins, Energy Track)
function populateFriendlyMemberCheckboxes(members, savedAdmins = [], savedEnergyMembers = []) {
    if (!members || typeof members !== 'object') return;

    if (designatedAdminsContainer) designatedAdminsContainer.innerHTML = '';
    else { console.error("HTML Error: Cannot find element with ID 'designatedAdminsContainer'."); return; }

    if (energyTrackingContainer) energyTrackingContainer.innerHTML = '';
    else { console.error("HTML Error: Cannot find element with ID 'energyTrackingContainer'."); return; }

    const sortedMemberIds = Object.keys(members).sort((a, b) => {
        const nameA = members[a].name || '';
        const nameB = members[b].name || '';
        return nameA.localeCompare(nameB);
    });

    sortedMemberIds.forEach(memberId => {
        const member = members[memberId];
        const memberName = member.name || `Unknown (${memberId})`;

        // Create and append checkbox for Designate Admins
        const isAdminChecked = (savedAdmins && savedAdmins.includes(memberId)) ? 'checked' : '';
        const adminItemHtml = `<div class="member-selection-item"><input type="checkbox" id="admin-member-${memberId}" value="${memberId}" ${isAdminChecked}><label for="admin-member-${memberId}">${memberName}</label></div>`;
        designatedAdminsContainer.insertAdjacentHTML('beforeend', adminItemHtml);

        // Create and append checkbox for Energy Tracking Members
        const isEnergyChecked = (savedEnergyMembers && savedEnergyMembers.includes(memberId)) ? 'checked' : '';
        const energyItemHtml = `<div class="member-selection-item"><input type="checkbox" id="energy-member-${memberId}" value="${memberId}" ${isEnergyChecked}><label for="energy-member-${memberId}">${memberName}</label></div>`;
        energyTrackingContainer.insertAdjacentHTML('beforeend', energyItemHtml);
    });
}
// NEW: Helper function to format time remaining from seconds (Moved for proper scope)
function formatTime(seconds) {
    if (seconds <= 0) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    let result = '';
    if (h > 0) result += `${h}h `;
    if (m > 0) result += `${m}m `;
    if (s > 0) result += `${s}s`;
    return result.trim();
}

// NEW: Function to fetch and display chain data (Moved for proper scope)
async function fetchAndDisplayChainData(apiKey) {
    if (!apiKey) {
        console.warn("API key is not available. Cannot fetch chain data.");
        return;
    }

    try {
        const chainApiUrl = `https://api.torn.com/v2/faction/?selections=chain&key=${apiKey}&comment=MyTornPA_ChainData`;
        const response = await fetch(chainApiUrl);
        if (!response.ok) {
            throw new Error(`Server responded with an error: ${response.status} ${response.statusText}`);
        }
        const chainData = await response.json();
        console.log("Chain API Data (fetched):", chainData);

        if (chainData && chainData.chain) {
            // Store the relevant values globally for updateAllTimers to use
            currentLiveChainSeconds = chainData.chain.timeout || 0;
            lastChainApiFetchTime = Date.now(); // Store current time in milliseconds
            globalChainStartedTimestamp = chainData.chain.start || 0;
            globalChainCurrentNumber = chainData.chain.current || 'N/A'; // Store the actual chain number

            // Update current chain number display here (as it's directly from API)
            if (currentChainNumberDisplay) {
                currentChainNumberDisplay.textContent = globalChainCurrentNumber;
            }

            // Logic for Chain Started time display (no change from previous as requested)
            if (chainStartedDisplay) {
                const newChainStartedTimestamp = chainData.chain.start || 0;
                if (newChainStartedTimestamp > 0 && newChainStartedTimestamp !== globalChainStartedTimestamp) {
                    globalChainStartedTimestamp = newChainStartedTimestamp;
                    chainStartedDisplay.textContent = `Started: ${formatTornTime(globalChainStartedTimestamp)}`;
                } else if (newChainStartedTimestamp === 0 && globalChainStartedTimestamp !== 0) {
                    globalChainStartedTimestamp = 0;
                    chainStartedDisplay.textContent = 'Started: N/A';
                } else if (newChainStartedTimestamp === 0 && chainStartedDisplay.textContent === 'Started: N/A') {
                    // No change needed
                }
            }

        } else {
            console.warn("Chain data not found in API response, or chain object is missing.");
            // Reset global variables if no chain data
            currentLiveChainSeconds = 0;
            lastChainApiFetchTime = 0;
            globalChainStartedTimestamp = 0;
            globalChainCurrentNumber = 'N/A';

            // Ensure display elements are reset if API data is missing/invalid
            if (currentChainNumberDisplay) currentChainNumberDisplay.textContent = 'N/A';
            if (chainStartedDisplay) chainStartedDisplay.textContent = 'Started: N/A';
        }

    } catch (error) {
        console.error("Error fetching chain data:", error);
        // On error, reset global variables and display 'Error'
        currentLiveChainSeconds = 0;
        lastChainApiFetchTime = 0;
        globalChainStartedTimestamp = 0;
        globalChainCurrentNumber = 'N/A';

        if (currentChainNumberDisplay) currentChainNumberDisplay.textContent = 'Error';
        if (chainStartedDisplay) chainStartedDisplay.textContent = 'Error';
    }
}
// REPLACE YOUR ENTIRE EXISTING 'fetchAndDisplayRankedWarScores' FUNCTION WITH THIS ONE
async function fetchAndDisplayRankedWarScores() { // No apiKey param needed, reads userApiKey global and factionApiFullData
    if (!factionApiFullData || !factionApiFullData.ranked_wars || !factionApiFullData.ID) {
        console.warn("Ranked War Data not fully available in factionApiFullData.ranked_wars.");
        // Reset display if data is missing
        if (yourFactionRankedScore) yourFactionRankedScore.textContent = 'N/A';
        if (opponentFactionRankedScore) opponentFactionRankedScore.textContent = 'N/A';
        if (warTargetScore) warTargetScore.textContent = 'N/A';
        if (warStartedTime) warStartedTime.textContent = 'N/A';
        if (yourFactionNameScoreLabel) yourFactionNameScoreLabel.textContent = 'Your Faction:';
        if (opponentFactionNameScoreLabel) opponentFactionNameScoreLabel.textContent = 'Vs. Opponent:';
        return;
    }

    try {
        const rankedWarData = factionApiFullData.ranked_wars; // Use the globally fetched full data
        console.log("Ranked War API Data (from factionApiFullData):", rankedWarData);

        // Find the active ranked war (assuming only one is typically active at a time)
        let activeWar = null;
        const yourFactionId = factionApiFullData.ID; // Get our faction ID from full data

        for (const warId in rankedWarData) {
            const warEntry = rankedWarData[warId];
            // Check if war is active (end time 0) AND has our faction as a participant
            if (warEntry.war && warEntry.war.end === 0 && warEntry.factions && warEntry.factions[yourFactionId]) {
                activeWar = warEntry;
                break;
            }
        }

        if (activeWar) {
            const opponentFactionId = Object.keys(activeWar.factions).find(id => id !== String(yourFactionId));
            const yourFactionInfo = activeWar.factions[yourFactionId];
            const opponentFactionInfo = activeWar.factions[opponentFactionId];

            // Update HTML elements
            if (yourFactionRankedScore) yourFactionRankedScore.textContent = yourFactionInfo ? yourFactionInfo.score || 'N/A' : 'N/A';
            if (yourFactionNameScoreLabel && yourFactionInfo) yourFactionNameScoreLabel.textContent = `${yourFactionInfo.name || 'Your Faction'}:`;

            if (opponentFactionRankedScore) opponentFactionRankedScore.textContent = opponentFactionInfo ? opponentFactionInfo.score || 'N/A' : 'N/A';
            if (opponentFactionNameScoreLabel && opponentFactionInfo) opponentFactionNameScoreLabel.textContent = `Vs. ${opponentFactionInfo.name || 'Opponent'}:`;

            if (warTargetScore) warTargetScore.textContent = activeWar.war.target || 'N/A';
            if (warStartedTime) warStartedTime.textContent = activeWar.war.start ? formatTornTime(activeWar.war.start) : 'N/A';


        } else {
            // No active war found
            if (yourFactionRankedScore) yourFactionRankedScore.textContent = 'N/A';
            if (opponentFactionRankedScore) opponentFactionRankedScore.textContent = 'N/A';
            if (warTargetScore) warTargetScore.textContent = 'N/A';
            if (warStartedTime) warStartedTime.textContent = 'N/A';
            if (yourFactionNameScoreLabel) yourFactionNameScoreLabel.textContent = 'Your Faction:';
            if (opponentFactionNameScoreLabel) opponentFactionNameScoreLabel.textContent = 'Vs. Opponent:';
        }

    } catch (error) {
        console.error("Error processing ranked war data from factionApiFullData:", error);
        if (yourFactionRankedScore) yourFactionRankedScore.textContent = 'Error';
        if (opponentFactionRankedScore) opponentFactionRankedScore.textContent = 'Error';
        if (warTargetScore) warTargetScore.textContent = 'Error';
        if (warStartedTime) warStartedTime.textContent = 'Error';
        if (yourFactionNameScoreLabel) yourFactionNameScoreLabel.textContent = 'Your Faction:';
        if (opponentFactionNameScoreLabel) opponentFactionNameScoreLabel.textContent = 'Vs. Opponent:';
    }
}

// MODIFIED: updateAllTimers function (Moved for proper scope)
function updateAllTimers() {
    console.count('updateAllTimers called');
    const nowInSeconds = Math.floor(Date.now() / 1000);

    // 1. Update Main Chain Timer (if nextChainTimeInput is a valid future timestamp - from Leader Config)
    if (warNextChainTimeStatus && nextChainTimeInput) {
        const nextChainTimeValue = nextChainTimeInput.value.trim();
        const targetChainTime = parseInt(nextChainTimeValue, 10);

        if (!isNaN(targetChainTime) && targetChainTime > 0) {
            const timeLeft = targetChainTime - nowInSeconds;
            if (timeLeft > 0) {
                warNextChainTimeStatus.textContent = formatTime(timeLeft);
            } else {
                warNextChainTimeStatus.textContent = 'Chain Live! / Time Passed';
            }
        } else if (warNextChainTimeStatus.textContent === 'N/A' || warNextChainTimeStatus.textContent === '') {
            // Do nothing if it's already N/A or empty, to avoid resetting manual text
        } else {
            warNextChainTimeStatus.textContent = 'N/A';
        }
    }

    // 2. Update Enemy Target Timers (Hospital and Traveling) - Local countdowns only
    if (enemyTargetsContainer) {
        const statusCells = enemyTargetsContainer.querySelectorAll('td[data-until]');

        statusCells.forEach(cell => {
            const targetTime = parseInt(cell.dataset.until, 10);
            const statusState = cell.dataset.statusState;
            const originalDescription = cell.textContent.split('(')[0].trim();

            if (!isNaN(targetTime) && targetTime > 0) {
                const timeLeft = targetTime - nowInSeconds;

                if (timeLeft > 0) {
                    if (statusState === 'Hospital') {
                        cell.textContent = `In Hospital (${formatTime(timeLeft)})`;
                    } else if (statusState === 'Traveling') {
                        cell.textContent = `${originalDescription} (${formatTime(timeLeft)})`;
                    }
                } else {
                    if (statusState === 'Hospital') {
                        cell.textContent = `Okay`;
                        cell.classList.remove('status-hospital', 'status-other', 'status-okay');
                    } else if (statusState === 'Traveling') {
                        const destination = originalDescription.replace('Traveling to ', '');
                        cell.textContent = `Arrived${destination ? ` (${destination})` : ''}`;
                        cell.classList.remove('status-traveling', 'status-other');
                        cell.classList.add('status-okay');
                    } else {
                        cell.textContent = `${statusState} (Time Up)`;
                        cell.classList.remove('status-hospital', 'status-traveling', 'status-other');
                        cell.classList.add('status-okay');
                    }
                }
            }
        });
    }

    // NEW: Update Chain Timer Display (smooth 1-second countdown)
    // This logic relies on global variables set by fetchAndDisplayChainData, which must be called separately by setInterval in DOMContentLoaded
    console.log('Chain countdown state:', currentLiveChainSeconds, lastChainApiFetchTime);
    if (chainTimerDisplay && currentLiveChainSeconds > 0 && lastChainApiFetchTime > 0) {
        const elapsedTimeSinceLastFetch = (Date.now() - lastChainApiFetchTime) / 1000;
        const dynamicTimeLeft = Math.max(0, currentLiveChainSeconds - Math.floor(elapsedTimeSinceLastFetch));
        chainTimerDisplay.textContent = formatTime(dynamicTimeLeft);
    } else if (chainTimerDisplay) {
        chainTimerDisplay.textContent = 'Chain Over';
    }

    // NEW: Update Chain Started Time Display
    // This section ensures the Chain Started time is displayed when data is available
    if (chainStartedDisplay && globalChainStartedTimestamp > 0) {
        chainStartedDisplay.textContent = `Started: ${formatTornTime(globalChainStartedTimestamp)}`;
    } else if (chainStartedDisplay) {
        chainStartedDisplay.textContent = 'Started: N/A';
    }
}

async function fetchAndDisplayEnemyFaction(factionID, apiKey) {
    if (!factionID || !apiKey) return;
    try {
        const enemyApiUrl = `https://api.torn.com/v2/faction/${factionID}?selections=basic,members&key=${apiKey}&comment=MyTornPA_EnemyFaction`;
        const response = await fetch(enemyApiUrl);
        if (!response.ok) {
            throw new Error(`Server responded with an error: ${response.status} ${response.statusText}`);
        }
        enemyDataGlobal = await response.json(); // Store enemy data globally
        const enemyData = enemyDataGlobal; // Use local alias for function's internal logic
        console.log("Enemy Faction API Data:", enemyData);
        if (enemyData.error) {
            console.error('Torn API responded with a detailed error for enemy faction:', enemyData.error);
            throw new Error(`Torn API Error: ${JSON.stringify(enemyData.error.error)}`);
        }

        if (factionTwoNameEl) factionTwoNameEl.textContent = enemyData.basic.name || 'Unknown Faction';
        if (factionTwoMembersEl) factionTwoMembersEl.textContent = `Total Members: ${countFactionMembers(enemyData.members) || 'N/A'}`;

        const warDoc = await db.collection('factionWars').doc('currentWar').get();
        const warData = warDoc.exists ? warDoc.data() : {};
        const savedWatchlistMembers = warData.bigHitterWatchlist || [];

        if (enemyData.members) {
            // Corrected function call
            displayEnemyTargetsTable(enemyData.members);
            populateEnemyMemberCheckboxes(enemyData.members, savedWatchlistMembers);
        } else {
            console.warn("Enemy faction members data not found.");
            // Corrected function call
            displayEnemyTargetsTable(null);
            populateEnemyMemberCheckboxes({}, []);
        }
    } catch (error) {
        console.error('Error fetching enemy faction data:', error);
        if (factionTwoNameEl) factionTwoNameEl.textContent = 'Invalid Enemy ID';
        if (factionTwoMembersEl) factionTwoTwoMembersEl.textContent = 'N/A';
        // REMOVED: if (factionTwoPicEl) factionTwoPicEl.style.backgroundImage = ''; // This line is now removed
        displayEnemyTargetsTable(null);
        populateEnemyMemberCheckboxes({}, []);
    }
}




  // NEW: Update Chain Timer Display (smooth 1-second countdown)
  console.log('Chain countdown state:', currentLiveChainSeconds, lastChainApiFetchTime); // NEW: Added console.log
  if (chainTimerDisplay && currentLiveChainSeconds > 0 && lastChainApiFetchTime > 0) {
      const elapsedTimeSinceLastFetch = (Date.now() - lastChainApiFetchTime) / 1000; // Time in seconds since last API fetch
      // Calculate remaining time by subtracting elapsed time from the last fetched 'timeout'
      const dynamicTimeLeft = Math.max(0, currentLiveChainSeconds - Math.floor(elapsedTimeSinceLastFetch));
      chainTimerDisplay.textContent = formatTime(dynamicTimeLeft);
  } else if (chainTimerDisplay) {
      // If no chain is active or data is reset, show 'Chain Over'
      chainTimerDisplay.textContent = 'Chain Over';
  }

  // NEW: Update Chain Started Time Display
  // This section ensures the Chain Started time is displayed when data is available
  // It is placed here because the value does not change after initial fetch
  if (chainStartedDisplay && globalChainStartedTimestamp > 0) {
      chainStartedDisplay.textContent = `Started: ${formatTornTime(globalChainStartedTimestamp)}`;
  } else if (chainStartedDisplay) {
      chainStartedDisplay.textContent = 'Started: N/A';
  }
  
 // NEW: Function to fetch and display Chain Score (e.g., Lead Target progress)
async function fetchAndDisplayChainScore(apiKey) {
    const yourFactionNameScoreEl = document.getElementById('yourFactionNameScore');
    const currentChainScoreEl = document.getElementById('currentChainScore');
    const leadTargetProgressEl = document.getElementById('leadTargetProgress');
    const targetFactionScoreEl = document.getElementById('targetFactionScore');
    const enemyFactionNameScoreEl = document.getElementById('enemyFactionNameScore');

    // Set initial loading states
    if (currentChainScoreEl) currentChainScoreEl.textContent = '...';
    if (leadTargetProgressEl) leadTargetProgressEl.textContent = '... / ...';
    if (targetFactionScoreEl) targetFactionScoreEl.textContent = '...';

    if (!apiKey) {
        console.warn("API key is not available. Cannot fetch chain score data.");
        if (currentChainScoreEl) currentChainScoreEl.textContent = 'N/A';
        if (leadTargetProgressEl) leadTargetProgressEl.textContent = 'N/A';
        if (targetFactionScoreEl) targetFactionScoreEl.textContent = 'N/A';
        return;
    }

    try {
        const chainScoreApiUrl = `https://api.torn.com/faction/?selections=chain&key=${apiKey}&comment=MyTornPA_ChainScore`;
        const response = await fetch(chainScoreApiUrl);

        if (!response.ok) {
            throw new Error(`Server responded with an error: ${response.status} ${response.statusText}`);
        }
        const chainData = await response.json();
        console.log("Chain Score API Data (selections=chain):", chainData);

        if (chainData && chainData.chain) {
            const chain = chainData.chain;
            
            // Your Faction Name
            if (yourFactionNameScoreEl && factionApiFullData && factionApiFullData.basic) {
                yourFactionNameScoreEl.textContent = factionApiFullData.basic.name || 'Your Faction';
            } else if (yourFactionNameScoreEl) {
                yourFactionNameScoreEl.textContent = 'Your Faction'; // Fallback
            }

            // Current Chain Score (left side)
            if (currentChainScoreEl) {
                currentChainScoreEl.textContent = chain.current !== undefined ? chain.current.toLocaleString() : 'N/A';
            }

            // Lead Target Progress (middle)
            if (leadTargetProgressEl) {
                const maxHits = chain.max !== undefined ? chain.max.toLocaleString() : 'N/A';
                // Assuming 'chain_target_score' represents the lead target progress value
                const targetScore = chain.chain_target_score !== undefined ? chain.chain_target_score.toLocaleString() : 'N/A';
                leadTargetProgressEl.textContent = `${targetScore} / ${maxHits}`;
            }

            // Target Faction Score (right side)
            if (targetFactionScoreEl) {
                // If the chain.target_id is the enemy faction, we can try to display its name
                // For now, let's display the 'target' from the chain data, which typically represents the enemy score or a value associated with them.
                targetFactionScoreEl.textContent = chain.target !== undefined ? chain.target.toLocaleString() : 'N/A';
            }

            // Enemy Faction Name for Target Score (This requires a separate basic selection for enemy faction if not already fetched)
            // For now, we use a generic label or assume globalEnemyFactionID's name is already known from other fetches.
            if (enemyFactionNameScoreEl) {
                 if (globalEnemyFactionID && enemyDataGlobal && enemyDataGlobal.basic) { // Assuming enemyDataGlobal is available from fetchAndDisplayEnemyFaction
                     enemyFactionNameScoreEl.textContent = enemyDataGlobal.basic.name || 'Enemy Faction';
                 } else {
                     enemyFactionNameScoreEl.textContent = 'Enemy Faction'; // Default generic
                 }
            }


        } else {
            console.warn("Chain data not found in API response for chain score.");
            if (currentChainScoreEl) currentChainScoreEl.textContent = 'N/A';
            if (leadTargetProgressEl) leadTargetProgressEl.textContent = 'N/A';
            if (targetFactionScoreEl) targetFactionScoreEl.textContent = 'N/A';
        }

    } catch (error) {
        console.error("Error fetching chain score data:", error);
        if (currentChainScoreEl) currentChainScoreEl.textContent = 'Error';
        if (leadTargetProgressEl) leadTargetProgressEl.textContent = 'Error';
        if (targetFactionScoreEl) targetFactionScoreEl.textContent = 'Error';
    }
} 

  // NEW: Update Chain Timer Display (smooth 1-second countdown)
  console.log('Chain countdown state:', currentLiveChainSeconds, lastChainApiFetchTime); // NEW: Added console.log
  if (chainTimerDisplay && currentLiveChainSeconds > 0 && lastChainApiFetchTime > 0) {
      const elapsedTimeSinceLastFetch = (Date.now() - lastChainApiFetchTime) / 1000; // Time in seconds since last API fetch
      // Calculate remaining time by subtracting elapsed time from the last fetched 'timeout'
      const dynamicTimeLeft = Math.max(0, currentLiveChainSeconds - Math.floor(elapsedTimeSinceLastFetch));
      chainTimerDisplay.textContent = formatTime(dynamicTimeLeft);
  } else if (chainTimerDisplay) {
      // If no chain is active or data is reset, show 'Chain Over'
      chainTimerDisplay.textContent = 'Chain Over';
  }

  // --- ADD THIS NEW BLOCK BELOW YOUR EXISTING updateAllTimers LOGIC ---
  if (userApiKey) {
    fetchAndDisplayChainData(userApiKey);
  } else {
    console.warn("API key not available. Cannot update chain timer.");
  }
  
// NEW: Function to handle claiming a target
// UPDATED: Function to handle claiming a target and changing it to an "Unclaim" button
function claimTarget(memberId) {
    const claimBtn = document.getElementById(`claim-btn-${memberId}`);
    const targetRow = document.getElementById(`target-row-${memberId}`);

    if (claimBtn) {
        // Change the button text and make its new function call unclaimTarget
        claimBtn.textContent = 'Unclaim';
        claimBtn.setAttribute('onclick', `unclaimTarget('${memberId}')`);
    }
    
    // Change the row color to show it's claimed
    if (targetRow) {
        targetRow.style.backgroundColor = '#4a4a4a'; // A dark grey color
    }
}
// NEW: Helper function to format time remaining from seconds


// NEW: Function to build and display the enemy targets table (Single Table & Sticky Header compatible)
// MODIFIED: Function to build and display the enemy targets table (Single Table & Sticky Header compatible)
function displayEnemyTargetsTable(members) {
    if (!enemyTargetsContainer) {
        console.error("HTML Error: Cannot find element with ID 'enemyTargetsContainer'.");
        return;
    }

    // Clear the container first
    enemyTargetsContainer.innerHTML = '';

    if (!members || Object.keys(members).length === 0) {
        enemyTargetsContainer.innerHTML = '<div class="no-targets-message">No enemy members to display. Set an enemy faction in Leader Config.</div>';
        return;
    }

    // Build the entire table HTML string
    let tableHtml = `<table class="enemy-targets-table">
                         <thead>
                             <tr>
                                 <th class="col-name">Name (ID)</th>
                                 <th class="col-level">Level</th>
                                 <th class="col-last-action">Last Action</th> <th class="col-status">Status</th>
                                 <th class="col-claim">Claim</th>
                                 <th class="col-attack">Attack</th>
                             </tr>
                         </thead>
                         <tbody>`;

    const membersArray = Object.values(members);
    const nowInSeconds = Math.floor(Date.now() / 1000); // Get current time once for efficiency

    for (const member of membersArray) {
        const memberId = member.id;
        const profileUrl = `https://www.torn.com/profiles.php?XID=${memberId}`;
        const attackUrl = `https://www.torn.com/loader.php?sid=attack&user2ID=${memberId}`;

        let statusText = member.status.description;
        let statusClass = '';
        let dataUntil = '';
        let statusState = member.status.state;

        if (member.status.state === 'Hospital') {
            statusClass = 'status-hospital';
            dataUntil = member.status.until;
            const timeLeft = member.status.until - nowInSeconds;
            statusText = `In Hospital (${formatTime(timeLeft)})`;
        } else if (member.status.state === 'Traveling') {
            statusClass = 'status-traveling';
            dataUntil = member.status.until;
            const timeLeft = member.status.until - nowInSeconds;
            if (timeLeft <= 0) {
                statusText = `Arrived${member.status.description.replace('Traveling to ', '') ? ` (${member.status.description.replace('Traveling to ', '')})` : ''}`;
            } else {
                statusText = member.status.description;
            }
        } else if (member.status.state !== 'Okay') {
            statusClass = 'status-other';
        }

        // Determine Last Action text
        const lastActionTimestamp = member.last_action ? member.last_action.timestamp : null;
        const lastActionText = formatRelativeTime(lastActionTimestamp); // Use the new function here

        tableHtml += `<tr id="target-row-${memberId}">
                             <td class="col-name"><a href="${profileUrl}" target="_blank">${member.name} (${memberId})</a></td>
                             <td class="col-level">${member.level}</td>
                             <td class="col-last-action">${lastActionText}</td> <td class="col-status ${statusClass}" ${dataUntil ? `data-until="${dataUntil}" data-status-state="${statusState}"` : ''}>${statusText}</td>
                             <td class="col-claim"><button id="claim-btn-${memberId}" class="claim-btn" onclick="claimTarget('${memberId}')">Claim</button></td>
                             <td class="col-attack"><a id="attack-link-${memberId}" href="${attackUrl}" class="attack-link" target="_blank">Attack</a></td>
                         </tr>`;
    }
    tableHtml += `</tbody></table>`;

    enemyTargetsContainer.innerHTML = tableHtml;
}

function rgbToHex(r, g, b) {
    return (
        "#" +
        ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
    );
}

function get_ff_colour(value) {
    let r, g, b;
    if (value <= 1) {
        r = 0x28; g = 0x28; b = 0xc6; // Blue
    } else if (value <= 3) {
        const t = (value - 1) / 2;
        r = 0x28; g = Math.round(0x28 + (0xc6 - 0x28) * t); b = Math.round(0xc6 - (0xc6 - 0x28) * t);
    } else if (value <= 5) {
        const t = (value - 3) / 2;
        r = Math.round(0x28 + (0xc6 - 0x28) * t); g = Math.round(0xc6 - (0xc6 - 0x28) * t); b = 0x28;
    } else {
        r = 0xc6; g = 0x28; b = 0x28; // Red
    }
    return rgbToHex(r, g, b);
}

function get_contrast_color(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = r * 0.299 + g * 0.587 + b * 0.114;
    return brightness > 126 ? "black" : "white";
}

function get_difficulty_text(ff) {
    if (ff <= 1) return "Extremely easy";
    else if (ff <= 2) return "Easy";
    else if (ff <= 3.5) return "Moderately difficult";
    else if (ff <= 4.5) return "Difficult";
    else return "May be impossible";
}


// NEW: Function to format time from timestamp
function formatTornTime(timestamp) {
  const date = new Date(timestamp * 1000); // Torn API timestamps are in seconds
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

async function displayQuickFFTargets(userApiKey, playerId) {
    const quickFFTargetsDisplay = document.getElementById('quickFFTargetsDisplay');
    if (!quickFFTargetsDisplay) {
        console.error("HTML Error: Cannot find element with ID 'quickFFTargetsDisplay'.");
        return;
    }

    quickFFTargetsDisplay.innerHTML = '<span style="color: #6c757d;">Loading targets...</span>'; // Loading state

    if (!userApiKey || !playerId) {
        quickFFTargetsDisplay.innerHTML = '<span style="color: #ff4d4d;">API Key or Player ID missing.</span>';
        console.warn("Cannot fetch Quick FF Targets: API Key or Player ID is missing.");
        return;
    }

    try {
        // 1. Get IDs of players currently in the main enemy table
        const currentEnemyTableRows = enemyTargetsContainer.querySelectorAll('tr[id^="target-row-"]');
        const excludedPlayerIDs = Array.from(currentEnemyTableRows).map(row => row.id.replace('target-row-', ''));
        console.log("Excluded Player IDs (from main table):", excludedPlayerIDs);

        const functionUrl = `/.netlify/functions/get-recommended-targets`;
        const response = await fetch(functionUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiKey: userApiKey, playerId: playerId })
        });
        const data = await response.json();

        if (!response.ok || data.error) {
            const errorMessage = data.error || `Error from server: ${response.status} ${response.statusText}`;
            quickFFTargetsDisplay.innerHTML = `<span style="color: #ff4d4d;">Error: ${errorMessage}</span>`;
            console.error("Error fetching Quick FF Targets:", errorMessage);
            return;
        }

        if (!data.targets || data.targets.length === 0) {
            quickFFTargetsDisplay.innerHTML = '<span style="color: #6c757d;">No recommended targets found.</span>';
            return;
        }

        // 2. Filter out already displayed targets from the fetched list
        const availableTargets = data.targets.filter(target => !excludedPlayerIDs.includes(target.playerID));
        console.log("Available targets after exclusion:", availableTargets);

        if (availableTargets.length === 0) {
            quickFFTargetsDisplay.innerHTML = '<span style="color: #6c757d;">No new targets available.</span>';
            return;
        }

        // 3. Shuffle the available targets (Fisher-Yates algorithm)
        for (let i = availableTargets.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [availableTargets[i], availableTargets[j]] = [availableTargets[j], availableTargets[i]]; // Swap
        }
        console.log("Shuffled available targets:", availableTargets);

        // Clear existing content to populate with new links
        quickFFTargetsDisplay.innerHTML = '';

        // Display up to the first 2 unique and random targets
        for (let i = 0; i < Math.min(2, availableTargets.length); i++) {
            const target = availableTargets[i];
            const attackUrl = `https://www.torn.com/loader.php?sid=attack&user2ID=${target.playerID}`;
            const targetName = target.playerName || `Target ${i + 1}`; // Fallback name

            const targetHtml = `
                <a href="${attackUrl}" target="_blank"
                   class="quick-ff-target-btn"
                   title="${targetName} (ID: ${target.playerID}) - Fair Fight: ${target.fairFightScore} (${get_difficulty_text(parseFloat(target.fairFightScore))})">
                    ${targetName}
                </a>
            `;
            quickFFTargetsDisplay.insertAdjacentHTML('beforeend', targetHtml);
        }

    } catch (error) {
        console.error("Failed to fetch or display Quick FF Targets:", error);
        quickFFTargetsDisplay.innerHTML = `<span style="color: #ff4d4d;">Failed to load targets.</span>`;
    }
}



function formatRelativeTime(timestampInSeconds) {
    if (!timestampInSeconds || timestampInSeconds === 0) {
        return "N/A";
    }

    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const diffSeconds = now - timestampInSeconds;

    if (diffSeconds < 60) {
        return "Now"; // Less than 1 minute
    } else if (diffSeconds < 3600) { // Less than 1 hour (60 minutes)
        const minutes = Math.floor(diffSeconds / 60);
        return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
    } else if (diffSeconds < 86400) { // Less than 1 day (24 hours)
        const hours = Math.floor(diffSeconds / 3600);
        return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else { // 1 day or more
        const days = Math.floor(diffSeconds / 86400);
        return `${days} day${days === 1 ? '' : 's'} ago`;
    }
}
// NEW/MODIFIED: Function to populate enemy member checkboxes (Big Hitter Watchlist)
function populateEnemyMemberCheckboxes(enemyMembers, savedWatchlistMembers = []) {
    if (!bigHitterWatchlistContainer) {
        console.error("HTML Error: Cannot find element with ID 'bigHitterWatchlistContainer'.");
        return;
    }

    bigHitterWatchlistContainer.innerHTML = ''; // Clear existing checkboxes

    if (!enemyMembers || typeof enemyMembers !== 'object' || Object.keys(enemyMembers).length === 0) {
        bigHitterWatchlistContainer.innerHTML = '<div class="member-selection-item">No enemy members available</div>';
        return;
    }

    const sortedEnemyMemberIds = Object.keys(enemyMembers).sort((a, b) => {
        const nameA = enemyMembers[a].name || '';
        const nameB = enemyMembers[b].name || '';
        return nameA.localeCompare(nameB);
    });

    sortedEnemyMemberIds.forEach(memberId => {
        const member = enemyMembers[memberId];
        const memberName = member.name || `Unknown (${memberId})`;

        const isWatchlistChecked = (savedWatchlistMembers && savedWatchlistMembers.includes(memberId)) ? 'checked' : '';
        const itemHtml = `<div class="member-selection-item"><input type="checkbox" id="enemy-member-${memberId}" value="${memberId}" ${isWatchlistChecked}><label for="enemy-member-${memberId}">${memberName}</label></div>`;
        bigHitterWatchlistContainer.insertAdjacentHTML('beforeend', itemHtml);
    });
}

// --- Data Loading & UI Population ---

// REPLACE YOUR ENTIRE EXISTING 'initializeAndLoadData' FUNCTION WITH THIS ONE
async function initializeAndLoadData(apiKey) {
    try {
        // URGENTLY MODIFIED: Request EXACTLY 'basic' and 'chain' selections as specified
        const userFactionApiUrl = `https://api.torn.com/faction/?selections=basic,chain&key=${apiKey}`; // EXACT URL AS REQUESTED

        console.log("Attempting to fetch faction data with specified selections:", userFactionApiUrl);

        const userFactionResponse = await fetch(userFactionApiUrl);

        if (!userFactionResponse.ok) {
            throw new Error(`Server responded with an error: ${userFactionApiUrl.status} ${userFactionApiUrl.statusText}`);
        }

        factionApiFullData = await userFactionResponse.json();
		const userFactionApiUrl = `https://api.torn.com/v2/faction/?selections=basic,chain,wars&key=${apiKey}&comment=MyTornPA_WarHub_Combined`;

        if (factionApiFullData.error) {
            console.error("Torn API responded with a detailed error:", factionApiFullData.error);
            throw new Error(`Torn API Error: ${JSON.stringify(factionApiFullData.error)}`);
        }

        // Pass warData and apiKey to populateUiComponents
        // warData (from Firebase) is still needed for game plan, announcements, leader config settings etc.
        const warDoc = await db.collection('factionWars').doc('currentWar').get();
        const warData = doc.exists ? doc.data() : {};
        populateUiComponents(warData, apiKey); // Pass warData and apiKey

    } catch (error) {
        console.error("Error during basic/chain data initialization:", error);
        if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = 'Error Loading War Hub Data.';
        // Also reset related displays on error
        if (currentChainNumberDisplay) currentChainNumberDisplay.textContent = 'Error';
        if (chainStartedDisplay) chainStartedDisplay.textContent = 'Error';
        if (chainTimerDisplay) chainTimerDisplay.textContent = 'Error';
        // IMPORTANT: These elements will NOT be populated by this API call
        if (yourFactionRankedScore) yourFactionRankedScore.textContent = 'N/A'; // Explicitly set to N/A
        if (opponentFactionRankedScore) opponentFactionRankedScore.textContent = 'N/A';
        if (warTargetScore) warTargetScore.textContent = 'N/A';
        if (warStartedTime) warStartedTime.textContent = 'N/A';
        if (yourFactionNameScoreLabel) yourFactionNameScoreLabel.textContent = 'Your Faction:';
        if (opponentFactionNameScoreLabel) opponentFactionNameScoreLabel.textContent = 'Vs. Opponent:';
    }
}

// REPLACE YOUR ENTIRE EXISTING 'populateUiComponents' FUNCTION WITH THIS ONE
function populateUiComponents(warData, apiKey) { // warData is passed from initializeAndLoadData
    // Basic Faction Info (from global factionApiFullData)
    if (factionApiFullData) {
        if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = `${factionApiFullData.basic.name || "Your Faction"}'s War Hub.`;
        if (factionOneNameEl) factionOneNameEl.textContent = factionApiFullData.basic.name || 'Your Faction';
        if (factionOneMembersEl) factionOneMembersEl.textContent = `Total Members: ${countFactionMembers(factionApiFullData.members) || 'N/A'}`;

        // Populate friendly member checkboxes (from factionApiFullData.members)
        if (factionApiFullData.members) {
            populateFriendlyMemberCheckboxes(
                factionApiFullData.members,
                warData.tab4Admins || [], // warData comes from Firebase
                warData.energyTrackingMembers || []
            );
        }
    } else {
        console.warn("factionApiFullData not available in populateUiComponents.");
        if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = "Faction War Hub. (Data Loading...)";
        if (factionOneNameEl) factionOneNameEl.textContent = 'Your Faction';
        if (factionOneMembersEl) factionOneMembersEl.textContent = 'N/A';
    }
    
    // Game Plan & Announcements (from Firebase warData)
    if (gamePlanDisplay) gamePlanDisplay.textContent = warData.gamePlan || 'No game plan available.';
    if (factionAnnouncementsDisplay) factionAnnouncementsDisplay.textContent = warData.quickAnnouncement || 'No current announcements.';
    if (gamePlanEditArea) gamePlanEditArea.value = warData.gamePlan || '';

    populateWarStatusDisplay(warData); // Uses warData (Firebase)
    loadWarStatusForEdit(warData); // Uses warData (Firebase)

    // Store enemy faction ID globally (from Firebase warData)
    globalEnemyFactionID = warData.enemyFactionID || null;

    // Display enemy targets table (still needs enemyData via separate fetch)
    if (warData.enemyFactionID) {
        fetchAndDisplayEnemyFaction(warData.enemyFactionID, apiKey);
    } else {
        if (factionTwoNameEl) factionTwoNameEl.textContent = 'No Enemy Set';
        if (factionTwoMembersEl) factionTwoMembersEl.textContent = 'N/A';
        populateEnemyMemberCheckboxes({}, []);
        displayEnemyTargetsTable(null); // This clears the table
    }
}

// Inside fetchAndDisplayEnemyFaction function...
// REPLACE YOUR ENTIRE EXISTING 'fetchAndDisplayChainData' FUNCTION WITH THIS ONE
// REPLACE YOUR ENTIRE EXISTING 'fetchAndDisplayChainData' FUNCTION WITH THIS ONE
async function fetchAndDisplayChainData() { // No apiKey param needed, reads userApiKey global and factionApiFullData
  if (!factionApiFullData || !factionApiFullData.chain) {
    console.warn("Chain data not fully available in factionApiFullData.chain.");
    // Ensure display elements are reset if data is missing
    currentLiveChainSeconds = 0;
    lastChainApiFetchTime = 0;
    globalChainStartedTimestamp = 0;
    globalChainCurrentNumber = 'N/A';
    if (currentChainNumberDisplay) currentChainNumberDisplay.textContent = 'N/A';
    if (chainStartedDisplay) chainStartedDisplay.textContent = 'N/A';
    if (chainTimerDisplay) chainTimerDisplay.textContent = 'Chain Over'; // Also reset timer display
    return;
  }

  const chainData = factionApiFullData; // Use the globally fetched full data
  console.log("Chain API Data (from factionApiFullData):", chainData.chain); // Log for debugging

  if (chainData && chainData.chain) {
    // Store the relevant values globally for updateAllTimers to use
    currentLiveChainSeconds = chainData.chain.timeout || 0;
    lastChainApiFetchTime = Date.now(); // Store current time in milliseconds
    globalChainStartedTimestamp = chainData.chain.start || 0;
    globalChainCurrentNumber = chainData.chain.current || 'N/A'; // Store the actual chain number

    // Update the chain number display directly here, as it's not a countdown
    if (currentChainNumberDisplay) {
      currentChainNumberDisplay.textContent = globalChainCurrentNumber;
    }

    // Logic for Chain Started time display (no change from previous as requested)
    if (chainStartedDisplay) {
      const newChainStartedTimestamp = chainData.chain.start || 0;
      if (newChainStartedTimestamp > 0 && newChainStartedTimestamp !== globalChainStartedTimestamp) {
          globalChainStartedTimestamp = newChainStartedTimestamp;
          chainStartedDisplay.textContent = `Started: ${formatTornTime(globalChainStartedTimestamp)}`;
      } else if (newChainStartedTimestamp === 0 && globalChainStartedTimestamp !== 0) {
          globalChainStartedTimestamp = 0;
          chainStartedDisplay.textContent = 'Started: N/A';
      } else if (newChainStartedTimestamp === 0 && chainStartedDisplay.textContent === 'Started: N/A') {
          // No change needed
      }
    }

  } else { // Should ideally not be hit if outer if (factionApiFullData.chain) handles it
    console.warn("Chain data not found within factionApiFullData.chain.");
    // Reset global variables if no chain data
    currentLiveChainSeconds = 0;
    lastChainApiFetchTime = 0;
    globalChainStartedTimestamp = 0;
    globalChainCurrentNumber = 'N/A';

    // Ensure display elements are reset if data is missing/invalid
    if (currentChainNumberDisplay) currentChainNumberDisplay.textContent = 'N/A';
    if (chainStartedDisplay) chainStartedDisplay.textContent = 'N/A';
    if (chainTimerDisplay) chainTimerDisplay.textContent = 'Chain Over';
  }
}

function populateWarStatusDisplay(warData = {}) {
    if (warEnlistedStatus) warEnlistedStatus.textContent = warData.toggleEnlisted ? 'Yes' : 'No';
    if (warTermedStatus) warTermedStatus.textContent = warData.toggleTermedWar ? 'Yes' : 'No';
    if (warTermedWinLoss) warTermedWinLoss.textContent = warData.toggleTermedWinLoss ? 'Win' : 'Loss';
    if (warChainingStatus) warChainingStatus.textContent = warData.toggleChaining ? 'Yes' : 'No';
    if (warNoFlyingStatus) warNoFlyingStatus.textContent = warData.toggleNoFlying ? 'Yes' : 'No';
    if (warTurtleStatus) warTurtleStatus.textContent = warData.toggleTurtleMode ? 'Yes' : 'No';
    if (warNextChainTimeStatus) warNextChainTimeStatus.textContent = warData.nextChainTimeInput || 'N/A';
}

function loadWarStatusForEdit(warData = {}) {
    if (toggleEnlisted) toggleEnlisted.checked = warData.toggleEnlisted || false;
    if (toggleTermedWar) toggleTermedWar.checked = warData.toggleTermedWar || false;
    if (toggleTermedWinLoss) toggleTermedWinLoss.checked = warData.toggleTermedWinLoss || false;
    if (toggleChaining) toggleChaining.checked = warData.toggleChaining || false;
    if (toggleNoFlying) toggleNoFlying.checked = warData.toggleNoFlying || false;
    if (toggleTurtleMode) toggleTurtleMode.checked = warData.toggleTurtleMode || false;
    if (nextChainTimeInput) nextChainTimeInput.value = warData.nextChainTimeInput || '';
    if (enemyFactionIDInput) enemyFactionIDInput.value = warData.enemyFactionID || '';
}

// NEW: Autocomplete setup for the Current Team Lead input
function setupTeamLeadAutocomplete(allFactionMembers) {
    const currentTeamLeadInput = document.getElementById('currentTeamLeadInput');
    if (!currentTeamLeadInput) return;

    let autocompleteList = null; // Reference to the suggestion list div
    let currentFocus = -1;      // Current focused item for keyboard navigation

    // Filter members for autocomplete suggestions
    const filterMembers = (searchTerm) => {
        searchTerm = searchTerm.toLowerCase();
        if (!allFactionMembers || typeof allFactionMembers !== 'object') return [];
        const filtered = Object.values(allFactionMembers).filter(member => 
            member.name && member.name.toLowerCase().startsWith(searchTerm)
        ).sort((a, b) => a.name.localeCompare(b.name));
        console.log("Autocomplete Filtered Matches for '" + searchTerm + "':", filtered); // <<< CONSOLE LOG ADDED
        return filtered;
    };

    // Create and display the autocomplete suggestions
    const showSuggestions = (arr) => {
        console.log("Attempting to show suggestions:", arr); // <<< CONSOLE LOG ADDED
        // Remove any existing list
        closeAllLists();

        if (!arr.length) {
            console.log("No matches to show."); // <<< CONSOLE LOG ADDED
            return false;
        }

        // Create the autocomplete list container
        autocompleteList = document.createElement("DIV");
        autocompleteList.setAttribute("id", currentTeamLeadInput.id + "-autocomplete-list");
        autocompleteList.setAttribute("class", "autocomplete-items"); // Add a class for styling

        // Append the list to the parent of the input (e.g., the toggle-control div)
        // This ensures the list is positioned correctly relative to the input
        currentTeamLeadInput.parentNode.appendChild(autocompleteList);
        console.log("Autocomplete list container created and appended."); // <<< CONSOLE LOG ADDED

        // Populate the list with suggestions
        arr.forEach(member => {
            const item = document.createElement("DIV");
            item.innerHTML = `<strong>${member.name.substr(0, currentTeamLeadInput.value.length)}</strong>`;
            item.innerHTML += member.name.substr(currentTeamLeadInput.value.length);
            item.innerHTML += `<input type="hidden" value="${member.name}">`; // Hidden input to hold the full name

            item.addEventListener("click", function(e) {
                currentTeamLeadInput.value = this.getElementsByTagName("input")[0].value;
                closeAllLists();
                currentTeamLeadInput.focus(); // Keep focus after selection
            });
            autocompleteList.appendChild(item);
        });
        console.log("Suggestions populated into list."); // <<< CONSOLE LOG ADDED
        return true;
    };

    // Handle input events on the text field
    currentTeamLeadInput.addEventListener("input", function(e) {
        const val = this.value;
        console.log("Input event fired. Value:", val); // <<< CONSOLE LOG ADDED
        closeAllLists(); // Close any open lists

        if (!val) { 
            console.log("Input value is empty, not showing suggestions."); // <<< CONSOLE LOG ADDED
            return false; 
        } 

        const matches = filterMembers(val);
        showSuggestions(matches);
        currentFocus = -1; // Reset focus on new input
    });

    // Handle keyboard navigation (arrows, Enter, Escape)
    currentTeamLeadInput.addEventListener("keydown", function(e) {
        let x = document.getElementById(this.id + "-autocomplete-list");
        if (x) x = x.getElementsByTagName("div"); // Get all suggestion items

        if (e.keyCode == 40) { // DOWN arrow
            currentFocus++;
            addActive(x);
        } else if (e.keyCode == 38) { // UP arrow
            currentFocus--;
            addActive(x);
        } else if (e.keyCode == 13) { // ENTER key
            e.preventDefault(); // Prevent form submission
            if (currentFocus > -1) {
                if (x) x[currentFocus].click(); // Simulate a click on the active item
            } else {
                closeAllLists(); // If no item is focused, just close the list
            }
        } else if (e.keyCode == 27) { // ESCAPE key
            closeAllLists();
        }
    });

    // Helper to add "active" class for keyboard navigation highlighting
    const addActive = (x) => {
        if (!x) return false;
        removeActive(x); // Remove active from all items first
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        x[currentFocus].classList.add("autocomplete-active");
    };

    // Helper to remove "active" class
    const removeActive = (x) => {
        for (let i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    };

    // Close all autocomplete lists
    const closeAllLists = (elmnt) => {
        const x = document.getElementsByClassName("autocomplete-items");
        for (let i = 0; i < x.length; i++) {
            if (elmnt != x[i] && elmnt != currentTeamLeadInput) { // Don't close if click target is the list or input
                x[i].parentNode.removeChild(x[i]);
            }
        }
        currentFocus = -1; // Reset focus when lists are closed
    };

    // Close lists when clicking outside the input/list
    document.addEventListener("click", function (e) {
        closeAllLists(e.target);
    });
}

// --- Event Listeners Setup ---

function setupEventListeners(apiKey) {
    if (saveGamePlanBtn) {
        saveGamePlanBtn.addEventListener('click', async () => {
            if (!gamePlanEditArea) return;
            try {
                await db.collection('factionWars').doc('currentWar').set({ gamePlan: gamePlanEditArea.value }, { merge: true });
                if (gamePlanDisplay) gamePlanDisplay.textContent = gamePlanEditArea.value;
                alert('Game plan saved!');
            } catch (error) {
                console.error('Error saving game plan:', error);
                alert('Error saving game plan.');
            }
        });
    }
	
	

    if (postAnnouncementBtn) {
        postAnnouncementBtn.addEventListener('click', async () => {
            if (!quickAnnouncementInput || quickAnnouncementInput.value.trim() === '') return;
            try {
                await db.collection('factionWars').doc('currentWar').set({ quickAnnouncement: quickAnnouncementInput.value }, { merge: true });
                if (factionAnnouncementsDisplay) factionAnnouncementsDisplay.textContent = quickAnnouncementInput.value;
                quickAnnouncementInput.value = '';
                alert('Announcement posted!');
            } catch (error) {
                console.error('Error posting announcement:', error);
            }
        });
    }
    
    if (saveWarStatusControlsBtn) {
        saveWarStatusControlsBtn.addEventListener('click', async () => {
            const enemyId = enemyFactionIDInput ? enemyFactionIDInput.value.trim() : '';
            const statusData = {
                toggleEnlisted: toggleEnlisted ? toggleEnlisted.checked : false,
                toggleTermedWar: toggleTermedWar ? toggleTermedWar.checked : false,
                toggleChaining: toggleChaining ? toggleChaining.checked : false,
                toggleNoFlying: toggleNoFlying ? toggleNoFlying.checked : false,
                toggleTurtleMode: toggleTurtleMode ? toggleTurtleMode.checked : false,
                toggleTermedWinLoss: toggleTermedWinLoss ? toggleTermedWinLoss.checked : false,
                nextChainTimeInput: nextChainTimeInput ? nextChainTimeInput.value : '',
                enemyFactionID: enemyId
            };
            try {
                await db.collection('factionWars').doc('currentWar').set(statusData, { merge: true });
                alert('War status saved!');
                populateWarStatusDisplay(statusData);
                await fetchAndDisplayEnemyFaction(enemyId, apiKey);
            } catch (error) {
                console.error('Error saving war status:', error);
            }
        });
    }

    if (saveAdminsBtn) {
        saveAdminsBtn.addEventListener('click', async () => {
            if (!designatedAdminsContainer) return;
            const selectedAdminIds = Array.from(designatedAdminsContainer.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
            try {
                await db.collection('factionWars').doc('currentWar').set({ tab4Admins: selectedAdminIds }, { merge: true });
                alert('Admins saved!');
            } catch (error) {
                console.error("Error saving admins:", error);
            }
        });
    }

    if (saveEnergyTrackMembersBtn) {
        saveEnergyTrackMembersBtn.addEventListener('click', async () => {
            if (!energyTrackingContainer) return;
            const selectedEnergyMemberIds = Array.from(energyTrackingContainer.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
            try {
                await db.collection('factionWars').doc('currentWar').set({ energyTrackingMembers: selectedEnergyMemberIds }, { merge: true });
                alert('Energy tracking members saved!');
            } catch (error) {
                console.error("Error saving energy members:", error);
            }
        });
    }

    // NEW: Save button for Big Hitter Watchlist
    if (saveSelectionsBtnBH) {
        saveSelectionsBtnBH.addEventListener('click', async () => {
            if (!bigHitterWatchlistContainer) return;
            const selectedWatchlistIds = Array.from(bigHitterWatchlistContainer.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
            try {
                await db.collection('factionWars').doc('currentWar').set({ bigHitterWatchlist: selectedWatchlistIds }, { merge: true });
                alert('Big Hitter Watchlist saved!');
            } catch (error) {
                console.error("Error saving big hitter watchlist:", error);
            }
        });
    }
}
document.addEventListener('DOMContentLoaded', () => {
    tabButtons.forEach(button => {
        button.addEventListener('click', (event) => showTab(event.currentTarget.dataset.tab + '-tab'));
    });
    showTab('announcements-tab');
    let listenersInitialized = false;

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // Define userProfileRef INSIDE this block, as 'user' is scoped here.
            const userProfileRef = db.collection('userProfiles').doc(user.uid);
            const doc = await userProfileRef.get();
            const userData = doc.exists ? doc.data() : {};
            const apiKey = userData.tornApiKey || null;
            const playerId = userData.tornProfileId || null; // Get player ID
            currentTornUserName = userData.preferredName || 'Unknown';

            if (apiKey && playerId) {
                userApiKey = apiKey; // Ensure userApiKey is set globally

                // Initial load of comprehensive faction data (basic, members, chain, ranked_wars)
                // This is the first call that populates factionApiFullData
                await initializeAndLoadData(apiKey); 

                if (!listenersInitialized) {
                    setupEventListeners(apiKey);
                    listenersInitialized = true;

                    // Start local timers (e.g., hospital/travel countdowns) every 1 second
                    setInterval(updateAllTimers, 1000); // Only updates local timers

                    // Start Enemy Data API fetch every 1 second
                    setInterval(() => {
                        if (userApiKey && globalEnemyFactionID) {
                            fetchAndDisplayEnemyFaction(globalEnemyFactionID, userApiKey);
                        } else {
                            console.warn("API key or enemy faction ID not available for periodic enemy data refresh.");
                        }
                    }, 1000); // 1000 milliseconds = 1 second

                    // Start Quick FF Targets fetch every 60 seconds
                    setInterval(() => {
                        if (userApiKey && playerId) {
                            displayQuickFFTargets(userApiKey, playerId);
                        } else {
                            console.warn("API key or Player ID not available for periodic Quick FF targets refresh.");
                        }
                    }, 60000); // Refresh quick targets every 60 seconds (60000 ms)

                    // Start OUR Faction Data (Combined) fetch every 1.75 seconds
                    // This is the periodic call to refresh ALL our faction's data
                    setInterval(() => {
                        if (userApiKey) { 
                            initializeAndLoadData(userApiKey); // This will re-fetch and update factionApiFullData
                        } else {
                            console.warn("API key not available for periodic comprehensive faction data refresh.");
                        }
                    }, 1750); // 1750 milliseconds = 1.75 seconds

                    // Perform initial API fetches immediately on load (besides initializeAndLoadData done above)
                    if (userApiKey && globalEnemyFactionID) { // Initial call for enemy data
                        fetchAndDisplayEnemyFaction(globalEnemyFactionID, userApiKey);
                    }
                    if (userApiKey && playerId) { // Initial call for quick FF targets
                        displayQuickFFTargets(userApiKey, playerId);
                    }
                    // Initial call for comprehensive faction data is handled by initializeAndLoadData awaiting above
                } // Closes: if (!listenersInitialized)
            } else {
                console.warn("API key or Player ID not found.");
                if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = "Faction War Hub. (API Key & Player ID Needed)";
                const quickFFTargetsDisplay = document.getElementById('quickFFTargetsDisplay');
                if (quickFFTargetsDisplay) {
                    quickFFTargetsDisplay.innerHTML = '<span style="color: #ff4d4d;">Login & API/ID needed.</span>';
                }
            }
        } else {
            userApiKey = null;
            listenersInitialized = false;
            console.log("User not logged in.");
            if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = "Faction War Hub. (Please Login)";
        }
    }); // Closes: auth.onAuthStateChanged
}); // Closes: document.addEventListener('DOMContentLoaded', ...)