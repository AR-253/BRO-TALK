const http = require('http');

const baseURL = 'http://localhost:5000/api';

const request = (method, path, body = null, token = null) => {
    return new Promise((resolve, reject) => {
        const url = new URL(baseURL + path);
        const options = { method, headers: { 'Content-Type': 'application/json' } };
        if (token) options.headers['Authorization'] = `Bearer ${token}`;

        const req = http.request(url, options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (res.statusCode >= 200 && res.statusCode < 300) resolve(parsed);
                    else reject({ statusCode: res.statusCode, error: parsed });
                } catch (e) { reject({ statusCode: res.statusCode, error: data }); }
            });
        });
        req.on('error', e => reject(e));
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
};

const runTest = async () => {
    try {
        console.log('--- Admin Test Start ---');

        // 1. Setup Admin
        let tokenA;
        try {
            const loginA = await request('POST', '/users/login', { email: 'admin_test@brotalk.com', password: 'password123' });
            tokenA = loginA.token;
            console.log('Admin Logged In.');
        } catch (e) {
            console.error('Admin Login Failed:', e);
            process.exit(1);
        }

        // 2. Setup User to Suspend
        let tokenB, userBId;
        const userEmail = 'suspend_me@brotalk.com';
        try {
            const loginB = await request('POST', '/users/login', { email: userEmail, password: 'password123' });
            tokenB = loginB.token;
            userBId = loginB._id;
            console.log('User B Logged In.');
        } catch (e) {
            console.log('Registering User B...');
            await request('POST', '/users', { name: 'Suspend Me', email: userEmail, password: 'password123' });
            const loginB = await request('POST', '/users/login', { email: userEmail, password: 'password123' });
            tokenB = loginB.token;
            userBId = loginB._id;
            console.log('User B Registered & Logged In.');
        }

        // 3. Admin List Users
        console.log('Admin fetching all users...');
        const users = await request('GET', '/users', null, tokenA);
        console.log(`Admin found ${users.length} users.`);

        // 4. User B List Users (Should Fail)
        console.log('User B fetching all users (Expect Fail)...');
        try {
            await request('GET', '/users', null, tokenB);
            console.error('ERROR: User B should NOT be able to list users!');
        } catch (e) {
            console.log('Success: User B denied (Status: ' + e.statusCode + ')');
        }

        // 5. Suspend User B
        console.log('Admin suspending User B...');
        await request('PUT', `/users/${userBId}/suspend`, null, tokenA);
        console.log('User B Suspended.');

        // 6. User B Login (Should Fail)
        console.log('User B trying to login (Expect Fail)...');
        try {
            await request('POST', '/users/login', { email: userEmail, password: 'password123' });
            console.error('ERROR: Suspended user logged in!');
        } catch (e) {
            console.log('Success: Login denied (Error: ' + JSON.stringify(e.error) + ')');
        }

        // 7. Unsuspend User B
        console.log('Admin unsuspending User B...');
        await request('PUT', `/users/${userBId}/suspend`, null, tokenA);
        console.log('User B Unsuspended.');

        // 8. User B Login (Should Succeed)
        console.log('User B trying to login again...');
        await request('POST', '/users/login', { email: userEmail, password: 'password123' });
        console.log('Success: User B logged in.');

    } catch (e) {
        console.error('Test Failed:', e);
    }
};

runTest();
