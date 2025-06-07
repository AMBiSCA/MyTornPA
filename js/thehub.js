document.addEventListener('DOMContentLoaded', () => {
    // --- View Toggling (Looking for Faction vs. Faction Leader) ---
    const lookingForFactionCheckbox = document.getElementById('lookingForFaction');
    const recruitingStatusCheckbox = document.getElementById('recruitingStatus');
    const lookingForFactionView = document.getElementById('lookingForFactionView');
    const factionLeaderView = document.getElementById('factionLeaderView');

    // Simulate user role: For real application, this would be determined by API call
    // or user data after login (e.g., checking if user's Torn ID is a leader/co-leader of any registered faction).
    let isFactionLeaderOrCoLeader = false; // Default to non-leader

    // --- Developer/Testing Toggle (Remove in Production) ---
    // This button allows you to quickly switch between leader/non-leader view for testing.
    // REMOVE THIS BLOCK AND THE BUTTON FROM YOUR PRODUCTION CODE.
    const testLeaderToggleBtn = document.createElement('button');
    testLeaderToggleBtn.textContent = "Toggle Leader Status (Dev)";
    testLeaderToggleBtn.style.cssText = "position: fixed; bottom: 80px; left: 10px; z-index: 9999; background-color: #555; color: white; padding: 10px; border: none; cursor: pointer; border-radius: 5px;";
    document.body.appendChild(testLeaderToggleBtn);

    testLeaderToggleBtn.addEventListener('click', () => {
        isFactionLeaderOrCoLeader = !isFactionLeaderOrCoLeader;
        alert(`Leader status set to: ${isFactionLeaderOrCoLeader}. Refreshing view.`);
        updateViewVisibility();
    });
    // --- End Developer/Testing Toggle ---


    const updateViewVisibility = () => {
        const recruitingStatusToggleParent = recruitingStatusCheckbox.parentElement; // The div containing the toggle
        const lookingForFactionToggleParent = lookingForFactionCheckbox.parentElement; // The div containing the toggle

        if (isFactionLeaderOrCoLeader) {
            // As a leader, show the faction's recruiting toggle
            recruitingStatusToggleParent.style.display = 'flex';
            // Hide the 'looking for a faction' toggle, as leaders typically manage
            // their own faction rather than personally looking for one in the same context.
            lookingForFactionToggleParent.style.display = 'none';

            // If the leader's faction is actively recruiting, show the leader's dashboard
            if (recruitingStatusCheckbox.checked) {
                factionLeaderView.style.display = 'block';
                lookingForFactionView.style.display = 'none';
            } else {
                // If the leader's faction is NOT recruiting, they might be Browse
                // other factions or have a general 'My Faction' overview (which we're representing with lookingForFactionView for now).
                factionLeaderView.style.display = 'none';
                lookingForFactionView.style.display = 'block'; // Show general Browse view for non-recruiting leaders
            }
            console.log(`Leader view active. Faction recruiting: ${recruitingStatusCheckbox.checked}`);

        } else {
            // As a non-leader, hide the recruiting status toggle
            recruitingStatusToggleParent.style.display = 'none';
            // Show the 'looking for a faction' toggle for the user
            lookingForFactionToggleParent.style.display = 'flex';

            // Non-leaders always see the "looking for faction" view
            lookingForFactionView.style.display = 'block';
            factionLeaderView.style.display = 'none';
            console.log(`Non-leader view active. User looking for faction: ${lookingForFactionCheckbox.checked}`);
        }

        // --- Important: Send status to backend for persistent storage ---
        // This is where you would make an API call to save the user's 'looking for faction' status
        // or the leader's 'recruiting status' to your database.
        // Example (pseudocode - replace with your actual fetch/API call):
        // fetch('/api/updateUserStatus', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({
        //         userId: 'CURRENT_USER_ID', // Get this from your authentication system
        //         isLookingForFaction: lookingForFactionCheckbox.checked,
        //         isFactionRecruiting: isFactionLeaderOrCoLeader ? recruitingStatusCheckbox.checked : undefined // Only send for leaders
        //     })
        // });
    };

    // Initial setup based on role
    updateViewVisibility();

    // Event listeners for the toggles (simulated behavior)
    // Call updateViewVisibility when the checkboxes change
    lookingForFactionCheckbox.addEventListener('change', updateViewVisibility);
    recruitingStatusCheckbox.addEventListener('change', updateViewVisibility);


    // --- Simple Chat Functionality ---
    const chatInput = document.querySelector('.chat-input input');
    const chatSendButton = document.querySelector('.chat-input button');
    const chatMessagesContainer = document.querySelector('.chat-messages');

    chatSendButton.addEventListener('click', () => {
        sendMessage();
    });

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    function sendMessage() {
        const messageText = chatInput.value.trim();
        if (messageText) {
            // Simulate a message being added (replace with actual API call later)
            const newMessage = document.createElement('p');
            // Using a placeholder username; in real app, get current user's name
            newMessage.innerHTML = `<strong>[YourUserName]:</strong> ${messageText}`;
            chatMessagesContainer.appendChild(newMessage);

            // Scroll to the bottom of the chat to show the newest message
            chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;

            chatInput.value = ''; // Clear input field
            console.log("Sent message:", messageText);

            // In a real application, you would send this message to a backend/websocket
            // fetch('/api/chat', { method: 'POST', body: JSON.stringify({ message: messageText }) });
        }
    }

    // --- Header Nav Active State ---
    const navLinks = document.querySelectorAll('.top-nav-links a');
    // Get the current page's filename (e.g., "thehub.html", "home.html")
    const currentFileName = window.location.pathname.split('/').pop();

    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        // Check if the link's href matches the current file name
        if (linkHref === currentFileName) {
            link.classList.add('active');
        }
        // Special case for 'home.html' if it's the root path (e.g., the URL is just '/')
        // You might need to adjust this depending on how your server serves the root.
        if (currentFileName === '' && linkHref.endsWith('home.html')) {
            link.classList.add('active');
        }
    });

    // --- Further Development Notes ---
    // - API Integration: Fetch real user role (isFactionLeaderOrCoLeader) from your backend.
    // - API Integration: Implement actual saving of toggle states (lookingForFactionCheckbox, recruitingStatusCheckbox).
    // - Dynamic Content: Load 'Featured Factions', 'Incoming Applications', 'Friends', etc., from your backend/Torn API.
    // - Error Handling: Add more robust error handling for API calls.
    // - UI Enhancements: Add loading spinners, empty states, etc.
});