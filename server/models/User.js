// ====================================================
// User Model (Database Schema)
//
// This file defines the structure of a User record inside MongoDB.
// It supports two roles: Candidates (who apply for jobs) and Recruiters (who post jobs).
//
// Features:
// - Saves user profile info (name, email, password, role).
// - Has a pre-save hook to hash passwords for safety.
// - Includes methods to check passwords and generate password reset tokens.
//
// Used by:
// - authController.js (for login, signup, and password recovery)
// ====================================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema(
  {
    // The user's full name (e.g. "John Doe")
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    // The user's unique email address (used for logging in)
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
    },
    // The encrypted user password
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
    },
    // Role selection (either candidate or recruiter)
    role: {
      type: String,
      enum: {
        values: ['candidate', 'recruiter'],
        message: '{VALUE} is not a valid role. Must be: candidate or recruiter',
      },
      required: [true, 'Role selection is required'],
    },
    // Token sent to the user's email if they forget their password
    resetPasswordToken: String,
    // The expiry time of the reset token (valid for 15 minutes)
    resetPasswordExpire: Date,
  },
  {
    // Automatically adds createdAt and updatedAt dates to the document
    timestamps: true,
  }
);

// Encrypt password using bcryptjs before saving to database
// This ensures that plain text passwords are never stored in the database.
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Purpose:
// Compares an entered plain text password with the encrypted password in the database.
//
// Input:
// enteredPassword (string) - The password inputted by the user at login.
//
// Output:
// Returns true if passwords match, otherwise false.
//
// Usage:
// Used in authController.js during the login process.
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Purpose:
// Generates a random reset token, hashes it to save in the database, and sets an expiration time.
//
// Input:
// None.
//
// Output:
// Returns the raw resetToken string (to be sent via email).
//
// Usage:
// Used in authController.js when a user requests a password reset.
UserSchema.methods.getResetPasswordToken = function () {
  // Generate a random 20-character token
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash the token so we don't store it in plain text
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set the token to expire in 15 minutes
  this.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

  return resetToken;
};

module.exports = mongoose.model('User', UserSchema);
