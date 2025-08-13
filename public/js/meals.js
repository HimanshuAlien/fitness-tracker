// Meals Management with MongoDB Integration
class MealsManager {
    constructor() {
        this.mealDatabase = {
            breakfast_cereal: { calories: 350, protein: 8, carbs: 65, fats: 2 },
            chicken_salad: { calories: 280, protein: 35, carbs: 12, fats: 8 },
            pasta_dinner: { calories: 520, protein: 18, carbs: 78, fats: 15 },
            fruit_smoothie: { calories: 180, protein: 6, carbs: 42, fats: 1 },
            grilled_fish: { calories: 320, protein: 45, carbs: 0, fats: 14 },
            vegetable_soup: { calories: 150, protein: 5, carbs: 28, fats: 3 },
            protein_shake: { calories: 200, protein: 25, carbs: 8, fats: 4 },
            oatmeal: { calories: 280, protein: 10, carbs: 54, fats: 6 },
            greek_yogurt: { calories: 130, protein: 15, carbs: 9, fats: 0 },
            turkey_sandwich: { calories: 420, protein: 28, carbs: 45, fats: 12 },
            quinoa_bowl: { calories: 380, protein: 12, carbs: 58, fats: 11 },
            egg_omelet: { calories: 320, protein: 22, carbs: 6, fats: 24 }
        };

        this.todayMeals = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadTodayMeals();
    }

    setupEventListeners() {
        const mealForm = document.getElementById('mealForm');
        if (mealForm) {
            mealForm.addEventListener('submit', (e) => this.handleAddMeal(e));
        }

        const mealSelect = document.getElementById('mealSelect');
        if (mealSelect) {
            mealSelect.addEventListener('change', () => this.updateMealInfo());
        }
    }

    async loadTodayMeals() {
        try {
            const response = await api.getTodayMeals();
            this.todayMeals = response.meals || [];
            this.updateMealsList();
        } catch (error) {
            console.error('Load meals error:', error);
            this.showMessage('Failed to load meals', 'error');
        }
    }

    updateMealInfo() {
        const mealSelect = document.getElementById('mealSelect');
        const caloriesInput = document.getElementById('calories');
        const proteinInput = document.getElementById('protein');

        if (!mealSelect || !caloriesInput || !proteinInput) return;

        const selectedMeal = mealSelect.value;

        if (selectedMeal === 'custom') {
            caloriesInput.readOnly = false;
            proteinInput.readOnly = false;
            caloriesInput.value = '';
            proteinInput.value = '';
            caloriesInput.placeholder = 'Enter calories';
            proteinInput.placeholder = 'Enter protein (g)';
        } else if (selectedMeal && this.mealDatabase[selectedMeal]) {
            const mealData = this.mealDatabase[selectedMeal];
            caloriesInput.readOnly = true;
            proteinInput.readOnly = true;
            caloriesInput.value = mealData.calories;
            proteinInput.value = mealData.protein;
        } else {
            caloriesInput.readOnly = true;
            proteinInput.readOnly = true;
            caloriesInput.value = '';
            proteinInput.value = '';
        }
    }

    async handleAddMeal(event) {
        event.preventDefault();

        const formData = new FormData(event.target);
        const mealSelect = document.getElementById('mealSelect');
        const caloriesInput = document.getElementById('calories');
        const proteinInput = document.getElementById('protein');

        if (!mealSelect.value) {
            this.showMessage('Please select a meal', 'error');
            return;
        }

        let mealName = mealSelect.options[mealSelect.selectedIndex].text;
        if (mealSelect.value === 'custom') {
            const customName = prompt('Enter custom meal name:');
            if (!customName) return;
            mealName = customName;
        }

        const mealData = {
            name: mealName,
            calories: parseInt(caloriesInput.value) || 0,
            protein: parseInt(proteinInput.value) || 0,
            carbs: this.mealDatabase[mealSelect.value]?.carbs || 0,
            fats: this.mealDatabase[mealSelect.value]?.fats || 0,
            mealType: this.determineMealType()
        };

        if (mealData.calories <= 0) {
            this.showMessage('Please enter valid calories', 'error');
            return;
        }

        try {
            const response = await api.addMeal(mealData);
            this.todayMeals.push(response.meal);
            this.updateMealsList();
            this.resetForm();
            this.showMessage('Meal added successfully!', 'success');

            // Update dashboard if it exists
            if (window.dashboardManager) {
                window.dashboardManager.loadDashboardData();
            }
        } catch (error) {
            console.error('Add meal error:', error);
            this.showMessage('Failed to add meal', 'error');
        }
    }

    async deleteMeal(mealId) {
        if (!confirm('Are you sure you want to delete this meal?')) return;

        try {
            await api.deleteMeal(mealId);
            this.todayMeals = this.todayMeals.filter(meal => meal._id !== mealId);
            this.updateMealsList();
            this.showMessage('Meal deleted successfully!', 'success');

            // Update dashboard if it exists
            if (window.dashboardManager) {
                window.dashboardManager.loadDashboardData();
            }
        } catch (error) {
            console.error('Delete meal error:', error);
            this.showMessage('Failed to delete meal', 'error');
        }
    }

    updateMealsList() {
        const mealsList = document.getElementById('mealsList');
        if (!mealsList) return;

        if (this.todayMeals.length === 0) {
            mealsList.innerHTML = '<p class="text-muted">No meals added today</p>';
            return;
        }

        const totalCalories = this.todayMeals.reduce((sum, meal) => sum + meal.calories, 0);
        const totalProtein = this.todayMeals.reduce((sum, meal) => sum + meal.protein, 0);

        mealsList.innerHTML = `
            <div class="mb-3 p-3 bg-light rounded">
                <h6>Today's Summary</h6>
                <div class="row text-center">
                    <div class="col-6">
                        <strong>${totalCalories}</strong><br>
                        <small class="text-muted">Total Calories</small>
                    </div>
                    <div class="col-6">
                        <strong>${totalProtein}g</strong><br>
                        <small class="text-muted">Total Protein</small>
                    </div>
                </div>
            </div>
            ${this.todayMeals.map(meal => `
                <div class="activity-item d-flex justify-content-between align-items-center">
                    <div>
                        <div class="activity-name">${meal.name}</div>
                        <div class="activity-details">
                            ${meal.calories} cal • ${meal.protein}g protein • ${meal.mealType}
                        </div>
                        <div class="activity-time">${this.formatTime(meal.createdAt)}</div>
                    </div>
                    <button class="delete-btn" onclick="mealsManager.deleteMeal('${meal._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('')}
        `;
    }

    determineMealType() {
        const hour = new Date().getHours();
        if (hour < 11) return 'breakfast';
        if (hour < 15) return 'lunch';
        if (hour < 20) return 'dinner';
        return 'snack';
    }

    resetForm() {
        const mealForm = document.getElementById('mealForm');
        if (mealForm) {
            mealForm.reset();
            this.updateMealInfo();
        }
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showMessage(message, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type} fade-in-up`;
        messageDiv.textContent = message;

        // Insert in meals section
        const mealsSection = document.getElementById('meals-section');
        if (mealsSection) {
            mealsSection.insertBefore(messageDiv, mealsSection.firstChild);
        }

        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    }
}

// Global function for meal info update
function updateMealInfo() {
    if (window.mealsManager) {
        window.mealsManager.updateMealInfo();
    }
}

// Initialize meals manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('dashboard.html')) {
        window.mealsManager = new MealsManager();
    }
});
