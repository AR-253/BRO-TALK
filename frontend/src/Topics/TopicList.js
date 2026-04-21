import React, { useState, useEffect } from 'react';
import api from '../api';
import { Loader, Search, ChevronLeft, ChevronRight, ArrowRight, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const TopicList = () => {
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const topicsPerPage = 6;

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
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader className="animate-spin text-white w-10 h-10" />
        </div>
    );

    const filteredTopics = topics.filter(topic =>
        topic.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        topic.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredTopics.length / topicsPerPage);
    const paginatedTopics = filteredTopics.slice((currentPage - 1) * topicsPerPage, currentPage * topicsPerPage);

    return (
        <div style={{
            height: '100%',
            padding: '14px 24px 8px',
            color: 'white',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
        }}>
            {/* Header Row */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '14px',
                flexWrap: 'wrap',
                gap: '10px',
            }}>
                {/* Title block */}
                <div>
                    <h1 style={{
                        fontSize: '28px',
                        fontWeight: '900',
                        background: 'linear-gradient(to right, #f472b6, #a78bfa, #818cf8)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        margin: 0,
                        lineHeight: 1.2,
                    }}>
                        Discover Topics
                    </h1>
                    <p style={{ fontSize: '13px', color: '#c4b5fd', marginTop: '4px' }}>
                        Join communities and find what interests you most.
                    </p>
                </div>

                {/* Search Bar */}
                <div style={{ position: 'relative', width: '260px' }}>
                    <Search style={{
                        position: 'absolute', left: '12px', top: '50%',
                        transform: 'translateY(-50%)', width: '14px', height: '14px',
                        color: 'rgba(196,181,253,0.6)',
                    }} />
                    <input
                        type="text"
                        placeholder="Search topics..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        style={{
                            width: '100%',
                            paddingLeft: '36px',
                            paddingRight: '14px',
                            paddingTop: '9px',
                            paddingBottom: '9px',
                            background: 'rgba(255,255,255,0.07)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            borderRadius: '12px',
                            color: 'white',
                            fontSize: '13px',
                            outline: 'none',
                            boxSizing: 'border-box',
                        }}
                    />
                </div>
            </div>

            {/* Error */}
            {error && (
                <div style={{ color: '#fca5a5', background: 'rgba(220,38,38,0.1)', borderRadius: '10px', padding: '10px 16px', marginBottom: '12px', fontSize: '13px' }}>
                    {error}
                </div>
            )}

            {/* Topics Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                flex: 1,
            }}>
                {paginatedTopics.map((topic) => (
                    <Link
                        to={`/topic/${topic._id}`}
                        key={topic._id}
                        style={{ textDecoration: 'none' }}
                    >
                        <div style={{
                            background: 'rgba(255,255,255,0.07)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '14px',
                            padding: '14px 16px',
                            height: '100%',
                            boxSizing: 'border-box',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            transition: 'all 0.25s ease',
                            cursor: 'pointer',
                            minHeight: '140px',
                        }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.12)';
                                e.currentTarget.style.boxShadow = '0 8px 32px rgba(139,92,246,0.2)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            {/* Top: Icon + Title + Members */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                                    <div style={{
                                        width: '40px', height: '40px', borderRadius: '10px',
                                        background: 'linear-gradient(135deg, #ec4899, #9333ea)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: '800', fontSize: '18px', color: 'white', flexShrink: 0,
                                    }}>
                                        {topic.title.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '800', fontSize: '15px', color: 'white' }}>
                                            {topic.title}
                                        </div>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '4px',
                                            fontSize: '10px', color: '#a5b4fc', fontWeight: '600',
                                            textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '1px',
                                        }}>
                                            <Users size={10} />
                                            {topic.subscribers?.length || 0} Members
                                        </div>
                                    </div>
                                </div>

                                {/* Description */}
                                <p style={{
                                    color: '#d1d5db',
                                    fontSize: '12px',
                                    lineHeight: '1.55',
                                    margin: '0 0 14px 0',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                }}>
                                    {topic.description}
                                </p>
                            </div>

                            {/* Bottom: Explore Button */}
                            <div style={{
                                width: '100%',
                                padding: '9px',
                                borderRadius: '9px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                color: '#e0e7ff',
                                fontWeight: '700',
                                fontSize: '10px',
                                letterSpacing: '0.1em',
                                textTransform: 'uppercase',
                                textAlign: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                            }}>
                                Explore Topic <ArrowRight size={11} />
                            </div>
                        </div>
                    </Link>
                ))}

                {filteredTopics.length === 0 && (
                    <div style={{
                        gridColumn: '1 / -1', textAlign: 'center', padding: '40px',
                        background: 'rgba(255,255,255,0.04)', borderRadius: '14px',
                        border: '1px dashed rgba(255,255,255,0.1)',
                    }}>
                        <p style={{ color: '#a5b4fc', fontSize: '14px' }}>No topics found matching your search.</p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    gap: '8px', marginTop: '12px', paddingBottom: '4px',
                }}>
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
                            color: '#a5b4fc', cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                            opacity: currentPage === 1 ? 0.3 : 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <ChevronLeft size={15} />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i + 1}
                            onClick={() => setCurrentPage(i + 1)}
                            style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                background: currentPage === i + 1
                                    ? 'linear-gradient(135deg, #ec4899, #a855f7)'
                                    : 'rgba(255,255,255,0.06)',
                                border: currentPage === i + 1
                                    ? '1px solid rgba(236,72,153,0.5)'
                                    : '1px solid rgba(255,255,255,0.08)',
                                color: 'white',
                                fontWeight: '700',
                                fontSize: '13px',
                                cursor: 'pointer',
                                boxShadow: currentPage === i + 1 ? '0 4px 16px rgba(168,85,247,0.4)' : 'none',
                            }}
                        >
                            {i + 1}
                        </button>
                    ))}

                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)',
                            color: '#a5b4fc', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                            opacity: currentPage === totalPages ? 0.3 : 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <ChevronRight size={15} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default TopicList;
