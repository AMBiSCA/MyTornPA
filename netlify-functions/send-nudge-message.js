// File: netlify/functions/send-nudge-message.js

// Import the Discord.js library
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const admin = require('firebase-admin');

// Netlify environment variables
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

// Initialize Firebase Admin SDK using credentials from an environment variable
// This is the safest way to handle credentials in a serverless function.
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_CREDENTIALS)),
    });
}
const db = admin.firestore();

// Set up the Discord client with necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

exports.handler = async (event, context) => {
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

    if (!memberId || !memberName || !leaderName) {
        return {
            statusCode: 400,
            body: JSON.stringify({ message: 'Missing required data in request body' }),
        };
    }
    
    try {
        // Step 1: Read the Discord settings from Firestore
        const settingsDoc = await db.collection('factionSettings').doc('discord').get();
        if (!settingsDoc.exists || !settingsDoc.data().discordGuildId || !settingsDoc.data().discordNudgeChannelId) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Discord settings not configured in Firestore.' }),
            };
        }
        
        const { discordGuildId, discordNudgeChannelId } = settingsDoc.data();

        // Step 2: Log in the bot using the token
        await client.login(BOT_TOKEN);

        // Fetch the guild and members to find the target user
        const guild = await client.guilds.fetch(discordGuildId);
        await guild.members.fetch();
        
        // Find the member by searching their nickname for the Torn ID
        const discordMember = guild.members.cache.find(m => m.nickname && m.nickname.includes(`[${memberId}]`));

        if (!discordMember) {
            client.destroy();
            return {
                statusCode: 404,
                body: JSON.stringify({ message: `Member ${memberName} not found in Discord server. Make sure their nickname contains [${memberId}].` }),
            };
        }

        // Step 3: Send the message to the correct channel
        const channel = await client.channels.fetch(discordNudgeChannelId);
        if (channel) {
            await channel.send(`Hey ${discordMember}! A friendly reminder from ${leaderName} to take a Xanax. You can find out more here https://www.torn.com/factions.php#/`);
            
            // Gracefully destroy the bot client to avoid memory leaks in serverless environment
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