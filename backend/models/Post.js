const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
    title: {
        type: String,
        trim: true
    },
    content: {
        type: String,
        required: [true, 'Please add post content'],
        trim: true
    },
    topic: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Topic',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    isAnonymous: {
        type: Boolean,
        default: false
    },
    reactions: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        type: {
            type: String,
            enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry'],
            required: true
        }
    }],
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    }],
    trendingNotificationSent: {
        type: Boolean,
        default: false
    },
    isHidden: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
});

postSchema.index({ topic: 1 });
postSchema.index({ user: 1 });
postSchema.index({ title: 'text', content: 'text' });

module.exports = mongoose.model('Post', postSchema);
