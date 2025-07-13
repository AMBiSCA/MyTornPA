// This is for ../js/eventcalendar.js
document.addEventListener('DOMContentLoaded', function() {
    console.log("eventcalendar.js: Script started. DOMContentLoaded event fired."); // DEBUG 1

    // Move all element selections INSIDE this DOMContentLoaded callback
    const calendarDays = document.getElementById('calendarDays');
    const currentMonthYear = document.getElementById('currentMonthYear');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');

    const eventModal = document.getElementById('eventModal');
    // Ensure eventModal is not null before querying its children
    const modalCloseBtn = eventModal ? eventModal.querySelector('.modal-close-btn') : null;
    const modalEventTitle = document.getElementById('modalEventTitle');
    const modalEventContent = document.getElementById('modalEventContent');
    const modalSetReminderBtn = document.getElementById('modalSetReminderBtn');


    // DEBUG 2: Check if essential elements are found
    console.log("eventcalendar.js: calendarDays element:", calendarDays);
    console.log("eventcalendar.js: currentMonthYear element:", currentMonthYear);
    console.log("eventcalendar.js: prevMonthBtn element:", prevMonthBtn);
    console.log("eventcalendar.js: nextMonthBtn element:", nextMonthBtn);
    console.log("eventcalendar.js: eventModal element:", eventModal); // DEBUG: Check new modal element
    console.log("eventcalendar.js: modalCloseBtn element:", modalCloseBtn); // DEBUG: Check modal close button


    let currentDate = new Date(); // Represents the month/year currently displayed

    // --- Torn API Key (IMPORTANT: Replace with a secure way to handle this!) ---
    const TORN_API_KEY = "gCNmxrHxlOYeNiS7"; // Your provided API key

    // --- Function to Render the Calendar ---
    function renderCalendar() {
        console.log("eventcalendar.js: renderCalendar function called."); // DEBUG 3

        calendarDays.innerHTML = ''; // Clear previous days
        // Only try to hide if eventModal exists
        if (eventModal) { // Add a check here
            eventModal.style.display = 'none'; // Hide modal when changing month
        }

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
    // Add checks for null before adding listeners
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            console.log("eventcalendar.js: 'Previous' button clicked."); // DEBUG 6
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
    } else {
        console.warn("eventcalendar.js: prevMonthBtn not found, cannot attach listener.");
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            console.log("eventcalendar.js: 'Next' button clicked."); // DEBUG 7
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    } else {
        console.warn("eventcalendar.js: nextMonthBtn not found, cannot attach listener.");
    }


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

            // FIX: Access events correctly via data.calendar.events
            if (data && data.calendar && data.calendar.events) {
                const eventsInMonth = Object.values(data.calendar.events).filter(event => {
                    const eventDate = new Date(event.start * 1000); // 'start' is the timestamp from the API in seconds
                    return eventDate.getFullYear() === year && (eventDate.getMonth() + 1) === month;
                });
                console.log(`eventcalendar.js: Found ${eventsInMonth.length} events for ${year}-${month}.`); // DEBUG 12
                displayEventsOnCalendar(eventsInMonth);
            } else {
                console.warn("eventcalendar.js: No 'events' data found in Torn API response or response is empty, or 'calendar' object is missing."); // DEBUG 13 (UPDATED MESSAGE)
            }

        } catch (error) {
            console.error("eventcalendar.js: Error fetching Torn events:", error); // DEBUG 14
            if (calendarDays) { // Add a check here
                 calendarDays.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: var(--text-color-error);">Error loading events. Please try again later.</div>';
            }
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

                // Prepare event details for display.
                const displayEvent = {
                    name: event.title,
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
                    link: `https://www.torn.com/calendar.php#${event.title.replace(/\s+/g, '_')}`
                };


                const existingEvents = JSON.parse(dayElement.dataset.events || '[]');
                existingEvents.push(displayEvent);
                dayElement.dataset.events = JSON.stringify(existingEvents);

                dayElement.addEventListener('click', (e) => {
                    const clickedEvents = JSON.parse(e.currentTarget.dataset.events);
                    if (clickedEvents && clickedEvents.length > 0) {
                        showEventDetails(clickedEvents);
                    }
                });
                console.log(`eventcalendar.js: Event '${event.title}' added to day ${day}.`); // DEBUG 16
            } else {
                console.log(`eventcalendar.js: Day element not found or is empty for event: ${event.title} on ${formattedDate}`); // DEBUG 17
            }
        });
    }

    // --- Function to Show Event Details (UPDATED for modal) ---
    function showEventDetails(events) {
        console.log("eventcalendar.js: showEventDetails called for events:", events); // DEBUG 18

        if (!eventModal || !modalEventTitle || !modalEventContent || !modalSetReminderBtn) { // Add checks here
            console.error("eventcalendar.js: Modal elements not found. Cannot show details.");
            return;
        }

        modalEventTitle.textContent = "Event Details";
        modalEventContent.innerHTML = '';

        if (events.length === 1) {
            const event = events[0];
            modalEventTitle.textContent = event.name;
            modalEventContent.innerHTML = `
                <p><strong>Date:</strong> ${event.date}</p>
                <p><strong>Time:</strong> ${event.time}</p>
                <p><strong>Description:</strong> ${event.description}</p>
                <p><strong>Link:</strong> <a href="${event.link}" target="_blank" rel="noopener noreferrer">${event.link.length > 50 ? event.link.substring(0, 50) + '...' : event.link}</a></p>
            `;
            // Ensure the main modal reminder button is visible for single events
            modalSetReminderBtn.style.display = 'block';
            modalSetReminderBtn.onclick = () => {
                alert(`Reminder set for: ${event.name} on ${event.date} at ${event.time} (functionality coming soon!)`);
            };
        } else {
            modalEventTitle.textContent = `Events on ${events[0].date}`;
            let eventsListHtml = '<ul>';
            events.forEach(event => {
                eventsListHtml += `
                    <li>
                        <h4>${event.name}</h4>
                        <p><strong>Time:</strong> ${event.time}</p>
                        <p><strong>Description:</strong> ${event.description}</p>
                        <p><strong>Link:</strong> <a href="${event.link}" target="_blank" rel="noopener noreferrer">${event.link.length > 50 ? event.link.substring(0, 50) + '...' : event.link}</a></p>
                        <button class="action-btn set-single-reminder-btn" data-event-name="${event.name}" data-event-date="${event.date}" data-event-time="${event.time}">Set Reminder for This Event</button>
                    </li>
                `;
            });
            eventsListHtml += '</ul>';
            modalEventContent.innerHTML = eventsListHtml;
            // Hide the main reminder button for multiple events, individual ones are shown
            modalSetReminderBtn.style.display = 'none';

            document.querySelectorAll('.set-single-reminder-btn').forEach(btn => {
                btn.onclick = (e) => {
                    const eventName = e.target.dataset.eventName;
                    const eventDate = e.target.dataset.eventDate;
                    const eventTime = e.target.dataset.eventTime;
                    alert(`Reminder set for: ${eventName} on ${eventDate} at ${eventTime} (functionality coming soon!)`);
                };
            });
        }

        eventModal.style.display = 'flex'; // Show the modal
    }

    // --- Close Modal Event Listener ---
    // Add check for null before adding listener
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            eventModal.style.display = 'none';
            console.log("eventcalendar.js: Modal closed.");
        });
    } else {
        console.warn("eventcalendar.js: modalCloseBtn not found, cannot attach listener.");
    }


    // Close modal if clicked outside of modal content
    if (eventModal) { // Add check for null here
        window.addEventListener('click', (event) => {
            if (event.target === eventModal) {
                eventModal.style.display = 'none';
                console.log("eventcalendar.js: Modal closed by clicking outside.");
            }
        });
    } else {
        console.warn("eventcalendar.js: eventModal not found, cannot attach outside click listener.");
    }


    // --- Initial Render when page loads ---
    renderCalendar(); // Call renderCalendar to start the process
});