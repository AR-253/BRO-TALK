const mongoose = require('mongoose');
const dns = require('dns');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });
dns.setServers(['8.8.8.8', '8.8.4.4']);

mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4
}).then(async () => {
    const User = require('../models/User');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    await User.updateOne({ email: 'admin@brotalk.com' }, { $set: { password: hashedPassword } });
    console.log("Password for admin@brotalk.com reset to admin123");
    process.exit(0);
}).catch(err => {
    console.log("Error:", err);
    process.exit(1);
});
