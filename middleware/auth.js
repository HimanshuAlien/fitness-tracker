// Update your middleware/auth.js to handle Bearer tokens correctly
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.header('Authorization');
        console.log('🔍 Auth header received:', authHeader ? 'Present' : 'Missing');

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        // Extract token from "Bearer TOKEN"
        const token = authHeader.substring(7); // Remove "Bearer " prefix
        console.log('🔑 Token extracted:', token ? 'Valid' : 'Invalid');

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ Token decoded successfully:', decoded.userId);

        const user = await User.findById(decoded.userId).select('-password');
        if (!user) {
            return res.status(401).json({ message: 'Token is not valid' });
        }

        req.userId = decoded.userId;
        req.user = user;
        next();
    } catch (error) {
        console.error('❌ Auth middleware error:', error.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = auth;
