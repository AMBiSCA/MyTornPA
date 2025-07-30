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

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { apiKey, playerId } = JSON.parse(event.body); 
        if (!apiKey) {
            throw new Error("API key is required.");
        }
        if (!playerId) {
            console.warn("Player ID not provided, but API key is present. Proceeding without personalized stats.");
        }

        // --- Step 1: Query Firestore for potential targets (ONLY 'Easy' difficulty) ---
        console.log("Querying database for potential targets (Difficulty: Easy)...");
        const potentialTargets = [];
        const querySnapshot = await db.collection('factionTargets')
                                      .where('difficulty', '==', 'Easy') // Filter strictly for 'Easy' targets
                                      .get();
        
        if (querySnapshot.empty) {
            return { statusCode: 200, body: JSON.stringify({ message: "No 'Easy' targets found in the database. Try adding more factions with the admin tool or broaden your search criteria." }) };
        }
        
        querySnapshot.forEach(doc => {
            potentialTargets.push(doc.data());
        });
        console.log(`Found ${potentialTargets.length} potential 'Easy' targets.`);


        // --- Step 2: Sort 'Easy' targets by Fair Fight score (DESCENDING - strongest of Easy first) ---
        potentialTargets.sort((a, b) => b.fairFightScore - a.fairFightScore); 
        console.log(`Sorted ${potentialTargets.length} targets by Fair Fight score (strongest of Easy first).`);

        // --- Step 3: Select targets from the "middle" of the easy bracket ---
        const targetsToSelect = 6;
        let startIndex = 0; // Default to start from the beginning

        if (potentialTargets.length > targetsToSelect) {
            // Calculate a skip count to aim for the "upper middle" of the Easy targets.
            // This tries to skip roughly 25% of the total available Easy targets,
            // but caps the skip at a reasonable number (min 2, max 5) to avoid going too weak
            // or failing if there aren't many targets.
            let skipCount = Math.floor(potentialTargets.length * 0.25);
            
            // Ensure we skip at least 2 targets if there are enough total targets (6 + 2 = 8 needed)
            if (skipCount < 2 && potentialTargets.length >= (targetsToSelect + 2)) {
                skipCount = 2;
            } 
            // If there aren't enough targets to skip 2 and still get 6, we'll start from 0 (no skip)
            else if (potentialTargets.length < (targetsToSelect + 2)) {
                skipCount = 0;
            }

            // Cap the maximum skip to avoid going too far down the list and getting too weak targets
            if (skipCount > 5) {
                skipCount = 5;
            }
            
            // Ensure startIndex doesn't make us go out of bounds for the selection
            startIndex = Math.min(skipCount, potentialTargets.length - targetsToSelect);
            if (startIndex < 0) startIndex = 0; // Fallback to 0 if calculated as negative (shouldn't happen with above logic)
        }

        const endIndex = startIndex + targetsToSelect;
        const selectedTargets = potentialTargets.slice(startIndex, endIndex);

        console.log(`Selected ${selectedTargets.length} targets from index ${startIndex} to ${endIndex-1}.`);

        if (selectedTargets.length === 0) {
            return { statusCode: 200, body: JSON.stringify({ message: "No suitable 'Easy' targets found to recommend from the middle range." }) };
        }


        // --- Step 4: Get real-time status for the selected targets ---
        const targetIds = selectedTargets.map(t => t.playerID).join(',');
        console.log(`Fetching real-time status for IDs: ${targetIds}`);
        const tornApiUrl = `https://api.torn.com/user/${targetIds}?selections=profile,basic&key=${apiKey}`; 
        
        const tornResponse = await fetch(tornApiUrl);
        if (!tornResponse.ok) throw new Error("Failed to fetch real-time status from Torn API.");
        
        const realTimeData = await tornResponse.json();
        if (realTimeData.error) throw new Error(`Torn API Error: ${realTimeData.error.error}`);


        // --- Step 5: Combine data and format the final response ---
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
                } else if (liveData.last_action.status.includes("idle") || liveData.last_action.status.includes("online")) {
                    status = { text: 'Okay', color: 'lightgreen' };
                }
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