import React, { useState, useEffect } from 'react';
import api from '../api';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                // Fetch users from /api/users (which requires admin token)
                const response = await api.get('/users');
                setUsers(response.data);
                setError(null);
            } catch (err) {
                console.error("Error fetching users:", err);
                setError('Failed to load users. You might not be an admin.');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleSuspend = async (userId) => {
        if (window.confirm('Are you sure you want to suspend/unsuspend this user?')) {
            try {
                await api.put(`/users/${userId}/suspend`);
                // Refresh user list
                const response = await api.get('/users');
                setUsers(response.data);
            } catch (err) {
                alert('Failed to update user status');
            }
        }
    };

    if (loading) return <div className="p-4">Loading users...</div>;
    if (error) return <div className="p-4 text-red-500">{error}</div>;

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Registered Users</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user._id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">{user.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {user.isSuspended ? (
                                        <span className="text-red-500 text-sm">Suspended</span>
                                    ) : (
                                        <span className="text-green-500 text-sm">Active</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button
                                        onClick={() => handleSuspend(user._id)}
                                        className="text-indigo-600 hover:text-indigo-900"
                                    >
                                        {user.isSuspended ? 'Unsuspend' : 'Suspend'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Users;
