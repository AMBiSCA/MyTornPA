// Import Firebase Admin SDK
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
    try {
        const serviceAccountBase64 = process.env.FIREBASE_CREDENTIALS_BASE64;
        if (!serviceAccountBase64) {
            throw new Error("FIREBASE_CREDENTIALS_BASE64 environment variable is missing.");
        }
        const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('utf8'));

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (error) {
        console.error("Firebase Admin initialization error in worker:", error.stack);
        // This worker function should indicate failure if Firebase init fails
        exports.handler = async (event, context) => {
            return {
                statusCode: 500,
                body: JSON.stringify({ message: "Firebase Admin initialization failed in worker. Check FIREBASE_CREDENTIALS_BASE64 env var.", error: error.message }),
            };
        };
        throw new Error("Firebase initialization failed during cold start of worker.");
    }
}
const db = admin.firestore();

exports.handler = async (event, context) => {
    // Ensure this is a POST request (as sent by the dispatcher)
    if (event.httpMethod !== 'POST') {
        console.warn("[Worker] Received non-POST request. Method:", event.httpMethod);
        return {
            statusCode: 405,
            body: JSON.stringify({ message: "Method Not Allowed. This function only accepts POST requests." }),
        };
    }

    // --- Security Check: Validate the secret header ---
    const WORKER_FUNCTION_SECRET = process.env.WORKER_FUNCTION_SECRET; // Ensure this env var is set
    const incomingSecret = event.headers['x-worker-secret']; // Netlify converts header names to lowercase

    if (!WORKER_FUNCTION_SECRET || incomingSecret !== WORKER_FUNCTION_SECRET) {
        console.warn("[Worker] Unauthorized access attempt or missing secret header.");
        return {
            statusCode: 401,
            body: JSON.stringify({ message: "Unauthorized. Missing or invalid secret." }),
        };
    }

    let requestBody;
    try {
        requestBody = JSON.parse(event.body);
    } catch (parseError) {
        console.error("[Worker] Failed to parse request body:", parseError);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Invalid JSON body provided." }),
        };
    }

    const { tornProfileId, tornApiKey } = requestBody;

    if (!tornProfileId || !tornApiKey) {
        console.warn("[Worker] Missing tornProfileId or tornApiKey in request body.");
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Missing tornProfileId or tornApiKey in request." }),
        };
    }

    try {
        const selections = "profile,personalstats,battlestats,workstats,basic,cooldowns,bars";
        const apiUrl = `https://api.torn.com/user/${tornProfileId}?selections=${selections}&key=${tornApiKey}&comment=MyTornPA_WorkerFetch`;

        console.log(`[Worker] Fetching data for Torn ID: ${tornProfileId}`);
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!response.ok || data.error) {
            const errorMessage = data.error ? data.error.error : `HTTP error! status: ${response.status} ${response.statusText}`;
            console.error(`[Worker] Torn API Error for ${tornProfileId}:`, errorMessage);
            return {
                statusCode: 500,
                body: JSON.stringify({ message: `Torn API Error for ${tornProfileId}: ${errorMessage}` }),
            };
        }

        // Prepare the data to be saved (same structure as previous functions)
        const userDataToSave = {
            name: data.name,
            level: data.level,
            faction_id: data.faction?.faction_id || null,
            faction_name: data.faction?.faction_name || null,
            nerve: data.nerve || {},
            energy: data.energy || {},
            happy: data.happy || {},
            life: data.life || {},
            traveling: data.status?.state === 'Traveling' || false,
            hospitalized: data.status?.state === 'Hospital' || false,
            cooldowns: {
                drug: data.cooldowns?.drug || 0,
                booster: data.cooldowns?.booster || 0,
            },
            personalstats: data.personalstats || {},
            battlestats: {
                strength: data.strength || data.battlestats?.strength || 0,
                defense: data.defense || data.battlestats?.defense || 0,
                speed: data.speed || data.battlestats?.speed || 0,
                dexterity: data.dexterity || data.battlestats?.dexterity || 0,
                total: data.total || data.battlestats?.total || 0,
                strength_modifier: data.strength_modifier || data.battlestats?.strength_modifier || 0,
                defense_modifier: data.defense_modifier || data.battlestats?.defense_modifier || 0,
                speed_modifier: data.speed_modifier || data.battlestats?.speed_modifier || 0,
                dexterity_modifier: data.dexterity_modifier || data.battlestats?.dexterity_modifier || 0,
            },
            workstats: {
                manual_labor: data.manual_labor || data.workstats?.manual_labor || 0,
                intelligence: data.intelligence || data.workstats?.intelligence || 0,
                endurance: data.endurance || data.workstats?.endurance || 0,
            },
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        };

        // Save to Firestore 'users' collection (using the user's Torn ID as document ID)
        await db.collection('users').doc(String(tornProfileId)).set(userDataToSave, { merge: true });

        console.log(`[Worker] Successfully fetched and saved data for Torn ID: ${tornProfileId}`);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: `Data saved successfully for ${tornProfileId}.` }),
        };

    } catch (error) {
        console.error(`[Worker] Top-level error for ${tornProfileId}:`, error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: `Failed to process data for ${tornProfileId}.`, error: error.message }),
        };
    }
};