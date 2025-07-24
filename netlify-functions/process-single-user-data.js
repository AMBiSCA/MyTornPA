// Import Firebase Admin SDK and node-fetch
const admin = require('firebase-admin');
const fetch = require('node-fetch');

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
        exports.handler = async (event, context) => {
            return {
                statusCode: 500,
                body: JSON.stringify({ message: "Firebase Admin initialization failed in worker.", error: error.message }),
            };
        };
        throw new Error("Firebase initialization failed during cold start of worker.");
    }
}
const db = admin.firestore();

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ message: "Method Not Allowed." }) };
    }

    const WORKER_FUNCTION_SECRET = process.env.WORKER_FUNCTION_SECRET;
    const incomingSecret = event.headers['x-worker-secret'];

    if (!WORKER_FUNCTION_SECRET || incomingSecret !== WORKER_FUNCTION_SECRET) {
        return { statusCode: 401, body: JSON.stringify({ message: "Unauthorized." }) };
    }

    let requestBody;
    try {
        requestBody = JSON.parse(event.body);
    } catch (parseError) {
        return { statusCode: 400, body: JSON.stringify({ message: "Invalid JSON body provided." }) };
    }

    const { tornProfileId, tornApiKey } = requestBody;

    if (!tornProfileId || !tornApiKey) {
        return { statusCode: 400, body: JSON.stringify({ message: "Missing tornProfileId or tornApiKey in request." }) };
    }

    try {
        const selections = "profile,personalstats,battlestats,workstats,basic,cooldowns,bars";
        const apiUrl = `https://api.torn.com/user/${tornProfileId}?selections=${selections}&key=${tornApiKey}&comment=MyTornPA_WorkerFetch`;

        console.log(`[Worker] Fetching data for Torn ID: ${tornProfileId}`);
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (!response.ok || data.error) {
            const errorMessage = data.error ? data.error.error : `HTTP error! status: ${response.status}`;
            console.error(`[Worker] Torn API Error for ${tornProfileId}:`, errorMessage);
            return { statusCode: 500, body: JSON.stringify({ message: `Torn API Error for ${tornProfileId}: ${errorMessage}` })};
        }

        const userRef = db.collection('users').doc(String(tornProfileId));
        const userDoc = await userRef.get();
        const storedData = userDoc.exists ? userDoc.data() : {};

        // Get current UTC date at midnight (Torn City Time)
        const nowUtc = new Date();
        const tornMidnightUtc = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate()));

        // Get latest lifetime refill counts from Torn API
        // Prioritize specific 'other.refills' then fallback to 'personalstats.refills' or 'personalstats.nerverefills'
        const currentApiEnergyRefills = (data.personalstats?.other?.refills?.energy ?? data.personalstats?.refills) || 0;
        const currentApiNerveRefills = (data.personalstats?.other?.refills?.nerve ?? data.personalstats?.nerverefills) || 0;

        // Get stored values from Firestore
        let storedLastKnownEnergyRefills = storedData.lastKnownEnergyRefills || 0;
        let storedLastKnownNerveRefills = storedData.lastKnownNerveRefills || 0;
        let storedLastDailyRefillResetTime = storedData.lastDailyRefillResetTime?.toDate() || new Date(0);

        let energyRefillUsedToday = storedData.energyRefillUsedToday || false;
        let nerveRefillUsedToday = storedData.nerveRefillUsedToday || false;

        // Check if a new Torn day has started since our last recorded reset
        if (storedLastDailyRefillResetTime.getTime() < tornMidnightUtc.getTime()) {
            // New day has started, reset daily usage flags
            energyRefillUsedToday = false;
            nerveRefillUsedToday = false;
            
            // Update the stored lifetime refill count to the current API value for the start of the new day
            // This is crucial so the next comparison is against the value at the *start of the current day*.
            storedLastKnownEnergyRefills = currentApiEnergyRefills;
            storedLastKnownNerveRefills = currentApiNerveRefills;

            storedLastDailyRefillResetTime = tornMidnightUtc; // Record the current Torn midnight
        } else {
            // Still the same Torn day as last check
            // Check if lifetime refills have increased since the last known count for this day
            if (currentApiEnergyRefills > storedLastKnownEnergyRefills) {
                energyRefillUsedToday = true; // Energy refill was used today
            }
            if (currentApiNerveRefills > storedLastKnownNerveRefills) {
                nerveRefillUsedToday = true; // Nerve refill was used today
            }
            // IMPORTANT: Always update storedLastKnownRefills with the latest from API for ongoing tracking
            storedLastKnownEnergyRefills = currentApiEnergyRefills;
            storedLastKnownNerveRefills = currentApiNerveRefills;
        }

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
            personalstats: data.personalstats || {}, // Save full personalstats for reference
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
            profile_image: data.profile_image || null, // Ensure profile image is saved

            // Save the daily tracking flags and lifetime counts
            energyRefillUsedToday: energyRefillUsedToday,
            nerveRefillUsedToday: nerveRefillUsedToday,
            lastKnownEnergyRefills: storedLastKnownEnergyRefills, // Update with latest
            lastKnownNerveRefills: storedLastKnownNerveRefills,   // Update with latest
            lastDailyRefillResetTime: admin.firestore.FieldValue.Timestamp.fromDate(storedLastDailyRefillResetTime), // Store as Firestore Timestamp
            lastUpdated: admin.firestore.FieldValue.serverTimestamp() // Keep this as general update timestamp
        };

        await userRef.set(userDataToSave, { merge: true });

        console.log(`[Worker] Successfully fetched and saved data for Torn ID: ${tornProfileId}`);
        return { statusCode: 200, body: JSON.stringify({ message: `Data saved successfully for ${tornProfileId}.` }) };

    } catch (error) {
        console.error(`[Worker] Top-level error for ${tornProfileId}:`, error);
        return { statusCode: 500, body: JSON.stringify({ message: `Failed to process data for ${tornProfileId}.`, error: error.message }) };
    }
};