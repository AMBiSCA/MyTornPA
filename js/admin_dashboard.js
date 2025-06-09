// netlify/functions/getFactionData.js

// Make sure 'fetch' is available. If not, you might need: const fetch = require('node-fetch');
const admin = require('firebase-admin'); // Also needed here for future admin checks if any

// IMPORTANT: Initialize Firebase Admin SDK if needed for internal operations (e.g., logging to Firestore)
// Only initialize if your getFactionData function also needs to interact with Firebase Admin SDK,
// otherwise this block is not strictly necessary for just fetching data from Torn/TornStats.
// However, it's good practice to have it consistent with setAdminClaim.
try {
  // --- MODIFICATION HERE: Decode from Base64 ---
  const encodedServiceAccount = process.env.FIREBASE_ADMIN_SDK_CONFIG;
  const decodedServiceAccount = Buffer.from(encodedServiceAccount, 'base64').toString('utf8');
  const serviceAccount = JSON.parse(decodedServiceAccount);
  // --- END MODIFICATION ---

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK in getFactionData. Check FIREBASE_ADMIN_SDK_CONFIG environment variable.', error);
  // This function might still work if it doesn't use admin SDK features, but initialization is good for consistency.
}


// Helper to fetch API data and handle common errors
async function fetchApi(url) {
    const response = await fetch(url);
    if (!response.ok) {
        let errorData;
        try { errorData = await response.json(); } catch (e) { /* Not JSON */ }
        const errorMessage = errorData?.error?.message || errorData?.error || `API Error ${response.status}`;
        throw new Error(`${errorMessage.substring(0,150)}`);
    }
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        const responseText = await response.text();
        try { return JSON.parse(responseText); } catch(e) {
            console.warn("Non-JSON response or parse error:", responseText.substring(0, 200));
            throw new Error(`Received unexpected response format. Content: ${responseText.substring(0,100)}`);
        }
    }
    return response.json();
}

// Function to fetch Torn API data for a faction and its members
async function fetchTornApiData(factionId, tornApiKey) {
    const factionApiUrl = `https://api.torn.com/faction/${factionId}?selections=basic&key=${tornApiKey}`;
    const factionResponse = await fetchApi(factionApiUrl);

    if (factionResponse.error) {
        throw new Error(`Torn API Error (Faction): ${factionResponse.error.error}`);
    }
    if (!factionResponse || !factionResponse.members || Object.keys(factionResponse.members).length === 0) {
        throw new Error('No members found for this faction or invalid Faction ID/API Key for faction access.');
    }

    const factionName = factionResponse.name || `Faction ${factionId}`;
    const members = factionResponse.members;
    const factionMembersIds = Object.keys(members);

    const memberDataPromises = factionMembersIds.map(async (memberId) => {
        let combinedData = { member_id_for_table: memberId };
        const primarySelections = 'basic,profile';
        const primaryDataUrl = `https://api.torn.com/user/${memberId}?selections=${primarySelections}&key=${tornApiKey}`;

        try {
            const data1 = await fetchApi(primaryDataUrl);
            if (data1.error) {
                throw new Error(`Primary API (basic,profile): ${data1.error.error}`);
            }
            combinedData = { ...combinedData, ...data1 };
        } catch (e) {
            console.warn(`Error fetching primary data for ${memberId}: ${e.message}`);
            combinedData.error_primary = e.message;
        }

        const personalStatsSelection = 'personalstats';
        const personalStatsDataUrl = `https://api.torn.com/user/${memberId}?selections=${personalStatsSelection}&key=${tornApiKey}`;
        try {
            const data2 = await fetchApi(personalStatsDataUrl);
            if (data2.error) {
                throw new Error(`PersonalStats API: ${data2.error.error}`);
            }
            combinedData.personalstats = { ...(combinedData.personalstats || {}), ...(data2.personalstats || {}) };
        } catch (e) {
            console.warn(`Error fetching personal stats for ${memberId}: ${e.message}`);
            combinedData.error_personalstats = e.message;
        }

        if (!combinedData.name && members[memberId] && members[memberId].name) {
            combinedData.name = members[memberId].name;
        }

        return { memberId, tornData: combinedData };
    });

    const results = await Promise.allSettled(memberDataPromises);
    const processedMembers = results.map(result => {
        if (result.status === 'fulfilled') {
            return result.value;
        } else {
            console.error(`Failed to fetch Torn data for a member:`, result.reason);
            return { memberId: result.reason.memberId || 'N/A', tornData: { error: result.reason.message || 'Fetch failed' } };
        }
    });

    return { factionId, factionName, members: processedMembers };
}

// Function to fetch TornStats spy reports for individual members
async function fetchTornStatsData(memberId, tornStatsApiKey) {
    try {
        const url = `https://www.tornstats.com/api/v2/${tornStatsApiKey}/spy/user/${memberId}`;
        const data = await fetchApi(url);

        if (!data.spy || data.spy.status === false || data.spy.total === undefined) {
            throw new Error(data.spy?.message || data.message || "No spy data available or key/ID invalid.");
        }
        return data.spy;
    } catch (error) {
        console.warn(`Could not fetch TornStats data for ${memberId}: ${error.message}`);
        return { error: error.message };
    }
}

// Main handler for the Netlify Function
exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST' || !event.body) {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed or Missing Body' }),
            headers: { 'Content-Type': 'application/json' },
        };
    }

    let factionId;
    try {
        const requestBody = JSON.parse(event.body);
        factionId = requestBody.factionId;

        if (!factionId) {
            throw new Error('Faction ID is required in the request body.');
        }
    } catch (error) {
        console.error('Error parsing request body or missing factionId:', error);
        return {
            statusCode: 400,
            body: JSON.stringify({ error: `Invalid request body: ${error.message}` }),
            headers: { 'Content-Type': 'application/json' },
        };
    }

    const TORN_API_KEY = process.env.TORN_API_KEY;
    const TORNSTATS_API_KEY = process.env.TORN_STATS_MASTER_API_KEY;

    if (!TORN_API_KEY || !TORNSTATS_API_KEY) {
        console.error('API keys are not set in Netlify environment variables.');
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server configuration error: API keys missing.' }),
            headers: { 'Content-Type': 'application/json' },
        };
    }

    try {
        const { factionName, members: tornMembersData } = await fetchTornApiData(factionId, TORN_API_KEY);

        let finalCombinedData = [];

        const BATCH_SIZE = 5;
        const DELAY_BETWEEN_BATCHES = 300;

        for (let i = 0; i < tornMembersData.length; i += BATCH_SIZE) {
            const batch = tornMembersData.slice(i, i + BATCH_SIZE);
            const batchPromises = batch.map(async (member) => {
                const memberId = member.memberId;
                const tornStatsData = await fetchTornStatsData(memberId, TORNSTATS_API_KEY);
                return {
                    memberId: memberId,
                    factionId: factionId,
                    factionName: factionName,
                    tornData: member.tornData,
                    tornStatsData: tornStatsData,
                    spyReportAvailable: !tornStatsData.error
                    // lastUpdated: Date.now() removed from here, it will be added on the client-side when saving to Firestore
                };
            });
            const batchResults = await Promise.all(batchPromises);
            finalCombinedData.push(...batchResults);

            if (i + BATCH_SIZE < tornMembersData.length) {
                await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                factionId: factionId,
                factionName: factionName,
                members: finalCombinedData,
                message: "Data fetched and combined successfully."
            }),
            headers: { 'Content-Type': 'application/json' },
        };

    } catch (error) {
        console.error("Netlify Function execution error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Internal Server Error: ${error.message}` }),
            headers: { 'Content-Type': 'application/json' },
        };
    }
};