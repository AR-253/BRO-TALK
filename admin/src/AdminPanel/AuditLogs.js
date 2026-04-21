import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Clock,
    Search,
    Filter,
    Shield,
    User,
    Activity,
    ChevronLeft,
    ChevronRight,
    RefreshCw
} from 'lucide-react';

const cachedLogsData = {
    logs: [],
    totalPages: 1,
    totalLogs: 0
};

const AuditLogs = () => {
    const [logs, setLogs] = useState(cachedLogsData.logs);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(cachedLogsData.totalPages);
    const [totalLogs, setTotalLogs] = useState(cachedLogsData.totalLogs);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [loading, setLoading] = useState(cachedLogsData.logs.length === 0);
    const [error, setError] = useState(null);
    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const search = params.get('search');
        setSearchQuery(search || '');
    }, [location.search]);

    useEffect(() => {
        fetchLogs();
    }, [page, pageSize, sortBy, searchQuery]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const limit = pageSize === 'all' ? 1000 : pageSize;
            const res = await api.get(`/users/admin/audit-logs?page=${page}&limit=${limit}&search=${searchQuery}&sort=${sortBy}`);
            setLogs(res.data.logs || []);
            setTotalPages(res.data.totalPages || 1);
            setTotalLogs(res.data.totalLogs || 0);

            // Update cache
            cachedLogsData.logs = res.data.logs || [];
            cachedLogsData.totalPages = res.data.totalPages || 1;
            cachedLogsData.totalLogs = res.data.totalLogs || 0;
            setError(null);
        } catch (err) {
            console.error("Error fetching audit logs:", err);
            setError('Failed to load audit logs.');
        } finally {
            setLoading(false);
        }
    };

    const formatAction = (action) => {
        return action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    };

    return (
        <div className="h-full flex-1 flex flex-col space-y-3 overflow-hidden -mt-6 relative">

            <div className="bg-white p-4 rounded-[32px] shadow-sm border border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0">
                <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="flex items-center space-x-1 bg-gray-50 p-1 rounded-2xl border border-gray-100 shrink-0">
                        {['newest', 'oldest'].map(tab => (
                            <button key={tab} onClick={() => { setSortBy(tab); setPage(1); }} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${sortBy === tab ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-gray-400 hover:text-gray-900'}`}>
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100">
                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Show:</span>
                    <select value={pageSize} onChange={e => { setPageSize(e.target.value === 'all' ? 'all' : parseInt(e.target.value)); setPage(1); }} className="bg-transparent text-xs font-bold text-gray-900 focus:outline-none border-none cursor-pointer">
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
                            <tr className="bg-gray-50/50 text-left">
                                <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 italic">Performed By</th>
                                <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 italic">Action Details</th>
                                <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 italic">Target</th>
                                <th className="px-8 py-4 text-xs font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 italic">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {logs.map(log => (
                                <tr key={log._id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600"> <User size={14} /> </div>
                                            <div>
                                                <p className="text-xs font-black text-gray-900 uppercase">{log.adminId?.name || 'Admin'}</p>
                                                <p className="text-[10px] text-gray-400 font-bold">@{log.adminId?.username || 'system'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.1em]">{formatAction(log.action)}</p>
                                            <p className="text-[11px] text-gray-500 font-bold max-w-xs italic">{log.details}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-xs font-black text-gray-500 uppercase italic">
                                        {log.targetName || 'N/A'}
                                    </td>
                                    <td className="px-8 py-4">
                                        <div className="flex flex-col items-start gap-0.5">
                                            <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{new Date(log.createdAt).toLocaleDateString('en-US', { weekday: 'long' })}</p>
                                            <p className="text-[10px] font-bold text-gray-400 leading-none">{new Date(log.createdAt).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
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
                {loading && logs.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="absolute top-0 right-0 z-[100] flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg m-2 mt-4">
                        <RefreshCw size={12} className="animate-spin" /> Syncing...
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AuditLogs;
