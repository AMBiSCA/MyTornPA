document.addEventListener('DOMContentLoaded', function() {
    console.log("eventcalendar.js: Script loaded. Tooltip functionality included.");

    const calendarWrapper = document.querySelector('.calendar-wrapper');
    const calendarHeader = document.querySelector('.calendar-header');
    const calendarWeekdays = document.querySelector('.calendar-weekdays');
    const calendarDays = document.getElementById('calendarDays');
    const tooltip = document.getElementById('event-tooltip'); // Get the new tooltip element
    
    const eventColors = ['#3b5998', '#6a4c93', '#1982c4', '#8ac926', '#ffca3a', '#ff595e', '#2d6a4f'];
    
    if (calendarHeader) calendarHeader.style.display = 'none';
    if (calendarWeekdays) calendarWeekdays.style.display = 'none';
    if (calendarDays) calendarDays.innerHTML = `<div class="calendar-message">Loading Calendar...</div>`;

    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            try {
                const userDocRef = firebase.firestore().collection('userProfiles').doc(user.uid);
                const userDoc = await userDocRef.get();

                if (userDoc.exists && userDoc.data().tornApiKey) {
                    if (calendarHeader) calendarHeader.style.display = 'flex';
                    if (calendarWeekdays) calendarWeekdays.style.display = 'grid';

                    const TORN_API_KEY = userDoc.data().tornApiKey;
                    let currentDate = new Date();
                    const currentMonthYear = document.getElementById('currentMonthYear');

                    calendarWrapper.addEventListener('click', (event) => {
                        if (event.target.closest('#prevMonthBtn')) { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); }
                        if (event.target.closest('#nextMonthBtn')) { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); }
                    });
                    
                    // --- NEW: Tooltip Event Listeners ---
                    calendarDays.addEventListener('mouseover', (event) => {
                        const dayElement = event.target.closest('.event-day-range');
                        if (dayElement && dayElement.dataset.events) {
                            const eventData = JSON.parse(dayElement.dataset.events)[0]; // Get the first event for the day
                            if (eventData) {
                                tooltip.innerHTML = `<h4>${eventData.name}</h4><p>${eventData.description}</p>`;
                                tooltip.classList.add('visible');
                            }
                        }
                    });

                    calendarDays.addEventListener('mouseout', () => {
                        tooltip.classList.remove('visible');
                    });
                    
                    calendarDays.addEventListener('mousemove', (event) => {
                        // Move the tooltip to follow the cursor, with a slight offset
                        tooltip.style.left = `${event.pageX + 15}px`;
                        tooltip.style.top = `${event.pageY + 15}px`;
                    });


                    function renderCalendar() { /* ... same as before ... */ }
                    async function fetchTornEventsForMonth(year, month) { /* ... same as before ... */ }
                    
                    // The full functions are included below for completeness
                    function renderCalendar() {
                        calendarDays.innerHTML = '';
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
                                const eventsInMonth = Object.values(data.calendar.events).filter(event => {
                                    const eventStartDate = new Date(event.start * 1000);
                                    const eventEndDate = new Date(event.end * 1000);
                                    const viewStartDate = new Date(year, month - 1, 1);
                                    const viewEndDate = new Date(year, month, 0);
                                    return eventStartDate <= viewEndDate && eventEndDate >= viewStartDate;
                                });
                                displayEventsOnCalendar(eventsInMonth);
                            } else { if(data.error) throw new Error(`API Error: ${data.error.error}`); }
                        } catch (error) { calendarDays.innerHTML = `<div class="calendar-message error">Could not load events. The API key might be invalid.</div>`; console.error(error); }
                    }

                    function displayEventsOnCalendar(events) {
                        events.forEach((event, index) => {
                            const originalStartDate = new Date(event.start * 1000);
                            const originalEndDate = new Date(event.end * 1000);
                            const normalizedStartDate = new Date(originalStartDate);
                            normalizedStartDate.setHours(0, 0, 0, 0);
                            const normalizedEndDate = new Date(originalEndDate);
                            normalizedEndDate.setHours(0, 0, 0, 0);
                            const eventColor = eventColors[index % eventColors.length];
                            const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: false };

                            for (let d = new Date(normalizedStartDate); d <= normalizedEndDate; d.setDate(d.getDate() + 1)) {
                                const formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                                const dayElement = calendarDays.querySelector(`.calendar-day[data-date="${formattedDate}"]`);

                                if (dayElement) {
                                    const displayEvent = { name: event.title, description: event.description };
                                    dayElement.dataset.events = JSON.stringify([displayEvent]); // Store info for the tooltip
                                    dayElement.classList.add('event-day-range');
                                    dayElement.style.backgroundColor = eventColor;
                                    const isStart = d.getTime() === normalizedStartDate.getTime();
                                    const isEnd = d.getTime() === normalizedEndDate.getTime();
                                    if (isStart && isEnd) { dayElement.classList.add('event-range-single'); } 
                                    else if (isStart) { dayElement.classList.add('event-range-start'); } 
                                    else if (isEnd) { dayElement.classList.add('event-range-end'); }
                                    if (isStart) { dayElement.innerHTML += `<div class="day-event-title">${event.title}</div>`; }
                                    if (isStart && isEnd) {
                                        const startTime = originalStartDate.toLocaleTimeString([], timeOptions);
                                        const endTime = originalEndDate.toLocaleTimeString([], timeOptions);
                                        dayElement.innerHTML += `<div class="day-event-time">(${startTime} - ${endTime})</div>`;
                                    } else if (isStart) {
                                        const startTime = originalStartDate.toLocaleTimeString([], timeOptions);
                                        dayElement.innerHTML += `<div class="day-event-time">Start: ${startTime}</div>`;
                                    } else if (isEnd) {
                                        const endTime = originalEndDate.toLocaleTimeString([], timeOptions);
                                        dayElement.innerHTML += `<div class="day-event-time">End: ${endTime}</div>`;
                                    }
                                }
                            }
                        });
                    }
                    
                    renderCalendar();

                } else {
                    if (calendarDays) calendarDays.innerHTML = `<div class="calendar-message error"><h3>API Key Missing</h3><p>Your Torn API key is not saved in your user profile.</p></div>`;
                }
            } catch (error) {
                console.error("Error fetching user data from Firestore:", error);
                if (calendarDays) calendarDays.innerHTML = `<div class="calendar-message error"><h3>Loading Error</h3><p>Could not load your profile data.</p></div>`;
            }
        } else {
            if (calendarDays) calendarDays.innerHTML = `<div class="calendar-message"><h3>Please Log In</h3><p>You must be logged in to view the event calendar.</p></div>`;
        }
    });
});