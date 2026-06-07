// ====================================================
// Authentication Routes Configuration
//
// This file binds API endpoints to authentication controller handlers.
//
// Endpoints:
// - POST /api/auth/signup         -> Register a user
// - POST /api/auth/login          -> Log in a user
// - GET  /api/auth/me             -> Retrieve logged-in session (protected)
// - POST /api/auth/forgot-password -> Request password reset link
// - PUT  /api/auth/reset-password -> Reset password using token
//
// Used by:
// - Mounted at /api/auth in server/server.js.
// ====================================================

const express = require('express');
const router = express.Router();
const { signup, login, getMe, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public signup route
router.post('/signup', signup);

// Public login route
router.post('/login', login);

// Private session details route (requires valid JWT token middleware)
router.get('/me', protect, getMe);

// Public password recovery route
router.post('/forgot-password', forgotPassword);

// Public password reset route
router.put('/reset-password/:token', resetPassword);

module.exports = router;
