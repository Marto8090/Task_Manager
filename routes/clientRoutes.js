const express = require('express');
const router = express.Router();
const client = require('../db');
const authenticateToken = require('../middleware/auth')

router.use(authenticateToken);

// POST /api/clients - Create a new client
router.post('/clients', authenticateToken, async (req, res) => {
    const { name, email } = req.body;

    // Validation
    if (!name) {
        return res.status(400).json({ error: 'Client name is required.' });
    }
    try {
        // 1. Prepare the SQL
        const query = 'INSERT INTO clients (user_id, name, contact_email) VALUES ($1, $2, $3) RETURNING *';
        const values = [req.user.userId, name, email];

        // 2. Run the SQL
        const result = await client.query(query, values);
        
        // 3. Send back the new client data
        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error('Error creating client:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// GET /api/clients - Get ALL clients for the logged-in user
router.get('/clients', authenticateToken, async (req, res) => {
    try {
        // 1. Select clients ONLY where user_id matches the logged-in user.
        const query = 'SELECT * FROM clients WHERE user_id = $1 ORDER BY created_at DESC';
        
        // 2. Run the query using the ID from the token
        const result = await client.query(query, [req.user.userId]);
        
        // 3. Send the list (array) back
        res.json(result.rows);

    } catch (error) {
        console.error('Error fetching clients:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

router.put('/clients/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, contact_email } = req.body;

    try {
        // 1. Check if the client belongs to this user
        const checkOwnership = await client.query(
            'SELECT * FROM clients WHERE id = $1 AND user_id = $2',
            [id, req.user.userId]
        );

        if (checkOwnership.rows.length === 0) {
            return res.status(404).json({ error: 'Client not found or access denied.' });
        }

        // 2. Update the client in the database
        const query = `
            UPDATE clients 
            SET name = COALESCE($1, name), 
                contact_email = COALESCE($2, contact_email)
            WHERE id = $3
            RETURNING *;
        `;
        
        const result = await client.query(query, [name, contact_email, id]);

        res.json(result.rows[0]);

    } catch (error) {
        console.error('Error updating client:', error);
        res.status(500).json({ error: 'Server error during update.' });
    }
});

// DELETE /api/clients/:id - Delete a client AND their tasks
router.delete('/clients/:id', authenticateToken, async (req, res) => {
    const clientId = req.params.id;
    try {
        // 1. Security Check: Ensure this client belongs to the logged-in user
        const checkOwnership = await client.query(
            'SELECT * FROM clients WHERE id = $1 AND user_id = $2',
            [clientId, req.user.userId]
        );

        if (checkOwnership.rows.length === 0) {
            return res.status(404).json({ error: 'Client not found or access denied.' });
        }

        // 2. First, delete all tasks for this client (Cleanup)
        await client.query('DELETE FROM tasks WHERE client_id = $1', [clientId]);

        // 3. Now it is safe to delete the client
        await client.query('DELETE FROM clients WHERE id = $1', [clientId]);

        res.json({ message: 'Client and all associated tasks deleted.' });

    } catch (error) {
        console.error('Error deleting client:', error);
        res.status(500).json({ error: 'Server error during deletion.' });
    }
});

module.exports = router;