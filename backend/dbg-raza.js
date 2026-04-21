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
        const users = await User.find({
            $or: [
                { name: /raza/i },
                { name: /muh/i },
                { username: /raza/i },
                { username: /muh/i }
            ]
        });

        if (users.length > 0) {
            console.log("Matches found:");
            users.forEach(u => console.log(`- ${u.name} | @${u.username} | ${u.email}`));
        } else {
            console.log("No partial matches found for 'raza' or 'muh'.");
        }
        await mongoose.disconnect();
    } catch (err) { console.error(err); }
};
run();
