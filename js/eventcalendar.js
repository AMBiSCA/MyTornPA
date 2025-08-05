document.addEventListener('DOMContentLoaded', function() {
    console.log("eventcalendar.js: Script loaded and restructured.");

    // --- 1. SELECTORS & STATE VARIABLES ---
    const calendarWrapper = document.querySelector('.calendar-wrapper');
    const calendarHeader = document.querySelector('.calendar-header');
    const calendarWeekdays = document.querySelector('.calendar-weekdays');
    const calendarDays = document.getElementById('calendarDays');
    const tooltip = document.getElementById('event-tooltip');
    const currentMonthYear = document.getElementById('currentMonthYear');
    const eventColors = ['#3b5998', '#6a4c93', '#1982c4', '#8ac926', '#ffca3a', '#ff595e', '#2d6a4f'];
    let currentDate = new Date();
    let TORN_API_KEY = null;

    // --- 2. EVENT LISTENERS ---
    if (calendarWrapper) {
        // *** THIS IS THE UPDATED SECTION ***
        calendarWrapper.addEventListener('click', (event) => {
            if (!TORN_API_KEY) return;

            const prevBtnClicked = event.target.closest('#prevMonthBtn');
            const nextBtnClicked = event.target.closest('#nextMonthBtn');

            // If the click was on one of our calendar navigation buttons...
            if (prevBtnClicked || nextBtnClicked) {
                // ...stop the event from bubbling up to the window. This prevents
                // the conflict with the global click listener in globalheader.js.
                event.stopPropagation();

                if (prevBtnClicked) {
                    currentDate.setMonth(currentDate.getMonth() - 1);
                    renderCalendar();
                }
                if (nextBtnClicked) {
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    renderCalendar();
                }
            }
        });
    }

    if (calendarDays) {
        calendarDays.addEventListener('mouseover', (event) => {
            const dayElement = event.target.closest('.event-day-range');
            if (dayElement && dayElement.dataset.events) {
                const eventData = JSON.parse(dayElement.dataset.events)[0];
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
            tooltip.style.left = `${event.pageX + 15}px`;
            tooltip.style.top = `${event.pageY + 15}px`;
        });
    }


    // --- 3. FUNCTION DEFINITIONS ---
    function renderCalendar() {
        if (!TORN_API_KEY) return;
        updateNavButtonsState();
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
            } else { if (data.error) throw new Error(`API Error: ${data.error.error}`); }
        } catch (error) { calendarDays.innerHTML = `<div class="calendar-message error">Could not load events. The API key might be invalid.</div>`; console.error(error); }
    }

    function updateNavButtonsState() {
        const actualCurrentYear = new Date().getFullYear();
        const prevMonthBtn = document.getElementById('prevMonthBtn');
        const nextMonthBtn = document.getElementById('nextMonthBtn');
        if (!prevMonthBtn || !nextMonthBtn) return;
        prevMonthBtn.disabled = (currentDate.getFullYear() === actualCurrentYear && currentDate.getMonth() === 0);
        nextMonthBtn.disabled = (currentDate.getFullYear() === actualCurrentYear && currentDate.getMonth() === 11);
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
                    dayElement.dataset.events = JSON.stringify([displayEvent]);
                    dayElement.classList.add('event-day-range');
                    dayElement.style.backgroundColor = eventColor;
                    const isStart = d.getTime() === normalizedStartDate.getTime();
                    const isEnd = d.getTime() === normalizedEndDate.getTime();

                    if (isStart && isEnd) { dayElement.classList.add('event-range-single'); }
                    else if (isStart) { dayElement.classList.add('event-range-start'); }
                    else if (isEnd) { dayElement.classList.add('event-range-end'); }
                    
                    if (isStart) { dayElement.innerHTML += `<div class="day-event-title"><span>${event.title}</span><span class="reminder-bell">🔔</span></div>`; }

                    if (isStart && isEnd) {
                        dayElement.innerHTML += `<div class="day-event-time">(${originalStartDate.toLocaleTimeString([], timeOptions)} - ${originalEndDate.toLocaleTimeString([], timeOptions)})</div>`;
                    } else if (isStart) {
                        dayElement.innerHTML += `<div class="day-event-time">Start: ${originalStartDate.toLocaleTimeString([], timeOptions)}</div>`;
                    } else if (isEnd) {
                        dayElement.innerHTML += `<div class="day-event-time">End: ${originalEndDate.toLocaleTimeString([], timeOptions)}</div>`;
                    }
                }
            }
        });
    }

    // --- 4. AUTHENTICATION & INITIALIZATION ---
    if (calendarHeader) calendarHeader.style.display = 'none';
    if (calendarWeekdays) calendarWeekdays.style.display = 'none';
    if (calendarDays) calendarDays.innerHTML = `<div class="calendar-message">Loading Calendar...</div>`;

    firebase.auth().onAuthStateChanged(async (user) => {
        if (user) {
            try {
                const userDocRef = firebase.firestore().collection('userProfiles').doc(user.uid);
                const userDoc = await userDocRef.get();

                if (userDoc.exists && userDoc.data().tornApiKey) {
                    TORN_API_KEY = userDoc.data().tornApiKey;
                    if (calendarHeader) calendarHeader.style.display = 'flex';
                    if (calendarWeekdays) calendarWeekdays.style.display = 'grid';
                    renderCalendar();
                } else {
                    TORN_API_KEY = null;
                    if (calendarHeader) calendarHeader.style.display = 'none';
                    if (calendarWeekdays) calendarWeekdays.style.display = 'none';
                    if (calendarDays) calendarDays.innerHTML = `<div class="calendar-message error"><h3>API Key Missing</h3><p>Your Torn API key is not saved in your user profile.</p></div>`;
                }
            } catch (error) {
                TORN_API_KEY = null;
                console.error("Error fetching user data from Firestore:", error);
                if (calendarDays) calendarDays.innerHTML = `<div class="calendar-message error"><h3>Loading Error</h3><p>Could not load your profile data.</p></div>`;
            }
        } else {
            TORN_API_KEY = null;
            if (calendarHeader) calendarHeader.style.display = 'none';
            if (calendarWeekdays) calendarWeekdays.style.display = 'none';
            if (calendarDays) calendarDays.innerHTML = `<div class="calendar-message"><h3>Please Log In</h3><p>You must be logged in to view the event calendar.</p></div>`;
        }
    });
});

// --- START: Complete Orientation Handler ---

// --- Block 1: The "Rotate to Portrait" message for TABLETS ---

function toggleTabletBlocker() {
    // This rule targets devices that are likely tablets (width 768px to 1280px) AND are in landscape mode.
    const isTabletInLandscape = window.matchMedia("(min-width: 768px) and (max-width: 1280px) and (orientation: landscape)").matches;
    
    let blocker = document.getElementById('tablet-portrait-blocker');

    if (isTabletInLandscape) {
        // If the tablet is in landscape, show the "rotate to portrait" message.
        if (!blocker) {
            blocker = document.createElement('div');
            blocker.id = 'tablet-portrait-blocker';
            blocker.innerHTML = `<div><h2>Please Rotate to Portrait</h2><p>This page is designed for portrait viewing on tablets.</p></div>`;
            Object.assign(blocker.style, {
                display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
                backgroundColor: '#1c1c1c', color: '#eee', textAlign: 'center', zIndex: '99999'
            });
            document.body.appendChild(blocker);
        }
    } else {
        // If the tablet is in portrait (or it's not a tablet), remove the message.
        if (blocker) {
            blocker.remove();
        }
    }
}


// --- Block 2: The "Rotate to Landscape" message for PHONES ---

let mobileOverlay = null;

function createMobileOverlay() {
    if (document.getElementById('mobile-landscape-overlay')) return;
    mobileOverlay = document.createElement('div');
    mobileOverlay.id = 'mobile-landscape-overlay';
    mobileOverlay.innerHTML = `<div><h2>Please Rotate to Landscape</h2><p>This page is best viewed in landscape mode on your phone.</p></div>`;
    Object.assign(mobileOverlay.style, {
        display: 'none', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
        backgroundColor: '#1c1c1c', color: '#eee', textAlign: 'center', zIndex: '99999'
    });
    document.body.appendChild(mobileOverlay);
}

function toggleMobileBlocker() {
    if (!mobileOverlay) return;

    // This rule targets devices that are likely phones (width less than 768px).
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;

    if (isMobile && isPortrait) {
        // If it's a phone in portrait mode, show the "rotate to landscape" message.
        mobileOverlay.style.display = 'flex';
    } else {
        // Otherwise (it's a desktop, tablet, or a phone in landscape), hide the message.
        mobileOverlay.style.display = 'none';
    }
}


// --- Block 3: SCRIPT INITIALIZATION ---
// This part runs everything when the page loads and sets up the listeners.

// 1. Create the (hidden) mobile overlay element immediately.
createMobileOverlay();

// 2. Define a single function that runs all our checks.
function handleOrientationChange() {
    toggleTabletBlocker();
    toggleMobileBlocker();
}

// 3. Run the checks once when the page first loads.
handleOrientationChange();

// 4. Add listeners that will re-run the checks whenever the screen size or orientation changes.
window.addEventListener('resize', handleOrientationChange);
window.addEventListener('orientationchange', handleOrientationChange);

// --- END: Complete Orientation Handler ---