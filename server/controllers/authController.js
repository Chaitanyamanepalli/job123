// ====================================================
// Authentication Controller
//
// This file handles all user accounts operations including registering new users,
// logging users in, checking the current session, and initiating password resets.
//
// Features:
// - Register User (Signup)
// - Login User
// - Fetch profile details (getMe)
// - Request password reset email (forgotPassword)
// - Reset password using link token (resetPassword)
//
// Password Reset Flow:
// User clicks "Forgot Password" on screen
// → User enters email and submits form
// → Controller creates unique token and saves expiry date
// → Controller sends reset link to user email using SMTP service
// → User clicks link and opens Reset Password page
// → User enters new password
// → Controller verifies token validity, hashes password, and saves details
// ====================================================

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

// Purpose:
// Generates a JSON Web Token (JWT) signed with the user's database ID.
//
// Input:
// id (string) - The user's MongoDB ObjectId.
//
// Output:
// Returns a signed JWT token string.
//
// Usage:
// Used in signup and login functions to authenticate users on succeeding requests.
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretkey123', {
    expiresIn: '30d',
  });
};

// Purpose:
// Registers a new user account (Candidate or Recruiter).
//
// Input:
// req.body - contains { fullName, email, password, role }.
//
// Output:
// Returns JSON detailing the registered user profile and JWT token on success.
//
// Usage:
// Triggered when submitting the user registration signup form.
const signup = async (req, res, next) => {
  try {
    const { fullName, email, password, role } = req.body;

    // Validate request body
    if (!fullName || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const validRoles = ['candidate', 'recruiter'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role selection',
      });
    }

    // Check if user already exists in database
    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists',
      });
    }

    // Save new user profile (Pre-save hook in User model handles hashing)
    const user = await User.create({
      fullName,
      email: email.toLowerCase().trim(),
      password,
      role,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token: generateToken(user._id),
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Purpose:
// Authenticates user credentials (email and password).
//
// Input:
// req.body - contains { email, password }.
//
// Output:
// Returns user details and an auth token if login is successful.
//
// Usage:
// Triggered when submitting the user login form.
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Retrieve user profile by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Verify entered password matches database hash
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token: generateToken(user._id),
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Purpose:
// Returns profile details of the currently authenticated logged-in session user.
//
// Input:
// req.user (injected by protect middleware).
//
// Output:
// Returns current session user profile JSON.
//
// Usage:
// Used by the client on app launch to check if user has active session.
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

// Purpose:
// Generates and emails a temporary password reset URL to the user.
//
// Input:
// req.body - contains { email }.
//
// Output:
// Sends email containing reset link and returns success status JSON.
//
// Usage:
// Triggered when clicking "Submit" on Forgot Password page form.
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email address',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with that email address',
      });
    }

    // Generate reset token and set database expiration
    const resetToken = user.getResetPasswordToken();

    await user.save();

    // Setup client reset URL
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    // Plain text email message content
    const message = `Hello ${user.fullName},\n\nWe received a request to reset your password.\n\nClick the link below to create a new password:\n\n${resetUrl}\n\nThis link expires in 15 minutes.\n\nIf you did not request this reset, please ignore this email.\n\nRegards,\nJobPortal Pro Team`;

    // Rich HTML email message content
    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px;">
        <h2 style="color: #6366f1; border-bottom: 1px solid #eee; padding-bottom: 10px;">Reset Your Password</h2>
        <p>Hello <strong>${user.fullName}</strong>,</p>
        <p>We received a request to reset your password.</p>
        <p>Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #6366f1;">${resetUrl}</p>
        <p>This link expires in 15 minutes.</p>
        <p style="font-size: 0.9em; color: #666; border-top: 1px solid #eee; padding-top: 15px; margin-top: 20px;">
          If you did not request this reset, please ignore this email.
        </p>
        <p style="font-size: 0.9em; color: #666;">
          Regards,<br />
          <strong>JobPortal Pro Team</strong>
        </p>
      </div>
    `;

    try {
      // Dispatch email through nodemailer setup
      await sendEmail({
        to: user.email,
        subject: 'Reset Your Password',
        text: message,
        html: htmlMessage,
      });

      res.status(200).json({
        success: true,
        message: 'Password reset link sent to your email address',
      });
    } catch (err) {
      console.error('SMTP Email Error:', err.message);
      // If email fails, clear reset token fields in database
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent. Please try again later.',
      });
    }
  } catch (error) {
    next(error);
  }
};

// Purpose:
// Updates a user's password in the database using reset token.
//
// Input:
// req.params.token (reset token) and req.body.password.
//
// Output:
// Returns success status JSON.
//
// Usage:
// Triggered on ResetPassword page when submitting the new password form.
const resetPassword = async (req, res, next) => {
  try {
    const { password, newPassword } = req.body;
    const incomingPassword = password || newPassword;

    if (!incomingPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a new password',
      });
    }

    if (incomingPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Re-create the hash of the token sent in the URL to match with database
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    // Find the user with matching token that has not expired
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    // Save new password details and clear reset state
    user.password = incomingPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now login.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  getMe,
  forgotPassword,
  resetPassword,
};
