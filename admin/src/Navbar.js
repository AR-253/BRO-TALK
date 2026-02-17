import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <nav className="bg-gray-800 p-4">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/" className="text-white text-xl font-bold">
                    Bro Talk
                </Link>
                <div className="flex space-x-4">
                    <Link to="/" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                        Feed
                    </Link>
                    <Link to="/topics" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                        Topics
                    </Link>
                    {token && (
                        <Link to="/notifications" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                            Notifications
                        </Link>
                    )}
                    {token ? (
                        <>
                            <Link to="/create-post" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                                New Post
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                            >
                                Logout
                            </button>
                            <Link to="/admin" className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium ml-2">
                                Admin Panel
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                                Login
                            </Link>
                            <Link to="/signup" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                                Sign Up
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
