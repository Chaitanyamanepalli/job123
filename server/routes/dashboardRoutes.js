const express = require('express');
const router = express.Router();
const { getRecruiterStats, getCandidateStats, getAdminStats } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/recruiter', protect, authorizeRoles('recruiter'), getRecruiterStats);
router.get('/candidate', protect, authorizeRoles('candidate'), getCandidateStats);
router.get('/admin', protect, authorizeRoles('admin'), getAdminStats);

module.exports = router;
