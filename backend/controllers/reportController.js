const asyncHandler = require('express-async-handler');
const Report = require('../models/Report');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const User = require('../models/User');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

// @desc    Create a new report
// @route   POST /api/reports
// @access  Private
const createReport = asyncHandler(async (req, res) => {
    const { reportedItem, itemType, reason } = req.body;

    if (!reportedItem || !itemType || !reason) {
        res.status(400);
        throw new Error('Please provide all required fields');
    }

    // Verify item exists
    let item;
    if (itemType === 'Post') {
        item = await Post.findById(reportedItem);
    } else if (itemType === 'Comment') {
        item = await Comment.findById(reportedItem);
    } else if (itemType === 'User') {
        item = await User.findById(reportedItem);
    }

    if (!item) {
        res.status(404);
        throw new Error('Reported item not found');
    }

    const report = await Report.create({
        reporter: req.user.id,
        reportedItem,
        itemType,
        reason
    });

    res.status(201).json(report);
});

// @desc    Get all reports (Admin only)
// @route   GET /api/reports
// @access  Private/Admin
const getReports = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { status, search, sort, reason } = req.query;

    let query = {};
    if (status && status !== 'all') {
        query.status = status;
    }

    if (reason && reason !== 'all') {
        query.reason = reason;
    }

    if (search) {
        query.$or = [
            { reason: { $regex: search, $options: 'i' } },
            { itemType: { $regex: search, $options: 'i' } }
        ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };

    const [reports, totalReports] = await Promise.all([
        Report.find(query)
            .populate('reporter', 'name email profilePicture')
            .sort(sortOption)
            .skip(skip)
            .limit(limit),
        Report.countDocuments(query)
    ]);

    // Deep populate reportedItem
    const populatedReports = await Report.populate(reports, {
        path: 'reportedItem'
    });

    // Manually populate user for Post/Comment types if needed
    for (let report of populatedReports) {
        if (report.reportedItem && (report.itemType === 'Post' || report.itemType === 'Comment')) {
            // Check if it's a Mongoose document and has a populate method
            if (typeof report.reportedItem.populate === 'function' && !report.reportedItem.user) {
                await report.reportedItem.populate('user', 'name email username profilePicture');
            }
        }
    }

    res.status(200).json({
        reports: populatedReports,
        page,
        totalPages: Math.ceil(totalReports / limit),
        totalReports
    });
});

// @desc    Update report status
// @route   PUT /api/reports/:id
// @access  Private/Admin
const updateReportStatus = asyncHandler(async (req, res) => {
    const report = await Report.findById(req.params.id);

    if (!report) {
        res.status(404);
        throw new Error('Report not found');
    }

    report.status = req.body.status || report.status;
    const updatedReport = await report.save();

    res.status(200).json(updatedReport);
});

// @desc    Delete reported item and resolve report
// @route   DELETE /api/reports/:id/item
// @access  Private/Admin
const deleteReportedItem = asyncHandler(async (req, res) => {
    const report = await Report.findById(req.params.id);

    if (!report) {
        res.status(404);
        throw new Error('Report not found');
    }

    // Delete the actual item with cascading logic
    if (report.itemType === 'Post') {
        const post = await Post.findById(report.reportedItem);
        if (post) {
            // Delete associated data
            await Comment.deleteMany({ post: post._id });
            await Notification.deleteMany({ post: post._id });

            // Audit Log
            await AuditLog.create({
                admin: req.user.id,
                targetUser: post.user,
                action: 'delete_post_via_report',
                targetId: post._id,
                targetType: 'Post',
                reason: `Post deleted via Report Resolution. Report ID: ${report._id}`
            });

            await Post.findByIdAndDelete(post._id);
        }
    } else if (report.itemType === 'Comment') {
        const comment = await Comment.findById(report.reportedItem);
        if (comment) {
            await Notification.deleteMany({ comment: comment._id }); // If notifications link to comments

            await AuditLog.create({
                admin: req.user.id,
                targetUser: comment.user,
                action: 'delete_comment_via_report',
                targetId: comment._id,
                targetType: 'Comment',
                reason: `Comment deleted via Report Resolution. Report ID: ${report._id}`
            });

            await Comment.findByIdAndDelete(comment._id);
        }
    } else if (report.itemType === 'User') {
        // Soft delete user logic or permanent? Per user rules, usually soft delete first.
        const user = await User.findById(report.reportedItem);
        if (user) {
            user.isDeletionPending = true;
            user.deletionDate = new Date();
            await user.save();

            await AuditLog.create({
                admin: req.user.id,
                targetUser: user._id,
                action: 'soft_delete_user_via_report',
                targetId: user._id,
                targetType: 'User',
                reason: `User marked for deletion via Report Resolution. Report ID: ${report._id}`
            });
        }
    }

    // Update ALL reports referencing this item to resolved
    await Report.updateMany(
        { reportedItem: report.reportedItem },
        { status: 'resolved' }
    );

    res.status(200).json({ success: true, message: 'Item deleted and report resolved' });
});

// @desc    Get report statistics
// @route   GET /api/reports/stats
// @access  Private/Admin
const getReportStats = asyncHandler(async (req, res) => {
    const [total, pending, resolved, dismissed] = await Promise.all([
        Report.countDocuments(),
        Report.countDocuments({ status: 'pending' }),
        Report.countDocuments({ status: 'resolved' }),
        Report.countDocuments({ status: 'dismissed' })
    ]);

    res.status(200).json({
        totalReports: total,
        pendingReports: pending,
        resolvedReports: resolved,
        dismissedReports: dismissed
    });
});

module.exports = {
    createReport,
    getReports,
    updateReportStatus,
    deleteReportedItem,
    getReportStats
};
