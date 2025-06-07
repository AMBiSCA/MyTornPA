// mysite/js/globalheader.js
// This script manages the header UI based on Firebase authentication state.
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

    // Get header element references
    const headerButtonsContainer = document.getElementById('headerButtonsContainer');
    const signUpButtonHeader = document.getElementById('signUpButtonHeader');
    const homeButtonHeader = document.getElementById('homeButtonHeader');
    const logoutButtonHeader = document.getElementById('logoutButtonHeader');
    const usefulLinksBtn = document.getElementById('usefulLinksBtn'); // Also for dropdowns
    const usefulLinksDropdown = document.getElementById('usefulLinksDropdown');
    const contactUsBtn = document.getElementById('contactUsBtn');
    const contactUsDropdown = document.getElementById('contactUsDropdown');
    let notificationBellElement = null; // Defined here for broader scope
    const tornCityHomepageLink = document.getElementById('tornCityHomepageLink');
    const loggedInUserDisplay = document.getElementById('logged-in-user-display'); // Get the user display element

    // --- Initial setup for header buttons ---
    // Inject bell icon and get its reference
    if (headerButtonsContainer) {
        headerButtonsContainer.insertAdjacentHTML('afterbegin', bellIconSVG);
        notificationBellElement = document.getElementById('notificationBellIcon'); // Now correctly gets the element after insertion
    }

    // Make the main header buttons container visible by default (it holds Home, Useful Links, Contact Us, Logout).
    // CSS should define its layout (e.g., display: flex).
    if (headerButtonsContainer) {
        headerButtonsContainer.style.display = 'flex';
    }

    // Hide register and logout buttons initially by default until auth state is known
    // (Their visibility will be managed by auth.onAuthStateChanged)
    if (signUpButtonHeader) signUpButtonHeader.style.display = 'none';
    if (logoutButtonHeader) logoutButtonHeader.style.display = 'none';

    // Ensure Torn City Homepage link is hidden by default (will be shown if logged in)
    if (tornCityHomepageLink) tornCityHomepageLink.style.display = 'none';

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
        if (currentMimicPanel) {
            currentMimicPanel.remove();
        }

        const panel = document.createElement('div');
        panel.setAttribute('id', 'notificationMimicPanel');
        panel.className = 'notification-panel-mimic'; // Use this class for styling
                                                    
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
            event.stopPropagation(); // Prevents click from bubbling up and triggering outsideClickListenerMimic
        });

        document.body.appendChild(panel);
        
        // Position the panel relative to the bell button
        const bellRect = bellButton.getBoundingClientRect();
        panel.style.position = 'absolute';
        panel.style.top = (bellRect.bottom + window.scrollY + 5) + 'px'; // 5px below bell
        
        // Horizontal positioning: try to center under bell, or adjust if too close to edge
        let panelLeft = bellRect.left + window.scrollX - (panel.offsetWidth / 2) + (bellRect.width / 2);
        if (panelLeft < 10) { // If too close to left edge
            panelLeft = 10;
        } else if (panelLeft + panel.offsetWidth > window.innerWidth - 10) { // If too close to right edge
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
        
        // Add outside click listener after a small delay to prevent immediate closing
        setTimeout(() => {
            document.addEventListener('click', outsideClickListenerMimic, { capture: true, once: true });
        }, 0); // 0ms delay, just puts it at end of current event loop
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
            // Re-add listener if it was not closed (e.g., if another click inside but not on panel, or another bell click)
            document.addEventListener('click', outsideClickListenerMimic, { capture: true, once: true });
        }
    }

    // Bell Icon Event Listener
    if (notificationBellElement) {
        if (useMimicNotification) {
            notificationBellElement.classList.add('bell-has-notifications'); // Initially make bell pulse
        }
        notificationBellElement.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevents the click from immediately closing it via window listener
            if (useMimicNotification) {
                toggleMimicNotificationPanel(notificationBellElement);
            } else {
                console.log('Real notification system would be triggered here.');
                if (notificationBellElement) {
                    notificationBellElement.classList.remove('bell-has-notifications');
                }
            }
        });
    }

    // --- Dropdown Logic (re-used from previous scripts) ---
    // This function helps close other dropdowns if they are open
    function closeOtherDropdowns(currentDropdown, currentButton) {
        const allDropdowns = document.querySelectorAll('.dropdown-content.show');
        allDropdowns.forEach(dropdown => {
            if (dropdown !== currentDropdown) {
                dropdown.classList.remove('show');
                const associatedButton = dropdown.previousElementSibling;
                if (associatedButton && associatedButton.classList.contains('active')) {
                    associatedButton.classList.remove('active');
                }
            }
        });
    }

    // Useful Links Dropdown
    if (usefulLinksBtn && usefulLinksDropdown) {
        usefulLinksBtn.addEventListener('click', function(event) {
            event.stopPropagation();
            const currentlyOpen = usefulLinksDropdown.classList.contains('show');
            closeOtherDropdowns(usefulLinksDropdown, usefulLinksBtn);
            if (!currentlyOpen) {
                usefulLinksDropdown.classList.add('show');
                usefulLinksBtn.classList.add('active');
            } else {
                usefulLinksDropdown.classList.remove('show');
                usefulLinksBtn.classList.remove('active');
            }
        });
    }

    // Contact Us Dropdown
    if (contactUsBtn && contactUsDropdown) {
        contactUsBtn.addEventListener('click', function(event) {
            event.stopPropagation();
            const currentlyOpen = contactUsDropdown.classList.contains('show');
            closeOtherDropdowns(contactUsDropdown, contactUsBtn);
            if (!currentlyOpen) {
                contactUsDropdown.classList.add('show');
                contactUsBtn.classList.add('active');
            } else {
                contactUsDropdown.classList.remove('show');
                contactUsBtn.classList.remove('active');
            }
        });
    }

    // Global click listener to close dropdowns when clicking outside
    window.addEventListener('click', function(event) {
        // Check for Useful Links dropdown
        if (usefulLinksDropdown && usefulLinksDropdown.classList.contains('show')) {
            if (!usefulLinksBtn.contains(event.target) && !usefulLinksDropdown.contains(event.target)) {
                usefulLinksDropdown.classList.remove('show');
                usefulLinksBtn.classList.remove('active');
            }
        }
        // Check for Contact Us dropdown
        if (contactUsDropdown && contactUsDropdown.classList.contains('show')) {
            if (!contactUsBtn.contains(event.target) && !contactUsDropdown.contains(event.target)) {
                contactUsDropdown.classList.remove('show');
                contactUsBtn.classList.remove('active');
            }
        }
    });

    // --- Firebase Auth state listener ---
    // Ensure 'auth' is available from firebase-init.js (loaded before this script)
    if (typeof auth !== 'undefined') {
        auth.onAuthStateChanged(function(user) {
            console.log("globalheader.js: Auth state changed. User:", user); // Log to debug

            const currentPagePath = window.location.pathname;
            const pageName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase();
            const indexPages = ['index.html', 'home.html', '']; // Assuming 'home.html' is an alias for your root index page

            if (user) {
                // User is signed in
                console.log("globalheader.js: User IS signed in:", user.uid);
                if (loggedInUserDisplay) {
                    loggedInUserDisplay.textContent = `Hello, ${user.email.split('@')[0]}!`;
                    loggedInUserDisplay.style.display = 'inline-block';
                }
                if (tornCityHomepageLink) tornCityHomepageLink.style.display = 'inline-flex';

                // Manage visibility of Logout vs. Register buttons
                if (logoutButtonHeader) {
                    logoutButtonHeader.style.display = 'inline-flex'; // Show Logout
                    logoutButtonHeader.onclick = function() {
                        auth.signOut().then(() => {
                            console.log('User signed out');
                            if (!indexPages.includes(pageName)) {
                                window.location.href = 'home.html';
                            }
                        }).catch((error) => {
                            console.error('Sign out error', error);
                        });
                    };
                }
                if (signUpButtonHeader) signUpButtonHeader.style.display = 'none'; // Hide Register when logged in
            } else {
                // No user is signed in
                console.log("globalheader.js: No user is signed in.");
                if (loggedInUserDisplay) loggedInUserDisplay.style.display = 'none';
                if (tornCityHomepageLink) tornCityHomepageLink.style.display = 'none';

                // Manage visibility of Logout vs. Register buttons
                if (logoutButtonHeader) logoutButtonHeader.style.display = 'none'; // Hide Logout
                if (signUpButtonHeader) {
                    if (!indexPages.includes(pageName) && pageName !== 'signup.html') {
                        signUpButtonHeader.style.display = 'inline-flex'; // Show Register
                    } else {
                        signUpButtonHeader.style.display = 'none'; // Hide Register on home/index/signup pages
                    }
                }
            }
        });
    } else {
        console.warn("Firebase auth object is not available for header UI script. Ensure Firebase App and Auth SDKs are loaded correctly before globalheader.js.");
        // Fallback: If Firebase not loaded, assume logged out state
        if (headerButtonsContainer) headerButtonsContainer.style.display = 'flex'; // Keep visible if no auth control
        if (logoutButtonHeader) logoutButtonHeader.style.display = 'none';
        if (signUpButtonHeader) {
            const currentPagePath = window.location.pathname;
            const pageName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase();
            const indexPages = ['index.html', 'home.html', ''];
            if (!indexPages.includes(pageName) && pageName !== 'signup.html') {
                signUpButtonHeader.style.display = 'inline-flex';
            } else {
                signUpButtonHeader.style.display = 'none';
            }
        }
    }
});