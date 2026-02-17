import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { motion } from 'framer-motion';
import { User, AtSign, AlignLeft, MapPin, Briefcase, Globe, Save, X } from 'lucide-react';

const EditProfile = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        bio: '',
        location: '',
        website: '',
        occupation: '',
    });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchMe = async () => {
            try {
                const res = await api.get('/users/me');
                setFormData({
                    name: res.data.name || '',
                    username: res.data.username || '',
                    bio: res.data.bio || '',
                    location: res.data.location || '',
                    website: res.data.website || '',
                    occupation: res.data.occupation || '',
                });
                setLoading(false);
            } catch (err) {
                console.error("Error fetching profile", err);
                alert("Failed to load profile data");
                navigate('/profile');
            }
        };
        fetchMe();
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.put('/users/profile', formData);
            // Update local storage if name changed, but token usually handles it.
            // Actually, we might get a new token.
            // For now just redirect.
            navigate('/profile');
        } catch (err) {
            console.error("Update failed", err);
            alert(err.response?.data?.message || "Failed to update profile");
            setSubmitting(false);
        }
    };

    if (loading) return <div className="text-white text-center mt-20">Loading...</div>;

    return (
        <div className="max-w-3xl mx-auto px-4 py-12">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-[40px] p-10 border border-white/10 shadow-2xl relative overflow-hidden"
            >
                {/* Decorative background element */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[100px] -z-10" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600/5 blur-[100px] -z-10" />

                <h2 className="text-4xl font-black text-white mb-10 tracking-tighter">Edit Identity</h2>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Full Name */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-indigo-300/60 font-black text-[10px] uppercase tracking-widest ml-1">
                                <User size={14} /> Full Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full bg-white/5 text-white p-4 rounded-2xl border border-white/10 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all font-bold"
                                placeholder="Your full name"
                            />
                        </div>

                        {/* Username */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-indigo-300/60 font-black text-[10px] uppercase tracking-widest ml-1">
                                <AtSign size={14} /> Handle
                            </label>
                            <input
                                type="text"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className="w-full bg-white/5 text-white p-4 rounded-2xl border border-white/10 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all font-bold"
                                placeholder="username"
                            />
                        </div>
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                        <label className="flex items-center gap-2 text-indigo-300/60 font-black text-[10px] uppercase tracking-widest ml-1">
                            <AlignLeft size={14} /> Biography
                        </label>
                        <textarea
                            name="bio"
                            value={formData.bio}
                            onChange={handleChange}
                            className="w-full bg-white/5 text-white p-4 rounded-2xl border border-white/10 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all font-bold h-32 resize-none"
                            placeholder="Tell the world who you are..."
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Location */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-indigo-300/60 font-black text-[10px] uppercase tracking-widest ml-1">
                                <MapPin size={14} /> Headquarters
                            </label>
                            <input
                                type="text"
                                name="location"
                                value={formData.location}
                                onChange={handleChange}
                                className="w-full bg-white/5 text-white p-4 rounded-2xl border border-white/10 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all font-bold"
                                placeholder="City, Planet"
                            />
                        </div>

                        {/* Occupation */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-indigo-300/60 font-black text-[10px] uppercase tracking-widest ml-1">
                                <Briefcase size={14} /> Designation
                            </label>
                            <input
                                type="text"
                                name="occupation"
                                value={formData.occupation}
                                onChange={handleChange}
                                className="w-full bg-white/5 text-white p-4 rounded-2xl border border-white/10 focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all font-bold"
                                placeholder="Expertise level"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-6">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            onClick={() => navigate('/profile')}
                            className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-white/10 flex items-center justify-center gap-2"
                        >
                            <X size={16} /> Discard Changes
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={submitting}
                            className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {submitting ? (
                                <span className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Synchronizing...
                                </span>
                            ) : (
                                <>
                                    <Save size={16} /> Update Identity
                                </>
                            )}
                        </motion.button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default EditProfile;
