// mysite/js/loadHeader.js
document.addEventListener('DOMContentLoaded', function() {
    console.log("loadHeader.js: DOMContentLoaded fired. Starting fetch for header.");
    fetch('../pages/globalheader.html') // Ensure this path is correct, as verified before
        .then(response => {
            if (!response.ok) {
                const errorMsg = `HTTP error! status: ${response.status} for ${response.url}`;
                console.error("loadHeader.js: Fetch error:", errorMsg);
                throw new Error(errorMsg);
            }
            return response.text();
        })
        .then(html => {
            document.getElementById('header-placeholder').innerHTML = html;
            console.log("loadHeader.js: Header HTML injected.");

            // Dynamically load globalheader.js AFTER the header HTML is in place
            const script = document.createElement('script');
            script.src = '../js/globalheader.js'; // Ensure this path is correct relative to loadHeader.js
            script.onload = () => console.log("loadHeader.js: globalheader.js loaded dynamically and executed.");
            script.onerror = (e) => console.error("loadHeader.js: Error loading globalheader.js dynamically:", e);
            document.body.appendChild(script); // Append to body is usually reliable

        })
        .catch(err => console.error('loadHeader.js: Error during header fetch or injection:', err));
});