const axios = require('axios');
const admin = require('firebase-admin');

// --- 1. Configuration: EDIT THESE DETAILS ---
const TORNSTATS_API_KEY = "TS_mv5civbARKIxCoRj";

// --- Torn API Key and Faction ID Configuration ---
const TORN_API_KEY = "gCNmxrHxlOYeNiS7"; // Your actual Torn API Key
const FACTION_IDS_TO_SCAN = [
    50423,
    52018
    // Add more active faction IDs here if needed
];
// --- END Configuration ---


// --- Firebase Initialization ---
if (admin.apps.length === 0) {
    const serviceAccount = require('./credentials.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();
console.log("Successfully connected to Firebase.");
// --- End Firebase Initialization ---

/**
 * Safely gets a numeric value from an object, defaulting to 0 if null or undefined.
 * @param {object} sourceObject - The object to read from.
 * @param {string} key - The key of the property to get.
 * @returns {number} The numeric value, or 0 if undefined/null.
 */
function getNumericOrDefault(sourceObject, key) {
    const value = sourceObject[key];
    return (value === undefined || value === null) ? 0 : value;
}


/**
 * Fetches members for a given faction ID using the Torn API.
 */
async function getFactionMembers(factionID) {
    const url = `https://api.torn.com/v2/faction/${factionID}?selections=members&key=${TORN_API_KEY}`;
    console.log(`  [DEBUG] Attempting to fetch from Torn API: ${url}`);
    try {
        const response = await axios.get(url);
        
        console.log(`  [DEBUG] Torn API Raw Response for Faction ${factionID}:`, JSON.stringify(response.data, null, 2));

        if (response.data && Array.isArray(response.data.members)) {
            // Map over the array of member objects to get their 'id'
            const memberIDs = response.data.members.map(member => member.id);
            console.log(`  [DEBUG] Found ${memberIDs.length} members for faction ${factionID}.`);
            return memberIDs;
        } else {
            console.log(`  [INFO] No members data found for faction ${factionID}. Response structure might be unexpected or faction is empty.`);
            return [];
        }
    } catch (error) {
        if (error.response) {
            console.error(`  [CRITICAL] Error fetching faction ${factionID} from Torn API (Status: ${error.response.status}): ${error.message}`);
            if (error.response.data && error.response.data.error) {
                 console.error(`  [CRITICAL] Torn API Error Details: Code ${error.response.data.error.code} - ${error.response.data.error.error}`);
            }
        } else if (error.request) {
            console.error(`  [CRITICAL] No response received for Torn API faction ${factionID} request: ${error.message}`);
        } else {
            console.error(`  [CRITICAL] Request setup error for Torn API faction ${factionID}: ${error.message}`);
        }
        return [];
    }
}

/**
 * Generates a list of player IDs by scanning members of specified factions.
 */
async function generateFactionBasedIDs() {
    console.log("\nStarting faction-based ID generation...");
    let allPlayerIDs = new Set();
    for (const fID of FACTION_IDS_TO_SCAN) {
        console.log(`  Fetching members for faction ${fID}...`);
        const members = await getFactionMembers(fID);
        // Only add valid numbers, filter out any non-numeric results
        members.filter(id => !isNaN(id) && id > 0).forEach(id => allPlayerIDs.add(id));
        
        // Be mindful of Torn API rate limits (100 requests per minute by default)
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    const finalPlayerIDs = Array.from(allPlayerIDs);
    console.log(`Generated ${finalPlayerIDs.length} unique player IDs from factions to process.`);
    return finalPlayerIDs;
}


/**
 * Main function to fetch spy reports for a list of players and save them to Firebase.
 */
async function fetchAndSave(idsToProcess) {
    if (!Array.isArray(idsToProcess) || idsToProcess.length === 0) {
        console.log("\nNo valid player IDs were obtained from faction scan. Exiting.");
        setTimeout(() => process.exit(0), 1000);
        return;
    }
    console.log(`\nStarting to fetch data for ${idsToProcess.length} players from TornStats (1 per second)...`);
    console.log(`  [DEBUG] IDs to send to TornStats: ${idsToProcess.slice(0, 10).join(', ')}${idsToProcess.length > 10 ? ', ...' : ''}`);

    for (const player_id of idsToProcess) {
        if (isNaN(player_id) || player_id <= 0) {
             console.log(`  [INFO] Skipping invalid player ID: ${player_id}`);
             continue;
        }

        const url = `https://www.tornstats.com/api/v2/${TORNSTATS_API_KEY}/spy/user/${player_id}`;

        try {
            const response = await axios.get(url);

            if (response.status === 200 && response.data?.spy?.status === true) {
                const spy_data = response.data.spy;
                const playerRef = db.collection('players').doc(String(player_id));

                await playerRef.set({
                    player_id: parseInt(player_id),
                    player_name: spy_data.player_name,
                    strength: spy_data.strength,
                    defense: spy_data.defense,
                    speed: spy_data.speed,
                    dexterity: spy_data.dexterity,
                    total: spy_data.total,
                    spy_timestamp: spy_data.timestamp,
                    last_updated: new Date(),
                    // --- MODIFIED: Use getNumericOrDefault for effective stats ---
                    effective_strength: getNumericOrDefault(spy_data, 'effective_strength'),
                    effective_defense: getNumericOrDefault(spy_data, 'effective_defense'),
                    effective_speed: getNumericOrDefault(spy_data, 'effective_speed'),
                    effective_dexterity: getNumericOrDefault(spy_data, 'effective_dexterity'),
                    effective_total: getNumericOrDefault(spy_data, 'effective_total')
                    // --------------------------------------------------------
                });
                
                console.log(`  [SUCCESS] Saved data for: ${spy_data.player_name} (${player_id})`);
            } else {
                 console.log(`  [INFO] Skipping player ${player_id}. Reason: TornStats spy status was not true or data was missing.`);
            }
        } catch (error) {
            if (error.response?.status === 404) {
                 console.log(`  [INFO] Skipping player ${player_id}. Reason: No spy report found on TornStats.`);
            } else if (error.response?.status === 400 && error.response?.data?.error?.code === 10) {
                 console.log(`  [INFO] Skipping player ${player_id}. Reason: TornStats API Key is invalid or rate-limited for this call.`);
            } else {
                console.error(`  [CRITICAL] An error occurred processing ID ${player_id} with TornStats API: ${error.message}`);
                if (error.response?.data?.error) {
                     console.error(`  [CRITICAL] TornStats API Error: ${error.response.data.error.code} - ${error.response.data.error.error}`);
                }
            }
        }

        // Pause for 1 second to be respectful to the TornStats API
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log("\nData fetching process complete.");
    setTimeout(() => process.exit(0), 1000);
}


/**
 * Controls the script's execution
 */
async function main() {
    // FORCE IT TO DO THE FACTION ID SEARCH FIRST
    const factionMemberIDs = await generateFactionBasedIDs();

    // THEN DO THE NEXT BIT AFTER, USING THE IDs OBTAINED FROM FACTIONS
    await fetchAndSave(factionMemberIDs);
}

// --- Run the script ---
main();