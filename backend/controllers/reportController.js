const asyncHandler = require('express-async-handler');
const Report = require('../models/Report');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

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
    const reports = await Report.find()
        .populate('reporter', 'name email')
        .sort({ createdAt: -1 });

    // Attempt to populate reportedItem manually or using populate if refPath works well directly.
    // Since refPath is used, mongoose should handle it if we populate 'reportedItem'.
    // However, we might want to populate specific fields.
    const populatedReports = await Report.populate(reports, { path: 'reportedItem' });

    res.status(200).json(populatedReports);
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

module.exports = {
    createReport,
    getReports,
    updateReportStatus
};
