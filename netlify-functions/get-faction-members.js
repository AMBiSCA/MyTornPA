// netlify/functions/get-faction-members.js

const admin = require('firebase-admin');
const axios = require('axios');

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
const db = admin.firestore(); // Firestore instance
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms)); // Common helper

// Fair Fight Calculation (Included for consistency, though not directly used in this function)
function calculateFairFight(attackerLevel, attackerTotalStats, defenderLevel, defenderTotalStats) { /* ... same code as in process-ff-batch.js ... */ }
function get_difficulty_text(ff) { /* ... same code as in process-ff-batch.js ... */ }


exports.handler = async (event, context) => {
    // --- DEBUGGING CONSOLE LOGS ---
    console.log("get-faction-members function triggered.");
    // --- END DEBUGGING LOGS ---

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ success: false, message: 'Method Not Allowed' }),
        };
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

    let adminTornApiKey;

    try {
        // Fetch the admin's Torn API key from Firestore based on their authenticated UID.
        const adminDocRef = db.collection('userProfiles').doc(adminUserId);
        const adminDoc = await adminDocRef.get();

        if (!adminDoc.exists) {
            return {
                statusCode: 404,
                body: JSON.stringify({ success: false, message: 'Admin user profile not found.' }),
            };
        }
        const adminData = adminDoc.data();
        adminTornApiKey = adminData.tornApiKey;

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

// --- Fair Fight Calculation and Difficulty Text (Repeated for code consistency, put at the bottom) ---
// This ensures that if this function were ever to need these, they are defined.
function calculateFairFight(attackerLevel, attackerTotalStats, defenderLevel, defenderTotalStats) {
    if (!attackerLevel || !defenderLevel || !attackerTotalStats || !defenderTotalStats || defenderTotalStats === 0) { return null; }
    const attackerBSS = attackerTotalStats; const defenderBSS = defenderTotalStats; const bssRatio = defenderBSS / attackerBSS; let ffScore;
    if (bssRatio >= 0.75) { ffScore = 3.0; } else if (bssRatio >= 0.50) { ffScore = 2.0 + ((bssRatio - 0.50) / 0.25) * 1.0; } else if (bssRatio >= 0.25) { ffScore = 1.0 + ((bssRatio - 0.25) / 0.25) * 1.0; } else { ffScore = 1.0; }
    return Math.max(1.0, Math.min(3.0, parseFloat(ffScore.toFixed(2))));
}
function get_difficulty_text(ff) {
    if (ff === null) return "N/A";
    if (ff >= 2.75) return "Extremely easy"; else if (ff >= 2.0) return "Easy"; else if (ff >= 1.5) return "Moderately difficult"; else if (ff > 1) return "Difficult"; else return "Extremely difficult";
}