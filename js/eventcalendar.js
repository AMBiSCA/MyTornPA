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

function toggleLandscapeBlocker() {
    // --- THIS IS THE FIX ---
    // The rule now specifically targets TABLETS in landscape by adding a 'min-width'.
    // This stops it from incorrectly activating on mobile phones.
    const isTabletLandscape = window.matchMedia("(min-width: 768px) and (max-width: 1280px) and (orientation: landscape)").matches;
    let blocker = document.getElementById('landscape-blocker');

    if (isTabletLandscape) {
        // If the blocker doesn't exist, create and show it.
        if (!blocker) {
            blocker = document.createElement('div');
            blocker.id = 'landscape-blocker';
            blocker.innerHTML = `
                <div style="transform: rotate(0deg); font-size: 50px; margin-bottom: 20px;">📱</div>
                <h2>Please Rotate Your Device</h2>
                <p>This page is best viewed in portrait mode.</p>
            `;
            // These styles will make it cover the entire screen.
            Object.assign(blocker.style, {
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100vw',  // Use viewport width
                height: '100vh', // Use viewport height
                backgroundColor: '#1c1c1c', // A solid, dark color
                color: '#eee',
                textAlign: 'center',
                zIndex: '99999' // A very high number to ensure it's on top of everything
            });
            document.body.appendChild(blocker);
        }
        // Also, prevent the page from scrolling underneath the blocker.
        document.body.style.overflow = 'hidden';

    } else {
        // If we are in portrait OR not a tablet, remove the blocker if it exists.
        if (blocker) {
            blocker.remove();
        }
        // And restore the ability to scroll the page.
        document.body.style.overflow = '';
    }
}
// --- START: Mobile Landscape Enforcement ---
// This section will handle showing an overlay on mobile phones in portrait mode.
// It will not affect tablets or desktop computers.

let orientationOverlay = null;

/**
 * Creates and adds a hidden overlay to the page.
 * This overlay will be used to ask the user to rotate their phone.
 */
function createOrientationOverlay() {
    // Avoid creating multiple overlays if this script is ever run more than once.
    if (document.getElementById('orientation-overlay-mobile')) {
        orientationOverlay = document.getElementById('orientation-overlay-mobile');
        return;
    }

    orientationOverlay = document.createElement('div');
    orientationOverlay.id = 'orientation-overlay-mobile';

    // Apply styles to the overlay div
    Object.assign(orientationOverlay.style, {
        display: 'none', // Hidden by default
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: '#222',
        color: '#eee',
        textAlign: 'center',
        padding: '20px',
        zIndex: '99999' // Make sure it's on top of everything
    });

    // Add the message and button to the overlay
    orientationOverlay.innerHTML = `
        <div>
            <h2 style="font-size: 24px; margin-bottom: 15px;">Please Rotate Your Device</h2>
            <p style="font-size: 16px; margin: 0;">This page is best viewed in landscape mode.</p>
            <a href="/" style="display: inline-block; margin-top: 30px; padding: 12px 25px; background-color: #00a8ff; color: black; text-decoration: none; border-radius: 5px; font-weight: bold;">
                Go to Homepage
            </a>
        </div>
    `;
    document.body.appendChild(orientationOverlay);
}

/**
 * Checks the screen size and orientation to decide if the overlay should be shown.
 */
function checkAndEnforceMobileLandscape() {
    // Make sure the overlay element exists before trying to use it.
    if (!orientationOverlay) return;

    // --- THIS IS THE MODIFIED LOGIC ---
    // We define a maximum width for what we consider a "mobile" device.
    const MOBILE_MAX_WIDTH = 768; // Affects screens narrower than 768px

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    const isMobile = screenWidth < MOBILE_MAX_WIDTH;
    const isPortrait = screenHeight > screenWidth;

    // The overlay should only appear if it's a mobile device AND it's in portrait mode.
    if (isMobile && isPortrait) {
        orientationOverlay.style.display = 'flex'; // Show the overlay
    } else {
        orientationOverlay.style.display = 'none'; // Hide the overlay
    }
}

// 1. Create the overlay element as soon as the script runs.
createOrientationOverlay();

// 2. Add listeners to run our check whenever the screen size or orientation might change.
window.addEventListener('resize', checkAndEnforceMobileLandscape);
window.addEventListener('orientationchange', checkAndEnforceMobileLandscape);

// 3. Run an initial check when the page first loads to set the correct state.
checkAndEnforceMobileLandscape();

// --- END: Mobile Landscape Enforcement ---