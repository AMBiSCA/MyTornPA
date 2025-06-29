// Import Firebase Admin SDK
// You might need to install it: npm install firebase-admin
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK if not already initialized
// This needs to be outside the handler for better performance (warm starts)
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.applicationDefault()
        });
    } catch (error) {
        console.error("Firebase Admin initialization error:", error.stack);
        // It's crucial to ensure your FIREBASE_PRIVATE_KEY is correctly configured
        // in Netlify environment variables if this fails during deployment/execution.
    }
}
const db = admin.firestore();

// This is the main handler for the Netlify Function
exports.handler = async (event, context) => {
    try {
        // --- IMPORTANT: Retrieve your Torn API Key and Player ID from Netlify Environment Variables ---
        // You MUST set these in your Netlify site settings under "Environment variables".
        // Go to Site settings > Build & deploy > Environment variables.
        const TORN_API_KEY = process.env.TORN_API_KEY;
        const TORN_PLAYER_ID = process.env.TORN_PLAYER_ID; // Or fetch a list of IDs if you want to track multiple users

        if (!TORN_API_KEY || !TORN_PLAYER_ID) {
            console.error("[Scheduled Function] Configuration error: Missing TORN_API_KEY or TORN_PLAYER_ID environment variables.");
            return {
                statusCode: 500,
                body: JSON.stringify({ message: "Configuration error: Missing API key or player ID. Please check Netlify environment variables." }),
            };
        }

        // Define the selections for the Torn API call
        const selections = "profile,personalstats,battlestats,workstats,basic,cooldowns,bars";
        const apiUrl = `https://api.torn.com/user/${TORN_PLAYER_ID}?selections=${selections}&key=${TORN_API_KEY}&comment=MyTornPA_ScheduledFetch`;

        console.log(`[Scheduled Function] Initiating fetch for Torn ID: ${TORN_PLAYER_ID}`);
        console.log(`[Scheduled Function] Constructed Torn API URL: ${apiUrl}`);

        // Make the call to the Torn API
        const response = await fetch(apiUrl);
        const data = await response.json();

        // Handle API errors
        if (!response.ok || data.error) {
            const errorMessage = data.error ? data.error.error : `HTTP error! status: ${response.status} ${response.statusText}`;
            console.error("[Scheduled Function] Torn API Error:", errorMessage);
            return {
                statusCode: 500,
                body: JSON.stringify({ message: `Torn API Error: ${errorMessage}` }),
            };
        }

        // Prepare the data to be saved to Firestore (matching your existing structure)
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
            lastUpdated: admin.firestore.FieldValue.serverTimestamp() // Use server timestamp for accuracy
        };

        // Save the fetched data to your Firestore 'users' collection
        // It will create a document for the TORN_PLAYER_ID if it doesn't exist, or update it if it does.
        await db.collection('users').doc(String(TORN_PLAYER_ID)).set(userDataToSave, { merge: true });

        console.log(`[Scheduled Function] Successfully fetched and saved data for Torn ID: ${TORN_PLAYER_ID}`);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Data fetched and saved successfully by scheduled function." }),
        };

    } catch (error) {
        console.error("[Scheduled Function] An uncaught error occurred:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Failed to fetch and save data in scheduled function.", error: error.message }),
        };
    }
};