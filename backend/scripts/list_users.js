const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const listUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({}, 'name email username');
        console.log("Users found:", users.length);
        users.forEach(u => console.log(`- ${u.name} (@${u.username}) [${u.email}] ID: ${u._id}`));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

listUsers();
