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

// Helper function to shuffle an array (we won't use this for sorting anymore, but keeping it if you need it elsewhere)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { apiKey, playerId } = JSON.parse(event.body); 
        if (!apiKey) {
            throw new Error("API key is required.");
        }

        // 1. Query Firestore for potential targets
        console.log("Querying database for potential targets...");
        const potentialTargets = [];
        const querySnapshot = await db.collection('factionTargets')
                                      .where('difficulty', 'in', ['Easy', 'Moderately difficult'])
                                      .get();
        
        if (querySnapshot.empty) {
            return { statusCode: 200, body: JSON.stringify({ message: "No suitable targets found in the database. Try adding more factions with the admin tool." }) };
        }
        
        querySnapshot.forEach(doc => {
            potentialTargets.push(doc.data());
        });
        console.log(`Found ${potentialTargets.length} potential targets.`);


        // 2. Sort targets by Fair Fight score (descending) to prioritize higher FF within chosen difficulties
        potentialTargets.sort((a, b) => b.fairFightScore - a.fairFightScore);
        console.log(`Sorted ${potentialTargets.length} targets by Fair Fight score.`);

        // 3. Select the top 6 targets from the sorted list
        const selectedTargets = potentialTargets.slice(0, 6);
        console.log(`Selected top ${selectedTargets.length} targets.`);

        if (selectedTargets.length === 0) {
            return { statusCode: 200, body: JSON.stringify({ message: "No suitable targets found to recommend after sorting." }) };
        }


        // 4. Get real-time status for the selected targets
        const targetIds = selectedTargets.map(t => t.playerID).join(',');
        console.log(`Fetching real-time status for IDs: ${targetIds}`);
        const tornApiUrl = `https://api.torn.com/user/${targetIds}?selections=profile,basic&key=${apiKey}`;
        
        const tornResponse = await fetch(tornApiUrl);
        if (!tornResponse.ok) throw new Error("Failed to fetch real-time status from Torn API.");
        
        const realTimeData = await tornResponse.json();
        if (realTimeData.error) throw new Error(`Torn API Error: ${realTimeData.error.error}`);


        // 5. Combine data and format the final response
        const finalTargets = selectedTargets.map(target => {
            const liveData = realTimeData[target.playerID];
            let status = { text: 'Okay', color: 'lightgreen' }; // Default status

            if (liveData) {
                if (liveData.states.hospital_timestamp > 0) {
                    status = { text: 'In Hospital', color: '#ff4d4d' };
                } else if (liveData.states.jail_timestamp > 0) {
                    status = { text: 'In Jail', color: '#ffA500' };
                } else if (liveData.status.description.includes("Traveling")) {
                     status = { text: 'Traveling', color: '#add8e6' };
                } else if (liveData.last_action.status === "Offline") {
                    status = { text: 'Offline', color: '#aaaaaa' };
                }
            }
            
            return {
                playerID: target.playerID,
                playerName: target.playerName,
                fairFightScore: target.fairFightScore.toFixed(2),
                difficulty: target.difficulty,
                estimatedBattleStats: target.estimatedBattleStats,
                status: status,
                // CORRECTED: Changed user_id to user2ID
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