import React, { useState, useEffect } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';

const PostFeed = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                // Using the search endpoint to get all posts (recent)
                const response = await api.get('/posts/search?sort=recent');
                setPosts(response.data);
                setError(null);
            } catch (err) {
                console.error("Error fetching posts:", err);
                setError('Failed to load posts. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    if (loading) {
        return <div className="text-center py-10">Loading posts...</div>;
    }

    if (error) {
        return <div className="text-center py-10 text-red-500">{error}</div>;
    }

    return (
        <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">Latest Discussions</h2>

            {posts.length === 0 ? (
                <div className="bg-white p-6 rounded-lg shadow-md text-center">
                    <p className="text-gray-600 mb-4">No posts yet. Be the first to start a discussion!</p>
                    <Link to="/create-post" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                        Create Post
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {posts.map((post) => (
                        <div key={post._id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center">
                                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                                        <span className="text-gray-500 font-bold">
                                            {post.user?.name ? post.user.name.charAt(0).toUpperCase() : '?'}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-800">
                                            {post.user?.name || 'Unknown User'}
                                        </h3>
                                        <span className="text-xs text-gray-500">
                                            {new Date(post.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                                    Topic {post.topic}
                                    {/* Note: Topic name might not be populated in all endpoints, adjusting if needed */}
                                </span>
                            </div>

                            <p className="text-gray-700 mb-4 whitespace-pre-wrap">{post.content}</p>

                            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                <Link to={`/post/${post._id}`} className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                                    View Discussion
                                </Link>
                                <div className="flex space-x-4 text-gray-500 text-sm">
                                    <button className="flex items-center hover:text-blue-600">
                                        <span>Like</span>
                                    </button>
                                    <button className="flex items-center hover:text-blue-600">
                                        <span>Comment</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PostFeed;
