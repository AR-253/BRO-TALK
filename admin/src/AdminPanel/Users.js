import React, { useState, useEffect } from 'react';
import api from '../api';
import { Search, ShieldAlert, ShieldOff, AlertTriangle, UserX, UserCheck, Shield, ChevronLeft, ChevronRight, ChevronDown, UserPlus, Eye, X, CheckSquare, Square, Trash2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const cachedUsersData = {
    users: [],
    totalPages: 1
};

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Users = () => {
    const location = useLocation();
    const [users, setUsers] = useState(cachedUsersData.users);
    const [loading, setLoading] = useState(cachedUsersData.users.length === 0);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTab, setFilterTab] = useState('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(cachedUsersData.totalPages);
    const [sortBy, setSortBy] = useState('newest');
    const [limit, setLimit] = useState(10);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const search = params.get('search');
        setSearchQuery(search || '');
    }, [location.search]);

    const currentUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    const isSuperAdmin = currentUser.role === 'superadmin';

    useEffect(() => {
        fetchUsers();
    }, [page, filterTab, searchQuery, sortBy, limit]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            let url = `/users?page=${page}&limit=${limit}&sort=${sortBy}&search=${searchQuery}`;
            if (filterTab === 'suspended') url += '&isSuspended=true';
            if (filterTab === 'banned') url += '&isBanned=true';

            const response = await api.get(url);
            setUsers(response.data.users || []);
            setTotalPages(response.data.totalPages || 1);

            // Update cache
            cachedUsersData.users = response.data.users || [];
            cachedUsersData.totalPages = response.data.totalPages || 1;
            setError(null);
        } catch (err) {
            console.error("Error fetching users:", err);
            setError('Failed to load users.');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (userId, action) => {
        const reason = window.prompt(`Enter reason for ${action} (Optional):`, "");
        if (reason === null) return;
        try {
            await api.put(`/users/${userId}/${action}`, { reason });
            fetchUsers();
        } catch (err) {
            alert(`Failed to ${action} user`);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        if (window.confirm(`Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`)) {
            try {
                await api.put(`/users/${userId}/role`, { role: newRole });
                fetchUsers();
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to change user role');
            }
        }
    };

    const getRemainingTime = (date) => {
        if (!date) return null;
        const diff = new Date(date) - new Date();
        if (diff <= 0) return null;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        return days > 0 ? `${days}d ${hours}h left` : `${hours}h left`;
    };

    const filteredUsers = users.filter(user => !user.role?.toLowerCase().includes('admin'));

    return (
        <div className="h-full flex flex-col space-y-3 overflow-hidden -mt-6 relative">

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-[32px] shadow-sm border border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0">
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="flex items-center space-x-1 bg-gray-50 p-1 rounded-2xl border border-gray-100 shrink-0">
                        {['all', 'active', 'suspended', 'banned'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => { setFilterTab(tab); setPage(1); }}
                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterTab === tab ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-gray-400 hover:text-gray-900'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 shrink-0">
                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Sort:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                            className="bg-transparent text-xs font-bold text-gray-900 focus:outline-none border-none cursor-pointer"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Show:</span>
                        <select
                            value={limit}
                            onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                            className="bg-transparent text-xs font-bold text-gray-900 focus:outline-none border-none cursor-pointer"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={9999}>All</option>
                        </select>
                    </div>
                </div>
            </div>

            {error && <div className="p-8 text-center text-red-500 bg-red-50 rounded-3xl m-4 border border-red-100 font-bold">{error}</div>}

            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col min-h-0">
                <div className="overflow-auto custom-scrollbar flex-1">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">#</th>
                                <th className="px-8 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">User Details</th>
                                <th className="px-8 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Role & Warnings</th>
                                <th className="px-8 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Status</th>
                                <th className="px-8 py-4 text-right text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredUsers.map((user, index) => (
                                <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-xs font-black text-gray-400">
                                        {(page - 1) * limit + (index + 1)}
                                    </td>
                                    <td className="px-8 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-xl bg-opacity-20 overflow-hidden">
                                                {user.profilePicture ? (
                                                    <img src={user.profilePicture.startsWith('http') ? user.profilePicture : `${API_BASE_URL}${user.profilePicture}`} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    user.name.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-base font-black text-gray-900">{user.name}</div>
                                                <div className="text-sm text-gray-400 font-bold">@{user.username || 'bro_user'} • {user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 whitespace-nowrap">
                                        <div className="space-y-1">
                                            <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg ${user.role === 'superadmin' ? 'bg-red-100 text-red-700' : user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {user.role?.toUpperCase()}
                                            </span>
                                            <div className="flex items-center gap-1.5 text-orange-600 font-black text-xs mt-2">
                                                <AlertTriangle size={14} />
                                                {user.warnings || 0} Warnings
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 whitespace-nowrap">
                                        <div className="flex flex-col gap-1.5">
                                            {user.isBanned ? (
                                                <span className="flex items-center gap-1.5 text-red-600 font-black text-xs uppercase tracking-tighter">
                                                    <UserX size={14} /> Banned {getRemainingTime(user.moderationUntil)}
                                                </span>
                                            ) : user.isSuspended ? (
                                                <span className="flex items-center gap-1.5 text-orange-500 font-black text-xs uppercase tracking-tighter">
                                                    <ShieldOff size={14} /> Suspended {getRemainingTime(user.moderationUntil)}
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1.5 text-green-500 font-black text-xs uppercase tracking-tighter">
                                                    <UserCheck size={14} /> Active
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            {user.role !== 'superadmin' && (
                                                <>
                                                    <button
                                                        onClick={() => handleAction(user._id, 'warn')}
                                                        title="Warn User"
                                                        className="flex flex-col items-center gap-1 group transition-all"
                                                    >
                                                        <div className="w-8 h-8 flex items-center justify-center bg-orange-50 text-orange-600 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition-all shadow-sm">
                                                            <AlertTriangle size={14} />
                                                        </div>
                                                        <span className="text-[7px] font-black text-orange-400 uppercase tracking-tighter opacity-60 group-hover:opacity-100">WARN</span>
                                                    </button>

                                                    <button
                                                        onClick={() => handleAction(user._id, 'suspend')}
                                                        title={user.isSuspended ? "Unsuspend User" : "Suspend User"}
                                                        className="flex flex-col items-center gap-1 group transition-all"
                                                    >
                                                        <div className={`w-8 h-8 flex items-center justify-center rounded-lg shadow-sm transition-all ${user.isSuspended ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-500 group-hover:bg-gray-500 group-hover:text-white'}`}>
                                                            <ShieldAlert size={14} />
                                                        </div>
                                                        <span className="text-[7px] font-black text-gray-400 uppercase tracking-tighter opacity-60 group-hover:opacity-100 italic">
                                                            {user.isSuspended ? 'UN-SUSPEND' : 'SUSPEND'}
                                                        </span>
                                                    </button>

                                                    <button
                                                        onClick={() => handleAction(user._id, 'ban')}
                                                        title={user.isBanned ? "Unban User" : "Ban User"}
                                                        className="flex flex-col items-center gap-1 group transition-all"
                                                    >
                                                        <div className={`w-8 h-8 flex items-center justify-center rounded-lg shadow-sm transition-all ${user.isBanned ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white'}`}>
                                                            <UserX size={14} />
                                                        </div>
                                                        <span className="text-[7px] font-black text-red-400 uppercase tracking-tighter opacity-60 group-hover:opacity-100 italic">
                                                            {user.isBanned ? 'UN-BAN' : 'BAN'}
                                                        </span>
                                                    </button>
                                                </>
                                            )}
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
            {/* Background Loading Indicator - Placed at end to avoid space-y shifts */}
            <AnimatePresence>
                {loading && users.length > 0 && (
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

export default Users;
