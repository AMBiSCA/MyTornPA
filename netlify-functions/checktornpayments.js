// This is a Netlify Function that will run when triggered.
const admin = require("firebase-admin");
const fetch = require("node-fetch");

// --- CONFIGURATION ---
const serviceAccountString = Buffer.from(process.env.FIREBASE_CREDENTIALS_BASE64, 'base64').toString('utf8');
const serviceAccount = JSON.parse(serviceAccountString);
const projectId = serviceAccount.project_id;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${projectId}.firebaseio.com`,
  });
}
const db = admin.firestore();

const MY_API_KEY = process.env.TORN_API_KEY; 
const TORN_API_URL = `https://api.torn.com/user/?selections=events&key=${MY_API_KEY}`;

const MEMBERSHIP_PLANS = {
    // --- UPDATED: Added a 'type' property to each plan ---
    "15": { durationDays: 30, type: "solo_monthly" },
    "150": { durationDays: 365, type: "solo_yearly" },
    "40": { durationDays: 30, type: "faction_monthly" },
    "400": { durationDays: 365, type: "faction_yearly" },
};

// --- THE MAIN HANDLER ---
exports.handler = async (event, context) => {
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
        
        return { statusCode: 200, body: "Check completed successfully." };

    } catch (error) {
        console.error("An unhandled error occurred:", error);
        return { statusCode: 500, body: "Internal Server Error." };
    }
};


// --- DATABASE HELPER FUNCTIONS ---
async function isNewTransaction(eventId) {
    const eventRef = db.collection("processedTornEvents").doc(String(eventId));
    const doc = await eventRef.get();
    return !doc.exists;
}

async function logProcessedTransaction(eventId) {
    const eventRef = db.collection("processedTornEvents").doc(String(eventId));
    await eventRef.set({ processedAt: new Date() });
}

// --- THIS FUNCTION IS THE ONE WITH THE FIX ---
async function activateMembership(senderTornId, amount) {
    const plan = MEMBERSHIP_PLANS[amount];
    
    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setDate(now.getDate() + plan.durationDays);
    const newMembershipEndTime = expiryDate.getTime();
    
    // This is the data we will save to the database
    const updateData = {
        membershipEndTime: newMembershipEndTime,
        membershipType: plan.type // <-- THIS IS THE NEW, IMPORTANT LINE
    };

    const usersRef = db.collection("userProfiles");

    if (plan.type.startsWith("solo")) { // Check if it's a solo plan
        const userQuery = usersRef.where("tornProfileId", "==", senderTornId).limit(1);
        const userSnapshot = await userQuery.get();
        if (userSnapshot.empty) {
            console.log(`No user found with tornProfileId: ${senderTornId}`);
            return;
        }
        const userDocRef = userSnapshot.docs[0].ref;
        await userDocRef.update(updateData); // Update with both fields

    } else if (plan.type.startsWith("faction")) { // Check if it's a faction plan
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
            batch.update(doc.ref, updateData); // Update with both fields
        });
        await batch.commit();
        console.log(`Activated membership for ${factionSnapshot.size} users in faction ${factionId}`);
    }
}