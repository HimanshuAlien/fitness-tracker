const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    calories: {
        type: Number,
        required: true,
        min: 0
    },
    protein: {
        type: Number,
        default: 0,
        min: 0
    },
    carbs: {
        type: Number,
        default: 0,
        min: 0
    },
    fats: {
        type: Number,
        default: 0,
        min: 0
    },
    mealType: {
        type: String,
        enum: ['breakfast', 'lunch', 'dinner', 'snack'],
        default: 'snack'
    },
    date: {
        type: Date,
        default: Date.now
    },
    dateString: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

// Index for efficient querying
mealSchema.index({ user: 1, dateString: 1 });

module.exports = mongoose.model('Meal', mealSchema);
