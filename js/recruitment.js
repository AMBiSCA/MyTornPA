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


// --- Utility Functions ---

// UPDATED: Added a function to format large numbers for display
function formatNumber(num) {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}


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
                    <td><a href="${profileUrl}" target="_blank" rel="noopener noreferrer">${faction.factionName} [${faction.factionId}]</a></td>
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
        // NOTE: The /user/ endpoint is the correct one for Torn player data. /v2/ is used for other things like faction data.
        const selections = 'bars,cooldowns,travel,profile';
        const apiUrl = `https://api.torn.com/user/${currentUserTornId}?selections=${selections}&key=${currentUserTornApiKey}&comment=MyTornPA_Recruitment`;

        console.log(`Fetching player data for enlistment: ${apiUrl}`);
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

        const playerEnlistmentData = {
            factionId: String(factionId),
            playerId: String(currentUserTornId),
            playerName: profile.name || data.name || 'Unknown',
            playerLevel: profile.level || data.level || 0,
            enlistmentTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
            firebaseUid: auth.currentUser.uid,
            status: profile.status ? profile.status.description : data.status ? data.status.description : 'Unknown'
        };

        const docRef = db.collection('recruitmentApplications').doc(`${factionId}_${currentUserTornId}`);
        await docRef.set(playerEnlistmentData, {
            merge: true
        });

        alert(`Successfully enlisted for Faction ${factionId}! Your profile has been sent.`);
        console.log("Player enlistment data saved:", playerEnlistmentData);

    } catch (error) {
        console.error("Error during player enlistment:", error);
        alert(`Failed to enlist: ${error.message}`);
    }
}


/// --- 🔺 FINAL UPDATED FUNCTION 🔺 ---
// Saves the correct data including Total Stats and Best Active Streak.
async function listSelfForRecruitment() {
    console.log("Attempting to list player for recruitment.");
    if (!auth.currentUser) {
        alert("You must be logged in to list yourself.");
        return;
    }
    if (!currentUserTornId) {
        alert("Your Torn ID is missing. Please ensure your profile is set up correctly.");
        return;
    }

    listSelfButton.disabled = true;
    listSelfButton.textContent = 'Listing...';

    try {
        const userDocRef = db.collection('users').doc(String(currentUserTornId));
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
            throw new Error(`Your user data could not be found in the 'users' collection.`);
        }
        const userData = userDoc.data();

        const battleStats = userData.battlestats || {};
        const personalStats = userData.personalstats || {};

        // This object now contains all the final fields for display.
        const playerListingData = {
            playerId: String(currentUserTornId),
            playerName: userData.name || 'Unknown',
            playerLevel: userData.level || 0,
            totalStats: battleStats.total || 0, // Using the 'total' field for battle stats.
            xanaxTaken: personalStats.xantaken || 0,
            warHits: personalStats.rankedwarhits || 0,    // Using 'rankedwarhits'.
            energyRefills: personalStats.refills || 0,      // Using 'refills'.
            bestActiveStreak: personalStats.bestactivestreak || 0, // NEW FIELD
            listingTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
            firebaseUid: auth.currentUser.uid,
            isActive: true
        };

        const listingDocRef = db.collection('playersSeekingFactions').doc(auth.currentUser.uid);
        await listingDocRef.set(playerListingData, { merge: true });

        alert(`Successfully listed yourself for recruitment!`);
        console.log("Player self-listing data saved:", playerListingData);
        displayPlayersSeekingFactions();

    } catch (error) {
        console.error("Error during self-listing:", error);
        alert(`Failed to list yourself: ${error.message}`);
    } finally {
        listSelfButton.disabled = false;
        listSelfButton.textContent = 'List Myself';
    }
}


// --- 🔺 FINAL UPDATED FUNCTION 🔺 ---
// Displays the final 7-column layout.
async function displayPlayersSeekingFactions() {
    if (!playersSeekingFactionsTbody) return;

    // Colspan is now 7 for the new column layout
    playersSeekingFactionsTbody.innerHTML = '<tr><td colspan="7">Loading player listings...</td></tr>';

    try {
        const snapshot = await db.collection('playersSeekingFactions')
            .where('isActive', '==', true)
            .orderBy('listingTimestamp', 'desc')
            .limit(50)
            .get();

        if (snapshot.empty) {
            playersSeekingFactionsTbody.innerHTML = '<tr><td colspan="7">No players currently seeking factions.</td></tr>';
            return;
        }

        let tableHtml = '';
        snapshot.docs.forEach(doc => {
            const player = doc.data();
            const profileUrl = `https://www.torn.com/profiles.php?XID=${player.playerId}`;

            // This HTML now matches the 7-column layout exactly.
            tableHtml += `
                <tr>
                    <td><a href="${profileUrl}" target="_blank" rel="noopener noreferrer">${player.playerName}</a></td>
                    <td>${player.playerLevel}</td>
                    <td>${formatNumber(player.totalStats)}</td>
                    <td>${(player.xanaxTaken || 0).toLocaleString()}</td>
                    <td>${(player.warHits || 0).toLocaleString()}</td>
                    <td>${(player.energyRefills || 0).toLocaleString()}</td>
                    <td>${(player.bestActiveStreak || 0).toLocaleString()}</td>
                </tr>
            `;
        });
        playersSeekingFactionsTbody.innerHTML = tableHtml;

    } catch (error) {
        console.error("Error fetching players seeking factions:", error);
        playersSeekingFactionsTbody.innerHTML = `<tr><td colspan="7">Error loading player listings.</td></tr>`;
    }
}
async function displayPlayersSeekingFactions() {
    if (!playersSeekingFactionsTbody) return;

    // Colspan is now 6 for the new column layout
    playersSeekingFactionsTbody.innerHTML = '<tr><td colspan="6">Loading player listings...</td></tr>';

    try {
        const snapshot = await db.collection('playersSeekingFactions')
            .where('isActive', '==', true)
            .orderBy('listingTimestamp', 'desc')
            .limit(50)
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
                    <td><a href="${profileUrl}" target="_blank" rel="noopener noreferrer">${player.playerName}</a></td>
                    <td>${player.playerLevel}</td>
                    <td>S: ${formatNumber(player.strength)} | D: ${formatNumber(player.defense)} | Sp: ${formatNumber(player.speed)} | Dx: ${formatNumber(player.dexterity)}</td>
                    <td>${(player.xanaxTaken || 0).toLocaleString()}</td>
                    <td>${(player.warHits || 0).toLocaleString()}</td>
                    <td>${(player.energyRefills || 0).toLocaleString()}</td>
                </tr>
            `;
        });
        playersSeekingFactionsTbody.innerHTML = tableHtml;

    } catch (error) {
        console.error("Error fetching players seeking factions:", error);
        playersSeekingFactionsTbody.innerHTML = `<tr><td colspan="6">Error loading player listings.</td></tr>`;
    }
}
async function displayPlayersSeekingFactions() {
    if (!playersSeekingFactionsTbody) return;

    playersSeekingFactionsTbody.innerHTML = '<tr><td colspan="5">Loading player listings...</td></tr>';

    try {
        const snapshot = await db.collection('playersSeekingFactions')
            .where('isActive', '==', true)
            .orderBy('listingTimestamp', 'desc')
            .limit(50)
            .get();

        if (snapshot.empty) {
            playersSeekingFactionsTbody.innerHTML = '<tr><td colspan="5">No players currently seeking factions.</td></tr>';
            return;
        }

        let tableHtml = '';
        snapshot.docs.forEach(doc => {
            const player = doc.data();
            const profileUrl = `https://www.torn.com/profiles.php?XID=${player.playerId}`;

            // The whole row can be made clickable, but for accessibility, a clear link is better.
            tableHtml += `
                <tr>
                    <td><a href="${profileUrl}" target="_blank" rel="noopener noreferrer">${player.playerName} [${player.playerId}]</a></td>
                    <td>${player.playerLevel}</td>
                    <td>S: ${formatNumber(player.strength)} | D: ${formatNumber(player.defense)} | Sp: ${formatNumber(player.speed)} | Dx: ${formatNumber(player.dexterity)}</td>
                    <td>${player.xanaxTaken.toLocaleString()}</td>
                    <td>${player.totalAttacks.toLocaleString()}</td>
                </tr>
            `;
        });
        playersSeekingFactionsTbody.innerHTML = tableHtml;

    } catch (error) {
        console.error("Error fetching players seeking factions:", error);
        playersSeekingFactionsTbody.innerHTML = `<tr><td colspan="5">Error loading player listings.</td></tr>`;
    }
}


// Function to allow a Faction Leader to advertise their faction
async function advertiseFaction() {
    console.log("Attempting to advertise faction.");
    if (!auth.currentUser) {
        alert("You must be logged in to advertise your faction.");
        return;
    }
    if (!currentUserIsLeader) {
        alert("Only designated faction leaders can advertise factions.");
        return;
    }
    if (!currentUserTornApiKey) {
        alert("Your Torn API key is required to advertise your faction. Please register it in your profile.");
        return;
    }

    try {
        const userTornFactionId = currentUserData?.faction_id;

        if (!userTornFactionId) {
            alert("Your Torn Faction ID (`faction_id`) is not registered in your profile. Please add it to your profile to advertise your faction.");
            return;
        }

        // NOTE: The /v2/faction/ endpoint is correct for faction data.
        const selections = 'basic,members';
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

        const factionName = data.name || 'Unknown Faction';
        const totalMembers = data.members ? Object.keys(data.members).length : 0; // Correct way to get member count from V2 endpoint

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
            firebaseUid: auth.currentUser.uid,
            isActive: true
        };

        const docRef = db.collection('recruitingFactions').doc(String(userTornFactionId));
        await docRef.set(factionListingData, {
            merge: true
        });

        alert(`Successfully advertised ${factionName} for recruitment!`);
        console.log("Faction advertisement data saved:", factionListingData);
        displayFactionsSeekingMembers(); // Refresh the list

    } catch (error) {
        console.error("Error during faction advertisement:", error);
        alert(`Failed to advertise faction: ${error.message}`);
    }
}


// --- Main Initialization for Page ---
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userProfileRef = db.collection('userProfiles').doc(user.uid);
            const doc = await userProfileRef.get();
            const userData = doc.exists ? doc.data() : {};

            // Store all user data globally for other functions to use
            currentUserData = userData;
            currentUserTornId = userData.tornProfileId || null;
            currentUserTornApiKey = userData.tornApiKey || null;

            // Check for leader status
            currentUserIsLeader = (userData.position === 'Leader' || userData.position === 'Co-leader');
            console.log(`User ${user.uid} is leader: ${currentUserIsLeader}.`);

            // Show/hide "Advertise Faction" button based on leader status
            if (advertiseFactionButton) {
                advertiseFactionButton.style.display = currentUserIsLeader ? 'block' : 'none';
            }

            // Enable/disable buttons based on whether profile is complete
            if (!currentUserTornId || !currentUserTornApiKey) {
                console.warn("User logged in but Torn ID or API Key missing from profile.");
                if (listSelfButton) listSelfButton.disabled = true;
                if (advertiseFactionButton) advertiseFactionButton.disabled = true;
            } else {
                if (listSelfButton) listSelfButton.disabled = false;
                if (advertiseFactionButton) advertiseFactionButton.disabled = !currentUserIsLeader;
            }
        } else {
            console.log("User not logged in on Recruitment page.");
            // Reset all global variables and disable/hide buttons
            currentUserTornId = null;
            currentUserTornApiKey = null;
            currentUserData = null;
            currentUserIsLeader = false;

            if (listSelfButton) listSelfButton.disabled = true;
            if (advertiseFactionButton) {
                advertiseFactionButton.style.display = 'none';
                advertiseFactionButton.disabled = true;
            }
        }

        // Always display initial listings, regardless of login status
        displayFactionsSeekingMembers();
        displayPlayersSeekingFactions();
    });

    // --- Event Listeners ---

    // Event listener for "Enlist" buttons (in Factions table)
    if (factionsSeekingMembersTbody) {
        factionsSeekingMembersTbody.addEventListener('click', (event) => {
            const button = event.target.closest('.enlist-button');
            if (button && !button.disabled) {
                const factionId = button.dataset.factionId;
                enlistPlayer(factionId);
            }
        });
    }

    // Event listener for "List Myself" button
    if (listSelfButton) {
        listSelfButton.addEventListener('click', listSelfForRecruitment);
    }

    // Event listener for "Advertise My Faction" button
    if (advertiseFactionButton) {
        advertiseFactionButton.addEventListener('click', advertiseFaction);
    }

});