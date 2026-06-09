const Notification = require('../models/Notification');

// @desc    Get all notifications for logged in user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'fullName')
      .sort({ createdAt: -1 })
      .limit(20);

    res.status(200).json({
      success: true,
      message: 'Notifications retrieved successfully',
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read
// @access  Private
const markNotificationsAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });

    res.status(200).json({
      success: true,
      message: 'Notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear all notifications
// @route   DELETE /api/notifications
// @access  Private
const clearAllNotifications = async (req, res, next) => {
  try {
    await Notification.deleteMany({ recipient: req.user._id });

    res.status(200).json({
      success: true,
      message: 'All notifications cleared successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markNotificationsAsRead,
  clearAllNotifications,
};
