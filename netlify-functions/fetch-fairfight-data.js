// netlify/functions/fetch-fairfight-data.js
const fetch = require('node-fetch');

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

    try {
        if (type === 'player') {
            console.log("Fetching individual player FF data for ID:", id);
            const ffScouterResponse = await fetch(`https://ffscouter.com/api/v1/get-stats?key=${apiKey}&targets=${id}`);
            console.log("FFScouter API Response Status (player):", ffScouterResponse.status, ffScouterResponse.statusText);
            
            if (!ffScouterResponse.ok) {
                const errorText = await ffScouterResponse.text();
                console.warn(`FFScouter API Error (player ${id}): ${ffScouterResponse.status} - ${errorText}. Skipping this target for display.`);
                return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: id, status: "skipped", reason: "ffscouter_api_error" }) };
            }
            let responseData = await ffScouterResponse.json();
            console.log("FFScouter API Response Data (player):", JSON.stringify(responseData).substring(0, 500));

            if (Array.isArray(responseData) && responseData.length > 0) {
                responseData = responseData[0];
                if (!responseData.fair_fight && responseData.message) {
                    console.warn(`FFScouter Data Error for player ${id}: ${responseData.message}. Skipping this target for display.`);
                    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: id, status: "skipped", reason: "no_ff_data_with_message" }) };
                } else if (!responseData.fair_fight) {
                    console.warn(`No fair_fight data found for player ${id}. Skipping this target for display.`);
                    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: id, status: "skipped", reason: "no_ff_data" }) };
                }
            } else {
                console.warn(`No data returned from FFScouter for player ID ${id}. Skipping this target for display.`);
                return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: id, status: "skipped", reason: "empty_ffscouter_response" }) };
            }
            // If we reach here, it means we have valid fair_fight data for the player
            console.log(`Successfully fetched FF data for player ${id}.`);
            return {
                statusCode: 200,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(responseData) // Original successful response
            };

        } else if (type === 'faction') {
            console.log("Fetching faction FF data for ID:", id);

            const tornFactionResponse = await fetch(`https://api.torn.com/faction/${id}?selections=basic&key=${apiKey}`);
            console.log("Torn API Response Status (faction members):", tornFactionResponse.status, tornFactionResponse.statusText);

            if (!tornFactionResponse.ok) {
                const tornErrorText = await tornFactionResponse.text();
                console.warn(`Torn API Error (Faction ${id}): ${tornFactionResponse.status} - ${tornErrorText}. Skipping this faction for display.`);
                return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: id, status: "skipped", reason: "torn_faction_api_error" }) };
            }
            const tornFactionData = await tornFactionResponse.json();
            console.log("Torn API Response Data (faction members):", JSON.stringify(tornFactionData).substring(0, 500)); 

            if (tornFactionData.error) {
                let errorMessage = tornFactionData.error.error;
                console.warn(`Torn API Faction Data Error for faction ${id}: ${errorMessage}. Skipping this faction for display.`);
                return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: id, status: "skipped", reason: "torn_api_json_error" }) };
            }
            
            const memberIds = Object.keys(tornFactionData.members);
            console.log("Faction Member IDs:", memberIds);

            if (memberIds.length === 0) {
                console.warn(`No members found for faction ${id}. Skipping this faction for display.`);
                return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: id, status: "skipped", reason: "no_members_found" }) };
            } else {
                const ffScouterTargetsUrl = `https://ffscouter.com/api/v1/get-stats?key=${apiKey}&targets=${memberIds.join(',')}`;
                console.log("FFScouter API URL (faction targets):", ffScouterTargetsUrl);

                const ffScouterMembersResponse = await fetch(ffScouterTargetsUrl);
                console.log("FFScouter API Response Status (faction targets):", ffScouterMembersResponse.status, ffScouterMembersResponse.statusText);

                if (!ffScouterMembersResponse.ok) {
                    const ffScouterErrorText = await ffScouterMembersResponse.text();
                    console.warn(`FFScouter API Error fetching members for faction ${id}: ${ffScouterErrorText}. Skipping this faction for display.`);
                    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: id, status: "skipped", reason: "ffscouter_members_api_error" }) };
                }
                const ffScouterMembersData = await ffScouterMembersResponse.json();
                console.log("FFScouter API Response Data (faction targets):", JSON.stringify(ffScouterMembersData).substring(0, 500)); 

                const membersWithFF = memberIds.map(memberId => {
                    const memberBasic = tornFactionData.members[memberId];
                    const ffData = ffScouterMembersData.find(ff => ff && ff.player_id == memberId);
                    return {
                        id: memberId,
                        name: memberBasic.name,
                        ff_data: ffData || null // Return null or empty object if FF data not found for a specific member
                    };
                });
                // For a successful faction data fetch, return the full response data
                console.log(`Successfully fetched faction data for ${id}.`);
                return {
                    statusCode: 200,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "success", faction_name: tornFactionData.name, members: membersWithFF })
                };
            }

        } else {
            console.log("Invalid type parameter:", type);
            return {
                statusCode: 400,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ error: "Invalid 'type' parameter. Must be 'player' or 'faction'." })
            };
        }

    } catch (error) {
        console.error("Caught unexpected error in Netlify function:", error.message);
        // For truly unexpected errors (not API-specific issues handled above), still return 500
        return {
            statusCode: 500, // Internal Server Error
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ error: `Unexpected server error: ${error.message || "Failed to fetch data due to an unexpected error."}` })
        };
    } finally {
        console.log("--- Function Execution Finished ---");
    }
};