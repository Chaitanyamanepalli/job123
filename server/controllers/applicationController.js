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

    // Check if job is Closed
    if (job.jobStatus === 'Closed') {
      return res.status(400).json({
        success: false,
        message: 'Applications Closed for this job posting',
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

    // Notify Recruiter via Email (non-blocking background task)
    const recruiter = await User.findById(job.postedBy);
    if (recruiter && recruiter.email) {
      const appDate = new Date().toLocaleDateString();
      sendEmail({
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
      }).catch(err => {
        console.error('Failed to send email alert to recruiter:', err.message);
      });
    }

    // Notify Candidate via Email (non-blocking background task)
    if (application.email) {
      const appDate = new Date().toLocaleDateString();
      sendEmail({
        to: application.email,
        subject: `Application Confirmed: ${job.title} at ${job.company}`,
        text: `Hello ${application.name},\n\nThis is to confirm that you have successfully applied for the position of ${job.title} at ${job.company}.\n\nApplication Details:\nJob Title: ${job.title}\nCompany: ${job.company}\nApplication Date: ${appDate}\n\nYou can view and track your applications in the Candidate Dashboard.\n\nRegards,\nJobPortal Pro Team`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 8px;">
            <h2 style="color: #10b981; border-bottom: 1px solid #eee; padding-bottom: 10px;">Application Confirmed!</h2>
            <p>Hello <strong>${application.name}</strong>,</p>
            <p>Thank you for applying. This email confirms that we have successfully received your job application for the post of <strong>${job.title}</strong> at <strong>${job.company}</strong>.</p>
            <h3 style="color: #059669; margin-top: 20px;">Application Summary</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; width: 30%;">Job Title:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${job.title}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Company:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${job.company}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold;">Applied On:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${appDate}</td>
              </tr>
            </table>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/my-applications" style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Track Application</a>
            </div>
            <p style="font-size: 0.9em; color: #666; border-top: 1px solid #eee; padding-top: 15px; margin-top: 20px;">
              We have notified the recruiter. You will receive updates via email or notifications as the recruiter reviews your application.<br /><br />
              Regards,<br />
              <strong>JobPortal Pro Team</strong>
            </p>
          </div>
        `
      }).catch(err => {
        console.error('Failed to send email confirmation to candidate:', err.message);
      });
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
    const validStatuses = ['Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Rejected', 'Hired'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: Applied, Under Review, Shortlisted, Interview Scheduled, Rejected, Hired',
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
      { status, applicationStatus: status },
      { new: true, runValidators: true }
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Create Activity Log
    const ActivityLog = require('../models/ActivityLog');
    try {
      let logAction = `${status} ${application.name}`;
      await ActivityLog.create({
        recruiterId: req.user._id,
        action: logAction,
      });
    } catch (err) {
      console.error('Failed to log status update activity:', err.message);
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
    const validStatuses = ['Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Rejected', 'Hired'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: Applied, Under Review, Shortlisted, Interview Scheduled, Rejected, Hired',
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

    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { 
        applicationStatus: status,
        status: status
      },
      { new: true, runValidators: true }
    );

    // Create Activity Log
    const ActivityLog = require('../models/ActivityLog');
    try {
      let logAction = `${status} ${application.name}`;
      await ActivityLog.create({
        recruiterId: req.user._id,
        action: logAction,
      });
    } catch (err) {
      console.error('Failed to log status update activity:', err.message);
    }

    // Save Notification to Database for Candidate
    try {
      let notifTitle = 'Application Status Updated';
      if (status === 'Shortlisted') notifTitle = 'Application Shortlisted';
      if (status === 'Rejected') notifTitle = 'Application Rejected';
      if (status === 'Hired') notifTitle = 'Application Accepted'; // backward compatibility

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

// @desc    Search & Filter applicants
// @route   GET /api/applications/search
// @access  Private (Recruiter only)
const searchApplications = async (req, res, next) => {
  try {
    const { keyword, status, jobId } = req.query;

    // Get all jobs posted by this recruiter to secure data access
    const jobs = await Job.find({ postedBy: req.user._id });
    const jobIds = jobs.map(job => job._id);

    const query = { jobId: { $in: jobIds } };

    if (jobId) {
      if (jobIds.map(id => id.toString()).includes(jobId.toString())) {
        query.jobId = jobId;
      } else {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view applicants for this job',
        });
      }
    }

    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { email: { $regex: keyword, $options: 'i' } },
      ];
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    const applications = await Application.find(query)
      .populate('jobId', 'title company')
      .populate('candidateId', 'resumeUrl skills experience education location parsedResumeData')
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

// @desc    Bulk update applications status
// @route   PATCH /api/applications/bulk-update
// @access  Private (Recruiter only)
const bulkUpdateApplications = async (req, res, next) => {
  try {
    const { applicationIds, status } = req.body;
    const validStatuses = ['Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Rejected', 'Hired'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: Applied, Under Review, Shortlisted, Interview Scheduled, Rejected, Hired',
      });
    }

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'applicationIds array is required',
      });
    }

    // Get all recruiter's jobs to verify ownership
    const recruiterJobs = await Job.find({ postedBy: req.user._id });
    const jobIds = recruiterJobs.map(job => job._id.toString());

    // Find targets and verify ownership
    const apps = await Application.find({ _id: { $in: applicationIds } });
    const invalidApps = apps.filter(app => !jobIds.includes(app.jobId.toString()));

    if (invalidApps.length > 0) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update some of the selected applications',
      });
    }

    // Update all applications
    await Application.updateMany(
      { _id: { $in: applicationIds } },
      { status, applicationStatus: status }
    );

    // Activity Logging & Notifications for each
    const ActivityLog = require('../models/ActivityLog');
    const Notification = require('../models/Notification');
    const { sendEventToUser } = require('../config/socket');

    for (const app of apps) {
      try {
        // Log activity
        await ActivityLog.create({
          recruiterId: req.user._id,
          action: `${status} ${app.name}`,
        });

        // Log candidate notification
        const jobObj = recruiterJobs.find(j => j._id.toString() === app.jobId.toString());
        const jobTitle = jobObj ? jobObj.title : 'Job';
        
        const notification = await Notification.create({
          recipient: app.candidateId,
          sender: req.user._id,
          type: 'status_change',
          title: 'Application Status Updated',
          message: `Your application status for "${jobTitle}" has been updated to "${status}"`,
        });

        sendEventToUser(app.candidateId, 'notification', {
          _id: notification._id,
          type: 'status_change',
          title: notification.title,
          message: notification.message,
          isRead: false,
          createdAt: notification.createdAt,
        });
      } catch (logErr) {
        console.error('Failed to log bulk activity/notify for app:', app._id, logErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully updated ${apps.length} applications to "${status}"`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export candidate data to CSV
// @route   GET /api/applications/export
// @access  Private (Recruiter only)
const exportApplications = async (req, res, next) => {
  try {
    const { jobId } = req.query;

    // Get recruiter's jobs to verify access
    const jobs = await Job.find({ postedBy: req.user._id });
    const jobIds = jobs.map(j => j._id.toString());

    const query = { jobId: { $in: jobIds } };
    if (jobId) {
      if (jobIds.includes(jobId.toString())) {
        query.jobId = jobId;
      } else {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to export applicants for this job',
        });
      }
    }

    const applications = await Application.find(query)
      .populate('jobId', 'title')
      .sort({ appliedAt: -1 });

    // Generate CSV content
    let csv = 'Name,Email,Phone,Applied Date,Status,Job Title\n';
    applications.forEach(app => {
      const cleanName = (app.name || '').replace(/"/g, '""');
      const cleanEmail = (app.email || '').replace(/"/g, '""');
      const cleanPhone = (app.phone || '').replace(/"/g, '""');
      const cleanStatus = (app.status || 'Applied').replace(/"/g, '""');
      const cleanJobTitle = (app.jobId?.title || 'Unknown').replace(/"/g, '""');
      const formattedDate = new Date(app.appliedAt).toLocaleDateString();

      csv += `"${cleanName}","${cleanEmail}","${cleanPhone}","${formattedDate}","${cleanStatus}","${cleanJobTitle}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=applicants.csv');
    res.status(200).send(csv);
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
  searchApplications,
  bulkUpdateApplications,
  exportApplications,
};

