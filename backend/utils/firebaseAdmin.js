const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '..', 'config', 'serviceAccountKey.json');

if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log('Firebase Admin Initialized');
} else {
    console.warn('Firebase Service Account Key not found. Push notifications will be disabled.');
}

const sendPushNotification = async (token, title, body, data = {}) => {
    if (!admin.apps.length || !token) return;

    const message = {
        notification: {
            title,
            body
        },
        data,
        token
    };

    try {
        const response = await admin.messaging().send(message);
        console.log('Successfully sent push notification:', response);
    } catch (error) {
        console.error('Error sending push notification:', error);
    }
};

module.exports = { admin, sendPushNotification };
