const express = require('express');
const router = express.Router();
const {
    sendMessage,
    getConversations,
    getMessages,
    markAsRead,
    getUnreadMessageCount
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/unread-count', getUnreadMessageCount);
router.post('/', sendMessage);
router.get('/conversations', getConversations);
router.get('/:conversationId', getMessages);
router.put('/:conversationId/read', markAsRead);

module.exports = router;
