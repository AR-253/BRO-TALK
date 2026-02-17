import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

const MentionRedirect = () => {
    const { username } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserId = async () => {
            try {
                const res = await api.get(`/users/username/${username}`);
                navigate(`/profile/${res.data._id}`);
            } catch (err) {
                console.error("Mention redirect failed", err);
                navigate('/search?q=' + username); // Fallback to search if not found
            }
        };
        fetchUserId();
    }, [username, navigate]);

    return (
        <div className="flex items-center justify-center min-h-[50vh] text-white">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                <p className="text-indigo-300">Taking you to @{username}'s profile...</p>
            </div>
        </div>
    );
};

export default MentionRedirect;
