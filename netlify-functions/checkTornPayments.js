// This is a Netlify Function that will run when triggered.
const admin = require("firebase-admin");
const fetch = require("node-fetch");

// --- CONFIGURATION ---
// Initialize Firebase Admin SDK
// This part is special: it decodes your Base64 credential and gets the project ID
const serviceAccountString = Buffer.from(process.env.FIREBASE_CREDENTIALS_BASE64, 'base64').toString('utf8');
const serviceAccount = JSON.parse(serviceAccountString);
const projectId = serviceAccount.project_id;

// Initialize the app if it's not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${projectId}.firebaseio.com`,
  });
}

const db = admin.firestore();

// Get the Torn API key from your Netlify settings
const MY_API_KEY = process.env.TORN_API_KEY; 
const TORN_API_URL = `https://api.torn.com/user/?selections=events&key=${MY_API_KEY}`;

const MEMBERSHIP_PLANS = {
    "15": { durationDays: 30, type: "solo" },
    "150": { durationDays: 365, type: "solo" },
    "40": { durationDays: 30, type: "faction" },
    "400": { durationDays: 365, type: "faction" },
};

// --- THE MAIN HANDLER ---
// This is the main body of the Netlify Function
exports.handler = async (event, context) => {
    // We can add a secret to the URL to prevent random people from running it
    // For now, let's keep it simple.

    console.log("Running scheduled payment check...");
    
    try {
        const response = await fetch(TORN_API_URL);
        const data = await response.json();

        if (data.error) {
            console.error("Torn API Error:", data.error.error);
            return { statusCode: 500, body: "Torn API Error" };
        }

        const events = data.events;
        for (const eventId in events) {
            const eventText = events[eventId].event;
            const paymentMatch = eventText.match(/You were sent (\d+)x Xanax from .*?XID=(\d+)/);

            if (paymentMatch) {
                const amount = paymentMatch[1];
                const senderTornId = paymentMatch[2];

                if (MEMBERSHIP_PLANS[amount] && (await isNewTransaction(eventId))) {
                    console.log(`Found new valid payment of ${amount} from Torn ID ${senderTornId}`);
                    await activateMembership(senderTornId, amount);
                    await logProcessedTransaction(eventId);
                }
            }
        }
        
        // Return a success message
        return {
            statusCode: 200,
            body: "Check completed successfully."
        };

    } catch (error) {
        console.error("An unhandled error occurred:", error);
        return { statusCode: 500, body: "Internal Server Error." };
    }
};


// --- DATABASE HELPER FUNCTIONS (These are exactly the same as before) ---
async function isNewTransaction(eventId) {
    const eventRef = db.collection("processedTornEvents").doc(String(eventId));
    const doc = await eventRef.get();
    return !doc.exists;
}

async function logProcessedTransaction(eventId) {
    const eventRef = db.collection("processedTornEvents").doc(String(eventId));
    await eventRef.set({ processedAt: new Date() });
}

async function activateMembership(senderTornId, amount) {
    const plan = MEMBERSHIP_PLANS[amount];
    
    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setDate(now.getDate() + plan.durationDays);
    const newMembershipEndTime = expiryDate.getTime();

    const usersRef = db.collection("userProfiles");

    if (plan.type === "solo") {
        const userQuery = usersRef.where("tornProfileId", "==", senderTornId).limit(1);
        const userSnapshot = await userQuery.get();
        if (userSnapshot.empty) {
            console.log(`No user found with tornProfileId: ${senderTornId}`);
            return;
        }
        const userDocRef = userSnapshot.docs[0].ref;
        await userDocRef.update({ membershipEndTime: newMembershipEndTime });

    } else if (plan.type === "faction") {
        const payingUserQuery = usersRef.where("tornProfileId", "==", senderTornId).limit(1);
        const payingUserSnapshot = await payingUserQuery.get();

        if (payingUserSnapshot.empty) {
            console.log(`Paying user not found with tornProfileId: ${senderTornId}`);
            return;
        }

        const factionId = payingUserSnapshot.docs[0].data().faction_id;
        if (!factionId) {
            console.log(`User ${senderTornId} does not have a faction_id.`);
            return;
        }

        const factionQuery = usersRef.where("faction_id", "==", factionId);
        const factionSnapshot = await factionQuery.get();

        const batch = db.batch();
        factionSnapshot.forEach((doc) => {
            batch.update(doc.ref, { membershipEndTime: newMembershipEndTime });
        });
        await batch.commit();
        console.log(`Activated membership for ${factionSnapshot.size} users in faction ${factionId}`);
    }
}