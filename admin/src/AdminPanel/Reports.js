import React, { useState, useEffect } from 'react';
import api from '../api';
import {
    Flag,
    Search,
    Filter,
    MoreVertical,
    Eye,
    CheckCircle,
    AlertTriangle,
    UserX,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    X,
    Trash2,
    ShieldAlert,
    User,
    MessageSquare,
    AlertCircle,
    Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

const cachedReportsData = {
    reports: [],
    totalPages: 1,
    totalReports: 0,
    stats: {
        totalReports: 0,
        pendingReports: 0,
        resolvedReports: 0,
        dismissedReports: 0
    }
};

const ReportDetailsModal = ({ isOpen, onClose, report, onAction }) => {
    if (!report) return null;

    const targetUser = report.itemType === 'User' ? report.reportedItem : report.reportedItem?.user;
    const isContent = report.itemType === 'Post' || report.itemType === 'Comment';

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                    <AlertCircle className="text-red-500" size={28} />
                                    Inspect Report
                                </h3>
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-1">Moderation Request #{report._id.substring(18)}</p>
                            </div>
                            <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white border border-gray-100 text-gray-400 hover:text-gray-900 shadow-sm hover:shadow-md transition-all active:scale-95">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-8">
                            {/* Reason Section */}
                            <div className="bg-red-50/50 p-6 rounded-[32px] border border-red-100/50">
                                <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">Primary Reason</p>
                                <h4 className="text-xl font-black text-red-600 uppercase italic tracking-tight">{report.reason}</h4>
                                <p className="text-sm font-bold text-gray-600 mt-3 leading-relaxed">"{report.description || 'No additional description provided by reporter.'}"</p>
                            </div>

                            {/* Reported Content Section */}
                            {isContent && (
                                <div className="p-8 bg-gray-900 rounded-[40px] text-white shadow-xl relative overflow-hidden group">
                                    {/* Decorative pulse */}
                                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-20 group-hover:opacity-30 transition-opacity" />

                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-6">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Reported {report.itemType}</p>
                                            <span className="px-3 py-1 bg-white/10 rounded-full border border-white/10 text-[9px] font-black uppercase tracking-widest text-indigo-400">
                                                ID: {report.reportedItem?._id}
                                            </span>
                                        </div>

                                        <div className="bg-white/5 backdrop-blur-sm p-6 rounded-3xl border border-white/10 mb-6">
                                            <p className="text-lg font-bold leading-relaxed italic">
                                                "{report.reportedItem?.content || 'The original content appears to be deleted or inaccessible.'}"
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-xs font-black">
                                                    {targetUser?.name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-300 uppercase leading-none">{targetUser?.name || 'Unknown User'}</p>
                                                    <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">Author</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                                                    {new Date(report.reportedItem?.createdAt).toLocaleDateString()}
                                                </p>
                                                <p className="text-[9px] text-gray-500 font-bold uppercase tracking-tighter mt-0.5">Posted At</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Reporter */}
                                <div className="p-6 bg-gray-50 rounded-[32px] border border-gray-100">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Reporter Info</p>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-black text-xl">
                                            {report.reporter?.name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-gray-900 leading-none mb-1">{report.reporter?.name || 'Unknown'}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest opacity-60">@{report.reporter?.username || 'user'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Target/Summary */}
                                <div className={`p-6 rounded-[32px] border flex flex-col justify-center ${!isContent ? 'bg-indigo-50/50 border-indigo-100/50' : 'bg-gray-50 border-gray-100'}`}>
                                    <p className={`text-[10px] font-black uppercase tracking-widest mb-4 ${!isContent ? 'text-indigo-400' : 'text-gray-400'}`}>
                                        {!isContent ? 'Target Profile' : 'Moderation Status'}
                                    </p>
                                    {!isContent ? (
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-600/20 text-indigo-100">
                                                {targetUser?.name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-900">{targetUser?.name || 'Unknown'}</p>
                                                <p className="text-xs text-gray-400 font-bold">@{targetUser?.username || 'user'}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-xs font-bold text-gray-600 italic">This {report.itemType.toLowerCase()} is currently under review for violation of platform community standards.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-8 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                {isContent && (
                                    <button
                                        onClick={() => onAction(report._id, 'deleteItem')}
                                        className="flex items-center gap-2 px-5 py-3 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 active:scale-95"
                                    >
                                        <Trash2 size={14} /> Delete Content
                                    </button>
                                )}
                                {targetUser && (
                                    <>
                                        <button
                                            onClick={() => onAction(targetUser._id, 'warn')}
                                            className="flex items-center gap-2 px-5 py-3 bg-white border border-orange-200 text-orange-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-50 transition-all active:scale-95"
                                        >
                                            <AlertTriangle size={14} /> Warn User
                                        </button>
                                        <button
                                            onClick={() => onAction(targetUser._id, 'suspend')}
                                            className="flex items-center gap-2 px-5 py-3 bg-white border border-red-200 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all active:scale-95"
                                        >
                                            <ShieldAlert size={14} /> Suspend User
                                        </button>
                                    </>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => onAction(report._id, 'dismiss')}
                                    className="px-6 py-3 bg-gray-200 text-gray-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-300 transition-all active:scale-95"
                                >
                                    Dismiss
                                </button>
                                <button
                                    onClick={() => onAction(report._id, 'resolve')}
                                    className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                                >
                                    Resolve
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const AdminReports = () => {
    const [reports, setReports] = useState(cachedReportsData.reports);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(cachedReportsData.totalPages);
    const [totalReports, setTotalReports] = useState(cachedReportsData.totalReports);
    const [stats, setStats] = useState(cachedReportsData.stats);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [statusFilter, setStatusFilter] = useState('all');
    const [reasonFilter, setReasonFilter] = useState('all');
    const [loading, setLoading] = useState(cachedReportsData.reports.length === 0);
    const [error, setError] = useState(null);
    const [selectedReport, setSelectedReport] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const search = params.get('search');
        setSearchQuery(search || '');
    }, [location.search]);

    useEffect(() => {
        fetchReports();
        fetchStats();
    }, [page, sortBy, pageSize, statusFilter, reasonFilter, searchQuery]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const limit = pageSize === 'all' ? 1000 : pageSize;
            const res = await api.get(`/reports?page=${page}&limit=${limit}&search=${searchQuery}&sort=${sortBy}&status=${statusFilter}&reason=${reasonFilter}`);
            setReports(res.data.reports || []);
            setTotalPages(res.data.totalPages || 1);
            setTotalReports(res.data.totalReports || 0);

            // Update cache
            cachedReportsData.reports = res.data.reports || [];
            cachedReportsData.totalPages = res.data.totalPages || 1;
            cachedReportsData.totalReports = res.data.totalReports || 0;
            setError(null);
        } catch (err) {
            console.error("Error fetching reports:", err);
            setError('Failed to load reports.');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get('/reports/stats');
            setStats(res.data);
            cachedReportsData.stats = res.data;
        } catch (err) {
            console.error("Error fetching report stats:", err);
        }
    };

    const handleAction = async (id, action, reason = 'Action taken via report moderation') => {
        if (!window.confirm(`Are you sure you want to ${action} this?`)) return;
        try {
            if (action === 'resolve' || action === 'dismiss') {
                await api.put(`/reports/${id}/${action}`, { reason });
            } else if (action === 'deleteItem') {
                await api.delete(`/reports/${id}/item`);
            } else if (action === 'warn') {
                await api.put(`/users/${id}/warn`, { reason });
            } else if (action === 'suspend') {
                await api.put(`/users/${id}/suspend`, { reason });
            }

            fetchReports();
            fetchStats();
            setIsModalOpen(false);
        } catch (err) {
            alert(`Failed to ${action}`);
        }
    };

    const getTargetName = (report) => {
        if (!report.reportedItem) return 'Deleted Item';

        if (report.itemType === 'User') {
            return report.reportedItem.name || report.reportedItem.username || 'Unknown User';
        }

        if (report.itemType === 'Post') {
            return report.reportedItem.content?.substring(0, 25) || 'Post Content';
        }

        if (report.itemType === 'Comment') {
            return report.reportedItem.content?.substring(0, 25) || 'Comment Content';
        }

        return 'Unknown';
    };

    const StatCard = ({ title, value, icon: Icon, color, subValue, trend }) => (
        <div className="bg-white p-4 rounded-[28px] shadow-sm border border-gray-100 flex flex-col justify-between min-h-[110px] relative overflow-hidden group hover:shadow-md transition-all">
            <div className="flex justify-between items-start relative z-10">
                <div className={`w-12 h-12 rounded-2xl ${color.bg} ${color.text} flex items-center justify-center shadow-lg shadow-current/10 group-hover:scale-110 transition-transform`}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {trend}
                    </div>
                )}
            </div>
            <div className="mt-4 relative z-10">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-black text-gray-900 tracking-tight leading-none">
                        {value}
                    </h3>
                </div>
            </div>
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 ${color.text} opacity-[0.03] group-hover:scale-125 transition-transform`}>
                <Icon size={96} />
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col space-y-3 overflow-hidden -mt-6 relative pb-4">

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                <StatCard title="Total Reports" value={stats.totalReports} icon={Flag} color={{ bg: 'bg-indigo-50', text: 'text-indigo-600' }} />
                <StatCard title="Pending" value={stats.pendingReports} icon={Clock} color={{ bg: 'bg-orange-50', text: 'text-orange-600' }} trend={stats.pendingReports > 0 ? `${stats.pendingReports} active` : 'Clear'} />
                <StatCard title="Resolved" value={stats.resolvedReports} icon={CheckCircle} color={{ bg: 'bg-green-50', text: 'text-green-600' }} />
                <StatCard title="Dismissed" value={stats.dismissedReports} icon={X} color={{ bg: 'bg-gray-50', text: 'text-gray-600' }} />
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-[32px] shadow-sm border border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0">
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="flex items-center space-x-1 bg-gray-50 p-1 rounded-2xl border border-gray-100 shrink-0">
                        {['all', 'pending', 'resolved', 'dismissed'].map((tab) => (
                            <button key={tab} onClick={() => { setStatusFilter(tab); setPage(1); }} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${statusFilter === tab ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-gray-400 hover:text-gray-900'}`}>
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 shrink-0">
                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Reason:</span>
                        <select value={reasonFilter} onChange={(e) => { setReasonFilter(e.target.value); setPage(1); }} className="bg-transparent text-xs font-bold text-gray-900 focus:outline-none border-none cursor-pointer">
                            <option value="all">All Reasons</option>
                            <option value="spam">Spam</option>
                            <option value="harassment">Harassment</option>
                            <option value="inappropriate">Inappropriate</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Show:</span>
                        <select value={pageSize} onChange={(e) => { setPageSize(e.target.value === 'all' ? 'all' : parseInt(e.target.value)); setPage(1); }} className="bg-transparent text-xs font-bold text-gray-900 focus:outline-none border-none cursor-pointer">
                            {[10, 20, 50, 100].map(size => <option key={size} value={size}>{size}</option>)}
                            <option value="all">All</option>
                        </select>
                    </div>
                </div>
            </div>

            {error && <div className="p-8 text-center text-red-500 bg-red-50 rounded-3xl m-4 border border-red-100 font-bold">{error}</div>}

            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden flex-1 flex flex-col min-h-0">
                <div className="overflow-auto flex-1 custom-scrollbar">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-8 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Reporter & Target</th>
                                <th className="px-8 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Report Details</th>
                                <th className="px-8 py-4 text-left text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Status</th>
                                <th className="px-8 py-4 text-right text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Quick Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {reports.map((report) => (
                                <tr key={report._id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100/50">
                                    <td className="px-8 py-4 whitespace-nowrap">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-xs font-black text-gray-400 tracking-tight uppercase"> <span className="opacity-40">From:</span> {report.reporter?.name || 'Unknown'} </div>
                                            <div className="flex items-center gap-2 text-xs font-black text-indigo-600 tracking-tight uppercase"> <span className="text-gray-300 opacity-60">Target:</span> {getTargetName(report)} </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 whitespace-nowrap">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 text-red-600 font-black text-[10px] uppercase tracking-widest"> <Flag size={12} /> {report.reason} </div>
                                            <div className="text-[11px] text-gray-400 font-bold max-w-xs truncate">{report.description}</div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg ${report.status === 'pending' ? 'bg-orange-100 text-orange-700' : report.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}> {report.status} </span>
                                    </td>
                                    <td className="px-8 py-4 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-3">
                                            <button
                                                onClick={() => { setSelectedReport(report); setIsModalOpen(true); }}
                                                title="Inspect & Moderate"
                                                className="flex flex-col items-center gap-1 group transition-all"
                                            >
                                                <div className="w-8 h-8 flex items-center justify-center bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                                    <Eye size={14} className="group-hover:scale-110 transition-transform" />
                                                </div>
                                                <span className="text-[7px] font-black text-indigo-400 uppercase tracking-tighter opacity-60 group-hover:opacity-100">INSPECT</span>
                                            </button>

                                            {report.status === 'pending' && (
                                                <>
                                                    <button
                                                        onClick={() => handleAction(report._id, 'resolve')}
                                                        title="Quick Resolve"
                                                        className="flex flex-col items-center gap-1 group transition-all"
                                                    >
                                                        <div className="w-8 h-8 flex items-center justify-center bg-green-50 text-green-600 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-all shadow-sm">
                                                            <CheckCircle size={14} />
                                                        </div>
                                                        <span className="text-[7px] font-black text-green-500 uppercase tracking-tighter opacity-60 group-hover:opacity-100">RESOLVE</span>
                                                    </button>

                                                    <button
                                                        onClick={() => handleAction(report._id, 'dismiss')}
                                                        title="Dismiss Report"
                                                        className="flex flex-col items-center gap-1 group transition-all"
                                                    >
                                                        <div className="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-500 rounded-lg group-hover:bg-gray-500 group-hover:text-white transition-all shadow-sm">
                                                            <X size={14} />
                                                        </div>
                                                        <span className="text-[7px] font-black text-gray-400 uppercase tracking-tighter opacity-60 group-hover:opacity-100">DISMISS</span>
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

            <ReportDetailsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                report={selectedReport}
                onAction={handleAction}
            />

            {/* Background Loading Indicator - Placed at end to avoid space-y shifts */}
            <AnimatePresence>
                {loading && reports.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="absolute top-0 right-0 z-[100] flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 m-2 mt-4">
                        <RefreshCw size={12} className="animate-spin" /> Syncing...
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminReports;
