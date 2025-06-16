const axios = require('axios');
const admin = require('firebase-admin');

// --- 1. Configuration: Retrieve from Netlify Environment Variables ---
const TORNSTATS_API_KEY = process.env.TORN_STATS_MASTER_API_KEY; // Using your specified variable name
const TORN_API_KEY = process.env.TORN_API_KEY;

// --- Firebase Initialization (Modified for Base64 Credentials) ---
// Retrieve the single base64 encoded string from Netlify Environment Variable
const FIREBASE_CREDENTIALS_BASE64 = process.env.FIREBASE_CREDENTIALS_BASE64;

if (admin.apps.length === 0) {
    try {
        if (!FIREBASE_CREDENTIALS_BASE64) {
            const errorMsg = "CRITICAL: FIREBASE_CREDENTIALS_BASE64 environment variable is NOT SET. Cannot initialize Firebase Admin SDK.";
            console.error(errorMsg);
            throw new Error(errorMsg); // Propagate error
        }

        // Decode the base64 string back to JSON
        // Buffer is a Node.js global available in Netlify Functions
        const decodedCredentialsJson = Buffer.from(FIREBASE_CREDENTIALS_BASE64, 'base64').toString('utf8');
        const serviceAccount = JSON.parse(decodedCredentialsJson);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin SDK initialized successfully in Netlify Function using Base64 credentials.");
    } catch (error) {
        console.error("ERROR: Firebase initialization failed using Base64 credentials. Details:", error);
        // Re-throw to stop function execution as database access is critical
        throw new Error(`Firebase initialization failed due to invalid service account configuration from Base64: ${error.message}`);
    }
}
const db = admin.firestore();
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
 * Fetches faction name and members for a given faction ID using the Torn API.
 * @param {number} factionID - The ID of the faction to fetch.
 * @returns {object} An object containing factionName and an array of member IDs.
 * @throws {Error} if Torn API Key is missing or API call fails.
 */
async function getFactionInfoAndMembers(factionID) {
    if (!TORN_API_KEY) {
        const errorMsg = "[CRITICAL] TORN_API_KEY is not set. Cannot fetch faction members. Please configure it in Netlify Environment Variables.";
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    const url = `https://api.torn.com/v2/faction/${factionID}?selections=basic,members&key=${TORN_API_KEY}`;
    console.log(`  [DEBUG] Attempting to fetch from Torn API: ${url}`);
    try {
        const response = await axios.get(url);

        if (response.data) {
            const factionName = response.data.name || `Faction ${factionID}`;
            let memberIDs = [];

            if (response.data.members) {
                if (Array.isArray(response.data.members)) {
                    memberIDs = response.data.members.map(member => member.id);
                } else if (typeof response.data.members === 'object') {
                    // Common Torn API pattern: members object where keys are IDs
                    memberIDs = Object.keys(response.data.members).map(Number).filter(id => !isNaN(id) && id > 0);
                }
            }

            console.log(`  [DEBUG] Found ${memberIDs.length} members for faction ${factionID} (${factionName}).`);
            return { factionName, memberIDs };
        } else {
            const infoMsg = `  [INFO] No data found for faction ${factionID}. Response structure might be unexpected or faction is empty.`;
            console.log(infoMsg);
            return { factionName: `Faction ${factionID}`, memberIDs: [] }; // Return empty, not throw
        }

    } catch (error) {
        let errorMessage = error.message;
        if (error.response) {
            errorMessage = `Error fetching faction ${factionID} from Torn API (Status: ${error.response.status}): ${error.message}`;
            if (error.response.data && error.response.data.error) {
                   errorMessage += ` Torn API Error Details: Code ${error.response.data.error.code} - ${error.response.data.error.error}`;
            }
        } else if (error.request) {
            errorMessage = `No response received for Torn API faction ${factionID} request: ${error.message}`;
        } else {
            errorMessage = `Request setup error for Torn API faction ${factionID}: ${error.message}`;
        }
        console.error(`  [CRITICAL] ${errorMessage}`);
        throw new Error(errorMessage); // Re-throw to indicate failure to the caller
    }
}


/**
 * Main function to fetch spy reports for a list of players and save them to Firebase.
 * @param {string} factionName - The name of the faction being processed.
 * @param {number[]} idsToProcess - An array of player IDs to fetch and save.
 * @returns {object} Summary of processed players.
 * @throws {Error} if TornStats API Key is missing or API call fails for critical reasons.
 */
async function fetchAndSave(factionName, idsToProcess) {
    if (!Array.isArray(idsToProcess) || idsToProcess.length === 0) {
        console.log(`\nNo valid player IDs to process for faction ${factionName}.`);
        return { success: false, message: "No player IDs to process.", processedSummary: { successCount: 0, skippedCount: 0, errorCount: 0, errorDetails: [] } };
    }
    console.log(`\nStarting to fetch data for ${idsToProcess.length} players from TornStats for faction ${factionName} (1 per second)...`);
    console.log(`  [DEBUG] IDs to send to TornStats: ${idsToProcess.slice(0, 10).join(', ')}${idsToProcess.length > 10 ? ', ...' : ''}`);

    const processedSummary = {
        successCount: 0,
        skippedCount: 0,
        errorCount: 0,
        errorDetails: []
    };

    if (!TORNSTATS_API_KEY) {
        const reason = "TORNSTATS_API_KEY is not set. Cannot fetch spy reports. Please configure it in Netlify Environment Variables.";
        console.error(`[CRITICAL] ${reason}`);
        // If API key is missing, all attempts will fail. Report as errors for clarity.
        processedSummary.errorCount = idsToProcess.length;
        processedSummary.errorDetails.push({ id: "N/A", reason: reason });
        throw new Error(reason); // Critical failure, stop processing
    }


    for (const player_id of idsToProcess) {
        if (isNaN(player_id) || player_id <= 0) {
               console.log(`  [INFO] Skipping invalid player ID: ${player_id}`);
               processedSummary.skippedCount++;
               continue;
        }

        // Use a consistent collection name here. From your frontend code, you use 'playerdatabase'.
        // Make sure this matches your Firestore security rules.
        const playerRef = db.collection('playerdatabase').doc(String(player_id));
        const url = `https://www.tornstats.com/api/v2/${TORNSTATS_API_KEY}/spy/user/${player_id}`;

        try {
            const response = await axios.get(url);

            if (response.status === 200 && response.data?.spy?.status === true) {
                const spy_data = response.data.spy;
                
                await playerRef.set({
                    player_id: parseInt(player_id),
                    player_name: spy_data.player_name,
                    strength: getNumericOrDefault(spy_data, 'strength'),
                    defense: getNumericOrDefault(spy_data, 'defense'),
                    speed: getNumericOrDefault(spy_data, 'speed'),
                    dexterity: getNumericOrDefault(spy_data, 'dexterity'),
                    total: getNumericOrDefault(spy_data, 'total'),
                    spy_timestamp: spy_data.timestamp,
                    last_updated: admin.firestore.FieldValue.serverTimestamp(),
                    effective_strength: getNumericOrDefault(spy_data, 'effective_strength'),
                    effective_defense: getNumericOrDefault(spy_data, 'effective_defense'),
                    effective_speed: getNumericOrDefault(spy_data, 'effective_speed'),
                    effective_dexterity: getNumericOrDefault(spy_data, 'effective_dexterity'),
                    effective_total: getNumericOrDefault(spy_data, 'effective_total')
                }, { merge: true }); // Use merge: true to avoid overwriting other fields if they exist

                console.log(`  [SUCCESS] Saved data for: ${spy_data.player_name} (${player_id})`);
                processedSummary.successCount++;
            } else {
                   const reason = `TornStats spy status was not true or data was missing. Response: ${JSON.stringify(response.data)}`;
                   console.log(`  [INFO] Skipping player ${player_id}. Reason: ${reason}`);
                   processedSummary.skippedCount++;
                   processedSummary.errorDetails.push({ id: player_id, reason: reason });
            }
        } catch (error) {
            let reason = `Unknown error: ${error.message}`;
            if (error.response?.status === 404) {
                   reason = `No spy report found on TornStats.`;
            } else if (error.response?.status === 400 && error.response?.data?.error?.code === 10) {
                   reason = `TornStats API Key is invalid or rate-limited for this call.`;
            } else {
                console.error(`  [CRITICAL] An error occurred processing ID ${player_id} with TornStats API: ${error.message}`);
                if (error.response?.data?.error) {
                       reason = `TornStats API Error: ${error.response.data.error.code} - ${error.response.data.error.error}`;
                }
            }
            console.error(`  [CRITICAL] Skipping player ${player_id}. Reason: ${reason}`);
            processedSummary.errorCount++;
            processedSummary.errorDetails.push({ id: player_id, reason: reason });
        }

        // Pause for 1 second to be respectful to the TornStats API
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log("\nData fetching process complete.");
    return { success: true, processedSummary: processedSummary };
}


// --- Netlify Function Handler ---
exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed. Only POST requests are allowed.' })
        };
    }

    let requestBody;
    try {
        requestBody = JSON.parse(event.body);
    } catch (e) {
        console.error("Error parsing request body:", e);
        return {
            statusCode: 400,
            body: JSON.stringify({ success: false, message: "Invalid JSON in request body." })
        };
    }

    const factionId = requestBody.factionId;

    if (!factionId || isNaN(factionId) || parseInt(factionId) <= 0) {
        return {
            statusCode: 400,
            body: JSON.stringify({ success: false, message: "Missing or invalid 'factionId' in request body. Must be a positive integer." })
        };
    }

    console.log(`Netlify Function 'populate-torn-data' triggered for Faction ID: ${factionId}.`);

    try {
        const { factionName, memberIDs } = await getFactionInfoAndMembers(parseInt(factionId));

        if (memberIDs.length === 0) {
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    success: true,
                    message: `No members found for Faction ${factionId} (${factionName}).`,
                    factionName: factionName,
                    totalMembersFound: 0,
                    processedSummary: { successCount: 0, skippedCount: 0, errorCount: 0, errorDetails: [] }
                })
            };
        }

        const result = await fetchAndSave(factionName, memberIDs);

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                success: result.success,
                message: result.message || `Processed ${result.processedSummary.successCount} members for Faction ${factionName}.`,
                factionName: factionName,
                totalMembersFound: memberIDs.length, // Total members found from Torn API (before spy attempts)
                processedSummary: result.processedSummary // Detailed spy processing summary
            })
        };
    } catch (error) {
        console.error("Error in Netlify Function 'populate-torn-data':", error);
        // Return a 500 with a more detailed message if possible, but avoid sensitive data
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                success: false,
                message: "Internal server error during data population.",
                details: error.message // Include error details for debugging
            })
        };
    }
};