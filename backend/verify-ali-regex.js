const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const dns = require('dns');

dotenv.config();
dns.setServers(['8.8.8.8', '8.8.4.4']);

const uri = process.env.MONGO_URI || "mongodb://BRO-talk:BROTALK123@ac-cvnispi-shard-00-00.mcqjjgz.mongodb.net:27017,ac-cvnispi-shard-00-01.mcqjjgz.mongodb.net:27017,ac-cvnispi-shard-00-02.mcqjjgz.mongodb.net:27017/BRO-talk?replicaSet=atlas-2c0w56-shard-0&ssl=true&authSource=admin";

const run = async () => {
    try {
        await mongoose.connect(uri, { family: 4 });
        const users = await User.find({ email: /aliraza/i });
        if (users.length > 0) {
            console.log("Found matches:");
            for (const u of users) {
                console.log(`- Name: ${u.name} | Email: ${u.email} | Verified: ${u.isVerified}`);
                u.isVerified = true;
                u.role = 'superadmin';
                await u.save();
                console.log(`  --> VERIFIED: ${u.email}`);
            }
        } else {
            console.log("No user with 'aliraza' in email found.");
        }
        await mongoose.disconnect();
    } catch (err) { console.error(err); }
};
run();
