const cron = require('node-cron');
const Report = require('../models/Report');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');

// Run every hour
cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Running daily maintenance tasks...');
    try {
        // 1. Delete resolved reports older than 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const reportResult = await Report.deleteMany({
            status: 'resolved',
            updatedAt: { $lt: thirtyDaysAgo }
        });
        console.log(`[CRON] Deleted ${reportResult.deletedCount} old resolved reports.`);

        // 2. Clear unverified users older than 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const userResult = await User.deleteMany({
            isVerified: false,
            createdAt: { $lt: sevenDaysAgo }
        });
        console.log(`[CRON] Deleted ${userResult.deletedCount} unverified old users.`);

        // 3. Auto-reactivate suspended/banned users after expiry
        const reactivationResult = await User.updateMany(
            {
                moderationUntil: { $lt: new Date() },
                $or: [{ isSuspended: true }, { isBanned: true }]
            },
            {
                isSuspended: false,
                isBanned: false,
                moderationUntil: null,
                warnings: 0
            }
        );
        if (reactivationResult.modifiedCount > 0) {
            console.log(`[CRON] Auto-reactivated ${reactivationResult.modifiedCount} users.`);
        }

        // 4. Permanent Cascading Delete for users who requested deletion > 30 days ago
        const usersToDelete = await User.find({
            isDeletionPending: true,
            deletionDate: { $lt: thirtyDaysAgo }
        });

        for (const user of usersToDelete) {
            const userId = user._id;

            // Delete Posts
            await Post.deleteMany({ user: userId });

            // Delete Comments
            await Comment.deleteMany({ user: userId });

            // Delete Notifications
            await Notification.deleteMany({ $or: [{ recipient: userId }, { sender: userId }] });

            // Clean up reactions from other posts and comments
            await Post.updateMany({}, { $pull: { reactions: { user: userId } } });
            await Comment.updateMany({}, { $pull: { reactions: { user: userId } } });

            // Finally delete the user
            await User.deleteOne({ _id: userId });
            console.log(`[CRON] Permanently deleted user ${user.username} and all associated data.`);
        }

    } catch (error) {
        console.error('[CRON] Error during maintenance:', error);
    }
});

console.log('[CRON] Jobs initialized.');
