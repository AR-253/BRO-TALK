const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env from backend folder
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const Topic = require('../backend/models/Topic');
const User = require('../backend/models/User');
const Post = require('../backend/models/Post');

async function inspectDB() {
    try {
        console.log('Connecting to:', process.env.MONGO_URI || 'mongodb://localhost:27017/brotalk');
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/brotalk');

        console.log('\n--- TOPICS ---');
        const topics = await Topic.find({}, 'title name _id description');
        topics.forEach(t => console.log(`[${t._id}] ${t.title || t.name}: ${t.description?.substring(0, 50)}...`));

        console.log('\n--- USERS (Last 10) ---');
        const users = await User.find({}, 'name username email _id').sort({ createdAt: -1 }).limit(10);
        users.forEach(u => console.log(`[${u._id}] ${u.name} (@${u.username}) - ${u.email}`));

        console.log('\n--- POSTS (First 10) ---');
        const posts = await Post.find({}, 'title content _id user topic').limit(10);
        posts.forEach(p => console.log(`[${p._id}] Title: ${p.title} | User: ${p.user}`));

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

inspectDB();
