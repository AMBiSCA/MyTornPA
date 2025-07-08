// mysite/netlify-functions/send-availability-webhook.js

require('dotenv').config(); // Ensure dotenv is configured for Netlify Functions

const fetch = require('node-fetch'); // You might need to install node-fetch if not already in package.json
                                   // (npm install node-fetch in your project root)

// This is the handler function that Netlify Functions will execute
exports.handler = async (event, context) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    }

    // Get the Discord Webhook URL from environment variables
    // For Netlify Functions, environment variables are configured in the Netlify UI or netlify.toml
    const DISCORD_AVAILABILITY_WEBHOOK_URL = process.env.DISCORD_AVAILABILITY_WEBHOOK_URL;

    if (!DISCORD_AVAILABILITY_WEBHOOK_URL) {
        console.error("Discord Webhook URL is not configured as an environment variable for this Netlify Function.");
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Server-side webhook URL is not configured." }),
        };
    }

    let requestBody;
    try {
        requestBody = JSON.parse(event.body);
    } catch (error) {
        console.error("Error parsing request body:", error);
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Invalid JSON in request body." }),
        };
    }

    const { nonResponders, reminderMessage, factionName, factionId } = requestBody;

    if (!nonResponders || nonResponders.length === 0) {
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "No non-responders to notify." }),
        };
    }

    let discordMessageContent = `**War Availability Reminder for ${factionName || 'Your Faction'} (ID: ${factionId || 'N/A'})**\n\n`;
    discordMessageContent += `${reminderMessage}\n\n`;
    discordMessageContent += "**Members who haven't responded:**\n";

    nonResponders.forEach(member => {
        discordMessageContent += `- **${member.name}** [${member.id}]\n`;
    });
    discordMessageContent += "\nPlease log into the war hub to update your status!";

    // Discord Webhook Payload
    const discordPayload = {
        username: "MyTornPA War Bot", // Name that appears in Discord
        avatar_url: "https://your-website.com/images/your-bot-avatar.png", // Optional: replace with your bot's avatar
        content: discordMessageContent,
        // You can add embeds here for richer messages if desired
        // embeds: [{ title: "Update your status!", url: "https://your-website.com/warhub" }]
    };

    try {
        const discordResponse = await fetch(DISCORD_AVAILABILITY_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(discordPayload)
        });

        if (!discordResponse.ok) {
            const errorText = await discordResponse.text();
            console.error(`Failed to send Discord webhook: ${discordResponse.status} ${errorText}`);
            throw new Error(`Discord webhook failed with status ${discordResponse.status}: ${errorText}`);
        }

        console.log(`Successfully sent availability reminder webhook to Discord for ${nonResponders.length} members.`);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Webhook sent successfully via Netlify Function." }),
        };

    } catch (error) {
        console.error("Error sending Discord webhook via Netlify Function:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: `Failed to send Discord webhook: ${error.message}` }),
        };
    }
};