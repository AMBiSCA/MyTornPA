let currentDate = new Date(); // Tracks the month being displayed
let currentMonthEvents = {}; // Stores events for the current month, fetched from Torn API
const eventColors = ['#3b5998', '#6a4c93', '#1982c4', '#8ac926', '#ffca3a', '#ff595e', '#2d6a4f'];

document.addEventListener('DOMContentLoaded', function() {
    console.log("eventcalendar.js: DOMContentLoaded event fired. Initializing Event Calendar functionality.");

    // --- UI References for the calendar and event modal ---
    const calendarWrapper = document.querySelector('.calendar-wrapper');
    const calendarHeader = document.querySelector('.calendar-header');
    const calendarWeekdays = document.querySelector('.calendar-weekdays');
    const calendarDaysGrid = document.getElementById('calendarDays'); // Renamed to avoid conflict with function
    const currentMonthYearHeader = document.getElementById('currentMonthYear');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    
    // Event Details Modal
    const eventDetailsModal = document.getElementById('eventDetails');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const detailEventName = document.getElementById('detailEventName');
    const detailEventDate = document.getElementById('detailEventDate');
    const detailEventTime = document.getElementById('detailEventTime');
    const detailEventDescription = document.getElementById('detailEventDescription');
    const detailEventLink = document.getElementById('detailEventLink');
    const setReminderBtn = document.getElementById('setReminderBtn');
    const eventTooltip = document.getElementById('event-tooltip');

    // Initially hide calendar parts until data is loaded and user is authenticated
    if (calendarHeader) calendarHeader.style.display = 'none';
    if (calendarWeekdays) calendarWeekdays.style.display = 'none';
    if (calendarDaysGrid) calendarDaysGrid.innerHTML = `<div class="calendar-message">Please log in to view the calendar.</div>`;
    
    // --- Store API Key from outer scope (will be passed by a global init function) ---
    let TORN_API_KEY = null;

    // --- Exposed Initialization Function ---
    // This function will be called by your firebase-init.js or globalheader.js
    // once the user is authenticated and their API key is available.
    window.initializeEventCalendarPage = async function(apiKey) {
        TORN_API_KEY = apiKey;
        console.log("eventcalendar.js: initializeEventCalendarPage called with API Key.");

        if (!TORN_API_KEY) {
            if (calendarDaysGrid) calendarDaysGrid.innerHTML = `<div class="calendar-message error"><h3>API Key Missing</h3><p>Your Torn API key is not saved in your user profile.</p></div>`;
            return;
        }

        // Show calendar elements now that we have the API key
        if (calendarHeader) calendarHeader.style.display = 'flex';
        if (calendarWeekdays) calendarWeekdays.style.display = 'grid';
        if (calendarDaysGrid) calendarDaysGrid.innerHTML = ''; // Clear initial message

        // Initial render of the calendar
        renderCalendar();
        setupEventListeners(); // Setup event listeners specific to calendar controls
    };

    // --- Core Calendar Rendering Logic ---
    async function renderCalendar() {
        updateNavButtonsState(); // Update disabled state for month navigation

        calendarDaysGrid.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth(); // 0-indexed month for Date object

        currentMonthYearHeader.textContent = new Date(year, month).toLocaleString('en-US', { month: 'long', year: 'numeric' });

        // Calculate leading blank days and days in month
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 for Sunday
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Add empty cells for preceding days
        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.classList.add('calendar-day', 'empty');
            calendarDaysGrid.appendChild(emptyDay);
        }

        // Add day cells for the current month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day');
            dayElement.textContent = day;
            dayElement.dataset.date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            // Highlight current day
            const today = new Date();
            if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayElement.classList.add('current-day');
            }
            calendarDaysGrid.appendChild(dayElement);
        }

        // Fetch Torn events and display them on the newly rendered calendar
        await fetchTornEventsForMonth(year, month + 1); // Month for API is 1-indexed
    }

    // --- Torn API Event Fetching ---
    async function fetchTornEventsForMonth(year, month) {
        if (!TORN_API_KEY) {
            console.error("Torn API Key is not set. Cannot fetch events.");
            calendarDaysGrid.innerHTML = `<div class="calendar-message error"><h3>API Key Required</h3><p>Please ensure your Torn API key is set to fetch events.</p></div>`;
            return;
        }

        const apiUrl = `https://api.torn.com/v2/torn/calendar?key=${TORN_API_KEY}&comment=MyTornPA_EventCalendar`;
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API Error: ${response.status} - ${errorData.error?.error || response.statusText}`);
            }
            const data = await response.json();
            
            if (data && data.calendar && data.calendar.events) {
                // Filter events to only those relevant to the displayed month
                const eventsInMonth = Object.values(data.calendar.events).filter(event => {
                    const eventStartDate = new Date(event.start * 1000);
                    const eventEndDate = new Date(event.end * 1000);
                    const viewStartDate = new Date(year, month - 1, 1); // Month - 1 because Date object is 0-indexed
                    const viewEndDate = new Date(year, month, 0, 23, 59, 59); // Last day of month, end of day
                    return eventStartDate <= viewEndDate && eventEndDate >= viewStartDate;
                });
                displayEventsOnCalendar(eventsInMonth);
            } else {
                if(data.error) throw new Error(`API Error: ${data.error.error}`);
                console.log("No calendar events found in API response for this month.");
            }
        } catch (error) {
            calendarDaysGrid.innerHTML = `<div class="calendar-message error"><h3>Event Load Error</h3><p>Could not load events: ${error.message}</p></div>`;
            console.error("Error fetching Torn events:", error);
        }
    }

    // --- Display Event Bars on Calendar Days ---
    function displayEventsOnCalendar(events) {
        // Map events to days for quick lookup
        const eventsByDay = {};
        events.forEach(event => {
            const originalStartDate = new Date(event.start * 1000);
            const originalEndDate = new Date(event.end * 1000);

            // Normalize dates to start of day for comparison
            const normalizedStartDate = new Date(originalStartDate);
            normalizedStartDate.setHours(0, 0, 0, 0);
            const normalizedEndDate = new Date(originalEndDate);
            normalizedEndDate.setHours(0, 0, 0, 0);

            // Loop through each day the event spans
            for (let d = new Date(normalizedStartDate); d <= normalizedEndDate; d.setDate(d.getDate() + 1)) {
                if (d.getMonth() !== currentDate.getMonth() || d.getFullYear() !== currentDate.getFullYear()) {
                    continue; // Only add events for the currently displayed month
                }
                const dayKey = d.getDate();
                if (!eventsByDay[dayKey]) {
                    eventsByDay[dayKey] = [];
                }
                eventsByDay[dayKey].push({ ...event, dateInstance: d }); // Store event with the specific date it's being displayed on
            }
        });

        // Loop through each day element in the calendar grid
        document.querySelectorAll('.calendar-day').forEach(dayElement => {
            const day = parseInt(dayElement.textContent);
            if (isNaN(day) || !eventsByDay[day]) return; // Skip empty or non-event days

            const dayEvents = eventsByDay[day].sort((a, b) => a.start - b.start); // Sort events by start time

            dayEvents.forEach((event, index) => {
                const eventColor = eventColors[index % eventColors.length];
                const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: false };

                const eventBar = document.createElement('div');
                eventBar.classList.add('event-bar');
                eventBar.style.backgroundColor = eventColor;
                eventBar.textContent = event.title;
                eventBar.dataset.eventId = event.id;
                // Store all relevant event data for tooltip and modal
                eventBar.dataset.eventData = JSON.stringify({
                    name: event.title,
                    description: event.description,
                    link: event.link,
                    date: event.dateInstance.toLocaleDateString(), // Use the specific date for this bar
                    time: `${new Date(event.start * 1000).toLocaleTimeString([], timeOptions)} - ${new Date(event.end * 1000).toLocaleTimeString([], timeOptions)}`
                });

                dayElement.appendChild(eventBar);
                dayElement.classList.add('has-event'); // Mark day as having an event
            });
        });
    }

    // --- Update Navigation Button State ---
    function updateNavButtonsState() {
        const today = new Date();
        const prevMonthBtn = document.getElementById('prevMonthBtn');
        const nextMonthBtn = document.getElementById('nextMonthBtn');

        if (prevMonthBtn) {
            // Disable 'Previous' if we're at the current month or earlier than 2024 (arbitrary limit)
            if ((currentDate.getFullYear() <= today.getFullYear() && currentDate.getMonth() <= today.getMonth()) || currentDate.getFullYear() < 2024) {
                prevMonthBtn.disabled = true;
            } else {
                prevMonthBtn.disabled = false;
            }
        }

        if (nextMonthBtn) {
            // Disable 'Next' if we're far in the future (arbitrary limit, e.g., 2 years from now)
            if (currentDate.getFullYear() > today.getFullYear() + 2) { 
                nextMonthBtn.disabled = true;
            } else {
                nextMonthBtn.disabled = false;
            }
        }
    }

    // --- Event Listeners Setup ---
    function setupEventListeners() {
        if (calendarWrapper) {
            calendarWrapper.addEventListener('click', (event) => {
                if (event.target.closest('#prevMonthBtn')) {
                    currentDate.setMonth(currentDate.getMonth() - 1);
                    renderCalendar();
                } else if (event.target.closest('#nextMonthBtn')) {
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    renderCalendar();
                } else {
                    const eventBar = event.target.closest('.event-bar');
                    if (eventBar && eventBar.dataset.eventData) {
                        const eventData = JSON.parse(eventBar.dataset.eventData);
                        displayEventDetails(eventData);
                    }
                }
            });
        }

        // Tooltip listeners (on calendarDaysGrid, not each event bar for performance)
        if (calendarDaysGrid) {
            calendarDaysGrid.addEventListener('mouseover', (event) => {
                const eventBar = event.target.closest('.event-bar');
                if (eventBar && eventBar.dataset.eventData) {
                    const eventData = JSON.parse(eventBar.dataset.eventData);
                    if (eventTooltip) {
                        eventTooltip.innerHTML = `<h4>${eventData.name}</h4><p>${eventData.description}</p><p>Time: ${eventData.time}</p>`;
                        eventTooltip.classList.add('visible');
                    }
                }
            });

            calendarDaysGrid.addEventListener('mouseout', () => {
                if (eventTooltip) eventTooltip.classList.remove('visible');
            });

            calendarDaysGrid.addEventListener('mousemove', (event) => {
                if (eventTooltip && eventTooltip.classList.contains('visible')) {
                    eventTooltip.style.left = `${event.pageX + 15}px`;
                    eventTooltip.style.top = `${event.pageY + 15}px`;
                }
            });
        }

        // Modal close button
        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', () => {
                if (eventDetailsModal) eventDetailsModal.style.display = 'none';
            });
        }

        // Close modal if clicking on the overlay background
        if (eventDetailsModal) {
            eventDetailsModal.addEventListener('click', function(event) {
                if (event.target === eventDetailsModal) {
                    eventDetailsModal.style.display = 'none';
                }
            });
        }
        
        // Reminder button logic (needs current user and DB connection)
        if (setReminderBtn) {
            setReminderBtn.addEventListener('click', async () => {
                if (!auth || !auth.currentUser || !db) {
                    alert("Please log in to set reminders.");
                    return;
                }
                const currentEventData = JSON.parse(detailEventName.closest('.modal-content').querySelector('.event-bar[data-event-data]').dataset.eventData); // Re-fetch data from the open modal
                console.log(`Setting reminder for event: ${currentEventData.name}`);
                try {
                    await db.collection('userReminders').doc(auth.currentUser.uid).collection('events').add({
                        eventName: currentEventData.name,
                        eventDate: new Date(currentEventData.date), // Convert back to Date object if needed
                        eventTime: currentEventData.time,
                        reminderSetAt: firebase.firestore.FieldValue.serverTimestamp(),
                        link: currentEventData.link
                    });
                    alert(`Reminder set for "${currentEventData.name}"!`);
                    if (eventDetailsModal) eventDetailsModal.style.display = 'none';
                } catch (error) {
                    console.error("Error setting reminder:", error);
                    alert("Failed to set reminder. Please try again.");
                }
            });
        }
    }
    
    // The initializeEventCalendarPage will be called externally to kick off the calendar.
    // No direct call to renderCalendar() or setupEventListeners() here.
});