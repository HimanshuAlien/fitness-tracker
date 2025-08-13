// Enhanced API Manager with proper JWT handling
class ApiManager {
    constructor() {
        this.baseURL = window.location.hostname === 'localhost' 
            ? 'http://localhost:3000/api'
            : '/api'; // ← Change to relative URL since same domain
        
        this.token = localStorage.getItem('fittracker_token');
        console.log('🚀 API Manager initialized with baseURL:', this.baseURL);
    }


    setToken(token) {
        console.log('🔑 Setting new token:', token ? 'Valid' : 'Invalid');
        this.token = token;
        localStorage.setItem('fittracker_token', token);
    }

    removeToken() {
        this.token = null;
        localStorage.removeItem('fittracker_token');
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
            console.log('📡 Adding Authorization header with token');
        } else {
            console.log('⚠️ No token available for request');
        }

        return headers;
    }

    async request(endpoint, options = {}) {
        console.log(`🌐 Making API request to: ${this.baseURL}${endpoint}`);

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                headers: this.getHeaders(),
                ...options
            });

            console.log(`📊 Response status: ${response.status} ${response.statusText}`);

            if (response.status === 401) {
                console.log('🔒 Unauthorized - redirecting to login');
                this.removeToken();
                window.location.href = 'login.html';
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            console.log('✅ API request successful:', data);
            return data;
        } catch (error) {
            console.error('❌ API request failed:', error);

            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Cannot connect to server. Is it running on port 3000?');
            }

            throw error;
        }
    }

    // Auth endpoints - MAKE SURE THESE EXIST
    async register(userData) {
        try {
            console.log('📤 Registration data:', userData);

            // Ensure name is included
            if (!userData.name) {
                throw new Error('Name is required for registration');
            }

            const response = await fetch(`${this.baseURL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: userData.name,
                    email: userData.email,
                    password: userData.password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            console.log('✅ Registration successful');
            return data;
        } catch (error) {
            console.error('❌ Registration error:', error);
            throw error;
        }
    }


    async login(credentials) {
        console.log('🔑 API: Attempting login with:', credentials.email);
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    }

    async getCurrentUser() {
        return this.request('/auth/me');
    }

    // Other methods...
    async getTodayMeals() {
        return this.request('/meals/today');
    }

    async addMeal(mealData) {
        if (!this.token) {
            throw new Error('No authentication token. Please login again.');
        }
        return this.request('/meals', {
            method: 'POST',
            body: JSON.stringify(mealData)
        });
    }

    async getTodayWorkouts() {
        return this.request('/workouts/today');
    }

    async addWorkout(workoutData) {
        if (!this.token) {
            throw new Error('No authentication token. Please login again.');
        }
        return this.request('/workouts', {
            method: 'POST',
            body: JSON.stringify(workoutData)
        });
    }

    async deleteMeal(mealId) {
        return this.request(`/meals/${mealId}`, {
            method: 'DELETE'
        });
    }

    async deleteWorkout(workoutId) {
        return this.request(`/workouts/${workoutId}`, {
            method: 'DELETE'
        });
    }
}
// Add to your ApiManager class if missing
async getAllMeals() {
    return this.request('/meals');
}

async getAllWorkouts() {
    return this.request('/workouts');
}

async getWeeklyStats() {
    return this.request('/auth/stats/weekly');
}

// Initialize API manager globally - THIS LINE IS CRUCIAL
const api = new ApiManager();
console.log('🎯 Global api object created:', typeof api, 'login method:', typeof api.login);
