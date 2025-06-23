// --- Firebase and Global Variable Setup ---
const db = firebase.firestore();
const auth = firebase.auth();

let currentUserTornId = null; 
let currentUserTornApiKey = null; 
let currentUserData = null; // To store the currently logged-in user's fetched Torn data
let currentUserIsLeader = false; // Flag to check if current user is a leader

// DOM Elements for this page (from recruitment.html)
const factionsSeekingMembersTbody = document.getElementById('factions-seeking-members-tbody');
const playersSeekingFactionsTbody = document.getElementById('players-seeking-factions-tbody');
const listSelfButton = document.getElementById('list-self-button');
const advertiseFactionButton = document.getElementById('advertise-faction-button');


// --- Utility Functions (Copied from your war_page_hub.js for self-containment) ---

function formatTime(seconds) {
    if (seconds <= 0) return '0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    let result = '';
    if (h > 0) result += `${h}h `;
    if (m > 0) result += `${m}m `;
    if (s > 0) result += `${s}s`;
    return result.trim();
}

function formatRelativeTime(timestampInSeconds) {
    if (!timestampInSeconds || timestampInSeconds === 0) {
        return "N/A";
    }
    const now = Math.floor(Date.now() / 1000);
    const diffSeconds = now - timestampInSeconds;
    if (diffSeconds < 60) {
        return "Now";
    } else if (diffSeconds < 3600) {
        const minutes = Math.floor(diffSeconds / 60);
        return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
    } else if (diffSeconds < 86400) {
        const hours = Math.floor(diffSeconds / 3600);
        return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    } else {
        const days = Math.floor(diffSeconds / 86400);
        return `${days} day${days === 1 ? '' : 's'} ago`;
    }
}


// --- Core Functions for this page ---

// Function to display factions looking for members (NOW FETCHES FROM FIRESTORE)
async function displayFactionsSeekingMembers() {
    if (!factionsSeekingMembersTbody) return;

    factionsSeekingMembersTbody.innerHTML = '<tr><td colspan="4">Loading recruiting factions...</td></tr>';

    try {
        const snapshot = await db.collection('recruitingFactions') // NEW Collection
                                .where('isActive', '==', true)
                                .orderBy('listingTimestamp', 'desc')
                                .get();

        if (snapshot.empty) {
            factionsSeekingMembersTbody.innerHTML = '<tr><td colspan="4">No factions currently seeking members.</td></tr>';
            return;
        }

        let tableHtml = '';
        snapshot.docs.forEach(doc => {
            const faction = doc.data();
            const profileUrl = `https://www.torn.com/factions.php?step=profile&ID=${faction.factionId}`;
            
            tableHtml += `
                <tr>
                    <td><a href="${profileUrl}" target="_blank">${faction.factionName} [${faction.factionId}]</a></td>
                    <td>${faction.totalMembers || 'N/A'}</td>
                    <td>${faction.contactInfo || 'N/A'}</td>
                    <td><button class="action-button enlist-button" data-faction-id="${faction.factionId}">Enlist</button></td>
                </tr>
            `;
        });
        factionsSeekingMembersTbody.innerHTML = tableHtml;

    } catch (error) {
        console.error("Error displaying factions seeking members:", error);
        factionsSeekingMembersTbody.innerHTML = '<tr><td colspan="4">Error loading factions.</td></tr>';
    }
}

// Function to handle player enlistment (for Factions Seeking Members section)
async function enlistPlayer(factionId) {
    console.log(`Attempting to enlist player for Faction ID: ${factionId}`);
    if (!auth.currentUser) {
        alert("You must be logged in to enlist.");
        return;
    }
    if (!currentUserTornId || !currentUserTornApiKey) {
        alert("Your Torn ID and API key are required for enlistment. Please register them in your profile.");
        return;
    }

    try {
        // --- Use selections for 'bars,cooldowns,travel,profile' ---
        const selections = 'bars,cooldowns,travel,profile'; // As requested
        const apiUrl = `https://api.torn.com/user/${currentUserTornId}?selections=${selections}&key=${currentUserTornApiKey}&comment=MyTornPA_Recruitment`;
        
        console.log(`Fetching player data for enlistment: ${apiUrl}`);
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Torn API HTTP error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        if (data.error) {
            // Specifically handle common API key errors
            if (data.error.code === 2) throw new Error(`Torn API: Invalid API Key. Please check your key permissions.`);
            if (data.error.code === 10) throw new Error(`Torn API: Insufficient API Key Permissions. Ensure 'Bars', 'Cooldowns', 'Travel', and 'Profile' are enabled.`);
            throw new Error(`Torn API error: ${data.error.error}`);
        }

        // Extract data based on new selections
        const profile = data.profile || {};
        const bars = data.bars || {}; // Health, Nerve, Energy bars
        const cooldowns = data.cooldowns || {}; // Drug, Medical, Booster cooldowns
        const travel = data.travel || {}; // Travel status
        
        const xanaxTaken = 'N/A'; // Cannot get from 'personalstats' which is NOT in new selections
        const totalAttacks = 'N/A'; // Cannot get from 'personalstats' which is NOT in new selections
        const playerStrength = 'N/A'; // Cannot get from 'battlestats' which is NOT in new selections
        const playerDefense = 'N/A';   // Cannot get from 'battlestats' which is NOT in new selections
        const playerSpeed = 'N/A';       // Cannot get from 'battlestats' which is NOT in new selections
        const playerDexterity = 'N/A'; // Cannot get from 'battlestats' which is NOT in new selections


        const playerEnlistmentData = {
            factionId: String(factionId),
            playerId: String(currentUserTornId),
            playerName: profile.name || data.name || 'Unknown', // Fallback to top-level name from basic selection if profile.name is missing
            playerLevel: profile.level || data.level || 0, // Fallback to top-level level from basic selection
            playerStrength: playerStrength, 
            playerDefense: playerDefense,   
            playerSpeed: playerSpeed,       
            playerDexterity: playerDexterity, 
            xanaxTaken: xanaxTaken,         
            totalAttacks: totalAttacks,     
            enlistmentTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
            firebaseUid: auth.currentUser.uid, // Link back to their Firebase account
            status: profile.status ? profile.status.description : data.status ? data.status.description : 'Unknown' // Current status (from profile or basic)
        };

        // Save to Firestore
        const docRef = db.collection('recruitmentApplications').doc(`${factionId}_${currentUserTornId}`);
        await docRef.set(playerEnlistmentData, { merge: true });

        alert(`Successfully enlisted for Faction ${factionId}! Your profile has been sent.`);
        console.log("Player enlistment data saved:", playerEnlistmentData);

    } catch (error) {
        console.error("Error during player enlistment:", error);
        alert(`Failed to enlist: ${error.message}`);
    }
}


// --- NEW FUNCTION: To list current user in 'Players Seeking Factions' ---
async function listSelfForRecruitment() {
    console.log("Attempting to list player for recruitment.");
    if (!auth.currentUser) {
        alert("You must be logged in to list yourself.");
        return;
    }
    if (!currentUserTornId || !currentUserTornApiKey) {
        alert("Your Torn ID and API key are required to list yourself. Please register them in your profile.");
        return;
    }

    const contactInfo = prompt("Please provide contact info (e.g., Discord Tag, Torn Mail ID) for factions to reach you:");
    if (!contactInfo || contactInfo.trim() === '') {
        alert("Listing cancelled. Contact info is required.");
        return;
    }

    try {
        // --- Use selections for 'bars,cooldowns,travel,profile' ---
        const selections = 'bars,cooldowns,travel,profile'; // As requested
        const apiUrl = `https://api.torn.com/user/${currentUserTornId}?selections=${selections}&key=${currentUserTornApiKey}&comment=MyTornPA_Recruitment`;
        
        console.log(`Fetching player data for self-listing: ${apiUrl}`);
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`Torn API HTTP error: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        if (data.error) {
            if (data.error.code === 2) throw new Error(`Torn API: Invalid API Key. Please check your key permissions.`);
            if (data.error.code === 10) throw new Error(`Torn API: Insufficient API Key Permissions. Ensure 'Bars', 'Cooldowns', 'Travel', and 'Profile' are enabled.`);
            throw new Error(`Torn API error: ${data.error.error}`);
        }

        const profile = data.profile || {};
        const bars = data.bars || {}; // Health, Nerve, Energy bars
        const cooldowns = data.cooldowns || {}; // Drug, Medical, Booster cooldowns
        const travel = data.travel || {}; // Travel status

        const xanaxTaken = 'N/A'; // Will be N/A based on current selections
        const totalAttacks = 'N/A'; // Will be N/A based on current selections
        const playerStrength = 'N/A'; // Will be N/A based on current selections
        const playerDefense = 'N/A';   // Will be N/A based on current selections
        const playerSpeed = 'N/A';       // Will be N/A based on current selections
        const playerDexterity = 'N/A'; // Will be N/A based on current selections


        const playerListingData = {
            playerId: String(currentUserTornId),
            playerName: profile.name || data.name || 'Unknown',
            playerLevel: profile.level || data.level || 0,
            playerStrength: playerStrength, 
            playerDefense: playerDefense,   
            playerSpeed: playerSpeed,       
            playerDexterity: playerDexterity, 
            xanaxTaken: xanaxTaken,
            totalAttacks: totalAttacks,
            contactInfo: contactInfo.trim(),
            listingTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
            firebaseUid: auth.currentUser.uid,
            isActive: true // Player can set this to false later if they find a faction
        };

        const docRef = db.collection('playersSeekingFactions').doc(String(currentUserTornId));
        await docRef.set(playerListingData, { merge: true });

        alert(`Successfully listed yourself for recruitment!`);
        console.log("Player self-listing data saved:", playerListingData);
        displayPlayersSeekingFactions(); // Refresh the list after listing self

    } catch (error) {
        console.error("Error during self-listing:", error);
        alert(`Failed to list yourself: ${error.message}`);
    }
}


// --- NEW FUNCTION: To display 'Players Seeking Factions' ---
async function displayPlayersSeekingFactions() {
    if (!playersSeekingFactionsTbody) return;

    playersSeekingFactionsTbody.innerHTML = '<tr><td colspan="6">Loading player listings...</td></tr>';

    try {
        const snapshot = await db.collection('playersSeekingFactions')
                                .where('isActive', '==', true)
                                .orderBy('listingTimestamp', 'desc') // Show most recent first
                                .limit(50) // Limit to 50 listings
                                .get();

        if (snapshot.empty) {
            playersSeekingFactionsTbody.innerHTML = '<tr><td colspan="6">No players currently seeking factions.</td></tr>';
            return;
        }

        let tableHtml = '';
        snapshot.docs.forEach(doc => {
            const player = doc.data();
            const profileUrl = `https://www.torn.com/profiles.php?XID=${player.playerId}`;
            
            tableHtml += `
                <tr>
                    <td><a href="${profileUrl}" target="_blank">${player.playerName} [${player.playerId}]</a></td>
                    <td>${player.playerLevel}</td>
                    <td>S:${player.playerStrength.toLocaleString()} D:${player.playerDefense.toLocaleString()} Sp:${player.playerSpeed.toLocaleString()} Dx:${player.playerDexterity.toLocaleString()}</td>
                    <td>${player.xanaxTaken.toLocaleString()}</td>
                    <td>${player.totalAttacks.toLocaleString()}</td>
                    <td><button class="action-button contact-player-button" data-player-id="${player.playerId}" data-contact-info="${player.contactInfo}">Contact</button></td>
                </tr>
            `;
        });
        playersSeekingFactionsTbody.innerHTML = tableHtml;

    } catch (error) {
        console.error("Error fetching players seeking factions:", error);
        playersSeekingFactionsTbody.innerHTML = `<tr><td colspan="6">Error loading player listings.</td></tr>`;
    }
}


// --- NEW FUNCTION: To allow a Faction Leader to advertise their faction ---
async function advertiseFaction() {
    console.log("Attempting to advertise faction.");
    if (!auth.currentUser) {
        alert("You must be logged in to advertise your faction.");
        return;
    }
    // Check if the current user is a leader (this flag is set in auth.onAuthStateChanged)
    if (!currentUserIsLeader) {
        alert("Only designated faction leaders can advertise factions.");
        return;
    }
    if (!currentUserTornApiKey) {
        alert("Your Torn API key is required to advertise your faction. Please register it in your profile.");
        return;
    }

    try {
        // Fetch current user's faction ID from their profile
        const userProfileDoc = await db.collection('userProfiles').doc(auth.currentUser.uid).get();
        const userTornFactionId = userProfileDoc.data()?.tornFactionId; // Using optional chaining for safety

        if (!userTornFactionId) {
            alert("Your Torn Faction ID is not registered in your profile. Cannot advertise.");
            return;
        }

        // Fetch current user's faction data using their API key
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
            factionId: String(userTornFactionId),
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


// --- Main Initialization for Recruitment Page ---
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userProfileRef = db.collection('userProfiles').doc(user.uid);
            const doc = await userProfileRef.get();
            const userData = doc.exists ? doc.data() : {};
            
            currentUserTornId = userData.tornProfileId || null;
            currentUserTornApiKey = userData.tornApiKey || null;
            
            // --- CRITICAL CORRECTION: Check for leader status using 'position' from Firestore userData ---
            currentUserIsLeader = (userData.position === 'Leader' || userData.position === 'Co-leader');
            console.log(`User ${currentUserTornId} is leader: ${currentUserIsLeader} (via Firebase userProfile.position).`);

            // Show/hide button based on leader status
            if (advertiseFactionButton) { // Ensure button exists before trying to access style
                advertiseFactionButton.style.display = currentUserIsLeader ? 'block' : 'none';
            }
            // --- END CRITICAL CORRECTION ---


            if (!currentUserTornId || !currentUserTornApiKey) {
                console.warn("User logged in but Torn ID or API Key missing from profile. Disabling enlist/advertise buttons.");
                alert("Please complete your profile (Torn ID & API Key) to use all recruitment features.");
                if (listSelfButton) listSelfButton.disabled = true;
                if (advertiseFactionButton) advertiseFactionButton.disabled = true;
            } else {
                 // Ensure buttons are enabled if key/ID are present and leader status checked
                 if (listSelfButton) listSelfButton.disabled = false;
                 // advertiseFactionButton display/disabled status already handled by currentUserIsLeader logic
            }
        } else {
            console.log("User not logged in on Recruitment page.");
            alert("Please log in to use the recruitment features.");
            // Disable all interactive buttons if not logged in
            if (listSelfButton) listSelfButton.disabled = true;
            if (advertiseFactionButton) advertiseFactionButton.style.display = 'none'; // Hide if not logged in
            if (advertiseFactionButton) advertiseFactionButton.disabled = true; // Disable if not logged in
            // Enlist buttons in table should also be disabled/alert on click
            // (Current logic for enlistPlayer handles this by alerting if not logged in/no API key)
        }
        
        // Always display initial listings, regardless of login status
        displayFactionsSeekingMembers();
        displayPlayersSeekingFactions();
    });

    // Event listener for enlist buttons (delegated for dynamically added buttons)
    if (factionsSeekingMembersTbody) {
        factionsSeekingMembersTbody.addEventListener('click', (event) => {
            const button = event.target.closest('.enlist-button');
            if (button && !button.disabled) { // Ensure button is not disabled
                const factionId = button.dataset.factionId;
                enlistPlayer(factionId);
            }
        });
    }

    // Event listener for "List Myself" button
    if (listSelfButton) {
        listSelfButton.addEventListener('click', listSelfForRecruitment);
    }

    // NEW: Event listener for "Advertise My Faction" button
    if (advertiseFactionButton) {
        advertiseFactionButton.addEventListener('click', advertiseFaction);
    }

    // Event listener for "Contact" player buttons (delegated)
    if (playersSeekingFactionsTbody) {
        playersSeekingFactionsTbody.addEventListener('click', (event) => {
            const button = event.target.closest('.contact-player-button');
            if (button) {
                const playerId = button.dataset.playerId;
                const contactInfo = button.dataset.contactInfo;
                alert(`To contact player ${playerId}:\nContact Info: ${contactInfo}`);
            }
        });
    }
});