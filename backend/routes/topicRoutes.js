const express = require('express');
const router = express.Router();
const {
    createTopic,
    getTopics,
    updateTopic,
    deleteTopic,
    toggleJoinTopic,
    getTopicById
} = require('../controllers/topicController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(getTopics)
    .post(protect, createTopic);

router.route('/:id')
    .get(getTopicById)
    .put(protect, admin, updateTopic)
    .delete(protect, admin, deleteTopic);

router.route('/:id/subscribe').put(protect, toggleJoinTopic);

module.exports = router;
