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
// Progress Analytics JavaScript - Updated for your HTML structure
class ProgressAnalytics {
    constructor() {
        this.api = api; // Use your existing API instance
        this.initializeProgressPage();
    }

    async initializeProgressPage() {
        try {
            console.log('📊 Initializing progress analytics...');
            
            // Check authentication
            const token = localStorage.getItem('fittracker_token');
            if (!token) {
                window.location.href = 'login.html';
                return;
            }

            this.api.setToken(token);
            await this.loadProgressData();
            
        } catch (error) {
            console.error('❌ Failed to initialize progress page:', error);
            this.showError('Failed to load progress data');
        }
    }

    async loadProgressData() {
        try {
            // Fetch all data in parallel
            const [mealsResponse, workoutsResponse, userResponse] = await Promise.all([
                this.api.getAllMeals().catch(() => ({ meals: [] })),
                this.api.getAllWorkouts().catch(() => ({ workouts: [] })),
                this.api.getCurrentUser().catch(() => ({ user: null }))
            ]);

            const meals = mealsResponse.meals || [];
            const workouts = workoutsResponse.workouts || [];
            const user = userResponse.user || {};

            console.log('✅ Progress data loaded:', {
                meals: meals.length,
                workouts: workouts.length,
                user: user.name || 'Unknown'
            });

            // Update all analytics sections with your exact element IDs
            this.updateWeeklyStats(meals, workouts);
            this.updateGoalsStatus(meals, workouts);
            this.updateWeeklyProgressChart(meals, workouts);

        } catch (error) {
            console.error('❌ Error loading progress data:', error);
            this.showError('Unable to load progress data');
        }
    }

    updateWeeklyStats(meals, workouts) {
        try {
            // Get data from last 7 days
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);

            // Filter data for this week
            const weeklyMeals = meals.filter(meal => new Date(meal.createdAt) >= weekAgo);
            const weeklyWorkouts = workouts.filter(workout => new Date(workout.createdAt) >= weekAgo);

            // Calculate active days (unique days with meals or workouts)
            const activeDays = new Set();
            weeklyMeals.forEach(meal => {
                const date = new Date(meal.createdAt).toDateString();
                activeDays.add(date);
            });
            weeklyWorkouts.forEach(workout => {
                const date = new Date(workout.createdAt).toDateString();
                activeDays.add(date);
            });

            // Calculate weekly calories from meals
            const weeklyCalories = weeklyMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);

            // Update your exact HTML elements
            document.getElementById('activeDays').textContent = activeDays.size;
            document.getElementById('weeklyCalories').textContent = weeklyCalories.toLocaleString();
            document.getElementById('weeklyMeals').textContent = weeklyMeals.length;
            document.getElementById('weeklyWorkouts').textContent = weeklyWorkouts.length;

            console.log('📊 Weekly stats updated:', {
                activeDays: activeDays.size,
                weeklyCalories,
                weeklyMeals: weeklyMeals.length,
                weeklyWorkouts: weeklyWorkouts.length
            });

        } catch (error) {
            console.error('❌ Error updating weekly stats:', error);
        }
    }

    updateGoalsStatus(meals, workouts) {
        try {
            // Get today's data
            const today = new Date().toDateString();
            const todayMeals = meals.filter(meal => 
                new Date(meal.createdAt).toDateString() === today
            );
            const todayWorkouts = workouts.filter(workout => 
                new Date(workout.createdAt).toDateString() === today
            );
            const todayCalories = todayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);

            // Daily goals (as shown in your HTML)
            const dailyCaloriesGoal = 500;
            const dailyMealsGoal = 3;
            const dailyWorkoutsGoal = 1;

            // Calculate progress percentages
            const caloriesProgress = Math.min((todayCalories / dailyCaloriesGoal) * 100, 100);
            const mealsProgress = Math.min((todayMeals.length / dailyMealsGoal) * 100, 100);
            const workoutsProgress = Math.min((todayWorkouts.length / dailyWorkoutsGoal) * 100, 100);

            // Calculate overall progress
            const overallProgress = Math.round((caloriesProgress + mealsProgress + workoutsProgress) / 3);

            // Update progress bars and percentages
            this.updateProgressBar('caloriesGoalBar', 'caloriesGoalPercent', caloriesProgress);
            this.updateProgressBar('mealsGoalBar', 'mealsGoalPercent', mealsProgress);
            this.updateProgressBar('workoutsGoalBar', 'workoutsGoalPercent', workoutsProgress);

            // Update overall progress
            document.getElementById('overallGoalPercent').textContent = `${overallProgress}%`;

            console.log('🎯 Goals status updated:', {
                calories: `${todayCalories}/${dailyCaloriesGoal}`,
                meals: `${todayMeals.length}/${dailyMealsGoal}`,
                workouts: `${todayWorkouts.length}/${dailyWorkoutsGoal}`,
                overall: `${overallProgress}%`
            });

        } catch (error) {
            console.error('❌ Error updating goals status:', error);
        }
    }

    updateProgressBar(barId, percentId, percentage) {
        try {
            const progressBar = document.getElementById(barId);
            const percentText = document.getElementById(percentId);

            if (progressBar) {
                progressBar.style.width = `${percentage}%`;
                progressBar.setAttribute('aria-valuenow', percentage);
            }

            if (percentText) {
                percentText.textContent = `${Math.round(percentage)}%`;
            }
        } catch (error) {
            console.error('❌ Error updating progress bar:', error);
        }
    }

    updateWeeklyProgressChart(meals, workouts) {
        try {
            // Get data for last 7 days
            const chartData = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const dateStr = date.toDateString();

                const dayMeals = meals.filter(meal => 
                    new Date(meal.createdAt).toDateString() === dateStr
                ).length;

                const dayWorkouts = workouts.filter(workout => 
                    new Date(workout.createdAt).toDateString() === dateStr
                ).length;

                const dayCalories = meals
                    .filter(meal => new Date(meal.createdAt).toDateString() === dateStr)
                    .reduce((sum, meal) => sum + (meal.calories || 0), 0);

                chartData.push({
                    day: date.toLocaleDateString('en', { weekday: 'short' }),
                    meals: dayMeals,
                    workouts: dayWorkouts,
                    calories: dayCalories,
                    fullDate: date.toLocaleDateString()
                });
            }

            // Update the weekly progress chart area
            const chartContainer = document.getElementById('weeklyProgressChart');
            if (chartContainer && chartData.some(day => day.meals > 0 || day.workouts > 0)) {
                chartContainer.innerHTML = `
                    <div class="weekly-chart-container">
                        <div class="row text-center mb-3">
                            <div class="col">
                                <small class="text-muted fw-semibold">Daily Activity Overview</small>
                            </div>
                        </div>
                        <div class="row g-2">
                            ${chartData.map(day => `
                                <div class="col">
                                    <div class="day-card p-2 text-center" style="background: rgba(102, 126, 234, 0.1); border-radius: 8px;">
                                        <div class="fw-semibold mb-1" style="font-size: 0.8rem;">${day.day}</div>
                                        <div class="mb-1">
                                            <span class="badge bg-success rounded-pill" style="font-size: 0.7rem;">
                                                🍽️ ${day.meals}
                                            </span>
                                        </div>
                                        <div class="mb-1">
                                            <span class="badge bg-primary rounded-pill" style="font-size: 0.7rem;">
                                                💪 ${day.workouts}
                                            </span>
                                        </div>
                                        <div>
                                            <span class="badge bg-danger rounded-pill" style="font-size: 0.7rem;">
                                                🔥 ${day.calories}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            console.log('📈 Weekly progress chart updated:', chartData);

        } catch (error) {
            console.error('❌ Error updating weekly progress chart:', error);
        }
    }

    showError(message) {
        console.error('📊 Progress Analytics Error:', message);
        // Optionally show error in UI
    }
}

// Initialize progress analytics when page loads
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on the progress section
    if (document.getElementById('progress-section')) {
        console.log('🚀 Progress section found, initializing analytics...');
        new ProgressAnalytics();
    }
});


// Unique constraint on user and date
progressSchema.index({ user: 1, dateString: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);
