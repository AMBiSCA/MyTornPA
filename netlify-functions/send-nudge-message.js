
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// Netlify will securely provide these as environment variables
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const GUILD_ID = process.env.DISCORD_GUILD_ID;
const CHANNEL_ID = process.env.DISCORD_NUDGE_CHANNEL_ID;

client.once('ready', () => {
    console.log(`Bot is logged in for nudge function.`);
});

exports.handler = async (event) => {
    // Check for POST request and parse body
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    }
    
    let body;
    try {
        body = JSON.parse(event.body);
    } catch (error) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Invalid JSON body' }),
        };
    }
    
    const { memberId, memberName, leaderName } = body;
    
    if (!memberId || !memberName) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing memberId or memberName in request body' }),
        };
    }

    try {
        // Log in the bot using the token
        await client.login(BOT_TOKEN);
        
        // Fetch the guild and members
        const guild = await client.guilds.fetch(GUILD_ID);
        await guild.members.fetch();
        
        // Find the member by searching their nickname for the Torn ID
        const discordMember = guild.members.cache.find(m => m.nickname && m.nickname.includes(`[${memberId}]`));

        if (!discordMember) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: `Member ${memberName} not found in Discord server. Make sure their nickname contains [${memberId}].` }),
            };
        }

        const channel = await client.channels.fetch(CHANNEL_ID);
        
        if (channel) {
            await channel.send(`Hey ${discordMember}! A friendly reminder from ${leaderName} to take a Xanax.`);
            console.log(`Nudge sent to ${memberName} successfully.`);
            
            // Gracefully destroy the bot client to prevent memory leaks in the serverless environment
            client.destroy();

            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Nudge sent successfully!' }),
            };
        } else {
            client.destroy();
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'Nudge failed: Target channel not found.' }),
            };
        }
    } catch (error) {
        console.error('Error in Netlify function:', error);
        client.destroy();
        return {
            statusCode: 500,
            body: JSON.stringify({ message: `Internal server error: ${error.message}` }),
        };
    }
};