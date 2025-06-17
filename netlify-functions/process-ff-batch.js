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

    let adminTornApiKey;
    let adminLevel;
    let adminTotalStats = 0; // Admin's total battle stats, crucial for FF calculation

    try {
        // Fetch the admin user's own API key and battle stats from Firestore
        const adminDocRef = db.collection('userProfiles').doc(adminUserId);
        const adminDoc = await adminDocRef.get();

        if (!adminDoc.exists) {
            return { statusCode: 404, body: JSON.stringify({ success: false, message: 'Admin user profile not found.' }) };
        }
        const adminData = adminDoc.data();
        adminTornApiKey = adminData.tornApiKey;

        if (!adminTornApiKey) {
            return { statusCode: 403, body: JSON.stringify({ success: false, message: 'Admin Torn API Key not set in profile.' }) };
        }

        // Fetch admin's own battle stats and level from Torn API
        const selfStatsUrl = `https://api.torn.com/user/?selections=personalstats,battlestats&key=${adminTornApiKey}`; // --- CHANGED TO PERSONALSTATS ---
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
        console.error("Error fetching admin's API key or stats:", error);
        return { statusCode: 500, body: JSON.stringify({ success: false, message: `Failed to retrieve admin data: ${error.message}` }) };
    }

    const currentBatch = memberIDs.slice(startIndex, startIndex + batchSize);
    let successCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    try {
        const batchPromises = currentBatch.map(async (memberId) => {
            try {
                // Fetch target player's basic info & battle stats from Torn API
                const playerUrl = `https://api.torn.com/user/${memberId}?selections=basic,battlestats&key=${adminTornApiKey}`; // Basic is usually sufficient for target data
                const playerResponse = await axios.get(playerUrl);
                const playerData = playerResponse.data;

                // Check if player data is valid for FF calculation
                if (playerData.error || !playerData.level || !playerData.battle_stats || playerData.battle_stats.total === 0) {
                    console.warn(`Skipped player ${memberId}: Torn API data incomplete or no battle stats - ${playerData.error?.error || 'N/A'}`);
                    skippedCount++;
                    return null; // Skip this player if data is insufficient
                }

                const targetLevel = playerData.level;
                const targetTotalStats = (playerData.battle_stats.strength || 0) +
                                         (playerData.battle_stats.defense || 0) +
                                         (playerData.battle_stats.speed || 0) +
                                         (playerData.battle_stats.dexterity || 0);

                // Calculate Fair Fight score using the admin's stats vs. target's stats
                const adminFFScore = calculateFairFight(adminLevel, adminTotalStats, targetLevel, targetTotalStats);

                // Prepare data object to be saved to Firestore
                const ffDataToSave = {
                    id: memberId,
                    name: playerData.name,
                    level: targetLevel,
                    totalStats: targetTotalStats, // Store target's total stats
                    adminFFScore: adminFFScore,
                    adminFFDifficulty: get_difficulty_text(adminFFScore),
                    lastActiveTimestamp: playerData.last_action.timestamp, // Unix timestamp in seconds
                    lastFetchedTimestamp: admin.firestore.FieldValue.serverTimestamp(), // Firestore server timestamp
                };

                // Save to Firestore: 'adminCuratedFFTargets' collection, document ID is the player's ID
                await db.collection('adminCuratedFFTargets').doc(memberId.toString()).set(ffDataToSave, { merge: true });
                successCount++;
                return ffDataToSave; // Return the saved data for logging/tracking

            } catch (memberError) {
                console.error(`Error processing FF data for member ${memberId}:`, memberError.message);
                errorCount++;
                return null; // Indicate failure for this specific member
            }
        });

        await Promise.allSettled(batchPromises); // Wait for all promises in the batch to resolve/reject

        // Add a delay between batches to respect Torn API rate limits
        await sleep(1000); // 1-second delay for each batch, adjust as needed (Torn API is 100/min or 5/sec for personal key)

        // Determine next starting point for the frontend
        const nextStartIndex = startIndex + batchSize;
        const isComplete = nextStartIndex >= memberIDs.length; // Check if all members have been processed

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