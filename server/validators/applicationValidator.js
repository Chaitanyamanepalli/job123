const validateApplication = (req, res, next) => {
  const { name, email, phone } = req.body;
  const errors = {};

  if (!name || typeof name !== 'string' || name.trim() === '') {
    errors.name = 'Full name is required';
  }

  // Email validation regex
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  if (!email || typeof email !== 'string' || email.trim() === '') {
    errors.email = 'Email is required';
  } else if (!emailRegex.test(email.trim())) {
    errors.email = 'Please provide a valid email address';
  }

  // Phone validation (simple regex: numeric/dashes/spaces, 7 to 15 digits)
  const phoneRegex = /^[+]?[0-9\s\-()]{7,15}$/;
  if (!phone || typeof phone !== 'string' || phone.trim() === '') {
    errors.phone = 'Phone number is required';
  } else if (!phoneRegex.test(phone.trim())) {
    errors.phone = 'Please provide a valid phone number (7 to 15 digits)';
  }

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
