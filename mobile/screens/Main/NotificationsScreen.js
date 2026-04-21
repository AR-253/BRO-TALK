import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Bell } from 'lucide-react-native';
import api from '../../api';

const NotificationsScreen = ({ navigation }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data);
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error("Failed to mark as read", err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
        } catch (err) {
            console.error("Failed to mark all as read", err);
        }
    };

    const renderNotification = ({ item }) => (
        <View
            className={`p-5 border-b border-white/10 flex-row items-start ${!item.isRead ? 'bg-indigo-500/10' : 'bg-transparent'}`}
        >
            <TouchableOpacity
                onPress={() => {
                    if (!item.isRead) markAsRead(item._id);
                    if (item.sender) navigation.navigate('UserProfile', { userId: item.sender._id });
                }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 justify-center items-center mr-4 border border-white/10 overflow-hidden shadow-lg"
            >
                {(item.sender && item.sender.profilePicture) ? (
                    <Image source={{ uri: `http://192.168.18.43:5000/${item.sender.profilePicture}` }} className="w-full h-full object-cover" />
                ) : (
                    <Text className="text-white font-black text-lg">
                        {item.sender?.name ? item.sender.name.charAt(0).toUpperCase() : '?'}
                    </Text>
                )}
            </TouchableOpacity>

            <View className="flex-1">
                <Text className="text-white text-[15px] font-medium leading-5 mb-1">
                    <Text className="font-bold text-indigo-100">{item.sender?.name || 'System'} </Text>
                    {item.message}
                </Text>
                <Text className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-3">
                    {new Date(item.createdAt).toLocaleDateString()}
                </Text>

                {item.post && item.post._id && (
                    <TouchableOpacity
                        onPress={() => {
                            if (!item.isRead) markAsRead(item._id);
                            navigation.navigate('PostDetail', { post: item.post });
                        }}
                        className="self-start bg-white/5 px-4 py-2 rounded-xl border border-white/10 flex-row items-center"
                    >
                        <Text className="text-indigo-300 font-bold text-xs">View Discussion</Text>
                    </TouchableOpacity>
                )}
            </View>

            {!item.isRead && (
                <TouchableOpacity onPress={() => markAsRead(item._id)} className="w-4 h-8 justify-center items-end">
                    <View className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-md shadow-pink-500/50" />
                </TouchableOpacity>
            )}
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView className="flex-1 bg-slate-900 justify-center items-center">
                <ActivityIndicator size="large" color="#6366f1" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-slate-900 border-t-0 p-0 m-0">
            {/* Header */}
            <View className="px-5 py-4 flex-row justify-between items-center border-b border-white/10 bg-slate-900/90 drop-shadow-lg z-50 pt-2 pb-3">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 p-2 -ml-2">
                        <ArrowLeft size={24} color="#f8fafc" />
                    </TouchableOpacity>
                    <Text className="text-xl font-black text-white tracking-tight">Notifications</Text>
                </View>
                {notifications.some(n => !n.isRead) && (
                    <TouchableOpacity onPress={markAllAsRead}>
                        <Text className="text-pink-400 font-bold text-xs uppercase tracking-widest">Mark All Read</Text>
                    </TouchableOpacity>
                )}
            </View>

            <FlatList
                data={notifications}
                keyExtractor={(item) => item._id}
                renderItem={renderNotification}
                ListEmptyComponent={
                    <View className="flex-1 justify-center items-center mt-20">
                        <Bell size={48} color="#475569" className="mb-4 opacity-50" />
                        <Text className="text-slate-400 text-lg font-bold">No notifications yet</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

export default NotificationsScreen;
