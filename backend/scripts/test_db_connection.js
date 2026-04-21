const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
    try {
        console.log("Testing MongoDB connection...");
        if (!process.env.MONGO_URI) {
            console.error("MONGO_URI is undefined!");
            process.exit(1);
        }
        console.log(`Using URI from env (redacted)`);
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        process.exit(0);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
};

connectDB();
