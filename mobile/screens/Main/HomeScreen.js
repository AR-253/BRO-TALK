import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Image, Share } from 'react-native';
import { ThumbsUp, MessageCircle, Share2, Bell } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { ZoomIn, FadeOut } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api';
import { AuthContext } from '../../context/AuthContext';

const HomeScreen = ({ navigation }) => {
    const { logout, currentUser } = useContext(AuthContext);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeReactionPost, setActiveReactionPost] = useState(null);

    const REACTION_TYPES = [
        { type: 'like', icon: '👍', label: 'Like' },
        { type: 'love', icon: '❤️', label: 'Love' },
        { type: 'haha', icon: '😂', label: 'Haha' },
        { type: 'wow', icon: '😮', label: 'Wow' },
        { type: 'sad', icon: '😢', label: 'Sad' },
        { type: 'angry', icon: '😡', label: 'Angry' }
    ];

    const fetchPosts = async () => {
        try {
            const res = await api.get('/posts');
            setPosts(res.data);
        } catch (err) {
            console.error("Failed to fetch posts", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleReaction = async (postId, type = 'like') => {
        try {
            setActiveReactionPost(null);
            const res = await api.put(`/posts/${postId}/react`, { type });
            setPosts(posts.map(p => p._id === postId ? { ...p, reactions: res.data } : p));
        } catch (err) {
            console.error('Error reacting:', err);
        }
    };

    const handleShare = async (postId) => {
        try {
            await Share.share({
                message: `Check out this discussion on BRO-TALK! http://192.168.18.43:3000/post/${postId}`,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    // Helper to get image URL from backend
    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `http://192.168.18.43:5000/${path.replace(/\\/g, '/')}`;
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchPosts();
    }, []);

    const handleLogout = async () => {
        await logout();
    };

    const renderPost = ({ item }) => (
        <TouchableOpacity
            onPress={() => navigation.navigate('PostDetail', { post: item })}
            activeOpacity={0.8}
            className="bg-white/5 p-5 rounded-2xl mb-4 border border-white/10 shadow-lg shadow-black/20"
        >
            <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center flex-1">
                    <TouchableOpacity
                        onPress={(e) => { e.stopPropagation(); navigation.navigate('UserProfile', { userId: item.user._id }); }}
                        className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 justify-center items-center mr-3 border border-white/20 overflow-hidden"
                    >
                        {item.user?.profilePicture ? (
                            <Image
                                source={{ uri: getImageUrl(item.user.profilePicture) }}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <Text className="text-white font-black text-lg">
                                {item.user?.name ? item.user.name.charAt(0).toUpperCase() : '?'}
                            </Text>
                        )}
                    </TouchableOpacity>
                    <View className="flex-1 pr-2">
                        <Text className="text-white font-bold text-[15px]">{item.user?.name || 'Anonymous'}</Text>
                        <Text className="text-indigo-300/80 text-[11px] font-black uppercase tracking-widest mt-0.5">
                            {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                    </View>
                </View>
                {item.topic && (
                    <View className="bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded">
                        <Text className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                            {typeof item.topic === 'object' ? item.topic.title || item.topic.name : item.topic}
                        </Text>
                    </View>
                )}
            </View>

            <Text className="text-white text-[18px] font-black mb-2 tracking-tight">{item.title}</Text>
            <Text className="text-slate-300 font-medium leading-6 mb-5 text-[14px]">{item.content}</Text>

            <View className="flex-row items-center justify-between border-t border-white/10 pt-4 relative">
                {activeReactionPost === item._id && (
                    <Animated.View
                        entering={ZoomIn.duration(200).springify()}
                        exiting={FadeOut.duration(200)}
                        className="absolute bottom-full left-0 mb-2 bg-slate-800 border border-white/10 rounded-full px-4 py-2 flex-row gap-4 shadow-xl shadow-black/50 z-50"
                    >
                        {REACTION_TYPES.map(reaction => (
                            <TouchableOpacity
                                key={reaction.type}
                                onPress={(e) => { e.stopPropagation(); handleReaction(item._id, reaction.type); }}
                            >
                                <Text className="text-2xl">{reaction.icon}</Text>
                            </TouchableOpacity>
                        ))}
                    </Animated.View>
                )}

                <View className="flex-row items-center gap-6">
                    <TouchableOpacity
                        onPress={(e) => { e.stopPropagation(); handleReaction(item._id); }}
                        onLongPress={(e) => { e.stopPropagation(); setActiveReactionPost(activeReactionPost === item._id ? null : item._id); }}
                        className="flex-row items-center gap-2"
                    >
                        {(() => {
                            const userReaction = item.reactions?.find(r => r.user === currentUser?._id);
                            if (userReaction && userReaction.type !== 'like') {
                                const reactionObj = REACTION_TYPES.find(r => r.type === userReaction.type);
                                return <Text className="text-lg">{reactionObj?.icon}</Text>;
                            }
                            return (
                                <ThumbsUp
                                    size={18}
                                    color={userReaction ? "#ec4899" : "#a5b4fc"}
                                    fill={userReaction ? "#ec4899" : "transparent"}
                                />
                            );
                        })()}
                        <Text className={`font-bold text-sm ${item.reactions?.some(r => r.user === currentUser?._id) ? "text-pink-500" : "text-indigo-200"}`}>
                            {item.reactions?.length || item.reactionsCount || 0}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={(e) => { e.stopPropagation(); navigation.navigate('PostDetail', { post: item }); }}
                        className="flex-row items-center gap-2"
                    >
                        <MessageCircle size={18} color="#a5b4fc" />
                        <Text className="text-indigo-200 font-bold text-sm">{item.commentsCount || 0}</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={(e) => { e.stopPropagation(); handleShare(item._id); }}>
                    <Share2 size={18} color="#a5b4fc" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity >
    );

    return (
        <SafeAreaView className="flex-1 bg-slate-900 border-t-0 p-0 m-0">
            {/* Top Navbar */}
            <View className="px-5 py-4 flex-row justify-between items-center border-b border-white/10 bg-slate-900/90 drop-shadow-lg z-50 pt-2 pb-3">
                <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-xl items-center justify-center p-0.5 shadow-lg shadow-indigo-500/20">
                        <View className="w-full h-full bg-slate-900 rounded-lg justify-center items-center">
                            <Text className="text-white font-black text-lg">B</Text>
                        </View>
                    </View>
                    <Text className="text-2xl font-black text-white tracking-tight">
                        BRO<Text className="text-indigo-400">TALK</Text>
                    </Text>
                </View>

                <View className="flex-row gap-4 items-center">
                    <TouchableOpacity onPress={() => navigation.navigate('Notifications')} className="relative">
                        <Bell size={24} color="#a5b4fc" />
                        <View className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full border-2 border-slate-900"></View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleLogout} className="bg-white/10 px-4 py-2 rounded-lg ml-2 border border-white/5">
                        <Text className="text-indigo-200 font-bold text-xs uppercase tracking-widest">Logout</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#6366f1" />
                </View>
            ) : (
                <FlatList
                    className="flex-1"
                    data={posts}
                    keyExtractor={(item) => item._id}
                    renderItem={renderPost}
                    contentContainerClassName="p-4 pb-10"
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
                    }
                    ListEmptyComponent={
                        <View className="bg-white/5 border border-white/10 p-8 rounded-2xl items-center mt-6">
                            <MessageCircle size={40} color="#ec4899" className="mb-4" />
                            <Text className="text-white text-xl font-bold mb-2">No discussions yet</Text>
                            <Text className="text-indigo-200 text-center text-sm">Be the first to start a conversation.</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
};

export default HomeScreen;
