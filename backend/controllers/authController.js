const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const sendSMS = require('../utils/smsService');
const sendEmail = require('../utils/emailService');
const AuditLog = require('../models/AuditLog');

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
        // If the existing user is ALREADY verified, then block
        if (userExists.isVerified) {
            res.status(400);
            if (userExists.username === username) {
                throw new Error('Username already taken');
            }
            throw new Error('User already exists with this email or phone');
        }

        // If they are NOT verified, we allow them to "overwrite" their 
        // signup details and get a new OTP (Prevents getting stuck)
        userExists.name = name;
        userExists.password = password;
        userExists.username = username;
        await userExists.save();

        // Proceed to send new OTP to this unverified user
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpire = new Date(Date.now() + 10 * 60 * 1000);
        userExists.otp = otp;
        userExists.otpExpire = otpExpire;
        await userExists.save();

        await sendEmail({
            email,
            subject: 'Verify your account - BRO TALK',
            message: `Your new verification OTP is: ${otp}. It expires in 10 minutes.`
        });

        return res.status(200).json({
            success: true,
            msg: 'Account already exists and is now auto-verified for testing.',
            userId: userExists._id,
            email: userExists.email,
            token: generateToken(userExists._id, userExists.tokenVersion),
            requiresVerification: false
        });
    }

    // Create user
    const user = await User.create({
        name,
        username,
        email,
        phone,
        password,
        role: role || 'user',
        isVerified: true // Auto-verify for testing
    });

    if (user) {
        // Special Auto-Verify for the primary admin (You)
        if (email === 'alirazachaudhary143@gmail.com' || username === 'ar_253_') {
            user.isVerified = true;
            user.role = 'superadmin';
            await user.save();
        }

        // Generate OTP if email is provided
        if (email) {
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

            user.otp = otp;
            user.otpExpire = otpExpire;
            await user.save();

            try {
                await sendEmail({
                    email,
                    subject: 'Welcome to BRO TALK - Verify your account',
                    message: `Welcome ${name}! Your verification OTP is: ${otp}. It expires in 10 minutes.`
                });
            } catch (err) {
                console.error("Failed to send welcome email", err);
            }
        }

        res.status(201).json({
            success: true,
            msg: 'Registration successful (OTP Disabled for testing)',
            userId: user._id,
            email: user.email,
            token: generateToken(user._id, user.tokenVersion),
            requiresVerification: false
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

        if (user.isBanned) {
            res.status(403);
            throw new Error('Your account has been permanently banned.');
        }

        // if (!user.isVerified) {
        //     res.status(401);
        //     throw new Error('Please verify your email/account first via OTP.');
        // }

        // Restore account if deletion is pending
        if (user.isDeletionPending) {
            user.isDeletionPending = false;
            user.deletionDate = null;
            await user.save();

            // Restore all user's content
            await Post.updateMany({ user: user._id }, { isHidden: false });
            await Comment.updateMany({ user: user._id }, { isHidden: false });
        }

        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            adminTitle: user.adminTitle || '',
            permissions: user.permissions || [],
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
// @desc    Get all users (with pagination and filters)
// @route   GET /api/users
// @access  Private/Admin
const getAllUsers = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { isSuspended, isBanned, role } = req.query;
    const sortDir = req.query.sort === 'oldest' ? 1 : -1;
    const query = {};

    if (isSuspended === 'true') query.isSuspended = true;
    if (isBanned === 'true') query.isBanned = true;

    if (role) {
        query.role = role;
    } else {
        // Default: Exclude all kinds of admins (admin, superadmin) from general lists
        query.role = { $not: /admin/i };
    }

    const totalUsers = await User.countDocuments(query);
    const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: sortDir })
        .skip(skip)
        .limit(limit);

    res.status(200).json({
        users,
        page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers
    });
});

// @desc    Get all admins
// @route   GET /api/users/admins
// @access  Private/SuperAdmin
const getAdmins = asyncHandler(async (req, res) => {
    // Only superadmin can list other admins for security
    if (req.user.role !== 'superadmin') {
        res.status(403);
        throw new Error('Only Super Admin can manage other admins');
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const admins = await User.find({ role: 'admin' })
        .select('-password')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    res.status(200).json({
        admins,
        page,
        totalPages: Math.ceil(totalAdmins / limit),
        totalAdmins
    });
});

// @desc    Create a new admin account
// @route   POST /api/users/admins
// @access  Private/SuperAdmin
const createAdminAccount = asyncHandler(async (req, res) => {
    const { name, email, password, adminTitle, permissions } = req.body;

    if (req.user.role !== 'superadmin') {
        res.status(403);
        throw new Error('Only Super Admin can create other admins');
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error('User already exists with this email');
    }

    const user = await User.create({
        name,
        email,
        password,
        role: 'admin',
        adminTitle,
        permissions: permissions || [],
        isVerified: true
    });

    if (user) {
        await AuditLog.create({
            admin: req.user._id,
            targetUser: user._id,
            action: 'create_admin',
            reason: `New admin account created: ${adminTitle}`
        });

        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            adminTitle: user.adminTitle,
            permissions: user.permissions
        });
    } else {
        res.status(400);
        throw new Error('Invalid admin data');
    }
});

// @desc    Update admin permissions/title
// @route   PUT /api/users/admins/:id
// @access  Private/SuperAdmin
const updateAdminPermissions = asyncHandler(async (req, res) => {
    const { adminTitle, permissions } = req.body;

    if (req.user.role !== 'superadmin') {
        res.status(403);
        throw new Error('Only Super Admin can manage admin permissions');
    }

    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'admin') {
        res.status(404);
        throw new Error('Admin not found');
    }

    user.adminTitle = adminTitle || user.adminTitle;
    user.permissions = permissions || user.permissions;
    await user.save();

    await AuditLog.create({
        admin: req.user._id,
        targetUser: user._id,
        action: 'update_admin_permissions',
        reason: `Admin permissions updated: ${adminTitle}`
    });

    res.status(200).json(user);
});

// @desc    Delete an admin account
// @route   DELETE /api/users/admins/:id
// @access  Private/SuperAdmin
const deleteAdminAccount = asyncHandler(async (req, res) => {
    if (req.user.role !== 'superadmin') {
        res.status(403);
        throw new Error('Only Super Admin can delete other admins');
    }

    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'admin') {
        res.status(404);
        throw new Error('Admin not found');
    }

    await user.deleteOne();

    await AuditLog.create({
        admin: req.user._id,
        targetUser: user._id,
        action: 'delete_admin',
        reason: 'Admin account deleted by Super Admin'
    });

    res.status(200).json({ message: 'Admin account removed' });
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

    if (user.role === 'superadmin') {
        res.status(403);
        throw new Error('Action not allowed on Super Admin');
    }

    user.isSuspended = !user.isSuspended;
    await user.save();

    // Log the action
    try {
        await AuditLog.create({
            admin: req.user._id,
            targetUser: user._id,
            action: user.isSuspended ? 'suspend' : 'unsuspend',
            reason: req.body.reason || `User ${user.isSuspended ? 'suspended' : 'unsuspended'} by admin`
        });
    } catch (auditErr) {
        console.error("Audit log failed for suspendUser:", auditErr);
    }

    if (user.isSuspended) {
        user.moderationUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days
    } else {
        user.moderationUntil = null;
    }
    await user.save();

    res.status(200).json({
        msg: `User ${user.isSuspended ? 'suspended' : 'active'}`,
        user: { _id: user._id, name: user.name, isSuspended: user.isSuspended }
    });
});


// @desc    Forgot Password
// @route   POST /api/users/forgotpassword
// @access  Public
// @desc    Warn user
// @desc    Warn user
// @route   PUT /api/users/:id/warn
// @access  Private/Admin
const warnUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (user.role === 'superadmin') {
        res.status(403);
        throw new Error('Action not allowed on Super Admin');
    }

    user.warnings = (user.warnings || 0) + 1;
    let msg = `User warned. Total warnings: ${user.warnings}`;

    if (user.warnings >= 5) {
        user.isBanned = true;
        user.tokenVersion += 1; // Kick out
        user.moderationUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        msg += `. User has been auto-banned due to 5 warnings for 30 days.`;
    } else if (user.warnings >= 3) {
        user.isSuspended = true;
        user.moderationUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        msg += `. User has been auto-suspended due to 3 warnings for 7 days.`;
    }

    await user.save();

    // Log the action
    try {
        await AuditLog.create({
            admin: req.user._id,
            targetUser: user._id,
            action: 'warn',
            reason: req.body.reason || 'Manual warning issued by admin',
            targetId: (req.body.targetId && mongoose.Types.ObjectId.isValid(req.body.targetId)) ? req.body.targetId : undefined,
            targetType: req.body.targetType || 'User'
        });
    } catch (auditErr) {
        console.error("Audit log failed for warnUser:", auditErr);
        // Continue even if audit fails in dev, but in production we might want to know
    }

    res.status(200).json({
        success: true,
        msg,
        user: { _id: user._id, name: user.name, warnings: user.warnings, isSuspended: user.isSuspended, isBanned: user.isBanned }
    });
});

// @desc    Update user role
// @route   PUT /api/users/:id/role
// @access  Private/SuperAdmin
const updateUserRole = asyncHandler(async (req, res) => {
    const { role } = req.body;

    if (!['user', 'admin', 'superadmin'].includes(role)) {
        res.status(400);
        throw new Error('Invalid role specified');
    }

    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Prevent demoting the last superadmin
    if (user.role === 'superadmin' && role !== 'superadmin') {
        const superAdminCount = await User.countDocuments({ role: 'superadmin' });
        if (superAdminCount <= 1) {
            res.status(400);
            throw new Error('Cannot demote the last superadmin');
        }
    }

    const oldRole = user.role;
    user.role = role;
    await user.save();

    // Log the action
    await AuditLog.create({
        admin: req.user._id,
        targetUser: user._id,
        action: 'role_change',
        reason: `Role changed from ${oldRole} to ${role}`,
        details: { oldRole, newRole: role }
    });

    res.status(200).json({
        success: true,
        msg: `User role updated to ${role}`,
        user: { _id: user._id, name: user.name, role: user.role }
    });
});

// @desc    Ban user
// @route   PUT /api/users/:id/ban
// @access  Private/Admin
const banUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (user.role === 'superadmin') {
        res.status(403);
        throw new Error('Action not allowed on Super Admin');
    }

    user.isBanned = !user.isBanned;
    if (user.isBanned) {
        user.tokenVersion += 1; // Kick out if currently logged in
    }
    await user.save();

    // Log the action
    try {
        await AuditLog.create({
            admin: req.user._id,
            targetUser: user._id,
            action: user.isBanned ? 'ban' : 'unban',
            reason: req.body.reason || `User ${user.isBanned ? 'banned' : 'unbanned'} by admin`
        });
    } catch (auditErr) {
        console.error("Audit log failed for banUser:", auditErr);
    }

    if (user.isBanned) {
        user.moderationUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    } else {
        user.moderationUntil = null;
    }
    await user.save();

    res.status(200).json({
        success: true,
        msg: `User ${user.isBanned ? 'banned' : 'unbanned'}`,
        user: { _id: user._id, name: user.name, isBanned: user.isBanned }
    });
});

// @desc    Get all audit logs
// @route   GET /api/users/audit-logs
// @access  Private/Admin
const getAuditLogs = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { search, sort } = req.query;

    let query = {};
    if (search) {
        query.$or = [
            { reason: { $regex: search, $options: 'i' } },
            { action: { $regex: search, $options: 'i' } }
        ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };

    const [logs, totalLogs] = await Promise.all([
        AuditLog.find(query)
            .populate('admin', 'name email profilePicture')
            .populate('targetUser', 'name email username profilePicture')
            .sort(sortOption)
            .skip(skip)
            .limit(limit),
        AuditLog.countDocuments(query)
    ]);

    res.status(200).json({
        logs,
        page,
        totalPages: Math.ceil(totalLogs / limit),
        totalLogs
    });
});

// @desc    Get Admin Stats
// @route   GET /api/users/admin/stats
// @access  Private/Admin
const getAdminStats = asyncHandler(async (req, res) => {
    const Post = require('../models/Post');
    const Report = require('../models/Report');
    const Topic = require('../models/Topic');
    const AuditLog = require('../models/AuditLog');

    const [userCount, postCount, reportCount, topicCount, suspendedCount, bannedCount] = await Promise.all([
        User.countDocuments({ role: { $not: /admin/i } }), // Exclude anything with "admin" (admin, superadmin, Admin, etc.)
        Post.countDocuments(),
        Report.countDocuments({ status: 'pending' }),
        Topic.countDocuments(),
        User.countDocuments({ isSuspended: true, role: { $not: /admin/i } }),
        User.countDocuments({ isBanned: true, role: { $not: /admin/i } })
    ]);

    console.log(`DEBUG STATS: userCount=${userCount}, totalUsersIncludingAdmins=${await User.countDocuments()}`);

    // Get 30-day registration trend
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const registrations = await User.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    // Get latest Audit Logs
    const recentAudits = await AuditLog.find()
        .populate('admin', 'name')
        .populate('targetUser', 'name')
        .sort({ createdAt: -1 })
        .limit(5);

    const recentUsers = await User.find({ role: 'user' }).sort({ createdAt: -1 }).limit(5).select('name username createdAt profilePicture');

    res.status(200).json({
        users: userCount,
        posts: postCount,
        pendingReports: reportCount,
        topics: topicCount,
        suspendedUsers: suspendedCount,
        bannedUsers: bannedCount,
        recentUsers,
        registrations,
        recentAudits
    });
});

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
    const frontendUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    const resetUrl = `${frontendUrl}/resetpassword/${resetToken}`;

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

    // Pull from following/followers (Unfriend)
    await currentUser.updateOne({ $pull: { following: req.params.id } });
    await userToUnfollow.updateOne({ $pull: { followers: req.user.id } });

    // Pull from friendRequests (Cancel Request) - just in case it was a pending request
    await userToUnfollow.updateOne({ $pull: { friendRequests: req.user.id } });
    await currentUser.updateOne({ $pull: { friendRequests: req.params.id } }); // Also pull if they sent us one

    res.status(200).json("Action successful");
});

const getSuggestedUsers = asyncHandler(async (req, res) => {
    // specific user logic: exclude self and already followed users
    const currentUser = await User.findById(req.user.id);
    const limit = parseInt(req.query.limit) || 5;

    // Find users who are NOT in the following list, NOT the current user, and NOT admins
    const suggestions = await User.find({
        _id: { $ne: req.user.id, $nin: currentUser.following },
        role: { $nin: ['admin', 'superadmin'] }
    })
        .select('name username profilePicture bio friendRequests')
        .limit(limit);

    const suggestionsWithStatus = suggestions.map(user => {
        let status = 'connect';

        // Since getSuggestedUsers explicitly excludes following, we only check for requested
        if ((user.friendRequests || []).some(id => id.toString() === req.user.id)) {
            status = 'requested';
        }
        // Check if they sent me a request
        else if ((currentUser.friendRequests || []).some(id => id.toString() === user._id.toString())) {
            status = 'respond';
        }

        const userObj = user.toObject();
        delete userObj.friendRequests;
        return { ...userObj, status };
    });

    res.status(200).json(suggestionsWithStatus);
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
const getUserById = asyncHandler(async (req, res) => {
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400);
        throw new Error('Invalid user ID');
    }
    const user = await User.findById(req.params.id).select('-password -resetPasswordToken -resetPasswordExpire');
    if (user) {
        // Calculate status relative to current user
        const currentUser = await User.findById(req.user.id);
        let status = 'connect';

        if (currentUser) {
            const isFriend = (currentUser.following || []).some(id => id.toString() === user._id.toString());
            if (isFriend) {
                status = 'friends';
            } else if ((user.friendRequests || []).some(id => id.toString() === req.user.id)) {
                status = 'requested';
            } else if ((currentUser.friendRequests || []).some(id => id.toString() === user._id.toString())) {
                status = 'respond';
            }
        }

        const userObj = user.toObject();
        delete userObj.friendRequests;
        res.status(200).json({ ...userObj, status });
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
    const { q, limit } = req.query;
    const finalLimit = parseInt(limit) || 20;

    const currentUser = await User.findById(req.user.id);

    // Initial query: Exclude self AND exclude admins
    let mongoQuery = {
        _id: { $ne: req.user.id },
        role: { $nin: ['admin', 'superadmin'] }
    };

    // Exclude friends (people you already follow)
    if (currentUser.following && currentUser.following.length > 0) {
        mongoQuery._id = { $ne: req.user.id, $nin: currentUser.following };
    }

    if (q) {
        mongoQuery.$or = [
            { username: { $regex: q, $options: 'i' } },
            { name: { $regex: q, $options: 'i' } }
        ];
    }

    const users = await User.find(mongoQuery)
        .select('name username profilePicture bio friendRequests')
        .limit(finalLimit);

    const usersWithStatus = users.map(user => {
        let status = 'connect';

        // Check if I sent them a request
        if ((user.friendRequests || []).some(id => id.toString() === req.user.id)) {
            status = 'requested';
        }
        // Check if they sent me a request
        else if ((currentUser.friendRequests || []).some(id => id.toString() === user._id.toString())) {
            status = 'respond';
        }

        const userObj = user.toObject();
        delete userObj.friendRequests;
        return { ...userObj, status };
    });

    res.status(200).json(usersWithStatus);
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
        // Soft Delete: Set pending status for 30 days
        user.isDeletionPending = true;
        user.deletionDate = Date.now();
        await user.save();

        // Hide all user's content
        await Post.updateMany({ user: user._id }, { isHidden: true });
        await Comment.updateMany({ user: user._id }, { isHidden: true });

        res.status(200).json({
            success: true,
            message: 'Account scheduled for deletion. You have 30 days to log back in to cancel this request.'
        });
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
};
