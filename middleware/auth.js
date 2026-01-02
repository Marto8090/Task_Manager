const jwt = require('jsonwebtoken');
// Load my secrets from the .env file immediately.
require('dotenv').config(); 

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

module.exports = authenticateToken