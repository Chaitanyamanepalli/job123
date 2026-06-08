const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');

// @desc    Get Recruiter Dashboard Stats
// @route   GET /api/dashboard/recruiter
// @access  Private (Recruiter only)
const getRecruiterStats = async (req, res, next) => {
  try {
    const recruiterId = req.user._id;

    // 1. Total Jobs Posted by this Recruiter
    const jobs = await Job.find({ postedBy: recruiterId });
    const jobsPosted = jobs.length;
    const jobIds = jobs.map(job => job._id);

    // 2. Total Applications Received for these jobs
    const applicationsReceived = await Application.countDocuments({ jobId: { $in: jobIds } });

    // 3. Most Applied Job
    let mostAppliedJob = null;
    if (jobsPosted > 0) {
      const appAggregation = await Application.aggregate([
        { $match: { jobId: { $in: jobIds } } },
        { $group: { _id: '$jobId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 }
      ]);

      if (appAggregation.length > 0) {
        const topJob = await Job.findById(appAggregation[0]._id);
        if (topJob) {
          mostAppliedJob = {
            title: topJob.title,
            company: topJob.company,
            count: appAggregation[0].count,
          };
        }
      }
    }

    // 4. Recent Applications
    const recentApplications = await Application.find({ jobId: { $in: jobIds } })
      .populate('jobId', 'title company location')
      .sort({ appliedAt: -1 })
      .limit(5);

    // 5. Recent Job Posts
    const recentJobs = await Job.find({ postedBy: recruiterId })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      message: 'Recruiter stats fetched successfully',
      data: {
        jobsPosted,
        applicationsReceived,
        mostAppliedJob,
        recentApplications,
        recentJobs
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Candidate Dashboard Stats
// @route   GET /api/dashboard/candidate
// @access  Private (Candidate only)
const getCandidateStats = async (req, res, next) => {
  try {
    const candidateId = req.user._id;

    // 1. Applied Jobs Count
    const appliedJobsCount = await Application.countDocuments({ candidateId });

    // 2. Saved Jobs Count
    const user = await User.findById(candidateId).populate('savedJobs');
    const savedJobsCount = user.savedJobs ? user.savedJobs.length : 0;

    // 3. Recently Applied Jobs
    const recentlyAppliedJobs = await Application.find({ candidateId })
      .populate('jobId')
      .sort({ appliedAt: -1 })
      .limit(5);

    // 4. Profile Completion Percentage
    let score = 0;
    if (user.fullName) score += 15;
    if (user.email) score += 15;
    if (user.skills && user.skills.length > 0) score += 20;
    if (user.experience) score += 20;
    if (user.location) score += 10;
    if (user.education) score += 10;
    if (user.resumeUrl) score += 10;

    res.status(200).json({
      success: true,
      message: 'Candidate stats fetched successfully',
      data: {
        appliedJobsCount,
        savedJobsCount,
        recentlyAppliedJobs,
        profileCompletionPercentage: score
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Admin Dashboard Stats
// @route   GET /api/dashboard/admin
// @access  Private (Admin only)
const getAdminStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalRecruiters = await User.countDocuments({ role: 'recruiter' });
    const totalCandidates = await User.countDocuments({ role: 'candidate' });
    const totalJobs = await Job.countDocuments();
    const totalApplications = await Application.countDocuments();

    res.status(200).json({
      success: true,
      message: 'Admin stats fetched successfully',
      data: {
        totalUsers,
        totalRecruiters,
        totalCandidates,
        totalJobs,
        totalApplications
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecruiterStats,
  getCandidateStats,
  getAdminStats
};
