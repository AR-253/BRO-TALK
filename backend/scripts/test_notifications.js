const http = require('http');

const baseURL = 'http://localhost:5000/api';

// Helper for making requests
const request = (method, path, body = null, token = null) => {
    return new Promise((resolve, reject) => {
        const url = new URL(baseURL + path);
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(parsed);
                    } else {
                        // Reject with status and parsed body
                        reject({ statusCode: res.statusCode, error: parsed });
                    }
                } catch (e) {
                    // Reject with status and raw data
                    reject({ statusCode: res.statusCode, error: data });
                }
            });
        });

        req.on('error', (e) => reject(e));

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
};

const runTest = async () => {
    try {
        console.log('--- Notify Test Start ---');

        // 1. Setup Users
        console.log('Logging in User A (Admin)...');
        let tokenA;
        try {
            const loginA = await request('POST', '/users/login', { email: 'admin_test@brotalk.com', password: 'password123' });
            tokenA = loginA.token;
        } catch (e) {
            console.error('Login A failed:', e);
            process.exit(1);
        }

        console.log('Logging in User B... (Normie)');
        let tokenB;
        try {
            const loginB = await request('POST', '/users/login', { email: 'normie@brotalk.com', password: 'password123' });
            tokenB = loginB.token;
        } catch (e) {
            console.log('Registering Normie...');
            await request('POST', '/users', { name: 'Normie Bro', email: 'normie@brotalk.com', password: 'password123' });
            const loginB = await request('POST', '/users/login', { email: 'normie@brotalk.com', password: 'password123' });
            tokenB = loginB.token;
        }

        console.log('Logging in Mention Target...');
        let tokenTarget;
        try {
            const loginT = await request('POST', '/users/login', { email: 'mention_target@brotalk.com', password: 'password123' });
            tokenTarget = loginT.token;
        } catch (e) {
            console.log('Registering Target...');
            await request('POST', '/users', { name: 'MentionTarget', email: 'mention_target@brotalk.com', password: 'password123' });
            const loginT = await request('POST', '/users/login', { email: 'mention_target@brotalk.com', password: 'password123' });
            tokenTarget = loginT.token;
        }

        // 2. Get/Create Topic
        const topics = await request('GET', '/topics');
        let topicId;
        if (topics.length > 0) {
            topicId = topics[0]._id;
        } else {
            const newTopic = await request('POST', '/topics', { title: 'JS Test Topic', description: 'Testing' }, tokenA);
            topicId = newTopic._id;
        }

        // 3. User A Creates Post
        console.log('User A (Admin) creating post...');
        const post = await request('POST', '/posts', { content: 'User B, reply please!', topicId }, tokenA);
        const postId = post._id;
        if (!postId) throw new Error('Post creation failed');
        console.log(`Post created: ${postId}`);

        // 4. User B Replies
        console.log('User B replying...');
        await request('POST', '/comments', { content: 'I am replying!', postId }, tokenB);

        // Check A's Notifications
        console.log('Checking A notifications...');
        try {
            const notifsA = await request('GET', '/notifications', null, tokenA);
            if (Array.isArray(notifsA)) {
                console.log('User A Notifs:', notifsA.map(n => ({ type: n.type, sender: n.sender?.name || 'Unknown', read: n.read })));
            } else {
                console.log('User A Notifs Response (Not Array):', notifsA);
            }
        } catch (e) {
            console.error('Failed to get notifications for A:', e);
        }

        // 5. User A mentions Target
        console.log('User A mentioning Target...');
        await request('POST', '/comments', { content: 'Hello @MentionTarget', postId }, tokenA);

        // Check Target's Notifications
        console.log('Checking Target notifications...');
        try {
            const notifsTarget = await request('GET', '/notifications', null, tokenTarget);
            if (Array.isArray(notifsTarget)) {
                console.log('Target Notifs:', notifsTarget.map(n => ({ type: n.type, sender: n.sender?.name || 'Unknown', read: n.read })));
            } else {
                console.log('Target Notifs Response (Not Array):', notifsTarget);
            }
        } catch (e) {
            console.error('Failed to get notifications for Target:', e);
        }

    } catch (error) {
        console.error('Test Failed (Global):', error);
    }
};

runTest();
