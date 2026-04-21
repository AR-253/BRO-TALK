const mongoose = require('mongoose');
const Report = require('./models/Report');
const User = require('./models/User');
const Post = require('./models/Post');
const Comment = require('./models/Comment');

async function test() {
    try {
        await mongoose.connect('mongodb+srv://BRO-talk:BROTALK123@cluster0.mcqjjgz.mongodb.net/BRO-talk?appName=Cluster0');
        console.log('Connected');

        const reports = await Report.find().limit(20);
        console.log(`Found ${reports.length} reports`);

        console.log('Starting population...');
        // Test the population that I think is failing
        const populatedReports = await Report.populate(reports, [
            {
                path: 'reportedItem',
                populate: { path: 'user', select: 'name email username profilePicture' }
            }
        ]);

        console.log('Population successful');
        process.exit(0);
    } catch (err) {
        console.error('Population failed:', err);
        process.exit(1);
    }
}

test();
