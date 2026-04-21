import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../../api';

const CreatePostScreen = ({ navigation }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    const handleCreatePost = async () => {
        if (!title.trim() || !content.trim()) {
            Alert.alert("Error", "Title and content are required");
            return;
        }

        setLoading(true);
        try {
            await api.post('/posts', { title, content });
            // Reset fields
            setTitle('');
            setContent('');
            // Optional: You could navigate back to Home and pass a param to trigger a refresh
            navigation.navigate('Home');
        } catch (err) {
            console.error(err);
            Alert.alert("Failed to Post", err.response?.data?.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-slate-900">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20 }}>
                    <View className="mb-6 border-b border-white/10 pb-4">
                        <Text className="text-3xl font-black text-white">New Post</Text>
                        <Text className="text-indigo-300 mt-1">What's on your mind?</Text>
                    </View>

                    <View className="space-y-4">
                        <View>
                            <Text className="text-slate-400 font-bold mb-2 ml-1">Title</Text>
                            <TextInput
                                className="bg-white/5 text-white p-4 rounded-xl border border-white/10 font-bold text-lg"
                                placeholder="Give it a catchy title..."
                                placeholderTextColor="#64748b"
                                value={title}
                                onChangeText={setTitle}
                            />
                        </View>

                        <View className="flex-1 min-h-[200px]">
                            <Text className="text-slate-400 font-bold mb-2 ml-1">Content</Text>
                            <TextInput
                                className="bg-white/5 text-white p-4 rounded-xl border border-white/10 font-medium flex-1 text-base text-left"
                                placeholder="Share your thoughts..."
                                placeholderTextColor="#64748b"
                                multiline
                                textAlignVertical="top"
                                value={content}
                                onChangeText={setContent}
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        className="bg-indigo-600 p-4 rounded-xl items-center mt-8 shadow-lg shadow-indigo-500/30"
                        onPress={handleCreatePost}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#ffffff" />
                        ) : (
                            <Text className="text-white font-bold text-lg">Share Post</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default CreatePostScreen;
