import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { useLocation, Link } from 'react-router-dom';
import EmojiPicker from 'emoji-picker-react';

const Messages = () => {
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const messagesEndRef = useRef(null);
    const pickerRef = useRef(null);
    const location = useLocation();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Close picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Filter conversations based on search query
    const filteredConversations = conversations.filter(conv => {
        const other = conv.participants.find(p => p._id !== currentUser?._id);
        return other?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    useEffect(() => {
        const fetchMe = async () => {
            try {
                const res = await api.get('/users/me');
                setCurrentUser(res.data);
                return res.data;
            } catch (err) {
                console.error(err);
                return null;
            }
        };

        const fetchConversations = async (user) => {
            try {
                const res = await api.get('/messages/conversations');
                setConversations(res.data);

                const searchParams = new URLSearchParams(location.search);
                const recipientId = searchParams.get('recipientId');

                if (recipientId) {
                    const existing = res.data.find(c =>
                        c.participants.some(p => p._id === recipientId)
                    );
                    if (existing) {
                        setActiveConversation(existing);
                        // Mark as read if found existing
                        await api.put(`/messages/${existing._id}/read`);
                    } else if (user) {
                        // Start new conversation: Fetch recipient info
                        try {
                            const userRes = await api.get(`/users/${recipientId}`);
                            setActiveConversation({
                                isNew: true,
                                participants: [user, userRes.data]
                            });
                        } catch (e) {
                            console.error("Failed to fetch recipient info", e);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to fetch conversations", err);
            } finally {
                setLoading(false);
            }
        };

        const init = async () => {
            const user = await fetchMe();
            await fetchConversations(user);
        };

        init();
    }, [location]);

    useEffect(() => {
        if (activeConversation && !activeConversation.isNew) {
            const fetchMessages = async () => {
                try {
                    const res = await api.get(`/messages/${activeConversation._id}`);
                    setMessages(res.data);

                    // If any unread messages from others, mark as read
                    const hasUnread = res.data.some(m => !m.isRead && m.sender._id !== currentUser?._id);
                    if (hasUnread) {
                        await api.put(`/messages/${activeConversation._id}/read`);
                        // Also refresh conversation list to clear badge in sidebar
                        const convRes = await api.get('/messages/conversations');
                        setConversations(convRes.data);
                    }

                    setTimeout(scrollToBottom, 100);
                } catch (err) {
                    console.error("Failed to fetch messages", err);
                }
            };
            fetchMessages();
            const interval = setInterval(fetchMessages, 5000);
            return () => clearInterval(interval);
        } else if (activeConversation?.isNew) {
            setMessages([]);
        }
    }, [activeConversation, currentUser]);

    const handleSelectConversation = async (conv) => {
        if (activeConversation?._id === conv._id) {
            setActiveConversation(null);
            return;
        }
        setActiveConversation(conv);
        try {
            await api.put(`/messages/${conv._id}/read`);
            const convRes = await api.get('/messages/conversations');
            setConversations(convRes.data);
        } catch (err) {
            console.error("Failed to mark as read", err);
        }
    };

    const onEmojiClick = (emojiObject) => {
        setNewMessage(prev => prev + emojiObject.emoji);
        // We might want to keep it open or close it. Messenger usually keeps it open or closes on click outside.
        // Let's close it to be safe or keep it for multi-emoji. Let's keep it open.
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser) return;

        try {
            const searchParams = new URLSearchParams(location.search);
            const recipientId = activeConversation
                ? activeConversation.participants.find(p => p._id !== currentUser._id)?._id
                : searchParams.get('recipientId');

            if (!recipientId) return;

            const res = await api.post('/messages', {
                recipientId,
                content: newMessage
            });

            setMessages(prev => [...prev, res.data]);
            setNewMessage("");
            setShowEmojiPicker(false);
            setTimeout(scrollToBottom, 100);

            // Refresh conversation list 
            const convRes = await api.get('/messages/conversations');
            setConversations(convRes.data);

            // If it was a new conversation, link it to the real one now
            if (activeConversation?.isNew) {
                const newConv = convRes.data.find(c =>
                    c.participants.some(p => p._id === recipientId)
                );
                if (newConv) setActiveConversation(newConv);
            }
        } catch (err) {
            console.error("Failed to send message", err);
        }
    };

    if (loading) return <div className="text-white text-center py-20">Loading chats...</div>;

    const getOtherParticipant = (conv) => {
        return conv.participants.find(p => p._id !== currentUser?._id) || { name: 'Chat' };
    };

    const getStatus = (user) => {
        if (!user || !user.lastSeen) return { isOnline: false, text: 'Offline' };
        const lastSeen = new Date(user.lastSeen);
        const diff = (new Date() - lastSeen) / 1000 / 60; // in minutes
        if (diff < 5) return { isOnline: true, text: 'Online' };

        // Formatted last seen
        const timeStr = lastSeen.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateStr = lastSeen.toLocaleDateString();
        return { isOnline: false, text: `Last seen ${timeStr}` };
    };

    return (
        <div className="max-w-6xl mx-auto h-[700px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden flex shadow-2xl">
            {/* LEFT: Conversation List */}
            <div className="w-1/3 border-r border-white/10 flex flex-col">
                <div className="p-6 border-b border-white/10 bg-white/5">
                    <h2 className="text-xl font-bold text-white mb-4">Messages</h2>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Search chats..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-all"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto font-sans">
                    {filteredConversations.length === 0 ? (
                        <p className="text-gray-400 p-6 text-center text-sm">
                            {searchQuery ? "No chats match your search." : "No conversations yet."}
                        </p>
                    ) : (
                        filteredConversations.map(conv => {
                            const other = getOtherParticipant(conv);
                            const isActive = activeConversation?._id === conv._id;
                            const status = getStatus(other);
                            const unreadCount = conv.unreadCount && currentUser ? (conv.unreadCount[currentUser._id] || 0) : 0;

                            return (
                                <button
                                    key={conv._id}
                                    onClick={() => handleSelectConversation(conv)}
                                    className={`w-full p-4 flex items-center gap-4 transition-all hover:bg-white/5 ${isActive ? 'bg-white/10 border-l-4 border-indigo-500' : ''}`}
                                >
                                    <div className="relative flex-shrink-0">
                                        <div className="w-12 h-12 rounded-full overflow-hidden bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg">
                                            {other.profilePicture ? (
                                                <img src={other.profilePicture} alt={other.name} className="w-full h-full object-cover" />
                                            ) : (
                                                other.name?.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        {status.isOnline && (
                                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-gray-900 rounded-full"></div>
                                        )}
                                    </div>
                                    <div className="text-left overflow-hidden flex-1">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <h4 className={`text-white truncate text-sm ${unreadCount > 0 ? 'font-black' : 'font-bold'}`}>{other.name}</h4>
                                            {unreadCount > 0 ? (
                                                <span className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                                                    {unreadCount}
                                                </span>
                                            ) : (
                                                status.isOnline && <span className="text-[10px] text-green-400 font-medium">Online</span>
                                            )}
                                        </div>
                                        <p className={`text-xs truncate leading-relaxed ${unreadCount > 0 ? 'text-white font-bold' : 'text-gray-400'}`}>
                                            {conv.lastMessage || "Start a conversation"}
                                        </p>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* RIGHT: Chat Window */}
            <div className="flex-1 flex flex-col bg-black/20">
                {activeConversation ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg">
                                        {getOtherParticipant(activeConversation).profilePicture ? (
                                            <img src={getOtherParticipant(activeConversation).profilePicture} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            getOtherParticipant(activeConversation).name?.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    {getStatus(getOtherParticipant(activeConversation)).isOnline && (
                                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-gray-900 rounded-full"></div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-sm leading-tight">{getOtherParticipant(activeConversation).name}</h3>
                                    <p className={`text-[11px] font-medium leading-tight ${getStatus(getOtherParticipant(activeConversation)).isOnline ? 'text-green-400' : 'text-gray-400'}`}>
                                        {getStatus(getOtherParticipant(activeConversation)).text}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Messages Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                            {messages.map((msg, idx) => {
                                const isMe = msg.sender === currentUser?._id || msg.sender?._id === currentUser?._id;
                                return (
                                    <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${isMe
                                            ? 'bg-indigo-600 text-white rounded-tr-none'
                                            : 'bg-white/10 text-gray-200 rounded-tl-none'
                                            }`}>
                                            {msg.content}
                                            <div className={`text-[10px] mt-1 opacity-50 ${isMe ? 'text-right' : 'text-left'}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleSendMessage} className="p-4 bg-white/5 border-t border-white/10 flex gap-2 items-center relative">
                            {showEmojiPicker && (
                                <div className="absolute bottom-20 left-4 z-50" ref={pickerRef}>
                                    <EmojiPicker
                                        onEmojiClick={onEmojiClick}
                                        theme="dark"
                                        searchDisabled
                                        skinTonesDisabled
                                        width={300}
                                        height={400}
                                    />
                                </div>
                            )}
                            <button
                                type="button"
                                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-yellow-400 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </button>
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type a message..."
                                className="flex-1 bg-black/40 border border-white/10 rounded-full px-6 py-3 text-white focus:outline-none focus:border-indigo-500 transition-all shadow-inner"
                            />
                            <button
                                type="submit"
                                className="w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center transition-all transform active:scale-95 shadow-lg flex-shrink-0"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-center items-center justify-center text-gray-500 flex-col gap-4">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        </div>
                        <p className="text-lg">Select a conversation to start chatting.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Messages;

