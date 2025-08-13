const express = require('express');
const Workout = require('../models/Workout');
const auth = require('../middleware/auth');

const router = express.Router();

// Get today's workouts
router.get('/today', auth, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const workouts = await Workout.find({
            user: req.userId,
            dateString: today
        }).sort({ createdAt: -1 });

        console.log(`📊 Found ${workouts.length} workouts for user ${req.userId} on ${today}`);
        res.json({ workouts });
    } catch (error) {
        console.error('Get workouts error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add workout
router.post('/', auth, async (req, res) => {
    try {
        console.log('💪 Received workout data:', req.body);
        console.log('💪 User ID:', req.userId);

        const { exercise, duration, caloriesBurned, intensity, notes } = req.body;
        const today = new Date().toISOString().split('T')[0];

        // Validate required fields
        if (!exercise || !duration || !caloriesBurned) {
            console.log('❌ Missing required workout fields');
            return res.status(400).json({
                message: 'Missing required fields: exercise, duration, caloriesBurned'
            });
        }

        const workout = new Workout({
            user: req.userId,
            exercise,
            duration: parseInt(duration),
            caloriesBurned: parseInt(caloriesBurned),
            intensity: intensity || 'medium',
            notes: notes || '',
            dateString: today
        });

        console.log('💪 Creating workout:', workout);
        const savedWorkout = await workout.save();
        console.log('✅ Workout saved successfully:', savedWorkout);

        res.status(201).json({
            message: 'Workout added successfully',
            workout: savedWorkout
        });
    } catch (error) {
        console.error('❌ Add workout error:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Delete workout
router.delete('/:id', auth, async (req, res) => {
    try {
        const workout = await Workout.findOneAndDelete({
            _id: req.params.id,
            user: req.userId
        });

        if (!workout) {
            return res.status(404).json({ message: 'Workout not found' });
        }

        res.json({ message: 'Workout deleted successfully' });
    } catch (error) {
        console.error('Delete workout error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
