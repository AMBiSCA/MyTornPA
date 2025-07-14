document.addEventListener('DOMContentLoaded', function() {
    console.log("eventcalendar.js: Script loaded. Using event bar rendering model.");

    // Get essential calendar elements
    const calendarWrapper = document.querySelector('.calendar-wrapper');
    const calendarHeader = document.querySelector('.calendar-header');
    const calendarWeekdays = document.querySelector('.calendar-weekdays');
    const calendarDays = document.getElementById('calendarDays');
    
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
                    const currentMonthYear = document.getElementById('currentMonthYear');

                    // --- Event listener for Next/Previous buttons ---
                    calendarWrapper.addEventListener('click', (event) => {
                        if (event.target.closest('#prevMonthBtn')) {
                            currentDate.setMonth(currentDate.getMonth() - 1);
                            renderCalendar();
                        }
                        if (event.target.closest('#nextMonthBtn')) {
                            currentDate.setMonth(currentDate.getMonth() + 1);
                            renderCalendar();
                        }
                    });

                    // --- All functions defined below ---
                    function renderCalendar() {
                        calendarDays.innerHTML = ''; // Clear previous days and events
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
                        const apiUrl = `https://api.torn.com/v2/torn/calendar?key=${TORN_API_KEY}`;
                        try {
                            const response = await fetch(apiUrl);
                            if (!response.ok) { throw new Error(`API Error: ${response.status}`); }
                            const data = await response.json();
                            if (data && data.calendar && data.calendar.events) {
                                // Filter events for the currently viewed month
                                const eventsInMonth = Object.values(data.calendar.events).filter(event => {
                                    const eventStartDate = new Date(event.start * 1000);
                                    const eventEndDate = new Date(event.end * 1000);
                                    const viewStartDate = new Date(year, month - 1, 1);
                                    const viewEndDate = new Date(year, month, 0);
                                    // Check if event range overlaps with the current month view
                                    return eventStartDate <= viewEndDate && eventEndDate >= viewStartDate;
                                });
                                displayEventsOnCalendar(eventsInMonth);
                            } else { if(data.error) throw new Error(`API Error: ${data.error.error}`); }
                        } catch (error) { calendarDays.innerHTML = `<div class="calendar-message error">Could not load events. The API key might be invalid.</div>`; console.error(error); }
                    }

                    // This new function draws the bars
                    function displayEventsOnCalendar(events) {
                        events.forEach(event => {
                            const startDate = new Date(event.start * 1000);
                            const endDate = new Date(event.end * 1000);

                            // Normalize dates to midnight for accurate day-to-day looping
                            startDate.setHours(0, 0, 0, 0);
                            endDate.setHours(0, 0, 0, 0);

                            // Loop from the event's start date to its end date
                            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                                const formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                const dayElement = calendarDays.querySelector(`.calendar-day[data-date="${formattedDate}"]`);

                                if (dayElement) {
                                    dayElement.classList.add('event-day-range');

                                    const isStart = d.getTime() === startDate.getTime();
                                    const isEnd = d.getTime() === endDate.getTime();
                                    
                                    // Apply styles for the start, end, or single-day event
                                    if (isStart && isEnd) {
                                        dayElement.classList.add('event-range-single');
                                    } else if (isStart) {
                                        dayElement.classList.add('event-range-start');
                                    } else if (isEnd) {
                                        dayElement.classList.add('event-range-end');
                                    }

                                    // Add the event title text only on the first day
                                    if (isStart) {
                                        // Use innerHTML to add the new div
                                        dayElement.innerHTML += `<div class="day-event-title">${event.title}</div>`;
                                    }
                                }
                            }
                        });
                    }
                    
                    // Initial call to draw the calendar
                    renderCalendar();

                } else {
                    if (calendarDays) calendarDays.innerHTML = `<div class="calendar-message error"><h3>API Key Missing</h3><p>Your Torn API key is not saved in your user profile. Please go to your settings to add it.</p></div>`;
                }
            } catch (error) {
                console.error("Error fetching user data from Firestore:", error);
                if (calendarDays) calendarDays.innerHTML = `<div class="calendar-message error"><h3>Loading Error</h3><p>Could not load your profile data. Please refresh and try again.</p></div>`;
            }
        } else {
            if (calendarDays) calendarDays.innerHTML = `<div class="calendar-message"><h3>Please Log In</h3><p>You must be logged in to view the event calendar.</p></div>`;
        }
    });
});