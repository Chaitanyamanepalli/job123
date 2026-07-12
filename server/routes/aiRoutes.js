const express = require('express');
const router = express.Router();
const {
  analyzeResume,
  getCareerRoadmap,
  getInterviewQuestions,
  generateQuiz,
  getRecommendations,
  getDashboardStats
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');
const { uploadResume: uploadResumeMiddleware } = require('../middleware/uploadMiddleware');

// All AI Preparation routes are protected and candidate-only (Student users)
router.get('/dashboard', protect, authorizeRoles('candidate'), getDashboardStats);
router.post('/analyze-resume', protect, authorizeRoles('candidate'), uploadResumeMiddleware, analyzeResume);
router.post('/career-roadmap', protect, authorizeRoles('candidate'), getCareerRoadmap);
router.post('/interview-prep', protect, authorizeRoles('candidate'), getInterviewQuestions);
router.post('/generate-quiz', protect, authorizeRoles('candidate'), generateQuiz);
router.get('/recommendations', protect, authorizeRoles('candidate'), getRecommendations);

module.exports = router;
