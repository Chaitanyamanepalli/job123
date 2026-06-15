// ====================================================
// Interview Model (Database Schema)
//
// This file defines the structure of an Interview Schedule record inside MongoDB.
// It connects a Candidate's Application to the Recruiter conducting the interview.
//
// Features:
// - Stores interview date, time, mode (Online vs Offline), meeting link, remarks, and scheduling status.
//
// Used by:
// - interviewController.js
// ====================================================

const mongoose = require('mongoose');

const InterviewSchema = new mongoose.Schema(
  {
    // The candidate application associated with this interview
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: [true, 'Associated application is required'],
    },
    // The recruiter organizing/conducting the interview
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recruiter organizer is required'],
    },
    // The date of the interview
    date: {
      type: Date,
      required: [true, 'Interview date is required'],
    },
    // The time of the interview (e.g. "14:00")
    time: {
      type: String,
      required: [true, 'Interview time is required'],
      trim: true,
    },
    // Mode of the interview
    mode: {
      type: String,
      required: [true, 'Interview mode is required'],
      enum: {
        values: ['Online', 'Offline'],
        message: '{VALUE} is not a valid interview mode. Must be: Online or Offline',
      },
    },
    // Link for virtual meeting (Zoom/Google Meet/etc.)
    meetingLink: {
      type: String,
      trim: true,
    },
    // Private remarks/instructions from the recruiter
    remarks: {
      type: String,
      trim: true,
    },
    // Scheduling progress status
    status: {
      type: String,
      enum: ['Scheduled', 'Completed', 'Cancelled'],
      default: 'Scheduled',
    },
  },
  {
    // Automatically sets 'createdAt' and 'updatedAt' fields
    timestamps: true,
  }
);

module.exports = mongoose.model('Interview', InterviewSchema);
