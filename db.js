// db.js
const { Client } = require('pg');
require('dotenv').config();

// Create the connection using your secret URL
const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

// Connect immediately
client.connect()
    .then(() => console.log('Connected to PostgreSQL database'))
    .catch(err => console.error('Database connection error:', err.stack));

// Export the connected client so others can use it
module.exports = client;