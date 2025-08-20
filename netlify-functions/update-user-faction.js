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
        // It's important to exit the process or handle this critical error
        // to prevent the function from running with an uninitialized Admin SDK.
        // For Netlify, throwing an error might be sufficient to mark the invocation as failed.
        throw new Error('Firebase Admin SDK initialization failed: ' + error.message);
    }
}

// Get a Firestore database instance
const db = admin.firestore();

// Main handler for the Netlify function
exports.handler = async (event, context) => {
    // Only allow POST requests for this function
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405, // Method Not Allowed
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    }

    // Declare all expected variables from the request body
    let uid, faction_id, faction_name, position, profile_image, name, tornProfileId;

    try {
        // Parse the request body (which is a JSON string)
        const body = JSON.parse(event.body);

        // Extract the values from the parsed body
        uid = body.uid;
        faction_id = body.faction_id;
        faction_name = body.faction_name;
        position = body.position;
        profile_image = body.profile_image; // NEW: Profile image URL
        name = body.name;                   // NEW: User's Torn name
        tornProfileId = body.tornProfileId; // NEW: User's Torn Player ID

        // Validate required parameters (uid is always required for user-specific updates)
        if (!uid) {
            console.warn('Missing UID in request body.');
            return {
                statusCode: 400, // Bad Request
                body: JSON.stringify({ error: 'Missing UID.' }),
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
        // --- 1. Update user profile in 'userProfiles' collection (Firebase UID as document ID) ---
        // This document is where core app user data, API keys, etc., are stored.
        const userProfileRef = db.collection('userProfiles').doc(uid);
        
        // Prepare data to update in userProfiles
        const updateProfileData = {
            lastFactionUpdated: admin.firestore.FieldValue.serverTimestamp(), // Timestamp of this update
            faction_id: faction_id !== undefined ? faction_id : null,
            faction_name: faction_name !== undefined ? faction_name : null,
            position: position !== undefined ? position : null,
            profile_image: profile_image !== undefined ? profile_image : null, // NEW: Add profile_image
            name: name !== undefined ? name : null,                             // NEW: Add Torn name
            tornProfileId: tornProfileId !== undefined ? tornProfileId : null,   // NEW: Add Torn Player ID
        };
        // Use 'set' with 'merge: true' to create the document if it doesn't exist (on first login)
        // or update it without deleting other existing fields.
        await userProfileRef.set(updateProfileData, { merge: true }); 

        // --- 2. Also update 'users' collection (Torn Player ID as document ID) ---
        // This collection is typically used for quick lookups by Torn ID (e.g., for friend lists, member displays).
        if (tornProfileId) { // Only update this if a Torn Player ID is provided
            const userBasicInfoRef = db.collection('users').doc(String(tornProfileId)); // Document ID is Torn Player ID
            const updateBasicInfoData = {
                profile_image: profile_image !== undefined ? profile_image : null, // NEW: Add profile_image
                name: name !== undefined ? name : null,                             // NEW: Add  name
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()          // To track freshness of this basic data
            };
            // Use 'set' with 'merge: true' to create/update the document
            await userBasicInfoRef.set(updateBasicInfoData, { merge: true }); 
        }
        
        console.log(`Successfully updated faction and profile data for Firebase UID: ${uid} (Torn ID: ${tornProfileId}).`);

        // Return a success response to the client
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Faction and Profile data updated successfully.',
                faction_id: faction_id,
                faction_name: faction_name,
                position: position,
                profile_image: profile_image, // Return these for client confirmation
                name: name,
                tornProfileId: tornProfileId
            }),
        };

    } catch (error) {
        console.error(`Error updating faction/profile data for UID ${uid}:`, error);
        return {
            statusCode: 500, // Internal Server Error
            body: JSON.stringify({ error: 'Failed to update faction/profile data due to internal server error.' }),
        };
    }
};