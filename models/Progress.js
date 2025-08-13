const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    dateString: {
        type: String,
        required: true
    },
    totalCaloriesBurned: {
        type: Number,
        default: 0
    },
    totalMeals: {
        type: Number,
        default: 0
    },
    totalWorkouts: {
        type: Number,
        default: 0
    },
    progressPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    weight: {
        type: Number,
        min: 30,
        max: 300
    },
    notes: {
        type: String,
        maxlength: 1000
    }
}, {
    timestamps: true
});
// In your progress page or dashboard.js
async function loadProgressData() {
    try {
        console.log('📊 Loading progress data...');
        
        // Check if user is authenticated
        const token = localStorage.getItem('fittracker_token');
        if (!token) {
            console.error('❌ No token found');
            window.location.href = 'login.html';
            return;
        }

        // Set token in API
        api.setToken(token);

        // Fetch all data in parallel
        const [mealsResponse, workoutsResponse, userResponse] = await Promise.all([
            api.getAllMeals().catch(err => {
                console.error('❌ Meals fetch error:', err);
                return { meals: [] };
            }),
            api.getAllWorkouts().catch(err => {
                console.error('❌ Workouts fetch error:', err);
                return { workouts: [] };
            }),
            api.getCurrentUser().catch(err => {
                console.error('❌ User fetch error:', err);
                return { user: null };
            })
        ]);

        console.log('✅ Progress data loaded:', {
            meals: mealsResponse?.meals?.length || 0,
            workouts: workoutsResponse?.workouts?.length || 0,
            user: userResponse?.user ? 'Present' : 'Missing'
        });

        // Update progress displays
        updateProgressCharts(mealsResponse?.meals || [], workoutsResponse?.workouts || []);
        updateStatsCards(mealsResponse?.meals || [], workoutsResponse?.workouts || []);

    } catch (error) {
        console.error('❌ Failed to load progress data:', error);
        showError('Failed to load progress data. Please refresh the page.');
    }
}

function updateProgressCharts(meals, workouts) {
    // Process meals data for charts
    const mealsThisWeek = meals.filter(meal => {
        const mealDate = new Date(meal.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return mealDate >= weekAgo;
    });

    // Process workouts data for charts
    const workoutsThisWeek = workouts.filter(workout => {
        const workoutDate = new Date(workout.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return workoutDate >= weekAgo;
    });

    console.log('📊 Weekly data:', {
        meals: mealsThisWeek.length,
        workouts: workoutsThisWeek.length
    });

    // Update your chart elements here
    // Example: document.getElementById('mealsChart').textContent = mealsThisWeek.length;
}

// Initialize progress page
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Progress page initializing...');
    loadProgressData();
});

// Unique constraint on user and date
progressSchema.index({ user: 1, dateString: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);
