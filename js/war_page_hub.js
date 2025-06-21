/* ==========================================================================
   War Page Hub JavaScript (war_page_hub.js) - v9 (Selective V2 URL Test)
   ========================================================================== */

// --- Global Variables ---
const db = firebase.firestore();
const auth = firebase.auth();
let userApiKey = null;
let factionApiFullData = null;
let currentTornUserName = 'Unknown';
let apiCallCounter = 0; // NEW: Counter for API call intervals
let globalEnemyFactionID = null; // Used to store the enemy ID for periodic fetches
let currentLiveChainSeconds = 0; // Stores the 'timeout' value from the last API fetch
let lastChainApiFetchTime = 0;   // Stores Date.now() (in milliseconds) of the last chain API fetch
let globalChainStartedTimestamp = 0; // Stores the 'start' timestamp from the API
let globalChainCurrentNumber = 'N/A'; // Stores the 'current' chain number from the API


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
/**
 * Updates all real-time timers on the page, including the main chain timer
 * and individual hospital/travel timers in the enemy targets table.
 */
// Existing updateAllTimers function (DO NOT REPLACE THE WHOLE FUNCTION, JUST ADD THIS PART)
// Existing updateAllTimers function (REPLACE THE ENTIRE FUNCTION WITH THIS CODE)
// REPLACE YOUR ENTIRE EXISTING 'updateAllTimers' FUNCTION WITH THIS ONE
function updateAllTimers() {
  const nowInSeconds = Math.floor(Date.now() / 1000);

  // 1. Update Main Chain Timer (if nextChainTimeInput is a valid future timestamp - from Leader Config)
  // This part handles the manually set 'Next Planned Chain Time' countdown locally.
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
          // Only update if it previously had a value and it's now invalid or empty
          warNextChainTimeStatus.textContent = 'N/A';
      }
  }

  // 2. Update Enemy Target Timers (Hospital and Traveling) - Local countdowns only
  // This part updates existing enemy timers locally without new API calls.
  if (enemyTargetsContainer) {
      const statusCells = enemyTargetsContainer.querySelectorAll('td[data-until]');

      statusCells.forEach(cell => {
          const targetTime = parseInt(cell.dataset.until, 10); // Get timestamp from data-until
          const statusState = cell.dataset.statusState; // Get original status state
          const originalDescription = cell.textContent.split('(')[0].trim(); // Get original descriptive part

          if (!isNaN(targetTime) && targetTime > 0) {
              const timeLeft = targetTime - nowInSeconds;

              if (timeLeft > 0) {
                  if (statusState === 'Hospital') {
                      cell.textContent = `In Hospital (${formatTime(timeLeft)})`;
                  } else if (statusState === 'Traveling') {
                      // Keep the original description with updated time, e.g., "Traveling to X (Ym Zs)"
                      cell.textContent = `${originalDescription} (${formatTime(timeLeft)})`;
                  }
              } else {
                  // Timer has expired, assume they are now 'Okay' or 'Arrived'
                  if (statusState === 'Hospital') {
                      cell.textContent = `In Hospital (Time Up)`;
                      cell.classList.remove('status-hospital', 'status-other');
                      cell.classList.add('status-okay');
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
}

  // --- NEW API CALL TRIGGERING LOGIC ---
  // Trigger API calls for both chain and enemy data every 1.5 seconds (every 3rd tick if main interval is 0.5s)
  if (apiCallCounter % 3 === 0) {
      if (userApiKey) {
          fetchAndDisplayChainData(userApiKey); // Fetch chain data
      } else {
          console.warn("API key not available for chain data refresh.");
      }

      if (userApiKey && globalEnemyFactionID) {
          fetchAndDisplayEnemyFaction(globalEnemyFactionID, userApiKey); // Fetch enemy data
      } else {
          console.warn("API key or enemy faction ID not available for enemy data refresh.");
      }
  }



  // 2. Update Enemy Target Timers (Hospital and Traveling)
  // We look for <td> elements within the enemyTargetsContainer that have data-until attributes
  if (enemyTargetsContainer) {
      const statusCells = enemyTargetsContainer.querySelectorAll('td[data-until]');

      statusCells.forEach(cell => {
          const targetTime = parseInt(cell.dataset.until, 10); // Get timestamp from data-until
          const statusState = cell.dataset.statusState; // Get original status state
          const originalDescription = cell.textContent.split('(')[0].trim(); // Get original descriptive part (e.g. "Traveling to XYZ")

          if (!isNaN(targetTime) && targetTime > 0) {
              const timeLeft = targetTime - nowInSeconds;

              if (timeLeft > 0) {
                  // Update text based on original status state
                  if (statusState === 'Hospital') {
                      cell.textContent = `In Hospital (${formatTime(timeLeft)})`;
                  }
                  // For Traveling, we don't want a countdown, just the destination or "Arriving soon"
                  // If the original text contains 'Traveling to', keep it.
                  // This section won't change the Traveling text *unless* it expires
              } else {
                  // Timer has expired
                  if (statusState === 'Hospital') {
                      cell.textContent = `In Hospital (Time Up)`; // More explicit for Hospital
                      cell.classList.remove('status-hospital', 'status-other');
                      cell.classList.add('status-okay'); // Assume they are okay after hospital
                  } else if (statusState === 'Traveling') {
                      // For traveling, if time is up, they have arrived.
                      // The original description would be "Traveling to X", so we extract X.
                      const destination = originalDescription.replace('Traveling to ', '');
                      cell.textContent = `Arrived${destination ? ` (${destination})` : ''}`;
                      cell.classList.remove('status-traveling', 'status-other');
                      cell.classList.add('status-okay'); // Assume they are okay after travel
                  } else {
                      cell.textContent = `${statusState} (Time Up)`; // Generic fallback
                      cell.classList.remove('status-hospital', 'status-traveling', 'status-other');
                      cell.classList.add('status-okay');
                  }
              }
          }
      });
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

function unclaimTarget(memberId) {
    const claimBtn = document.getElementById(`claim-btn-${memberId}`);
    const targetRow = document.getElementById(`target-row-${memberId}`);

    if (claimBtn) {
        // Re-enable the button and set it back to the "Claim" state
        claimBtn.disabled = false;
        claimBtn.textContent = 'Claim';
        // Change the onclick event back to call claimTarget
        claimBtn.setAttribute('onclick', `claimTarget('${memberId}')`);
    }

    // Remove the special background color from the row
    if (targetRow) {
        targetRow.style.backgroundColor = ''; 
    }
}

// NEW: Function to build and display the enemy targets table (Single Table & Sticky Header compatible)
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
                                <th class="col-status">Status</th>
                                <th class="col-claim">Claim</th>
                                <th class="col-attack">Attack</th>
                            </tr>
                        </thead>
                        <tbody>`;

    const membersArray = Object.values(members);

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
            const now = Math.floor(Date.now() / 1000);
            const timeLeft = member.status.until - now;
            statusText = `In Hospital (${formatTime(timeLeft)})`;
        } else if (member.status.state === 'Traveling') {
            statusClass = 'status-traveling';
            dataUntil = member.status.until;
            const now = Math.floor(Date.now() / 1000);
            const timeLeft = member.status.until - now;
            if (timeLeft <= 0) {
                 statusText = `Arrived${member.status.description.replace('Traveling to ', '') ? ` (${member.status.description.replace('Traveling to ', '')})` : ''}`;
            } else {
                 statusText = member.status.description;
            }
        }
        else if (member.status.state !== 'Okay') {
            statusClass = 'status-other';
        }

        tableHtml += `<tr id="target-row-${memberId}">
                            <td class="col-name"><a href="${profileUrl}" target="_blank">${member.name} (${memberId})</a></td>
                            <td class="col-level">${member.level}</td>
                            <td class="col-status ${statusClass}" ${dataUntil ? `data-until="${dataUntil}" data-status-state="${statusState}"` : ''}>${statusText}</td>
                            <td class="col-claim"><button id="claim-btn-${memberId}" class="claim-btn" onclick="claimTarget('${memberId}')">Claim</button></td>
                            <td class="col-attack"><a id="attack-link-${memberId}" href="${attackUrl}" class="attack-link" target="_blank">Attack</a></td>
                        </tr>`;
    }
    tableHtml += `</tbody></table>`;

    enemyTargetsContainer.innerHTML = tableHtml;
}

// NEW: Function to format time from timestamp
function formatTornTime(timestamp) {
  const date = new Date(timestamp * 1000); // Torn API timestamps are in seconds
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

// NEW: Function to fetch and display chain data
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
    console.log("Chain API Data:", chainData);

    if (chainData && chainData.chain) {
      if (chainTimerDisplay) {
        // MODIFIED: Use chainData.chain.timeout for timeLeft if available and positive
        const endTime = chainData.chain.chain_end; // Keep for fallback if timeout is not used
        const now = Math.floor(Date.now() / 1000); // Current time in seconds

        let timeLeft = 0;
        // Prioritize 'timeout' if it's a valid positive number
        if (typeof chainData.chain.timeout === 'number' && chainData.chain.timeout > 0) {
            timeLeft = chainData.chain.timeout;
        } 
        // Fallback to 'chain_end' if 'timeout' isn't active/positive and 'chain_end' is in the future
        else if (typeof endTime === 'number' && endTime > now) {
            timeLeft = endTime - now;
        }

        chainTimerDisplay.textContent = timeLeft > 0 ? formatTime(timeLeft) : 'Chain Over';
      }
      if (currentChainNumberDisplay) {
        currentChainNumberDisplay.textContent = chainData.chain.current || 'N/A';
      }
      if (chainStartedDisplay) {
        // MODIFIED: Use chainData.chain.start instead of chainData.chain.chain_started
        // Only update if 'start' property exists and is a truthy value (e.g., not 0 or null)
        if (chainData.chain.start) {
            chainStartedDisplay.textContent = `Started: ${formatTornTime(chainData.chain.start)}`;
        } else {
            chainStartedDisplay.textContent = 'Started: N/A'; // Explicitly set N/A if 'start' is falsy/missing
        }
      }
    } else {
      console.warn("Chain data not found in API response, or chain object is missing.");
      if (chainTimerDisplay) chainTimerDisplay.textContent = 'N/A';
      if (currentChainNumberDisplay) currentChainNumberDisplay.textContent = 'N/A';
      if (chainStartedDisplay) chainStartedDisplay.textContent = 'Started: N/A';
    }

  } catch (error) {
    console.error("Error fetching chain data:", error);
    if (chainTimerDisplay) chainTimerDisplay.textContent = 'Error';
    if (currentChainNumberDisplay) currentChainNumberDisplay.textContent = 'Error';
    if (chainStartedDisplay) chainStartedDisplay.textContent = 'Error';
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

async function initializeAndLoadData(apiKey) {
    try {
        // *** MODIFIED ***: Using "v2" URL ONLY for the user's own faction data.
        const userFactionApiUrl = `https://api.torn.com/v2/faction/?selections=basic,members&key=${apiKey}&comment=MyTornPA_WarHub_V2Test`;

        console.log("Attempting to fetch from v2 URL for user's faction:", userFactionApiUrl);

        const userFactionResponse = await fetch(userFactionApiUrl);

        if (!userFactionResponse.ok) {
            throw new Error(`Server responded with an error: ${userFactionResponse.status} ${userFactionResponse.statusText}`);
        }

        factionApiFullData = await userFactionResponse.json();
		console.log("Faction API Full Data:", factionApiFullData); // ADD THIS LINE

        if (factionApiFullData.error) {
            console.error("Torn API responded with a detailed error:", factionApiFullData.error);
            throw new Error(`Torn API Error: ${JSON.stringify(factionApiFullData.error)}`);
        }

        const warDoc = await db.collection('factionWars').doc('currentWar').get();
        const warData = warDoc.exists ? warDoc.data() : {};

        populateUiComponents(warData, apiKey);

    } catch (error) {
        console.error("Error during data initialization:", error);
        if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = 'Error Loading War Hub Data.';
    }
}

function populateUiComponents(warData, apiKey) {
    if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = `${factionApiFullData.basic.name || "Your Faction"}'s War Hub.`;
    if (factionOneNameEl) factionOneNameEl.textContent = factionApiFullData.basic.name || 'Your Faction';
    if (factionOneMembersEl) factionOneMembersEl.textContent = `Total Members: ${countFactionMembers(factionApiFullData.members) || 'N/A'}`;

    if (gamePlanDisplay) gamePlanDisplay.textContent = warData.gamePlan || 'No game plan available.';
    if (factionAnnouncementsDisplay) factionAnnouncementsDisplay.textContent = warData.quickAnnouncement || 'No current announcements.';
    if (gamePlanEditArea) gamePlanEditArea.value = warData.gamePlan || '';

    populateWarStatusDisplay(warData);
    loadWarStatusForEdit(warData);

    // NEW: Store enemy faction ID globally after initial fetch or load
    globalEnemyFactionID = warData.enemyFactionID || null;

    // This is the single, correct block for handling the enemy faction display
    if (warData.enemyFactionID) {
        fetchAndDisplayEnemyFaction(warData.enemyFactionID, apiKey);
    } else {
        if (factionTwoNameEl) factionTwoNameEl.textContent = 'No Enemy Set';
        if (factionTwoMembersEl) factionTwoMembersEl.textContent = 'N/A';
        // REMOVED: if (factionTwoPicEl) factionTwoPicEl.style.backgroundImage = ''; // This line is now removed
        populateEnemyMemberCheckboxes({}, []);
        displayEnemyTargetsTable(null); // This clears the table
    }

    if (factionApiFullData.members) {
        populateFriendlyMemberCheckboxes(
            factionApiFullData.members,
            warData.tab4Admins || [],
            warData.energyTrackingMembers || []
        );
    }
}

// Inside fetchAndDisplayEnemyFaction function...
async function fetchAndDisplayEnemyFaction(factionID, apiKey) {
    if (!factionID || !apiKey) return;
    try {
        const enemyApiUrl = `https://api.torn.com/v2/faction/${factionID}?selections=basic,members&key=${apiKey}&comment=MyTornPA_EnemyFaction`;
        const response = await fetch(enemyApiUrl);
        if (!response.ok) {
            throw new Error(`Server responded with an error: ${response.status} ${response.statusText}`);
        }
        const enemyData = await response.json();
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
        if (factionTwoMembersEl) factionTwoMembersEl.textContent = 'N/A';
        // REMOVED: if (factionTwoPicEl) factionTwoPicEl.style.backgroundImage = ''; // This line is now removed
        displayEnemyTargetsTable(null);
        populateEnemyMemberCheckboxes({}, []);
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

// REPLACE YOUR ENTIRE EXISTING 'DOMContentLoaded' BLOCK WITH THIS ONE
// --- Main Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    tabButtons.forEach(button => {
        button.addEventListener('click', (event) => showTab(event.currentTarget.dataset.tab + '-tab'));
    });
    showTab('announcements-tab');
    let listenersInitialized = false;

    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userProfileRef = db.collection('userProfiles').doc(user.uid);
            const doc = await userProfileRef.get();
            const apiKey = doc.exists ? doc.data().tornApiKey : null;
            currentTornUserName = doc.exists ? doc.data().preferredName : 'Unknown';

            if (apiKey) {
                userApiKey = apiKey; // Ensure userApiKey is set globally

                // Initial load of general UI components
                await initializeAndLoadData(apiKey);

                if (!listenersInitialized) {
                    setupEventListeners(apiKey);
                    listenersInitialized = true;

                    // Start local timers (e.g., hospital/travel countdowns) every 1 second
                    setInterval(updateAllTimers, 1000); // Now only updates local timers

                    // Start Chain Data API fetch every 1.75 seconds
                    setInterval(() => {
                        if (userApiKey) {
                            fetchAndDisplayChainData(userApiKey);
                        } else {
                            console.warn("API key not available for periodic chain data refresh.");
                        }
                    }, 1750); // 1750 milliseconds = 1.75 seconds

                    // Start Enemy Data API fetch every 1 second
                    setInterval(() => {
                        if (userApiKey && globalEnemyFactionID) {
                            fetchAndDisplayEnemyFaction(globalEnemyFactionID, userApiKey);
                        } else {
                            console.warn("API key or enemy faction ID not available for periodic enemy data refresh.");
                        }
                    }, 1000); // 1000 milliseconds = 1 second

                    // Perform initial API fetches immediately on load
                    if (userApiKey) {
                        fetchAndDisplayChainData(userApiKey);
                    }
                    if (userApiKey && globalEnemyFactionID) {
                         fetchAndDisplayEnemyFaction(globalEnemyFactionID, userApiKey);
                    }
                }
            } else {
                console.warn("API key not found.");
                if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = "Faction War Hub. (API Key Needed)";
            }
        } else {
            userApiKey = null;
            listenersInitialized = false;
            console.log("User not logged in.");
            if (factionWarHubTitleEl) factionWarHubTitleEl.textContent = "Faction War Hub. (Please Login)";
        }
    });
});