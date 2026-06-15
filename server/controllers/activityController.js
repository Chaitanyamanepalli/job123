// ====================================================
// Activity Controller
//
// This file handles operations related to recruiter activities in the ATS system.
// It retrieves the history logs of recruiter actions (e.g. creating/closing jobs, updating application status).
//
// Features:
// - Get Recruiter Recent Activities (recruiter-only, limited to latest 10 logs)
//
// Used by:
// - activityRoutes.js
// ====================================================

const ActivityLog = require('../models/ActivityLog');

// @desc    Get recruiter's latest 10 activities
// @route   GET /api/activities
// @access  Private (Recruiter only)
const getRecentActivities = async (req, res, next) => {
  try {
    const recruiterId = req.user._id;

    // Fetch the latest 10 activities for this recruiter
    const activities = await ActivityLog.find({ recruiterId })
      .sort({ timestamp: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecentActivities,
};
