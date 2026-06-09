const express = require('express');
const router = express.Router();
const { updateProfile, uploadResume } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { uploadResume: uploadResumeMiddleware } = require('../middleware/uploadMiddleware');

// @desc    Get current user profile
// @route   GET /api/profile
// @access  Private
router.get('/', protect, (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
});

// @desc    Update current user profile
// @route   PUT /api/profile/update
// @access  Private
router.put('/update', protect, authorizeRoles('candidate'), updateProfile);

// @desc    Upload candidate resume
// @route   POST /api/profile/upload-resume
// @access  Private
router.post('/upload-resume', protect, authorizeRoles('candidate'), uploadResumeMiddleware, uploadResume);

module.exports = router;
