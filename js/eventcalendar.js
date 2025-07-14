document.addEventListener('DOMContentLoaded', function() {
    console.log("eventcalendar.js: Script loaded. Using event delegation model.");

    // Get calendar elements
    const calendarWrapper = document.querySelector('.calendar-wrapper');
    const calendarHeader = document.querySelector('.calendar-header');
    const calendarWeekdays = document.querySelector('.calendar-weekdays');
    const calendarDays = document.getElementById('calendarDays');
    const eventDetailsSection = document.getElementById('eventDetails');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    
    // Set an initial loading state
    if (calendarHeader) calendarHeader.style.display = 'none';
    if (calendarWeekdays) calendarWeekdays.style.display = 'none';
    if (calendarDays) calendarDays.innerHTML = `<div class="calendar-message">Loading Calendar...</div>`;

    // Listen for user authentication
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            try {
                // Fetch user data from Firestore
                const userDocRef = firebase.firestore().collection('userProfiles').doc(user.uid);
                const userDoc = await userDocRef.get();

                if (userDoc.exists && userDoc.data().tornApiKey) {
                    // --- SUCCESS: API Key Found ---
                    if (calendarHeader) calendarHeader.style.display = 'flex';
                    if (calendarWeekdays) calendarWeekdays.style.display = 'grid';

                    const TORN_API_KEY = userDoc.data().tornApiKey;
                    let currentDate = new Date();

                    // Get other elements needed once we know we are rendering
                    const currentMonthYear = document.getElementById('currentMonthYear');
                    const detailEventName = document.getElementById('detailEventName');
                    const detailEventDate = document.getElementById('detailEventDate');
                    const detailEventTime = document.getElementById('detailEventTime');
                    const detailEventDescription = document.getElementById('detailEventDescription');
                    const detailEventLink = document.getElementById('detailEventLink');
                    const setReminderBtn = document.getElementById('setReminderBtn');

                    // --- Single, smart event listener for all clicks ---
                    calendarWrapper.addEventListener('click', (event) => {
                        // For 'Previous Month' button
                        if (event.target.closest('#prevMonthBtn')) {
                            currentDate.setMonth(currentDate.getMonth() - 1);
                            renderCalendar();
                        }
                        // For 'Next Month' button
                        if (event.target.closest('#nextMonthBtn')) {
                            currentDate.setMonth(currentDate.getMonth() + 1);
                            renderCalendar();
                        }
                        // For any calendar day with an event
                        const dayElement = event.target.closest('.calendar-day:not(.empty)');
                        if (dayElement && dayElement.dataset.events) {
                            const events = JSON.parse(dayElement.dataset.events);
                            if (events && events.length > 0) {
                                showEventDetails(events[0]);
                            }
                        }
                    });

                    // Listener for closing the modal
                    modalCloseBtn.addEventListener('click', () => { eventDetailsSection.style.display = 'none'; });
                    eventDetailsSection.addEventListener('click', (event) => {
                        if (event.target === eventDetailsSection) { eventDetailsSection.style.display = 'none'; }
                    });

                    // --- All functions defined below ---
                    function renderCalendar() {
                        calendarDays.innerHTML = '';
                        eventDetailsSection.style.display = 'none';
                        const year = currentDate.getFullYear();
                        const month = currentDate.getMonth();
                        currentMonthYear.textContent = new Date(year, month).toLocaleString('en-US', { month: 'long', year: 'numeric' });
                        const firstDayOfMonth = new Date(year, month, 1).getDay();
                        const daysInMonth = new Date(year, month + 1, 0).getDate();
                        for (let i = 0; i < firstDayOfMonth; i++) { const emptyDay = document.createElement('div'); emptyDay.classList.add('calendar-day', 'empty'); calendarDays.appendChild(emptyDay); }
                        for (let day = 1; day <= daysInMonth; day++) { const dayElement = document.createElement('div'); dayElement.classList.add('calendar-day'); dayElement.textContent = day; dayElement.dataset.date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; if (day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()) { dayElement.classList.add('current-day'); } calendarDays.appendChild(dayElement); }
                        fetchTornEventsForMonth(year, month + 1);
                    }

                    async function fetchTornEventsForMonth(year, month) {
                        document.querySelectorAll('.event-indicator').forEach(el => el.remove());
                        document.querySelectorAll('.calendar-day[data-events]').forEach(el => delete el.dataset.events);
                        const apiUrl = `https://api.torn.com/v2/torn/calendar?key=${TORN_API_KEY}`;
                        try {
                            const response = await fetch(apiUrl);
                            if (!response.ok) { throw new Error(`API Error: ${response.status}`); }
                            const data = await response.json();
                            if (data && data.calendar && data.calendar.events) {
                                const eventsInMonth = Object.values(data.calendar.events).filter(event => {
                                    const eventDate = new Date(event.start * 1000);
                                    return eventDate.getFullYear() === year && (eventDate.getMonth() + 1) === month;
                                });
                                displayEventsOnCalendar(eventsInMonth);
                            } else { if(data.error) throw new Error(`API Error: ${data.error.error}`); }
                        } catch (error) { calendarDays.innerHTML = `<div class="calendar-message error">Could not load events. The API key might be invalid.</div>`; console.error(error); }
                    }

                    function displayEventsOnCalendar(events) {
                        events.forEach(event => {
                            const eventDateObj = new Date(event.start * 1000);
                            const day = eventDateObj.getDate();
                            const formattedDate = `${eventDateObj.getFullYear()}-${String(eventDateObj.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                            const dayElement = calendarDays.querySelector(`.calendar-day[data-date="${formattedDate}"]`);
                            if (dayElement && !dayElement.classList.contains('empty')) {
                                if (!dayElement.querySelector('.event-indicator')) { dayElement.insertAdjacentHTML('beforeend', '<div class="event-indicator"></div>'); }
                                const displayEvent = { name: event.title, date: eventDateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), time: eventDateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), description: event.description, link: `https://www.torn.com/calendar.php#${event.title.replace(/\s+/g, '_')}` };
                                const existingEvents = JSON.parse(dayElement.dataset.events || '[]');
                                existingEvents.push(displayEvent);
                                dayElement.dataset.events = JSON.stringify(existingEvents);
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

                    // Initial call to draw the calendar
                    renderCalendar();

                } else {
                    // Handle case where API key is missing
                    if (calendarDays) calendarDays.innerHTML = `<div class="calendar-message error"><h3>API Key Missing</h3><p>Your Torn API key is not saved in your user profile. Please go to your settings to add it.</p></div>`;
                }
            } catch (error) {
                // Handle error fetching data
                console.error("Error fetching user data from Firestore:", error);
                if (calendarDays) calendarDays.innerHTML = `<div class="calendar-message error"><h3>Loading Error</h3><p>Could not load your profile data. Please refresh and try again.</p></div>`;
            }
        } else {
            // Handle user not being logged in
            if (calendarDays) calendarDays.innerHTML = `<div class="calendar-message"><h3>Please Log In</h3><p>You must be logged in to view the event calendar.</p></div>`;
        }
    });
});