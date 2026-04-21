import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Mail, Lock, Loader2, AlertCircle, ChevronRight } from 'lucide-react';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await api.post('/users/login', formData);

            // Check if the user is an admin
            if (res.data.role !== 'admin' && res.data.role !== 'superadmin') {
                setError('Unauthorized: Admin access only.');
                setLoading(false);
                return;
            }

            // Save token and navigate to dashboard
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('adminUser', JSON.stringify(res.data));
            navigate('/admin');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Abstract Background Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-[440px] z-10"
            >
                <div className="bg-[#121216]/80 backdrop-blur-xl border border-white/5 rounded-[40px] p-10 shadow-2xl relative overflow-hidden">
                    {/* Header */}
                    <div className="mb-10 text-center">
                        <motion.div
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-600/20"
                        >
                            <Shield className="text-white" size={32} />
                        </motion.div>
                        <h2 className="text-3xl font-black text-white italic tracking-tighter mb-2 uppercase">Admin Portal</h2>
                        <p className="text-gray-400 font-bold text-sm tracking-wide uppercase opacity-60">BroTalk Security HQ</p>
                    </div>

                    <AnimatePresence mode="wait">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-red-500 text-sm font-bold"
                            >
                                <AlertCircle size={18} />
                                <span>{error}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                            <div className="relative group">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-indigo-500" size={20} />
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="Enter your email"
                                    className="w-full bg-white/5 border border-white/5 text-white pl-14 pr-6 py-4 rounded-2xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600/40 outline-none transition-all placeholder:text-gray-600 font-bold"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
                            <div className="relative group">
                                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-indigo-500" size={20} />
                                <input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="••••••••"
                                    className="w-full bg-white/5 border border-white/5 text-white pl-14 pr-6 py-4 rounded-2xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600/40 outline-none transition-all placeholder:text-gray-600 font-bold"
                                />
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            type="submit"
                            className="w-full group relative overflow-hidden py-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl font-black text-white uppercase tracking-widest text-sm shadow-xl shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {loading ? (
                                    <Loader2 className="animate-spin" size={20} />
                                ) : (
                                    <>
                                        Authorize Access <ChevronRight size={18} />
                                    </>
                                )}
                            </span>
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        </button>
                    </form>

                    <div className="mt-10 text-center">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] opacity-40">Protected by Bro-Encryption</p>
                    </div>
                </div>

                {/* Footer Quote or Branding */}
                <div className="mt-8 text-center text-gray-600 font-black text-[11px] uppercase tracking-widest opacity-30 select-none">
                    BroTalk Network • Administrative Control Unit • 2026
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
