// ====================================================
// Job Listings Routes Configuration
//
// This file configures API endpoints for job listings.
//
// Endpoints:
// - GET  /api/jobs          -> Fetch multiple jobs (public)
// - POST /api/jobs          -> Post a job (protected, recruiter-only)
// - GET  /api/jobs/:id      -> Fetch single job details (public)
// - PUT  /api/jobs/:id      -> Update a job (protected, recruiter-only)
// - DELETE /api/jobs/:id    -> Delete a job (protected, recruiter-only)
//
// Used by:
// - Mounted at /api/jobs in server/server.js.
// ====================================================

const express = require('express');
const router = express.Router();
const {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
} = require('../controllers/jobController');
const { validateJob } = require('../validators/jobValidator');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// Route for handling multiple jobs
router.route('/')
  // Public users can fetch/browse jobs
  .get(getJobs)
  // Only logged-in recruiters can post new jobs. Details are validated before creation.
  .post(protect, authorizeRoles('recruiter'), validateJob, createJob);

// Route for handling single job operations by ID
router.route('/:id')
  // Public details view
  .get(getJobById)
  // Only logged-in recruiters who own the job can update it
  .put(protect, authorizeRoles('recruiter'), validateJob, updateJob)
  // Only logged-in recruiters who own the job can delete it
  .delete(protect, authorizeRoles('recruiter'), deleteJob);

module.exports = router;
