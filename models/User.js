const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: false,
        trim: true,
        default: function () {
            if (this.email) {
                return this.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
            }
            return 'User';
        }
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: function () {
            return !this.googleId;
        }
    },
    googleId: {
        type: String,
        sparse: true
    },
    avatar: {
        type: String,
        default: ''
    },
    fullName: {
        type: String,
        required: false
    },
    goal: {
        type: String,
        required: false,
        default: 'general_fitness'
    },
    height: {
        type: Number,
        required: false
    },
    weight: {
        type: Number,
        required: false
    },
    preferences: {
        theme: {
            type: String,
            enum: ['light', 'dark'],
            default: 'light'
        },
        units: {
            type: String,
            enum: ['metric', 'imperial'],
            default: 'metric'
        }
    },
    goals: {
        dailyCalories: {
            type: Number,
            default: 500
        },
        dailyMeals: {
            type: Number,
            default: 3
        },
        weeklyWorkouts: {
            type: Number,
            default: 5
        }
    }
}, {
    timestamps: true
});

// ✅ SINGLE PRE-SAVE HOOK (removed duplicate)
userSchema.pre('save', async function (next) {
    // Handle missing name
    if (!this.name && this.email) {
        this.name = this.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
        console.log(`🔧 Auto-generated name for ${this.email}: ${this.name}`);
    }

    // Hash password if modified (ONLY ONCE!)
    if (!this.isModified('password') || !this.password) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        console.log('🔒 Password hashed successfully');
        next();
    } catch (error) {
        next(error);
    }
});

// ✅ SINGLE comparePassword method
userSchema.methods.comparePassword = async function (candidatePassword) {
    if (!this.password) {
        return false;
    }
    return bcrypt.compare(candidatePassword, this.password);
};

// ✅ SINGLE calculateBMI method
userSchema.methods.calculateBMI = function () {
    if (!this.height || !this.weight || this.height <= 0 || this.weight <= 0) {
        return null;
    }
    const heightInMeters = this.height / 100;
    const bmi = this.weight / (heightInMeters * heightInMeters);
    return Math.round(bmi * 10) / 10;
};

// ✅ SINGLE getPublicProfile method
userSchema.methods.getPublicProfile = function () {
    return {
        id: this._id,
        name: this.name || 'User',
        email: this.email,
        avatar: this.avatar,
        bmi: this.calculateBMI(),
        preferences: this.preferences,
        goals: this.goals,
        createdAt: this.createdAt
    };
};

module.exports = mongoose.model('User', userSchema);

