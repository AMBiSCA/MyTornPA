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

        console.log('Received request for bounties.');
        if (!apiKey) {
            console.error('API key is missing in the request body.');
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'API key is missing' })
            };
        }
        console.log(`Successfully received an API key.`);

        // --- Step 1: Fetch the list of current bounties from Torn API ---
        const bountiesUrl = `https://api.torn.com/v2/torn/bounties?key=${apiKey}`;
        const bountiesResponse = await fetch(bountiesUrl);
        const bountiesData = await bountiesResponse.json();

        // --- NEW LOG: Log the raw response from the Torn API ---
        console.log('Torn API bounties response received. Raw Data:');
        console.log(JSON.stringify(bountiesData, null, 2));

        // Handle any errors from the Torn API itself
        if (bountiesData.error) {
            console.error('Torn API Error (Bounties):', bountiesData.error.error);
            return {
                statusCode: 400,
                body: JSON.stringify({ error: `Torn API Error: ${bountiesData.error.error}` })
            };
        }
        
        // Ensure the 'bounties' property exists and is a valid object
        if (!bountiesData.bounties || typeof bountiesData.bounties !== 'object') {
            console.error('Torn API response format is unexpected. "bounties" object not found.');
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Unexpected API response format.' })
            };
        }
        
        // --- Step 2: For each bounty, fetch the target's name and level ---
        const bounties = Object.values(bountiesData.bounties);
        console.log(`Found ${bounties.length} bounties in the raw response.`);

        const bountyPromises = bounties.map(async (bounty) => {
            const userUrl = `https://api.torn.com/v2/user/${bounty.target_player_id}?selections=basic&key=${apiKey}`;
            const userResponse = await fetch(userUrl);
            const userData = await userResponse.json();

            // Check for user-specific errors (e.g., target doesn't exist)
            if (userData.error) {
                return {
                    ...bounty,
                    target_name: 'Error',
                    target_level: 0,
                    error: userData.error.error
                };
            }

            // Merge the user data into the bounty object
            return {
                ...bounty,
                target_name: userData.basic.name,
                target_level: userData.basic.level,
            };
        });

        // Wait for all the user data to be fetched
        const enrichedBounties = await Promise.all(bountyPromises);

        // Filter out any bounties that had a user-data fetching error
        const finalBounties = enrichedBounties.filter(bounty => !bounty.error);
        
        // --- Step 3: Return the final, enriched list to the client ---
        console.log(`Returning ${finalBounties.length} bounties to the client.`);
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