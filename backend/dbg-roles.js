const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const checkUsers = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const allUsers = await User.find({}, 'name email role');
        console.log('--- ALL USERS ---');
        allUsers.forEach(u => console.log(`${u.name} | ${u.email} | Role: ${u.role || 'NONE'}`));

        const userCount = await User.countDocuments({ role: 'user' });
        console.log('\nCount with { role: "user" }:', userCount);

        const noRoleCount = await User.countDocuments({ role: { $exists: false } });
        console.log('Count with no role field:', noRoleCount);

        const totalCount = await User.countDocuments();
        console.log('Absolute total count:', totalCount);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkUsers();
