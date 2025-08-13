// Local Storage Management
class StorageManager {
    constructor() {
        this.keys = {
            currentUser: 'fittracker_current_user',
            users: 'fittracker_users',
            meals: 'fittracker_meals',
            workouts: 'fittracker_workouts',
            friends: 'fittracker_friends',
            theme: 'fittracker_theme'
        };
        this.initializeStorage();
    }

    initializeStorage() {
        // Initialize with demo data if first time
        if (!this.get(this.keys.users)) {
            this.initializeDemoData();
        }
    }

    initializeDemoData() {
        const demoUsers = [
            {
                id: 'demo',
                email: 'demo@fittracker.com',
                password: 'demo123', // In real app, this would be hashed
                fullName: 'Demo User',
                weight: 70,
                height: 175,
                goal: 'maintain',
                joinDate: new Date().toISOString()
            }
        ];

        const demoFriends = [
            {
                id: 'friend1',
                name: 'Alex Johnson',
                caloriesBurned: 450,
                mealsToday: 4,
                workoutsToday: 2,
                progress: 85
            },
            {
                id: 'friend2',
                name: 'Sarah Wilson',
                caloriesBurned: 320,
                mealsToday: 3,
                workoutsToday: 1,
                progress: 60
            },
            {
                id: 'friend3',
                name: 'Mike Chen',
                caloriesBurned: 600,
                mealsToday: 5,
                workoutsToday: 3,
                progress: 95
            }
        ];

        this.set(this.keys.users, demoUsers);
        this.set(this.keys.friends, demoFriends);
    }

    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    get(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return null;
        }
    }

    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    }

    clear() {
        try {
            Object.values(this.keys).forEach(key => {
                this.remove(key);
            });
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }

    // User Management
    getCurrentUser() {
        return this.get(this.keys.currentUser);
    }

    setCurrentUser(user) {
        return this.set(this.keys.currentUser, user);
    }

    getAllUsers() {
        return this.get(this.keys.users) || [];
    }

    addUser(user) {
        const users = this.getAllUsers();
        users.push(user);
        return this.set(this.keys.users, users);
    }

    findUser(email, password) {
        const users = this.getAllUsers();
        return users.find(user => user.email === email && user.password === password);
    }

    // Daily Data Management
    getTodayKey(userId, type) {
        const today = new Date().toISOString().split('T')[0];
        return `${type}_${userId}_${today}`;
    }

    getTodayData(userId, type) {
        const key = this.getTodayKey(userId, type);
        return this.get(key) || [];
    }

    setTodayData(userId, type, data) {
        const key = this.getTodayKey(userId, type);
        return this.set(key, data);
    }

    addTodayItem(userId, type, item) {
        const data = this.getTodayData(userId, type);
        item.id = Date.now().toString();
        item.timestamp = new Date().toISOString();
        data.push(item);
        return this.setTodayData(userId, type, data);
    }

    removeTodayItem(userId, type, itemId) {
        const data = this.getTodayData(userId, type);
        const filteredData = data.filter(item => item.id !== itemId);
        return this.setTodayData(userId, type, filteredData);
    }

    resetTodayData(userId) {
        const today = new Date().toISOString().split('T')[0];
        const mealsKey = `meals_${userId}_${today}`;
        const workoutsKey = `workouts_${userId}_${today}`;

        this.remove(mealsKey);
        this.remove(workoutsKey);
        return true;
    }

    // Progress Data
    getWeeklyData(userId) {
        const weekData = {
            totalCalories: 0,
            totalMeals: 0,
            totalWorkouts: 0,
            averageProgress: 0,
            days: []
        };

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const mealsKey = `meals_${userId}_${dateStr}`;
            const workoutsKey = `workouts_${userId}_${dateStr}`;

            const meals = this.get(mealsKey) || [];
            const workouts = this.get(workoutsKey) || [];

            const dayCalories = workouts.reduce((sum, workout) => sum + (workout.calories || 0), 0);
            const dayProgress = this.calculateDayProgress(meals.length, workouts.length, dayCalories);

            weekData.totalCalories += dayCalories;
            weekData.totalMeals += meals.length;
            weekData.totalWorkouts += workouts.length;
            weekData.days.push({
                date: dateStr,
                meals: meals.length,
                workouts: workouts.length,
                calories: dayCalories,
                progress: dayProgress
            });
        }

        weekData.averageProgress = weekData.days.length > 0
            ? Math.round(weekData.days.reduce((sum, day) => sum + day.progress, 0) / weekData.days.length)
            : 0;

        return weekData;
    }

    calculateDayProgress(mealsCount, workoutsCount, caloriesBurned) {
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

    // Export Data
    exportUserData(userId) {
        const user = this.getCurrentUser();
        const weeklyData = this.getWeeklyData(userId);
        const friends = this.get(this.keys.friends) || [];

        return {
            user: {
                name: user.fullName,
                email: user.email,
                goal: user.goal,
                weight: user.weight,
                height: user.height
            },
            weeklyProgress: weeklyData,
            friends: friends,
            exportDate: new Date().toISOString()
        };
    }
}

// Initialize storage manager
const storage = new StorageManager();
