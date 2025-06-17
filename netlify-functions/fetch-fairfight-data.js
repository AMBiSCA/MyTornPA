// netlify/functions/fetch-fairfight-data.js

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

const db = admin.firestore();

// Helper for delays in batch processing (for faction-wide calls)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fair Fight Calculation (consistent across all relevant files)
function calculateFairFight(attackerLevel, attackerTotalStats, defenderLevel, defenderTotalStats) {
    if (!attackerLevel || !defenderLevel || !attackerTotalStats || !defenderTotalStats || defenderTotalStats === 0) {
        return null;
    }
    const attackerBSS = attackerTotalStats;
    const defenderBSS = defenderTotalStats;
    const bssRatio = defenderBSS / attackerBSS;
    let ffScore;
    if (bssRatio >= 0.75) { ffScore = 3.0; }
    else if (bssRatio >= 0.50) { ffScore = 2.0 + ((bssRatio - 0.50) / 0.25) * 1.0; }
    else if (bssRatio >= 0.25) { ffScore = 1.0 + ((bssRatio - 0.25) / 0.25) * 1.0; }
    else { ffScore = 1.0; }
    return Math.max(1.0, Math.min(3.0, parseFloat(ffScore.toFixed(2))));
}

function get_difficulty_text(ff) {
    if (ff === null) return "N/A";
    if (ff >= 2.75) return "Extremely easy";
    else if (ff >= 2.0) return "Easy";
    else if (ff >= 1.5) return "Moderately difficult";
    else if (ff > 1) return "Difficult";
    else return "Extremely difficult";
}

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    const { type, id } = event.queryStringParameters;
    let targetId = parseInt(id);

    if (!type || !id || isNaN(targetId)) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Missing or invalid parameters: type or id.' }) };
    }

    // --- AUTHENTICATION: VERIFY FIREBASE ID TOKEN ---
    const idToken = event.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
        return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Authentication token missing.' }) };
    }
    let decodedToken;
    try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
        console.error("Firebase ID Token verification failed:", error);
        return { statusCode: 401, body: JSON.stringify({ success: false, error: 'Authentication token invalid or expired.' }) };
    }
    const userId = decodedToken.uid; // The authenticated user's UID
    // --- END AUTHENTICATION ---

    let userTornApiKey; // The user's Torn.com API key (fetched based on userId)
    let userLevel;
    let userTotalStats = 0;

    try {
        // Fetch user's API keys and their own stats from Firestore
        const userDocRef = db.collection('userProfiles').doc(userId); // Use userId from decoded token
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
            return { statusCode: 404, body: JSON.stringify({ error: 'User profile not found.' }) };
        }
        const userData = userDoc.data();
        userTornApiKey = userData.tornApiKey;

        if (!userTornApiKey) {
            return { statusCode: 403, body: JSON.stringify({ error: 'Torn API Key not found in your profile. Please set it.' }) };
        }

        // Fetch user's own battle stats and level from Torn API for FF calculation
        const selfStatsUrl = `https://api.torn.com/user/?selections=personalstats,battlestats&key=${userTornApiKey}`;
        const selfStatsResponse = await axios.get(selfStatsUrl);
        const selfData = selfStatsResponse.data;

        if (selfData.error) {
            console.error("Self stats Torn API Error:", selfData.error.error);
            return { statusCode: 403, body: JSON.stringify({ error: `Failed to fetch your own stats from Torn API: ${selfData.error.error}. Check your Torn API key permissions (Personal Stats, Battlestats).` }) };
        }

        userLevel = selfData.level;
        userTotalStats = (selfData.battle_stats?.strength || 0) + (selfData.battle_stats?.defense || 0) + (selfData.battle_stats?.speed || 0) + (selfData.battle_stats?.dexterity || 0);

        if (!userLevel || userTotalStats === 0) {
             return { statusCode: 403, body: JSON.stringify({ error: 'Could not retrieve your own battle stats or level. Ensure Torn API key has "Personal Stats" and "Battle Stats" selections enabled.' }) };
        }

    } catch (error) {
        console.error("Error fetching user's own API keys or stats:", error);
        return { statusCode: 500, body: JSON.stringify({ error: `Failed to retrieve user data: ${error.message}` }) };
    }

    try {
        if (type === 'player') {
            // --- Individual Player Fair Fight Check ---
            // Fetch target player data from adminCuratedFFTargets collection (User-facing page fetches from this DB)
            const targetDocRef = db.collection('adminCuratedFFTargets').doc(targetId.toString());
            const targetDoc = await targetDocRef.get();

            if (!targetDoc.exists) {
                 // Fallback to live Torn API if not in curated DB for individual check
                 const tornApiPlayerUrl = `https://api.torn.com/user/${targetId}?selections=basic,battlestats&key=${userTornApiKey}`;
                 const response = await axios.get(tornApiPlayerUrl);
                 const data = response.data;

                 if (data.error || !data.level || !data.battle_stats || data.battle_stats.total === 0) {
                     return { statusCode: 200, body: JSON.stringify({ fair_fight: null, player_name: data.name || 'N/A', message: data.error?.error || "No player data or battle stats available from Torn API." }) };
                 }
                 const ff_score = calculateFairFight(userLevel, userTotalStats, data.level, data.battle_stats.total);
                 return { statusCode: 200, body: JSON.stringify({ player_name: data.name, fair_fight: ff_score, bs_estimate_human: data.battle_stats.total.toLocaleString(), last_updated: data.last_action.timestamp, message: "Fetched live from Torn API" }) };

            } else { // Target found in adminCuratedFFTargets
                const targetData = targetDoc.data();
                const ff_score = calculateFairFight(userLevel, userTotalStats, targetData.level, targetData.totalStats);

                return {
                    statusCode: 200,
                    body: JSON.stringify({
                        player_name: targetData.name,
                        fair_fight: ff_score,
                        bs_estimate_human: targetData.totalStats.toLocaleString(), // Using stored totalStats
                        last_updated: targetData.lastActiveTimestamp, // Using stored last active timestamp
                        message: "Fetched from curated database."
                    }),
                };
            }

        } else if (type === 'faction') {
            // --- Faction Fair Fight Overview ---
            // Fetch targets for this faction from the adminCuratedFFTargets collection
            const factionMembersFF = [];
            const membersSnapshot = await db.collection('adminCuratedFFTargets')
                                            .where('factionId', '==', targetId) // Assuming factionId is stored on each target
                                            .get();

            if (membersSnapshot.empty) {
                // Fallback to getting live members from Torn API if no curated data for faction
                const tornApiFactionUrl = `https://api.torn.com/faction/${targetId}?selections=basic&key=${userTornApiKey}`;
                const factionResponse = await axios.get(tornApiFactionUrl);
                const factionData = factionResponse.data;

                if (factionData.error) {
                    return { statusCode: 400, body: JSON.stringify({ error: `Torn API Faction Error: ${factionData.error.error}. Check your Torn API key and 'Faction' permission.` }) };
                }
                if (!factionData.members || Object.keys(factionData.members).length === 0) {
                    return { statusCode: 200, body: JSON.stringify({ members: [], faction_name: factionData.name || 'N/A', message: "No members found from Torn API." }) };
                }

                const memberIds = Object.keys(factionData.members);
                const BATCH_SIZE_FF = 5;
                const DELAY_MS_FF = 1000;

                for (let i = 0; i < memberIds.length; i += BATCH_SIZE_FF) {
                    const batch = memberIds.slice(i, i + BATCH_SIZE_FF);
                    const batchPromises = batch.map(async (memberId) => {
                        const memberName = factionData.members[memberId]?.name || `User ${memberId}`;
                        const tornApiMemberUrl = `https://api.torn.com/user/${memberId}?selections=basic,battlestats&key=${userTornApiKey}`;
                        try {
                            const memberResponse = await axios.get(tornApiMemberUrl);
                            const memberData = memberResponse.data;

                            if (memberData.error || !memberData.level || !memberData.battle_stats || memberData.battle_stats.total === 0) {
                                return { id: memberId, name: memberName, ff_data: { message: memberData.error?.error || "No player data or battle stats" } };
                            }

                            const ff_score = calculateFairFight(userLevel, userTotalStats, memberData.level, memberData.battle_stats.total);

                            return {
                                id: memberId, name: memberName,
                                ff_data: {
                                    fair_fight: ff_score, bs_estimate_human: memberData.battle_stats.total.toLocaleString(),
                                    last_updated: memberData.last_action.timestamp, message: "Fetched live from Torn API."
                                }
                            };
                        } catch (memberError) {
                            console.error(`Error fetching data for ${memberName} [${memberId}]:`, memberError.message);
                            return { id: memberId, name: memberName, ff_data: { message: `Error: ${memberError.message}` } };
                        }
                    });
                    const results = await Promise.all(batchPromises);
                    factionMembersFF.push(...results);
                    if (i + BATCH_SIZE_FF < memberIds.length) { await sleep(DELAY_MS_FF); }
                }
                return { statusCode: 200, body: JSON.stringify({ faction_name: factionData.name, members: factionMembersFF, message: "Fetched live from Torn API (no curated data)." }) };

            } else { // Targets found in adminCuratedFFTargets for this faction
                const factionData = await axios.get(`https://api.torn.com/faction/${targetId}?selections=basic&key=${userTornApiKey}`).then(res => res.data).catch(() => ({name: `Faction ${targetId}`}));
                membersSnapshot.forEach(doc => {
                    const targetData = doc.data();
                    const ff_score = calculateFairFight(userLevel, userTotalStats, targetData.level, targetData.totalStats);
                    factionMembersFF.push({
                        id: targetData.id, name: targetData.name,
                        ff_data: {
                            fair_fight: ff_score, bs_estimate_human: targetData.totalStats.toLocaleString(),
                            last_updated: targetData.lastActiveTimestamp, message: "Fetched from curated database."
                        }
                    });
                });
                return { statusCode: 200, body: JSON.stringify({ faction_name: factionData.name, members: factionMembersFF, message: "Fetched from curated database." }) };
            }

        } else {
            return { statusCode: 400, body: JSON.stringify({ error: 'Invalid "type" parameter. Must be "player" or "faction".' }) };
        }
    } catch (error) {
        console.error("Backend Fair Fight Function Error:", error.message);
        return { statusCode: 500, body: JSON.stringify({ error: `An internal server error occurred: ${error.message}` }) };
    }
};