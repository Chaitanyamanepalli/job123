const User = require('../models/User');
const Job = require('../models/Job');
const { parseResume } = require('../utils/resumeParser');
const path = require('path');

// @desc    Get Saved Jobs
// @route   GET /api/users/saved-jobs
// @access  Private (Candidate only)
const getSavedJobs = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('savedJobs');
    
    res.status(200).json({
      success: true,
      message: 'Saved jobs retrieved successfully',
      data: user.savedJobs || [],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update Candidate Profile
// @route   PUT /api/users/profile
// @access  Private (Candidate only)
const updateProfile = async (req, res, next) => {
  try {
    const { skills, experience, location, education, fullName } = req.body;

    const updateFields = {};
    if (fullName) updateFields.fullName = fullName;
    if (skills) {
      updateFields.skills = Array.isArray(skills) 
        ? skills 
        : skills.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (experience !== undefined) updateFields.experience = experience;
    if (location !== undefined) updateFields.location = location;
    if (education !== undefined) updateFields.education = education;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload and Parse PDF Resume
// @route   POST /api/profile/upload-resume
// @access  Private (Candidate only)
const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a PDF resume file',
      });
    }

    // Save resume URL path relative to the server URL
    const resumeUrl = `/uploads/resumes/${req.file.filename}`;

    // Update DB with the resume URL first
    let user = await User.findById(req.user._id);
    user.resumeUrl = resumeUrl;

    // Trigger PDF parsing
    let parsedData = {
      name: '',
      skills: [],
      experience: 'Fresher',
      education: 'Not specified'
    };

    try {
      const result = await parseResume(req.file.path);
      if (result) {
        parsedData = {
          name: result.name || '',
          skills: result.skills || [],
          experience: result.experience || 'Fresher',
          education: result.education || 'Not specified'
        };
      }
    } catch (parseErr) {
      console.error('PDF resume parsing failed:', parseErr.message);
    }

    // Persist parsed raw data in DB
    user.parsedResumeData = parsedData;
    await user.save();

    // Return the user object and the auto-filled parsed text results for candidate verification
    res.status(200).json({
      success: true,
      resumeUrl: user.resumeUrl,
      parsedData,
      data: {
        user: {
          _id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          skills: user.skills,
          experience: user.experience,
          location: user.location,
          education: user.education,
          resumeUrl: user.resumeUrl,
          parsedResumeData: user.parsedResumeData
        },
        parsedData
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSavedJobs,
  updateProfile,
  uploadResume,
};
