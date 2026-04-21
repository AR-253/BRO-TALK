import React, { useState, useEffect, useContext } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Image, Share, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Send, ThumbsUp, MessageCircle, Share2 } from 'lucide-react-native';
import Animated, { ZoomIn, FadeOut } from 'react-native-reanimated';
import api from '../../api';
import { AuthContext } from '../../context/AuthContext';

const PostDetailScreen = ({ route, navigation }) => {
    const { post } = route.params;
    const { currentUser } = useContext(AuthContext);
    const [fullPost, setFullPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [mentionSuggestions, setMentionSuggestions] = useState([]);
    const [mentionQuery, setMentionQuery] = useState(null);
    const [activeReaction, setActiveReaction] = useState(false);

    const REACTION_TYPES = [
        { type: 'like', icon: '👍', label: 'Like' },
        { type: 'love', icon: '❤️', label: 'Love' },
        { type: 'haha', icon: '😂', label: 'Haha' },
        { type: 'wow', icon: '😮', label: 'Wow' },
        { type: 'sad', icon: '😢', label: 'Sad' },
        { type: 'angry', icon: '😡', label: 'Angry' }
    ];

    const getImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `http://192.168.18.43:5000/${path.replace(/\\/g, '/')}`;
    };

    const fetchPostDetails = async () => {
        try {
            const res = await api.get(`/posts/${post._id}`);
            setFullPost(res.data);
        } catch (err) {
            console.error("Failed to fetch post details", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPostDetails();
    }, [post._id]);

    const handleComment = async () => {
        if (!comment.trim()) return;
        setSubmitting(true);
        try {
            await api.post(`/posts/${post._id}/comment`, { content: comment });
            setComment('');
            fetchPostDetails(); // Refresh comments
        } catch (err) {
            console.error("Failed to post comment", err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCommentChange = async (text) => {
        setComment(text);
        const match = text.match(/@(\w*)$/);

        if (match) {
            setMentionQuery(match[1]);
            try {
                const res = await api.get(`/users/search-users?q=${match[1]}`);
                setMentionSuggestions(res.data);
            } catch (err) {
                console.error("Failed to fetch suggestions", err);
            }
        } else {
            setMentionSuggestions([]);
            setMentionQuery(null);
        }
    };

    const handleSelectMention = (username) => {
        const newText = comment.replace(/@(\w*)$/, `@${username} `);
        setComment(newText);
        setMentionSuggestions([]);
        setMentionQuery(null);
    };

    const handleShare = async () => {
        try {
            await Share.share({ message: `Check out this discussion on BRO-TALK! http://192.168.18.43:3000/post/${post._id}` });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    const handleReaction = async (type = 'like') => {
        try {
            setActiveReaction(false);
            const isLiked = fullPost.reactions?.some(r => r.user === currentUser?._id);
            setFullPost(prev => ({
                ...prev,
                reactions: isLiked
                    ? prev.reactions.filter(r => r.user !== currentUser?._id)
                    : [...(prev.reactions || []), { user: currentUser?._id, type }]
            }));
            await api.put(`/posts/${post._id}/react`, { type });
        } catch (err) {
            console.error('Error reacting:', err);
            // Revert changes on error by fetching again
            fetchPostDetails();
        }
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
            {/* Header */}
            <View className="px-5 py-4 flex-row items-center border-b border-white/10 bg-slate-900/90 drop-shadow-lg z-50 pt-2 pb-3">
                <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4 p-2 -ml-2">
                    <ArrowLeft size={24} color="#f8fafc" />
                </TouchableOpacity>
                <Text className="text-xl font-black text-white tracking-tight">Discussion</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                className="flex-1"
            >
                <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
                    {/* Original Post */}
                    <View className="bg-white/5 p-5 rounded-3xl mb-6 border border-white/10 shadow-lg shadow-black/20">
                        <View className="flex-row items-center mb-4">
                            <View className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 justify-center items-center mr-3 border border-white/20 overflow-hidden">
                                {fullPost?.user?.profilePicture ? (
                                    <Image source={{ uri: getImageUrl(fullPost.user.profilePicture) }} className="w-full h-full object-cover" />
                                ) : (
                                    <Text className="text-white font-black text-lg">
                                        {fullPost?.user?.name ? fullPost.user.name.charAt(0).toUpperCase() : '?'}
                                    </Text>
                                )}
                            </View>
                            <View>
                                <Text className="text-white font-bold text-[16px]">{fullPost?.user?.name || 'Anonymous'}</Text>
                                <Text className="text-indigo-300/80 text-[11px] font-black uppercase tracking-widest mt-0.5">
                                    {new Date(fullPost?.createdAt).toLocaleDateString()}
                                </Text>
                            </View>
                        </View>

                        <Text className="text-white text-[20px] font-black mb-3 tracking-tight">{fullPost?.title}</Text>
                        <Text className="text-slate-300 font-medium leading-relaxed text-[15px] mb-6">{fullPost?.content}</Text>

                        {/* Actions */}
                        <View className="flex-row items-center justify-between border-t border-white/10 pt-4 relative">
                            {activeReaction && (
                                <Animated.View
                                    entering={ZoomIn.duration(200).springify()}
                                    exiting={FadeOut.duration(200)}
                                    className="absolute bottom-full left-0 mb-2 bg-slate-800 border border-white/10 rounded-full px-4 py-2 flex-row gap-4 shadow-xl shadow-black/50 z-50"
                                >
                                    {REACTION_TYPES.map(reaction => (
                                        <TouchableOpacity
                                            key={reaction.type}
                                            onPress={(e) => { e.stopPropagation(); handleReaction(reaction.type); }}
                                        >
                                            <Text className="text-2xl">{reaction.icon}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </Animated.View>
                            )}

                            <View className="flex-row items-center">
                                <TouchableOpacity
                                    onPress={() => handleReaction('like')}
                                    onLongPress={() => setActiveReaction(!activeReaction)}
                                    className="flex-row items-center gap-2 mr-4 bg-white/5 px-4 py-2 rounded-xl border border-white/5"
                                >
                                    {(() => {
                                        const userReaction = fullPost?.reactions?.find(r => r.user === currentUser?._id);
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
                                    <Text className={`font-bold text-sm ${fullPost?.reactions?.some(r => r.user === currentUser?._id) ? "text-pink-500" : "text-indigo-200"}`}>
                                        {fullPost?.reactions?.length || 0}
                                    </Text>
                                </TouchableOpacity>
                                <View className="flex-row items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                                    <MessageCircle size={18} color="#a5b4fc" />
                                    <Text className="text-indigo-200 font-bold text-sm">{fullPost?.comments?.length || 0}</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={handleShare} className="bg-white/5 p-2.5 rounded-xl border border-white/5">
                                <Share2 size={18} color="#a5b4fc" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Comments Section */}
                    <Text className="text-white font-black text-sm uppercase tracking-widest mb-4 ml-1">Comments</Text>
                    {fullPost?.comments?.length === 0 ? (
                        <Text className="text-slate-500 text-center py-6 font-medium">Break the ice and comment first!</Text>
                    ) : (
                        fullPost?.comments?.map((c, idx) => (
                            <View key={idx} className="bg-white/5 p-4 rounded-2xl mb-3 border border-white/5">
                                <View className="flex-row items-center mb-2">
                                    <View className="w-8 h-8 rounded-lg bg-indigo-500/20 justify-center items-center mr-3 overflow-hidden border border-indigo-500/30">
                                        {c.user?.profilePicture ? (
                                            <Image source={{ uri: getImageUrl(c.user.profilePicture) }} className="w-full h-full object-cover" />
                                        ) : (
                                            <Text className="text-indigo-300 font-bold text-xs">
                                                {c.user?.name ? c.user.name.charAt(0).toUpperCase() : '?'}
                                            </Text>
                                        )}
                                    </View>
                                    <View className="flex-row items-center">
                                        <Text className="text-indigo-200 font-bold text-sm mr-2">{c.user?.name || 'Anonymous'}</Text>
                                        <Text className="text-slate-500 text-[10px] font-bold mt-0.5">{new Date(c.createdAt).toLocaleDateString()}</Text>
                                    </View>
                                </View>
                                <Text className="text-slate-300 font-medium pl-11 text-sm">{c.content}</Text>
                            </View>
                        ))
                    )}
                    <View className="h-6" />
                </ScrollView>

                {/* Mentions Popup */}
                {mentionSuggestions.length > 0 && (
                    <View className="absolute bottom-[70px] left-4 max-h-48 w-64 bg-slate-800 border border-indigo-500/30 rounded-2xl shadow-xl shadow-black/40 overflow-hidden z-50">
                        <FlatList
                            data={mentionSuggestions}
                            keyExtractor={(item) => item._id}
                            keyboardShouldPersistTaps="handled"
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    onPress={() => handleSelectMention(item.username)}
                                    className="flex-row items-center p-3 border-b border-white/5 hover:bg-white/5"
                                >
                                    <View className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mr-3 overflow-hidden">
                                        {item.profilePicture ? (
                                            <Image source={{ uri: getImageUrl(item.profilePicture) }} className="w-full h-full object-cover" />
                                        ) : (
                                            <View className="w-full h-full items-center justify-center"><Text className="text-white font-bold text-xs">{item.name.charAt(0)}</Text></View>
                                        )}
                                    </View>
                                    <View>
                                        <Text className="text-white font-bold opacity-90">{item.name}</Text>
                                        <Text className="text-indigo-300 text-xs font-black">@{item.username}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                )}

                {/* Comment Input */}
                <View className="p-4 bg-slate-900 border-t border-white/10 flex-row items-end">
                    <TextInput
                        className="flex-1 bg-white/10 text-white rounded-2xl px-4 py-3 pb-3 mr-3 border border-white/10 max-h-32 min-h-[50px] font-medium"
                        placeholder="Type @ to mention..."
                        placeholderTextColor="#64748b"
                        multiline
                        value={comment}
                        onChangeText={handleCommentChange}
                    />
                    <TouchableOpacity
                        onPress={handleComment}
                        disabled={submitting || !comment.trim()}
                        className={`w-12 h-12 rounded-2xl justify-center items-center shadow-lg mb-0.5 ${comment.trim() ? 'bg-indigo-500 shadow-indigo-500/30' : 'bg-white/10'}`}
                    >
                        {submitting ? <ActivityIndicator size="small" color="#fff" /> : <Send size={20} color={comment.trim() ? "#fff" : "#64748b"} />}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default PostDetailScreen;
