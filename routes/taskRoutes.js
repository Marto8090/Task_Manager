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

// 2. Get Tasks for a specific Client (GET /api/tasks?client_id=X)
router.get('/tasks', async(request ,response) => {

    const { client_id } = request.query;

    if(!client_id){
        return response.status(400).json({ error: 'Please provide a ?client_id= number.' });
    }

    try{
        // SECURITY CHECK 
        const verifyClient = await client.query(
            'SELECT * FROM clients WHERE id = $1 AND user_id = $2',
            [client_id, request.user.userId]
        );
        if(verifyClient.rows.length === 0){
            return response.status(403).json({ error: 'Access denied to this client.' })
        }

        const result = await client.query(
            'SELECT * FROM tasks WHERE client_id = $1 ORDER BY created_at DESC',
            [client_id]
        )

        response.status(201).json(result.rows);

    } catch(error){
        console.error('Error fetching tasks:', error);
        response.status(500).json({error: 'Server error'})
    }
});

module.exports = router;