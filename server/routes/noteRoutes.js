// ====================================================
// Recruiter Note Routes Configuration
//
// This file registers API endpoints related to candidate evaluation notes.
//
// Endpoints:
// - GET    /api/notes/:applicationId -> Fetch notes for application (protected, recruiter-only)
// - POST   /api/notes                -> Create candidate note (protected, recruiter-only)
// - PUT    /api/notes/:id            -> Edit note (protected, recruiter-only)
// - DELETE /api/notes/:id            -> Delete note (protected, recruiter-only)
//
// Used by:
// - server.js (mounted at /api/notes)
// ====================================================

const express = require('express');
const router = express.Router();
const { getNotes, createNote, updateNote, deleteNote } = require('../controllers/noteController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/:applicationId', protect, authorizeRoles('recruiter'), getNotes);
router.post('/', protect, authorizeRoles('recruiter'), createNote);
router.put('/:id', protect, authorizeRoles('recruiter'), updateNote);
router.delete('/:id', protect, authorizeRoles('recruiter'), deleteNote);

module.exports = router;
