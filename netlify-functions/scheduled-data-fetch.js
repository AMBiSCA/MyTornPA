// Import Firebase Admin SDK
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK if not already initialized
// This needs to be outside the handler for better performance (warm starts)
if (!admin.apps.length) {
    try {
        // Decode the base64 credentials from Netlify environment variable
        // This is how Firebase Admin SDK is typically initialized with Netlify for security
        const serviceAccountBase64 = process.env.FIREBASE_CREDENTIALS_BASE64;
        if (!serviceAccountBase64) {
            throw new Error("FIREBASE_CREDENTIALS_BASE64 environment variable is missing.");
        }
        // Ensure Buffer is available in Node.js environment
        const serviceAccount = JSON.parse(Buffer.from(serviceAccountBase64, 'base64').toString('utf8'));

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (error) {
        console.error("Firebase Admin initialization error:", error.stack);
        // If initialization fails, terminate the function with an error response
        exports.handler = async (event, context) => { // This redefines handler to always return an error
            return {
                statusCode: 500,
                body: JSON.stringify({ message: "Firebase Admin initialization failed. Check FIREBASE_CREDENTIALS_BASE64 env var.", error: error.message }),
            };
        };
        // Re-throw to prevent further execution of the outer handler if init failed on cold start
        throw new Error("Firebase initialization failed during cold start.");
    }
}
const db = admin.firestore();

// Define how often a user's data should be considered "stale" and updated
const UPDATE_THRESHOLD_SECONDS = 55; // 55 seconds

exports.handler = async (event, context) => {
    try {
        // Retrieve the secret for calling the worker function
        const WORKER_FUNCTION_SECRET = process.env.WORKER_FUNCTION_SECRET; // YOU MUST SET THIS IN NETLIFY ENV VARS

        if (!WORKER_FUNCTION_SECRET) {
            console.error("[Dispatcher] Configuration error: Missing WORKER_FUNCTION_SECRET environment variable.");
            return {
                statusCode: 500,
                body: JSON.stringify({ message: "Configuration error: Missing worker function secret." }),
            };
        }

        console.log("[Dispatcher] Starting scheduled data dispatch.");

        // Query Firestore for all user profiles
        const userProfilesSnapshot = await db.collection('userProfiles').get();

        if (userProfilesSnapshot.empty) {
            console.log("[Dispatcher] No user profiles found in Firestore.");
            return {
                statusCode: 200,
                body: JSON.stringify({ message: "No user profiles found to dispatch updates for." }),
            };
        }

        const usersToDispatch = [];
        const nowInSeconds = Math.floor(Date.now() / 1000); // Current time for comparison

        userProfilesSnapshot.forEach(doc => {
            const userData = doc.data();
            const lastUpdatedTimestamp = userData.lastUpdated?.seconds || 0; // Get timestamp from Firestore Timestamp or default to 0

            // Check if user has necessary Torn details and if their data is stale
            if (userData.tornProfileId && userData.tornApiKey && 
                (nowInSeconds - lastUpdatedTimestamp > UPDATE_THRESHOLD_SECONDS)) {
                usersToDispatch.push({
                    tornProfileId: userData.tornProfileId,
                    tornApiKey: userData.tornApiKey
                });
            }
        });

        if (usersToDispatch.length === 0) {
            console.log("[Dispatcher] No users require an update at this time.");
            return {
                statusCode: 200,
                body: JSON.stringify({ message: "No users require updates based on threshold." }),
            };
        }

        console.log(`[Dispatcher] Found ${usersToDispatch.length} users to dispatch for update.`);

        const dispatchResults = [];
        // Add a small delay between dispatching worker functions to prevent overwhelming the server
        // or hitting burst limits on function invocations if you have many users.
        const DISPATCH_DELAY_MS = 100; // Small delay, can be adjusted

        // --- Dispatch a worker function for each user ---
        for (const user of usersToDispatch) {
            // Construct the URL for the new worker function.
            // Netlify functions are accessible via /.netlify/functions/YOUR_FUNCTION_NAME
            // process.env.URL is provided by Netlify and is your site's base URL
            const workerFunctionUrl = `${process.env.URL}/.netlify/functions/process-single-user-data`; 

            try {
                // Trigger the worker function via HTTP POST
                const dispatchResponse = await fetch(workerFunctionUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Worker-Secret': WORKER_FUNCTION_SECRET // Pass the secret for authentication
                    },
                    body: JSON.stringify({
                        tornProfileId: user.tornProfileId,
                        tornApiKey: user.tornApiKey
                    })
                });

                const dispatchData = await dispatchResponse.json();

                if (!dispatchResponse.ok) {
                    console.warn(`[Dispatcher] Failed to dispatch for ${user.tornProfileId}: ${dispatchData.message || dispatchResponse.statusText}`);
                    dispatchResults.push({ id: user.tornProfileId, status: "dispatch_failed", error: dispatchData.message || dispatchResponse.statusText });
                } else {
                    console.log(`[Dispatcher] Successfully dispatched for ${user.tornProfileId}: ${dispatchData.message}`);
                    dispatchResults.push({ id: user.tornProfileId, status: "dispatched", message: dispatchData.message });
                }

            } catch (dispatchError) {
                console.error(`[Dispatcher] Network/unexpected error dispatching for ${user.tornProfileId}:`, dispatchError);
                dispatchResults.push({ id: user.tornProfileId, status: "dispatch_failed", error: dispatchError.message });
            }

            // Await a small delay before dispatching the next worker
            await new Promise(resolve => setTimeout(resolve, DISPATCH_DELAY_MS));
        }

        console.log("[Dispatcher] Data dispatching complete. Summary:", dispatchResults);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: "Scheduled data dispatch process initiated.", results: dispatchResults }),
        };

    } catch (mainError) {
        console.error("[Dispatcher] Top-level error in scheduled dispatch function:", mainError);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "An unexpected error occurred in the dispatcher function.", error: mainError.message }),
        };
    }
};