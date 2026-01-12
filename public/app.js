const API_URL = 'http://localhost:3000/api';

// DOM Elements
const authScreen = document.getElementById('auth-screen');
const dashboardScreen = document.getElementById('dashboard-screen');
const authForm = document.getElementById('auth-form');
const formTitle = document.getElementById('form-title');
const authBtn = document.getElementById('auth-btn');
const toggleAuth = document.getElementById('toggle-auth');
const errorMsg = document.getElementById('error-msg');

let isLoginMode = false; //start in "Sign Up" mode

// 1. Toggling between Login and Sign Up
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

// 2. Handling Form Submit
authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
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
                // Saving the token
                localStorage.setItem('token', data.token);
                showDashboard();
            } else {
                // If registered switching to login automatically
                alert('Account created! Please login.');
                toggleAuth.click(); 
            }
        } else {
            errorMsg.innerText = data.error;
        }
    } catch (err) {
        errorMsg.innerText = 'Server error';
    }
});

// 3. Show Dashboard
function showDashboard() {
    authScreen.classList.add('hidden');
    dashboardScreen.classList.remove('hidden');
}

if (localStorage.getItem('token')) {
    showDashboard();
}

// Logout logic
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('token');
    location.reload();
});