// --- Firebase and Global Variable Setup ---
const db = firebase.firestore();
const auth = firebase.auth();

let currentUserTornId = null;
let currentUserTornApiKey = null;
let currentUserData = null;
let isCurrentlyListed = false;
let currentUserIsLeader = false;

// Add any user IDs here that should be exempt from the faction check.
const EXEMPT_USER_IDS = ['2662550']; 

// --- DOM Elements ---
const factionsSeekingMembersTbody = document.getElementById('factions-seeking-members-tbody');
const playersSeekingFactionsTbody = document.getElementById('players-seeking-factions-tbody');
const listSelfButton = document.getElementById('list-self-button');
const advertiseFactionButton = document.getElementById('advertise-faction-button');

// NEW: Modal DOM Elements
const modalOverlay = document.getElementById('confirmation-modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalText = document.getElementById('modal-text');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const modalConfirmBtn = document.getElementById('modal-confirm-btn');
const modalRememberCheckbox = document.getElementById('modal-remember-checkbox');


// --- Utility Functions ---
function formatNumber(num) {
    if (!num) return '0';
    if (num >= 1000000000) return (num / 1000000000).toFixed(1) + 'B';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

// --- Reusable Confirmation Modal Function ---
function showConfirmation(title, text, preferenceKey) {
    if (localStorage.getItem(preferenceKey) === 'true') {
        return Promise.resolve({ confirmed: true, remember: true });
    }
    return new Promise(resolve => {
        modalTitle.textContent = title;
        modalText.textContent = text;
        modalRememberCheckbox.checked = false;
        modalOverlay.style.display = 'flex';
        const handleConfirm = () => {
            if (modalRememberCheckbox.checked) {
                localStorage.setItem(preferenceKey, 'true');
            }
            cleanup();
            resolve({ confirmed: true });
        };
        const handleCancel = () => {
            cleanup();
            resolve({ confirmed: false });
        };
        const cleanup = () => {
            modalOverlay.style.display = 'none';
            modalConfirmBtn.removeEventListener('click', handleConfirm);
            modalCancelBtn.removeEventListener('click', handleCancel);
        };
        modalConfirmBtn.addEventListener('click', handleConfirm);
        modalCancelBtn.addEventListener('click', handleCancel);
    });
}


// --- Core Functions for Recruitment ---

async function displayFactionsSeekingMembers() {
    if (!factionsSeekingMembersTbody) return;
    factionsSeekingMembersTbody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
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
            tableHtml += `<tr><td><a href="${profileUrl}" target="_blank">${faction.factionName} [${faction.factionId}]</a></td><td>${faction.totalMembers||'N/A'}</td><td>${faction.contactInfo||'N/A'}</td><td><button class="action-button enlist-button" data-faction-id="${faction.factionId}">Enlist</button></td></tr>`;
        });
        factionsSeekingMembersTbody.innerHTML = tableHtml;
    } catch (error) {
        console.error("Error displaying factions:", error);
    }
}

async function listSelfForRecruitment() {
    listSelfButton.disabled = true;
    listSelfButton.textContent = 'Listing...';
    try {
        const userDoc = await db.collection('users').doc(String(currentUserTornId)).get();
        if (!userDoc.exists) throw new Error("User data not found.");
        const userData = userDoc.data();
        const bStats = userData.battlestats || {};
        const pStats = userData.personalstats || {};
        const data = {
            playerId: String(currentUserTornId),
            playerName: userData.name || 'N/A',
            playerLevel: userData.level || 0,
            totalStats: bStats.total || 0,
            xanaxTaken: pStats.xantaken || 0,
            warHits: pStats.rankedwarhits || 0,
            energyRefills: pStats.refills || 0,
            bestActiveStreak: pStats.bestactivestreak || 0,
            listingTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
            firebaseUid: auth.currentUser.uid,
            isActive: true
        };
        await db.collection('playersSeekingFactions').doc(auth.currentUser.uid).set(data, { merge: true });
        console.log("Player listed:", auth.currentUser.uid);
    } catch (error) {
        console.error("Error during self-listing:", error);
        alert(`Failed to list yourself: ${error.message}`);
    }
}

async function removeSelfFromRecruitment() {
    listSelfButton.disabled = true;
    listSelfButton.textContent = 'Removing...';
    try {
        await db.collection('playersSeekingFactions').doc(auth.currentUser.uid).delete();
        console.log("Player listing removed:", auth.currentUser.uid);
    } catch (error) {
        console.error("Error removing listing:", error);
        alert(`Failed to remove listing: ${error.message}`);
    }
}

async function advertiseFaction() {
    advertiseFactionButton.disabled = true;
    advertiseFactionButton.textContent = 'Working...';
    try {
        const factionId = currentUserData?.faction_id;
        if (!factionId) throw new Error("Faction ID not found in your profile.");
        const apiUrl = `https://api.torn.com/v2/faction/${factionId}?selections=basic,members&key=${currentUserTornApiKey}&comment=MyTornPA`;
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Torn API request failed.");
        const data = await response.json();
        if (data.error) throw new Error(`Torn API: ${data.error.error}`);
        
        const contactInfo = prompt(`Please provide contact info for ${data.name} (e.g., Discord Tag, Torn Mail ID):`);
        if (!contactInfo) {
             advertiseFactionButton.disabled = false;
             advertiseFactionButton.textContent = 'Advertise My Faction';
             return;
        }

        const listingData = {
            factionId: String(factionId),
            factionName: data.name || 'N/A',
            totalMembers: data.members ? Object.keys(data.members).length : 0,
            contactInfo: contactInfo.trim(),
            listingTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
            firebaseUid: auth.currentUser.uid,
            isActive: true
        };
        await db.collection('recruitingFactions').doc(String(factionId)).set(listingData, { merge: true });
        console.log("Faction advertised:", factionId);
        alert("Faction advertised successfully!");
    } catch (error) {
        console.error("Error advertising faction:", error);
        alert(`Failed to advertise: ${error.message}`);
    } finally {
        advertiseFactionButton.disabled = false;
        advertiseFactionButton.textContent = 'Advertise My Faction';
        displayFactionsSeekingMembers();
    }
}


// --- Main Initialization for Page ---
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            const userProfileDoc = await db.collection('userProfiles').doc(user.uid).get();
            currentUserData = userProfileDoc.exists ? userProfileDoc.data() : {};
            currentUserTornId = currentUserData.tornProfileId || null;
            currentUserTornApiKey = currentUserData.tornApiKey || null;
            currentUserIsLeader = ['Leader', 'Co-leader'].includes(currentUserData.position);
            
            if (advertiseFactionButton) advertiseFactionButton.style.display = currentUserIsLeader ? 'block' : 'none';

            const hasFaction = currentUserData.faction_id && currentUserData.faction_id != 0;
            const isExemptUser = EXEMPT_USER_IDS.includes(String(currentUserTornId));
            const isInDisallowedFaction = hasFaction && !isExemptUser;

            if (listSelfButton) {
                if (isInDisallowedFaction) {
                    listSelfButton.disabled = true;
                    listSelfButton.textContent = 'In a Faction';
                    listSelfButton.title = 'You cannot list yourself while in a faction.';
                } else {
                    listSelfButton.disabled = false;
                    listSelfButton.title = '';
                    const listingDoc = await db.collection('playersSeekingFactions').doc(user.uid).get();
                    isCurrentlyListed = listingDoc.exists;
                    listSelfButton.textContent = isCurrentlyListed ? 'Remove Listing' : 'List Myself';
                    listSelfButton.classList.toggle('remove', isCurrentlyListed);
                }
            }

            if (!currentUserTornApiKey) {
                if (advertiseFactionButton) advertiseFactionButton.disabled = true;
            } else {
                 if (advertiseFactionButton) advertiseFactionButton.disabled = !currentUserIsLeader;
            }

        } else {
            Object.assign(this, { currentUserTornId: null, currentUserTornApiKey: null, currentUserData: null, isCurrentlyListed: false, currentUserIsLeader: false });
            if(listSelfButton) {
                listSelfButton.disabled = true;
                listSelfButton.classList.remove('remove');
            }
            if(advertiseFactionButton) advertiseFactionButton.style.display = 'none';
        }
        
        displayFactionsSeekingMembers();
        // 🔺 THIS IS THE LINE I HAVE CORRECTED 🔺
        displayPlayersSeekingFactions(); 
    });

    // --- EVENT LISTENERS ---

    if (listSelfButton) {
        listSelfButton.addEventListener('click', async () => {
            if (isCurrentlyListed) {
                const prefKey = 'mytornpa_confirm_remove_self';
                const result = await showConfirmation('Remove Listing', 'Are you sure you want to remove your listing?', prefKey);
                if (result.confirmed) {
                    await removeSelfFromRecruitment();
                    isCurrentlyListed = false;
                    listSelfButton.textContent = 'List Myself';
                    listSelfButton.classList.remove('remove');
                    listSelfButton.disabled = false;
                    displayPlayersSeekingFactions();
                }
            } else {
                const prefKey = 'mytornpa_confirm_list_self';
                const result = await showConfirmation('Confirm Listing', 'Are you sure you want to list yourself? Anyone will be able to view your live stats.', prefKey);
                if (result.confirmed) {
                    await listSelfForRecruitment();
                    isCurrentlyListed = true;
                    listSelfButton.textContent = 'Remove Listing';
                    listSelfButton.classList.add('remove');
                    listSelfButton.disabled = false;
                    displayPlayersSeekingFactions();
                }
            }
        });
    }

    if (advertiseFactionButton) {
        advertiseFactionButton.addEventListener('click', async () => {
            const prefKey = 'mytornpa_confirm_advertise_faction';
            const result = await showConfirmation('Advertise Faction', 'Are you sure you want to advertise your faction?', prefKey);
            if (result.confirmed) {
                advertiseFaction();
            }
        });
    }
});