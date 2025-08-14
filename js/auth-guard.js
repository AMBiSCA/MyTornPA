(function() {
    // --- This script is a "gatekeeper" for members-only pages ---

    // 1. Firebase Configuration
    const firebaseConfig = {
        apiKey: "AIzaSyAI5QB7LbFyndbk_khADbKb33iqLSO4EOw",
        authDomain: "mytornpa.com",
        projectId: "mytorn-d03ae",
        storageBucket: "mytorn-d03ae.appspot.com",
        messagingSenderId: "205970466308",
        appId: "1:205970466308:web:b2f8ec5d1a38ef05213751"
    };

    // 2. Initialize Firebase
    if (!firebase.apps.length) {
        try {
            firebase.initializeApp(firebaseConfig);
        } catch (e) {
            console.error("Auth Guard: Error initializing Firebase.", e);
            window.location.href = '../index.html';
            return;
        }
    }

    const auth = firebase.auth();
    const db = firebase.firestore();

    // 3. The CORRECTED isFactionComped function for the Creator's Perk
    async function isFactionComped(profile, db) {
        // This function now ONLY checks if the user is in the site creator's faction.
        if (!profile || !profile.faction_id) {
            return false;
        }

        // Your specific Firebase User ID, which ties the perk to your account.
        const SITE_CREATOR_UID = "48CQkfJqz2YrXrHfmOO0y1zeci93";

        try {
            // Get the creator's profile from the database.
            const creatorDocRef = db.collection('userProfiles').doc(SITE_CREATOR_UID);
            const creatorDoc = await creatorDocRef.get();

            // Check if the creator's profile exists and has a faction ID.
            if (!creatorDoc.exists || !creatorDoc.data().faction_id) {
                console.error("Auth Guard: Creator's profile not found or has no faction_id.");
                return false;
            }

            const creatorFactionId = creatorDoc.data().faction_id;

            // Compare the current user's faction ID to the creator's faction ID.
            if (profile.faction_id === creatorFactionId) {
                console.log("Auth Guard: Access granted via Creator's Faction Perk.");
                return true; // Grant access if they match.
            }

            return false; // Not in the creator's faction.

        } catch (error) {
            console.error("Auth Guard: Error during Creator Perk check:", error);
            return false;
        }
    }

    // 4. Main Authentication Check
    auth.onAuthStateChanged(async (user) => {
        if (!user) {
            console.log("Auth Guard: No user logged in. Redirecting to index.");
            window.location.href = '../index.html';
            return;
        }
        try {
            const userProfileRef = db.collection('userProfiles').doc(user.uid);
            const doc = await userProfileRef.get();
            if (!doc.exists) {
                console.log("Auth Guard: User has no profile. Redirecting to home.");
                // --- This path should probably point to your actual home.html ---
                window.location.href = '../home.html'; 
                return;
            }

            const profile = doc.data();
            
            // These checks handle regular paid members and manually comped users.
            const hasPaidMembership = profile.membershipEndTime && profile.membershipEndTime > Date.now();
            const hasPersonalComp = String(profile.hasFreeAccess) === 'true';
            
            // This check now correctly looks for your special faction perk.
            const hasFactionComp = await isFactionComped(profile, db);
            
            const isMember = hasPaidMembership || hasPersonalComp || hasFactionComp;
            
            if (!isMember) {
                console.log("Auth Guard: User is not a member. Redirecting to home.");
                window.location.href = '../home.html';
            } else {
                console.log("Auth Guard: Membership confirmed. Access granted.");
                // If access is granted, we make the page visible.
                document.body.style.display = 'block';
            }
        } catch (error) {
            console.error("Auth Guard: Error checking profile.", error);
            window.location.href = '../home.html';
        }
    });

    // 5. Hide the body by default to prevent content flashing
    document.body.style.display = 'none';

})();