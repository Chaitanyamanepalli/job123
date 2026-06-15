// ====================================================
// Recruiter Analytics Routes Configuration
//
// This file registers API endpoints related to recruiter candidate metrics.
//
// Endpoints:
// - GET /api/analytics/recruiter -> Fetch metrics calculations (protected, recruiter-only)
//
// Used by:
// - server.js (mounted at /api/analytics)
// ====================================================

const express = require('express');
const router = express.Router();
const { getRecruiterAnalytics } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/recruiter', protect, authorizeRoles('recruiter'), getRecruiterAnalytics);

module.exports = router;
