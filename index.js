// 0. Load environment variables first (needed for the DB connection)
require('dotenv').config();

// 1. Import the Express module
const express = require('express');
// 1.1. Import the PostgreSQL client
const { Client } = require('pg');

// 2. Create an Express application instance
const app = express();
const port = process.env.PORT || 3000; // Use port from .env or default

// 2.1. Create PostgreSQL client instance
const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

// 3. Define a basic route (your first API endpoint)
app.get('/', (req, res) => {
  res.send('Task Manager API is running!');
});

// 4. Start the server and connect to the database
async function startServer() {
    try {
        // Connect to the PostgreSQL database
        await client.connect();
        console.log('PostgreSQL database connected successfully.');

        // Start the Express server
        app.listen(port, () => {
            console.log(`Server listening at http://localhost:${port}`);
        });

    } catch (err) {
        console.error('Database connection failed:', err.message);
        // Exit the process if the database connection fails
        process.exit(1);
    }
}

startServer();