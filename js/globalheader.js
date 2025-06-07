document.addEventListener('DOMContentLoaded', function() {
    // --- Configuration ---
    const useMimicNotification = true; // Set to true to enable mimic, false for real system

    // --- Bell Icon SVG ---
    const bellIconSVG = `
        <svg id="notificationBellIcon" xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 90 90" style="vertical-align: middle; cursor: pointer; margin-right: 8px;">
            <g>
                <path d="M 55.913 76.439 c 0 0.029 0.004 0.057 0.004 0.087 C 55.918 83.967 49.885 90 42.443 90 s -13.475 -6.033 -13.475 -13.475 c 0 -0.029 0.004 -0.057 0.004 -0.087 C 37.953 69.714 46.933 69.714 55.913 76.439 z" style="fill: rgb(219,156,32);"/>
                <path d="M 72.956 56.082 V 30.513 C 72.956 13.661 59.295 0 42.443 0 C 25.591 0 11.93 13.661 11.93 30.513 v 25.569 c 0 3.238 -1.418 6.314 -3.88 8.417 c -2.462 2.103 -3.88 5.179 -3.88 8.417 c 0 1.945 1.577 3.522 3.522 3.522 h 69.503 c 1.945 0 3.522 -1.577 3.522 -3.522 c 0 -3.238 -1.418 6.314 -3.88 8.417 C 74.374 62.396 72.956 59.32 72.956 56.082 z" style="fill: rgb(255,185,46);"/>
                <circle cx="67.524" cy="18.304" r="18.304" style="fill: rgb(237,38,38);"/>
            </g>
        </svg>
    `;

    // --- Add Bell Icon to Header ---
    const headerButtonsContainer = document.getElementById('headerButtonsContainer');
    let notificationBellElement = null; 

    if (headerButtonsContainer) {
        headerButtonsContainer.insertAdjacentHTML('afterbegin', bellIconSVG);
        notificationBellElement = document.getElementById('notificationBellIcon'); 

        if (notificationBellElement) {
            // Initially make bell pulse if mimic mode is on (simulating available notifications)
            if (useMimicNotification) {
                notificationBellElement.classList.add('bell-has-notifications');
            }

            notificationBellElement.addEventListener('click', function(event) {
                event.stopPropagation(); 
                if (useMimicNotification) {
                    toggleMimicNotificationPanel(notificationBellElement);
                } else {
                    console.log('Real notification system would be triggered here.');
                    // When real system is built, clicking the bell should ideally:
                    // 1. Stop pulsing (remove 'bell-has-notifications')
                    // 2. Open real notification panel
                    // 3. Mark notifications as seen (logic TBD)
                    // 4. If panel closed and still unseen notifications, re-add pulse.
                    if (notificationBellElement) {
                         notificationBellElement.classList.remove('bell-has-notifications');
                    }
                }
            });
        }
    }

    // --- Mimic Notification Panel Logic ---
    let mimicPanelVisible = false;
    let currentMimicPanel = null;

    function closeMimicPanel() {
        if (currentMimicPanel) {
            currentMimicPanel.remove();
        }
        mimicPanelVisible = false;
        currentMimicPanel = null;
        if (notificationBellElement && useMimicNotification) { // Or if actual unread notifications exist
            notificationBellElement.classList.add('bell-has-notifications'); // Start pulsing again
        }
        document.removeEventListener('click', outsideClickListenerMimic, { capture: true });
    }

    function openMimicPanel(bellButton) {
        if (currentMimicPanel) { // Should not happen if toggle logic is correct, but as a safeguard
            currentMimicPanel.remove();
        }

        const panel = document.createElement('div');
        panel.setAttribute('id', 'notificationMimicPanel');
        panel.className = 'notification-panel-mimic'; 
                                                     
        panel.innerHTML = `
            <div class="notification-panel-header">
                <span>Notifications (Mimic)</span>
                <button type="button" class="btn-close mimic-panel-close-btn" aria-label="Close panel">&times;</button>
            </div>
            <ul>
                <li>
                    <strong>Huddle Invite:</strong> UserX added you to a huddle.
                    <div>(Links to Huddle page)</div>
                </li>
                <li>
                    <strong>Activity Finished:</strong> Your 'Crime X' is complete.
                    <div>(Links to Activity page)</div>
                </li>
                <li>
                    <strong>Grouped Item:</strong> 3 new market updates.
                    <div>(Links to Market page)</div>
                </li>
            </ul>
            <div> 
                This is a test panel.
            </div>
        `;
        
        panel.addEventListener('click', function(event) {
            event.stopPropagation(); 
        });

        document.body.appendChild(panel);
        
        const bellRect = bellButton.getBoundingClientRect();
        panel.style.position = 'absolute';
        panel.style.top = (bellRect.bottom + window.scrollY + 5) + 'px'; 
        
        let panelLeft = bellRect.left + window.scrollX - (panel.offsetWidth / 2) + (bellRect.width / 2);
        if (panelLeft < 10) { 
            panelLeft = 10;
        } else if (panelLeft + panel.offsetWidth > window.innerWidth - 10) { 
            panelLeft = window.innerWidth - panel.offsetWidth - 10;
        }
        panel.style.left = panelLeft + 'px';

        currentMimicPanel = panel;
        mimicPanelVisible = true;
        if (notificationBellElement) {
            notificationBellElement.classList.remove('bell-has-notifications'); // Stop pulsing when panel is open
        }

        const closeButton = panel.querySelector('.mimic-panel-close-btn');
        if (closeButton) {
            closeButton.addEventListener('click', function() {
                closeMimicPanel();
            });
        }
        
        setTimeout(() => {
            document.addEventListener('click', outsideClickListenerMimic, { capture: true, once: true });
        }, 0);
    }

    function toggleMimicNotificationPanel(bellButton) {
        if (mimicPanelVisible) {
            closeMimicPanel();
        } else {
            openMimicPanel(bellButton);
        }
    }

    function outsideClickListenerMimic(event) {
        if (mimicPanelVisible && currentMimicPanel && !currentMimicPanel.contains(event.target) && event.target.id !== 'notificationBellIcon' && !event.target.closest('#notificationBellIcon')) {
            closeMimicPanel();
        } else if (mimicPanelVisible) { 
             document.addEventListener('click', outsideClickListenerMimic, { capture: true, once: true });
        }
    }
});