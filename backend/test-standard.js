const { MongoClient } = require('mongodb');

const uri = "mongodb://BRO-talk:BROTALK123@ac-cvnispi-shard-00-00.mcqjjgz.mongodb.net:27017,ac-cvnispi-shard-00-01.mcqjjgz.mongodb.net:27017,ac-cvnispi-shard-00-02.mcqjjgz.mongodb.net:27017/BRO-talk?replicaSet=atlas-2c0w56-shard-0&ssl=true&authSource=admin";

async function test() {
    console.log("Testing standard connection string...");
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
test();
