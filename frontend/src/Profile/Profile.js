import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Camera,
    MapPin,
    Calendar,
    Edit3,
    UserPlus,
    UserCheck,
    UserX,
    MessageCircle,
    MoreHorizontal,
    Heart,
    Share2,
    Bookmark,
    Trash2,
    ChevronDown,
    Grid,
    Info,
    Users,
    Check
} from 'lucide-react';

const Profile = () => {
    const { id } = useParams(); // If viewing another user
    const [user, setUser] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    // Fetch current user details to check if it's "my" profile
    useEffect(() => {
        const fetchMe = async () => {
            try {
                const res = await api.get('/users/me');
                setCurrentUser(res.data);
                // If no ID param is provided, show current user's profile
                if (!id) setUser(res.data);
            } catch (err) {
                console.error("Error fetching me", err);
                setLoading(false); // Stop loading on error
            }
        };
        fetchMe();
    }, [id]);

    // Fetch specific user details if ID is provided
    useEffect(() => {
        const fetchUser = async () => {
            if (id) {
                try {
                    setLoading(true);
                    const res = await api.get(`/users/${id}`);
                    setUser(res.data);

                    // Also fetch posts for this user
                    try {
                        const postsRes = await api.get(`/posts/user/${id}`);
                        setPosts(postsRes.data);
                    } catch (postErr) {
                        console.error("Error fetching user posts", postErr);
                    }
                } catch (err) {
                    console.error("Error fetching user profile", err);
                    setError("User not found");
                    setUser(null);
                } finally {
                    setLoading(false);
                }
            } else if (currentUser) {
                setUser(currentUser);
                setLoading(false);
            }
        };
        fetchUser();
    }, [id, currentUser]);

    // Fetch User's Posts (Only if viewing ME, otherwise we fetched above)
    // Actually, let's separate:
    // If ID: we fetched posts to get user.
    // If !ID (Me): we set User, then we need to fetch posts.
    useEffect(() => {
        if (!id && user) { // Only fetch if it's my profile
            const fetchMyPosts = async () => {
                try {
                    const res = await api.get(`/posts/user/${user._id}`);
                    setPosts(res.data);
                } catch (err) {
                    console.error("Error fetching user posts", err);
                }
            };
            fetchMyPosts();
        }
    }, [user, id]);


    const [editingPost, setEditingPost] = useState(null);
    const [editContent, setEditContent] = useState("");
    const [menuOpen, setMenuOpen] = useState(null);
    const [filter, setFilter] = useState('recent');
    const [isManageMode, setIsManageMode] = useState(false);
    const [selectedPosts, setSelectedPosts] = useState([]);

    const handleDelete = async (postId) => {
        if (window.confirm("Are you sure you want to delete this post?")) {
            try {
                await api.delete(`/posts/${postId}`);
                setPosts(posts.filter(p => p._id !== postId));
            } catch (err) {
                alert("Failed to delete post");
            }
        }
    };

    const startEdit = (post) => {
        setEditingPost(post._id);
        setEditContent(post.content);
        setMenuOpen(null);
    };

    const handleUpdate = async (postId) => {
        try {
            const res = await api.put(`/posts/${postId}`, { content: editContent });
            setPosts(posts.map(p => p._id === postId ? { ...p, content: res.data.content } : p));
            setEditingPost(null);
        } catch (err) {
            console.error("Update failed", err);
            alert(err.response?.data?.message || "Failed to update post");
        }
    };

    // Reaction Logic
    const REACTION_TYPES = [
        { type: 'like', icon: '👍', label: 'Like', color: 'text-blue-500' },
        { type: 'love', icon: '❤️', label: 'Love', color: 'text-red-500' },
        { type: 'haha', icon: '😂', label: 'Haha', color: 'text-yellow-500' },
        { type: 'wow', icon: '😮', label: 'Wow', color: 'text-yellow-500' },
        { type: 'sad', icon: '😢', label: 'Sad', color: 'text-yellow-500' },
        { type: 'angry', icon: '😡', label: 'Angry', color: 'text-red-600' }
    ];

    const handleReaction = async (postId, type) => {
        if (!currentUser) return alert("Please log in to react.");

        try {
            const res = await api.put(`/posts/${postId}/react`, { type });
            setPosts(posts.map(p => p._id === postId ? { ...p, reactions: res.data } : p));
        } catch (err) {
            console.error("Reaction failed", err);
        }
    };

    const getUserReaction = (post) => {
        if (!currentUser || !post.reactions) return null;
        return post.reactions.find(r => r.user === currentUser._id || r.user?._id === currentUser._id);
    };

    const handleSave = async (postId) => {
        if (!currentUser) return alert("Please log in to save posts.");
        try {
            const res = await api.put(`/users/save/${postId}`);
            if (res.data.isSaved) {
                setCurrentUser({ ...currentUser, savedPosts: [...(currentUser.savedPosts || []), postId] });
            } else {
                setCurrentUser({ ...currentUser, savedPosts: (currentUser.savedPosts || []).filter(id => id !== postId) });
            }
        } catch (err) {
            console.error("Save failed", err);
        }
    };

    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
        let sortedPosts = [...posts];
        if (newFilter === 'recent') {
            sortedPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (newFilter === 'oldest') {
            sortedPosts.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else if (newFilter === 'popular') {
            sortedPosts.sort((a, b) => (b.reactions?.length || 0) - (a.reactions?.length || 0));
        }
        setPosts(sortedPosts);
    };

    const toggleSelectPost = (postId) => {
        if (selectedPosts.includes(postId)) {
            setSelectedPosts(selectedPosts.filter(id => id !== postId));
        } else {
            setSelectedPosts([...selectedPosts, postId]);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedPosts.length === 0) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedPosts.length} posts?`)) return;

        try {
            await Promise.all(selectedPosts.map(id => api.delete(`/posts/${id}`)));
            setPosts(posts.filter(p => !selectedPosts.includes(p._id)));
            setSelectedPosts([]);
            setIsManageMode(false);
            alert("Posts deleted successfully");
        } catch (err) {
            console.error("Bulk delete failed", err);
            alert("Failed to delete some posts");
        }
    };

    const handleFriendAction = async (action) => {
        if (!currentUser) return alert("Please log in.");
        if (!user) return;

        try {
            if (action === 'accept') {
                await api.put(`/users/${user._id}/accept-request`);
                alert("Friend request accepted!");
                // Optimistic update could happen here, or reload
                window.location.reload();
            } else if (action === 'reject') {
                await api.put(`/users/${user._id}/reject-request`);
                alert("Friend request rejected.");
                window.location.reload();
            } else if (action === 'unfriend') {
                if (window.confirm("Are you sure you want to remove this friend?")) {
                    await api.put(`/users/${user._id}/unfollow`);
                    alert("Unfriended.");
                    window.location.reload();
                }
            } else if (action === 'add') {
                await api.put(`/users/${user._id}/friend-request`);
                alert("Friend request sent!");
                window.location.reload();
            }
        } catch (err) {
            console.error("Action failed", err);
            alert(err.response?.data?.message || "Action failed");
        }
    };

    if (loading) return <div className="text-white text-center mt-20">Loading Profile...</div>;
    if (!user) return <div className="text-white text-center mt-20">User not found</div>;
    // ...

    // Determine button text and status
    let isFriend = false;
    let hasIncomingRequest = false;
    let hasSentRequest = false; // We can't easily track this without extra data from backend about "sent requests"

    if (currentUser && user) {
        // Check Friends
        const following = currentUser.following || [];
        isFriend = following.some(f => (f._id === user._id || f === user._id));

        // Check Incoming Request
        const requests = currentUser.friendRequests || [];
        hasIncomingRequest = requests.some(r => (r._id === user._id || r === user._id));

        // Check Sent Request (We can cheat by clicking Add Friend and handling error, OR we assume if not friend and not incoming, allow Add)
        // For now, we will handle "Add Friend" 
    }

    // Hide button if own profile
    const showAddButton = currentUser && user && currentUser._id !== user._id;
    const isOwner = currentUser && user && currentUser._id === user._id;

    const handleFileUpload = async (e, field) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            // 1. Upload Image
            const uploadRes = await api.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const imagePath = uploadRes.data; // e.g., /uploads/image-123.jpg
            const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
            const fullImageUrl = `${baseUrl}${imagePath}`;

            // 2. Update User Profile with new Image URL
            const updateData = { [field]: fullImageUrl };
            await api.put('/users/profile', updateData);

            // 3. Update Local State (optimistic)
            setUser(prev => ({ ...prev, [field]: fullImageUrl }));
            if (isOwner) {
                // Update currentUser too just in case
                setCurrentUser(prev => ({ ...prev, [field]: fullImageUrl }));
            }
            alert("Image updated successfully!");

        } catch (err) {
            console.error("File upload failed", err);
            alert("Failed to upload image");
        }
    };


    return (
        <div className="max-w-6xl mx-auto px-4 pb-20">
            {/* HERO SECTION / COVER */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative mb-8 pt-6"
            >
                {/* Cover Photo */}
                <div className="h-72 w-full glass rounded-[40px] overflow-hidden shadow-2xl relative group border border-white/10">
                    {user.coverPhoto ? (
                        <motion.img
                            initial={{ scale: 1.1 }}
                            animate={{ scale: 1 }}
                            src={user.coverPhoto}
                            alt="Cover"
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-600/20 via-purple-600/20 to-pink-600/20 flex items-center justify-center">
                            <span className="text-white/10 text-8xl font-black italic tracking-tighter">BROTALK</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b14] via-transparent to-transparent opacity-60" />

                    {/* Camera Icon for Cover */}
                    {isOwner && (
                        <label className="absolute bottom-6 right-6 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-2xl cursor-pointer transition-all shadow-xl z-20">
                            <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'coverPhoto')} />
                            <Camera size={20} />
                        </label>
                    )}
                </div>

                {/* Profile Info Wrapper */}
                <div className="px-10 flex flex-col lg:flex-row items-end -mt-20 gap-8 relative z-10">
                    {/* Profile Picture */}
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="w-48 h-48 rounded-[40px] border-8 border-[#0a0b14] overflow-hidden bg-gray-900 shadow-2xl relative group"
                    >
                        {user.profilePicture ? (
                            <img
                                src={user.profilePicture}
                                alt={user.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-6xl font-black text-indigo-400 bg-indigo-500/10">
                                {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                            </div>
                        )}

                        {/* Camera Icon for Profile Pic */}
                        {isOwner && (
                            <label className="absolute inset-0 bg-indigo-600/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-all duration-300 z-20">
                                <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'profilePicture')} />
                                <Camera size={32} className="text-white drop-shadow-lg" />
                            </label>
                        )}
                    </motion.div>

                    {/* Name & Bio */}
                    <div className="flex-1 mb-4 text-center lg:text-left">
                        <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-4 mb-2">
                            <h1 className="text-5xl font-black text-white tracking-tighter">{user.name}</h1>
                            {user.username && <span className="text-indigo-400 font-bold text-xl opacity-80 mt-1 lg:mt-3">@{user.username}</span>}
                        </div>
                        <p className="text-indigo-200/60 font-medium text-lg max-w-2xl">{user.bio || "Crafting thoughts, one post at a time."}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 mb-6 w-full lg:w-auto justify-center lg:justify-start">
                        {showAddButton && (
                            <div className="flex gap-2">
                                {hasIncomingRequest ? (
                                    <>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleFriendAction('accept')}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center gap-2"
                                        >
                                            <UserCheck size={18} /> Accept
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleFriendAction('reject')}
                                            className="bg-white/5 hover:bg-white/10 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest border border-white/10"
                                        >
                                            <UserX size={18} />
                                        </motion.button>
                                    </>
                                ) : isFriend ? (
                                    <div className="relative group/friend">
                                        <motion.button
                                            className="bg-green-500/20 text-green-400 px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest border border-green-500/20 flex items-center gap-2"
                                        >
                                            <Check size={18} /> Friends
                                        </motion.button>
                                        <div className="absolute top-full left-0 mt-2 w-full opacity-0 group-hover/friend:opacity-100 transition-all pointer-events-none group-hover/friend:pointer-events-auto z-50 pt-2">
                                            <button
                                                onClick={() => handleFriendAction('unfriend')}
                                                className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-widest border border-red-500/20 flex items-center justify-center gap-2"
                                            >
                                                Unfriend
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => handleFriendAction('add')}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2"
                                    >
                                        <UserPlus size={18} /> Add Friend
                                    </motion.button>
                                )}
                                <Link to={`/messages?recipientId=${user._id}`}>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="bg-white/10 hover:bg-white/20 text-white px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest border border-white/10 flex items-center gap-2"
                                    >
                                        <MessageCircle size={18} /> Message
                                    </motion.button>
                                </Link>
                            </div>
                        )}
                        {isOwner && (
                            <Link to="/edit-profile">
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-2"
                                >
                                    <Edit3 size={18} /> Edit Profile
                                </motion.button>
                            </Link>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* CONTENT GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                {/* LEFT SIDEBAR: Intro & Connects */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Intro Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="glass rounded-[40px] p-8 border border-white/10 shadow-2xl space-y-6"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-black text-white tracking-tight">Intro</h3>
                            <Info size={20} className="text-indigo-400/50" />
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4 text-indigo-200/60 font-bold group">
                                <div className="p-2.5 bg-indigo-500/10 rounded-xl group-hover:bg-indigo-500/20 transition-colors">
                                    <MapPin size={20} className="text-indigo-400" />
                                </div>
                                <span className="text-sm">Lives in <strong className="text-white">{user.location || "Cyberspace"}</strong></span>
                            </div>
                            <div className="flex items-center gap-4 text-indigo-200/60 font-bold group">
                                <div className="p-2.5 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors">
                                    <Calendar size={20} className="text-purple-400" />
                                </div>
                                <span className="text-sm">Joined <strong className="text-white">{new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</strong></span>
                            </div>
                        </div>

                        <div className="pt-2">
                            {isOwner && (
                                <Link to="/edit-profile" className="block w-full text-center py-3.5 bg-white/5 hover:bg-white/10 rounded-2xl font-black text-xs uppercase tracking-widest text-indigo-300 transition-all border border-white/5">
                                    Edit Details
                                </Link>
                            )}
                        </div>
                    </motion.div>

                    {/* Connects Card */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass rounded-[40px] p-8 border border-white/10 shadow-2xl"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex flex-col">
                                <h3 className="text-2xl font-black text-white tracking-tight">Connects</h3>
                                <p className="text-[10px] font-black text-indigo-400/50 uppercase tracking-[0.2em]">{user.following?.length || 0} Professional</p>
                            </div>
                            <Users size={20} className="text-indigo-400/50" />
                        </div>

                        {user.following && user.following.length > 0 ? (
                            <div className="grid grid-cols-3 gap-4">
                                {user.following.slice(0, 9).map((connect) => (
                                    <Link to={`/profile/${connect._id}`} key={connect._id} className="group flex flex-col items-center">
                                        <motion.div
                                            whileHover={{ scale: 1.1, y: -5 }}
                                            className="w-full aspect-square rounded-2xl bg-gray-800 overflow-hidden border border-white/10 transition-all group-hover:border-indigo-500/50 group-hover:shadow-lg group-hover:shadow-indigo-500/10"
                                        >
                                            {connect.profilePicture ? (
                                                <img src={connect.profilePicture} alt={connect.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xl font-black text-indigo-300">
                                                    {connect.name ? connect.name.charAt(0).toUpperCase() : '?'}
                                                </div>
                                            )}
                                        </motion.div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300/60 mt-2 truncate w-full text-center group-hover:text-white transition-colors">{(connect.name || 'User').split(' ')[0]}</span>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 rounded-3xl bg-white/5 border border-dashed border-white/10">
                                <Users size={32} className="mx-auto text-indigo-500/20 mb-3" />
                                <p className="text-indigo-300/40 font-bold text-xs uppercase tracking-widest">No connections yet</p>
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* RIGHT SIDEBAR: Feed */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Create Post Widget */}
                    {isOwner && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass rounded-[40px] p-6 border border-white/10 shadow-2xl flex items-center gap-6 group cursor-pointer"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0 overflow-hidden flex items-center justify-center p-0.5 shadow-lg">
                                {user.profilePicture ? (
                                    <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover rounded-xl" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white font-black text-xl bg-indigo-500/20 rounded-xl">
                                        {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                                    </div>
                                )}
                            </div>
                            <Link to="/create-post" className="flex-1 text-indigo-200/40 text-lg font-bold hover:text-white transition-colors">
                                What's on your mind, {(user.name || 'Friend').split(' ')[0]}?
                            </Link>
                            <motion.div whileHover={{ scale: 1.1 }} className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                <Edit3 size={24} />
                            </motion.div>
                        </motion.div>
                    )}

                    {/* Posts Control Bar */}
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center space-x-6">
                            <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                                <Grid size={24} className="text-indigo-500" /> Posts
                            </h3>
                            <div className="hidden sm:flex items-center space-x-1 p-1 bg-white/5 rounded-2xl border border-white/5">
                                {['recent', 'popular'].map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => handleFilterChange(type)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === type ? 'bg-indigo-600 text-white shadow-lg' : 'text-indigo-400 hover:text-white'}`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {isOwner && (
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => { setIsManageMode(!isManageMode); setSelectedPosts([]); }}
                                className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isManageMode ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 'bg-white/5 text-indigo-300 border border-white/10 hover:border-indigo-500/50'}`}
                            >
                                {isManageMode ? 'Exit Manage' : 'Manage Feed'}
                            </motion.button>
                        )}
                    </div>

                    <AnimatePresence>
                        {isManageMode && selectedPosts.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="glass rounded-3xl p-5 border border-red-500/20 bg-red-500/5 flex justify-between items-center shadow-xl"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-red-200 font-black text-xs uppercase tracking-widest">{selectedPosts.length} selected items</span>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleBulkDelete}
                                    className="bg-red-600 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-600/20"
                                >
                                    Delete selected
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Feed */}
                    <div className="space-y-6">
                        {posts.length > 0 ? (
                            posts.map((post, index) => (
                                <motion.article
                                    key={post._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.05 }}
                                    className={`glass rounded-[40px] p-8 border border-white/10 shadow-2xl relative group/post transition-all ${selectedPosts.includes(post._id) ? 'ring-2 ring-indigo-500 bg-white/10 ring-offset-4 ring-offset-[#0a0b14]' : 'hover:border-indigo-500/30'}`}
                                    onClick={() => isManageMode && toggleSelectPost(post._id)}
                                >
                                    {isManageMode && (
                                        <div className="absolute top-8 left-8 z-10">
                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedPosts.includes(post._id) ? 'bg-indigo-600 border-indigo-600 scale-110 shadow-lg shadow-indigo-600/20' : 'border-white/30 bg-black/20'}`}>
                                                {selectedPosts.includes(post._id) && <Check size={14} className="text-white" />}
                                            </div>
                                        </div>
                                    )}

                                    <div className={`flex items-center justify-between mb-8 ${isManageMode ? 'ml-10' : ''}`}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 shadow-lg">
                                                <div className="w-full h-full bg-[#0a0b14] rounded-[14px] overflow-hidden">
                                                    {post.user?.profilePicture ? (
                                                        <img src={post.user.profilePicture} alt={post.user.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-indigo-400 font-black">
                                                            {post.user?.name[0]}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="font-black text-white tracking-tight">{post.user?.name || 'Anonymous'}</h4>
                                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                            </div>
                                        </div>

                                        {isOwner && (
                                            <div className="relative group/menu">
                                                <button onClick={(e) => { e.stopPropagation(); setMenuOpen(menuOpen === post._id ? null : post._id); }} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-indigo-300">
                                                    <MoreHorizontal size={20} />
                                                </button>
                                                <AnimatePresence>
                                                    {menuOpen === post._id && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                            className="absolute right-0 mt-3 w-48 glass rounded-2xl border border-white/10 shadow-2xl z-50 p-2 overflow-hidden"
                                                        >
                                                            <button onClick={(e) => { e.stopPropagation(); startEdit(post); }} className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm font-bold text-indigo-200 hover:bg-white/10 rounded-xl transition-all">
                                                                <Edit3 size={16} /> Edit Piece
                                                            </button>
                                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(post._id); }} className="flex items-center gap-3 w-full text-left px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-400/10 rounded-xl transition-all">
                                                                <Trash2 size={16} /> Delete Forever
                                                            </button>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        )}
                                    </div>

                                    {editingPost === post._id ? (
                                        <div className="mb-8" onClick={(e) => e.stopPropagation()}>
                                            <textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                className="w-full bg-white/5 text-white p-6 rounded-3xl border border-white/10 focus:outline-none focus:bg-white/10 focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold text-lg min-h-[120px]"
                                            />
                                            <div className="flex justify-end gap-3 mt-4">
                                                <button onClick={() => setEditingPost(null)} className="px-5 py-2 text-xs font-black uppercase tracking-widest text-indigo-400 hover:text-white transition-colors">Cancel</button>
                                                <button onClick={() => handleUpdate(post._id)} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20">Apply Changes</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-indigo-100/80 font-medium text-lg leading-relaxed mb-8 whitespace-pre-wrap">{post.content}</p>
                                    )}

                                    {currentUser && (
                                        <div className="border-t border-white/5 pt-6 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="relative group/react">
                                                    <motion.button
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={(e) => { e.stopPropagation(); handleReaction(post._id, getUserReaction(post) ? getUserReaction(post).type : 'like'); }}
                                                        className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${getUserReaction(post) ? 'bg-pink-500/20 text-pink-400' : 'bg-white/5 text-indigo-300 hover:bg-white/10'}`}
                                                    >
                                                        <Heart size={18} className={getUserReaction(post) ? 'fill-current' : ''} />
                                                        {post.reactions?.length || 0}
                                                    </motion.button>

                                                    {/* Tooltip Reaction Menu (if needed) */}
                                                </div>

                                                <Link to={`/post/${post._id}`} onClick={(e) => e.stopPropagation()}>
                                                    <motion.div
                                                        whileHover={{ scale: 1.05 }}
                                                        className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 text-indigo-300 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                                                    >
                                                        <MessageCircle size={18} />
                                                        {post.commentsCount || 0}
                                                    </motion.div>
                                                </Link>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    className="p-2.5 bg-white/5 hover:bg-white/10 text-indigo-300 rounded-2xl transition-all"
                                                >
                                                    <Share2 size={18} />
                                                </motion.button>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={(e) => { e.stopPropagation(); handleSave(post._id); }}
                                                    className={`p-2.5 rounded-2xl transition-all ${currentUser?.savedPosts?.includes(post._id) ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-indigo-300 hover:bg-white/10'}`}
                                                >
                                                    <Bookmark size={18} className={currentUser?.savedPosts?.includes(post._id) ? 'fill-current' : ''} />
                                                </motion.button>
                                            </div>
                                        </div>
                                    )}
                                </motion.article>
                            ))
                        ) : (
                            <div className="text-center py-20 rounded-[40px] border border-dashed border-white/10 bg-white/5">
                                <Grid size={48} className="mx-auto text-indigo-500/20 mb-4" />
                                <p className="text-indigo-400/50 font-black text-xs uppercase tracking-widest">No signals detected from this sector</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
