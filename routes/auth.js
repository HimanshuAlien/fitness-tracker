const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Register
// Registration route in routes/auth.js
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Add validation to ensure name is provided
        if (!name || !email || !password) {
            return res.status(400).json({
                message: 'Name, email, and password are required'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                message: 'User already exists with this email'
            });
        }

        // Create new user with proper field mapping
        const user = new User({
            name: name.trim(), // Ensure name is provided and trimmed
            email: email.toLowerCase().trim(),
            password: password
        });

        await user.save();

        // Generate token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: user.getPublicProfile()
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            message: error.message || 'Registration failed'
        });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                weight: user.weight,
                height: user.height,
                goal: user.goal,
                bmi: user.calculateBMI(),
                theme: user.theme
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Get current user
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        res.json({
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                weight: user.weight,
                height: user.height,
                goal: user.goal,
                bmi: user.calculateBMI(),
                theme: user.theme
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
router.post('/register', async (req, res) => {
    try {
        console.log('📥 Registration request body:', req.body);
        console.log('📝 Name field:', req.body.name);
        console.log('📧 Email field:', req.body.email);

        // ... rest of registration logic
    } catch (error) {
        console.error('Registration error details:', error);
        // ... error handling
    }
});
// In routes/auth.js - Add to your LOGIN route
router.post('/login', async (req, res) => {
    try {
        console.log('🔑 LOGIN attempt for:', req.body.email);

        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        console.log('👤 User found:', user ? 'YES' : 'NO');
        console.log('📝 User name field:', user ? user.name : 'N/A');

        // ... rest of your login logic

    } catch (error) {
        console.error('❌ LOGIN ERROR:', error.message);
        res.status(500).json({ message: error.message });
    }
});

// In routes/auth.js - Add to your REGISTRATION route  
router.post('/register', async (req, res) => {
    try {
        console.log('📝 REGISTRATION attempt:', req.body);
        console.log('📝 Name field received:', req.body.name);

        const { name, email, password } = req.body;

        // ... rest of your registration logic

    } catch (error) {
        console.error('❌ REGISTRATION ERROR:', error.message);
        res.status(500).json({ message: error.message });
    }
});
// Add this temporary migration route to routes/auth.js
router.post('/migrate-users', async (req, res) => {
    try {
        console.log('🔄 Starting user migration...');

        // Find users without name field
        const usersWithoutName = await User.find({
            $or: [
                { name: { $exists: false } },
                { name: null },
                { name: '' }
            ]
        });

        console.log(`📊 Found ${usersWithoutName.length} users without names`);

        // Update each user
        for (let user of usersWithoutName) {
            const defaultName = user.email ? user.email.split('@')[0] : 'User';

            await User.updateOne(
                { _id: user._id },
                { $set: { name: defaultName } }
            );

            console.log(`✅ Updated user ${user.email} with name: ${defaultName}`);
        }

        res.json({
            message: `Migrated ${usersWithoutName.length} users`,
            users: usersWithoutName.length
        });

    } catch (error) {
        console.error('❌ Migration error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
