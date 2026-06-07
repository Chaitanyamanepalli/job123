const Job = require('../models/Job');
const Application = require('../models/Application');

// @desc    Get all jobs with search, filtering, sorting, and pagination
// @route   GET /api/jobs
// @access  Public
const getJobs = async (req, res, next) => {
  try {
    const { search, location, jobType, experience, sort, page = 1, limit = 6, myJobs } = req.query;

    const query = {};

    // Handle optional auth for recruiter's own jobs on dashboard
    if (myJobs === 'true') {
      let token;
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
        try {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey123');
          query.postedBy = decoded.id;
        } catch (err) {
          console.error('getJobs auth verify error:', err.message);
        }
      }
    }

    // Real-time Search by Job Title, Company Name, or Location
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    // Explicit Location Filter
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Filter by Job Type (supports comma-separated list)
    if (jobType && jobType !== 'All' && jobType !== 'All Types') {
      const types = jobType.split(',');
      query.jobType = { $in: types };
    }

    // Filter by Experience Level (supports comma-separated list)
    if (experience && experience !== 'All' && experience !== 'All Levels') {
      const expLevels = experience.split(',');
      const regexPatterns = [];
      expLevels.forEach(level => {
        if (level === 'Fresher') {
          regexPatterns.push('0-2 Yrs', 'Fresher');
        } else if (level === '1-3 Years') {
          regexPatterns.push('1-3 Yrs', '0-2 Yrs', '2-4 Yrs');
        } else if (level === '3-5 Years') {
          regexPatterns.push('3-5 Yrs', '2-4 Yrs');
        } else if (level === '5+ Years') {
          regexPatterns.push('5+ Yrs', '5 Yrs');
        }
      });
      if (regexPatterns.length > 0) {
        query.experience = { $in: regexPatterns.map(p => new RegExp(p, 'i')) };
      }
    }


    // Pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Sorting
    let sortOptions = { createdAt: -1 }; // Default: Latest
    if (sort) {
      switch (sort) {
        case 'Oldest':
          sortOptions = { createdAt: 1 };
          break;
        case 'Salary Low To High':
          sortOptions = { salary: 1 };
          break;
        case 'Salary High To Low':
          sortOptions = { salary: -1 };
          break;
        case 'Alphabetical':
          sortOptions = { title: 1 };
          break;
        case 'Latest':
        default:
          sortOptions = { createdAt: -1 };
          break;
      }
    }

    const totalJobs = await Job.countDocuments(query);
    const jobs = await Job.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: jobs.length,
      totalJobs,
      totalPages: Math.ceil(totalJobs / limitNum),
      currentPage: pageNum,
      jobs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single job's details
// @route   GET /api/jobs/:id
// @access  Public
const getJobById = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }
    res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new job post
// @route   POST /api/jobs
// @access  Public (Recruiter)
const createJob = async (req, res, next) => {
  try {
    const { title, company, location, salary, jobType, description, experience, salaryRange, logo } = req.body;

    const job = await Job.create({
      title,
      company,
      location,
      salary,
      jobType,
      description,
      experience,
      salaryRange,
      logo,
      postedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      job,
    });
  } catch (error) {
    next(error);
  }
};


// @desc    Update a job post
// @route   PUT /api/jobs/:id
// @access  Public (Recruiter)
const updateJob = async (req, res, next) => {
  try {
    let job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Check if the logged in recruiter posted the job
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this job listing',
      });
    }

    job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      job,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a job post & cascade delete applications
// @route   DELETE /api/jobs/:id
// @access  Public (Recruiter)
const deleteJob = async (req, res, next) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Check if the logged in recruiter posted the job
    if (job.postedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this job listing',
      });
    }

    // Cascade delete associated applications
    await Application.deleteMany({ jobId: req.params.id });

    // Delete the job itself
    await Job.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Job and associated applications deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
};
