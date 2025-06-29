// Import Firebase Admin SDK
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.applicationDefault()
        });
    } catch (error) {
        console.error("Firebase Admin initialization error:", error.stack);
    }
}
const db = admin.firestore();

exports.handler = async (event, context) => {
    try {
        // --- Step 1: Fetch all user profiles from Firestore ---
        // We'll iterate through userProfiles to get each user's Torn ID and API Key.
        const userProfilesSnapshot = await db.collection('userProfiles').get();
        
        if (userProfilesSnapshot.empty) {
            console.log("[Scheduled Function] No user profiles found in Firestore to update.");
            return {
                statusCode: 200,
                body: JSON.stringify({ message: "No user profiles found." }),
            };
        }

        const usersToUpdate = [];
        userProfilesSnapshot.forEach(doc => {
            const userData = doc.data();
            // Ensure the user has both a Torn Profile ID and an API Key configured in their profile
            if (userData.tornProfileId && userData.tornApiKey) {
                usersToUpdate.push({
                    uid: doc.id, // This is the Firebase Auth UID
                    tornProfileId: userData.tornProfileId,
                    tornApiKey: userData.tornApiKey
                });
            }
        });

        if (usersToUpdate.length === 0) {
            console.log("[Scheduled Function] No users with configured Torn ID and API key found to update.");
            return {
                statusCode: 200,
                body: JSON.stringify({ message: "No relevant users found for update." }),
            };
        }

        console.log(`[Scheduled Function] Found ${usersToUpdate.length} users with valid configurations to update.`);

        const results = [];
        // Delay to help stay within Torn API rate limits (e.g., 100 calls/min = 600ms per call)
        // Adjust this if you notice rate limit errors or hit Netlify's function execution limits.
        const API_CALL_DELAY_MS = 650; 

        // --- Step 2: Loop through each user and fetch/save their data ---
        for (const user of usersToUpdate) {
            const selections = "profile,personalstats,battlestats,workstats,basic,cooldowns,bars";
            const apiUrl = `https://api.torn.com/user/${user.tornProfileId}?selections=${selections}&key=${user.tornApiKey}&comment=MyTornPA_ScheduledFetch_MultiUser`;

            try {
                // IMPORTANT: Introduce a delay before each API call to respect Torn's rate limits
                // This might make the function run for a longer time depending on your number of users.
                await new Promise(resolve => setTimeout(resolve, API_CALL_DELAY_MS));

                const response = await fetch(apiUrl);
                const data = await response.json();

                if (!response.ok || data.error) {
                    console.warn(`[Scheduled Function] Torn API Error for ${user.tornProfileId}: ${data.error?.error || response.statusText}`);
                    results.push({ id: user.tornProfileId, status: "failed", error: data.error?.error || response.statusText });
                    continue; // Skip to the next user if there's an API error for this one
                }

                // Prepare the data to be saved to Firestore (using the refined structure)
                const userDataToSave = {
                    name: data.name,
                    level: data.level,
                    faction_id: data.faction?.faction_id || null,
                    faction_name: data.faction?.faction_name || null,
                    nerve: data.nerve || {},
                    energy: data.energy || {},
                    happy: data.happy || {},
                    life: data.life || {},
                    traveling: data.status?.state === 'Traveling' || false,
                    hospitalized: data.status?.state === 'Hospital' || false,
                    cooldowns: {
                        drug: data.cooldowns?.drug || 0,
                        booster: data.cooldowns?.booster || 0,
                    },
                    personalstats: data.personalstats || {},
                    battlestats: {
                        strength: data.strength || data.battlestats?.strength || 0,
                        defense: data.defense || data.battlestats?.defense || 0,
                        speed: data.speed || data.battlestats?.speed || 0,
                        dexterity: data.dexterity || data.battlestats?.dexterity || 0,
                        total: data.total || data.battlestats?.total || 0,
                        strength_modifier: data.strength_modifier || data.battlestats?.strength_modifier || 0,
                        defense_modifier: data.defense_modifier || data.battlestats?.defense_modifier || 0,
                        speed_modifier: data.speed_modifier || data.battlestats?.speed_modifier || 0,
                        dexterity_modifier: data.dexterity_modifier || data.battlestats?.dexterity_modifier || 0,
                    },
                    workstats: {
                        manual_labor: data.manual_labor || data.workstats?.manual_labor || 0,
                        intelligence: data.intelligence || data.workstats?.intelligence || 0,
                        endurance: data.endurance || data.workstats?.endurance || 0,
                    },
                    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                };

                // Save to Firestore 'users' collection, using the user's Torn ID as the document ID
                // (Make sure your Firestore security rules allow this write from server-side).
                await db.collection('users').doc(String(user.tornProfileId)).set(userDataToSave, { merge: true });
                results.push({ id: user.tornProfileId, status: "success" });

            } catch (apiError) {
                console.error(`[Scheduled Function] Error processing user ${user.tornProfileId}:`, apiError);
                results.push({ id: user.tornProfileId, status: "failed", error: apiError.message });
            }
        }

        console.log(`[Scheduled Function] Completed processing for all users. Summary:`, results);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Scheduled data fetch completed for multiple users.", results: results }),
        };

    } catch (mainError) {
        console.error("[Scheduled Function] A top-level error occurred during multi-user fetch:", mainError);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "An unexpected error occurred in the scheduled function.", error: mainError.message }),
        };
    }
};