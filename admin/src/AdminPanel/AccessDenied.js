import React from 'react';
import { ShieldAlert, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AccessDenied = ({ requiredPermission }) => {
    const navigate = useNavigate();

    return (
        <div className="h-[calc(100vh-80px)] w-full flex items-center justify-center p-8">
            <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
                {/* Visual Icon */}
                <div className="relative mx-auto w-32 h-32">
                    <div className="absolute inset-0 bg-red-100 rounded-[40px] rotate-6 animate-pulse" />
                    <div className="absolute inset-0 bg-white rounded-[40px] shadow-2xl border border-red-50 flex items-center justify-center -rotate-6 transition-transform hover:rotate-0 duration-500">
                        <ShieldAlert size={64} className="text-red-500" />
                    </div>
                </div>

                {/* Text Content */}
                <div className="space-y-4">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Access Restricted</h1>
                    <p className="text-gray-400 font-bold leading-relaxed">
                        You don't have the <span className="text-red-500 uppercase tracking-widest text-xs px-2 py-1 bg-red-50 rounded-lg">{requiredPermission}</span> permission required to access this control node.
                    </p>
                </div>

                {/* Actions */}
                <div className="pt-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="group flex items-center gap-2 mx-auto px-8 py-4 bg-gray-900 text-white rounded-[24px] font-black uppercase tracking-widest text-xs hover:bg-gray-800 transition-all hover:scale-105 shadow-xl shadow-gray-900/20"
                    >
                        <ChevronLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                        Go Back
                    </button>
                    <p className="mt-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Contact Super Admin for higher clearance
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AccessDenied;
