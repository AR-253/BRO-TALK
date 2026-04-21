const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

console.log("Loading User Model..."); // Debug log

const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    username: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
        set: v => (v === '' ? undefined : v)
    },
    email: {
        type: String,
        required: false,
        unique: true,
        sparse: true,
        set: v => (v === '' ? undefined : v)
    },
    phone: {
        type: String,
        unique: true,
        sparse: true,
        set: v => (v === '' ? undefined : v)
    },
    password: {
        type: String,
        required: false // Optional if using OTP only, but kept for dual support
    },
    otp: String,
    otpExpire: Date,
    isVerified: {
        type: Boolean,
        default: false
    },
    tokenVersion: {
        type: Number,
        default: 0
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'superadmin'],
        default: 'user'
    },
    adminTitle: {
        type: String,
        default: ''
    },
    permissions: {
        type: [String],
        default: []
    },
    isSuspended: {
        type: Boolean,
        default: false
    },
    isBanned: {
        type: Boolean,
        default: false
    },
    isDeletionPending: {
        type: Boolean,
        default: false
    },
    deletionDate: {
        type: Date,
        default: null
    },
    warnings: {
        type: Number,
        default: 0
    },
    moderationUntil: {
        type: Date,
        default: null
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    profilePicture: {
        type: String,
        default: ""
    },
    fcmToken: {
        type: String,
        default: ""
    },
    coverPhoto: {
        type: String,
        default: ""
    },
    bio: {
        type: String,
        default: ""
    },
    location: {
        type: String,
        default: ""
    },
    website: {
        type: String,
        default: ""
    },
    occupation: {
        type: String,
        default: ""
    },
    followers: {
        type: [{
            type: ObjectId,
            ref: 'User'
        }],
        default: []
    },
    following: {
        type: [{
            type: ObjectId,
            ref: 'User'
        }],
        default: []
    },
    friendRequests: {
        type: [{
            type: ObjectId,
            ref: 'User'
        }],
        default: []
    },
    savedPosts: {
        type: [{
            type: ObjectId,
            ref: 'Post'
        }],
        default: []
    },
    lastSeen: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
});

// Generate Password Reset Token
userSchema.methods.getResetPasswordToken = function () {
    const crypto = require('crypto');
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Set expire (10 minutes)
    this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    return resetToken;
};

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
