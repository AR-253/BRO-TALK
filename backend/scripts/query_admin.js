const mongoose = require('mongoose');
const dns = require('dns');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

dns.setServers(['8.8.8.8', '8.8.4.4']);

mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4
}).then(async () => {
    const User = require('../models/User');
    const admins = await User.find({ role: 'admin' }, 'email username name password');
    fs.writeFileSync('admin_output.json', JSON.stringify(admins, null, 2));
    process.exit(0);
}).catch(err => {
    console.log("DB ERROR:", err);
    process.exit(1);
});
