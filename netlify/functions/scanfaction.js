// Ensure these dependencies are installed in your mysite/netlify/functions/ directory:
// npm install firebase-admin --prefix .
// npm install node-fetch@2 --prefix . (IMPORTANT: Use version 2 for CommonJS compatibility)

const admin = require("firebase-admin");
const fetch = require("node-fetch"); // This will now correctly load node-fetch@2

// Initialize Firebase Admin SDK (using environment variable for service account key)
// Make sure FIREBASE_SERVICE_ACCOUNT_KEY is set in your Netlify site settings.
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

if (!admin.apps.length) { // Prevents re-initializing if running locally or in dev server
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

// --- Your Estimated Battle Stats Formula (NOTE: This function is now UNUSED) ---
// This function was originally designed to estimate stats if fetching directly from api.torn.com.
// Since you are now fetching processed "spy" data from TornStats.com,
// this estimation is no longer needed as TornStats provides battle stats directly.
// You can remove this function entirely if you are only using TornStats.com for battle stats.
function estimateBattleStats(level, age, xanaxUsed, energyRefillsUsed) {
    // Robustness: Ensure inputs are numbers, default to 0 if not valid
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
// ---------------------------------------------------------------------------------

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  const { factionId } = JSON.parse(event.body);
  // Get the TornStats.com API key directly from Netlify Environment Variables
  // Make sure TORN_STATS_MASTER_API_KEY is set in your Netlify site settings.
  const TORN_STATS_API_KEY_FOR_BACKEND = process.env.TORN_STATS_MASTER_API_KEY;

  if (!factionId) {
    return { statusCode: 400, body: JSON.stringify({ error: "Faction ID is required." }) };
  }
  if (!TORN_STATS_API_KEY_FOR_BACKEND) {
    return { statusCode: 500, body: JSON.stringify({ error: "TornStats Master API Key not configured in Netlify environment variables (TORN_STATS_MASTER_API_KEY)." }) };
  }

  const processedMembers = [];
  const errors = [];
  let totalMembersInFaction = 0; // To store the total number of members found

  try {
    // 1. Fetch Faction Members from TornStats.com API
    const factionListUrl = `https://www.tornstats.com/api/v2/${TORN_STATS_API_KEY_FOR_BACKEND}/spy/faction/${factionId}`;
    const factionListData = await fetch(factionListUrl).then(res => res.json());

    if (!factionListData.status || !factionListData.faction || !factionListData.faction.members || Object.keys(factionListData.faction.members).length === 0) {
        const errorMessage = factionListData.message || "No members found or invalid Faction ID/TornStats API Key.";
        console.error("TornStats Faction API Error:", errorMessage);
        return { statusCode: 404, body: JSON.stringify({ error: `Error with faction data from TornStats: ${errorMessage}` }) };
    }

    const factionName = factionListData.faction.name || `Faction ${factionId}`;
    const members = factionListData.faction.members; // Members object directly from TornStats
    const memberIds = Object.keys(members);
    totalMembersInFaction = memberIds.length;

    // Define batching for TornStats API (it also has limits)
    const BATCH_SIZE = 5; // Process 5 members concurrently
    const DELAY_BETWEEN_BATCHES = 300; // milliseconds between batches

    // 2. Iterate through members and collect data from TornStats.com (spy/user endpoint)
    for (let i = 0; i < totalMembersInFaction; i += BATCH_SIZE) {
        const batchMemberIds = memberIds.slice(i, i + BATCH_SIZE);

        const batchPromises = batchMemberIds.map(async (memberId) => {
            // Small delay between individual member fetches within a batch to avoid bursting limits
            await new Promise(resolve => setTimeout(resolve, 100));
            const memberUrl = `https://www.tornstats.com/api/v2/${TORN_STATS_API_KEY_FOR_BACKEND}/spy/user/${memberId}`;
            try {
                const memberData = await fetch(memberUrl).then(res => res.json());
                return { status_internal: 'fulfilled', memberId: memberId, data: memberData };
            } catch (error) {
                return { status_internal: 'rejected', memberId: memberId, reason: error };
            }
        });

        const batchResults = await Promise.allSettled(batchPromises);

        for (const result of batchResults) {
            if (result.status === 'fulfilled' && result.value.status_internal === 'fulfilled') {
                const { memberId, data: memberData } = result.value;
                // Check if spy data from TornStats is actually good (status: true, total exists)
                if (memberData.spy && memberData.spy.status === true && memberData.spy.total !== undefined) {
                    const spy = memberData.spy; // This is the actual spy report from TornStats.com

                    // --- DEBUGGING LOGS (Leave for now, remove once confirmed working) ---
                    console.log(`DEBUG: Processed member ${memberId} (${spy.player_name}):`, JSON.stringify(spy, null, 2));
                    console.log(`DEBUG: Member ${memberId} age:`, spy.age);
                    console.log(`DEBUG: Member ${memberId} strength:`, spy.strength);
                    console.log(`DEBUG: Member ${memberId} totalStats:`, spy.total);
                    // --- END DEBUGGING LOGS ---

                    // 3. Save directly retrieved spy data to Firestore
                    await db.collection("userProfiles").doc(String(memberId)).set({
                      tornId: memberId,
                      name: spy.player_name || members[memberId]?.name || `User ${memberId}`,
                      level: spy.level || members[memberId]?.level,
                      age: spy.age, // TornStats spy data should provide age directly
                      strength: spy.strength,
                      defense: spy.defense,
                      speed: spy.speed,
                      dexterity: spy.dexterity,
                      totalStats: spy.total,
                      // xanaxUsed and energyRefillsUsed are typically NOT in TornStats spy data.
                      // If these are needed, you would need a separate fetch to api.torn.com's personalstats
                      // for each member, which doubles API calls and rate limit challenges.
                      // For now, they are omitted as spy data is the focus.
                      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
                    }, { merge: true, ignoreUndefinedProperties: true }); // Crucial for undefined values

                    processedMembers.push(spy.player_name || memberId);

                } else {
                    // Log specific error if TornStats spy data is not valid for this member
                    errors.push(`Member ${memberId}: No valid spy data from TornStats - ${memberData.spy?.message || memberData.message || "Unknown reason"}`);
                    console.warn(`WARN: Member ${memberId} returned no valid spy data:`, memberData);
                }
            } else { // Handle promises that were rejected (e.g., network error for TornStats API)
                const memberId = result.value?.memberId || (result.reason?.memberId || "Unknown ID");
                const errorReason = result.value?.reason || result.reason;
                errors.push(`Member ${memberId}: Fetch failed to TornStats - ${String(errorReason).substring(0, 50)}`);
                console.error(`ERROR: Failed to fetch from TornStats for member ${memberId}:`, errorReason);
            }
        }

        // Delay between batches if there are more batches to process
        if (i + BATCH_SIZE < totalMembersInFaction) {
            await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_BATCHES));
        }
    }

    // Final successful response
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Scan of faction ${factionName} complete.`,
        totalMembers: totalMembersInFaction, // Total members processed/attempted
        totalFetched: processedMembers.length, // Number of members successfully fetched and saved
        processed: processedMembers, // List of names/IDs successfully processed
        errors: errors.length > 0 ? errors : undefined // List of errors encountered
      }),
    };

  } catch (mainError) { // Catch for any errors outside the member loop (e.g., initial faction fetch failure)
    console.error("Error in scanfaction Netlify Function (Outer Catch):", mainError);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error during faction scan: " + mainError.message }),
    };
  }
};