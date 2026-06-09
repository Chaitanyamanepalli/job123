// ====================================================
// Job Application Routes Configuration
//
// This file registers API endpoints related to candidate job applications.
//
// Endpoints:
// - POST /api/jobs/:id/apply         -> Submit job application (protected, candidate-only)
// - GET  /api/jobs/:id/applications  -> Fetch all applications for a job (protected, recruiter-only)
// - GET  /api/applications/user       -> Fetch applicant's own applications (protected, candidate-only)
// - PUT  /api/applications/:id/status -> Update status of application (protected, recruiter-only)
//
// Used by:
// - Mounted at /api in server/server.js.
// ====================================================

const express = require('express');
const router = express.Router();
const {
  applyJob,
  getApplicationsByJob,
  getUserApplications,
  updateApplicationStatus,
  updateApplicationStatusPatch,
} = require('../controllers/applicationController');
const { validateApplication } = require('../validators/applicationValidator');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Route for candidate to apply for a job
router.post('/jobs/:id/apply', protect, authorizeRoles('candidate'), validateApplication, applyJob);

// Route for recruiter to see all applications for their job listing
router.get('/jobs/:id/applications', protect, authorizeRoles('recruiter'), getApplicationsByJob);

// Route for candidate to fetch their own job applications history
router.get('/applications/user', protect, authorizeRoles('candidate'), getUserApplications);

// Route for recruiter to shortlist or reject a job application
router.put('/applications/:id/status', protect, authorizeRoles('recruiter'), updateApplicationStatus);

// Route for recruiter to update application status (PATCH)
router.patch('/applications/:id/status', protect, authorizeRoles('recruiter'), updateApplicationStatusPatch);

module.exports = router;

