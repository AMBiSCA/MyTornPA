// Function location: netlify/functions/fetch-fairfight-data.js
const fetch = require('node-fetch');

// Helper function to handle API calls and JSON parsing
async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        // Try to get error text from the API response
        const errorText = await response.text();
        throw new Error(`API call failed with status ${response.status}: ${errorText}`);
    }
    return response.json();
}

exports.handler = async function(event, context) {
    // Get parameters from the URL, e.g. ?type=player&id=123&apiKey=XYZ
    const { type, id, apiKey } = event.queryStringParameters;

    // --- Input Validation ---
    if (!type || !id || !apiKey) {
        return {
            statusCode: 400, // Bad Request
            body: JSON.stringify({ error: 'Missing required parameters: type, id, and apiKey are required.' })
        };
    }
    if (type !== 'player' && type !== 'faction') {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid type parameter. Must be "player" or "faction".' })
        };
    }

    // --- Main Logic ---
    try {
        if (type === 'player') {
            // --- Handle Individual Player Check ---
            const yataUrl = `https://yata.yt/api/v1/user/ff/${id}?key=${apiKey}`;
            const tornUrl = `https://api.torn.com/user/${id}?selections=profile&key=${apiKey}`;

            // Fetch from YATA and Torn APIs at the same time
            const [yataData, tornData] = await Promise.all([
                fetchJson(yataUrl),
                fetchJson(tornUrl)
            ]);

            // Check for errors from the APIs themselves
            if (yataData.error) throw new Error(`YATA API Error: ${yataData.error.error}`);
            if (tornData.error) throw new Error(`Torn API Error: ${tornData.error.error}`);
            
            // Combine data and send it back
            const responseData = {
                ...yataData, // Includes fair_fight, last_updated, bs_estimate_human, etc.
                player_name: tornData.name,
                level: tornData.level // <-- ADDED LEVEL
            };

            return {
                statusCode: 200,
                body: JSON.stringify(responseData)
            };

        } else if (type === 'faction') {
            // --- Handle Faction Check ---
            const factionTornUrl = `https://api.torn.com/faction/${id}?selections=basic&key=${apiKey}`;
            const factionData = await fetchJson(factionTornUrl);
            
            if (factionData.error) throw new Error(`Torn API Error: ${factionData.error.error}`);

            const factionMembers = Object.values(factionData.members);
            
            // Create a promise for each member's YATA FF and Torn Profile check
            const memberPromises = factionMembers.map(async (member) => {
                try {
                    const memberYataUrl = `https://yata.yt/api/v1/user/ff/${member.userID}?key=${apiKey}`;
                    const memberTornUrl = `https://api.torn.com/user/${member.userID}?selections=profile&key=${apiKey}`;

                    // Fetch both FF data and profile data (for level) concurrently
                    const [ffData, tornData] = await Promise.all([
                        fetchJson(memberYataUrl).catch(e => ({ error: { error: e.message } })), // Add catch to prevent one failure from killing all
                        fetchJson(memberTornUrl).catch(e => ({ error: { error: e.message } }))
                    ]);

                    if (ffData.error || tornData.error) {
                        return { id: member.userID, name: member.name, ff_data: { message: (ffData.error?.error || tornData.error?.error) } };
                    }
                    
                    // Combine the ffData and the level from tornData
                    const combinedFFData = {
                        ...ffData,
                        level: tornData.level // <-- ADDED LEVEL
                    };

                    return { id: member.userID, name: member.name, ff_data: combinedFFData };

                } catch (err) {
                     return { id: member.userID, name: member.name, ff_data: { message: "Failed to fetch" } };
                }
            });

            // Wait for all member checks to complete
            const membersWithFF = await Promise.all(memberPromises);
            
            const responseData = {
                faction_name: factionData.name,
                members: membersWithFF
            };

            return {
                statusCode: 200,
                body: JSON.stringify(responseData)
            };
        }
    } catch (error) {
        console.error("Function Error:", error);
        return {
            statusCode: 500, // Internal Server Error
            body: JSON.stringify({ error: error.message })
        };
    }
};