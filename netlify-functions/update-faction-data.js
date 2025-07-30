
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
        console.error("Firebase Admin initialization error:", error.stack);
    }
}

const db = admin.firestore();

exports.handler = async (event, context) => {
    try {
        console.log("Starting faction data update...");
        // NOTE: Reading from 'userProfiles' collection, assuming this is where your user list is.
        const usersSnapshot = await db.collection('userProfiles').get();

        if (usersSnapshot.empty) {
            console.log("No users found to update.");
            return { statusCode: 200, body: "No users found." };
        }

        // Create a list of promises, one for each user update
        const updatePromises = usersSnapshot.docs.map(doc => {
            const processUser = async () => {
                const tornProfileId = doc.id;
                const userDataFromDb = doc.data();

                // Skip users who don't have an API key stored
                if (!userDataFromDb.tornApiKey) {
                    console.log(`Skipping user ${tornProfileId}: No API key.`);
                    return;
                }
                
                try {
                    // ===================================================================
                    // ## LOGIC FROM YOUR WORKER FUNCTION STARTS HERE ##
                    // This logic now runs for each user in the batch.
                    // ===================================================================
                    
                    const selections = "profile,personalstats,battlestats,workstats,basic,cooldowns,bars";
                    const apiUrl = `https://api.torn.com/user/${tornProfileId}?selections=${selections}&key=${userDataFromDb.tornApiKey}&comment=MyTornPA_BatchFetch`;

                    const response = await fetch(apiUrl);
                    const data = await response.json();

                    if (!response.ok || data.error) {
                        const errorMessage = data.error ? data.error.error : `HTTP error! status: ${response.status}`;
                        throw new Error(`Torn API Error: ${errorMessage}`);
                    }
                    
                    // --- Daily Refill Tracking Logic ---
                    const nowUtc = new Date();
                    const tornMidnightUtc = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth(), nowUtc.getUTCDate()));
                    const currentApiEnergyRefills = data.personalstats?.refills || 0;
                    const currentApiNerveRefills = data.personalstats?.nerverefills || 0;

                    let storedLastKnownEnergyRefills = userDataFromDb.lastKnownEnergyRefills || 0;
                    let storedLastKnownNerveRefills = userDataFromDb.lastKnownNerveRefills || 0;
                    let storedLastDailyRefillResetTime = userDataFromDb.lastDailyRefillResetTime?.toDate() || new Date(0);
                    let energyRefillUsedToday = userDataFromDb.energyRefillUsedToday || false;
                    let nerveRefillUsedToday = userDataFromDb.nerveRefillUsedToday || false;

                    if (storedLastDailyRefillResetTime.getTime() < tornMidnightUtc.getTime()) {
                        energyRefillUsedToday = false;
                        nerveRefillUsedToday = false;
                        storedLastKnownEnergyRefills = currentApiEnergyRefills;
                        storedLastKnownNerveRefills = currentApiNerveRefills;
                        storedLastDailyRefillResetTime = tornMidnightUtc;
                    } else {
                        if (currentApiEnergyRefills > storedLastKnownEnergyRefills) energyRefillUsedToday = true;
                        if (currentApiNerveRefills > storedLastKnownNerveRefills) nerveRefillUsedToday = true;
                        storedLastKnownEnergyRefills = currentApiEnergyRefills;
                        storedLastKnownNerveRefills = currentApiNerveRefills;
                    }
                    // --- End of Refill Logic ---

                    const userDataToSave = {
                        name: data.name,
                        level: data.level,
                        faction_id: data.faction?.faction_id || null,
                        faction_name: data.faction?.faction_name || null,
                        energy: data.energy || {},
                        nerve: data.nerve || {},
                        life: data.life || {},
                        status: data.status || {},
                        cooldowns: data.cooldowns || {},
                        energyRefillUsedToday: energyRefillUsedToday,
                        nerveRefillUsedToday: nerveRefillUsedToday,
                        lastKnownEnergyRefills: storedLastKnownEnergyRefills,
                        lastKnownNerveRefills: storedLastKnownNerveRefills,
                        lastDailyRefillResetTime: admin.firestore.Timestamp.fromDate(storedLastDailyRefillResetTime),
                        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                    };
                    
                    // NOTE: Saving back to the 'userProfiles' collection.
                    const userRef = db.collection('userProfiles').doc(tornProfileId);
                    await userRef.set(userDataToSave, { merge: true });
                    
                    // ===================================================================
                    // ## END OF WORKER FUNCTION LOGIC ##
                    // ===================================================================

                } catch (error) {
                    console.error(`Failed to update user ${tornProfileId}:`, error.message);
                }
            };
            return processUser();
        });

        // Wait for all the parallel user updates to complete
        await Promise.all(updatePromises);

        console.log("Faction data update complete.");
        return { statusCode: 200, body: JSON.stringify({ message: "Faction update successful." }) };

    } catch (error) {
        console.error("Error in update-faction-data function:", error);
        return { statusCode: 500, body: JSON.stringify({ message: "Faction update failed." }) };
    }
};