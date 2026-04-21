const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Topic = require('./models/Topic');

dotenv.config();

const listTopics = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const topics = await Topic.find({}, 'title description _id');
        console.log("Topics found:", topics.length);
        topics.forEach(t => console.log(`- ${t.title}: ${t.description} ID: ${t._id}`));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

listTopics();
