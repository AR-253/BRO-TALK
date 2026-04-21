const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dns = require('dns');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

const User = require('./models/User');

async function swapRoles() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB...');

        // 1. Ensure admin@brotalk.com is SuperAdmin
        const masterAdmin = await User.findOne({ email: 'admin@brotalk.com' });
        if (masterAdmin) {
            masterAdmin.role = 'superadmin';
            await masterAdmin.save();
            console.log('Main account admin@brotalk.com is now Super Admin.');
        } else {
            console.log('Main account admin@brotalk.com NOT FOUND.');
        }

        // 2. Demote chary143@gmail.com (Muhammad Ali Raza) to Admin
        const aliRaza = await User.findOne({ email: 'chary143@gmail.com' });
        if (aliRaza) {
            aliRaza.role = 'admin';
            await aliRaza.save();
            console.log('Muhammad Ali Raza (chary143@gmail.com) demoted to Admin.');
        } else {
            console.log('Muhammad Ali Raza account NOT FOUND.');
        }

        console.log('ROLE SWAP COMPLETED SUCCESSFULLY.');
        process.exit(0);
    } catch (err) {
        console.error('ERROR during role swap:', err);
        process.exit(1);
    }
}

swapRoles();
