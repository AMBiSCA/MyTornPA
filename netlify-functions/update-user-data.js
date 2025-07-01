// netlify/functions/update-user-data.js

// Import the Firebase Admin SDK
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK only if it hasn't been initialized yet
// This check is important for local development or repeated calls within one cold start.
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // The private key needs special handling as it's a multi-line string
            // and often stored in environment variables with escaped newlines.
privateKey: Buffer.from(process.env.FIREBASE_CREDENTIALS_BASE64, 'base64').toString('utf8').replace(/\\n/g, '\n'), // <--- CORRECTED LINE!
        })
    });
}

// Get a Firestore database instance
const db = admin.firestore();

// Main handler for the Netlify Function
exports.handler = async (event, context) => {
    // Enforce that only POST requests are allowed for security
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    }

    try {
        // Parse the request body to get userId and userData
        // event.body comes as a string, so it needs to be parsed
        const { userId, userData } = JSON.parse(event.body);

        // Basic validation for required data
        if (!userId || !userData) {
            return {
                statusCode: 400, // Bad Request
                body: JSON.stringify({ message: 'Missing userId or userData in request body' }),
            };
        }

        // Determine the Firestore collection and document ID
        // We're assuming your 'users' collection uses the Torn Player ID as the document ID.
        const userDocRef = db.collection('users').doc(String(userId)); // Ensure userId is a string for .doc()

        // Save the comprehensive user data to Firestore.
        // { merge: true } is CRUCIAL here: it updates only the fields you provide,
        // without deleting other existing fields in the document.
        await userDocRef.set(userData, { merge: true });

        console.log(`Successfully updated user ${userId} data in Firestore via Netlify function.`);

        // Return a success response
        return {
            statusCode: 200,
            body: JSON.stringify({ message: `User ${userId} data updated successfully in Firestore` }),
        };
    } catch (error) {
        // Log any errors and return an error response
        console.error('Error updating user data in Netlify function:', error);
        return {
            statusCode: 500, // Internal Server Error
            body: JSON.stringify({ error: error.message || 'Failed to update user data' }),
        };
    }
};