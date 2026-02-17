import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const Settings = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Password State
    const [passwords, setPasswords] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // Email State
    const [newEmail, setNewEmail] = useState('');

    // Notification State
    const [pushEnabled, setPushEnabled] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await api.get('/users/me');
                setUser(res.data);
                setNewEmail(res.data.email || '');
                // Mock push status for now or check permission
                setPushEnabled(Notification.permission === 'granted');
            } catch (err) {
                setError('Failed to load user data');
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, []);

    const handleUpdateEmail = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        try {
            await api.put('/users/update-email', { email: newEmail });
            setMessage('Email updated successfully!');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update email');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            setError('New passwords do not match');
            return;
        }
        setSaving(true);
        setMessage('');
        try {
            await api.put('/users/update-password', {
                oldPassword: passwords.oldPassword,
                newPassword: passwords.newPassword
            });
            setMessage('Password changed successfully!');
            setPasswords({ oldPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to change password');
        } finally {
            setSaving(false);
        }
    };

    const handleLogoutAll = async () => {
        if (!window.confirm('Are you sure you want to log out from all devices?')) return;
        setSaving(true);
        try {
            await api.post('/users/logout-all');
            localStorage.removeItem('token');
            navigate('/login');
        } catch (err) {
            setError('Logout all failed');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm('PERMANENT ACTION: Are you sure you want to delete your account? This cannot be undone.')) return;
        setSaving(true);
        try {
            await api.delete('/users');
            localStorage.removeItem('token');
            navigate('/signup');
        } catch (err) {
            setError('Failed to delete account');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
            <div className="flex flex-col space-y-2">
                <h1 className="text-4xl font-extrabold text-white tracking-tight">Settings</h1>
                <p className="text-indigo-200">Manage your account, security, and preferences.</p>
            </div>

            {/* Notifications Alert */}
            {(message || error) && (
                <div className={`p-4 rounded-xl border animate-fade-in ${message ? 'bg-green-500/20 border-green-500/50 text-green-200' : 'bg-red-500/20 border-red-500/50 text-red-200'}`}>
                    {message || error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Account Settings */}
                <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
                    <div className="flex items-center space-x-3 text-indigo-300">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        <h2 className="text-xl font-bold text-white">Account Settings</h2>
                    </div>

                    <form onSubmit={handleUpdateEmail} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-indigo-200 mb-1">Email Address</label>
                            <input
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Enter your email"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
                        >
                            Update Email
                        </button>
                    </form>

                    <div className="pt-4 border-t border-white/5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-white font-medium">Push Notifications</h3>
                                <p className="text-xs text-indigo-300">Get notified about activity.</p>
                            </div>
                            <button
                                onClick={() => setPushEnabled(!pushEnabled)}
                                className={`w-12 h-6 rounded-full transition-all relative ${pushEnabled ? 'bg-green-500' : 'bg-gray-600'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${pushEnabled ? 'right-1' : 'left-1'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Security Settings */}
                <div className="bg-white/10 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-xl space-y-6">
                    <div className="flex items-center space-x-3 text-indigo-300">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        <h2 className="text-xl font-bold text-white">Security</h2>
                    </div>

                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <input
                            type="password"
                            placeholder="Current Password"
                            value={passwords.oldPassword}
                            onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <input
                            type="password"
                            placeholder="New Password"
                            value={passwords.newPassword}
                            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <input
                            type="password"
                            placeholder="Confirm New Password"
                            value={passwords.confirmPassword}
                            onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
                        >
                            Change Password
                        </button>
                    </form>

                    <div className="pt-4 border-t border-white/5">
                        <button
                            onClick={handleLogoutAll}
                            className="w-full py-2 text-sm text-indigo-300 hover:text-white transition-colors flex items-center justify-center space-x-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-6 0v-1m6 0H9" /></svg>
                            <span>Logout from all devices</span>
                        </button>
                    </div>
                </div>

            </div>

            {/* Danger Zone */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center space-x-3 text-red-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    <h2 className="text-xl font-bold">Danger Zone</h2>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h3 className="text-white font-medium">Delete Account</h3>
                        <p className="text-sm text-red-300/70">Once deleted, all your data will be permanently removed.</p>
                    </div>
                    <button
                        onClick={handleDeleteAccount}
                        className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-900/20"
                    >
                        Delete My Account
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
