const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  deleteUser,
  deleteJobByAdmin,
  deleteApplicationByAdmin,
  getAllApplications,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.get('/users', protect, authorizeRoles('admin'), getAllUsers);
router.get('/applications', protect, authorizeRoles('admin'), getAllApplications);
router.delete('/users/:id', protect, authorizeRoles('admin'), deleteUser);
router.delete('/jobs/:id', protect, authorizeRoles('admin'), deleteJobByAdmin);
router.delete('/applications/:id', protect, authorizeRoles('admin'), deleteApplicationByAdmin);

module.exports = router;
