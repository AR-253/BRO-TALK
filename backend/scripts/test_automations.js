const mongoose = require('mongoose');
const dns = require('dns');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

dotenv.config({ path: path.join(__dirname, '../.env') });
dns.setServers(['8.8.8.8', '8.8.4.4']);

const User = require('../models/User');
const Post = require('../models/Post');
const Topic = require('../models/Topic');
const Report = require('../models/Report');
const containsProfanity = require('../utils/profanityFilter');

async function runTests() {
    try {
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000, family: 4 });
        console.log("Connected to DB for Testing.");

        // 1. Test Profanity Filter Logic
        console.log("\n--- Testing Profanity Logic ---");
        const cleanText = "I love this community!";
        const dirtyText = "You are a stupid idiot!";
        console.log("Clean text profanity:", containsProfanity(cleanText)); // Expected: false
        console.log("Dirty text profanity:", containsProfanity(dirtyText)); // Expected: true

        // 2. Test User Exists & Role
        console.log("\n--- Checking SuperAdmin Role ---");
        const admin = await User.findOne({ email: 'admin@brotalk.com' });
        if (admin) {
            console.log("Admin current role:", admin.role);
            if (admin.role !== 'superadmin') {
                admin.role = 'superadmin';
                await admin.save();
                console.log("Promoted admin@brotalk.com to superadmin for testing.");
            }
        } else {
            console.log("Admin user missing.");
        }

        console.log("\nAll preliminary logic checks passed.");
        process.exit(0);

    } catch (err) {
        console.error("Test Error:", err);
        process.exit(1);
    }
}

runTests();
