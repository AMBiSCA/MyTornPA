const axios = require('axios');
const admin = require('firebase-admin');

// --- 1. Configuration: Retrieve from Netlify Environment Variables ---
// IMPORTANT: Ensure these keys match what you set in Netlify Environment variables
const TORNSTATS_API_KEY = process.env.TORN_STATS_MASTER_API_KEY; // <--- Corrected to match your Netlify variable name
const TORN_API_KEY = process.env.TORN_API_KEY;

// Reconstruct Firebase Service Account from individual environment variables
const FIREBASE_SERVICE_ACCOUNT = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    // CRITICAL: Replace '\\n' with '\n' to correctly form the private key
    private_key: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
    universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN
};


const FACTION_IDS_TO_SCAN = [
    50423,
    52018
    // Add more active faction IDs here if needed
];
// --- END Configuration ---


// --- Firebase Initialization ---
if (admin.apps.length === 0) {
    try {
        // Check if essential service account components are present before initializing
        if (!FIREBASE_SERVICE_ACCOUNT.private_key || !FIREBASE_SERVICE_ACCOUNT.client_email || !FIREBASE_SERVICE_ACCOUNT.project_id) {
            // Log missing components for debugging
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
        // Rethrow to stop function execution as database access is critical
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
 * Fetches members for a given faction ID using the Torn API.
 * Handles both array and object formats for members data.
 */
async function getFactionMembers(factionID) {
    if (!TORN_API_KEY) {
        console.error("[CRITICAL] TORN_API_KEY is not set. Cannot fetch faction members. Please configure it in Netlify Environment Variables.");
        return [];
    }

    const url = `https://api.torn.com/v2/faction/${factionID}?selections=members&key=${TORN_API_KEY}`;
    console.log(`  [DEBUG] Attempting to fetch from Torn API: ${url}`);
    try {
        const response = await axios.get(url);

        if (response.data && response.data.members) {
            if (Array.isArray(response.data.members)) {
                const memberIDs = response.data.members.map(member => member.id);
                console.log(`  [DEBUG] Found ${memberIDs.length} members (array) for faction ${factionID}.`);
                return memberIDs;
            } else if (typeof response.data.members === 'object') {
                // When 'members' is an object, keys are member IDs and values are member details
                const memberIDs = Object.keys(response.data.members).map(Number).filter(id => !isNaN(id) && id > 0);
                console.log(`  [DEBUG] Found ${memberIDs.length} members (object keys) for faction ${factionID}.`);
                return memberIDs;
            }
        }
        console.log(`  [INFO] No valid members data found for faction ${factionID}. Response structure might be unexpected or faction is empty.`);
        return [];

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
        members.filter(id => !isNaN(id) && id > 0).forEach(id => allPlayerIDs.add(id));

        // Be mindful of Torn API rate limits (100 requests per minute by default)
        await new Promise(resolve => setTimeout(resolve, 500)); // Add a small delay
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
        return { success: false, message: "No player IDs to process." };
    }
    console.log(`\nStarting to fetch data for ${idsToProcess.length} players from TornStats (1 per second)...`);
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
                    last_updated: admin.firestore.FieldValue.serverTimestamp(), // Use server timestamp for accuracy
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
// This is the main entry point for your Netlify Function
exports.handler = async (event, context) => {
    // Ensure only POST requests are allowed for this operation
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed. Only POST requests are allowed.' })
        };
    }

    console.log("Netlify Function 'populate-torn-data' triggered.");

    try {
        // Authenticate or authorize the request if needed
        // For example, you might check for a specific header or user role
        // if (!context.clientContext.user) {
        //     return {
        //         statusCode: 401,
        //         body: JSON.stringify({ message: 'Authentication required to trigger this function.' })
        //     });
        // }

        const factionMemberIDs = await generateFactionBasedIDs();
        const result = await fetchAndSave(factionMemberIDs);

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json" // Important for correct frontend parsing
            },
            body: JSON.stringify(result) // Send the result back as JSON
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
                details: error.message // Include error details for debugging
            })
        };
    }
};