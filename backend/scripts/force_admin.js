const mongoose = require('mongoose');
const dns = require('dns');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '../.env') });
dns.setServers(['8.8.8.8', '8.8.4.4']);

const User = require('../models/User');

async function fixAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000, family: 4 });
        console.log("Connected to Mongo!");

        let admin = await User.findOne({ email: 'admin@brotalk.com' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        if (!admin) {
            console.log("Admin not found! Creating new Super Admin...");
            await User.create({
                name: "Super Admin",
                email: "admin@brotalk.com",
                password: "admin123",
                role: "superadmin",
                isVerified: true
            });
        } else {
            console.log("Admin found! Forcing password override via raw query...");
            await User.updateOne({ email: 'admin@brotalk.com' }, {
                $set: { password: hashedPassword, role: 'superadmin', isVerified: true, isSuspended: false, isBanned: false }
            });
        }

        console.log("SUCCESS! Password guaranteed to be 'admin123'.");
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

fixAdmin();
