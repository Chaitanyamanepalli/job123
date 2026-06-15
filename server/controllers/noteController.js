// ====================================================
// Recruiter Note Controller
//
// This file handles CRUD operations related to recruiter candidate evaluation notes.
// Recruiters can save private comments and notes about candidate applicants.
//
// Features:
// - Fetch Notes for Application
// - Create Note (with Activity Logging)
// - Update Note
// - Delete Note
//
// Used by:
// - noteRoutes.js
// ====================================================

const RecruiterNote = require('../models/RecruiterNote');
const Application = require('../models/Application');
const ActivityLog = require('../models/ActivityLog');

// @desc    Get all notes for a specific candidate application
// @route   GET /api/notes/:applicationId
// @access  Private (Recruiter only)
const getNotes = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const recruiterId = req.user._id;

    // Verify application exists
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    const notes = await RecruiterNote.find({ applicationId, recruiterId })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: notes.length,
      notes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a candidate evaluation note
// @route   POST /api/notes
// @access  Private (Recruiter only)
const createNote = async (req, res, next) => {
  try {
    const { applicationId, note } = req.body;
    const recruiterId = req.user._id;

    if (!applicationId || !note) {
      return res.status(400).json({
        success: false,
        message: 'Application ID and note text are required',
      });
    }

    // Verify application exists
    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    const recruiterNote = await RecruiterNote.create({
      recruiterId,
      applicationId,
      note,
    });

    // Create Activity Log for Note Added
    try {
      await ActivityLog.create({
        recruiterId,
        action: `Added Note for ${application.name}`,
      });
    } catch (err) {
      console.error('Failed to log note creation activity:', err.message);
    }

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      note: recruiterNote,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Edit a candidate note
// @route   PUT /api/notes/:id
// @access  Private (Recruiter only)
const updateNote = async (req, res, next) => {
  try {
    const { note } = req.body;
    const recruiterId = req.user._id;

    if (!note) {
      return res.status(400).json({
        success: false,
        message: 'Note content is required',
      });
    }

    let recruiterNote = await RecruiterNote.findById(req.params.id);
    if (!recruiterNote) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    // Owner authorization guard
    if (recruiterNote.recruiterId.toString() !== recruiterId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit this note',
      });
    }

    recruiterNote = await RecruiterNote.findByIdAndUpdate(
      req.params.id,
      { note },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      note: recruiterNote,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a candidate note
// @route   DELETE /api/notes/:id
// @access  Private (Recruiter only)
const deleteNote = async (req, res, next) => {
  try {
    const recruiterId = req.user._id;

    const recruiterNote = await RecruiterNote.findById(req.params.id);
    if (!recruiterNote) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    // Owner authorization guard
    if (recruiterNote.recruiterId.toString() !== recruiterId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this note',
      });
    }

    await RecruiterNote.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotes,
  createNote,
  updateNote,
  deleteNote,
};
