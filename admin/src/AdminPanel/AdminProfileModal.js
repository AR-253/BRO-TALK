import React, { useState, useRef } from 'react';
import api from '../api';
import { X, Save, Lock, User, AtSign, Camera, Image as ImageIcon, Loader2 } from 'lucide-react';

const AdminProfileModal = ({ isOpen, onClose, userProfile, onUpdate }) => {
    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
        name: userProfile?.name || '',
        username: userProfile?.username || '',
        bio: userProfile?.bio || '',
        profilePicture: userProfile?.profilePicture || ''
    });

    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [loading, setLoading] = useState(false);
    const [passLoading, setPassLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    if (!isOpen) return null;

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('image', file);

        setUploading(true);
        try {
            const res = await api.post('/upload', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFormData(prev => ({ ...prev, profilePicture: res.data }));
        } catch (err) {
            console.error(err);
            alert("Failed to upload image. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.put('/users/profile', formData);
            alert("Profile details updated successfully!");
            onUpdate(res.data);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Failed to update profile");
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return alert("New passwords do not match!");
        }
        setPassLoading(true);
        try {
            await api.put('/users/update-password', {
                oldPassword: passwordData.oldPassword,
                newPassword: passwordData.newPassword
            });
            alert("Password properly updated!");
            setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || "Failed to update password");
        } finally {
            setPassLoading(false);
        }
    };

    const getProfileImage = () => {
        const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
        if (!formData.profilePicture) return null;
        if (formData.profilePicture.startsWith('http')) return formData.profilePicture;
        return `${API_BASE_URL}${formData.profilePicture}`;
    };

    return (
        <div className="fixed inset-0 bg-[#0a0a0c]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-2xl w-full rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[90vh]">

                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tighter">My Account Setup</h2>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Admin Profile Configuration</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 overflow-y-auto space-y-10">

                    {/* Basic Info Form */}
                    <form onSubmit={handleProfileSubmit} className="space-y-8">
                        <h3 className="text-lg font-black text-indigo-600 border-b border-gray-100 pb-2 flex items-center gap-2">
                            <User size={18} /> Public Details
                        </h3>

                        <div className="flex flex-col md:flex-row gap-8 items-start">
                            {/* Profile Picture Section */}
                            <div className="relative group shrink-0">
                                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-xl relative">
                                    {getProfileImage() ? (
                                        <img
                                            src={getProfileImage()}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <User size={48} />
                                        </div>
                                    )}
                                    {uploading && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            <Loader2 size={32} className="text-white animate-spin" />
                                        </div>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2.5 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all border-2 border-white"
                                    title="Change Picture"
                                >
                                    <Camera size={18} />
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    accept="image/*"
                                />
                            </div>

                            <div className="flex-1 w-full space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input
                                                type="text"
                                                required
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full bg-gray-50 text-gray-900 pl-11 pr-4 py-3 rounded-2xl border-none focus:ring-2 focus:ring-indigo-600/20 font-bold transition-all"
                                                placeholder="Your full name"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1"><AtSign size={10} /> Username</label>
                                        <div className="relative">
                                            <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input
                                                type="text"
                                                required
                                                value={formData.username}
                                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                                className="w-full bg-gray-50 text-gray-900 pl-11 pr-4 py-3 rounded-2xl border-none focus:ring-2 focus:ring-indigo-600/20 font-bold transition-all"
                                                placeholder="username"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bio / About</label>
                                    <textarea
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        className="w-full bg-gray-50 text-gray-900 px-4 py-3 rounded-2xl border-none focus:ring-2 focus:ring-indigo-600/20 font-bold transition-all min-h-[100px] resize-none"
                                        placeholder="Write a short bio about yourself..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                disabled={loading || uploading}
                                type="submit"
                                className="group flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/30 active:scale-95"
                            >
                                <Save size={18} className="group-hover:scale-110 transition-all" />
                                {loading ? 'Saving Changes...' : 'Save Profile Details'}
                            </button>
                        </div>
                    </form>

                    {/* Password Form */}
                    <form onSubmit={handlePasswordSubmit} className="space-y-6 pt-4">
                        <h3 className="text-lg font-black text-red-500 border-b border-gray-100 pb-2 flex items-center gap-2">
                            <Lock size={18} /> Security & Authentication
                        </h3>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="password"
                                        required
                                        value={passwordData.oldPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                                        className="w-full bg-gray-50 text-gray-900 pl-11 pr-4 py-3 rounded-2xl border-none focus:ring-2 focus:ring-red-600/20 font-bold"
                                        placeholder="Enter current password to verify"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                                    <input
                                        type="password"
                                        required
                                        minLength="6"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        className="w-full bg-gray-50 text-gray-900 px-4 py-3 rounded-2xl border-none focus:ring-2 focus:ring-red-600/20 font-bold"
                                        placeholder="Min 6 characters"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm New LogIn Pass</label>
                                    <input
                                        type="password"
                                        required
                                        minLength="6"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        className="w-full bg-gray-50 text-gray-900 px-4 py-3 rounded-2xl border-none focus:ring-2 focus:ring-red-600/20 font-bold"
                                        placeholder="Must match exactly"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                disabled={passLoading}
                                type="submit"
                                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 shadow-xl shadow-red-500/20 hover:shadow-red-500/30 active:scale-95"
                            >
                                <Lock size={18} /> {passLoading ? 'Updating...' : 'Change Password'}
                            </button>
                        </div>
                    </form>

                </div>
            </div>
        </div>
    );
};

export default AdminProfileModal;
