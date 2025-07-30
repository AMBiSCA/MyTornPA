/**
 * Final Version - Using process.env for secrets
 */
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const fetch = require("node-fetch");
const { logger } = require("firebase-functions");

admin.initializeApp();
const db = admin.firestore();

// --- CONFIGURATION ---
// This now reads the key from your new .env.mytorn-d03ae file
const MY_API_KEY = process.env.TORN_API_KEY; 
const TORN_API_URL = `https://api.torn.com/user/?selections=events&key=${MY_API_KEY}`;

const MEMBERSHIP_PLANS = {
    "15": { durationDays: 30, type: "solo" },
    "150": { durationDays: 365, type: "solo" },
    "40": { durationDays: 30, type: "faction" },
    "400": { durationDays: 365, type: "faction" },
};

// --- THE CLOUD FUNCTION ---
exports.checkTornPayments = onSchedule({
    schedule: "every 2 minutes",
    region: "europe-west1",
}, async (event) => {
    if (!MY_API_KEY) {
        logger.error("Torn API key is not configured in the .env file!");
        return;
    }
    
    logger.log("Running scheduled payment check...");
    
    try {
        const response = await fetch(TORN_API_URL);
        const data = await response.json();

        if (data.error) {
            logger.error("Torn API Error:", data.error.error);
            return;
        }

        const events = data.events;
        for (const eventId in events) {
            const eventText = events[eventId].event;
            const paymentMatch = eventText.match(/You were sent (\d+)x Xanax from .* \[(\d+)]/);

            if (paymentMatch) {
                const amount = paymentMatch[1];
                const senderTornId = paymentMatch[2];

                if (MEMBERSHIP_PLANS[amount] && (await isNewTransaction(eventId))) {
                    logger.log(`Found new valid payment of ${amount} from Torn ID ${senderTornId}`);
                    await activateMembership(senderTornId, amount);
                    await logProcessedTransaction(eventId);
                    logger.log(`Successfully processed event ${eventId}`);
                }
            }
        }
    } catch (error) {
        logger.error("An unhandled error occurred:", error);
    }
});


// --- DATABASE HELPER FUNCTIONS (No changes needed here) ---
async function isNewTransaction(eventId) {
    const eventRef = db.collection("processedTornEvents").doc(String(eventId));
    const doc = await eventRef.get();
    return !doc.exists;
}

async function logProcessedTransaction(eventId) {
    const eventRef = db.collection("processedTornEvents").doc(String(eventId));
    await eventRef.set({ processedAt: admin.firestore.FieldValue.serverTimestamp() });
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
            logger.log(`No user found with tornProfileId: ${senderTornId}`);
            return;
        }
        const userDocRef = userSnapshot.docs[0].ref;
        await userDocRef.update({ membershipEndTime: newMembershipEndTime });

    } else if (plan.type === "faction") {
        const payingUserQuery = usersRef.where("tornProfileId", "==", senderTornId).limit(1);
        const payingUserSnapshot = await payingUserQuery.get();

        if (payingUserSnapshot.empty) {
            logger.log(`Paying user not found with tornProfileId: ${senderTornId}`);
            return;
        }

        const factionId = payingUserSnapshot.docs[0].data().faction_id;
        if (!factionId) {
            logger.log(`User ${senderTornId} does not have a faction_id.`);
            return;
        }

        const factionQuery = usersRef.where("faction_id", "==", factionId);
        const factionSnapshot = await factionQuery.get();

        const batch = db.batch();
        factionSnapshot.forEach((doc) => {
            batch.update(doc.ref, { membershipEndTime: newMembershipEndTime });
        });
        await batch.commit();
        logger.log(`Activated membership for ${factionSnapshot.size} users in faction ${factionId}`);
    }
}