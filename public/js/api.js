class ApiManager {
    constructor() {
        this.baseURL = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000/api'
            : '/api';
        this.token = null; // Don't auto-load token in constructor
    }

    setToken(token) {
        console.log('🔑 Setting API token:', token ? 'Present' : 'Missing');
        this.token = token;
        if (token) {
            localStorage.setItem('fittracker_token', token);
        }

    removeToken() {
        this.token = null;
        localStorage.removeItem('fittracker_token');
    }

    getHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    async request(endpoint, options = {}) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: this.getHeaders(),
                ...options
            });

            if (response.status === 401) {
                this.removeToken();
                window.location.href = 'login.html';
                return;
            }

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Request failed');
            }
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth methods
    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async login(credentials) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    }

    async getCurrentUser() {
        return this.request('/auth/me');
    }

    // Meal methods
    async addMeal(mealData) {
        return this.request('/meals', {
            method: 'POST',
            body: JSON.stringify(mealData)
        });
    }

    async getTodayMeals() {
        return this.request('/meals/today');
    }

   async getAllMeals() {
    try {
        console.log('📡 API: Fetching all meals...');
        return this.request('/meals/all'); // Changed from /meals to /meals/all
    } catch (error) {
        console.error('❌ API: Error fetching meals:', error);
        return { meals: [] };
    }
}


    // ✅ ADD THIS: Delete meal method
    async deleteMeal(mealId) {
        try {
            console.log('🗑️ API: Deleting meal:', mealId);
            
            if (!mealId) {
                throw new Error('Meal ID is required');
            }

            return this.request(`/meals/${mealId}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('❌ API: Delete meal error:', error);
            throw error;
        }
    }

    // Workout methods
    async addWorkout(workoutData) {
        return this.request('/workouts', {
            method: 'POST',
            body: JSON.stringify(workoutData)
        });
    }

    async getTodayWorkouts() {
        return this.request('/workouts/today');
    }

   async getAllWorkouts() {
    try {
        console.log('📡 API: Fetching all workouts...');
        return this.request('/workouts/all'); // Changed from /workouts to /workouts/all
    } catch (error) {
        console.error('❌ API: Error fetching workouts:', error);
        return { workouts: [] };
    }
}


    // ✅ ADD THIS: Delete workout method
    async deleteWorkout(workoutId) {
        try {
            console.log('🗑️ API: Deleting workout:', workoutId);
            
            if (!workoutId) {
                throw new Error('Workout ID is required');
            }

            return this.request(`/workouts/${workoutId}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('❌ API: Delete workout error:', error);
            throw error;
        }
    }
}

// Create global API instance
const api = new ApiManager();
