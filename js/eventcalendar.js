// This is for ../js/eventcalendar.js - Cleaned and Finalized Logic
document.addEventListener('DOMContentLoaded', function() {
    // Get references to all necessary DOM elements once the DOM is loaded
    const calendarDays = document.getElementById('calendarDays');
    const currentMonthYear = document.getElementById('currentMonthYear');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');

    const eventModal = document.getElementById('eventModal');
    const modalCloseBtn = eventModal ? eventModal.querySelector('.modal-close-btn') : null; // Check if eventModal exists
    const modalEventTitle = document.getElementById('modalEventTitle');
    const modalEventContent = document.getElementById('modalEventContent');
    const modalSetReminderBtn = document.getElementById('modalSetReminderBtn');

    // Initialize the current date for the calendar display
    let currentDate = new Date(); 

    // --- Torn API Key (IMPORTANT: Consider more secure handling in production!) ---
    const TORN_API_KEY = "gCNmxrHxlOYeNiS7"; // Your provided API key

    // --- Function to Render the Calendar Days ---
    function renderCalendar() {
        calendarDays.innerHTML = ''; // Clear previous days

        // Hide the modal whenever the calendar view changes
        if (eventModal) {
            eventModal.style.display = 'none'; 
        }

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth(); // 0-indexed (0 for Jan, 11 for Dec)

        // Update the displayed month and year in the header
        currentMonthYear.textContent = new Date(year, month).toLocaleString('en-US', {
            month: 'long',
            year: 'numeric'
        });

        // Calculate days to display (leading empty days + actual days in month)
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Add empty divs for days before the 1st of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.classList.add('calendar-day', 'empty');
            calendarDays.appendChild(emptyDay);
        }

        // Add divs for each day of the current month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day');
            dayElement.textContent = day;
            dayElement.dataset.date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            // Highlight the current day if it matches today's date
            if (day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear()) {
                dayElement.classList.add('current-day');
            }
            calendarDays.appendChild(dayElement);
        }

        // Fetch and display Torn events for the currently rendered month
        fetchTornEventsForMonth(year, month + 1);
    }

    // --- Navigation Button Event Listeners ---
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }

    // --- Function to Fetch Torn Events from API ---
    async function fetchTornEventsForMonth(year, month) {
        // Clear any existing event indicators and data attributes from previous fetches
        document.querySelectorAll('.event-indicator').forEach(el => el.remove());
        document.querySelectorAll('.calendar-day[data-events]').forEach(el => delete el.dataset.events);

        const apiUrl = `https://api.torn.com/v2/torn/calendar?key=${TORN_API_KEY}`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            // Check for correct API response structure (data.calendar.events)
            if (data && data.calendar && data.calendar.events) {
                // Filter events that fall within the currently displayed month
                const eventsInMonth = Object.values(data.calendar.events).filter(event => {
                    const eventDate = new Date(event.start * 1000); // API timestamp is in seconds, convert to milliseconds
                    return eventDate.getFullYear() === year && (eventDate.getMonth() + 1) === month;
                });
                displayEventsOnCalendar(eventsInMonth);
            } else {
                console.warn("No 'events' data found in Torn API response or response structure is unexpected.");
            }

        } catch (error) {
            console.error("Error fetching Torn events:", error);
            if (calendarDays) {
                 calendarDays.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: var(--text-color-error);">Error loading events. Please try again later.</div>';
            }
        }
    }

    // --- Function to Display Events on Calendar Days ---
    function displayEventsOnCalendar(events) {
        events.forEach(event => {
            const eventDateObj = new Date(event.start * 1000);

            const day = eventDateObj.getDate();
            const month = eventDateObj.getMonth();
            const year = eventDateObj.getFullYear();

            const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayElement = calendarDays.querySelector(`.calendar-day[data-date="${formattedDate}"]`);

            if (dayElement && !dayElement.classList.contains('empty')) {
                // Add a visual indicator for events on the day cell
                let eventIndicator = dayElement.querySelector('.event-indicator');
                if (!eventIndicator) {
                    eventIndicator = document.createElement('div');
                    eventIndicator.classList.add('event-indicator');
                    dayElement.appendChild(eventIndicator);
                }

                // Prepare event data for modal display
                const displayEvent = {
                    name: event.title, // API uses 'title' for event name
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
                    link: `https://www.torn.com/calendar.php#${encodeURIComponent(event.title.replace(/\s+/g, '_'))}` // Construct a basic link
                };

                // Store all events for this day in a dataset attribute (as an array)
                const existingEvents = JSON.parse(dayElement.dataset.events || '[]');
                existingEvents.push(displayEvent);
                dayElement.dataset.events = JSON.stringify(existingEvents);

                // Add click listener to show modal when a day with events is clicked
                dayElement.addEventListener('click', (e) => {
                    const clickedEvents = JSON.parse(e.currentTarget.dataset.events);
                    if (clickedEvents && clickedEvents.length > 0) {
                        showEventDetails(clickedEvents);
                    }
                });
            }
        });
    }

    // --- Function to Show Event Details in the Modal ---
    function showEventDetails(events) { // Accepts an array of events for the clicked day
        // Ensure all modal elements are available before attempting to use them
        if (!eventModal || !modalEventTitle || !modalEventContent || !modalSetReminderBtn) {
            console.error("Error: Modal elements not found. Cannot show event details.");
            return;
        }

        modalEventContent.innerHTML = ''; // Clear previous modal content

        if (events.length === 1) {
            const event = events[0];
            modalEventTitle.textContent = event.name; // Use event name as modal title
            modalEventContent.innerHTML = `
                <p><strong>Date:</strong> ${event.date}</p>
                <p><strong>Time:</strong> ${event.time}</p>
                <p><strong>Description:</strong> ${event.description}</p>
                <p><strong>Link:</strong> <a href="${event.link}" target="_blank" rel="noopener noreferrer">${event.link}</a></p>
            `;
            // For single events, the main reminder button is used
            modalSetReminderBtn.style.display = 'block';
            modalSetReminderBtn.onclick = () => {
                alert(`Reminder set for: ${event.name} on ${event.date} at ${event.time} (Reminder feature coming soon!)`);
            };
        } else {
            // If multiple events on one day, list them in the modal
            modalEventTitle.textContent = `Events on ${events[0].date}`; // Date as title for multiple events
            let eventsListHtml = '<ul>';
            events.forEach(event => {
                eventsListHtml += `
                    <li>
                        <h4>${event.name}</h4>
                        <p><strong>Time:</strong> ${event.time}</p>
                        <p><strong>Description:</strong> ${event.description}</p>
                        <p><strong>Link:</strong> <a href="${event.link}" target="_blank" rel="noopener noreferrer">${event.link}</a></p>
                        <button class="action-btn set-single-reminder-btn" data-event-name="${event.name}" data-event-date="${event.date}" data-event-time="${event.time}">Set Reminder for This Event</button>
                    </li>
                `;
            });
            eventsListHtml += '</ul>';
            modalEventContent.innerHTML = eventsListHtml;
            
            // Hide the main reminder button and use individual ones for multiple events
            modalSetReminderBtn.style.display = 'none';

            // Attach listeners to individual reminder buttons inside the list
            document.querySelectorAll('.set-single-reminder-btn').forEach(btn => {
                btn.onclick = (e) => {
                    const eventName = e.target.dataset.eventName;
                    const eventDate = e.target.dataset.eventDate;
                    const eventTime = e.target.dataset.eventTime;
                    alert(`Reminder set for: ${eventName} on ${eventDate} at ${eventTime} (Reminder feature coming soon!)`);
                };
            });
        }

        // Show the modal by setting its display style
        eventModal.style.display = 'flex'; 
    }

    // --- Modal Close Event Listeners ---
    // Close modal via the 'x' button
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            eventModal.style.display = 'none';
        });
    }

    // Close modal if clicked outside of modal content
    if (eventModal) {
        window.addEventListener('click', (event) => {
            if (event.target === eventModal) {
                eventModal.style.display = 'none';
            }
        });
    }

    // --- Initial Render when page loads ---
    renderCalendar(); 
});