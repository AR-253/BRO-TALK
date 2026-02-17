const asyncHandler = require('express-async-handler');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { checkEngagement } = require('./postController');

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

// ... getCommentsByPost code (omitted for brevity, keep existing) ...
// @desc    Get comments by post (Tree Structure)
// @route   GET /api/comments/post/:postId
// @access  Public
const getCommentsByPost = asyncHandler(async (req, res) => {
    const comments = await Comment.find({ post: req.params.postId })
        .populate('user', 'name profilePicture')
        .sort({ createdAt: 1 }); // Oldest first to build tree logically

    const commentMap = {};
    const rootComments = [];

    // Initialize map
    comments.forEach(comment => {
        let commentData = comment.toObject();
        commentData.children = [];
        commentMap[commentData._id.toString()] = commentData;
    });

    // Build Tree
    comments.forEach(comment => {
        if (comment.parentComment) {
            const parentId = comment.parentComment.toString();
            if (commentMap[parentId]) {
                commentMap[parentId].children.push(commentMap[comment._id.toString()]);
            }
        } else {
            rootComments.push(commentMap[comment._id.toString()]);
        }
    });

    res.status(200).json(rootComments);
});


// @desc    Add a comment
// @route   POST /api/comments
// @access  Private
const addComment = asyncHandler(async (req, res) => {
    const { content, postId, parentCommentId } = req.body;

    if (!content || !postId) {
        res.status(400);
        throw new Error('Please add content and postId');
    }

    const post = await Post.findById(postId);
    if (!post) {
        res.status(404);
        throw new Error('Post not found');
    }

    const comment = await Comment.create({
        content,
        post: postId,
        user: req.user.id,
        parentComment: parentCommentId || null
    });

    // Add comment to post's comments array (for engagement tracking)
    await post.updateOne({ $push: { comments: comment._id } });

    // 1. Notify Parent Comment Author (Reply)
    if (parentCommentId) {
        const parentComment = await Comment.findById(parentCommentId);
        if (parentComment && parentComment.user.toString() !== req.user.id) {
            await Notification.create({
                recipient: parentComment.user,
                sender: req.user.id,
                type: 'reply',
                post: postId,
                comment: comment._id
            });
        }
    } else {
        // Notify Post Author (Top-levle comment)
        if (post.user.toString() !== req.user.id) {
            await Notification.create({
                recipient: post.user,
                sender: req.user.id,
                type: 'reply', // Using 'reply' loosely for comment on post too, or could add 'comment' type
                post: postId,
                comment: comment._id
            });
        }
    }

    // 2. Handle Mentions
    const mentionedUsernames = extractMentions(content);
    if (mentionedUsernames.length > 0) {
        const mentionedUsers = await User.find({ username: { $in: mentionedUsernames } });

        for (const user of mentionedUsers) {
            if (user._id.toString() !== req.user.id) { // Don't notify self
                await Notification.create({
                    recipient: user._id,
                    sender: req.user.id,
                    type: 'mention',
                    post: postId,
                    comment: comment._id
                });
            }
        }
    }

    const populatedComment = await Comment.findById(comment._id).populate('user', 'name');
    checkEngagement(postId); // Async trigger

    res.status(201).json(populatedComment);
});

// @desc    Delete a comment
// @route   DELETE /api/comments/:id
// @access  Private
const deleteComment = asyncHandler(async (req, res) => {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
        res.status(404);
        throw new Error('Comment not found');
    }

    // Check if user is author or admin
    if (comment.user.toString() !== req.user.id && req.user.role !== 'admin') {
        res.status(401);
        throw new Error('User not authorized');
    }

    // Get children IDs for batch post update
    const children = await Comment.find({ parentComment: comment._id });
    const childIds = children.map(c => c._id);
    const allDeletedIds = [comment._id, ...childIds];

    // Remove reference from Post engagement count
    await Post.findByIdAndUpdate(comment.post, {
        $pullAll: { comments: allDeletedIds }
    });

    await comment.deleteOne();
    await Comment.deleteMany({ parentComment: req.params.id });

    res.status(200).json({ id: req.params.id });
});

// @desc    React to a comment
// @route   PUT /api/comments/:id/react
// @access  Private
const reactToComment = asyncHandler(async (req, res) => {
    const { type } = req.body; // like, love, haha, wow, sad, angry
    const ValidTypes = ['like', 'love', 'haha', 'wow', 'sad', 'angry'];

    if (!ValidTypes.includes(type)) {
        res.status(400);
        throw new Error('Invalid reaction type');
    }

    const comment = await Comment.findById(req.params.id);

    if (!comment) {
        res.status(404);
        throw new Error('Comment not found');
    }

    // Check if user already reacted
    const existingReactionIndex = comment.reactions.findIndex(
        r => r.user.toString() === req.user.id
    );

    if (existingReactionIndex !== -1) {
        const existingReaction = comment.reactions[existingReactionIndex];
        if (existingReaction.type === type) {
            // Toggle off
            comment.reactions.splice(existingReactionIndex, 1);
        } else {
            // Update
            comment.reactions[existingReactionIndex].type = type;
        }
    } else {
        // Add new
        comment.reactions.push({ user: req.user.id, type });

        // Notify comment author if not self
        if (comment.user.toString() !== req.user.id) {
            await Notification.create({
                recipient: comment.user,
                sender: req.user.id,
                type: 'like', // Generic like for now
                post: comment.post,
                comment: comment._id
            });
        }
    }

    await comment.save();
    res.status(200).json(comment.reactions);
});

module.exports = {
    getCommentsByPost,
    addComment,
    deleteComment,
    reactToComment
};
