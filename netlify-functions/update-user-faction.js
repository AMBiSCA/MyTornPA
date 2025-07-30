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
        throw new Error('Firebase Admin SDK initialization failed: ' + error.message);
    }
}

// Get a Firestore database instance
const db = admin.firestore();

exports.handler = async (event, context) => {
    // Only allow POST requests for this function
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405, // Method Not Allowed
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    }

    let uid;
    let tornPlayerId; // This is the Torn User ID from the API
    let userDataToSave; // This will hold the entire comprehensive user data object from the client

    try {
        // Parse the request body
        const body = JSON.parse(event.body);

        // Extract the top-level 'uid', 'tornPlayerId', and the 'userData' object
        uid = body.uid;
        tornPlayerId = body.tornPlayerId;
        userDataToSave = body.userData; // This is the comprehensive object from the client (API response data)

        // Validate required parameters
        if (!uid || !tornPlayerId || !userDataToSave || typeof userDataToSave !== 'object') {
            console.warn('Missing UID, tornPlayerId, or invalid userData in request body.');
            return {
                statusCode: 400, // Bad Request
                body: JSON.stringify({ error: 'Missing UID, tornPlayerId, or invalid user data payload.' }),
            };
        }

    } catch (parseError) {
        console.error('Error parsing request body:', parseError);
        return {
            statusCode: 400, // Bad Request
            body: JSON.stringify({ error: 'Invalid request body format.' }),
        };
    }

    try {
        // --- 1. Update user profile in 'usofiles' collection (Firebase UID as document ID) ---
        const userProfileRef = db.collection('userProfiles').doc(uid);
        
        // Add serverTimestamp for tracking when this data was last updated by the API sync
        userDataToSave.lastApiSync = admin.firestore.FieldValue.serverTimestamp();

        // Ensure tornProfileId is explicitly set from the top-level tornPlayerId for consistency
        // as this function's primary role is to sync Torn API data to Firestore.
        userDataToSave.tornProfileId = String(tornPlayerId); 

        // Update the user's main profile document with ALL the comprehensive data received.
        // Use merge: true to update existing fields and add new ones without overwriting the entire document.
        await userProfileRef.set(userDataToSave, { merge: true });

        // --- 2. Also update 'users' collection (Torn Player ID as document ID) ---
        // This collection seems to be for public/basic Torn user info lookup by Torn ID.
        // It should contain only essential public-facing info.
        if (tornPlayerId) {
            const userBasicInfoRef = db.collection('users').doc(String(tornPlayerId));
            const updateBasicInfoData = {
                name: userDataToSave.name || null, // Use name from userDataToSave
                profile_image: userDataToSave.profile_image || null, // Use profile_image from userDataToSave
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            };
            await userBasicInfoRef.set(updateBasicInfoData, { merge: true });
        }
        
        console.log(`Successfully updated comprehensive user data in Firestore for Firebase UID: ${uid} (Torn ID: ${tornPlayerId}).`);

        // Return a success response to the client
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Comprehensive user data updated successfully.',
                tornProfileId: tornPlayerId,
                faction_id: userDataToSave.faction_id || null, // Return relevant fields for client confirmation
                faction_name: userDataToSave.faction_name || null,
            }),
        };

    } catch (mainError) {
        console.error(`Error updating comprehensive user data for UID ${uid}:`, mainError);
        return {
            statusCode: 500, // Internal Server Error
            body: JSON.stringify({ error: 'Failed to update user data due to internal server error.' }),
        };
    }
};