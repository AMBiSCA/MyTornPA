// --- NEW FUNCTION: To allow a Faction Leader to advertise their faction ---
async function advertiseFaction() {
    console.log("Attempting to advertise faction.");
    if (!auth.currentUser) {
        alert("You must be logged in to advertise your faction.");
        return;
    }
    // Check if the current user is a leader (this flag is set in auth.onAuthStateChanged)
    if (!currentUserIsLeader) { // This flag is already set by checking userData.position from Firebase
        alert("Only designated faction leaders can advertise factions.");
        return;
    }
    if (!currentUserTornApiKey) {
        alert("Your Torn API key is required to advertise your faction. Please register it in your profile.");
        return;
    }

    try {
        // --- CRITICAL CORRECTION: Fetch user's faction ID directly from Firebase userProfile ---
        const userProfileDoc = await db.collection('userProfiles').doc(auth.currentUser.uid).get();
        const userTornFactionId = userProfileDoc.data()?.tornFactionId; // Access the tornFactionId from the Firebase document

        if (!userTornFactionId) {
            alert("Your Torn Faction ID is not registered in your profile. Please add it to your profile to advertise your faction.");
            return;
        }

        // Fetch current user's faction data using their API key and the Faction ID from Firebase
        const selections = 'basic,members'; // Basic info + member count
        const apiUrl = `https://api.torn.com/v2/faction/${userTornFactionId}?selections=${selections}&key=${currentUserTornApiKey}&comment=MyTornPA_RecruitAdvertiseFaction`;

        console.log(`Fetching faction data for advertisement: ${apiUrl}`);
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Torn API HTTP error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        if (data.error) {
            if (data.error.code === 2) throw new Error(`Torn API: Invalid API Key. Please check your key permissions.`);
            if (data.error.code === 10) throw new Error(`Torn API: Insufficient API Key Permissions. Ensure 'Basic' and 'Members' are enabled for your faction API key.`);
            throw new Error(`Torn API error: ${data.error.error}`);
        }

        const factionName = data.basic ? data.basic.name : 'Unknown Faction';
        const totalMembers = data.members ? data.members.total : 'N/A';

        const contactInfo = prompt(`Please provide contact info for ${factionName} (e.g., Discord Tag, Torn Mail ID for recruiters):`);
        if (!contactInfo || contactInfo.trim() === '') {
            alert("Faction advertisement cancelled. Contact info is required.");
            return;
        }

        const factionListingData = {
            factionId: String(userTornFactionId), // Use the faction ID obtained from Firebase
            factionName: factionName,
            totalMembers: totalMembers,
            contactInfo: contactInfo.trim(),
            listingTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
            firebaseUid: auth.currentUser.uid, // Link to leader's Firebase UID
            isActive: true // Faction can manage this later
        };

        // Save to Firestore in 'recruitingFactions' collection
        const docRef = db.collection('recruitingFactions').doc(String(userTornFactionId));
        await docRef.set(factionListingData, { merge: true });

        alert(`Successfully advertised ${factionName} for recruitment!`);
        console.log("Faction advertisement data saved:", factionListingData);
        displayFactionsSeekingMembers(); // Refresh the list after advertising

    } catch (error) {
        console.error("Error during faction advertisement:", error);
        alert(`Failed to advertise faction: ${error.message}`);
    }
}