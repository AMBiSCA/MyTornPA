// Correct code for: scheduled-dispatcher.js

const admin = require('firebase-admin');

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
        console.error("Firebase Admin initialization error:", error);
        throw new Error("Firebase initialization failed.");
    }
}
const db = admin.firestore();

// This is the correct threshold
const UPDATE_THRESHOLD_SECONDS = 55;

exports.handler = async (event, context) => {
    try {
        const WORKER_FUNCTION_SECRET = process.env.WORKER_FUNCTION_SECRET;
        if (!WORKER_FUNCTION_SECRET) {
            throw new Error("Configuration error: Missing WORKER_FUNCTION_SECRET.");
        }

        console.log("[Dispatcher] Starting scheduled data dispatch.");
        const userProfilesSnapshot = await db.collection('userProfiles').get();

        if (userProfilesSnapshot.empty) {
            return { statusCode: 200, body: JSON.stringify({ message: "No user profiles found." }) };
        }

        const usersToDispatch = [];
        const nowInSeconds = Math.floor(Date.now() / 1000);

        userProfilesSnapshot.forEach(doc => {
            const userData = doc.data();
            const lastUpdatedTimestamp = userData.lastUpdated?.seconds || 0;
            if (userData.tornProfileId && userData.tornApiKey && (nowInSeconds - lastUpdatedTimestamp > UPDATE_THRESHOLD_SECONDS)) {
                usersToDispatch.push({
                    tornProfileId: userData.tornProfileId,
                    tornApiKey: userData.tornApiKey
                });
            }
        });

        if (usersToDispatch.length === 0) {
            return { statusCode: 200, body: JSON.stringify({ message: "No users require an update." }) };
        }

        console.log(`[Dispatcher] Found ${usersToDispatch.length} users to dispatch for update.`);

        // NOTE: The worker file this calls is assumed to be named 'process-single-user-data.js'
        // based on our previous conversations.
        const workerFunctionUrl = `${process.env.URL}/.netlify/functions/process-single-user-data`;

        for (const user of usersToDispatch) {
            await fetch(workerFunctionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Worker-Secret': WORKER_FUNCTION_SECRET
                },
                body: JSON.stringify({
                    tornProfileId: user.tornProfileId,
                    tornApiKey: user.tornApiKey
                })
            });
            await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
        }

        return { statusCode: 200, body: JSON.stringify({ message: "Dispatch process initiated." }) };

    } catch (mainError) {
        console.error("[Dispatcher] Top-level error:", mainError);
        return { statusCode: 500, body: JSON.stringify({ message: "Error in dispatcher.", error: mainError.message }) };
    }
};