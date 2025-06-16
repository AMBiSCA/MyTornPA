const axios = require('axios');

// Retrieve Torn API Key from Netlify Environment Variables
const TORN_API_KEY = process.env.TORN_API_KEY;

/**
 * Fetches faction name and all member IDs for a given faction ID using the Torn API.
 * @param {number} factionID - The ID of the faction to fetch.
 * @returns {object} An object containing factionName and an array of member IDs.
 * @throws {Error} if Torn API Key is missing or API call fails.
 */
async function getFactionInfoAndMembers(factionID) {
    if (!TORN_API_KEY) {
        const errorMsg = "[CRITICAL] TORN_API_KEY is not set. Cannot fetch faction members. Please configure it in Netlify Environment Variables.";
        console.error(errorMsg);
        throw new Error(errorMsg);
    }

    const url = `https://api.torn.com/v2/faction/${factionID}?selections=basic,members&key=${TORN_API_KEY}`;
    console.log(`[DEBUG] get-faction-members: Attempting to fetch from Torn API: ${url}`);
    try {
        const response = await axios.get(url);

        if (response.data) {
            const factionName = response.data.name || `Faction ${factionID}`;
            let memberIDs = [];

            if (response.data.members) {
                if (Array.isArray(response.data.members)) {
                    memberIDs = response.data.members.map(member => member.id);
                } else if (typeof response.data.members === 'object') {
                    memberIDs = Object.keys(response.data.members).map(Number).filter(id => !isNaN(id) && id > 0);
                }
            }

            console.log(`[DEBUG] get-faction-members: Found ${memberIDs.length} members for faction ${factionID} (${factionName}).`);
            return { factionName, memberIDs };
        } else {
            const infoMsg = `[INFO] get-faction-members: No data found for faction ${factionID}. Response structure might be unexpected or faction is empty.`;
            console.log(infoMsg);
            return { factionName: `Faction ${factionID}`, memberIDs: [] };
        }

    } catch (error) {
        let errorMessage = error.message;
        if (error.response) {
            errorMessage = `Error fetching faction ${factionID} from Torn API (Status: ${error.response.status}): ${error.message}`;
            if (error.response.data && error.response.data.error) {
                errorMessage += ` Torn API Error Details: Code ${error.response.data.error.code} - ${error.response.data.error.error}`;
            }
        } else if (error.request) {
            errorMessage = `No response received for Torn API faction ${factionID} request: ${error.message}`;
        } else {
            errorMessage = `Request setup error for Torn API faction ${factionID}: ${error.message}`;
        }
        console.error(`[CRITICAL] get-faction-members: ${errorMessage}`);
        throw new Error(errorMessage);
    }
}

// Netlify Function Handler
exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed. Only POST requests are allowed.' })
        };
    }

    let requestBody;
    try {
        requestBody = JSON.parse(event.body);
    } catch (e) {
        console.error("Error parsing request body:", e);
        return {
            statusCode: 400,
            body: JSON.stringify({ success: false, message: "Invalid JSON in request body." })
        };
    }

    const factionId = requestBody.factionId;

    if (!factionId || isNaN(factionId) || parseInt(factionId) <= 0) {
        return {
            statusCode: 400,
            body: JSON.stringify({ success: false, message: "Missing or invalid 'factionId' in request body. Must be a positive integer." })
        };
    }

    console.log(`[get-faction-members] Function triggered for Faction ID: ${factionId}.`);

    try {
        const { factionName, memberIDs } = await getFactionInfoAndMembers(parseInt(factionId));

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                success: true,
                factionName: factionName,
                memberIDs: memberIDs, // Return the full list of member IDs
                totalMembers: memberIDs.length
            })
        };
    } catch (error) {
        console.error(`[get-faction-members] Error: ${error.message}`);
        return {
            statusCode: 500,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                success: false,
                message: "Internal server error during faction member retrieval.",
                details: error.message
            })
        };
    }
};