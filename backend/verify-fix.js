const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const uri = process.env.MONGO_URI || "mongodb://BRO-talk:BROTALK123@ac-cvnispi-shard-00-00.mcqjjgz.mongodb.net:27017,ac-cvnispi-shard-00-01.mcqjjgz.mongodb.net:27017,ac-cvnispi-shard-00-02.mcqjjgz.mongodb.net:27017/BRO-talk?replicaSet=atlas-2c0w56-shard-0&ssl=true&authSource=admin";

const run = async () => {
    try {
        console.log("Connecting with:", uri.substring(0, 40));
        await mongoose.connect(uri, { family: 4 });

        const user = await User.findOne({
            $or: [
                { name: /muhammad ali raza/i },
                { username: /muhammad ali raza/i },
                { email: /muhammad ali raza/i }
            ]
        });

        if (user) {
            console.log("User Found:", user.name, "| Email:", user.email, "| isVerified:", user.isVerified);
            if (!user.isVerified) {
                user.isVerified = true;
                await user.save();
                console.log("--> User has been MANUALLY VERIFIED.");
            }
        } else {
            console.log("User not found.");
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
};

run();
