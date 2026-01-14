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


const createTaskForm = document.getElementById('create-task-form');

if (createTaskForm) {
    createTaskForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get values
        const title = document.getElementById('task-title').value;
        const desc = document.getElementById('task-desc').value;
        const clientId = document.getElementById('client-select').value; 
        const date = document.getElementById('task-date').value;
        const priority = document.querySelector('input[name="priority"]:checked').value;

        try {
            const response = await fetch(`${API_URL}/tasks`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    title: title,
                    description: desc,
                    client_id: clientId,
                    due_date: date,
                    priority: priority 
                })
            });

            if (response.ok) {
                window.location.href = 'dashboard.html';
            } else {
                const data = await response.json();
                alert(data.error || 'Error creating task');
            }
        } catch (error) {
            console.error(error);
            alert('Server error');
        }
    });
}

// FILTER LOGIC 
const taskListContainer = document.getElementById('task-list');
const filterItems = document.querySelectorAll('.sidebar li'); 

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
    // 1. Start with all data
    let filtered = [...allTasks]; 

    // 2. Decide what to SHOW based on the tab
    if (filterName === 'Completed') {
        // If we are in "Completed" tab -> SHOW ONLY DONE tasks
        filtered = filtered.filter(t => t.status === 'done' || t.status === 'completed');
    } else {
        // For every other tab (All Tasks, By Client, Due Date) -> SHOW ONLY PENDING tasks
        filtered = filtered.filter(t => t.status !== 'done' && t.status !== 'completed');
    }

    // 3. Apply the specific Sorting logic
    if (filterName === 'All Tasks') {
        filtered.sort((a, b) => a.title.localeCompare(b.title));
    } 
    else if (filterName === 'By Client') {
        filtered.sort((a, b) => (a.client_name || "").localeCompare(b.client_name || ""));
    } 
    else if (filterName === 'Due Date') {
        filtered.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    }

    renderTasks(filtered);
}

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

        // Check which sidebar item has the 'active-filter' class
        const activeBtn = document.querySelector('.sidebar li.active-filter');
        const currentFilter = activeBtn ? activeBtn.innerText.trim() : 'All Tasks';

        // Default: Apply "All Tasks" sort immediately
        applyFilter(currentFilter);

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

        // If done: Green Check. If not: Grey Outline Check.
        const checkIcon = isDone ? '✅' : '☑️'; 
        const checkAction = isDone ? `markPending(${task.id})` : `markComplete(${task.id})`;

      const cardHTML = `
            <div class="task-card" style="${isDone ? 'opacity: 0.7; background-color: #f0f0f0;' : ''}">
                <div class="card-left">
                    <h3>${task.title}</h3>
                    <p class="client-name">Client: ${task.client_name || 'Unknown'}</p>
                </div>
                <div class="card-right">
                    <span>Due: ${dateStr}</span>
                    <span class="${priorityClass}">${priorityLabel}</span>
                    <span style="${statusColor}">Status: ${task.status}</span>
                    
                    <button onclick="${checkAction}" title="Toggle Status" style="cursor:pointer; font-size:18px; border:none; background:none; margin-right:10px;">
                        ${checkIcon}
                    </button>

                    <button onclick="deleteTask(${task.id})" title="Delete Task" style="cursor:pointer; font-size:18px; border:none; background:none;">
                        🗑️
                    </button>
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

// 7. Load Clients for Dropdown (Create Task Page)
async function loadClientsForDropdown() {
    const clientSelect = document.getElementById('client-select');
    
    // Only run this if the dropdown actually exists on the page
    if (!clientSelect) return; 

    try {
        const response = await fetch(`${API_URL}/clients`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const clients = await response.json();
            
            // Clear current options (except the first "Select..." one)
            clientSelect.innerHTML = '<option value="">Select a Client...</option>';

            if (clients.length === 0) {
                 const option = document.createElement('option');
                 option.text = "No clients found (Create one first!)";
                 clientSelect.add(option);
                 return;
            }

            // Loop through clients and create options
            clients.forEach(client => {
                const option = document.createElement('option');
                option.value = client.id;       // The ID sends to the DB
                option.text = client.name;      // The Name shows to the User
                clientSelect.add(option);
            });
        }
    } catch (error) {
        console.error('Error loading clients:', error);
    }
}

loadClientsForDropdown();

// 8. Mark Task as Complete
async function markComplete(taskId) {
    updateTaskStatus(taskId, 'done');
}

// 9. Mark Task as Pending (Undo)
async function markPending(taskId) {
    updateTaskStatus(taskId, 'pending');
}

// Helper function to talk to the API
async function updateTaskStatus(taskId, newStatus) {
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            loadTasks(); // Refresh list to see change
        } else {
            alert('Error updating status');
        }
    } catch (error) {
        console.error(error);
    }
}

loadTasks();