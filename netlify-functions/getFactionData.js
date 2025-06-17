// netlify/functions/getFactionData.js

const admin = require('firebase-admin');

try {
  const encodedServiceAccount = process.env.FIREBASE_ADMIN_SDK_CONFIG;
  const decodedServiceAccount = Buffer.from(encodedServiceAccount, 'base64').toString('utf8');
  const serviceAccount = JSON.parse(decodedServiceAccount);

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} catch (error) {
  console.error('Failed to initialize Firebase Admin SDK in getFactionData. Check FIREBASE_ADMIN_SDK_CONFIG environment variable.', error);
}

// Helper to fetch API data and handle common errors
async function fetchApi(url) {
    const response = await fetch(url);
    if (!response.ok) {
        let errorData;
        let errorMessage;
        try {
            errorData = await response.json();
            errorMessage = errorData?.error?.message || (typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData));
        } catch (e) {
            errorMessage = response.statusText || `API Error ${response.status}`;
        }
        const displayMessage = typeof errorMessage === 'string' ? errorMessage.substring(0, 150) : 'Unknown API Error';
        throw new Error(`API Error (HTTP ${response.status}): ${displayMessage}`);
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

// Function to fetch ONLY basic faction data and member IDs from Torn API
async function fetchBasicFactionData(factionId, tornApiKey) {
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
    const factionMembers = Object.keys(members).map(memberId => ({
        memberId: memberId,
        memberName: members[memberId].name // Get member name from basic faction data
    }));

    return { factionId, factionName, members: factionMembers };
}

// Function to fetch TornStats spy reports for individual members (UNCHANGED)
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
        // Step 1: Fetch basic faction data (members and names) from Torn API
        const { factionName, members: factionMembersList } = await fetchBasicFactionData(factionId, TORN_API_KEY);

        let finalCombinedData = [];

        const BATCH_SIZE = 5;
        const DELAY_BETWEEN_BATCHES = 750; // Increased delay to 750ms to help with rate limits

        // Step 2: Fetch battle stats for each member from TornStats and combine
        for (let i = 0; i < factionMembersList.length; i += BATCH_SIZE) {
            const batch = factionMembersList.slice(i, i + BATCH_SIZE);
            const batchPromises = batch.map(async (member) => {
                const memberId = member.memberId;
                const memberName = member.memberName; // Get name from basic faction fetch
                const tornStatsData = await fetchTornStatsData(memberId, TORNSTATS_API_KEY);
                
                return {
                    memberId: memberId,
                    memberName: memberName, // Include member name here
                    factionId: factionId,
                    factionName: factionName,
                    tornStatsData: tornStatsData,
                    spyReportAvailable: !tornStatsData.error
                };
            });
            const batchResults = await Promise.all(batchPromises);
            finalCombinedData.push(...batchResults);

            if (i + BATCH_SIZE < factionMembersList.length) {
                await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
            }
        }

        // Return the combined data
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