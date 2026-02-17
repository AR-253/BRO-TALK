import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const isActive = (path) => {
        return location.pathname === path ? "bg-gray-700" : "";
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="w-64 bg-gray-900 text-white flex flex-col">
                <div className="p-4 text-2xl font-bold bg-gray-800 text-center">
                    Admin Panel
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <Link to="/admin/dashboard" className={`block px-4 py-2 rounded hover:bg-gray-700 ${isActive('/admin/dashboard')}`}>
                        Dashboard
                    </Link>
                    <Link to="/admin/users" className={`block px-4 py-2 rounded hover:bg-gray-700 ${isActive('/admin/users')}`}>
                        Users
                    </Link>
                    <Link to="/admin/posts" className={`block px-4 py-2 rounded hover:bg-gray-700 ${isActive('/admin/posts')}`}>
                        Posts
                    </Link>
                    <Link to="/admin/topics" className={`block px-4 py-2 rounded hover:bg-gray-700 ${isActive('/admin/topics')}`}>
                        Topics
                    </Link>
                    <Link to="/admin/reports" className={`block px-4 py-2 rounded hover:bg-gray-700 ${isActive('/admin/reports')}`}>
                        Reports
                    </Link>
                </nav>
                <div className="p-4 border-t border-gray-800">
                    <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 rounded hover:bg-red-700 text-red-400 hover:text-white transition-colors"
                    >
                        Logout
                    </button>
                    <Link to="/" className="block mt-2 text-center text-sm text-gray-500 hover:text-gray-300">
                        Back to Main Site
                    </Link>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow p-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {location.pathname.split('/').pop().charAt(0).toUpperCase() + location.pathname.split('/').pop().slice(1)}
                    </h2>
                    <div className="text-gray-600">Admin User</div>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
