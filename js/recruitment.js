// --- Firebase and Global Variable Setup ---
const db = firebase.firestore();
const auth = firebase.auth();

let currentUserTornId = null;
let currentUserTornApiKey = null;
let currentUserData = null; // To store the currently logged-in user's fetched Torn data
let currentUserIsLeader = false; // Flag to check if current user is a leader
let isCurrentlyListed = false; // NEW: To track if the user is already listed
let isFactionCurrentlyAdvertised = false; // NEW: To track if the user's faction is advertised

// DOM Elements for this page (from recruitment.html)
const factionsSeekingMembersTbody = document.getElementById('factions-seeking-members-tbody');
const playersSeekingFactionsTbody = document.getElementById('players-seeking-factions-tbody');
const listSelfButton = document.getElementById('list-self-button');
const advertiseFactionButton = document.getElementById('advertise-faction-button');
const EXEMPT_USER_IDS = ['2662550'];

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

// NEW: Helper function to open internal private chat
function openInternalPrivateChat(tornId, tornName, firebaseUid) {
    if (window.openPrivateChatWindow) {
        window.openPrivateChatWindow(tornId, tornName);
    } else {
        alert(`Failed to open internal chat. User: ${tornName} [${tornId}]. (openPrivateChatWindow function not found)`);
        console.error('global.js openPrivateChatWindow function not loaded or accessible.');
    }
}

// --- Core Functions for this page ---

async function displayFactionsSeekingMembers() {
    if (!factionsSeekingMembersTbody) return;
    factionsSeekingMembersTbody.innerHTML = '<tr><td colspan="5">Loading recruiting factions...</td></tr>'; // Adjusted colspan
    try {
        const snapshot = await db.collection('recruitingFactions').where('isActive', '==', true).orderBy('listingTimestamp', 'desc').get();
        if (snapshot.empty) {
            factionsSeekingMembersTbody.innerHTML = '<tr><td colspan="5">No factions currently seeking members.</td></tr>'; // Adjusted colspan
            return;
        }
        let tableHtml = '';
        snapshot.docs.forEach(doc => {
            const faction = doc.data();
            const profileUrl = `https://www.torn.com/factions.php?step=profile&ID=${faction.factionId}`;

            // Format respect to be more readable (e.g., 1,234,567)
            const formattedRespect = (faction.factionRespect || 0).toLocaleString();

            // Ensure rank tier is capitalized for display
            const displayedRankTier = faction.factionRankTier ?
                                      faction.factionRankTier.charAt(0).toUpperCase() + faction.factionRankTier.slice(1) :
                                      'N/A';

            tableHtml += `
                <tr>
                    <td><a href="${profileUrl}" target="_blank" rel="noopener noreferrer">${faction.factionName} [${faction.factionId}]</a></td>
                    <td>${formattedRespect}</td>
                    <td>${displayedRankTier}</td>
                    <td>${faction.totalMembers || 'N/A'}</td>
                    <td><a href="${profileUrl}" target="_blank" rel="noopener noreferrer" class="action-button apply-link">Apply</a></td>
                </tr>
            `;
        });
        factionsSeekingMembersTbody.innerHTML = tableHtml;
    } catch (error) {
        console.error("Error displaying factions seeking members:", error);
        factionsSeekingMembersTbody.innerHTML = '<tr><td colspan="5">Error loading factions.</td></tr>'; // Adjusted colspan
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

async function removeSelfFromRecruitment() {
    console.log("Attempting to remove player from recruitment.");
    if (!auth.currentUser) {
        alert("You must be logged in to do this.");
        return;
    }

    // Disable the button to prevent multiple clicks
    listSelfButton.disabled = true;
    listSelfButton.textContent = 'Removing...';

    try {
        // The document ID is the user's Firebase UID, so we know exactly which one to delete.
        const listingDocRef = db.collection('playersSeekingFactions').doc(auth.currentUser.uid);

        await listingDocRef.delete();


        // Refresh the player list to show the change
        displayPlayersSeekingFactions();

    } catch (error) {
        console.error("Error removing self from listing:", error);
        alert(`Failed to remove your listing: ${error.message}`);
    }
    // We don't need a 'finally' block to re-enable the button,
    // because the next step will handle setting its text and state correctly.
}

// THIS IS THE FUNCTION WITH ALL THE DEBUG LOGS.
async function displayPlayersSeekingFactions() {
    if (!playersSeekingFactionsTbody) {
        console.log("DEBUG: Cannot find the table body element 'players-seeking-factions-tbody'.");
        return;
    }

    console.log("1. Starting to display players."); // DEBUG
    playersSeekingFactionsTbody.innerHTML = '<tr><td colspan="8">Loading player listings...</td></tr>'; // Adjusted colspan to 8

    try {
        const snapshot = await db.collection('playersSeekingFactions')
            .where('isActive', '==', true)
            .orderBy('listingTimestamp', 'desc')
            .limit(50)
            .get();

        console.log("2. Fetch successful. Found " + snapshot.size + " documents."); // DEBUG

        if (snapshot.empty) {
            console.log("3. Snapshot is empty, showing 'No players' message."); // DEBUG
            playersSeekingFactionsTbody.innerHTML = '<tr><td colspan="8">No players currently seeking factions.</td></tr>'; // Adjusted colspan to 8
            return;
        }

        console.log("4. Snapshot has data, building table rows..."); // DEBUG
        let tableHtml = '';
        snapshot.docs.forEach(doc => {
            const player = doc.data();
            console.log("5. Adding row for player: ", player.playerName); // DEBUG
            const profileUrl = `https://www.torn.com/profiles.php?XID=${player.playerId}`;

            // --- MODIFIED LINE FOR INTERNAL CHAT ---
            // Use player.firebaseUid and player.playerName for the openInternalPrivateChat function
            // The Torn ID (player.playerId) is passed too, as your openPrivateChatWindow might still use it or display it.
            tableHtml += `
                <tr>
                    <td><a href="${profileUrl}" target="_blank" rel="noopener noreferrer">${player.playerName}</a></td>
                    <td>${player.playerLevel}</td>
                    <td>${formatNumber(player.totalStats)}</td>
                    <td>${(player.xanaxTaken || 0).toLocaleString()}</td>
                    <td>${(player.warHits || 0).toLocaleString()}</td>
                    <td>${(player.energyRefills || 0).toLocaleString()}</td>
                    <td>${(player.bestActiveStreak || 0).toLocaleString()}</td>
                    <td><button class="action-button message-internal-button" data-torn-id="${player.playerId}" data-torn-name="${player.playerName}" data-firebase-uid="${player.firebaseUid}">Message</button></td>
                </tr>
            `;
        });

        console.log("6. Finished building HTML. Final content length:", tableHtml.length); // DEBUG
        playersSeekingFactionsTbody.innerHTML = tableHtml;

        // --- NEW: Add event listener for the internal message buttons ---
        playersSeekingFactionsTbody.querySelectorAll('.message-internal-button').forEach(button => {
            button.addEventListener('click', (event) => {
                const tornId = event.target.dataset.tornId;
                const tornName = event.target.dataset.tornName;
                const firebaseUid = event.target.dataset.firebaseUid; // Though not directly used by openPrivateChatWindow, it's good to keep
                openInternalPrivateChat(tornId, tornName, firebaseUid);
            });
        });


    } catch (error) {
        console.error("7. Error fetching players:", error); // DEBUG
        playersSeekingFactionsTbody.innerHTML = `<tr><td colspan="8">Error loading player listings.</td></tr>`; // Adjusted colspan to 8
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

    // Disable button and change text immediately
    advertiseFactionButton.disabled = true;
    advertiseFactionButton.textContent = 'Advertising...';

    try {
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
            const errorText = await response.text().catch(() => "Could not read error text");
            throw new Error(`Torn API HTTP error: ${response.status} ${response.statusText}. Response: ${errorText.substring(0, 100)}`);
        }

        const data = await response.json();

        if (data.error) {
            if (data.error.code === 2) throw new Error(`Torn API: Invalid API Key. Please check your key permissions.`);
            if (data.error.code === 10) throw new Error(`Torn API: Insufficient API Key Permissions. Ensure 'Basic' and 'Members' are enabled for your faction API key.`);
            throw new Error(`Torn API error: ${data.error.error}`);
        }

        // CORRECTED: Access properties from 'data.basic' object
        const factionName = data.basic?.name || 'Unknown Faction';
        const totalMembers = data.members ? Object.keys(data.members).length : 0;
        const factionRespect = data.basic?.respect || 0;
        const factionRankTier = data.basic?.rank?.name || 'N/A'; // Access rank.name from data.basic.rank

        const contactInfo = ''; // Temporarily empty, will be added via a UI later

        const factionListingData = {
            factionId: String(userTornFactionId), // Faction ID is at top-level data.ID, but also in data.basic.ID
            factionName: factionName,
            totalMembers: totalMembers,
            factionRespect: factionRespect,
            factionRankTier: factionRankTier,
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

        // Update state and button for immediate feedback
        isFactionCurrentlyAdvertised = true;
        advertiseFactionButton.textContent = 'Remove My Faction';
        advertiseFactionButton.classList.add('remove');
        advertiseFactionButton.disabled = false; // Re-enable for removal

        displayFactionsSeekingMembers(); // Refresh the display
    } catch (error) {
        console.error("Error during faction advertisement:", error);
        alert(`Failed to advertise faction: ${error.message}`);
        advertiseFactionButton.disabled = false; // Re-enable if an error occurred
        advertiseFactionButton.textContent = 'Advertise My Faction'; // Revert text
        advertiseFactionButton.classList.remove('remove');
    }
}

// NEW FUNCTION: Remove faction advertisement
async function removeFactionAdvertisement() {
    console.log("Attempting to remove faction advertisement.");
    if (!auth.currentUser) {
        alert("You must be logged in to do this.");
        return;
    }
    if (!currentUserIsLeader) {
        alert("Only designated faction leaders can remove faction advertisements.");
        return;
    }
    const userTornFactionId = currentUserData?.faction_id;
    if (!userTornFactionId) {
        alert("Your Torn Faction ID is missing. Cannot remove advertisement.");
        return;
    }

    // Disable button and change text immediately
    advertiseFactionButton.disabled = true;
    advertiseFactionButton.textContent = 'Removing...';

    try {
        const docRef = db.collection('recruitingFactions').doc(String(userTornFactionId));
        await docRef.delete();

        alert(`Successfully removed your faction's advertisement.`);
        console.log("Faction advertisement removed for ID:", userTornFactionId);

        // Update state and button for immediate feedback
        isFactionCurrentlyAdvertised = false;
        advertiseFactionButton.textContent = 'Advertise My Faction';
        advertiseFactionButton.classList.remove('remove');
        advertiseFactionButton.disabled = false; // Re-enable for new advertisement

        displayFactionsSeekingMembers(); // Refresh the display
    } catch (error) {
        console.error("Error removing faction advertisement:", error);
        alert(`Failed to remove faction advertisement: ${error.message}`);
        advertiseFactionButton.disabled = false; // Re-enable if an error occurred
        advertiseFactionButton.textContent = 'Remove My Faction'; // Revert text if failed to remove
        advertiseFactionButton.classList.add('remove');
    }
}


// --- Main Initialization for Page (UPDATED with User ID Exemption) ---
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

            // --- Check Faction Advertisement Status on load ---
            if (advertiseFactionButton && currentUserData?.faction_id) {
                const factionListingDocRef = db.collection('recruitingFactions').doc(String(currentUserData.faction_id));
                const factionListingDoc = await factionListingDocRef.get();
                isFactionCurrentlyAdvertised = factionListingDoc.exists && factionListingDoc.data().isActive === true;

                if (currentUserIsLeader) {
                    advertiseFactionButton.style.display = 'block';
                    if (isFactionCurrentlyAdvertised) {
                        advertiseFactionButton.textContent = 'Remove My Faction';
                        advertiseFactionButton.classList.add('remove');
                    } else {
                        advertiseFactionButton.textContent = 'Advertise My Faction';
                        advertiseFactionButton.classList.remove('remove');
                    }
                    advertiseFactionButton.disabled = false; // Enable if leader, then specific conditions might disable it below
                } else {
                    advertiseFactionButton.style.display = 'none'; // Hide if not a leader
                    advertiseFactionButton.disabled = true;
                }
            } else if (advertiseFactionButton) {
                advertiseFactionButton.style.display = 'none'; // Hide if no faction ID for current user
                advertiseFactionButton.disabled = true;
            }
            // --- END Faction Advertisement Status Check ---


            // --- NEW EXEMPTION LOGIC ---
            const hasFaction = userData.faction_id && userData.faction_id != 0;
            // Check if the current user's ID is in our exemption list
            const isExemptUser = EXEMPT_USER_IDS.includes(String(currentUserTornId));

            // A user is in a 'disallowed' faction if they have a faction AND they are NOT an exempt user.
            const isInDisallowedFaction = hasFaction && !isExemptUser;

            if (listSelfButton) {
                if (isInDisallowedFaction) {
                    // If user is in a non-exempt faction, disable the button
                    listSelfButton.disabled = true;
                    listSelfButton.textContent = 'In a Faction';
                    listSelfButton.title = 'You cannot list yourself for recruitment while in a faction.';
                    listSelfButton.classList.remove('remove');
                } else {
                    // If user is NOT in a faction, OR they ARE an exempt user, proceed normally
                    listSelfButton.disabled = false;
                    listSelfButton.title = '';

                    const listingDocRef = db.collection('playersSeekingFactions').doc(user.uid);
                    const listingDoc = await listingDocRef.get();
                    isCurrentlyListed = listingDoc.exists;

                    if (isCurrentlyListed) {
                        listSelfButton.textContent = 'Remove Listing';
                        listSelfButton.classList.add('remove');
                    } else {
                        listSelfButton.textContent = 'List Myself';
                        listSelfButton.classList.remove('remove');
                    }
                }
            }
            // --- END NEW EXEMPTION LOGIC ---

            if (!currentUserTornId || !currentUserTornApiKey) {
                // Also check isInDisallowedFaction here to avoid re-enabling a disabled button
                if (listSelfButton && !isInDisallowedFaction) listSelfButton.disabled = true;
                // No need to disable advertiseFactionButton here based on API key, as it's already handled above
            } else {
                if (listSelfButton && !isInDisallowedFaction) listSelfButton.disabled = false;
                // The advertiseFactionButton's disabled state is now handled by the isFactionCurrentlyAdvertised check and currentUserIsLeader.
            }

        } else {
            // Reset everything if user is not logged in
            currentUserTornId = null;
            currentUserTornApiKey = null;
            currentUserData = null;
            currentUserIsLeader = false;
            isCurrentlyListed = false;
            isFactionCurrentlyAdvertised = false; // Reset on logout
            if (listSelfButton) {
                listSelfButton.textContent = 'List Myself';
                listSelfButton.disabled = true;
                listSelfButton.classList.remove('remove');
            }
            if (advertiseFactionButton) {
                advertiseFactionButton.style.display = 'none';
                advertiseFactionButton.disabled = true;
                advertiseFactionButton.textContent = 'Advertise My Faction'; // Reset text
                advertiseFactionButton.classList.remove('remove');
            }
        }

        displayFactionsSeekingMembers();
        displayPlayersSeekingFactions();
    });

    // Event listener for "Enlist" buttons (if you add them to factionsSeekingMembersTbody)
    if (factionsSeekingMembersTbody) {
        factionsSeekingMembersTbody.addEventListener('click', (event) => {
            const button = event.target.closest('.enlist-button');
            if (button && !button.disabled) {
                const factionId = button.dataset.factionId;
                // enlistPlayer(factionId); // Assuming enlistPlayer is defined elsewhere if needed
            }
        });
    }

    // "List/Remove" BUTTON EVENT LISTENER
    if (listSelfButton) {
        listSelfButton.addEventListener('click', () => {
            if (isCurrentlyListed) {
                removeSelfFromRecruitment().then(() => {
                    // isCurrentlyListed state updated within removeSelfFromRecruitment's finally block or after displayPlayersSeekingFactions.
                    // The onAuthStateChanged listener also re-evaluates the button state, ensuring consistency.
                });
            } else {
                listSelfForRecruitment().then(() => {
                    // isCurrentlyListed state updated within listSelfForRecruitment's finally block or after displayPlayersSeekingFactions.
                    // The onAuthStateChanged listener also re-evaluates the button state, ensuring consistency.
                });
            }
        });
    }

    // NEW: Event listener for "Advertise/Remove My Faction" button
    if (advertiseFactionButton) {
        advertiseFactionButton.addEventListener('click', () => {
            if (isFactionCurrentlyAdvertised) {
                removeFactionAdvertisement();
            } else {
                advertiseFaction();
            }
        });
    }
});

