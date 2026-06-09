const express = require('express');
const router = express.Router();
const { getNotifications, markNotificationsAsRead, clearAllNotifications } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getNotifications);
router.put('/read', protect, markNotificationsAsRead);
router.delete('/', protect, clearAllNotifications);

module.exports = router;
