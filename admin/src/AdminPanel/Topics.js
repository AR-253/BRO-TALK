import React, { useState, useEffect } from 'react';
import api from '../api';

const AdminTopics = () => {
    const [topics, setTopics] = useState([]);
    const [formData, setFormData] = useState({ title: '', description: '' });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTopics();
    }, []);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/topics/${editingId}`, formData);
            } else {
                await api.post('/topics', formData);
            }
            setFormData({ title: '', description: '' });
            setEditingId(null);
            fetchTopics();
        } catch (err) {
            console.error("Error saving topic:", err);
            alert('Failed to save topic');
        }
    };

    const handleEdit = (topic) => {
        setFormData({ title: topic.title, description: topic.description });
        setEditingId(topic._id);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this topic?')) {
            try {
                await api.delete(`/topics/${id}`);
                fetchTopics();
            } catch (err) {
                console.error("Error deleting topic:", err);
                alert('Failed to delete topic');
            }
        }
    };

    const handleCancel = () => {
        setFormData({ title: '', description: '' });
        setEditingId(null);
    };

    if (loading) return <div className="p-4">Loading topics...</div>;

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {editingId ? 'Edit Topic' : 'Create New Topic'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Title</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2"
                            rows="3"
                            required
                        />
                    </div>
                    <div className="flex space-x-3">
                        <button
                            type="submit"
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {editingId ? 'Update Topic' : 'Create Topic'}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900">Existing Topics</h3>
                </div>
                {error && <div className="p-4 text-red-500">{error}</div>}
                <ul className="divide-y divide-gray-200">
                    {topics.map((topic) => (
                        <li key={topic._id} className="p-4 hover:bg-gray-50 flex justify-between items-center">
                            <div>
                                <h4 className="text-sm font-medium text-gray-900">{topic.title}</h4>
                                <p className="text-sm text-gray-500">{topic.description}</p>
                            </div>
                            <div className="flex space-x-3">
                                <button
                                    onClick={() => handleEdit(topic)}
                                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(topic._id)}
                                    className="text-red-600 hover:text-red-900 text-sm font-medium"
                                >
                                    Delete
                                </button>
                            </div>
                        </li>
                    ))}
                    {topics.length === 0 && (
                        <li className="p-4 text-gray-500 text-center">No topics found.</li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default AdminTopics;
