// ====================================================
// ActivityLog Model (Database Schema)
//
// This file defines the structure of a Recruiter Activity Log record inside MongoDB.
// It tracks administrative and workflow actions performed by recruiters (e.g. scheduling interviews, shortlisting candidate, opening/closing job postings).
//
// Used by:
// - various controllers to record recruiter actions
// ====================================================

const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  // Reference to the Recruiter who performed the action
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Recruiter reference is required'],
  },
  // Description of the action (e.g. "Closed Frontend Developer job")
  action: {
    type: String,
    required: [true, 'Action description is required'],
    trim: true,
  },
  // Timestamp when the action took place
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
