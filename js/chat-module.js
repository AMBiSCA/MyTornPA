// A self-contained object for our entire chat system
const TornPaChat = {
    // This will store references to our HTML elements
    elements: {},

    // This holds the entire HTML for the chat system
    htmlTemplate: `
        <div id="tornpa-icon-bar-container">
            <div id="chat-bar-collapsed">
                <div id="open-faction-chat-icon" class="chat-bar-icon" title="Faction Chat">🤝</div>
                <div id="open-alliance-chat-icon" class="chat-bar-icon" title="Alliance Chat">🤝</div>
                <div id="open-war-chat-icon" class="chat-bar-icon" title="War Chat">⚔️</div>
                <div id="open-friends-icon" class="chat-bar-icon" title="Friends">👥</div>
                <div id="open-notifications-icon" class="chat-bar-icon" title="Notifications">🔔</div>
                <div id="open-settings-icon" class="chat-bar-icon" title="Settings">⚙️</div>
            </div>
        </div>

        <div id="tornpa-chat-window-container" style="display: none;">
            <div id="chat-window">
                <div class="chat-main-tabs-container">
                    <div id="dynamic-tabs-container"></div>
                    <div id="static-tabs-container">
                        <button class="chat-tab active" data-tab-target="faction-chat-panel" title="Faction Chat">💬</button>
                        <button class="chat-tab" data-tab-target="alliance-chat-panel" title="Alliance Chat">🤝</button>
                        <button class="chat-tab" data-tab-target="war-chat-panel" title="War Chat">⚔️</button>
                        <button class="chat-tab" data-tab-target="friends-panel" title="Friends">👥</button>
                        <button class="chat-tab" data-tab-target="notifications-panel" title="Notifications">🔔</button>
                        <button class="chat-tab" data-tab-target="settings-panel" title="Settings">⚙️</button>
                    </div>
                </div>
                <div id="faction-chat-panel" class="chat-panel active">
                    <div class="chat-header"><span class="chat-title">Faction Chat</span><button class="minimize-chat-btn">-</button></div>
                    <div id="chat-display-area" class="chat-display-area"></div>
                    <div class="chat-input-area"><input type="text" class="chat-text-input" placeholder="Type your message..."><button class="chat-send-btn">Send</button></div>
                </div>
                <div id="alliance-chat-panel" class="chat-panel hidden">
                    <div class="chat-header"><span class="chat-title">Alliance Chat</span><button class="minimize-chat-btn">―</button></div>
                    <div class="chat-display-area" id="alliance-chat-display-area"><p>Loading alliance messages...</p></div>
                    <div class="chat-input-area"><input type="text" class="chat-text-input" id="alliance-chat-text-input" placeholder="Type your message..."><button class="chat-send-btn" id="alliance-chat-send-btn">Send</button></div>
                </div>
                <div id="war-chat-panel" class="chat-panel hidden">
                    <div class="chat-header"><span class="chat-title">War Chat</span><button class="minimize-chat-btn">-</button></div>
                    <div id="war-chat-display-area" class="chat-messages-scroll-wrapper"></div>
                    <div class="chat-input-area"><input type="text" class="chat-text-input" placeholder="Type your message..."><button class="chat-send-btn">Send</button></div>
                </div>
                <div id="friends-panel" class="chat-panel hidden">
                    <div class="chat-header"><span class="chat-title">Friends</span><button class="minimize-chat-btn">-</button></div>
                    <div class="friends-panel-subtabs"><button class="sub-tab-button active" data-subtab="recent-chats" title="Recent Chats">✉️</button><button class="sub-tab-button" data-subtab="recently-met" title="Recently Met">👋</button><button class="sub-tab-button" data-subtab="faction-members" title="Faction Members">🏰</button><button class="sub-tab-button" data-subtab="friend-list" title="Friend List">👤</button><button class="sub-tab-button" data-subtab="ignore-list" title="Ignore List">🚫</button></div>
                    <div class="friends-panel-search"><input type="text" class="search-input" placeholder="Search by player name..."><span class="search-icon">🔍</span></div>
                    <div class="friends-panel-content"><p style="text-align: center; color: #888; padding-top: 20px;">Content will be loaded here.</p></div>
                </div>
                <div id="notifications-panel" class="chat-panel hidden">
                    <div class="chat-header"><span class="chat-title">Notifications</span><button class="minimize-chat-btn">-</button></div>
                    <div class="notifications-content-wrapper"></div>
                </div>
                <div id="settings-panel" class="chat-panel hidden">
                    <div class="chat-header"><span class="chat-title">Settings</span><button class="minimize-chat-btn">-</button></div>
                    <div class="settings-content-wrapper"></div>
                </div>
            </div>
        </div>
    `,

    // This function will kick everything off
    init() {
        // Step 1: Add the HTML to the page from our template
        document.body.insertAdjacentHTML('beforeend', this.htmlTemplate);
        
        // Step 2: Find and store all the important elements
        this.cacheDOMElements();

        // Step 3: Attach all the click listeners
        this.attachEventListeners();
    },

    // A dedicated place to find all our elements once
    cacheDOMElements() {
        this.elements.iconBarContainer = document.getElementById('tornpa-icon-bar-container');
        this.elements.windowContainer = document.getElementById('tornpa-chat-window-container');
        this.elements.chatBar = document.getElementById('chat-bar-collapsed');
        this.elements.minimizeBtns = document.querySelectorAll('.minimize-chat-btn');
        this.elements.allTabs = document.querySelectorAll('#tornpa-chat-window-container .chat-tab');
        this.elements.allPanels = document.querySelectorAll('#tornpa-chat-window-container .chat-panel');
    },

    // A dedicated place to attach all our event listeners
    attachEventListeners() {
        // Listener for clicking any icon on the bar
        if (this.elements.chatBar) {
            this.elements.chatBar.addEventListener('click', (event) => {
                const clickedIcon = event.target.closest('.chat-bar-icon');
                if (!clickedIcon) return;
                
                this.show(); // Show the main window
                
                // Figure out which panel to show based on the icon ID
                const panelId = clickedIcon.id.replace('open-', '').replace('-icon', '-panel');
                const targetTab = document.querySelector(`.chat-tab[data-tab-target="${panelId}"]`);
                
                // If we found a matching tab, click it to activate the correct panel
                if (targetTab) {
                    targetTab.click();
                }
            });
        }

        // Listeners for the minimize buttons in any panel
        this.elements.minimizeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.hide();
            });
        });

        // Listeners for tab switching
        this.elements.allTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                // Hide all panels and deactivate all tabs
                this.elements.allTabs.forEach(t => t.classList.remove('active'));
                this.elements.allPanels.forEach(p => p.classList.add('hidden'));
                
                // Activate the clicked tab and show its corresponding panel
                tab.classList.add('active');
                const targetPanelId = tab.dataset.tabTarget;
                const targetPanel = document.getElementById(targetPanelId);
                if (targetPanel) {
                    targetPanel.classList.remove('hidden');
                }
            });
        });
    },

    // Function to show the chat window
    show() {
        if (this.elements.windowContainer) this.elements.windowContainer.style.display = 'block';
        if (this.elements.iconBarContainer) this.elements.iconBarContainer.style.display = 'none';
    },

    // Function to hide the chat window
    hide() {
        if (this.elements.windowContainer) this.elements.windowContainer.style.display = 'none';
        if (this.elements.iconBarContainer) this.elements.iconBarContainer.style.display = 'block';
    }
};

// Start the chat module when the page's HTML has finished loading
document.addEventListener('DOMContentLoaded', () => {
    TornPaChat.init();
});