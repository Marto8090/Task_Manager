const API_URL = 'http://localhost:3000/api';
const token = sessionStorage.getItem('token'); 

if (!token) {
   
    window.location.href = 'index.html';
} else {
   
    window.addEventListener('load', () => {
        const loader = document.getElementById('loading-overlay');
        if (loader) {
            loader.classList.add('loader-hidden');
        }
    });
}

// 2. Global Selectors
const taskListContainer = document.getElementById('task-list');
const clientSelect = document.getElementById('client-select');

// 3. Navigation Buttons
const createTaskBtn = document.getElementById('create-task-btn');
const viewClientsBtn = document.getElementById('view-clients-btn');
const logoutBtn = document.getElementById('logout-btn');

if (createTaskBtn) createTaskBtn.addEventListener('click', () => window.location.href = 'create-task.html');
if (viewClientsBtn) viewClientsBtn.addEventListener('click', () => window.location.href = 'clients.html');

if (logoutBtn) logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('token'); 
    window.location.href = 'index.html';
});


// 4. Create Task Form Logic
const createTaskForm = document.getElementById('create-task-form');
if (createTaskForm) {
    const dateInput = document.getElementById('task-date');
    if (dateInput) {
        // Get today's date in local time (YYYY-MM-DD format)
        const today = new Date();
        const localDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
        dateInput.min = localDate;
    }
    createTaskForm.addEventListener('submit', async (e) => {
        e.preventDefault();

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

// 5. Sidebar Filter Logic (Only runs if sidebar exists)
const filterItems = document.querySelectorAll('.sidebar li'); 
let allTasks = []; 

if (filterItems.length > 0) {
    filterItems.forEach(item => {
        item.addEventListener('click', () => {
            filterItems.forEach(li => li.classList.remove('active-filter'));
            item.classList.add('active-filter');
            const filterName = item.innerText.trim();
            applyFilter(filterName);
        });
    });
}

function applyFilter(filterName) {
    let filtered = [...allTasks]; 

    if (filterName === 'Completed') {
        filtered = filtered.filter(t => t.status === 'done' || t.status === 'completed');
    } else {
        filtered = filtered.filter(t => t.status !== 'done' && t.status !== 'completed');
    }

    if (filterName === 'All Tasks') {
        filtered.sort((a, b) => a.title.localeCompare(b.title));
    } 
    else if (filterName === 'By Client') {
        filtered.sort((a, b) => (a.client_name || "").localeCompare(b.client_name || ""));
    } 
    else if (filterName === 'Due Date') {
        filtered.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
    }
    else if (filterName === 'Priority') {
        const priorityMap = { 'high': 3, 'medium': 2, 'low': 1 };
        filtered.sort((a, b) => {
            const valA = priorityMap[a.priority] || 0;
            const valB = priorityMap[b.priority] || 0;
            return valB - valA;
        });
    }

    renderTasks(filtered);
}

// 6. Fetch Tasks 
async function loadTasks(filterClientId = null) {
    if (!taskListContainer) return; 

    taskListContainer.innerHTML = '<p style="text-align:center; margin-top:20px;">Loading...</p>';

    try {
        let url = `${API_URL}/tasks`;
        if (filterClientId) url += `?client_id=${filterClientId}`;

        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch tasks');

        const tasks = await response.json();
        allTasks = tasks; 

        // Apply current filter
        const activeBtn = document.querySelector('.sidebar li.active-filter');
        const currentFilter = activeBtn ? activeBtn.innerText.trim() : 'All Tasks';
        applyFilter(currentFilter);

    } catch (error) {
        console.error(error);
        taskListContainer.innerHTML = '<p style="color:red; text-align:center;">Error loading tasks.</p>';
    }
}

// 7. Render Tasks 
function renderTasks(tasks) {
    if (!taskListContainer) return;

    if (tasks.length === 0) {
        taskListContainer.innerHTML = '<p style="text-align:center; color:#666;">No tasks found.</p>';
        return;
    }

    taskListContainer.innerHTML = ''; 

    tasks.forEach(task => {
        const dateObj = new Date(task.due_date);
        const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        // Determine Priority Class
        let priorityClass = '';
        if (task.priority === 'high') priorityClass = 'priority-high';
        else if (task.priority === 'medium') priorityClass = 'priority-medium';
        else if (task.priority === 'low') priorityClass = 'priority-low';
        
        const isDone = task.status === 'done' || task.status === 'completed';
        const checkAction = isDone ? `markPending(${task.id})` : `markComplete(${task.id})`;

        // UPDATE: We added ${priorityClass} to the main div below
        const cardHTML = `
        <div id="task-card-${task.id}" class="task-card ${priorityClass}" style="${isDone ? 'opacity: 0.7; background-color: #f8f9fa;' : ''}">
            <div class="card-left">
                <h3>${task.title}</h3>
                <p class="client-name" style="margin-bottom:0; margin-top: 4px;">Client: ${task.client_name || 'Unknown Client'}</p>
            </div>
            
            <div class="card-right">
                <div style="display:flex; gap:15px; align-items:center; margin-right: 20px; font-size: 14px;">
                    <span>Due: ${dateStr}</span>
                    </div>

                <div class="card-actions">
                    <button class="icon-btn" onclick="enableViewMode(${task.id})" title="View Details">
                        <img src="images/view-icon.png" class="task-icon" alt="View Details">
                    </button>
                    <button class="icon-btn" onclick="enableEditMode(${task.id})" title="Edit">
                        <img src="images/edit-icon.png" class="task-icon" alt="Edit">
                    </button>
                    <button class="icon-btn" onclick="${checkAction}" title="${isDone ? 'Mark Pending' : 'Mark Complete'}">
                        <img src="images/completed-icon.png" class="task-icon" alt="Toggle Status">
                    </button>
                    <button class="icon-btn" onclick="deleteTask(${task.id})" title="Delete">
                        <img src="images/delete-icon.png" class="task-icon" alt="Delete">
                    </button>
                </div>
            </div>
        </div>
    `;
        taskListContainer.innerHTML += cardHTML;
    });
}

// 8. Load Clients for Dropdown
async function loadClientsForDropdown() {
    if (!clientSelect) return; 

    try {
        const response = await fetch(`${API_URL}/clients`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const clients = await response.json();
            
            clientSelect.innerHTML = '<option value="" disabled selected hidden>Select a Client...</option>';

            if (clients.length === 0) {
                 const option = document.createElement('option');
                 option.text = "No clients found";
                 clientSelect.add(option);
                 return;
            }

            const uniqueClients = [];
            const seenIds = new Set();

            clients.forEach(client => { 
                if (!seenIds.has(client.name)) {
                    seenIds.add(client.name);
                    uniqueClients.push(client);
                }
            });

            uniqueClients.forEach(client => {
                const option = document.createElement('option');
                option.value = client.id;
                option.text = client.name;
                clientSelect.add(option);
            });
        }
    } catch (error) {
        console.error('Error loading clients:', error);
    }
}

// 9. Helper Functions (Status, Edit, View, Delete)
async function markComplete(taskId) { updateTaskStatus(taskId, 'done'); }
async function markPending(taskId) { updateTaskStatus(taskId, 'pending'); }

async function updateTaskStatus(taskId, newStatus) {
    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ status: newStatus })
        });
        if (response.ok) loadTasks();
    } catch (error) { console.error(error); }
}


function enableEditMode(taskId) {
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;
    const card = document.getElementById(`task-card-${taskId}`);
    
    // Existing Date Logic
    const dateObj = new Date(task.due_date);
    const dateInputVal = dateObj.toISOString().split('T')[0];

    const today = new Date();
    const minDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

    card.innerHTML = `
        <div style="width:100%; display:flex; flex-direction:column; gap:10px;">
            <input type="text" id="edit-title-${taskId}" value="${task.title}" style="padding:8px; width:100%;">
            <textarea id="edit-desc-${taskId}"MZ rows="6" style="padding:8px; width:100%; resize: vertical;">${task.description || ''}</textarea>
            
            <div style="display:flex; gap:10px; align-items:center; margin-top: 20px;">
                <input type="date" id="edit-date-${taskId}" value="${dateInputVal}" min="${minDate}" style="padding:5px; margin: 0;">
                
                <select id="edit-priority-${taskId}" style="padding:5px;">
                    <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option>
                    <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>Medium</option>
                    <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High</option>
                </select>

                <div style="margin-left:auto; display:flex; gap:5px;">
                    <button onclick="saveTaskEdit(${taskId})" style="background:#4CAF50; color:white; border:none; padding:5px 15px; border-radius:4px; cursor:pointer;">Save</button>
                    <button onclick="loadTasks()" style="background:#ccc; border:none; padding:5px 15px; border-radius:4px; cursor:pointer;">Cancel</button>
                </div>
            </div>
        </div>
    `;
}

async function saveTaskEdit(taskId) {
    const newTitle = document.getElementById(`edit-title-${taskId}`).value;
    const newDesc = document.getElementById(`edit-desc-${taskId}`).value;
    const newDate = document.getElementById(`edit-date-${taskId}`).value;
    const newPriority = document.getElementById(`edit-priority-${taskId}`).value;

    try {
        const response = await fetch(`${API_URL}/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ title: newTitle, description: newDesc, due_date: newDate, priority: newPriority })
        });
        if (response.ok) loadTasks();
        else alert('Error updating task');
    } catch (err) { console.error(err); }
}

function enableViewMode(taskId) {
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;
    const card = document.getElementById(`task-card-${taskId}`);
    const dateObj = new Date(task.due_date);
    const fullDateStr = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const priorityLabel = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
    const statusLabel = task.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

    card.innerHTML = `
        <div style="width:100%; display:flex; flex-direction:column; gap:15px; padding: 5px;">
            <h3 style="margin:0; font-size: 26px; border-bottom: 2px solid #eee; padding-bottom: 10px;">${task.title}</h3>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size: 16px; color:#555;">
                <div><strong>Client:</strong> ${task.client_name || 'Unknown'}</div>
                <div><strong>Due Date:</strong> ${fullDateStr}</div>
                <div><strong>Priority:</strong> <span class="priority-${task.priority}">${priorityLabel}</span></div>
                <div><strong>Status:</strong> ${statusLabel}</div>
            </div>
            <div>
                <strong style="display:block; margin-bottom:5px;">Description:</strong>
                <div style="background:#fff; padding:15px; border:1px solid #eee; border-radius:6px; white-space: pre-wrap; min-height: 60px; max-height:200px; overflow-y:auto;">${task.description || '<span style="color:#999;">No description provided.</span>'}</div>
            </div>
            <div style="margin-left:auto; margin-top: 10px;">
                <button onclick="loadTasks()" style="background:#757575; color:white; border:none; padding:10px 25px; border-radius:4px; cursor:pointer; font-weight:600; font-size:14px;">Close View</button>
            </div>
        </div>
    `;
}

// Delete Logic
let taskToDeleteId = null;
const deleteModal = document.getElementById('delete-modal');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

function deleteTask(taskId) {
    taskToDeleteId = taskId;      
    if(deleteModal) deleteModal.style.display = 'flex'; 
}

function closeDeleteModal() {
    taskToDeleteId = null;
    if(deleteModal) deleteModal.style.display = 'none';
}

if(confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async () => {
        if (!taskToDeleteId) return;
        try {
            const response = await fetch(`${API_URL}/tasks/${taskToDeleteId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                closeDeleteModal(); 
                loadTasks();        
            } else {
                alert('Could not delete task');
            }
        } catch (err) { console.error(err); }
    });
}

if (clientSelect) {
    loadClientsForDropdown();
}

if (taskListContainer) {
    loadTasks();
}