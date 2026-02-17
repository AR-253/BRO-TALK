const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ recipient: req.user.id })
        .sort({ createdAt: -1 })
        .populate('sender', 'name')
        .populate('post', 'content') // Populate post snippet if needed
        .populate('comment', 'content');

    res.status(200).json(notifications);
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
        res.status(404);
        throw new Error('Notification not found');
    }

    // Ensure recipient owns the notification
    if (notification.recipient.toString() !== req.user.id) {
        res.status(401);
        throw new Error('Not authorized');
    }

    notification.read = true;
    await notification.save();

    res.status(200).json(notification);
});

module.exports = {
    getNotifications,
    markAsRead
};
