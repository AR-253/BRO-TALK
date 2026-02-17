import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { MoreVertical, Trash2 } from 'lucide-react';

const TopicDetail = () => {
    const { id } = useParams();
    const [posts, setPosts] = useState([]);
    const [topic, setTopic] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [showMenu, setShowMenu] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMe = async () => {
            try {
                if (localStorage.getItem('token')) {
                    const res = await api.get('/users/me');
                    setCurrentUser(res.data);
                }
            } catch (err) {
                console.error("Error fetching me", err);
            }
        };
        fetchMe();
    }, []);

    // Reaction Logic
    const REACTION_TYPES = [
        { type: 'like', icon: '👍', label: 'Like', color: 'text-blue-500' },
        { type: 'love', icon: '❤️', label: 'Love', color: 'text-red-500' },
        { type: 'haha', icon: '😂', label: 'Haha', color: 'text-yellow-500' },
        { type: 'wow', icon: '😮', label: 'Wow', color: 'text-yellow-500' },
        { type: 'sad', icon: '😢', label: 'Sad', color: 'text-yellow-500' },
        { type: 'angry', icon: '😡', label: 'Angry', color: 'text-red-600' }
    ];

    const handleReaction = async (postId, type) => {
        if (!currentUser) return alert("Please log in to react.");

        try {
            const res = await api.put(`/posts/${postId}/react`, { type });
            setPosts(posts.map(p => p._id === postId ? { ...p, reactions: res.data } : p));
        } catch (err) {
            console.error("Reaction failed", err);
        }
    };

    const getUserReaction = (post) => {
        if (!currentUser || !post.reactions) return null;
        return post.reactions.find(r => r.user === currentUser._id || r.user?._id === currentUser._id);
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

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch topic details
                const topicRes = await api.get(`/topics/${id}`);
                setTopic(topicRes.data);

                // Fetch posts for this topic
                const postsRes = await api.get(`/posts/topic/${id}`);
                setPosts(postsRes.data);

                setError(null);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError('Failed to load topic or posts.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleSubscribe = async () => {
        try {
            await api.put(`/topics/${id}/subscribe`);
            const topicRes = await api.get(`/topics/${id}`);
            setTopic(topicRes.data);
            alert('Subscription updated!');
        } catch (err) {
            console.error("Error subscribing:", err);
            alert('Failed to update subscription. You might need to login.');
        }
    };

    const handleDeleteTopic = async () => {
        if (!window.confirm("Are you sure you want to delete this group? This action cannot be undone.")) return;
        try {
            await api.delete(`/topics/${id}`);
            alert("Group deleted successfully.");
            // Redirect to topics list
            navigate('/topics');
        } catch (err) {
            console.error("Error deleting group:", err);
            alert(err.response?.data?.message || "Failed to delete group");
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-900">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-900">
            <div className="text-red-300 text-xl">{error}</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            </div>

            <div className={`relative z-10 mx-auto ${currentUser ? 'max-w-5xl' : 'max-w-4xl'}`}>
                <Link to="/topics" className="inline-flex items-center text-indigo-300 hover:text-white mb-8 transition-colors">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    Back to Topics
                </Link>

                {/* Topic Header */}
                {topic && (
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 lg:p-10 mb-10 shadow-2xl relative">
                        {/* Background Blobs Container with Overflow Hidden */}
                        <div className="absolute inset-0 overflow-hidden rounded-3xl">
                            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full blur-3xl opacity-30"></div>
                        </div>

                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
                                    {topic.title}
                                </h1>
                                <p className="text-indigo-100 text-lg max-w-2xl leading-relaxed mb-6">
                                    {topic.description}
                                </p>
                                <div className="flex items-center space-x-4 text-indigo-200">
                                    <span className="flex items-center">
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                        {topic.subscribers ? topic.subscribers.length : 0} Members
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center mt-6 md:mt-0">
                            <button
                                onClick={() => currentUser ? handleSubscribe() : window.location.href = '/login'}
                                className={`px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${currentUser && topic.subscribers?.includes(currentUser?._id)
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : 'bg-white text-indigo-900 hover:bg-indigo-50'
                                    }`}
                            >
                                {currentUser && topic.subscribers?.includes(currentUser?._id) ? '✓ Joined' : 'Join Community'}
                            </button>
                            {/* Delete Button for Creator */}
                            {currentUser && topic.createdBy === currentUser._id && (
                                <div className="relative ml-4">
                                    <button
                                        onClick={() => setShowMenu(!showMenu)}
                                        className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all"
                                    >
                                        <MoreVertical size={20} />
                                    </button>

                                    {showMenu && (
                                        <div className="absolute right-0 mt-2 w-48 bg-[#1a1c2e] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                                            <button
                                                onClick={handleDeleteTopic}
                                                className="w-full flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-500/10 transition-colors text-left"
                                            >
                                                <Trash2 size={18} />
                                                <span className="font-medium">Delete Group</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                )}

                {/* Posts List */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white">Latest Discussions</h2>
                        {currentUser && (
                            <Link to="/create-post" state={{ topicId: id }} className="text-pink-300 hover:text-white font-medium transition-colors">
                                + Start New Discussion
                            </Link>
                        )}
                    </div>

                    {posts.length === 0 ? (
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center backdrop-blur-sm">
                            <p className="text-indigo-200 text-lg mb-4">No discussions here yet.</p>
                            {currentUser && (
                                <Link to="/create-post" state={{ topicId: id }} className="inline-block bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                                    Be the first to post
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {posts.map((post) => {
                                const isGuest = !currentUser;

                                if (isGuest) {
                                    return (
                                        <div
                                            key={post._id}
                                            onClick={() => window.location.href = '/login'}
                                            className="bg-white/5 backdrop-blur-md border border-white/5 p-5 rounded-2xl hover:bg-white/10 hover:border-indigo-500/50 transition-all cursor-pointer group flex items-start justify-between"
                                        >
                                            <div className="space-y-2 flex-1 pr-4">
                                                <div className="text-[10px] text-indigo-300 font-black uppercase tracking-widest">
                                                    {new Date(post.createdAt).toLocaleDateString()}
                                                </div>
                                                <h3 className="text-lg font-black text-white group-hover:text-indigo-400 transition-colors leading-tight">
                                                    {post.title || post.content.substring(0, 50) + '...'}
                                                </h3>
                                                <p className="text-indigo-100/60 text-sm line-clamp-1 font-medium">
                                                    {post.content}
                                                </p>
                                            </div>
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-indigo-500/10 transition-colors">
                                                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={post._id} className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-all duration-300 group">
                                        <div className="flex items-center mb-4">
                                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mr-4 text-white font-bold shadow-md overflow-hidden">
                                                {post.user?.profilePicture ? (
                                                    <img src={post.user.profilePicture} alt={post.user.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    post.user?.name ? post.user.name.charAt(0).toUpperCase() : '?'
                                                )}
                                            </div>
                                            <div>
                                                <span className="font-semibold text-white block">
                                                    {post.user?.name || 'Anonymous'}
                                                </span>
                                                <span className="text-indigo-300 text-xs">
                                                    {new Date(post.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-pink-300 transition-colors">
                                            <Link to={`/post/${post._id}`}>
                                                {post.title || post.content.substring(0, 50) + (post.content.length > 50 ? '...' : '')}
                                            </Link>
                                        </h3>
                                        <p className="text-indigo-100 line-clamp-2 mb-4 leading-relaxed opacity-90">{post.content}</p>

                                        <div className="border-t border-white/10 pt-4 flex items-center justify-between text-indigo-300">
                                            <div className="flex-1 relative group flex justify-center">
                                                <button
                                                    onClick={() => handleReaction(post._id, getUserReaction(post) ? getUserReaction(post).type : 'like')}
                                                    className={`flex items-center justify-center space-x-2 py-2 rounded-lg transition-colors w-full group ${getUserReaction(post)
                                                        ? 'bg-pink-500/10 ' + REACTION_TYPES.find(t => t.type === getUserReaction(post).type)?.color
                                                        : 'hover:bg-white/5 text-indigo-300 group-hover:text-white'
                                                        }`}
                                                >
                                                    <span className="text-xl transform group-active:scale-125 transition-transform">
                                                        {getUserReaction(post)
                                                            ? REACTION_TYPES.find(t => t.type === getUserReaction(post).type)?.icon
                                                            : '👍'}
                                                    </span>
                                                    <span className="font-medium">
                                                        {post.reactions?.length || 0}
                                                    </span>
                                                </button>

                                                {/* Hover Menu */}
                                                <div className="absolute bottom-full mb-2 bg-white rounded-full shadow-xl p-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto transform translate-y-4 group-hover:translate-y-0 z-20">
                                                    {REACTION_TYPES.map((reaction) => (
                                                        <button
                                                            key={reaction.type}
                                                            onClick={(e) => { e.stopPropagation(); handleReaction(post._id, reaction.type); }}
                                                            className="text-2xl hover:scale-125 transition-transform p-1 origin-bottom"
                                                            title={reaction.label}
                                                        >
                                                            {reaction.icon}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <Link to={`/post/${post._id}`} className="flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg hover:bg-white/5 transition-colors group">
                                                <svg className="w-5 h-5 group-hover:text-indigo-400 transform group-hover:scale-110 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                                <span className="font-medium group-hover:text-white">Comment ({post.commentsCount || 0})</span>
                                            </Link>

                                            <button
                                                onClick={() => handleSave(post._id)}
                                                className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg hover:bg-white/5 transition-colors group ${currentUser?.savedPosts?.includes(post._id) ? 'text-pink-400' : 'text-indigo-300'}`}
                                            >
                                                <svg className="w-5 h-5 transform group-hover:scale-110 transition-all" fill={currentUser?.savedPosts?.includes(post._id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                                                <span className="font-medium group-hover:text-white">{currentUser?.savedPosts?.includes(post._id) ? 'Saved' : 'Save'}</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default TopicDetail;
