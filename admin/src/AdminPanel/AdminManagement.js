import React, { useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useLocation } from 'react-router-dom';
import {
    Search,
    Shield,
    UserPlus,
    ChevronLeft,
    ChevronRight,
    X,
    CheckSquare,
    Square,
    Trash2,
    ChevronDown,
    ShieldCheck,
    Mail,
    UserCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminManagement = () => {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [activeDropdownId, setActiveDropdownId] = useState(null);
    const location = useLocation();

    // Sync search query from URL
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const search = params.get('search');
        setSearchQuery(search || '');
    }, [location.search]);

    const currentUser = JSON.parse(localStorage.getItem('adminUser') || '{}');
    const isSuperAdmin = currentUser.role === 'superadmin';

    const permissionOptions = [
        { id: 'all', label: 'All Access' },
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'users', label: 'Users' },
        { id: 'topics', label: 'Topics' },
        { id: 'reports', label: 'Reports' },
        { id: 'audits', label: 'Audits' },
        { id: 'settings', label: 'Settings' }
    ];

    const fetchAdmins = useCallback(async (p = page) => {
        try {
            setLoading(true);
            const response = await api.get(`/users/admin/list?page=${p}&limit=10`);
            setAdmins(response.data.admins || []);
            setTotalPages(response.data.totalPages || 1);
        } catch (err) {
            console.error("Error fetching admins:", err);
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchAdmins();
    }, [fetchAdmins]);

    const handleCreateAdmin = async (adminData) => {
        try {
            await api.post('/users/admin/create', adminData);
            setIsCreateModalOpen(false);
            fetchAdmins(1);
        } catch (err) {
            alert(err.response?.data?.message || "Failed to create admin");
        }
    };

    const handleUpdateAdmin = async (adminId, updateData) => {
        try {
            await api.put(`/users/admin/update/${adminId}`, updateData);
            setAdmins(prev => prev.map(a => a._id === adminId ? { ...a, ...updateData } : a));
        } catch (err) {
            alert(err.response?.data?.message || "Failed to update admin");
        }
    };

    const handleDeleteAdmin = async (adminId) => {
        if (window.confirm("Are you sure you want to remove this admin? This cannot be undone.")) {
            try {
                await api.delete(`/users/admin/delete/${adminId}`);
                fetchAdmins();
            } catch (err) {
                alert(err.response?.data?.message || "Failed to delete admin");
            }
        }
    };

    const togglePermission = (admin, permId) => {
        let newPerms = [...(admin.permissions || [])];
        if (newPerms.includes(permId)) {
            newPerms = newPerms.filter(p => p !== permId);
        } else {
            newPerms.push(permId);
        }
        handleUpdateAdmin(admin._id, { permissions: newPerms });
    };

    const getPermissionSummary = (perms) => {
        if (!perms || perms.length === 0) return '(No Access)';
        if (perms.includes('all')) return '(All Access)';
        const labels = permissionOptions
            .filter(opt => perms.includes(opt.id) && opt.id !== 'all')
            .map(opt => opt.label);
        return `(${labels.join(', ')})`;
    };

    const filteredAdmins = admins.filter(admin =>
        admin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (admin.adminTitle || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col space-y-3 overflow-hidden -mt-6 relative">
            {/* Top Action Bar - Just Create Button */}
            <div className="flex items-center justify-end px-2">
                {isSuperAdmin && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-[20px] text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                    >
                        <UserPlus size={16} />
                        Create New Admin
                    </button>
                )}
            </div>

            {/* Admin Table Section - No internal overflows to avoid dropdown clipping */}
            <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 relative">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead>
                        <tr className="bg-gray-50/50">
                            <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest rounded-tl-[40px]">Administrator</th>
                            <th className="px-8 py-5 text-left text-xs font-black text-gray-400 uppercase tracking-widest">Access & Permissions</th>
                            <th className="px-8 py-5 text-right text-xs font-black text-gray-400 uppercase tracking-widest rounded-tr-[40px]">Status / Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            [1, 2, 3].map(i => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-8 py-6"><div className="h-10 bg-gray-50 rounded-2xl w-48" /></td>
                                    <td className="px-8 py-6"><div className="h-8 bg-gray-50 rounded-xl w-64" /></td>
                                    <td className="px-8 py-6"><div className="h-10 bg-gray-50 rounded-2xl w-24 ml-auto" /></td>
                                </tr>
                            ))
                        ) : filteredAdmins.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <ShieldCheck size={48} className="text-gray-200" />
                                        <p className="text-gray-400 font-black uppercase tracking-widest text-xs">No administrative staff found</p>
                                    </div>
                                </td>
                            </tr>
                        ) : filteredAdmins.map(admin => (
                            <tr key={admin._id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-600/20 text-lg italic shrink-0">
                                            {admin.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-base font-black text-gray-900 leading-none mb-1">{admin.name}</div>
                                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                                                <input
                                                    type="text"
                                                    defaultValue={admin.adminTitle}
                                                    onBlur={(e) => {
                                                        if (e.target.value !== admin.adminTitle) {
                                                            handleUpdateAdmin(admin._id, { adminTitle: e.target.value });
                                                        }
                                                    }}
                                                    disabled={!isSuperAdmin}
                                                    className="text-indigo-600 bg-transparent border-none p-0 focus:ring-0 w-32 placeholder:text-gray-300 hover:bg-indigo-50/50 rounded transition-all cursor-text disabled:cursor-default"
                                                    placeholder="UNSET TITLE"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <div className="relative">
                                                <button
                                                    onClick={() => setActiveDropdownId(activeDropdownId === admin._id ? null : admin._id)}
                                                    disabled={!isSuperAdmin || admin.role === 'superadmin'}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50/50 transition-all shadow-sm disabled:opacity-30 disabled:hover:bg-white"
                                                >
                                                    <Shield size={12} />
                                                    Manage Access
                                                    <ChevronDown size={10} className={`transition-transform duration-300 ${activeDropdownId === admin._id ? 'rotate-180' : ''}`} />
                                                </button>

                                                <AnimatePresence>
                                                    {activeDropdownId === admin._id && (
                                                        <>
                                                            <div className="fixed inset-0 z-20" onClick={() => setActiveDropdownId(null)} />
                                                            <motion.div
                                                                initial={{ opacity: 0, y: -10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: -10 }}
                                                                className="absolute top-full left-0 mt-2 w-56 bg-white rounded-3xl shadow-2xl border border-gray-100 p-3 z-30 overflow-hidden"
                                                            >
                                                                <div className="space-y-1">
                                                                    {permissionOptions.map(perm => {
                                                                        const isActive = admin.permissions?.includes(perm.id);
                                                                        return (
                                                                            <label
                                                                                key={perm.id}
                                                                                className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all ${isActive ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}`}
                                                                            >
                                                                                <span className={`text-[9px] font-black uppercase tracking-widest ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
                                                                                    {perm.label}
                                                                                </span>
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={isActive}
                                                                                    onChange={() => togglePermission(admin, perm.id)}
                                                                                    className="w-3.5 h-3.5 rounded border-gray-200 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0"
                                                                                />
                                                                            </label>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </motion.div>
                                                        </>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                            <span className="text-[10px] text-gray-400 font-bold lowercase italic tracking-tight opacity-60">
                                                {getPermissionSummary(admin.permissions)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold">
                                            <Mail size={12} className="opacity-40" />
                                            {admin.email}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex items-center justify-end gap-3">
                                        {admin.role === 'superadmin' ? (
                                            <span className="px-3 py-1 bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-red-100">
                                                Root Access
                                            </span>
                                        ) : (
                                            <>
                                                <span className="px-3 py-1 bg-green-50 text-green-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-green-100">
                                                    Active
                                                </span>
                                                {isSuperAdmin && (
                                                    <button
                                                        onClick={() => handleDeleteAdmin(admin._id)}
                                                        className="flex flex-col items-center gap-1 group transition-all"
                                                        title="Remove Admin"
                                                    >
                                                        <div className="p-3 text-gray-300 group-hover:text-red-500 group-hover:bg-red-50 rounded-2xl transition-all border border-transparent group-hover:border-red-100 shadow-sm group-active:scale-95">
                                                            <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                                                        </div>
                                                        <span className="text-[7px] font-black text-red-400 uppercase tracking-tighter opacity-60 group-hover:opacity-100">REMOVE</span>
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination Section - Always visible */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0 rounded-b-[40px]">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                        PAGE {page} OF {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-indigo-600 hover:border-indigo-100 transition-all disabled:opacity-30 shadow-sm"
                        >
                            <ChevronLeft size={14} />
                            PREV
                        </button>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-indigo-600 hover:border-indigo-100 transition-all disabled:opacity-30 shadow-sm"
                        >
                            NEXT
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Create Admin Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <CreateAdminModal
                        onClose={() => setIsCreateModalOpen(false)}
                        onSubmit={handleCreateAdmin}
                        permissionOptions={permissionOptions}
                    />
                )}
            </AnimatePresence>
        </div>
    );
};

const CreateAdminModal = ({ onClose, onSubmit, permissionOptions }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        adminTitle: '',
        permissions: []
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const togglePerm = (id) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(id)
                ? prev.permissions.filter(p => p !== id)
                : [...prev.permissions, id]
        }));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white w-full max-w-lg rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden"
            >
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-indigo-600 text-white">
                    <div>
                        <h2 className="text-xl font-black tracking-tight">Expand Team</h2>
                        <p className="text-[10px] text-white/60 font-medium uppercase tracking-widest mt-1">Assign Secure Access</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-2xl transition-all">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Full Name</label>
                            <input
                                required
                                type="text"
                                className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-indigo-600/20"
                                placeholder="Admin Name"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Title</label>
                            <input
                                required
                                type="text"
                                className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-indigo-600/20"
                                placeholder="Moderator / Support"
                                value={formData.adminTitle}
                                onChange={e => setFormData({ ...formData, adminTitle: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Email</label>
                            <input
                                required
                                type="email"
                                className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-indigo-600/20"
                                placeholder="name@brotalk.com"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Password</label>
                            <input
                                required
                                type="password"
                                className="w-full bg-gray-50 border-none rounded-2xl p-4 text-xs font-bold focus:ring-2 focus:ring-indigo-600/20"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Module Permissions</label>
                        <div className="grid grid-cols-3 gap-2">
                            {permissionOptions.map(p => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => togglePerm(p.id)}
                                    className={`flex items-center gap-2 p-3 rounded-2xl border transition-all text-left ${formData.permissions.includes(p.id)
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                        : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'
                                        }`}
                                >
                                    {formData.permissions.includes(p.id) ? <CheckSquare size={14} /> : <Square size={14} />}
                                    <span className="text-[9px] font-black uppercase tracking-widest">{p.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-4 bg-gray-50 text-gray-400 font-black uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all text-[10px]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-4 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all text-[10px]"
                        >
                            Confirm Admin
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default AdminManagement;
