import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home,
    Users,
    Hash,
    MessageSquare,
    Bell,
    Search,
    LogOut,
    User as UserIcon,
    Settings as SettingsIcon,
    Menu,
    X,
    ChevronDown,
    MessageCircle
} from 'lucide-react';
import api from './api';
import { getImageUrl } from './utils/imageUtils';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const token = localStorage.getItem('token');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadMsgCount, setUnreadMsgCount] = useState(0);
    const [currentUser, setCurrentUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [openDropdown, setOpenDropdown] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (token) {
            const fetchData = async () => {
                try {
                    const [notifRes, userRes, msgRes] = await Promise.all([
                        api.get('/notifications'),
                        api.get('/users/me'),
                        api.get('/messages/unread-count')
                    ]);

                    setUnreadCount(notifRes.data.filter(n => !n.read).length);
                    setNotifications(notifRes.data);
                    setCurrentUser(userRes.data);
                    setUnreadMsgCount(msgRes.data.count);
                } catch (err) {
                    console.error("Failed to fetch navbar data", err);
                }
            };
            fetchData();
            const interval = setInterval(fetchData, 30000);
            window.addEventListener('notificationUpdate', fetchData);
            return () => {
                clearInterval(interval);
                window.removeEventListener('notificationUpdate', fetchData);
            };
        }
    }, [token]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const handleSearch = (e) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
            setSearchQuery('');
        }
    };

    const fetchConversations = async () => {
        try {
            const res = await api.get('/messages/conversations');
            setConversations(res.data);
        } catch (err) {
            console.error("Failed to fetch conversations", err);
        }
    };

    const isActive = (path) => location.pathname === path;

    const navItems = [
        { path: '/', icon: Home, label: 'Home' },
        { path: '/groups', icon: Users, label: 'Groups' },
        { path: '/topics', icon: Hash, label: 'Topics' },
    ];


    const getNotificationText = (notif) => {
        const senderName = notif.sender?.name || 'Someone';
        switch (notif.type) {
            case 'like': return `${senderName} liked your post`;
            case 'love': return `${senderName} loved your post`;
            case 'haha': return `${senderName} reacted to your post`;
            case 'wow': return `${senderName} was amazed by your post`;
            case 'sad': return `${senderName} reacted to your post`;
            case 'angry': return `${senderName} reacted to your post`;
            case 'comment': return `${senderName} commented on your post`;
            case 'reply': return `${senderName} replied to your comment`;
            case 'mention': return `${senderName} mentioned you`;
            case 'follow': return `${senderName} started following you`;
            case 'friend_request': return `${senderName} sent you a friend request`;
            case 'friend_request_accepted': return `${senderName} accepted your friend request`;
            default: return 'New notification';
        }
    };

    if (token) {
        return (
            <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 shadow-2xl">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

                    {/* Left: Logo & Search */}
                    <div className="flex items-center space-x-4 flex-1">
                        <Link to="/" className="flex-shrink-0 group">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20"
                            >
                                B
                            </motion.div>
                        </Link>

                        <div className="hidden md:flex relative group max-w-xs w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-300 group-focus-within:text-white transition-colors" />
                            <input
                                type="text"
                                placeholder="Search everything..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={handleSearch}
                                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-indigo-300 focus:outline-none focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm"
                            />
                        </div>
                    </div>

                    {/* Center: Desktop Nav */}
                    <div className="hidden md:flex items-center space-x-1 lg:space-x-4">
                        {navItems.map((item) => (
                            <Link key={item.path} to={item.path}>
                                <motion.div
                                    whileHover={{ y: -2 }}
                                    className={`relative px-4 py-2 rounded-xl flex items-center space-x-2 transition-all group ${isActive(item.path)
                                        ? 'text-white'
                                        : 'text-indigo-200 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <item.icon className={`w-5 h-5 ${isActive(item.path) ? 'text-indigo-400' : ''}`} />
                                    <span className="text-sm font-semibold tracking-wide">{item.label}</span>
                                    {isActive(item.path) && (
                                        <motion.div
                                            layoutId="nav-active"
                                            className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                        />
                                    )}
                                </motion.div>
                            </Link>
                        ))}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center justify-end space-x-2 md:space-x-4 flex-1">
                        {/* Messages Dropdown */}
                        <div className="relative">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    if (openDropdown === 'messages') setOpenDropdown(null);
                                    else {
                                        setOpenDropdown('messages');
                                        fetchConversations();
                                        setIsProfileMenuOpen(false);
                                    }
                                }}
                                className={`relative p-2 rounded-xl transition-all group ${openDropdown === 'messages' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-indigo-200 hover:text-white'}`}
                            >
                                <MessageCircle className="w-6 h-6" />
                                {unreadMsgCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-indigo-500 rounded-full text-[10px] flex items-center justify-center font-bold border-2 border-[#1a1c2e] animate-pulse">
                                        {unreadMsgCount}
                                    </span>
                                )}
                            </motion.button>

                            <AnimatePresence>
                                {openDropdown === 'messages' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 mt-3 w-80 bg-[#1a1c2e] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden ring-1 ring-black/5"
                                    >
                                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                                            <h3 className="font-bold text-white">Messages</h3>
                                            <Link to="/messages" onClick={() => setOpenDropdown(null)} className="text-xs text-indigo-300 hover:text-white font-bold uppercase tracking-wider">
                                                Maximize ↗
                                            </Link>
                                        </div>
                                        <div className="max-h-80 overflow-y-auto">
                                            {conversations.length === 0 ? (
                                                <div className="p-8 text-center text-indigo-300 text-sm">No recent messages</div>
                                            ) : (
                                                conversations.slice(0, 5).map((conv) => {
                                                    const other = conv.participants.find(p => p._id !== currentUser?._id) || { name: 'Chat' };
                                                    return (
                                                        <Link
                                                            key={conv._id}
                                                            to={`/messages?recipientId=${other._id}`}
                                                            onClick={() => setOpenDropdown(null)}
                                                            className="flex items-center space-x-3 p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                                                        >
                                                            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shadow-lg overflow-hidden flex-shrink-0">
                                                                {other.profilePicture ? (
                                                                    <img src={getImageUrl(other.profilePicture)} alt={other.name} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    other.name?.charAt(0).toUpperCase()
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="text-white font-bold text-sm truncate">{other.name}</h4>
                                                                <p className="text-indigo-200 text-xs truncate">{conv.lastMessage}</p>
                                                            </div>
                                                        </Link>
                                                    );
                                                })
                                            )}
                                        </div>
                                        <Link to="/messages" onClick={() => setOpenDropdown(null)} className="block p-3 text-center text-xs font-bold text-indigo-300 hover:text-white hover:bg-white/5 transition-colors border-t border-white/10">
                                            View All Messages
                                        </Link>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Notifications Dropdown */}
                        <div className="relative">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    if (openDropdown === 'notifications') setOpenDropdown(null);
                                    else {
                                        setOpenDropdown('notifications');
                                        setIsProfileMenuOpen(false);
                                    }
                                }}
                                className={`relative p-2 rounded-xl transition-all group ${openDropdown === 'notifications' ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-indigo-200 hover:text-white'}`}
                            >
                                <Bell className="w-6 h-6" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-pink-500 rounded-full text-[10px] flex items-center justify-center font-bold border-2 border-[#1a1c2e]">
                                        {unreadCount}
                                    </span>
                                )}
                            </motion.button>

                            <AnimatePresence>
                                {openDropdown === 'notifications' && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 mt-3 w-80 bg-[#1a1c2e] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden ring-1 ring-black/5"
                                    >
                                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
                                            <h3 className="font-bold text-white">Notifications</h3>
                                            <Link to="/notifications" onClick={() => setOpenDropdown(null)} className="text-xs text-indigo-300 hover:text-white font-bold uppercase tracking-wider">
                                                Maximize ↗
                                            </Link>
                                        </div>
                                        <div className="max-h-80 overflow-y-auto">
                                            {notifications.length === 0 ? (
                                                <div className="p-8 text-center text-indigo-300 text-sm">No new notifications</div>
                                            ) : (
                                                notifications.slice(0, 5).map((notif, i) => (
                                                    <div key={i} className="p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                                        <div className="flex items-start space-x-3">
                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                                {notif.sender?.profilePicture ? (
                                                                    <img src={getImageUrl(notif.sender.profilePicture)} alt="U" className="w-full h-full object-cover rounded-full" />
                                                                ) : (
                                                                    notif.sender?.name?.charAt(0).toUpperCase() || '?'
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm text-indigo-100">{getNotificationText(notif)}</p>
                                                                <p className="text-[10px] text-indigo-400 mt-1">{new Date(notif.createdAt).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        <Link to="/notifications" onClick={() => setOpenDropdown(null)} className="block p-3 text-center text-xs font-bold text-indigo-300 hover:text-white hover:bg-white/5 transition-colors border-t border-white/10">
                                            View All Notifications
                                        </Link>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="relative">
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    if (isProfileMenuOpen) setIsProfileMenuOpen(false);
                                    else {
                                        setIsProfileMenuOpen(true);
                                        setOpenDropdown(null);
                                    }
                                }}
                                className="flex items-center space-x-2 p-1 pl-1 pr-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all"
                            >
                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-lg">
                                    {currentUser?.profilePicture ? (
                                        <img src={getImageUrl(currentUser.profilePicture)} alt="P" className="w-full h-full object-cover rounded-md" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                                            {currentUser?.name?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <ChevronDown className={`w-4 h-4 text-indigo-300 transition-transform ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
                            </motion.button>

                            <AnimatePresence>
                                {isProfileMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute right-0 mt-3 w-56 bg-[#1a1c2e] border border-white/10 rounded-2xl shadow-2xl py-2 z-50 overflow-hidden ring-1 ring-black/5"
                                    >
                                        <div className="px-4 py-3 border-b border-white/5 mb-2">
                                            <p className="text-sm font-bold text-white truncate">{currentUser?.name}</p>
                                            <p className="text-xs text-indigo-300 truncate">@{currentUser?.username}</p>
                                        </div>

                                        <Link to="/profile" className="flex items-center space-x-3 px-4 py-2.5 text-sm text-indigo-100 hover:bg-white/10 transition-colors">
                                            <UserIcon className="w-4 h-4" />
                                            <span>Your Profile</span>
                                        </Link>
                                        <Link to="/settings" className="flex items-center space-x-3 px-4 py-2.5 text-sm text-indigo-100 hover:bg-white/10 transition-colors">
                                            <SettingsIcon className="w-4 h-4" />
                                            <span>Settings</span>
                                        </Link>
                                        <div className="h-px bg-white/5 my-2 mx-4" />
                                        <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                                            <LogOut className="w-4 h-4" />
                                            <span>Sign out</span>
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Mobile Toggle */}
                        <button
                            className="md:hidden p-2 text-white"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        >
                            {isMobileMenuOpen ? <X /> : <Menu />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="md:hidden glass border-t border-white/5 overflow-hidden"
                        >
                            <div className="p-4 space-y-2">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center space-x-3 p-3 rounded-xl ${isActive(item.path) ? 'bg-indigo-500/20 text-white' : 'text-indigo-200'
                                            }`}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        <span className="font-semibold">{item.label}</span>
                                    </Link>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>
        );
    }

    // Logged Out Navbar
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center space-x-8">
                    <Link to="/" className="flex items-center space-x-2">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-black">B</div>
                        <span className="text-xl font-bold text-white tracking-tight">BroTalk</span>
                    </Link>

                    <div className="hidden md:flex items-center space-x-6">
                        <Link to="/" className="text-indigo-200 hover:text-white font-semibold transition-colors text-sm flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span>What's New</span>
                        </Link>
                    </div>
                </div>

                <div className="flex items-center space-x-6">
                    <Link to="/login" className="text-indigo-200 hover:text-white font-semibold transition-colors">Login</Link>
                    <Link to="/signup" className="px-6 py-2 bg-indigo-50 text-indigo-900 rounded-full font-bold hover:bg-white transition-all shadow-lg shadow-indigo-500/10 hover:shadow-indigo-500/20">
                        Join Free
                    </Link>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
