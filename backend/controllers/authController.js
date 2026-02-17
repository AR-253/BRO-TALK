const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Notification = require('../models/Notification');
const sendSMS = require('../utils/smsService');
const sendEmail = require('../utils/emailService');

// @desc    Register new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, username, email, phone, password, role } = req.body;

    if (!name || !username || (!email && !phone)) {
        res.status(400);
        throw new Error('Please add name, username, and either email or phone');
    }

    // Check if user exists (email, phone, or username)
    const userExists = await User.findOne({
        $or: [
            { email: email || 'never_match_this' },
            { phone: phone || 'never_match_this' },
            { username: username }
        ]
    });

    if (userExists) {
        res.status(400);
        if (userExists.username === username) {
            throw new Error('Username already taken');
        }
        throw new Error('User already exists with this email or phone');
    }

    // Create user
    const user = await User.create({
        name,
        username,
        email,
        phone,
        password,
        role: role || 'user'
    });

    if (user) {
        res.status(201).json({
            _id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            phone: user.phone,
            role: user.role,
            token: generateToken(user._id, user.tokenVersion)
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Authenticate a user
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, phone, password } = req.body;

    // Check for user
    const user = await User.findOne({
        $or: [
            { email: email || 'never_match_this' },
            { phone: phone || 'never_match_this' }
        ]
    });

    if (user && (await user.matchPassword(password))) {
        if (user.isSuspended) {
            res.status(403);
            throw new Error('Your account has been suspended.');
        }

        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            token: generateToken(user._id, user.tokenVersion),
        });
    } else {
        res.status(401);
        throw new Error('Invalid credentials');
    }
});

// @desc    Get current user data
// @route   GET /api/users/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id)
        .populate('following', 'name profilePicture username')
        .populate('friendRequests', 'name profilePicture username');
    res.status(200).json(user);
});


// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.find({}).select('-password');
    res.status(200).json(users);
});

// @desc    Suspend/Unsuspend user
// @route   PUT /api/users/:id/suspend
// @access  Private/Admin
const suspendUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    user.isSuspended = !user.isSuspended;
    await user.save();

    res.status(200).json({
        msg: `User ${user.isSuspended ? 'suspended' : 'active'}`,
        user: { _id: user._id, name: user.name, isSuspended: user.isSuspended }
    });
});


// @desc    Forgot Password
// @route   POST /api/users/forgotpassword
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Get Reset Token
    const resetToken = user.getResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // Create reset url
    const resetUrl = `${req.protocol}://localhost:3000/resetpassword/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
        const sendEmail = require('../utils/emailService');

        await sendEmail({
            email: user.email,
            subject: 'Password Reset Token',
            message
        });

        res.status(200).json({ success: true, data: 'Email sent' });
    } catch (err) {
        console.error(err);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save({ validateBeforeSave: false });

        res.status(500);
        throw new Error('Email could not be sent');
    }
});

// @desc    Reset Password
// @route   PUT /api/users/resetpassword/:resettoken
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
    const crypto = require('crypto');

    // Get hashed token
    const resetPasswordToken = crypto
        .createHash('sha256')
        .update(req.params.resettoken)
        .digest('hex');

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
        res.status(400);
        throw new Error('Invalid token');
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
        success: true,
        data: 'Password updated success',
        token: generateToken(user._id)
    });
});

// @desc    Update user details
// @route   PUT /api/users/profile
// @access  Private
const updateUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (user) {
        user.name = req.body.name || user.name;
        user.bio = req.body.bio || user.bio;
        user.location = req.body.location || user.location;
        user.website = req.body.website || user.website;
        user.occupation = req.body.occupation || user.occupation;

        // Handle Username Update
        if (req.body.username && req.body.username !== user.username) {
            const usernameExists = await User.findOne({ username: req.body.username });
            if (usernameExists) {
                res.status(400);
                throw new Error('Username already taken');
            }
            user.username = req.body.username;
        }

        // Handle images if provided (assuming URLs for now)
        if (req.body.profilePicture) user.profilePicture = req.body.profilePicture;
        if (req.body.coverPhoto) user.coverPhoto = req.body.coverPhoto;

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            username: updatedUser.username,
            email: updatedUser.email,
            role: updatedUser.role,
            bio: updatedUser.bio,
            location: updatedUser.location,
            website: updatedUser.website,
            occupation: updatedUser.occupation,
            profilePicture: updatedUser.profilePicture,
            coverPhoto: updatedUser.coverPhoto,
            token: generateToken(updatedUser._id),
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Send a friend request
// @route   PUT /api/users/:id/friend-request
// @access  Private
const sendFriendRequest = asyncHandler(async (req, res) => {
    if (req.user.id === req.params.id) {
        res.status(400);
        throw new Error('You cannot send a request to yourself');
    }

    const targetUser = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!targetUser || !currentUser) {
        res.status(404);
        throw new Error('User not found');
    }

    console.log(`Sending Friend Request: From ${req.user.id} to ${req.params.id}`);

    // Check if already friends (following each other - simplified to checking if current follows target)
    if ((currentUser.following || []).some(id => id.toString() === req.params.id)) {
        res.status(400);
        throw new Error('You are already friends/following this user');
    }

    // Check if request already sent
    if ((targetUser.friendRequests || []).some(id => id.toString() === req.user.id)) {
        res.status(400);
        throw new Error('Friend request already sent');
    }

    // Check if target user has already sent a request to current user (Accept instead?)
    if ((currentUser.friendRequests || []).some(id => id.toString() === req.params.id)) {
        res.status(400);
        throw new Error('This user has already sent you a request. Please accept it.');
    }

    // Add to friendRequests
    await targetUser.updateOne({ $push: { friendRequests: req.user.id } });

    // Create Notification
    try {
        await Notification.create({
            recipient: targetUser._id,
            sender: req.user.id,
            type: 'friend_request'
        });
    } catch (error) {
        console.error("Error creating friend request notification:", error);
    }

    res.status(200).json("Friend request sent");
});

// @desc    Accept a friend request
// @route   PUT /api/users/:id/accept-request
// @access  Private
const acceptFriendRequest = asyncHandler(async (req, res) => {
    const requesterId = req.params.id;
    const currentUser = await User.findById(req.user.id);
    const requester = await User.findById(requesterId);

    if (!currentUser || !requester) {
        res.status(404);
        throw new Error('User not found');
    }

    console.log(`Accepting Friend Request: User ${req.user.id} accepting ${requesterId}`);

    const requests = currentUser.friendRequests || [];
    const requestExpr = requests.find(r => {
        const rId = r._id ? r._id.toString() : r.toString();
        return rId === requesterId;
    });

    // Check if request exists
    if (!requestExpr) {
        console.log("FAILED: Request not found in array", requests);
        // Fallback: If they are ALREADY friends, just say success
        const isFollower = (currentUser.following || []).some(f => {
            const fId = f._id ? f._id.toString() : f.toString();
            return fId === requesterId;
        });

        if (isFollower) {
            res.status(200).json("You are already friends");
            return;
        }

        res.status(400);
        throw new Error('No friend request from this user');
    }

    // Add to following/followers (Mutual)
    // User A (Current) accepts User B (Requester)
    // A follows B, B follows A
    await currentUser.updateOne({
        $addToSet: { following: requesterId, followers: requesterId },
        $pull: { friendRequests: requesterId }
    });

    await requester.updateOne({
        $addToSet: { following: req.user.id, followers: req.user.id }
    });

    // Create Notification
    try {
        await Notification.create({
            recipient: requester._id,
            sender: req.user.id,
            type: 'friend_request_accepted'
        });
    } catch (error) {
        console.error("Error creating acceptance notification:", error);
    }

    res.status(200).json("Friend request accepted");
});

// @desc    Reject a friend request
// @route   PUT /api/users/:id/reject-request
// @access  Private
const rejectFriendRequest = asyncHandler(async (req, res) => {
    const requesterId = req.params.id;
    const currentUser = await User.findById(req.user.id);

    if (!currentUser) {
        res.status(404);
        throw new Error('User not found');
    }

    console.log(`Rejecting Friend Request: User ${req.user.id} rejecting ${requesterId}`);

    const requests = currentUser.friendRequests || [];
    const requestExpr = requests.find(r => {
        const rId = r._id ? r._id.toString() : r.toString();
        return rId === requesterId;
    });

    if (!requestExpr) {
        console.log("FAILED: Request not found in array", requests);
        // If already rejected (not in list), treat as success to match FB behavior (idempotent)
        res.status(200).json("Friend request rejected");
        return;
    }

    await currentUser.updateOne({ $pull: { friendRequests: requesterId } });

    res.status(200).json("Friend request rejected");
});

// @desc    Get friend requests
// @route   GET /api/users/friend-requests
// @access  Private
const getFriendRequests = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id)
        .populate('friendRequests', 'name username profilePicture');

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    res.status(200).json(user.friendRequests);
});

// @desc    Unfollow a user
// @route   PUT /api/users/:id/unfollow
// @access  Private
const unfollowUser = asyncHandler(async (req, res) => {
    if (req.user.id === req.params.id) {
        res.status(400);
        throw new Error('You cannot unfollow yourself');
    }

    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToUnfollow || !currentUser) {
        res.status(404);
        throw new Error('User not found');
    }

    if ((currentUser.following || []).some(id => id.toString() === req.params.id)) {
        await currentUser.updateOne({ $pull: { following: req.params.id } });
        await userToUnfollow.updateOne({ $pull: { followers: req.user.id } });
        res.status(200).json("User has been unfollowed");
    } else {
        res.status(403).json("You dont follow this user");
    }
});

// @desc    Get suggested users to follow
// @route   GET /api/users/suggestions
// @access  Private
const getSuggestedUsers = asyncHandler(async (req, res) => {
    // specific user logic: exclude self and already followed users
    const currentUser = await User.findById(req.user.id);

    // Find users who are NOT in the following list and NOT the current user
    const suggestions = await User.find({
        _id: { $ne: req.user.id, $nin: currentUser.following }
    })
        .select('name username profilePicture')
        .limit(5); // Limit to 5 suggestions

    res.status(200).json(suggestions);
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password -friendRequests -resetPasswordToken -resetPasswordExpire');
    if (user) {
        res.status(200).json(user);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Get user's saved posts
// @route   GET /api/users/saved-posts
// @access  Private
const getSavedPosts = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).populate({
        path: 'savedPosts',
        populate: { path: 'user', select: 'name profilePicture username' }
    });

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    res.status(200).json(user.savedPosts);
});

// @desc    Toggle save post
// @route   PUT /api/users/save/:id
// @access  Private
const toggleSavePost = asyncHandler(async (req, res) => {
    const postId = req.params.id;
    const user = await User.findById(req.user.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const isSaved = user.savedPosts.includes(postId);

    if (isSaved) {
        await user.updateOne({ $pull: { savedPosts: postId } });
        res.status(200).json({ message: "Post unsaved", isSaved: false });
    } else {
        await user.updateOne({ $addToSet: { savedPosts: postId } });
        res.status(200).json({ message: "Post saved", isSaved: true });
    }
});

// @desc    Search users for mentions
// @route   GET /api/users/search-users?q=keyword
// @access  Private
const searchUsers = asyncHandler(async (req, res) => {
    const { q } = req.query;

    if (!q) {
        return res.status(200).json([]);
    }

    const users = await User.find({
        $or: [
            { username: { $regex: q, $options: 'i' } },
            { name: { $regex: q, $options: 'i' } }
        ]
    })
        .select('name username profilePicture')
        .limit(5);

    res.status(200).json(users);
});

// @desc    Get user by username
// @route   GET /api/users/username/:username
// @access  Public
const getUserByUsername = asyncHandler(async (req, res) => {
    const user = await User.findOne({ username: req.params.username }).select('_id');

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    res.status(200).json(user);
});

// @desc    Update FCM Token
// @route   PUT /api/users/fcm-token
// @access  Private
const updateFcmToken = asyncHandler(async (req, res) => {
    const { token } = req.body;

    const user = await User.findById(req.user.id);
    if (user) {
        user.fcmToken = token;
        await user.save();
        res.status(200).json({ success: true, message: 'FCM Token updated' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Send OTP to Email or Phone
// @route   POST /api/users/send-otp
// @access  Public
const sendOTP = asyncHandler(async (req, res) => {
    const { email, phone } = req.body;
    if (!email && !phone) {
        res.status(400);
        throw new Error('Please provide email or phone');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP
    const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    let user = await User.findOne({ $or: [{ email }, { phone }] });

    if (!user) {
        // If user doesn't exist, we might be in registration flow
        // For simplicity, we'll just return success if we want to allow "register via OTP"
        // but typically you'd want some temporary state or just create the user as unverified
        res.status(404);
        throw new Error('User not found. Please register first.');
    }

    user.otp = otp;
    user.otpExpire = otpExpire;
    await user.save();

    if (email) {
        await sendEmail({
            email,
            subject: 'Your Login/Verification OTP',
            message: `Your OTP is: ${otp}. It expires in 10 minutes.`
        });
    } else if (phone) {
        await sendSMS(phone, `Your Brotalk OTP is: ${otp}`);
    }

    res.status(200).json({ success: true, message: 'OTP sent' });
});

// @desc    Verify OTP and Login/Verify
// @route   POST /api/users/verify-otp
// @access  Public
const verifyOTP = asyncHandler(async (req, res) => {
    const { email, phone, otp } = req.body;

    const user = await User.findOne({
        $or: [{ email }, { phone }],
        otp,
        otpExpire: { $gt: Date.now() }
    });

    if (!user) {
        res.status(400);
        throw new Error('Invalid or expired OTP');
    }

    // Clear OTP
    user.otp = undefined;
    user.otpExpire = undefined;
    user.isVerified = true;
    await user.save();

    res.status(200).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        token: generateToken(user._id, user.tokenVersion),
    });
});

// @desc    Logout from all devices (Revoke all sessions)
// @route   POST /api/users/logout-all
// @access  Private
const logoutAll = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    if (user) {
        user.tokenVersion += 1; // Invalidate all previous tokens
        await user.save();
        res.status(200).json({ success: true, message: 'Logged out from all devices' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update password
// @route   PUT /api/users/update-password
// @access  Private
const updatePassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (!(await user.matchPassword(oldPassword))) {
        res.status(401);
        throw new Error('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
});

// @desc    Update email
// @route   PUT /api/users/update-email
// @access  Private
const updateEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findById(req.user.id);

    if (user) {
        // Check if email already taken
        const emailExists = await User.findOne({ email });
        if (emailExists && emailExists._id.toString() !== user._id.toString()) {
            res.status(400);
            throw new Error('Email already taken');
        }

        user.email = email;
        await user.save();
        res.status(200).json({
            success: true,
            message: 'Email updated successfully',
            email: user.email
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Delete account
// @route   DELETE /api/users
// @access  Private
const deleteAccount = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (user) {
        // Here you might want to delete their posts, comments, etc.
        // For simplicity, we just delete the user
        await user.deleteOne();
        res.status(200).json({ success: true, message: 'Account deleted' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// Generate JWT with tokenVersion
const generateToken = (id, version = 0) => {
    return jwt.sign({ id, version }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

module.exports = {
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
    getUserById,
    unfollowUser,
    getSuggestedUsers,
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
    deleteAccount
};
