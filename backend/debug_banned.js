const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const checkBanned = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const bannedUsers = await User.find({ isBanned: true }).select('name username email role isBanned');
        console.log('BANNED USERS IN DB:', JSON.stringify(bannedUsers, null, 2));
        console.log('TOTAL BANNED:', bannedUsers.length);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkBanned();
