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

// IMPORTANT: This is your actual Cloudflare Worker URL
// This is the URL of your 'torn-data-updater' Cloudflare Worker (from Step 7)
const CLOUDFLARE_WORKER_URL = 'https://torn-data-updater.billy-fergusonx.workers.dev/';

exports.handler = async (event, context) => {
    // Only allow POST requests for this function
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405, // Method Not Allowed
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    }

    // Declare all expected variables from the request body
    let uid, faction_id, faction_name, position, profile_image, name, tornProfileId, tornApiKey; // Added tornApiKey here for clarity

    try {
        // Parse the request body (which is a JSON string)
        const body = JSON.parse(event.body);

        // Extract the values from the parsed body
        uid = body.uid;
        faction_id = body.faction_id;
        faction_name = body.faction_name;
        position = body.position;
        profile_image = body.profile_image;
        name = body.name;
        tornProfileId = body.tornProfileId; // This is the Torn Player ID
        tornApiKey = body.tornApiKey; // Assuming tornApiKey is also passed from frontend

        // Validate required parameters
        if (!uid || !tornProfileId || !tornApiKey) {
            console.warn('Missing UID, tornProfileId, or tornApiKey in request body.');
            return {
                statusCode: 400, // Bad Request
                body: JSON.stringify({ error: 'Missing UID, tornProfileId, or tornApiKey.' }),
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
        const userProfileRef = db.collection('userProfiles').doc(uid);
        
        const updateProfileData = {
            lastFactionUpdated: admin.firestore.FieldValue.serverTimestamp(),
            faction_id: faction_id !== undefined ? faction_id : null,
            faction_name: faction_name !== undefined ? faction_name : null,
            position: position !== undefined ? position : null,
            profile_image: profile_image !== undefined ? profile_image : null,
            name: name !== undefined ? name : null,
            tornProfileId: tornProfileId !== undefined ? tornProfileId : null,
        };
        await userProfileRef.set(updateProfileData, { merge: true });

        // --- 2. Also update 'users' collection (Torn Player ID as document ID) ---
        if (tornProfileId) {
            const userBasicInfoRef = db.collection('users').doc(String(tornProfileId));
            const updateBasicInfoData = {
                profile_image: profile_image !== undefined ? profile_image : null,
                name: name !== undefined ? name : null,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            };
            await userBasicInfoRef.set(updateBasicInfoData, { merge: true });
        }
        
        console.log(`Successfully updated faction and profile data in Firestore for Firebase UID: ${uid} (Torn ID: ${tornProfileId}).`);

        // --- 3. Trigger the Cloudflare Worker to update comprehensive faction data ---
        try {
            if (!CLOUDFLARE_WORKER_URL) {
                console.error("Cloudflare Worker URL is not set. Cannot trigger faction data update.");
            } else {
                console.log(`Triggering Cloudflare Worker at ${CLOUDFLARE_WORKER_URL} for Torn ID: ${tornProfileId}`);
                const workerResponse = await fetch(CLOUDFLARE_WORKER_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        uid: uid,
                        tornProfileId: tornProfileId, // This is the PLAYER ID
                        tornApiKey: tornApiKey // Pass the user's API key
                    }),
                });

                const workerData = await workerResponse.json();

                if (!workerResponse.ok) {
                    console.error(`Cloudflare Worker for ${tornProfileId} failed:`, workerData.error || workerResponse.statusText);
                } else {
                    console.log(`Cloudflare Worker for ${tornProfileId} succeeded:`, workerData.message);
                }
            }
        } catch (workerCallError) {
            console.error(`Network error calling Cloudflare Worker for ${tornProfileId}:`, workerCallError);
        }

        // Return a success response to the client
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Faction and Profile data updated successfully, and faction data sync initiated.',
                faction_id: faction_id,
                faction_name: faction_name,
                position: position,
                profile_image: profile_image,
                name: name,
                tornProfileId: tornProfileId
            }),
        };

    } catch (mainError) {
        console.error(`Error updating faction/profile data for UID ${uid}:`, mainError);
        return {
            statusCode: 500, // Internal Server Error
            body: JSON.stringify({ error: 'Failed to update faction/profile data due to internal server error.' }),
        };
    }
};