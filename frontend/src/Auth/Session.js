import api from '../api';
import { useNavigate } from 'react-router-dom';

const Session = () => {
    const navigate = useNavigate();

    const handleLogoutAll = async () => {
        if (window.confirm("Are you sure you want to logout from all devices? This will invalidate all your current sessions.")) {
            try {
                await api.post('/users/logout-all');
                localStorage.removeItem('token');
                alert("Successfully logged out from all devices.");
                navigate('/login');
                window.location.reload();
            } catch (err) {
                alert("Failed to logout from all devices.");
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-white mt-10">
            <h2 className="text-3xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                Session Management
            </h2>
            <div className="space-y-6">
                <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                    <h3 className="text-xl font-semibold mb-2">Global Logout</h3>
                    <p className="text-indigo-200 mb-4">
                        If you've lost a device or suspect unauthorized access, you can terminate all active sessions across all browsers and devices.
                    </p>
                    <button
                        onClick={handleLogoutAll}
                        className="px-6 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/50 rounded-lg font-semibold transition-all"
                    >
                        Logout from all devices
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Session;
