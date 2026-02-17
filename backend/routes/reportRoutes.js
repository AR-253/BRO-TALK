const express = require('express');
const router = express.Router();
const { createReport, getReports, updateReportStatus } = require('../controllers/reportController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createReport)
    .get(protect, admin, getReports);

router.route('/:id')
    .put(protect, admin, updateReportStatus);

module.exports = router;
