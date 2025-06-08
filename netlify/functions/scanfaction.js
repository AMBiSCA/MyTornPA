// Ensure these dependencies are installed:
// npm install firebase-admin --prefix .
// npm install node-fetch --prefix .

const admin = require("firebase-admin");
const fetch = require("node-fetch");

// Initialize Firebase Admin SDK (using environment variable for service account key)
// Make sure FIREBASE_SERVICE_ACCOUNT_KEY is set in your Netlify site settings.
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

if (!admin.apps.length) { // Prevents re-initializing if running locally or in dev server
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

// --- Your Estimated Battle Stats Formula ---
// This is a placeholder based on general Torn knowledge.
// It is an APPROXIMATION and NOT a precise formula.
// For higher accuracy, you would need more detailed game data or a community-vetted model.
function estimateBattleStats(level, age, xanaxUsed, energyRefillsUsed) {
    // --- Robustness: Ensure inputs are numbers, default to 0 if not valid ---
    const numericLevel = Number(level) || 0;
    const numericAge = Number(age) || 0;
    const numericXanaxUsed = Number(xanaxUsed) || 0;
    const numericEnergyRefillsUsed = Number(energyRefillsUsed) || 0;

    let estimatedTotalStats = 0;

    estimatedTotalStats += numericLevel * 1000;
    estimatedTotalStats += numericAge * 50;
    estimatedTotalStats += numericXanaxUsed * 20000;
    estimatedTotalStats += numericEnergyRefillsUsed * 5000;

    const individualStatEstimate = Math.round(estimatedTotalStats / 4) || 0;
    const finalTotalEstimatedStats = Math.round(estimatedTotalStats) || 0;

    return {
        strength: individualStatEstimate,
        defense: individualStatEstimate,
        speed: individualStatEstimate,
        dexterity: individualStatEstimate,
        totalEstimatedStats: finalTotalEstimatedStats
    };
}
// ------------------------------------------

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  // --- CHANGES START HERE ---
  // Parse the request body from the frontend - only factionId is expected now
  const { factionId } = JSON.parse(event.body);

  // Get the API key directly from Netlify Environment Variables
  const API_KEY_FOR_TORN = process.env.TORN_API_KEY;

  if (!factionId) { // Only check factionId, as API_KEY_FOR_TORN comes from env
    return { statusCode: 400, body: JSON.stringify({ error: "Faction ID is required." }) };
  }
  if (!API_KEY_FOR_TORN) {
    return { statusCode: 500, body: JSON.stringify({ error: "Server API Key not configured." }) };
  }
  // --- CHANGES END HERE ---

  const processedMembers = [];
  const errors = [];

  try {
    // 1. Fetch Faction Members from Torn API - use the environment variable API_KEY_FOR_TORN
    const factionRes = await fetch(`https://api.torn.com/faction/?selections=basic&key=${API_KEY_FOR_TORN}&ID=${factionId}`);
    const factionData = await factionRes.json();

    if (factionData.error) {
      console.error("Torn API Faction Error:", factionData.error);
      return { statusCode: 400, body: JSON.stringify({ error: factionData.error.error || "Failed to fetch faction data." }) };
    }

    if (!factionData.members) {
        return { statusCode: 404, body: JSON.stringify({ error: "Faction not found or has no members." }) };
    }

    const memberIds = Object.keys(factionData.members);

    // 2. Iterate through members, collect data, and save to Firestore
    for (const memberId of memberIds) {
      try {
        await new Promise(resolve => setTimeout(resolve, 700));

        // Use the environment variable API_KEY_FOR_TORN for user data fetches too
        const userRes = await fetch(`https://api.torn.com/user/?selections=basic,personalstats&key=${API_KEY_FOR_TORN}&ID=${memberId}`);
        const userData = await userRes.json();

        // --- DEBUGGING LOGS (Optional, remove after debugging) ---
        console.log(`DEBUG: Fetched data for member ${memberId}:`, JSON.stringify(userData, null, 2));
        console.log(`DEBUG: Member ${memberId} age:`, userData.age);
        console.log(`DEBUG: Member ${memberId} xanaxUsed:`, userData.personalstats ? userData.personalstats.xanax : 'N/A');
        console.log(`DEBUG: Member ${memberId} energyRefillsUsed:`, userData.personalstats ? userData.personalstats.energydrink : 'N/A');
        // --- END DEBUGGING LOGS ---


        if (userData.error) {
          console.warn(`Error fetching data for user ${memberId}:`, userData.error);
          errors.push(`User ${memberId}: ${userData.error.error || "Unknown error"}`);
          continue;
        }

        const { name, level, age } = userData;
        const personalStats = userData.personalstats || {};

        const xanaxUsed = personalStats.xanax || 0;
        const energyRefillsUsed = personalStats.energydrink || 0;

        const estimatedStats = estimateBattleStats(level, age, xanaxUsed, energyRefillsUsed);

        await db.collection("userProfiles").doc(String(memberId)).set({
          tornId: memberId,
          name: name,
          level: level,
          age: age,
          xanaxUsed: xanaxUsed,
          energyRefillsUsed: energyRefillsUsed,
          strength: estimatedStats.strength,
          defense: estimatedStats.defense,
          speed: estimatedStats.speed,
          dexterity: estimatedStats.dexterity,
          totalStats: estimatedStats.totalEstimatedStats,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true, ignoreUndefinedProperties: true });

        processedMembers.push(name || memberId);

      } catch (memberError) {
        console.error(`Unhandled error processing member ${memberId}:`, memberError);
        errors.push(`Unhandled error for User ${memberId}: ${memberError.message}`);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Successfully processed ${processedMembers.length} members.`,
        processed: processedMembers,
        errors: errors.length > 0 ? errors : undefined
      }),
    };

  } catch (mainError) {
    console.error("Error in scanFaction Netlify Function:", mainError);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error during faction scan: " + mainError.message }),
    };
  }
};