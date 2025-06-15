const axios = require('axios');
const admin = require('firebase-admin');

// --- Firebase Admin SDK Initialization ---
// The private key is now reassembled from multiple environment variables
const privateKey = process.env.FIRESTORE_PRIVATE_KEY_PART1 +
                   process.env.FIRESTORE_PRIVATE_KEY_PART2 +
                   process.env.FIRESTORE_PRIVATE_KEY_PART3; // Add more parts if you split it further

if (admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIRESTORE_PROJECT_ID,
            clientEmail: process.env.FIRESTORE_CLIENT_EMAIL,
            privateKey: privateKey.replace(/\\n/g, '\n'), // Replace escaped newlines
        }),
    });
}
const db = admin.firestore();

// --- TornStats API Key ---
// IMPORTANT: Set this as a Netlify Environment Variable for security!
// Name it TORNSTATS_API_KEY in your Netlify site settings.
const TORNSTATS_API_KEY = process.env.TORNSTATS_API_KEY;

// --- Helper function from your script ---
function getNumericOrDefault(sourceObject, key) {
    const value = sourceObject[key];
    return (value === undefined || value === null) ? 0 : value;
}

/**
 * Netlify Function handler to fetch TornStats spy reports for provided player IDs.
 * This function will be triggered by a POST request from your website.
 *
 * Netlify Functions handle CORS automatically.
 */
exports.handler = async (event, context) => { // Netlify functions use 'handler'
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: 'Method Not Allowed',
            headers: { 'Allow': 'POST' },
        };
    }

    // Parse the request body
    let playerIDs;
    try {
        const body = JSON.parse(event.body);
        playerIDs = body.playerIDs;
    } catch (error) {
        console.error("Error parsing request body:", error);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Invalid JSON in request body' }),
        };
    }

    if (!Array.isArray(playerIDs) || playerIDs.length === 0) {
        console.log("No player IDs provided in the request body.");
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Please provide an array of player IDs in the request body.' }),
        };
    }

    console.log(`Received request to process ${playerIDs.length} player IDs.`);
    const results = []; // To store results or errors for feedback to the website

    for (const player_id of playerIDs) {
        if (isNaN(player_id) || player_id <= 0) {
            console.log(`Skipping invalid player ID: ${player_id}`);
            results.push({ id: player_id, status: 'skipped', reason: 'Invalid ID' });
            continue;
        }

        // --- CORRECTED URL STRING: Using backticks for template literals ---
        const url = `https://www.tornstats.com/api/v2/${TORNSTATS_API_KEY}/spy/user/${player_id}`;

        try {
            const response = await axios.get(url);

            if (response.status === 200 && response.data?.spy?.status === true) {
                const spy_data = response.data.spy;
                const playerRef = db.collection('players').doc(String(player_id)); 

                const dataToSave = {
                    player_id: parseInt(player_id),
                    player_name: spy_data.player_name,
                    strength: spy_data.strength,
                    defense: spy_data.defense,
                    speed: spy_data.speed,
                    dexterity: spy_data.dexterity,
                    total: spy_data.total,
                    spy_timestamp: spy_data.timestamp,
                    last_updated: admin.firestore.FieldValue.serverTimestamp(), 
                    effective_strength: getNumericOrDefault(spy_data, 'effective_strength'),
                    effective_defense: getNumericOrDefault(spy_data, 'effective_defense'),
                    effective_speed: getNumericOrDefault(spy_data, 'effective_speed'),
                    effective_dexterity: getNumericOrDefault(spy_data, 'effective_dexterity'),
                    effective_total: getNumericOrDefault(spy_data, 'effective_total')
                };

                await playerRef.set(dataToSave, { merge: true });
                
                // --- CORRECTED CONSOLE LOG STRING: Using backticks for template literals ---
                console.log(`[SUCCESS] Saved data for: ${spy_data.player_name} (${player_id})`);
                results.push({ id: player_id, status: 'success', name: spy_data.player_name });
            } else {
                console.log(`[INFO] Skipping player ${player_id}. Reason: TornStats spy status was not true or data was missing.`);
                results.push({ id: player_id, status: 'skipped', reason: 'No valid TornStats spy report' });
            }
        } catch (error) {
            let reason = 'An unknown error occurred with TornStats API';
            if (axios.isAxiosError(error) && error.response) { // More robust check for Axios errors
                if (error.response.status === 404) {
                    reason = 'No spy report found on TornStats';
                } else if (error.response.status === 400 && error.response.data?.error?.code === 10) {
                    reason = 'TornStats API Key is invalid or rate-limited';
                } else {
                    reason = `API Error (${error.response.status}): ${JSON.stringify(error.response.data)}`;
                }
            } else if (error.message) {
                reason = error.message;
            }
            console.error(`[CRITICAL] Error processing ID ${player_id} with TornStats API: ${reason}`);
            results.push({ id: player_id, status: 'error', reason: reason });
        }
    }

    // Return the response for Netlify Function
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Processing complete',
            results: results,
        }),
    };
};