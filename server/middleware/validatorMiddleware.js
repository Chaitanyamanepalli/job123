const { body, validationResult } = require('express-validator');

const validateSignup = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .escape(),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .isIn(['candidate', 'recruiter', 'admin'])
    .withMessage('Invalid role choice. Must be candidate, recruiter or admin'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const formattedErrors = {};
      errors.array().forEach(err => {
        formattedErrors[err.path] = err.msg;
      });
      return res.status(400).json({
        success: false,
        message: errors.array().map(e => e.msg).join(', '),
        errors: formattedErrors,
      });
    }
    next();
  },
];

const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const formattedErrors = {};
      errors.array().forEach(err => {
        formattedErrors[err.path] = err.msg;
      });
      return res.status(400).json({
        success: false,
        message: errors.array().map(e => e.msg).join(', '),
        errors: formattedErrors,
      });
    }
    next();
  },
];

module.exports = {
  validateSignup,
  validateLogin,
};
