// ====================================================
// RecruiterNote Model (Database Schema)
//
// This file defines the structure of a Recruiter Candidate Note record inside MongoDB.
// It stores private evaluation and feedback notes created by recruiters about a specific candidate application.
//
// Features:
// - Links a note to a recruiter (User) and the target application (Application).
//
// Used by:
// - noteController.js
// ====================================================

const mongoose = require('mongoose');

const RecruiterNoteSchema = new mongoose.Schema(
  {
    // The recruiter who wrote this note
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recruiter author is required'],
    },
    // The candidate application this note pertains to
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: [true, 'Associated application is required'],
    },
    // The note content text
    note: {
      type: String,
      required: [true, 'Note text is required'],
      trim: true,
    },
  },
  {
    // Automatically sets 'createdAt' and 'updatedAt' fields
    timestamps: true,
  }
);

module.exports = mongoose.model('RecruiterNote', RecruiterNoteSchema);
