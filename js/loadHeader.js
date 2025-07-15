// mysite/js/loadHeader.js
console.log("loadHeader.js: Script file started executing."); // ADDED THIS EARLIER, KEEP IT

document.addEventListener('DOMContentLoaded', function() {
    console.log("loadHeader.js: DOMContentLoaded fired. Starting fetch for header.");
    fetch('../pages/globalheader.html') // Path confirmed correct by Network tab
        .then(response => {
            if (!response.ok) {
                const errorMsg = `HTTP error! status: ${response.status} for ${response.url}`;
                console.error("loadHeader.js: Fetch error:", errorMsg);
                throw new Error(errorMsg);
            }
            return response.text();
        })
        .then(html => {
            console.log("loadHeader.js: Fetch successful. Attempting to inject HTML."); // NEW LOG HERE
            const headerPlaceholder = document.getElementById('header-placeholder');

            if (headerPlaceholder) {
                headerPlaceholder.innerHTML = html;
                console.log("loadHeader.js: Header HTML injected."); // This log should now appear

                console.log("loadHeader.js: Attempting to dynamically load globalheader.js."); // NEW LOG HERE
                const script = document.createElement('script');
                script.src = '../js/globalheader.js';
                script.onload = () => console.log("loadHeader.js: globalheader.js loaded dynamically and executed.");
                script.onerror = (e) => console.error("loadHeader.js: Error loading globalheader.js dynamically:", e);
                document.body.appendChild(script);
            } else {
                console.error("loadHeader.js: Error: #header-placeholder not found in the DOM!"); // CRITICAL NEW LOG
            }
        })
        .catch(err => console.error('loadHeader.js: Error during header fetch or injection:', err));
});