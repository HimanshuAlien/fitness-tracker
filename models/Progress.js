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

// Unique constraint on user and date
progressSchema.index({ user: 1, dateString: 1 }, { unique: true });

module.exports = mongoose.model('Progress', progressSchema);
