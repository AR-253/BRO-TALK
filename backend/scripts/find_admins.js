const mongoose = require('mongoose');
const User = require('../models/User');

const uri = "mongodb://BRO-talk:BROTALK123@ac-cvnispi-shard-00-00.mcqjjgz.mongodb.net:27017,ac-cvnispi-shard-00-01.mcqjjgz.mongodb.net:27017,ac-cvnispi-shard-00-02.mcqjjgz.mongodb.net:27017/BRO-talk?replicaSet=atlas-2c0w56-shard-0&ssl=true&authSource=admin";

mongoose.connect(uri)
    .then(async () => {
        const admins = await User.find({ role: 'admin' }, 'email name username password');
        console.log('Admins found:', admins);
        process.exit(0);
    })
    .catch(err => {
        console.log(err);
        process.exit(1);
    });
