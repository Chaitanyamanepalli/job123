// ====================================================
// Application Model (Database Schema)
//
// This file defines the structure of a Job Application record inside MongoDB.
// It tracks when a Candidate applies for a specific Job posting.
//
// Features:
// - Stores candidate contact details (name, email, phone) filled during job application.
// - Links the application to the job using 'jobId' (reference to Job model).
// - Links the application to the candidate using 'candidateId' (reference to User model).
// - Tracks the review status of the application ('Under Review', 'Shortlisted', 'Rejected').
//
// Used by:
// - applicationController.js (to apply for jobs, get applicant lists, update status)
// ====================================================

const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  // The name of the applicant (e.g. "Jane Doe")
  name: {
    type: String,
    required: [true, 'Candidate name is required'],
    trim: true,
  },
  // The applicant's email address
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
  },
  // The applicant's contact number
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
  },
  // Reference to the Job listing the candidate applied for
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: [true, 'Associated job is required'],
  },
  // Reference to the User (Candidate) who submitted the application
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Associated candidate is required'],
  },
  // Date and time the application was submitted
  appliedAt: {
    type: Date,
    default: Date.now,
  },
  // Progress status of the application (can be updated by the recruiter)
  status: {
    type: String,
    enum: ['Under Review', 'Shortlisted', 'Rejected'],
    default: 'Under Review',
  },
  resumeUrl: {
    type: String,
  },
  applicationStatus: {
    type: String,
    enum: ['Pending', 'Shortlisted', 'Accepted', 'Rejected'],
    default: 'Pending',
  },
});

module.exports = mongoose.model('Application', ApplicationSchema);

