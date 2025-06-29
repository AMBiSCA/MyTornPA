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
        exports.handler = async (event, context) => { // This redefines handler to always return an error
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
    const WORKER_FUNCTION_SECRET = process.env.WORKER_FUNCTION_SECRET;
    const incomingSecret = event.headers['x-worker-secret'];

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

    const { tornProfileId, tornApiKey, isPrivateData } = requestBody; 

    if (!tornProfileId || !tornApiKey) {
        console.warn("[Worker] Missing tornProfileId or tornApiKey in request body.");
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Missing tornProfileId or tornApiKey in request." }),
        };
    }

    try {
        let selections;
        if (isPrivateData) {
            selections = "profile,personalstats,battlestats,workstats,basic,cooldowns,bars,travel"; 
        } else {
            selections = "profile,basic,last_action,status"; 
        }

        // --- MODIFIED LINE: Added '/v2/' to the API URL ---
        const apiUrl = `https://api.torn.com/v2/user/${tornProfileId}?selections=${selections}&key=${tornApiKey}&comment=MyTornPA_WorkerFetch_${isPrivateData ? 'Private' : 'Public'}`;

        console.log(`[Worker] Fetching ${isPrivateData ? 'private' : 'public'} data for Torn ID: ${tornProfileId} with selections: ${selections}`);
        const response = await fetch(apiUrl);
        const data = await response.json();

        console.log(`[Worker Debug] Data for ${tornProfileId} (Private: ${isPrivateData}): name: ${data.name}, player_id: ${data.player_id}, last_action:`, data.last_action, `status:`, data.status, `travel:`, data.travel, `energy:`, data.energy, `nerve:`, data.nerve);

        if (!response.ok || data.error) {
            const errorMessage = data.error ? data.error.error : `HTTP error! status: ${response.status} ${response.statusText}`;
            console.error(`[Worker] Torn API Error for ${tornProfileId} (Private: ${isPrivateData}):`, errorMessage);
            return {
                statusCode: 500,
                body: JSON.stringify({ message: `Torn API Error for ${tornProfileId}: ${errorMessage}` }),
            };
        }

        const mainStatusState = data.status?.state;
        const lastActionRelative = data.last_action?.relative;

        const isUserCurrentlyOnlineOrActive = (
            (mainStatusState === 'Okay' || mainStatusState === 'Traveling' || mainStatusState === 'Hospital') &&
            (
                lastActionRelative === 'Now' ||
                (lastActionRelative && lastActionRelative.includes('second')) ||
                (lastActionRelative && lastActionRelative.includes('minute') && parseInt(lastActionRelative.split(' ')[0]) <= 5)
            )
        );

        if (!isUserCurrentlyOnlineOrActive) {
            console.log(`[Worker] Skipping save for ${tornProfileId} (Private: ${isPrivateData}): User is currently inactive (${mainStatusState}, ${lastActionRelative || 'N/A'}).`);
            return {
                statusCode: 200,
                body: JSON.stringify({ message: `Skipped save for ${tornProfileId}: User inactive or in non-tracked status.` }),
            };
        }

        const userDataToSave = {
            name: data.name,
            level: data.level, 
            faction_id: data.faction?.faction_id || null, 
            faction_name: data.faction?.faction_name || null,
            faction_tag: data.faction?.faction_tag || null,

            nerve: data.nerve || {},
            energy: data.energy || {},
            happy: data.happy || {},
            life: data.life || {},

            traveling: data.status?.state === 'Traveling' || false,
            hospitalized: data.status?.state === 'Hospital' || false,
            travel: data.travel || {}, 
            
            cooldowns: data.cooldowns || {}, 

            personalstats: data.personalstats || {}, 

            battlestats: {
                strength: data.battlestats?.strength || 0,
                defense: data.battlestats?.defense || 0,
                speed: data.battlestats?.speed || 0,
                dexterity: data.battlestats?.dexterity || 0,
                total: data.battlestats?.total || 0,
                strength_modifier: data.battlestats?.strength_modifier || 0,
                defense_modifier: data.battlestats?.defense_modifier || 0,
                speed_modifier: data.battlestats?.speed_modifier || 0,
                dexterity_modifier: data.battlestats?.dexterity_modifier || 0,
            },
            workstats: data.workstats || {}, 

            last_action: data.last_action || {}, 
            status: data.status || {},

            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
            isPrivateDataFetched: isPrivateData 
        };

        const documentId = `${data.name || 'Unknown'} [${data.player_id}]`;
        await db.collection('users').doc(documentId).set(userDataToSave, { merge: true });

        console.log(`[Worker] Successfully fetched and saved ${isPrivateData ? 'private' : 'public'} data for Torn ID: ${data.player_id} (Document ID: ${documentId}). User is active/online.`);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: `Data saved successfully for ${data.player_id} (Private Data: ${isPrivateData}).` }),
        };

    } catch (error) {
        console.error(`[Worker] Top-level error for ${tornProfileId} (Private: ${isPrivateData}):`, error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: `Failed to process data for ${tornProfileId}.`, error: error.message }),
        };
    }
};