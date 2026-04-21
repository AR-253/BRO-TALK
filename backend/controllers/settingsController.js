const asyncHandler = require('express-async-handler');
const Settings = require('../models/Settings');

// @desc    Get bad words
// @route   GET /api/settings/badwords
// @access  Private/Admin
const getBadWords = asyncHandler(async (req, res) => {
    let settings = await Settings.findOne();
    if (!settings) {
        settings = await Settings.create({});
    }
    res.status(200).json({ badWords: settings.badWords });
});

// @desc    Update bad words
// @route   PUT /api/settings/badwords
// @access  Private/Admin
const updateBadWords = asyncHandler(async (req, res) => {
    const { badWords } = req.body;
    let settings = await Settings.findOne();
    if (!settings) {
        settings = await Settings.create({});
    }
    settings.badWords = Array.isArray(badWords) ? badWords : [];
    await settings.save();
    res.status(200).json({ badWords: settings.badWords });
});

module.exports = { getBadWords, updateBadWords };
