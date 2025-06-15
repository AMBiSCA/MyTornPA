const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

// Initialize Firebase Admin SDK if not already initialized
// Cloud Functions automatically pick up credentials when deployed
if (admin.apps.length === 0) {
    admin.initializeApp();
}
const db = admin.firestore();

// --- Configuration for TornStats API Key ---
// IMPORTANT: This key MUST be set as an environment variable in Firebase Functions
// Use the command: firebase functions:config:set tornstats.api_key="TS_mv5civbARKIxCoRj"
const TORNSTATS_API_KEY = functions.config().tornstats.api_key;

// --- Helper function from your script ---
function getNumericOrDefault(sourceObject, key) {
    const value = sourceObject[key];
    return (value === undefined || value === null) ? 0 : value;
}

/**
 * HTTP Cloud Function to fetch TornStats spy reports for provided player IDs.
 * This function will be triggered by a POST request from your website.
 *
 * IMPORTANT: Set 'Access-Control-Allow-Origin' to your website's exact domain for CORS.
 */
// --- CRITICAL: Explicitly define region for onRequest to force 1st Gen ---
exports.processPlayerIDs = functions.region('us-central1').https.onRequest(async (req, res) => {
// --- END CRITICAL CHANGE ---
    // --- CORS Configuration: Set your website's exact domain here! ---
    // Make sure 'https://mytcpersonalassistant.netlify.app' matches your live domain.
    res.set('Access-Control-Allow-Origin', 'https://mytcpersonalassistant.netlify.app'); 

    // Handle preflight OPTIONS requests for CORS
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.set('Access-Control-Max-Age', '3600');
        return res.status(204).send('');
    }

    // Expecting an array of player IDs in the request body
    const playerIDs = req.body.playerIDs;

    if (!Array.isArray(playerIDs) || playerIDs.length === 0) {
        console.log("No player IDs provided in the request body.");
        return res.status(400).send('Please provide an array of player IDs in the request body.');
    }

    console.log(`Received request to process ${playerIDs.length} player IDs.`);
    const results = []; // To store results or errors for feedback to the website

    for (const player_id of playerIDs) {
        if (isNaN(player_id) || player_id <= 0) {
            console.log(`Skipping invalid player ID: ${player_id}`);
            results.push({ id: player_id, status: 'skipped', reason: 'Invalid ID' });
            continue;
        }

        // --- FIXED URL: Use backticks for template literals ---
        const url = `https://www.tornstats.com/api/v2/${TORNSTATS_API_KEY}/spy/user/${player_id}`;

        try {
            const response = await axios.get(url);

            if (response.status === 200 && response.data?.spy?.status === true) {
                const spy_data = response.data.spy;
                const playerRef = db.collection('players').doc(String(player_id)); // Firestore collection 'players'

                const dataToSave = {
                    player_id: parseInt(player_id),
                    player_name: spy_data.player_name,
                    strength: spy_data.strength,
                    defense: spy_data.defense,
                    speed: spy_data.speed,
                    dexterity: spy_data.dexterity,
                    total: spy_data.total,
                    spy_timestamp: spy_data.timestamp,
                    last_updated: admin.firestore.FieldValue.serverTimestamp(), // Use server timestamp
                    effective_strength: getNumericOrDefault(spy_data, 'effective_strength'),
                    effective_defense: getNumericOrDefault(spy_data, 'effective_defense'),
                    effective_speed: getNumericOrDefault(spy_data, 'effective_speed'),
                    effective_dexterity: getNumericOrDefault(spy_data, 'effective_dexterity'),
                    effective_total: getNumericOrDefault(spy_data, 'effective_total')
                };

                await playerRef.set(dataToSave, { merge: true });
                
                // --- FIXED CONSOLE LOG: Use backticks for template literals ---
                console.log(`[SUCCESS] Saved data for: ${spy_data.player_name} (${player_id})`);
                results.push({ id: player_id, status: 'success', name: spy_data.player_name });
            } else {
                console.log(`[INFO] Skipping player ${player_id}. Reason: TornStats spy status was not true or data was missing.`);
                results.push({ id: player_id, status: 'skipped', reason: 'No valid TornStats spy report' });
            }
        } catch (error) {
            let reason = 'An unknown error occurred with TornStats API';
            if (error.response?.status === 404) {
                reason = 'No spy report found on TornStats';
            } else if (error.response?.status === 400 && error.response?.data?.error?.code === 10) {
                reason = 'TornStats API Key is invalid or rate-limited';
            } else if (error.message) {
                reason = error.message;
            }
            console.error(`[CRITICAL] Error processing ID ${player_id} with TornStats API: ${reason}`);
            results.push({ id: player_id, status: 'error', reason: reason });
        }
    }

    return res.status(200).json({
        message: 'Processing complete',
        results: results
    });
});