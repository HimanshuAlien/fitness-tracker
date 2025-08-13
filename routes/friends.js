const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user's friends
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate('friends', 'fullName email');
        res.json({ friends: user.friends });
    } catch (error) {
        console.error('Get friends error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add friend by email
router.post('/add', auth, async (req, res) => {
    try {
        const { email } = req.body;

        const friend = await User.findOne({ email });
        if (!friend) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = await User.findById(req.userId);
        if (user.friends.includes(friend._id)) {
            return res.status(400).json({ message: 'User is already your friend' });
        }

        user.friends.push(friend._id);
        await user.save();

        res.json({ message: 'Friend added successfully', friend });
    } catch (error) {
        console.error('Add friend error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
