// --- Firebase and Global Variable Setup ---
const db = firebase.firestore();
const auth = firebase.auth();

let currentUserTornId = null;
let currentUserTornApiKey = null;
let currentUserData = null; // To store the currently logged-in user's fetched Torn data
let currentUserIsLeader = false; // Flag to check if current user is a leader
let isCurrentlyListed = false; // To track if the user is already listed
let isFactionCurrentlyAdvertised = false; // To track if the user's faction is advertised

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
    factionsSeekingMembersTbody.innerHTML = '<tr><td colspan="5">Loading recruiting factions...</td></tr>';
    try {
        const snapshot = await db.collection('recruitingFactions').where('isActive', '==', true).orderBy('listingTimestamp', 'desc').get();
        if (snapshot.empty) {
            factionsSeekingMembersTbody.innerHTML = '<tr><td colspan="5">No factions currently seeking members.</td></tr>';
            return;
        }
        let tableHtml = '';
        snapshot.docs.forEach(doc => {
            const faction = doc.data();
            const profileUrl = `https://www.torn.com/factions.php?step=profile&ID=${faction.factionId}`;
            const formattedRespect = (faction.factionRespect || 0).toLocaleString();
            const displayedRankTier = faction.factionRankTier ?
                faction.factionRankTier.charAt(0).toUpperCase() + faction.factionRankTier.slice(1) :
                'N/A';
            tableHtml += `
                <tr data-faction-id="${faction.factionId}">
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
        factionsSeekingMembersTbody.innerHTML = '<tr><td colspan="5">Error loading factions.</td></tr>';
    }
}

// ## THIS FUNCTION IS NOW FIXED ##
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
        await listingDocRef.set(playerListingData, { merge: true });

        // On success, correctly update the button state
        isCurrentlyListed = true;
        listSelfButton.textContent = 'Remove Listing';
        listSelfButton.classList.add('remove');
        listSelfButton.disabled = false;

        console.log("Player self-listing data saved:", playerListingData);
        displayPlayersSeekingFactions(); // Refresh the display

    } catch (error) {
        console.error("Error during self-listing:", error);
        alert(`Failed to list yourself: ${error.message}`);

        // On failure, revert the button to its original state
        isCurrentlyListed = false;
        listSelfButton.disabled = false;
        listSelfButton.textContent = 'List Myself';
        listSelfButton.classList.remove('remove');
    }
}


async function removeSelfFromRecruitment() {
    console.log("Attempting to remove player from recruitment.");
    if (!auth.currentUser) {
        alert("You must be logged in to do this.");
        return;
    }

    listSelfButton.disabled = true;
    listSelfButton.textContent = 'Removing...';

    try {
        const userUid = auth.currentUser.uid;
        const listingDocRef = db.collection('playersSeekingFactions').doc(userUid);
        await listingDocRef.delete();
        console.log("Player self-listing removed for UID:", userUid);

        isCurrentlyListed = false;
        listSelfButton.textContent = 'List Myself';
        listSelfButton.classList.remove('remove');
        listSelfButton.disabled = false;

        const rowToRemove = playersSeekingFactionsTbody.querySelector(`tr[data-player-uid="${userUid}"]`);
        if (rowToRemove) {
            rowToRemove.remove();
        }

        if (playersSeekingFactionsTbody.children.length === 0) {
            playersSeekingFactionsTbody.innerHTML = '<tr><td colspan="8">No players currently seeking factions.</td></tr>';
        }

    } catch (error) {
        console.error("Error removing self from listing:", error);
        alert(`Failed to remove your listing: ${error.message}`);
        listSelfButton.disabled = false;
        listSelfButton.textContent = 'Remove Listing';
        listSelfButton.classList.add('remove');
    }
}


async function displayPlayersSeekingFactions() {
    if (!playersSeekingFactionsTbody) {
        return;
    }
    playersSeekingFactionsTbody.innerHTML = '<tr><td colspan="8">Loading player listings...</td></tr>';

    try {
        const snapshot = await db.collection('playersSeekingFactions')
            .where('isActive', '==', true)
            .orderBy('listingTimestamp', 'desc')
            .limit(50)
            .get();

        if (snapshot.empty) {
            playersSeekingFactionsTbody.innerHTML = '<tr><td colspan="8">No players currently seeking factions.</td></tr>';
            return;
        }

        let tableHtml = '';
        snapshot.docs.forEach(doc => {
            const player = doc.data();
            const profileUrl = `https://www.torn.com/profiles.php?XID=${player.playerId}`;

            tableHtml += `
                <tr data-player-uid="${player.firebaseUid}">
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

        playersSeekingFactionsTbody.innerHTML = tableHtml;

        playersSeekingFactionsTbody.querySelectorAll('.message-internal-button').forEach(button => {
            button.addEventListener('click', (event) => {
                const tornId = event.target.dataset.tornId;
                const tornName = event.target.dataset.tornName;
                const firebaseUid = event.target.dataset.firebaseUid;
                openInternalPrivateChat(tornId, tornName, firebaseUid);
            });
        });

    } catch (error) {
        console.error("Error fetching players:", error);
        playersSeekingFactionsTbody.innerHTML = `<tr><td colspan="8">Error loading player listings.</td></tr>`;
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

        const factionName = data.basic?.name || 'Unknown Faction';
        const totalMembers = data.members ? Object.keys(data.members).length : 0;
        const factionRespect = data.basic?.respect || 0;
        const factionRankTier = data.basic?.rank?.name || 'N/A';
        const contactInfo = '';

        const factionListingData = {
            factionId: String(userTornFactionId),
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

        isFactionCurrentlyAdvertised = true;
        advertiseFactionButton.textContent = 'Remove My Faction';
        advertiseFactionButton.classList.add('remove');
        advertiseFactionButton.disabled = false;

        displayFactionsSeekingMembers();
    } catch (error) {
        console.error("Error during faction advertisement:", error);
        alert(`Failed to advertise faction: ${error.message}`);
        advertiseFactionButton.disabled = false;
        advertiseFactionButton.textContent = 'Advertise My Faction';
        advertiseFactionButton.classList.remove('remove');
    }
}


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

    advertiseFactionButton.disabled = true;
    advertiseFactionButton.textContent = 'Removing...';

    try {
        const docRef = db.collection('recruitingFactions').doc(String(userTornFactionId));
        await docRef.delete();
        console.log("Faction advertisement removed for ID:", userTornFactionId);

        isFactionCurrentlyAdvertised = false;
        advertiseFactionButton.textContent = 'Advertise My Faction';
        advertiseFactionButton.classList.remove('remove');
        advertiseFactionButton.disabled = false;

        const rowToRemove = factionsSeekingMembersTbody.querySelector(`tr[data-faction-id="${userTornFactionId}"]`);
        if (rowToRemove) {
            rowToRemove.remove();
        }

        if (factionsSeekingMembersTbody.children.length === 0) {
            factionsSeekingMembersTbody.innerHTML = '<tr><td colspan="5">No factions currently seeking members.</td></tr>';
        }

        alert(`Successfully removed your faction's advertisement.`);

    } catch (error) {
        console.error("Error removing faction advertisement:", error);
        alert(`Failed to remove faction advertisement: ${error.message}`);
        advertiseFactionButton.disabled = false;
        advertiseFactionButton.textContent = 'Remove My Faction';
        advertiseFactionButton.classList.add('remove');
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
                    advertiseFactionButton.disabled = false;
                } else {
                    advertiseFactionButton.style.display = 'none';
                    advertiseFactionButton.disabled = true;
                }
            } else if (advertiseFactionButton) {
                advertiseFactionButton.style.display = 'none';
                advertiseFactionButton.disabled = true;
            }

            const hasFaction = userData.faction_id && userData.faction_id != 0;
            const isExemptUser = EXEMPT_USER_IDS.includes(String(currentUserTornId));
            const isInDisallowedFaction = hasFaction && !isExemptUser;

            if (listSelfButton) {
                if (isInDisallowedFaction) {
                    listSelfButton.disabled = true;
                    listSelfButton.textContent = 'In a Faction';
                    listSelfButton.title = 'You cannot list yourself for recruitment while in a faction.';
                    listSelfButton.classList.remove('remove');
                } else {
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

            if (!currentUserTornId || !currentUserTornApiKey) {
                if (listSelfButton && !isInDisallowedFaction) listSelfButton.disabled = true;
            } else {
                if (listSelfButton && !isInDisallowedFaction) listSelfButton.disabled = false;
            }

        } else {
            currentUserTornId = null;
            currentUserTornApiKey = null;
            currentUserData = null;
            currentUserIsLeader = false;
            isCurrentlyListed = false;
            isFactionCurrentlyAdvertised = false;
            if (listSelfButton) {
                listSelfButton.textContent = 'List Myself';
                listSelfButton.disabled = true;
                listSelfButton.classList.remove('remove');
            }
            if (advertiseFactionButton) {
                advertiseFactionButton.style.display = 'none';
                advertiseFactionButton.disabled = true;
                advertiseFactionButton.textContent = 'Advertise My Faction';
                advertiseFactionButton.classList.remove('remove');
            }
        }

        displayFactionsSeekingMembers();
        displayPlayersSeekingFactions();
    });

    if (listSelfButton) {
        listSelfButton.addEventListener('click', () => {
            if (isCurrentlyListed) {
                removeSelfFromRecruitment();
            } else {
                listSelfForRecruitment();
            }
        });
    }

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

// Orientation handler code (unchanged)...
// --- START: Complete and Unified Orientation Handler ---
let portraitBlocker = null;
let landscapeBlocker = null;
function createOverlays() {
    const overlayStyles = {
        display: 'none',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: '#1e1e1e',
        color: '#f0f0f0',
        textAlign: 'center',
        fontFamily: 'sans-serif',
        fontSize: '1.5em',
        zIndex: '99999'
    };
    const buttonStyles = {
        backgroundColor: '#007bff',
        color: 'black',
        padding: '8px 15px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontWeight: 'bold',
        marginTop: '20px',
        textDecoration: 'none',
        fontSize: '16px'
    };
    if (!document.getElementById('tablet-portrait-blocker')) {
        portraitBlocker = document.createElement('div');
        portraitBlocker.id = 'tablet-portrait-blocker';
        Object.assign(portraitBlocker.style, overlayStyles);
        portraitBlocker.innerHTML = `
            <div>
                <h2>Please Rotate Your Device</h2>
                <p style="font-size: 0.7em; margin-top: 5px;">This page is best viewed in portrait mode.</p>
                <button id="return-home-btn-tablet">Return to Home</button>
            </div>`;
        document.body.appendChild(portraitBlocker);
        const tabletReturnBtn = document.getElementById('return-home-btn-tablet');
        if (tabletReturnBtn) {
            Object.assign(tabletReturnBtn.style, buttonStyles);
            tabletReturnBtn.addEventListener('click', () => { window.location.href = 'home.html'; });
        }
    }
    if (!document.getElementById('mobile-landscape-blocker')) {
        landscapeBlocker = document.createElement('div');
        landscapeBlocker.id = 'mobile-landscape-blocker';
        Object.assign(landscapeBlocker.style, overlayStyles);
        landscapeBlocker.innerHTML = `
            <div>
                <h2>Please Rotate Your Device</h2>
                <p style="font-size: 0.7em; margin-top: 5px;">For the best viewing experience, please use landscape mode.</p>
                <button id="return-home-btn-mobile">Return to Home</button>
            </div>`;
        document.body.appendChild(landscapeBlocker);
        const mobileReturnBtn = document.getElementById('return-home-btn-mobile');
        if (mobileReturnBtn) {
            Object.assign(mobileReturnBtn.style, buttonStyles);
            mobileReturnBtn.addEventListener('click', () => { window.location.href = 'home.html'; });
        }
    }
}
function handleOrientation() {
    if (!portraitBlocker || !landscapeBlocker) {
        createOverlays();
        portraitBlocker = document.getElementById('tablet-portrait-blocker');
        landscapeBlocker = document.getElementById('mobile-landscape-blocker');
        if (!portraitBlocker || !landscapeBlocker) return;
    }
    portraitBlocker.style.display = 'none';
    landscapeBlocker.style.display = 'none';
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;
    const isLandscape = !isPortrait;
    const shortestSide = Math.min(window.screen.width, window.screen.height);
    const isPhone = shortestSide < 600;
    const isTablet = shortestSide >= 600 && shortestSide < 1024;
    if (isPhone && isPortrait) {
        landscapeBlocker.style.display = 'flex';
    } else if (isTablet && isLandscape) {
        portraitBlocker.style.display = 'flex';
    }
}
document.addEventListener('DOMContentLoaded', handleOrientation);
window.addEventListener('resize', handleOrientation);
window.addEventListener('orientationchange', handleOrientation);
// --- END: Complete and Unified Orientation Handler ---