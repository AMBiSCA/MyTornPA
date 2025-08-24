// mysite/js/broker.js (DEBUGGING Shorthand Input)

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const itemTableBody = document.getElementById('item-table-body');
    const currentItemsSpan = document.getElementById('current-items');
    const brokerApiKeyErrorDiv = document.getElementById('brokerApiKeyError');
    const searchInput = document.getElementById('item-search');
    const searchResultsDiv = document.getElementById('search-results');
    const addItemBtn = document.getElementById('add-item-btn');

    // Global variables
    let allItems = {};
    let portfolio = {};
    let watchlist = [];
    let tornApiKey = null;
    let selectedItemId = null;
    const PORTFOLIO_STORAGE_KEY = 'tornBrokerPortfolio';

    // --- Data Persistence ---
    function loadPortfolio() { /* ... function content unchanged ... */ }
    function savePortfolio() { /* ... function content unchanged ... */ }
    
    // --- DEBUGGING HELPER FUNCTION ---
    function parseShorthandNumber(str) {
        console.log('--- Running Shorthand Parser ---');
        console.log('1. Received input string:', str);

        if (typeof str !== 'string' || str.trim() === '') {
            console.log('2. Input is not a string or is empty. Returning 0.');
            return 0;
        }

        const cleanedStr = str.toLowerCase().trim();
        const lastChar = cleanedStr.charAt(cleanedStr.length - 1);
        
        let numPart = cleanedStr;
        let multiplier = 1;

        if (lastChar === 'k') {
            multiplier = 1000;
            numPart = cleanedStr.slice(0, -1);
        } else if (lastChar === 'm') {
            multiplier = 1000000;
            numPart = cleanedStr.slice(0, -1);
        } else if (lastChar === 'b') {
            multiplier = 1000000000;
            numPart = cleanedStr.slice(0, -1);
        }

        const num = parseFloat(numPart);

        if (isNaN(num)) {
            console.log('3. Parsed number part is Not-a-Number (NaN). Returning 0.');
            return 0;
        }
        
        const result = Math.round(num * multiplier);
        console.log('3. Parsed number part:', num, '| Multiplier:', multiplier);
        console.log('4. Returning final calculated number:', result);
        return result;
    }


    // --- Firebase Authentication ---
    if (typeof auth !== 'undefined' && typeof db !== 'undefined') {
        auth.onAuthStateChanged(async function(user) {
            if (user) {
                try {
                    const userDoc = await db.collection('userProfiles').doc(user.uid).get();
                    if (userDoc.exists) {
                        tornApiKey = userDoc.data().tornApiKey;
                        if (tornApiKey) {
                            brokerApiKeyErrorDiv.textContent = '';
                            await fetchAllItems(tornApiKey);
                            loadPortfolio();
                            refreshWatchlistDisplay();
                        } else {
                            handleApiError('Your Torn API Key is not set in your profile.');
                        }
                    }
                } catch (error) {
                    handleApiError('Error loading your profile.');
                }
            } else {
                handleApiError('Please sign in to use the Broker\'s Hub.');
            }
        });
    }

    function handleApiError(message) {
        if (brokerApiKeyErrorDiv) brokerApiKeyErrorDiv.textContent = message;
        itemTableBody.innerHTML = `<tr><td colspan="7" class="error-message">${message}</td></tr>`;
    }

    // --- Data Fetching ---
    async function fetchAllItems(apiKey) {
        try {
            const response = await fetch(`https://api.torn.com/torn/?selections=items&key=${apiKey}`);
            const data = await response.json();
            if (data.error) throw new Error(data.error.error);
            allItems = data.items;
        } catch (error) {
            handleApiError(`Could not fetch item data: ${error.message}`);
        }
    }

    // --- Core Calculation & Rendering ---
    function updateRowCalculations(row) { /* ... function content unchanged ... */ }
    async function refreshWatchlistDisplay() { /* ... function content unchanged ... */ }
    
    // --- Event Listeners ---
    searchInput.addEventListener('input', () => { /* ... function content unchanged ... */ });
    function displaySearchResults(matches) { /* ... function content unchanged ... */ }
    addItemBtn.addEventListener('click', () => { /* ... function content unchanged ... */ });
    itemTableBody.addEventListener('click', (e) => { /* ... function content unchanged ... */ });
    document.addEventListener('click', (e) => { /* ... function content unchanged ... */ });
});


// --- Orientation Handler (Unchanged) ---
let portraitBlocker = null;
let landscapeBlocker = null;
function createOverlays(){/*... function content unchanged ...*/}
function handleOrientation(){/*... function content unchanged ...*/}
document.addEventListener('DOMContentLoaded', handleOrientation);
window.addEventListener('resize', handleOrientation);
window.addEventListener('orientationchange', handleOrientation);