// ====================================================
// Role Authorization Middleware (authorizeRoles)
//
// This middleware restricts route access based on user roles (e.g. Candidate vs Recruiter).
// It runs after protect middleware has identified the user.
//
// Features:
// - Verifies if the logged-in user has the required role.
// - Returns a 403 Forbidden error if unauthorized.
//
// Used by:
// - Routes that require recruiter permission (such as posting or deleting a job).
// ====================================================

// Purpose:
// Generates Express middleware that blocks access if user role is not in the allowed list.
//
// Input:
// ...roles (strings) - List of acceptable roles (e.g. 'recruiter').
//
// Output:
// Returns middleware that calls next() or returns a 403 JSON error response.
//
// Usage:
// Used as authorizeRoles('recruiter') in jobRoutes.js.
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // If user is not authenticated or their role is not allowed, block access
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user ? req.user.role : 'guest'}' is not authorized to access this resource`,
      });
    }
    return next();
  };
};

module.exports = { authorizeRoles };
