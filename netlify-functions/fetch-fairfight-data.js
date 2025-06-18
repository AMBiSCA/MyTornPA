// netlify/functions/fetch-fairfight-data.js

exports.handler = async function(event, context) {
    // Log the event details for debugging
    console.log("--- Netlify Function Invoked ---");
    console.log("HTTP Method:", event.httpMethod);
    console.log("Query Parameters:", JSON.stringify(event.queryStringParameters));

    if (event.httpMethod !== "GET") {
        console.log("Method Not Allowed: Expected GET, got", event.httpMethod);
        return {
            statusCode: 405, // Method Not Allowed
            body: "Method Not Allowed"
        };
    }

    const { type, id, apiKey } = event.queryStringParameters;

    if (!type || !id || !apiKey) {
        console.log("Missing Parameters:", { type, id, apiKey });
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
            console.log("Fetching individual player FF data for ID:", id);
            apiUrl = `https://ffscouter.com/api/v1/get-stats?key=${apiKey}&targets=${id}`;
            console.log("FFScouter API URL (player):", apiUrl);

            const ffScouterResponse = await fetch(apiUrl);
            console.log("FFScouter API Response Status (player):", ffScouterResponse.status, ffScouterResponse.statusText);
            
            if (!ffScouterResponse.ok) {
                const errorText = await ffScouterResponse.text();
                console.error("FFScouter API Error Response (player):", errorText);
                throw new Error(`FFScouter API Error: ${ffScouterResponse.status} - ${errorText}`);
            }
            responseData = await ffScouterResponse.json();
            console.log("FFScouter API Response Data (player):", JSON.stringify(responseData).substring(0, 500)); // Log part of the response

            if (Array.isArray(responseData) && responseData.length > 0) {
                responseData = responseData[0];
                if (!responseData.fair_fight && responseData.message) { // Check for specific FFScouter error message
                    throw new Error(`FFScouter Data Error for player ${id}: ${responseData.message}`);
                } else if (!responseData.fair_fight) {
                    throw new Error(`No fair_fight data found for player ${id}.`);
                }
            } else {
                throw new Error("No data returned from FFScouter for player ID.");
            }

        } else if (type === 'faction') {
            console.log("Fetching faction FF data for ID:", id);

            // First, fetch faction members from Torn.com API using the user's API key
            const tornFactionApiUrl = `https://api.torn.com/faction/${id}?selections=basic&key=${apiKey}`;
            console.log("Torn API URL (faction members):", tornFactionApiUrl);

            const tornFactionResponse = await fetch(tornFactionApiUrl);
            console.log("Torn API Response Status (faction members):", tornFactionResponse.status, tornFactionResponse.statusText);

            if (!tornFactionResponse.ok) {
                const tornErrorText = await tornFactionResponse.text();
                console.error("Torn API Error Response (faction members):", tornErrorText);
                throw new Error(`Torn API Error (Faction members): ${tornFactionResponse.status} - ${tornErrorText}`);
            }
            const tornFactionData = await tornFactionResponse.json();
            console.log("Torn API Response Data (faction members):", JSON.stringify(tornFactionData).substring(0, 500)); // Log part of the response

            if (tornFactionData.error) {
                throw new Error(`Torn API Faction Data Error: ${tornFactionData.error.error}`);
            }
            
            const memberIds = Object.keys(tornFactionData.members);
            console.log("Faction Member IDs:", memberIds);

            if (memberIds.length === 0) {
                responseData = { faction_name: tornFactionData.name, members: [] };
            } else {
                // Now, fetch Fair Fight data for all members from FFScouter.com
                const ffScouterTargetsUrl = `https://ffscouter.com/api/v1/get-stats?key=${apiKey}&targets=${memberIds.join(',')}`;
                console.log("FFScouter API URL (faction targets):", ffScouterTargetsUrl);

                const ffScouterMembersResponse = await fetch(ffScouterTargetsUrl);
                console.log("FFScouter API Response Status (faction targets):", ffScouterMembersResponse.status, ffScouterMembersResponse.statusText);

                if (!ffScouterMembersResponse.ok) {
                    const ffScouterErrorText = await ffScouterMembersResponse.text();
                    console.error("FFScouter API Error Response (faction targets):", ffScouterErrorText);
                    throw new Error(`FFScouter API Error (Members): ${ffScouterMembersResponse.status} - ${ffScouterErrorText}`);
                }
                const ffScouterMembersData = await ffScouterMembersResponse.json();
                console.log("FFScouter API Response Data (faction targets):", JSON.stringify(ffScouterMembersData).substring(0, 500)); // Log part of response

                const membersWithFF = memberIds.map(memberId => {
                    const memberBasic = tornFactionData.members[memberId];
                    const ffData = ffScouterMembersData.find(ff => ff && ff.player_id == memberId);
                    return {
                        id: memberId,
                        name: memberBasic.name,
                        ff_data: ffData || null
                    };
                });
                responseData = { faction_name: tornFactionData.name, members: membersWithFF };
            }

        } else {
            console.log("Invalid type parameter:", type);
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: "Invalid 'type' parameter. Must be 'player' or 'faction'." })
            };
        }

        // Return successful response
        console.log("Function returning successful response.");
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(responseData)
        };

    } catch (error) {
        console.error("Caught error in Netlify function:", error.message);
        return {
            statusCode: 500, // Internal Server Error
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: error.message || "Failed to fetch data due to an unexpected error." })
        };
    } finally {
        console.log("--- Function Execution Finished ---");
    }
};