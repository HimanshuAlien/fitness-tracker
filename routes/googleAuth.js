const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Configure Google Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
    try {
        console.log('🔍 Google OAuth callback received for:', profile.displayName);

        // Check if user already exists with Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
            console.log('✅ Existing Google user found:', user.email);
            return done(null, user);
        }

        // Check if user exists with same email (link accounts)
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
            // Link Google account to existing user
            user.googleId = profile.id;
            user.avatar = profile.photos[0].value;
            await user.save();
            console.log('🔗 Linked Google account to existing user:', user.email);
            return done(null, user);
        }

        // Create new user
        user = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            avatar: profile.photos[0].value
        });

        await user.save();
        console.log('🆕 Created new Google user:', user.email);
        done(null, user);

    } catch (error) {
        console.error('❌ Google OAuth error:', error);
        done(error, null);
    }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Google OAuth routes
router.get('/google', (req, res, next) => {
    console.log('🚀 Initiating Google OAuth...');
    passport.authenticate('google', {
        scope: ['profile', 'email']
    })(req, res, next);
});

router.get('/google/callback',
    passport.authenticate('google', { session: false }),
    (req, res) => {
        try {
            console.log('✅ Google OAuth successful for:', req.user.email);

            // Generate JWT token
            const token = jwt.sign(
                { userId: req.user._id },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );

            // Redirect to dashboard with token
            res.redirect(`/dashboard.html?token=${token}&name=${encodeURIComponent(req.user.name)}`);

        } catch (error) {
            console.error('❌ Token generation error:', error);
            res.redirect('/login.html?error=auth_failed');
        }
    }
);

// Logout route
router.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/login.html');
    });
});

module.exports = router;
