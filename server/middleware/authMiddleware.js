// ====================================================
// Authentication Middleware (protect)
//
// This middleware verifies the client's JWT token to ensure they are logged in.
// If the token is valid, it retrieves user details and attaches them to the request (`req.user`).
//
// Features:
// - Extracts bearer tokens from authorization header.
// - Verifies the signature of token.
// - Injects active User session into subsequent Express route handlers.
//
// Used by:
// - Application, Auth, and Job Routes to secure private actions.
// ====================================================

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Purpose:
// Express middleware function that validates the JWT in HTTP headers.
//
// Input:
// req.headers.authorization (Bearer token).
//
// Output:
// Calls next() if token is valid, otherwise returns a 401 Unauthorized JSON error.
//
// Usage:
// Added to Express routes that require user authorization (e.g. posting a job or applying).
const protect = async (req, res, next) => {
  let token;

  // Check if Bearer token is provided in headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header (split from "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];

      // Verify token authenticity using the secret key
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey123');

      // Get user from the token decoded ID (excluding password field)
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized, user not found',
        });
      }

      // Proceed to the next middleware or controller
      return next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided',
    });
  }
};

module.exports = { protect };
