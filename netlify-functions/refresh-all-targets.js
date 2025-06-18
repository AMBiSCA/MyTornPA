const fetch = require('node-fetch');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK using environment variables
try {
  if (!admin.apps.length) {
    const serviceAccountJson = Buffer.from(process.env.FIREBASE_CREDENTIALS_BASE64, 'base64').toString('utf8');
    const serviceAccount = JSON.parse(serviceAccountJson);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
} catch (e) {
  console.error('Firebase Admin initialization error:', e);
}

const db = admin.firestore();

// Helper function to get FF data for a single faction
async function getFreshFactionData(factionId, apiKey) {
  // This logic is copied from your other function, but simplified
  const tornFactionApiUrl = `https://api.torn.com/faction/${factionId}?selections=basic&key=${apiKey}`;
  const tornFactionResponse = await fetch(tornFactionApiUrl);
  if (!tornFactionResponse.ok) throw new Error(`Torn API error for faction ${factionId}`);
  const tornFactionData = await tornFactionResponse.json();
  if (tornFactionData.error) throw new Error(`Torn API error: ${tornFactionData.error.error}`);

  const memberIds = Object.keys(tornFactionData.members);
  if (memberIds.length === 0) {
    return { faction_name: tornFactionData.name, members: [] };
  }

  const ffScouterTargetsUrl = `https://ffscouter.com/api/v1/get-stats?key=${apiKey}&targets=${memberIds.join(',')}`;
  const ffScouterMembersResponse = await fetch(ffScouterTargetsUrl);
  if (!ffScouterMembersResponse.ok) throw new Error(`FFScouter API error for faction ${factionId}`);
  const ffScouterMembersData = await ffScouterMembersResponse.json();

  const membersWithFF = memberIds.map(memberId => {
    const memberBasic = tornFactionData.members[memberId];
    const ffData = ffScouterMembersData.find(ff => ff && ff.player_id == memberId);
    return {
      id: memberId,
      name: memberBasic.name,
      ff_data: ffData || null
    };
  });

  return { faction_name: tornFactionData.name, members: membersWithFF };
}

// Main handler for the function
exports.handler = async function(event, context) {
  console.log("--- Refresh All Targets Function Triggered ---");

  const apiKey = process.env.ADMIN_TORN_API_KEY;
  if (!apiKey) {
    console.error("ADMIN_TORN_API_KEY environment variable not set.");
    return { statusCode: 500, body: "Server configuration error: Missing API Key" };
  }

  try {
    // 1. Get all unique faction IDs from the database
    const snapshot = await db.collection('factionTargets').get();
    const factionIdsToRefresh = new Set();
    snapshot.forEach(doc => {
      factionIdsToRefresh.add(doc.data().factionID);
    });

    if (factionIdsToRefresh.size === 0) {
      console.log("No factions found in database to refresh.");
      return { statusCode: 200, body: "No factions to refresh." };
    }

    console.log(`Found ${factionIdsToRefresh.size} factions to refresh. Starting process...`);

    // 2. Loop through each faction and update it
    for (const factionId of factionIdsToRefresh) {
      // Check if we're running out of time before processing the next faction
      if (context.getRemainingTimeInMillis() < 3000) { // 3 seconds buffer
          console.log("Approaching timeout, stopping early. Will continue on next run.");
          break;
      }

      console.log(`Refreshing Faction ID: ${factionId}`);
      const freshData = await getFreshFactionData(factionId, apiKey);
      
      const batch = db.batch();
      let successfulSaves = 0;

      for (const member of freshData.members) {
        if (member.ff_data && member.ff_data.fair_fight) {
          const targetRef = db.collection('factionTargets').doc(member.id.toString());
          const dataToSave = {
            playerID: parseInt(member.id),
            playerName: member.name,
            factionID: parseInt(factionId),
            factionName: freshData.faction_name,
            fairFightScore: member.ff_data.fair_fight,
            estimatedBattleStats: member.ff_data.bs_estimate_human || "N/A",
            difficulty: get_difficulty_text(member.ff_data.fair_fight),
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
          };
          batch.set(targetRef, dataToSave, { merge: true });
          successfulSaves++;
        }
      }
      await batch.commit();
      console.log(`Saved ${successfulSaves} targets for faction ${factionId}.`);
    }

    console.log("--- Refresh Process Finished ---");
    return { statusCode: 200, body: `Refresh process completed.` };

  } catch (error) {
    console.error("Error during refresh process:", error);
    return { statusCode: 500, body: `Error: ${error.message}` };
  }
};

// Helper function for difficulty text
function get_difficulty_text(ff) {
    if (ff <= 1) return "Extremely easy";
    else if (ff <= 2) return "Easy";
    else if (ff <= 3.5) return "Moderately difficult";
    else if (ff <= 4.5) return "Difficult";
    else return "May be impossible";
}