// ====================================================
// Recruiter Interview Routes Configuration
//
// This file registers API endpoints related to candidate interview scheduling.
//
// Endpoints:
// - POST   /api/interviews                          -> Schedule interview (protected, recruiter-only)
// - PUT    /api/interviews/:id                      -> Update interview schedule (protected, recruiter-only)
// - DELETE /api/interviews/:id                      -> Cancel/remove interview schedule (protected, recruiter-only)
// - GET    /api/interviews/:id                      -> Fetch interview by ID (protected, candidate and recruiter)
// - GET    /api/interviews/application/:applicationId -> Fetch interview by Application ID (protected, candidate and recruiter)
//
// Used by:
// - server.js (mounted at /api/interviews)
// ====================================================

const express = require('express');
const router = express.Router();
const {
  scheduleInterview,
  updateInterview,
  cancelInterview,
  getInterview,
  getInterviewByApplication,
} = require('../controllers/interviewController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.post('/', protect, authorizeRoles('recruiter'), scheduleInterview);
router.put('/:id', protect, authorizeRoles('recruiter'), updateInterview);
router.delete('/:id', protect, authorizeRoles('recruiter'), cancelInterview);
router.get('/:id', protect, getInterview);
router.get('/application/:applicationId', protect, getInterviewByApplication);

module.exports = router;
