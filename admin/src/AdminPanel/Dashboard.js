import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import {
    Users,
    User,
    FileText,
    AlertCircle,
    Library,
    TrendingUp,
    Clock,
    ArrowUpRight,
    UserPlus,
    UserX,
    ShieldAlert,
    ShieldCheck,
    History,
    Activity,
    X,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight,
    ExternalLink,
    Mail,
    Calendar,
    Eye,
    Trash2,
    UserCheck,
    AlertTriangle,
    RefreshCw
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';

const StatDetailsModal = ({ isOpen, onClose, type, title, color, itemData }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const fetchData = useCallback(async () => {
        if (itemData) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            let endpoint = '';
            let params = { page, limit: 5 };

            if (type === 'community') {
                endpoint = '/users';
                params.type = 'community';
            } else if (type === 'posts') {
                endpoint = '/posts';
            } else if (type === 'banned') {
                endpoint = '/users';
                params.isBanned = 'true';
                params.type = 'banned';
            } else if (type === 'suspensions') {
                endpoint = '/users';
                params.isSuspended = 'true';
                params.type = 'suspended'; // Match backend name 'suspended'
            } else if (type === 'audits') {
                endpoint = '/auth/admin/audit-logs';
            }

            const res = await api.get(endpoint, { params });
            if (type === 'posts') {
                setData(res.data.posts);
                setTotalPages(res.data.totalPages);
                setTotalItems(res.data.totalPosts);
            } else if (type === 'audits') {
                setData(res.data.logs);
                setTotalPages(res.data.totalPages);
                setTotalItems(res.data.totalLogs);
            } else {
                setData(res.data.users);
                setTotalPages(res.data.totalPages);
                setTotalItems(res.data.totalUsers);
            }
        } catch (err) {
            console.error("Failed to fetch stat details", err);
        } finally {
            setLoading(false);
        }
    }, [type, page, itemData]);

    useEffect(() => {
        if (isOpen) {
            fetchData();
        }
    }, [isOpen, fetchData]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Modal Header */}
                <div className={`p-8 ${color} text-white flex items-center justify-between`}>
                    <div>
                        <h2 className="text-2xl font-black italic tracking-tighter uppercase">{title}</h2>
                        <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">
                            {itemData ? 'Record Detail View' : `Detailed View • ${totalItems} Total`}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all active:scale-90"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Modal Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    {!itemData && loading ? (
                        <div className="space-y-4 animate-pulse">
                            <div className="h-10 bg-gray-100 rounded-2xl w-full" />
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="flex items-center gap-4 p-4 border border-gray-50 rounded-[32px]">
                                    <div className="w-12 h-12 bg-gray-100 rounded-2xl" />
                                    <div className="space-y-2 flex-col flex-1">
                                        <div className="h-4 bg-gray-100 rounded-lg w-1/3" />
                                        <div className="h-2 bg-gray-50 rounded-lg w-1/4" />
                                    </div>
                                    <div className="h-4 bg-gray-50 rounded-lg w-20" />
                                </div>
                            ))}
                        </div>
                    ) : itemData && type === 'audits' ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 bg-gray-50 rounded-[32px] border border-gray-100">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Administrator</p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-lg font-black italic shadow-lg shadow-indigo-600/20">
                                            {(itemData.admin?.name || 'A').charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-lg font-black text-gray-900">{itemData.admin?.name}</p>
                                            <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider italic opacity-60">Verified Admin</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-6 bg-gray-50 rounded-[32px] border border-gray-100">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Action Context</p>
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                                            <History size={24} className="text-indigo-600" />
                                        </div>
                                        <div>
                                            <p className="text-lg font-black text-gray-900 uppercase tracking-tighter">
                                                {itemData.action?.split('_').join(' ')}
                                            </p>
                                            <p className="text-[11px] text-gray-500 font-bold">
                                                {new Date(itemData.createdAt).toLocaleString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="relative overflow-hidden p-8 bg-gray-900 rounded-[40px] text-white shadow-xl">
                                {/* Decorative elements */}
                                <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-20" />

                                <p className="relative z-10 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Target Analysis</p>
                                <div className="relative z-10 flex items-center gap-6">
                                    <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-2xl font-black italic shadow-2xl">
                                        {(itemData.targetUser?.name || 'S').charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="text-2xl font-black tracking-tight">{itemData.targetUser?.name || 'System / Content Entity'}</h4>
                                        <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1 opacity-60 italic">Record Impacted</p>
                                    </div>
                                </div>

                                <div className="relative z-10 mt-8 pt-8 border-t border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.2em] mb-1">Status</p>
                                        <p className="text-[10px] text-indigo-400 font-bold italic">Permanently recorded in secure system logs</p>
                                    </div>
                                    <div className="px-4 py-2 bg-white/5 rounded-2xl border border-white/5 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                        Verified Action
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {data.length === 0 ? (
                                <div className="text-center py-20 text-gray-400 font-bold uppercase tracking-widest text-sm">
                                    No records found in this category.
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-[32px] border border-gray-100 shadow-sm">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50/50">
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                    {type === 'posts' ? 'Content Preview' : 'Identity'}
                                                </th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                    {type === 'posts' ? 'Meta' : 'Contact & Registration'}
                                                </th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {data.map((item) => (
                                                <tr key={item._id} className="hover:bg-gray-50/30 transition-colors">
                                                    <td className="px-6 py-5">
                                                        <div className="flex items-center gap-3">
                                                            {type === 'posts' ? (
                                                                <div>
                                                                    <p className="text-sm font-bold text-gray-900 line-clamp-1 italic">"{item.content}"</p>
                                                                    <p className="text-[10px] text-gray-400 font-black uppercase mt-1">Topic: {item.topic?.title}</p>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg">
                                                                        {item.profilePicture ? (
                                                                            <img src={item.profilePicture.startsWith('http') ? item.profilePicture : `${API_BASE_URL}${item.profilePicture}`} alt="" className="w-full h-full object-cover rounded-xl" />
                                                                        ) : (
                                                                            item.name.charAt(0).toUpperCase()
                                                                        )}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-black text-gray-900 leading-none">{item.name}</p>
                                                                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-wider">@{item.username}</p>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        {type === 'posts' ? (
                                                            <div className="flex flex-col gap-1">
                                                                <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
                                                                    <User size={12} className="opacity-60" /> {item.user?.name}
                                                                </div>
                                                                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-black uppercase">
                                                                    <Calendar size={12} className="opacity-60" /> {new Date(item.createdAt).toLocaleDateString()}
                                                                </div>
                                                            </div>
                                                        ) : type === 'audits' ? (
                                                            <span className="text-sm font-black text-indigo-600 uppercase tracking-tighter">
                                                                {item.action?.replace(/_/g, ' ')}
                                                            </span>
                                                        ) : (
                                                            <div className="flex flex-col gap-1.5">
                                                                <div className="flex items-center gap-2 text-xs text-gray-900 font-black italic">
                                                                    <Mail size={12} className="opacity-40 text-indigo-600 shrink-0" /> {item.email}
                                                                </div>
                                                                <div className="flex items-center gap-2 text-[10px] text-gray-400 font-black uppercase italic tracking-tighter">
                                                                    <History size={11} className="opacity-40 shrink-0" /> Joined {new Date(item.createdAt).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        {type === 'posts' ? (
                                                            <span className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest rounded-md ${item.isHidden ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                                                {item.isHidden ? 'Moderated' : 'On Feed'}
                                                            </span>
                                                        ) : type === 'audits' ? (
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-black uppercase text-indigo-600 tracking-tighter">
                                                                    Target: {item.targetUser?.name || 'N/A'}
                                                                </span>
                                                                <span className="text-[9px] text-gray-400 font-bold uppercase mt-1">
                                                                    {new Date(item.createdAt).toLocaleString()}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                {item.isBanned && <span className="px-2 py-1 bg-red-100 text-red-600 text-[8px] font-black uppercase rounded-md tracking-tighter">Banned</span>}
                                                                {item.isSuspended && <span className="px-2 py-1 bg-orange-100 text-orange-600 text-[8px] font-black uppercase rounded-md tracking-tighter">Suspended</span>}
                                                                {!item.isBanned && !item.isSuspended && <span className="px-2 py-1 bg-green-100 text-green-600 text-[8px] font-black uppercase rounded-md tracking-tighter">Active</span>}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Modal Footer / Pagination */}
                {!itemData && totalItems > 0 && (
                    <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Page {page} of {totalPages}</p>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                                className="p-2 bg-white border border-gray-200 rounded-xl disabled:opacity-30 hover:bg-gray-50 transition-colors"
                            >
                                <ChevronLeftIcon size={20} />
                            </button>
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage(page + 1)}
                                className="p-2 bg-white border border-gray-200 rounded-xl disabled:opacity-30 hover:bg-gray-50 transition-colors"
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

const StatCard = ({ title, value, icon: Icon, color, delay, onClick }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        onClick={onClick}
        className={`bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex items-center gap-6 group hover:shadow-md transition-all ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}`}
    >
        <div className={`p-4 rounded-2xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600 group-hover:scale-110 transition-transform`}>
            <Icon size={32} />
        </div>
        <div className="flex-1">
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">{title}</p>
            <div className="flex items-center gap-2">
                <h3 className={`text-3xl font-black text-gray-900 transition-opacity ${value === 0 && !onClick ? 'opacity-20' : 'opacity-100'}`}>
                    {value}
                </h3>
                {onClick && <ArrowUpRight size={16} className="text-gray-300 group-hover:text-indigo-600 transition-colors" />}
            </div>
        </div>
    </motion.div>
);

// Persist stats in memory to make tab switching feel instant
let cachedStats = null;

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(cachedStats || {
        users: 0,
        posts: 0,
        pendingReports: 0,
        topics: 0,
        suspendedUsers: 0,
        bannedUsers: 0,
        recentUsers: [],
        registrations: [],
        recentAudits: []
    });
    const [loading, setLoading] = useState(!cachedStats);

    // Modal State
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        type: '',
        title: '',
        color: '',
        data: null
    });

    const [currentAuditIndex, setCurrentAuditIndex] = useState(0);
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/users/admin/stats');
                setStats(res.data);
                cachedStats = res.data; // Update cache
            } catch (err) {
                console.error("Failed to fetch admin stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const openDetails = (type, title, color, data = null) => {
        setModalConfig({ isOpen: true, type, title, color, data });
    };


    return (
        <div className="h-full flex flex-col space-y-3 overflow-hidden -mt-6 relative">


            {/* Stats Grid - Compact but Premium */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                <StatCard
                    title="Total Community"
                    value={stats.users}
                    icon={Users}
                    color="bg-blue-500"
                    delay={0.1}
                    onClick={() => navigate('/admin/users')}
                />
                <StatCard
                    title="Active Posts"
                    value={stats.posts}
                    icon={FileText}
                    color="bg-purple-500"
                    delay={0.2}
                />
                <StatCard
                    title="Reports"
                    value={stats.pendingReports}
                    icon={AlertCircle}
                    color="bg-red-500"
                    delay={0.3}
                    onClick={() => navigate('/admin/reports')}
                />
                <StatCard
                    title="Topics"
                    value={stats.topics}
                    icon={Library}
                    color="bg-indigo-500"
                    delay={0.4}
                    onClick={() => navigate('/admin/topics')}
                />
            </div>

            {/* Main Row - Takes Remaining Space */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 items-stretch pb-2">
                {/* Main Chart Area */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="lg:col-span-5 bg-white rounded-[32px] p-6 shadow-sm border border-gray-100 flex flex-col min-h-0"
                >
                    <div
                        className="flex items-center justify-between mb-4 shrink-0 cursor-pointer group/header"
                        onClick={() => openDetails('community', 'Community Members', 'bg-indigo-600')}
                    >
                        <div>
                            <h3 className="text-xl font-black text-gray-900 leading-none group-hover/header:text-indigo-600 transition-colors">Registration Trend</h3>
                            <p className="text-gray-400 text-[10px] mt-1">Growth over 30 days</p>
                        </div>
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover/header:bg-indigo-600 group-hover/header:text-white transition-all shadow-sm">
                            <TrendingUp size={20} />
                        </div>
                    </div>

                    <div className="flex-1 min-h-0 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.registrations}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis
                                    dataKey="_id"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#4f46e5"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorCount)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Audits - Paginated One-by-One */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="lg:col-span-7 bg-gray-900 rounded-[32px] p-6 shadow-xl text-white flex flex-col min-h-0 relative group"
                >
                    <div className="relative z-10 flex flex-col h-full min-h-0">
                        {/* Audit Header with Pagination */}
                        <div className="flex items-center justify-between mb-4 shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-white/10 rounded-lg">
                                    <History size={18} />
                                </div>
                                <h3 className="text-lg font-black tracking-tight">Recent Audits</h3>
                            </div>

                            <div className="flex items-center gap-2">
                                <p className="text-[10px] font-bold text-gray-500 mr-2 uppercase tracking-widest">
                                    Page {Math.floor(currentAuditIndex / 3) + 1} of {Math.max(1, Math.ceil(stats.recentAudits.length / 3))}
                                </p>
                                <button
                                    onClick={() => setCurrentAuditIndex(prev => Math.max(0, prev - 3))}
                                    disabled={currentAuditIndex === 0}
                                    className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeftIcon size={16} />
                                </button>
                                <button
                                    onClick={() => {
                                        setCurrentAuditIndex(prev => prev + 3);
                                    }}
                                    disabled={currentAuditIndex + 3 >= stats.recentAudits.length}
                                    className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Audit Carousel Area */}
                        <div className="flex-1 min-h-0 relative overflow-hidden">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={currentAuditIndex}
                                    initial={{ x: 50, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -50, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full"
                                >
                                    {stats.recentAudits
                                        .slice(currentAuditIndex, currentAuditIndex + 3)
                                        .map((audit, idx) => {
                                            const actionLower = audit.action.toLowerCase();
                                            let ActionIcon = Activity;
                                            let actionColor = "text-indigo-400";
                                            let actionBg = "bg-indigo-400/10";

                                            if (actionLower.includes('ban')) { ActionIcon = ShieldAlert; actionColor = "text-red-400"; actionBg = "bg-red-400/10"; }
                                            else if (actionLower.includes('delete')) { ActionIcon = Trash2; actionColor = "text-orange-400"; actionBg = "bg-orange-400/10"; }
                                            else if (actionLower.includes('verify') || actionLower.includes('approve')) { ActionIcon = UserCheck; actionColor = "text-green-400"; actionBg = "bg-green-400/10"; }
                                            else if (actionLower.includes('warn')) { ActionIcon = AlertTriangle; actionColor = "text-yellow-400"; actionBg = "bg-yellow-400/10"; }

                                            return (
                                                <motion.div
                                                    key={audit._id}
                                                    className="cursor-pointer border border-white/5 p-4 bg-white/5 rounded-3xl hover:bg-white/10 transition-all group/item flex flex-col h-full relative overflow-hidden"
                                                    onClick={() => openDetails('audits', 'Audit Record Detail', 'bg-gray-800', audit)}
                                                >
                                                    {/* Decorative pattern/gradient for visual polish */}
                                                    <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full blur-2xl opacity-10 transition-opacity group-hover/item:opacity-30 ${actionBg.replace('/10', '')}`} />

                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-lg shadow-indigo-600/20">
                                                                {(audit.admin?.name || 'A').charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="text-xs font-black text-white leading-none mb-0.5">{audit.admin?.name}</p>
                                                                <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Administrator</p>
                                                            </div>
                                                        </div>
                                                        <ExternalLink size={12} className="text-gray-500 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                                    </div>

                                                    <div className={`flex items-center gap-2 px-3 py-1.5 ${actionBg} ${actionColor} rounded-2xl w-fit mb-4`}>
                                                        <ActionIcon size={12} />
                                                        <span className="text-[9px] font-black uppercase tracking-wider">
                                                            {audit.action.split('_').join(' ')}
                                                        </span>
                                                    </div>

                                                    <div className="space-y-3 mt-auto">
                                                        <div className="p-3 bg-white/5 rounded-2xl border border-white/5 group-hover/item:border-white/10 transition-colors">
                                                            <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                                                <div className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse" />
                                                                Target Entity
                                                            </p>
                                                            <p className="text-[11px] text-white font-black truncate">
                                                                {audit.targetUser?.name || audit.targetId || 'System Action'}
                                                            </p>
                                                        </div>

                                                        <div className="flex items-center justify-between pt-1">
                                                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tight">
                                                                {new Date(audit.createdAt).toLocaleString([], { weekday: 'short', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )
                                        })}
                                    {stats.recentAudits.length === 0 && (
                                        <div className="col-span-full h-full flex items-center justify-center py-10 text-center">
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest opacity-60">No activity recorded</p>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* History Button moved back to bottom */}
                        <button
                            onClick={() => navigate('/admin/audit-logs')}
                            className="mt-4 w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors border border-white/5 shrink-0"
                        >
                            View Full History
                        </button>
                    </div>
                </motion.div>

            </div>

            <AnimatePresence>
                {modalConfig.isOpen && (
                    <StatDetailsModal
                        isOpen={modalConfig.isOpen}
                        onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                        type={modalConfig.type}
                        title={modalConfig.title}
                        color={modalConfig.color}
                        itemData={modalConfig.data}
                    />
                )}
            </AnimatePresence>

            {/* Background Loading Indicator - Placed at end to avoid space-y shifts */}
            <AnimatePresence>
                {loading && (
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

export default Dashboard;
