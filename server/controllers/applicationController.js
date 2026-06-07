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
    });

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

    const applications = await Application.find({ jobId }).sort({ appliedAt: -1 });

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
};

