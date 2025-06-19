// netlify/functions/update-user-faction.js

// Import necessary modules
const fetch = require('node-fetch'); // Used for making HTTP requests to external APIs
const admin = require('firebase-admin'); // Firebase Admin SDK for server-side operations

// Initialize Firebase Admin SDK if it hasn't been initialized yet
// This check prevents re-initialization in warm Lambda environments
if (!admin.apps.length) {
    try {
        // --- MODIFICATION STARTS HERE ---
        // Read the Base64 encoded credentials from environment variable
        const base64Credentials = process.env.FIREBASE_CREDENTIALS_BASE64;

        if (!base64Credentials) {
            throw new Error('FIREBASE_CREDENTIALS_BASE64 environment variable is not set.');
        }

        // Decode the Base64 string and parse it as JSON
        const serviceAccount = JSON.parse(Buffer.from(base64Credentials, 'base64').toString('utf8'));
        // --- MODIFICATION ENDS HERE ---

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (error) {
        console.error('Firebase Admin SDK initialization failed:', error);
        // Exit early if Firebase Admin SDK cannot be initialized
        process.exit(1);
    }
}

// Get a Firestore database instance
const db = admin.firestore();

// Main handler for the Netlify function
exports.handler = async (event, context) => {
    // Only allow POST requests for this function
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    }

    let uid, tornApiKey;

    try {
        // Parse the request body (assuming JSON format)
        const body = JSON.parse(event.body);
        uid = body.uid;
        tornApiKey = body.tornApiKey;

        // Basic validation for required parameters
        if (!uid || !tornApiKey) {
            console.warn('Missing UID or Torn API Key in request body.');
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing UID or Torn API Key.' }),
            };
        }

    } catch (parseError) {
        console.error('Error parsing request body:', parseError);
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid request body format.' }),
        };
    }

    try {
        // 1. Fetch user's faction data from Torn API
        // Using 'faction' selection to get current faction details
        const tornApiUrl = `https://api.torn.com/user/?selections=faction&key=${tornApiKey}`;
        const tornResponse = await fetch(tornApiUrl);
        const tornData = await tornResponse.json();

        // Check for errors from Torn API (e.g., invalid key, API limits)
        if (tornData.error) {
            console.error(`Torn API Error for UID ${uid}:`, tornData.error.error);
            return {
                statusCode: 400, // Client error because the API key might be invalid
                body: JSON.stringify({ error: `Torn API Error: ${tornData.error.error}` }),
            };
        }

        // Extract faction ID and name
        const factionId = tornData.faction ? tornData.faction.faction_id : null;
        const factionName = tornData.faction ? tornData.faction.faction_name : null;

        // 2. Update user profile in Firestore
        const userRef = db.collection('userProfiles').doc(uid);

        // Prepare data to update
        const updateData = {
            lastFactionUpdated: admin.firestore.FieldValue.serverTimestamp(), // Timestamp of update
        };

        if (factionId !== null) { // Only update if faction data was found
            updateData.factionID = factionId;
            updateData.factionName = factionName;
        } else {
            // If user is not in a faction, explicitly set to null or remove fields
            updateData.factionID = null;
            updateData.factionName = null;
            console.log(`UID ${uid} is not in a faction, setting faction data to null.`);
        }

        await userRef.update(updateData); // Use update to only modify specified fields

        console.log(`Successfully updated faction data for UID: ${uid}. Faction ID: ${factionId}, Faction Name: ${factionName}`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Faction data updated successfully.',
                factionId: factionId,
                factionName: factionName,
            }),
        };

    } catch (error) {
        console.error(`Error updating faction for UID ${uid}:`, error);
        return {
            statusCode: 500, // Server error for unexpected issues
            body: JSON.stringify({ error: 'Failed to update faction data due to internal server error.' }),
        };
    }
};