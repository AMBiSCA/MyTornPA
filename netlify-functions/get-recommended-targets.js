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

// --- NEW HELPER FUNCTION TO PARSE STAT STRINGS LIKE "1.22b" ---
function parseStatString(statString) {
    if (!statString || typeof statString !== 'string') {
        // If it's already a number or invalid, return it as is or 0
        return Number(statString) || 0;
    }
    const lowerCaseStat = statString.toLowerCase();
    const num = parseFloat(lowerCaseStat);
    if (isNaN(num)) return 0;

    if (lowerCaseStat.endsWith('k')) return num * 1e3;
    if (lowerCaseStat.endsWith('m')) return num * 1e6;
    if (lowerCaseStat.endsWith('b')) return num * 1e9;
    if (lowerCaseStat.endsWith('t')) return num * 1e12;
    
    return num; // Return the number if no suffix
}


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

        // Step 1: Get the current user's (attacker's) total battle stats
        console.log(`Fetching stats for attacker ID: ${playerId}`);
        const userStatsUrl = `https://api.torn.com/user/${playerId}?selections=battlestats&key=${apiKey}`;
        const userStatsResponse = await fetch(userStatsUrl);
        if (!userStatsResponse.ok) throw new Error("Failed to fetch your stats from Torn API.");
        
        const userStatsData = await userStatsResponse.json();
        if (userStatsData.error) throw new Error(`Torn API Error (User Stats): ${userStatsData.error.error}`);
        
        const userTotalStats = userStatsData.strength + userStatsData.defense + userStatsData.speed + userStatsData.dexterity;
        if (userTotalStats <= 0) throw new Error("Could not calculate your total battle stats.");
        console.log(`Attacker [${playerId}] Total Stats: ${userTotalStats.toLocaleString()}`);


        // Step 2: Query Firestore for ALL potential targets
        console.log("Querying database for ALL potential targets...");
        const allTargetsFromDB = [];
        const querySnapshot = await db.collection('factionTargets').get();
        
        if (querySnapshot.empty) {
            return { statusCode: 200, body: JSON.stringify({ message: "No targets found in the database." }) };
        }
        
        // --- MODIFIED LOGIC ---
        querySnapshot.forEach(doc => {
            const data = doc.data();
            // Use the new parser to get a real number from the stat string
            const numericStats = parseStatString(data.estimatedBattleStats);
            
            if (numericStats > 0 && String(data.playerID) !== String(playerId)) {
                 // Store the converted number for calculation
                 allTargetsFromDB.push({ ...data, numericBattleStats: numericStats });
            }
        });
        console.log(`Found and processed ${allTargetsFromDB.length} potential targets with valid stats.`);


        // Step 3: Calculate PERSONALIZED Fair Fight score for each target
        const personalizedTargets = allTargetsFromDB.map(target => {
            // Use the new numeric field for the calculation
            const ffScore = calculateFairFight(userTotalStats, target.numericBattleStats);
            return {
                ...target,
                fairFightScore: ffScore,
                difficulty: getDifficultyText(ffScore)
            };
        });


        // Step 4: Filter for targets within a reasonable Fair Fight range
        const fairTargets = personalizedTargets.filter(target => target.fairFightScore >= 1.0 && target.fairFightScore <= 3.0);
        console.log(`Found ${fairTargets.length} targets within the personalized Fair Fight range (1.0 - 3.0).`);


        // Step 5: Sort by the new personalized score (easiest first) and take the top 10
        fairTargets.sort((a, b) => a.fairFightScore - b.fairFightScore);
        const selectedTargets = fairTargets.slice(0, 10);


        if (selectedTargets.length === 0) {
            return { statusCode: 200, body: JSON.stringify({ message: "No suitable targets found for you at this time." }) };
        }
        console.log(`Selected the top ${selectedTargets.length} easiest targets for the user.`);


        // Step 6: Get real-time status for the selected targets
        const targetIds = selectedTargets.map(t => t.playerID).join(',');
        const tornApiUrl = `https://api.torn.com/user/${targetIds}?selections=profile,basic&key=${apiKey}`;
        
        const tornResponse = await fetch(tornApiUrl);
        if (!tornResponse.ok) throw new Error("Failed to fetch real-time status from Torn API.");
        
        const realTimeData = await tornResponse.json();
        if (realTimeData.error) throw new Error(`Torn API Error (Status Check): ${realTimeData.error.error}`);


        // Step 7: Combine data and format the final response
        const finalTargets = selectedTargets.map(target => {
            const liveData = realTimeData[target.playerID];
            let status = { text: 'Okay', color: 'lightgreen' };

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
                // Return the original string for display purposes
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