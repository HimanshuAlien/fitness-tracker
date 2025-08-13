require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const path = require('path');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Session configuration with fallback
// Session configuration - PRODUCTION READY
app.use(session({
    secret: process.env.SESSION_SECRET || 'emergency-fallback-secret-key-12345',
    resave: false,
    saveUninitialized: false,
    name: 'fittracker.sid', // Custom session name
    cookie: { 
        secure: process.env.NODE_ENV === 'production', // Auto-detect HTTPS
        httpOnly: true, // Security improvement
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax' // CSRF protection
    }
}));


app.use(passport.initialize());
app.use(passport.session());

// Routes with error handling
try {
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/meals', require('./routes/meals'));
    app.use('/api/workouts', require('./routes/workouts'));
    app.use('/auth', require('./routes/googleAuth'));
} catch (error) {
    console.error('❌ Route loading error:', error);
}

// Frontend routes
app.get('/', (req, res) => {
    try {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } catch (error) {
        console.error('❌ Frontend route error:', error);
        res.status(500).send('Server Error');
    }
});

// Catch-all route for SPA
app.get('*', (req, res) => {
    try {
        if (!req.path.startsWith('/api') && !req.path.startsWith('/auth')) {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        } else {
            res.status(404).json({ message: 'API endpoint not found' });
        }
    } catch (error) {
        console.error('❌ Catch-all route error:', error);
        res.status(500).send('Server Error');
    }
});

// Database connection with better error handling
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB successfully');
    })
    .catch((error) => {
        console.error('❌ MongoDB connection failed:', error);
        // Don't exit process - let Render restart
    });

// Start server with proper error handling
const PORT = process.env.PORT || 10000;
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 FitTracker server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? 'Present' : 'Missing'}`);
    console.log(`📊 MongoDB URI: ${process.env.MONGODB_URI ? 'Present' : 'Missing'}`);
    console.log(`🔐 Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? 'Present' : 'Missing'}`);
});

// Handle server errors
server.on('error', (error) => {
    console.error('❌ Server error:', error);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🔄 SIGTERM received, shutting down gracefully');
    server.close(() => {
        mongoose.connection.close();
        process.exit(0);
    });
});
