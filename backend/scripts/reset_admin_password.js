const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dns = require('dns');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
dns.setServers(['8.8.8.8', '8.8.4.4']);

const User = require('../models/User');

async function resetPassword() {
    try {
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000, family: 4 });
        console.log("Connected to DB.");

        const admin = await User.findOne({ email: 'admin@brotalk.com' });
        if (admin) {
            admin.password = 'admin123';
            admin.role = 'superadmin';
            await admin.save();
            console.log("Password for admin@brotalk.com forcefully reset to 'admin123' and role set to 'superadmin'.");
        } else {
            console.log("Admin user not found.");
        }
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

resetPassword();
