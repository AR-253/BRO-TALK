import React, { useState, useEffect } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';

const Bookmarks = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const fetchBookmarks = async () => {
            try {
                const res = await api.get('/users/saved-posts');
                setPosts(res.data);

                const meRes = await api.get('/users/me');
                setCurrentUser(meRes.data);
            } catch (err) {
                console.error("Failed to fetch bookmarks", err);
                setError("Failed to load bookmarks.");
            } finally {
                setLoading(false);
            }
        };

        fetchBookmarks();
    }, []);

    const handleUnsave = async (postId) => {
        try {
            await api.put(`/users/save/${postId}`);
            setPosts(posts.filter(p => p._id !== postId)); // Remove from list immediately
        } catch (err) {
            alert("Failed to unsave post");
        }
    };

    if (loading) return <div className="text-center py-10 text-white">Loading bookmarks...</div>;
    if (error) return <div className="text-center py-10 text-red-400">{error}</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h2 className="text-3xl font-bold text-white mb-8">My Bookmarks 🔖</h2>

            {posts.length === 0 ? (
                <div className="text-center text-indigo-300 py-10 bg-white/5 rounded-2xl">
                    <p className="text-xl mb-4">No saved posts yet.</p>
                    <Link to="/" className="text-pink-400 hover:text-white underline">Explore posts to bookmark them!</Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {posts.map(post => (
                        <article key={post._id} className="bg-white/10 backdrop-blur-md rounded-2xl shadow-lg border border-white/10 overflow-hidden p-6 relative">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md overflow-hidden">
                                    {post.user?.profilePicture ? (
                                        <img src={post.user.profilePicture} alt={post.user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        post.user?.name ? post.user.name.charAt(0).toUpperCase() : '?'
                                    )}
                                </div>
                                <div>
                                    <p className="text-white font-semibold">
                                        {post.user?.name || 'Anonymous'}
                                    </p>
                                    <p className="text-xs text-indigo-300">
                                        {new Date(post.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleUnsave(post._id)}
                                    className="ml-auto text-pink-400 hover:text-white bg-pink-500/20 px-3 py-1 rounded-full text-xs transition-colors"
                                >
                                    Remove Bookmark
                                </button>
                            </div>

                            <Link to={`/post/${post._id}`}>
                                <h3 className="text-xl font-bold text-white mb-2 hover:text-pink-300 transition-colors">
                                    {post.title}
                                </h3>
                                <p className="text-indigo-100 mb-4 line-clamp-3">
                                    {post.content}
                                </p>
                            </Link>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Bookmarks;
