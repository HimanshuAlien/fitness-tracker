// Workouts Management with MongoDB Integration
class WorkoutsManager {
    constructor() {
        this.workoutDatabase = {
            running_30min: { duration: 30, calories: 300, intensity: 'medium' },
            cycling_45min: { duration: 45, calories: 400, intensity: 'medium' },
            weightlifting_60min: { duration: 60, calories: 250, intensity: 'high' },
            swimming_30min: { duration: 30, calories: 350, intensity: 'high' },
            yoga_45min: { duration: 45, calories: 150, intensity: 'low' },
            hiit_20min: { duration: 20, calories: 200, intensity: 'high' },
            walking_60min: { duration: 60, calories: 180, intensity: 'low' },
            pilates_45min: { duration: 45, calories: 200, intensity: 'medium' },
            boxing_30min: { duration: 30, calories: 300, intensity: 'high' },
            dancing_60min: { duration: 60, calories: 250, intensity: 'medium' },
            stretching_30min: { duration: 30, calories: 80, intensity: 'low' },
            crossfit_45min: { duration: 45, calories: 400, intensity: 'high' }
        };

        this.todayWorkouts = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadTodayWorkouts();
    }

    setupEventListeners() {
        const workoutForm = document.getElementById('workoutForm');
        if (workoutForm) {
            workoutForm.addEventListener('submit', (e) => this.handleAddWorkout(e));
        }

        const exerciseSelect = document.getElementById('exerciseSelect');
        if (exerciseSelect) {
            exerciseSelect.addEventListener('change', () => this.updateWorkoutInfo());
        }
    }

    async loadTodayWorkouts() {
        try {
            const response = await api.getTodayWorkouts();
            this.todayWorkouts = response.workouts || [];
            this.updateWorkoutsList();
        } catch (error) {
            console.error('Load workouts error:', error);
            this.showMessage('Failed to load workouts', 'error');
        }
    }

    updateWorkoutInfo() {
        const exerciseSelect = document.getElementById('exerciseSelect');
        const durationInput = document.getElementById('duration');
        const caloriesInput = document.getElementById('caloriesBurn');

        if (!exerciseSelect || !durationInput || !caloriesInput) return;

        const selectedExercise = exerciseSelect.value;

        if (selectedExercise === 'custom') {
            durationInput.readOnly = false;
            caloriesInput.readOnly = false;
            durationInput.value = '';
            caloriesInput.value = '';
            durationInput.placeholder = 'Enter duration (min)';
            caloriesInput.placeholder = 'Enter calories burned';
        } else if (selectedExercise && this.workoutDatabase[selectedExercise]) {
            const workoutData = this.workoutDatabase[selectedExercise];
            durationInput.readOnly = true;
            caloriesInput.readOnly = true;
            durationInput.value = workoutData.duration;
            caloriesInput.value = workoutData.calories;
        } else {
            durationInput.readOnly = true;
            caloriesInput.readOnly = true;
            durationInput.value = '';
            caloriesInput.value = '';
        }
    }

    async handleAddWorkout(event) {
        event.preventDefault();

        const exerciseSelect = document.getElementById('exerciseSelect');
        const durationInput = document.getElementById('duration');
        const caloriesInput = document.getElementById('caloriesBurn');

        if (!exerciseSelect.value) {
            this.showMessage('Please select an exercise', 'error');
            return;
        }

        let exerciseName = exerciseSelect.options[exerciseSelect.selectedIndex].text;
        if (exerciseSelect.value === 'custom') {
            const customName = prompt('Enter custom exercise name:');
            if (!customName) return;
            exerciseName = customName;
        }

        const workoutData = {
            exercise: exerciseName,
            duration: parseInt(durationInput.value) || 0,
            caloriesBurned: parseInt(caloriesInput.value) || 0,
            intensity: this.workoutDatabase[exerciseSelect.value]?.intensity || 'medium',
            notes: ''
        };

        if (workoutData.duration <= 0 || workoutData.caloriesBurned <= 0) {
            this.showMessage('Please enter valid duration and calories', 'error');
            return;
        }

        try {
            const response = await api.addWorkout(workoutData);
            this.todayWorkouts.push(response.workout);
            this.updateWorkoutsList();
            this.resetForm();
            this.showMessage('Workout logged successfully!', 'success');

            // Update dashboard if it exists
            if (window.dashboardManager) {
                window.dashboardManager.loadDashboardData();
            }
        } catch (error) {
            console.error('Add workout error:', error);
            this.showMessage('Failed to log workout', 'error');
        }
    }

    async deleteWorkout(workoutId) {
        if (!confirm('Are you sure you want to delete this workout?')) return;

        try {
            await api.deleteWorkout(workoutId);
            this.todayWorkouts = this.todayWorkouts.filter(workout => workout._id !== workoutId);
            this.updateWorkoutsList();
            this.showMessage('Workout deleted successfully!', 'success');

            // Update dashboard if it exists
            if (window.dashboardManager) {
                window.dashboardManager.loadDashboardData();
            }
        } catch (error) {
            console.error('Delete workout error:', error);
            this.showMessage('Failed to delete workout', 'error');
        }
    }

    updateWorkoutsList() {
        const workoutsList = document.getElementById('workoutsList');
        if (!workoutsList) return;

        if (this.todayWorkouts.length === 0) {
            workoutsList.innerHTML = '<p class="text-muted">No workouts logged today</p>';
            return;
        }

        const totalDuration = this.todayWorkouts.reduce((sum, workout) => sum + workout.duration, 0);
        const totalCalories = this.todayWorkouts.reduce((sum, workout) => sum + workout.caloriesBurned, 0);

        workoutsList.innerHTML = `
            <div class="mb-3 p-3 bg-light rounded">
                <h6>Today's Summary</h6>
                <div class="row text-center">
                    <div class="col-6">
                        <strong>${totalDuration} min</strong><br>
                        <small class="text-muted">Total Duration</small>
                    </div>
                    <div class="col-6">
                        <strong>${totalCalories}</strong><br>
                        <small class="text-muted">Calories Burned</small>
                    </div>
                </div>
            </div>
            ${this.todayWorkouts.map(workout => `
                <div class="activity-item d-flex justify-content-between align-items-center">
                    <div>
                        <div class="activity-name">${workout.exercise}</div>
                        <div class="activity-details">
                            ${workout.duration} min • ${workout.caloriesBurned} cal • ${workout.intensity} intensity
                        </div>
                        <div class="activity-time">${this.formatTime(workout.createdAt)}</div>
                    </div>
                    <button class="delete-btn" onclick="workoutsManager.deleteWorkout('${workout._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('')}
        `;
    }

    resetForm() {
        const workoutForm = document.getElementById('workoutForm');
        if (workoutForm) {
            workoutForm.reset();
            this.updateWorkoutInfo();
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

        // Insert in workouts section
        const workoutsSection = document.getElementById('workouts-section');
        if (workoutsSection) {
            workoutsSection.insertBefore(messageDiv, workoutsSection.firstChild);
        }

        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    }
}

// Global function for workout info update
function updateWorkoutInfo() {
    if (window.workoutsManager) {
        window.workoutsManager.updateWorkoutInfo();
    }
}

// Initialize workouts manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('dashboard.html')) {
        window.workoutsManager = new WorkoutsManager();
    }
});
