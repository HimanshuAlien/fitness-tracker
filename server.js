require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const path = require('path');
const nodemailer = require('nodemailer');
const cron = require('node-cron');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Session configuration - PRODUCTION READY
app.use(session({
    secret: process.env.SESSION_SECRET || 'emergency-fallback-secret-key-12345',
    resave: false,
    saveUninitialized: false,
    name: 'fittracker.sid',
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax'
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// ========== GEMINI AI INTEGRATION ==========
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// AI Chat Route
app.post('/api/ai/chat', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent(`
            You are a helpful fitness and nutrition AI assistant. 
            Provide helpful, accurate advice about health, nutrition, workouts, and wellness.
            Keep responses concise but informative.
            
            User question: ${message}
        `);

        const response = await result.response;
        const text = response.text();

        res.json({
            response: text,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Gemini AI Error:', error);
        res.status(500).json({
            error: 'AI service temporarily unavailable',
            details: error.message
        });
    }
});
// ========== END GEMINI AI INTEGRATION ==========

// ========== FITBIT INTEGRATION ==========

// Email transporter configuration
// Email transporter configuration
const emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});


// User storage (in production, use MongoDB)
let connectedUsers = [];

// Helper functions
function storeConnectedUser(fitbitUserId, accessToken, refreshToken, email) {
    // Remove existing user if re-connecting
    connectedUsers = connectedUsers.filter(user => user.fitbitUserId !== fitbitUserId);

    // Add new user
    const newUser = {
        fitbitUserId: fitbitUserId,
        accessToken: accessToken,
        refreshToken: refreshToken,
        email: email,
        connectedAt: new Date(),
        lastSync: new Date()
    };

    connectedUsers.push(newUser);
    console.log(`✅ User stored: ${email} (Total users: ${connectedUsers.length})`);
    return newUser;
}

async function getFitbitUserEmail(accessToken) {
    try {
        const response = await fetch('https://api.fitbit.com/1/user/-/profile.json', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to get user profile: ${response.status}`);
        }

        const data = await response.json();
        return data.user?.email || null;
    } catch (error) {
        console.error('Error getting user email:', error);
        return null;
    }
}

async function fitbitApiRequest(endpoint, accessToken) {
    try {
        const response = await fetch(`https://api.fitbit.com/1/user/-/${endpoint}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Fitbit API Error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Fitbit API Error:', error);
        throw error;
    }
}

// Email functions
async function sendCongratulationsEmail(steps, calories, userEmail) {
    try {
        const mailOptions = {
            from: `JARVIS Fitness <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: '🎉 INCREDIBLE! You smashed your 10K step goal!',
            html: `
                <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; border-radius: 20px;">
                    <div style="text-align: center;">
                        <h1 style="font-size: 3rem; margin-bottom: 20px;">🏆 CHAMPION!</h1>
                        <h2 style="font-size: 1.5rem; margin-bottom: 30px;">You absolutely CRUSHED it today!</h2>
                    </div>
                    
                    <div style="background: rgba(255,255,255,0.15); padding: 30px; border-radius: 15px; margin: 30px 0;">
                        <h3 style="color: #00d4ff; margin-bottom: 20px;">📊 Today's Amazing Stats:</h3>
                        <p style="font-size: 1.3rem; margin: 0;"><strong>🚶 Steps:</strong> ${steps.toLocaleString()} steps</p>
                        <p style="font-size: 1.1rem; color: #00ff88; margin: 10px 0;"><strong>🎯 Goal Exceeded by:</strong> ${(steps - 10000).toLocaleString()} steps!</p>
                        <p style="font-size: 1.3rem; margin: 0;"><strong>🔥 Calories:</strong> ${calories.toLocaleString()} burned</p>
                    </div>
                    
                    <div style="text-align: center; margin: 40px 0;">
                        <h3 style="color: #00ff88;">🎯 You're building an incredible healthy lifestyle!</h3>
                        <p style="font-size: 1.1rem;">Your consistency is inspiring. Keep up this amazing momentum!</p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 40px;">
                        <p style="font-size: 0.9rem; opacity: 0.8;">- Your AI Fitness Assistant, JARVIS</p>
                    </div>
                </div>
            `
        };

        await emailTransporter.sendMail(mailOptions);
        console.log(`✅ Congratulations email sent to: ${userEmail}`);
        return true;
    } catch (error) {
        console.error(`❌ Error sending congratulations email to ${userEmail}:`, error);
        return false;
    }
}

async function sendMotivationEmail(steps, remaining, userEmail) {
    try {
        const motivationalMessages = [
            "Every step counts towards your health journey! 💪",
            "You've got this! Tomorrow is a fresh start! 🌅",
            "Progress over perfection - you're doing amazing! ⭐",
            "Your future self will thank you for not giving up! 🚀",
            "Champions are made in moments like these! 🏆"
        ];

        const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
        const completionPercentage = Math.round((steps / 10000) * 100);

        const mailOptions = {
            from: `JARVIS Fitness <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: '💪 Tomorrow\'s Your Day to Shine!',
            html: `
                <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 40px; border-radius: 20px;">
                    <div style="text-align: center;">
                        <h1 style="font-size: 3rem; margin-bottom: 20px;">💪 Don't Stop Now!</h1>
                        <h2 style="font-size: 1.5rem; margin-bottom: 30px;">You're closer than you think!</h2>
                    </div>
                    
                    <div style="background: rgba(255,255,255,0.15); padding: 30px; border-radius: 15px; margin: 30px 0;">
                        <h3 style="color: #ffeb3b; margin-bottom: 20px;">📊 Today's Progress:</h3>
                        <p style="font-size: 1.3rem; margin: 0;"><strong>🚶 Steps:</strong> ${steps.toLocaleString()} steps</p>
                        <p style="font-size: 1.2rem; color: #ffeb3b; margin: 10px 0;"><strong>🎯 Just ${remaining.toLocaleString()} more to reach 10K!</strong></p>
                        <p style="font-size: 1.1rem; margin: 0;"><strong>📈 Goal Completion:</strong> ${completionPercentage}%</p>
                    </div>
                    
                    <div style="text-align: center; margin: 40px 0;">
                        <h3 style="color: #00ff88;">🌟 ${randomMessage}</h3>
                        <p style="font-size: 1.1rem;">Tomorrow is a brand new opportunity to smash your goals!</p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 40px;">
                        <p style="font-size: 0.9rem; opacity: 0.8;">- Your AI Fitness Assistant, JARVIS</p>
                    </div>
                </div>
            `
        };

        await emailTransporter.sendMail(mailOptions);
        console.log(`✅ Motivation email sent to: ${userEmail}`);
        return true;
    } catch (error) {
        console.error(`❌ Error sending motivation email to ${userEmail}:`, error);
        return false;
    }
}

// Bulk email function
async function sendDailyEmailsToAllUsers() {
    if (connectedUsers.length === 0) {
        console.log('📧 No connected users to send emails to');
        return { sent: 0, failed: 0 };
    }

    console.log(`📧 Starting daily email process for ${connectedUsers.length} users...`);
    let sentCount = 0;
    let failedCount = 0;

    for (const user of connectedUsers) {
        try {
            // Get user's step data
            const stepsData = await fitbitApiRequest('activities/steps/date/today/1d.json', user.accessToken);
            const steps = parseInt(stepsData['activities-steps'][0]?.value || 0);

            const caloriesData = await fitbitApiRequest('activities/calories/date/today/1d.json', user.accessToken);
            const calories = parseInt(caloriesData['activities-calories'][0]?.value || 0);

            // Send appropriate email
            let emailSent = false;
            if (steps >= 10000) {
                emailSent = await sendCongratulationsEmail(steps, calories, user.email);
            } else {
                emailSent = await sendMotivationEmail(steps, 10000 - steps, user.email);
            }

            if (emailSent) {
                sentCount++;
                user.lastSync = new Date();
            } else {
                failedCount++;
            }

            // Small delay between emails
            await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
            console.error(`❌ Error processing user ${user.email}:`, error);
            failedCount++;
        }
    }

    console.log(`📧 Daily email process completed: ${sentCount} sent, ${failedCount} failed`);
    return { sent: sentCount, failed: failedCount };
}

// ========== FITBIT API ROUTES ==========

// Route 1: Start Fitbit OAuth process
app.get('/auth/fitbit', (req, res) => {
    try {
        console.log('🔗 Starting Fitbit OAuth process...');
        
        // Generate a unique state parameter
        const state = require('crypto').randomBytes(32).toString('hex');
        req.session.oauthState = state;
        
        // Define scope
        const scope = 'activity heartrate sleep weight nutrition profile';
        
        // Build authorization URL with proper parameter formatting
        const authParams = new URLSearchParams({
            'client_id': process.env.FITBIT_CLIENT_ID,
            'redirect_uri': process.env.FITBIT_REDIRECT_URI,
            'scope': scope,
            'response_type': 'code',  // This MUST be present
            'state': state,
            'prompt': 'consent'
        });
        
        const authUrl = `https://www.fitbit.com/oauth2/authorize?${authParams.toString()}`;
        
        console.log('🚀 Authorization URL:', authUrl);
        console.log('🔐 Generated state:', state);
        
        // Verify environment variables are present
        console.log('✅ Environment check:');
        console.log('  CLIENT_ID:', process.env.FITBIT_CLIENT_ID ? 'Present' : 'Missing');
        console.log('  REDIRECT_URI:', process.env.FITBIT_REDIRECT_URI ? 'Present' : 'Missing');
        
        res.redirect(authUrl);
        
    } catch (error) {
        console.error('❌ Error starting OAuth:', error);
        res.status(500).send(`
            <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: #ff4444;">❌ OAuth Initialization Failed</h1>
                <p style="font-size: 1.2rem; margin: 20px 0;">${error.message}</p>
                <a href="/fitbit-dashboard.html" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 10px;">
                    🔙 Back to Dashboard
                </a>
            </div>
        `);
    }
});


// Route 2: Handle Fitbit OAuth callback
app.get('/auth/fitbit/callback', async (req, res) => {
    const { code, state, error } = req.query;

    try {
        if (error) {
            console.error('❌ OAuth error:', error);
            return res.status(400).send(`OAuth Error: ${error}`);
        }

        if (state !== req.session.oauthState) {
            console.error('❌ Invalid state parameter');
            return res.status(400).send('Invalid state parameter');
        }

        if (!code) {
            return res.status(400).send('❌ Authorization failed - no code received');
        }

        console.log('🔄 Exchanging authorization code for access token...');

        const tokenRequestBody = new URLSearchParams({
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': process.env.FITBIT_REDIRECT_URI,
            'client_id': process.env.FITBIT_CLIENT_ID
        });

        const tokenResponse = await fetch('https://api.fitbit.com/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${process.env.FITBIT_CLIENT_ID}:${process.env.FITBIT_CLIENT_SECRET}`).toString('base64')}`
            },
            body: tokenRequestBody
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            console.error('❌ Token exchange failed:', tokenData);
            throw new Error(`Token exchange failed: ${tokenData.error_description || tokenData.error}`);
        }

        // Store tokens in session
        req.session.fitbitAccessToken = tokenData.access_token;
        req.session.fitbitRefreshToken = tokenData.refresh_token;
        req.session.fitbitUserId = tokenData.user_id;

        // Get user's email and store
        const userEmail = await getFitbitUserEmail(tokenData.access_token);

        if (userEmail) {
            storeConnectedUser(
                tokenData.user_id,
                tokenData.access_token,
                tokenData.refresh_token,
                userEmail
            );
        }

        delete req.session.oauthState;
        console.log('✅ Fitbit connection completed successfully!');

        res.redirect('/fitbit-dashboard.html?connected=true');

    } catch (error) {
        console.error('❌ Fitbit OAuth callback error:', error);
        res.status(500).send(`
            <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: #ff4444;">❌ Fitbit Connection Failed</h1>
                <p style="font-size: 1.2rem; margin: 20px 0;">${error.message}</p>
                <a href="/fitbit-dashboard.html" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 10px;">
                    🔙 Back to Dashboard
                </a>
            </div>
        `);
    }
});

// Route 3: Get current Fitbit data
app.get('/api/fitbit/today', async (req, res) => {
    try {
        const accessToken = req.session.fitbitAccessToken;
        const userId = req.session.fitbitUserId;

        if (!accessToken || !userId) {
            return res.status(401).json({
                error: 'Fitbit not connected',
                message: 'Please connect your Fitbit first'
            });
        }

        console.log(`📊 Fetching today's data for user: ${userId.substring(0, 6)}...`);

        const promises = [
            fitbitApiRequest('activities/steps/date/today/1d.json', accessToken),
            fitbitApiRequest('activities/calories/date/today/1d.json', accessToken),
            fitbitApiRequest('activities/heart/date/today/1d.json', accessToken).catch(() => null),
            fitbitApiRequest('activities/minutesVeryActive/date/today/1d.json', accessToken).catch(() => null)
        ];

        const [stepsData, caloriesData, heartRateData, activeMinutesData] = await Promise.all(promises);

        const todayData = {
            steps: parseInt(stepsData['activities-steps'][0]?.value || 0),
            calories: parseInt(caloriesData['activities-calories']?.value || 0),
            restingHeartRate: heartRateData?.['activities-heart']?.value?.restingHeartRate || 0,
            activeMinutes: parseInt(activeMinutesData?.['activities-minutesVeryActive'][0]?.value || 0),
            goalMet: false,
            lastSync: new Date().toISOString()
        };

        todayData.goalMet = todayData.steps >= 10000;

        console.log(`✅ Data retrieved: Steps: ${todayData.steps}, Calories: ${todayData.calories}`);

        res.json(todayData);

    } catch (error) {
        console.error('❌ Error fetching Fitbit data:', error);

        if (error.message.includes('401')) {
            return res.status(401).json({
                error: 'Fitbit authorization expired',
                message: 'Please reconnect your Fitbit account'
            });
        }

        res.status(500).json({
            error: 'Failed to fetch Fitbit data',
            message: error.message
        });
    }
});

// Route 4: Test step check and email
app.post('/api/fitbit/check-steps', async (req, res) => {
    try {
        const accessToken = req.session.fitbitAccessToken;
        const userId = req.session.fitbitUserId;

        if (!accessToken || !userId) {
            return res.status(401).json({
                error: 'Fitbit not connected',
                message: 'Please connect your Fitbit first'
            });
        }

        console.log('🧪 Running manual step check and email test...');

        const stepsData = await fitbitApiRequest('activities/steps/date/today/1d.json', accessToken);
        const steps = parseInt(stepsData['activities-steps'][0]?.value || 0);

        const caloriesData = await fitbitApiRequest('activities/calories/date/today/1d.json', accessToken);
        const calories = parseInt(caloriesData['activities-calories'][0]?.value || 0);

        const user = connectedUsers.find(u => u.fitbitUserId === userId);
        const userEmail = user?.email || process.env.EMAIL_USER;

        console.log(`📊 Today's stats for ${userEmail}: ${steps} steps, ${calories} calories`);

        let emailResult = null;
        let goalMet = steps >= 10000;

        try {
            if (goalMet) {
                emailResult = await sendCongratulationsEmail(steps, calories, userEmail);
            } else {
                emailResult = await sendMotivationEmail(steps, 10000 - steps, userEmail);
            }

            const responseMessage = goalMet
                ? `🎉 Congratulations email sent to ${userEmail}! ${steps.toLocaleString()} steps completed!`
                : `💪 Motivation email sent to ${userEmail}! ${steps.toLocaleString()} steps so far (${(10000 - steps).toLocaleString()} more to go!)`;

            res.json({
                success: true,
                message: responseMessage,
                data: {
                    steps: steps,
                    calories: calories,
                    goalMet: goalMet,
                    email: userEmail,
                    emailSent: emailResult
                }
            });

        } catch (emailError) {
            console.error('❌ Email sending failed:', emailError);
            res.json({
                success: false,
                message: `Step data retrieved but email failed: ${emailError.message}`,
                data: {
                    steps: steps,
                    calories: calories,
                    goalMet: goalMet,
                    email: userEmail,
                    emailSent: false
                }
            });
        }

    } catch (error) {
        console.error('❌ Error in manual step check:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to check steps and send email'
        });
    }
});

// Route 5: Send bulk emails
app.post('/api/fitbit/send-all-emails', async (req, res) => {
    try {
        if (connectedUsers.length === 0) {
            return res.json({
                success: true,
                message: 'No users connected yet!',
                totalUsers: 0,
                sent: 0,
                failed: 0
            });
        }

        const results = await sendDailyEmailsToAllUsers();

        res.json({
            success: true,
            message: 'Daily email process completed',
            totalUsers: connectedUsers.length,
            sent: results.sent,
            failed: results.failed,
            users: connectedUsers.map(u => ({
                email: u.email,
                lastSync: u.lastSync
            }))
        });

    } catch (error) {
        console.error('❌ Error in bulk email process:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Failed to send bulk emails'
        });
    }
});

// Route 6: Get connected users
app.get('/api/fitbit/connected-users', (req, res) => {
    try {
        const userSummary = connectedUsers.map(u => ({
            email: u.email,
            connectedAt: u.connectedAt,
            lastSync: u.lastSync,
            fitbitUserId: u.fitbitUserId.substring(0, 8) + '...'
        }));

        res.json({
            success: true,
            totalUsers: connectedUsers.length,
            users: userSummary,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Route 7: Disconnect user
app.post('/api/fitbit/disconnect', (req, res) => {
    try {
        const userId = req.session.fitbitUserId;

        if (userId) {
            const initialCount = connectedUsers.length;
            connectedUsers = connectedUsers.filter(user => user.fitbitUserId !== userId);
            const removedCount = initialCount - connectedUsers.length;

            delete req.session.fitbitAccessToken;
            delete req.session.fitbitRefreshToken;
            delete req.session.fitbitUserId;

            res.json({
                success: true,
                message: 'Fitbit disconnected successfully',
                removedUsers: removedCount
            });
        } else {
            res.json({
                success: false,
                message: 'No Fitbit connection found'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

console.log('✅ Fitbit integration loaded successfully');

// ========== END FITBIT INTEGRATION ==========

// Your existing routes
try {
    app.use('/api/auth', require('./routes/auth'));
    app.use('/api/meals', require('./routes/meals'));
    app.use('/api/workouts', require('./routes/workouts'));
    app.use('/auth', require('./routes/googleAuth'));
} catch (error) {
    console.error('❌ Route loading error:', error);
}

// Frontend routes
app.get('/', (req, res) => {
    try {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } catch (error) {
        console.error('❌ Frontend route error:', error);
        res.status(500).send('Server Error');
    }
});

// Catch-all route for SPA
app.get('*', (req, res) => {
    try {
        if (!req.path.startsWith('/api') && !req.path.startsWith('/auth')) {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        } else {
            res.status(404).json({ message: 'API endpoint not found' });
        }
    } catch (error) {
        console.error('❌ Catch-all route error:', error);
        res.status(500).send('Server Error');
    }
});

// Database connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB successfully');
    })
    .catch((error) => {
        console.error('❌ MongoDB connection failed:', error);
    });

// Start server
const PORT = process.env.PORT || 10000;
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 FitTracker server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔑 JWT Secret: ${process.env.JWT_SECRET ? 'Present' : 'Missing'}`);
    console.log(`📊 MongoDB URI: ${process.env.MONGODB_URI ? 'Present' : 'Missing'}`);
    console.log(`🔐 Google OAuth: ${process.env.GOOGLE_CLIENT_ID ? 'Present' : 'Missing'}`);
    console.log(`🏃 Fitbit OAuth: ${process.env.FITBIT_CLIENT_ID ? 'Present' : 'Missing'}`);
    console.log(`📧 Email System: ${process.env.EMAIL_USER ? 'Enabled' : 'Disabled'}`);
});

// Handle server errors
server.on('error', (error) => {
    console.error('❌ Server error:', error);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🔄 SIGTERM received, shutting down gracefully');
    server.close(() => {
        mongoose.connection.close();
        process.exit(0);
    });
});
