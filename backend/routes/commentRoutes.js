const express = require('express');
const router = express.Router();
const {
    addComment,
    getCommentsByPost,
    deleteComment,
    reactToComment
} = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, addComment);

router.get('/post/:postId', getCommentsByPost);

router.route('/:id')
    .delete(protect, deleteComment);

router.put('/:id/react', protect, reactToComment);

module.exports = router;
