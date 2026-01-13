const API_URL = 'http://localhost:3000/api';
const token = localStorage.getItem('token');

// 1. Security Check: Redirect to login if no token
if (!token) {
    window.location.href = 'index.html';
}

// 2. Navigation Logic
const createTaskBtn = document.getElementById('create-task-btn');
const viewClientsBtn = document.getElementById('view-clients-btn');
const logoutBtn = document.getElementById('logout-btn');

if (createTaskBtn) {
    createTaskBtn.addEventListener('click', () => {
        window.location.href = 'create-task.html';
    });
}

if (viewClientsBtn) {
    viewClientsBtn.addEventListener('click', () => {
        window.location.href = 'clients.html'; // We will build this next!
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });
}

// 3. (Optional) Create Client View Placeholder
// If you are on clients.html, we can add logic here later. 