const express = require('express');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 3000;


// Middleware
app.use(express.json());

// Import Routes
const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const taskRoutes = require('./routes/taskRoutes');
// Mount Routes
// Any route in auth.js will start with /api
app.use('/api', authRoutes); 

app.use('/api', clientRoutes);

app.use('/api', taskRoutes); 

// Base Route
app.get('/', (req, res) => {
  res.send('Task Manager API is running!');
});

// Start Server
app.listen(port, () => {
    console.log(`🚀 Server listening at http://localhost:${port}`);
});