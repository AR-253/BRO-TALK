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
// router.get('/user/:userId', getPostsByUser); // Duplicate removed

router.route('/')
    .get(getMe, getPosts)
    .post(protect, createPost);

router.get('/topic/:topicId', getMe, getPostsByTopic);

router.route('/:id')
    .get(getMe, getPostById)
    .delete(protect, deletePost)
    .put(protect, updatePost);

router.put('/:id/react', protect, reactToPost);
router.get('/user/:userId', getMe, getPostsByUser);

module.exports = router;
