const mongoose = require('mongoose');
const { sendPushNotification } = require('../utils/firebaseAdmin');

const notificationSchema = mongoose.Schema({
    // ... (rest of the schema remains the same)
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['reply', 'mention', 'like', 'follow', 'friend_request', 'friend_request_accepted', 'trending', 'message'],
        required: true
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    },
    comment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment'
    },
    read: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
});

notificationSchema.post('save', async function (doc) {
    try {
        const User = mongoose.model('User');
        const recipient = await User.findById(doc.recipient);

        if (recipient && recipient.fcmToken) {
            let title = 'New Notification';
            let body = `You have a new ${doc.type}`;

            if (doc.type === 'reply') {
                title = 'New Reply';
                body = 'Someone replied to your comment/post';
            } else if (doc.type === 'mention') {
                title = 'New Mention';
                body = 'Someone mentioned you in a comment';
            } else if (doc.type === 'message') {
                title = 'New Message';
                body = 'You have a new message';
            } else if (doc.type === 'trending') {
                title = 'Trending Post';
                body = 'A post in one of your topics is trending!';
            }

            await sendPushNotification(recipient.fcmToken, title, body, {
                type: doc.type,
                notificationId: doc._id.toString()
            });
        }
    } catch (error) {
        console.error('Error in notification post-save hook:', error);
    }
});

module.exports = mongoose.model('Notification', notificationSchema);
