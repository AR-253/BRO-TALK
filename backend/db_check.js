const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Post = require('./models/Post');
const dns = require('dns');

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4']);

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, { family: 4 });
        console.log('MongoDB Connected');

        const totalCount = await Post.countDocuments();
        console.log('Total Post count in DB:', totalCount);

        const posts = await Post.find({}).limit(5);
        console.log('Sample Posts:', JSON.stringify(posts, null, 2));

        const hiddenCount = await Post.countDocuments({ isHidden: true });
        console.log('Hidden Post count:', hiddenCount);

        const visibleCount = await Post.countDocuments({ isHidden: false });
        console.log('Visible Post count:', visibleCount);

        process.exit();
    } catch (error) {
        console.error('Check failed:', error);
        process.exit(1);
    }
};

check();
