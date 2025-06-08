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

  console.log(`Generating targets for user level ${currentUserLevel}. Criteria: FF <span class="math-inline">\{minFF\}\-</span>{maxFF}, Max Inactive ${maxDaysIn} days, Min Target Level ${minTargetLevel}.`);

  const foundTargets = [];
  let attempts = 0;
  const maxAttempts = desiredTargetsCount * 20;

  // Use a Set to track attempted IDs for faster lookup
  const attemptedIds = new Set();

  // Replace while loop with a for loop for better control and readability
  for (let attempts = 0; attempts < maxAttempts && foundTargets.length < desiredTargetsCount; attempts++) {
  const randomPlayerId = Math.floor(Math.random() * maxTornId) + 1;

  // Skip if already attempted
  if (attemptedIds.has(randomPlayerId)) {
  continue;
  }
  attemptedIds.add(randomPlayerId);

  // Skip if random ID is selfId
  if (randomPlayerId.toString() === selfId) {
  continue;
  }

  try {
  const tornApiUrl = `https://api.torn.com/user/<span class="math-inline">\{randomPlayerId\}?selections\=basic&key\=</span>{apiKey}`;
  const tornApiResponse = await axios.get(tornApiUrl);
  const playerData = tornApiResponse.data;

  if (playerData.error) {
  if (playerData.error.code === 2) {
  return {
  statusCode: 401,
  body: JSON.stringify({ error: `Torn API Key error: ${playerData.error.message}. Please check your API key.` }),
  };
  }
  if (playerData.error.code === 5 || playerData.error.code === 6) {
  await new Promise(resolve => setTimeout(resolve, 1000));
  continue;
  }
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

  const fairFightFunctionUrl = `<span class="math-inline">\{process\.env\.URL\}/\.netlify/functions/fetch\-fairfight\-data?type\=player&id\=</span>{randomPlayerId}&apiKey=${apiKey}`;
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

  } catch (error) {
  if (error.response && error.response.status === 429) {
  await new Promise(resolve => setTimeout(resolve, 2000));
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