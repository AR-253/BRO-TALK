const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Post = require('./models/Post');
const Topic = require('./models/Topic');
const User = require('./models/User');

dotenv.config();

const verify = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const posts = await Post.find({}).populate('topic', 'title').populate('user', 'name');
        console.log(`Verification: Found ${posts.length} posts.`);
        posts.forEach(p => {
            console.log(`[${p.topic?.title || 'No Topic'}] "${p.title}" by ${p.user?.name || 'Unknown User'}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verify();
