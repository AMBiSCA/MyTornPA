(function() {
    // --- This script is a "gatekeeper" for members-only pages ---

    // 1. Firebase Configuration (same as your other files)
    const firebaseConfig = {
        apiKey: "AIzaSyAI5QB7LbFyndbk_khADbKb33iqLSO4EOw",
        authDomain: "mytorn-d03ae.firebaseapp.com",
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

    // 3. The isFactionComped function with the corrected check
    async function isFactionComped(profile, db) {
        if (!profile || !profile.faction_id) {
            return false;
        }
        const usersRef = db.collection('userProfiles');
        const leaderQuery = usersRef
            .where('faction_id', '==', profile.faction_id)
            .where('position', '==', 'Leader')
            .limit(1);
        try {
            const leaderSnapshot = await leaderQuery.get();
            if (leaderSnapshot.empty) {
                return false;
            }
            const leaderProfile = leaderSnapshot.docs[0].data();
            const leaderHasMembership = leaderProfile.membershipEndTime && leaderProfile.membershipEndTime > Date.now();
            // --- THIS LINE IS CORRECTED ---
            const leaderHasFreeAccess = String(leaderProfile.hasFreeAccess) === 'true';
            return leaderHasMembership || leaderHasFreeAccess;
        } catch (error) {
            console.error("Auth Guard: Error during isFactionComped check:", error);
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
                window.location.href = '../pages/home.html';
                return;
            }
            const profile = doc.data();
            const hasPaidMembership = profile.membershipEndTime && profile.membershipEndTime > Date.now();
            // --- THIS LINE IS CORRECTED ---
            const hasPersonalComp = String(profile.hasFreeAccess) === 'true';
            const hasFactionComp = await isFactionComped(profile, db);
            const isMember = hasPaidMembership || hasPersonalComp || hasFactionComp;
            if (!isMember) {
                console.log("Auth Guard: User is not a member. Redirecting to home.");
                window.location.href = '../pages/home.html';
            } else {
                console.log("Auth Guard: Membership confirmed. Access granted.");
            }
        } catch (error) {
            console.error("Auth Guard: Error checking profile.", error);
            window.location.href = '../pages/home.html';
        }
    });

})();