require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Updated CORS for production
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? ['https://your-frontend-url.onrender.com'] // Will update this later
        : ['http://localhost:3000'],
    credentials: true
};

app.use(cors(corsOptions));

// Rest of your existing server.js code...


// STEP 3: Configure middleware in correct order
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// STEP 4: Configure session middleware (now session is properly imported)
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// STEP 5: Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// STEP 6: Your API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/meals', require('./routes/meals'));
app.use('/api/workouts', require('./routes/workouts'));

// STEP 7: Google OAuth routes
app.use('/auth', require('./routes/googleAuth'));

// STEP 8: MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('📊 Connected to MongoDB');
    })
    .catch((error) => {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    });

// STEP 9: Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 FitTracker server running on port ${PORT}`);
    console.log('🔑 JWT Secret loaded:', process.env.JWT_SECRET ? 'YES' : 'NO');
    console.log('📊 MongoDB URI loaded:', process.env.MONGODB_URI ? 'YES' : 'NO');
    console.log('🔐 Google OAuth configured:', process.env.GOOGLE_CLIENT_ID ? 'YES' : 'NO');
});
