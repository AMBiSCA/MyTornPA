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
// To add more UIDs, simply add another comma-separated UID string in this array.
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

// Function to update a display span with countdown (adapted from home.js)
let activeCountdownIntervals = {}; // Use a unique name to avoid conflicts if globalheader/home.js are also present
function updateCountdownDisplay(elementId, value, isCooldown = false, prefixText = "") {
    const element = document.getElementById(elementId);
    if (!element) { console.warn(`updateCountdownDisplay: Element ID ${elementId} not found.`); return; }
    
    // Clear any existing interval for this element
    if (activeCountdownIntervals[elementId]) clearInterval(activeCountdownIntervals[elementId]);
    delete activeCountdownIntervals[elementId];

    if (isCooldown && typeof value === 'number' && value > 0) {
        let remainingSeconds = value;
        const updateTimer = () => {
            if (remainingSeconds <= 0) {
                element.textContent = `${prefixText} OK 😊`;
                clearInterval(activeCountdownIntervals[elementId]);
                delete activeCountdownIntervals[elementId];
            } else {
                element.textContent = `${prefixText} ${formatTimeRemaining(remainingSeconds)}`;
                remainingSeconds--;
            }
        };
        updateTimer(); // Call immediately
        activeCountdownIntervals[elementId] = setInterval(updateTimer, 1000);
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
        loadChainTimersAndNumbers(); // Corrected function name
        loadQuickFFTargets();
        loadEnemyTargets();
        loadFactionStats();
    } else if (tabId === 'friendly-status-tab') {
        loadFriendlyMembers();
    } else if (tabId === 'leader-config-tab') {
        // Check for admin access before loading leader config
        auth.onAuthStateChanged(user => {
            if (user && ALLOWED_ADMIN_UIDS.includes(user.uid)) {
                loadGamePlanForEdit();
                // Moved Quick Announce input/button here (HTML change implies its presence)
                // Its JS handler is defined below.
                loadWatchlist(); 
                loadDesignatedAdmins(); 
                loadEnergyTrackMembers(); 
            } else {
                // If not authorized, clear/hide config content or show message
                const leaderConfigTab = document.getElementById('leader-config-tab');
                if (leaderConfigTab) {
                    leaderConfigTab.innerHTML = '<p style="color:red; text-align:center;">You do not have permission to view this tab.</p>';
                }
            }
        });
    }
}

// --- Initialization on DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
    // --- UI Element References (All main elements used across tabs) ---
    const copyGamePlanBtn = document.getElementById('copyGamePlanBtn');
    const postAnnouncementBtn = document.getElementById('postAnnouncementBtn');
    const quickAnnouncementInput = document.getElementById('quickAnnouncementInput'); // Now in Tab 4
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

    // Tab buttons for initial setup
    const tabButtons = document.querySelectorAll('.tab-button');

    // --- Tab Switching Event Listeners ---
    tabButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const tabId = event.target.dataset.tab + '-tab';
            showTab(tabId);
        });
    });

    // --- Initial Page Load & Auth State Check ---
    auth.onAuthStateChanged(user => {
        if (!user) {
            // User not logged in, redirect to index/login page
            console.log("War Hub: No user signed in. Redirecting to /index.html.");
            window.location.href = '/index.html';
            return; // Stop further execution
        }

        // User is logged in, but check if allowed admin for the whole War Hub
        // (This initial check is important if the page itself should be restricted)
        // If ALLOWED_ADMIN_UIDS is intended for leader-config tab only, remove this outer check
        // For now, let's keep the whole page accessible but restrict Leader Config tab content
        
        console.log("War Hub: User is signed in. Initializing data loads.");
        // This will trigger initial load of content for the default active tab
        showTab('announcements-tab'); // Show default tab and load its content

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

        // Tab 2: Active War Operations (Alerts - UI moved to Tab 4 for posting)
        if (alertHitterOnlineHospBtn) {
            alertHitterOnlineHospBtn.addEventListener('click', () => {
                console.log('ALERT: Big Hitter Online (Self Hosp) triggered by user.');
                alert("Big Hitter Online: Self Hosp alert sent! (Placeholder)");
            });
        }
        if (alertHitterActiveBtn) {
            alertHitterActiveBtn.addEventListener('click', () => {
                console.log('ALERT: Big Hitter Active triggered by user.');
                alert("Big Hitter Active alert sent! (Placeholder)");
            });
        }
        if (alertEnemyActiveBtn) {
            alertEnemyActiveBtn.addEventListener('click', () => {
                console.log('ALERT: Enemy Active triggered by user.');
                alert("Enemy Active alert sent! (Placeholder)");
            });
        }

        // Tab 4: Leader War Configuration (Actions)
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
                    alert('Announcement posted! (Placeholder)'); 
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
                await loadWatchlist(); // Refresh watchlist display
            });
        }

        // Designated Tab 4 Admins
        if (addDesignateAdminBtn) {
            addDesignateAdminBtn.addEventListener('click', async () => {
                const adminId = designateAdminIdInput.value.trim();
                if (adminId === '') { alert("Member UID cannot be empty."); return; }

                const user = auth.currentUser;
                if (!user) { alert("You must be logged in to designate admins."); return; }

                const designatedAdminsList = document.getElementById('designatedAdminsList');
                // Ensure list exists before trying to get children
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
                    const userProfileRef = db.collection('userProfiles').doc(user.uid);
                    await userProfileRef.set({
                        designatedAdminUids: firebase.firestore.FieldValue.arrayUnion(adminId)
                    }, { merge: true });
                    
                    console.log('Added designated admin:', adminId);
                    alert(`Admin ${adminId} added!`);
                    designateAdminIdInput.value = '';
                    designateAdminError.textContent = '';
                    await loadDesignatedAdmins(); // Refresh list
                } catch (error) {
                    console.error('Error adding designated admin:', error);
                    designateAdminError.textContent = `Error adding admin: ${error.message}`;
                }
            });
        }
    
        // Save Energy Tracking Members
        if (saveEnergyTrackMembersBtn) {
            saveEnergyTrackMembersBtn.addEventListener('click', async () => {
                const selectedMembers = Array.from(energyTrackMemberSelect.selectedOptions).map(option => option.value);
                try {
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
    } // End of auth.onAuthStateChanged (user logged in)
); // End of DOMContentLoaded

// --- TAB-SPECIFIC DATA LOADING FUNCTIONS (Called by showTab and initial load) ---

// Tab 1: War Announcements Functions
async function loadGamePlan() {
    try {
        const doc = await db.collection('factionWars').doc('currentWar').get();
        const gamePlanDisplay = document.getElementById('gamePlanDisplay');
        if (doc.exists) {
            gamePlanDisplay.textContent = doc.data().gamePlan || 'No game plan available.';
        } else {
            gamePlanDisplay.textContent = 'No war document found.';
        }
    } catch (error) {
        console.error('Error loading game plan:', error);
        document.getElementById('gamePlanDisplay').textContent = 'Error loading game plan.';
        document.getElementById('gamePlanDisplay').style.color = 'red';
    }
}

async function loadWarStatus() {
    try {
        const doc = await db.collection('factionWars').doc('currentWar').get();
        if (doc.exists) {
            const warData = doc.data();
            updateCountdownDisplay('warTermedStatus', warData.termed ? 'Yes' : 'No', false, '');
            updateCountdownDisplay('warTermedWinLoss', warData.termedWinLoss || 'N/A', false, '');
            updateCountdownDisplay('warChainingStatus', warData.chaining ? 'Yes' : 'No', false, '');
            updateCountdownDisplay('warNoFlyingStatus', warData.noFlying ? 'Yes' : 'No', false, '');
            updateCountdownDisplay('warTurtleStatus', warData.turtleMode ? 'Yes' : 'No', false, '');
        } else {
            updateCountdownDisplay('warTermedStatus', 'N/A', false, '');
            updateCountdownDisplay('warTermedWinLoss', 'N/A', false, '');
            updateCountdownDisplay('warChainingStatus', 'N/A', false, '');
            updateCountdownDisplay('warNoFlyingStatus', 'N/A', false, '');
            updateCountdownDisplay('warTurtleStatus', 'N/A', false, '');
        }
    } catch (error) {
        console.error('Error loading war status:', error);
        document.getElementById('warTermedStatus').textContent = 'Error';
        // ... (rest of the status fields would also show error)
    }
}


// Tab 2: Active War Operations Functions
async function loadChainTimersAndNumbers() {
    // Placeholder logic for chain timers and current chain number
    // Real implementation would fetch from Torn API (faction chains)
    updateCountdownDisplay('chainTimerDisplay', 3600, true, ''); // 1 hour remaining
    document.getElementById('currentChainNumberDisplay').textContent = 'Chain: 1234'; // Placeholder
    
    updateCountdownDisplay('enemyChainTimerDisplay', 1800, true, ''); // 30 mins remaining
    document.getElementById('enemyCurrentChainNumberDisplay').textContent = 'Enemy Chain: 567'; // Placeholder
}

async function loadQuickFFTargets() {
    // Implement logic to fetch and display 2 quick FF targets side-by-side
    // This would ideally use a Netlify Function tailored for "quick" targets.
    // For now, using placeholders.
    const target1El = document.getElementById('quickFFTarget1');
    const target2El = document.getElementById('quickFFTarget2');

    if (target1El) target1El.textContent = 'Target A [123] (FF: 2.5)';
    if (target2El) target2El.textContent = 'Target B [456] (FF: 2.8)';
}

async function loadEnemyTargets() {
    // Implement logic to fetch and display the enemy targets list
    // This will likely call a Netlify Function that gets FF data for a set of enemies.
    // Example uses placeholder data and demonstrates structure.
    const enemyTargetsListEl = document.getElementById('enemyTargetsList');
    try {
        const placeholderTargets = [
            { id: '1123', name: 'Enemy 1', ff: 2.1, difficulty: 'Easy', estStats: '10k', hospitalTime: 600, jailTime: 0, traveling: false, statusText: 'Okay', statusColor: 'green' },
            { id: '1234', name: 'Enemy 2', ff: 3.5, difficulty: 'Moderately difficult', estStats: '50k', hospitalTime: 0, jailTime: 0, traveling: true, statusText: 'Traveling', statusColor: 'blue' },
            { id: '5678', name: 'Enemy 3', ff: 4.8, difficulty: 'Difficult', estStats: '100k', hospitalTime: 0, jailTime: 3600, traveling: false, statusText: 'In Jail', statusColor: 'orange' },
            // ... more targets
        ];

        // Sort by hospital timer for now (shortest first for quick targets)
        placeholderTargets.sort((a,b) => a.hospitalTime - b.hospitalTime);

        const targetRowsHtml = placeholderTargets.map(target => {
            const ffColor = get_ff_colour(target.ff);
            const contrastColor = get_contrast_color(ffColor);
            const difficultyText = get_difficulty_text(target.ff);

            const hospitalDisplay = target.hospitalTime > 0 ? formatTimeRemaining(target.hospitalTime) : 'No';
            
            return `
                <div class="enemy-target-row">
                    <span>${target.name} [${target.id}]</span>
                    <span style="background-color:${ffColor}; color:${contrastColor};">${target.ff.toFixed(2)}</span>
                    <span class="difficulty-${difficultyText.toLowerCase().replace(/\s/g, '-')}}">${difficultyText}</span>
                    <span>${target.estStats}</span>
                    <span class="status-hospital">${hospitalDisplay}</span> <span><button class="action-btn attack-btn" data-playerid="${target.id}">Attack</button></span>
                    <span><button class="action-btn claim-btn" data-playerid="${target.id}">Claim!</button></span>
                </div>
            `;
        }).join('');
        enemyTargetsListEl.innerHTML = targetRowsHtml;

        // Attach event listeners for Attack and Claim buttons
        enemyTargetsListEl.querySelectorAll('.attack-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const playerId = event.target.dataset.playerid;
                // Open Torn attack page in a new smaller popup window
                window.open(`https://www.torn.com/loader.php?sid=attack&user2ID=${playerId}`, `_blank`, 'width=1000,height=700,scrollbars=yes,resizable=yes');
                console.log(`Opening attack page for ${playerId} in a popup.`);
            });
        });

        enemyTargetsListEl.querySelectorAll('.claim-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const playerId = event.target.dataset.playerid;
                // Implement claim logic (e.g., update Firestore, post to chat)
                console.log(`Player claimed target: ${playerId}`);
                button.textContent = 'Claimed!';
                button.disabled = true; // Disable after claiming
                // Optional: update Firestore with claimer's UID and timestamp
                // db.collection('factionWars').doc('currentWar').collection('claims').add({
                //     targetId: playerId,
                //     claimerUid: auth.currentUser.uid,
                //     timestamp: firebase.firestore.FieldValue.serverTimestamp()
                // });
            });
        });

        // Hover for Xanax/Refill Info (Placeholder for data, but debounce implemented)
        let hoverTimeout;
        let lastHoveredElement = null;
        enemyTargetsListEl.querySelectorAll('.enemy-target-row').forEach(row => {
            row.addEventListener('mouseenter', (event) => {
                const playerId = event.currentTarget.querySelector('.attack-btn').dataset.playerid;
                // Clear any pending timeout
                clearTimeout(hoverTimeout);

                // If hovering over a different element than the last one, apply delay
                if (lastHoveredElement !== event.currentTarget) {
                    hoverTimeout = setTimeout(() => {
                        console.log(`Hovering over ${playerId} for detailed info (after delay).`);
                        // Display detailed info box (Xanax/refill, temp, strongest stat)
                        // This would be a separate popover/tooltip element.
                        // For now, just an alert/console log for placeholder.
                        // alert(`Detailed info for ${playerId}: Xanax: X, Temp: Y, Strongest: Z`);
                        lastHoveredElement = event.currentTarget; // Set current as last hovered
                    }, 300); // 300ms delay before showing
                }
            });

            row.addEventListener('mouseleave', () => {
                clearTimeout(hoverTimeout); // Clear timeout if mouse leaves
                // Hide detailed info box
                // console.log("Mouse left target row. Hiding details.");
                lastHoveredElement = null;
            });
        });

    } catch (error) {
        console.error('Error loading enemy targets:', error);
        enemyTargetsListEl.innerHTML = '<p style="color:red;">Error loading targets.</p>';
    }
}

async function loadFactionStats() {
    // Implement logic to fetch and display faction energy, potential hits, and chain progress
    // This will require fetching data for all faction members. Placeholder for now.
    document.getElementById('totalFactionEnergy').textContent = 'Loading...';
    document.getElementById('totalPotentialHits').textContent = 'Loading...';
    // Chain Progress is removed from HTML, its number integrated into chain timers.
}

// Tab 3: Friendly Faction Member Status Functions
async function loadFriendlyMembers() {
    const friendlyMembersListEl = document.getElementById('friendlyMembersList');
    friendlyMembersListEl.innerHTML = '<p>Loading friendly member status...</p>';
    try {
        const user = auth.currentUser;
        if (!user) { friendlyMembersListEl.innerHTML = '<p>Sign in to view friendly status.</p>'; return; }

        const userProfile = await db.collection('userProfiles').doc(user.uid).get();
        const tornApiKey = userProfile.exists ? userProfile.data().tornApiKey : null;
        const tornProfileId = userProfile.exists ? userProfile.data().tornProfileId : null;

        if (!tornApiKey || !tornProfileId) {
            friendlyMembersListEl.innerHTML = '<p style="color:orange;">API Key or Torn Profile ID missing. Update your profile.</p>';
            return;
        }

        // Fetch user's own faction ID from Torn API first
        const userApiData = await fetchTornApi(`https://api.torn.com/user/${tornProfileId}?selections=profile&key=${tornApiKey}`);
        const factionId = userApiData.faction.faction_id;

        if (!factionId) {
            friendlyMembersListEl.innerHTML = '<p>You are not in a faction. Cannot load friendly members.</p>';
            return;
        }

        // Fetch faction members
        const factionData = await fetchTornApi(`https://api.torn.com/faction/${factionId}?selections=basic&key=${tornApiKey}`);
        const membersArray = Object.values(factionData.members || {});
        
        friendlyMembersListEl.innerHTML = ''; // Clear loading message

        if (membersArray.length === 0) {
            friendlyMembersListEl.innerHTML = '<p>No members found in your faction.</p>';
            return;
        }

        // Sort members alphabetically by name
        membersArray.sort((a,b) => a.name.localeCompare(b.name));

        // Display members (simplified for now, full stats need more API calls or server-side)
        const memberRowsHtml = membersArray.map(member => {
            const lastActionTime = member.last_action ? formatTimeAgo(member.last_action.timestamp) : 'N/A';
            const statusText = member.last_action ? member.last_action.status : 'N/A';
            
            // Example of how to use status classes
            let statusClass = 'member-offline';
            if (statusText.includes("Online") || statusText.includes("idle")) statusClass = 'member-energy-high'; // Green for online/idle
            else if (statusText.includes("Hospital")) statusClass = 'member-hospital'; // Red for hospital
            else if (statusText.includes("Jail")) statusClass = 'member-energy-low'; // Yellow/orange for jail
            else if (statusText.includes("Traveling")) statusClass = 'member-energy-low'; // Yellow/orange for travel

            return `
                <div class="friendly-member-row">
                    <span>${member.name} [${member.id}]</span>
                    <span>Level: ${member.level || 'N/A'}</span>
                    <span class="${statusClass}">Status: ${statusText}</span>
                    <span>Last Active: ${lastActionTime}</span>
                </div>
            `;
        }).join('');
        friendlyMembersListEl.innerHTML = memberRowsHtml;

    } catch (error) {
        console.error('Error loading friendly members:', error);
        friendlyMembersListEl.innerHTML = `<p style="color:red;">Error loading friendly members: ${error.message}.</p>`;
    }
}


// Tab 4: Leader War Configuration Functions

// Load and render designated admins from Firestore
async function loadDesignatedAdmins() {
    const designatedAdminsListEl = document.getElementById('designatedAdminsList');
    if (!designatedAdminsListEl) return;
    designatedAdminsListEl.innerHTML = '<p>Loading designated admins...</p>';
    try {
        const user = auth.currentUser;
        if (!user) { designatedAdminsListEl.innerHTML = '<p>Sign in to manage admins.</p>'; return; }

        // Assume designated admins are stored in the current admin's user profile document
        const doc = await db.collection('userProfiles').doc(user.uid).get();
        const designatedUids = doc.exists ? (doc.data().designatedAdminUids || []) : [];

        if (designatedUids.length > 0) {
            // Fetch display names for UIDs if needed, otherwise just display UID
            designatedAdminsListEl.innerHTML = designatedUids.map(uid => 
                `<li data-uid="${uid}">${uid} <button class="remove-btn" data-uid="${uid}">Remove</button></li>`
            ).join('');
            
            designatedAdminsListEl.querySelectorAll('.remove-btn').forEach(btn => {
                btn.addEventListener('click', async (event) => {
                    const uidToRemove = event.target.dataset.uid;
                    if (confirm(`Are you sure you want to remove ${uidToRemove} from designated admins?`)) {
                        const userProfileRef = db.collection('userProfiles').doc(user.uid);
                        await userProfileRef.update({
                            designatedAdminUids: firebase.firestore.FieldValue.arrayRemove(uidToRemove)
                        });
                        console.log(`Removed designated admin: ${uidToRemove}`);
                        await loadDesignatedAdmins(); // Refresh list
                        designateAdminError.textContent = `Removed ${uidToRemove}.`;
                    }
                });
            });
        } else {
            designatedAdminsListEl.innerHTML = '<p>No designated admins.</p>';
        }
    } catch (error) {
        console.error('Error loading designated admins:', error);
        if(designateAdminError) designateAdminError.textContent = `Error loading admins: ${error.message}`;
        designatedAdminsListEl.innerHTML = '<p style="color:red;">Error loading admins.</p>';
    }
}

// Load and render big hitter watchlist from Firestore
async function loadWatchlist() {
    const watchListDisplayEl = document.getElementById('watchListDisplay');
    if (!watchListDisplayEl) return;
    watchListDisplayEl.innerHTML = '<p>Loading watchlist...</p>';
    try {
        // Assume watchlist is stored in factionWars/currentWar document
        const doc = await db.collection('factionWars').doc('currentWar').get();
        const watchlist = doc.exists ? (doc.data().bigHitterWatchlist || []) : [];
        
        if (watchlist.length > 0) {
            watchListDisplayEl.innerHTML = watchlist.map(id => 
                `<li>${id} <button class="remove-btn" data-id="${id}">Remove</button></li>`
            ).join('');
            watchListDisplayEl.querySelectorAll('.remove-btn').forEach(btn => {
                btn.addEventListener('click', async (event) => {
                    const idToRemove = event.target.dataset.id;
                    if (confirm(`Are you sure you want to remove ${idToRemove} from watchlist?`)) {
                        await db.collection('factionWars').doc('currentWar').update({
                            bigHitterWatchlist: firebase.firestore.FieldValue.arrayRemove(idToRemove)
                        });
                        console.log(`Removed from watchlist: ${idToRemove}`);
                        await loadWatchlist(); // Refresh list
                    }
                });
            });
        } else {
            watchListDisplayEl.innerHTML = '<p>No enemies in watchlist.</p>';
        }
    } catch (error) {
        console.error('Error loading watchlist:', error);
        watchListDisplayEl.innerHTML = '<p style="color:red;">Error loading watchlist.</p>';
    }
}

// Load Energy Tracking Members select options and pre-select saved ones
async function loadEnergyTrackMembers() {
    const energyTrackMemberSelectEl = document.getElementById('energyTrackMemberSelect');
    if (!energyTrackMemberSelectEl) return;
    energyTrackMemberSelectEl.innerHTML = '<option value="">Loading members...</option>';
    try {
        const user = auth.currentUser;
        if (!user) { energyTrackMemberSelectEl.innerHTML = '<option value="">Sign in for members</option>'; return; }
        
        const userProfile = await db.collection('userProfiles').doc(user.uid).get();
        const tornApiKey = userProfile.exists ? userProfile.data().tornApiKey : null;
        const tornProfileId = userProfile.exists ? userProfile.data().tornProfileId : null;

        if (!tornApiKey || !tornProfileId) {
            energyTrackMemberSelectEl.innerHTML = '<option value="">API Key/Profile ID missing</option>';
            // Show a temporary alert, but avoid spamming on every tab switch
            // alert("Your Torn API Key and Profile ID are required to fetch faction members for energy tracking. Please update your profile.");
            return;
        }

        const userApiData = await fetchTornApi(`https://api.torn.com/user/${tornProfileId}?selections=profile&key=${tornApiKey}`);
        const factionId = userApiData.faction ? userApiData.faction.faction_id : null;

        if (!factionId) {
            energyTrackMemberSelectEl.innerHTML = '<option value="">Not in a faction</option>';
            return;
        }

        const factionData = await fetchTornApi(`https://api.torn.com/faction/${factionId}?selections=basic&key=${tornApiKey}`);
        const members = Object.values(factionData.members || {});
        
        energyTrackMemberSelectEl.innerHTML = ''; // Clear loading message
        members.sort((a,b) => a.name.localeCompare(b.name)).forEach(member => {
            const option = document.createElement('option');
            option.value = member.id; // Use Torn ID as value
            option.textContent = member.name;
            energyTrackMemberSelectEl.appendChild(option);
        });

        // Load saved selections for energy tracking from factionWars/currentWar
        const savedConfig = await db.collection('factionWars').doc('currentWar').get();
        const trackedMembers = savedConfig.exists ? (savedConfig.data().energyTrackedMembers || []) : [];
        Array.from(energyTrackMemberSelectEl.options).forEach(option => {
            if (trackedMembers.includes(option.value)) {
                option.selected = true;
            }
        });

    } catch (error) {
        console.error('Error loading energy track members:', error);
        energyTrackMemberSelectEl.innerHTML = '<option value="">Error loading members</option>';
    }
}