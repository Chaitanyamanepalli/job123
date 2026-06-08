const express = require('express');
const router = express.Router();
const { getSavedJobs, updateProfile, uploadResume } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { uploadResume: uploadResumeMiddleware } = require('../middleware/uploadMiddleware');

router.get('/saved-jobs', protect, authorizeRoles('candidate'), getSavedJobs);
router.put('/profile', protect, authorizeRoles('candidate'), updateProfile);
router.post('/resume', protect, authorizeRoles('candidate'), uploadResumeMiddleware, uploadResume);

module.exports = router;
