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
            // If Firebase fails, block access by default
            window.location.href = '../index.html';
            return;
        }
    }

    const auth = firebase.auth();
    const db = firebase.firestore();

    // 3. The same isFactionComped function from home.js to check the leader's status
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
            const leaderHasFreeAccess = leaderProfile.hasFreeAccess === true;
            return leaderHasMembership || leaderHasFreeAccess;
        } catch (error) {
            console.error("Auth Guard: Error during isFactionComped check:", error);
            return false;
        }
    }

    // 4. Main Authentication Check
    auth.onAuthStateChanged(async (user) => {
        // If the user is NOT logged in, redirect them to the main index page.
        if (!user) {
            console.log("Auth Guard: No user logged in. Redirecting to index.");
            window.location.href = '../index.html';
            return;
        }

        // If the user IS logged in, check their membership status.
        try {
            const userProfileRef = db.collection('userProfiles').doc(user.uid);
            const doc = await userProfileRef.get();

            // If they don't have a profile document, send them home to create one.
            if (!doc.exists) {
                console.log("Auth Guard: User has no profile. Redirecting to home.");
                window.location.href = '../pages/home.html';
                return;
            }

            const profile = doc.data();

            // Perform the three membership checks
            const hasPaidMembership = profile.membershipEndTime && profile.membershipEndTime > Date.now();
            const hasPersonalComp = profile.hasFreeAccess === true;
            const hasFactionComp = await isFactionComped(profile, db);
            const isMember = hasPaidMembership || hasPersonalComp || hasFactionComp;

            // If they are not a member, send them back to the home page.
            if (!isMember) {
                console.log("Auth Guard: User is not a member. Redirecting to home.");
                window.location.href = '../pages/home.html';
            } else {
                // If they ARE a member, let the page load.
                console.log("Auth Guard: Membership confirmed. Access granted.");
            }

        } catch (error) {
            console.error("Auth Guard: Error checking profile.", error);
            // On error, redirect home as a safety measure.
            window.location.href = '../pages/home.html';
        }
    });

})();