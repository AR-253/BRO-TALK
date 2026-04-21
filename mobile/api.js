import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// In development, use your computer's local IP address instead of localhost.
// E.g., const API_URL = 'http://192.168.1.XX:5000/api'; 
// If using an emulator, you might be able to use http://10.0.2.2:5000/api
const API_URL = 'http://192.168.18.139:5000/api'; // Live device test

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use(async (config) => {
    try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (error) {
        console.error("Error reading token from AsyncStorage:", error);
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
