const asyncHandler = require('express-async-handler');
const Topic = require('../models/Topic');

// @desc    Get all topics
// @route   GET /api/topics
// @access  Public
const getTopics = asyncHandler(async (req, res) => {
    const topics = await Topic.aggregate([
        { $match: { isActive: true } },
        {
            $lookup: {
                from: 'posts',
                localField: '_id',
                foreignField: 'topic',
                as: 'posts'
            }
        },
        {
            $addFields: {
                postCount: { $size: '$posts' }
            }
        },
        {
            $project: {
                posts: 0
            }
        },
        { $sort: { postCount: -1 } }
    ]);
    res.status(200).json(topics);
});

// @desc    Get single topic
// @route   GET /api/topics/:id
// @access  Public
const getTopicById = asyncHandler(async (req, res) => {
    const topic = await Topic.findById(req.params.id);

    if (!topic) {
        res.status(404);
        throw new Error('Topic not found');
    }

    res.status(200).json(topic);
});

// @desc    Create a topic
// @route   POST /api/topics
// @access  Private/Admin
const createTopic = asyncHandler(async (req, res) => {
    if (!req.body.title || !req.body.description) {
        res.status(400);
        throw new Error('Please add title and description');
    }

    const topicExists = await Topic.findOne({ title: req.body.title });
    if (topicExists) {
        res.status(400);
        throw new Error('Topic already exists');
    }

    const topic = await Topic.create({
        title: req.body.title,
        description: req.body.description,
        createdBy: req.user.id
    });

    res.status(201).json(topic);
});

// @desc    Update a topic
// @route   PUT /api/topics/:id
// @access  Private/Admin
const updateTopic = asyncHandler(async (req, res) => {
    const topic = await Topic.findById(req.params.id);

    if (!topic) {
        res.status(404);
        throw new Error('Topic not found');
    }

    const updatedTopic = await Topic.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
    });

    res.status(200).json(updatedTopic);
});

// @desc    Delete a topic
// @route   DELETE /api/topics/:id
// @access  Private/Admin
const deleteTopic = asyncHandler(async (req, res) => {
    const topic = await Topic.findById(req.params.id);

    if (!topic) {
        res.status(404);
        throw new Error('Topic not found');
    }

    // Check if user is the creator or an admin
    if (topic.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
        res.status(401);
        throw new Error('User not authorized to delete this group');
    }

    await topic.deleteOne();

    res.status(200).json({ id: req.params.id });
});

// @desc    Join or leave a topic
// @route   PUT /api/topics/:id/subscribe
// @access  Private
const toggleJoinTopic = asyncHandler(async (req, res) => {
    const topic = await Topic.findById(req.params.id);

    if (!topic) {
        res.status(404);
        throw new Error('Topic not found');
    }

    // Check if user is already a subscriber
    if (topic.subscribers.includes(req.user.id)) {
        // Unsubscribe (Leave)
        topic.subscribers = topic.subscribers.filter(
            (subscriberId) => subscriberId.toString() !== req.user.id
        );
        await topic.save();
        res.status(200).json({ message: 'Left topic', subscribers: topic.subscribers });
    } else {
        // Subscribe (Join)
        topic.subscribers.push(req.user.id);
        await topic.save();
        res.status(200).json({ message: 'Joined topic', subscribers: topic.subscribers });
    }
});

module.exports = {
    getTopics,
    getTopicById,
    createTopic,
    updateTopic,
    deleteTopic,
    toggleJoinTopic,
};
