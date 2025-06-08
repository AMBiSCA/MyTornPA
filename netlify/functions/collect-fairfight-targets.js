const admin = require('firebase-admin');
const axios = require('axios');

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
const TORN_API_KEY = process.env.TORN_API_KEY;
const MAX_TORN_ID = 3000000;
const PLAYERS_TO_PROCESS_PER_RUN = 50; // Keep this number of attempts per run
// --- MODIFIED CONCURRENCY AND DELAY ---
const CONCURRENT_API_CALLS = 3; // Reduced from 5 to 3
const DELAY_BETWEEN_BATCHES_MS = 2000; // Increased delay to 2 seconds (was 500ms)
// --- END MODIFIED CONCURRENCY AND DELAY ---

const MIN_LEVEL_FILTER = 1;
const MAX_DAYS_INACTIVE_FILTER = 9999;
const COLLECTOR_MIN_FF = 0.0;
const COLLECTOR_MAX_FF = 10.0;

function get_ff_score(level_diff, def_eff, str_eff) {
    const ff_val = level_diff * (def_eff / str_eff);
    if (isNaN(ff_val) || !isFinite(ff_val)) return 0;
    return Math.max(0, Math.min(6, ff_val));
}

function get_difficulty_text(ff) {
    if (ff <= 1) return "Extremely easy";
    else if (ff <= 2) return "Easy";
    else if (ff <= 3.5) return "Moderately difficult";
    else if (ff <= 4.5) return "Difficult";
    else return "May be impossible";
}

function formatNumber(num) {
    if (num === "N/A" || num === null || num === undefined || isNaN(Number(num))) return "N/A";
    const number = Number(num);
    if (Math.abs(number) >= 1e9) return (number / 1e9).toFixed(2) + 'b';
    if (Math.abs(number) >= 1e6) return (number / 1e6).toFixed(2) + 'm';
    if (Math.abs(number) >= 1e3) return (number / 1e3).toFixed(0) + 'k';
    return number.toLocaleString();
}


exports.handler = async (event, context) => {
    if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    console.log(`Starting background collection of ${PLAYERS_TO_PROCESS_PER_RUN} random players.`);

    const playerIdsToFetch = new Set();
    const startTime = Date.now();
    let playersProcessed = 0;
    let playersSaved = 0;

    while (playerIdsToFetch.size < PLAYERS_TO_PROCESS_PER_RUN) {
        playerIdsToFetch.add(Math.floor(Math.random() * MAX_TORN_ID) + 1);
    }

    const idsArray = Array.from(playerIdsToFetch);
    
    for (let i = 0; i < idsArray.length; i += CONCURRENT_API_CALLS) {
        const batchIds = idsArray.slice(i, i + CONCURRENT_API_CALLS);
        const playerPromises = batchIds.map(async playerId => {
            try {
                const tornApiUrl = `https://api.torn.com/user/${playerId}?selections=basic,battlestats,personalstats&key=${TORN_API_KEY}`;
                const tornApiResponse = await axios.get(tornApiUrl);
                const playerData = tornApiResponse.data;
                playersProcessed++;

                if (playerData.error) {
                    console.warn(`Torn API error for ID ${playerId}:`, playerData.error.message);
                    if (playerData.error.code === 2) {
                        console.error("Collector: Invalid Torn API Key. Aborting.");
                        throw new Error("Invalid Torn API Key for collector.");
                    }
                    if (playerData.error.code === 5 || playerData.error.code === 6) {
                        console.warn(`Torn API rate limit hit for ID ${playerId}.`);
                    }
                    return null;
                }

                if (!playerData.player_id || playerData.player_id.toString() === "0" || !playerData.name || !playerData.level || !playerData.last_action || !playerData.last_action.timestamp) {
                    return null;
                }
                if (playerData.level < MIN_LEVEL_FILTER) {
                    return null;
                }
                const ageDays = (Date.now() / 1000 - playerData.last_action.timestamp) / (24 * 60 * 60);
                if (ageDays > MAX_DAYS_INACTIVE_FILTER) {
                    return null;
                }
                
                const { level, strength, defense, speed, dexterity } = playerData;
                
                if (strength === 0 || defense === 0 || speed === 0 || dexterity === 0) {
                    return null;
                }

                const totalBS = strength + defense + speed + dexterity;
                let bs_estimate_human = formatNumber(totalBS);

                const level_diff = level - MIN_LEVEL_FILTER;
                const def_eff = (defense + speed) / (dexterity + strength);
                const str_eff = (strength + dexterity) / (defense + speed);

                let fairFightScore = 0;
                if (!isNaN(def_eff) && !isNaN(str_eff) && str_eff !== 0) {
                    fairFightScore = get_ff_score(level_diff, def_eff, str_eff);
                } else {
                    return null;
                }
                
                if (fairFightScore < COLLECTOR_MIN_FF || fairFightScore > COLLECTOR_MAX_FF) {
                    return null;
                }

                return {
                    playerId: playerId,
                    playerName: playerData.name,
                    playerLevel: playerData.level,
                    fairFightScore: parseFloat(fairFightScore.toFixed(2)),
                    fairFightDifficulty: get_difficulty_text(fairFightScore),
                    estimatedBattleStatsHuman: bs_estimate_human,
                    lastActiveTimestamp: playerData.last_action.timestamp,
                    timestampCollected: Math.floor(Date.now() / 1000)
                };

            } catch (error) {
                console.error(`Collector: Failed to process player ${playerId}:`, error.message.substring(0, 100));
                return null;
            }
        });

        const results = await Promise.all(playerPromises);

        const batch = db.batch();
        let currentBatchSaves = 0;
        for (const player of results) {
            if (player) {
                const docRef = db.collection('fairFightTargets').doc(player.playerId.toString());
                batch.set(docRef, player, { merge: true });
                currentBatchSaves++;
                playersSaved++;
            }
        }
        if (currentBatchSaves > 0) {
            await batch.commit();
            console.log(`Collector: Saved ${currentBatchSaves} players to Firestore batch.`);
        }
        
        // --- MODIFIED DELAY HERE ---
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS)); // Wait 2 seconds
        // --- END MODIFIED DELAY ---
    }

    console.log(`Collector finished. Processed ${playersProcessed} players, saved ${playersSaved} eligible targets. Total duration: ${Date.now() - startTime}ms`);

    return {
        statusCode: 200,
        body: JSON.stringify({ message: `Collection complete. Processed ${playersProcessed}, saved ${playersSaved} targets.` }),
    };
};