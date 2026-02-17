import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// [IMPORTANT] User needs to replace these with their actual Firebase project config
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestForToken = async (api) => {
    try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            const currentToken = await getToken(messaging, {
                vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY
            });
            if (currentToken) {
                console.log("FCM Token:", currentToken);
                // Send token to backend
                await api.put('/users/fcm-token', { token: currentToken });
            } else {
                console.log("No registration token available. Request permission to generate one.");
            }
        }
    } catch (err) {
        console.error("An error occurred while retrieving token. ", err);
    }
};

export const onMessageListener = () =>
    new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            console.log("Payload", payload);
            resolve(payload);
        });
    });

export default app;
