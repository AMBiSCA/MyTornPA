// A Netlify function to fetch Torn bounties and their target details securely.
// This function acts as a proxy, protecting the user's API key.
const fetch = require('node-fetch');

// The main handler function for Netlify
exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        const { apiKey } = JSON.parse(event.body);

        if (!apiKey) {
            console.error('API key is missing in the request body.');
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'API key is missing' })
            };
        }
        
        // --- Step 1: Fetch the list of current bounties from Torn API ---
        const bountiesUrl = `https://api.torn.com/v2/torn/bounties?key=${apiKey}`;
        const bountiesResponse = await fetch(bountiesUrl);
        const bountiesData = await bountiesResponse.json();

        if (bountiesData.error) {
            console.error('Torn API Error (Bounties):', bountiesData.error.error);
            return {
                statusCode: 400,
                body: JSON.stringify({ error: `Torn API Error: ${bountiesData.error.error}` })
            };
        }
        
        // --- NEW LOGIC ADDED HERE: Handle both array and object response formats ---
        let bounties = [];
        if (bountiesData.bounties) {
            // Check if the bounties are in an array (old API) or an object (new API)
            if (Array.isArray(bountiesData.bounties)) {
                bounties = bountiesData.bounties;
            } else if (typeof bountiesData.bounties === 'object') {
                bounties = Object.values(bountiesData.bounties);
            }
        }
        
        console.log(`Found ${bounties.length} bounties in the response.`);

        // --- Step 2: For each bounty, fetch the target's name and level ---
        const bountyPromises = bounties.map(async (bounty) => {
            const userUrl = `https://api.torn.com/v2/user/${bounty.target_player_id}?selections=basic&key=${apiKey}`;
            const userResponse = await fetch(userUrl);
            const userData = await userResponse.json();

            if (userData.error) {
                return {
                    ...bounty,
                    target_name: 'Error',
                    target_level: 0,
                    error: userData.error.error
                };
            }

            return {
                ...bounty,
                target_name: userData.basic.name,
                target_level: userData.basic.level,
            };
        });

        const enrichedBounties = await Promise.all(bountyPromises);

        const finalBounties = enrichedBounties.filter(bounty => !bounty.error);
        
        // --- Step 3: Return the final, enriched list to the client ---
        return {
            statusCode: 200,
            body: JSON.stringify({ bounties: finalBounties })
        };

    } catch (error) {
        console.error('Netlify Function caught an exception:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' })
        };
    }
};