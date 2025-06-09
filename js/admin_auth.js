document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('adminLoginForm');
    const emailInput = document.getElementById('adminEmail');
    const passwordInput = document.getElementById('adminPassword');
    const loginError = document.getElementById('loginError');

    // Ensure Firebase is initialized before using it
    if (typeof firebase === 'undefined' || !firebase.apps.length) {
        console.error("Firebase has not been initialized. Check firebase-init.js");
        loginError.textContent = "Firebase not configured.";
        return;
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent default form submission

        const email = emailInput.value;
        const password = passwordInput.value;
        loginError.textContent = ''; // Clear previous errors

        try {
            await firebase.auth().signInWithEmailAndPassword(email, password);
            // Login successful, redirect to admin dashboard
            // MODIFIED: Added leading slash to ensure absolute path from root
            window.location.href = '/admin_dashboard.html';
        } catch (error) {
            // Handle login errors
            let errorMessage = "An unknown error occurred.";
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address format.';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'This user account has been disabled.';
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    errorMessage = 'Incorrect email or password.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Too many login attempts. Please try again later.';
                    break;
                default:
                    errorMessage = error.message;
            }
            loginError.textContent = errorMessage;
            console.error("Login error:", error);
        }
    });
});