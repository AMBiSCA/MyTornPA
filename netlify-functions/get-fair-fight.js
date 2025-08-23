// File: netlify/functions/get-fair-fight.js

// We need to use 'node-fetch' for making API calls on the server
const fetch = require('node-fetch');
// We use 'firebase-admin' to securely access Firestore from the back-end
const admin = require('firebase-admin');

// --- Initialize Firebase Admin SDK ---
// This code is now configured to work with a single BASE64 encoded environment variable.
if (!admin.apps.length) {
    try {
        if (!process.env.FIREBASE_CREDENTIALS_BASE64) {
            throw new Error('FIREBASE_CREDENTIALS_BASE64 environment variable is not set.');
        }

        const decodedCredentials = Buffer.from(
            process.env.FIREBASE_CREDENTIALS_BASE64,
            'base64'
        ).toString('utf-8');

        const serviceAccount = JSON.parse(decodedCredentials);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (error) {
        console.error('Failed to initialize Firebase Admin SDK:', error.message);
        // You might want to log the error to Sentry or another service here.
    }
}

const db = admin.firestore();

// --- Main Handler for the Netlify Function ---
exports.handler = async function(event, context) {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    // List of owner/admin UIDs to use for the API key lookup
    const trustedUids = [
        '48CQkfJqz2YrXrHfmOO0y1zeci93', // Primary UID
        // 'ANOTHER_BACKUP_UID',       // Backup UID 1
        // 'A_THIRD_BACKUP_UID'        // Backup UID 2
    ];
    const FF_SCOUTER_API_URL = "https://ffscouter.com/api/v1/get-stats";

    try {
        // Get the list of player IDs from the front-end's request
        const { playerIds } = JSON.parse(event.body);
        if (!playerIds || !Array.isArray(playerIds) || playerIds.length === 0) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Player IDs must be provided in an array.' }) };
        }

        // --- Get the Site API Key using the Backup UID Logic ---
        let siteApiKey = null;
        for (const uid of trustedUids) {
            try {
                const userDoc = await db.collection('userProfiles').doc(uid).get();
                if (userDoc.exists && userDoc.data().tornApiKey) {
                    siteApiKey = userDoc.data().tornApiKey;
                    console.log(`Successfully retrieved API key from UID: ${uid}`);
                    break; // Exit the loop once a key is found
                }
            } catch (error) {
                console.error(`Failed to check UID ${uid}:`, error.message);
            }
        }

        if (!siteApiKey) {
            throw new Error("Could not retrieve a valid site API key from any trusted user profile.");
        }

        // --- Make the hidden call to FFScouter from the server ---
        const ffScouterUrl = `${FF_SCOUTER_API_URL}?key=${siteApiKey}&targets=${playerIds.join(',')}`;
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