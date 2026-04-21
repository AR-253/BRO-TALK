const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.join(__dirname, 'config', 'serviceAccountKey.json');

console.log('Checking service account at:', serviceAccountPath);

if (fs.existsSync(serviceAccountPath)) {
    try {
        const serviceAccount = require(serviceAccountPath);
        if (serviceAccount && serviceAccount.project_id) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log('SUCCESS: Firebase Admin Initialized with Project ID:', serviceAccount.project_id);
        } else {
            console.log('FAILURE: Service account key is invalid (missing project_id).');
        }
    } catch (error) {
        console.error('FAILURE: Error loading service account key:', error.message);
    }
} else {
    console.log('FAILURE: serviceAccountKey.json not found at', serviceAccountPath);
}

process.exit();
