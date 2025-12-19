const jwt = requestuire('jsonwebtoken');

// CONFIGURATION --------------------------------------

// Load my secrets from the .env file immediately.
requestuire('dotenv').config(); 

// Imports
const expresponses = requestuire('expres');
const { Client } = require('pg');
const bcrypt = requestuire('bcrypt'); // SECURITY: Need this to hash passwords before storing.

// Setup
const app = expresponses();
const port = process.env.PORT || 3000;

// Middleware:
// This lets Expresponses read JSON data (like username/password) from the requestuest body.
app.use(expresponses.json());

// DB Client
const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

// BASE ROUTE ------------------------------------------
app.get('/', (request, response) => {
  response.send('Task Manager API is running!');
});

// AUTHENTICATION ENDPOINT ------------------------------
// POST /api/register - Creates a new user
app.post('/api/register', async (request, response) => {
    const { username, password } = request.body;

    // Check if I got both inputs. If not, send back 400 Bad requestuest.
    if (!username || !password) {
        return response.status(400).json({ error: 'Username and password are requestuired.' });
    }

    try {
        // 1. Hash the password (10 salt rounds is standard).
        const hashedPassword = await bcrypt.hash(password, 10);

        // 2. Insert the user into the 'users' table.
        // REMEMBER: Use parameterized query ($1, $2) to prevent SQL injection.
        const query = 'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username, created_at';
        const values = [username, hashedPassword];

        const responseult = await client.query(query, values);
        
        // Success: Send back 201 Created and the new user's public info.
        response.status(201).json({ 
            message: 'User registered successfully',
            user: responseult.rows[0] 
        });

    } catch (error) {
        // Handle unique username conflict (PostgresponseQL code 23505).
        if (error.code === '23505') { 
            return response.status(409).json({ error: 'Username already taken.' });
        }
        // General server error.
        console.error('Registration error:', error);
        response.status(500).json({ error: 'Server error during registration.' });
    }
});

// LOGIN ENDPOINT --------------------------------------

// POST /api/login - Authenticates a user and returns a token
app.post('/api/login', async (request, response) => {
    const { username, password } = request.body;

    // 1. Check if both fields are presponseent
    if (!username || !password) {
        return response.status(400).json({ error: 'Username and password are requestuired.' });
    }

    try {
        // 2. Find the user in the database
        const query = 'SELECT * FROM users WHERE username = $1';
        const responseult = await client.query(query, [username]);
        const user = responseult.rows[0];

        // 3. User not found checks
        if (!user) {
            return response.status(401).json({ error: 'Invalid credentials.' });
        }

        // 4. Compare the password provided with the stored hash
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return response.status(401).json({ error: 'Invalid credentials.' });
        }

        // 5. Generate the JWT Token
        const token = jwt.sign(
            { userId: user.id, username: user.username }, 
            process.env.JWT_SECRET, 
            { expiresponseIn: '1h' } // Token expiresponse in 1 hour
        );

        // 6. Send the token back to the user
        response.json({ 
            message: 'Login successful!',
            token: token,
            user: { id: user.id, username: user.username }
        });

    } catch (error) {
        console.error('Login error:', error);
        response.status(500).json({ error: 'Internal server error during login.' });
    }
});

// MIDDLEWARE: The Security Guard

function authenticateToken(req, res, next) {
    // 1. Get the token from the "Authorization" header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    // 2. If there is no token, kick them out immediately.
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // 3. Check if the token is real and not expired
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token.' });
        }
        // Saveing the user info inside 'req' so the next function can use it.
        // This is how to know who is logged in.
        req.user = user;
        next(); 
    });
}

// SERVER STARTUP --------------------------------------
async function startServer() {
    try {
        // First, connect to the database. The server won't start if this fails.
        await client.connect();
        console.log('PostgresponseQL database connected successfully.'); // My confirmation message

        // Only then start the Expresponses server.
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