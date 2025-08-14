// mysite/netlify-functions/send-availability-webhook.js

require('dotenv').config();

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

    const { discordWebhookUrl, nonResponders, reminderMessage, factionName, factionId } = requestBody;

    if (!discordWebhookUrl || !discordWebhookUrl.startsWith("https://discord.com/api/webhooks/")) {
        console.error("Invalid or missing Discord Webhook URL in request body.");
        return {
            statusCode: 400,
            body: JSON.stringify({ message: "Discord Webhook URL is invalid or missing from request." }),
        };
    }

    // --- NEW LOGIC TO HANDLE BOTH MESSAGE TYPES ---
    let discordMessageContent;

    // If there are non-responders, build the reminder message
    if (nonResponders && nonResponders.length > 0) {
        console.log("Building a REMINDER message...");
        discordMessageContent = `**War Availability Reminder for ${factionName || 'Your Faction'} (ID: ${factionId || 'N/A'})**\n\n`;
        discordMessageContent += `${reminderMessage}\n\n`;
        discordMessageContent += "**Members who haven't responded:**\n";
        nonResponders.forEach(member => {
            discordMessageContent += `- **${member.name}** [${member.id}]\n`;
        });
        discordMessageContent += "\nPlease log into the war hub to update your status!";
    } 
    // Otherwise, assume the reminderMessage IS the full content we want to send (for our report)
    else {
        console.log("Building a direct content message (like an availability report)...");
        discordMessageContent = reminderMessage;
    }
    // --- END OF NEW LOGIC ---


    const discordPayload = {
        username: "MyTornPA War Bot",
        // Make sure you have an image at this URL or change it
        avatar_url: "https://i.imgur.com/q4S15f5.png", 
        content: discordMessageContent,
    };

    try {
        const discordResponse = await fetch(discordWebhookUrl, {
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

        console.log(`Successfully sent webhook to Discord.`);
        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Webhook sent successfully." }),
        };

    } catch (error) {
        console.error("Error sending Discord webhook:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: `Failed to send Discord webhook: ${error.message}` }),
        };
    }
};