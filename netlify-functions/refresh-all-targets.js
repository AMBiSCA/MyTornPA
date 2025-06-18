console.log("LOG: Script execution started.");

const fetch = require('node-fetch');
console.log("LOG: node-fetch package loaded successfully.");

const admin = require('firebase-admin');
console.log("LOG: firebase-admin package loaded successfully.");

try {
    console.log("LOG: Entering Firebase initialization block.");
    if (!admin.apps.length) {
        console.log("LOG: Firebase app has not been initialized yet.");
        if (!process.env.FIREBASE_CREDENTIALS_BASE64) {
            throw new Error("FATAL: FIREBASE_CREDENTIALS_BASE64 environment variable is missing or empty.");
        }
        console.log("LOG: FIREBASE_CREDENTIALS_BASE64 environment variable found.");

        const serviceAccountJson = Buffer.from(process.env.FIREBASE_CREDENTIALS_BASE64, 'base64').toString('utf8');
        console.log("LOG: Base64 credential decoded.");

        const serviceAccount = JSON.parse(serviceAccountJson);
        console.log("LOG: Service account JSON parsed successfully.");

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("LOG: Firebase Admin SDK initialized successfully.");
    } else {
        console.log("LOG: Firebase app was already initialized.");
    }
} catch (e) {
    console.error('CRITICAL INITIALIZATION ERROR:', e);
    // This ensures the function stops completely if initialization fails.
    return {
        statusCode: 500,
        body: `CRITICAL INITIALIZATION ERROR: ${e.message}`
    };
}

const db = admin.firestore();
console.log("LOG: Firestore database instance created.");

// Helper function to get FF data for a single faction
async function getFreshFactionData(factionId, apiKey) {
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
        return { id: memberId, name: memberBasic.name, ff_data: ffData || null };
    });

    return { faction_name: tornFactionData.name, members: membersWithFF };
}

exports.handler = async function(event, context) {
    console.log("--- Refresh All Targets Handler Triggered ---");

    const apiKey = process.env.ADMIN_TORN_API_KEY;
    if (!apiKey) {
        console.error("ADMIN_TORN_API_KEY environment variable not set.");
        return { statusCode: 500, body: "Server configuration error: Missing API Key" };
    }

    try {
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

        for (const factionId of factionIdsToRefresh) {
            if (context.getRemainingTimeInMillis() < 4000) { // 4 seconds buffer
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
            if (successfulSaves > 0) {
                await batch.commit();
            }
            console.log(`Saved ${successfulSaves} targets for faction ${factionId}.`);
        }

        console.log("--- Refresh Process Finished ---");
        return { statusCode: 200, body: `Refresh process completed successfully.` };

    } catch (error) {
        console.error("Error during refresh process:", error);
        return { statusCode: 500, body: `Error: ${error.message}` };
    }
};

function get_difficulty_text(ff) {
    if (ff <= 1) return "Extremely easy";
    else if (ff <= 2) return "Easy";
    else if (ff <= 3.5) return "Moderately difficult";
    else if (ff <= 4.5) return "Difficult";
    else return "May be impossible";
}