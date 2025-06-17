// netlify/functions/process-ff-batch.js

const admin = require('firebase-admin');
const axios = require('axios');

// Initialize Firebase Admin SDK
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
            // Optionally set databaseURL if you use Realtime Database, not strictly needed for Firestore
            // databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com", // You can get project_id from serviceAccount.project_id
        });
    } catch (error) {
        console.error("Firebase Admin SDK initialization error:", error);
        // Re-throw to indicate a critical setup failure for Netlify Functions logs
        throw new Error("Failed to initialize Firebase Admin SDK: " + error.message);
    }
}

const db = admin.firestore(); // Firestore instance

// Helper for delays
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fair Fight Calculation based on Battle Stat Score (BSS) ratio, similar to TornTargets logic
// This is the interpretation of the "75% of BSS for 3x FF" rule.
function calculateFairFight(attackerLevel, attackerTotalStats, defenderLevel, defenderTotalStats) {
    // Basic validation
    if (!attackerLevel || !defenderLevel || !attackerTotalStats || !defenderTotalStats || defenderTotalStats === 0) {
        return null; // Cannot calculate if data is missing or defender stats are zero
    }
    
    // Battle Stat Score (BSS) is assumed to be the total sum of Strength, Defense, Speed, Dexterity.
    const attackerBSS = attackerTotalStats;
    const defenderBSS = defenderTotalStats;

    // Calculate stat ratio: Defender's BSS relative to Attacker's BSS
    const bssRatio = defenderBSS / attackerBSS;

    let ffScore;

    // Logic for FF multiplier tiers (1.0 to 3.0)
    if (bssRatio >= 0.75) { // Defender's BSS is 75% or more of attacker's BSS
        ffScore = 3.0; // Max Fair Fight Multiplier
    } else if (bssRatio >= 0.50) { // Defender's BSS is 50% or more (but less than 75%)
        // Linear interpolation between 2.0 and 3.0 based on ratio within this band
        // (Ratio - 0.50) / (0.75 - 0.50) gives a 0-1 scale.
        // Then scale that range (1.0 for this band) from 2.0.
        ffScore = 2.0 + ((bssRatio - 0.50) / 0.25) * 1.0;
    } else if (bssRatio >= 0.25) { // Defender's BSS is 25% or more (but less than 50%)
        // Linear interpolation between 1.0 and 2.0
        ffScore = 1.0 + ((bssRatio - 0.25) / 0.25) * 1.0;
    } else { // Defender's BSS is less than 25%
        ffScore = 1.0; // Minimum Fair Fight Multiplier
    }

    // Ensure the FF score is within the typical Torn Fair Fight multiplier range (1.0 to 3.0).
    return Math.max(1.0, Math.min(3.0, parseFloat(ffScore.toFixed(2)))); // Round to 2 decimal places
}

// Function to convert FF score to text difficulty (consistent with fairfight.js)
// Make sure this matches your frontend's display logic for difficulty.
function get_difficulty_text(ff) {
    if (ff === null) return "N/A";
    if (ff >= 2.75) return "Extremely easy"; // E.g., for 2.75x to 3.0x FF multiplier
    else if (ff >= 2.0) return "Easy";      // E.g., for 2.0x to 2.74x FF multiplier
    else if (ff >= 1.5) return "Moderately difficult";
    else if (ff > 1) return "Difficult";
    else return "Extremely difficult"; // When FF multiplier is 1.0x
}


exports.handler = async (event, context) => {
    // Only allow POST requests, as per frontend's fetch call
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ success: false, message: 'Method Not Allowed' }) };
    }

    // Parse the request body to get faction/member details
    const { factionId, memberIDs, startIndex, batchSize } = JSON.parse(event.body);

    // Basic validation of incoming data
    if (!memberIDs || !Array.isArray(memberIDs) || typeof startIndex !== 'number' || typeof batchSize !== 'number') {
        return { statusCode: 400, body: JSON.stringify({ success: false, message: 'Missing or invalid batch parameters.' }) };
    }

    // Authenticate the admin user making the request using Netlify's context
    const user = context.clientContext.user;
    if (!user) {
        return { statusCode: 401, body: JSON.stringify({ success: false, message: 'Authentication required.' }) };
    }

    let adminTornApiKey;
    let adminLevel;
    let adminTotalStats = 0; // Admin's total battle stats, crucial for FF calculation

    try {
        // Fetch the admin user's own API key and battle stats from Firestore.
        // This ensures the FF calculation is always based on the admin's current stats.
        const adminDocRef = db.collection('userProfiles').doc(user.uid);
        const adminDoc = await adminDocRef.get();

        if (!adminDoc.exists) {
            return { statusCode: 404, body: JSON.stringify({ success: false, message: 'Admin user profile not found.' }) };
        }
        const adminData = adminDoc.data();
        adminTornApiKey = adminData.tornApiKey; // Get the admin's Torn API key

        if (!adminTornApiKey) {
            return { statusCode: 403, body: JSON.stringify({ success: false, message: 'Admin Torn API Key not set in profile.' }) };
        }

        // Fetch admin's own battle stats and level from Torn API using their key
        const selfStatsUrl = `https://api.torn.com/user/?selections=basic,battlestats&key=${adminTornApiKey}`;
        const selfStatsResponse = await axios.get(selfStatsUrl);
        const selfData = selfStatsResponse.data;

        if (selfData.error) {
            console.error("Admin self stats Torn API Error:", selfData.error.error);
            return {
                statusCode: 403, // Or 500 depending on error type
                body: JSON.stringify({ success: false, message: `Failed to fetch admin's own stats from Torn API: ${selfData.error.error}. Check admin's Torn API key permissions (Basic, Battlestats).` }),
            };
        }

        adminLevel = selfData.level;
        // Summing battle stats for total BSS
        adminTotalStats = (selfData.battle_stats?.strength || 0) +
                          (selfData.battle_stats?.defense || 0) +
                          (selfData.battle_stats?.speed || 0) +
                          (selfData.battle_stats?.dexterity || 0);

        if (!adminLevel || adminTotalStats === 0) {
             return {
                statusCode: 403,
                body: JSON.stringify({ success: false, message: 'Could not retrieve admin\'s own battle stats or level. Ensure Torn API key has "Basic" and "Battle Stats" selections enabled.' }),
            };
        }

    } catch (error) {
        console.error("Error fetching admin's API key or stats:", error);
        return { statusCode: 500, body: JSON.stringify({ success: false, message: `Failed to retrieve admin data: ${error.message}` }) };
    }

    // Process the current batch of member IDs received from the frontend
    const currentBatch = memberIDs.slice(startIndex, startIndex + batchSize);
    let successCount = 0;
    let skippedCount = 0; // For players without valid data for FF calculation
    let errorCount = 0;   // For API call errors

    try {
        const batchPromises = currentBatch.map(async (memberId) => {
            try {
                // Fetch target player's basic info & battle stats from Torn API
                const playerUrl = `https://api.torn.com/user/${memberId}?selections=basic,battlestats&key=${adminTornApiKey}`;
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