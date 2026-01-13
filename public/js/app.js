const API_URL = 'http://localhost:3000/api';

// DOM Elements
const authForm = document.getElementById('auth-form');
const formTitle = document.getElementById('form-title');
const authBtn = document.getElementById('auth-btn');
const toggleAuth = document.getElementById('toggle-auth');
const errorMsg = document.getElementById('error-msg');

let isLoginMode = false;

// 1. Check if already logged in
if (localStorage.getItem('token')) {
    window.location.href = 'dashboard.html'; // <--- REDIRECT
}

// 2. Toggle Login/Signup
toggleAuth.addEventListener('click', () => {
    isLoginMode = !isLoginMode;
    if (isLoginMode) {
        formTitle.innerText = 'Login';
        authBtn.innerText = 'Login';
        toggleAuth.innerText = 'New user? Create account';
    } else {
        formTitle.innerText = 'Sign Up';
        authBtn.innerText = 'Create account';
        toggleAuth.innerText = 'Existing user? login';
    }
    errorMsg.innerText = '';
});

// 3. Handle Submit
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
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
                localStorage.setItem('token', data.token);
                window.location.href = 'dashboard.html'; // <--- REDIRECT
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