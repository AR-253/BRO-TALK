import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home, Hash, Bookmark, Users, Camera, Video,
    ThumbsUp, MessageCircle, Share2, MoreHorizontal,
    UserPlus, TrendingUp, Filter, Clock, Star, Check, Bell
} from 'lucide-react';
import { getImageUrl } from '../utils/imageUtils';

const PostFeed = () => {
    const [posts, setPosts] = useState([]);
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [topics, setTopics] = useState([]);
    const [trendingTopics, setTrendingTopics] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [menuOpen, setMenuOpen] = useState(null);
    const [editingPost, setEditingPost] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [showReactions, setShowReactions] = useState({});
    const [currentUser, setCurrentUser] = useState(null);

    // Reaction Constants
    const REACTION_TYPES = [
        { type: 'like', icon: '👍', label: 'Like', color: 'text-green-400' },
        { type: 'love', icon: '❤️', label: 'Love', color: 'text-pink-500' },
        { type: 'haha', icon: '😂', label: 'Haha', color: 'text-yellow-400' },
        { type: 'wow', icon: '😮', label: 'Wow', color: 'text-cyan-400' },
        { type: 'sad', icon: '😢', label: 'Sad', color: 'text-blue-300' },
        { type: 'angry', icon: '😡', label: 'Angry', color: 'text-red-500' }
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [postsRes, topicsRes] = await Promise.all([
                    api.get('/posts'),
                    api.get('/topics')
                ]);
                setPosts(postsRes.data);
                setTopics(topicsRes.data);
                setTrendingTopics(topicsRes.data.slice(0, 5));

                if (localStorage.getItem('token')) {
                    try {
                        const [userRes, suggestionsRes] = await Promise.all([
                            api.get('/users/me'),
                            api.get('/users/suggestions')
                        ]);
                        setCurrentUser(userRes.data);
                        setSuggestions(suggestionsRes.data.slice(0, 4));
                    } catch (userErr) {
                        console.error('Error fetching user data:', userErr);
                    }
                }

                setLoading(false);
            } catch (err) {
                console.error('Error fetching feed data:', err);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleReaction = async (postId, type) => {
        try {
            const res = await api.put(`/posts/${postId}/react`, { type });
            setPosts(posts.map(p => p._id === postId ? { ...p, reactions: res.data } : p));
            setShowReactions({ ...showReactions, [postId]: false });
        } catch (err) {
            console.error('Error reacting:', err);
        }
    };

    const handleFriendRequest = async (userId) => {
        try {
            await api.put(`/users/${userId}/friend-request`);
            alert("Friend request sent!");
            // Update suggestions to show sent status or remove
            setSuggestions(suggestions.filter(s => s._id !== userId));
        } catch (err) {
            console.error('Error sending friend request:', err);
            alert(err.response?.data?.message || "Failed to send request");
        }
    };

    const handleDelete = async (postId) => {
        if (!window.confirm('Are you sure you want to delete this post?')) return;
        try {
            await api.delete(`/posts/${postId}`);
            setPosts(posts.filter(p => p._id !== postId));
        } catch (err) {
            console.error('Error deleting post:', err);
        }
    };

    const handleUpdate = async (postId) => {
        try {
            const res = await api.put(`/posts/${postId}`, { content: editContent });
            setPosts(posts.map(p => p._id === postId ? res.data : p));
            setEditingPost(null);
        } catch (err) {
            console.error('Error updating post:', err);
        }
    };

    const handleSave = async (postId) => {
        if (!currentUser) return alert("Please log in to save posts.");
        try {
            const res = await api.put(`/users/save/${postId}`);
            if (res.data.isSaved) {
                setCurrentUser({ ...currentUser, savedPosts: [...(currentUser.savedPosts || []), postId] });
            } else {
                setCurrentUser({ ...currentUser, savedPosts: (currentUser.savedPosts || []).filter(id => id !== postId) });
            }
        } catch (err) {
            console.error("Save failed", err);
        }
    };

    const startEdit = (post) => {
        setEditingPost(post._id);
        setEditContent(post.content);
        setMenuOpen(null);
    };

    const SidebarItem = ({ icon: Icon, text, to = "#", active }) => (
        <Link to={to}>
            <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active
                    ? 'bg-white/10 text-white shadow-lg border border-white/10'
                    : 'text-indigo-200 hover:bg-white/5 hover:text-white'
                    }`}
            >
                <div className={`p-2 rounded-lg ${active ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg' : 'bg-white/5 group-hover:bg-white/10 transition-colors'}`}>
                    <Icon size={18} />
                </div>
                <span className="font-bold tracking-tight text-sm">{text}</span>
            </motion.div>
        </Link>
    );

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
        </div>
    );

    return (
        <div className={currentUser ? "grid grid-cols-1 lg:grid-cols-4 gap-8 relative z-10" : "max-w-4xl mx-auto relative z-10"}>
            {currentUser && (
                <div className="hidden lg:block space-y-8 sticky top-28 h-fit">
                    <div className="glass rounded-2xl p-6 border border-white/10 shadow-2xl">
                        <div className="flex items-center space-x-4 mb-8">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-0.5 shadow-lg overflow-hidden">
                                {currentUser?.profilePicture ? (
                                    <img src={getImageUrl(currentUser.profilePicture)} alt="Profile" className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                    <div className="w-full h-full bg-black/20 flex items-center justify-center text-white font-black text-xl">
                                        {currentUser?.name?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg tracking-tight">Welcome Back</h3>
                                <p className="text-indigo-200 text-sm font-medium">{currentUser?.name || 'Friend'}</p>
                                <Link to="/profile" className="text-pink-400 text-xs font-black uppercase tracking-widest mt-1 inline-block hover:underline">View Profile</Link>
                            </div>
                        </div>
                        <nav className="space-y-1">
                            <SidebarItem active={location.pathname === '/'} to="/" text="Home Feed" icon={Home} />
                            <SidebarItem active={location.pathname === '/topics'} to="/topics" text="Topics" icon={Hash} />
                            <SidebarItem active={location.pathname === '/bookmarks'} to="/bookmarks" text="Bookmarks" icon={Bookmark} />
                            <SidebarItem active={location.pathname === '/groups'} to="/groups" text="Groups" icon={Users} />
                            <SidebarItem active={location.pathname === '/messages'} to="/messages" text="Messages" icon={MessageCircle} />
                            <SidebarItem active={location.pathname === '/notifications'} to="/notifications" text="Notifications" icon={Bell} />
                        </nav>
                    </div>

                    {/* Mini Footer */}
                    <div className="px-6 text-[10px] text-indigo-300 font-black uppercase tracking-widest leading-relaxed">
                        <p>&copy; 2026 BroTalk. Professional Community.</p>
                        <div className="flex space-x-3 mt-3">
                            <a href="#" className="hover:text-white transition-colors">Privacy</a>
                            <span>•</span>
                            <a href="#" className="hover:text-white transition-colors">Terms</a>
                            <span>•</span>
                            <a href="#" className="hover:text-white transition-colors">Support</a>
                        </div>
                    </div>
                </div>
            )}

            {/* Center Feed */}
            <div className={currentUser ? "col-span-1 lg:col-span-2 space-y-6" : "w-full space-y-6"}>
                {/* Create Post Widget - Only for Logged In Users */}
                {currentUser && (
                    <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass rounded-2xl p-6 border border-white/10 shadow-2xl overflow-hidden relative group"
                    >
                        <div className="flex items-center space-x-4 mb-6 relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0 overflow-hidden flex items-center justify-center p-0.5 shadow-lg">
                                {currentUser && currentUser.profilePicture ? (
                                    <img src={getImageUrl(currentUser.profilePicture)} alt="Profile" className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white font-black text-lg bg-black/20 rounded-lg">
                                        {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                )}
                            </div>
                            <Link to="/create-post" className="flex-1">
                                <motion.div
                                    whileHover={{ scale: 1.005 }}
                                    whileTap={{ scale: 0.995 }}
                                    className="bg-white/5 hover:bg-white/10 transition-all rounded-xl px-5 py-3 text-indigo-200 text-sm font-medium border border-white/10 shadow-inner"
                                >
                                    Share your thoughts with the community...
                                </motion.div>
                            </Link>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-white/10 relative z-10">
                            <div className="flex space-x-2">
                                <motion.button whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }} className="flex items-center space-x-2 text-indigo-300 px-4 py-2 rounded-lg transition-all">
                                    <Camera className="w-5 h-5 text-pink-500" />
                                    <span className="text-sm font-bold">Photo</span>
                                </motion.button>
                            </div>
                            <Link to="/create-post">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-500/20 transition-all"
                                >
                                    Post Now
                                </motion.button>
                            </Link>
                        </div>
                    </motion.div>
                )}

                {/* Posts Feed */}
                {posts.length === 0 ? (
                    <div className="glass rounded-2xl p-16 text-center border border-white/10 shadow-2xl">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
                            <MessageCircle className="w-8 h-8 text-pink-500" />
                        </div>
                        <p className="text-white text-xl font-bold mb-2">No discussions yet</p>
                        <p className="text-indigo-200 mb-8 max-w-xs mx-auto text-sm">Be the first to start a conversation in this community.</p>
                        {currentUser && (
                            <Link to="/create-post" className="inline-block bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-3 rounded-xl font-black transition-all shadow-lg hover:shadow-indigo-500/20">
                                Create First Post
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {!currentUser && (
                            <div className="flex items-center justify-between px-2 mb-2">
                                <h2 className="text-white font-black text-xs uppercase tracking-[0.2em] flex items-center space-x-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    <span>Latest from the community</span>
                                </h2>
                            </div>
                        )}
                        {posts.map((post, index) => {
                            const isGuest = !currentUser;

                            if (isGuest) {
                                return (
                                    <motion.div
                                        key={post._id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => window.location.href = '/login'}
                                        className="glass rounded-2xl p-5 border border-white/5 hover:border-indigo-500/50 hover:bg-white/5 transition-all cursor-pointer group"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-3 flex-1 pr-4">
                                                <div className="flex items-center space-x-2">
                                                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase tracking-widest rounded border border-indigo-500/20">
                                                        {typeof post.topic === 'object' ? post.topic.title || post.topic.name : post.topic}
                                                    </span>
                                                    <span className="text-[9px] text-indigo-300/50 font-bold">{new Date(post.createdAt).toLocaleDateString()}</span>
                                                </div>
                                                <h3 className="text-lg font-black text-white group-hover:text-indigo-400 transition-colors leading-tight">
                                                    {post.title}
                                                </h3>
                                                <p className="text-indigo-200/60 text-sm line-clamp-2 font-medium">
                                                    {post.content}
                                                </p>
                                            </div>
                                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-indigo-500/10 transition-colors">
                                                <TrendingUp className="w-5 h-5 text-indigo-400" />
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            }

                            return (
                                <motion.article
                                    key={post._id}
                                    initial={{ opacity: 0, y: 15 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.05 }}
                                    className="glass rounded-2xl shadow-lg border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300 group relative"
                                >
                                    <div className="p-8 relative z-10">
                                        <div className="flex items-center justify-between mb-6">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-0.5 shadow-lg overflow-hidden">
                                                    {post.user?.profilePicture ? (
                                                        <img src={getImageUrl(post.user.profilePicture)} alt={post.user.name} className="w-full h-full object-cover rounded-lg" />
                                                    ) : (
                                                        <span className="text-white font-black text-lg">{post.user?.name ? post.user.name.charAt(0).toUpperCase() : '?'}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-white font-bold hover:text-pink-400 cursor-pointer transition-colors tracking-tight">
                                                        {post.user?.name || 'Anonymous'}
                                                    </p>
                                                    <div className="flex items-center space-x-2 text-indigo-300 text-[10px] font-black uppercase tracking-widest mt-0.5">
                                                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            {post.user && currentUser._id === post.user._id && (
                                                <div className="relative">
                                                    <button onClick={() => setMenuOpen(menuOpen === post._id ? null : post._id)} className="text-indigo-300 hover:text-white p-2 transition-colors">
                                                        <MoreHorizontal size={20} />
                                                    </button>
                                                    {menuOpen === post._id && (
                                                        <div className="absolute right-0 mt-2 w-48 glass-dark border border-white/10 rounded-xl shadow-2xl py-2 z-50 overflow-hidden">
                                                            <button onClick={() => startEdit(post)} className="w-full text-left px-4 py-2 text-sm text-indigo-100 hover:bg-white/10 transition-colors">Edit Discussion</button>
                                                            <button onClick={() => handleDelete(post._id)} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors">Delete Permanently</button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {editingPost === post._id ? (
                                            <div className="mb-6 space-y-4">
                                                <textarea
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    className="w-full bg-black/40 text-white p-5 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500 transition-all font-medium text-sm leading-relaxed"
                                                    rows="4"
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => setEditingPost(null)} className="px-5 py-2 text-xs text-indigo-300 font-black uppercase tracking-widest hover:text-white transition-colors">Cancel</button>
                                                    <button onClick={() => handleUpdate(post._id)} className="px-6 py-2 text-xs bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-black uppercase tracking-widest shadow-lg">Save</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mb-6">
                                                <Link to={`/post/${post._id}`}>
                                                    <h3 className="text-xl font-black text-white mb-3 hover:text-pink-400 transition-colors tracking-tight leading-tight">
                                                        {post.title}
                                                    </h3>
                                                </Link>
                                                <p className="text-slate-300 font-medium leading-[1.8] text-[15px] whitespace-pre-wrap">
                                                    {post.content}
                                                </p>
                                                {post.topic && (
                                                    <div className="flex flex-wrap gap-2 mt-5">
                                                        <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-500/30">
                                                            #{typeof post.topic === 'object' ? post.topic.title || post.topic.name : post.topic}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between pt-6 border-t border-white/10">
                                            <div className="flex items-center space-x-2">
                                                <div className="relative">
                                                    <motion.button
                                                        onMouseEnter={() => setShowReactions({ ...showReactions, [post._id]: true })}
                                                        onClick={() => handleReaction(post._id, 'like')}
                                                        className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all font-bold text-sm ${post.reactions && post.reactions.some(r => r.user === currentUser._id)
                                                            ? 'bg-pink-500/20 text-pink-500 border border-pink-500/30'
                                                            : 'text-indigo-200 hover:bg-white/5 hover:text-white'
                                                            }`}
                                                    >
                                                        {(() => {
                                                            const userReaction = post.reactions && post.reactions.find(r => r.user === currentUser._id);
                                                            const reactionType = userReaction ? userReaction.type : 'like';
                                                            const reactionIcon = REACTION_TYPES.find(r => r.type === reactionType)?.icon || <ThumbsUp className="w-4 h-4" />;
                                                            return <span className="text-lg">{reactionIcon}</span>;
                                                        })()}
                                                        <span>{post.reactions?.length || 0}</span>
                                                    </motion.button>

                                                    <AnimatePresence>
                                                        {showReactions[post._id] && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                                onMouseLeave={() => setShowReactions({ ...showReactions, [post._id]: false })}
                                                                className="absolute bottom-full left-0 mb-3 glass p-2 rounded-full flex space-x-2 shadow-2xl z-50 animate-fade-in"
                                                            >
                                                                {REACTION_TYPES.map((reaction) => (
                                                                    <motion.button
                                                                        key={reaction.type}
                                                                        whileHover={{ scale: 1.3, y: -5 }}
                                                                        whileTap={{ scale: 0.9 }}
                                                                        onClick={(e) => { e.stopPropagation(); handleReaction(post._id, reaction.type); }}
                                                                        className="text-2xl hover:drop-shadow-lg"
                                                                        title={reaction.label}
                                                                    >
                                                                        {reaction.icon}
                                                                    </motion.button>
                                                                ))}
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>

                                                <Link to={`/post/${post._id}`}>
                                                    <motion.div
                                                        whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                                                        className="flex items-center space-x-2 text-indigo-200 px-4 py-2 rounded-xl transition-all font-bold text-sm hover:text-white"
                                                    >
                                                        <MessageCircle className="w-4 h-4" />
                                                        <span>{post.commentsCount || 0}</span>
                                                    </motion.div>
                                                </Link>

                                                <motion.button
                                                    whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                                                    className="hidden sm:flex items-center space-x-2 text-indigo-200 px-4 py-2 rounded-xl transition-all font-bold text-sm hover:text-white"
                                                >
                                                    <Share2 className="w-4 h-4" />
                                                </motion.button>
                                            </div>

                                            <motion.button
                                                whileHover={{ scale: 1.1, color: '#ec4899' }}
                                                onClick={() => handleSave(post._id)}
                                                className={`p-2 rounded-xl transition-all ${currentUser?.savedPosts?.includes(post._id)
                                                    ? 'text-pink-500 bg-pink-500/10'
                                                    : 'text-indigo-200 hover:bg-white/5'
                                                    }`}
                                            >
                                                <Bookmark className="w-4 h-4" fill={currentUser?.savedPosts?.includes(post._id) ? "currentColor" : "none"} />
                                            </motion.button>
                                        </div>
                                    </div>
                                </motion.article>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Right Sidebar */}
            {currentUser && (
                <div className="hidden lg:block space-y-6 sticky top-28 h-fit">
                    {/* Trending Topics */}
                    <div className="glass rounded-2xl p-6 border border-white/10 shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-white font-black text-[10px] uppercase tracking-[0.2em]">Trending</h2>
                            <Link to="/topics" className="text-pink-500 text-[10px] font-black uppercase tracking-widest hover:underline">View All</Link>
                        </div>
                        <div className="space-y-4">
                            {trendingTopics.map((topic, i) => (
                                <Link key={i} to={`/topic/${topic._id}`} className="block group">
                                    <div className="flex items-center justify-between">
                                        <span className="text-indigo-100 group-hover:text-white font-bold text-sm transition-colors tracking-tight">{topic.name || topic.title}</span>
                                        <div className="w-1 h-1 rounded-full bg-indigo-500 group-hover:bg-pink-500 transition-colors" />
                                    </div>
                                    <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest">{topic.postCount || 0} Discussions</span>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Suggested Users */}
                    <div className="glass rounded-2xl p-6 border border-white/10 shadow-2xl">
                        <h2 className="text-white font-black text-[10px] uppercase tracking-[0.2em] mb-6">Connect</h2>
                        <div className="space-y-5">
                            {suggestions.map((user, i) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <Link to={`/profile/${user._id}`} className="flex items-center space-x-3 flex-1 min-w-0">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-white text-sm overflow-hidden">
                                            {user.profilePicture ? <img src={getImageUrl(user.profilePicture)} alt={user.name} className="w-full h-full object-cover" /> : user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="truncate">
                                            <p className="text-white font-bold text-sm tracking-tight group-hover:text-pink-500 transition-colors truncate">{user.name}</p>
                                            <p className="text-[10px] text-indigo-300 font-black uppercase tracking-widest leading-none truncate mt-0.5">@{user.username || 'user'}</p>
                                        </div>
                                    </Link>
                                    <button onClick={() => handleFriendRequest(user._id)} className="p-2 text-indigo-200 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all shadow-sm">
                                        <UserPlus className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PostFeed;
