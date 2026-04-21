import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [userToken, setUserToken] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    const login = async (token) => {
        setIsLoading(true);
        setUserToken(token);
        await AsyncStorage.setItem('token', token);
        try {
            const res = await api.get('/users/me');
            setCurrentUser(res.data);
        } catch (e) {
            console.error("Failed to fetch user after login", e);
        }
        setIsLoading(false);
    };

    const logout = async () => {
        setIsLoading(true);
        setUserToken(null);
        setCurrentUser(null);
        await AsyncStorage.removeItem('token');
        setIsLoading(false);
    };

    const isLoggedIn = async () => {
        try {
            setIsLoading(true);
            let token = await AsyncStorage.getItem('token');
            if (token) {
                setUserToken(token);
                try {
                    const res = await api.get('/users/me');
                    setCurrentUser(res.data);
                } catch (e) {
                    console.error("Session fetch failed", e);
                }
            }
            setIsLoading(false);
        } catch (e) {
            console.log(`isLogged in error ${e}`);
        }
    };

    useEffect(() => {
        isLoggedIn();
    }, []);

    return (
        <AuthContext.Provider value={{ login, logout, isLoading, userToken, currentUser }}>
            {children}
        </AuthContext.Provider>
    );
}
