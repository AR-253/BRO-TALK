const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Post = require('../models/Post');
const Topic = require('../models/Topic');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Report = require('../models/Report');
const AuditLog = require('../models/AuditLog');
const containsProfanity = require('../utils/profanityFilter');

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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'superadmin');
    const { isHidden } = req.query;

    const filter = { isHidden: false };
    if (isAdmin && isHidden !== undefined) {
        filter.isHidden = isHidden === 'true';
    }

    const totalPosts = await Post.countDocuments(filter);
    const posts = await Post.find(filter)
        .populate('user', 'name profilePicture')
        .populate('topic', 'title')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const formattedPosts = posts.map(post => {
        const postObj = post.toObject();
        if (post.isAnonymous && !isAdmin) {
            postObj.user = { _id: null, name: 'Anonymous Bro' };
        }
        return {
            ...postObj,
            commentsCount: post.comments?.length || 0,
            reactionsCount: post.reactions?.length || 0
        };
    });

    // If no pagination params are provided, return direct array for legacy frontend support
    if (!req.query.page && !req.query.limit) {
        return res.status(200).json(formattedPosts);
    }

    res.status(200).json({
        posts: formattedPosts,
        page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts
    });
});

// @desc    Get posts by topic
// @route   GET /api/posts/topic/:topicId
// @access  Public
const getPostsByTopic = asyncHandler(async (req, res) => {
    // Main feed/topics ALWAYS hide moderated content
    const filter = { topic: req.params.topicId, isHidden: false };

    const posts = await Post.find(filter)
        .populate('user', 'name profilePicture')
        .populate('topic', 'title')
        .sort({ createdAt: -1 });

    // Handle anonymous posts
    const formattedPosts = posts.map(post => {
        const postObj = post.toObject();
        const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'superadmin');
        if (post.isAnonymous && !isAdmin) {
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
    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'superadmin');
    const filter = isAdmin ? { _id: req.params.id } : { _id: req.params.id, isHidden: false };

    const post = await Post.findOne(filter)
        .populate('user', 'name profilePicture')
        .populate('topic', 'title');

    if (!post) {
        res.status(404);
        throw new Error('Post not found');
    }

    const postObj = post.toObject();
    if (post.isAnonymous && !isAdmin) {
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

    const isFlagged = (await containsProfanity(title)) || (await containsProfanity(content));

    const post = await Post.create({
        title,
        content,
        topic: topicId,
        user: req.user.id,
        isAnonymous: isAnonymous || false,
        isFlagged,
        isHidden: isFlagged // Auto-hide if flagged
    });

    if (isFlagged) {
        await Report.create({
            reporter: req.user.id,
            reportedItem: post._id,
            itemType: 'Post',
            reason: 'System Flag: Potential Profanity detected'
        });
    }

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

    // Auto-Moderation Check
    const hasProfanityTitle = await containsProfanity(title);
    const hasProfanityContent = await containsProfanity(content);
    const hasProfanity = hasProfanityTitle || hasProfanityContent;
    if (hasProfanity) {
        await Report.create({
            reportedItem: post._id,
            itemType: 'Post',
            reason: 'System Flag: Profanity/Bad words detected.'
        });
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

    // Check if user is author or any kind of admin
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    if (post.user.toString() !== req.user.id && !isAdmin) {
        res.status(401);
        throw new Error('User not authorized');
    }

    // Cascading Delete: Delete related Comments and Notifications
    await Comment.deleteMany({ post: req.params.id });
    await Notification.deleteMany({ post: req.params.id });
    // Also remove from reports? Maybe keep for audit? Let's keep reports but mark item as deleted.

    // Audit Logging
    if (isAdmin) {
        await AuditLog.create({
            admin: req.user.id,
            targetUser: post.user,
            action: 'delete_post',
            targetId: req.params.id,
            targetType: 'Post',
            reason: `Post deleted by Administrator. Original author ID: ${post.user}`
        });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Post and related data removed successfully', id: req.params.id });
});

// @desc    Search posts
// @route   GET /api/posts/search?q=keyword&topic=topicId&sort=recent
// @access  Public
const searchPosts = asyncHandler(async (req, res) => {
    const { q, topic, sort, anonymous, hidden } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const isAdmin = req.user && (req.user.role === 'admin' || req.user.role === 'superadmin');
    let matchStage = isAdmin ? {} : { isHidden: false };

    // Admin filters
    if (isAdmin) {
        if (hidden === 'true') matchStage.isHidden = true;
        if (hidden === 'false') matchStage.isHidden = false;
        if (anonymous === 'true') matchStage.isAnonymous = true;
        if (anonymous === 'false') matchStage.isAnonymous = false;
    }

    if (q) {
        matchStage.$or = [
            { title: { $regex: q, $options: 'i' } },
            { content: { $regex: q, $options: 'i' } }
        ];
    }

    if (topic) {
        matchStage.topic = new mongoose.Types.ObjectId(topic);
    }

    let sortStage = { weight: -1, createdAt: -1 };
    if (sort === 'oldest') {
        sortStage = { createdAt: 1 };
    } else if (sort === 'popular') {
        sortStage = { totalEngagement: -1, weight: -1, createdAt: -1 };
    }

    let subscribedTopics = [];
    if (req.user) {
        const topics = await Topic.find({ subscribers: req.user._id });
        subscribedTopics = topics.map(t => t._id);
    }

    // Pipeline for counting total matches
    const countPipeline = [
        { $match: matchStage },
        { $count: "total" }
    ];

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
        { $skip: skip },
        { $limit: limit },
        {
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'user'
            }
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
            $lookup: {
                from: 'topics',
                localField: 'topic',
                foreignField: '_id',
                as: 'topic'
            }
        },
        { $unwind: { path: '$topic', preserveNullAndEmptyArrays: true } },
        {
            $project: {
                title: 1,
                content: 1,
                topic: { _id: 1, title: 1 },
                user: { _id: 1, name: 1, profilePicture: 1 },
                createdAt: 1,
                updatedAt: 1,
                isAnonymous: 1,
                isHidden: 1,
                reactions: 1,
                comments: 1,
                reactionsCount: 1,
                commentsCount: 1,
                totalEngagement: 1
            }
        }
    ];

    const [posts, countResult] = await Promise.all([
        Post.aggregate(pipeline),
        Post.aggregate(countPipeline)
    ]);

    const totalPosts = countResult[0]?.total || 0;

    const formattedPosts = posts.map(post => {
        let finalUser = post.user || { _id: null, name: 'Deleted/Unknown User' };
        let finalTopic = post.topic || { _id: null, title: 'Uncategorized' };

        if (post.isAnonymous && !isAdmin) {
            finalUser = { _id: null, name: 'Anonymous Bro' };
        }

        return {
            ...post,
            user: finalUser,
            topic: finalTopic
        };
    });

    let users = [];
    let topicResults = [];
    if (q) {
        const [foundUsers, foundTopics] = await Promise.all([
            User.find({
                $or: [
                    { name: { $regex: q, $options: 'i' } },
                    { email: { $regex: q, $options: 'i' } },
                    { username: { $regex: q, $options: 'i' } }
                ]
            }).select('name profilePicture username bio').limit(10),
            Topic.find({
                $or: [
                    { title: { $regex: q, $options: 'i' } },
                    { description: { $regex: q, $options: 'i' } }
                ]
            }).select('title description subscribers active').limit(10)
        ]);
        users = foundUsers;
        topicResults = foundTopics;
    }

    res.status(200).json({
        posts: formattedPosts,
        users,
        topics: topicResults,
        page,
        totalPages: Math.ceil(totalPosts / limit),
        totalPosts
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
    // Normal profile view ALWAYS hides special content (Anonymous/Hidden)
    // taake confusion na ho. Profile page should reflect reality.
    const filter = { user: req.params.userId, isAnonymous: false, isHidden: false };

    const posts = await Post.find(filter)
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

    // Check if user is author or any kind of admin
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    if (post.user.toString() !== req.user.id && !isAdmin) {
        res.status(401);
        throw new Error('User not authorized');
    }

    console.log(`Update Post Debug: Attempting to update post ${req.params.id} with body:`, req.body);

    // If content is provided in body, it becomes required for that update
    if (req.body.content === '') {
        res.status(400);
        throw new Error("Content cannot be empty");
    }

    try {
        // Re-check profanity if content or title changed
        if (req.body.title || req.body.content) {
            const checkTitle = req.body.title || post.title;
            const checkContent = req.body.content || post.content;
            if ((await containsProfanity(checkTitle)) || (await containsProfanity(checkContent))) {
                req.body.isFlagged = true;
                req.body.isHidden = true; // Auto-hide if re-edited with profanity
            }
        }

        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: false }
        ).populate('user', 'name profilePicture isVerified')
            .populate('topic', 'title');

        // Audit Logging for visibility changes
        if (isAdmin && req.body.isHidden !== undefined) {
            await AuditLog.create({
                admin: req.user.id,
                targetUser: post.user,
                action: req.body.isHidden ? 'hide_post' : 'unhide_post',
                targetId: req.params.id,
                targetType: 'Post',
                reason: `Visibility toggled by Admin. Status: ${req.body.isHidden ? 'Hidden' : 'Visible'}`
            });
        }

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
