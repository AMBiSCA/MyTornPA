// Import Firebase Admin SDK
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
    try {
        const serviceAccountBase64 = process.env.FIREBASE_CREDENTIALS_BASE64;
        if (!serviceAccountBase64) {
            throw new Error("FIREBASE_CREDENTIALS_BASE64 environment variable is missing.");
        }
        const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('utf8'));

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (error) {
        console.error("Firebase Admin initialization error:", error.stack);
        exports.handler = async (event, context) => { // This redefines handler to always return an error
            return {
                statusCode: 500,
                body: JSON.stringify({ message: "Firebase Admin initialization failed. Check FIREBASE_CREDENTIALS_BASE64 env var.", error: error.message }),
            };
        };
        throw new Error("Firebase initialization failed during cold start.");
    }
}
const db = admin.firestore();

// Define how often a user's data should be considered "stale" and updated
const UPDATE_THRESHOLD_SECONDS = 60 * 60; // 1 hour (adjust as needed for API limits and data freshness needs)

exports.handler = async (event, context) => {
    try {
        const WORKER_FUNCTION_SECRET = process.env.WORKER_FUNCTION_SECRET;
        const DISPATCHER_TORN_API_KEY = process.env.TORN_API_KEY; // The API key used by this dispatcher
        // --- NEW ENVIRONMENT VARIABLE ---
        const TORN_FACTION_ID_TO_TRACK = process.env.TORN_FACTION_ID_TO_TRACK; // The ID of the faction whose members to track

        if (!WORKER_FUNCTION_SECRET || !DISPATCHER_TORN_API_KEY || !TORN_FACTION_ID_TO_TRACK) {
            console.error("[Dispatcher] Configuration error: Missing WORKER_FUNCTION_SECRET, TORN_API_KEY, or TORN_FACTION_ID_TO_TRACK environment variables. Please ensure all are set in Netlify.");
            return {
                statusCode: 500,
                body: JSON.stringify({ message: "Configuration error: Missing required environment variables. See Netlify logs for details." }),
            };
        }

        console.log("[Dispatcher] Starting scheduled data dispatch for faction:", TORN_FACTION_ID_TO_TRACK);

        // --- Step 1: Fetch ALL Faction Members using the Dispatcher's API key (public data) ---
        // This gives us the complete list of members in the faction.
        const factionMembersApiUrl = `https://api.torn.com/faction/${TORN_FACTION_ID_TO_TRACK}?selections=members&key=${DISPATCHER_TORN_API_KEY}&comment=MyTornPA_DispatcherFetchAllFactionMembers`;
        console.log(`[Dispatcher] Fetching all faction members from Torn API for faction ${TORN_FACTION_ID_TO_TRACK}`);
        
        const factionResponse = await fetch(factionMembersApiUrl);
        const factionData = await factionResponse.json();

        if (!factionResponse.ok || factionData.error) {
            const errorMessage = factionData.error ? factionData.error.error : `HTTP error! status: ${factionResponse.status} ${factionResponse.statusText}`;
            console.error("[Dispatcher] Error fetching all faction members from Torn API:", errorMessage);
            return { statusCode: 500, body: JSON.stringify({ message: `Error fetching faction members from Torn: ${errorMessage}` }) };
        }

        if (!factionData.members || Object.keys(factionData.members).length === 0) {
            console.log("[Dispatcher] No members found in the specified faction on Torn API. This might be an invalid Faction ID or empty faction.");
            return { statusCode: 200, body: JSON.stringify({ message: "No faction members found to process." }) };
        }
        // Convert the members object into an array for easier iteration
        const allFactionMembersFromApi = Object.values(factionData.members); 

        // --- Step 2: Fetch all user profiles from Firestore (to get their private API keys) ---
        // This creates a map to quickly look up a website user's private API key if they've linked it.
        const userProfilesSnapshot = await db.collection('userProfiles').get();
        const websiteUsersMap = new Map(); // Map Torn Player ID to their private API Key
        userProfilesSnapshot.forEach(doc => {
            const userData = doc.data();
            if (userData.tornProfileId && userData.tornApiKey) {
                websiteUsersMap.set(String(userData.tornProfileId), userData.tornApiKey);
            }
        });
        console.log(`[Dispatcher] Found ${websiteUsersMap.size} users with linked API keys on this website.`);

        // --- Step 3: Prepare combined list of users for dispatch, deciding API key and scope ---
        const usersToDispatch = [];
        const nowInSeconds = Math.floor(Date.now() / 1000);

        for (const member of allFactionMembersFromApi) {
            const memberTornId = String(member.id); // Ensure ID is a string for map lookup and document ID
            // We use the member's ID to check their existing document in the 'users' collection for 'lastUpdated'
            const lastUpdatedDoc = await db.collection('users').doc(memberTornId).get(); 

            // If the document doesn't exist, lastUpdatedTimestamp is 0, so needsUpdate will be true.
            const lastUpdatedTimestamp = lastUpdatedDoc.exists ? (lastUpdatedDoc.data().lastUpdated?.seconds || 0) : 0;
            const needsUpdate = (nowInSeconds - lastUpdatedTimestamp > UPDATE_THRESHOLD_SECONDS);

            if (needsUpdate) {
                const privateApiKey = websiteUsersMap.get(memberTornId);

                if (privateApiKey) {
                    // This faction member has logged into our website and provided their API key.
                    // We dispatch a task to fetch their full private data using their own key.
                    usersToDispatch.push({
                        tornProfileId: memberTornId,
                        tornApiKey: privateApiKey, // Use their private API key
                        isPrivateData: true // Flag for the worker to fetch comprehensive data
                    });
                } else {
                    // This faction member has NOT logged into our website (or hasn't linked an API key).
                    // We dispatch a task to fetch their public data using the dispatcher's API key.
                    usersToDispatch.push({
                        tornProfileId: memberTornId,
                        tornApiKey: DISPATCHER_TORN_API_KEY, // Use the dispatcher's (your) API key
                        isPrivateData: false // Flag for the worker to fetch only public data
                    });
                }
            }
        }

        if (usersToDispatch.length === 0) {
            console.log("[Dispatcher] No faction members require an update at this time based on threshold or no members found.");
            return { statusCode: 200, body: JSON.stringify({ message: "No faction members require updates." }) };
        }

        console.log(`[Dispatcher] Found ${usersToDispatch.length} faction members to dispatch for update.`);

        const dispatchResults = [];
        // Add a small delay between dispatching worker functions to prevent overwhelming Netlify's invocation limits.
        const DISPATCH_DELAY_MS = 100; 

        // --- Step 4: Dispatch a worker function for each user in the prepared list ---
        for (const user of usersToDispatch) {
            // Construct the URL for the 'process-single-user-data' worker function.
            const workerFunctionUrl = `${process.env.URL}/.netlify/functions/process-single-user-data`; 

            try {
                // Trigger the worker function via HTTP POST with the user's details and data scope
                const dispatchResponse = await fetch(workerFunctionUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Worker-Secret': WORKER_FUNCTION_SECRET // Security secret for the worker
                    },
                    body: JSON.stringify({
                        tornProfileId: user.tornProfileId,
                        tornApiKey: user.tornApiKey,
                        isPrivateData: user.isPrivateData // Pass the crucial flag to the worker
                    })
                });

                const dispatchData = await dispatchResponse.json();

                if (!dispatchResponse.ok) {
                    console.warn(`[Dispatcher] Failed to dispatch for ${user.tornProfileId} (Private Data: ${user.isPrivateData}): ${dispatchData.message || dispatchResponse.statusText}`);
                    dispatchResults.push({ id: user.tornProfileId, status: "dispatch_failed", isPrivateData: user.isPrivateData, error: dispatchData.message || dispatchResponse.statusText });
                } else {
                    console.log(`[Dispatcher] Successfully dispatched for ${user.tornProfileId} (Private Data: ${user.isPrivateData}): ${dispatchData.message}`);
                    dispatchResults.push({ id: user.tornProfileId, status: "dispatched", isPrivateData: user.isPrivateData, message: dispatchData.message });
                }

            } catch (dispatchError) {
                console.error(`[Dispatcher] Network/unexpected error dispatching for ${user.tornProfileId} (Private Data: ${user.isPrivateData}):`, dispatchError);
                dispatchResults.push({ id: user.tornProfileId, status: "dispatch_failed", isPrivateData: user.isPrivateData, error: dispatchError.message });
            }
            await new Promise(resolve => setTimeout(resolve, DISPATCH_DELAY_MS)); // Delay between dispatches
        }

        console.log("[Dispatcher] Data dispatching complete. Summary:", dispatchResults);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Scheduled data dispatch process initiated for faction members.", results: dispatchResults }),
        };

    } catch (mainError) {
        console.error("[Dispatcher] Top-level error in scheduled dispatch function:", mainError);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "An unexpected error occurred in the dispatcher function.", error: mainError.message }),
        };
    }
};