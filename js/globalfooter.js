document.addEventListener('DOMContentLoaded', function() {
    // --- THIS IS THE CORRECT, UNIVERSAL PATH ---
    // The '/' at the beginning means it always starts from the root folder.
    const footerUrl = '/pages/globalfooter.html';
    
    const placeholderId = 'globalfooterplaceholder';
    const placeholder = document.getElementById(placeholderId);

    if (placeholder) {
        fetch(footerUrl)
            .then(response => {
                if (!response.ok) {
                    // This error will show if the file path is wrong.
                    throw new Error(`File not found at: ${footerUrl}`);
                }
                return response.text();
            })
            .then(html => {
                placeholder.innerHTML = html;
            })
            .catch(error => {
                console.error('Error fetching global footer:', error);
                placeholder.innerHTML = '<p style="color:red; text-align:center;">Error loading footer. Check file path.</p>';
            });
    }
});