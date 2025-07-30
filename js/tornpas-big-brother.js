// File: ../js/tornpas-big-brother.js

// Firebase initialization is assumed to be handled by firebase-init.js
// which should be imported before this script in the HTML.
// Access global firebase object for auth and firestore.
const auth = firebase.auth();
const db = firebase.firestore();

// --- Helper Functions (copied from war_page_hub.js for self-sufficiency) ---

/**
 * Formats a raw number into a human-readable string (e.g., 1.23b, 45.6m, 789k).
 * This function is needed by updateFriendlyMembersTable for the 'Total' column.
 * @param {number} num The number to format.
 * @returns {string} The formatted string.
 */
function formatBattleStats(num) {
    if (isNaN(num) || num === 0) return '0';
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'b';
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'm';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toLocaleString();
}

/**
 * Helper function to parse a stat string (which might contain 'k', 'm', 'b') into a number.
 * This is crucial for numerical comparisons in applyStatColorCoding.
 * @param {string} statString The stat value as a string (e.g., "1.2m", "500k", "123,456").
 * @returns {number} The parsed numerical value.
 */
function parseStatValue(statString) {
    if (typeof statString !== 'string' || statString.trim() === '' || statString.toLowerCase() === 'n/a') {
        return 0;
    }
    let sanitizedString = statString.toLowerCase().replace(/,/g, '');
    let multiplier = 1;
    if (sanitizedString.endsWith('k')) {
        multiplier = 1000;
        sanitizedString = sanitizedString.slice(0, -1);
    } else if (sanitizedString.endsWith('m')) {
        multiplier = 1000000;
        sanitizedString = sanitizedString.slice(0, -1);
    } else if (sanitizedString.endsWith('b')) {
        multiplier = 1000000000;
        sanitizedString = sanitizedString.slice(0, -1);
    }
    const number = parseFloat(sanitizedString);
    return isNaN(number) ? 0 : number * multiplier;
}

/**
 * Applies CSS classes to table cells based on battle stat tiers for color coding.
 * This function needs to be called after the table is populated.
 */
function applyStatColorCoding() {
    const table = document.getElementById('friendly-members-table');
    if (!table) {
        console.error("Color Coding Error: Could not find the table with ID 'friendly-members-table'.");
        return;
    }

    // Selects the Strength, Dexterity, Speed, Defense, and Total columns
    // (Indices 2, 3, 4, 5, 6 in a 0-indexed array, since Name is 0 and Last Action is 1)
    const statCells = table.querySelectorAll('tbody td:nth-child(3), tbody td:nth-child(4), tbody td:nth-child(5), tbody td:nth-child(6), tbody td:nth-child(7)');

    statCells.forEach(cell => {
        // First, remove any old stat tier classes to ensure a clean slate
        for (let i = 1; i <= 9; i++) {
            cell.classList.remove(`stat-tier-${i}`);
        }
        cell.classList.remove('stat-cell'); // Remove general class as well

        const value = parseStatValue(cell.textContent);
        let tierClass = '';

        if (value >= 500000000) {
            tierClass = 'stat-tier-9';
        } else if (value >= 200000000) {
            tierClass = 'stat-tier-8';
        } else if (value >= 100000000) {
            tierClass = 'stat-tier-7';
        } else if (value >= 10000000) {
            tierClass = 'stat-tier-6';
        } else if (value >= 5000000) {
            tierClass = 'stat-tier-5';
        } else if (value >= 1000000) {
            tierClass = 'stat-tier-4';
        } else if (value >= 100000) {
            tierClass = 'stat-tier-3';
        } else if (value >= 10000) {
            tierClass = 'stat-tier-2';
        } else if (value > 0) {
            tierClass = 'stat-tier-1';
        }

        if (tierClass) {
            cell.classList.add(tierClass);
            cell.classList.add('stat-cell'); // Add general class for stat cells
        }
    });
}

/**
 * Formats a Unix timestamp (in seconds) into a relative time string (e.g., "2 min ago", "3 days ago").
 * This function is needed by updateFriendlyMembersTable for the 'Last Action' column.
 * @param {number} timestampInSeconds Unix timestamp in seconds.
 * @returns {string} Relative time string.
 */
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


// --- Main Data Fetching and Display Function for the Table (Modified for 'Big Brother' page) ---

/**
 * Fetches and displays friendly faction members' stats in a table.
 * Includes Firestore batching for efficiency and removes the 'Revivable' column.
 * @param {string} apiKey The user's Torn API key.
 * @param {string} firebaseAuthUid The current logged-in Firebase user's UID.
 */
async function updateFriendlyMembersTable(apiKey, firebaseAuthUid) {
    const tbody = document.getElementById('friendly-members-tbody');
    if (!tbody) {
        console.error("HTML Error: Friendly members table body (tbody) not found!");
        return;
    }

    tbody.innerHTML = '<tr><td colspan="11" style="text-align:center; padding: 20px;">Loading and sorting faction member stats...</td></tr>';

    try {
        const userProfileDocRef = db.collection('userProfiles').doc(firebaseAuthUid);
        const userProfileDoc = await userProfileDocRef.get();
        if (!userProfileDoc.exists) {
            tbody.innerHTML = '<tr><td colspan="11" style="text-align:center; color: red;">Error: User profile not found.</td></tr>';
            return;
        }
        const userFactionId = userProfileDoc.data().faction_id;

        if (!userFactionId) {
            tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;">Not in a faction or Faction ID not stored.</td></tr>';
            return;
        }

        // Fetch faction members data directly from Torn API
        const factionMembersApiUrl = `https://api.torn.com/v2/faction/${userFactionId}?selections=members&key=${apiKey}&comment=MyTornPA_BigBrother_FriendlyMembers`;
        const factionResponse = await fetch(factionMembersApiUrl);
        const factionData = await factionResponse.json();

        if (!factionResponse.ok || factionData.error) {
            tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; color: red;">Error: ${factionData.error?.error || 'Torn API Error'}.</td></tr>`;
            return;
        }

        const membersArray = Object.values(factionData.members || {});
        if (membersArray.length === 0) {
            tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;">No members found in your faction.</td></tr>';
            return;
        }

        const allMemberTornIds = membersArray.map(member => String(member.user_id || member.id));
        const CHUNK_SIZE = 10; // Firestore 'in' query limit is 10
        const firestoreFetchPromises = [];
        const allMemberFirebaseData = {}; // To store all fetched Firebase data indexed by Torn ID

        // Divide member IDs into chunks and create a fetch promise for each chunk
        for (let i = 0; i < allMemberTornIds.length; i += CHUNK_SIZE) {
            const chunk = allMemberTornIds.slice(i, i + CHUNK_SIZE);
            // Ensure the IDs are actual document IDs if they were stored differently,
            // otherwise, this is correct for matching document IDs directly.
            const query = db.collection('users').where(firebase.firestore.FieldPath.documentId(), 'in', chunk);
            firestoreFetchPromises.push(query.get());
        }

        // Wait for all Firestore queries to complete
        const snapshots = await Promise.all(firestoreFetchPromises);

        // Process all snapshots and populate allMemberFirebaseData
        snapshots.forEach(snapshot => {
            snapshot.forEach(doc => {
                allMemberFirebaseData[doc.id] = doc.data();
            });
        });

        // Step 1: Process all members to get their data and calculated stats
        const processedMembers = membersArray.map((memberTornData) => {
            const memberId = String(memberTornData.user_id || memberTornData.id); // Ensure memberId is string for lookup
            if (!memberId) return null;

            const memberFirebaseData = allMemberFirebaseData[memberId] || {}; // Get data from our new combined object
            
            // Ensure stat values are parsed as numbers before calculation
            const strengthNum = parseFloat(String(memberFirebaseData.battlestats?.strength || 0).replace(/,/g, ''));
            const speedNum = parseFloat(String(memberFirebaseData.battlestats?.speed || 0).replace(/,/g, ''));
            const dexterityNum = parseFloat(String(memberFirebaseData.battlestats?.dexterity || 0).replace(/,/g, ''));
            const defenseNum = parseFloat(String(memberFirebaseData.battlestats?.defense || 0).replace(/,/g, ''));
            const totalStats = strengthNum + speedNum + dexterityNum + defenseNum;

            return { tornData: memberTornData, firebaseData: memberFirebaseData, totalStats: totalStats };
        }).filter(m => m !== null); // Filter out any null entries if IDs were missing or invalid

        // Step 2: Sort the processed members by totalStats in descending order
        processedMembers.sort((a, b) => b.totalStats - a.totalStats);

        // Step 3: Build the HTML from the sorted data
        let allRowsHtml = '';
        for (const member of processedMembers) {
            const { tornData, firebaseData, totalStats } = member;
            const memberId = tornData.user_id || tornData.id;
            const name = tornData.name || 'Unknown';
            const lastAction = tornData.last_action ? formatRelativeTime(tornData.last_action.timestamp) : 'N/A';
            const strength = (firebaseData.battlestats?.strength || 0).toLocaleString(); // format number for display
            const dexterity = (firebaseData.battlestats?.dexterity || 0).toLocaleString();
            const speed = (firebaseData.battlestats?.speed || 0).toLocaleString();
            const defense = (firebaseData.battlestats?.defense || 0).toLocaleString();
            const nerve = `${firebaseData.nerve?.current ?? 'N/A'} / ${firebaseData.nerve?.maximum ?? 'N/A'}`;
            const energy = `${firebaseData.energy?.current ?? 'N/A'} / ${firebaseData.energy?.maximum ?? 'N/A'}`;
            // Removed isRevivable logic as the column is gone.

            const drugCooldownValue = firebaseData.cooldowns?.drug ?? 0;
            let drugCooldown, drugCooldownClass = '';
            if (drugCooldownValue > 0) {
                const hours = Math.floor(drugCooldownValue / 3600);
                const minutes = Math.floor((drugCooldownValue % 3600) / 60);
                drugCooldown = `${hours > 0 ? `${hours}hr` : ''} ${minutes > 0 ? `${minutes}m` : ''}`.trim() || '<1m';
                if (drugCooldownValue > 18000) drugCooldownClass = 'status-hospital'; // Long cooldown (e.g., >5 hours)
                else if (drugCooldownValue > 7200) drugCooldownClass = 'status-other'; // Medium cooldown (e.g., >2 hours)
                else drugCooldownClass = 'status-okay'; // Short cooldown or almost none
            } else {
                drugCooldown = 'None 🍁'; // No cooldown
                drugCooldownClass = 'status-okay';
            }

            const statusState = tornData.status?.state || '';
            const originalDescription = tornData.status?.description || 'N/A';
            let formattedStatus = originalDescription;
            let statusClass = 'status-okay';
            if (statusState === 'Hospital') { 
                statusClass = 'status-hospital'; 
            } else if (statusState === 'Abroad') { 
                statusClass = 'status-abroad'; 
            } else if (statusState !== 'Okay') { 
                statusClass = 'status-other'; 
            }

            const profileUrl = `https://www.torn.com/profiles.php?XID=${memberId}`;

            allRowsHtml += `
                <tr data-id="${memberId}">
                    <td><a href="${profileUrl}" target="_blank">${name}</a></td>
                    <td>${lastAction}</td>
                    <td>${strength}</td>
                    <td>${dexterity}</td>
                    <td>${speed}</td>
                    <td>${defense}</td>
                    <td>${formatBattleStats(totalStats)}</td>
                    <td class="${statusClass}">${formattedStatus}</td>
                    <td class="nerve-text">${nerve}</td>
                    <td class="energy-text">${energy}</td>
                    <td class="${drugCooldownClass}">${drugCooldown}</td>
                    </tr>
            `;
        }

        tbody.innerHTML = allRowsHtml.length > 0 ? allRowsHtml : '<tr><td colspan="11">No members to display.</td></tr>';
        applyStatColorCoding(); // Apply colors after table is populated
    } catch (error) {
        console.error("Fatal error in updateFriendlyMembersTable:", error);
        tbody.innerHTML = `<tr><td colspan="11" style="color:red;">A fatal error occurred: ${error.message}.</td></tr>`;
    }
}


// --- Main execution block (same as before) ---
document.addEventListener('DOMContentLoaded', () => {
    let userApiKey = null;     // Will store the user's Torn API key
    let userTornProfileId = null; // Will store the user's Torn Profile ID

    auth.onAuthStateChanged(async (user) => {
        const friendlyMembersTbody = document.getElementById('friendly-members-tbody');

        if (user) {
            try {
                // Fetch the user's profile to get their API key and Torn Profile ID
                const userProfileDoc = await db.collection('userProfiles').doc(user.uid).get();
                if (userProfileDoc.exists) {
                    const userData = userProfileDoc.data();
                    userApiKey = userData.tornApiKey || null;
                    userTornProfileId = userData.tornProfileId || null;

                    if (userApiKey && userTornProfileId) {
                        console.log("Logged in and API key/Profile ID found. Populating TornPAs Big Brother table...");
                        
                        await updateFriendlyMembersTable(userApiKey, user.uid);

                        setInterval(async () => {
                            console.log("Refreshing TornPAs Big Brother table (interval)...");
                            await updateFriendlyMembersTable(userApiKey, user.uid);
                        }, 30000); // Refresh every 30 seconds (adjust as needed)
                        
                    } else {
                        console.warn("User logged in, but Torn API key or Profile ID missing in user profile. Cannot display full stats.");
                        if (friendlyMembersTbody) {
                            friendlyMembersTbody.innerHTML = '<tr><td colspan="11" style="text-align:center; color: yellow; padding: 20px;">Please provide your Torn API key and Profile ID in your settings to view faction stats.</td></tr>';
                        }
                    }
                } else {
                    console.warn("User profile document not found in Firestore for current user.");
                    if (friendlyMembersTbody) {
                        friendlyMembersTbody.innerHTML = '<tr><td colspan="11" style="text-align:center; color: yellow; padding: 20px;">User profile not found. Please ensure your account is set up correctly.</td></tr>';
                    }
                }
            } catch (error) {
                console.error("Error fetching user profile for TornPAs Big Brother page:", error);
                if (friendlyMembersTbody) {
                    friendlyMembersTbody.innerHTML = `<tr><td colspan="11" style="text-align:center; color: red; padding: 20px;">Error loading TornPAs Big Brother: ${error.message}</td></tr>`;
                }
            }
        } else {
            console.log("User not logged in. Displaying login message for TornPAs Big Brother page.");
            if (friendlyMembersTbody) {
                friendlyMembersTbody.innerHTML = '<tr><td colspan="11" style="text-align:center; padding: 20px;">Please log in to view faction member stats.</td></tr>';
            }
        }
    });
});