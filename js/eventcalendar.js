// js/eventcalendar.js
// This file contains JavaScript specific to the Event Calendar page.
// It handles fetching data and rendering the calendar independently.
// Global header and core authentication logic are handled by globalheader.js and firebase-init.js.

// Global Variables specific to eventcalendar.js
let currentDate = new Date(); // Tracks the month being displayed
const eventColors = ['#3b5998', '#6a4c93', '#1982c4', '#8ac926', '#ffca3a', '#ff595e', '#2d6a4f'];

document.addEventListener('DOMContentLoaded', function() {
    console.log("eventcalendar.js: DOMContentLoaded event fired. Initializing Event Calendar functionality.");

    // --- UI References for the calendar and event modal ---
    const calendarWrapper = document.querySelector('.calendar-wrapper');
    const calendarHeader = document.querySelector('.calendar-header');
    const calendarWeekdays = document.querySelector('.calendar-weekdays');
    const calendarDaysGrid = document.getElementById('calendarDays'); 
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
    if (calendarDaysGrid) calendarDaysGrid.innerHTML = `<div class="calendar-message">Loading Calendar...</div>`;
    
    // --- Firebase Authentication and Data Loading ---
    // This block correctly handles fetching the API key necessary for this page's functionality.
    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            try {
                const userDocRef = firebase.firestore().collection('userProfiles').doc(user.uid);
                const userDoc = await userDocRef.get();

                if (userDoc.exists && userDoc.data().tornApiKey) {
                    const TORN_API_KEY = userDoc.data().tornApiKey;
                    console.log("eventcalendar.js: Torn API Key retrieved. Showing calendar.");

                    if (calendarHeader) calendarHeader.style.display = 'flex';
                    if (calendarWeekdays) calendarWeekdays.style.display = 'grid';
                    if (calendarDaysGrid) calendarDaysGrid.innerHTML = ''; // Clear loading message

                    // Initial render of the calendar and set up listeners
                    renderCalendar(TORN_API_KEY); // Pass the API key to renderCalendar
                    setupEventListeners(TORN_API_KEY); // Pass the API key to event listeners setup

                } else {
                    if (calendarDaysGrid) calendarDaysGrid.innerHTML = `<div class="calendar-message error"><h3>API Key Missing</h3><p>Your Torn API key is not saved in your user profile. Please set it in your profile settings.</p></div>`;
                }
            } catch (error) {
                console.error("Error fetching user data from Firestore:", error);
                if (calendarDaysGrid) calendarDaysGrid.innerHTML = `<div class="calendar-message error"><h3>Loading Error</h3><p>Could not load your profile data.</p></div>`;
            }
        } else {
            if (calendarDaysGrid) calendarDaysGrid.innerHTML = `<div class="calendar-message"><h3>Please Log In</h3><p>You must be logged in to view the event calendar.</p></div>`;
        }
    });

    // --- Core Calendar Rendering Logic ---
    async function renderCalendar(apiKey) { // Now accepts apiKey
        updateNavButtonsState(); // Update disabled state for month navigation

        calendarDaysGrid.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth(); // 0-indexed month for Date object

        currentMonthYearHeader.textContent = new Date(year, month).toLocaleString('en-US', { month: 'long', year: 'numeric' });

        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 for Sunday
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.classList.add('calendar-day', 'empty');
            calendarDaysGrid.appendChild(emptyDay);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day');
            dayElement.textContent = day;
            dayElement.dataset.date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            const today = new Date();
            if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayElement.classList.add('current-day');
            }
            calendarDaysGrid.appendChild(dayElement);
        }

        await fetchTornEventsForMonth(year, month + 1, apiKey); // Pass apiKey to fetch function
    }

    // --- Torn API Event Fetching ---
    async function fetchTornEventsForMonth(year, month, apiKey) { // Now accepts apiKey
        if (!apiKey) {
            console.error("Torn API Key is not set in fetchTornEventsForMonth. Cannot fetch events.");
            calendarDaysGrid.innerHTML = `<div class="calendar-message error"><h3>API Key Required</h3><p>Please ensure your Torn API key is set to fetch events.</p></div>`;
            return;
        }

        const apiUrl = `https://api.torn.com/v2/torn/calendar?key=${apiKey}&comment=MyTornPA_EventCalendar`; // Use passed apiKey
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API Error: ${response.status} - ${errorData.error?.error || response.statusText}`);
            }
            const data = await response.json();
            
            if (data && data.calendar && data.calendar.events) {
                const eventsInMonth = Object.values(data.calendar.events).filter(event => {
                    const eventStartDate = new Date(event.start * 1000);
                    const eventEndDate = new Date(event.end * 1000);
                    const viewStartDate = new Date(year, month - 1, 1);
                    const viewEndDate = new Date(year, month, 0, 23, 59, 59);
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
        const eventsByDay = {};
        events.forEach(event => {
            const originalStartDate = new Date(event.start * 1000);
            const originalEndDate = new Date(event.end * 1000);

            const normalizedStartDate = new Date(originalStartDate);
            normalizedStartDate.setHours(0, 0, 0, 0);
            const normalizedEndDate = new Date(originalEndDate);
            normalizedEndDate.setHours(0, 0, 0, 0);

            for (let d = new Date(normalizedStartDate); d <= normalizedEndDate; d.setDate(d.getDate() + 1)) {
                if (d.getMonth() !== currentDate.getMonth() || d.getFullYear() !== currentDate.getFullYear()) {
                    continue;
                }
                const dayKey = d.getDate();
                if (!eventsByDay[dayKey]) {
                    eventsByDay[dayKey] = [];
                }
                eventsByDay[dayKey].push({ ...event, dateInstance: d });
            }
        });

        document.querySelectorAll('.calendar-day').forEach(dayElement => {
            const day = parseInt(dayElement.textContent);
            if (isNaN(day) || !eventsByDay[day]) return;

            const dayEvents = eventsByDay[day].sort((a, b) => a.start - b.start);

            dayEvents.forEach((event, index) => {
                const eventColor = eventColors[index % eventColors.length];
                const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: false };

                const eventBar = document.createElement('div');
                eventBar.classList.add('event-bar');
                eventBar.style.backgroundColor = eventColor;
                eventBar.textContent = event.title;
                eventBar.dataset.eventId = event.id;
                eventBar.dataset.eventData = JSON.stringify({
                    name: event.title,
                    description: event.description,
                    link: event.link,
                    date: event.dateInstance.toLocaleDateString(),
                    time: `${new Date(event.start * 1000).toLocaleTimeString([], timeOptions)} - ${new Date(event.end * 1000).toLocaleTimeString([], timeOptions)}`
                });

                dayElement.appendChild(eventBar);
                dayElement.classList.add('has-event');
            });
        });
    }

    // --- Display Event Details Modal ---
    function displayEventDetails(eventData) {
        detailEventName.textContent = eventData.name;
        detailEventDate.textContent = eventData.date;
        detailEventTime.textContent = eventData.time;
        detailEventDescription.textContent = eventData.description;
        detailEventLink.href = eventData.link;
        detailEventLink.textContent = eventData.link !== '#' ? 'View Event' : 'No link available'; // Update link text

        // Reminder button logic (needs current user and DB connection)
        // Ensure firebase.auth() and firebase.firestore() are available globally (from firebase-init.js)
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser && firebase.firestore) {
            setReminderBtn.style.display = 'block'; // Show button if user is logged in
            // Remove previous listener to prevent duplicates
            setReminderBtn.removeEventListener('click', handleSetReminderClick);
            setReminderBtn.addEventListener('click', () => handleSetReminderClick(eventData));
        } else {
            setReminderBtn.style.display = 'none'; // Hide button if not logged in
        }

        eventDetailsModal.style.display = 'flex'; // Show modal
    }

    async function handleSetReminderClick(eventData) {
        const auth = firebase.auth();
        const db = firebase.firestore();
        if (!auth.currentUser || !db) {
            alert("Please log in to set reminders.");
            return;
        }

        console.log(`Setting reminder for event: ${eventData.name}`);
        try {
            await db.collection('userReminders').doc(auth.currentUser.uid).collection('events').add({
                eventName: eventData.name,
                eventDate: new Date(eventData.date), 
                eventTime: eventData.time,
                reminderSetAt: firebase.firestore.FieldValue.serverTimestamp(),
                link: eventData.link
            });
            alert(`Reminder set for "${eventData.name}"!`);
            if (eventDetailsModal) eventDetailsModal.style.display = 'none'; // Close modal after setting
        } catch (error) {
            console.error("Error setting reminder:", error);
            alert("Failed to set reminder. Please try again.");
        }
    }


    // --- Update Navigation Button State ---
    function updateNavButtonsState() {
        const today = new Date();
        const prevMonthBtn = document.getElementById('prevMonthBtn');
        const nextMonthBtn = document.getElementById('nextMonthBtn');

        if (prevMonthBtn) {
            if ((currentDate.getFullYear() <= today.getFullYear() && currentDate.getMonth() <= today.getMonth())) {
                prevMonthBtn.disabled = true;
            } else {
                prevMonthBtn.disabled = false;
            }
        }

        if (nextMonthBtn) {
            nextMonthBtn.disabled = false; // Always enabled unless you have a future limit
        }
    }

    // --- Event Listeners Setup ---
    function setupEventListeners(apiKey) { // Now accepts apiKey, though current logic doesn't directly use it here
        if (calendarWrapper) {
            calendarWrapper.addEventListener('click', (event) => {
                if (event.target.closest('#prevMonthBtn')) {
                    currentDate.setMonth(currentDate.getMonth() - 1);
                    renderCalendar(apiKey); // Pass apiKey
                } else if (event.target.closest('#nextMonthBtn')) {
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    renderCalendar(apiKey); // Pass apiKey
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
        
        // Reminder button logic is now handled in displayEventDetails and handleSetReminderClick
    }
});