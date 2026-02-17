import React, { useState, useEffect } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';
import { Bell, User, Heart, MessageCircle, UserPlus, Check, X } from 'lucide-react';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications');
            setNotifications(response.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching notifications:", err);
            setError('Failed to load notifications.');
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(notifications.map(notif =>
                notif._id === id ? { ...notif, read: true } : notif
            ));
            window.dispatchEvent(new Event('notificationUpdate'));
        } catch (err) {
            console.error("Error marking notification as read:", err);
        }
    };

    const handleFriendRequest = async (id, requesterId, action) => {
        try {
            if (action === 'accept') {
                await api.put(`/users/${requesterId}/accept-request`);
                // toast.success("Friend request accepted!");
            } else {
                await api.put(`/users/${requesterId}/reject-request`);
                // toast.info("Friend request rejected.");
            }
            setNotifications(notifications.filter(n => n._id !== id));
            window.dispatchEvent(new Event('notificationUpdate'));
        } catch (err) {
            console.error(`Error ${action}ing friend request:`, err);
            alert(`Failed to ${action} request.`);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'like': return <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />;
            case 'reply':
            case 'comment_reply': return <MessageCircle className="w-5 h-5 text-indigo-400" />;
            case 'follow':
            case 'friend_request': return <UserPlus className="w-5 h-5 text-green-400" />;
            default: return <Bell className="w-5 h-5 text-yellow-500" />;
        }
    };

    const getNotificationText = (notification) => {
        switch (notification.type) {
            case 'reply': return 'replied to your post';
            case 'mention': return 'mentioned you in a post';
            case 'comment_reply': return 'replied to your comment';
            case 'like': return 'liked your post';
            case 'follow': return 'started following you';
            case 'friend_request': return 'sent you a friend request';
            case 'friend_request_accepted': return 'accepted your friend request';
            default: return 'interacted with you';
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[50vh]">
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
        </div>
    );

    if (error) return <div className="p-8 text-center text-red-400 bg-red-500/10 rounded-2xl border border-red-500/20 max-w-2xl mx-auto backdrop-blur-md">{error}</div>;

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-black text-white tracking-tight leading-none">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">Notifications</span>
                </h1>
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-300 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                    {notifications.filter(n => !n.read).length} New
                </span>
            </div>

            <div className="glass rounded-3xl border border-white/10 shadow-2xl overflow-hidden min-h-[400px]">
                <ul className="divide-y divide-white/5">
                    {notifications.length === 0 ? (
                        <li className="p-12 text-center flex flex-col items-center justify-center space-y-4">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center">
                                <Bell className="w-10 h-10 text-indigo-300/50" />
                            </div>
                            <p className="text-indigo-200 font-medium">No updates yet. Stay tuned!</p>
                        </li>
                    ) : (
                        notifications.map((notification) => (
                            <li
                                key={notification._id}
                                className={`p-6 transition-all duration-200 hover:bg-white/5 cursor-pointer relative group ${!notification.read ? 'bg-indigo-500/10' : ''}`}
                                onClick={() => !notification.read && markAsRead(notification._id)}
                            >
                                {!notification.read && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-pink-500 rounded-r-full shadow-[0_0_10px_rgba(236,72,153,0.5)]"></div>
                                )}

                                <div className="flex items-start space-x-5">
                                    <div className="relative flex-shrink-0">
                                        {notification.sender ? (
                                            <Link to={`/profile/${notification.sender._id}`} onClick={(e) => e.stopPropagation()}>
                                                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-lg overflow-hidden border border-white/10 transition-transform group-hover:scale-105">
                                                    {notification.sender.profilePicture ? (
                                                        <img src={notification.sender.profilePicture} alt={notification.sender.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        notification.sender.name?.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                            </Link>
                                        ) : (
                                            <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center text-gray-400 font-bold border border-white/10">?</div>
                                        )}
                                        <div className="absolute -bottom-1 -right-1 bg-[#0f0c29] rounded-full p-1 border border-white/10">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0 pt-0.5">
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm text-indigo-100 leading-snug">
                                                {notification.sender ? (
                                                    <Link to={`/profile/${notification.sender._id}`} className="font-bold text-white hover:text-pink-400 transition-colors mr-1" onClick={(e) => e.stopPropagation()}>
                                                        {notification.sender.name}
                                                    </Link>
                                                ) : <span className="font-bold text-gray-500 italic">Deleted User</span>}
                                                <span className="text-indigo-300 font-medium">{getNotificationText(notification)}</span>
                                            </p>
                                            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest whitespace-nowrap ml-4">
                                                {new Date(notification.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>

                                        {notification.post && notification.post._id && (
                                            <Link
                                                to={`/post/${notification.post._id}`}
                                                className="mt-3 inline-flex items-center text-xs font-bold text-indigo-300 hover:text-white bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg border border-white/5 transition-all"
                                                onClick={(e) => { e.stopPropagation(); if (!notification.read) markAsRead(notification._id); }}
                                            >
                                                <MessageCircle className="w-3 h-3 mr-2" />
                                                View Discussion
                                            </Link>
                                        )}

                                        {notification.type === 'friend_request' && notification.sender && (
                                            <div className="mt-3 flex space-x-3" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => handleFriendRequest(notification._id, notification.sender._id, 'accept')}
                                                    className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg hover:shadow-green-500/20 transition-all"
                                                >
                                                    <Check className="w-3 h-3 mr-1.5" /> Accept
                                                </button>
                                                <button
                                                    onClick={() => handleFriendRequest(notification._id, notification.sender._id, 'reject')}
                                                    className="flex items-center px-4 py-2 bg-white/5 hover:bg-white/10 text-red-300 border border-white/10 text-xs font-bold rounded-xl transition-all"
                                                >
                                                    <X className="w-3 h-3 mr-1.5" /> Reject
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </div>
        </div>
    );
};

export default Notifications;
