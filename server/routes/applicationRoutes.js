const express = require('express');
const router = express.Router();
const {
  applyJob,
  getApplicationsByJob,
  getUserApplications,
  updateApplicationStatus,
} = require('../controllers/applicationController');
const { validateApplication } = require('../validators/applicationValidator');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.post('/jobs/:id/apply', protect, authorizeRoles('candidate'), validateApplication, applyJob);
router.get('/jobs/:id/applications', protect, authorizeRoles('recruiter'), getApplicationsByJob);
router.get('/applications/user', protect, authorizeRoles('candidate'), getUserApplications);
router.put('/applications/:id/status', protect, authorizeRoles('recruiter'), updateApplicationStatus);

module.exports = router;

