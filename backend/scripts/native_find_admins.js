const { MongoClient } = require('mongodb');

const uri = "mongodb://BRO-talk:BROTALK123@ac-cvnispi-shard-00-00.mcqjjgz.mongodb.net:27017,ac-cvnispi-shard-00-01.mcqjjgz.mongodb.net:27017,ac-cvnispi-shard-00-02.mcqjjgz.mongodb.net:27017/BRO-talk?replicaSet=atlas-2c0w56-shard-0&ssl=true&authSource=admin";

async function run() {
    console.log("Connecting...");
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    try {
        await client.connect();
        const db = client.db('BRO-talk');
        const admins = await db.collection('users').find({ role: 'admin' }).toArray();
        console.log("Admins found:", admins.map(a => ({ email: a.email, name: a.name, username: a.username, role: a.role })));
        await client.close();
        process.exit(0);
    } catch (e) {
        console.error("FAILED:", e.message);
        process.exit(1);
    }
}

run();
