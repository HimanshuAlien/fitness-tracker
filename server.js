// STEP 1: Load environment variables FIRS
require('dotenv').config();

// STEP 2: Import ALL required modules (including express-session)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session'); // ← MUST be here BEFORE using app.use(session())
// Add these lines to your server.js if not already there
const path = require('path');

// Serve static files (add after other middleware)
app.use(express.static('public'));

// Serve frontend routes (add before MongoDB connection)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Fallback route for SPA
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/auth')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});


// STEP 3: Create Express app
const app = express();

// STEP 4: Configure middleware in correct order
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// STEP 5: Configure session middleware (NOW session is properly imported)
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// STEP 6: Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// STEP 7: Your API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/meals', require('./routes/meals'));
app.use('/api/workouts', require('./routes/workouts'));

// STEP 8: Google OAuth routes
app.use('/auth', require('./routes/googleAuth'));

// STEP 9: MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('📊 Connected to MongoDB');
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    });

// STEP 10: Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 FitTracker server running on port ${PORT}`);
    console.log('🔑 JWT Secret loaded:', process.env.JWT_SECRET ? 'YES' : 'NO');
    console.log('📊 MongoDB URI loaded:', process.env.MONGODB_URI ? 'YES' : 'NO');
    console.log('🔐 Google OAuth configured:', process.env.GOOGLE_CLIENT_ID ? 'YES' : 'NO');
});
