document.addEventListener('DOMContentLoaded', function() {
    fetch('../pages/globalheader.html') // Make sure this path is correct based on your previous check
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for ${response.url}`);
            }
            return response.text();
        })
        .then(html => {
            document.getElementById('header-placeholder').innerHTML = html;

            const script = document.createElement('script');
            script.src = '../js/globalheader.js';
            script.onload = () => console.log("globalheader.js loaded dynamically.");
            script.onerror = (e) => console.error("Error loading globalheader.js:", e);
            document.body.appendChild(script); // Append to body or head

        })
        .catch(err => console.error('Error loading header:', err));
});