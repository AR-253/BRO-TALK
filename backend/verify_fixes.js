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
                        reject({ statusCode: res.statusCode, error: parsed });
                    }
                } catch (e) {
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
        console.log('--- Verification Test Start ---');

        // 1. Setup Users
        console.log('Logging in User A (TestUserA)...');
        let tokenA, userAId;
        try {
            const loginA = await request('POST', '/users/login', { email: 'userA@brotalk.com', password: 'password123' });
            tokenA = loginA.token;
            userAId = loginA._id;
        } catch (e) {
            console.log('Registering User A...');
            const regA = await request('POST', '/users', { name: 'TestUserA', email: 'userA@brotalk.com', password: 'password123' });
            tokenA = regA.token;
            userAId = regA._id;
        }

        console.log('Logging in User B (TestUserB)...');
        let tokenB, userBId;
        try {
            const loginB = await request('POST', '/users/login', { email: 'userB@brotalk.com', password: 'password123' });
            tokenB = loginB.token;
            userBId = loginB._id;
        } catch (e) {
            console.log('Registering User B...');
            const regB = await request('POST', '/users', { name: 'TestUserB', email: 'userB@brotalk.com', password: 'password123' });
            tokenB = regB.token;
            userBId = regB._id;
        }

        // Cleanup: Unfollow/Reject if already exists to ensure clean state
        try {
            await request('PUT', `/users/${userAId}/unfollow`, null, tokenB);
        } catch (e) { }
        try {
            await request('PUT', `/users/${userBId}/reject-request`, null, tokenA);
        } catch (e) { }


        // 2. Get/Create Topic for Post
        consttopics = await request('GET', '/topics'); // Typo here fixed in next line? No, let's just get
        const topics = await request('GET', '/topics');
        let topicId;
        if (topics.length > 0) {
            topicId = topics[0]._id;
        } else {
            console.log("Creating topic...");
            // Need admin for topic creation generally? Assuming existing topic or open creation
            // If failed, we might skip
            if (topics.length === 0) {
                throw "No topics found and cannot create one easily without admin token handy (or assuming open)";
            }
        }
        console.log(`Using Topic ID: ${topicId}`);

        // 3. User A Creates Post
        console.log('User A creating post...');
        const post = await request('POST', '/posts', { title: 'Test Post', content: 'Like this post please!', topicId }, tokenA);
        const postId = post._id;
        console.log(`Post created: ${postId}`);

        // 4. User B Likes Post
        console.log('User B liking post...');
        await request('PUT', `/posts/${postId}/like`, null, tokenB);
        console.log('Post liked.');

        // 5. Check A's Notifications for Like
        console.log('Checking A notifications for LIKE...');
        const notifsA = await request('GET', '/notifications', null, tokenA);
        const likeNotif = notifsA.find(n => n.type === 'like' && n.post === postId && n.sender._id === userBId);
        if (likeNotif) {
            console.log('SUCCESS: Like notification found.');
        } else {
            console.error('FAILURE: Like notification NOT found.');
            // console.log(JSON.stringify(notifsA, null, 2));
        }

        // 6. User B Sends Friend Request to User A
        console.log('User B sending friend request to User A...');
        await request('PUT', `/users/${userAId}/friend-request`, null, tokenB);
        console.log('Friend request sent.');

        // 7. Check A's Notifications for Request
        console.log('Checking A notifications for FRIEND_REQUEST...');
        const notifsA_2 = await request('GET', '/notifications', null, tokenA);
        const reqNotif = notifsA_2.find(n => n.type === 'friend_request' && n.sender._id === userBId);
        if (reqNotif) {
            console.log('SUCCESS: Friend request notification found.');
        } else {
            console.error('FAILURE: Friend request notification NOT found.');
        }

        // 8. Check A's Friend Requests list
        console.log('Checking A friend requests list...');
        const requestsA = await request('GET', '/users/friend-requests', null, tokenA);
        const reqFound = requestsA.find(r => r._id === userBId);
        if (reqFound) {
            console.log('SUCCESS: User B found in User A friend requests.');
        } else {
            console.error('FAILURE: User B NOT found in User A friend requests.');
        }

        // 9. User A Accepts Friend Request
        console.log('User A accepting friend request...');
        await request('PUT', `/users/${userBId}/accept-request`, null, tokenA);
        console.log('Friend request accepted.');

        // 10. Check B's Notifications for Acceptance
        console.log('Checking B notifications for FRIEND_REQUEST_ACCEPTED...');
        const notifsB = await request('GET', '/notifications', null, tokenB);
        const accNotif = notifsB.find(n => n.type === 'friend_request_accepted' && n.sender._id === userAId);
        if (accNotif) {
            console.log('SUCCESS: Acceptance notification found.');
        } else {
            console.error('FAILURE: Acceptance notification NOT found.');
        }

        // 11. Verify Following Status
        console.log('Verifying mutual following...');
        const userA = await request('GET', '/users/me', null, tokenA);
        const userB = await request('GET', '/users/me', null, tokenB);

        const aFollowsB = userA.following.find(u => u._id === userBId || u === userBId); // Populate might affect this
        const bFollowsA = userB.following.find(u => u._id === userAId || u === userAId);

        if (aFollowsB && bFollowsA) {
            console.log('SUCCESS: Mutual following established.');
        } else {
            console.error('FAILURE: Mutual following NOT established.');
            console.log(`A follows B: ${!!aFollowsB}, B follows A: ${!!bFollowsA}`);
        }

    } catch (error) {
        console.error('Test Failed:', error);
    }
};

runTest();
