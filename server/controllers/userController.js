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
// @route   POST /api/users/resume
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
    await user.save();

    // Trigger PDF parsing
    const parsedData = await parseResume(req.file.path);

    let autoFilled = {};
    if (parsedData) {
      // Automatically merge skills, experience, education if they were not already set,
      // or simply override/append them depending on preference.
      // Auto-filling the database as requested:
      if (parsedData.skills && parsedData.skills.length > 0) {
        // Merge without duplicates
        const existingSkills = user.skills || [];
        user.skills = [...new Set([...existingSkills, ...parsedData.skills])];
      }
      if (parsedData.experience && !user.experience) {
        user.experience = parsedData.experience;
      }
      if (parsedData.education && (!user.education || user.education === 'Not specified')) {
        user.education = parsedData.education;
      }
      if (parsedData.name && !user.fullName) {
        user.fullName = parsedData.name;
      }

      await user.save();
      autoFilled = parsedData;
    }

    // Return the updated user object and the auto-filled parsed text results
    res.status(200).json({
      success: true,
      message: 'Resume uploaded and parsed successfully',
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
        },
        autoFilled,
      },
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
