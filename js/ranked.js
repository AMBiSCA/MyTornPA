document.addEventListener('DOMContentLoaded', function() {
    // Login Page Specific Elements
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.getElementById('loginBtn');
    const loginError = document.getElementById('loginError');
    const rememberMeCheckbox = document.getElementById('rememberMe');
    const togglePasswordIcon = document.getElementById('togglePassword');

    // Register Popup Elements
    const registerOverlay = document.getElementById('registerOverlay');
    const registerEmail = document.getElementById('registerEmail');
    const registerPassword = document.getElementById('registerPassword');
    const registerBtn = document.getElementById('registerBtn');
    const registerError = document.getElementById('registerError');
    const googleSignInBtn = document.getElementById('googleSignInBtn');
    const closeRegisterBtn = document.getElementById('closeRegister');

    // Forgot Password Popup Elements
    const forgotPasswordOverlay = document.getElementById('forgotPasswordOverlay');
    const forgotEmail = document.getElementById('forgotEmail');
    const resetPasswordBtn = document.getElementById('resetPasswordBtn');
    const forgotError = document.getElementById('forgotError');
    const forgotSuccess = document.getElementById('forgotSuccess');
    const closeForgotBtn = document.getElementById('closeForgot');

    // Toggle Buttons
    const showRegisterBtn = document.getElementById('showRegister'); 
    const showForgotPasswordBtn = document.getElementById('showForgotPassword'); 

    // Password Visibility Toggle
    if (togglePasswordIcon && passwordInput) {
        togglePasswordIcon.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            // Optional: Change icon if you have two SVGs or change path data
        });
    }

    // Login Logic
    if (loginBtn && emailInput && passwordInput && rememberMeCheckbox && loginError && typeof auth !== 'undefined' && auth) {
        loginBtn.addEventListener('click', () => {
            loginError.textContent = '';
            const email = emailInput.value.trim();
            const passwordValue = passwordInput.value; // Renamed to avoid conflict
            if (!email || !passwordValue) {
                loginError.textContent = 'Please enter both email and password.';
                return;
            }
            const persistence = rememberMeCheckbox.checked
                ? firebase.auth.Auth.Persistence.LOCAL
                : firebase.auth.Auth.Persistence.SESSION;
            
            auth.setPersistence(persistence)
                .then(() => auth.signInWithEmailAndPassword(email, passwordValue))
                .then(() => { window.location.href = 'home.html'; }) // Redirect after successful login
                .catch(error => { loginError.textContent = error.message; });
        });
    }

    // Show/Hide Register Popup
    if (showRegisterBtn && registerOverlay) {
        showRegisterBtn.addEventListener('click', () => { registerOverlay.style.display = 'flex'; });
    }
    if (closeRegisterBtn && registerOverlay && registerEmail && registerPassword && registerError) {
        closeRegisterBtn.addEventListener('click', () => {
            registerOverlay.style.display = 'none';
            registerError.textContent = ''; 
            if(registerEmail) registerEmail.value = ''; 
            if(registerPassword) registerPassword.value = '';
        });
    }

    // Register Logic
    if (registerBtn && registerEmail && registerPassword && registerError && typeof auth !== 'undefined' && auth) {
        registerBtn.addEventListener('click', () => {
            registerError.textContent = '';
            const email = registerEmail.value.trim();
            const passwordValue = registerPassword.value; // Renamed
            const passwordValid = /[A-Z]/.test(passwordValue) && /[!@#$%^&*(),.?":{}|<>]/.test(passwordValue);
            if (!email || !passwordValue) {
                registerError.textContent = 'Please enter both email and password.'; return;
            }
            if (!passwordValid) {
                registerError.textContent = 'Password needs 1 capital & 1 special character.'; return;
            }
            auth.createUserWithEmailAndPassword(email, passwordValue)
                .then((userCredential) => { // User created
                    registerError.style.color = '#4CAF50';
                    registerError.textContent = 'Registration successful! Redirecting to login...';
                    // Optionally sign out the user immediately if you want them to log in manually
                    // auth.signOut(); 
                    setTimeout(() => {
                        registerError.textContent = ''; registerError.style.color = '#f44336';
                        if(registerOverlay) registerOverlay.style.display = 'none'; 
                        if(registerEmail) registerEmail.value = ''; 
                        if(registerPassword) registerPassword.value = '';
                        // No automatic redirect to login here, user can now use main login form
                    }, 3000);
                })
                .catch((error) => { registerError.textContent = error.message; });
        });
    }
    
    // Google Sign-In Logic
    if (googleSignInBtn && registerError && typeof auth !== 'undefined' && auth && typeof firebase !== 'undefined' && firebase.auth && firebase.auth.GoogleAuthProvider) {
        googleSignInBtn.addEventListener('click', () => {
            const provider = new firebase.auth.GoogleAuthProvider();
            auth.signInWithPopup(provider)
                .then(() => { window.location.href = 'home.html'; }) // Redirect after successful sign-in
                .catch((error) => { 
                    if(registerError) registerError.textContent = `Google Sign-In Error: ${error.message}`; 
                    else if(loginError) loginError.textContent = `Google Sign-In Error: ${error.message}`; // Also show on main login if needed
                });
        });
    }

    // Show/Hide Forgot Password Popup
    if (showForgotPasswordBtn && forgotPasswordOverlay) {
        showForgotPasswordBtn.addEventListener('click', () => { forgotPasswordOverlay.style.display = 'flex'; });
    }
    if (closeForgotBtn && forgotPasswordOverlay && forgotEmail && forgotError && forgotSuccess) {
        closeForgotBtn.addEventListener('click', () => {
            forgotPasswordOverlay.style.display = 'none';
            forgotError.textContent = ''; forgotSuccess.textContent = ''; 
            if(forgotEmail) forgotEmail.value = '';
        });
    }

    // Reset Password Logic
    if (resetPasswordBtn && forgotEmail && forgotError && forgotSuccess && typeof auth !== 'undefined' && auth) {
        resetPasswordBtn.addEventListener('click', () => {
            forgotError.textContent = ''; forgotSuccess.textContent = '';
            const email = forgotEmail.value.trim();
            if (!email) { forgotError.textContent = 'Please enter your email address.'; return; }
            auth.sendPasswordResetEmail(email)
                .then(() => { forgotSuccess.textContent = 'Password reset email sent! Check your inbox.'; })
                .catch((error) => { forgotError.textContent = error.message; });
        });
    }

    // --- Common Header/Footer UI script ---
    const usefulLinksBtn = document.getElementById('usefulLinksBtn');
    const usefulLinksDropdown = document.getElementById('usefulLinksDropdown');

    if (usefulLinksBtn && usefulLinksDropdown) {
        usefulLinksBtn.addEventListener('click', function(event) {
            event.stopPropagation(); 
            useful