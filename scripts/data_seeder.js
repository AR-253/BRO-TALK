const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load models
const User = require('../backend/models/User');
const Post = require('../backend/models/Post');
const Topic = require('../backend/models/Topic');
const Comment = require('../backend/models/Comment');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const seedData = async () => {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI);

        // Wait for connection to be fully open
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("Connection timeout")), 15000);
            mongoose.connection.once('open', () => {
                clearTimeout(timeout);
                console.log("Connected and open.");
                resolve();
            });
        });

        // 1. CLEANUP FAKE USERS
        const fakeUsernames = ['testuser', 'test', 'demo', 'admin_test'];
        const fakeNames = ['Test User', 'John Doe', 'Jane Doe'];

        console.log("Cleaning up fake users...");
        const deletedUsers = await User.deleteMany({
            $or: [
                { username: { $in: fakeUsernames } },
                { name: { $in: fakeNames } },
                { email: /test/i }
            ]
        });
        console.log(`Deleted ${deletedUsers.deletedCount} fake users.`);

        // 2. CLEAR ALL POSTS AND COMMENTS
        console.log("Clearing all posts and comments...");
        const deletedPosts = await Post.deleteMany({});
        const deletedComments = await Comment.deleteMany({});
        console.log(`Deleted ${deletedPosts.deletedCount} posts and ${deletedComments.deletedCount} comments.`);

        // 3. GET TOPICS AND LEGITIMATE USERS
        const topics = await Topic.find({});
        const users = await User.find({}).limit(5); // Use a few real users for seeding

        if (users.length === 0) {
            console.log("No users found to attribute posts to. Please create at least one user first.");
            process.exit(1);
        }

        const topicMap = {};
        topics.forEach(t => {
            topicMap[t.title] = t._id;
        });

        console.log("Seeding thematic posts...");

        const postsToSeed = [
            // Fitness
            {
                title: "15-Minute Morning Routine for High-Performance Bros",
                content: "Stop scrolling and start moving. A quick burst of compound movements (pushups, squats, lunges) followed by 2 minutes of cold exposure sets your dopamine and cortisol for the day. Who's in?",
                topic: topicMap['Fitness'],
                user: users[0]._id
            },
            {
                title: "The Truth About Whey vs Casein",
                content: "Whey for the anabolic window, Casein for the overnight repair. Don't overcomplicate it. Just hit your 1g per lb of bodyweight and the gains will follow. Consistency > Perfect Timing.",
                topic: topicMap['Fitness'],
                user: users[1 % users.length]._id
            },
            // Tech/Coding
            {
                title: "Why Node.js 22 is a Game Changer for Backends",
                content: "With built-in WebSocket support and native test runners, the ecosystem is leaner than ever. Are you still reaching for external libs or going native?",
                topic: topicMap['Coding'],
                user: users[0]._id
            },
            {
                title: "AI won't replace you, but a Bro using AI will.",
                content: "Spent today automating my PR reviews using a custom LLM script. Saved 3 hours. Use the tools or get left behind. #TechBro",
                topic: topicMap['Coding'],
                user: users[2 % users.length]._id
            },
            // Bro Talk Discussions
            {
                title: "What does 'Modern Bro' even mean in 2026?",
                content: "It's about balance. Career, health, mindset, and community. We're moving away from toxic traits and towards accountability. Thoughts?",
                topic: topicMap['Bro Talk Discussions'],
                user: users[0]._id
            },
            // Business
            {
                title: "The Solo-Preneur Stack for 2026",
                content: "1. Stripe for payments. 2. Vercel for hosting. 3. Cursor for dev. 4. X for distribution. That's all you need to hit $10k/month. Keep it simple.",
                topic: topicMap['Business'],
                user: users[1 % users.length]._id
            },
            {
                title: "High-Interest Savings vs Index Funds right now?",
                content: "With the market volatility, I'm parking 40% in HYSA and DCA-ing the rest into VOO. What's your play this quarter?",
                topic: topicMap['Business'],
                user: users[0]._id
            },
            // Gaming
            {
                title: "Is VR finally ready for the mainstream?",
                content: "Just tried the latest haptic suit with GTA VI (modded). The immersion is terrifyingly real. We are officially in the Matrix.",
                topic: topicMap['Gaming'],
                user: users[2 % users.length]._id
            },
            // Science
            {
                title: "Mars Colony Update: First Hydroponic Harvest",
                content: "They actually did it. Fresh greens grown on Martian soil (filtered). This is the biggest milestone for multi-planetary life since the landing.",
                topic: topicMap['Science'],
                user: users[0]._id
            }
        ];

        // Filter out posts that don't have a valid topic (if topicMap didn't find them)
        const validPosts = postsToSeed.filter(p => p.topic);

        await Post.insertMany(validPosts);
        console.log(`Successfully seeded ${validPosts.length} posts.`);

        process.exit(0);
    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
};

seedData();
