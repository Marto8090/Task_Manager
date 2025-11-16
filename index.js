// CONFIGURATION -----------------------------------------
// Load my secrets from the .env file immediately.
require('dotenv').config(); 

// Imports
const express = require('express');
const { Client } = require('pg');
const bcrypt = require('bcrypt'); // SECURITY: Need this to hash passwords before storing.

// Setup
const app = express();
const port = process.env.PORT || 3000;

// Middleware:
// This lets Express read JSON data (like username/password) from the request body.
app.use(express.json());

// DB Client
const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

// BASE ROUTE ------------------------------------------
app.get('/', (req, res) => {
  res.send('Task Manager API is running!');
});

// AUTHENTICATION ENDPOINT ------------------------------
// POST /api/register - Creates a new user
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    // Check if I got both inputs. If not, send back 400 Bad Request.
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }

    try {
        // 1. Hash the password (10 salt rounds is standard).
        const hashedPassword = await bcrypt.hash(password, 10);

        // 2. Insert the user into the 'users' table.
        // REMEMBER: Use parameterized query ($1, $2) to prevent SQL injection.
        const query = 'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username, created_at';
        const values = [username, hashedPassword];

        const result = await client.query(query, values);
        
        // Success: Send back 201 Created and the new user's public info.
        res.status(201).json({ 
            message: 'User registered successfully',
            user: result.rows[0] 
        });

    } catch (error) {
        // Handle unique username conflict (PostgreSQL code 23505).
        if (error.code === '23505') { 
            return res.status(409).json({ error: 'Username already taken.' });
        }
        // General server error.
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration.' });
    }
});


// SERVER STARTUP --------------------------------------
async function startServer() {
    try {
        // First, connect to the database. The server won't start if this fails.
        await client.connect();
        console.log('PostgreSQL database connected successfully.'); // My confirmation message

        // Only then start the Express server.
        app.listen(port, () => {
            console.log(`Server listening at http://localhost:${port}`);
        });

    } catch (err) {
        // If DB fails, log the error and stop the whole process.
        console.error('Database connection failed:', err.message);
        process.exit(1);
    }
}

startServer();