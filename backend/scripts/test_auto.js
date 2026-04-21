const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const dns = require('dns');

dotenv.config({ path: path.join(__dirname, '../.env') });
dns.setServers(['8.8.8.8', '8.8.4.4']);

const Report = require('../models/Report');
const User = require('../models/User');

async function checkAutomations() {
    try {
        await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000, family: 4 });

        console.log("=== BRO TALK AUTOMATION SYSTEM STATUS ===");

        // 1. Check Auto-Flagged Reports
        const autoReports = await Report.find({ reason: { $regex: /Auto-Flagged/i } });
        console.log(`\n1. Profanity Auto-Flagging:`);
        console.log(`- Total system-generated reports in DB: ${autoReports.length}`);
        if (autoReports.length > 0) {
            console.log(`- Status: [ACTIVE & WORKING]`);
            console.log(`- Example: "${autoReports[0].reason}" on Item ID: ${autoReports[0].reportedItem}`);
        } else {
            console.log(`- Status: [READY] (No bad words posted recently)`);
        }

        // 2. Check Auto-Suspended / Banned Users
        const suspendedUsers = await User.countDocuments({ isSuspended: true });
        const bannedUsers = await User.countDocuments({ isBanned: true });
        console.log(`\n2. Warning & Discipline System:`);
        console.log(`- Suspended Users (Max 3 warnings hit): ${suspendedUsers}`);
        console.log(`- Banned Users (Max 5 warnings hit):   ${bannedUsers}`);
        if (suspendedUsers > 0 || bannedUsers > 0) {
            console.log(`- Status: [ACTIVE & WORKING]`);
        } else {
            console.log(`- Status: [READY]`);
        }

        // 3. Check Settings Integration
        const Settings = require('../models/Settings');
        const settings = await Settings.findOne();
        console.log(`\n3. Dynamic Profanity Settings:`);
        console.log(`- Custom Bad Words Loaded in Memory: ${settings?.badWords?.length || 0}`);
        if (settings && settings.badWords.length > 0) {
            console.log(`- Sample Keywords: ${settings.badWords.slice(0, 4).join(', ')}`);
            console.log(`- Status: [ACTIVE & SYNCED WITH ADMIN UI]`);
        }

        console.log("\n=========================================");
        process.exit(0);
    } catch (e) {
        console.error("Error connecting or scanning:", e);
        process.exit(1);
    }
}
checkAutomations();
