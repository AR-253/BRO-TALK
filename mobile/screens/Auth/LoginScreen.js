import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api';
import { AuthContext } from '../../context/AuthContext';

const LoginScreen = ({ navigation }) => {
    const { login } = useContext(AuthContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/users/login', { email, password });
            login(res.data.token);
        } catch (err) {
            Alert.alert("Login Failed", err.response?.data?.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-900 items-center justify-center p-6">
            <View className="w-full max-w-sm">
                <Text className="text-4xl font-extrabold text-white mb-2 text-center">
                    BRO-TALK
                </Text>
                <Text className="text-indigo-300 mb-8 text-center text-lg">
                    Welcome Back
                </Text>

                <View className="space-y-4">
                    <TextInput
                        className="bg-white/10 text-white p-4 rounded-xl border border-white/20 font-medium"
                        placeholder="Email"
                        placeholderTextColor="#9ca3af"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <TextInput
                        className="bg-white/10 text-white p-4 rounded-xl border border-white/20 font-medium"
                        placeholder="Password"
                        placeholderTextColor="#9ca3af"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <TouchableOpacity
                        className="bg-indigo-600 p-4 rounded-xl items-center mt-4"
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <Text className="text-white font-bold text-lg">Login</Text>
                        )}
                    </TouchableOpacity>

                    <View className="flex-row justify-center mt-6">
                        <Text className="text-slate-400">Don't have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                            <Text className="text-indigo-400 font-bold">Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
};

export default LoginScreen;
