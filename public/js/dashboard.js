const API_URL = 'http://localhost:3000/api';
const token = localStorage.getItem('token');
const taskListContainer = document.getElementById('task-list');

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
        window.location.href = 'clients.html';
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('token');
        window.location.href = 'index.html';
    });
}

// 4. Fetch and Render Tasks
async function loadTasks(filterClientId = null) {
    taskListContainer.innerHTML = '<p style="text-align:center; margin-top:20px;">Loading...</p>';

    try {
        // Build URL (either /tasks or /tasks?client_id=1)
        let url = `${API_URL}/tasks`;
        if (filterClientId) {
            url += `?client_id=${filterClientId}`;
        }

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch tasks');

        const tasks = await response.json();
        renderTasks(tasks);

    } catch (error) {
        console.error(error);
        taskListContainer.innerHTML = '<p style="color:red; text-align:center;">Error loading tasks.</p>';
    }
}

// 5. Generate HTML for the List
function renderTasks(tasks) {
    if (tasks.length === 0) {
        taskListContainer.innerHTML = '<p style="text-align:center; color:#666;">No tasks found. Create one!</p>';
        return;
    }

    taskListContainer.innerHTML = '';

    tasks.forEach(task => {
        // Convert SQL date to readable string ("Oct 25")
        const dateObj = new Date(task.due_date);
        const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        // Dynamic Status Color
        const statusStyle = task.status === 'done' ? 'color:green' : 'color:#555';

        // Create the Card HTML
        const cardHTML = `
            <div class="task-card">
                <div class="card-left">
                    <h3>${task.title}</h3>
                    <p class="client-name" style="font-size:12px; color:#666;">Client Name: ${task.client_name}</p>
                </div>
                <div class="card-right">
                    <span class="due-date">Due: ${dateStr}</span>
                    <span class="priority ${task.priority}">(${task.priority})</span>
                    <span class="status" style="${statusStyle}">Status: <b>${task.status}</b></span>
                    <button onclick="deleteTask(${task.id})" style="background:none; border:none; cursor:pointer;">🗑️</button>
                </div>
            </div>
        `;
        
        taskListContainer.innerHTML += cardHTML;
    });
}

// 6. Delete Task Logic
async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            loadTasks(); // Refresh the list
        } else {
            alert('Could not delete task');
        }
    } catch (err) {
        console.error(err);
    }
}

loadTasks();