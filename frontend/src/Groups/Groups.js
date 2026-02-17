import React, { useState, useEffect } from 'react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Users, Loader } from 'lucide-react';
import { Link } from 'react-router-dom';

const Groups = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newGroup, setNewGroup] = useState({ title: '', description: '' });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        try {
            const res = await api.get('/topics');
            setGroups(res.data);
        } catch (err) {
            console.error("Failed to fetch groups", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await api.post('/topics', newGroup);
            setGroups([...groups, res.data]);
            setIsModalOpen(false);
            setNewGroup({ title: '', description: '' });
        } catch (err) {
            alert("Failed to create group. It might already exist.");
        } finally {
            setCreating(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader className="animate-spin text-white w-10 h-10" />
        </div>
    );

    return (
        <div className="min-h-screen text-white relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-10 border-b border-white/10 pb-6">
                    <div>
                        <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400">
                            Community Groups
                        </h1>
                        <p className="mt-2 text-indigo-200">
                            Connect with people who share your interests.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="mt-4 md:mt-0 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-medium backdrop-blur-md transition-all border border-white/10 shadow-lg flex items-center space-x-2"
                    >
                        <Plus size={20} />
                        <span>Create New Group</span>
                    </button>
                </div>

                {/* Groups Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.map((group) => (
                        <Link to={`/topic/${group._id}`} key={group._id} className="group bg-white/5 hover:bg-white/10 backdrop-blur-lg border border-white/10 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10 relative overflow-hidden block">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-bl-full -mr-4 -mt-4 transition-all group-hover:scale-110"></div>

                            <div className="flex items-center space-x-4 mb-4 relative z-10">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-2xl font-bold shadow-lg transform group-hover:rotate-3 transition-transform text-white">
                                    {group.title.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xl font-bold text-white group-hover:text-pink-300 transition-colors truncate">{group.title}</h3>
                                    <span className="text-sm text-indigo-300 flex items-center space-x-1">
                                        <Users size={14} />
                                        <span>{group.subscribers?.length || 0} Members</span>
                                    </span>
                                </div>
                            </div>

                            <p className="text-gray-300 text-sm mb-6 line-clamp-2 relative z-10 h-10">
                                {group.description}
                            </p>

                            <div className="w-full py-3 rounded-xl bg-white/5 group-hover:bg-indigo-600/20 text-indigo-200 group-hover:text-indigo-100 font-semibold transition-all duration-300 border border-white/5 group-hover:border-indigo-500/30 text-center text-sm">
                                View Discussions
                            </div>
                        </Link>
                    ))}
                    {groups.length === 0 && (
                        <div className="col-span-full text-center py-20 bg-white/5 rounded-2xl border border-white/10 border-dashed">
                            <p className="text-indigo-300">No groups found. Create one to get started!</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Group Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-[#1a1c2e] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative"
                        >
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>

                            <div className="p-8">
                                <h2 className="text-2xl font-bold text-white mb-6">Create New Group</h2>
                                <form onSubmit={handleCreateGroup} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-indigo-300 mb-2">Group Name</label>
                                        <input
                                            type="text"
                                            value={newGroup.title}
                                            onChange={(e) => setNewGroup({ ...newGroup, title: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                                            placeholder="e.g. Anime Fans"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-indigo-300 mb-2">Description</label>
                                        <textarea
                                            value={newGroup.description}
                                            onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors min-h-[100px]"
                                            placeholder="What's this group about?"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={creating}
                                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-bold shadow-lg hover:shadow-indigo-500/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                                    >
                                        {creating ? <Loader className="animate-spin w-5 h-5" /> : 'Create Group'}
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Groups;
