/* ==========================================================================
   War Page Hub JavaScript (war_page_hub.js)
   ========================================================================== */

// --- Global Variables and Utility Functions ---

// Firebase references (assuming firebase-init.js is included correctly and sets window.db, window.auth)
const db = firebase.firestore();
const auth = firebase.auth();

// Constants specific to Fair Fight display (from fairfight.js)
// These are included directly for local calculations and display
const FF_VERSION = "MyTornPA-FF-1.0";
const BLUE_ARROW = "../../images/blue-arrow.svg"; // Path adjusted for pages/ folder
const GREEN_ARROW = "../../images/green-arrow.svg"; // Path adjusted for pages/ folder
const RED_ARROW = "../../images/red.svg"; // Path adjusted for pages/ folder (assuming 'red.svg' from earlier discussion)

// Allowed admin UIDs for Leader Config Tab (from admin_dashboard.js concept)
// IMPORTANT: Add your actual admin UIDs here.
const ALLOWED_ADMIN_UIDS = [
    "OxwatQjtUCPtLSBUrBqVseBpqeT2", // YOUR ADMIN UID
    // "ANOTHER_ADMIN_UID_HERE",
];


// Color utility functions (from fairfight.js)
function rgbToHex(r, g, b) {
    return (
        "#" +
        ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()
    );
}

function get_ff_colour(value) {
    let r, g, b;
    if (value <= 1) {
        r = 0x28; g = 0x28; b = 0xc6; // Blue
    } else if (value <= 3) {
        const t = (value - 1) / 2;
        r = 0x28; g = Math.round(0x28 + (0xc6 - 0x28) * t); b = Math.round(0xc6 - (0xc6 - 0x28) * t);
    } else if (value <= 5) {
        const t = (value - 3) / 2;
        r = Math.round(0x28 + (0xc6 - 0x28) * t); g = Math.round(0xc6 - (0xc6 - 0x28) * t); b = 0x28;
    } else {
        r = 0xc6; g = 0x28; b = 0x28; // Red
    }
    return rgbToHex(r, g, b);
}

function get_contrast_color(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = r * 0.299 + g * 0.587 + b * 0.114;
    return brightness > 126 ? "black" : "white";
}

function get_difficulty_text(ff) {
    if (ff <= 1) return "Extremely easy";
    else if (ff <= 2) return "Easy";
    else if (ff <= 3.5) return "Moderately difficult";
    else if (ff <= 4.5) return "Difficult";
    else return "May be impossible";
}

// Utility for formatting numbers (from fairfight.js)
function formatNumber(num) {
    if (num === "N/A" || num === null || num === undefined || isNaN(Number(num))) return "N/A";
    const number = Number(num);
    if (Math.abs(number) >= 1e9) return (number / 1e9).toFixed(2) + 'b';
    if (Math.abs(number) >= 1e6) return (number / 1e6).toFixed(2) + 'm';
    if (Math.abs(number) >= 1e3) return (number / 1e3).toFixed(0) + 'k';
    return number.toLocaleString();
}

// Time formatting functions (from home.js)
function formatTimeRemaining(secs) {
    if (secs <= 0) return "OK 😊";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatTimeAgo(tsSecs) {
    if (!tsSecs || tsSecs <= 0) return "just now";
    const diff = Math.floor(Date.now() / 1000) - tsSecs;
    if (diff < 2) return "just now"; if (diff < 60) return `${diff} sec ago`;
    const mins = Math.floor(diff / 60); if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
    const hrs = Math.floor(mins / 60); if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
    const days = Math.floor(hrs / 24); return `${days} day${days === 1 ? "" : "s"} ago`;
}

// Generic API fetcher with error handling (from home.js / activitywatch.js pattern)
async function fetchTornApi(url) {
    try {
        const r = await fetch(url);
        if (!r.ok) {
            let e;
            try { e = await r.json(); } catch (err) {}
            const m = e?.error?.error || e?.error?.message || `API Error ${r.status}`;
            throw new Error(m);
        }
        return r.json();
    } catch (err) {
        console.error("fetchTornApi error:", err);
        throw err;
    }
}

// Function to update a display span with countdown (from home.js)
let activeCooldownIntervals = {};
function updateStatDisplay(elementId, value, isCooldown = false, prefixText = "") {
    const element = document.getElementById(elementId);
    if (!element) { console.warn(`updateStatDisplay: Element ID ${elementId} not found.`); return; }
    
    // Clear any existing interval for this element
    if (activeCooldownIntervals[elementId]) clearInterval(activeCooldownIntervals[elementId]);
    delete activeCooldownIntervals[elementId];

    if (isCooldown && typeof value === 'number' && value > 0) {
        let remainingSeconds = value;
        const updateTimer = () => {
            if (remainingSeconds <= 0) {
                element.textContent = `${prefixText} OK 😊`;
                clearInterval(activeCooldownIntervals[elementId]);
                delete activeCooldownIntervals[elementId];
            } else {
                element.textContent = `${prefixText} ${formatTimeRemaining(remainingSeconds)}`;
                remainingSeconds--;
            }
        };
        updateTimer(); // Call immediately
        activeCooldownIntervals[elementId] = setInterval(updateTimer, 1000);
    } else {
        element.textContent = `${prefixText} ${value}`;
    }
}


// Function to copy text to clipboard (from home.js / activitywatch.js)
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true; // Success
    } catch (err) {
        console.error('Failed to copy: ', err);
        return false; // Failure
    }
}

// --- Tab Navigation Logic ---

// Function to show/hide tab content
function showTab(tabId) {
    const tabPanes = document.querySelectorAll('.tab-pane');
    tabPanes.forEach(pane => pane.classList.remove('active'));

    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => button.classList.remove('active'));

    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    const selectedButton = document.querySelector(`.tab-button[data-tab="${tabId.replace('-tab', '')}"]`);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }
    // Also, trigger specific load functions for the tab if needed
    if (tabId === 'announcements-tab') {
        loadGamePlan();
        loadWarStatus();
    } else if (tabId === 'active-ops-tab') {
        loadChainTimer();
        loadEnemyChainTimer();
        loadQuickFFTargets();
        loadEnemyTargets();
        loadFactionStats();
    } else if (tabId === 'friendly-status-tab') {
        loadFriendlyMembers();
    } else if (tabId === 'leader-config-tab') {
        loadGamePlanForEdit();
        loadEnergyTrackMembers(); // Assuming leaders select members
        loadDesignatedAdmins(); // Load list of designated admins
        loadWatchlist(); // Load big hitter watchlist
    }
}

// --- Initialization on DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
    // --- UI Element References ---
    const tabButtons = document.querySelectorAll('.tab-button');
    const copyGamePlanBtn = document.getElementById('copyGamePlanBtn');
    const postAnnouncementBtn = document.getElementById('postAnnouncementBtn');
    const quickAnnouncementInput = document.getElementById('quickAnnouncementInput');
    const alertHitterOnlineHospBtn = document.getElementById('alertHitterOnlineHospBtn');
    const alertHitterActiveBtn = document.getElementById('alertHitterActiveBtn');
    const alertEnemyActiveBtn = document.getElementById('alertEnemyActiveBtn');
    const saveGamePlanBtn = document.getElementById('saveGamePlanBtn');
    const gamePlanEditArea = document.getElementById('gamePlanEditArea');
    const addWatchEnemyBtn = document.getElementById('addWatchEnemyBtn');
    const watchEnemyIdInput = document.getElementById('watchEnemyIdInput');
    const addDesignateAdminBtn = document.getElementById('addDesignateAdminBtn');
    const designateAdminIdInput = document.getElementById('designateAdminIdInput');
    const designateAdminError = document.getElementById('designateAdminError');
    const saveEnergyTrackMembersBtn = document.getElementById('saveEnergyTrackMembersBtn');
    const energyTrackMemberSelect = document.getElementById('energyTrackMemberSelect');

    // --- Tab Switching Event Listeners ---
    tabButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const tabId = event.target.dataset.tab + '-tab';
            showTab(tabId);
        });
    });

    // --- Initial Tab Display ---
    // This will trigger initial load of content for the default active tab
    showTab('announcements-tab'); 

    // --- Event Listeners for Buttons/Inputs ---

    // Tab 1: War Announcements
    if (copyGamePlanBtn) {
        copyGamePlanBtn.addEventListener('click', async () => {
            const gamePlanText = document.getElementById('gamePlanDisplay').textContent;
            const copied = await copyToClipboard(gamePlanText);
            if (copied) {
                alert('Game plan copied to clipboard!');
            } else {
                alert('Failed to copy game plan.');
            }
        });
    }

    // Tab 2: Active War Operations (Alerts & Announcements - now moved)
    if (alertHitterOnlineHospBtn) {
        alertHitterOnlineHospBtn.addEventListener('click', () => {
            console.log('ALERT: Big Hitter Online (Self Hosp) triggered by user.');
            // Implement logic to send alert to faction chat/other members
            alert("Big Hitter Online: Self Hosp alert sent!");
        });
    }
    if (alertHitterActiveBtn) {
        alertHitterActiveBtn.addEventListener('click', () => {
            console.log('ALERT: Big Hitter Active triggered by user.');
            alert("Big Hitter Active alert sent!");
        });
    }
    if (alertEnemyActiveBtn) {
        alertEnemyActiveBtn.addEventListener('click', () => {
            console.log('ALERT: Enemy Active triggered by user.');
            alert("Enemy Active alert sent!");
        });
    }

    // Tab 4: Leader War Configuration
    if (saveGamePlanBtn) {
        saveGamePlanBtn.addEventListener('click', async () => {
            const newGamePlan = gamePlanEditArea.value;
            try {
                await db.collection('factionWars').doc('currentWar').update({ gamePlan: newGamePlan });
                loadGamePlan(); // Refresh the displayed game plan on Tab 1
                alert('Game plan saved successfully!');
            } catch (error) {
                console.error('Error saving game plan:', error);
                alert('Error saving game plan. Check console for details.');
            }
        });
    }

    // Faction Announcement (Moved to Tab 4)
    if (postAnnouncementBtn) {
        postAnnouncementBtn.addEventListener('click', async () => {
            const message = quickAnnouncementInput.value;
            if (message.trim() !== '') {
                // Implement logic to post the announcement (e.g., to a Firestore collection for announcements)
                console.log('Posting announcement:', message);
                alert('Announcement posted!'); // Placeholder
                quickAnnouncementInput.value = ''; // Clear input
            } else {
                alert('Announcement cannot be empty.');
            }
        });
    }
    
    // Big Hitter Watchlist
    if (addWatchEnemyBtn) {
        addWatchEnemyBtn.addEventListener('click', async () => {
            const enemyId = watchEnemyIdInput.value.trim();
            if (enemyId === '') { alert("Enemy ID cannot be empty."); return; }
            // Add logic to save to user's watchlist in Firestore or directly to current war config
            console.log('Adding to watchlist:', enemyId);
            alert(`Enemy ID ${enemyId} added to watchlist! (Placeholder)`);
            watchEnemyIdInput.value = '';
            // Refresh watchlist display
            await loadWatchlist();
        });
    }
    // Need logic to load and render watchlist from Firestore for #watchListDisplay
    async function loadWatchlist() {
        const watchListDisplay = document.getElementById('watchListDisplay');
        if (!watchListDisplay) return;
        watchListDisplay.innerHTML = '<p>Loading watchlist...</p>';
        try {
            // Assume watchlist is stored in factionWars/currentWar or a specific admin profile
            // For simplicity, let's assume it's part of factionWars for now
            const doc = await db.collection('factionWars').doc('currentWar').get();
            const watchlist = doc.exists ? (doc.data().bigHitterWatchlist || []) : [];
            
            if (watchlist.length > 0) {
                watchListDisplay.innerHTML = watchlist.map(id => `<li>${id} <button class="remove-btn" data-id="${id}">Remove</button></li>`).join('');
                watchListDisplay.querySelectorAll('.remove-btn').forEach(btn => {
                    btn.addEventListener('click', async (event) => {
                        const idToRemove = event.target.dataset.id;
                        // Implement remove logic
                        console.log('Removing from watchlist:', idToRemove);
                        alert(`Removed ${idToRemove} from watchlist! (Placeholder)`);
                        await loadWatchlist(); // Refresh list
                    });
                });
            } else {
                watchListDisplay.innerHTML = '<p>No enemies in watchlist.</p>';
            }
        } catch (error) {
            console.error('Error loading watchlist:', error);
            watchListDisplay.innerHTML = '<p style="color:red;">Error loading watchlist.</p>';
        }
    }


    // Designated Tab 4 Admins
    if (addDesignateAdminBtn) {
        addDesignateAdminBtn.addEventListener('click', async () => {
            const adminId = designateAdminIdInput.value.trim();
            if (adminId === '') { alert("Member UID cannot be empty."); return; }

            const user = auth.currentUser;
            if (!user) { alert("You must be logged in to designate admins."); return; }

            const designatedAdminsList = document.getElementById('designatedAdminsList');
            const currentAdmins = designatedAdminsList ? Array.from(designatedAdminsList.children).map(li => li.dataset.uid) : [];

            if (currentAdmins.length >= 5) {
                designateAdminError.textContent = 'Maximum 5 added IDs.';
                return;
            }
            if (currentAdmins.includes(adminId)) {
                designateAdminError.textContent = 'UID already added.';
                return;
            }

            try {
                // For simplicity, store designated admins on the current user's profile or factionWars document
                // Let's assume on current user's profile for now, under 'designatedAdminUids' field
                const userProfileRef = db.collection('userProfiles').doc(user.uid);
                await userProfileRef.set({
                    designatedAdminUids: firebase.firestore.FieldValue.arrayUnion(adminId)
                }, { merge: true });
                
                console.log('Added designated admin:', adminId);
                alert(`Admin ${adminId} added! (Placeholder)`);
                designateAdminIdInput.value = '';
                designateAdminError.textContent = '';
                await loadDesignatedAdmins(); // Refresh list
            } catch (error) {
                console.error('Error adding designated admin:', error);
                designateAdminError.textContent = `Error adding admin: ${error.message}`;
            }
        });
    }
    // Need logic to load and render designated admins from Firestore for #designatedAdminsList
    async function loadDesignatedAdmins() {
        const designatedAdminsList = document.getElementById('designatedAdminsList');
        if (!designatedAdminsList) return;
        designatedAdminsList.innerHTML = '<p>Loading designated admins...</p>';
        try {
            const user = auth.currentUser;
            if (!user) { designatedAdminsList.innerHTML = '<p>Sign in to manage admins.</p>'; return; }

            // Assume designated admins are stored in the current admin's user profile
            const doc = await db.collection('userProfiles').doc(user.uid).get();
            const designatedUids = doc.exists ? (doc.data().designatedAdminUids || []) : [];

            if (designatedUids.length > 0) {
                designatedAdminsList.innerHTML = designatedUids.map(uid => `<li data-uid="${uid}">${uid} <button class="remove-btn" data-uid="${uid}">Remove</button></li>`).join('');
                designatedAdminsList.querySelectorAll('.remove-btn').forEach(btn => {
                    btn.addEventListener('click', async (event) => {
                        const uidToRemove = event.target.dataset.uid;
                        // Implement remove logic
                        console.log('Removing designated admin:', uidToRemove);
                        const userProfileRef = db.collection('userProfiles').doc(user.uid);
                        await userProfileRef.update({
                            designatedAdminUids: firebase.firestore.FieldValue.arrayRemove(uidToRemove)
                        });
                        alert(`Removed ${uidToRemove}!`);
                        await loadDesignatedAdmins(); // Refresh list
                    });
                });
            } else {
                designatedAdminsList.innerHTML = '<p>No designated admins.</p>';
            }
        } catch (error) {
            console.error('Error loading designated admins:', error);
            designatedAdminsList.innerHTML = '<p style="color:red;">Error loading admins.</p>';
        }
    }


    // Energy Tracking Members
    // Need logic to populate select with faction members and save selections
    async function loadEnergyTrackMembers() {
        const select = document.getElementById('energyTrackMemberSelect');
        if (!select) return;
        select.innerHTML = '<option value="">Loading members...</option>';
        try {
            const user = auth.currentUser;
            if (!user) { select.innerHTML = '<option value="">Sign in for members</option>'; return; }
            
            const userProfile = await db.collection('userProfiles').doc(user.uid).get();
            const tornApiKey = userProfile.exists ? userProfile.data().tornApiKey : null;
            const tornProfileId = userProfile.exists ? userProfile.data().tornProfileId : null;

            if (!tornApiKey || !tornProfileId) {
                select.innerHTML = '<option value="">API Key/Profile ID missing</option>';
                alert("Your Torn API Key and Profile ID are required to fetch faction members for energy tracking. Please update your profile.");
                return;
            }

            // Fetch user's own faction ID from Torn API first
            const userApiData = await fetchTornApi(`https://api.torn.com/user/${tornProfileId}?selections=profile&key=${tornApiKey}`);
            const factionId = userApiData.faction.faction_id;

            if (!factionId) {
                select.innerHTML = '<option value="">Not in a faction</option>';
                alert("You are not in a faction. Cannot load faction members for energy tracking.");
                return;
            }

            // Fetch faction members
            const factionData = await fetchTornApi(`https://api.torn.com/faction/${factionId}?selections=basic&key=${tornApiKey}`);
            const members = Object.values(factionData.members || {});
            
            select.innerHTML = ''; // Clear loading message
            members.sort((a,b) => a.name.localeCompare(b.name)).forEach(member => {
                const option = document.createElement('option');
                option.value = member.id; // Use Torn ID as value
                option.textContent = member.name;
                select.appendChild(option);
            });

            // Load saved selections
            const savedConfig = await db.collection('factionWars').doc('currentWar').get();
            const trackedMembers = savedConfig.exists ? (savedConfig.data().energyTrackedMembers || []) : [];
            Array.from(select.options).forEach(option => {
                if (trackedMembers.includes(option.value)) {
                    option.selected = true;
                }
            });

        } catch (error) {
            console.error('Error loading energy track members:', error);
            select.innerHTML = '<option value="">Error loading members</option>';
        }
    }

    if (saveEnergyTrackMembersBtn) {
        saveEnergyTrackMembersBtn.addEventListener('click', async () => {
            const selectedMembers = Array.from(energyTrackMemberSelect.selectedOptions).map(option => option.value);
            try {
                // Save selected member UIDs to factionWars/currentWar document
                await db.collection('factionWars').doc('currentWar').set({
                    energyTrackedMembers: selectedMembers
                }, { merge: true });
                alert('Energy tracking members saved!');
            } catch (error) {
                console.error('Error saving energy tracking members:', error);
                alert('Error saving energy tracking members.');
            }
        });
    }


// --- Main Initialization Function Calls (on initial page load) ---
// This ensures content is loaded for the currently active tab
auth.onAuthStateChanged(user => { // Wait for auth state to be known
    if (user) {
        // Only load data if user is authenticated
        loadGamePlan();
        loadWarStatus();
        loadChainTimer(); // Placeholder for now
        loadEnemyChainTimer(); // Placeholder for now
        loadQuickFFTargets(); // Placeholder for now
        loadEnemyTargets(); // Placeholder for now
        loadFactionStats(); // Placeholder for now
        loadFriendlyMembers(); // Placeholder for now
        loadGamePlanForEdit();
        loadDesignatedAdmins(); // Load designated admins on load
        loadWatchlist(); // Load big hitter watchlist on load
        loadEnergyTrackMembers(); // Load members for tracking setup
    } else {
        // Clear/hide content if user is not authenticated
        // This is handled by main auth listener in globalheader.js and redirects
    }
});