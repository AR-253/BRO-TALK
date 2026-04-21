const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const exportPath = path.join(__dirname, 'database_export');

async function exportDatabase() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB.');

        if (!fs.existsSync(exportPath)) {
            fs.mkdirSync(exportPath);
        }

        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();

        for (const collectionInfo of collections) {
            const collectionName = collectionInfo.name;
            console.log(`Exporting collection: ${collectionName}...`);

            const data = await db.collection(collectionName).find({}).toArray();
            const filePath = path.join(exportPath, `${collectionName}.json`);

            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`Saved to ${filePath}`);
        }

        console.log('Database export completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error exporting database:', err);
        process.exit(1);
    }
}

exportDatabase();
