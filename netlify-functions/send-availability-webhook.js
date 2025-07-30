// mysite/netlify-functions/send-availability-webhook.js

require('dotenv').config(); // Still good to have for other potential env variables

const fetch = require('node-fetch');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' }),
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

    // --- CRITICAL CHANGE: Get Discord Webhook URL from the request body ---
    const { discordWebhookUrl, nonResponders, reminderMessage, factionName, factionId } = requestBody;

    if (!discordWebhookUrl || !discordWebhookUrl.startsWith("https://discord.com/api/webhooks/")) {
        console.error("Invalid or missing Discord Webhook URL in request body.");
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Discord Webhook URL is invalid or missing from request." }),
        };
    }

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

    const discordPayload = {
        username: "MyTornPA War Bot",
        avatar_url: "https://your-website.com/images/your-bot-avatar.png",
        content: discordMessageContent,
    };

    try {
        const discordResponse = await fetch(discordWebhookUrl, { // Use the URL from the request body
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