// netlify/functions/process-ff-batch.js

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
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms)); // Helper for delays

// Fair Fight Calculation (consistent across all relevant files)
function calculateFairFight(attackerLevel, attackerTotalStats, defenderLevel, defenderTotalStats) {
    if (!attackerLevel || !defenderLevel || !attackerTotalStats || !defenderTotalStats || defenderTotalStats === 0) { return null; }
    const attackerBSS = attackerTotalStats; const defenderBSS = defenderTotalStats; const bssRatio = defenderBSS / attackerBSS; let ffScore;
    if (bssRatio >= 0.75) { ffScore = 3.0; } else if (bssRatio >= 0.50) { ffScore = 2.0 + ((bssRatio - 0.50) / 0.25) * 1.0; } else if (bssRatio >= 0.25) { ffScore = 1.0 + ((bssRatio - 0.25) / 0.25) * 1.0; } else { ffScore = 1.0; }
    return Math.max(1.0, Math.min(3.0, parseFloat(ffScore.toFixed(2))));
}
// Get Difficulty Text (consistent across relevant files)
function get_difficulty_text(ff) {
    if (ff === null) return "N/A";
    if (ff >= 2.75) return "Extremely easy"; else if (ff >= 2.0) return "Easy"; else if (ff >= 1.5) return "Moderately difficult"; else if (ff > 1) return "Difficult"; else return "Extremely difficult";
}


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

    const { factionId, memberIDs, startIndex, batchSize } = JSON.parse(event.body);

    if (!memberIDs || !Array.isArray(memberIDs) || typeof startIndex !== 'number' || typeof batchSize !== 'number') {
        return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Missing or invalid batch parameters.' }) };
    }

    let adminTornApiKey;      // Admin's Torn.com API key (still needed for admin's own stats)
    let adminTornStatsApiKey; // Admin's TornStats.com API key (NEEDED for target stats from TornStats)
    let adminLevel;
    let adminTotalStats = 0; // Admin's total battle stats, crucial for FF calculation

    try {
        // Fetch the admin user's own API keys from Firestore
        const adminDocRef = db.collection('userProfiles').doc(adminUserId);
        const adminDoc = await adminDocRef.get();

        if (!adminDoc.exists) {
            return { statusCode: 404, body: JSON.stringify({ success: false, message: 'Admin user profile not found.' }) };
        }
        const adminData = adminDoc.data();
        adminTornApiKey = adminData.tornApiKey; // Get the admin's Torn API key
        adminTornStatsApiKey = adminData.tornStatsApiKey; // Get the admin's TornStats API key (NEW: needed here)

        if (!adminTornApiKey) {
            return { statusCode: 403, body: JSON.stringify({ success: false, message: 'Admin Torn API Key not set in profile (needed for own stats).' }) };
        }
        if (!adminTornStatsApiKey) { // Admin TornStats key is now required for target stats
            return { statusCode: 403, body: JSON.stringify({ success: false, message: 'Admin TornStats API Key not set in profile (needed for target stats).' }) };
        }

        // Fetch admin's own battle stats and level from Torn API (still from Torn.com, needed for FF calculation)
        const selfStatsUrl = `https://api.torn.com/user/?selections=personalstats,battlestats&key=${adminTornApiKey}`;
        const selfStatsResponse = await axios.get(selfStatsUrl);
        const selfData = selfStatsResponse.data;

        if (selfData.error) {
            console.error("Admin self stats Torn API Error:", selfData.error.error);
            return {
                statusCode: 403,
                body: JSON.stringify({ success: false, message: `Failed to fetch admin's own stats from Torn API: ${selfData.error.error}. Check admin's Torn API key permissions (Personal Stats, Battlestats).` }),
            };
        }

        adminLevel = selfData.level;
        adminTotalStats = (selfData.battle_stats?.strength || 0) +
                          (selfData.battle_stats?.defense || 0) +
                          (selfData.battle_stats?.speed || 0) +
                          (selfData.battle_stats?.dexterity || 0);

        if (!adminLevel || adminTotalStats === 0) {
             return {
                statusCode: 403,
                body: JSON.stringify({ success: false, message: 'Could not retrieve admin\'s own battle stats or level. Ensure Torn API key has "Personal Stats" and "Battle Stats" selections enabled.' }),
            };
        }

    } catch (error) {
        console.error("Error fetching admin's API keys or stats:", error);
        return { statusCode: 500, body: JSON.stringify({ success: false, message: `Failed to retrieve admin data: ${error.message}` }) };
    }

    const currentBatch = memberIDs.slice(startIndex, startIndex + batchSize);
    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    try {
        const batchPromises = currentBatch.map(async (memberId) => {
            try {
                // --- NEW: Fetch target player data from TornStats API ---
                const playerUrl = `https://www.tornstats.com/api/v2/${adminTornStatsApiKey}/spy/user/${memberId}`; // Use admin's TornStats key
                const playerResponse = await axios.get(playerUrl);
                const playerData = playerResponse.data;

                // Check if TornStats returned valid spy data
                if (playerData.status === false || !playerData.spy || playerData.spy.total === undefined) {
                    console.warn(`Skipped player ${memberId}: TornStats returned no spy data - ${playerData.message || playerData.spy?.message || 'N/A'}`);
                    skippedCount++;
                    return null; // Skip this player if no spy data is available
                }

                // Get target details from TornStats response
                const targetLevel = playerData.spy.level;
                const targetTotalStats = playerData.spy.total; // TornStats provides total directly

                // OPTIONAL: Fetch basic info from Torn API to get name and last_action.
                // This is optional if the Torn API is problematic, but good for data completeness.
                // If this is causing 403s, you can remove this try/catch block and use TornStats name only.
                let tornApiBasicData = {};
                try {
                    const tornBasicUrl = `https://api.torn.com/user/${memberId}?selections=basic&key=${adminTornApiKey}`;
                    const tornBasicResponse = await axios.get(tornBasicUrl);
                    tornApiBasicData = tornBasicResponse.data;
                } catch (tornBasicError) {
                    console.warn(`Could not fetch basic info from Torn API for ${memberId}: ${tornBasicError.message}. Using TornStats name and no last_action.`);
                }
                
                // Calculate Fair Fight score using the admin's stats vs. target's stats from TornStats
                const adminFFScore = calculateFairFight(adminLevel, adminTotalStats, targetLevel, targetTotalStats);

                // Prepare data object to be saved to Firestore
                const ffDataToSave = {
                    id: memberId,
                    name: tornApiBasicData.name || playerData.spy.player_name || `User ${memberId}`, // Prefer Torn API name, then TornStats name
                    level: targetLevel,
                    totalStats: targetTotalStats, // Store target's total stats from TornStats
                    adminFFScore: adminFFScore,
                    adminFFDifficulty: get_difficulty_text(adminFFScore),
                    lastActiveTimestamp: tornApiBasicData.last_action?.timestamp || null, // From Torn API, if available
                    lastFetchedTimestamp: admin.firestore.FieldValue.serverTimestamp(), // Firestore server timestamp
                };

                // Save to Firestore: 'adminCuratedFFTargets' collection, document ID is the player's ID
                await db.collection('adminCuratedFFTargets').doc(memberId.toString()).set(ffDataToSave, { merge: true });
                successCount++;
                return ffDataToSave;

            } catch (memberError) {
                console.error(`Error processing FF data for member ${memberId} from TornStats:`, memberError.message);
                errorCount++;
                return null;
            }
        });

        await Promise.allSettled(batchPromises);

        await sleep(1000); // 1-second delay for each batch

        const nextStartIndex = startIndex + batchSize;
        const isComplete = nextStartIndex >= memberIDs.length;

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                message: 'Batch processed successfully',
                processedSummary: { successCount, skippedCount, errorCount },
                nextStartIndex: nextStartIndex,
                isComplete: isComplete,
            }),
        };

    } catch (error) {
        console.error("Batch processing error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: `Server error during batch processing: ${error.message}` }),
        };
    }
};