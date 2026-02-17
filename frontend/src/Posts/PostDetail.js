import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, ThumbsUp, MessageCircle, Share2, MoreHorizontal,
    Bookmark, UserPlus, Flag, Send, ChevronRight, Link as LinkIcon,
    Trash2, Edit, X, Check
} from 'lucide-react';
import { getImageUrl } from '../utils/imageUtils';

const PostDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [comments, setComments] = useState([]);
    const [replyingTo, setReplyingTo] = useState(null);
    const [mentionSuggestions, setMentionSuggestions] = useState([]);
    const [showReactions, setShowReactions] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [mentionQuery, setMentionQuery] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState("");
    const [editTitle, setEditTitle] = useState("");

    // Reaction Constants
    const REACTION_TYPES = [
        { type: 'like', icon: '👍', label: 'Like', color: 'text-green-400' },
        { type: 'love', icon: '❤️', label: 'Love', color: 'text-pink-500' },
        { type: 'haha', icon: '😂', label: 'Haha', color: 'text-yellow-400' },
        { type: 'wow', icon: '😮', label: 'Wow', color: 'text-cyan-400' },
        { type: 'sad', icon: '😢', label: 'Sad', color: 'text-blue-300' },
        { type: 'angry', icon: '😡', label: 'Angry', color: 'text-red-500' }
    ];

    const fetchComments = async () => {
        try {
            const res = await api.get(`/comments/post/${id}`);
            setComments(res.data);
        } catch (err) {
            console.error("Failed to load comments", err);
        }
    };

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const res = await api.get(`/posts/${id}`);
                setPost(res.data);
                setPost(res.data);
                setEditContent(res.data.content);
                setEditTitle(res.data.title);

                if (localStorage.getItem('token')) {
                    const meRes = await api.get('/users/me');
                    setCurrentUser(meRes.data);
                }
            } catch (err) {
                console.error("Failed to fetch post", err);
                setError("Failed to load post.");
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
        fetchComments();
    }, [id]);

    const handleReaction = async (type) => {
        if (!currentUser) return alert("Please log in to react.");
        try {
            const res = await api.put(`/posts/${post._id}/react`, { type });
            setPost({ ...post, reactions: res.data });
            setShowReactions(false);
        } catch (err) {
            console.error("Reaction failed", err);
        }
    };

    const getUserReaction = () => {
        if (!currentUser || !post.reactions) return null;
        return post.reactions.find(r => r.user === currentUser._id || r.user?._id === currentUser._id);
    };

    const handleSave = async () => {
        if (!currentUser) return alert("Please log in to save posts.");
        try {
            const res = await api.put(`/users/save/${post._id}`);
            // Update local user state
            let newSavedPosts;
            if (res.data.isSaved) {
                newSavedPosts = [...(currentUser.savedPosts || []), post._id];
            } else {
                newSavedPosts = (currentUser.savedPosts || []).filter(pid => pid !== post._id);
            }
            setCurrentUser({ ...currentUser, savedPosts: newSavedPosts });
        } catch (err) {
            console.error("Save failed", err);
        }
    };

    const handleDeletePost = async () => {
        if (!window.confirm("Are you sure you want to delete this discussion?")) return;
        try {
            await api.delete(`/posts/${post._id}`);
            navigate('/');
        } catch (err) {
            console.error("Delete failed", err);
            alert("Failed to delete post.");
        }
    };

    const handleUpdatePost = async () => {
        try {
            const res = await api.put(`/posts/${post._id}`, { title: editTitle, content: editContent });
            setPost(res.data);
            setIsEditing(false);
        } catch (err) {
            console.error("Update failed", err);
            alert("Failed to update post.");
        }
    };

    const handleAddComment = async (content, parentId = null) => {
        if (!currentUser) return alert("Please log in.");
        try {
            await api.post('/comments', { content, postId: id, parentCommentId: parentId });
            fetchComments();
            setReplyingTo(null);
            const res = await api.get(`/posts/${id}`);
            setPost(res.data);
        } catch (err) {
            alert("Failed to post comment.");
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!window.confirm("Delete this comment?")) return;
        try {
            await api.delete(`/comments/${commentId}`);
            fetchComments();
            const res = await api.get(`/posts/${id}`);
            setPost(res.data);
        } catch (err) {
            alert("Failed to delete comment");
        }
    };

    const handleCommentReaction = async (commentId, type) => {
        if (!currentUser) return alert("Please log in to react.");
        try {
            await api.put(`/comments/${commentId}/react`, { type });
            fetchComments(); // Re-fetch to update reaction counts
        } catch (err) {
            console.error("Comment reaction failed", err);
        }
    };

    const handleCommentChange = async (e) => {
        const value = e.target.value;
        setCommentText(value);

        const cursor = e.target.selectionStart;
        const textUpToCursor = value.slice(0, cursor);
        const match = textUpToCursor.match(/@(\w*)$/);

        if (match) {
            setMentionQuery(match[1]);
            try {
                const res = await api.get(`/users/search-users?q=${match[1]}`);
                setMentionSuggestions(res.data);
            } catch (err) {
                console.error("Failed to search users", err);
            }
        } else {
            setMentionSuggestions([]);
            setMentionQuery(null);
        }
    };

    const handleSelectMention = (username) => {
        const cursor = document.querySelector('textarea[name="comment"]').selectionStart;
        const textUpToCursor = commentText.slice(0, cursor);
        const textAfterCursor = commentText.slice(cursor);

        const newTextBefore = textUpToCursor.replace(/@(\w*)$/, `@${username} `);
        setCommentText(newTextBefore + textAfterCursor);
        setMentionSuggestions([]);
        setMentionQuery(null);
        document.querySelector('textarea[name="comment"]').focus();
    };

    const LinkifyMentions = ({ text }) => {
        if (!text) return null;
        const parts = text.split(/(@\w+)/g);
        return (
            <>
                {parts.map((part, i) => {
                    if (part.startsWith('@')) {
                        const username = part.substring(1);
                        return <Link key={i} to={`/u/${username}`} className="text-support-growth font-bold hover:underline transition-colors">{part}</Link>;
                    }
                    return part;
                })}
            </>
        );
    };

    const CommentItem = ({ comment }) => {
        const [isReplying, setIsReplying] = useState(false);
        const [replyContent, setReplyContent] = useState("");
        const [showReactions, setShowReactions] = useState(false);
        const isAuthor = currentUser && (currentUser._id === comment.user?._id);

        const getUserReaction = () => {
            if (!currentUser || !comment.reactions) return null;
            return comment.reactions.find(r => r.user === currentUser._id || r.user?._id === currentUser._id);
        };

        return (
            <div className={`group/comment ${comment.parentComment ? 'ml-8 mt-4 border-l-2 border-white/10 pl-6' : 'mt-8'}`}>
                <div className="flex gap-4">
                    <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden border border-white/10 shadow-sm">
                            {comment.user?.profilePicture ? (
                                <img src={getImageUrl(comment.user.profilePicture)} alt={comment.user.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-white font-black text-sm">{comment.user?.name?.[0].toUpperCase()}</span>
                            )}
                        </div>
                    </div>
                    <div className="flex-1">
                        <div className="bg-white/5 rounded-2xl p-5 border border-white/10 group-hover/comment:border-white/20 transition-colors shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <Link to={`/profile/${comment.user?._id}`} className="font-bold text-white hover:text-pink-400 transition-colors text-sm tracking-tight">
                                    {comment.user?.name || 'Anonymous'}
                                </Link>
                                <span className="text-[10px] text-indigo-300 font-black uppercase tracking-widest">
                                    {new Date(comment.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                <LinkifyMentions text={comment.content} />
                            </p>
                        </div>
                        <div className="flex items-center gap-4 mt-3 ml-2">
                            <button
                                onClick={() => handleCommentReaction(comment._id, 'like')}
                                className={`flex items-center space-x-1 text-[10px] font-black uppercase tracking-widest transition-colors ${comment.reactions?.some(r => r.user === currentUser?._id) ? 'text-pink-500' : 'text-indigo-400 hover:text-white'}`}
                            >
                                <ThumbsUp size={12} fill={comment.reactions?.some(r => r.user === currentUser?._id) ? "currentColor" : "none"} />
                                <span>{comment.reactions?.length || 0}</span>
                            </button>
                            <button onClick={() => setIsReplying(!isReplying)} className="text-[10px] text-indigo-400 font-black uppercase tracking-widest hover:text-white transition-colors">Reply</button>
                            {isAuthor && (
                                <button onClick={() => handleDeleteComment(comment._id)} className="text-[10px] text-red-400/50 font-black uppercase tracking-widest hover:text-red-400 transition-colors">Delete</button>
                            )}
                        </div>
                        {isReplying && (
                            <form onSubmit={(e) => { e.preventDefault(); handleAddComment(replyContent, comment._id); setIsReplying(false); setReplyContent(""); }} className="mt-4">
                                <textarea
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    className="w-full bg-black/40 text-white p-4 rounded-xl border border-white/10 focus:outline-none focus:border-indigo-500 transition-all text-sm font-medium"
                                    placeholder={`Replying to ${comment.user?.name}...`}
                                    rows="2"
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                    <button type="button" onClick={() => setIsReplying(false)} className="px-4 py-1.5 text-[10px] text-indigo-300 font-black uppercase tracking-widest hover:text-white transition-colors">Cancel</button>
                                    <button type="submit" className="px-5 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg">Submit Reply</button>
                                </div>
                            </form>
                        )}
                        {comment.children && comment.children.map(child => <CommentItem key={child._id} comment={child} />)}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-support-growth/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-support-growth rounded-full border-t-transparent animate-spin"></div>
            </div>
        </div>
    );
    if (error || !post) return <div className="text-center py-20 text-white">Post not found.</div>;

    return (
        <div className="max-w-4xl mx-auto px-6 py-12 relative z-10">
            <Link to="/" className="inline-flex items-center space-x-2 text-indigo-300 hover:text-white mb-10 transition-colors group">
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Back to Discussions</span>
            </Link>

            <article className="glass rounded-[32px] border border-white/10 shadow-2xl p-8 md:p-12 mb-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/20 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2" />

                <header className="mb-10 relative z-10">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center space-x-4">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-0.5 shadow-lg overflow-hidden">
                                {post.user?.profilePicture ? (
                                    <img src={getImageUrl(post.user.profilePicture)} alt={post.user.name} className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                    <span className="text-white font-black text-xl">{post.user?.name?.[0].toUpperCase()}</span>
                                )}
                            </div>
                            <div>
                                <h2 className="text-white font-black text-lg tracking-tight leading-none mb-1">{post.user?.name || 'Anonymous'}</h2>
                                <p className="text-[10px] text-indigo-300 font-black uppercase tracking-widest">{new Date(post.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                        </div>
                        {currentUser && post.user && currentUser._id === post.user._id && (
                            <div className="relative">
                                <button
                                    onClick={() => setMenuOpen(!menuOpen)}
                                    className="p-3 text-indigo-300 hover:text-white transition-colors bg-white/5 rounded-xl border border-white/10 hover:border-white/20"
                                >
                                    <MoreHorizontal size={20} />
                                </button>
                                {menuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-[#1a1c2e] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-20">
                                        <button
                                            onClick={() => { setIsEditing(true); setMenuOpen(false); }}
                                            className="w-full text-left px-4 py-3 text-sm text-indigo-100 hover:bg-white/10 transition-colors flex items-center gap-2"
                                        >
                                            <Edit size={16} /> Edit Discussion
                                        </button>
                                        <button
                                            onClick={() => { handleDeletePost(); setMenuOpen(false); }}
                                            className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                                        >
                                            <Trash2 size={16} /> Delete Permanently
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-white leading-[1.15] tracking-tighter mb-6">{post.title}</h1>
                    {post.topic && (
                        <span className="px-4 py-1.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-widest rounded-full border border-indigo-500/30 shadow-sm inline-block">
                            #{typeof post.topic === 'object' ? post.topic.title || post.topic.name : post.topic}
                        </span>
                    )}
                </header>

                <div className="readable-text mb-12 relative z-10 whitespace-pre-wrap font-medium">
                    {isEditing ? (
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full bg-black/40 text-white p-5 rounded-2xl border border-white/10 focus:outline-none focus:border-indigo-500 transition-all text-2xl font-black"
                                placeholder="Edit Title"
                            />
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full bg-black/40 text-white p-5 rounded-2xl border border-white/10 focus:outline-none focus:border-indigo-500 transition-all min-h-[200px] text-lg font-medium leading-relaxed"
                            />
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-6 py-2 rounded-xl text-indigo-300 hover:text-white font-bold transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdatePost}
                                    className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold shadow-lg"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    ) : (
                        post.content
                    )}
                </div>

                {currentUser && (
                    <footer className="pt-8 border-t border-white/10 flex flex-wrap items-center justify-between gap-6 relative z-10">
                        <div className="flex items-center space-x-3">
                            <div className="relative">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onMouseEnter={() => setShowReactions(true)}
                                    onClick={() => handleReaction('like')}
                                    className={`flex items-center space-x-3 px-6 py-3 rounded-2xl transition-all font-black text-xs ${getUserReaction()
                                        ? 'bg-pink-500/20 text-pink-500 border border-pink-500/30'
                                        : 'bg-white/5 text-indigo-200 border border-white/10 hover:border-white/20 hover:text-white'
                                        }`}
                                >
                                    {(() => {
                                        const userReaction = getUserReaction();
                                        const reactionType = userReaction ? userReaction.type : 'like';
                                        const reactionIcon = REACTION_TYPES.find(r => r.type === reactionType)?.icon || <ThumbsUp size={16} />;
                                        return <span className="text-xl mr-1">{reactionIcon}</span>;
                                    })()}
                                    <span>{post.reactions?.length || 0} Helpful</span>
                                </motion.button>
                                <AnimatePresence>
                                    {showReactions && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            onMouseLeave={() => setShowReactions(false)}
                                            className="absolute bottom-full left-0 mb-4 glass p-2 rounded-full flex space-x-2 shadow-2xl z-50"
                                        >
                                            {REACTION_TYPES.map((reaction) => (
                                                <motion.button
                                                    key={reaction.type}
                                                    whileHover={{ scale: 1.3, y: -5 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={(e) => { e.stopPropagation(); handleReaction(reaction.type); }}
                                                    className="text-2xl"
                                                    title={reaction.label}
                                                >
                                                    {reaction.icon}
                                                </motion.button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            <button className="flex items-center space-x-3 px-6 py-3 bg-white/5 text-indigo-200 border border-white/10 rounded-2xl font-black text-xs transition-colors hover:text-white hover:border-white/20">
                                <MessageCircle size={16} />
                                <span>{comments.length} Comments</span>
                            </button>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={handleSave}
                                className={`p-3 border border-white/10 rounded-xl transition-all ${currentUser?.savedPosts?.includes(post._id)
                                    ? 'bg-pink-500/20 text-pink-500 border-pink-500/30'
                                    : 'bg-white/5 text-indigo-200 hover:text-white hover:border-white/20'
                                    }`}
                            >
                                <Bookmark size={18} fill={currentUser?.savedPosts?.includes(post._id) ? "currentColor" : "none"} />
                            </button>
                            <button className="p-3 bg-white/5 text-indigo-200 border border-white/10 rounded-xl hover:text-white hover:border-white/20 transition-all">
                                <Share2 size={18} />
                            </button>
                        </div>
                    </footer>
                )}
            </article>

            <section className="mt-16">
                <div className="flex items-center justify-between mb-10">
                    <h3 className="text-white font-black text-xl tracking-tight">Community Discussion</h3>
                    <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] text-indigo-300 font-black uppercase tracking-widest">
                        Professional Conduct Only
                    </div>
                </div>

                {currentUser ? (
                    <form onSubmit={(e) => { e.preventDefault(); handleAddComment(commentText); setCommentText(''); }} className="mb-12 relative">
                        {mentionSuggestions.length > 0 && (
                            <div className="absolute bottom-full mb-2 left-16 bg-gray-900 border border-white/10 rounded-xl shadow-2xl p-2 z-50 min-w-[200px]">
                                {mentionSuggestions.map(user => (
                                    <button
                                        key={user._id}
                                        type="button"
                                        onClick={() => handleSelectMention(user.username)}
                                        className="w-full flex items-center space-x-3 p-2 hover:bg-white/10 rounded-lg text-left transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden">
                                            {user.profilePicture ? (
                                                <img src={getImageUrl(user.profilePicture)} alt={user.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-white font-bold text-xs">{user.name[0]}</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-bold">{user.name}</p>
                                            <p className="text-indigo-300 text-xs">@{user.username}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0 overflow-hidden border border-white/10 p-0.5">
                                {currentUser.profilePicture ? <img src={getImageUrl(currentUser.profilePicture)} alt={currentUser.name} className="w-full h-full object-cover rounded-lg" /> : <div className="w-full h-full flex items-center justify-center text-white font-black">{currentUser.name[0]}</div>}
                            </div>
                            <div className="flex-1 space-y-4">
                                <textarea
                                    name="comment"
                                    value={commentText}
                                    onChange={handleCommentChange}
                                    className="w-full bg-black/40 text-white p-5 rounded-2xl border border-white/10 focus:outline-none focus:border-indigo-500 transition-all min-h-[140px] text-sm font-medium leading-relaxed"
                                    placeholder="Add your contribution to the conversation... (Type @ to mention)"
                                    required
                                />
                                <div className="flex justify-end">
                                    <button type="submit" className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-black text-sm shadow-xl shadow-indigo-500/20 transition-all">Post Contribution</button>
                                </div>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="glass p-10 rounded-[32px] text-center mb-12 border border-white/10">
                        <p className="text-slate-300 font-bold mb-6">Join the conversation to share your insights.</p>
                        <Link to="/login" className="px-8 py-3 bg-white/10 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all inline-block border border-white/10 shadow-lg">Log in to Post</Link>
                    </div>
                )}

                <div className="space-y-4">
                    {comments.map(comment => <CommentItem key={comment._id} comment={comment} />)}
                    {comments.length === 0 && (
                        <div className="text-center py-20 bg-white/5 rounded-[32px] border border-white/10 border-dashed">
                            <p className="text-indigo-300 font-black uppercase tracking-widest text-[10px]">No comments yet</p>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

export default PostDetail;
