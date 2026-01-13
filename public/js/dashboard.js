const API_URL = 'http://localhost:3000/api';
const token = localStorage.getItem('token');

if (!token) {
    window.location.href = 'index.html';
}

// NAVIGATION
const createTaskBtn = document.getElementById('create-task-btn');
const viewClientsBtn = document.getElementById('view-clients-btn');
const logoutBtn = document.getElementById('logout-btn');

if (createTaskBtn) createTaskBtn.addEventListener('click', () => window.location.href = 'create-task.html');
if (viewClientsBtn) viewClientsBtn.addEventListener('click', () => window.location.href = 'clients.html');
if (logoutBtn) logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.href = 'index.html';
});

// --- 🧠 FILTER LOGIC STARTS HERE ---
const taskListContainer = document.getElementById('task-list');
const filterItems = document.querySelectorAll('.sidebar li'); // Grab all filter buttons

// We need to store the raw data here so we can re-sort it without re-fetching
let allTasks = []; 

// Add click events to the sidebar filters
filterItems.forEach(item => {
    item.addEventListener('click', () => {
        // 1. Visual update (Grey background)
        filterItems.forEach(li => li.classList.remove('active-filter'));
        item.classList.add('active-filter');

        // 2. Apply the Logic
        const filterName = item.innerText.trim();
        applyFilter(filterName);
    });
});

function applyFilter(filterName) {
    // Always start with a fresh copy of the data
    let filtered = [...allTasks]; 

    if (filterName === 'All Tasks') {
        // Sort Alphabetically by Title (A-Z)
        filtered.sort((a, b) => a.title.localeCompare(b.title));
    } 
    else if (filterName === 'By Client') {
        // Group by Client Name (A-Z)
        filtered.sort((a, b) => (a.client_name || "").localeCompare(b.client_name || ""));
    } 
    else if (filterName === 'Due Date') {
        // Shortest time first (Oldest dates at top)
        filtered.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    } 
    else if (filterName === 'Completed') {
        // SHOW ONLY completed tasks (Filter, not just sort)
        filtered = filtered.filter(t => t.status === 'done' || t.status === 'completed');
    }

    renderTasks(filtered);
}
// --- 🧠 FILTER LOGIC ENDS HERE ---


// 4. Fetch Tasks (Updated to store data)
async function loadTasks(filterClientId = null) {
    taskListContainer.innerHTML = '<p style="text-align:center; margin-top:20px;">Loading...</p>';

    try {
        let url = `${API_URL}/tasks`;
        if (filterClientId) url += `?client_id=${filterClientId}`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch tasks');

        const tasks = await response.json();
        
        // SAVE DATA globally so filters can use it
        allTasks = tasks; 

        // Default: Apply "All Tasks" sort immediately
        applyFilter('All Tasks'); 

    } catch (error) {
        console.error(error);
        taskListContainer.innerHTML = '<p style="color:red; text-align:center;">Error loading tasks.</p>';
    }
}

// 5. Render Tasks (Using Client Name)
function renderTasks(tasks) {
    if (tasks.length === 0) {
        taskListContainer.innerHTML = '<p style="text-align:center; color:#666;">No tasks found.</p>';
        return;
    }

    taskListContainer.innerHTML = ''; 

    tasks.forEach(task => {
        const dateObj = new Date(task.due_date);
        const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        // Priority Color
        const priorityClass = task.priority === 'high' ? 'priority-high' : '';
        const priorityLabel = `(${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)})`; 

        // Status Color
        const isDone = task.status === 'done' || task.status === 'completed';
        const statusColor = isDone ? 'color:green' : 'color:black';

        const cardHTML = `
            <div class="task-card">
                <div class="card-left">
                    <h3>${task.title}</h3>
                    <p class="client-name">Client: ${task.client_name || 'Unknown'}</p>
                </div>
                <div class="card-right">
                    <span>Due: ${dateStr}</span>
                    <span class="${priorityClass}">${priorityLabel}</span>
                    <span style="${statusColor}">Status: ${task.status}</span>
                    <button onclick="deleteTask(${task.id})" style="cursor:pointer; font-size:18px; border:none; background:none;">🗑️</button>
                </div>
            </div>
        `;
        
        taskListContainer.innerHTML += cardHTML;
    });
}

// 6. Delete Task
async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            loadTasks(); 
        } else {
            alert('Could not delete task');
        }
    } catch (err) {
        console.error(err);
    }
}

// Start
loadTasks();