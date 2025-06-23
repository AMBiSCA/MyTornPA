// netlify/functions/update-user-data.js

// Import necessary modules
const admin = require('firebase-admin'); // Firebase Admin SDK for server-side operations

// Initialize Firebase Admin SDK if it hasn't been initialized yet
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
        // It's critical that the function exits if Firebase initialization fails
        // In a real Netlify environment, this might prevent the function from starting.
        // For local development, you might need to handle this more gracefully.
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

    let userId;
    let userData;

    try {
        // Parse the request body
        const body = JSON.parse(event.body);
        userId = body.userId; // Expecting the user's Torn Player ID
        userData = body.userData; // Expecting the user data object to save

        // Validate required parameters
        if (!userId || !userData) {
            console.warn('Missing userId or userData in request body.');
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing userId or userData.' }),
            };
        }

        // Optional: Implement additional security checks here
        // For example, if you're using Netlify Identity, you could verify the user's identity:
        // if (!context.clientContext || !context.clientContext.user) {
        //     return {
        //         statusCode: 401,
        //         body: JSON.stringify({ error: 'Unauthorized: No authenticated user.' }),
        //     };
        // }
        // const authenticatedFirebaseUID = context.clientContext.user.sub; // Firebase UID from Netlify Identity
        // if (authenticatedFirebaseUID !== userId) { // If your Firebase UID is supposed to match Torn ID
        //     return {
        //         statusCode: 403,
        //         body: JSON.stringify({ error: 'Forbidden: User ID mismatch.' }),
        //     };
        // }

    } catch (parseError) {
        console.error('Error parsing request body:', parseError);
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid request body format.' }),
        };
    }

    try {
        // Use the Admin SDK to securely save the user data to Firestore
        // The { merge: true } option is important to only update specified fields
        await db.collection('users').doc(String(userId)).set(userData, { merge: true });

        console.log(`Successfully saved user ${userId} data to Firestore via Netlify Function.`);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'User data updated successfully.' }),
        };

    } catch (error) {
        console.error(`Error saving user data for UID ${userId} via Netlify Function:`, error);
        return {
            statusCode: 500, // Server error for unexpected issues
            body: JSON.stringify({ error: 'Failed to save user data due to internal server error.' }),
        };
    }
};