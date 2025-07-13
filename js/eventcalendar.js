document.addEventListener('DOMContentLoaded', function() {
    console.log("eventcalendar.js: Script started.");

    // Get all calendar elements immediately
    const calendarWrapper = document.querySelector('.calendar-wrapper');
    const calendarHeader = document.querySelector('.calendar-header');
    const calendarWeekdays = document.querySelector('.calendar-weekdays');
    const calendarDays = document.getElementById('calendarDays');
    const currentMonthYear = document.getElementById('currentMonthYear');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    const eventDetailsSection = document.getElementById('eventDetails');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    
    // Show a loading state immediately
    if (calendarHeader) calendarHeader.style.display = 'none';
    if (calendarWeekdays) calendarWeekdays.style.display = 'none';
    if (calendarDays) calendarDays.innerHTML = `<div class="calendar-message">Loading Calendar...</div>`;

    // Wait for Firebase to determine the user's authentication state
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            // --- User is logged in ---
            try {
                const userDocRef = firebase.firestore().collection('userProfiles').doc(user.uid);
                const userDoc = await userDocRef.get();

                if (userDoc.exists && userDoc.data().tornApiKey) {
                    // --- API Key Found: Build the calendar ---
                    console.log("API key found. Initializing calendar.");
                    if (calendarHeader) calendarHeader.style.display = 'flex';
                    if (calendarWeekdays) calendarWeekdays.style.display = 'grid';

                    const TORN_API_KEY = userDoc.data().tornApiKey;
                    
                    const detailEventName = document.getElementById('detailEventName');
                    const detailEventDate = document.getElementById('detailEventDate');
                    const detailEventTime = document.getElementById('detailEventTime');
                    const detailEventDescription = document.getElementById('detailEventDescription');
                    const detailEventLink = document.getElementById('detailEventLink');
                    const setReminderBtn = document.getElementById('setReminderBtn');

                    let currentDate = new Date();

                    modalCloseBtn.addEventListener('click', () => { eventDetailsSection.style.display = 'none'; });
                    eventDetailsSection.addEventListener('click', (event) => {
                        if (event.target === eventDetailsSection) { eventDetailsSection.style.display = 'none'; }
                    });

                    function renderCalendar() {
                        calendarDays.innerHTML = '';
                        eventDetailsSection.style.display = 'none';
                        const year = currentDate.getFullYear();
                        const month = currentDate.getMonth();
                        currentMonthYear.textContent = new Date(year, month).toLocaleString('en-US', { month: 'long', year: 'numeric' });
                        const firstDayOfMonth = new Date(year, month, 1).getDay();
                        const daysInMonth = new Date(year, month + 1, 0).getDate();
                        for (let i = 0; i < firstDayOfMonth; i++) {
                            const emptyDay = document.createElement('div');
                            emptyDay.classList.add('calendar-day', 'empty');
                            calendarDays.appendChild(emptyDay);
                        }
                        for (let day = 1; day <= daysInMonth; day++) {
                            const dayElement = document.createElement('div');
                            dayElement.classList.add('calendar-day');
                            dayElement.textContent = day;
                            dayElement.dataset.date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            if (day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()) {
                                dayElement.classList.add('current-day');
                            }
                            calendarDays.appendChild(dayElement);
                        }
                        fetchTornEventsForMonth(year, month + 1);
                    }

                    prevMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
                    nextMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });

                    async function fetchTornEventsForMonth(year, month) {
                        document.querySelectorAll('.event-indicator').forEach(el => el.remove());
                        document.querySelectorAll('.calendar-day[data-events]').forEach(el => delete el.dataset.events);
                        const apiUrl = `https://api.torn.com/v2/torn/calendar?key=${TORN_API_KEY}`;
                        try {
                            const response = await fetch(apiUrl);
                            if (!response.ok) { throw new Error(`HTTP error! status: ${response.status}`); }
                            const data = await response.json();
                            if (data && data.calendar && data.calendar.events) {
                                const eventsInMonth = Object.values(data.calendar.events).filter(event => {
                                    const eventDate = new Date(event.start * 1000);
                                    return eventDate.getFullYear() === year && (eventDate.getMonth() + 1) === month;
                                });
                                displayEventsOnCalendar(eventsInMonth);
                            } else { console.warn("No 'events' data found in Torn API response."); }
                        } catch (error) { calendarDays.innerHTML = `<div class="calendar-message error">Error loading events. Please try again later.</div>`; }
                    }

                    function displayEventsOnCalendar(events) {
                        events.forEach(event => {
                            const eventDateObj = new Date(event.start * 1000);
                            const day = eventDateObj.getDate();
                            const formattedDate = `${eventDateObj.getFullYear()}-${String(eventDateObj.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const dayElement = calendarDays.querySelector(`.calendar-day[data-date="${formattedDate}"]`);
                            if (dayElement && !dayElement.classList.contains('empty')) {
                                if (!dayElement.querySelector('.event-indicator')) {
                                    const eventIndicator = document.createElement('div');
                                    eventIndicator.classList.add('event-indicator');
                                    dayElement.appendChild(eventIndicator);
                                }
                                const displayEvent = { name: event.title, date: eventDateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), time: eventDateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), description: event.description, link: `https://www.torn.com/calendar.php#${event.title.replace(/\s+/g, '_')}` };
                                const existingEvents = JSON.parse(dayElement.dataset.events || '[]');
                                existingEvents.push(displayEvent);
                                dayElement.dataset.events = JSON.stringify(existingEvents);
                                dayElement.addEventListener('click', (e) => {
                                    const clickedEvents = JSON.parse(e.currentTarget.dataset.events);
                                    if (clickedEvents && clickedEvents.length > 0) { showEventDetails(clickedEvents[0]); }
                                });
                            }
                        });
                    }

                    function showEventDetails(event) {
                        detailEventName.textContent = event.name;
                        detailEventDate.textContent = event.date;
                        detailEventTime.textContent = event.time;
                        detailEventDescription.textContent = event.description;
                        detailEventLink.href = event.link;
                        detailEventLink.textContent = event.link;
                        eventDetailsSection.style.display = 'flex';
                        setReminderBtn.onclick = () => { alert(`Reminder set for: ${event.name} on ${event.date} at ${event.time} (functionality coming soon!)`); };
                    }

                    renderCalendar();

                } else {
                    // --- API Key NOT Found ---
                    if(calendarDays) calendarDays.innerHTML = `<div class="calendar-message error"><h3>API Key Missing</h3><p>Your Torn API key is not saved in your user profile. Please go to your settings to add it.</p></div>`;
                }
            } catch (error) {
                // --- Error Fetching Data ---
                if(calendarDays) calendarDays.innerHTML = `<div class="calendar-message error"><h3>Loading Error</h3><p>Could not load your profile data. Please refresh and try again.</p></div>`;
            }
        } else {
            // --- User is NOT logged in ---
            if(calendarDays) calendarDays.innerHTML = `<div class="calendar-message"><h3>Please Log In</h3><p>You must be logged in to view the event calendar.</p></div>`;
        }
    });
});