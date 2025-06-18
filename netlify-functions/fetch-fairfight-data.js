// Function location: netlify/functions/fetch-fairfight-data.js --- KEY DEBUGGING VERSION ---
const fetch = require('node-fetch');

// Helper function to handle API calls and JSON parsing
async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API call failed with status ${response.status}: ${errorText}`);
    }
    return response.json();
}

exports.handler = async function(event, context) {
    const { type, id, apiKey } = event.queryStringParameters;

    // THIS IS THE DEBUG LINE ADDED FOR THE SERVER
    console.log("DEBUG: Function received this API Key:", apiKey);

    if (!type || !id || !apiKey) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Missing required parameters: type, id, and apiKey are required.' })
        };
    }
    if (type !== 'player' && type !== 'faction') {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid type parameter. Must be "player" or "faction".' })
        };
    }

    try {
        if (type === 'player') {
            const yataUrl = `https://yata.yt/api/v1/user/ff/${id}?key=${apiKey}`;
            const tornUrl = `https://api.torn.com/user/${id}?selections=profile&key=${apiKey}`;

            const [yataData, tornData] = await Promise.all([
                fetchJson(yataUrl),
                fetchJson(tornUrl)
            ]);

            if (yataData.error) throw new Error(`YATA API Error: ${yataData.error.error}`);
            if (tornData.error) throw new Error(`Torn API Error: ${tornData.error.error}`);
            
            const responseData = {
                ...yataData,
                player_name: tornData.name,
                level: tornData.level || null 
            };

            return {
                statusCode: 200,
                body: JSON.stringify(responseData)
            };

        } else if (type === 'faction') {
            const factionTornUrl = `https://api.torn.com/faction/${id}?selections=basic&key=${apiKey}`;
            const factionData = await fetchJson(factionTornUrl);
            
            if (factionData.error) throw new Error(`Torn API Error: ${factionData.error.error}`);

            const factionMembers = Object.values(factionData.members);
            
            const memberPromises = factionMembers.map(async (member) => {
                try {
                    const memberYataUrl = `https://yata.yt/api/v1/user/ff/${member.userID}?key=${apiKey}`;
                    const memberTornUrl = `https://api.torn.com/user/${member.userID}?selections=profile&key=${apiKey}`;

                    const [ffData, tornData] = await Promise.all([
                        fetchJson(memberYataUrl).catch(e => ({ error: { error: e.message } })),
                        fetchJson(memberTornUrl).catch(e => ({ error: { error: e.message } }))
                    ]);

                    if (ffData.error || tornData.error) {
                        return { id: member.userID, name: member.name, ff_data: { message: (ffData.error?.error || tornData.error?.error) } };
                    }
                    
                    const combinedFFData = {
                        ...ffData,
                        level: tornData.level || null 
                    };

                    return { id: member.userID, name: member.name, ff_data: combinedFFData };

                } catch (err) {
                     return { id: member.userID, name: member.name, ff_data: { message: "Failed to fetch" } };
                }
            });

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
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};