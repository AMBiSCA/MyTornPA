// File: netlify/functions/get-recommended-targets.js

const fetch = require('node-fetch');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK using environment variables
try {
    if (!admin.apps.length) {
        const serviceAccountJson = Buffer.from(process.env.FIREBASE_CREDENTIALS_BASE64, 'base64').toString('utf8');
        const serviceAccount = JSON.parse(serviceAccountJson);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }
} catch (e) {
    console.error('Firebase Admin initialization error in get-recommended-targets:', e);
}

const db = admin.firestore();

// Helper function for Fair Fight calculation
function calculateFairFight(attackerStats, defenderStats) {
    if (attackerStats === 0) return Infinity; // Avoid division by zero
    return Math.pow((defenderStats / attackerStats), 0.25);
}

// Helper function for difficulty text
function getDifficultyText(ff) {
    if (ff <= 1) return "Extremely easy";
    if (ff <= 2) return "Easy";
    if (ff <= 3.5) return "Moderate";
    if (ff <= 4.5) return "Difficult";
    return "Very Difficult";
}

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { apiKey, playerId } = JSON.parse(event.body);
        if (!apiKey || !playerId) {
            throw new Error("API key and Player ID are required.");
        }

        // --- NEW Step 1: Get the current user's (attacker's) total battle stats ---
        console.log(`Fetching stats for attacker ID: ${playerId}`);
        const userStatsUrl = `https://api.torn.com/user/${playerId}?selections=battlestats&key=${apiKey}`;
        const userStatsResponse = await fetch(userStatsUrl);
        if (!userStatsResponse.ok) throw new Error("Failed to fetch your stats from Torn API.");
        
        const userStatsData = await userStatsResponse.json();
        if (userStatsData.error) throw new Error(`Torn API Error (User Stats): ${userStatsData.error.error}`);
        
        const userTotalStats = userStatsData.strength + userStatsData.defense + userStatsData.speed + userStatsData.dexterity;
        if (userTotalStats <= 0) throw new Error("Could not calculate your total battle stats.");
        console.log(`Attacker [${playerId}] Total Stats: ${userTotalStats.toLocaleString()}`);


        // --- NEW Step 2: Query Firestore for ALL potential targets ---
        console.log("Querying database for ALL potential targets...");
        const allTargetsFromDB = [];
        const querySnapshot = await db.collection('factionTargets').get();
        
        if (querySnapshot.empty) {
            return { statusCode: 200, body: JSON.stringify({ message: "No targets found in the database." }) };
        }
        
        querySnapshot.forEach(doc => {
            // IMPORTANT: Ensure targets have battle stats stored, otherwise they can't be calculated
            const data = doc.data();
            if (data.estimatedBattleStats > 0 && String(data.playerID) !== String(playerId)) { // Exclude self
                 allTargetsFromDB.push(data);
            }
        });
        console.log(`Found ${allTargetsFromDB.length} potential targets in the database.`);


        // --- NEW Step 3: Calculate PERSONALIZED Fair Fight score for each target ---
        const personalizedTargets = allTargetsFromDB.map(target => {
            const ffScore = calculateFairFight(userTotalStats, target.estimatedBattleStats);
            return {
                ...target,
                fairFightScore: ffScore, // Overwrite stored FF with the new personalized score
                difficulty: getDifficultyText(ffScore) // Recalculate difficulty text
            };
        });


        // --- NEW Step 4: Filter for targets within a reasonable Fair Fight range ---
        const fairTargets = personalizedTargets.filter(target => target.fairFightScore >= 1.0 && target.fairFightScore <= 3.0);
        console.log(`Found ${fairTargets.length} targets within the personalized Fair Fight range (1.0 - 3.0).`);


        // --- NEW Step 5: Sort by the new personalized score (easiest first) and take the top 10 ---
        fairTargets.sort((a, b) => a.fairFightScore - b.fairFightScore);
        const selectedTargets = fairTargets.slice(0, 10); // Get the 10 easiest targets for the user


        if (selectedTargets.length === 0) {
            return { statusCode: 200, body: JSON.stringify({ message: "No suitable targets found for you at this time." }) };
        }
        console.log(`Selected the top ${selectedTargets.length} easiest targets for the user.`);


        // --- Step 6 (Original Step 4): Get real-time status for the selected targets ---
        const targetIds = selectedTargets.map(t => t.playerID).join(',');
        console.log(`Fetching real-time status for IDs: ${targetIds}`);
        const tornApiUrl = `https://api.torn.com/user/${targetIds}?selections=profile,basic&key=${apiKey}`;
        
        const tornResponse = await fetch(tornApiUrl);
        if (!tornResponse.ok) throw new Error("Failed to fetch real-time status from Torn API.");
        
        const realTimeData = await tornResponse.json();
        if (realTimeData.error) throw new Error(`Torn API Error (Status Check): ${realTimeData.error.error}`);


        // --- Step 7 (Original Step 5): Combine data and format the final response ---
        const finalTargets = selectedTargets.map(target => {
            const liveData = realTimeData[target.playerID];
            let status = { text: 'Okay', color: 'lightgreen' }; // Default status

            if (liveData) {
                if (liveData.states.hospital_timestamp > 0) status = { text: 'In Hospital', color: '#ff4d4d' };
                else if (liveData.states.jail_timestamp > 0) status = { text: 'In Jail', color: '#ffA500' };
                else if (liveData.status.description.includes("Traveling")) status = { text: 'Traveling', color: '#add8e6' };
                else if (liveData.last_action.status === "Offline") status = { text: 'Offline', color: '#aaaaaa' };
            }
            
            return {
                playerID: target.playerID,
                playerName: target.playerName,
                fairFightScore: target.fairFightScore.toFixed(2),
                difficulty: target.difficulty,
                estimatedBattleStats: target.estimatedBattleStats,
                status: status,
                attackUrl: `https://www.torn.com/loader.php?sid=attack&user2ID=${target.playerID}`
            };
        });
        
        console.log("Successfully prepared final target list.");
        return {
            statusCode: 200,
            body: JSON.stringify({ targets: finalTargets })
        };

    } catch (error) {
        console.error("Error in get-recommended-targets function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};