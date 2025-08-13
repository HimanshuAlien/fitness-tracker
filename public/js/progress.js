// public/js/progress.js
class ProgressAnalytics {
    constructor() {
        this.api = api; // Use your existing API instance
        this.initializeProgressPage();
    }

    async initializeProgressPage() {
    try {
        console.log('📊 Initializing progress analytics...');
        
        // CRITICAL: Set token before making API calls
        const token = localStorage.getItem('fittracker_token');
        if (!token) {
            console.log('❌ No token, redirecting...');
            window.location.href = 'login.html';
            return;
        }
        
        // Set token in API instance
        this.api.setToken(token);
        console.log('🔑 Token set for progress analytics');
        
        // Small delay to ensure token is set
        setTimeout(() => {
            this.loadProgressData();
        }, 300);
        
    } catch (error) {
        console.error('❌ Failed to initialize progress page:', error);
    }
}


    async loadProgressData() {
        try {
            console.log('🔄 Loading progress data...');
            
            // Fetch all data in parallel
            const [mealsResponse, workoutsResponse] = await Promise.all([
                this.api.getAllMeals().catch(() => ({ meals: [] })),
                this.api.getAllWorkouts().catch(() => ({ workouts: [] }))
            ]);

            const meals = mealsResponse.meals || [];
            const workouts = workoutsResponse.workouts || [];

            console.log('✅ Progress data loaded:', {
                meals: meals.length,
                workouts: workouts.length
            });

            // Update all sections
            this.updateWeeklyStats(meals, workouts);
            this.updateGoalsStatus(meals, workouts);
            this.updateWeeklyProgressChart(meals, workouts);

        } catch (error) {
            console.error('❌ Error loading progress data:', error);
        }
    }

    updateWeeklyStats(meals, workouts) {
        try {
            console.log('📊 Updating weekly stats...');
            
            // Get data from last 7 days
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);

            const weeklyMeals = meals.filter(meal => new Date(meal.createdAt) >= weekAgo);
            const weeklyWorkouts = workouts.filter(workout => new Date(workout.createdAt) >= weekAgo);

            // Calculate active days
            const activeDays = new Set();
            weeklyMeals.forEach(meal => activeDays.add(new Date(meal.createdAt).toDateString()));
            weeklyWorkouts.forEach(workout => activeDays.add(new Date(workout.createdAt).toDateString()));

            const weeklyCalories = weeklyMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);

            // Update HTML elements
            const activeDaysEl = document.getElementById('activeDays');
            const weeklyCaloriesEl = document.getElementById('weeklyCalories');
            const weeklyMealsEl = document.getElementById('weeklyMeals');
            const weeklyWorkoutsEl = document.getElementById('weeklyWorkouts');

            if (activeDaysEl) activeDaysEl.textContent = activeDays.size;
            if (weeklyCaloriesEl) weeklyCaloriesEl.textContent = weeklyCalories.toLocaleString();
            if (weeklyMealsEl) weeklyMealsEl.textContent = weeklyMeals.length;
            if (weeklyWorkoutsEl) weeklyWorkoutsEl.textContent = weeklyWorkouts.length;

            console.log('✅ Weekly stats updated:', {
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
            console.log('🎯 Updating goals status...');
            
            const today = new Date().toDateString();
            const todayMeals = meals.filter(meal => new Date(meal.createdAt).toDateString() === today);
            const todayWorkouts = workouts.filter(workout => new Date(workout.createdAt).toDateString() === today);
            const todayCalories = todayMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);

            // Goals
            const dailyCaloriesGoal = 500;
            const dailyMealsGoal = 3;
            const dailyWorkoutsGoal = 1;

            // Calculate progress
            const caloriesProgress = Math.min((todayCalories / dailyCaloriesGoal) * 100, 100);
            const mealsProgress = Math.min((todayMeals.length / dailyMealsGoal) * 100, 100);
            const workoutsProgress = Math.min((todayWorkouts.length / dailyWorkoutsGoal) * 100, 100);
            const overallProgress = Math.round((caloriesProgress + mealsProgress + workoutsProgress) / 3);

            // Update progress bars
            this.updateProgressBar('caloriesGoalBar', 'caloriesGoalPercent', caloriesProgress);
            this.updateProgressBar('mealsGoalBar', 'mealsGoalPercent', mealsProgress);
            this.updateProgressBar('workoutsGoalBar', 'workoutsGoalPercent', workoutsProgress);

            const overallEl = document.getElementById('overallGoalPercent');
            if (overallEl) overallEl.textContent = `${overallProgress}%`;

            console.log('✅ Goals updated:', { overallProgress });

        } catch (error) {
            console.error('❌ Error updating goals:', error);
        }
    }

    updateProgressBar(barId, percentId, percentage) {
        const progressBar = document.getElementById(barId);
        const percentText = document.getElementById(percentId);

        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
        if (percentText) {
            percentText.textContent = `${Math.round(percentage)}%`;
        }
    }

    updateWeeklyProgressChart(meals, workouts) {
        // Simple chart update - you can enhance this later
        const chartContainer = document.getElementById('weeklyProgressChart');
        if (chartContainer && (meals.length > 0 || workouts.length > 0)) {
            chartContainer.innerHTML = `
                <div class="text-center py-4">
                    <h5>📊 Weekly Activity</h5>
                    <p>Total Meals: ${meals.filter(m => new Date(m.createdAt) >= new Date(Date.now() - 7*24*60*60*1000)).length}</p>
                    <p>Total Workouts: ${workouts.filter(w => new Date(w.createdAt) >= new Date(Date.now() - 7*24*60*60*1000)).length}</p>
                </div>
            `;
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM loaded, checking for progress section...');
    
    if (document.getElementById('progress-section')) {
        console.log('📊 Progress section found, initializing...');
        setTimeout(() => {
            new ProgressAnalytics();
        }, 1000); // Small delay to ensure api is loaded
    }
});
