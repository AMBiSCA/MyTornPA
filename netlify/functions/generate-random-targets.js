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

  // DEBUG FFGEN: Add a log here to see the incoming API key (be careful with sensitive data in logs in production)
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
  const maxAttempts = desiredTargetsCount * 20;

  const attemptedIds = new Set();

  for (let attempts = 0; attempts < maxAttempts && foundTargets.length < desiredTargetsCount; attempts++) {
  const randomPlayerId = Math.floor(Math.random() * maxTornId) + 1;

  if (attemptedIds.has(randomPlayerId)) {
  continue;
  }
  attemptedIds.add(randomPlayerId);

  if (randomPlayerId.toString() === selfId) {
  continue;
  }

  try {
  // 1. Fetch basic player data from Torn API
  const tornApiUrl = `https://api.torn.com/user/${randomPlayerId}?selections=basic&key=${apiKey}`;
  const tornApiResponse = await axios.get(tornApiUrl);
  const playerData = tornApiResponse.data;

  // Check for API errors directly from Torn (e.g., invalid ID, too many requests)
  if (playerData.error) {
  // IMPORTANT: Log the full error object from Torn API here
  console.error(`Torn API returned an error for ID ${randomPlayerId}:`, JSON.stringify(playerData.error));

  if (playerData.error.code === 2) { // Invalid key error, stop trying
  return {
  statusCode: 401,
  body: JSON.stringify({ error: `Torn API Key error: ${playerData.error.message || 'Unknown error code 2. Check console logs.'}. Please check your API key.` }),
  };
  }
  if (playerData.error.code === 5 || playerData.error.code === 6) { // Too many requests, wait and retry
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait a bit
  continue;
  }
  continue; // Skip this player if other errors
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

  // 2. Fetch Fair Fight data using your EXISTING Netlify Function
  // Important: Use process.env.URL to reference your own Netlify site's base URL
  const fairFightFunctionUrl = `${process.env.URL}/.netlify/functions/fetch-fairfight-data?type=player&id=${randomPlayerId}&apiKey=${apiKey}`;
  const ffResponse = await axios.get(fairFightFunctionUrl);
  const ffData = ffResponse.data;

  if (ffData.error || !ffData.fair_fight) {
  // console.log(`Fair Fight Function Error for ID ${randomPlayerId}:`, ffData.error || "No FF data found.");
  continue; // Skip if Fair Fight data couldn't be fetched or is missing
  }

  // Apply Fair Fight Score filtering
  if (ffData.fair_fight >= minFF && ffData.fair_fight <= maxFF) {
  foundTargets.push({
  id: randomPlayerId,
  name: playerData.name,
  level: playerData.level,
  last_action: playerData.last_action, // Keep original last_action for display
  fair_fight_data: ffData, // Contains fair_fight, difficulty, bs_estimate_human, etc.
  });
  }

  } catch (error) {
  // console.error(`Error processing player ID ${randomPlayerId} (attempt ${attempts}):`, error.message);
  // Ignore errors for individual players and continue, especially for 404s (non-existent IDs)
  if (error.response && error.response.status === 429) { // Too many requests to your FF function or Torn API
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait longer
  }
  continue;
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