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
                        [View Client Details]
                    </button>
                </div>
            </div>
        `;
        clientListContainer.innerHTML += html;
    });
}

async function expandClientView(clientId) {
    const client = allClients.find(c => c.id === clientId);
    if (!client) return;

    clientListContainer.innerHTML = '';

    const expandedCard = document.createElement('div');
    expandedCard.className = 'expanded-client-view'; 
    
    expandedCard.innerHTML = `
        <div id="client-header-${client.id}" class="expanded-header" style="display:flex; justify-content:space-between;
        align-items:center; border-bottom:1px solid #ccc; padding-bottom:15px; margin-bottom:15px;">
            
            <div id="client-info-display">
                <h2 style="margin:0;">${client.name}</h2>
                <p style="color:#555; margin:5px 0 0 0;">${client.contact_email || 'No email'}</p>
            </div>

            <div style="display:flex; gap:15px; align-items:center;">
                
                <button onclick="enableClientEditMode(${client.id})" title="Edit Client" 
                    style="background:none; border:none; padding:0; cursor:pointer;">
                    <img src="images/edit-icon.png" style="width:40px; height:40px; display:block;" alt="Edit">
                </button>

                <button onclick="confirmDeleteClient(${client.id})" title="Delete Client" 
                    style="background:none; border:none; padding:0; cursor:pointer;">
                    <img src="images/delete-icon.png" style="width:40px; height:40px; display:block;" alt="Delete">
                </button>

                <button id="close-expanded-btn" title="Close View" style="background:none; border:none; padding:0; cursor:pointer;">
                    <img src="images/close-icon.png" style="width:40px; height:40px; display:block;" alt="Close">
                </button>
            </div>
        </div>

        <div id="expanded-tasks-list" class="client-tasks-list">
            <p style="text-align:center; margin-top:20px;">Loading tasks...</p>
        </div>
    `;

    clientListContainer.appendChild(expandedCard);

    document.getElementById('close-expanded-btn').addEventListener('click', () => {
        const activeFilter = document.querySelector('.sidebar li.active-filter');
        const filterName = activeFilter ? activeFilter.innerText.trim() : 'By Name (A-Z)';
        sortClients(filterName);
    });

    try {
        const response = await fetch(`${API_URL}/tasks?client_id=${clientId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const tasks = await response.json();
        renderExpandedTasks(tasks);
    } catch (err) { console.error(err); }
}

// B. "Edit Mode" - Fixed Alignment (No Margins)
function enableClientEditMode(clientId) {
    const client = allClients.find(c => c.id === clientId);
    if (!client) return;

    const displayDiv = document.getElementById('client-info-display');
    
    displayDiv.innerHTML = `
        <div style="display:flex; align-items:center; gap: 15px;">
            
            <div style="display:flex; flex-direction:row; gap:10px; align-items:center;">
                <input type="text" id="edit-client-name" value="${client.name}" 
                    style="font-size:18px; font-weight:bold; padding:5px; width:200px; margin:0; border:1px solid #ccc; border-radius:3px;">
                
                <input type="email" id="edit-client-email" value="${client.contact_email || ''}" placeholder="Email" 
                    style="padding:5px; width:220px; margin:0; border:1px solid #ccc; border-radius:3px;">
            </div>

            <div style="display:flex; gap:5px; align-items:center;">
                <button onclick="saveClientChanges(${client.id})" style="background:#4CAF50; color:white; border:none; padding:6px 15px; border-radius:4px; cursor:pointer; font-weight:bold; margin:0;">Save</button>
                <button onclick="expandClientView(${client.id})" style="background:#ccc; border:none; padding:6px 15px; border-radius:4px; cursor:pointer; font-weight:bold; margin:0;">Cancel</button>
            </div>
        </div>
    `;
}

// C. Save Function
async function saveClientChanges(clientId) {
    const newName = document.getElementById('edit-client-name').value;
    const newEmail = document.getElementById('edit-client-email').value;

    try {
        const response = await fetch(`${API_URL}/clients/${clientId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ name: newName, contact_email: newEmail })
        });

        if (response.ok) {
         
            loadClients();
            setTimeout(() => expandClientView(clientId), 100);
        } else {
            alert('Error updating client');
        }
    } catch (err) { console.error(err); }
}

// Show the Confirmation Popup
function confirmDeleteClient(clientId) {
    const modal = document.getElementById('delete-modal');
    
    // Safety check
    if (!modal) {
        if(confirm("Delete this client?")) deleteClientAPI(clientId);
        return;
    }

    // 1. Show the modal (CSS class handles the centering)
    modal.style.display = 'flex';

    // 2. Setup "Delete" button
    const confirmBtn = document.getElementById('confirm-delete-btn');
    const newBtn = confirmBtn.cloneNode(true); // Remove old listeners
    confirmBtn.parentNode.replaceChild(newBtn, confirmBtn);

    newBtn.addEventListener('click', () => {
        deleteClientAPI(clientId);
        modal.style.display = 'none';
    });

    // 3. Setup "Cancel" button
    const cancelBtn = document.getElementById('cancel-delete-btn');
    if (cancelBtn) {
        cancelBtn.onclick = () => {
            modal.style.display = 'none';
        };
    }
    
    // 4. (Optional) Close if clicking outside the white box
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// Actually Delete the Client (API Call)
async function deleteClientAPI(clientId) {
    try {
        const response = await fetch(`${API_URL}/clients/${clientId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
           
            loadClients(); 
        } else {
            alert('Cannot delete client. They might still have active tasks.');
        }
    } catch (err) {
        console.error(err);
        alert('Error connecting to server.');
    }
}

function renderExpandedTasks(tasks) {
    const container = document.getElementById('expanded-tasks-list');
    if (tasks.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:20px;">No tasks found.</p>';
        return;
    }

    container.innerHTML = '';
    tasks.forEach(task => {
        const dateStr = new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        let priorityClass = '';
        if (task.priority === 'high') priorityClass = 'priority-high';
        else if (task.priority === 'medium') priorityClass = 'priority-medium';
        else if (task.priority === 'low') priorityClass = 'priority-low';
        
        const html = `
            <div class="task-card ${priorityClass}">
                <div class="card-left">
                    <h3 style="font-size:18px;">${task.title}</h3>
                    <p style="font-size:12px; color:#888;">Status: ${task.status}</p>
                </div>
                <div class="card-right">
                    <span style="font-size:14px; color:#666;">Due: ${dateStr}</span>
                </div>
            </div>
        `;
        container.innerHTML += html;
    });
}
// Start
loadClients();