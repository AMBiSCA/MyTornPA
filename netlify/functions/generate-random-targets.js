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

  const maxTornId = 3000000; // Approximate current highest Torn ID. Can be adjusted.
  const desiredTargetsCount = parseInt(numTargets) || 10; // Default to 10 targets
  const currentUserLevel = parseInt(userLevel);

  // Dynamic Level Range based on user's level
  const minTargetLevel = Math.max(15, currentUserLevel - 20);

  const minFF = parseFloat(minFairFight) || 2.5;
  const maxFF = parseFloat(maxFairFight) || 4.0;
  const maxDaysIn = parseInt(maxDaysInactive) || 365;

  console.log(`Generating targets for user level ${currentUserLevel}. Criteria: FF ${minFF}-${maxFF}, Max Inactive ${maxDaysIn} days, Min Target Level ${minTargetLevel}.`);

  const foundTargets = [];
  const attemptedIds = new Set();
  let totalAttempts = 0;

  // IMPORTANT: CONCURRENCY SETTINGS
  // How many Torn API calls to make at the same time in a batch
  const CONCURRENCY_LIMIT = 5; // Start with 5-10. Too high can hit Torn's rate limits.
  // How many batches to attempt before giving up.
  // We need to fetch more random IDs than desired targets because many will be invalid or not meet criteria.
  const MAX_BATCHES = 30; // Max number of batches. (e.g., 30 batches * 5 concurrent = 150 potential Torn API calls)

  const tornApiRequestQueue = [];

  for (let batchNum = 0; batchNum < MAX_BATCHES && foundTargets.length < desiredTargetsCount; batchNum++) {
  const batchPromises = [];
  const idsInCurrentBatch = new Set(); // To ensure unique IDs within a batch

  // Generate unique random IDs for the current batch
  while (idsInCurrentBatch.size < CONCURRENCY_LIMIT) {
  const randomPlayerId = Math.floor(Math.random() * maxTornId) + 1;
  totalAttempts++;

  if (attemptedIds.has(randomPlayerId) || randomPlayerId.toString() === selfId) {
  continue; // Skip if already attempted or is self
  }
  attemptedIds.add(randomPlayerId);
  idsInCurrentBatch.add(randomPlayerId);

  // Push the API call promise to the batchPromises array
  const tornApiUrl = `https://api.torn.com/user/${randomPlayerId}?selections=basic&key=${apiKey}`;
  batchPromises.push(axios.get(tornApiUrl).then(response => ({ playerId: randomPlayerId, data: response.data }))
  .catch(error => {
  // Catch individual API call errors without failing the whole batch
  if (error.response && error.response.status === 429) {
  console.warn(`Torn API rate limit hit during batch ${batchNum}. Retrying this batch later or waiting.`);
  // This approach doesn't retry effectively within the loop, but logs it.
  // For actual retry, you'd need a more sophisticated queue system.
  }
  console.error(`Error fetching Torn basic data for ${randomPlayerId}:`, error.message.substring(0, 100));
  return { playerId: randomPlayerId, error: error.message }; // Return error to process later
  }));
  }

  // Wait for all API calls in the current batch to complete
  const batchResults = await Promise.all(batchPromises);

  // Process results from the batch
  for (const result of batchResults) {
  if (foundTargets.length >= desiredTargetsCount) break; // Stop if we've found enough targets

  if (result.error) {
  continue; // Skip if there was an error fetching data for this player
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
  continue; // Skip if Torn API returned an error for this player
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

  // Now fetch Fair Fight data for this eligible player
  try {
  const fairFightFunctionUrl = `${process.env.URL}/.netlify/functions/fetch-fairfight-data?type=player&id=${randomPlayerId}&apiKey=${apiKey}`;
  const ffResponse = await axios.get(fairFightFunctionUrl); // This is still sequential for FF data
  const ffData = ffResponse.data;

  if (ffData.error || !ffData.fair_fight) {
  continue; // Skip if Fair Fight data couldn't be fetched or is missing
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
  continue; // Skip this player if FF data fetch fails
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