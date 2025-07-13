// This is for ../js/eventcalendar.js
document.addEventListener('DOMContentLoaded', function() {
    console.log("eventcalendar.js: Script started. DOMContentLoaded event fired."); // DEBUG 1

    const calendarDays = document.getElementById('calendarDays');
    const currentMonthYear = document.getElementById('currentMonthYear');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    const eventDetailsSection = document.getElementById('eventDetails');
    const detailEventName = document.getElementById('detailEventName');
    const detailEventDate = document.getElementById('detailEventDate');
    const detailEventTime = document.getElementById('detailEventTime');
    const detailEventDescription = document.getElementById('detailEventDescription');
    const detailEventLink = document.getElementById('detailEventLink');
    const setReminderBtn = document.getElementById('setReminderBtn');

    // DEBUG 2: Check if essential elements are found
    console.log("eventcalendar.js: calendarDays element:", calendarDays);
    console.log("eventcalendar.js: currentMonthYear element:", currentMonthYear);
    console.log("eventcalendar.js: prevMonthBtn element:", prevMonthBtn);
    console.log("eventcalendar.js: nextMonthBtn element:", nextMonthBtn);


    let currentDate = new Date(); // Represents the month/year currently displayed

    // --- Torn API Key (IMPORTANT: Replace with a secure way to handle this!) ---
    const TORN_API_KEY = "gCNmxrHxlOYeNiS7"; // Your provided API key

    // --- Function to Render the Calendar ---
    function renderCalendar() {
        console.log("eventcalendar.js: renderCalendar function called."); // DEBUG 3

        calendarDays.innerHTML = ''; // Clear previous days
        eventDetailsSection.style.display = 'none'; // Hide event details when changing month

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth(); // 0-indexed (0 for Jan, 11 for Dec)

        // Set the display for the current month and year
        currentMonthYear.textContent = new Date(year, month).toLocaleString('en-US', {
            month: 'long',
            year: 'numeric'
        });
        console.log(`eventcalendar.js: Displaying month: ${currentMonthYear.textContent}`); // DEBUG 4

        // Get the first day of the month (0 = Sunday, 6 = Saturday)
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        // Get the number of days in the current month
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Fill leading empty days (from previous month)
        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.classList.add('calendar-day', 'empty');
            calendarDays.appendChild(emptyDay);
        }

        // Fill days of the current month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day');
            dayElement.textContent = day;
            dayElement.dataset.date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`; // YYYY-MM-DD
            // Add a class for the current day if applicable (for styling)
            if (day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()) {
                dayElement.classList.add('current-day');
            }
            calendarDays.appendChild(dayElement);
        }
        console.log(`eventcalendar.js: ${daysInMonth} days rendered for the month.`); // DEBUG 5


        // Fetch and display events for this month
        fetchTornEventsForMonth(year, month + 1);
    }

    // --- Navigation Buttons Event Listeners ---
    prevMonthBtn.addEventListener('click', () => {
        console.log("eventcalendar.js: 'Previous' button clicked."); // DEBUG 6
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        console.log("eventcalendar.js: 'Next' button clicked."); // DEBUG 7
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    // --- Function to Fetch Torn Events from API ---
    async function fetchTornEventsForMonth(year, month) {
        console.log(`eventcalendar.js: fetchTornEventsForMonth called for ${year}-${month}.`); // DEBUG 8
        // Clear existing event indicators before fetching new ones
        document.querySelectorAll('.event-indicator').forEach(el => el.remove());
        document.querySelectorAll('.calendar-day[data-events]').forEach(el => delete el.dataset.events);


        // Torn API calendar endpoint (you provided this earlier)
        const apiUrl = `https://api.torn.com/v2/torn/calendar?key=${TORN_API_KEY}`;
        console.log("eventcalendar.js: API URL:", apiUrl); // DEBUG 9

        try {
            const response = await fetch(apiUrl);
            console.log("eventcalendar.js: API Fetch response received:", response); // DEBUG 10
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            console.log("eventcalendar.js: Torn API Calendar Data (parsed):", data); // DEBUG 11

            if (data && data.events) {
                const eventsInMonth = Object.values(data.events).filter(event => {
                    const eventDate = new Date(event.start * 1000);
                    return eventDate.getFullYear() === year && (eventDate.getMonth() + 1) === month;
                });
                console.log(`eventcalendar.js: Found ${eventsInMonth.length} events for ${year}-${month}.`); // DEBUG 12
                displayEventsOnCalendar(eventsInMonth);
            } else {
                console.warn("eventcalendar.js: No 'events' data found in Torn API response or response is empty."); // DEBUG 13
            }

        } catch (error) {
            console.error("eventcalendar.js: Error fetching Torn events:", error); // DEBUG 14
            calendarDays.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: var(--text-color-error);">Error loading events. Please try again later.</div>';
        }
    }

    // --- Function to Display Events on Calendar Days ---
    function displayEventsOnCalendar(events) {
        console.log("eventcalendar.js: displayEventsOnCalendar called with events:", events); // DEBUG 15
        if (events.length === 0) {
            console.log("eventcalendar.js: No events to display for this month.");
        }
        events.forEach(event => {
            const eventStartTimestamp = event.start * 1000;
            const eventDateObj = new Date(eventStartTimestamp);

            const day = eventDateObj.getDate();
            const month = eventDateObj.getMonth();
            const year = eventDateObj.getFullYear();

            const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayElement = calendarDays.querySelector(`.calendar-day[data-date="${formattedDate}"]`);

            if (dayElement && !dayElement.classList.contains('empty')) {
                let eventIndicator = dayElement.querySelector('.event-indicator');
                if (!eventIndicator) {
                    eventIndicator = document.createElement('div');
                    eventIndicator.classList.add('event-indicator');
                    dayElement.appendChild(eventIndicator);
                }

                const displayEvent = {
                    name: event.name,
                    date: eventDateObj.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }),
                    time: eventDateObj.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    description: event.description,
                    link: event.link || `https://www.torn.com/calendar.php#${event.ID}`
                };

                const existingEvents = JSON.parse(dayElement.dataset.events || '[]');
                existingEvents.push(displayEvent);
                dayElement.dataset.events = JSON.stringify(existingEvents);

                // Add event listener to show details on click
                dayElement.addEventListener('click', (e) => {
                    const clickedEvents = JSON.parse(e.currentTarget.dataset.events);
                    if (clickedEvents && clickedEvents.length > 0) {
                        showEventDetails(clickedEvents[0]);
                    }
                });
                console.log(`eventcalendar.js: Event '${event.name}' added to day ${day}.`); // DEBUG 16
            } else {
                console.log(`eventcalendar.js: Day element not found or is empty for event: ${event.name} on ${formattedDate}`); // DEBUG 17
            }
        });
    }

    // --- Function to Show Event Details ---
    function showEventDetails(event) {
        console.log("eventcalendar.js: showEventDetails called for event:", event); // DEBUG 18
        detailEventName.textContent = event.name;
        detailEventDate.textContent = event.date;
        detailEventTime.textContent = event.time;
        detailEventDescription.textContent = event.description;
        detailEventLink.href = event.link;
        detailEventLink.textContent = event.link.length > 30 ? event.link.substring(0, 30) + '...' : event.link;

        eventDetailsSection.style.display = 'block';

        setReminderBtn.onclick = () => {
            alert(`Reminder set for: ${event.name} on ${event.date} at ${event.time} (functionality coming soon!)`);
        };
    }

    // --- Initial Render when page loads ---
    renderCalendar(); // Call renderCalendar to start the process
});