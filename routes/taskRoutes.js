const express = require('express');
const router = express.Router();
const client = require('../db');
const authenticateToken = require('../middleware/auth');

// Apply the security guard to ALL routes in this file automatically
router.use(authenticateToken);

// 1. Create a Task (POST /api/tasks)
router.post('/tasks', async (request, response) => {
    
    const {client_id, title, description, priority, due_date} = request.body;

    // Validation: Title and Client ID are mandatory
    if(!client_id || !title){
        return response.status(400).json({ error: 'Client ID and Title are required.'})
    }

    try {
        const verifyClient = await client.query(
            'SELECT * FROM clients WHERE id = $1 AND user_id = $2',
            [client_id, request.user.userId]
        );
        
        if (verifyClient.rows.length === 0){
            return response.status(404).json({error: 'Client not found or does not belong to you.'})
        }

        const query = `
            INSERT INTO tasks 
            (user_id, client_id, title, description, status, priority, due_date) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING *
        `;

        const values = [
            request.user.userId,        // user_id (from token)
            client_id,              
            title,                 
            description || '',      // description (optional, defaults to empty string)
            'pending',              // status (default)
            priority || 'medium',   // priority (default to 'medium')
            due_date || null    
        ];

        const result = await client.query(query, values)
        response.status(201).json(result.rows[0]);
    }
    catch(error){
        console.error("Error adding task:", error);
        response.status(500).json({ error: 'Server error' })
    }
});

// 2. Get Tasks (GET /api/tasks OR /api/tasks?client_id=X)
router.get('/tasks', async (req, res) => {
    const { client_id } = req.query;
    const userId = req.user.userId;

    try {
        let query;
        let values;

        // Scenario 1: Filter by specific client
        if (client_id) {
            // Security: Check if client belongs to user
            const verifyClient = await client.query(
                'SELECT * FROM clients WHERE id = $1 AND user_id = $2',
                [client_id, userId]
            );
            
            if (verifyClient.rows.length === 0) {
                return res.status(403).json({ error: 'Access denied to this client.' });
            }

            query = `SELECT tasks.*, clients.name AS client_name FROM tasks JOIN clients ON tasks.client_id = clients.id
                    WHERE tasks.client_id = $1 AND tasks.user_id = $2 ORDER BY tasks.created_at DESC`;
            values = [client_id, userId];

        } else {
            // Scenario 2: Get ALL tasks for this user
         query = `
                SELECT tasks.*, clients.name AS client_name 
                FROM tasks 
                JOIN clients ON tasks.client_id = clients.id
                WHERE tasks.user_id = $1 
                ORDER BY tasks.created_at DESC
            `;
            values = [userId];
        }

        const result = await client.query(query, values);
        res.json(result.rows);

    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// 3. Update a Task (PUT /api/tasks/:id)   :id used as placeholder
router.put('/tasks/:id', async(request, response) => {
    const { id } = request.params; // Getting the ID number from the URL
    const { status, description, priority } = request.body // Getting the new data

    try{
        // 1. Does this task exist? 
        // 2. Does it belong to the logged-in user?
        const verifyTask = await client.query(
            'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
            [id, request.user.userId]
        );

        if(verifyTask.rows.length === 0){
            return response.status(403).json({ error: 'Access denied to this client.' })
        };
        // UPDATING THE DATABASE
        // using COALESCE so if I don't send a new value, it keeps the old one.
        const query = ` UPDATE tasks SET status = COALESCE($1, status), description = COALESCE($2, description),
                        priority = COALESCE($3, priority) WHERE id = $4 AND user_id = $5 RETURNING *; `;

        const result = await client.query(query, [status, description, priority, id, request.user.userId]);

        response.json({message: 'Task updated!', task: result.rows[0] });
    }
    catch(error){
        console.error('Error updating task:', error);
        response.status(500).json({ error: 'Server error' });
    }
});

// 4. Delete a Task (DELETE /api/tasks/:id)
router.delete('/tasks/:id', async (request, response) => {
    const { id } = request.params;

    try {
        // Only deleting if it belongs to the user
        const result = await client.query(
            'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, request.user.userId]
        );

        if (result.rows.length === 0) {
            return response.status(404).json({ error: 'Task not found or not yours.' });
        }

        response.json({ message: 'Task deleted successfully.' });

    } catch (error) {
        console.error('Error deleting task:', error);
        response.status(500).json({ error: 'Server error' });
    }
});


module.exports = router;