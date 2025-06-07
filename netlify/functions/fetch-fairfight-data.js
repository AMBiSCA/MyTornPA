// netlify/functions/fetch-fairfight-data.js

exports.handler = async function(event, context) {
    // Ensure this function only responds to GET requests
    if (event.httpMethod !== "GET") {
        return {
            statusCode: 405, // Method Not Allowed
            body: "Method Not Allowed"
        };
    }

    // Get parameters from the request query string (e.g., ?type=player&id=123&apiKey=YOUR_TORN_KEY)
    const { type, id, apiKey } = event.queryStringParameters;

    if (!type || !id || !apiKey) {
        return {
            statusCode: 400,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: "Missing 'type', 'id', or 'apiKey' parameters." })
        };
    }

    let apiUrl = '';
    let responseData = null;

    try {
        if (type === 'player') {
            // FFScouter API endpoint for individual player Fair Fight data
            apiUrl = `https://ffscouter.com/api/v1/get-stats?key=${apiKey}&targets=${id}`;
            const ffScouterResponse = await fetch(apiUrl);
            
            if (!ffScouterResponse.ok) {
                const errorText = await ffScouterResponse.text();
                throw new Error(`FFScouter API Error: ${ffScouterResponse.status} - ${errorText}`);
            }
            responseData = await ffScouterResponse.json();

            // The FFScouter API returns an array, we expect data for one target.
            if (Array.isArray(responseData) && responseData.length > 0) {
                responseData = responseData[0]; // Get the single player's data
            } else {
                throw new Error("No data returned from FFScouter for player ID.");
            }

        } else if (type === 'faction') {
            // FFScouter API endpoint for faction Fair Fight data (if available and needed)
            // Note: The UserScript used Torn.com API for faction member statuses.
            // For Fair Fight, ffscouter.com's /api/v1/get-stats endpoint handles multiple targets.
            // To get *all* members for FFScouter, you'd first need to fetch faction members from Torn API.
            // Let's assume for 'faction' type, you want a list of members with FF data.

            // First, fetch faction members from Torn.com API using the user's API key
            const tornFactionApiUrl = `https://api.torn.com/faction/${id}?selections=basic&key=${apiKey}`;
            const tornFactionResponse = await fetch(tornFactionApiUrl);
            if (!tornFactionResponse.ok) {
                const tornErrorText = await tornFactionResponse.text();
                throw new Error(`Torn API Error (Faction): ${tornFactionResponse.status} - ${tornErrorText}`);
            }
            const tornFactionData = await tornFactionResponse.json();

            if (tornFactionData.error) {
                throw new Error(`Torn API Faction Data Error: ${tornFactionData.error.error}`);
            }
            
            const memberIds = Object.keys(tornFactionData.members);
            if (memberIds.length === 0) {
                responseData = { faction_name: tornFactionData.name, members: [] };
            } else {
                // Now, fetch Fair Fight data for all members from FFScouter.com
                const ffScouterTargetsUrl = `https://ffscouter.com/api/v1/get-stats?key=${apiKey}&targets=${memberIds.join(',')}`;
                const ffScouterMembersResponse = await fetch(ffScouterTargetsUrl);
                
                if (!ffScouterMembersResponse.ok) {
                    const ffScouterErrorText = await ffScouterMembersResponse.text();
                    throw new Error(`FFScouter API Error (Members): ${ffScouterMembersResponse.status} - ${ffScouterErrorText}`);
                }
                const ffScouterMembersData = await ffScouterMembersResponse.json();

                // Combine faction info with FF data
                const membersWithFF = memberIds.map(memberId => {
                    const memberBasic = tornFactionData.members[memberId];
                    const ffData = ffScouterMembersData.find(ff => ff.player_id == memberId); // Note: == for type coercion
                    return {
                        id: memberId,
                        name: memberBasic.name,
                        ff_data: ffData || null // null if no FF data found for this member
                    };
                });
                responseData = { faction_name: tornFactionData.name, members: membersWithFF };
            }

        } else {
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: "Invalid 'type' parameter. Must be 'player' or 'faction'." })
            };
        }

        // Return successful response
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(responseData)
        };

    } catch (error) {
        console.error("Error in Netlify function:", error.message);
        return {
            statusCode: 500, // Internal Server Error
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: error.message || "Failed to fetch data." })
        };
    }
};