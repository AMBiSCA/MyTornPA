const axios = require('axios');
const admin = require('firebase-admin');

// --- 1. Configuration: Retrieve from Netlify Environment Variables ---
const TORNSTATS_API_KEY = process.env.TORN_STATS_MASTER_API_KEY; // Using your specified variable name
const TORN_API_KEY = process.env.TORN_API_KEY; // Torn API key is still here but not used in this specific function anymore, can be removed if not needed elsewhere

// --- Firebase Initialization (Modified for Base64 Credentials) ---
const FIREBASE_CREDENTIALS_BASE64 = process.env.FIREBASE_CREDENTIALS_BASE64;

if (admin.apps.length === 0) {
    try {
        if (!FIREBASE_CREDENTIALS_BASE64) {
            const errorMsg = "CRITICAL: FIREBASE_CREDENTIALS_BASE64 environment variable is NOT SET. Cannot initialize Firebase Admin SDK.";
            console.error(errorMsg);
            throw new Error(errorMsg);
        }

        const decodedCredentialsJson = Buffer.from(FIREBASE_CREDENTIALS_BASE64, 'base64').toString('utf8');
        const serviceAccount = JSON.parse(decodedCredentialsJson);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin SDK initialized successfully in Netlify Function using Base64 credentials.");
    } catch (error) {
        console.error("ERROR: Firebase initialization failed using Base64 credentials. Details:", error);
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
 * Fetches spy reports for a list of players (a batch) and saves them to Firebase.
 * @param {string} factionName - The name of the faction being processed (for logging).
 * @param {number} currentFactionId - The ID of the current faction being processed. // NEW PARAMETER
 * @param {number[]} idsToProcessBatch - An array of player IDs for the current batch.
 * @returns {object} Summary of processed players in this batch.
 * @throws {Error} if TornStats API Key is missing.
 */
async function fetchAndSaveBatch(factionName, currentFactionId, idsToProcessBatch) { // ADDED currentFactionId
    if (!Array.isArray(idsToProcessBatch) || idsToProcessBatch.length === 0) {
        console.log(`\nNo valid player IDs in this batch for faction ${factionName}.`);
        return { success: false, message: "No player IDs in batch.", processedSummary: { successCount: 0, skippedCount: 0, errorCount: 0, errorDetails: [] } };
    }
    console.log(`\n[process-spy-batch] Starting to fetch data for ${idsToProcessBatch.length} players from TornStats for faction ${factionName} (100ms delay per player)...`);
    console.log(`[process-spy-batch] IDs to send to TornStats in this batch: ${idsToProcessBatch.join(', ')}`);

    const processedSummary = {
        successCount: 0,
        skippedCount: 0,
        errorCount: 0,
        errorDetails: []
    };

    if (!TORNSTATS_API_KEY) {
        const reason = "[CRITICAL] TORNSTATS_API_KEY is not set. Cannot fetch spy reports. Please configure it in Netlify Environment Variables.";
        console.error(reason);
        processedSummary.errorCount = idsToProcessBatch.length;
        processedSummary.errorDetails.push({ id: "N/A", reason: reason });
        throw new Error(reason);
    }

    for (const player_id of idsToProcessBatch) {
        if (isNaN(player_id) || player_id <= 0) {
            console.log(`[INFO] process-spy-batch: Skipping invalid player ID: ${player_id}`);
            processedSummary.skippedCount++;
            continue;
        }

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
                    effective_total: getNumericOrDefault(spy_data, 'effective_total'),
                    faction_id: parseInt(currentFactionId) // <--- ADDED THIS LINE: Saving the faction ID
                }, { merge: true }); // Use merge: true to avoid overwriting other fields if they exist

                console.log(`[SUCCESS] process-spy-batch: Saved data for: ${spy_data.player_name} (${player_id}) in faction ${currentFactionId}`); // Added faction ID to log
                processedSummary.successCount++;
            } else {
                const reason = `TornStats spy status was not true or data was missing. Response: ${JSON.stringify(response.data)}`;
                console.log(`[INFO] process-spy-batch: Skipping player ${player_id}. Reason: ${reason}`);
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
                console.error(`[CRITICAL] process-spy-batch: An error occurred processing ID ${player_id} with TornStats API: ${error.message}`);
                if (error.response?.data?.error) {
                    reason = `TornStats API Error: ${error.response.data.error.code} - ${error.response.data.error.error}`;
                }
            }
            console.error(`[CRITICAL] process-spy-batch: Skipping player ${player_id}. Reason: ${reason}`);
            processedSummary.errorCount++;
            processedSummary.errorDetails.push({ id: player_id, reason: reason });
        }

        // Pause for 100 milliseconds between API calls
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log("\n[process-spy-batch] Batch data fetching process complete.");
    return { success: true, processedSummary: processedSummary };
}


// Netlify Function Handler
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
        console.error("[process-spy-batch] Error parsing request body:", e);
        return {
            statusCode: 400,
            body: JSON.stringify({ success: false, message: "Invalid JSON in request body." })
        };
    }

    // Expecting factionId, factionName, memberIDs (full list), startIndex, batchSize
    const { factionId, factionName, memberIDs, startIndex, batchSize } = requestBody;

    if (!factionId || isNaN(factionId) || parseInt(factionId) <= 0 ||
        !factionName || !Array.isArray(memberIDs) || memberIDs.length === 0 ||
        isNaN(startIndex) || startIndex < 0 ||
        isNaN(batchSize) || batchSize <= 0) {
        return {
            statusCode: 400,
            body: JSON.stringify({ success: false, message: "Missing or invalid parameters in request body. Required: factionId, factionName, memberIDs (array), startIndex, batchSize." })
        };
    }

    console.log(`[process-spy-batch] Function triggered for Faction ID: ${factionId} (Batch: ${startIndex} to ${startIndex + batchSize}).`);

    try {
        const currentBatchIDs = memberIDs.slice(startIndex, startIndex + batchSize);
        // Pass currentFactionId to fetchAndSaveBatch
        const result = await fetchAndSaveBatch(factionName, factionId, currentBatchIDs); // Pass factionId to fetchAndSaveBatch

        const nextStartIndex = startIndex + currentBatchIDs.length;
        const isComplete = nextStartIndex >= memberIDs.length;

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                success: result.success,
                message: result.message || `Processed batch for Faction ${factionName}.`,
                factionName: factionName,
                totalMembersInFaction: memberIDs.length,
                processedThisBatchCount: currentBatchIDs.length,
                processedSummary: result.processedSummary,
                nextStartIndex: nextStartIndex,
                isComplete: isComplete
            })
        };
    } catch (error) {
        console.error("[process-spy-batch] Error in Netlify Function:", error);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                success: false,
                message: "Internal server error during batch processing.",
                details: error.message
            })
        };
    }
};