import React, { useState, useEffect } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';

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
            // Update local state to reflect read status
            setNotifications(notifications.map(notif =>
                notif._id === id ? { ...notif, read: true } : notif
            ));
        } catch (err) {
            console.error("Error marking notification as read:", err);
        }
    };

    const getNotificationText = (notification) => {
        switch (notification.type) {
            case 'reply':
                return 'replied to your post';
            case 'mention':
                return 'mentioned you in a post';
            case 'comment_reply':
                return 'replied to your comment';
            default:
                return 'interacted with you';
        }
    };

    if (loading) return <div className="p-4 text-center">Loading notifications...</div>;
    if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

    return (
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
            </div>
            <ul className="divide-y divide-gray-200">
                {notifications.length === 0 ? (
                    <li className="p-4 text-gray-500 text-center">No notifications yet.</li>
                ) : (
                    notifications.map((notification) => (
                        <li
                            key={notification._id}
                            className={`p-4 hover:bg-gray-50 transition-colors ${notification.read ? 'bg-white' : 'bg-blue-50'}`}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0">
                                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-bold">
                                            {notification.sender?.name ? notification.sender.name.charAt(0).toUpperCase() : '?'}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {notification.sender?.name || 'Someone'} {' '}
                                            <span className="font-normal text-gray-500">
                                                {getNotificationText(notification)}
                                            </span>
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {new Date(notification.createdAt).toLocaleDateString()} at {new Date(notification.createdAt).toLocaleTimeString()}
                                        </p>
                                        {notification.post && (
                                            <Link
                                                to={`/post/${notification.post}`}
                                                className="text-indigo-600 hover:text-indigo-900 text-sm mt-1 block"
                                                onClick={() => !notification.read && markAsRead(notification._id)}
                                            >
                                                View Post
                                            </Link>
                                        )}
                                    </div>
                                </div>
                                {!notification.read && (
                                    <button
                                        onClick={() => markAsRead(notification._id)}
                                        className="text-xs text-indigo-600 hover:text-indigo-900 font-medium"
                                    >
                                        Mark as read
                                    </button>
                                )}
                            </div>
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
};

export default Notifications;
