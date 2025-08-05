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

// --- START: Complete and Unified Orientation Handler ---

// This single script handles all orientation logic for both phones and tablets without conflict.

let portraitBlocker = null;
let landscapeBlocker = null;

/**
 * Creates the two overlay elements with the new, requested style.
 */
function createOverlays() {
    // Shared styles for the overlays, based on your example
    const overlayStyles = {
        display: 'none',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: '#1e1e1e',
        color: '#f0f0f0',
        textAlign: 'center',
        fontFamily: 'sans-serif',
        fontSize: '1.5em',
        zIndex: '99999'
    };

    // Shared styles for the new "Return to Home" button
    const buttonStyles = {
        backgroundColor: '#007bff',
        color: 'black',
        padding: '8px 15px',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        fontWeight: 'bold',
        marginTop: '20px',
        textDecoration: 'none',
        fontSize: '16px' // A readable font size for the button
    };

    // --- Create the "Rotate to Portrait" overlay for TABLETS ---
    if (!document.getElementById('tablet-portrait-blocker')) {
        portraitBlocker = document.createElement('div');
        portraitBlocker.id = 'tablet-portrait-blocker';
        Object.assign(portraitBlocker.style, overlayStyles); // Apply new styles
        portraitBlocker.innerHTML = `
            <div>
                <h2>Please Rotate Your Device</h2>
                <p style="font-size: 0.7em; margin-top: 5px;">This page is best viewed in portrait mode.</p>
                <button id="return-home-btn-tablet">Return to Home</button>
            </div>`;
        document.body.appendChild(portraitBlocker);

        const tabletReturnBtn = document.getElementById('return-home-btn-tablet');
        if (tabletReturnBtn) {
            Object.assign(tabletReturnBtn.style, buttonStyles); // Style the button
            tabletReturnBtn.addEventListener('click', () => { window.location.href = 'home.html'; });
        }
    }

    // --- Create the "Rotate to Landscape" overlay for PHONES ---
    if (!document.getElementById('mobile-landscape-blocker')) {
        landscapeBlocker = document.createElement('div');
        landscapeBlocker.id = 'mobile-landscape-blocker';
        Object.assign(landscapeBlocker.style, overlayStyles); // Apply new styles
        landscapeBlocker.innerHTML = `
            <div>
                <h2>Please Rotate Your Device</h2>
                <p style="font-size: 0.7em; margin-top: 5px;">For the best viewing experience, please use landscape mode.</p>
                <button id="return-home-btn-mobile">Return to Home</button>
            </div>`;
        document.body.appendChild(landscapeBlocker);
        
        const mobileReturnBtn = document.getElementById('return-home-btn-mobile');
        if (mobileReturnBtn) {
            Object.assign(mobileReturnBtn.style, buttonStyles); // Style the button
            mobileReturnBtn.addEventListener('click', () => { window.location.href = 'home.html'; });
        }
    }
}

/**
 * This is the main function that checks the device and orientation, and shows the correct overlay.
 */
function handleOrientation() {
    if (!portraitBlocker || !landscapeBlocker) {
        // Ensure the overlays exist before trying to control them
        createOverlays(); 
        portraitBlocker = document.getElementById('tablet-portrait-blocker');
        landscapeBlocker = document.getElementById('mobile-landscape-blocker');
        if (!portraitBlocker || !landscapeBlocker) return;
    }

    // First, hide both overlays so we start fresh.
    portraitBlocker.style.display = 'none';
    landscapeBlocker.style.display = 'none';

    // Get screen properties
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;
    const isLandscape = !isPortrait;
    
    // Use the SHORTEST side of the screen to guess the device type. This is more reliable.
    const shortestSide = Math.min(window.screen.width, window.screen.height);

    const isPhone = shortestSide < 600;
    const isTablet = shortestSide >= 600 && shortestSide < 1024;

    // Now apply the rules based on our findings
    if (isPhone && isPortrait) {
        // It's a phone in portrait mode. Show the "Rotate to Landscape" message.
        landscapeBlocker.style.display = 'flex';
    } else if (isTablet && isLandscape) {
        // It's a tablet in landscape mode. Show the "Rotate to Portrait" message.
        portraitBlocker.style.display = 'flex';
    }
}

// --- SCRIPT INITIALIZATION ---

// 1. Run the main handler function once when the page first loads.
// The handler will create the overlays if they don't exist.
document.addEventListener('DOMContentLoaded', handleOrientation);

// 2. Add listeners that will re-run the check whenever the screen changes.
window.addEventListener('resize', handleOrientation);
window.addEventListener('orientationchange', handleOrientation);

// --- END: Complete and Unified Orientation Handler ---