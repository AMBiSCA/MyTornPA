const db = firebase.firestore();
const auth = firebase.auth();

// Global variables needed for this page
let userApiKey = null;
let factionApiFullData = null;
let globalYourFactionID = null;

// --- UPDATED CACHING LOGIC ---
const CACHE_TTL_SECONDS = 86400; // Time-To-Live for cache: 86400 seconds = 24 hours
let memberProfileCache = JSON.parse(sessionStorage.getItem('memberProfileCache')) || {};


// --- CORE UI FUNCTIONS ---

/**
 * Main function to fetch all data and render the entire page.
 * It populates the roster on the right and the summary/forms on the left.
 */
async function displayWarRoster() {
    const rosterDisplay = document.getElementById('war-roster-display');
    if (!rosterDisplay) return;

    rosterDisplay.innerHTML = '<p>Loading team roster...</p>';

    try {
        const availabilitySnapshot = await db.collection('factionWars').doc('currentWar').collection('availability').get();
        const availabilityData = {};
        availabilitySnapshot.forEach(doc => {
            availabilityData[doc.id] = doc.data();
        });

        if (!factionApiFullData || !factionApiFullData.members) {
            rosterDisplay.innerHTML = '<p style="color: red;">Faction member list not available.</p>';
            return;
        }
        const allMembers = Object.values(factionApiFullData.members);

        let cacheNeedsUpdate = false;
        const nowInSeconds = Math.floor(Date.now() / 1000);

        const memberDisplayPromises = allMembers.map(async (member) => {
            const memberId = String(member.id);
            const memberName = member.name;
            const memberAvailability = availabilityData[memberId];

            let statusClass = 'status-grey';
            let statusTextHtml = '<span class="status-text-grey">(No response yet)</span>';

            if (memberAvailability) {
                const summaryParts = [];
                let hasSaidNo = false, hasSaidPartial = false, hasSaidYes = false;

                for (let i = 1; i <= 3; i++) {
                    const dayData = memberAvailability[`day_${i}`];
                    if (dayData && dayData.status !== 'no-response') {
                        let dayStatusText = `D${i}: `;
                        let dayStatusClass = '';
                        switch (dayData.status) {
                            case 'yes': dayStatusText += `Yes (${dayData.timeRange || 'All Day'})`; dayStatusClass = 'status-text-green'; hasSaidYes = true; break;
                            case 'partial': dayStatusText += `Partial (${dayData.timeRange || 'N/A'})`; dayStatusClass = 'status-text-orange'; hasSaidPartial = true; break;
                            case 'no': dayStatusText += `No (${dayData.reason || 'No reason'})`; dayStatusClass = 'status-text-red'; hasSaidNo = true; break;
                        }
                        summaryParts.push(`<span class="${dayStatusClass}">${dayStatusText}</span>`);
                    }
                }
                
                if (summaryParts.length > 0) {
                    statusTextHtml = summaryParts.join(' | ');
                    if (hasSaidNo) statusClass = 'status-red';
                    else if (hasSaidPartial) statusClass = 'status-orange';
                    else if (hasSaidYes) statusClass = 'status-green';
                }
            }
            
            // ---- UPDATED CACHING LOGIC WITH TTL ----
            let profileImageUrl; 
            const cachedData = memberProfileCache[memberId];
            
            // 1. Check if a fresh, valid entry exists in the cache
            if (cachedData && cachedData.profile_image && (nowInSeconds - cachedData.timestamp) < CACHE_TTL_SECONDS) {
                profileImageUrl = cachedData.profile_image;
            } else {
                // 2. If cache is missing or stale, fetch from Firestore
                try {
                    const userDoc = await db.collection('users').doc(memberId).get();
                    if (userDoc.exists && userDoc.data().profile_image) {
                        const imageUrlFromDb = userDoc.data().profile_image;
                        if (imageUrlFromDb.trim() !== '') {
                            profileImageUrl = imageUrlFromDb;
                        }
                    }
                } catch (err) {
                    console.warn(`Could not fetch profile image for ${memberName} (${memberId}):`, err);
                }

                // 3. If no image was found in Firestore, assign a random default one
                if (!profileImageUrl) {
                    const randomIndex = Math.floor(Math.random() * DEFAULT_PROFILE_ICONS.length);
                    profileImageUrl = DEFAULT_PROFILE_ICONS[randomIndex];
                }

                // 4. Save the newly found image (real or random) to the cache with a new timestamp
                memberProfileCache[memberId] = { 
                    profile_image: profileImageUrl,
                    timestamp: nowInSeconds 
                };
                cacheNeedsUpdate = true;
            }
            // ---- END OF UPDATED LOGIC ----

            return `
                <div class="roster-player ${statusClass}" data-member-id="${memberId}">
                    <img src="${profileImageUrl}" alt="${memberName}'s profile pic" class="roster-player-pic">
                    <div class="roster-player-info">
                        <span class="player-name">${memberName}</span>
                        <span class="player-status">${statusTextHtml}</span>
                    </div>
                </div>`;
        });
        
        const allPlayerHtml = await Promise.all(memberDisplayPromises);
        rosterDisplay.innerHTML = allPlayerHtml.join('');

        if (cacheNeedsUpdate) {
            sessionStorage.setItem('memberProfileCache', JSON.stringify(memberProfileCache));
        }

        if (allMembers.length > 8) {
            const firstRosterItem = rosterDisplay.querySelector('.roster-player');
            if (firstRosterItem) {
                const itemHeight = firstRosterItem.offsetHeight;
                const gap = parseInt(window.getComputedStyle(rosterDisplay).gap, 10) || 8;
                const desiredHeight = (itemHeight * 8) + (gap * 7);
                rosterDisplay.style.height = `${desiredHeight}px`;
            }
        }

        let summaryCounts = { day1: { yes: 0, partial: 0, no: 0 }, day2: { yes: 0, partial: 0, no: 0 }, day3: { yes: 0, partial: 0, no: 0 }, roles: { 'all-round-attacker': 0, 'chain-watcher': 0, 'outside-attacker': 0 }, atStart: 0 };
        allMembers.forEach(member => {
            const memberAvailability = availabilityData[String(member.id)];
            if (memberAvailability) {
                for (let i = 1; i <= 3; i++) {
                    const dayData = memberAvailability[`day_${i}`];
                    if (dayData && dayData.status !== 'no-response') {
                        summaryCounts[`day${i}`][dayData.status]++;
                        if (i === 1) {
                            if (dayData.role && dayData.role !== 'none') summaryCounts.roles[dayData.role]++;
                            if (dayData.isAvailableForStart) summaryCounts.atStart++;
                        }
                    }
                }
            }
        });
        await showFactionSummary(summaryCounts);
        
    } catch (error) {
        console.error("Error displaying war roster:", error);
        rosterDisplay.innerHTML = '<p style="color: red;">Error loading roster.</p>';
    }
}