import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    MessageSquare,
    Library,
    AlertTriangle,
    LogOut,
    ExternalLink,
    Settings as SettingsIcon,
    History,
    Eye,
    UserPlus,
    Activity,
    Shield
} from 'lucide-react';
import AdminProfileModal from './AdminProfileModal';
import GlobalSearch from '../Search/GlobalSearch';

const AdminLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [adminUser, setAdminUser] = React.useState(JSON.parse(localStorage.getItem('adminUser') || '{}'));
    const [isProfileModalOpen, setIsProfileModalOpen] = React.useState(false);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('adminUser');
        navigate('/login');
    };

    const handleProfileUpdate = (updatedUser) => {
        const newUser = { ...adminUser, ...updatedUser };
        setAdminUser(newUser);
        localStorage.setItem('adminUser', JSON.stringify(newUser));
        setIsProfileModalOpen(false);
    };

    const isActive = (path) => {
        return location.pathname === path;
    };

    const NavItem = ({ to, icon: Icon, label }) => {
        const active = isActive(to);
        return (
            <Link
                to={to}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group ${active
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                    }`}
            >
                <Icon size={20} className={active ? "text-white" : "group-hover:text-white"} />
                <span className="font-bold text-sm">{label}</span>
            </Link>
        );
    };

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    return (
        <div className="flex h-screen bg-[#f8f9fc] overflow-hidden">
            {/* Sidebar */}
            <div className="w-72 bg-gray-900 text-white flex flex-col p-6 shadow-2xl shrink-0">
                <div className="mb-6 px-4">
                    <h1 className="text-2xl font-black italic tracking-tighter text-indigo-500">
                        BRO<span className="text-white">TALK</span>
                        <span className="text-[10px] ml-1 bg-indigo-600 text-white px-1.5 py-0.5 rounded-md not-italic tracking-normal align-top">ADMIN</span>
                    </h1>
                </div>

                {/* Admin Profile - Premium & Integrated */}
                <div
                    onClick={() => setIsProfileModalOpen(true)}
                    className="mb-6 p-4 bg-white/5 rounded-[32px] border border-white/5 flex items-center gap-4 hover:bg-white/10 transition-all cursor-pointer group active:scale-[0.98]"
                >
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-600/20 overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                        {adminUser.profilePicture ? (
                            <img
                                src={adminUser.profilePicture.startsWith('http') ? adminUser.profilePicture : `${API_BASE_URL}${adminUser.profilePicture}`}
                                alt="Admin"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            (adminUser.name || 'A').charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-black text-gray-100 leading-none truncate mb-1">{adminUser.name || 'Admin User'}</p>
                        <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest opacity-80">
                            {adminUser.role === 'superadmin' ? 'Super Admin' : (adminUser.adminTitle || 'Admin')}
                        </p>
                    </div>
                </div>

                <nav className="flex-1 space-y-2 overflow-y-auto custom-scrollbar-hide pr-1">
                    {(adminUser.role === 'superadmin' || adminUser.permissions?.includes('all') || adminUser.permissions?.includes('dashboard')) && (
                        <NavItem to="/admin" icon={LayoutDashboard} label="Dashboard" />
                    )}
                    {(adminUser.role === 'superadmin' || adminUser.permissions?.includes('all') || adminUser.permissions?.includes('users')) && (
                        <NavItem to="/admin/users" icon={Users} label="User Management" />
                    )}
                    {adminUser.role === 'superadmin' && (
                        <NavItem to="/admin/admins" icon={Shield} label="Admin Management" />
                    )}
                    {(adminUser.role === 'superadmin' || adminUser.permissions?.includes('all') || adminUser.permissions?.includes('topics')) && (
                        <NavItem to="/admin/topics" icon={Library} label="Topics" />
                    )}
                    {(adminUser.role === 'superadmin' || adminUser.permissions?.includes('all') || adminUser.permissions?.includes('reports')) && (
                        <NavItem to="/admin/reports" icon={AlertTriangle} label="Reports" />
                    )}
                    {(adminUser.role === 'superadmin' || adminUser.permissions?.includes('all') || adminUser.permissions?.includes('audits')) && (
                        <NavItem to="/admin/audit-logs" icon={History} label="Audit Logs" />
                    )}
                    {(adminUser.role === 'superadmin' || adminUser.permissions?.includes('all') || adminUser.permissions?.includes('settings')) && (
                        <NavItem to="/admin/settings" icon={SettingsIcon} label="System Settings" />
                    )}
                </nav>

                <div className="pt-4 mt-4 border-t border-gray-800 space-y-1">
                    <Link to="/" className="flex items-center gap-3 px-4 py-3 rounded-2xl text-gray-400 hover:bg-gray-800 hover:text-white transition-all group font-bold text-sm">
                        <ExternalLink size={20} />
                        Main Site
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-red-400 hover:bg-red-500/10 transition-all font-bold text-sm"
                    >
                        <LogOut size={20} />
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-20 bg-white border-b border-gray-100 px-8 flex items-center shrink-0">
                    <div className="flex-1 flex items-center">
                        <div>
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">
                                {location.pathname === '/admin' ? 'Dashboard Overview' :
                                    location.pathname.split('/').pop().charAt(0).toUpperCase() + location.pathname.split('/').pop().slice(1)}
                            </h2>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-0.5">Control Center</p>
                        </div>
                    </div>

                    <div className="flex-1 flex justify-center">
                        {location.pathname !== '/admin' && <GlobalSearch />}
                    </div>

                    <div className="flex-1 flex justify-end items-center gap-6">
                        {/* Relocated System Pulse & Status */}
                        <div className="flex items-center gap-4 border-r border-gray-100 pr-6">
                            <div className="text-right hidden md:block">
                                <p className="text-[10px] font-black text-gray-900 leading-none uppercase tracking-tighter">System Pulse</p>
                                <p className="text-[8px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-0.5">Live Monitor</p>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full border border-green-100 text-[10px] font-black uppercase tracking-widest shadow-sm">
                                <Activity size={12} className="animate-pulse" />
                                Stable
                            </div>
                        </div>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-6 bg-[#fdfdff] custom-scrollbar" style={{ scrollbarGutter: 'stable' }}>
                    <Outlet />
                </main>
            </div>

            <AdminProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                userProfile={adminUser}
                onUpdate={handleProfileUpdate}
            />
        </div>
    );
};

export default AdminLayout;
