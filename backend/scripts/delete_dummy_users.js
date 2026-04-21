const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const deleteDummyUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const dummyEmails = [
            'test@brotalk.com',
            'admin_test@brotalk.com',
            'normie@brotalk.com',
            'mention_target@brotalk.com',
            'suspend_me@brotalk.com'
        ];

        const result = await User.deleteMany({ email: { $in: dummyEmails } });
        console.log(`Deleted ${result.deletedCount} dummy users.`);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

deleteDummyUsers();
