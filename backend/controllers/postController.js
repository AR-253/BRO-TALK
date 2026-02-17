const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Post = require('../models/Post');
const Topic = require('../models/Topic');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Helper to extract mentions
const extractMentions = (content) => {
    const regex = /@(\w+)/g;
    const mentions = [];
    let match;
    while ((match = regex.exec(content)) !== null) {
        mentions.push(match[1]);
    }
    return mentions;
};

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
const getPosts = asyncHandler(async (req, res) => {
    const posts = await Post.find({})
        .populate('user', 'name profilePicture')
        .populate('topic', 'title')
        .sort({ createdAt: -1 });

    const formattedPosts = posts.map(post => {
        const postObj = post.toObject();
        if (post.isAnonymous) {
            postObj.user = { _id: null, name: 'Anonymous Bro' };
        }
        return {
            ...postObj,
            commentsCount: post.comments?.length || 0,
            reactionsCount: post.reactions?.length || 0
        };
    });

    res.status(200).json(formattedPosts);
});

// @desc    Get posts by topic
// @route   GET /api/posts/topic/:topicId
// @access  Public
const getPostsByTopic = asyncHandler(async (req, res) => {
    const posts = await Post.find({ topic: req.params.topicId })
        .populate('user', 'name profilePicture')
        .populate('topic', 'title')
        .sort({ createdAt: -1 });

    // Handle anonymous posts
    const formattedPosts = posts.map(post => {
        const postObj = post.toObject();
        if (post.isAnonymous) {
            postObj.user = { _id: null, name: 'Anonymous Bro' };
        }
        return {
            ...postObj,
            commentsCount: post.comments?.length || 0,
            reactionsCount: post.reactions?.length || 0
        };
    });

    res.status(200).json(formattedPosts);
});

// @desc    Get single post
// @route   GET /api/posts/:id
// @access  Public
const getPostById = asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id)
        .populate('user', 'name profilePicture')
        .populate('topic', 'title');

    if (!post) {
        res.status(404);
        throw new Error('Post not found');
    }

    const postObj = post.toObject();
    if (post.isAnonymous) {
        postObj.user = { _id: null, name: 'Anonymous Bro' };
    }

    res.status(200).json({
        ...postObj,
        commentsCount: post.comments?.length || 0,
        reactionsCount: post.reactions?.length || 0
    });
});

// @desc    Create a post
// @route   POST /api/posts
// @access  Private
const createPost = asyncHandler(async (req, res) => {
    const { title, content, topicId, isAnonymous } = req.body;

    if (!content || !topicId) {
        res.status(400);
        throw new Error('Please add content and topicId');
    }

    // Check if topic exists
    const topic = await Topic.findById(topicId);
    if (!topic) {
        res.status(404);
        throw new Error('Topic not found');
    }

    const post = await Post.create({
        title,
        content,
        topic: topicId,
        user: req.user.id,
        isAnonymous: isAnonymous || false
    });

    // Handle Mentions
    const mentionedNames = extractMentions(content);
    if (mentionedNames.length > 0) {
        const mentionedUsers = await User.find({ name: { $in: mentionedNames } });

        for (const user of mentionedUsers) {
            if (user._id.toString() !== req.user.id) { // Don't notify self
                await Notification.create({
                    recipient: user._id,
                    sender: req.user.id,
                    type: 'mention',
                    post: post._id
                });
            }
        }
    }

    res.status(201).json(post);
});

// @desc    Delete a post
// @route   DELETE /api/posts/:id
// @access  Private
const deletePost = asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
        res.status(404);
        throw new Error('Post not found');
    }

    // Check if user is author or admin
    if (post.user.toString() !== req.user.id && req.user.role !== 'admin') {
        res.status(401);
        throw new Error('User not authorized');
    }

    await post.deleteOne();

    res.status(200).json({ id: req.params.id });
});

// @desc    Search posts
// @route   GET /api/posts/search?q=keyword&topic=topicId&sort=recent
// @access  Public
const searchPosts = asyncHandler(async (req, res) => {
    const { q, topic, sort } = req.query;

    let matchStage = {};

    if (q) {
        // Use regex for partial matching instead of whole-word $text search
        matchStage.$or = [
            { title: { $regex: q, $options: 'i' } },
            { content: { $regex: q, $options: 'i' } }
        ];
    }

    if (topic) {
        matchStage.topic = new mongoose.Types.ObjectId(topic);
    }

    let sortStage = { weight: -1, createdAt: -1 }; // Default: Personalization + Recent

    if (sort === 'oldest') {
        sortStage = { createdAt: 1 };
    } else if (sort === 'popular') {
        sortStage = { totalEngagement: -1, weight: -1, createdAt: -1 };
    }

    // For Personalized Feed: Get topics user is subscribed to
    let subscribedTopics = [];
    if (req.user) {
        const topics = await Topic.find({ subscribers: req.user._id });
        subscribedTopics = topics.map(t => t._id);
    }

    const pipeline = [
        { $match: matchStage },
        {
            $addFields: {
                reactionsCount: { $size: { $ifNull: ["$reactions", []] } },
                commentsCount: { $size: { $ifNull: ["$comments", []] } },
                totalEngagement: {
                    $add: [
                        { $size: { $ifNull: ["$reactions", []] } },
                        { $size: { $ifNull: ["$comments", []] } }
                    ]
                },
                // Personalization Weight
                weight: {
                    $cond: {
                        if: { $in: ["$topic", subscribedTopics] },
                        then: 2,
                        else: 1
                    }
                }
            }
        },
        { $sort: sortStage },
        {
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'user'
            }
        },
        { $unwind: '$user' },
        {
            $lookup: {
                from: 'topics',
                localField: 'topic',
                foreignField: '_id',
                as: 'topic'
            }
        },
        { $unwind: '$topic' },
        {
            $project: {
                title: 1,
                content: 1,
                topic: { _id: 1, title: 1 },
                user: { _id: 1, name: 1, profilePicture: 1 },
                createdAt: 1,
                updatedAt: 1,
                isAnonymous: 1,
                reactions: 1,
                comments: 1,
                reactionsCount: 1,
                commentsCount: 1,
                totalEngagement: 1
            }
        }
    ];

    const posts = await Post.aggregate(pipeline);

    // Handle anonymous and format posts
    const formattedPosts = posts.map(post => {
        if (post.isAnonymous) {
            return {
                ...post,
                user: { _id: null, name: 'Anonymous Bro' }
            };
        }
        return post;
    });

    // Also search for users if query exists
    let users = [];
    if (q) {
        users = await User.find({
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { email: { $regex: q, $options: 'i' } },
                { username: { $regex: q, $options: 'i' } }
            ]
        })
            .select('name profilePicture username bio')
            .limit(10);
    }

    res.status(200).json({
        posts: formattedPosts,
        users
    });
});


// @desc    React to a post
// @route   PUT /api/posts/:id/react
// @access  Private
const reactToPost = asyncHandler(async (req, res) => {
    const { type } = req.body; // like, love, haha, wow, sad, angry
    const ValidTypes = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];

    if (!ValidTypes.includes(type)) {
        res.status(400);
        throw new Error('Invalid reaction type');
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
        res.status(404);
        throw new Error('Post not found');
    }

    // Check if user already reacted
    const existingReactionIndex = post.reactions.findIndex(
        r => r.user.toString() === req.user.id
    );

    if (existingReactionIndex !== -1) {
        const existingReaction = post.reactions[existingReactionIndex];
        if (existingReaction.type === type) {
            // Check logic: Toggle off if same type? Or just keep it?
            // Facebook toggles off if you click the SAME button. 
            // If selecting from menu, usually you update.
            // Let's assume toggle off behavior if same.
            post.reactions.splice(existingReactionIndex, 1);
        } else {
            // Change reaction type
            post.reactions[existingReactionIndex].type = type;
        }
    } else {
        // Add new reaction
        post.reactions.push({ user: req.user.id, type });

        // Notify if not self
        if (post.user.toString() !== req.user.id) {
            await Notification.create({
                recipient: post.user,
                sender: req.user.id,
                type: 'like', // Using 'like' generic type for notification or could technically add 'reaction'
                post: post._id
            });
        }
    }

    await post.save();
    checkEngagement(post._id); // Async trigger
    res.status(200).json(post.reactions);
});

const getPostsByUser = asyncHandler(async (req, res) => {
    const posts = await Post.find({ user: req.params.userId, isAnonymous: false })
        .populate('user', 'name profilePicture')
        .populate('topic', 'title')
        .sort({ createdAt: -1 });

    const formattedPosts = posts.map(post => ({
        ...post.toObject(),
        commentsCount: post.comments?.length || 0,
        reactionsCount: post.reactions?.length || 0
    }));

    res.status(200).json(formattedPosts);
});

// @desc    Update a post
// @route   PUT /api/posts/:id
// @access  Private
const updatePost = asyncHandler(async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (!post) {
        res.status(404);
        throw new Error('Post not found');
    }

    // Check if user is author
    console.log(`Update Post Debug: Post User: ${post.user}, Req User: ${req.user.id}`);
    if (post.user.toString() !== req.user.id && req.user.role !== 'admin') {
        res.status(401);
        throw new Error('User not authorized');
    }

    console.log(`Update Post Debug: Attempting to update post ${req.params.id} with body:`, req.body);

    if (!req.body.content) {
        res.status(400);
        throw new Error("Content is required");
    }

    try {
        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: false }
        ).populate('user', 'name profilePicture isVerified')
            .populate('topic', 'title');
        res.status(200).json(updatedPost);
    } catch (error) {
        console.error("Update Post Error:", error);
        res.status(500);
        throw new Error("Update failed: " + error.message);
    }
});

const checkEngagement = async (postId) => {
    const post = await Post.findById(postId).populate('topic');
    if (!post || post.trendingNotificationSent) return;

    const engagement = (post.reactions?.length || 0) + (post.comments?.length || 0);

    if (engagement >= 5) { // Threshold for Trending
        post.trendingNotificationSent = true;
        await post.save();

        // Get all subscribers of the topic
        const topic = await Topic.findById(post.topic._id);
        const subscribers = topic.subscribers || [];

        for (const userId of subscribers) {
            // Don't notify the author
            if (userId.toString() !== post.user.toString()) {
                await Notification.create({
                    recipient: userId,
                    sender: post.user, // Sender is the post author for trending alerts
                    type: 'trending',
                    post: post._id
                });
            }
        }
    }
};

module.exports = {
    getPosts,
    getPostsByTopic,
    getPostById,
    createPost,
    deletePost,
    searchPosts,
    getPostsByUser,
    updatePost,
    reactToPost,
    checkEngagement
};
