// mysite/js/globalheader.js
// This script manages the header UI based on Firebase authentication state.
document.addEventListener('DOMContentLoaded', function() {
    // --- Configuration ---
    const useMimicNotification = true; // Set to true to enable mimic, false for real system

    // --- Bell Icon SVG (Re-introduced) ---
    const bellIconSVG = `
        <svg id="notificationBellIconSVG" xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 90 90" style="vertical-align: middle; cursor: pointer; margin-right: 8px;">
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
    // Renamed ID of bell button for clarity in JS, HTML uses #notificationBell
    const notificationBellButton = document.getElementById('notificationBell'); 
    const tornCityHomepageLink = document.getElementById('tornCityHomepageLink');
    const loggedInUserDisplay = document.getElementById('logged-in-user-display'); // Get the user display element
    const headerEditProfileBtn = document.getElementById('headerEditProfileBtn'); // Get Edit Profile button

    // --- Initial setup for header buttons ---
    // Inject bell SVG into the button (if button exists in HTML)
    if (notificationBellButton) {
        notificationBellButton.insertAdjacentHTML('afterbegin', bellIconSVG);
        // Initially make bell pulse if mimic mode is on (simulating available notifications)
        if (useMimicNotification) {
            notificationBellButton.classList.add('bell-has-notifications');
        }
    }

    // These elements are initially hidden and their display is managed by auth.onAuthStateChanged
    if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
    if (signUpButtonHeader) signUpButtonHeader.style.display = 'none';
    if (logoutButtonHeader) logoutButtonHeader.style.display = 'none';
    if (tornCityHomepageLink) tornCityHomepageLink.style.display = 'none';
    if (loggedInUserDisplay) loggedInUserDisplay.style.display = 'none';
    if (headerEditProfileBtn) headerEditProfileBtn.style.display = 'none';
    if (notificationBellButton) notificationBellButton.style.display = 'none'; // Hide bell initially

    // --- Mimic Notification Panel Logic (Re-introduced) ---
    let mimicPanelVisible = false;
    let currentMimicPanel = null;

    function closeMimicPanel() {
        if (currentMimicPanel) {
            currentMimicPanel.remove();
        }
        mimicPanelVisible = false;
        currentMimicPanel = null;
        if (notificationBellButton && useMimicNotification) { 
            notificationBellButton.classList.add('bell-has-notifications'); // Start pulsing again
        }
        document.removeEventListener('click', outsideClickListenerMimic, { capture: true });
    }

    function openMimicPanel(bellButton) {
        if (currentMimicPanel) { 
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
        if (notificationBellButton) {
            notificationBellButton.classList.remove('bell-has-notifications'); // Stop pulsing when panel is open
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
        if (mimicPanelVisible && currentMimicPanel && !currentMimicPanel.contains(event.target) && event.target.id !== 'notificationBell' && !event.target.closest('#notificationBell')) {
            closeMimicPanel();
        } else if (mimicPanelVisible) { 
            document.addEventListener('click', outsideClickListenerMimic, { capture: true, once: true });
        }
    }

    // Bell Button Event Listener
    if (notificationBellButton) {
        notificationBellButton.addEventListener('click', function(event) {
            event.stopPropagation();
            if (useMimicNotification) {
                toggleMimicNotificationPanel(notificationBellButton);
            } else {
                console.log('Real notification system would be triggered here.');
                if (notificationBellButton) {
                    notificationBellButton.classList.remove('bell-has-notifications');
                }
            }
        });
    }

    // --- Dropdown Logic (re-used from previous scripts) ---
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
        if (usefulLinksDropdown && usefulLinksDropdown.classList.contains('show')) {
            if (!usefulLinksBtn.contains(event.target) && !usefulLinksDropdown.contains(event.target)) {
                usefulLinksDropdown.classList.remove('show');
                usefulLinksBtn.classList.remove('active');
            }
        }
        if (contactUsDropdown && contactUsDropdown.classList.contains('show')) {
            if (!contactUsBtn.contains(event.target) && !contactUsDropdown.contains(event.target)) {
                contactUsDropdown.classList.remove('show');
                contactUsBtn.classList.remove('active');
            }
        }
    });

    // --- Firebase Auth state listener (UPDATED LOGIC for all header elements) ---
    if (typeof auth !== 'undefined') {
        auth.onAuthStateChanged(function(user) {
            console.log("globalheader.js: Auth state changed. User:", user); 

            const currentPagePath = window.location.pathname;
            const pageName = currentPagePath.substring(currentPagePath.lastIndexOf('/') + 1).toLowerCase();
            const indexPages = ['index.html', 'home.html', ''];
            const isHomePage = indexPages.includes(pageName);

            if (user) {
                // User is signed in
                console.log("globalheader.js: User IS signed in:", user.uid);

                // Hide all logged-out elements
                if (tornCityHomepageLink) tornCityHomepageLink.style.display = 'none';
                if (signUpButtonHeader) signUpButtonHeader.style.display = 'none';

                // Display main header buttons container
                if (headerButtonsContainer) headerButtonsContainer.style.display = 'flex';
                
                // Set specific element visibility for logged-in state
                if (loggedInUserDisplay) loggedInUserDisplay.style.display = 'none'; // Name display: NOT shown in header
                if (logoutButtonHeader) logoutButtonHeader.style.display = 'inline-flex'; // Logout button: Shown
                
                // Home vs Edit Profile logic
                if (homeButtonHeader) {
                    if (isHomePage) {
                        homeButtonHeader.style.display = 'none'; // Hide Home on homepage
                    } else {
                        homeButtonHeader.style.display = 'inline-flex'; // Show Home on other pages
                    }
                }
                if (headerEditProfileBtn) {
                    if (isHomePage) {
                        headerEditProfileBtn.style.display = 'inline-flex'; // Show Edit Profile on homepage
                    } else {
                        headerEditProfileBtn.style.display = 'none'; // Hide Edit Profile on other pages
                    }
                }

                // Bell icon: ONLY when logged in AND useMimicNotification is true
                if (notificationBellButton) {
                    if (useMimicNotification) {
                        notificationBellButton.style.display = 'inline-flex'; // Show bell
                        notificationBellButton.classList.add('bell-has-notifications'); // Start pulsing if mimic
                    } else {
                        notificationBellButton.style.display = 'none'; // Hide if not in mimic mode
                    }
                }

            } else {
                // No user is signed in (Logged Out)
                console.log("globalheader.js: No user is signed in.");

                // Hide all logged-in elements
                if (loggedInUserDisplay) loggedInUserDisplay.style.display = 'none';
                if (headerButtonsContainer) headerButtonsContainer.style.display = 'none'; // Hide main buttons container
                if (logoutButtonHeader) logoutButtonHeader.style.display = 'none';
                if (homeButtonHeader) homeButtonHeader.style.display = 'none';
                if (headerEditProfileBtn) headerEditProfileBtn.style.display = 'none';
                if (notificationBellButton) notificationBellButton.style.display = 'none'; // Hide bell

                // Display logged-out specific elements
                if (tornCityHomepageLink) tornCityHomepageLink.style.display = 'inline-flex'; // Torn City Homepage link: Shown
                if (signUpButtonHeader) { // Register button: Shown (unless on signup page)
                    if (!isHomePage && pageName !== 'signup.html') {
                        signUpButtonHeader.style.display = 'inline-flex';
                    } else {
                        signUpButtonHeader.style.display = 'none';
                    }
                }
            }
        });
    } else {
        console.warn("Firebase auth object is not available for header UI script. Ensure Firebase App and Auth SDKs are loaded correctly before globalheader.js.");
        // Fallback: If Firebase not loaded, assume logged out state
        if (headerButtonsContainer) headerButtonsContainer.style.display = 'none';
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
        if (tornCityHomepageLink) tornCityHomepageLink.style.display = 'inline-flex'; // Show torncity link by default if auth not available
        if (loggedInUserDisplay) loggedInUserDisplay.style.display = 'none';
        if (homeButtonHeader) homeButtonHeader.style.display = 'none';
        if (headerEditProfileBtn) headerEditProfileBtn.style.display = 'none';
        if (notificationBellButton) notificationBellButton.style.display = 'none'; // Hide bell
    }
});