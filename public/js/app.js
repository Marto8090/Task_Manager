const API_URL = 'http://localhost:3000/api';

// DOM Elements
const authForm = document.getElementById('auth-form');
const formTitle = document.getElementById('form-title');
const authBtn = document.getElementById('auth-btn');
const toggleAuth = document.getElementById('toggle-auth');
const errorMsg = document.getElementById('error-msg');

let isLoginMode = true;

// 1. Check if already logged in (Note: using session storage now so it resets on close)
if (sessionStorage.getItem('token')) {
    window.location.href = 'dashboard.html'; 
}

// 2. Toggle Login/Signup
toggleAuth.addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    errorMsg.innerText = '';

    if (isLoginMode) {
        formTitle.innerText = 'Login';
        authBtn.innerText = 'Login';
        toggleAuth.innerText = 'New user? Create account';
    } else {
        formTitle.innerText = 'Sign Up';
        authBtn.innerText = 'Create account';
        toggleAuth.innerText = 'Existing user? Login';
    }
});

// 3. Handle Submit
authForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // This stops the '?' from appearing in the URL!
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const endpoint = isLoginMode ? '/login' : '/register';
    
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();

        if (response.ok) {
            if (isLoginMode) {
                sessionStorage.setItem('token', data.token);
                window.location.href = 'dashboard.html';
            } else {
                alert('Account created! Please login.');
                toggleAuth.click(); 
            }
        } else {
            errorMsg.innerText = data.error;
        }
    } catch (err) {
        errorMsg.innerText = 'Server error.';
    }
});