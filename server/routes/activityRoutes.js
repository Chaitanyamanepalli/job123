// ====================================================
// Recruiter Activity Routes Configuration
//
// This file registers API endpoints related to recruiter activity logs.
//
// Endpoints:
// - GET /api/activities -> Fetch recruiter's history log (protected, recruiter-only)
//
// Used by:
// - server.js (mounted at /api/activities)
// ====================================================

const express = require('express');
const router = express.Router();
const { getRecentActivities } = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/', protect, authorizeRoles('recruiter'), getRecentActivities);

module.exports = router;
