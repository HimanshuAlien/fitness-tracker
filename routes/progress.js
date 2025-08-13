const express = require('express');
const Progress = require('../models/Progress');
const Meal = require('../models/Meal');
const Workout = require('../models/Workout');
const auth = require('../middleware/auth');

const router = express.Router();

// Get today's progress
router.get('/today', auth, async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Get today's meals and workouts
        const [meals, workouts] = await Promise.all([
            Meal.find({ user: req.userId, dateString: today }),
            Workout.find({ user: req.userId, dateString: today })
        ]);

        const totalCaloriesBurned = workouts.reduce((sum, workout) => sum + workout.caloriesBurned, 0);
        const totalMeals = meals.length;
        const totalWorkouts = workouts.length;

        // Calculate progress percentage
        const progressPercentage = calculateProgressPercentage(totalMeals, totalWorkouts, totalCaloriesBurned);

        // Update or create progress record
        const progress = await Progress.findOneAndUpdate(
            { user: req.userId, dateString: today },
            {
                totalCaloriesBurned,
                totalMeals,
                totalWorkouts,
                progressPercentage,
                date: new Date()
            },
            { upsert: true, new: true }
        );

        res.json({
            progress,
            meals,
            workouts
        });
    } catch (error) {
        console.error('Get today progress error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get weekly progress
router.get('/weekly', auth, async (req, res) => {
    try {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 6);

        const startDateStr = startDate.toISOString().split('T')[0];
        const endDateStr = endDate.toISOString().split('T')[0];

        const progressData = await Progress.find({
            user: req.userId,
            dateString: {
                $gte: startDateStr,
                $lte: endDateStr
            }
        }).sort({ dateString: 1 });

        // Fill in missing days with zero data
        const weeklyData = [];
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            const dateStr = currentDate.toISOString().split('T')[0];

            const dayData = progressData.find(p => p.dateString === dateStr) || {
                dateString: dateStr,
                totalCaloriesBurned: 0,
                totalMeals: 0,
                totalWorkouts: 0,
                progressPercentage: 0
            };

            weeklyData.push(dayData);
        }

        const weeklyStats = {
            totalCalories: weeklyData.reduce((sum, day) => sum + day.totalCaloriesBurned, 0),
            totalMeals: weeklyData.reduce((sum, day) => sum + day.totalMeals, 0),
            totalWorkouts: weeklyData.reduce((sum, day) => sum + day.totalWorkouts, 0),
            averageProgress: Math.round(
                weeklyData.reduce((sum, day) => sum + day.progressPercentage, 0) / 7
            )
        };

        res.json({
            weeklyData,
            weeklyStats
        });
    } catch (error) {
        console.error('Get weekly progress error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Download progress data
router.get('/download', auth, async (req, res) => {
    try {
        const { startDate, endDate, format = 'json' } = req.query;

        const [progressData, meals, workouts, user] = await Promise.all([
            Progress.find({
                user: req.userId,
                dateString: {
                    $gte: startDate,
                    $lte: endDate
                }
            }).sort({ dateString: 1 }),
            Meal.find({
                user: req.userId,
                dateString: {
                    $gte: startDate,
                    $lte: endDate
                }
            }).sort({ dateString: 1 }),
            Workout.find({
                user: req.userId,
                dateString: {
                    $gte: startDate,
                    $lte: endDate
                }
            }).sort({ dateString: 1 }),
            req.user
        ]);

        const exportData = {
            user: {
                name: user.fullName,
                email: user.email,
                goal: user.goal,
                weight: user.weight,
                height: user.height,
                bmi: user.calculateBMI()
            },
            dateRange: {
                startDate,
                endDate
            },
            summary: {
                totalDays: progressData.length,
                totalCalories: progressData.reduce((sum, day) => sum + day.totalCaloriesBurned, 0),
                totalMeals: progressData.reduce((sum, day) => sum + day.totalMeals, 0),
                totalWorkouts: progressData.reduce((sum, day) => sum + day.totalWorkouts, 0),
                averageProgress: Math.round(
                    progressData.reduce((sum, day) => sum + day.progressPercentage, 0) / Math.max(progressData.length, 1)
                )
            },
            dailyProgress: progressData,
            meals: meals,
            workouts: workouts,
            exportDate: new Date().toISOString()
        };

        if (format === 'csv') {
            // Convert to CSV format
            const csv = convertToCSV(exportData);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="fittracker-data-${startDate}-to-${endDate}.csv"`);
            res.send(csv);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="fittracker-data-${startDate}-to-${endDate}.json"`);
            res.json(exportData);
        }
    } catch (error) {
        console.error('Download progress error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

function calculateProgressPercentage(mealsCount, workoutsCount, caloriesBurned) {
    let progress = 0;

    // Meals progress (30%)
    if (mealsCount >= 3) progress += 30;
    else progress += (mealsCount / 3) * 30;

    // Workouts progress (40%)
    if (workoutsCount >= 1) progress += 40;

    // Calories progress (30%)
    const calorieGoal = 500;
    if (caloriesBurned >= calorieGoal) progress += 30;
    else progress += (caloriesBurned / calorieGoal) * 30;

    return Math.round(progress);
}

function convertToCSV(data) {
    let csv = 'Date,Calories Burned,Meals Count,Workouts Count,Progress %\n';

    data.dailyProgress.forEach(day => {
        csv += `${day.dateString},${day.totalCaloriesBurned},${day.totalMeals},${day.totalWorkouts},${day.progressPercentage}\n`;
    });

    return csv;
}

module.exports = router;
