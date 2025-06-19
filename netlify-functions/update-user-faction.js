// netlify/functions/update-user-faction.js

// Import necessary modules
const admin = require('firebase-admin'); // Firebase Admin SDK for server-side operations

// Initialize Firebase Admin SDK if it hasn't been initialized yet
// This check prevents re-initialization in warm Lambda environments
if (!admin.apps.length) {
    try {
        const base64Credentials = process.env.FIREBASE_CREDENTIALS_BASE64;
        if (!base64Credentials) {
            throw new Error('FIREBASE_CREDENTIALS_BASE64 environment variable is not set.');
        }
        const serviceAccount = JSON.parse(Buffer.from(base64Credentials, 'base64').toString('utf8'));
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (error) {
        console.error('Firebase Admin SDK initialization failed:', error);
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

    // Changed to snake_case as per your requirement
    let uid, faction_id, faction_name, position; 

    try {
        // Parse the request body
        const body = JSON.parse(event.body);
        uid = body.uid;
        faction_id = body.faction_id;       // Expecting snake_case
        faction_name = body.faction_name;   // Expecting snake_case
        position = body.position;           // Expecting snake_case

        // Validate required parameters (uid is always required)
        if (!uid) {
            console.warn('Missing UID in request body.');
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing UID.' }),
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
        // 1. Update user profile in Firestore directly with provided data
        const userRef = db.collection('userProfiles').doc(uid);

        // Prepare data to update
        const updateData = {
            lastFactionUpdated: admin.firestore.FieldValue.serverTimestamp(), // Timestamp of update
        };

        // Use snake_case for Firestore fields as well, to match the data source
        updateData.faction_id = faction_id !== undefined ? faction_id : null;
        updateData.faction_name = faction_name !== undefined ? faction_name : null;
        updateData.position = position !== undefined ? position : null;

        await userRef.update(updateData); // Use update to only modify specified fields

        console.log(`Successfully updated faction data for UID: ${uid}. Faction ID: ${faction_id}, Faction Name: ${faction_name}, Position: ${position}`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Faction data updated successfully.',
                faction_id: faction_id,
                faction_name: faction_name,
                position: position,
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