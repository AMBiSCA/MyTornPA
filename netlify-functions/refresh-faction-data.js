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

    if (!factionId) {
        return { statusCode: 400, body: JSON.stringify({ message: "A factionId must be provided." }) };
    }

    try {
        console.log(`Starting on-demand refresh for factionId: ${factionId}`);

        // Get the list of users to update from the 'userProfiles' collection
        const usersSnapshot = await db.collection('userProfiles').where('faction_id', '==', parseInt(factionId)).get();

        if (usersSnapshot.empty) {
            return { statusCode: 200, body: JSON.stringify({ message: `No users found for faction ${factionId}.`}) };
        }

        const updatePromises = usersSnapshot.docs.map(doc => {
            const processUser = async () => {
                const tornProfileId = doc.id;
                const userDataFromDb = doc.data();

                if (!userDataFromDb.tornApiKey) return;

                try {
                    const selections = "profile,personalstats,battlestats,workstats,basic,cooldowns,bars";
                    const apiUrl = `https://api.torn.com/user/${tornProfileId}?selections=${selections}&key=${userDataFromDb.tornApiKey}&comment=MyTornPA_Refresh`;
                    
                    const response = await fetch(apiUrl);
                    const data = await response.json();

                    if (!response.ok || data.error) throw new Error(`Torn API Error: ${data.error?.error || response.statusText}`);
                    
                    const userDataToSave = {
                        // All of your data mapping logic...
                        name: data.name,
                        level: data.level,
                        faction_id: data.faction?.faction_id || null,
                        energy: data.energy || {},
                        nerve: data.nerve || {},
                        // etc...
                        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                    };
                    
                    // =========================================================================
                    // ## THIS IS THE FIX: Saving data to the 'users' collection ##
                    // =========================================================================
                    const userRef = db.collection('users').doc(tornProfileId);
                    await userRef.set(userDataToSave, { merge: true });

                } catch (error) {
                    console.error(`Failed to refresh user ${tornProfileId}:`, error.message);
                }
            };
            return processUser();
        });

        await Promise.all(updatePromises);

        return { statusCode: 200, body: JSON.stringify({ message: `Faction ${factionId} refreshed successfully.` }) };

    } catch (error) {
        console.error(`Error refreshing faction ${factionId}:`, error);
        return { statusCode: 500, body: JSON.stringify({ message: "An error occurred during the refresh." }) };
    }
};