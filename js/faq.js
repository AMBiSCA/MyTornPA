document.addEventListener('DOMContentLoaded', function() {
    console.log("FAQ.js: DOMContentLoaded event fired. Initializing FAQ accordion functionality.");

    // Select all elements that act as the question headers
    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            // Toggle an 'active' class on the question itself for styling (e.g., changing background, adding an arrow icon)
            this.classList.toggle('active');

            // Select the immediate sibling element that holds the answer
            const answer = this.nextElementSibling;
            
            // Check if the answer element exists and has the 'faq-answer' class
            if (answer && answer.classList.contains('faq-answer')) {
                // Toggle its display property to show/hide the answer
                if (answer.style.display === 'block') {
                    answer.style.display = 'none';
                } else {
                    answer.style.display = 'block';
                }
            } else {
                console.warn("FAQ.js: Could not find a valid '.faq-answer' sibling for the clicked question.", this);
            }
        });
    });

    console.log("FAQ.js: FAQ accordion functionality initialized successfully.");
});