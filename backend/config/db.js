const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const dns = require('dns');
        dns.setServers(['8.8.8.8', '8.8.4.4']); // Force Google DNS for Atlas SRV Resolution

        console.log("Attempting to connect to MongoDB...");
        console.log("URI:", process.env.MONGO_URI ? "Defined" : "Undefined");
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error Connecting to DB: ${error.message}`);
        console.error(`Full Error Object:`, error);
        process.exit(1);
    }
};

module.exports = connectDB;
