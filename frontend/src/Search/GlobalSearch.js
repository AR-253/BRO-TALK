import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api';

const GlobalSearch = () => {
    const [searchParams, setSearchParams] = useSearchParams();

    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [topicId, setTopicId] = useState(searchParams.get('topic') || '');
    const [sort, setSort] = useState(searchParams.get('sort') || (searchParams.get('q') ? '' : 'recent'));

    const [posts, setPosts] = useState([]);
    const [users, setUsers] = useState([]);
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

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

    // Initial load
    useEffect(() => {
        // Fetch topics for filter dropdown
        const fetchTopics = async () => {
            try {
                const res = await api.get('/topics');
                setTopics(res.data);
            } catch (err) {
                console.error("Failed to load topics", err);
            }
        };
        fetchTopics();
    }, []);

    // Fetch results when filters change
    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            try {
                let url = `/posts/search?sort=${sort}`;
                if (query) url += `&q=${encodeURIComponent(query)}`;
                if (topicId) url += `&topic=${topicId}`;

                const res = await api.get(url);
                // Unified response: { posts: [], users: [] }
                setPosts(res.data.posts || []);
                setUsers(res.data.users || []);
                setError(null);
            } catch (err) {
                console.error("Search failed", err);
                setError("Failed to fetch search results.");
            } finally {
                setLoading(false);
            }
        };

        // Debounce if typing, but immediate if filter changes
        const timeoutId = setTimeout(() => {
            fetchResults();
        }, 500);

        return () => clearTimeout(timeoutId);

    }, [query, topicId, sort]);

    // Update URL params
    useEffect(() => {
        const params = {};
        if (query) params.q = query;
        if (topicId) params.topic = topicId;
        if (sort && sort !== 'recent') params.sort = sort;
        if (!sort && !query) setSort('recent'); // Reset to recent if query cleared and no sort
        setSearchParams(params);
    }, [query, topicId, sort, setSearchParams]);

    return (
        <div className="max-w-4xl mx-auto p-4">
            <h2 className="text-3xl font-bold text-white mb-6">Global Search</h2>

            {/* Filters */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-lg mb-8 space-y-4">

                {/* Search Input */}
                <div className="relative">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search posts or people..."
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-12 py-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg"
                    />
                    <svg className="w-6 h-6 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>

                <div className="flex flex-wrap gap-4">
                    {/* Topic Filter */}
                    <select
                        value={topicId}
                        onChange={(e) => setTopicId(e.target.value)}
                        className="bg-black/20 text-white border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="">All Topics</option>
                        {topics.map(t => (
                            <option key={t._id} value={t._id}>{t.title}</option>
                        ))}
                    </select>

                    {/* Sort Filter */}
                    <div className="flex bg-black/20 rounded-lg p-1 border border-white/10">
                        <button
                            onClick={() => setSort('recent')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${sort === 'recent' ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                        >
                            Newest
                        </button>
                        {query && (
                            <button
                                onClick={() => setSort('')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${sort === '' ? 'bg-green-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                            >
                                Relevance
                            </button>
                        )}
                        <button
                            onClick={() => setSort('popular')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${sort === 'popular' ? 'bg-pink-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                        >
                            Popular
                        </button>
                        <button
                            onClick={() => setSort('oldest')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${sort === 'oldest' ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}
                        >
                            Oldest
                        </button>
                    </div>
                </div>
            </div>

            {/* Results */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    <p className="mt-2 text-gray-400">Searching the multiverse...</p>
                </div>
            ) : error ? (
                <div className="text-red-400 text-center py-8">{error}</div>
            ) : (posts.length === 0 && users.length === 0) ? (
                <div className="text-center py-12 text-gray-400 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-xl">No results found.</p>
                    <p className="text-sm">Try distinct keywords or check your spelling.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* User Results Section */}
                    {users.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-indigo-300 px-2">People</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {users.map(u => (
                                    <Link key={u._id} to={`/profile/${u._id}`} className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 flex items-center space-x-4 hover:bg-white/10 transition-all group">
                                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0">
                                            {u.profilePicture ? (
                                                <img src={u.profilePicture} alt={u.name} className="w-full h-full object-cover" />
                                            ) : (
                                                u.name.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-white font-bold truncate group-hover:text-indigo-400 transition-colors">{u.name}</h4>
                                            <p className="text-gray-400 text-xs truncate">@{u.username || 'bro'}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Post Results Section */}
                    {posts.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-indigo-300 px-2">Posts</h3>
                            <div className="space-y-6">
                                {posts.map(post => (
                                    <div key={post._id} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-lg hover:bg-white/15 transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-white mb-2">
                                                    <Link to={`/post/${post._id}`} className="hover:text-pink-400 transition-colors">
                                                        {post.title || 'Untitled Post'}
                                                    </Link>
                                                </h3>
                                                <div className="flex items-center space-x-2 text-sm text-gray-400">
                                                    <span>by {post.user?.name || 'Anonymous'}</span>
                                                    <span>•</span>
                                                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            {post.topic && (
                                                <span className="px-3 py-1 rounded-full text-xs bg-indigo-500/20 text-indigo-200 border border-indigo-500/30">
                                                    #{typeof post.topic === 'object' ? post.topic.title : post.topic}
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-indigo-100 mb-4 line-clamp-3">{post.content}</p>

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
                                                <span className="font-medium group-hover:text-white">Comment</span>
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
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;
