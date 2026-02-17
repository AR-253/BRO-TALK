import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const CreatePost = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [topicId, setTopicId] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [topics, setTopics] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchTopics = async () => {
            try {
                const res = await api.get('/topics');
                setTopics(res.data);
                if (res.data.length > 0) {
                    setTopicId(res.data[0]._id);
                }
            } catch (err) {
                console.error("Failed to fetch topics", err);
                setError("Could not load topics.");
            }
        };
        fetchTopics();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!content || !topicId) {
            setError("Please fill in all required fields.");
            setLoading(false);
            return;
        }

        try {
            await api.post('/posts', {
                title,
                content,
                topicId,
                isAnonymous
            });
            navigate('/');
        } catch (err) {
            console.error("Failed to create post", err);
            setError(err.response?.data?.message || "Failed to create post.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto mt-10 p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/10 shadow-2xl text-white">
            <h2 className="text-3xl font-extrabold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
                Create a Discussion
            </h2>

            {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-xl mb-6">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Topic Selection */}
                <div>
                    <label className="block text-sm font-medium text-pink-300 mb-2">Select Topic</label>
                    <div className="relative">
                        <select
                            value={topicId}
                            onChange={(e) => setTopicId(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-pink-500"
                        >
                            {topics.map((topic) => (
                                <option key={topic._id} value={topic._id} className="bg-gray-900">
                                    {topic.title}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-pink-400">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>
                </div>

                {/* Title (Optional) */}
                <div>
                    <label className="block text-sm font-medium text-indigo-300 mb-2">Title (Optional)</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Give your post a catchy headline..."
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                </div>

                {/* Content */}
                <div>
                    <label className="block text-sm font-medium text-indigo-300 mb-2">Your Thoughts</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="What's on your mind? Share your story, ask for advice, or just vent."
                        rows="6"
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                    ></textarea>
                </div>

                {/* Anonymous Toggle */}
                <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5">
                    <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isAnonymous ? 'bg-gray-700' : 'bg-gradient-to-br from-indigo-500 to-purple-600'}`}>
                            {isAnonymous ? '👻' : '👤'}
                        </div>
                        <div>
                            <p className="font-bold text-white">{isAnonymous ? 'Posting Anonymously' : 'Posting as You'}</p>
                            <p className="text-xs text-gray-400">Hide your identity for sensitive topics.</p>
                        </div>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={isAnonymous}
                            onChange={(e) => setIsAnonymous(e.target.checked)}
                        />
                        <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-pink-600"></div>
                    </label>
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-purple-500/20 transform hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Publishing...' : '🚀 Publish Post'}
                </button>

            </form>
        </div>
    );
};

export default CreatePost;
