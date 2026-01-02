const express = require('express');
const router = express.Router();
const client = require('../db');
const authenticateToken = require('../middleware/auth')

// Apply the security guard to ALL routes in this file automatically
router.use(authenticateToken);

// POST /api/clients - Create a new client
// !!!'authenticateToken' is the 2nd argument. It runs first!
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

module.exports = router;