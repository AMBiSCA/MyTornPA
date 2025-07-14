document.addEventListener('DOMContentLoaded', function() {
    console.log("DEBUG: eventcalendar.js script started.");

    // --- Let's check if we can find the HTML elements ---
    const calendarWrapper = document.querySelector('.calendar-wrapper');
    console.log("DEBUG: Finding '.calendar-wrapper':", calendarWrapper);
    const calendarHeader = document.querySelector('.calendar-header');
    console.log("DEBUG: Finding '.calendar-header':", calendarHeader);
    const calendarWeekdays = document.querySelector('.calendar-weekdays');
    console.log("DEBUG: Finding '.calendar-weekdays':", calendarWeekdays);
    const calendarDays = document.getElementById('calendarDays');
    console.log("DEBUG: Finding '#calendarDays':", calendarDays);

    // --- Show a loading state immediately ---
    console.log("DEBUG: Setting initial 'Loading' state.");
    if (calendarHeader) calendarHeader.style.display = 'none';
    if (calendarWeekdays) calendarWeekdays.style.display = 'none';
    if (calendarDays) {
        calendarDays.innerHTML = `<div class="calendar-message">Loading Calendar...</div>`;
    } else {
        console.error("DEBUG FATAL: Could not find #calendarDays to show loading message.");
        return; // Stop if we can't find the main element
    }

    // --- Wait for Firebase to determine the user's authentication state ---
    console.log("DEBUG: Setting up Firebase auth listener.");
    firebase.auth().onAuthStateChanged(async (user) => {
        console.log("DEBUG: Auth state changed. User object:", user);
        if (user) {
            // --- User is logged in ---
            try {
                console.log("DEBUG: User is logged in. Fetching profile from 'userProfiles'...");
                const userDocRef = firebase.firestore().collection('userProfiles').doc(user.uid);
                const userDoc = await userDocRef.get();
                console.log("DEBUG: Firestore document received. Exists?", userDoc.exists);

                if (userDoc.exists && userDoc.data().tornApiKey) {
                    console.log("DEBUG: API Key found. Preparing to build calendar.");
                    
                    if (calendarHeader) calendarHeader.style.display = 'flex';
                    if (calendarWeekdays) calendarWeekdays.style.display = 'grid';
                    
                    // The rest of the script is the same as before, just with more logs
                    const TORN_API_KEY = userDoc.data().tornApiKey;
                    const eventDetailsSection = document.getElementById('eventDetails');
                    const modalCloseBtn = document.getElementById('modalCloseBtn');
                    const detailEventName = document.getElementById('detailEventName');
                    const detailEventDate = document.getElementById('detailEventDate');
                    const detailEventTime = document.getElementById('detailEventTime');
                    const detailEventDescription = document.getElementById('detailEventDescription');
                    const detailEventLink = document.getElementById('detailEventLink');
                    const setReminderBtn = document.getElementById('setReminderBtn');
                    const currentMonthYear = document.getElementById('currentMonthYear');
                    const prevMonthBtn = document.getElementById('prevMonthBtn');
                    const nextMonthBtn = document.getElementById('nextMonthBtn');
                    let currentDate = new Date();

                    modalCloseBtn.addEventListener('click', () => { eventDetailsSection.style.display = 'none'; });
                    eventDetailsSection.addEventListener('click', (event) => { if (event.target === eventDetailsSection) { eventDetailsSection.style.display = 'none'; } });

                    function renderCalendar() {
                        console.log("DEBUG: renderCalendar() function started.");
                        calendarDays.innerHTML = '';
                        eventDetailsSection.style.display = 'none';
                        const year = currentDate.getFullYear();
                        const month = currentDate.getMonth();
                        currentMonthYear.textContent = new Date(year, month).toLocaleString('en-US', { month: 'long', year: 'numeric' });
                        const firstDayOfMonth = new Date(year, month, 1).getDay();
                        const daysInMonth = new Date(year, month + 1, 0).getDate();
                        for (let i = 0; i < firstDayOfMonth; i++) { const emptyDay = document.createElement('div'); emptyDay.classList.add('calendar-day', 'empty'); calendarDays.appendChild(emptyDay); }
                        for (let day = 1; day <= daysInMonth; day++) { const dayElement = document.createElement('div'); dayElement.classList.add('calendar-day'); dayElement.textContent = day; dayElement.dataset.date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; if (day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()) { dayElement.classList.add('current-day'); } calendarDays.appendChild(dayElement); }
                        console.log("DEBUG: Calling fetchTornEventsForMonth...");
                        fetchTornEventsForMonth(year, month + 1);
                        console.log("DEBUG: renderCalendar() finished.");
                    }

                    prevMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
                    nextMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });
                    async function fetchTornEventsForMonth(year, month) { /* ... same as before ... */ }
                    function displayEventsOnCalendar(events) { /* ... same as before ... */ }
                    function showEventDetails(event) { /* ... same as before ... */ }

                    console.log("DEBUG: Calling renderCalendar() for the first time.");
                    renderCalendar();

                } else {
                    console.error("DEBUG: API Key NOT found in profile.");
                    if(calendarDays) calendarDays.innerHTML = `<div class="calendar-message error"><h3>API Key Missing</h3><p>Your Torn API key is not saved in your user profile. Please go to your settings to add it.</p></div>`;
                }
            } catch (error) {
                console.error("DEBUG: Error inside try...catch block:", error);
                if(calendarDays) calendarDays.innerHTML = `<div class="calendar-message error"><h3>Loading Error</h3><p>Could not load your profile data. Please refresh and try again.</p></div>`;
            }
        } else {
            console.log("DEBUG: User is not logged in.");
            if(calendarDays) calendarDays.innerHTML = `<div class="calendar-message"><h3>Please Log In</h3><p>You must be logged in to view the event calendar.</p></div>`;
        }
    });
});