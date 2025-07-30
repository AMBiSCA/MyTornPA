// File: netlify-functions/refresh-faction-data.js

const admin = require('firebase-admin');
const fetch = require('node-fetch');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    try {
        const serviceAccountBase64 = process.env.FIREBASE_CREDENTIALS_BASE64;
        if (!serviceAccountBase64) throw new Error("FIREBASE_CREDENTIALS_BASE64 env var is missing.");
        const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('utf8'));
        admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    } catch (error) {
        console.error("Firebase Admin initialization error:", error);
    }
}
const db = admin.firestore();

exports.handler = async (event, context) => {
    const factionId = event.queryStringParameters.factionId;
    if (!factionId) return { statusCode: 400, body: JSON.stringify({ message: "A factionId must be provided." }) };

    try {
        console.log(`Starting on-demand refresh for factionId: ${factionId}`);
        const usersSnapshot = await db.collection('userProfiles').where('faction_id', '==', parseInt(factionId)).get();
        if (usersSnapshot.empty) return { statusCode: 200, body: JSON.stringify({ message: `No users found for faction ${factionId}.`}) };

        const updatePromises = usersSnapshot.docs.map(doc => {
            const processUser = async () => {
                const userDataFromDb = doc.data();
                const tornProfileId = userDataFromDb.tornProfileId;
                const tornApiKey = userDataFromDb.tornApiKey;
                
                if (!tornProfileId || !tornApiKey) return;

                try {
                    const selections = "profile,personalstats,battlestats,workstats,basic,cooldowns,bars";
                    const apiUrl = `https://api.torn.com/user/${tornProfileId}?selections=${selections}&key=${tornApiKey}&comment=MyTornPA_Refresh`;
                    
                    const response = await fetch(apiUrl);
                    const data = await response.json();
                    if (!response.ok || data.error) throw new Error(`Torn API Error: ${data.error?.error || response.statusText}`);

                    // =========================================================================
                    // ## DETAILED DATA MAPPING STARTS HERE ##
                    // =========================================================================

                    // --- Daily Refill Tracking Logic (from your original code) ---
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

                    // Complete object with all fields to save
                    const userDataToSave = {
                        name: data.name,
                        level: data.level,
                        faction_id: data.faction?.faction_id || null,
                        faction_name: data.faction?.faction_name || null,
                        energy: data.energy || {},
                        nerve: data.nerve || {},
                        happy: data.happy || {},
                        life: data.life || {},
                        status: data.status || {},
                        cooldowns: data.cooldowns || {},
                        personalstats: data.personalstats || {}, // Saves the entire personalstats map
                        battlestats: data.battlestats || {},   // Saves the entire battlestats map
                        workstats: data.workstats || {},     // Saves the entire workstats map
                        profile_image: data.profile_image || null,
                        energyRefillUsedToday: energyRefillUsedToday,
                        nerveRefillUsedToday: nerveRefillUsedToday,
                        lastKnownEnergyRefills: storedLastKnownEnergyRefills,
                        lastKnownNerveRefills: storedLastKnownNerveRefills,
                        lastDailyRefillResetTime: admin.firestore.Timestamp.fromDate(storedLastDailyRefillResetTime),
                        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                    };
                    
                    const userRef = db.collection('users').doc(String(tornProfileId));
                    await userRef.set(userDataToSave, { merge: true });

                } catch (error) {
                    console.error(`Failed to refresh user ${tornProfileId}:`, error.message);
                }
            };
            return processUser();
        });

        await Promise.all(updatePromises);

        console.log(`Successfully refreshed faction ${factionId}.`);
        return { statusCode: 200, body: JSON.stringify({ message: `Faction ${factionId} refreshed successfully.` }) };

    } catch (error) {
        console.error(`Error refreshing faction ${factionId}:`, error);
        return { statusCode: 500, body: JSON.stringify({ message: "An error occurred during the refresh." }) };
    }
};