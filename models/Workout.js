const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    exercise: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true,
        min: 1
    },
    caloriesBurned: {
        type: Number,
        required: true,
        min: 0
    },
    intensity: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    notes: {
        type: String,
        maxlength: 500
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
workoutSchema.index({ user: 1, dateString: 1 });

module.exports = mongoose.model('Workout', workoutSchema);
