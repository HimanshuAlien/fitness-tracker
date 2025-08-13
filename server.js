// STEP 1: Load environment variables FIRST
require('dotenv').config();

// STEP 2: Import ALL modules
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const path = require('path');

// STEP 3: Create Express app (MUST be here before using app.use())
const app = express();

// STEP 4: Now you can use middleware (after app is created)
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // ← Now this works because app exists

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// Your API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/meals', require('./routes/meals'));
app.use('/api/workouts', require('./routes/workouts'));
app.use('/auth', require('./routes/googleAuth'));

// Frontend routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/auth')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('📊 Connected to MongoDB');
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    });

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 FitTracker server running on port ${PORT}`);
    console.log('🔑 JWT Secret loaded:', process.env.JWT_SECRET ? 'YES' : 'NO');
    console.log('📊 MongoDB URI loaded:', process.env.MONGODB_URI ? 'YES' : 'NO');
    console.log('🔐 Google OAuth configured:', process.env.GOOGLE_CLIENT_ID ? 'YES' : 'NO');
});
