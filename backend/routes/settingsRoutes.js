const express = require('express');
const router = express.Router();
const { getBadWords, updateBadWords } = require('../controllers/settingsController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/badwords', protect, admin, getBadWords);
router.put('/badwords', protect, admin, updateBadWords);

module.exports = router;
