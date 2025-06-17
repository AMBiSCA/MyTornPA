const admin = require('firebase-admin');

// Initialize Firebase Admin SDK if it hasn't been already
if (!admin.apps.length) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (error) {
        console.error("Firebase Admin initialization error:", error);
        throw new Error("Failed to initialize Firebase Admin SDK.");
    }
}

const db = admin.firestore();

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const { userLevel, selfId, numTargets, minFairFight, maxFairFight, maxDaysInactive } = event.queryStringParameters;

    if (!userLevel) {
        return { statusCode: 400, body: JSON.stringify({ error: 'User level is required for target generation.' }) };
    }
    if (!selfId) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Your Player ID (selfId) is required to exclude yourself.' }) };
    }

    const desiredTargetsCount = parseInt(numTargets) || 10;
    const currentUserLevel = parseInt(userLevel);

    // Dynamic Level Range based on user's level
    const minTargetLevel = Math.max(15, currentUserLevel - 20); // Still use this for specific filtering

    const minFF = parseFloat(minFairFight) || 2.5;
    const maxFF = parseFloat(maxFairFight) || 4.0;
    const maxDaysIn = parseInt(maxDaysInactive) || 365;

    console.log(`Live generator for user level ${currentUserLevel}. Criteria: FF ${minFF}-${maxFF}, Max Inactive ${maxDaysIn} days, Min Target Level ${minTargetLevel}.`);

    const foundTargets = [];
    const processedIds = new Set(); // To avoid duplicate targets in the result

    try {
        // Step 1: Fetch a pool of pre-collected targets from Firestore
        // We'll fetch more than needed, then filter locally for speed.
        // Order by timestampCollected descending to get newer targets first (optional)
        // Limit to a larger pool, e.g., 200, to ensure enough candidates for filtering.
        const targetsRef = db.collection('fairFightTargets');
        const snapshot = await targetsRef
                                .orderBy('timestampCollected', 'desc') // Get newer targets first
                                .limit(500) // Fetch a larger pool to find targets quickly
                                .get();

        if (snapshot.empty) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'No pre-collected targets found in the database. Please wait for the background collector to run.' }),
            };
        }

        const potentialTargets = [];
        snapshot.forEach(doc => {
            potentialTargets.push(doc.data());
        });

        // Step 2: Apply specific user criteria to the fetched pool
        // Shuffle the potential targets for randomness
        potentialTargets.sort(() => Math.random() - 0.5); 

        for (const target of potentialTargets) {
            if (foundTargets.length >= desiredTargetsCount) break; // Found enough targets

            if (target.playerId.toString() === selfId || processedIds.has(target.playerId)) {
                continue; // Skip self and already processed IDs
            }

            // Apply all filters: level, last active, Fair Fight score
            const ageDays = (Math.floor(Date.now() / 1000) - target.lastActiveTimestamp) / (24 * 60 * 60);

            if (
                target.playerLevel < minTargetLevel ||
                ageDays > maxDaysIn ||
                target.fairFightScore < minFF ||
                target.fairFightScore > maxFF
            ) {
                continue; // Doesn't meet user's specific criteria
            }

            foundTargets.push({
                id: target.playerId,
                name: target.playerName,
                level: target.playerLevel,
                last_action: { timestamp: target.lastActiveTimestamp }, // Re-map to expected structure
                fair_fight_data: {
                    fair_fight: target.fairFightScore,
                    difficulty: target.fairFightDifficulty,
                    bs_estimate_human: target.estimatedBattleStatsHuman,
                    last_updated: target.timestampCollected // Use collector's timestamp or source timestamp
                },
            });
            processedIds.add(target.playerId);
        }

    } catch (error) {
        console.error("Live Target Generator Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Failed to generate targets from database: ${error.message}` }),
        };
    }

    if (foundTargets.length === 0) {
        return {
            statusCode: 404, // Return 404 if no targets found after filtering
            body: JSON.stringify({ error: 'No targets found matching your exact criteria from the pre-collected pool. Try adjusting filters or wait for more data to be collected.' }),
        };
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ targets: foundTargets }),
    };
};