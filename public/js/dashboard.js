
// Add this at the very beginning of your dashboard initialization
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Dashboard loading...');
    // Section switching functionality - ADD THIS BACK
function switchSection(sectionName) {
    console.log('Switching to:', sectionName);
    
    // Hide all content sections
    const allSections = document.querySelectorAll('.content-section');
    allSections.forEach(section => {
        section.style.display = 'none';
    });
    
    // Remove active class from all nav links
    const allNavLinks = document.querySelectorAll('.sidebar .nav-link');
    allNavLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    // Show target section
    const targetSection = document.getElementById(sectionName + '-section');
    if (targetSection) {
        targetSection.style.display = 'block';
    }
    
    // Add active class to clicked link
    if (event && event.target) {
        const clickedLink = event.target.closest('.nav-link');
        if (clickedLink) {
            clickedLink.classList.add('active');
        }
    }
}

// Initialize dashboard - ADD THIS BACK
document.addEventListener('DOMContentLoaded', function() {
    // Show meals section by default
    switchSection('meals');
});

    // CRITICAL: Set the token immediately when page loads
    const token = localStorage.getItem('fittracker_token');
    if (!token) {
        console.log('❌ No token found, redirecting to login');
        window.location.href = 'login.html';
        return;
    }
    
    console.log('🔑 Token found, setting in API...');
    api.setToken(token);
    
    // Small delay to ensure API is ready, then load data
    setTimeout(() => {
        loadDashboardData();
    }, 500);
});

async function loadDashboardData() {
    try {
        console.log('📊 Loading dashboard data...');
        
        // Load today's data
        const [mealsResponse, workoutsResponse] = await Promise.all([
            api.getTodayMeals().catch(err => {
                console.error('❌ Meals error:', err);
                return { meals: [] };
            }),
            api.getTodayWorkouts().catch(err => {
                console.error('❌ Workouts error:', err);
                return { workouts: [] };
            })
        ]);
        
        console.log('✅ Dashboard data loaded:', {
            meals: mealsResponse.meals?.length || 0,
            workouts: workoutsResponse.workouts?.length || 0
        });
        
        // Update your dashboard display
        displayMeals(mealsResponse.meals || []);
        displayWorkouts(workoutsResponse.workouts || []);
        
    } catch (error) {
        console.error('❌ Failed to load dashboard data:', error);
    }
}
// Dashboard Management with MongoDB Integration
class DashboardManager {
    constructor() {
        this.currentUser = null;
        this.currentSection = 'dashboard';
        this.todayData = {
            meals: [],
            workouts: [],
            progress: {}
        };
        this.init();
    }

    async init() {
        try {
            // Wait for auth to complete
            await this.waitForAuth();
            this.setupEventListeners();
            await this.loadDashboardData();
            this.showSection('dashboard');
        } catch (error) {
            console.error('Dashboard init error:', error);
            this.showError('Failed to initialize dashboard');
        }
    }

    async waitForAuth() {
        // Wait for auth manager to be ready
        while (!window.authManager || !window.authManager.getCurrentUser()) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        this.currentUser = window.authManager.getCurrentUser();
    }

    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.querySelector('[onclick="toggleTheme()"]');
        if (themeToggle) {
            themeToggle.addEventListener('click', this.toggleTheme.bind(this));
        }

        // Data download
        const downloadBtn = document.querySelector('[onclick="downloadData()"]');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', this.downloadData.bind(this));
        }

        // Reset day
        const resetBtn = document.querySelector('[onclick="resetDailyData()"]');
        if (resetBtn) {
            resetBtn.addEventListener('click', this.resetDailyData.bind(this));
        }

        // Auto-refresh data every 5 minutes
        setInterval(() => {
            this.loadDashboardData();
        }, 5 * 60 * 1000);
    }

    async loadDashboardData() {
        try {
            this.showLoading(true);

            // Load today's data
            const [progressResponse, mealsResponse, workoutsResponse, weeklyResponse] = await Promise.all([
                api.getTodayProgress(),
                api.getTodayMeals(),
                api.getTodayWorkouts(),
                api.getWeeklyProgress()
            ]);

            this.todayData = {
                meals: mealsResponse.meals || [],
                workouts: workoutsResponse.workouts || [],
                progress: progressResponse.progress || {}
            };

            this.weeklyData = weeklyResponse;

            // Update dashboard
            this.updateDashboardStats();
            this.updateRecentActivity();
            this.updateWeeklyStats();

        } catch (error) {
            console.error('Load dashboard data error:', error);
            this.showError('Failed to load dashboard data');
        } finally {
            this.showLoading(false);
        }
    }

    updateDashboardStats() {
        const { meals, workouts, progress } = this.todayData;

        // Calculate totals
        const totalCalories = workouts.reduce((sum, workout) => sum + (workout.caloriesBurned || 0), 0);
        const mealsCount = meals.length;
        const workoutsCount = workouts.length;
        const progressPercentage = progress.progressPercentage || 0;

        // Update stat cards
        document.getElementById('caloriesBurned').textContent = totalCalories;
        document.getElementById('mealsCount').textContent = mealsCount;
        document.getElementById('workoutsCount').textContent = workoutsCount;
        document.getElementById('dailyProgress').textContent = `${progressPercentage}%`;

        // Update progress bar
        const progressBar = document.getElementById('progressBar');
        if (progressBar) {
            progressBar.style.width = `${progressPercentage}%`;
            progressBar.setAttribute('aria-valuenow', progressPercentage);
        }

        // Add animation to cards
        this.animateStatCards();
    }

    updateRecentActivity() {
        // Update recent meals
        const recentMealsContainer = document.getElementById('recentMeals');
        if (recentMealsContainer) {
            if (this.todayData.meals.length === 0) {
                recentMealsContainer.innerHTML = '<p class="text-muted">No meals logged today</p>';
            } else {
                recentMealsContainer.innerHTML = this.todayData.meals
                    .slice(0, 3)
                    .map(meal => `
                        <div class="activity-item">
                            <div class="activity-name">${meal.name}</div>
                            <div class="activity-details">${meal.calories} cal • ${meal.protein || 0}g protein</div>
                            <div class="activity-time">${this.formatTime(meal.createdAt)}</div>
                        </div>
                    `).join('');
            }
        }

        // Update recent workouts
        const recentWorkoutsContainer = document.getElementById('recentWorkouts');
        if (recentWorkoutsContainer) {
            if (this.todayData.workouts.length === 0) {
                recentWorkoutsContainer.innerHTML = '<p class="text-muted">No workouts logged today</p>';
            } else {
                recentWorkoutsContainer.innerHTML = this.todayData.workouts
                    .slice(0, 3)
                    .map(workout => `
                        <div class="activity-item">
                            <div class="activity-name">${workout.exercise}</div>
                            <div class="activity-details">${workout.duration} min • ${workout.caloriesBurned} cal burned</div>
                            <div class="activity-time">${this.formatTime(workout.createdAt)}</div>
                        </div>
                    `).join('');
            }
        }
    }

    updateWeeklyStats() {
        if (!this.weeklyData) return;

        const { weeklyStats } = this.weeklyData;

        // Update weekly progress section
        document.getElementById('weeklyCalories').textContent = weeklyStats.totalCalories || 0;
        document.getElementById('weeklyMeals').textContent = weeklyStats.totalMeals || 0;
        document.getElementById('weeklyWorkouts').textContent = weeklyStats.totalWorkouts || 0;
        document.getElementById('weeklyProgress').textContent = `${weeklyStats.averageProgress || 0}%`;
    }

    animateStatCards() {
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach((card, index) => {
            setTimeout(() => {
                card.style.transform = 'translateY(-5px)';
                setTimeout(() => {
                    card.style.transform = 'translateY(0)';
                }, 200);
            }, index * 100);
        });
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.style.display = 'none';
            section.classList.remove('active');
        });

        // Show selected section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.style.display = 'block';
            setTimeout(() => {
                targetSection.classList.add('active');
            }, 50);
        }

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });

        const activeLink = document.querySelector(`[onclick="showSection('${sectionName}')"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        this.currentSection = sectionName;

        // Load section-specific data
        this.loadSectionData(sectionName);
    }

    async loadSectionData(sectionName) {
        switch (sectionName) {
            case 'friends':
                await this.loadFriendsData();
                break;
            case 'progress':
                await this.loadProgressData();
                break;
        }
    }

    async loadFriendsData() {
        try {
            // Mock friends data for now - you can implement actual friends functionality
            const friendsData = [
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

            const friendsContainer = document.getElementById('friendsList');
            if (friendsContainer) {
                friendsContainer.innerHTML = friendsData.map(friend => `
                    <div class="col-md-4 mb-3">
                        <div class="card friend-card">
                            <div class="card-body">
                                <div class="d-flex align-items-center mb-3">
                                    <div class="friend-avatar">
                                        ${friend.name.charAt(0)}
                                    </div>
                                    <div class="ms-3">
                                        <h6 class="mb-0">${friend.name}</h6>
                                        <small class="text-muted">Progress: ${friend.progress}%</small>
                                    </div>
                                </div>
                                <div class="progress mb-2">
                                    <div class="progress-bar" style="width: ${friend.progress}%"></div>
                                </div>
                                <div class="friend-stats">
                                    <div class="friend-stat">
                                        <div class="stat-number">${friend.caloriesBurned}</div>
                                        <div class="stat-label">Calories</div>
                                    </div>
                                    <div class="friend-stat">
                                        <div class="stat-number">${friend.mealsToday}</div>
                                        <div class="stat-label">Meals</div>
                                    </div>
                                    <div class="friend-stat">
                                        <div class="stat-number">${friend.workoutsToday}</div>
                                        <div class="stat-label">Workouts</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Load friends data error:', error);
        }
    }

    async loadProgressData() {
        // Progress data is already loaded in loadDashboardData
        // This is called when switching to progress section
    }

    async downloadData() {
        try {
            const endDate = new Date().toISOString().split('T')[0];
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
            const startDateStr = startDate.toISOString().split('T')[0];

            // Show download options modal
            const format = await this.showDownloadModal();
            if (!format) return;

            this.showMessage('Preparing download...', 'info');

            const response = await api.downloadProgress(startDateStr, endDate, format);

            // Create blob and download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `fittracker-data-${startDateStr}-to-${endDate}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            this.showMessage('Data downloaded successfully!', 'success');
        } catch (error) {
            console.error('Download data error:', error);
            this.showMessage('Failed to download data', 'error');
        }
    }

    async showDownloadModal() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal fade';
            modal.innerHTML = `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">Download Progress Data</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p>Select the format for your data download:</p>
                            <div class="mb-3">
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="format" id="formatJson" value="json" checked>
                                    <label class="form-check-label" for="formatJson">
                                        JSON (Complete data with all details)
                                    </label>
                                </div>
                                <div class="form-check">
                                    <input class="form-check-input" type="radio" name="format" id="formatCsv" value="csv">
                                    <label class="form-check-label" for="formatCsv">
                                        CSV (Summary data for spreadsheets)
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="confirmDownload">Download</button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);
            const bsModal = new bootstrap.Modal(modal);
            bsModal.show();

            modal.querySelector('#confirmDownload').onclick = () => {
                const selectedFormat = modal.querySelector('input[name="format"]:checked').value;
                bsModal.hide();
                modal.remove();
                resolve(selectedFormat);
            };

            modal.querySelector('.btn-secondary').onclick = () => {
                bsModal.hide();
                modal.remove();
                resolve(null);
            };
        });
    }

    async resetDailyData() {
        if (!confirm('Are you sure you want to reset all today\'s data? This cannot be undone.')) {
            return;
        }

        try {
            // Since we're using MongoDB, we'll need to add a reset endpoint
            // For now, we'll just reload the data
            await this.loadDashboardData();
            this.showMessage('Daily data view refreshed!', 'success');
        } catch (error) {
            console.error('Reset daily data error:', error);
            this.showMessage('Failed to reset daily data', 'error');
        }
    }

    toggleTheme() {
        const body = document.body;
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('fittracker_theme', newTheme);

        // Update theme icon
        const themeIcon = document.querySelector('[onclick="toggleTheme()"] i');
        if (themeIcon) {
            themeIcon.className = newTheme === 'dark' ? 'fas fa-sun me-2' : 'fas fa-moon me-2';
        }

        this.showMessage(`Switched to ${newTheme} theme`, 'success');
    }

    showLoading(show) {
        const loader = document.getElementById('dashboardLoader');
        if (!loader) {
            if (show) {
                const loaderDiv = document.createElement('div');
                loaderDiv.id = 'dashboardLoader';
                loaderDiv.className = 'loading';
                loaderDiv.innerHTML = '<div class="spinner"></div><p>Loading...</p>';
                document.querySelector('main').appendChild(loaderDiv);
            }
        } else {
            loader.style.display = show ? 'block' : 'none';
        }
    }

    showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type} fade-in-up`;
        messageDiv.textContent = message;

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Global functions for HTML onclick events
function showSection(sectionName) {
    if (window.dashboardManager) {
        window.dashboardManager.showSection(sectionName);
    }
}

function toggleTheme() {
    if (window.dashboardManager) {
        window.dashboardManager.toggleTheme();
    }
}

function downloadData() {
    if (window.dashboardManager) {
        window.dashboardManager.downloadData();
    }
}

function resetDailyData() {
    if (window.dashboardManager) {
        window.dashboardManager.resetDailyData();
    }
}

function updateUserInfo(user) {
    document.getElementById('userName').textContent = user.fullName;
}
// In your dashboard.html JavaScript section
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Dashboard initialized');

    // Handle Google OAuth token first
    if (typeof authManager !== 'undefined') {
        authManager.handleGoogleOAuthCallback();
    }

    // Check if user is authenticated
    const token = localStorage.getItem('fittracker_token');
    if (!token) {
        console.log('❌ No token found, redirecting to login');
        window.location.href = 'login.html';
        return;
    }

    // Set token in API
    api.setToken(token);
    console.log('✅ Token loaded for dashboard:', api.token ? 'YES' : 'NO');

    // Load theme and initialize
    loadSavedTheme();
    switchSection('dashboard');

    // Load data after short delay to ensure token is set
    setTimeout(loadTodayData, 1000);
    setupFormListeners();
});
function displayMeals(meals) {
    const mealsContainer = document.querySelector('#today-meals, .meals-list, [data-meals-container]');
    if (!mealsContainer) return;
    
    if (meals.length === 0) {
        mealsContainer.innerHTML = '<p class="text-muted">No meals logged today. Add your first meal!</p>';
        return;
    }
    
    mealsContainer.innerHTML = meals.map(meal => `
        <div class="meal-item d-flex justify-content-between align-items-center p-3 mb-2 border rounded">
            <div>
                <h6 class="mb-1">${meal.type || 'Meal'}</h6>
                <small class="text-muted">${meal.description || 'No description'}</small>
                <div class="mt-1">
                    <span class="badge bg-primary">${meal.calories || 0} cal</span>
                </div>
            </div>
            <button class="btn btn-danger btn-sm delete-meal-btn" data-meal-id="${meal._id}">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
    
    // Reattach delete listeners
    attachMealDeleteListeners();
}

function displayWorkouts(workouts) {
    const workoutsContainer = document.querySelector('#today-workouts, .workouts-list, [data-workouts-container]');
    if (!workoutsContainer) return;
    
    if (workouts.length === 0) {
        workoutsContainer.innerHTML = '<p class="text-muted">No workouts logged today. Start your first workout!</p>';
        return;
    }
    
    workoutsContainer.innerHTML = workouts.map(workout => `
        <div class="workout-item d-flex justify-content-between align-items-center p-3 mb-2 border rounded">
            <div>
                <h6 class="mb-1">${workout.type || 'Workout'}</h6>
                <small class="text-muted">${workout.duration || 0} minutes</small>
                <div class="mt-1">
                    <span class="badge bg-success">${workout.calories || 0} cal burned</span>
                </div>
            </div>
            <button class="btn btn-danger btn-sm delete-workout-btn" data-workout-id="${workout._id}">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
    
    // Reattach delete listeners
    attachWorkoutDeleteListeners();
}

function attachMealDeleteListeners() {
    document.querySelectorAll('.delete-meal-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const mealId = this.getAttribute('data-meal-id');
            if (confirm('Delete this meal?')) {
                try {
                    await api.deleteMeal(mealId);
                    await loadDashboardData(); // Refresh data
                } catch (error) {
                    console.error('❌ Delete meal error:', error);
                }
            }
        });
    });
}

function attachWorkoutDeleteListeners() {
    document.querySelectorAll('.delete-workout-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const workoutId = this.getAttribute('data-workout-id');
            if (confirm('Delete this workout?')) {
                try {
                    await api.deleteWorkout(workoutId);
                    await loadDashboardData(); // Refresh data
                } catch (error) {
                    console.error('❌ Delete workout error:', error);
                }
            }
        });
    });
}


// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the dashboard page
    if (window.location.pathname.includes('dashboard.html')) {
        window.dashboardManager = new DashboardManager();
    }
});

// Load theme on page load
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('fittracker_theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
});
