import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Library,
    Plus,
    Edit3,
    Trash2,
    X,
    Tag,
    Search,
    Save,
    RotateCcw,
    ChevronLeft,
    ChevronRight,
    CheckCircle,
    RefreshCw
} from 'lucide-react';

const cachedTopicsData = {
    topics: [],
    totalPages: 1,
    totalTopics: 0
};

const AdminTopics = () => {
    const [topics, setTopics] = useState(cachedTopicsData.topics);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(cachedTopicsData.totalPages);
    const [totalTopics, setTotalTopics] = useState(cachedTopicsData.totalTopics);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [formData, setFormData] = useState({ title: '', description: '' });
    const [editingId, setEditingId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(cachedTopicsData.topics.length === 0);
    const [error, setError] = useState(null);
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const search = params.get('search');
        setSearchQuery(search || '');
    }, [location.search]);

    useEffect(() => {
        fetchTopics();
    }, [page, sortBy, pageSize, searchQuery]);

    const fetchTopics = async () => {
        try {
            setLoading(true);
            const limit = pageSize === 'all' ? 1000 : pageSize;
            const response = await api.get(`/topics?page=${page}&limit=${limit}&search=${searchQuery}&sort=${sortBy}`);
            setTopics(response.data.topics || []);
            setTotalPages(response.data.totalPages || 1);
            setTotalTopics(response.data.totalTopics || 0);

            // Update cache
            cachedTopicsData.topics = response.data.topics || [];
            cachedTopicsData.totalPages = response.data.totalPages || 1;
            cachedTopicsData.totalTopics = response.data.totalTopics || 0;
            setError(null);
        } catch (err) {
            console.error("Error fetching topics:", err);
            setError('Failed to load topics.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/topics/${editingId}`, formData);
            } else {
                await api.post('/topics', formData);
            }
            setIsModalOpen(false);
            setFormData({ title: '', description: '' });
            setEditingId(null);
            fetchTopics();
        } catch (err) {
            alert('Failed to save topic');
        }
    };

    const handleEdit = (topic) => {
        setFormData({ title: topic.title, description: topic.description });
        setEditingId(topic._id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this topic?')) {
            try {
                await api.delete(`/topics/${id}`);
                fetchTopics();
            } catch (err) {
                alert('Failed to delete topic');
            }
        }
    };

    const handleCancel = () => {
        setFormData({ title: '', description: '' });
        setEditingId(null);
        setIsModalOpen(false);
    };

    return (
        <div className="h-full flex flex-col space-y-3 overflow-hidden -mt-6 relative">

            {/* Page Header */}
            <div className="bg-white px-6 py-4 rounded-[32px] shadow-sm border border-gray-100 flex items-center justify-end gap-4 shrink-0">
                <div className="bg-white px-6 py-2.5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center min-w-[120px]">
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-0.5">Total Topics</p>
                    <p className="text-xl font-black text-gray-900 leading-none">{totalTopics}</p>
                </div>

                <button
                    onClick={() => {
                        setFormData({ title: '', description: '' });
                        setEditingId(null);
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 rounded-2xl text-white font-black text-[11px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 group"
                >
                    <Plus size={16} className="group-hover:rotate-90 transition-transform" />
                    New Topic
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-[32px] shadow-sm border border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0">
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="flex items-center space-x-1 bg-gray-50 p-1 rounded-2xl border border-gray-100 shrink-0">
                        {['all', 'popular', 'newest', 'oldest'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => { setSortBy(tab); setPage(1); }}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${sortBy === tab ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-gray-400 hover:text-gray-900'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Show:</span>
                    <select
                        value={pageSize}
                        onChange={(e) => { setPageSize(e.target.value === 'all' ? 'all' : parseInt(e.target.value)); setPage(1); }}
                        className="bg-transparent text-xs font-bold text-gray-900 focus:outline-none border-none cursor-pointer"
                    >
                        {[10, 20, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
                        <option value="all">All</option>
                    </select>
                </div>
            </div>

            {error && <div className="p-8 text-center text-red-500 bg-red-50 rounded-3xl m-4 border border-red-100 font-bold">{error}</div>}

            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col min-h-0">
                <div className="overflow-auto flex-1 custom-scrollbar">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">#</th>
                                <th className="px-8 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Topic Details</th>
                                <th className="px-8 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Stats</th>
                                <th className="px-8 py-4 text-right text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {topics.map((topic, index) => (
                                <tr key={topic._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-4 text-xs font-black text-gray-400">
                                        {(page - 1) * (pageSize === 'all' ? 0 : pageSize) + (index + 1)}
                                    </td>
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-lg bg-opacity-20">#</div>
                                            <div>
                                                <div className="text-sm font-black text-gray-900 uppercase tracking-tight">{topic.title}</div>
                                                <div className="text-[11px] text-gray-400 font-bold truncate max-w-sm">{topic.description}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-6">
                                            <div className="text-center bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Posts</p>
                                                <p className="text-sm font-black text-indigo-600 mt-1 leading-none">{topic.postCount || 0}</p>
                                            </div>
                                            <div className="text-left">
                                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Created</p>
                                                <p className="text-[10px] font-bold text-gray-400 mt-0.5">{new Date(topic.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            <button onClick={() => handleEdit(topic)} className="w-8 h-8 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm"> <Edit3 size={14} /> </button>
                                            <button onClick={() => handleDelete(topic._id)} className="w-8 h-8 flex items-center justify-center bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"> <Trash2 size={14} /> </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {totalPages > 0 && (
                    <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">PAGE {page} OF {totalPages}</p>
                        <div className="flex items-center gap-2">
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-indigo-600 transition-all disabled:opacity-30 shadow-sm"> <ChevronLeft size={14} /> PREV </button>
                            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-indigo-600 transition-all disabled:opacity-30 shadow-sm"> NEXT <ChevronRight size={14} /> </button>
                        </div>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleCancel} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative bg-white w-full max-w-lg rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">{editingId ? 'Edit Topic' : 'New Topic'}</h3>
                                <button onClick={handleCancel} className="p-2 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-gray-100"> <X size={20} className="text-gray-400" /> </button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <input type="text" placeholder="Hub Title" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600/20 transition-all font-bold text-gray-900" required />
                                <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-600/20 transition-all font-bold text-gray-900 h-32" required />
                                <button type="submit" className="w-full flex items-center justify-center gap-2 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[24px] font-black uppercase tracking-widest text-sm transition-all shadow-lg shadow-indigo-600/20"> {editingId ? <Save size={18} /> : <Plus size={18} />} {editingId ? 'Update Topic' : 'Create Topic'} </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Background Loading Indicator - Placed at end to avoid space-y shifts */}
            <AnimatePresence>
                {loading && topics.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-0 right-0 z-[100] flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 m-2 mt-4"
                    >
                        <RefreshCw size={12} className="animate-spin" />
                        Syncing...
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminTopics;
