const axios = require('axios');
const admin = require('firebase-admin');

// --- 1. Configuration: Retrieve from Netlify Environment Variables ---
const TORNSTATS_API_KEY = process.env.TORN_STATS_MASTER_API_KEY;
const TORN_API_KEY = process.env.TORN_API_KEY;

// Reconstruct Firebase Service Account from individual environment variables
const FIREBASE_SERVICE_ACCOUNT = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN
};


// --- Firebase Initialization ---
if (admin.apps.length === 0) {
    try {
        if (!FIREBASE_SERVICE_ACCOUNT.private_key || !FIREBASE_SERVICE_ACCOUNT.client_email || !FIREBASE_SERVICE_ACCOUNT.project_id) {
            console.error("Firebase Service Account Missing Components:", {
                private_key: !!FIREBASE_SERVICE_ACCOUNT.private_key,
                client_email: !!FIREBASE_SERVICE_ACCOUNT.client_email,
                project_id: !!FIREBASE_SERVICE_ACCOUNT.project_id
            });
            throw new Error("Missing essential Firebase service account environment variables for initialization.");
        }
        admin.initializeApp({
            credential: admin.credential.cert(FIREBASE_SERVICE_ACCOUNT)
        });
        console.log("Firebase Admin SDK initialized successfully in Netlify Function.");
    } catch (error) {
        console.error("ERROR: Firebase initialization failed. Check environment variables and their values. Details:", error);
        throw new Error("Firebase initialization failed due to invalid service account configuration.");
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
 */
async function getFactionInfoAndMembers(factionID) {
    if (!TORN_API_KEY) {
        console.error("[CRITICAL] TORN_API_KEY is not set. Cannot fetch faction members.");
        return { factionName: 'Unknown Faction', memberIDs: [] };
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
                    memberIDs = Object.keys(response.data.members).map(Number).filter(id => !isNaN(id) && id > 0);
                }
            }

            console.log(`  [DEBUG] Found ${memberIDs.length} members for faction ${factionID} (${factionName}).`);
            return { factionName, memberIDs };
        } else {
            console.log(`  [INFO] No data found for faction ${factionID}. Response structure might be unexpected.`);
            return { factionName: `Faction ${factionID}`, memberIDs: [] };
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
        throw new Error(errorMessage); // Re-throw to indicate failure
    }
}


/**
 * Main function to fetch spy reports for a list of players and save them to Firebase.
 * @param {string} factionName - The name of the faction being processed.
 * @param {number[]} idsToProcess - An array of player IDs to fetch and save.
 * @returns {object} Summary of processed players.
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
        processedSummary.errorCount = idsToProcess.length; // Count all as errors
        processedSummary.errorDetails.push({ id: "N/A", reason: reason });
        return { success: false, message: reason, processedSummary: processedSummary };
    }


    for (const player_id of idsToProcess) {
        if (isNaN(player_id) || player_id <= 0) {
               console.log(`  [INFO] Skipping invalid player ID: ${player_id}`);
               processedSummary.skippedCount++;
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
                }, { merge: true });

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
            body: JSON.stringify({ success: false, message: "Missing or invalid 'factionId' in request body." })
        };
    }

    console.log(`Netlify Function 'populate-torn-data' triggered for Faction ID: ${factionId}.`);

    try {
        const { factionName, memberIDs } = await getFactionInfoAndMembers(parseInt(factionId));

        if (memberIDs.length === 0) {
            return {
                statusCode: 200,
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
                totalMembersFound: memberIDs.length,
                processedSummary: result.processedSummary
            })
        };
    } catch (error) {
        console.error("Error in Netlify Function 'populate-torn-data':", error);
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                success: false,
                message: "Internal server error during data population.",
                details: error.message
            })
        };
    }
};