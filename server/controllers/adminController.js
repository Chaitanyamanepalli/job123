const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');

// @desc    Get all users on the platform
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'All users retrieved successfully',
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a user and cascade delete their data
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
const deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Don't allow an admin to delete themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Admins cannot delete their own account',
      });
    }

    if (user.role === 'recruiter') {
      // Find recruiter's jobs
      const jobs = await Job.find({ postedBy: userId });
      const jobIds = jobs.map(j => j._id);

      // Cascade delete applications for their jobs
      await Application.deleteMany({ jobId: { $in: jobIds } });

      // Delete the jobs
      await Job.deleteMany({ postedBy: userId });
    } else if (user.role === 'candidate') {
      // Delete user's applications
      await Application.deleteMany({ candidateId: userId });
    }

    // Delete the user itself
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'User and associated data deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a job listing and its applications
// @route   DELETE /api/admin/jobs/:id
// @access  Private (Admin only)
const deleteJobByAdmin = async (req, res, next) => {
  try {
    const jobId = req.params.id;
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job listing not found',
      });
    }

    // Cascade delete applications
    await Application.deleteMany({ jobId });

    // Delete job
    await Job.findByIdAndDelete(jobId);

    res.status(200).json({
      success: true,
      message: 'Job and associated applications deleted successfully by Admin',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a single job application record
// @route   DELETE /api/admin/applications/:id
// @access  Private (Admin only)
const deleteApplicationByAdmin = async (req, res, next) => {
  try {
    const appId = req.params.id;
    const application = await Application.findById(appId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    await Application.findByIdAndDelete(appId);

    res.status(200).json({
      success: true,
      message: 'Application deleted successfully by Admin',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all applications
// @route   GET /api/admin/applications
// @access  Private (Admin only)
const getAllApplications = async (req, res, next) => {
  try {
    const applications = await Application.find()
      .populate('jobId', 'title company')
      .populate('candidateId', 'fullName email')
      .sort({ appliedAt: -1 });

    res.status(200).json({
      success: true,
      message: 'All applications retrieved successfully',
      data: applications,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  deleteUser,
  deleteJobByAdmin,
  deleteApplicationByAdmin,
  getAllApplications,
};
