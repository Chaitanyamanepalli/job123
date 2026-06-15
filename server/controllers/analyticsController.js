// ====================================================
// Recruitment Analytics Controller
//
// This file handles backend calculations and aggregations for the Recruitment Analytics.
// It uses MongoDB aggregation pipelines to efficiently retrieve counts of total/active/closed jobs,
// counts of applicants per hiring stage, the top performing job listing, and charts datasets.
//
// Used by:
// - analyticsRoutes.js
// ====================================================

const Job = require('../models/Job');
const Application = require('../models/Application');

// @desc    Get recruitment analytics metrics and charts data
// @route   GET /api/analytics/recruiter
// @access  Private (Recruiter only)
const getRecruiterAnalytics = async (req, res, next) => {
  try {
    const recruiterId = req.user._id;

    // 1. Get all jobs posted by the recruiter
    const jobs = await Job.find({ postedBy: recruiterId });
    const jobIds = jobs.map(j => j._id);

    const totalJobs = jobs.length;
    const activeJobs = jobs.filter(j => j.jobStatus !== 'Closed').length;
    const closedJobs = jobs.filter(j => j.jobStatus === 'Closed').length;

    // Default status count mapping
    const statusCounts = {
      'Applied': 0,
      'Under Review': 0,
      'Shortlisted': 0,
      'Interview Scheduled': 0,
      'Rejected': 0,
      'Hired': 0,
    };

    let totalApplicants = 0;

    if (jobIds.length > 0) {
      // 2. Aggregate Applications by status
      const appStats = await Application.aggregate([
        { $match: { jobId: { $in: jobIds } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);

      appStats.forEach(stat => {
        const statusName = stat._id || 'Applied';
        if (statusCounts.hasOwnProperty(statusName)) {
          statusCounts[statusName] = stat.count;
        }
        totalApplicants += stat.count;
      });
    }

    // 3. Applications per Job (for Recharts Bar Chart)
    const appsPerJobData = [];
    let topPerformingJob = null;
    let maxApps = 0;

    if (jobIds.length > 0) {
      const appsPerJob = await Application.aggregate([
        { $match: { jobId: { $in: jobIds } } },
        { $group: { _id: '$jobId', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      appsPerJob.forEach(item => {
        const jobObj = jobs.find(j => j._id.toString() === item._id.toString());
        if (jobObj) {
          appsPerJobData.push({
            name: jobObj.title.length > 15 ? `${jobObj.title.substring(0, 15)}...` : jobObj.title,
            applications: item.count,
          });

          if (item.count > maxApps) {
            maxApps = item.count;
            topPerformingJob = {
              title: jobObj.title,
              applications: item.count,
            };
          }
        }
      });
    }

    // 4. Hiring Funnel Stages data (for Recharts Funnel/Bar Chart)
    const hiringFunnel = [
      { name: 'Applied', value: statusCounts['Applied'] },
      { name: 'Under Review', value: statusCounts['Under Review'] },
      { name: 'Shortlisted', value: statusCounts['Shortlisted'] },
      { name: 'Interview Scheduled', value: statusCounts['Interview Scheduled'] },
      { name: 'Hired', value: statusCounts['Hired'] },
    ];

    res.status(200).json({
      success: true,
      data: {
        cards: {
          totalJobs,
          activeJobs,
          closedJobs,
          totalApplicants,
          shortlisted: statusCounts['Shortlisted'],
          rejected: statusCounts['Rejected'],
          hired: statusCounts['Hired'],
        },
        topPerformingJob,
        charts: {
          appsPerJob: appsPerJobData,
          hiringFunnel,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRecruiterAnalytics,
};
