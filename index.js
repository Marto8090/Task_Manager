// 1. Import the Express module
const express = require('express');

// 2. Create an Express application instance
const app = express();
const port = 3000; // Choose a port for local development

// 3. Define a basic route (your first API endpoint)
app.get('/', (req, res) => {
  res.send('Task Manager API is running!');
});

// 4. Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});