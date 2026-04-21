import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api';
import { AuthContext } from '../../context/AuthContext';

const SignupScreen = ({ navigation }) => {
    const { login } = useContext(AuthContext);
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
        if (!name || !username || !email || !password) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/users/register', { name, username, email, password });
            login(res.data.token);
        } catch (err) {
            Alert.alert("Signup Failed", err.response?.data?.message || 'Failed to create account');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-900">
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
                <View className="w-full max-w-sm self-center">
                    <Text className="text-4xl font-extrabold text-white mb-2 text-center">
                        Join BRO-TALK
                    </Text>
                    <Text className="text-indigo-300 mb-8 text-center text-lg">
                        Create an account to start connecting.
                    </Text>

                    <View className="space-y-4">
                        <TextInput
                            className="bg-white/10 text-white p-4 rounded-xl border border-white/20 font-medium"
                            placeholder="Full Name"
                            placeholderTextColor="#9ca3af"
                            value={name}
                            onChangeText={setName}
                        />

                        <TextInput
                            className="bg-white/10 text-white p-4 rounded-xl border border-white/20 font-medium"
                            placeholder="Username"
                            placeholderTextColor="#9ca3af"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                        />

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
                            className="bg-indigo-600 p-4 rounded-xl items-center mt-4 shadow-lg shadow-indigo-500/30"
                            onPress={handleSignup}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#ffffff" />
                            ) : (
                                <Text className="text-white font-bold text-lg">Sign Up</Text>
                            )}
                        </TouchableOpacity>

                        <View className="flex-row justify-center mt-6">
                            <Text className="text-slate-400">Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text className="text-indigo-400 font-bold">Login</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

export default SignupScreen;
