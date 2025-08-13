const express = require('express');
const Meal = require('../models/Meal');
const auth = require('../middleware/auth');

const router = express.Router();

// Get today's meals
// Add this route for getting ALL meals (not just today)
// Get ALL meals (FIXED with proper auth and path)
router.get('/all', auth, async (req, res) => {
    try {
        const userId = req.userId; // Use req.userId (not req.user.id)
        console.log('📊 Fetching all meals for user:', userId);

        const meals = await Meal.find({ user: userId })
            .sort({ createdAt: -1 }) // Latest first
            .limit(100); // Limit to last 100 meals

        console.log('✅ Found meals:', meals.length);

        res.json({
            success: true,
            meals: meals
        });

    } catch (error) {
        console.error('❌ Get all meals error:', error);
        res.status(500).json({
            message: 'Failed to fetch meals',
            error: error.message
        });
    }
});


// Add meal
router.post('/', auth, async (req, res) => {
    try {
        const { name, calories, protein, carbs, fats, mealType } = req.body;
        const today = new Date().toISOString().split('T')[0];

        const meal = new Meal({
            user: req.userId,
            name,
            calories,
            protein: protein || 0,
            carbs: carbs || 0,
            fats: fats || 0,
            mealType: mealType || 'snack',
            dateString: today
        });

        await meal.save();
        res.status(201).json({ message: 'Meal added successfully', meal });
    } catch (error) {
        console.error('Add meal error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete meal
router.delete('/:id', auth, async (req, res) => {
    try {
        const meal = await Meal.findOneAndDelete({
            _id: req.params.id,
            user: req.userId
        });

        if (!meal) {
            return res.status(404).json({ message: 'Meal not found' });
        }

        res.json({ message: 'Meal deleted successfully' });
    } catch (error) {
        console.error('Delete meal error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get meals by date range
router.get('/range', auth, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const meals = await Meal.find({
            user: req.userId,
            dateString: {
                $gte: startDate,
                $lte: endDate
            }
        }).sort({ date: -1 });

        res.json({ meals });
    } catch (error) {
        console.error('Get meals range error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
