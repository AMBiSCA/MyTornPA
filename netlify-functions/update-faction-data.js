// File: netlify-functions/update-faction-data.js

const admin = require('firebase-admin');
const fetch = require('node-fetch');

// Your Firebase initialization code here...
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
    // ## CHANGE 1: Get the factionId from the URL query string ##
    const factionId = event.queryStringParameters.factionId;

    if (!factionId) {
        return { statusCode: 400, body: JSON.stringify({ message: "factionId query parameter is required." }) };
    }

    try {
        console.log(`Starting faction data update for factionId: ${factionId}...`);
        
        // ## CHANGE 2: Filter the database query to only get users from the specified faction ##
        const usersSnapshot = await db.collection('userProfiles').where('faction_id', '==', parseInt(factionId)).get();

        if (usersSnapshot.empty) {
            console.log(`No users found in faction ${factionId}.`);
            return { statusCode: 200, body: `No users found for faction ${factionId}.` };
        }

        const updatePromises = usersSnapshot.docs.map(doc => {
            const processUser = async () => {
                const tornProfileId = doc.id;
                const userDataFromDb = doc.data();

                if (!userDataFromDb.tornApiKey) return;
                
                try {
                    // This is your data-fetching and saving logic from before.
                    // It remains the same.
                    const selections = "profile,personalstats,battlestats,workstats,basic,cooldowns,bars";
                    const apiUrl = `https://api.torn.com/user/${tornProfileId}?selections=${selections}&key=${userDataFromDb.tornApiKey}&comment=MyTornPA_BatchFetch`;
                    const response = await fetch(apiUrl);
                    const data = await response.json();

                    if (!response.ok || data.error) throw new Error(`Torn API Error: ${data.error?.error || response.statusText}`);

                    // All your data mapping logic here...
                    const userDataToSave = { /* ... all your fields ... */ };
                    
                    const userRef = db.collection('userProfiles').doc(tornProfileId);
                    await userRef.set(userDataToSave, { merge: true });

                } catch (error) {
                    console.error(`Failed to update user ${tornProfileId}:`, error.message);
                }
            };
            return processUser();
        });

        await Promise.all(updatePromises);

        console.log(`Faction data update complete for factionId: ${factionId}.`);
        return { statusCode: 200, body: `Faction ${factionId} update successful.` };

    } catch (error) {
        console.error(`Error in update-faction-data for faction ${factionId}:`, error);
        return { statusCode: 500, body: `Faction ${factionId} update failed.` };
    }
};