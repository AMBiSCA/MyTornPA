// netlify/functions/get-all-database-faction-ids.js

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    try {
        const serviceAccountBase64 = process.env.FIREBASE_CREDENTIALS_BASE64;
        if (!serviceAccountBase64) {
            throw new Error("FIREBASE_CREDENTIALS_BASE64 environment variable is not set.");
        }
        const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('utf8'));
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    } catch (error) {
        console.error("Firebase Admin SDK initialization error:", error);
        throw new Error("Failed to initialize Firebase Admin SDK: " + error.message);
    }
}
const db = admin.firestore();

// Fair Fight Calculation (Included for consistency, though not directly used in this function)
function calculateFairFight(attackerLevel, attackerTotalStats, defenderLevel, defenderTotalStats) { /* ... same code as in process-ff-batch.js ... */ }
function get_difficulty_text(ff) { /* ... same code as in process-ff-batch.js ... */ }


exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ success: false, message: 'Method Not Allowed' }) };
    }

    // --- AUTHENTICATION: VERIFY FIREBASE ID TOKEN ---
    const idToken = event.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
        return { statusCode: 401, body: JSON.stringify({ success: false, message: 'Authentication token missing.' }) };
    }
    let decodedToken;
    try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
        console.error("Firebase ID Token verification failed:", error);
        return { statusCode: 401, body: JSON.stringify({ success: false, message: 'Authentication token invalid or expired.' }) };
    }
    const adminUserId = decodedToken.uid; // The authenticated admin user's UID
    // --- END AUTHENTICATION ---

    try {
        // Assume you have a collection 'monitoredFactions' where you store Faction IDs you want to process.
        // This collection would be populated by the admin manually or via other admin tools.
        const factionsSnapshot = await db.collection('monitoredFactions').get(); // <-- Collection to fetch faction IDs from

        const factionIds = [];
        factionsSnapshot.forEach(doc => {
            // Assuming each document in 'monitoredFactions' has an 'id' field for the faction ID.
            // Or, if the document ID itself is the faction ID, use doc.id
            const factionData = doc.data();
            if (factionData.id) {
                factionIds.push(factionData.id);
            } else if (doc.id && !isNaN(parseInt(doc.id))) { // If document ID is the faction ID
                factionIds.push(parseInt(doc.id));
            }
        });

        if (factionIds.length === 0) {
            console.warn("No faction IDs found in 'monitoredFactions' collection.");
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, factionIds: factionIds }),
        };

    } catch (error) {
        console.error("Error fetching database faction IDs:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: `Failed to fetch database faction IDs: ${error.message}` }),
        };
    }
};