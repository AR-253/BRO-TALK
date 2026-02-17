const express = require('express');
const router = express.Router();
const {
    createPost,
    getPosts,
    getPostsByTopic,
    getPostById,
    deletePost,

    searchPosts,
    getPostsByUser,
    updatePost,
    reactToPost
} = require('../controllers/postController');
const { protect, getMe } = require('../middleware/authMiddleware');

router.get('/search', getMe, searchPosts);
router.get('/user/:userId', getPostsByUser);

router.route('/')
    .get(getPosts)
    .post(protect, createPost);

router.get('/topic/:topicId', getPostsByTopic);

router.route('/:id')
    .get(getPostById)
    .delete(protect, deletePost)
    .put(protect, updatePost);

router.put('/:id/react', protect, reactToPost);

module.exports = router;
