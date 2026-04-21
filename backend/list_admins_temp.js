const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const User = require('./models/User');

async function listSuperAdmins() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const users = await User.find({ role: 'superadmin' }).select('name email role');
        console.log('--- SUPER ADMINS ---');
        console.log(JSON.stringify(users, null, 2));

        const allAdmins = await User.find({ role: 'admin' }).select('name email role');
        console.log('--- ADMINS ---');
        console.log(JSON.stringify(allAdmins, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listSuperAdmins();
