import React from 'react';
import { User } from 'firebase/auth';
import { X, LayoutDashboard, MessageCircle } from 'lucide-react';

interface DashboardHeaderProps {
    user: User;
    activeTab: 'dashboard' | 'communication';
    setActiveTab: (tab: 'dashboard' | 'communication') => void;
    onClose: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
    user,
    activeTab,
    setActiveTab,
    onClose
}) => {
    return (
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 shadow-sm z-10 flex items-center justify-between">
            {/* User Info */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px]">
                    <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        {user.photoURL ? (
                            <img src={user.photoURL} alt={user.displayName || "User"} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-indigo-500">
                                {user.displayName?.charAt(0).toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>
                <div>
                    <h2 className="text-lg font-bold leading-tight">{user.displayName}</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Bénévole SCBA</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-xl">
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'dashboard'
                        ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="hidden sm:inline">Tableau de bord</span>
                </button>
                <button
                    onClick={() => setActiveTab('communication')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'communication'
                        ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                >
                    <MessageCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Communication</span>
                </button>
            </div>

            {/* Close Button */}
            <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
            >
                <X className="w-6 h-6" />
            </button>
        </div>
    );
};
