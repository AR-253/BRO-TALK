const { MongoClient } = require('mongodb');

const uris = [
    "mongodb+srv://BRO-talk:BROTALK123@cluster0.mcqjjgz.mongodb.net/BRO-talk?appName=Cluster0",
    "mongodb://BRO-talk:BROTALK123@ac-cvnispi-shard-00-00.mcqjjgz.mongodb.net:27017,ac-cvnispi-shard-00-01.mcqjjgz.mongodb.net:27017,ac-cvnispi-shard-00-02.mcqjjgz.mongodb.net:27017/BRO-talk?replicaSet=atlas-2c0w56-shard-0&ssl=true&authSource=admin"
];

async function testUri(uri) {
    console.log(`\nTesting: ${uri.substring(0, 40)}...`);
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
    try {
        await client.connect();
        console.log("--> SUCCESS!");
        await client.db('BRO-talk').command({ ping: 1 });
        console.log("--> PING SUCCESS!");
        await client.close();
    } catch (e) {
        console.error("--> FAILED:", e.message);
    }
}

async function run() {
    for (const uri of uris) {
        await testUri(uri);
    }
}
run();
