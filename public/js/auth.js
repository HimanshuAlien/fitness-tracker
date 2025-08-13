// Clean Authentication Manager - Normal Login + Google OAuth
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Check if API is available
        if (typeof api === 'undefined') {
            console.error('❌ API object not found. Make sure api.js loads before auth.js');
            this.showMessage('Application error: Please refresh the page.', 'error');
            return;
        }

        console.log('✅ API object verified successfully');
        this.setupEventListeners();
        this.checkAuthentication();


        // Handle Google OAuth on both login AND register pages
        if (window.location.pathname.includes('dashboard.html') ||
            window.location.pathname.includes('register.html')) { // ← Add this line
            this.handleGoogleOAuthCallback();
        }
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
            console.log('✅ Login form listener attached');
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
            console.log('✅ Register form listener attached');
        }

        // Password toggles
        const toggleButtons = document.querySelectorAll('.toggle-password');
        toggleButtons.forEach(button => {
            button.addEventListener('click', (e) => this.togglePassword(e));
        });
    }

    async handleLogin(event) {
        event.preventDefault();

        console.log('🔑 Login form submitted');

        // Get form data
        const email = document.getElementById('email')?.value;
        const password = document.getElementById('password')?.value;

        if (!email || !password) {
            this.showMessage('Please enter both email and password.', 'error');
            return;
        }

        console.log('📧 Attempting login for:', email);

        try {
            this.showLoading(true);

            const response = await api.login({ email, password });
            console.log('✅ Login successful');

            api.setToken(response.token);
            this.currentUser = response.user;

            this.showMessage('✅ Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);

        } catch (error) {
            console.error('❌ Login error:', error);
            this.showMessage(error.message || 'Login failed', 'error');
        } finally {
            this.showLoading(false);
        }
    }

   async handleRegister(event) {
    event.preventDefault();
    
    console.log('📝 Registration form submitted');
    
    // Get form values with better error checking
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    const name = nameInput ? nameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';
    const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

    console.log('📊 Form values:', { 
        name: name,
        email: email, 
        password: password ? 'Present' : 'Missing',
        nameLength: name.length
    });

    // Fixed validation - check actual length after trimming
    if (!name || name.length < 2) {
        console.log('❌ Name validation failed. Name:', `"${name}"`, 'Length:', name.length);
        this.showMessage('Please enter a valid name (at least 2 characters).', 'error');
        return;
    }

    if (!email || !email.includes('@')) {
        this.showMessage('Please enter a valid email address.', 'error');
        return;
    }

    if (!password || password.length < 6) {
        this.showMessage('Password must be at least 6 characters long.', 'error');
        return;
    }

    if (password !== confirmPassword) {
        this.showMessage('Passwords do not match.', 'error');
        return;
    }

    try {
        this.showLoading(true);
        
        const response = await api.register({ 
            name: name,
            email: email, 
            password: password 
        });
        
        this.showMessage('✅ Registration successful! Please login.', 'success');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
        
    } catch (error) {
        console.error('❌ Registration error:', error);
        this.showMessage(error.message || 'Registration failed', 'error');
    } finally {
        this.showLoading(false);
    }
}



    // Google OAuth token handler (only for dashboard page)
    handleGoogleOAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const userName = urlParams.get('name');
        const error = urlParams.get('error');

        if (token) {
            console.log('🔑 Google login token received');

            // Store the token
            api.setToken(token);

            // Show success message
            this.showMessage(`✅ Welcome ${decodeURIComponent(userName) || 'back'}! Google login successful.`, 'success', 4000);

            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
        }

        if (error === 'auth_failed') {
            this.showMessage('❌ Google authentication failed. Please try again.', 'error');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    togglePassword(event) {
        const button = event.currentTarget;
        const input = button.previousElementSibling;
        const icon = button.querySelector('i');

        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    checkAuthentication() {
        const token = localStorage.getItem('fittracker_token');
        if (token) {
            api.setToken(token);

            const currentPage = window.location.pathname;
            if (currentPage.includes('login.html') || currentPage.includes('register.html')) {
                console.log('✅ User already authenticated, redirecting to dashboard');
                window.location.href = 'dashboard.html';
            }
        }
    }

    showLoading(show) {
        const buttons = document.querySelectorAll('button[type="submit"]');
        buttons.forEach(button => {
            if (show) {
                button.disabled = true;
                button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';
            } else {
                button.disabled = false;
                if (button.closest('#loginForm')) {
                    button.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Login';
                } else if (button.closest('#registerForm')) {
                    button.innerHTML = '<i class="fas fa-user-plus me-2"></i>Create Account';
                }
            }
        });
    }

    showMessage(message, type = 'info', duration = 5000) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.auth-message');
        existingMessages.forEach(msg => msg.remove());

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `alert alert-${type === 'error' ? 'danger' : type} auth-message`;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border: none;
            border-radius: 8px;
        `;

        messageDiv.innerHTML = `
            <div class="d-flex align-items-center">
                <div class="flex-grow-1">${message}</div>
                <button type="button" class="btn-close ms-2" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        `;

        document.body.appendChild(messageDiv);

        if (duration > 0) {
            setTimeout(() => {
                if (messageDiv.parentElement) {
                    messageDiv.remove();
                }
            }, duration);
        }
    }

    logout() {
        api.removeToken();
        this.currentUser = null;
        this.showMessage('✅ Logged out successfully', 'success', 2000);
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    }
}

// Initialize auth manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing AuthManager...');
    window.authManager = new AuthManager();
});
