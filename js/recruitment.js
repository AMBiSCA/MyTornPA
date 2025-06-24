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
function formatNumber(num) {
    if (!num) return '0';
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

async function displayFactionsSeekingMembers() {
    if (!factionsSeekingMembersTbody) return;
    factionsSeekingMembersTbody.innerHTML = '<tr><td colspan="4">Loading recruiting factions...</td></tr>';
    try {
        const snapshot = await db.collection('recruitingFactions').where('isActive', '==', true).orderBy('listingTimestamp', 'desc').get();
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
        const playerListingData = {
            playerId: String(currentUserTornId),
            playerName: userData.name || 'Unknown',
            playerLevel: userData.level || 0,
            totalStats: battleStats.total || 0,
            xanaxTaken: personalStats.xantaken || 0,
            warHits: personalStats.rankedwarhits || 0,
            energyRefills: personalStats.refills || 0,
            bestActiveStreak: personalStats.bestactivestreak || 0,
            listingTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
            firebaseUid: auth.currentUser.uid,
            isActive: true
        };
        const listingDocRef = db.collection('playersSeekingFactions').doc(auth.currentUser.uid);
        await listingDocRef.set(playerListingData, {
            merge: true
        });
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

// THIS IS THE FUNCTION WITH ALL THE DEBUG LOGS.
async function displayPlayersSeekingFactions() {
    if (!playersSeekingFactionsTbody) {
        console.log("DEBUG: Cannot find the table body element 'players-seeking-factions-tbody'.");
        return;
    }

    console.log("1. Starting to display players."); // DEBUG
    playersSeekingFactionsTbody.innerHTML = '<tr><td colspan="7">Loading player listings...</td></tr>';

    try {
        const snapshot = await db.collection('playersSeekingFactions')
            .where('isActive', '==', true)
            .orderBy('listingTimestamp', 'desc')
            .limit(50)
            .get();

        console.log("2. Fetch successful. Found " + snapshot.size + " documents."); // DEBUG

        if (snapshot.empty) {
            console.log("3. Snapshot is empty, showing 'No players' message."); // DEBUG
            playersSeekingFactionsTbody.innerHTML = '<tr><td colspan="7">No players currently seeking factions.</td></tr>';
            return;
        }

        console.log("4. Snapshot has data, building table rows..."); // DEBUG
        let tableHtml = '';
        snapshot.docs.forEach(doc => {
            const player = doc.data();
            console.log("5. Adding row for player: ", player.playerName); // DEBUG
            const profileUrl = `https://www.torn.com/profiles.php?XID=${player.playerId}`;
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

        console.log("6. Finished building HTML. Final content length:", tableHtml.length); // DEBUG
        playersSeekingFactionsTbody.innerHTML = tableHtml;

    } catch (error) {
        console.error("7. Error fetching players:", error); // DEBUG
        playersSeekingFactionsTbody.innerHTML = `<tr><td colspan="7">Error loading player listings.</td></tr>`;
    }
}

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
        // THIS IS THE LINE I HAVE CORRECTED. NO SPACE BETWEEN ? AND .
        const userTornFactionId = currentUserData?.faction_id;
        if (!userTornFactionId) {
            alert("Your Torn Faction ID (`faction_id`) is not registered in your profile. Please add it to your profile to advertise your faction.");
            return;
        }
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
        const totalMembers = data.members ? Object.keys(data.members).length : 0;
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
        displayFactionsSeekingMembers();
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
            currentUserData = userData;
            currentUserTornId = userData.tornProfileId || null;
            currentUserTornApiKey = userData.tornApiKey || null;
            currentUserIsLeader = (userData.position === 'Leader' || userData.position === 'Co-leader');
            if (advertiseFactionButton) {
                advertiseFactionButton.style.display = currentUserIsLeader ? 'block' : 'none';
            }
            if (!currentUserTornId || !currentUserTornApiKey) {
                if (listSelfButton) listSelfButton.disabled = true;
                if (advertiseFactionButton) advertiseFactionButton.disabled = true;
            } else {
                if (listSelfButton) listSelfButton.disabled = false;
                if (advertiseFactionButton) advertiseFactionButton.disabled = !currentUserIsLeader;
            }
        } else {
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
        displayFactionsSeekingMembers();
        displayPlayersSeekingFactions();
    });
    if (factionsSeekingMembersTbody) {
        factionsSeekingMembersTbody.addEventListener('click', (event) => {
            const button = event.target.closest('.enlist-button');
            if (button && !button.disabled) {
                const factionId = button.dataset.factionId;
                enlistPlayer(factionId);
            }
        });
    }
    if (listSelfButton) {
        listSelfButton.addEventListener('click', listSelfForRecruitment);
    }
    if (advertiseFactionButton) {
        advertiseFactionButton.addEventListener('click', advertiseFaction);
    }
});