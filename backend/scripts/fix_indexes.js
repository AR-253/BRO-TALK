const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '.env') });

const fixIndexes = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected.");

        const User = mongoose.model('User', new mongoose.Schema({})); // Minimal schema to access collection

        console.log("Dropping existing unique indexes for email and phone...");
        try {
            await User.collection.dropIndex('email_1');
            console.log("Dropped email_1 index.");
        } catch (e) {
            console.log("email_1 index not found or already dropped.");
        }

        try {
            await User.collection.dropIndex('phone_1');
            console.log("Dropped phone_1 index.");
        } catch (e) {
            console.log("phone_1 index not found or already dropped.");
        }

        try {
            await User.collection.dropIndex('username_1');
            console.log("Dropped username_1 index.");
        } catch (e) {
            console.log("username_1 index not found or already dropped.");
        }

        console.log("Indexes dropped. They will be recreated with 'sparse: true' when the app restarts.");
        process.exit(0);
    } catch (err) {
        console.error("Error fixing indexes:", err);
        process.exit(1);
    }
};

fixIndexes();
