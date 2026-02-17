import React, { useState, useEffect } from 'react';
import api from '../api';

const Reports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            const res = await api.get('/reports');
            setReports(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch reports', err);
            setError('Failed to load reports');
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await api.put(`/reports/${id}`, { status });
            setReports(reports.map(report =>
                report._id === id ? { ...report, status } : report
            ));
        } catch (err) {
            console.error('Failed to update status', err);
            alert('Failed to update report status');
        }
    };

    if (loading) return <div className="p-4">Loading reports...</div>;
    if (error) return <div className="p-4 text-red-500">{error}</div>;

    return (
        <div className="bg-white p-6 rounded shadow">
            <h2 className="text-2xl font-bold mb-4">Reports Management</h2>

            {reports.length === 0 ? (
                <p>No reports found.</p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead>
                            <tr className="bg-gray-100 border-b">
                                <th className="py-2 px-4 text-left">Date</th>
                                <th className="py-2 px-4 text-left">Reporter</th>
                                <th className="py-2 px-4 text-left">Type</th>
                                <th className="py-2 px-4 text-left">Reason</th>
                                <th className="py-2 px-4 text-left">Status</th>
                                <th className="py-2 px-4 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map((report) => (
                                <tr key={report._id} className="border-b hover:bg-gray-50">
                                    <td className="py-2 px-4">{new Date(report.createdAt).toLocaleDateString()}</td>
                                    <td className="py-2 px-4">{report.reporter?.name || 'Unknown'}</td>
                                    <td className="py-2 px-4">
                                        <span className={`px-2 py-1 rounded text-xs ${report.itemType === 'Post' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                            {report.itemType}
                                        </span>
                                    </td>
                                    <td className="py-2 px-4 max-w-xs truncate" title={report.reason}>
                                        {report.reason}
                                    </td>
                                    <td className="py-2 px-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                                    'bg-gray-100 text-gray-800'
                                            }`}>
                                            {report.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="py-2 px-4 space-x-2">
                                        {report.status === 'pending' && (
                                            <>
                                                <button
                                                    onClick={() => handleStatusUpdate(report._id, 'resolved')}
                                                    className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                                                >
                                                    Resolve
                                                </button>
                                                <button
                                                    onClick={() => handleStatusUpdate(report._id, 'dismissed')}
                                                    className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                                                >
                                                    Dismiss
                                                </button>
                                            </>
                                        )}
                                        <a
                                            href={`/post/${report.reportedItem?._id || report.reportedItem}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-500 hover:underline text-sm ml-2"
                                        >
                                            View Item
                                        </a>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Reports;
