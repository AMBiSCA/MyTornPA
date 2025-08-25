// This script is a streamlined version of your existing war_page_hub.js
// It is designed to work with the new warsretreat.html and warsretreat.css files.

const db = firebase.firestore();
const auth = firebase.auth();

// --- HTML Element References (Updated for the new layout) ---
const warTimerEl = document.getElementById('war-timer');
const factionOneScoreEl = document.getElementById('faction-one-score');
const factionTwoScoreEl = document.getElementById('faction-two-score');
const warProgressLeftEl = document.getElementById('war-progress-left');
const warProgressRightEl = document.getElementById('war-progress-right');
const chainHitsEl = document.getElementById('chain-hits');
const chainTimerEl = document.getElementById('chain-timer');
const chainStartedEl = document.getElementById('chain-started-time');
const friendlyMembersCountEl = document.getElementById('friendly-members-count');
const friendlyMembersListEl = document.getElementById('friendly-members-list');
const enemyMembersCountEl = document.getElementById('enemy-members-count');
const enemyMembersListEl = document.getElementById('enemy-members-list');
const hitsLogListEl = document.getElementById('hits-log-list');

// --- Global State Variables ---
let userApiKey = null;
let globalYourFactionID = null;
let globalEnemyFactionID = null;
let yourFactionData = null;
let enemyFactionData = null;
let lastChainFetchTime = 0;
let currentChainTimeout = 0;
let lastWarFetchTime = 0;
let currentWarDuration = 0;

// --- Helper Functions ---
function formatTime(seconds) {
    if (seconds <= 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function formatDuration(seconds) {
    if (seconds <= 0) return '0:00:00:00';
    const d = Math.floor(seconds / 86400);
    seconds %= 86400;
    const h = Math.floor(seconds / 3600);
    seconds %= 3600;
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${d}:${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// --- Main Data Fetching and UI Update Functions ---
async function fetchAllData() {
    if (!userApiKey || !globalYourFactionID) {
        if (warTimerEl) warTimerEl.textContent = 'N/A';
        if (factionOneScoreEl) factionOneScoreEl.textContent = 'N/A';
        if (factionTwoScoreEl) factionTwoScoreEl.textContent = 'N/A';
        if (chainHitsEl) chainHitsEl.textContent = 'N/A';
        if (chainTimerEl) chainTimerEl.textContent = 'N/A';
        if (chainStartedEl) chainStartedEl.textContent = 'N/A';
        if (friendlyMembersCountEl) friendlyMembersCountEl.textContent = 'N/A';
        if (enemyMembersCountEl) enemyMembersCountEl.textContent = 'N/A';
        if (friendlyMembersListEl) friendlyMembersListEl.innerHTML = '<p class="loading-message">Login & setup profile.</p>';
        if (enemyMembersListEl) enemyMembersListEl.innerHTML = '<p class="loading-message">Login & setup profile.</p>';
        return;
    }

    try {
        const urlYourFaction = `https://api.torn.com/v2/faction/${globalYourFactionID}?selections=basic,members,chain,wars&key=${userApiKey}&comment=Warsretreat`;
        const urlEnemyFaction = globalEnemyFactionID ? `https://api.torn.com/v2/faction/${globalEnemyFactionID}?selections=basic,members&key=${userApiKey}&comment=Warsretreat` : null;

        const [yourResponse, enemyResponse] = await Promise.all([
            fetch(urlYourFaction),
            urlEnemyFaction ? fetch(urlEnemyFaction) : Promise.resolve(null)
        ]);

        const yourData = await yourResponse.json();
        if (yourData.error) throw new Error(yourData.error.error);
        yourFactionData = yourData;

        if (urlEnemyFaction) {
            const enemyData = await enemyResponse.json();
            if (enemyData.error) throw new Error(enemyData.error.error);
            enemyFactionData = enemyData;
        }

        updateUI();

    } catch (error) {
        console.error("Failed to fetch data:", error);
        alert(`Failed to load data: ${error.message}. Please check your API key and faction IDs.`);
    }
}

// --- UI Rendering Function ---
function updateUI() {
    if (!yourFactionData) return;

    // Update Main War Status
    if (yourFactionData.wars && yourFactionData.wars.ranked) {
        const rankedWar = yourFactionData.wars.ranked;
        const yourScore = rankedWar.factions.find(f => f.id == globalYourFactionID)?.score || 0;
        const enemyScore = rankedWar.factions.find(f => f.id == globalEnemyFactionID)?.score || 0;

        if (factionOneScoreEl) factionOneScoreEl.textContent = yourScore.toLocaleString();
        if (factionTwoScoreEl) factionTwoScoreEl.textContent = enemyScore.toLocaleString();

        const totalScore = yourScore + enemyScore;
        const progressYour = totalScore > 0 ? (yourScore / totalScore) * 100 : 50;
        const progressEnemy = 100 - progressYour;
        if (warProgressLeftEl) warProgressLeftEl.style.width = `${progressYour}%`;
        if (warProgressRightEl) warProgressRightEl.style.width = `${progressEnemy}%`;
        
        lastWarFetchTime = Date.now();
        currentWarDuration = Math.floor(Date.now() / 1000) - rankedWar.start;
        if (warTimerEl) warTimerEl.textContent = formatDuration(currentWarDuration);
    } else {
        if (factionOneScoreEl) factionOneScoreEl.textContent = 'N/A';
        if (factionTwoScoreEl) factionTwoScoreEl.textContent = 'N/A';
        if (warProgressLeftEl) warProgressLeftEl.style.width = '50%';
        if (warProgressRightEl) warProgressRightEl.style.width = '50%';
        if (warTimerEl) warTimerEl.textContent = 'No War';
    }

    // Update Chain Status
    if (yourFactionData.chain) {
        const chain = yourFactionData.chain;
        if (chainHitsEl) chainHitsEl.textContent = `${chain.current.toLocaleString()} Hits`;
        lastChainFetchTime = Date.now();
        currentChainTimeout = chain.timeout;
        if (chainStartedEl) chainStartedEl.textContent = `Start: ${new Date(chain.start * 1000).toLocaleTimeString()}`;
        
        const milestones = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];
        const prevMilestone = milestones.slice().reverse().find(m => m <= chain.current) || 0;
        const nextMilestone = milestones.find(m => m > chain.current) || 100000;
        const percentage = ((chain.current - prevMilestone) / (nextMilestone - prevMilestone)) * 100;
        const chainProgressBarEl = document.getElementById('chain-progress-bar');
        if (chainProgressBarEl) {
            chainProgressBarEl.style.width = `${percentage}%`;
        }
        
    } else {
        if (chainHitsEl) chainHitsEl.textContent = '0 Hits';
        currentChainTimeout = 0;
        if (chainStartedEl) chainStartedEl.textContent = 'Start: N/A';
        const chainProgressBarEl = document.getElementById('chain-progress-bar');
        if (chainProgressBarEl) {
            chainProgressBarEl.style.width = '0%';
        }
    }

    // Update Members Lists
    updateMemberList(yourFactionData.members, friendlyMembersListEl, friendlyMembersCountEl, true);
    if (enemyFactionData) {
        updateMemberList(enemyFactionData.members, enemyMembersListEl, enemyMembersCountEl, false);
    } else {
        if (enemyMembersCountEl) enemyMembersCountEl.textContent = 'N/A';
        if (enemyMembersListEl) enemyMembersListEl.innerHTML = '<p class="loading-message">No faction data.</p>';
    }
}

function updateMemberList(members, listEl, countEl, isFriendly) {
    if (!members || !listEl) {
        if (listEl) listEl.innerHTML = '<p class="loading-message">No member data.</p>';
        return;
    }
    const membersArray = Object.values(members);
    let onlineCount = 0;
    listEl.innerHTML = '';

    membersArray.sort((a, b) => {
        const statusA = a.status.state === 'Okay' || a.status.state === 'In Prison' ? 1 : 0;
        const statusB = b.status.state === 'Okay' || b.status.state === 'In Prison' ? 1 : 0;
        return statusB - statusA;
    });

    membersArray.forEach(member => {
        const isOnline = member.last_action.status === 'Online';
        if (isOnline) onlineCount++;
        
        const memberItem = document.createElement('div');
        memberItem.classList.add('member-item');
        memberItem.textContent = `${member.name} - Lv. ${member.level}`;
        memberItem.style.color = isOnline ? (isFriendly ? '#4CAF50' : '#E53935') : '#888';
        listEl.appendChild(memberItem);
    });

    if (countEl) countEl.textContent = `${onlineCount}/${membersArray.length} Online`;
}

// --- Timers and Initialization ---
function updateTimers() {
    const now = Date.now();
    
    if (currentChainTimeout > 0 && lastChainFetchTime > 0) {
        const elapsedSeconds = Math.floor((now - lastChainFetchTime) / 1000);
        const timeLeft = Math.max(0, currentChainTimeout - elapsedSeconds);
        if (chainTimerEl) chainTimerEl.textContent = formatTime(timeLeft);
    }

    if (yourFactionData && yourFactionData.wars && yourFactionData.wars.ranked) {
        const elapsedSeconds = Math.floor((now - lastWarFetchTime) / 1000);
        const newDuration = currentWarDuration + elapsedSeconds;
        if (warTimerEl) warTimerEl.textContent = formatDuration(newDuration);
    }
}

// Fetch data on page load
document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            try {
                const userProfileRef = db.collection('userProfiles').doc(user.uid);
                const doc = await userProfileRef.get();
                const userData = doc.exists ? doc.data() : {};

                userApiKey = userData.tornApiKey || null;
                globalYourFactionID = userData.faction_id || null;

                const warDoc = await db.collection('factionWars').doc('currentWar').get();
                globalEnemyFactionID = warDoc.exists ? warDoc.data().enemyFactionID || null : null;
                
                fetchAllData();
            } catch (error) {
                console.error("Error fetching user data:", error);
                alert("Failed to load user data. Please check your login and profile settings.");
            }
        } else {
            userApiKey = null;
            globalYourFactionID = null;
            globalEnemyFactionID = null;
            fetchAllData(); 
        }
    });

    setInterval(updateTimers, 1000);
    setInterval(fetchAllData, 10000);
});