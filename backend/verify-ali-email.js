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
        const user = await User.findOne({ email: 'alirazachaudhary143@gmail.com' });
        if (user) {
            console.log(`FOUND: ${user.name} | Verified: ${user.isVerified}`);
            user.isVerified = true;
            user.role = 'superadmin';
            await user.save();
            console.log("--> VERIFIED & MADE SUPERADMIN SUCCESSFULLY");
        } else {
            console.log("User not found with this email.");
        }
        await mongoose.disconnect();
    } catch (err) { console.error(err); }
};
run();
