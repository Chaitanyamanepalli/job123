// ====================================================
// Application Controller
//
// This file handles operations related to job applications.
// Candidates can submit applications, and recruiters can view applicants and change application status.
//
// Features:
// - Apply for a Job (Candidate-only, duplication guard)
// - Fetch Job Applicants list (Recruiter-only, owner verified)
// - Fetch User Applications history list (Candidate-only)
// - Update Application Status (Recruiter-only, owner verified)
//
// Used by:
// - applicationRoutes.js
// - jobRoutes.js (nested application endpoints)
// ====================================================

const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const Notification = require('../models/Notification');

// Purpose:
// Creates a new job application in the database for a candidate.
//
// Input:
// req.params.id (job ObjectId), and req.body contains { name, email, phone }.
//
// Output:
// Returns the created application document details.
//
// Usage:
// Triggered on the frontend when candidate fills out and submits the "Apply Job" modal form.
const applyJob = async (req, res, next) => {
  try {
    const jobId = req.params.id;
    const { name, email, phone } = req.body;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Check if the candidate has uploaded a resume
    if (!req.user.resumeUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please upload your resume before applying.',
      });
    }

    // Check if applicant already applied to this specific job
    // This prevents candidates from submitting multiple applications for the same job.
    const alreadyApplied = await Application.findOne({ jobId, candidateId: req.user._id });
    if (alreadyApplied) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job',
      });
    }

    // Create the application document
    const application = await Application.create({
      name: name || req.user.fullName,
      email: (email || req.user.email).trim().toLowerCase(),
      phone,
      jobId,
      candidateId: req.user._id,
      resumeUrl: req.user.resumeUrl,
      applicationStatus: 'Pending',
    });

    // Notify Recruiter via Email
    const recruiter = await User.findById(job.postedBy);
    if (recruiter && recruiter.email) {
      try {
        const appDate = new Date().toLocaleDateString();
        await sendEmail({
          to: recruiter.email,
          subject: `New Job Application for ${job.title}`,
          text: `Hello ${recruiter.fullName},\n\nYou have received a new job application for the post of ${job.title}.\n\nCandidate Details:\nName: ${application.name}\nEmail: ${application.email}\nPhone: ${application.phone}\nApplication Date: ${appDate}\n\nPlease log in to your dashboard to review this application.\n\nRegards,\nJobPortal Pro Team`,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px;">
              <h2 style="color: #6366f1; border-bottom: 1px solid #eee; padding-bottom: 10px;">New Job Application Received</h2>
              <p>Hello <strong>${recruiter.fullName}</strong>,</p>
              <p>You have received a new job application for your posting: <strong>${job.title}</strong>.</p>
              <h3 style="color: #4f46e5; margin-top: 20px;">Candidate Details</h3>
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; width: 30%;">Name:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${application.name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><a href="mailto:${application.email}">${application.email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Phone:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${application.phone}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Applied On:</td>
                  <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${appDate}</td>
                </tr>
              </table>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/recruiter/dashboard" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Applications</a>
              </div>
              <p style="font-size: 0.9em; color: #666; border-top: 1px solid #eee; padding-top: 15px; margin-top: 20px;">
                Regards,<br />
                <strong>JobPortal Pro Team</strong>
              </p>
            </div>
          `
        });
      } catch (err) {
        console.error('Failed to send email alert to recruiter:', err.message);
      }
    }

    // Save Notification to Database for Recruiter
    try {
      const notification = await Notification.create({
        recipient: job.postedBy,
        sender: req.user._id,
        type: 'new_application',
        title: 'New Job Application',
        message: `${application.name} applied for your job: ${job.title}`,
      });

      // Send real-time event via Socket.IO
      const { sendEventToUser } = require('../config/socket');
      sendEventToUser(job.postedBy, 'notification', {
        _id: notification._id,
        type: 'new_application',
        title: notification.title,
        message: notification.message,
        isRead: false,
        createdAt: notification.createdAt,
      });
    } catch (err) {
      console.error('Failed to save or send socket notification to recruiter:', err.message);
    }

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application,
    });
  } catch (error) {
    next(error);
  }
};

// Purpose:
// Fetches all candidate applications submitted to a specific job listing.
//
// Input:
// req.params.id (job ID).
//
// Output:
// Returns a list of applications sorted by applied date (latest first).
//
// Usage:
// Used on the recruiter's dashboard when checking applicants for their posted job.
const getApplicationsByJob = async (req, res, next) => {
  try {
    const jobId = req.params.id;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Check if the recruiter owns this job
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view applications for this job listing',
      });
    }

    const applications = await Application.find({ jobId }).populate('candidateId', 'resumeUrl skills experience education location parsedResumeData').sort({ appliedAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    next(error);
  }
};

// Purpose:
// Fetches all applications submitted by the logged-in candidate.
//
// Input:
// req.user._id (logged-in candidate user ID).
//
// Output:
// Returns candidate applications populated with the job details (job title, salary, etc.).
//
// Usage:
// Used on the "My Applications" dashboard page for candidates.
const getUserApplications = async (req, res, next) => {
  try {
    // Retrieve applications and populate the associated 'jobId' properties
    const applications = await Application.find({ candidateId: req.user._id })
      .populate('jobId')
      .sort({ appliedAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      applications,
    });
  } catch (error) {
    next(error);
  }
};

// Purpose:
// Updates the review status of a candidate application (Under Review, Shortlisted, Rejected).
//
// Input:
// req.params.id (application ID) and req.body.status.
//
// Output:
// Returns the updated application document details.
//
// Usage:
// Triggered on the recruiter's dashboard when updating a candidate application.
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Under Review', 'Shortlisted', 'Rejected'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: Under Review, Shortlisted, or Rejected',
      });
    }

    // Check if application exists
    const applicationExists = await Application.findById(req.params.id);
    if (!applicationExists) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Check if the recruiter owns the job associated with this application
    const job = await Job.findById(applicationExists.jobId);
    if (!job || job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update application status for this job listing',
      });
    }

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Save Notification to Database for Candidate
    try {
      const notification = await Notification.create({
        recipient: application.candidateId,
        sender: req.user._id,
        type: 'status_change',
        title: 'Application Status Updated',
        message: `Your application status for "${job.title}" has been updated to "${status}"`,
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
      console.error('Failed to save or send socket notification to candidate:', err.message);
    }

    res.status(200).json({
      success: true,
      message: 'Application status updated successfully',
      application,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update application status (PATCH)
// @route   PATCH /api/applications/:id/status
// @access  Private (Recruiter only)
const updateApplicationStatusPatch = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Shortlisted', 'Accepted', 'Rejected'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be: Pending, Shortlisted, Accepted, or Rejected',
      });
    }

    const applicationExists = await Application.findById(req.params.id);
    if (!applicationExists) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    const job = await Job.findById(applicationExists.jobId);
    if (!job || job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update application status for this job listing',
      });
    }

    let mappedStatus = 'Under Review';
    if (status === 'Shortlisted') mappedStatus = 'Shortlisted';
    if (status === 'Accepted' || status === 'Rejected') mappedStatus = status;

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { 
        applicationStatus: status,
        status: mappedStatus
      },
      { new: true, runValidators: true }
    );

    // Save Notification to Database for Candidate
    try {
      let notifTitle = 'Application Status Updated';
      if (status === 'Accepted') notifTitle = 'Application Accepted';
      if (status === 'Rejected') notifTitle = 'Application Rejected';
      if (status === 'Shortlisted') notifTitle = 'Application Shortlisted';

      const notification = await Notification.create({
        recipient: application.candidateId,
        sender: req.user._id,
        type: 'status_change',
        title: notifTitle,
        message: `Your application status for "${job.title}" has been updated to "${status}"`,
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
      console.error('Failed to save or send socket notification to candidate:', err.message);
    }

    res.status(200).json({
      success: true,
      message: 'Application status updated successfully',
      application,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyJob,
  getApplicationsByJob,
  getUserApplications,
  updateApplicationStatus,
  updateApplicationStatusPatch,
};

