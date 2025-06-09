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
function estimateBattleStats(level, age, xanaxUsed, energyRefillsUsed) {
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

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  const { factionId, apiKey } = JSON.parse(event.body);

  if (!factionId || !apiKey) {
    return { statusCode: 400, body: JSON.stringify({ error: "Faction ID and API Key are required." }) };
  }

  const processedMembers = [];
  const errors = [];

  try {
    const factionRes = await fetch(`https://api.torn.com/faction/?selections=basic&key=${apiKey}&ID=${factionId}`);
    const factionData = await factionRes.json();

    if (factionData.error) {
      console.error("Torn API Faction Error:", factionData.error);
      return { statusCode: 400, body: JSON.stringify({ error: factionData.error.error || "Failed to fetch faction data." }) };
    }

    if (!factionData.members) {
        return { statusCode: 404, body: JSON.stringify({ error: "No members found for this faction or invalid Faction ID." }) };
    }

    const memberIds = Object.keys(factionData.members);

    const userProcessingPromises = memberIds.map(async (memberId) => {
      let combinedData = { member_id_for_table: memberId };
      let overallStatus = true;
      let memberErrors = [];

      const primarySelections = 'basic,profile';
      const primaryDataUrl = `https://api.torn.com/user/${memberId}?selections=${primarySelections}&key=${apiKey}`;

      try {
        await new Promise(resolve => setTimeout(resolve, 350));
        const response1 = await fetch(primaryDataUrl);
        if (!response1.ok) {
          memberErrors.push(`Primary Fetch (HTTP ${response1.status})`);
          overallStatus = false;
        } else {
          const data1 = await response1.json();
          if (data1.error) {
            memberErrors.push(`Primary API: ${data1.error.error}`);
            overallStatus = false;
          } else {
            combinedData = { ...combinedData, ...data1 };
          }
        }
      } catch (e) {
        memberErrors.push(`Primary Network Err: ${e.message.substring(0, 50)}`);
        overallStatus = false;
      }

      if (overallStatus) {
        const personalStatsSelection = 'personalstats';
        const personalStatsDataUrl = `https://api.torn.com/user/${memberId}?selections=${personalStatsSelection}&key=${apiKey}`;
        try {
          await new Promise(resolve => setTimeout(resolve, 350));
          const response2 = await fetch(personalStatsDataUrl);
          if (!response2.ok) {
            memberErrors.push(`PersonalStats Fetch (HTTP ${response2.status})`);
          } else {
            const data2 = await response2.json();
            if (data2.error) {
              memberErrors.push(`PersonalStats API: ${data2.error.error}`);
            } else {
              combinedData.personalstats = { ...(combinedData.personalstats || {}), ...(data2.personalstats || {}) };
            }
          }
        } catch (e) {
          memberErrors.push(`PersonalStats Network Err: ${e.message.substring(0, 50)}`);
        }
      } else {
        memberErrors.push("Skipped personalstats due to primary fetch error.");
      }
      
      if (!combinedData.name && factionData.members[memberId] && factionData.members[memberId].name) {
          combinedData.name = factionData.members[memberId].name;
      }

      if (memberErrors.length > 0) combinedData.error = { error: memberErrors.join('; ') };

      return { memberId, data: combinedData, status: !combinedData.error };
    });

    const userResponses = await Promise.allSettled(userProcessingPromises);

    for (const promiseResult of userResponses) {
      if (promiseResult.status === 'fulfilled') {
        const memberId = promiseResult.value.memberId;
        const userData = promiseResult.value.data;

        if (userData.error) {
            console.warn(`Error for member ${memberId}:`, userData.error.error);
            errors.push(`User ${memberId}: ${userData.error.error}`);
            continue;
        }

        console.log(`DEBUG (Post-Fetch): Processing member ${memberId}:`, JSON.stringify(userData, null, 2));
        console.log(`DEBUG (Post-Fetch): Member ${memberId} age:`, userData.age);
        console.log(`DEBUG (Post-Fetch): Member ${memberId} xantaken (from personalstats):`, userData.personalstats ? userData.personalstats.xantaken : 'N/A');
        console.log(`DEBUG (Post-Fetch): Member ${memberId} energydrinkused (from personalstats):`, userData.personalstats ? userData.personalstats.energydrinkused : 'N/A');

        const { name, level, age } = userData;
        const personalStats = userData.personalstats || {};

        const xanaxUsed = personalStats.xantaken || 0;
        const energyRefillsUsed = personalStats.energydrinkused || 0;

        const estimatedStats = estimateBattleStats(level, age, xanaxUsed, energyRefillsUsed);

        // --- CHANGE HERE: Use 'playerDatabase' collection ---
        await db.collection("playerDatabase").doc(String(memberId)).set({
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
        // --- END CHANGE ---

        processedMembers.push(name || memberId);

      } else {
        const errorMessage = promiseResult.reason?.message || 'Unknown promise rejection reason';
        console.error(`Promise rejected for a member: ${errorMessage}`);
        errors.push(`Unhandled promise rejection: ${errorMessage}`);
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
    console.error("Error in scanFaction Netlify Function (Outer Catch):", mainError);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error during faction scan: " + mainError.message }),
    };
  }
};