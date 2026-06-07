// ====================================================
// Job Application Input Validator Middleware
//
// This middleware validates candidate profile details before submitting a job application.
//
// Features:
// - Verifies applicant name is present and valid text.
// - Verifies email format using a regular expression.
// - Verifies phone number format (7 to 15 characters, numeric/dashes/spaces).
// - Returns a 400 Bad Request JSON response with validation errors if inputs are invalid.
//
// Used by:
// - applicationRoutes.js (applied to POST apply endpoint)
// ====================================================

// Purpose:
// Express middleware function that validates the body of a job application request.
//
// Input:
// req.body - contains { name, email, phone }.
//
// Output:
// Calls next() if validation passes, otherwise returns a 400 JSON response with error lists.
//
// Usage:
// Added to candidate router application endpoint in applicationRoutes.js.
const validateApplication = (req, res, next) => {
  const { name, email, phone } = req.body;
  const errors = {};

  // Validate candidate name
  if (!name || typeof name !== 'string' || name.trim() === '') {
    errors.name = 'Full name is required';
  }

  // Validate candidate email format using regex
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!email || typeof email !== 'string' || email.trim() === '') {
    errors.email = 'Email is required';
  } else if (!emailRegex.test(email.trim())) {
    errors.email = 'Please provide a valid email address';
  }

  // Validate candidate phone number format using phone regex
  const phoneRegex = /^[+]?[0-9\s\-()]{7,15}$/;
  if (!phone || typeof phone !== 'string' || phone.trim() === '') {
    errors.phone = 'Phone number is required';
  } else if (!phoneRegex.test(phone.trim())) {
    errors.phone = 'Please provide a valid phone number (7 to 15 digits)';
  }

  // If validation fails, block request and send errors back to client
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors,
    });
  }

  next();
};

module.exports = { validateApplication };
