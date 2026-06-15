// ====================================================
// Interview Controller
//
// This file handles operations related to interview scheduling in the ATS system.
// Recruiters can schedule interviews, update interview metadata, cancel interviews,
// and get interview details.
//
// Features:
// - Schedule Interview (auto application status transition to "Interview Scheduled", logs activity)
// - Update Interview (logs activity)
// - Cancel Interview (deletes record, logs activity)
// - Get Interview by ID
// - Get Interview by Application ID
//
// Used by:
// - interviewRoutes.js
// ====================================================

const Interview = require('../models/Interview');
const Application = require('../models/Application');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');

// @desc    Schedule a candidate interview
// @route   POST /api/interviews
// @access  Private (Recruiter only)
const scheduleInterview = async (req, res, next) => {
  try {
    const { applicationId, date, time, mode, meetingLink, remarks } = req.body;
    const recruiterId = req.user._id;

    if (!applicationId || !date || !time || !mode) {
      return res.status(400).json({
        success: false,
        message: 'Application ID, date, time, and mode are required',
      });
    }

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Create the Interview schedule
    const interview = await Interview.create({
      applicationId,
      recruiterId,
      date,
      time,
      mode,
      meetingLink,
      remarks,
      status: 'Scheduled',
    });

    // Auto-transition Application status to 'Interview Scheduled'
    application.status = 'Interview Scheduled';
    application.applicationStatus = 'Interview Scheduled';
    await application.save();

    // Create Activity Log
    try {
      await ActivityLog.create({
        recruiterId,
        action: `Scheduled Interview for ${application.name}`,
      });
    } catch (err) {
      console.error('Failed to log interview schedule activity:', err.message);
    }

    // Send Notification to Candidate
    try {
      const notification = await Notification.create({
        recipient: application.candidateId,
        sender: recruiterId,
        type: 'status_change',
        title: 'Interview Scheduled',
        message: `An interview has been scheduled for you on ${new Date(date).toLocaleDateString()} at ${time} (${mode}).`,
      });

      // Send real-time event via Socket.IO
      const { sendEventToUser } = require('../config/socket');
      sendEventToUser(application.candidateId, 'notification', {
        _id: notification._id,
        type: 'status_change',
        title: notification.title,
        message: notification.message,
        isRead: false,
        createdAt: notification.createdAt,
      });
    } catch (err) {
      console.error('Failed to send interview notification to candidate:', err.message);
    }

    res.status(201).json({
      success: true,
      message: 'Interview scheduled successfully',
      interview,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update interview details
// @route   PUT /api/interviews/:id
// @access  Private (Recruiter only)
const updateInterview = async (req, res, next) => {
  try {
    const recruiterId = req.user._id;
    const { date, time, mode, meetingLink, remarks, status } = req.body;

    let interview = await Interview.findById(req.params.id);
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview schedule not found',
      });
    }

    // Owner authorization guard
    if (interview.recruiterId.toString() !== recruiterId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this interview schedule',
      });
    }

    interview = await Interview.findByIdAndUpdate(
      req.params.id,
      { date, time, mode, meetingLink, remarks, status },
      { new: true, runValidators: true }
    );

    const application = await Application.findById(interview.applicationId);

    // Create Activity Log
    try {
      const candidateName = application ? application.name : 'Candidate';
      await ActivityLog.create({
        recruiterId,
        action: `Updated Interview for ${candidateName}`,
      });
    } catch (err) {
      console.error('Failed to log interview update activity:', err.message);
    }

    res.status(200).json({
      success: true,
      message: 'Interview schedule updated successfully',
      interview,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel/delete an interview
// @route   DELETE /api/interviews/:id
// @access  Private (Recruiter only)
const cancelInterview = async (req, res, next) => {
  try {
    const recruiterId = req.user._id;

    const interview = await Interview.findById(req.params.id);
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview schedule not found',
      });
    }

    // Owner authorization guard
    if (interview.recruiterId.toString() !== recruiterId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this interview schedule',
      });
    }

    const application = await Application.findById(interview.applicationId);

    // Delete the schedule record
    await Interview.findByIdAndDelete(req.params.id);

    // Create Activity Log
    try {
      const candidateName = application ? application.name : 'Candidate';
      await ActivityLog.create({
        recruiterId,
        action: `Cancelled Interview for ${candidateName}`,
      });
    } catch (err) {
      console.error('Failed to log interview cancel activity:', err.message);
    }

    res.status(200).json({
      success: true,
      message: 'Interview cancelled and schedule removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get interview by ID
// @route   GET /api/interviews/:id
// @access  Private (Recruiter & Candidate)
const getInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate('applicationId');

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview schedule not found',
      });
    }

    res.status(200).json({
      success: true,
      interview,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get interview by candidate Application ID
// @route   GET /api/interviews/application/:applicationId
// @access  Private (Recruiter & Candidate)
const getInterviewByApplication = async (req, res, next) => {
  try {
    const { applicationId } = req.params;

    const interview = await Interview.findOne({ applicationId });

    res.status(200).json({
      success: true,
      interview,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  scheduleInterview,
  updateInterview,
  cancelInterview,
  getInterview,
  getInterviewByApplication,
};
