// netlify/functions/generate-random-targets.js

const axios = require('axios');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' }),
        };
    }

    const { apiKey, userLevel, selfId, numTargets, minFairFight, maxFairFight, maxDaysInactive } = event.queryStringParameters;

    console.log("DEBUG FFGEN: Received apiKey for function:", apiKey ? '*****' + apiKey.substring(apiKey.length - 4) : 'undefined/null');

    if (!apiKey) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Torn API Key is required.' }),
        };
    }
    if (!userLevel) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'User level is required for target generation.' }),
        };
    }
    if (!selfId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Your Player ID (selfId) is required to exclude yourself.' }),
        };
    }

    const maxTornId = 3000000;
    const desiredTargetsCount = parseInt(numTargets) || 10;
    const currentUserLevel = parseInt(userLevel);

    const minTargetLevel = Math.max(15, currentUserLevel - 20);

    const minFF = parseFloat(minFairFight) || 2.5;
    const maxFF = parseFloat(maxFairFight) || 4.0;
    const maxDaysIn = parseInt(maxDaysInactive) || 365;

    console.log(`Generating targets for user level ${currentUserLevel}. Criteria: FF ${minFF}-${maxFF}, Max Inactive ${maxDaysIn} days, Min Target Level ${minTargetLevel}.`);

    const foundTargets = [];
    const attemptedIds = new Set();
    let totalAttempts = 0;

    const CONCURRENCY_LIMIT = 5;
    // INCREASED MAX_BATCHES: Give it more attempts to find targets
    const MAX_BATCHES = 100; // Increased from 30 to 100 (this means up to 500 Torn API calls total)

    for (let batchNum = 0; batchNum < MAX_BATCHES && foundTargets.length < desiredTargetsCount; batchNum++) {
        const batchPromises = [];
        const idsInCurrentBatch = new Set();

        while (idsInCurrentBatch.size < CONCURRENCY_LIMIT) {
            const randomPlayerId = Math.floor(Math.random() * maxTornId) + 1;
            totalAttempts++;

            if (attemptedIds.has(randomPlayerId) || randomPlayerId.toString() === selfId) {
                continue;
            }
            attemptedIds.add(randomPlayerId);
            idsInCurrentBatch.add(randomPlayerId);

            const tornApiUrl = `https://api.torn.com/user/${randomPlayerId}?selections=basic&key=${apiKey}`;
            batchPromises.push(axios.get(tornApiUrl).then(response => ({ playerId: randomPlayerId, data: response.data }))
                .catch(error => {
                    if (error.response && error.response.status === 429) {
                        console.warn(`Torn API rate limit hit during batch ${batchNum}. Retrying this batch later or waiting.`);
                        // For a better solution for 429, you might need to implement a delay or a retry queue.
                    }
                    console.error(`Error fetching Torn basic data for ${randomPlayerId}:`, error.message.substring(0, 100));
                    return { playerId: randomPlayerId, error: error.message };
                }));
        }

        const batchResults = await Promise.all(batchPromises);

        for (const result of batchResults) {
            if (foundTargets.length >= desiredTargetsCount) break;

            if (result.error) {
                continue;
            }

            const playerData = result.data;
            const randomPlayerId = result.playerId;

            if (playerData.error) {
                console.error(`Torn API returned an error for ID ${randomPlayerId} in batch:`, JSON.stringify(playerData.error));
                if (playerData.error.code === 2) {
                    return {
                        statusCode: 401,
                        body: JSON.stringify({ error: `Torn API Key error: ${playerData.error.message || 'Unknown error code 2. Check console logs.'}. Please check your API key.` }),
                    };
                }
                continue;
            }

            if (!playerData.last_action || !playerData.last_action.timestamp) {
                continue;
            }

            if (!playerData.name || !playerData.level || playerData.player_id.toString() === selfId) {
                continue;
            }

            const lastActionTimestamp = playerData.last_action.timestamp;
            const nowSeconds = Math.floor(Date.now() / 1000);
            const ageDays = (nowSeconds - lastActionTimestamp) / (24 * 60 * 60);

            if (playerData.level < minTargetLevel || ageDays > maxDaysIn) {
                continue;
            }

            try {
                const fairFightFunctionUrl = `${process.env.URL}/.netlify/functions/fetch-fairfight-data?type=player&id=${randomPlayerId}&apiKey=${apiKey}`;
                const ffResponse = await axios.get(fairFightFunctionUrl);
                const ffData = ffResponse.data;

                if (ffData.error || !ffData.fair_fight) {
                    continue;
                }

                if (ffData.fair_fight >= minFF && ffData.fair_fight <= maxFF) {
                    foundTargets.push({
                        id: randomPlayerId,
                        name: playerData.name,
                        level: playerData.level,
                        last_action: playerData.last_action,
                        fair_fight_data: ffData,
                    });
                }
            } catch (ffError) {
                console.error(`Error fetching Fair Fight data for ${randomPlayerId}:`, ffError.message.substring(0, 100));
                continue;
            }
        }
    }

    if (foundTargets.length === 0) {
        return {
            statusCode: 404,
            body: JSON.stringify({ error: 'No targets found matching criteria after many attempts. Try adjusting filters or a larger range.' }),
        };
    }

    return {
        statusCode: 200,
        body: JSON.stringify({ targets: foundTargets }),
    };
};