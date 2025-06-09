// Global variable to hold the combined fetched data ready for display/saving
let combinedFactionMembersData = [];

document.addEventListener('DOMContentLoaded', () => {
    const logoutButton = document.getElementById('logoutButtonHeader');
    const factionIdInput = document.getElementById('factionIdInput');
    const factionIdError = document.getElementById('factionIdError');
    const fetchFactionDataBtn = document.getElementById('fetchFactionDataBtn');
    const saveToFirebaseBtn = document.getElementById('saveToFirebaseBtn');
    const updatesBox = document.getElementById('updatesBox');
    const adminToolContainer = document.querySelector('.admin-tool-container'); // Get the main container
    const dataDisplayArea = document.createElement('div'); // New div for the table
    dataDisplayArea.id = 'fetchedFactionDataTableContainer';
    dataDisplayArea.style.marginTop = '20px';
    // Append this to your admin-tool-container or another suitable element
    if (adminToolContainer) { // Ensure container exists before appending
        adminToolContainer.appendChild(dataDisplayArea);
    }


    // --- Helper for updates box ---
    function updateStatus(message, isError = false) {
        const timestamp = new Date().toLocaleTimeString();
        updatesBox.innerHTML += `<p style="color:${isError ? '#ff4d4d' : '#eee'};"><strong>[${timestamp}]</strong> ${message}</p>`;
        updatesBox.scrollTop = updatesBox.scrollHeight; // Scroll to bottom
    }
    function clearStatus() {
        updatesBox.innerHTML = '<p>Status updates will appear here.</p>';
    }

    // --- Helper for displaying prominent errors ---
    function showMainError(message) {
        if (!message || message.trim() === '') {
            const existingMainInputError = document.querySelector('.main-input-error-feedback');
            if (existingMainInputError) {
                existingMainInputError.remove();
            }
            return;
        }
        const existingMainInputError = document.querySelector('.main-input-error-feedback');
        if (existingMainInputError) {
            existingMainInputError.remove();
        }
        const mainPageStatus = document.createElement('div');
        mainPageStatus.textContent = message;
        mainPageStatus.className = 'main-input-error-feedback';
        mainPageStatus.style.textAlign = 'center';
        mainPageStatus.style.padding = '10px';
        mainPageStatus.style.backgroundColor = 'rgba(255,0,0,0.1)';
        mainPageStatus.style.border = '1px solid red';
        mainPageStatus.style.borderRadius = '5px';
        mainPageStatus.style.marginTop = '15px';
        
        if (adminToolContainer) {
            const inputGroup = adminToolContainer.querySelector('.input-group');
            if (inputGroup) {
                inputGroup.insertAdjacentElement('afterend', mainPageStatus);
            } else {
                adminToolContainer.appendChild(mainPageStatus);
            }
        }
        setTimeout(() => { if(mainPageStatus.parentElement) mainPageStatus.remove(); }, 7000);
    }

    // --- Stat Value Extractor (used for displaying data in table) ---
    function getValueForStat(statDisplayName, userData) {
        let value = 'N/A';
        const lastActionObject = userData.last_action || {};
        const personalstats = userData.personalstats || {};
        const profileData = userData.profile || {};

        switch (statDisplayName) {
            case 'Level': value = userData.level; break;
            case 'Age': value = userData.age; break;
            case 'Last Action':
                if (lastActionObject.timestamp && lastActionObject.timestamp > 0) {
                    const now = Math.floor(Date.now() / 1000);
                    const secondsAgo = now - lastActionObject.timestamp;
                    if (secondsAgo < 0) { value = "Just now"; break; }
                    const minutesAgo = Math.floor(secondsAgo / 60);
                    const hoursAgo = Math.floor(minutesAgo / 60);
                    const daysAgo = Math.floor(hoursAgo / 24);
                    if (minutesAgo < 1) value = `${Math.max(0,secondsAgo)}s Ago`;
                    else if (minutesAgo < 60) value = `${minutesAgo} Mins Ago`;
                    else if (hoursAgo < 24) value = `${hoursAgo} Hours Ago`;
                    else if (daysAgo < 30) value = `${daysAgo} Day${daysAgo > 1 ? 's' : ''} Ago`;
                    else value = "Taking Break";
                } else if (typeof lastActionObject.relative === 'string' && lastActionObject.relative.trim() !== "") {
                    value = lastActionObject.relative.replace(' ago', ' Ago');
                } else { value = 'N/A'; }
                break;
            case 'Status': value = userData.status && userData.status.description ? userData.status.description : (userData.status && userData.status.state ? userData.status.state : 'N/A'); break;
            case 'Respect': value = personalstats.respectforfaction; break;
            case 'Xanax Taken': value = personalstats.xantaken; break;
            case 'Total War Hits': value = personalstats.rankedwarhits; break;
            case 'Refills': value = personalstats.refills; break;
            case 'Total War Assists': value = personalstats.attacksassisted; break;
            case 'Attacks Won': value = personalstats.attackswon; break;
            case 'Attacks Lost': value = personalstats.attackslost; break;
            case 'Attacks Draw': value = personalstats.attacksdraw; break;
            case 'Defends Won': value = personalstats.defendswon; break;
            case 'Defends Lost': value = personalstats.defendslost; break;
            case 'Total Attack Hits': value = personalstats.attackhits; break;
            case 'Attack Damage Dealt': value = personalstats.attackdamage; break;
            case 'Best Single Hit Damage': value = personalstats.bestdamage; break;
            case 'Critical Hits': value = personalstats.attackcriticalhits; break;
            case 'One-Hit Kills': value = personalstats.onehitkills; break;
            case 'Best Kill Streak': value = personalstats.bestkillstreak; break;
            case 'ELO Rating': value = personalstats.elo; break;
            case 'Stealth Attacks': value = personalstats.attacksstealthed; break;
            case 'Highest Level Beaten': value = personalstats.highestbeaten; break;
            case 'Unarmed Fights Won': value = personalstats.unarmoredwon; break;
            case 'Times You Ran Away': value = personalstats.yourunaway; break;
            case 'Opponent Ran Away': value = personalstats.theyrunaway; break;
            case 'Money Mugged': value = personalstats.moneymugged; break;
            case 'Largest Mug': value = personalstats.largestmug; break;
            case 'Bazaar Profit ($)': value = personalstats.bazaarprofit; break;
            case 'Bazaar Sales (#)': value = personalstats.bazaarsales; break;
            case 'Bazaar Customers': value = personalstats.bazaarcustomers; break;
            case 'Points Bought': value = personalstats.pointsbought; break;
            case 'Points Sold': value = personalstats.pointssold; break;
            case 'Items Bought (Market/Shops)': value = personalstats.itemsbought; break;
            case 'City Items Bought': value = personalstats.cityitemsbought; break;
            case 'Items Bought Abroad': value = personalstats.itemsboughtabroad; break;
            case 'Items Sent': value = personalstats.itemssent; break;
            case 'Items Looted': value = personalstats.itemslooted; break;
            case 'Items Dumped': value = personalstats.itemsdumped; break;
            case 'Trades Made': value = personalstats.trades; break;
            case 'Criminal Record (Total)': value = personalstats.criminaloffenses; break;
            case 'Times Jailed': value = personalstats.jailed; break;
            case 'People Busted': value = personalstats.peoplebusted; break;
            case 'Failed Busts': value = personalstats.failedbusts; break;
            case 'Arrests Made': value = personalstats.arrestsmade; break;
            case 'Medical Items Used': value = personalstats.medicalitemsused; break;
            case 'Times Hospitalized': value = personalstats.hospital; break;
            case 'Drugs Used (Times)': value = personalstats.drugsused; break;
            case 'Times Overdosed': value = personalstats.overdosed; break;
            case 'Times Rehabbed': value = personalstats.rehabs; break;
            case 'Boosters Used': value = personalstats.boostersused; break;
            case 'Energy Drinks Used': value = personalstats.energydrinkused; break;
            case 'Alcohol Used': value = personalstats.alcoholused; break;
            case 'Candy Used': value = personalstats.candyused; break;
            case 'Nerve Refills Used': value = personalstats.nerverefills; break;
            case 'Daily Login Streak': value = personalstats.activestreak; break;
            case 'Best Active Streak': value = personalstats.bestactivestreak; break;
            case 'User Activity': value = personalstats.useractivity; break;
            case 'Awards': value = personalstats.awards; break;
            case 'Donator Days': value = personalstats.daysbeendonator; break;
            case 'Missions Completed': value = personalstats.missionscompleted; break;
            case 'Contracts Completed': value = personalstats.contractscompleted; break;
            case 'Mission Credits Earned': value = personalstats.missioncreditsearned; break;
            case 'Job Points Used': value = personalstats.jobpointsused; break;
            case 'Stat Trains Received': value = personalstats.trainsreceived; break;
            case 'Travels Made': value = personalstats.traveltimes; break;
            case 'City Finds': value = personalstats.cityfinds; break;
            case 'Dump Finds': value = personalstats.dumpfinds; break;
            case 'Items Dumped': value = personalstats.itemsdumped; break;
            case 'Books Read': value = personalstats.booksread; break;
            case 'Viruses Coded': value = personalstats.virusescoded; break;
            case 'Races Won': value = personalstats.raceswon; break;
            case 'Racing Skill': value = personalstats.racingskill; break;
            case 'Total Bounties': value = personalstats.bountiesreceived; break;
            case 'Bounties Placed': value = personalstats.bountiesplaced; break;
            case 'Bounties Collected': value = personalstats.bountiescollected; break;
            case 'Money Spent on Bounties': value = personalstats.totalbountyspent; break;
            case 'Money From Bounties Collected': value = personalstats.totalbountyreward; break;
            case 'Revives Made': value = personalstats.revives; break;
            case 'Revives Received': value = personalstats.revivesreceived; break;
            case 'Revive Skill': value = personalstats.reviveskill; break;
            case 'Networth': value = personalstats.networth; break;
            case 'Businesses Owned': value = personalstats.companiesowned; break;
            case 'Properties Owned': value = personalstats.propertiesowned; break;
            default: value = 'N/A';
        }

        if (value === undefined || value === null || value === "") {
            value = 'N/A';
        }

        const numericDisplayStats = [
            'Level', 'Age', 'Respect', 'Xanax Taken', 'Total War Hits', 'Refills', 'Networth',
            'Attacks Won', 'Attacks Lost', 'Attacks Draw', 'Defends Won', 'Defends Lost',
            'ELO Rating', 'Best Kill Streak', 'Total Attack Hits', 'Attack Damage Dealt', 'Best Single Hit Damage',
            'One-Hit Kills', 'Critical Hits', 'Stealth Attacks', 'Highest Level Beaten', 'Unarmored Fights Won',
            'Times You Ran Away', 'Opponent Ran Away', 'Money Mugged', 'Largest Mug', 'Items Looted',
            'Job Points Used', 'Stat Trains Received', 'Items Bought (Market/Shops)', 'City Items Bought', 'Items Bought Abroad',
            'Items Sent', 'Trades Made', 'Points Bought', 'Points Sold',
            'Bazaar Customers', 'Bazaar Sales (#)', 'Bazaar Profit ($)',
            'Times Jailed', 'People Busted', 'Failed Busts', 'Arrests Made', 'Criminal Record (Total)',
            'Times Hospitalized', 'Medical Items Used', 'Revive Skill', 'Revives Made', 'Revives Received',
            'Drugs Used (Times)', 'Times Overdosed', 'Times Rehabbed',
            'Boosters Used', 'Candy Used', 'Alcohol Used', 'Energy Drinks Used',
            'Nerve Refills Used', 'Daily Login Streak', 'Best Active Streak', 'Awards', 'Donator Days',
            'Missions Completed', 'Contracts Completed', 'Mission Credits Earned',
            'Job Points Used', 'Stat Trains Received', 'Travels Made', 'City Finds', 'Dump Finds', 'Items Dumped', 'Books Read', 'Viruses Coded',
            'Races Won', 'Racing Skill', 'Total Bounties', 'Bounties Placed', 'Bounties Collected',
            'Money Spent on Bounties', 'Money From Bounties Collected',
            'Businesses Owned', 'Properties Owned'
        ];

        if (typeof value === 'number' && !isNaN(value) && numericDisplayStats.includes(statDisplayName)) {
            return value.toLocaleString();
        }
        return String(value);
    }

    // --- Battle Stat Formatter (used for displaying data in table) ---
    function formatBattleStat(num) {
        if (num === "N/A" || num === null || num === undefined || isNaN(Number(num))) return "N/A";
        const number = Number(num);
        if (Math.abs(number) >= 1e9) return (number / 1e9).toFixed(2) + 'b';
        if (Math.abs(number) >= 1e6) return (number / 1e6).toFixed(2) + 'm';
        if (Math.abs(number) >= 1e3) return (number / 1e3).toFixed(0) + 'k';
        return number.toLocaleString();
    }


    // --- UI Table Rendering Function ---
    function renderDataTable(data) {
        dataDisplayArea.innerHTML = ''; // Clear previous table

        if (data.length === 0) {
            dataDisplayArea.innerHTML = '<p style="color:#ffcc00; text-align:center;">No data to display.</p>';
            return;
        }

        const table = document.createElement('table');
        table.className = 'data-table'; // Add a class for styling
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.marginTop = '15px';
        table.style.backgroundColor = '#1a1a1a'; // Darker background for table
        table.style.color = '#eee'; // Light text color

        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');
        table.appendChild(thead);
        table.appendChild(tbody);

        // Define headers for the combined table
        const headers = [
            "ID", "Name", "Level", "Age", "Xanax", "Refills", // Torn API Data
            "Strength", "Defense", "Speed", "Dexterity", "Total BS", // TornStats Data
            "Spy Report" // Status of spy report
        ];

        const headerRow = document.createElement('tr');
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            th.style.cssText = 'padding: 10px; border: 1px solid #444; background-color: #333; color: #eee; text-align: left;';
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        data.forEach(memberData => {
            const tr = document.createElement('tr');
            tr.style.cssText = 'background-color: #2a2a2a; color: #ccc;';

            const tornData = memberData.tornData || {};
            const tornStatsData = memberData.tornStatsData || {};

            tr.insertCell().textContent = memberData.memberId || 'N/A';
            tr.insertCell().textContent = tornData.name || 'N/A';
            tr.insertCell().textContent = getValueForStat('Level', tornData);
            tr.insertCell().textContent = getValueForStat('Age', tornData);
            tr.insertCell().textContent = getValueForStat('Xanax Taken', tornData);
            tr.insertCell().textContent = getValueForStat('Refills', tornData);

            tr.insertCell().textContent = formatBattleStat(tornStatsData.strength);
            tr.insertCell().textContent = formatBattleStat(tornStatsData.defense);
            tr.insertCell().textContent = formatBattleStat(tornStatsData.speed);
            tr.insertCell().textContent = formatBattleStat(tornStatsData.dexterity);
            tr.insertCell().textContent = formatBattleStat(tornStatsData.total);

            const spyStatusCell = tr.insertCell();
            if (memberData.spyReportAvailable) {
                spyStatusCell.textContent = 'Yes';
                spyStatusCell.style.color = '#28a745'; // Green
            } else if (tornStatsData.error) {
                spyStatusCell.textContent = `Error: ${tornStatsData.error.substring(0, 20)}...`; // Shorten error for display
                spyStatusCell.style.color = '#ffcc00'; // Yellow/Orange for warning
                spyStatusCell.title = tornStatsData.error; // Full error on hover
            } else {
                spyStatusCell.textContent = 'No Data';
                spyStatusCell.style.color = '#888';
            }

            tbody.appendChild(tr);
        });

        dataDisplayArea.appendChild(table);
    }


    // --- Page Protection ---
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            console.log("Admin is logged in:", user.email);
            // Optional: Further check if this specific user is allowed admin access via custom claims here
            // This is client-side, Firestore rules provide the ultimate server-side protection for writes.
        } else {
            console.log("No admin logged in. Redirecting to login page...");
            window.location.href = '/admin_login.html'; // Ensure redirect to root login
        }
    });

    // --- Logout Functionality ---
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                await firebase.auth().signOut();
                updateStatus("Logged out successfully. Redirecting...", false);
                window.location.href = '/admin_login.html'; // Ensure redirect to root login
            } catch (error) {
                console.error("Logout error:", error);
                updateStatus(`Failed to log out: ${error.message}`, true);
            }
        });
    }

    // --- Fetch All Data (via Netlify Function) Button Logic ---
    if (fetchFactionDataBtn) { // Ensure button exists before attaching listener
        fetchFactionDataBtn.addEventListener('click', async () => {
            console.log("Fetch Faction Data button clicked!"); // LOG FOR DEBUGGING
            clearStatus(); // Clear previous messages
            dataDisplayArea.innerHTML = ''; // Clear previous data display
            saveToFirebaseBtn.style.display = 'none'; // Hide save button
            combinedFactionMembersData = []; // Reset global data

            const factionId = factionIdInput.value.trim();
            if (!factionId) {
                factionIdError.textContent = 'Faction ID cannot be empty.';
                updateStatus('Please enter a Faction ID.', true);
                return;
            } else {
                factionIdError.textContent = '';
            }

            let currentAuthenticatedUser = firebase.auth().currentUser;
            if (!currentAuthenticatedUser) {
                updateStatus("Not authenticated. Please log in again.", true);
                showMainError("Authentication required to fetch data.");
                return;
            }

            updateStatus(`Initiating data fetch for Faction ID: ${factionId} via Netlify Function...`);

            try {
                const netlifyFunctionUrl = '/.netlify/functions/getFactionData';

                const response = await fetch(netlifyFunctionUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ factionId: factionId })
                });

                if (!response.ok) {
                    const errorBody = await response.json().catch(() => ({ message: response.statusText }));
                    throw new Error(`Netlify Function Error (${response.status}): ${errorBody.message || 'Unknown error from Netlify Function'}`);
                }

                const result = await response.json();

                if (result.error) {
                    throw new Error(`Netlify Function reported error: ${result.error}`);
                }

                if (result.members && result.members.length > 0) {
                    combinedFactionMembersData = result.members;
                    updateStatus(`Successfully fetched data for ${result.factionName || 'Faction ' + result.factionId}. Found ${result.members.length} members.`, false);
                    renderDataTable(combinedFactionMembersData);
                    saveToFirebaseBtn.style.display = 'block';
                } else {
                    updateStatus('Netlify Function returned no member data. Check faction ID or API keys on Netlify.', true);
                    console.error("Netlify Function result:", result);
                }

            } catch (error) {
                updateStatus(`Error during Netlify Function call: ${error.message}`, true);
                console.error("Netlify Function call error:", error);
                showMainError(`Failed to fetch data: ${error.message}`);
                dataDisplayArea.innerHTML = '';
            }
        });
    } // End if (fetchFactionDataBtn)

    // --- Save to Firebase Button Logic ---
    if (saveToFirebaseBtn) { // Ensure button exists before attaching listener
        saveToFirebaseBtn.addEventListener('click', async () => {
            if (combinedFactionMembersData.length === 0) {
                updateStatus("No data to save.", true);
                return;
            }

            updateStatus("Saving data to Firebase 'playerdatabase' collection...", false);
            saveToFirebaseBtn.disabled = true; // Disable button to prevent double-click

            try {
                const batch = db.batch();
                let savedCount = 0;

                combinedFactionMembersData.forEach(memberRecord => {
                    const memberId = String(memberRecord.memberId);
                    const docRef = db.collection("playerdatabase").doc(memberId);
                    
                    // Add/update server timestamp right before saving to Firestore
                    const recordToSave = {
                        ...memberRecord,
                        lastSaved: firebase.firestore.FieldValue.serverTimestamp()
                    };

                    batch.set(recordToSave, { merge: true });
                    savedCount++;
                });

                await batch.commit();
                updateStatus(`Successfully saved ${savedCount} member records to 'playerdatabase'!`, false);
                console.log(`Successfully saved ${savedCount} member records to Firebase.`);
                combinedFactionMembersData = []; // Clear data after saving
                saveToFirebaseBtn.style.display = 'none';
                factionIdInput.value = '';
                dataDisplayArea.innerHTML = '';
            } catch (error) {
                updateStatus(`Error saving data to Firebase: ${error.message}`, true);
                console.error("Error saving faction data to Firebase:", error);
                showMainError(`Failed to save data: ${error.message}`);
            } finally {
                saveToFirebaseBtn.disabled = false;
            }
        });
    } // End if (saveToFirebaseBtn)
});