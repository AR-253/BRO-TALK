import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, MapPin, Briefcase, AtSign, Globe, ArrowLeft } from 'lucide-react-native';
import api from '../../api';
import { AuthContext } from '../../context/AuthContext';

const ProfileScreen = ({ route, navigation }) => {
    const { logout, userToken } = useContext(AuthContext);
    const userId = route?.params?.userId || null;
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchProfile = async () => {
        try {
            const endpoint = userId ? `/users/${userId}` : '/users/me';
            const res = await api.get(endpoint);
            setProfile(res.data);
        } catch (err) {
            console.error("Failed to fetch profile", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `http://192.168.18.43:5000/${path.replace(/\\/g, '/')}`;
    };

    useEffect(() => {
        fetchProfile();
    }, [userId]);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchProfile();
    }, []);

    const handleLogout = async () => {
        await logout();
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-slate-900 justify-center items-center">
                <ActivityIndicator size="large" color="#6366f1" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-900 border-t-0 p-0 m-0">
            <View className="px-5 py-4 flex-row items-center border-b border-white/10 bg-slate-900/90 drop-shadow-lg z-50 pt-2 pb-3">
                {userId && (
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 p-2 -ml-2">
                        <ArrowLeft size={24} color="#f8fafc" />
                    </TouchableOpacity>
                )}
                <Text className="text-xl font-black text-white tracking-tight">Profile</Text>
            </View>
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ flexGrow: 1, padding: 20 }}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
            >
                <View className="items-center mt-8 mb-6">
                    <View className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 justify-center items-center shadow-lg shadow-indigo-500/20 mb-4 overflow-hidden border-2 border-slate-800">
                        {profile?.profilePicture ? (
                            <Image source={{ uri: getImageUrl(profile.profilePicture) }} className="w-full h-full object-cover" />
                        ) : (
                            <Text className="text-4xl font-extrabold text-white">
                                {profile?.name ? profile.name.charAt(0).toUpperCase() : '?'}
                            </Text>
                        )}
                    </View>
                    <Text className="text-3xl font-black text-white">{profile?.name || 'User'}</Text>
                    <Text className="text-indigo-300 font-bold mt-1 tracking-widest uppercase">
                        @{profile?.username || 'unknown'}
                    </Text>
                </View>

                <View className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-6 space-y-4">
                    {profile?.bio && (
                        <View className="mb-4">
                            <Text className="text-slate-400 font-bold mb-1 text-xs uppercase tracking-wider">Bio</Text>
                            <Text className="text-white text-base leading-relaxed">{profile.bio}</Text>
                        </View>
                    )}

                    <View className="flex-row items-center gap-3">
                        <MapPin size={20} color="#818cf8" />
                        <Text className="text-white flex-1">{profile?.location || 'Location not specified'}</Text>
                    </View>

                    <View className="flex-row items-center gap-3">
                        <Briefcase size={20} color="#818cf8" />
                        <Text className="text-white flex-1">{profile?.occupation || 'Occupation not specified'}</Text>
                    </View>

                    <View className="flex-row items-center gap-3">
                        <Globe size={20} color="#818cf8" />
                        <Text className="text-white flex-1">{profile?.website || 'Website not specified'}</Text>
                    </View>
                </View>

                {!userId && (
                    <TouchableOpacity
                        onPress={handleLogout}
                        className="mt-auto bg-red-500/10 px-6 py-4 rounded-xl border border-red-500/20 flex-row justify-center items-center gap-2"
                    >
                        <Text className="text-red-400 font-bold text-lg">Logout</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

export default ProfileScreen;
