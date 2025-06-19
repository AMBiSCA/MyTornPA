/* ==========================================================================
   War Page Hub JavaScript (war_page_hub.js)
   ========================================================================== */

// --- Global Variables and Utility Functions ---

// Firebase references (assuming firebase-init.js is included correctly)
const db = firebase.firestore();
const auth = firebase.auth();

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
}

// Function to display a message in a specific element
function displayMessage(elementId, message, isError = false) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.color = isError ? 'red' : ''; // Optional: style error messages
    }
}

// Function to copy text to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true; // Success
    } catch (err) {
        console.error('Failed to copy: ', err);
        return false; // Failure
    }
}

// --- Tab Navigation ---

// Tab switching logic
document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            const tabId = event.target.dataset.tab + '-tab';
            showTab(tabId);
        });
    });

    // Show the first tab by default
    showTab('announcements-tab');
});

// --- Tab 1: War Announcements ---

// Load and display game plan
async function loadGamePlan() {
    try {
        const doc = await db.collection('factionWars').doc('currentWar').get();
        if (doc.exists) {
            const gamePlan = doc.data().gamePlan || 'No game plan available.';
            displayMessage('gamePlanDisplay', gamePlan);
        } else {
            displayMessage('gamePlanDisplay', 'No war document found.');
        }
    } catch (error) {
        console.error('Error loading game plan:', error);
        displayMessage('gamePlanDisplay', 'Error loading game plan.', true);
    }
}

// Load and display war status
async function loadWarStatus() {
    try {
        const doc = await db.collection('factionWars').doc('currentWar').get();
        if (doc.exists) {
            const warData = doc.data();
            displayMessage('warTermedStatus', warData.termed ? 'Yes' : 'No');
            displayMessage('warTermedWinLoss', warData.termedWinLoss || 'N/A');
            displayMessage('warChainingStatus', warData.chaining ? 'Yes' : 'No');
            displayMessage('warNoFlyingStatus', warData.noFlying ? 'Yes' : 'No');
            displayMessage('warTurtleStatus', warData.turtleMode ? 'Yes' : 'No');
        } else {
            displayMessage('warTermedStatus', 'N/A');
            displayMessage('warTermedWinLoss', 'N/A');
            // ... (rest of the status fields)
        }
    } catch (error) {
        console.error('Error loading war status:', error);
        displayMessage('warTermedStatus', 'Error', true);
        // ... (rest of the status fields)
    }
}

// Copy Game Plan button
document.getElementById('copyGamePlanBtn').addEventListener('click', async () => {
    const gamePlanText = document.getElementById('gamePlanDisplay').textContent;
    const copied = await copyToClipboard(gamePlanText);
    if (copied) {
        alert('Game plan copied to clipboard!');
    } else {
        alert('Failed to copy game plan.');
    }
});

// --- Tab 2: Active War Operations ---

// Load chain timer
async function loadChainTimer() {
    // Implement logic to fetch and display the chain timer
    // Example: Fetch from Firebase or a Netlify Function
    displayMessage('chainTimerDisplay', '00:00:00'); // Placeholder
}

// Load enemy chain timer
async function loadEnemyChainTimer() {
    // Implement logic to fetch and display the enemy chain timer
    // Example: Fetch from Firebase or a Netlify Function
    displayMessage('enemyChainTimerDisplay', '00:00:00'); // Placeholder
}

// Post Announcement button
document.getElementById('postAnnouncementBtn').addEventListener('click', async () => {
    const message = document.getElementById('quickAnnouncementInput').value;
    if (message.trim() !== '') {
        // Implement logic to post the announcement
        // Example: Send to Firebase or a Netlify Function
        console.log('Posting announcement:', message);
        document.getElementById('quickAnnouncementInput').value = ''; // Clear input
    }
});

// Load Quick FF Targets
async function loadQuickFFTargets() {
    try {
        // Implement logic to fetch and display quick FF targets
        // Example: Call a Netlify Function (fetch-fairfight-data.js)
        const targets = ['Target 1', 'Target 2', 'Target 3']; // Placeholder
        const targetList = targets.map(target => `<li>${target}</li>`).join('');
        document.getElementById('quickFFTargetsDisplay').innerHTML = `<ul>${targetList}</ul>`;
    } catch (error) {
        console.error('Error loading quick FF targets:', error);
        displayMessage('quickFFTargetsDisplay', 'Error loading targets.', true);
    }
}

// Load Enemy Targets List
async function loadEnemyTargets() {
    try {
        // Implement logic to fetch and display the enemy targets list
        // Example: Call a Netlify Function (get-recommended-targets.js), integrate hospital timers, attack pop-ups, claim logic
        const targets = [{ name: 'Enemy 1 [123]', ff: 80, difficulty: 'Easy', estStats: '10k', hospital: '00:10:00', canAttack: true, canClaim: true }, /* ... */]; // Placeholder
        const targetRows = targets.map(target => `
            <div class="enemy-target-row">
                <span>${target.name}</span>
                <span>${target.ff}</span>
                <span>${target.difficulty}</span>
                <span>${target.estStats}</span>
                <span>${target.hospital}</span>
                <span>${target.canAttack ? '<button class="action-btn">Attack</button>' : 'N/A'}</span>
                <span>${target.canClaim ? '<button class="action-btn">Claim</button>' : 'N/A'}</span>
            </div>
        `).join('');
        document.getElementById('enemyTargetsList').innerHTML = targetRows;
    } catch (error) {
        console.error('Error loading enemy targets:', error);
        displayMessage('enemyTargetsList', 'Error loading targets.', true);
    }
}

// Alert Buttons
document.getElementById('alertHitterOnlineHospBtn').addEventListener('click', () => {
    // Implement logic to trigger the alert
    console.log('Alert: Big Hitter Online (Self Hosp)');
});

document.getElementById('alertHitterActiveBtn').addEventListener('click', () => {
    // Implement logic to trigger the alert
    console.log('Alert: Big Hitter Active');
});

document.getElementById('alertEnemyActiveBtn').addEventListener('click', () => {
    // Implement logic to trigger the alert
    console.log('Alert: Enemy Active');
});

// Faction Energy/Hits Tracker
async function loadFactionStats() {
    // Implement logic to fetch and display faction energy, potential hits, and chain progress
    // Example: Fetch from Firebase or a Netlify Function
    displayMessage('totalFactionEnergy', '1000'); // Placeholder
    displayMessage('totalPotentialHits', '50'); // Placeholder
    displayMessage('chainProgressDisplay', '500/1000'); // Placeholder
}

// --- Tab 3: Friendly Faction Member Status ---

// Load Friendly Members List
async function loadFriendlyMembers() {
    try {
        // Implement logic to fetch and display friendly member status
        // Example: Fetch from Firebase
        const members = [{ name: 'Member 1', energy: 100, hospital: '00:05:00' }, /* ... */]; // Placeholder
        const memberRows = members.map(member => `
            <div>${member.name} - Energy: ${member.energy}, Hospital: ${member.hospital}</div>
        `).join('');
        document.getElementById('friendlyMembersList').innerHTML = memberRows;
    } catch (error) {
        console.error('Error loading friendly members:', error);
        displayMessage('friendlyMembersList', 'Error loading member status.', true);
    }
}

// --- Tab 4: Leader War Configuration ---

// Load Game Plan for Editing
async function loadGamePlanForEdit() {
    try {
        const doc = await db.collection('factionWars').doc('currentWar').get();
        if (doc.exists) {
            const gamePlan = doc.data().gamePlan || '';
            document.getElementById('gamePlanEditArea').value = gamePlan;
        }
    } catch (error) {
        console.error('Error loading game plan for edit:', error);
        displayMessage('gamePlanEditArea', 'Error loading game plan.', true);
    }
}

// Save Game Plan
document.getElementById('saveGamePlanBtn').addEventListener('click', async () => {
    const newGamePlan = document.getElementById('gamePlanEditArea').value;
    try {
        await db.collection('factionWars').doc('currentWar').update({ gamePlan: newGamePlan });
        loadGamePlan(); // Refresh the displayed game plan
        alert('Game plan saved!');
    } catch (error) {
        console.error('Error saving game plan:', error);
        alert('Error saving game plan.');
    }
});

// Add to Watchlist
document.getElementById('addWatchEnemyBtn').addEventListener('click', () => {
    const enemyId = document.getElementById('watchEnemyIdInput').value;
    if (enemyId.trim() !== '') {
        // Implement logic to add the enemy ID to the watchlist
        console.log('Adding to watchlist:', enemyId);
        document.getElementById('watchEnemyIdInput').value = ''; // Clear input
    }
});

// Add Designated Admin
document.getElementById('addDesignateAdminBtn').addEventListener('click', () => {
    const adminId = document.getElementById('designateAdminIdInput').value;
    if (adminId.trim() !== '') {
        // Implement logic to add the admin ID
        console.log('Adding designated admin:', adminId);
        document.getElementById('designateAdminInput').value = ''; // Clear input
    }
});

// Load Energy Tracking Members
async function loadEnergyTrackMembers() {
    try {
        // Implement logic to fetch faction members and populate the select
        const members = [{ uid: 'user1', name: 'Member 1' }, { uid: 'user2', name: 'Member 2' }, /* ... */]; // Placeholder
        const select = document.getElementById('energyTrackMemberSelect');
        members.forEach(member => {
            const option = document.createElement('option');
            option.value = member.uid;
            option.textContent = member.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading energy track members:', error);
        displayMessage('energyTrackMemberSelect', 'Error loading members.', true);
    }
}

// Save Energy Tracking Members
document.getElementById('saveEnergyTrackMembersBtn').addEventListener('click', () => {
    const selectedMembers = Array.from(document.getElementById('energyTrackMemberSelect').selectedOptions)
        .map(option => option.value);
    // Implement logic to save the selected member UIDs
    console.log('Saving energy tracking members:', selectedMembers);
});

// --- Initialization ---

// Call functions to load data on page load
document.addEventListener('DOMContentLoaded', () => {
    loadGamePlan();
    loadWarStatus();
    loadChainTimer();
    loadEnemyChainTimer();
    loadQuickFFTargets();
    loadEnemyTargets();
    loadFactionStats();
    loadFriendlyMembers();
    loadGamePlanForEdit();
    loadEnergyTrackMembers();
});