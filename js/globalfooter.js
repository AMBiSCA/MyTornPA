document.addEventListener('DOMContentLoaded', function() {
    // --- THIS LINE IS CORRECTED ---
    // Path now looks for the footer in the SAME folder as the page.
    const footerUrl = 'globalfooter.html';
    
    // The ID of the div where the footer will be loaded.
    const placeholderId = 'globalfooterplaceholder';

    const placeholder = document.getElementById(placeholderId);

    if (placeholder) {
        fetch(footerUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(html => {
                placeholder.innerHTML = html;
            })
            .catch(error => {
                console.error('Error fetching global footer:', error);
                placeholder.innerHTML = '<p style="color:red; text-align:center;">Error loading footer.</p>';
            });
    }
});