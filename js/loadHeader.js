document.addEventListener('DOMContentLoaded', function() {
    fetch('../pages/globalheader.html') // Corrected path based on your file structure
        .then(response => {
            if (!response.ok) {
                // Check for HTTP errors (like 404)
                throw new Error(`HTTP error! status: ${response.status} for ${response.url}`);
            }
            return response.text();
        })
        .then(html => {
            document.getElementById('header-placeholder').innerHTML = html;
        })
        .catch(err => console.error('Error loading header:', err));
});