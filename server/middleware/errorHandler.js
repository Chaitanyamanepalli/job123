// ====================================================
// Global Error Handler Middleware
//
// This middleware catches all unhandled errors thrown in Express routes.
// It maps database validation errors into readable client JSON messages.
//
// Features:
// - Catches Mongoose schema validation errors.
// - Catches invalid MongoDB ObjectId format query issues (CastError).
// - Catches database duplicate field index value issues (e.g. signup with same email).
// - Guarantees the client receives a structured `{ success: false, message: ... }` response.
//
// Used by:
// - Mounted at the end of server/server.js so all route errors bubble up here.
// ====================================================

// Purpose:
// Catch-all Express middleware function that formats server error responses.
//
// Input:
// err (Object) - The thrown Error.
//
// Output:
// Returns JSON detailing the error message with suitable HTTP status code.
//
// Usage:
// Declared as module.exports and mounted globally in server.js.
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log the raw error stack to server console for debugging
  console.error(err);

  // Catch Mongoose bad ObjectId format error (e.g. invalid URL params in details page)
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = { message, statusCode: 404 };
  }

  // Catch Mongoose duplicate unique key index constraint error (e.g. duplicate Email signup)
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 };
  }

  // Catch Mongoose Schema validation check failures (e.g. missing required field values)
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
  });
};

module.exports = errorHandler;
