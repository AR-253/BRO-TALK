const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load models
const User = require('./models/User');
const Post = require('./models/Post');
const Topic = require('./models/Topic');
const Comment = require('./models/Comment');

dotenv.config();

const seedData = async () => {
    try {
        console.log("Connecting to MongoDB...");
        // Use the connection logic from the backend
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        // 1. CLEANUP FAKE USERS
        console.log("Cleaning up fake users...");
        const deletedUsers = await User.deleteMany({
            $or: [
                { username: { $regex: /test|demo|admin|123/i } },
                { name: { $regex: /test|demo|john doe|jane doe|123/i } },
                { email: { $regex: /test|demo|userA|userB/i } }
            ],
            // Don't delete Muhammad Ali raza (keep the obvious real user)
            _id: { $ne: '698c9d5970c4c78eb6502446' }
        });
        console.log(`Deleted ${deletedUsers.deletedCount} fake users.`);

        // 2. CLEAR ALL POSTS AND COMMENTS
        console.log("Clearing all posts and comments...");
        await Post.deleteMany({});
        await Comment.deleteMany({});

        // 3. GET TOPICS AND LEGITIMATE USERS
        const topics = await Topic.find({});
        const users = await User.find({});

        console.log(`Found ${users.length} users to use for seeding.`);

        const topicMap = {};
        topics.forEach(t => {
            topicMap[t.title] = t._id;
        });

        console.log("Topic Map:", JSON.stringify(topicMap, null, 2));
        console.log("Users for seeding:", users.map(u => u.name));

        const postsToSeed = [
            // Fitness & Health
            {
                title: "15-Minute Morning Routine for High-Performance Bros",
                content: "Stop scrolling and start moving. A quick burst of compound movements (pushups, squats, lunges) followed by 2 minutes of cold exposure sets your dopamine and cortisol for the day. Who's in?",
                topic: topicMap['Fitness & Health'],
                user: users[0 % users.length]._id
            },
            {
                title: "The Truth About Whey vs Casein",
                content: "Whey for the anabolic window, Casein for the overnight repair. Don't overcomplicate it. Just hit your 1g per lb of bodyweight and the gains will follow. Consistency > Perfect Timing.",
                topic: topicMap['Fitness & Health'],
                user: users[1 % users.length]._id
            },
            // Technology
            {
                title: "Why Node.js 22 is a Game Changer for Backends",
                content: "With built-in WebSocket support and native test runners, the ecosystem is leaner than ever. Are you still reaching for external libs or going native?",
                topic: topicMap['Technology'],
                user: users[2 % users.length]._id
            },
            {
                title: "AI won't replace you, but a Bro using AI will.",
                content: "Spent today automating my PR reviews using a custom LLM script. Saved 3 hours. Use the tools or get left behind. #TechBro",
                topic: topicMap['Technology'],
                user: users[3 % users.length] ? users[3 % users.length]._id : users[0]._id
            },
            // Career & Money
            {
                title: "The Solo-Preneur Stack for 2026",
                content: "1. Stripe for payments. 2. Vercel for hosting. 3. Cursor for dev. 4. X for distribution. That's all you need to hit $10k/month. Keep it simple.",
                topic: topicMap['Career & Money'],
                user: users[1 % users.length]._id
            },
            {
                title: "High-Interest Savings vs Index Funds right now?",
                content: "With the market volatility, I'm parking 40% in HYSA and DCA-ing the rest into VOO. What's your play this quarter?",
                topic: topicMap['Career & Money'],
                user: users[0]._id
            },
            // Advice / Venting
            {
                title: "What does 'Modern Bro' even mean in 2026?",
                content: "It's about balance. Career, health, mindset, and community. We're moving away from toxic traits and towards accountability. Thoughts?",
                topic: topicMap['Advice / Venting'],
                user: users[0]._id
            },
            // Dating & Relationships
            {
                title: "Communication is the real 'Alpha' trait",
                content: "True strength is being able to articulate your needs and listen to your partner without your ego getting in the way. Don't let the internet tell you otherwise.",
                topic: topicMap['Dating & Relationships'],
                user: users[1 % users.length]._id
            },
            // Lifestyle & Hobbies
            {
                title: "Is VR finally ready for the mainstream?",
                content: "Just tried the latest haptic suit with GTA VI (modded). The immersion is terrifyingly real. We are officially in the Matrix.",
                topic: topicMap['Lifestyle & Hobbies'],
                user: users[2 % users.length]._id
            }
        ].filter(p => p.topic && p.user);

        await Post.insertMany(postsToSeed);
        console.log(`Successfully seeded ${postsToSeed.length} posts.`);

        process.exit(0);
    } catch (err) {
        console.error("Seeding failed:", err);
        process.exit(1);
    }
};

seedData();
