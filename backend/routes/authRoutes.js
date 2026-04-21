const express = require('express');
const router = express.Router();
const {
    registerUser,
    loginUser,
    getMe,
    getAllUsers,
    suspendUser,
    forgotPassword,
    resetPassword,
    updateUser,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    getFriendRequests,
    unfollowUser,
    getSuggestedUsers,
    getUserById,
    getSavedPosts,
    toggleSavePost,
    searchUsers,
    getUserByUsername,
    updateFcmToken,
    sendOTP,
    verifyOTP,
    logoutAll,
    updatePassword,
    updateEmail,
    deleteAccount,
    warnUser,
    banUser,
    getAdminStats,
    updateUserRole,
    getAuditLogs,
    getAdmins,
    createAdminAccount,
    updateAdminPermissions,
    deleteAdminAccount,
} = require('../controllers/authController');
const { protect, admin, superAdmin } = require('../middleware/authMiddleware');

router.post('/', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateUser);
router.put('/fcm-token', protect, updateFcmToken);
router.put('/update-password', protect, updatePassword);
router.put('/update-email', protect, updateEmail);
router.delete('/', protect, deleteAccount);
router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/logout-all', protect, logoutAll);
router.get('/suggestions', protect, getSuggestedUsers);
router.get('/search-users', protect, searchUsers);
router.get('/username/:username', getUserByUsername);
router.get('/saved-posts', protect, getSavedPosts);
router.put('/save/:id', protect, toggleSavePost);

router.get('/friend-requests', protect, getFriendRequests);
router.get('/:id', protect, getUserById); // Get public user profile
router.put('/:id/follow', protect, sendFriendRequest); // Alias for compatibility
router.put('/:id/friend-request', protect, sendFriendRequest);
router.put('/:id/accept-request', protect, acceptFriendRequest);
router.put('/:id/reject-request', protect, rejectFriendRequest);
router.put('/:id/unfollow', protect, unfollowUser);

// Admin Routes
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resettoken', resetPassword);

// Admin Routes
router.get('/', protect, admin, getAllUsers);
router.get('/admin/stats', protect, admin, getAdminStats);
router.put('/:id/suspend', protect, admin, suspendUser);
router.put('/:id/warn', protect, admin, warnUser);
router.put('/:id/ban', protect, admin, banUser);
router.put('/:id/role', protect, superAdmin, updateUserRole);
router.get('/admin/audit-logs', protect, admin, getAuditLogs);

// Dedicated Admin Management (Super Admin Only)
router.get('/admin/list', protect, superAdmin, getAdmins);
router.post('/admin/create', protect, superAdmin, createAdminAccount);
router.put('/admin/update/:id', protect, superAdmin, updateAdminPermissions);
router.delete('/admin/delete/:id', protect, superAdmin, deleteAdminAccount);

module.exports = router;
