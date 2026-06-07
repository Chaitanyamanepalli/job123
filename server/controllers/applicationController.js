const Application = require('../models/Application');
const Job = require('../models/Job');

// @desc    Apply for a job
// @route   POST /api/jobs/:id/apply
// @access  Public (Candidate)
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
    const alreadyApplied = await Application.findOne({ jobId, candidateId: req.user._id });
    if (alreadyApplied) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job',
      });
    }

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

// @desc    Get all applications for a specific job
// @route   GET /api/jobs/:id/applications
// @access  Public (Recruiter)
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

// @desc    Get applications of a candidate by email query
// @route   GET /api/applications/user
// @access  Public (Candidate)
const getUserApplications = async (req, res, next) => {
  try {
    // Retrieve applications for the authenticated candidate
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

// @desc    Update application status
// @route   PUT /api/applications/:id/status
// @access  Public (Recruiter)
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

