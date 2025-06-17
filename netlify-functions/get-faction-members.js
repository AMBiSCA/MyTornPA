// netlify/functions/get-faction-members.js

const admin = require('firebase-admin'); // Firebase Admin SDK is needed if you fetch API keys from Firestore
const axios = require('axios');

// Initialize Firebase Admin SDK if not already initialized
// This block handles the connection to Firestore using the base64-encoded credentials.
if (!admin.apps.length) {
    try {
        const serviceAccountBase64 = process.env.FIREBASE_CREDENTIALS_BASE64;

        if (!serviceAccountBase64) {
            throw new Error("FIREBASE_CREDENTIALS_BASE64 environment variable is not set.");
        }

        // Decode the base64 string and parse it as JSON
        const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('utf8'));

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            // databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com", // Optional, if using Realtime DB
        });
    } catch (error) {
        console.error("Firebase Admin SDK initialization error:", error);
        throw new Error("Failed to initialize Firebase Admin SDK: " + error.message);
    }
}

const db = admin.firestore(); // Firestore instance

exports.handler = async (event, context) => {
    // --- DEBUGGING CONSOLE LOGS ---
    console.log("get-faction-members function triggered.");
    console.log("Client Context:", context.clientContext);
    console.log("User object from context:", context.clientContext.user);
    // --- END DEBUGGING LOGS ---

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ success: false, message: 'Method Not Allowed' }),
        };
    }

    let factionId;
    try {
        const body = JSON.parse(event.body);
        factionId = body.factionId;
        if (!factionId || isNaN(parseInt(factionId))) {
            throw new Error('Valid Faction ID is required.');
        }
    } catch (error) {
        console.error("Invalid request body:", error.message);
        return {
            statusCode: 400,
            body: JSON.stringify({ success: false, message: `Invalid request: ${error.message}` }),
        };
    }

    // Authenticate user
    const user = context.clientContext.user;
    if (!user) {
        return {
            statusCode: 401,
            body: JSON.stringify({ success: false, message: 'Authentication required.' }),
        };
    }

    let adminTornApiKey; // Assuming this function will also fetch the admin's API key
                          // to make the Torn API call to get faction members.

    try {
        // Fetch the admin's own Torn API key from Firestore.
        const adminDocRef = db.collection('userProfiles').doc(user.uid);
        const adminDoc = await adminDocRef.get();

        if (!adminDoc.exists) {
            return {
                statusCode: 404,
                body: JSON.stringify({ success: false, message: 'Admin user profile not found.' }),
            };
        }
        const adminData = adminDoc.data();
        adminTornApiKey = adminData.tornApiKey; // Get the admin's Torn API key

        if (!adminTornApiKey) {
            return {
                statusCode: 403,
                body: JSON.stringify({ success: false, message: 'Admin Torn API Key not set in profile.' }),
            };
        }

    } catch (error) {
        console.error("Error fetching admin's API key from Firestore:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: `Failed to retrieve admin API key: ${error.message}` }),
        };
    }

    let factionMembers = [];
    let factionName = 'Unknown Faction';
    let totalMembers = 0;

    try {
        // Use the admin's Torn API key to get faction members from Torn API.
        const tornApiUrl = `https://api.torn.com/faction/${factionId}?selections=basic&key=${adminTornApiKey}`;
        const tornApiResponse = await axios.get(tornApiUrl);
        const tornData = tornApiResponse.data;

        if (tornData.error) {
            console.error("Torn API Faction Error:", tornData.error.error);
            return {
                statusCode: 400,
                body: JSON.stringify({ success: false, message: `Torn API Error: ${tornData.error.error}. Check admin's Torn API key and 'Faction' permission.` }),
            };
        }
        if (!tornData.members || Object.keys(tornData.members).length === 0) {
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, message: `No members found for Faction ID ${factionId}.`, memberIDs: [] }),
            };
        }

        factionName = tornData.name || `Faction ${factionId}`;
        factionMembers = Object.keys(tornData.members); // Get array of member IDs
        totalMembers = factionMembers.length;

        console.log(`Successfully fetched ${totalMembers} members for faction ${factionName} [${factionId}].`);

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: `Successfully fetched members for faction ${factionName}.`,
                factionName: factionName,
                factionId: factionId,
                totalMembers: totalMembers,
                memberIDs: factionMembers,
            }),
        };

    } catch (error) {
        console.error("Error fetching faction members from Torn API:", error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: `Failed to fetch faction members from Torn API: ${error.message}.` }),
        };
    }
};