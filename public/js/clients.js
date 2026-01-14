const API_URL = 'http://localhost:3000/api';
const token = localStorage.getItem('token');

if (!token) {
    window.location.href = 'index.html';
}

// 1. Navigation
const createClientBtn = document.getElementById('create-client-btn');
const viewTasksBtn = document.getElementById('view-tasks-btn');
const clientListContainer = document.getElementById('client-list');
const filterItems = document.querySelectorAll('.sidebar li');

let allClients = []; 

if (createClientBtn) createClientBtn.addEventListener('click', () => window.location.href = 'create-client.html');
if (viewTasksBtn) viewTasksBtn.addEventListener('click', () => window.location.href = 'dashboard.html');

// 2. Load Clients on Start
async function loadClients() {
    clientListContainer.innerHTML = '<p style="text-align:center; margin-top:20px;">Loading clients...</p>';
    try {
        const response = await fetch(`${API_URL}/clients`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            allClients = await response.json();
            // Default Sort: Name (A-Z)
            sortClients('By Name (A-Z)');
        }
    } catch (error) {
        console.error(error);
    }
}

// 3. Filter Logic
filterItems.forEach(item => {
    item.addEventListener('click', () => {
        filterItems.forEach(li => li.classList.remove('active-filter'));
        item.classList.add('active-filter');
        sortClients(item.innerText.trim());
    });
});

function sortClients(criteria) {
    let sorted = [...allClients];
    if (criteria.includes('Name')) sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (criteria.includes('Date')) sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    else if (criteria.includes('Email')) sorted.sort((a, b) => (a.contact_email || "").localeCompare(b.contact_email || ""));

    renderClients(sorted);
}

// 4. Render the Main List
function renderClients(clients) {
    if (clients.length === 0) {
        clientListContainer.innerHTML = '<p style="text-align:center;">No clients found.</p>';
        return;
    }
    
    clientListContainer.innerHTML = '';

    clients.forEach(client => {
        const html = `
            <div class="task-card">
                <div class="card-left">
                    <h3>${client.name}</h3>
                    <p style="color:#666; font-size:14px;">${client.contact_email || 'No email'}</p>
                </div>
                <div class="card-right">
                    <button onclick="expandClientView(${client.id})" 
                            style="padding:8px 16px; cursor:pointer; background:#e0e0e0; border:1px solid #999; border-radius:4px;">
                        [View Client Tasks]
                    </button>
                </div>
            </div>
        `;
        clientListContainer.innerHTML += html;
    });
}
async function expandClientView(clientId) {
    // A. Find the client data
    const client = allClients.find(c => c.id === clientId);
    if (!client) return;

    // B. Clear the container 
    clientListContainer.innerHTML = '';

    // C. Build the "Big Card" Structure
    const expandedCard = document.createElement('div');
    expandedCard.className = 'expanded-client-view'; // Uses our new CSS
    
    expandedCard.innerHTML = `
        <div class="expanded-header">
            <div>
                <h2>${client.name}</h2>
                <p style="color:#555;">${client.contact_email || 'No email'}</p>
            </div>
            <button id="close-expanded-btn" style="height:40px; padding:0 20px; cursor:pointer; background:#ccc; border:1px solid #999; border-radius:4px;">
                [Close]
            </button>
        </div>
        <div id="expanded-tasks-list" class="client-tasks-list">
            <p>Loading tasks...</p>
        </div>
    `;

    clientListContainer.appendChild(expandedCard);

    // D. Add Close Button Logic
    document.getElementById('close-expanded-btn').addEventListener('click', () => {
        const activeFilter = document.querySelector('.sidebar li.active-filter');
        const filterName = activeFilter ? activeFilter.innerText.trim() : 'By Name (A-Z)';
        sortClients(filterName);
    });

    // E. Fetch & Render Tasks
    try {
        const response = await fetch(`${API_URL}/tasks?client_id=${clientId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const tasks = await response.json();
        renderExpandedTasks(tasks);
    } catch (err) {
        console.error(err);
    }
}

function renderExpandedTasks(tasks) {
    const container = document.getElementById('expanded-tasks-list');
    
    if (tasks.length === 0) {
        container.innerHTML = '<p>No tasks found for this client.</p>';
        return;
    }

    container.innerHTML = '';

    tasks.forEach(task => {
        const dateStr = new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const priorityLabel = `(${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)})`;
        const priorityClass = task.priority === 'high' ? 'priority-high' : '';

     
        const html = `
            <div class="task-card" style="background-color:#A0A0A0; border:1px solid #000; margin-bottom:10px;">
                <div class="card-left">
                    <h3>${task.title}</h3>
                    <p class="client-name">Client: ${task.client_name || 'Current'}</p>
                </div>
                <div class="card-right" style="gap:20px;">
                    <span>Due: ${dateStr}</span>
                    <span class="${priorityClass}">${priorityLabel}</span>
                    <span>Status: ${task.status}</span>
                </div>
            </div>
        `;
        container.innerHTML += html;
    });
}

// Start
loadClients();