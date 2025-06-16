const admin = require('firebase-admin');

// --- Firebase Initialization (from previous steps, ensures credentials are loaded) ---
const FIREBASE_CREDENTIALS_BASE64 = process.env.FIREBASE_CREDENTIALS_BASE64;

if (admin.apps.length === 0) {
    try {
        if (!FIREBASE_CREDENTIALS_BASE64) {
            const errorMsg = "CRITICAL: FIREBASE_CREDENTIALS_BASE64 environment variable is NOT SET. Cannot initialize Firebase Admin SDK.";
            console.error(errorMsg);
            throw new Error(errorMsg);
        }

        const decodedCredentialsJson = Buffer.from(FIREBASE_CREDENTIALS_BASE64, 'base64').toString('utf8');
        const serviceAccount = JSON.parse(decodedCredentialsJson);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin SDK initialized successfully for get-all-database-faction-ids.");
    } catch (error) {
        console.error("ERROR: Firebase initialization failed for get-all-database-faction-ids. Details:", error);
        throw new Error(`Firebase initialization failed for get-all-database-faction-ids: ${error.message}`);
    }
}
const db = admin.firestore();
// --- End Firebase Initialization ---


// Netlify Function Handler
exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed. Only POST requests are allowed.' })
        };
    }

    console.log("[get-all-database-faction-ids] Function triggered to fetch unique faction IDs from database.");

    try {
        const factionIds = new Set(); // Use a Set to store unique IDs

        // Query the 'playerdatabase' collection
        // We'll query in batches to avoid hitting document limits for a single query.
        // A direct "distinct" query is not available in Firestore, so we fetch documents
        // and extract the faction_id from each.
        const collectionRef = db.collection('playerdatabase');
        
        let lastDoc = null; // For pagination
        let querySnapshot;

        // Loop to fetch documents in batches until all are retrieved
        do {
            let query = collectionRef.orderBy(admin.firestore.FieldPath.documentId()).limit(1000); // Order by document ID for efficient pagination
            if (lastDoc) {
                query = query.startAfter(lastDoc);
            }
            querySnapshot = await query.get();

            querySnapshot.forEach(doc => {
                const data = doc.data();
                // Crucial: now looking for 'faction_id' as we've implemented saving it.
                if (data.faction_id && !isNaN(data.faction_id)) { 
                    factionIds.add(data.faction_id); // Add unique factionId
                }
            });

            lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1]; // Get last doc for next batch
        } while (querySnapshot.size > 0); // Continue if the last query returned any documents

        const uniqueFactionIds = Array.from(factionIds).sort((a, b) => a - b); // Convert Set to Array and sort

        console.log(`[get-all-database-faction-ids] Found ${uniqueFactionIds.length} unique faction IDs in database.`);

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                success: true,
                factionIds: uniqueFactionIds,
                count: uniqueFactionIds.length
            })
        };

    } catch (error) {
        console.error("[get-all-database-faction-ids] Error fetching unique faction IDs:", error);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                success: false,
                message: "Internal server error retrieving database faction IDs.",
                details: error.message
            })
        };
    }
};