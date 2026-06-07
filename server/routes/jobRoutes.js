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

router.route('/')
  .get(getJobs)
  .post(protect, authorizeRoles('recruiter'), validateJob, createJob);

router.route('/:id')
  .get(getJobById)
  .put(protect, authorizeRoles('recruiter'), validateJob, updateJob)
  .delete(protect, authorizeRoles('recruiter'), deleteJob);

module.exports = router;
