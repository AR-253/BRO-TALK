import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowLeft, Loader2, Github, Twitter } from 'lucide-react';

const Login = ({ isAdmin = false }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('/users/login', {
                email,
                password
            });

            localStorage.setItem('token', response.data.token);
            const userRole = response.data.role;

            if (isAdmin && userRole !== 'admin') {
                setError('Access denied. Admins only.');
                localStorage.removeItem('token');
            } else {
                navigate(isAdmin ? '/admin' : '/');
            }

            if (window.location.pathname === '/login') window.location.reload();

        } catch (err) {
            setError(err.response?.data?.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-900 overflow-hidden">
            {/* Dynamic Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-blob" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-blob animation-delay-2000" />
                <div className="absolute top-[20%] right-[10%] w-[300px] h-[300px] bg-pink-600/10 rounded-full blur-[100px] animate-blob animation-delay-4000" />
            </div>

            <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 z-10 items-center px-6">

                {/* Brand Side */}
                <motion.div
                    initial={{ opacity: 0, x: -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="hidden lg:flex flex-col space-y-8"
                >
                    <Link to="/" className="flex items-center space-x-3 group w-fit">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-2xl shadow-lg group-hover:shadow-indigo-500/20 transition-all">
                            B
                        </div>
                        <span className="text-2xl font-black text-white tracking-tighter">BROTALK</span>
                    </Link>

                    <div className="space-y-4">
                        <h1 className="text-7xl font-black text-white leading-[0.9] tracking-tighter">
                            CONNECTING <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
                                BROS.
                            </span>
                        </h1>
                        <p className="text-xl text-indigo-200/60 max-w-md font-medium leading-relaxed">
                            Organized around shared male experiences. Build, share, and grow together in a structured environment.
                        </p>
                    </div>

                    <div className="flex items-center space-x-4 pt-4">
                        <div className="flex -space-x-3">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="w-10 h-10 rounded-xl border-2 border-[#0a0b14] bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl" />
                            ))}
                        </div>
                        <p className="text-sm font-bold text-indigo-300 uppercase tracking-widest">
                            Join 2,400+ members
                        </p>
                    </div>
                </motion.div>

                {/* Form Side */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-[440px] mx-auto"
                >
                    <div className="glass rounded-[40px] border border-white/10 shadow-2xl p-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8">
                            <Link to="/">
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="text-indigo-400 hover:text-white transition-colors">
                                    <ArrowLeft size={24} />
                                </motion.div>
                            </Link>
                        </div>

                        <div className="mb-10">
                            <h2 className="text-3xl font-black text-white tracking-tight mb-2">Welcome Back</h2>
                            <p className="text-indigo-300 font-medium">Log in to your account</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center space-x-3"
                                >
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    <p className="text-sm font-bold text-red-200">{error}</p>
                                </motion.div>
                            )}

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em] ml-2">Email Address</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500 group-focus-within:text-white transition-colors" />
                                        <input
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-indigo-300/30 focus:outline-none focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold"
                                            placeholder="name@company.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center px-2">
                                        <label className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em]">Password</label>
                                        <Link to="/forgot-password" size="sm" className="text-[10px] font-black text-indigo-500 hover:text-white uppercase tracking-widest transition-colors">
                                            Forgot?
                                        </Link>
                                    </div>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500 group-focus-within:text-white transition-colors" />
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-indigo-300/30 focus:outline-none focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center space-x-2"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <span className="uppercase tracking-[0.2em] text-sm">Sign In Now</span>
                                )}
                            </motion.button>
                        </form>

                        <div className="mt-10 flex flex-col items-center space-y-6">
                            <div className="flex items-center w-full space-x-4">
                                <div className="h-px bg-white/10 flex-1" />
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Or continue with</span>
                                <div className="h-px bg-white/10 flex-1" />
                            </div>

                            <div className="grid grid-cols-2 gap-4 w-full">
                                <button className="flex items-center justify-center py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                                    <Github size={20} className="text-white" />
                                </button>
                                <button className="flex items-center justify-center py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                                    <Twitter size={20} className="text-sky-400" />
                                </button>
                            </div>

                            <p className="text-sm font-bold text-indigo-300">
                                New here?{' '}
                                <Link to="/signup" className="text-white hover:text-indigo-400 transition-colors underline decoration-indigo-500 underline-offset-4">
                                    Create an account
                                </Link>
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
