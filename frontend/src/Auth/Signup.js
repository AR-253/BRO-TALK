import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    AtSign,
    Mail,
    Lock,
    ArrowLeft,
    Check,
    ArrowRight,
    Loader2,
    ShieldCheck,
    Zap,
    Globe
} from 'lucide-react';

const Signup = () => {
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const { name, username, email, password, confirmPassword } = formData;

    const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            const regRes = await api.post('/users', {
                name,
                username,
                email,
                password
            });

            localStorage.setItem('token', regRes.data.token);
            navigate('/');
            window.location.reload();
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-900 overflow-hidden">
            {/* Dynamic Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] animate-blob" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] animate-blob animation-delay-2000" />
            </div>

            <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 z-10 items-center px-6 mt-10">

                {/* Brand Side */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="hidden lg:flex flex-col space-y-10"
                >
                    <div className="space-y-6">
                        <Link to="/" className="flex items-center space-x-3 group w-fit">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-2xl shadow-lg">B</div>
                            <span className="text-2xl font-black text-white tracking-tighter">BROTALK</span>
                        </Link>
                        <h1 className="text-6xl font-black text-white leading-[0.9] tracking-tighter">
                            A TOPIC-BASED <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400 text-7xl">SOCIAL.</span>
                        </h1>
                    </div>

                    <div className="space-y-6 max-w-md">
                        {[
                            { icon: Globe, title: "Shared Interests", desc: "Organized around real male experiences." },
                            { icon: ShieldCheck, title: "Trusted Space", desc: "Talk openly and ask for advice safely." },
                            { icon: Zap, title: "Topic-Focused", desc: "Structured discussions, no noise." }
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + i * 0.1 }}
                                className="flex items-center space-x-4 p-4 glass rounded-2xl border border-white/5"
                            >
                                <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                                    <item.icon size={24} />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold">{item.title}</h3>
                                    <p className="text-indigo-300/60 text-sm font-medium">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Form Side */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-[480px] mx-auto"
                >
                    <div className="glass rounded-[40px] border border-white/10 shadow-2xl p-10 relative overflow-y-auto max-h-[90vh] scrollbar-hide">
                        <div className="absolute top-0 left-0 p-8">
                            <Link to="/login">
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="text-indigo-400 hover:text-white transition-colors flex items-center space-x-2">
                                    <ArrowLeft size={20} />
                                    <span className="text-[10px] font-black uppercase tracking-widest mt-0.5">Back</span>
                                </motion.div>
                            </Link>
                        </div>

                        <div className="mb-8 mt-6">
                            <h2 className="text-3xl font-black text-white tracking-tight mb-2">Create Account</h2>
                            <p className="text-indigo-300 font-medium">Join our elite community today.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <AnimatePresence>
                                {error && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center space-x-3"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                        <p className="text-sm font-bold text-red-200">{error}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-indigo-300 uppercase tracking-widest ml-2">Full Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 group-focus-within:text-white transition-colors" />
                                        <input
                                            name="name"
                                            value={name}
                                            onChange={onChange}
                                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-indigo-300/30 focus:outline-none focus:bg-white/10 transition-all font-bold text-sm"
                                            placeholder="John Doe"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-indigo-300 uppercase tracking-widest ml-2">Username</label>
                                    <div className="relative group">
                                        <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 group-focus-within:text-white transition-colors" />
                                        <input
                                            name="username"
                                            value={username}
                                            onChange={onChange}
                                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-indigo-300/30 focus:outline-none focus:bg-white/10 transition-all font-bold text-sm"
                                            placeholder="jdoe"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-indigo-300 uppercase tracking-widest ml-2">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 group-focus-within:text-white transition-colors" />
                                    <input
                                        name="email"
                                        type="email"
                                        value={email}
                                        onChange={onChange}
                                        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-indigo-300/30 focus:outline-none focus:bg-white/10 transition-all font-bold text-sm"
                                        placeholder="john@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-indigo-300 uppercase tracking-widest ml-2">Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 group-focus-within:text-white transition-colors" />
                                        <input
                                            name="password"
                                            type="password"
                                            value={password}
                                            onChange={onChange}
                                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-indigo-300/30 focus:outline-none focus:bg-white/10 transition-all font-bold text-sm"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-indigo-300 uppercase tracking-widest ml-2">Confirm</label>
                                    <div className="relative group">
                                        <Check className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 group-focus-within:text-white transition-colors" />
                                        <input
                                            name="confirmPassword"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={onChange}
                                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-indigo-300/30 focus:outline-none focus:bg-white/10 transition-all font-bold text-sm"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading}
                                className="w-full py-4.5 mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <span className="uppercase tracking-[0.2em] text-xs">Initialize Account</span>
                                        <ArrowRight size={18} />
                                    </>
                                )}
                            </motion.button>
                        </form>

                        <div className="mt-8 text-center">
                            <p className="text-sm font-bold text-indigo-300">
                                Already a member?{' '}
                                <Link to="/login" className="text-white hover:text-indigo-400 transition-colors uppercase tracking-widest text-xs ml-1">
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Signup;
