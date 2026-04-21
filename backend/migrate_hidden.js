const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const dns = require('dns');

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4']); // Force Google DNS for Atlas SRV Resolution

const migrate = async () => {
    try {
        console.log("Connecting to:", process.env.MONGO_URI ? "Defined" : "Undefined");
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            family: 4
        });
        console.log('MongoDB Connected for migration...');

        // Update Posts
        const postResult = await Post.updateMany(
            { isHidden: { $exists: false } },
            { $set: { isHidden: false } }
        );
        console.log(`Updated ${postResult.modifiedCount} posts with isHidden: false`);

        // Update Comments
        const commentResult = await Comment.updateMany(
            { isHidden: { $exists: false } },
            { $set: { isHidden: false } }
        );
        console.log(`Updated ${commentResult.modifiedCount} comments with isHidden: false`);

        process.exit();
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
