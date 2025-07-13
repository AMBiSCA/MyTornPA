document.addEventListener('DOMContentLoaded', function() {
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

    let currentDate = new Date(); // Represents the month/year currently displayed

    // --- Torn API Key (IMPORTANT: Replace with a secure way to handle this!) ---
    // For now, hardcoding for demonstration. In a real application,
    // you'd want to store this more securely (e.g., server-side, or prompt user).
    const TORN_API_KEY = "gCNmxrHxlOYeNiS7"; // Your provided API key

    // --- Function to Render the Calendar ---
    function renderCalendar() {
        calendarDays.innerHTML = ''; // Clear previous days
        eventDetailsSection.style.display = 'none'; // Hide event details when changing month

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth(); // 0-indexed (0 for Jan, 11 for Dec)

        // Set the display for the current month and year
        currentMonthYear.textContent = new Date(year, month).toLocaleString('en-US', {
            month: 'long',
            year: 'numeric'
        });

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

        // Fetch and display events for this month
        fetchTornEventsForMonth(year, month + 1);
    }

    // --- Navigation Buttons Event Listeners ---
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    // --- Function to Fetch Torn Events from API ---
    async function fetchTornEventsForMonth(year, month) {
        // Clear existing event indicators before fetching new ones
        document.querySelectorAll('.event-indicator').forEach(el => el.remove());
        document.querySelectorAll('.calendar-day[data-events]').forEach(el => delete el.dataset.events);


        // Torn API calendar endpoint (you provided this earlier)
        const apiUrl = `https://api.torn.com/v2/torn/calendar?key=${TORN_API_KEY}`;

        try {
            const response = await fetch(apiUrl);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            // console.log("Torn API Calendar Data:", data); // Log the full API response for debugging

            if (data && data.events) {
                // Filter events relevant to the currently displayed month
                const eventsInMonth = Object.values(data.events).filter(event => {
                    const eventDate = new Date(event.start); // 'start' is the timestamp from the API
                    return eventDate.getFullYear() === year && (eventDate.getMonth() + 1) === month;
                });
                displayEventsOnCalendar(eventsInMonth);
            } else {
                console.warn("No 'events' data found in Torn API response or response is empty.");
            }

        } catch (error) {
            console.error("Error fetching Torn events:", error);
            // Optionally display a user-friendly error message on the page
            calendarDays.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: var(--text-color-error);">Error loading events. Please try again later.</div>';
        }
    }

    // --- Function to Display Events on Calendar Days ---
    function displayEventsOnCalendar(events) {
        events.forEach(event => {
            // The API 'start' field is a timestamp (seconds since epoch)
            const eventStartTimestamp = event.start * 1000; // Convert to milliseconds
            const eventDateObj = new Date(eventStartTimestamp);

            const day = eventDateObj.getDate();
            const month = eventDateObj.getMonth();
            const year = eventDateObj.getFullYear();

            // Format date for data-date attribute
            const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            // Find the corresponding day element in the current calendar view
            const dayElement = calendarDays.querySelector(`.calendar-day[data-date="${formattedDate}"]`);

            if (dayElement && !dayElement.classList.contains('empty')) {
                // Add an indicator for events
                let eventIndicator = dayElement.querySelector('.event-indicator');
                if (!eventIndicator) {
                    eventIndicator = document.createElement('div');
                    eventIndicator.classList.add('event-indicator');
                    dayElement.appendChild(eventIndicator);
                }

                // Prepare event details for display.
                // The API gives 'start' and 'end' as timestamps, and 'name', 'description'.
                // 'link' might not always be present or might need constructing.
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
                    // The API doesn't always provide a direct 'link'.
                    // You might need to construct a link based on event type or ID if available.
                    // For now, a placeholder link.
                    link: event.link || `https://www.torn.com/calendar.php#${event.ID}` // Example, adjust as needed
                };


                // Store event data on the day element for later display
                // (Using an array to handle multiple events on the same day)
                const existingEvents = JSON.parse(dayElement.dataset.events || '[]');
                existingEvents.push(displayEvent);
                dayElement.dataset.events = JSON.stringify(existingEvents);

                // Add event listener to show details on click
                // We'll modify this to handle multiple events per day later
                dayElement.addEventListener('click', (e) => {
                    // If there are multiple events on a day, you might show a list
                    // For now, just show the first one or iterate.
                    const clickedEvents = JSON.parse(e.currentTarget.dataset.events);
                    if (clickedEvents && clickedEvents.length > 0) {
                        showEventDetails(clickedEvents[0]); // Show details for the first event
                    }
                });
            }
        });
    }

    // --- Function to Show Event Details ---
    function showEventDetails(event) {
        detailEventName.textContent = event.name;
        detailEventDate.textContent = event.date;
        detailEventTime.textContent = event.time;
        detailEventDescription.textContent = event.description;
        detailEventLink.href = event.link;
        detailEventLink.textContent = event.link.length > 30 ? event.link.substring(0, 30) + '...' : event.link; // Truncate long links

        eventDetailsSection.style.display = 'block';

        // Placeholder for Set Reminder button functionality
        setReminderBtn.onclick = () => {
            alert(`Reminder set for: ${event.name} on ${event.date} at ${event.time} (functionality coming soon!)`);
            // Here you would integrate with Firebase to save the reminder for the user
        };
    }

    // --- Initial Render when page loads ---
    renderCalendar();
});

document.addEventListener('DOMContentLoaded', function() {
    // --- Common Header/Footer UI script (depends on 'auth' from firebase-init.js) ---
    const usefulLinksBtn = document.getElementById('usefulLinksBtn');
    const usefulLinksDropdown = document.getElementById('usefulLinksDropdown');

    if (usefulLinksBtn && usefulLinksDropdown) {
        usefulLinksBtn.addEventListener('click', function(event) {
            event.stopPropagation(); 
            usefulLinksDropdown.classList.toggle('show');
        });
    }

    window.addEventListener('click', function(event) {
        if (usefulLinksBtn && usefulLinksDropdown && usefulLinksDropdown.classList.contains('show')) {
            if (!usefulLinksBtn.contains(event.target) && !usefulLinksDropdown.contains(event.target)) {
                usefulLinksDropdown.classList.remove('show');
            }
        }
    });

    const headerButtonsContainer = document.getElementById('headerButtonsContainer');
    const signUpButtonHeader = document.getElementById('signUpButtonHeader');
    const homeButtonFooter = document.getElementById('homeButtonFooter'); 
    const logoutButtonHeader = document.getElementById('logoutButtonHeader');

    if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
    if (signUpButtonHeader) signUpButtonHeader.style.display = 'none';
    if (homeButtonFooter) homeButtonFooter.style.display = 'none';

    // Check if 'auth' was successfully initialized by firebase-init.js
    if (typeof auth !== 'undefined' && auth) { 
        auth.onAuthStateChanged(function(user) {
            const currentPagePath = window.location.pathname;
            let pageName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase();
            if (pageName === "" && currentPagePath.length > 1) { 
                 const pathParts = currentPagePath.substring(0, currentPagePath.length -1).split('/');
                 pageName = pathParts[pathParts.length -1].toLowerCase();
            }
            
            const nonAuthEntryPages = ['index.html', 'ranked.html', 'login.html']; 
            let isThisNonAuthEntryPage = nonAuthEntryPages.includes(pageName) || (pageName === "" && currentPagePath === "/");


            if (user) { // User is signed in
                if (isThisNonAuthEntryPage) { 
                    window.location.href = 'home.html'; 
                    return; 
                }
                if (headerButtonsContainer) headerButtonsContainer.style.display = 'flex';
                if (signUpButtonHeader) signUpButtonHeader.style.display = 'none';
                if (homeButtonFooter) homeButtonFooter.style.display = 'inline';
                if (logoutButtonHeader) logoutButtonHeader.style.display = 'inline-flex'; 

            } else { // No user signed in
                if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
                if (signUpButtonHeader) {
                    signUpButtonHeader.style.display = isThisNonAuthEntryPage ? 'none' : 'inline-flex';
                }
                if (homeButtonFooter) homeButtonFooter.style.display = 'none';
                if (logoutButtonHeader) logoutButtonHeader.style.display = 'none';
                
                const allowedNonAuthPagesIncludingThis = [...nonAuthEntryPages, 'travel.html', 'terms.html', 'faq.html', 'about.html', 'report.html', 'merit_tracker.html', 'merits.html']; // Added merits.html
                if (!allowedNonAuthPagesIncludingThis.includes(pageName) && !(pageName === "" && currentPagePath === "/")) {
                    // window.location.href = 'ranked.html'; // Or your primary login page
                }
            }
        });

        if (logoutButtonHeader) {
            logoutButtonHeader.onclick = function() { 
                auth.signOut().then(() => {
                    console.log('User signed out');
                    const currentPagePath = window.location.pathname;
                    let pageName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase();
                     if (pageName === "" && currentPagePath.length > 1) {
                        const pathParts = currentPagePath.substring(0, currentPagePath.length -1).split('/');
                        pageName = pathParts[pathParts.length -1].toLowerCase();
                    }
                    const nonAuthEntryPages = ['index.html', 'ranked.html', 'login.html'];
                    if (!nonAuthEntryPages.includes(pageName) && !(pageName === "" && currentPagePath === "/")) {
                         window.location.href = 'ranked.html'; 
                    }
                }).catch((error) => {
                    console.error('Sign out error', error);
                });
            };
        }

    } else {
        console.warn("Firebase auth object (from firebase-init.js) is not available. UI for auth state will not update fully.");
        if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
        if (signUpButtonHeader) {
            const currentPagePath = window.location.pathname;
            let pageName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase();
            if (pageName === "" && currentPagePath.length > 1) {
                 const pathParts = currentPagePath.substring(0, currentPagePath.length -1).split('/');
                 pageName = pathParts[pathParts.length -1].toLowerCase();
            }
            const nonAuthEntryPages = ['index.html', 'ranked.html', 'login.html'];
            signUpButtonHeader.style.display = (nonAuthEntryPages.includes(pageName) || (pageName === "" && currentPagePath === "/")) ? 'none' : 'inline-flex';
        }
        if (homeButtonFooter) homeButtonFooter.style.display = 'none';
        if (logoutButtonHeader) {
            logoutButtonHeader.style.display = 'none';
            logoutButtonHeader.onclick = function() { alert('Logout functionality (Firebase) not ready.'); };
        }
    }
    // Any merits.html specific JavaScript actions for the tracker would go below this line.
    // For the provided HTML, the main content is a placeholder, so no unique JS yet.
});