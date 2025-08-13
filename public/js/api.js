class ApiManager {
    constructor() {
        this.baseURL = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000/api'
            : '/api';
        this.token = localStorage.getItem('fittracker_token');
    }

    setToken(token) {
        this.token = token;
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

    async addMeal(mealData) {
        return this.request('/meals', {
            method: 'POST',
            body: JSON.stringify(mealData)
        });
    }

    async addWorkout(workoutData) {
        return this.request('/workouts', {
            method: 'POST',
            body: JSON.stringify(workoutData)
        });
    }

    async getTodayMeals() {
        return this.request('/meals/today');
    }

    async getTodayWorkouts() {
        return this.request('/workouts/today');
    }

    async getCurrentUser() {
        return this.request('/auth/me');
    }
}

const api = new ApiManager();
