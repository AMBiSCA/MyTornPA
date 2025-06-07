document.addEventListener('DOMContentLoaded', function() {
    // Function to load HTML content into a target element
    function loadHtml(componentId, filePath) {
        fetch(filePath)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status} for ${filePath}`);
                }
                return response.text();
            })
            .then(html => {
                const targetElement = document.getElementById(componentId);
                if (targetElement) {
                    targetElement.innerHTML = html;

                    // IMPORTANT: If globalheader.js has an initialization function (like initGlobalHeader)
                    // and its logic needs to run AFTER the header HTML is loaded, you can call it here.
                    // This ensures elements manipulated by globalheader.js are present in the DOM.
                    if (componentId === 'header-placeholder') {
                        // Check if a global function exists and call it
                        if (typeof window.initGlobalHeader === 'function') {
                            window.initGlobalHeader();
                        } else {
                            // Fallback or warning if initGlobalHeader isn't defined
                            // This might happen if globalheader.js is not loaded yet or not structured with an init function
                            console.warn('initGlobalHeader function not found or not callable after header load. Ensure globalheader.js is loaded and structured correctly.');
                        }
                    }
                } else {
                    console.error(`Target element with ID "${componentId}" not found.`);
                }
            })
            .catch(error => {
                console.error(`Error loading ${filePath}:`, error);
            });
    }

    // Load header into the div with id="header-placeholder"
    // The path is relative to the HTML page that is including this script.
    // Assuming your HTML pages are in `pages/` and your `components/` folder is parallel to `pages/`
    // (e.g., yourproject/pages/somepage.html and yourproject/components/header.html)
    loadHtml('header-placeholder', '../components/header.html');

    // Load footer into the div with id="footer-placeholder"
    loadHtml('footer-placeholder', '../components/footer.html');
});