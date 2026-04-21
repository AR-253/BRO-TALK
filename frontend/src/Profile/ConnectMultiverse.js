import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Search, UserPlus, Check, Loader, X } from 'lucide-react';
import { getImageUrl } from '../utils/imageUtils';

const ConnectMultiverse = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sentRequests, setSentRequests] = useState({});
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [usersRes, meRes] = await Promise.all([
                    api.get('/users/suggestions?limit=100'),
                    api.get('/users/me'),
                ]);
                setUsers(usersRes.data);
                setCurrentUser(meRes.data);
            } catch (err) {
                console.error('Failed to fetch users', err);
                try {
                    const usersRes = await api.get('/users/suggestions?limit=100');
                    setUsers(usersRes.data);
                } catch (e) {
                    console.error(e);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleConnect = async (userId) => {
        try {
            await api.put(`/users/${userId}/friend-request`);
            setSentRequests(prev => ({ ...prev, [userId]: true }));
        } catch (err) {
            console.error('Failed to send request', err);
            alert(err.response?.data?.message || 'Failed to send request');
        }
    };

    const handleUnsend = async (userId) => {
        try {
            await api.put(`/users/${userId}/unfollow`); // unfollow cancels pending request too
            setSentRequests(prev => ({ ...prev, [userId]: false }));
        } catch (err) {
            console.error('Failed to unsend request', err);
            alert(err.response?.data?.message || 'Failed to unsend');
        }
    };

    const filtered = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader className="animate-spin text-white w-10 h-10" />
        </div>
    );

    return (
        <div style={{
            height: 'calc(100vh - 80px)',
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
                {/* Title */}
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
                        Connect Multiverse
                    </h1>
                    <p style={{ fontSize: '13px', color: '#c4b5fd', marginTop: '4px' }}>
                        Explore and connect with awesome people from all sectors.
                    </p>
                </div>

                {/* Search */}
                <div style={{ position: 'relative', width: '280px' }}>
                    <Search style={{
                        position: 'absolute', left: '12px', top: '50%',
                        transform: 'translateY(-50%)', width: '14px', height: '14px',
                        color: 'rgba(196,181,253,0.6)',
                    }} />
                    <input
                        type="text"
                        placeholder="Search by name or @username..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
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

            {/* Table Container */}
            <div style={{
                flex: 1,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
            }}>
                {/* Table Header */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 3fr 1.5fr',
                    padding: '12px 24px',
                    background: 'rgba(255,255,255,0.04)',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                        Identify
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                        Transmission / Bio
                    </span>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: 'right' }}>
                        Protocol / Action
                    </span>
                </div>

                {/* Users List */}
                <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'rgba(99,102,241,0.3) transparent' }}>
                    {filtered.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#a5b4fc', fontSize: '14px' }}>
                            No users found matching your search.
                        </div>
                    ) : (
                        filtered.map((user, i) => (
                            <div
                                key={user._id}
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '2fr 3fr 1.5fr',
                                    padding: '14px 24px',
                                    alignItems: 'center',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    transition: 'background 0.2s',
                                    cursor: 'default',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                            >
                                {/* Identity */}
                                <Link to={`/profile/${user._id}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
                                    <div style={{
                                        width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                                        background: 'linear-gradient(135deg, #6366f1, #a855f7)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: '800', fontSize: '16px', color: 'white', overflow: 'hidden',
                                    }}>
                                        {user.profilePicture
                                            ? <img src={getImageUrl(user.profilePicture)} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            : user.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: '700', fontSize: '14px', color: 'white' }}>{user.name}</div>
                                        <div style={{ fontSize: '10px', color: '#a5b4fc', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                            @{user.username || 'user'}
                                        </div>
                                    </div>
                                </Link>

                                {/* Bio */}
                                <div style={{
                                    fontSize: '12px', color: '#d1d5db', lineHeight: '1.5',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '16px',
                                }}>
                                    {user.bio || 'Just another legendary BRO in the multiverse.'}
                                </div>

                                {/* Action */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    {sentRequests[user._id] ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {/* Sent badge */}
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: '5px',
                                                padding: '7px 12px', borderRadius: '8px',
                                                background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
                                                color: '#4ade80', fontSize: '11px', fontWeight: '700',
                                            }}>
                                                <Check size={12} /> Sent
                                            </div>
                                            {/* Unsend button */}
                                            <button
                                                onClick={() => handleUnsend(user._id)}
                                                title="Unsend request"
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '5px',
                                                    padding: '7px 12px', borderRadius: '8px',
                                                    background: 'rgba(239,68,68,0.12)',
                                                    border: '1px solid rgba(239,68,68,0.25)',
                                                    color: '#f87171', fontSize: '11px', fontWeight: '700',
                                                    cursor: 'pointer', letterSpacing: '0.05em', textTransform: 'uppercase',
                                                    transition: 'all 0.2s',
                                                }}
                                                onMouseEnter={e => {
                                                    e.currentTarget.style.background = 'rgba(239,68,68,0.25)';
                                                    e.currentTarget.style.color = 'white';
                                                }}
                                                onMouseLeave={e => {
                                                    e.currentTarget.style.background = 'rgba(239,68,68,0.12)';
                                                    e.currentTarget.style.color = '#f87171';
                                                }}
                                            >
                                                <X size={12} /> Unsend
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleConnect(user._id)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '6px',
                                                padding: '7px 16px', borderRadius: '8px',
                                                background: 'rgba(99,102,241,0.15)',
                                                border: '1px solid rgba(99,102,241,0.3)',
                                                color: '#a5b4fc', fontSize: '11px', fontWeight: '700',
                                                cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase',
                                                transition: 'all 0.2s',
                                            }}
                                            onMouseEnter={e => {
                                                e.currentTarget.style.background = 'rgba(99,102,241,0.3)';
                                                e.currentTarget.style.color = 'white';
                                            }}
                                            onMouseLeave={e => {
                                                e.currentTarget.style.background = 'rgba(99,102,241,0.15)';
                                                e.currentTarget.style.color = '#a5b4fc';
                                            }}
                                        >
                                            <UserPlus size={13} /> Connect
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConnectMultiverse;
