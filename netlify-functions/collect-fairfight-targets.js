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
const MAX_TORN_FACTION_ID = 15000;
const PLAYERS_TO_PROCESS_PER_RUN = 6;
const CONCURRENT_API_CALLS = 3;
const DELAY_BETWEEN_BATCHES_MS = 4000;

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
    // --- Start of the main try-catch block for the entire handler logic ---
    try {
        if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
            return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
        }

        console.log(`Starting background collection using random factions to find up to ${PLAYERS_TO_PROCESS_PER_RUN} players.`);

        const foundPlayersThisRun = [];
        let factionsProcessed = 0;
        const maxFactionsToAttempt = 5; 
        const startTime = Date.now();

        for (let i = 0; i < maxFactionsToAttempt && foundPlayersThisRun.length < PLAYERS_TO_PROCESS_PER_RUN; i++) {
            const randomFactionId = Math.floor(Math.random() * MAX_TORN_FACTION_ID) + 1;
            factionsProcessed++;

            try { // Outer try for faction API call
                // 1. Fetch faction data
                const factionApiUrl = `https://api.torn.com/faction/${randomFactionId}?selections=basic&key=${TORN_API_KEY}`;
                const factionApiResponse = await axios.get(factionApiUrl);
                const factionData = factionApiResponse.data;

                if (factionData.error) {
                    console.warn(`Faction API error for Faction ID ${randomFactionId}:`, factionData.error.message);
                    if (factionData.error.code === 2) {
                        console.error("Collector: Invalid Torn API Key for faction lookup. Aborting.");
                        throw new Error("Invalid Torn API Key for collector.");
                    }
                    if (factionData.error.code === 5 || factionData.error.code === 6) {
                        console.warn(`Torn Faction API rate limit hit for Faction ID ${randomFactionId}.`);
                    }
                    continue;
                }

                if (!factionData.ID || !factionData.name || !factionData.members || Object.keys(factionData.members).length === 0) {
                    continue;
                }

                const memberIds = Object.keys(factionData.members);
                if (memberIds.length === 0) {
                    continue;
                }

                memberIds.sort(() => Math.random() - 0.5); 

                // 2. Fetch individual player data for a few members from this faction
                for (let j = 0; j < memberIds.length && foundPlayersThisRun.length < PLAYERS_TO_PROCESS_PER_RUN; j++) {
                    const memberId = memberIds[j];
                    
                    await new Promise(resolve => setTimeout(resolve, 500)); 

                    try { // Inner try for player API call
                        const tornPlayerApiUrl = `https://api.torn.com/user/${memberId}?selections=basic,battlestats,personalstats&key=${TORN_API_KEY}`;
                        const playerApiResponse = await axios.get(tornPlayerApiUrl);
                        const playerData = playerApiResponse.data;

                        if (playerData.error) {
                            console.warn(`Torn Player API error for member ${memberId} (from Faction ${randomFactionId}):`, playerData.error.message);
                            continue;
                        }

                        if (!playerData.player_id || !playerData.name || !playerData.level || !playerData.last_action || !playerData.last_action.timestamp) {
                            console.log(`Skipping player ${memberId}: Missing basic data.`);
                            continue;
                        }
                        if (playerData.level < MIN_LEVEL_FILTER) {
                            console.log(`Skipping player ${memberId}: Level (${playerData.level}) below MIN_LEVEL_FILTER (${MIN_LEVEL_FILTER}).`);
                            continue;
                        }
                        const ageDays = (Date.now() / 1000 - playerData.last_action.timestamp) / (24 * 60 * 60);
                        if (ageDays > MAX_DAYS_INACTIVE_FILTER) {
                            console.log(`Skipping player ${memberId}: Inactivity (${ageDays} days) beyond MAX_DAYS_INACTIVE_FILTER (${MAX_DAYS_INACTIVE_FILTER}).`);
                            continue;
                        }
                        
                        const { level, strength, defense, speed, dexterity } = playerData;
                        
                        if (strength === 0 || defense === 0 || speed === 0 || dexterity === 0) {
                            console.log(`Skipping player ${memberId}: Zero battle stats.`);
                            continue;
                        }

                        const totalBS = strength + defense + speed + dexterity;
                        let bs_estimate_human = formatNumber(totalBS);

                        const level_diff_for_ff = level - MIN_LEVEL_FILTER; 
                        const def_eff = (defense + speed) / (dexterity + strength);
                        const str_eff = (strength + dexterity) / (defense + speed);

                        let fairFightScore = 0;
                        if (!isNaN(def_eff) && !isNaN(str_eff) && str_eff !== 0) {
                            fairFightScore = get_ff_score(level_diff_for_ff, def_eff, str_eff);
                        } else {
                            console.log(`Skipping player ${memberId}: Invalid effective stats for FF calculation.`);
                            continue;
                        }
                        
                        if (fairFightScore < COLLECTOR_MIN_FF || fairFightScore > COLLECTOR_MAX_FF) {
                            console.log(`Skipping player ${memberId}: FF score (${fairFightScore.toFixed(2)}) outside collector's range.`);
                            continue;
                        }

                        foundPlayersThisRun.push({
                            playerId: memberId,
                            playerName: playerData.name,
                            playerLevel: playerData.level,
                            fairFightScore: parseFloat(fairFightScore.toFixed(2)),
                            fairFightDifficulty: get_difficulty_text(fairFightScore),
                            estimatedBattleStatsHuman: bs_estimate_human,
                            lastActiveTimestamp: playerData.last_action.timestamp,
                            timestampCollected: Math.floor(Date.now() / 1000)
                        });

                    } catch (memberError) { // Catch for inner try
                        console.error(`Collector: Failed to process member ${memberId} from Faction ${randomFactionId}:`, memberError.message.substring(0, 100));
                        continue;
                    }
                }
                if (foundPlayersThisRun.length >= PLAYERS_TO_PROCESS_PER_RUN) break; 
            }

            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES_MS));

        } catch (factionError) { // Catch for outer try
            console.error(`Collector: Failed to process Faction ID ${randomFactionId}:`, factionError.message.substring(0, 100));
            continue;
        }
    }

    const batch = db.batch();
    let playersSaved = 0;
    for (const player of foundPlayersThisRun) {
        const docRef = db.collection('fairFightTargets').doc(player.playerId.toString());
        batch.set(docRef, player, { merge: true });
        playersSaved++;
    }
    if (playersSaved > 0) {
        await batch.commit();
        console.log(`Collector: Saved ${playersSaved} players to Firestore batch.`);
    }

    console.log(`Collector finished. Processed ${factionsProcessed} random factions, saved ${playersSaved} eligible targets. Total duration: ${Date.now() - startTime}ms`);

    return {
        statusCode: 200,
        body: JSON.stringify({ message: `Collection complete. Processed ${factionsProcessed} factions, saved ${playersSaved} targets.` }),
    };

    } catch (handlerError) { // --- Catch block for the entire handler logic ---
        console.error("Collector function experienced an unhandled error:", handlerError);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Collector failed due to an unhandled error: ${handlerError.message || 'Unknown error'}` }),
        };
    }
};