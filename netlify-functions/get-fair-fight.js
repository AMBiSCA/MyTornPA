// File: netlify/functions/get-fair-fight.js

// We need to use 'node-fetch' for making API calls on the server
const fetch = require('node-fetch');
// We use 'firebase-admin' to securely access Firestore from the back-end
const admin = require('firebase-admin');

// --- Initialize Firebase Admin SDK ---
// IMPORTANT: You must set up your Firebase Service Account credentials
// as environment variables in your Netlify site settings.
// NETLIFY_ENV_VAR_NAME: FIREBASE_PRIVATE_KEY
// NETLIFY_ENV_VAR_NAME: FIREBASE_CLIENT_EMAIL
// NETLIFY_ENV_VAR_NAME: FIREBASE_PROJECT_ID
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

// --- Main Handler for the Netlify Function ---
exports.handler = async function(event, context) {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        // Get the list of player IDs from the front-end's request
        const { playerIds } = JSON.parse(event.body);
        if (!playerIds || !Array.isArray(playerIds) || playerIds.length === 0) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Player IDs must be provided in an array.' }) };
        }

        // --- Get the Site API Key using the Backup UID Logic ---
        const siteApiKey = await getSiteApiKeyWithBackup();
        if (!siteApiKey) {
            throw new Error("Could not retrieve a valid site API key from any source.");
        }

        // --- Make the hidden call to FFScouter from the server ---
        const ffScouterUrl = `https://ffscouter.com/api/v1/get-stats?key=${siteApiKey}&targets=${playerIds.join(',')}`;
        const ffResponse = await fetch(ffScouterUrl);
        
        if (!ffResponse.ok) {
            throw new Error(`FFScouter API failed with status: ${ffResponse.status}`);
        }

        const ffData = await ffResponse.json();

        // --- Return the successful data back to the front-end ---
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ffData)
        };

    } catch (error) {
        console.error('Error in get-fair-fight function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};

// --- Helper function with the backup logic ---
async function getSiteApiKeyWithBackup() {
    // Your list of trusted UIDs. Add as many as you like.
    const trustedUids = [
        '48CQkfJqz2YrXrHfmOO0y1zeci93', // Primary UID
        // 'ANOTHER_BACKUP_UID',      // Backup UID 1
        // 'A_THIRD_BACKUP_UID'       // Backup UID 2
    ];

    for (const uid of trustedUids) {
        try {
            const userDoc = await db.collection('userProfiles').doc(uid).get();
            if (userDoc.exists && userDoc.data().tornApiKey) {
                console.log(`Successfully retrieved API key from UID: ${uid}`);
                return userDoc.data().tornApiKey; // Return the first key we find
            }
        } catch (error) {
            console.error(`Failed to check UID ${uid}:`, error.message);
            // Continue to the next UID in the list
        }
    }

    // If the loop finishes, no key was found
    return null;
}