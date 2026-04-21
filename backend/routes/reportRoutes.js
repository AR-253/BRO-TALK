const express = require('express');
const router = express.Router();
const { createReport, getReports, updateReportStatus, deleteReportedItem, getReportStats } = require('../controllers/reportController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createReport)
    .get(protect, admin, getReports);

router.get('/stats', protect, admin, getReportStats);

router.route('/:id')
    .put(protect, admin, updateReportStatus);

router.route('/:id/item')
    .delete(protect, admin, deleteReportedItem);

module.exports = router;
