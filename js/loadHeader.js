// mysite/js/loadHeader.js
document.addEventListener('DOMContentLoaded', function() {
    fetch('/path/to/globalheader.html') // Adjust path as needed
        .then(response => response.text())
        .then(html => {
            document.getElementById('header-placeholder').innerHTML = html;
        })
        .catch(err => console.error('Error loading header:', err));
});