// ====================================================
// Job Model (Database Schema)
//
// This file defines the structure of a Job Posting record inside MongoDB.
// It stores all metadata about jobs created by Recruiters.
//
// Features:
// - Stores title, company name, location, salary, type, description, and experience.
// - Links the job to the recruiter who created it using 'postedBy' (ObjectId reference to User).
//
// Used by:
// - jobController.js (for creating, fetching, updating, and deleting jobs)
// ====================================================

const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema(
  {
    // The title of the job (e.g. "Software Engineer")
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    // The company posting the job (e.g. "Google")
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    // Location details (e.g. "San Francisco, CA" or "Remote")
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    // Annual salary in USD (e.g. 120000)
    salary: {
      type: Number,
      required: [true, 'Salary is required'],
    },
    // Type of job employment (Full Time, Remote, etc.)
    jobType: {
      type: String,
      required: [true, 'Job type is required'],
      enum: {
        values: ['Full Time', 'Part Time', 'Contract', 'Internship', 'Remote'],
        message: '{VALUE} is not a valid job type. Must be: Full Time, Part Time, Contract, Internship, or Remote',
      },
    },
    // Detailed description of the job (roles, responsibilities, and requirements)
    description: {
      type: String,
      required: [true, 'Job description is required'],
      trim: true,
    },
    // Years of experience required (e.g. "0-2 Yrs", "5+ Yrs")
    experience: {
      type: String,
      trim: true,
    },
    // Optional formatted salary text
    salaryRange: {
      type: String,
      trim: true,
    },
    // Logo image URL/identifier
    logo: {
      type: String,
      trim: true,
    },
    // Reference to the Recruiter (User) who posted this job
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recruiter owner is required'],
    },
  },
  {
    // Automatically sets 'createdAt' and 'updatedAt' fields
    timestamps: true,
  }
);

module.exports = mongoose.model('Job', JobSchema);

