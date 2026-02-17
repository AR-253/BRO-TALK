import React, { useState, useEffect } from 'react';
import api from '../api';
import { Link } from 'react-router-dom';

const TopicList = () => {
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTopics = async () => {
            try {
                const response = await api.get('/topics');
                setTopics(response.data);
                setError(null);
            } catch (err) {
                console.error("Error fetching topics:", err);
                setError('Failed to load topics.');
            } finally {
                setLoading(false);
            }
        };

        fetchTopics();
    }, []);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-900">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-indigo-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-32 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-indigo-300 mb-4">
                        Discover Topics
                    </h1>
                    <p className="text-lg text-indigo-200 max-w-2xl mx-auto">
                        Explore discussions, join communities, and find what interests you most.
                    </p>
                </div>

                {error && (
                    <div className="text-center py-10 text-red-300 bg-red-900/20 rounded-lg max-w-md mx-auto mb-8">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {topics.map((topic) => (
                        <Link to={`/topic/${topic._id}`} key={topic._id} className="group">
                            <div className="h-full bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-8 hover:bg-white/15 transition-all duration-300 transform group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:shadow-purple-500/20">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                                        {topic.title.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="bg-white/10 text-indigo-100 text-xs px-3 py-1 rounded-full border border-white/10 whitespace-nowrap">
                                        {topic.subscribers ? topic.subscribers.length : 0} Members
                                    </span>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-pink-300 transition-colors">
                                    {topic.title}
                                </h3>
                                <p className="text-indigo-200 line-clamp-3 mb-6 leading-relaxed">
                                    {topic.description}
                                </p>
                                <div className="flex items-center text-sm font-medium text-pink-300 group-hover:text-pink-200 transition-colors">
                                    Explore Topic
                                    <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {topics.length === 0 && !loading && (
                    <div className="text-center text-indigo-300 py-20 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                        <p className="text-xl">No topics found.</p>
                        <p className="mt-2 text-sm text-indigo-400">Check back later or ask an admin to create one!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TopicList;
