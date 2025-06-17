// netlify/functions/fetch-fairfight-data.js

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

const db = admin.firestore();

// Helper for delays in batch processing (for faction-wide calls)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fair Fight Calculation (consistent across all relevant files)
function calculateFairFight(attackerLevel, attackerTotalStats, defenderLevel, defenderTotalStats) {
    if (!attackerLevel || !defenderLevel || !attackerTotalStats || !defenderTotalStats || defenderTotalStats === 0) {
        return null;
    }
    const attackerBSS = attackerTotalStats;
    const defenderBSS = defenderTotalStats;
    const bssRatio = defenderBSS / attackerBSS;
    let ffScore;
    if (bssRatio >= 0.75) { ffScore = 3.0; }
    else if (bssRatio >= 0.50) { ffScore = 2.0 + ((bssRatio - 0.50) / 0.25) * 1.0; }
    else if (bssRatio >= 0.25) { ffScore = 1.0 + ((bssRatio - 0.25) / 0.25) * 1.0; }
    else { ffScore = 1.0; }
    return Math.max(1.0, Math.min(3.0, parseFloat(ffScore.toFixed(2))));
}

function get_difficulty_text(ff) {
    if (ff === null) return "N/A";
    if (ff >= 2.75) return "Extremely easy";
    else if (ff >= 2.0) return "Easy";
    else if (ff >= 1.5) return "Moderately difficult";
    else if (ff > 1) return "Difficult";
    else return "Extremely difficult";
}

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    const { type, id } = event.queryStringParameters;
    let targetId = parseInt(id);

    if (!type || !id || isNaN(targetId)) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing or invalid parameters: type or id.' }),
        };
    }

    // --- AUTHENTICATION: VERIFY FIREBASE ID TOKEN ---
    const idToken = event.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
        return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Authentication token missing.' }) };
    }
    let decodedToken;
    try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
        console.error("Firebase ID Token verification failed:", error);
        return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Authentication token invalid or expired.' }) };
    }
    const userId = decodedToken.uid; // The authenticated user's UID
    // --- END AUTHENTICATION ---

    let userTornApiKey; // The user's Torn.com API key
    let userLevel;
    let userTotalStats = 0;

    try {
        // Fetch user's API keys and their own stats from Firestore
        const userDocRef = db.collection('userProfiles').doc(userId); // Use userId from decoded token
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'User profile not found.' }),
            };
        }
        const userData = userDoc.data();
        userTornApiKey = userData.tornApiKey;

        if (!userTornApiKey) {
            return {
                statusCode: 403,
                body: JSON.stringify({ error: 'Torn API Key not found in your profile. Please set it.' }),
            };
        }

        // Fetch user's own battle stats and level from Torn API for FF calculation
        const selfStatsUrl = `https://api.torn.com/user/?selections=personalstats,battlestats&key=${userTornApiKey}`; // --- CHANGED TO PERSONALSTATS ---
        const selfStatsResponse = await axios.get(selfStatsUrl);
        const selfData = selfStatsResponse.data;

        if (selfData.error) {
            console.error("Self stats Torn API Error:", selfData.error.error);
            return {
                statusCode: 403, // Or 500 depending on error type
                body: JSON.stringify({ error: `Failed to fetch your own stats from Torn API: ${selfData.error.error}. Check your Torn API key permissions (Personal Stats, Battlestats).` }),
            };
        }

        userLevel = selfData.level;
        // Summing battle stats for total, assuming they are available
        userTotalStats = (selfData.battle_stats?.strength || 0) +
                         (selfData.battle_stats?.defense || 0) +
                         (selfData.battle_stats?.speed || 0) +
                         (selfData.battle_stats?.dexterity || 0);

        if (!userLevel || userTotalStats === 0) {
             return {
                statusCode: 403,
                body: JSON.stringify({ error: 'Could not retrieve your own battle stats or level. Ensure Torn API key has "Personal Stats" and "Battle Stats" selections enabled.' }),
            };
        }

    } catch (error) {
        console.error("Error fetching user's own API keys or stats:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Failed to retrieve user data: ${error.message}` }),
        };
    }

    try {
        if (type === 'player') {
            // --- Individual Player Fair Fight Check ---
            const tornApiPlayerUrl = `https://api.torn.com/user/<span class="math-inline">\{targetId\}?selections\=basic,battlestats&key\=</span>{userTornApiKey}`; // Use Torn API
            const response = await axios.get(tornApiPlayerUrl);
            const data = response.data;

            if (data.error || !data.level || !data.battle_stats || data.battle