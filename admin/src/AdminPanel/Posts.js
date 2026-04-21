import React, { useState, useEffect } from 'react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Trash2,
    User,
    Clock,
    Tag,
    MessageSquare,
    Eye,
    EyeOff,
    ChevronRight,
    Filter,
    ShieldOff,
    UserX,
    ChevronLeft
} from 'lucide-react';
import { useLocation } from 'react-router-dom';

const AdminPosts = () => {
    const location = useLocation();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({
        sort: 'recent',
        hidden: 'all',
        anonymous: 'all'
    });

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const search = params.get('query') || params.get('q') || params.get('search');
        const postId = params.get('id');
        if (postId) setSearchQuery(postId);
        else if (search) setSearchQuery(search);
    }, [location.search]);

    useEffect(() => {
        fetchPosts();
    }, [filters, searchQuery]);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            let url = `/posts/search?sort=${filters.sort}`;
            if (searchQuery) url += `&q=${searchQuery}`;
            if (filters.hidden !== 'all') url += `&hidden=${filters.hidden}`;
            if (filters.anonymous !== 'all') url += `&anonymous=${filters.anonymous}`;

            const response = await api.get(url);
            setPosts(response.data.posts || []);
            setError(null);
        } catch (err) {
            console.error("Error fetching posts:", err);
            setError('Failed to load posts.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
            try {
                await api.delete(`/posts/${id}`);
                setPosts(posts.filter(post => post._id !== id));
            } catch (err) {
                console.error("Error deleting post:", err);
                alert('Failed to delete post.');
            }
        }
    };

    const handleToggleHide = async (id, currentHidden) => {
        try {
            await api.put(`/posts/${id}`, { isHidden: !currentHidden });
            // Update local state for instant feel
            setPosts(posts.map(p => p._id === id ? { ...p, isHidden: !currentHidden } : p));
        } catch (err) {
            alert('Failed to update post visibility');
        }
    };

    if (loading && posts.length === 0) return (
        <div className="p-20 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Scanning Feed Content...</p>
        </div>
    );

    return (
        <div className="space-y-8 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 italic tracking-tighter">Feed Moderation</h2>
                    <p className="text-gray-400 font-bold text-sm uppercase tracking-widest mt-1">Audit platform content & activity</p>
                </div>
                <div className="bg-indigo-600 px-6 py-4 rounded-[28px] text-white flex items-center gap-4 shadow-xl shadow-indigo-600/10">
                    <MessageSquare size={24} className="opacity-80" />
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Results Found</p>
                        <p className="text-xl font-black leading-none">{posts.length}</p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 relative">
                <div className="relative flex-1 max-w-xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search posts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600/20 transition-all font-bold text-gray-900"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={`px-6 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all ${isFilterOpen ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                        >
                            <Filter size={18} /> Filter
                        </button>

                        <AnimatePresence>
                            {isFilterOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute right-0 mt-3 w-72 bg-white border border-gray-100 rounded-3xl shadow-2xl p-6 z-50 space-y-4"
                                >
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Sort By</p>
                                        <select
                                            value={filters.sort}
                                            onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                                            className="w-full bg-gray-50 border-none rounded-xl p-2 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-600/20"
                                        >
                                            <option value="recent">Most Recent</option>
                                            <option value="popular">Most Popular</option>
                                            <option value="oldest">Oldest First</option>
                                        </select>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Visibility</p>
                                        <div className="flex gap-2">
                                            {['all', 'false', 'true'].map(v => (
                                                <button
                                                    key={v}
                                                    onClick={() => setFilters({ ...filters, hidden: v })}
                                                    className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-tighter transition-all ${filters.hidden === v ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-400'}`}
                                                >
                                                    {v === 'all' ? 'All' : v === 'true' ? 'Hidden' : 'Visible'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Anonymity</p>
                                        <div className="flex gap-2">
                                            {['all', 'true', 'false'].map(v => (
                                                <button
                                                    key={v}
                                                    onClick={() => setFilters({ ...filters, anonymous: v })}
                                                    className={`flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-tighter transition-all ${filters.anonymous === v ? 'bg-purple-600 text-white' : 'bg-gray-50 text-gray-400'}`}
                                                >
                                                    {v === 'all' ? 'All' : v === 'true' ? 'Anon' : 'Public'}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setFilters({ sort: 'recent', hidden: 'all', anonymous: 'all' }); setIsFilterOpen(false); }}
                                        className="w-full pt-2 text-xs font-bold text-red-500 hover:text-red-600 transition-colors border-t border-gray-50"
                                    >
                                        Reset Filters
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Posts Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <AnimatePresence>
                    {posts.map((post, idx) => (
                        <motion.div
                            key={post._id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: idx * 0.05 }}
                            className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow group flex flex-col"
                        >
                            {/* Author & Meta */}
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                                        {post.user?.name.charAt(0).toUpperCase() || 'A'}
                                    </div>
                                    <div>
                                        <p className="font-black text-gray-900 leading-none">{post.user?.name || 'Anonymous'}</p>
                                        <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-widest">{new Date(post.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-lg">
                                    {post.topic?.title || 'General'}
                                </span>
                            </div>

                            {/* Content */}
                            <div className="flex-1">
                                <p className="text-gray-900 font-bold leading-relaxed mb-6 italic">
                                    "{post.content.length > 300 ? post.content.substring(0, 300) + '...' : post.content}"
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                                <div className="flex items-center gap-4 text-gray-400 text-xs font-bold">
                                    <span className="flex items-center gap-1.5"><Clock size={14} /> {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    <span className="flex items-center gap-1.5"><Eye size={14} /> Audit Mode</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleToggleHide(post._id, post.isHidden)}
                                        className={`px-5 py-2.5 rounded-2xl transition-all flex items-center gap-2 font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 ${post.isHidden
                                            ? 'bg-green-600 text-white shadow-green-600/20 hover:bg-green-700'
                                            : 'bg-orange-500 text-white shadow-orange-500/20 hover:bg-orange-600'}`}
                                    >
                                        {post.isHidden ? <><Eye size={16} /> Unhide from Feed</> : <><EyeOff size={16} /> Hide from Feed</>}
                                    </button>

                                    <div className="h-8 w-px bg-gray-100 mx-2" />

                                    <button
                                        onClick={() => window.open(`http://localhost:3000/post/${post._id}`, '_blank')}
                                        className="p-2.5 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100"
                                        title="View Live"
                                    >
                                        <Eye size={20} />
                                    </button>

                                    <button
                                        onClick={() => handleDelete(post._id)}
                                        className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        title="Delete Permanently"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {posts.length === 0 && !loading && (
                    <div className="col-span-full py-24 text-center bg-white rounded-[40px] border border-gray-100 border-dashed">
                        <UserX className="mx-auto text-gray-200 mb-4" size={48} />
                        <h4 className="text-xl font-black text-gray-400">No posts found</h4>
                        <p className="text-gray-300 font-bold mt-1">Try adjusting your filters or search query.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPosts;
