const asyncHandler = require('express-async-handler');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
    const { recipientId, content } = req.body;

    if (!content || !recipientId) {
        res.status(400);
        throw new Error('Please add a recipient and content');
    }

    // Find or Create Conversation
    let conversation = await Conversation.findOne({
        participants: { $all: [req.user.id, recipientId], $size: 2 }
    });

    if (!conversation) {
        conversation = await Conversation.create({
            participants: [req.user.id, recipientId]
        });
    }

    const message = await Message.create({
        conversation: conversation._id,
        sender: req.user.id,
        content
    });

    // Update last message in conversation and increment unread count for recipient
    conversation.lastMessage = content;

    // Initialize unreadCount map if it doesn't exist
    if (!conversation.unreadCount) {
        conversation.unreadCount = new Map();
    }

    const currentUnread = conversation.unreadCount.get(recipientId.toString()) || 0;
    conversation.unreadCount.set(recipientId.toString(), currentUnread + 1);

    await conversation.save();

    // Create a system notification for the recipient
    await Notification.create({
        recipient: recipientId,
        sender: req.user.id,
        type: 'message'
    });

    res.status(201).json(message);
});

// @desc    Get user conversations
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = asyncHandler(async (req, res) => {
    const conversations = await Conversation.find({
        participants: req.user.id
    })
        .populate('participants', 'name profilePicture')
        .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
});

// @desc    Get messages in conversation
// @route   GET /api/messages/:conversationId
// @access  Private
const getMessages = asyncHandler(async (req, res) => {
    const messages = await Message.find({
        conversation: req.params.conversationId
    })
        .populate('sender', 'name profilePicture')
        .sort({ createdAt: 1 });

    res.status(200).json(messages);
});

// @desc    Mark conversation as read
// @route   PUT /api/messages/:conversationId/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
    const conversation = await Conversation.findById(req.params.conversationId);

    if (!conversation) {
        res.status(404);
        throw new Error('Conversation not found');
    }

    // Reset unread count for the current user
    if (conversation.unreadCount) {
        conversation.unreadCount.set(req.user.id.toString(), 0);
        await conversation.save();
    }

    // Mark messages as read
    await Message.updateMany(
        { conversation: req.params.conversationId, sender: { $ne: req.user.id }, isRead: false },
        { isRead: true }
    );

    res.status(200).json({ success: true });
});

// @desc    Get total unread message count
// @route   GET /api/messages/unread-count
// @access  Private
const getUnreadMessageCount = asyncHandler(async (req, res) => {
    const conversations = await Conversation.find({
        participants: req.user.id
    });

    let totalUnread = 0;
    conversations.forEach(conv => {
        if (conv.unreadCount) {
            totalUnread += (conv.unreadCount.get(req.user.id.toString()) || 0);
        }
    });

    res.status(200).json({ count: totalUnread });
});

module.exports = {
    sendMessage,
    getConversations,
    getMessages,
    markAsRead,
    getUnreadMessageCount
};
